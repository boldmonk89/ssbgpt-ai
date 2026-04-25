/**
 * Client-side gibberish/irrelevant input detection with sarcastic responses.
 * Catches obvious keyboard mashing before wasting an API call.
 */

const SARCASTIC_RESPONSES = [
  "🎹 Ah yes, the classic keyboard smash technique. Unfortunately, the SSB board can't decode 'fhsksbdjsis' into Officer Like Qualities. Try writing something that actual humans can read?",
  "💡 Fun fact: The SSB psychologist has seen 10,000+ responses, but yours would be a first — because it's not a real response. Please write something meaningful.",
  "🤔 I ran your input through 15 OLQ filters and the result was: 'This person might be testing if AI can read gibberish.' Spoiler: I can't. Try again with a real response.",
  "📋 If you submitted this at SSB, the psychologist would look at you, look at the paper, look at you again, and silently move on. Let's not do that here — write a proper response.",
  "⚠️ Your response has the same OLQ score as a blank page — zero. The only quality it shows is 'Speed of Typing Random Keys.' That's not one of the 15 OLQs. Try again.",
  "🎯 I was ready to analyze your response with military precision... but there's nothing to analyze. It's like showing up to SSB in pajamas. Please write something real.",
  "😐 Imagine you're at the SSB interview. The GTO asks you a question. You say 'fhsksbdjsis.' How do you think that goes? Exactly. Write a proper response.",
  "🪖 Even the most lenient SSB board would conference you out for this. Let's save your SSB career — type a real answer.",
];

const IRRELEVANT_RESPONSES = [
  "🤨 Interesting... but this has nothing to do with the test. If the SSB psychologist asked about a TAT story and you started talking about pizza recipes, that's a red flag. Stay on topic.",
  "📝 I appreciate the creative writing, but this isn't what the test asks for. The SSB board evaluates specific responses — not random paragraphs. Please write a relevant answer.",
  "🎯 This is like bringing a cricket bat to a football match — wrong equipment for the task. Please write a response that actually relates to the test.",
  "⚡ Your response is grammatically fine but contextually irrelevant. At SSB, staying on-topic shows Effective Intelligence — one of the 15 OLQs. Let's demonstrate that.",
];

function getRandomResponse(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Detects if text is gibberish (keyboard mashing, repeated chars, no real words).
 * Returns a sarcastic message if gibberish, null if input seems legitimate.
 */
export function detectGibberish(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3) return null; // Let normal validation handle empty

  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  
  // Check 1: Most words have no vowels (keyboard mashing)
  const noVowelWords = words.filter(w => {
    const clean = w.replace(/[^a-zA-Z]/g, '');
    return clean.length > 2 && !/[aeiouAEIOU]/.test(clean);
  });
  if (noVowelWords.length > words.length * 0.5 && words.length >= 2) {
    return getRandomResponse(SARCASTIC_RESPONSES);
  }

  // Check 2: Single long string of random chars
  if (words.length <= 2 && trimmed.replace(/\s/g, '').length > 10) {
    const alphaOnly = trimmed.replace(/[^a-zA-Z]/g, '');
    if (alphaOnly.length > 8 && !/[aeiouAEIOU]/.test(alphaOnly)) {
      return getRandomResponse(SARCASTIC_RESPONSES);
    }
    // Repeated character check (aaaaaaa, hhhhhh)
    const uniqueChars = new Set(alphaOnly.toLowerCase()).size;
    if (alphaOnly.length > 6 && uniqueChars <= 3) {
      return getRandomResponse(SARCASTIC_RESPONSES);
    }
  }

  // Check 3: Extremely repetitive (same word repeated 4+ times)
  if (words.length >= 4) {
    const wordCounts: Record<string, number> = {};
    words.forEach(w => { wordCounts[w.toLowerCase()] = (wordCounts[w.toLowerCase()] || 0) + 1; });
    const maxRepeat = Math.max(...Object.values(wordCounts));
    if (maxRepeat >= words.length * 0.6 && maxRepeat >= 4) {
      return getRandomResponse(SARCASTIC_RESPONSES);
    }
  }

  // Check 4: Short irrelevant sentences (e.g., "i am tejas", "hello there", "how are you")
  const commonShortPhrases = [
    "i am", "hello", "hi there", "how are you", "who are you", 
    "what is this", "test test", "testing", "nice", "good",
    "bad", "okay", "ok", "cool"
  ];
  if (words.length <= 4) {
    const lowerText = trimmed.toLowerCase();
    if (commonShortPhrases.some(phrase => lowerText.includes(phrase)) || /^[a-zA-Z\s]{1,10}$/.test(trimmed)) {
      return getRandomResponse(IRRELEVANT_RESPONSES);
    }
  }

  return null;
}

/**
 * The gibberish guard instruction to prepend to AI prompts.
 * This tells the AI to detect and sarcastically reject irrelevant/gibberish input.
 */
export const GIBBERISH_GUARD_INSTRUCTION = `
CRITICAL — GIBBERISH & IRRELEVANT INPUT DETECTION:
Before analyzing, check if the user's input is:
1. Random keyboard mashing (e.g., "fhsksbdjsis", "asdfghjkl", "qwertyuiop")
2. Completely irrelevant to the test (e.g., song lyrics, random jokes, copy-pasted Wikipedia articles unrelated to the test)
3. Single words repeated many times
4. Lorem ipsum or placeholder text
5. Abusive, offensive, or trolling content

If ANY of the above is detected, DO NOT perform the analysis. Instead, respond with a witty, sarcastic but constructive message in English that:
- Points out that the input is not a real response
- Uses humor/sarcasm to make the point memorable (e.g., "If you submitted this at SSB, the psychologist would silently put your file in the 'conference out' pile")
- References SSB context (what would happen if they did this at actual SSB)
- Ends with a clear instruction to write a proper, meaningful response
- Keep it to 3-4 lines max — punchy, not preachy

Only proceed with actual analysis if the input is a genuine, meaningful attempt at the test response.
`;
