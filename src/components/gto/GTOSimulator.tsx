import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Stars, ContactShadows, Environment, PivotControls } from '@react-three/drei';
import { GTOStage, GTOElement, ColorCode } from './types';
import { Box as BoxIcon, Trophy, ArrowRight, RotateCcw, Lightbulb, Plus } from 'lucide-react';

const STAGE_1: GTOStage = {
  id: 1,
  name: "PGT Stage 1",
  description: "Simple crossing with two white poles and one central block.",
  elements: [
    { id: 'start-pole-1', type: 'pole', position: [-4, 1.5, -5], color: 'white', snapPoints: [[-4, 3, -5], [-4, 2, -5]] },
    { id: 'start-pole-2', type: 'pole', position: [4, 1.5, -5], color: 'white', snapPoints: [[4, 3, -5], [4, 2, -5]] },
    { id: 'center-block', type: 'block', position: [0, 0.5, 0], color: 'yellow', scale: [1, 1, 3], snapPoints: [[0, 1, 0]] },
    { id: 'finish-pole-1', type: 'pole', position: [-2, 1.5, 5], color: 'white', snapPoints: [[-2, 3, 5]] },
  ],
  helpingMaterials: { planks: 1, ballis: 1, ropes: 2 },
  hinglishHint: "Pehla structure white hai, toh aap uspe phatta rakh sakte hain. Balli ko block ke peeche support ke liye use kijiye."
};

const STAGE_2: GTOStage = {
  id: 2,
  name: "PGT Stage 2",
  description: "Increased distance! Use the central bridge and side supports.",
  elements: [
    { id: 'start-block', type: 'block', position: [0, 0.5, -8], color: 'white' },
    { id: 'mid-bridge', type: 'block', position: [0, 1.2, 0], color: 'yellow', scale: [4, 0.2, 2] },
    { id: 'mid-pole-1', type: 'pole', position: [-2, 1.5, 0], color: 'white' },
    { id: 'mid-pole-2', type: 'pole', position: [2, 1.5, 0], color: 'white' },
    { id: 'finish-block', type: 'block', position: [0, 0.5, 8], color: 'white' },
  ],
  helpingMaterials: { planks: 2, ballis: 1, ropes: 2 },
  hinglishHint: "Yahan distance zyada hai. Pehle phatte ko side pole aur center bridge ke beech balance karein. Rassi ka use knot tie karne ke liye karein."
};

const STAGES = [STAGE_1, STAGE_2];

interface PlacedMaterial {
  id: string;
  type: 'plank' | 'balli';
  position: [number, number, number];
  rotation: [number, number, number];
}

const Plank = ({ material, onUpdate }: { material: PlacedMaterial, onUpdate: (id: string, pos: any, rot: any) => void }) => {
  return (
    <PivotControls
      anchor={[0, 0, 0]}
      depthTest={false}
      lineWidth={2}
      fixed={true}
      scale={1}
      onDrag={(l) => {
        // Position & Rotation from matrix l
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.05, 4]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} />
      </mesh>
    </PivotControls>
  );
};

const GTOObject = ({ element }: { element: GTOElement }) => {
  const { type, position, color, scale = [1, 1, 1] } = element;
  
  const getMaterialColor = (c: string) => {
    switch (c) {
      case 'white': return '#ffffff';
      case 'yellow': return '#facc15';
      case 'red': return '#ef4444';
      default: return '#cccccc';
    }
  };

  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      {type === 'pole' ? (
        <>
          <cylinderGeometry args={[0.1, 0.1, 3, 32]} />
          <meshStandardMaterial color={getMaterialColor(color)} metalness={0.6} roughness={0.2} />
        </>
      ) : (
        <>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={getMaterialColor(color)} roughness={0.8} />
        </>
      )}
    </mesh>
  );
};

export const GTOSimulator = () => {
  const [activeStage, setActiveStage] = useState<GTOStage>(STAGE_1);
  const [placedMaterials, setPlacedMaterials] = useState<PlacedMaterial[]>([]);
  const [showHint, setShowHint] = useState(false);

  const addPlank = () => {
    if (placedMaterials.filter(m => m.type === 'plank').length >= activeStage.helpingMaterials.planks) {
      toast.error("All planks used!");
      return;
    }
    const newPlank: PlacedMaterial = {
      id: `plank-${Date.now()}`,
      type: 'plank',
      position: [0, 2, -7],
      rotation: [0, 0, 0]
    };
    setPlacedMaterials([...placedMaterials, newPlank]);
  };

  const addBalli = () => {
    if (placedMaterials.filter(m => m.type === 'balli').length >= activeStage.helpingMaterials.ballis) {
      toast.error("All ballis used!");
      return;
    }
    const newBalli: PlacedMaterial = {
      id: `balli-${Date.now()}`,
      type: 'balli',
      position: [-2, 2, -7],
      rotation: [0, 0, 0]
    };
    setPlacedMaterials([...placedMaterials, newBalli]);
  };

  const nextStage = () => {
    const nextId = activeStage.id % STAGES.length;
    setActiveStage(STAGES[nextId]);
    setPlacedMaterials([]);
    toast.success(`Welcome to ${STAGES[nextId].name}`);
  };

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl">
      {/* 3D Scene */}
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
          
          <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Environment preset="park" />
          
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#14532d" />
          </mesh>
          <gridHelper args={[100, 50, '#ffffff08', '#ffffff08']} rotation={[0, 0, 0]} />

          {/* Start & Finish Lines */}
          <mesh position={[0, 0.01, -10]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 0.2]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <mesh position={[0, 0.01, 10]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 0.2]} />
            <meshBasicMaterial color="white" />
          </mesh>

          {/* Obstacle Elements */}
          {activeStage.elements.map(el => (
            <GTOObject key={el.id} element={el} />
          ))}

          {/* Placed Materials */}
          {placedMaterials.map(mat => (
            <group key={mat.id} position={mat.position} rotation={mat.rotation}>
              {mat.type === 'plank' ? (
                <PivotControls depthTest={false} scale={1} lineWidth={1}>
                  <mesh castShadow>
                    <boxGeometry args={[4, 0.1, 0.3]} />
                    <meshStandardMaterial color="#8b4513" />
                  </mesh>
                </PivotControls>
              ) : (
                <PivotControls depthTest={false} scale={1} lineWidth={1}>
                  <mesh castShadow>
                    <cylinderGeometry args={[0.08, 0.08, 3, 16]} rotation={[0, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#5d4037" />
                  </mesh>
                </PivotControls>
              )}
            </group>
          ))}

          <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.35} far={10} color="#000000" />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/20 p-4 rounded-xl pointer-events-auto">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BoxIcon className="w-5 h-5 text-blue-400" />
            {activeStage.name}
          </h3>
          <p className="text-slate-300 text-sm mt-1 max-w-[250px]">
            {activeStage.description}
          </p>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => setPlacedMaterials([])}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-white transition-all"
            title="Reset Stage"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowHint(!showHint)}
            className={`p-3 backdrop-blur-md border rounded-lg transition-all ${showHint ? 'bg-amber-500/30 border-amber-500 text-amber-400' : 'bg-white/10 border-white/20 text-white'}`}
            title="Get Hint"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showHint && (
        <div className="absolute top-6 right-6 max-w-[300px] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 p-4 rounded-xl shadow-2xl">
            <h4 className="text-amber-400 font-bold mb-1 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              GTO Advice (Hinglish)
            </h4>
            <p className="text-slate-200 text-sm italic">
              "{activeStage.hinglishHint}"
            </p>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-lg border border-white/10 p-2 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-1 px-4 border-r border-white/10 mr-2">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Materials</span>
        </div>
        
        <button 
          onClick={addPlank}
          className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-semibold transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Plank ({activeStage.helpingMaterials.planks - placedMaterials.filter(m => m.type === 'plank').length})
        </button>
        <button 
          onClick={addBalli}
          className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-semibold transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Balli ({activeStage.helpingMaterials.ballis - placedMaterials.filter(m => m.type === 'balli').length})
        </button>
        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-semibold transition-all">
          Add Rope ({activeStage.helpingMaterials.ropes})
        </button>

        <div className="w-px h-8 bg-white/10 mx-2" />
        
        <button 
          onClick={nextStage}
          className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
        >
          Next Stage
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-6 right-6">
        <div className="bg-blue-600/20 backdrop-blur-md border border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">3D Real-time Solution</span>
        </div>
      </div>
    </div>
  );
};
