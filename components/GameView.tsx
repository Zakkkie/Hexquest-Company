import React, { useEffect, useCallback, useState, useMemo, useRef, useLayoutEffect } from 'react';
import { Stage, Layer, Line, Group, Text, Circle } from 'react-konva';
import Konva from 'konva';
import { useGameStore } from '../store.ts';
import { getHexKey, getNeighbors, hexToPixel } from '../services/hexUtils.ts';
import Hexagon from './Hexagon.tsx'; 
import Unit from './Unit.tsx';
import Background from './Background.tsx';
import GameHUD from './GameHUD.tsx';
import { EXCHANGE_RATE_COINS_PER_MOVE, GAME_CONFIG } from '../rules/config.ts';
import { Hex, EntityType, EntityState, FloatingText } from '../types.ts';

const VIEWPORT_PADDING = 300; 

// Render Item Type for Z-Sorting
type RenderItem = 
  | { type: 'HEX'; id: string; depth: number; q: number; r: number }
  | { type: 'UNIT'; id: string; depth: number; q: number; r: number; isPlayer: boolean }
  | { type: 'CONN'; id: string; depth: number; points: number[]; color: string; dash: number[]; opacity: number };

// --- PARTICLES ---
interface VisualParticle {
    id: number;
    x: number;
    y: number;
    color: string;
}

const DustCloud: React.FC<VisualParticle & { onComplete: (id: number) => void }> = React.memo(({ id, x, y, color, onComplete }) => {
    const groupRef = useRef<Konva.Group>(null);

    useEffect(() => {
        const node = groupRef.current;
        if (!node) return;

        // Spawn 4 puffs
        const puffs = node.find('Circle');
        puffs.forEach((puff, i) => {
             // Random Scatter
             const angle = Math.random() * Math.PI * 2;
             const dist = 10 + Math.random() * 10;
             const tx = Math.cos(angle) * dist;
             const ty = Math.sin(angle) * dist * 0.6; // Squash Y for isometric look

             const tween = new Konva.Tween({
                 node: puff,
                 x: tx,
                 y: ty,
                 scaleX: 0,
                 scaleY: 0,
                 opacity: 0,
                 duration: 0.4 + Math.random() * 0.2,
                 easing: Konva.Easings.EaseOut,
             });
             tween.play();
        });

        // Cleanup timer
        const t = setTimeout(() => {
            onComplete(id);
        }, 600);

        return () => clearTimeout(t);
    }, [id, onComplete]);

    return (
        <Group ref={groupRef} x={x} y={y}>
            {[0, 1, 2, 3].map(i => (
                <Circle 
                    key={i}
                    x={0} y={0}
                    radius={3 + Math.random() * 3}
                    fill={color}
                    opacity={0.4}
                />
            ))}
        </Group>
    );
});

// --- FIREWORKS ---
const Firework: React.FC<VisualParticle & { onComplete: (id: number) => void }> = React.memo(({ id, x, y, color, onComplete }) => {
    const groupRef = useRef<Konva.Group>(null);

    useEffect(() => {
        const node = groupRef.current;
        if (!node) return;

        // Animate Up (Launch)
        const launchTween = new Konva.Tween({
            node: node,
            y: y - 150, // Fly up
            duration: 0.5,
            easing: Konva.Easings.EaseOut,
            onFinish: () => {
                // EXPLODE
                const parts = node.find('Circle');
                parts.forEach((p) => {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 30 + Math.random() * 30;
                    
                    new Konva.Tween({
                        node: p,
                        x: Math.cos(angle) * dist,
                        y: Math.sin(angle) * dist,
                        opacity: 0,
                        duration: 0.5,
                        easing: Konva.Easings.EaseOut
                    }).play();
                });
            }
        });
        launchTween.play();

        // Cleanup timer
        const t = setTimeout(() => {
            onComplete(id);
        }, 1200);

        return () => clearTimeout(t);
    }, [id, y, onComplete]);

    return (
        <Group ref={groupRef} x={x} y={y}>
            {/* Trail/Center */}
            <Circle radius={2} fill="white" />
            {/* Particles */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <Circle 
                    key={i}
                    x={0} y={0}
                    radius={3}
                    fill={color}
                />
            ))}
        </Group>
    );
});


const FloatingEffect: React.FC<{ effect: FloatingText; rotation: number }> = React.memo(({ effect, rotation }) => {
    const groupRef = useRef<Konva.Group>(null);
    const { x, y } = hexToPixel(effect.q, effect.r, rotation);
    
    useLayoutEffect(() => {
        const node = groupRef.current;
        if (!node) return;

        // Init
        node.position({ x, y: y - 40 }); // Start slightly above hex
        node.opacity(0);
        node.scale({ x: 0.5, y: 0.5 });

        // Animation
        const tween = new Konva.Tween({
            node: node,
            y: y - 100, // Float up
            opacity: 0,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: effect.lifetime / 1000,
            easing: Konva.Easings.EaseOut,
        });
        
        // Initial pop
        node.to({ opacity: 1, scaleX: 1, scaleY: 1, duration: 0.2 });

        tween.play();

        return () => tween.destroy();
    }, [effect, x, y]);

    return (
        <Group ref={groupRef} listening={false}>
            <Text
                text={effect.text}
                fontSize={16}
                fontFamily="monospace"
                fontStyle="bold"
                fill={effect.color}
                x={-50} 
                width={100}
                align="center"
                shadowColor={effect.color}
                shadowBlur={10}
                shadowOpacity={0.8}
                shadowOffset={{ x: 0, y: 0 }}
            />
        </Group>
    );
});

const GameView: React.FC = () => {
  // --- STATE SELECTION ---
  const grid = useGameStore(state => state.session?.grid);
  const player = useGameStore(state => state.session?.player);
  const bots = useGameStore(state => state.session?.bots);
  const effects = useGameStore(state => state.session?.effects); // Visual Effects
  const isPlayerGrowing = useGameStore(state => state.session?.isPlayerGrowing);
  const tutorialStep = useGameStore(state => state.session?.tutorialStep);
  const winCondition = useGameStore(state => state.session?.winCondition);
  const gameStatus = useGameStore(state => state.session?.gameStatus);
  
  // Pending Confirmation Logic
  const pendingConfirmation = useGameStore(state => state.pendingConfirmation);
  const cancelPendingAction = useGameStore(state => state.cancelPendingAction);

  const tick = useGameStore(state => state.tick);
  const movePlayer = useGameStore(state => state.movePlayer);
  const hideToast = useGameStore(state => state.hideToast);
  const checkTutorialCamera = useGameStore(state => state.checkTutorialCamera);
  const toast = useGameStore(state => state.toast);
  
  if (!grid || !player || !bots) return null;
  
  // Dimensions & Viewport
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [viewState, setViewState] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 });
  const [cameraRotation, setCameraRotation] = useState(0);
  const targetRotationRef = useRef(0); 
  const isRotating = useRef(false);
  const lastMouseX = useRef(0);
  const rotationAccumulator = useRef(0); // Track total rotation for tutorial
  const movementTracker = useRef<Record<string, { lastQ: number; lastR: number; fromQ: number; fromR: number; startTime: number }>>({});
  
  // Local Particle State (Ephemeral)
  const [particles, setParticles] = useState<VisualParticle[]>([]);
  const [fireworks, setFireworks] = useState<VisualParticle[]>([]);

  // Interaction State
  const [hoveredHexId, setHoveredHexId] = useState<string | null>(null);
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null);

  // Touch State for Gestures
  const lastTouchDist = useRef<number>(0);
  const lastTouchAngle = useRef<number>(0);

  // Game Loop
  useEffect(() => {
    const interval = setInterval(tick, 100); // 100ms tick for responsive updates
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(hideToast, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FIREWORKS LOOP ---
  useEffect(() => {
      let fwInterval: number | null = null;
      if (tutorialStep === 'VICTORY_ANIMATION' || gameStatus === 'VICTORY') {
          fwInterval = window.setInterval(() => {
              const id = Date.now() + Math.random();
              const colors = ['#ef4444', '#eab308', '#3b82f6', '#10b981', '#a855f7'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              // Random pos near player
              const pPos = hexToPixel(player.q, player.r, cameraRotation);
              const offsetX = (Math.random() - 0.5) * 400;
              const offsetY = (Math.random() - 0.5) * 300;

              setFireworks(prev => [...prev, { id, x: pPos.x + offsetX, y: pPos.y + offsetY, color }]);
          }, 300); // 3 per second roughly
      }
      return () => {
          if (fwInterval) clearInterval(fwInterval);
      };
  }, [tutorialStep, gameStatus, player.q, player.r, cameraRotation]);

  const spawnDust = useCallback((x: number, y: number, color: string) => {
      const id = Date.now() + Math.random();
      // Use a light grey/white for generic dust, or color tinted
      setParticles(prev => [...prev, { id, x, y, color: '#94a3b8' }]); 
  }, []);

  const removeParticle = useCallback((id: number) => {
      setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const removeFirework = useCallback((id: number) => {
      setFireworks(prev => prev.filter(p => p.id !== id));
  }, []);

  const rotateCamera = useCallback((direction: 'left' | 'right') => {
      const step = 60;
      const currentSnapped = Math.round(targetRotationRef.current / step) * step;
      const nextTarget = direction === 'left' ? currentSnapped - step : currentSnapped + step;
      targetRotationRef.current = nextTarget;
      
      const startTime = performance.now();
      const startRot = cameraRotation;
      const duration = 300;

      const animate = (time: number) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - (1 - progress) * (1 - progress);
          const newRot = startRot + (nextTarget - startRot) * ease;
          setCameraRotation(newRot);
          if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
  }, [cameraRotation]);

  const centerOnPlayer = useCallback(() => {
    const { x: px, y: py } = hexToPixel(player.q, player.r, cameraRotation);
    setViewState(prev => ({
      ...prev,
      x: (dimensions.width / 2) - (px * prev.scale),
      y: (dimensions.height / 2) - (py * prev.scale)
    }));
  }, [player.q, player.r, dimensions, cameraRotation]);

  const handleHexClick = useCallback((q: number, r: number) => {
      setSelectedHexId(getHexKey(q, r));
      movePlayer(q, r);
  }, [movePlayer]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = viewState.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - viewState.x) / oldScale,
      y: (pointer.y - viewState.y) / oldScale,
    };
    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.4, Math.min(newScale, 2.5));
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setViewState({ x: newPos.x, y: newPos.y, scale: newScale });
  }, [viewState]);

  // STAGE INTERACTIONS (BACKGROUND)
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
     // If clicking on background (not a shape/hex), cancel pending confirmation
     // But check if it was a multi-touch end event (which fires 'click' sometimes)
     if (e.evt.type === 'touchend') return;

     if (e.target === e.target.getStage()) {
         cancelPendingAction();
         setSelectedHexId(null);
     }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 2) { 
        isRotating.current = true;
        lastMouseX.current = e.evt.clientX;
        const stage = e.target.getStage();
        if (stage) stage.draggable(false);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isRotating.current) {
        const deltaX = e.evt.clientX - lastMouseX.current;
        lastMouseX.current = e.evt.clientX;
        const sensitivity = 0.5;
        
        // Track rotation for tutorial
        rotationAccumulator.current += Math.abs(deltaX);
        checkTutorialCamera(rotationAccumulator.current);

        setCameraRotation(prev => {
            const newRot = prev + deltaX * sensitivity;
            targetRotationRef.current = newRot; 
            return newRot;
        });
    }
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isRotating.current) {
        isRotating.current = false;
        const stage = e.target.getStage();
        if (stage) stage.draggable(true);
    }
  };

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isRotating.current) {
          isRotating.current = false;
          const stage = e.target.getStage();
          if (stage) stage.draggable(true);
      }
  };

  // --- TOUCH GESTURE HANDLING ---
  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
      const touches = e.evt.touches;
      if (touches.length === 2) {
          const stage = e.target.getStage();
          if (stage) stage.stopDrag();

          const p1 = { x: touches[0].clientX, y: touches[0].clientY };
          const p2 = { x: touches[1].clientX, y: touches[1].clientY };

          lastTouchDist.current = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
          lastTouchAngle.current = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
      const touches = e.evt.touches;
      if (touches.length === 2) {
          e.evt.preventDefault(); 
          const stage = e.target.getStage();
          if (!stage) return;
          stage.draggable(false);

          const p1 = { x: touches[0].clientX, y: touches[0].clientY };
          const p2 = { x: touches[1].clientX, y: touches[1].clientY };
          
          const newDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
          const newCenter = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          const newAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

          // ROTATION
          const deltaAngle = newAngle - lastTouchAngle.current;
          setCameraRotation(prev => {
              const nextRot = prev + deltaAngle;
              targetRotationRef.current = nextRot;
              return nextRot;
          });

          // ZOOM
          if (lastTouchDist.current > 0) {
              const scaleBy = newDist / lastTouchDist.current;
              const oldScale = viewState.scale;
              const newScale = Math.max(0.4, Math.min(oldScale * scaleBy, 2.5));

              const pointTo = {
                  x: (newCenter.x - viewState.x) / oldScale,
                  y: (newCenter.y - viewState.y) / oldScale,
              };

              const newPos = {
                  x: newCenter.x - pointTo.x * newScale,
                  y: newCenter.y - pointTo.y * newScale,
              };

              setViewState({ x: newPos.x, y: newPos.y, scale: newScale });
          }

          lastTouchDist.current = newDist;
          lastTouchAngle.current = newAngle;
      }
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length < 2) {
          lastTouchDist.current = 0;
          const stage = e.target.getStage();
          if (stage) stage.draggable(true);
      }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
     if (!isRotating.current && e.evt.touches?.length !== 2) {
        setViewState(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }));
     }
  };

  const neighbors = useMemo(() => getNeighbors(player.q, player.r), [player.q, player.r]);

  const safeBots = useMemo(() => (bots || []).filter(b => b && typeof b.q === 'number' && typeof b.r === 'number'), [bots]);
  const isMoving = player.state === EntityState.MOVING;
  
  // Pending Target for Highlight
  const pendingTargetKey = useMemo(() => {
      if (!pendingConfirmation) return null;
      const target = pendingConfirmation.data.path[pendingConfirmation.data.path.length - 1];
      return getHexKey(target.q, target.r);
  }, [pendingConfirmation]);

  // Highlight targets for tutorial
  const tutorialHighlights = useMemo(() => {
      const targets: Record<string, 'CYAN' | 'BLUE' | 'AMBER'> = {};
      
      if (tutorialStep === 'UPGRADE_CENTER_3') {
          const queueSize = winCondition?.queueSize || 1;
          const hasMomentum = player.recentUpgrades.length >= queueSize;
          
          if (hasMomentum) {
              // Highlight Center (Amber for Upgrade)
              targets[getHexKey(0,0)] = 'AMBER';
          } else {
              // Highlight reachable L0 hexes (Cyan for Acquire/Momentum)
              const n = getNeighbors(player.q, player.r);
              n.forEach(neighbor => {
                  const k = getHexKey(neighbor.q, neighbor.r);
                  const h = grid[k];
                  if (h && h.currentLevel === 0 && h.maxLevel === 0) {
                      targets[k] = 'CYAN';
                  }
              });
          }
      } else if (tutorialStep === 'BUILD_FOUNDATION') {
          // Highlight existing L1 neighbors that need upgrade to L2
          const centerNeighbors = getNeighbors(0,0);
          centerNeighbors.forEach(n => {
              const k = getHexKey(n.q, n.r);
              const h = grid[k];
              if (h && h.currentLevel === 1) {
                  targets[k] = 'BLUE';
              }
          });
      }

      return targets;
  }, [tutorialStep, winCondition, player.recentUpgrades, player.q, player.r, grid]);

  const renderList = useMemo(() => {
     const items: RenderItem[] = [];
     const allHexes = Object.values(grid) as Hex[];

     // Viewport Culling
     const inverseScale = 1 / viewState.scale;
     const visibleMinX = -viewState.x * inverseScale - VIEWPORT_PADDING;
     const visibleMaxX = (dimensions.width - viewState.x) * inverseScale + VIEWPORT_PADDING;
     const visibleMinY = -viewState.y * inverseScale - VIEWPORT_PADDING;
     const visibleMaxY = (dimensions.height - viewState.y) * inverseScale + VIEWPORT_PADDING;

     for (const hex of allHexes) {
        if (!hex) continue;
        const { x, y } = hexToPixel(hex.q, hex.r, cameraRotation);
        if (x < visibleMinX || x > visibleMaxX || y < visibleMinY || y > visibleMaxY) continue; 
        
        items.push({ 
            type: 'HEX', 
            id: hex.id, 
            depth: y, 
            q: hex.q, 
            r: hex.r
        });
     }

     const allUnits = [{ ...player, isPlayer: true }, ...safeBots.map(b => ({ ...b, isPlayer: false }))];
     const now = Date.now();
     const zSortThreshold = GAME_CONFIG.MOVEMENT_LOGIC_INTERVAL_MS + 50; // Buffer slightly longer than movement

     for (const u of allUnits) {
         if (!u || typeof u.q !== 'number' || typeof u.r !== 'number') continue;
         let track = movementTracker.current[u.id];
         if (!track) {
             track = { lastQ: u.q, lastR: u.r, fromQ: u.q, fromR: u.r, startTime: 0 };
             movementTracker.current[u.id] = track;
         }
         if (track.lastQ !== u.q || track.lastR !== u.r) {
             track.fromQ = track.lastQ;
             track.fromR = track.lastR;
             track.startTime = now;
             track.lastQ = u.q;
             track.lastR = u.r;
         }
         const currentPixel = hexToPixel(u.q, u.r, cameraRotation);
         if (currentPixel.x < visibleMinX || currentPixel.x > visibleMaxX || currentPixel.y < visibleMinY || currentPixel.y > visibleMaxY) continue;
         let sortY = currentPixel.y;
         
         // Smooth Z-Sorting during jump
         if (now - track.startTime < zSortThreshold) {
             const fromPixel = hexToPixel(track.fromQ, track.fromR, cameraRotation);
             // Sort by the 'lowest' (closest to screen bottom) point between start and end to avoid clipping
             sortY = Math.max(sortY, fromPixel.y);
         }
         items.push({ type: 'UNIT', id: u.id, depth: sortY + 25, q: u.q, r: u.r, isPlayer: u.isPlayer });
     }

     for (const b of safeBots) {
         if (b.movementQueue.length > 0) {
             const startHex = grid[getHexKey(b.q, b.r)];
             const startH = startHex ? 10 + (startHex.maxLevel * 6) : 10;
             const startPos = hexToPixel(b.q, b.r, cameraRotation);
             const points = [startPos.x, startPos.y - startH - 10]; 
             for (const step of b.movementQueue) {
                 if (step.upgrade) continue; 
                 const hHex = grid[getHexKey(step.q, step.r)];
                 const h = hHex ? 10 + (hHex.maxLevel * 6) : 10;
                 const p = hexToPixel(step.q, step.r, cameraRotation);
                 points.push(p.x, p.y - h - 10);
             }
             if (points.length >= 4) {
                 items.push({
                     type: 'CONN', id: `path-${b.id}`, depth: 999999, points,
                     color: b.avatarColor || '#ef4444', dash: [4, 4], opacity: 0.6
                 });
             }
         }
     }

     if (!isMoving && !isPlayerGrowing) {
        const startHex = grid[getHexKey(player.q, player.r)];
        const startLevel = startHex ? startHex.maxLevel : 0;
        neighbors.forEach(neighbor => {
            const key = getHexKey(neighbor.q, neighbor.r);
            const hex = grid[key];
            const isBot = safeBots.some(b => b.q === neighbor.q && b.r === neighbor.r);
            const isLocked = hex && hex.maxLevel > player.playerLevel;
            const endLevel = hex ? hex.maxLevel : 0;
            const isReachableHeight = Math.abs(startLevel - endLevel) <= 1;

            if (!isBot && isReachableHeight) {
                const start = hexToPixel(player.q, player.r, cameraRotation);
                const end = hexToPixel(neighbor.q, neighbor.r, cameraRotation);
                if ((start.x > visibleMinX && start.x < visibleMaxX && start.y > visibleMinY && start.y < visibleMaxY) ||
                    (end.x > visibleMinX && end.x < visibleMaxX && end.y > visibleMinY && end.y < visibleMaxY)) {
                    const startH = grid[getHexKey(player.q, player.r)] ? (10 + grid[getHexKey(player.q, player.r)].maxLevel * 6) : 10;
                    const endH = hex ? (10 + hex.maxLevel * 6) : 10;
                    const sY = start.y - startH;
                    const eY = end.y - endH;
                    let cost = 1;
                    if (hex && hex.maxLevel >= 2) cost = hex.maxLevel;
                    const canAfford = player.moves >= cost || player.coins >= (cost * EXCHANGE_RATE_COINS_PER_MOVE);
                    items.push({
                        type: 'CONN', id: `conn-${key}`, depth: Math.min(start.y, end.y),
                        points: [start.x, sY, end.x, eY], color: canAfford ? '#3b82f6' : '#ef4444',
                        dash: [5, 5], opacity: isLocked ? 0.2 : 0.6
                    });
                }
            }
        });
     }
     return items.sort((a, b) => a.depth - b.depth);
  }, [grid, player, safeBots, cameraRotation, isMoving, isPlayerGrowing, viewState, dimensions, neighbors, movementTracker]);

  // --- RENDER ---
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020617]" onContextMenu={(e) => e.preventDefault()}>
      <style>{`
        @keyframes shimmer-gradient {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <Background variant="GAME" />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-70" />
      </div>

      {/* CANVAS */}
      <div className="absolute inset-0 z-10">
        <Stage width={dimensions.width} height={dimensions.height} draggable
          onWheel={handleWheel} 
          onMouseDown={handleMouseDown} 
          onMouseMove={handleMouseMove} 
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleStageClick} 
          onTap={handleStageClick}
          onDragStart={() => setHoveredHexId(null)}
          onDragEnd={handleDragEnd}
          onContextMenu={(e) => e.evt.preventDefault()} x={viewState.x} y={viewState.y} scaleX={viewState.scale} scaleY={viewState.scale}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Layer>
            {renderList.map((item) => {
                if (item.type === 'HEX') {
                    const isOccupied = (item.q === player.q && item.r === player.r) || safeBots.some(b => b.q === item.q && b.r === item.r);
                    const isPending = item.id === pendingTargetKey;
                    
                    // Logic to highlight specific steps
                    let isTutorialTarget = false;
                    let tutorialColor = 'blue'; // default

                    if (tutorialStep === 'MOVE_1' && item.q === 1 && item.r === -1) isTutorialTarget = true;
                    else if (tutorialStep === 'MOVE_2' && item.q === 0 && item.r === -1) isTutorialTarget = true;
                    else if (tutorialStep === 'MOVE_3' && item.q === 0 && item.r === 0) isTutorialTarget = true;
                    else if (tutorialHighlights[item.id]) {
                        isTutorialTarget = true;
                        // Map colors
                        if (tutorialHighlights[item.id] === 'CYAN') tutorialColor = 'cyan';
                        if (tutorialHighlights[item.id] === 'AMBER') tutorialColor = 'amber';
                        if (tutorialHighlights[item.id] === 'BLUE') tutorialColor = 'blue';
                    }

                    return (
                        <Hexagon 
                            key={item.id} 
                            id={item.id} 
                            rotation={cameraRotation} 
                            playerRank={player.playerLevel} 
                            isOccupied={isOccupied} 
                            isSelected={item.id === selectedHexId}
                            isPendingConfirm={isPending}
                            pendingCost={isPending && pendingConfirmation ? pendingConfirmation.data.costCoins : null}
                            onHexClick={handleHexClick} 
                            onHover={setHoveredHexId} 
                            isTutorialTarget={isTutorialTarget}
                            tutorialHighlightColor={tutorialColor as any}
                        />
                    );
                } else if (item.type === 'UNIT') {
                    const unit = item.isPlayer ? player : safeBots.find(b => b.id === item.id);
                    if (!unit) return null;
                    const hexKey = getHexKey(unit.q, unit.r);
                    const hLevel = grid[hexKey]?.maxLevel || 0;
                    return (
                        <Unit 
                            key={item.id} 
                            q={unit.q} 
                            r={unit.r} 
                            type={item.isPlayer ? EntityType.PLAYER : EntityType.BOT} 
                            color={unit.avatarColor} 
                            rotation={cameraRotation} 
                            hexLevel={hLevel} 
                            totalCoinsEarned={unit.totalCoinsEarned} 
                            onMoveComplete={spawnDust}
                        />
                    );
                } else if (item.type === 'CONN') {
                    return <Line key={item.id} points={item.points} stroke={item.color} strokeWidth={2} dash={item.dash} opacity={item.opacity} listening={false} perfectDrawEnabled={false} />;
                }
                return null;
            })}
            
            {/* Visual Effects Layer (Particles & Text) */}
            {particles.map(p => (
                <DustCloud key={p.id} {...p} onComplete={removeParticle} />
            ))}

            {/* Fireworks for Victory */}
            {fireworks.map(p => (
                <Firework key={p.id} {...p} onComplete={removeFirework} />
            ))}

            {effects && effects.map((eff) => (
                <FloatingEffect key={eff.id} effect={eff} rotation={cameraRotation} />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* INDEPENDENT HUD LAYER */}
      <GameHUD 
        hoveredHexId={hoveredHexId} 
        onRotateCamera={rotateCamera} 
        onCenterPlayer={centerOnPlayer} 
      />

    </div>
  );
};

export default GameView;