
import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { Group, Circle, Ellipse, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { useGameStore } from '../store.ts';
import { hexToPixel } from '../services/hexUtils.ts';
import { EntityType } from '../types.ts';
import { GAME_CONFIG } from '../rules/config.ts';

interface UnitProps {
  q: number;
  r: number;
  type: EntityType;
  color?: string; 
  rotation: number;
  hexLevel: number;
  totalCoinsEarned: number;
  upgradePointCount: number; // New Prop for Cycle Points
  onMoveComplete?: (x: number, y: number, color: string) => void;
}

// --- TRAIL (GHOST) COMPONENT ---
const TrailShadow: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => {
    const ref = useRef<Konva.Group>(null);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;

        const tween = new Konva.Tween({
            node: node,
            opacity: 0,
            scaleX: 0.8, 
            scaleY: 0.8,
            duration: GAME_CONFIG.MOVEMENT_ANIMATION_DURATION,
            easing: Konva.Easings.EaseOut
        });
        tween.play();

        return () => tween.destroy();
    }, []);

    return (
        <Group ref={ref} x={x} y={y} opacity={0.4} listening={false}>
             <Rect
                x={-6} y={-10} 
                width={12} height={20}
                fill={color}
                cornerRadius={4}
                offsetY={8} 
            />
        </Group>
    );
};

const CoinPopup: React.FC<{ amount: number; y: number }> = ({ amount, y }) => {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;

    // Reset initial state
    node.opacity(0);
    node.scale({ x: 0.5, y: 0.5 });
    node.y(y);
    node.x(0); // Ensure centered

    // Animate Upwards
    const tween = new Konva.Tween({
      node: node,
      y: y - 50, // Rise upwards
      opacity: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1.2,
      easing: Konva.Easings.EaseOut,
    });

    // Initial Pop
    node.to({ opacity: 1, scaleX: 1, scaleY: 1, duration: 0.2 });
    tween.play();

    return () => tween.destroy();
  }, [y]);

  return (
    <Group ref={groupRef} listening={false}>
      {/* Outer Coin (Centered visually roughly at x=0 with text) */}
      <Circle x={-10} radius={9} fill="#fbbf24" stroke="#b45309" strokeWidth={1.5} shadowColor="black" shadowBlur={2} shadowOpacity={0.3} />
      {/* Inner Rim */}
      <Circle x={-10} radius={6} stroke="#fcd34d" strokeWidth={1} /> 
      {/* Symbol */}
      <Text text="$" fontSize={10} fontStyle="bold" fill="#78350f" x={-13.5} y={-5} />
      
      {/* Amount Label */}
      <Text
        text={`+${amount}`}
        x={2} y={-6}
        fontSize={14} fontFamily="monospace" fontStyle="bold" fill="#fbbf24"
        shadowColor="black" shadowBlur={2} shadowOpacity={0.8} shadowOffset={{x: 1, y: 1}}
      />
    </Group>
  );
};

const PointPopup: React.FC<{ y: number }> = ({ y }) => {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;

    node.opacity(0);
    node.scale({ x: 0.5, y: 0.5 });
    node.y(y);
    node.x(0); // Ensure centered relative to unit

    const tween = new Konva.Tween({
      node: node,
      y: y - 50, // Rise upwards
      opacity: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1.2,
      easing: Konva.Easings.EaseOut,
    });

    node.to({ opacity: 1, scaleX: 1, scaleY: 1, duration: 0.2 });
    tween.play();

    return () => tween.destroy();
  }, [y]);

  return (
    <Group ref={groupRef} listening={false}>
      {/* Straight Green Square with Rounded Corners */}
      <Rect
        x={-18} y={-8}
        width={16} height={16}
        fill="#4ade80" // emerald-400
        stroke="#15803d" // emerald-700
        strokeWidth={1.5}
        cornerRadius={4} // Rounded corners
        shadowColor="black"
        shadowBlur={2}
        shadowOpacity={0.3}
      />
      
      {/* Label */}
      <Text
        text="+1"
        x={2} y={-6}
        fontSize={14} fontFamily="monospace" fontStyle="bold" fill="#4ade80"
        shadowColor="black" shadowBlur={2} shadowOpacity={0.8} shadowOffset={{x: 1, y: 1}}
      />
    </Group>
  );
};

const Unit: React.FC<UnitProps> = React.memo(({ q, r, type, color, rotation, hexLevel, totalCoinsEarned, upgradePointCount, onMoveComplete }) => {
  const groupRef = useRef<Konva.Group>(null);
  const elevationGroupRef = useRef<Konva.Group>(null);
  const bodyRef = useRef<Konva.Group>(null);
  const isInitialized = useRef(false);
  const isAnimating = useRef(false); // Track if a movement tween is active

  const user = useGameStore(state => state.user);
  
  // Visual State
  const [coinPopups, setCoinPopups] = useState<{ id: number; amount: number }[]>([]);
  const [pointPopups, setPointPopups] = useState<{ id: number }[]>([]);
  const [trails, setTrails] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const prevCoinsRef = useRef(totalCoinsEarned);
  const prevPointsRef = useRef(upgradePointCount);

  // Target Calc
  const { x, y } = hexToPixel(q, r, rotation);
  const hexHeight = 10 + (hexLevel * 6);
  const zOffset = -hexHeight;

  // Logic Tracking
  const prevLogic = useRef({ q, r });
  
  const isPlayer = type === EntityType.PLAYER;
  const finalColor = color || (isPlayer ? (user?.avatarColor || '#3b82f6') : '#ef4444');

  // Coins Logic
  useEffect(() => {
    const diff = totalCoinsEarned - prevCoinsRef.current;
    if (diff > 0) {
      const id = Date.now() + Math.random();
      setCoinPopups(prev => [...prev, { id, amount: diff }]);
      setTimeout(() => setCoinPopups(prev => prev.filter(p => p.id !== id)), 1200);
    }
    prevCoinsRef.current = totalCoinsEarned;
  }, [totalCoinsEarned]);

  // Upgrade Points Logic
  useEffect(() => {
    if (upgradePointCount > prevPointsRef.current) {
        const id = Date.now() + Math.random();
        setPointPopups(prev => [...prev, { id }]);
        setTimeout(() => setPointPopups(prev => prev.filter(p => p.id !== id)), 1200);
    }
    prevPointsRef.current = upgradePointCount;
  }, [upgradePointCount]);

  // IDLE ANIMATION
  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;

    const anim = new Konva.Animation((frame) => {
        if (!frame) return;
        const scale = 1 + Math.sin(frame.time / 400) * 0.04;
        node.scale({ x: scale, y: scale });
    }, node.getLayer());

    anim.start();
    return () => anim.stop();
  }, []);

  // MOVEMENT LOGIC
  useLayoutEffect(() => {
    const node = groupRef.current;
    const elevationNode = elevationGroupRef.current;
    if (!node || !elevationNode) return;

    // Initialization check
    if (!isInitialized.current) {
        node.position({ x, y });
        elevationNode.y(zOffset);
        isInitialized.current = true;
        isAnimating.current = false;
        prevLogic.current = { q, r };
        return;
    }

    const isMove = prevLogic.current.q !== q || prevLogic.current.r !== r;

    if (isMove) {
        // Start movement animation
        isAnimating.current = true;
        const startX = node.x();
        const startY = node.y();
        const startZ = elevationNode.y();
        
        // Spawn Trail
        const tId = Date.now() + Math.random();
        setTrails(prev => [...prev, { id: tId, x: startX, y: startY + startZ }]);
        
        setTimeout(() => {
            setTrails(prev => prev.filter(t => t.id !== tId));
        }, GAME_CONFIG.MOVEMENT_ANIMATION_DURATION * 1000 + 100);

        // Tween to new position
        node.to({
            x, y,
            duration: GAME_CONFIG.MOVEMENT_ANIMATION_DURATION, 
            easing: Konva.Easings.EaseInOut, 
            onFinish: () => {
                isAnimating.current = false;
                if (onMoveComplete) onMoveComplete(x, y + zOffset, finalColor);
            }
        });

        // Animate Elevation (Jump/Climb)
        elevationNode.to({
            y: zOffset,
            duration: GAME_CONFIG.MOVEMENT_ANIMATION_DURATION,
            easing: Konva.Easings.EaseInOut
        });

    } else {
        // IDLE STATE or RE-RENDER (e.g. Coins update)
        
        // CRITICAL FIX: Only snap position if we are NOT currently animating a move.
        // This prevents re-renders (triggered by setTrails, setCoins, etc.) from
        // snapping the unit to the destination mid-tween, which causes "teleporting".
        if (!isAnimating.current) {
            node.position({ x, y });
            
            // Handle Elevation Growth (e.g. Hex grows under feet) smoothly
            if (Math.abs(elevationNode.y() - zOffset) > 0.5) {
                 elevationNode.to({
                    y: zOffset,
                    duration: 0.6,
                    easing: Konva.Easings.EaseInOut
                });
            } else {
                 elevationNode.y(zOffset);
            }
        }
    }

    prevLogic.current = { q, r };
  }, [x, y, q, r, zOffset, finalColor, onMoveComplete]);

  return (
    <Group>
      {trails.map(t => (
          <TrailShadow key={t.id} x={t.x} y={t.y} color={finalColor} />
      ))}

      <Group ref={groupRef} listening={false}>
        <Group ref={elevationGroupRef}>
            <Ellipse x={0} y={0} radiusX={10} radiusY={6} fill="rgba(0,0,0,0.4)" blurRadius={2} />

            <Group y={-8} ref={bodyRef}>
              <Rect x={-6} y={-10} width={12} height={20} fill={finalColor} cornerRadius={4} shadowColor="black" shadowBlur={5} shadowOpacity={0.3} />
              <Circle y={-14} radius={8} fill={finalColor} stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
              <Circle y={-14} x={-2} radius={2} fill="white" opacity={0.5} />
            </Group>

            {isPlayer && (
              <Ellipse y={0} radiusX={16} radiusY={10} stroke="white" strokeWidth={1} opacity={0.6} dash={[4, 4]} />
            )}
            
            {/* Popups Layer */}
            {/* Coins are always centered at -35 relative to head */}
            {coinPopups.map(p => (
              <CoinPopup key={p.id} amount={p.amount} y={-35} />
            ))}
            
            {/* Points are vertically stacked above coins if coins exist, otherwise centered at -35 */}
            {pointPopups.map(p => (
              <PointPopup key={p.id} y={coinPopups.length > 0 ? -65 : -35} />
            ))}
        </Group>
      </Group>
    </Group>
  );
});

export default Unit;
