import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { callGemini, callGeminiMultiPart, fileToBase64, getFileMimeType } from '@/lib/gemini';
import { Loader2, Upload, MessageSquare, Mic, Users, Sword, Clock, ChevronRight, Video, Square, FileText, Box, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};



import gtoTask1 from '@/assets/gto/gto-task-1.jpg';
import gtoTask2 from '@/assets/gto/gto-task-2.jpg';
import gtoTask3 from '@/assets/gto/gto-task-3.jpg';

const GTO_IMAGES = [gtoTask1, gtoTask2, gtoTask3];

const SYSTEM_PROMPT_GD = `You are an SSB GTO (Group Testing Officer) expert specializing in Group Discussion practice for Indian defence selection.

The user will give you a GD topic. You must provide CURRENT, UP-TO-DATE talking points that the candidate can use in the GD.

RULES:
1. Points must be CURRENT — use latest facts, data, events (2024-2026). No outdated 10-year-old data.
2. Provide 8-10 strong talking points covering BOTH sides (For & Against)
3. Each point should be 2-3 lines — crisp, factual, quotable
4. Include relevant statistics, recent events, government policies, or global context
5. Add 2-3 strong opening lines the candidate can use to start the GD
6. Add 2-3 closing/summary lines
7. Suggest which SIDE to take (and why) for an SSB candidate — officer-like thinking
8. Include 2-3 counter-argument strategies
9. Keep tone confident, balanced, and mature — not emotional or one-sided

OUTPUT FORMAT:
GD Points for: [TOPIC]

Opening Lines (pick one):
1. [opening line]
2. [opening line]
3. [opening line]

Points FOR:
1. [point with current facts]
2. [point]
3. [point]
4. [point]

Points AGAINST:
1. [point with current facts]
2. [point]
3. [point]
4. [point]

Recommended Stand: [which side + reasoning for SSB context]

Counter-Argument Strategies:
1. [strategy]
2. [strategy]

Closing Lines:
1. [closing]
2. [closing]

GD Tips for SSB:
- Enter discussion within first 2-3 speakers — don't wait too long
- Use "Building on what chest number X said..." to show cooperation
- Never interrupt — wait for a pause, then speak with authority
- Quality > Quantity — 3-4 strong entries are better than 10 weak ones
- Summarize at the end if possible — shows organizing ability`;

const SYSTEM_PROMPT_GPE = `You are a Senior SSB GTO Expert specializing in GPE (Group Planning Exercise) for the Indian Armed Forces. Your analysis must be clinical, logical, and demonstrate high Planning Ability and Practical Judgment.

PRIORITY & LOGIC HIERARCHY (COMPULSORY):
1. HUMAN LIFE (HIGHEST): Saving injured/bleeding casualties is the ABSOLUTE FIRST priority. Medical evacuation (CASEVAC) happens BEFORE stopping any attack.
2. MISSION/SECURITY (SECOND): Prevention of attacks, stopping terrorists, or securing property.
3. ROUTINE PROBLEMS (LOWEST): Search for lost cattle, minor repairs, or small personal issues.

TEAM ARCHITECTURE & SIMULTANEOUS WORK:
- DO NOT use "I" or individual actions. Everything must be TEAM-BASED.
- Use "Team A", "Team B", "Team C", etc.
- All actions must happen SIMULTANEOUSLY. While Team A is taking the casualty to the hospital, Team B is informing the police, and Team C is moving to the objective.

DISTANCE & TIME CALCULATION TABLE (STRICT ADHERENCE):
* Vehicle Speeds (Pakka Road | Kachha Road):
  - Car/Jeep/Bus: 1km / 1 min | 1km / 2 min
  - Bike: 1km / 1.5 min | 1km / 3 min
  - Cycle: 1km / 4 min | 1km / 5 min
  - Running: 1km / 5 min | 1km / 6 min
  - Walking: 1km / 10 min | 1km / 10 min
* Water Vehicles: 20km/hr (Normal) | 30km/hr (With Flow) | 10km/hr (Against Flow)
* Railway: 80km/hr (Super-fast) | 60km/hr (Express) | 40km/hr (Passenger)

STRATEGIC GUIDELINES:
- UTILIZE HIDDEN RESOURCES: If near a highway, assume passing vehicles can be used. If near a village, assume manpower/items are available.
- BE REALISTIC: You are a candidate, not a superhero. Alert the local Police/Authorities immediately.
- RESOURCE ALLOCATION: Mention specifically what resource is being used by which team (e.g., "Team A takes the village Jeep...").

OUTPUT STRUCTURE (STRICT FORMAT):
Heading: Objective
(One bold line stating the final goals)

Situation:
Key constraints, available resources, and time limit.

Concept of Plan:
One-line summary of the simultaneous multi-team approach.

Tasks:
1. [Name of Task] — Action details | Responsible Team | Time Required | Risk/Mitigation
2. [Next Task] — Action details | Responsible Team | Time Required | Risk/Mitigation
... (Continue for all problems)

Contingency:
"If [X] happens → We will switch to [Y] and [Team Z] will provide support."

Final Sentence:
"Mission accomplished: casualty evacuated by [Time], attack prevented by [Time], all groups rendezvoused at [Point] by [Total Time]."

If analyzing User's Solution:
- Evaluate their PRIORITY order (casually first?).
- Check if they worked in TEAMS or solo.
- Verify their time-distance math using the table.
- Score out of 10 and give practical improvements.`;

const SYSTEM_PROMPT_LECTURETTE = `You are an SSB GTO expert specializing in Lecturette practice for Indian defence selection.

A Lecturette is a 3-minute individual speech on a given topic. The candidate picks one topic from 4 options and speaks for exactly 3 minutes.

WHEN USER GIVES A TOPIC — GENERATE A MODEL LECTURETTE:

FORMAT TO FOLLOW:
1. Opening: "Jay Hind everyone. [Relevant quote about the topic]. With this, I will be starting my lecturette on [TOPIC]."
2. Structure declaration: "I have divided my lecturette into [N] parts: [Part 1], [Part 2], [Part 3], and most importantly, my personal opinion."
3. Body: Each part with CURRENT facts, statistics, recent events (2024-2026 data — NOT outdated)
4. Personal Opinion: "In my personal opinion..." — show mature, balanced, officer-like thinking
5. Closing: Strong concluding line + "Thank you. Jay Hind."

RULES:
1. EXACTLY 3 minutes when spoken — approximately 400-450 words
2. Use CURRENT data — recent policies, events, statistics. No 10-year-old facts.
3. Include at least 2-3 specific facts/numbers/dates
4. Structure must be clear — listener should follow easily
5. Language should be formal but natural — not robotic
6. Show awareness of Indian and global context
7. Personal opinion must be balanced and mature
8. Quote at the start must be RELEVANT to the topic

OUTPUT FORMAT:
Model Lecturette on: [TOPIC]
Duration: ~3 minutes | Word Count: ~400-450

---
[Full lecturette text]
---

Structure Breakdown:
- Opening quote + topic declaration
- Part 1: [name] (X words)
- Part 2: [name] (X words)
- Part 3: [name] (X words)
- Personal opinion
- Closing

Key Facts Used:
1. [fact/statistic]
2. [fact/statistic]
3. [fact/statistic]

Tips:
- Maintain eye contact with the audience
- Speak at moderate pace — not too fast
- Use hand gestures naturally
- If you forget a point, smoothly transition to the next part
- End exactly at 3 minutes — practice with a timer

If the user submits their OWN lecturette for review, analyze:
- Structure check (opening/body/closing)
- Current facts used?
- Word count (target 400-450)
- Flow and clarity
- Improvements needed
- Score out of 10`;

const SNAKE_RACE_TIPS = `## Snake Race / Group Obstacles — Key Tips

**What is Snake Race:**
The group (8-10 candidates) must cross a series of obstacles while carrying a heavy snake-like structure (wooden log/pole). Everyone must stay connected. It tests teamwork, stamina, and group coordination.

**Rules:**
- All group members must cross each obstacle
- The snake (log) must be carried throughout
- No one can touch the ground between obstacles (in some setups)
- Time limit applies — usually 15-20 minutes for all obstacles

**Tips for Scoring Well:**

**Physical Preparation:**
- Build upper body strength — pull-ups, push-ups, rope climbing
- Practice carrying heavy objects while running
- Improve grip strength — you'll be holding the log for 15+ minutes
- Stamina is key — practice running with weight

**During the Task:**
- Volunteer to carry the heavier end of the snake
- Always help the weakest member cross obstacles — GTO watches this closely
- Call out encouragement: "Come on team!", "We can do this!"
- If someone falls behind, slow down for them — NEVER leave anyone behind
- Suggest efficient crossing strategies at each obstacle
- Take front or back position — both are challenging and show initiative

**OLQs Tested:**
- Cooperation — helping others cross
- Stamina — physical endurance
- Initiative — volunteering for tough positions
- Determination — pushing through fatigue
- Ability to Influence Group — motivating others
- Courage — attempting difficult obstacles first

**Common Mistakes:**
- Focusing only on your own crossing — GTO watches group behaviour
- Getting frustrated with slow members — show patience
- Not communicating — always talk to your group
- Trying to rush — steady pace beats speed
- Giving up when tired — push through

**Practice Routine (2 weeks before SSB):**
- Daily: 50 push-ups, 20 pull-ups, 2km run with 5kg backpack
- Practice climbing walls, jumping over barriers
- Work on grip strength with dead hangs (3 sets of 30 seconds)
- Practice team coordination games`;

const HGT_THEORY = `## Half Group Task (HGT)

On completion of the GOR, 30 minute break is normally given for the candidates to relax and recover after the physical exertion. During this time the GTOs also have their breakfast. HGT is the first task in the confirmatory series and the purpose of the confirmatory series is to resolve all the queries that the GTO may have formed on each candidate. 

Thus, in this task the group is broken down into two smaller sub-groups and assigned one single obstacle similar to the one that was tackled in the PGT in such a way that while one sub-group is tackling the obstacle the other sub-group is not allowed to watch. 

**Rules & Guidelines:**
- Rules will be same as PGT except group rule, because there is only one obstacle to be tackled in this. 
- The sub-groups can be formed in any way depending upon the nature of query that the GTO may have in mind. 
- The GTO will ask one subgroup to stay back after the briefing and other sub-group to sit at a distance so that they cannot see. 
- The time normally allowed for this task is 20 minutes for each subgroup. 
- Since the group is small even the milder and weaker candidates will get adequate opportunity to take part in this task. 

The concept of cantilever will be used once again in this task. Hence, it is important for you to learn this concept well.

**What is Seen through this Activity?**
- Your ability to grasp the rules and conditions of tackling the obstacles.
- Are you logical in your approach?
- Do you have practical work sense?
- Are you able to use the resources appropriately?
- Are you able to contribute to the group functioning?
- Are you able to cooperate and work as a team member?
- Are you able to overcome the frustration and difficulties faced during the task?
- Power of expression and communication.
- Initiative and leadership.

**How to Approach HGT?**
- Be a constructive member of the group.
- Try and lead the group or support the leader proactively.
- Wait till all the members have crossed and be helpful wherever required.
- Do not give up easily. Keep striving and motivating your team members.
- Once a path has been chosen do not divert the group to another approach.
- Be helpful and do not criticize anyone.
`;

const FGT_THEORY = `## Final Group Task (FGT)

This is the only task of the final series. In this task the entire group is called back to perform one task similar to the progressive group task with similar rules. 

**Structure & Difficulty:**
- The difficulty level of this task will be somewhat like PGT 2. 
- This task offers the GTO a final look at the candidates and normally the candidates who have performed well in the entire GTO test will be in the forefront. 
- Participation will be very high. Hence make sure you do not lag behind and give out your ideas even if others do not implement it. 

**Key Strategy:**
- Do not wait for too long; this task moves very fast.
- Even though you may be exhausted, you must be active and participate with enthusiasm.

**Debriefing:**
At the end of all the tasks, the GTO conducts a debriefing session. In this he will counsel you about various aspects of selection and allow you to ask questions.
- Do not pose any silly questions.
- Restrict yourself to professional questions related to the service and the job.
- Be sensible and professional.
`;

const PGT_THEORY = `## Progressive Group Task (PGT)

PGT is the first task on the GTO ground. It consists of four obstacles of increasing difficulty. The group must cross these obstacles as a team using helping material like planks, ballis, and ropes.

**The Four Stages:**
1. **PGT 1**: Relatively easy, focuses on basic cantilever and simple bridging.
2. **PGT 2**: Slightly more complex, requires better coordination.
3. **PGT 3**: Challenging, often involves load management and complex levers.
4. **PGT 4**: High difficulty, tests your presence of mind and teamwork under pressure.

**Golden Rules of PGT:**
- **Group Rule**: The whole group must cross together with the load.
- **Color Rule**: 
  - **White**: In-bound for both candidates and helping material.
  - **Yellow/Black**: In-bound for candidates, but helping material cannot touch it.
  - **Red**: Out-of-bound for both.
- **Distance Rule**: Cannot jump a distance more than 4-5 feet.
- **Rule of Rigidity**: Helping materials (plank/balli) cannot be tied together to increase length.
`;

import { usePracticeStore } from '@/store/practiceStore';

export default function GTOPage() {
  const {
    gtoActiveTab: activeTab, setGtoActiveTab: setActiveTab,
    gdTopic, gdResult, setGdData,
    gpeScenario: gpeParagraph, gpeResult, gpeUserSolution, gpeUserAnalysis, gpePdfFile, gpePdfName, setGpeData,
    lecTopic, lecResult, lecUserText, lecUserAnalysis, setLecData
  } = usePracticeStore();

  const [currentImage, setCurrentImage] = useState(0);

  // Remaining states that don't need persistent sync (loading, files, etc. or handled differently)
  const [gdLoading, setGdLoading] = useState(false);
  const [gpeLoading, setGpeLoading] = useState(false);
  const [gpeUserLoading, setGpeUserLoading] = useState(false);
  const [lecLoading, setLecLoading] = useState(false);
  const [lecUserLoading, setLecUserLoading] = useState(false);
  
  // States that depend on local file objects or blobs
  const [gpeImage, setGpeImage] = useState<string | null>(null);
  const [gpeImageName, setGpeImageName] = useState('');
  const [lecUserAnalysis, setLecUserAnalysis] = useState('');
  const [lecUserLoading, setLecUserLoading] = useState(false);
  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoAnalyzing, setVideoAnalyzing] = useState(false);
  const [videoAnalysis, setVideoAnalysis] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const clearGd = () => setGdData({ result: '', topic: '' });
  const clearGpe = () => setGpeData({ result: '', userAnalysis: '', scenario: '', userSolution: '', pdfFile: null, pdfName: '' });
  const clearLec = () => setLecData({ result: '', userAnalysis: '', topic: '', userText: '' });

  // Image slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % GTO_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // GD handler
  const analyzeGd = async () => {
    const trimmed = gdTopic.trim();
    if (!trimmed) { toast.error('Please enter a GD topic'); return; }
    setGdLoading(true);
    setGdData({ result: '' });
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_GD + `\n\nThe GD topic is: "${trimmed}"\n\nGenerate current talking points as instructed.`
      );
      setGdData({ result: result });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate GD points');
    } finally {
      setGdLoading(false);
    }
  };

  // GPE handlers
  const handleGpeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    const base64 = await fileToBase64(file);
    setGpeImage(base64);
    setGpeImageName(file.name);
  };

  const analyzeGpe = async () => {
    if (!gpeImage) { toast.error('Please upload a GPE map image'); return; }
    if (!gpeParagraph.trim()) { toast.error('Please enter the problem paragraph'); return; }
    setGpeLoading(true);
    setGpeData({ result: '' });
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_GPE + `\n\nThe GPE problem paragraph is:\n"${gpeParagraph.trim()}"\n\nAnalyze the map image and provide a complete GPE solution.`,
        gpeImage
      );
      setGpeData({ result: result });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate GPE solution');
    } finally {
      setGpeLoading(false);
    }
  };

  // GPE PDF upload handler
  const handleGpePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      toast.error('Please upload a PDF or image file'); return;
    }
    if (file.size > 15 * 1024 * 1024) { toast.error('File must be under 15MB'); return; }
    const base64 = await fileToBase64(file);
    setGpeData({ pdfFile: base64, pdfName: file.name });
  };

  const analyzeGpePdf = async () => {
    if (!gpePdfFile) { toast.error('Please upload your GPE solution PDF'); return; }
    setGpeUserLoading(true);
    setGpeData({ userAnalysis: '' });
    try {
      const mimeType = gpePdfFile.startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg';
      const result = await callGeminiMultiPart(
        SYSTEM_PROMPT_GPE + `\n\nThe candidate has uploaded their GPE solution as a PDF/image. Analyze their solution:\n- What they did well\n- What they missed\n- Specific improvements with suggestions\n- Prioritization accuracy\n- Resource utilization\n- Time management\n- OLQs demonstrated\n- Score out of 10\n\n${gpeParagraph ? `The original GPE problem was: "${gpeParagraph.trim()}"` : ''}`,
        [{ base64: gpePdfFile, mimeType }]
      );
      setGpeData({ userAnalysis: result });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze your GPE solution');
    } finally {
      setGpeUserLoading(false);
    }
  };

  // Video recording functions
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setVideoBlob(null);
      setVideoUrl(null);
      setVideoAnalysis('');

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 179) { // 3 minutes = 180 seconds
            stopRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Microphone access denied. Please allow mic access.');
    }
  }, [stopRecording]);

  const analyzeRecordedLecturette = async () => {
    if (!videoBlob) { toast.error('No recording found'); return; }
    setVideoAnalyzing(true);
    setVideoAnalysis('');
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(videoBlob);
      });
      const base64 = await base64Promise;

      const result = await callGeminiMultiPart(
        SYSTEM_PROMPT_LECTURETTE + `\n\nThe candidate has recorded a ${Math.round(recordingTime / 60)}:${String(recordingTime % 60).padStart(2, '0')} minute audio lecturette on the topic: "${lecTopic.trim() || 'Unknown topic'}"\n\nTranscribe the audio and then analyze:\n- Structure (Opening quote + Jay Hind / Body parts / Personal opinion / Closing)\n- Time management (was it close to 3 minutes?)\n- Content quality and current facts used\n- Fluency, filler words, pauses\n- What to rephrase and what NOT to say\n- How to better structure the lecturette\n- Score out of 10\n- Provide specific improvements`,
        [{ base64, mimeType: 'audio/webm' }]
      );
      setVideoAnalysis(result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze your lecturette');
    } finally {
      setVideoAnalyzing(false);
    }
  };

  // Lecturette handlers
  const analyzeLec = async () => {
    const trimmed = lecTopic.trim();
    if (!trimmed) { toast.error('Please enter a lecturette topic'); return; }
    setLecLoading(true);
    setLecData({ result: '' });
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_LECTURETTE + `\n\nThe lecturette topic is: "${trimmed}"\n\nGenerate a complete 3-minute model lecturette as instructed.`
      );
      setLecData({ result: result });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate lecturette');
    } finally {
      setLecLoading(false);
    }
  };

  const analyzeLecUser = async () => {
    if (!lecUserText.trim()) { toast.error('Please enter your lecturette'); return; }
    setLecUserLoading(true);
    setLecData({ userAnalysis: '' });
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_LECTURETTE + `\n\nThe topic is: "${lecTopic.trim()}"\n\nThe candidate's own lecturette is:\n"${lecUserText.trim()}"\n\nAnalyze their lecturette — structure, current facts, word count, flow, clarity, improvements needed, and score out of 10.`
      );
      setLecData({ userAnalysis: result });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyze lecturette');
    } finally {
      setLecUserLoading(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 scroll-reveal"
    >
      {/* Header with GTO images */}
      <div className="glass-card glow-gold relative overflow-hidden">
        {/* Background slideshow */}
        {GTO_IMAGES.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[2s] ease-in-out"
            style={{
              opacity: currentImage === i ? 0.12 : 0,
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
            <span className="shimmer-text">GTO Tasks</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm max-w-2xl leading-relaxed">
            Practice Group Discussion, Group Planning Exercise, Lecturette, and more — with AI-powered feedback and current facts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-12 rounded-xl p-1" style={{
          background: 'linear-gradient(135deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.5))',
          backdropFilter: 'blur(16px)',
          border: '1px solid hsl(var(--border) / 0.3)',
        }}>
          <TabsTrigger value="gd" className="rounded-lg font-heading font-semibold text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <MessageSquare className="h-4 w-4 mr-1" /> GD
          </TabsTrigger>
          <TabsTrigger value="gpe" className="rounded-lg font-heading font-semibold text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <Users className="h-4 w-4 mr-1" /> GPE
          </TabsTrigger>
          <TabsTrigger value="lecturette" className="rounded-lg font-heading font-semibold text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <Mic className="h-4 w-4 mr-1" /> Lec
          </TabsTrigger>

          <TabsTrigger value="more" className="rounded-lg font-heading font-semibold text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <Sword className="h-4 w-4 mr-1" /> More
          </TabsTrigger>
        </TabsList>

        {/* GD Tab */}
        <TabsContent value="gd" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Enter GD Topic</h3>
            <div className="space-y-4">
              <Input
                placeholder="Enter a GD topic (e.g., Iran vs US, AI in Defence, One Nation One Election...)"
                value={gdTopic}
                onChange={(e) => setGdData({ topic: e.target.value })}
                className="h-12 text-base font-body bg-background/50 border-border/40 focus:border-gold/50"
                onKeyDown={(e) => e.key === 'Enter' && analyzeGd()}
              />
              {gdResult && !gdLoading ? (
                <div className="glass-card-subtle border-gold/20 text-center py-3">
                  <p className="font-heading text-xs text-gold">✓ Analysis Already Done</p>
                </div>
              ) : (
                <button
                  onClick={analyzeGd}
                  disabled={gdLoading || !gdTopic.trim()}
                  className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gdLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {gdLoading ? 'Generating Current Points...' : 'Generate GD Points'}
                </button>
              )}
            </div>
          </div>
          {gdResult && <AnalysisOutput content={gdResult} title="AI-Generated GD Points" />}
        </TabsContent>

        {/* GPE Tab */}
        <TabsContent value="gpe" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Upload GPE Map & Problem</h3>
            <div className="space-y-4">
              <label className="glass-card-subtle flex flex-col items-center justify-center py-6 cursor-pointer hover:border-gold/40 transition-colors border-2 border-dashed border-border/40 rounded-xl">
                <input type="file" accept="image/*" className="hidden" onChange={handleGpeImageUpload} />
                {gpeImage ? (
                  <div className="space-y-3 text-center">
                    <img src={gpeImage} alt="GPE Map" className="max-h-48 rounded-lg mx-auto shadow-lg" />
                    <p className="text-sm text-muted-foreground font-body">{gpeImageName}</p>
                    <p className="text-xs text-gold">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground font-body">Upload GPE map/picture</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG — max 10MB</p>
                  </>
                )}
              </label>

              <Textarea
                placeholder="Paste the GPE problem paragraph here (the scenario description with problems, resources, and time constraints)..."
                value={gpeParagraph}
                onChange={(e) => setGpeData({ scenario: e.target.value })}
                className="min-h-[100px] text-sm font-body bg-background/50 border-border/40 focus:border-gold/50"
              />

              {gpeResult && !gpeLoading ? (
                <div className="glass-card-subtle border-gold/20 text-center py-3">
                  <p className="font-heading text-xs text-gold">✓ Analysis Already Done</p>
                </div>
              ) : (
                <button
                  onClick={analyzeGpe}
                  disabled={gpeLoading || !gpeImage || !gpeParagraph.trim()}
                  className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gpeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {gpeLoading ? 'Generating GPE Solution...' : 'Get AI GPE Solution'}
                </button>
              )}
            </div>
          </div>

          {gpeResult && <AnalysisOutput content={gpeResult} title="AI-Generated GPE Solution" />}

          {/* User's own solution analysis */}
          {gpeResult && (
            <div className="glass-card">
              <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Submit Your Solution for Review</h3>
              <div className="space-y-4">
                {/* Option 1: Upload PDF */}
                <label className="glass-card-subtle flex flex-col items-center justify-center py-5 cursor-pointer hover:border-gold/40 transition-colors border-2 border-dashed border-border/40 rounded-xl">
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleGpePdfUpload} />
                  {gpePdfFile ? (
                    <div className="text-center space-y-1">
                      <FileText className="h-6 w-6 text-gold mx-auto" />
                      <p className="text-sm text-foreground font-body">{gpePdfName}</p>
                      <p className="text-xs text-gold">Click to change file</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground/40 mb-1" />
                      <p className="text-sm text-muted-foreground font-body">Upload your GPE solution (PDF or image)</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">AI will analyze and give suggestions</p>
                    </>
                  )}
                </label>

                {gpePdfFile && (
                  <button
                    onClick={analyzeGpePdf}
                    disabled={gpeUserLoading}
                    className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {gpeUserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                    {gpeUserLoading ? 'Analyzing Your Solution...' : 'Analyze Uploaded Solution'}
                  </button>
                )}

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border/30" />
                  <span className="text-xs text-muted-foreground font-body">OR type below</span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>

                <Textarea
                  placeholder="Paste your own GPE solution here..."
                  value={gpeUserSolution}
                  onChange={(e) => setGpeData({ userSolution: e.target.value })}
                  className="min-h-[100px] text-sm font-body bg-background/50 border-border/40 focus:border-gold/50"
                />
                {gpeUserSolution.trim() && (
                    <button
                      onClick={async () => {
                        if (!gpeUserSolution.trim()) return;
                        setGpeUserLoading(true);
                        setGpeUserAnalysis('');
                        try {
                          const result = await callGemini(
                            SYSTEM_PROMPT_GPE + `\n\nThe GPE problem paragraph is:\n"${gpeParagraph.trim()}"\n\nThe candidate's own solution is:\n"${gpeUserSolution.trim()}"\n\nAnalyze their solution — what they did well, what they missed, specific improvements, and score out of 10.`,
                            gpeImage || undefined
                          );
                          setGpeUserAnalysis(result);
                        } catch (err: unknown) {
                          toast.error(err instanceof Error ? err.message : 'Failed to analyze your solution');
                        } finally {
                          setGpeUserLoading(false);
                        }
                      }}
                      disabled={gpeUserLoading}
                      className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {gpeUserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {gpeUserLoading ? 'Analyzing Your Solution...' : 'Analyze My Solution'}
                    </button>
                )}
              </div>
            </div>
          )}

          {gpeUserAnalysis && <AnalysisOutput content={gpeUserAnalysis} title="Your GPE Solution — AI Review" />}
        </TabsContent>



        {/* Lecturette Tab */}
        <TabsContent value="lecturette" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Enter Lecturette Topic</h3>
            <div className="space-y-4">
              <Input
                placeholder="Enter a topic (e.g., Digital India, Climate Change, Women in Armed Forces...)"
                value={lecTopic}
                onChange={(e) => setLecData({ topic: e.target.value })}
                className="h-12 text-base font-body bg-background/50 border-border/40 focus:border-gold/50"
                onKeyDown={(e) => e.key === 'Enter' && analyzeLec()}
              />
              {lecResult && !lecLoading ? (
                <div className="glass-card-subtle border-gold/20 text-center py-3">
                  <p className="font-heading text-xs text-gold">✓ Analysis Already Done</p>
                </div>
              ) : (
                <button
                  onClick={analyzeLec}
                  disabled={lecLoading || !lecTopic.trim()}
                  className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lecLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {lecLoading ? 'Generating Lecturette...' : 'Generate Model Lecturette'}
                </button>
              )}
            </div>
          </div>

          {lecResult && <AnalysisOutput content={lecResult} title="AI-Generated Model Lecturette" />}

          {/* User lecturette analysis — text or audio */}
          {lecResult && (
            <div className="glass-card">
              <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Submit Your Lecturette for Review</h3>
              <div className="space-y-4">
                {/* Audio Recording */}
                <div className="glass-card-subtle p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4 text-gold" />
                    <span className="font-heading font-semibold text-sm text-foreground">Record Your Lecturette (3 min max)</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        disabled={videoAnalyzing}
                        className="glass-button-gold flex items-center gap-2 text-sm"
                      >
                        Start Recording
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-heading font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                      >
                        <Square className="h-3 w-3 fill-current" />
                        Stop Recording
                      </button>
                    )}

                    {(isRecording || recordingTime > 0) && (
                      <div className="flex items-center gap-2">
                        {isRecording && <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />}
                        <span className="font-mono text-sm text-foreground">
                          {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                        </span>
                        <span className="text-xs text-muted-foreground">/ 3:00</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {(isRecording || recordingTime > 0) && (
                    <div className="w-full h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min((recordingTime / 180) * 100, 100)}%`,
                          background: recordingTime > 160 ? 'hsl(0 70% 50%)' : 'hsl(var(--gold))',
                        }}
                      />
                    </div>
                  )}

                  {videoUrl && !isRecording && (
                    <div className="space-y-3">
                      <audio src={videoUrl} controls className="w-full h-10" />
                      <button
                        onClick={analyzeRecordedLecturette}
                        disabled={videoAnalyzing}
                        className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {videoAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {videoAnalyzing ? 'Analyzing Your Lecturette...' : 'Analyze My Recorded Lecturette'}
                      </button>
                    </div>
                  )}
                </div>

                {videoAnalysis && <AnalysisOutput content={videoAnalysis} title="Your Recorded Lecturette — AI Review" />}

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border/30" />
                  <span className="text-xs text-muted-foreground font-body">OR paste text</span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>

                <Textarea
                  placeholder="Paste your own lecturette text here — AI will analyze structure, facts, and flow..."
                  value={lecUserText}
                  onChange={(e) => setLecData({ userText: e.target.value })}
                  className="min-h-[120px] text-sm font-body bg-background/50 border-border/40 focus:border-gold/50"
                />
                <button
                  onClick={analyzeLecUser}
                  disabled={lecUserLoading || !lecUserText.trim()}
                  className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lecUserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {lecUserLoading ? 'Analyzing Your Lecturette...' : 'Analyze My Lecturette'}
                </button>
              </div>
            </div>
          )}

          {lecUserAnalysis && <AnalysisOutput content={lecUserAnalysis} title="Your Lecturette — AI Review" />}
        </TabsContent>

        {/* More Tab — PGT, HGT, FGT & Snake Race */}
        <TabsContent value="more" className="mt-6 space-y-6">
          {/* PGT Gallery Section */}
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">PGT Structures & Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {Array.from({ length: 18 }, (_, i) => (
                <div key={i} className="group relative aspect-video rounded-xl overflow-hidden border border-border/40 bg-black/40 hover:border-gold/50 transition-all cursor-pointer shadow-lg" 
                  onClick={() => window.open(`/images/gto/pgt/Screenshot 2026-04-14 ${[153426, 153432, 153435, 153442, 153446, 153451, 153457, 153501, 153506, 153509, 153514, 153518, 153524, 153527, 153531, 153536, 153540, 153544][i]}.png`, '_blank')}>
                  <img 
                    src={`/images/gto/pgt/Screenshot 2026-04-14 ${[153426, 153432, 153435, 153442, 153446, 153451, 153457, 153501, 153506, 153509, 153514, 153518, 153524, 153527, 153531, 153536, 153540, 153544][i]}.png`} 
                    alt={`PGT Structure ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 px-3">
                    <span className="text-[10px] font-heading font-black text-white/80 uppercase">Picture {i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
            <AnalysisOutput content={PGT_THEORY} title="Progressive Group Task Theory" />
          </div>

          {/* HGT Section */}
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Half Group Task</h3>
            <AnalysisOutput content={HGT_THEORY} title="HGT Theory & Psychology" />
          </div>

          {/* FGT Section */}
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Final Group Task</h3>
            <AnalysisOutput content={FGT_THEORY} title="FGT Final Looks" />
          </div>

          {/* Snake Race Tips */}
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Snake Race / Group Obstacles</h3>
            <AnalysisOutput content={SNAKE_RACE_TIPS} title="Snake Race Tips & Strategy" />
          </div>

          {/* Practice GTO Solution */}
          <div className="glass-card bg-gold/5 border-gold/20">
            <div className="flex items-center gap-3 mb-6">
              <Sword className="h-6 w-6 text-gold" />
              <h3 className="font-heading font-bold text-lg text-white">Practice PGT/HGT Solution</h3>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed mb-6">
              Upload a picture of any PGT/HGT structure or obstacle, and describe your solution (in English or Hinglish). AI will analyze your logic and provide a professional feedback in Hinglish if you prefer.
            </p>
            <div className="space-y-4">
               {/* Reusing GPE logic for custom PGT/HGT practice */}
               <label className="glass-card-subtle flex flex-col items-center justify-center py-6 cursor-pointer hover:border-gold/40 transition-colors border-2 border-dashed border-border/40 rounded-xl">
                <input type="file" accept="image/*" className="hidden" onChange={handleGpeImageUpload} />
                {gpeImage ? (
                  <div className="space-y-3 text-center">
                    <img src={gpeImage} alt="GTO Structure" className="max-h-48 rounded-lg mx-auto shadow-lg" />
                    <p className="text-xs text-gold">Click to change structure image</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground font-body">Upload Structure Picture</p>
                  </>
                )}
              </label>

              <Textarea
                placeholder="Type your solution logic here... (e.g., 'Maine balli ko support A pe phansaya aur plank ko support B pe cantilever banaya...')"
                value={gpeUserSolution}
                onChange={(e) => setGpeUserSolution(e.target.value)}
                className="min-h-[120px] text-sm font-body bg-background/50 border-border/40 focus:border-gold/50"
              />

              <button
                onClick={async () => {
                  if (!gpeImage) { toast.error('Please upload a structure image'); return; }
                  if (!gpeUserSolution.trim()) { toast.error('Please enter your solution'); return; }
                  setGpeUserLoading(true);
                  setGpeUserAnalysis('');
                  try {
                    const result = await callGemini(
                      `You are an SSB GTO expert. Analyze the candidate's solution for the PGT/HGT obstacle shown in the image.
                      
                      RULES:
                      1. Check for Color Rule, Distance Rule, and Cantilever logic.
                      2. If the user writes in Hinglish, respond in Hinglish with Roman script.
                      3. provide practical improvements.
                      4. Be professional but encouraging.
                      
                      The candidate's solution: "${gpeUserSolution.trim()}"`,
                      gpeImage
                    );
                    setGpeUserAnalysis(result);
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'Failed to analyze solution');
                  } finally {
                    setGpeUserLoading(false);
                  }
                }}
                disabled={gpeUserLoading || !gpeImage || !gpeUserSolution.trim()}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm"
              >
                {gpeUserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                {gpeUserLoading ? 'Analyzing Solution...' : 'Analyze My GTO Logic (Hinglish Supported)'}
              </button>
            </div>
          </div>
          {gpeUserAnalysis && <AnalysisOutput content={gpeUserAnalysis} title="GTO Logic Analysis" />}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
