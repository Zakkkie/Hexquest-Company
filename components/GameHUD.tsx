
import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../store.ts';
import { getHexKey, getNeighbors, getSecondsToGrow, findPath } from '../services/hexUtils.ts';
import { checkGrowthCondition } from '../rules/growth.ts';
import { EXCHANGE_RATE_COINS_PER_MOVE, DIFFICULTY_SETTINGS } from '../rules/config.ts';
import { EntityState, TutorialStep } from '../types.ts';
import HexButton from './HexButton.tsx';
import { CAMPAIGN_LEVELS } from '../rules/campaign.ts';
import { TEXT } from '../services/i18n.ts';
import { 
  AlertCircle, Pause, Trophy, Coins, Footprints, AlertTriangle, LogOut,
  Crown, TrendingUp, ChevronUp, ChevronDown, Shield, MapPin,
  RotateCcw, RotateCw, CheckCircle2, ChevronsUp, Lock, Volume2, VolumeX, XCircle, Zap, RefreshCw, Hand, Navigation, X, ArrowRight, Skull, MousePointer2, Move3d, ArrowDown, PlusCircle
} from 'lucide-react';

// TUTORIAL OVERLAY COMPONENT
const TutorialOverlay: React.FC<{ step: TutorialStep; onNext: () => void }> = ({ step, onNext }) => {
    // Local state to allow user to dismiss "annoying" text boxes while keeping the step active
    const [isVisible, setIsVisible] = useState(true);
    const language = useGameStore(state => state.language);
    const t = TEXT[language].TUTORIAL;
    
    // Reset visibility when step changes
    useEffect(() => {
        setIsVisible(true);
    }, [step]);

    if (step === 'NONE' || step === 'FREE_PLAY') return null;

    const buttonOffsetClass = "left-[calc(50%+50px)]";
    
    // Check momentum for final step
    const player = useGameStore(state => state.session?.player);
    const winCondition = useGameStore(state => state.session?.winCondition);
    const grid = useGameStore(state => state.session?.grid);
    const queueSize = winCondition?.queueSize || 1;
    
    // Logic Fix: In Tutorial (QueueSize 1), if upgrades length >= 1, we HAVE a point/momentum.
    // "Momentum/Point" means we have satisfied the requirement to upgrade vertically.
    const hasUpgradePoint = player && player.recentUpgrades.length >= queueSize;

    const handleDismiss = () => {
        setIsVisible(false);
    };

    return (
        <div className="absolute inset-0 z-[60] pointer-events-none select-none overflow-hidden">
            {/* Darken Background slightly for focus */}
            <div className="absolute inset-0 bg-black/20" />

            {/* STEP 1: WELCOME */}
            {step === 'WELCOME' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                    <div className="bg-slate-900/90 border border-amber-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center max-w-sm">
                        <h2 className="text-2xl font-black text-amber-500 mb-2 uppercase">{t.WELCOME_TITLE}</h2>
                        <p className="text-slate-300 text-sm mb-6">{t.WELCOME_DESC}</p>
                        <button onClick={onNext} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-xl uppercase tracking-wider transition-colors shadow-lg">
                            {t.BTN_START}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: CAMERA */}
            {step === 'CAMERA_ROTATE' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pulse">
                    <Move3d className="w-16 h-16 text-white mb-2 drop-shadow-[0_0_10px_rgba(0,0,0,1)]" />
                    <div className="bg-black/60 px-4 py-2 rounded-full border border-white/20 backdrop-blur">
                        <p className="text-white font-bold text-lg uppercase tracking-widest whitespace-nowrap">Right Click + Drag</p>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 font-mono uppercase">{t.CAMERA_DESC}</p>
                </div>
            )}

            {/* MOVEMENTS */}
            {step === 'MOVE_1' && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="animate-bounce">
                        <MousePointer2 className="w-12 h-12 text-blue-400 fill-blue-400/20 rotate-[-15deg] drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                    </div>
                    <div className="mt-2 bg-blue-900/80 px-4 py-2 rounded-xl border border-blue-500/50 backdrop-blur">
                        <span className="text-blue-100 font-bold uppercase tracking-wider text-sm">{t.MOVE_A}</span>
                    </div>
                </div>
            )}

            {step === 'MOVE_2' && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="animate-bounce">
                        <MousePointer2 className="w-12 h-12 text-blue-400 fill-blue-400/20 rotate-[15deg] drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                    </div>
                    <div className="mt-2 bg-blue-900/80 px-4 py-2 rounded-xl border border-blue-500/50 backdrop-blur">
                        <span className="text-blue-100 font-bold uppercase tracking-wider text-sm">{t.MOVE_B}</span>
                    </div>
                </div>
            )}

            {step === 'MOVE_3' && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="animate-bounce">
                        <Footprints className="w-12 h-12 text-emerald-400 fill-emerald-400/20 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                    </div>
                    <div className="mt-2 bg-emerald-900/80 px-4 py-2 rounded-xl border border-emerald-500/50 backdrop-blur text-center">
                        <p className="text-emerald-100 font-bold uppercase tracking-wider text-sm">{t.MOVE_CENTER}</p>
                    </div>
                </div>
            )}

            {/* ACQUISITIONS */}
            {(step === 'ACQUIRE_1' || step === 'ACQUIRE_2' || step === 'ACQUIRE_3') && (
                <div className={`absolute bottom-36 ${buttonOffsetClass} -translate-x-1/2 flex flex-col items-center`}>
                    <div className="bg-amber-900/80 px-4 py-2 rounded-xl border border-amber-500/50 backdrop-blur mb-2">
                        <span className="text-amber-100 font-bold uppercase tracking-wider text-sm">{t.ACQUIRE}</span>
                    </div>
                    <ArrowDown className="w-12 h-12 text-amber-500 animate-bounce drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                </div>
            )}

            {/* UPGRADE CENTER 2 */}
            {step === 'UPGRADE_CENTER_2' && (
                <div className={`absolute bottom-36 ${buttonOffsetClass} -translate-x-1/2 flex flex-col items-center`}>
                    <div className="bg-indigo-900/80 px-4 py-2 rounded-xl border border-indigo-500/50 backdrop-blur mb-2 text-center">
                        <span className="text-indigo-100 font-bold uppercase tracking-wider text-sm">{t.UPGRADE_L2}</span>
                        <p className="text-[9px] text-indigo-300">{t.UPGRADE_L2_DESC}</p>
                    </div>
                    <ArrowDown className="w-12 h-12 text-indigo-500 animate-bounce drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                </div>
            )}

            {/* STEP 3 & 4: BUILD FOUNDATION & FINAL UPGRADE */}
            {(step === 'BUILD_FOUNDATION' || step === 'UPGRADE_CENTER_3') && isVisible && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-80 flex flex-col items-center gap-4 pointer-events-auto">
                    
                    {/* Status Logic */}
                    {hasUpgradePoint ? (
                        // CASE: HAVE POINT (MOMENTUM) -> Show instructions
                        step === 'BUILD_FOUNDATION' ? (
                            <div className="bg-slate-900/90 border border-blue-500 p-4 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.3)] text-center animate-in fade-in slide-in-from-top-4 relative w-full">
                                <button onClick={handleDismiss} className="absolute top-2 right-2 text-slate-500 hover:text-white p-1"><X className="w-3 h-3"/></button>
                                <h3 className="text-lg font-bold text-blue-400 mb-1 uppercase flex items-center justify-center gap-2">
                                    <TrendingUp className="w-5 h-5"/> {t.FOUNDATION_TITLE}
                                </h3>
                                <p className="text-slate-300 text-xs leading-relaxed mb-2">
                                    {t.FOUNDATION_DESC}
                                </p>
                                <div className="bg-black/40 p-2 rounded text-blue-200 text-[10px] font-mono">
                                    {t.FOUNDATION_TASK}
                                </div>
                            </div>
                        ) : (
                            // UPGRADE_CENTER_3 & HAVE POINT
                            <div className="bg-indigo-900/90 border border-indigo-400 p-4 rounded-xl shadow-[0_0_50px_rgba(99,102,241,0.6)] text-center animate-bounce relative w-full">
                                <button onClick={handleDismiss} className="absolute top-2 right-2 text-indigo-300 hover:text-white p-1"><X className="w-3 h-3"/></button>
                                <h3 className="text-lg font-bold text-white mb-1 uppercase flex items-center justify-center gap-2">
                                    <Crown className="w-5 h-5 text-amber-400"/> {t.FINAL_TITLE}
                                </h3>
                                <p className="text-indigo-100 text-xs leading-relaxed">
                                    {t.FINAL_DESC}
                                </p>
                            </div>
                        )
                    ) : (
                        // CASE: NO POINT (QUEUE LOCKED) -> Show Alert
                        <div className="bg-red-950/90 border border-red-500 p-4 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.4)] text-center relative w-full animate-pulse">
                            <button onClick={handleDismiss} className="absolute top-2 right-2 text-red-400 hover:text-white p-1"><X className="w-3 h-3"/></button>
                            <h3 className="text-lg font-bold text-red-400 mb-1 uppercase flex items-center justify-center gap-2">
                                <AlertTriangle className="w-5 h-5"/> {t.NO_POINTS_TITLE}
                            </h3>
                            <p className="text-white text-xs leading-relaxed mb-3">
                                {t.NO_POINTS_DESC}
                            </p>
                            <div className="flex items-center gap-3 bg-black/40 p-2 rounded justify-center">
                                <PlusCircle className="w-5 h-5 text-emerald-400" />
                                <span className="text-emerald-200 text-[10px] font-mono font-bold uppercase text-left leading-tight">
                                    {t.NO_POINTS_HINT}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface GameHUDProps {
  hoveredHexId: string | null;
  onRotateCamera: (direction: 'left' | 'right') => void;
  onCenterPlayer: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({ hoveredHexId, onRotateCamera, onCenterPlayer }) => {
  // Global State Selectors
  const grid = useGameStore(state => state.session?.grid);
  const player = useGameStore(state => state.session?.player);
  const bots = useGameStore(state => state.session?.bots);
  const winCondition = useGameStore(state => state.session?.winCondition);
  const gameStatus = useGameStore(state => state.session?.gameStatus);
  const isPlayerGrowing = useGameStore(state => state.session?.isPlayerGrowing);
  const playerGrowthIntent = useGameStore(state => state.session?.playerGrowthIntent);
  const sessionStartTime = useGameStore(state => state.session?.sessionStartTime);
  const difficulty = useGameStore(state => state.session?.difficulty);
  const tutorialStep = useGameStore(state => state.session?.tutorialStep);
  const advanceTutorial = useGameStore(state => state.advanceTutorial);
  const language = useGameStore(state => state.language);

  const user = useGameStore(state => state.user);
  const toast = useGameStore(state => state.toast);
  // pendingConfirmation is now handled visually in the GameView/Hexagon, not as a modal
  // const pendingConfirmation = useGameStore(state => state.pendingConfirmation);
  const isMuted = useGameStore(state => state.isMuted);

  const setUIState = useGameStore(state => state.setUIState);
  const abandonSession = useGameStore(state => state.abandonSession);
  const togglePlayerGrowth = useGameStore(state => state.togglePlayerGrowth);
  const toggleMute = useGameStore(state => state.toggleMute);
  const playUiSound = useGameStore(state => state.playUiSound);
  const startCampaignLevel = useGameStore(state => state.startCampaignLevel);

  // Local UI State
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isRankingsOpen, setIsRankingsOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<'RANK' | 'QUEUE' | 'COINS' | 'MOVES' | null>(null);

  const t = TEXT[language].HUD;
  const tooltips = TEXT[language].TOOLTIP;

  if (!grid || !player || !bots || !difficulty) return null;

  // Use winCondition queueSize for accuracy in campaign
  const queueSize = winCondition?.queueSize || 3;
  const currentHex = grid[getHexKey(player.q, player.r)];
  const neighbors = getNeighbors(player.q, player.r);
  const safeBots = (bots || []).filter(b => b && typeof b.q === 'number' && typeof b.r === 'number');
  const botPositions = safeBots.map(b => ({ q: b.q, r: b.r }));
  const isMoving = player.state === EntityState.MOVING;
  const canRecover = !player.recoveredCurrentHex;

  // Conditions
  const growthCondition = useMemo(() => {
    if (!currentHex) return { canGrow: false, reason: 'Invalid Hex' };
    return checkGrowthCondition(currentHex, player, neighbors, grid, botPositions, queueSize);
  }, [currentHex, player, grid, neighbors, botPositions, queueSize]);

  const upgradeCondition = useMemo(() => {
    if (!currentHex) return { canGrow: false, reason: 'Invalid Hex' };
    const simulatedHex = { ...currentHex, currentLevel: Math.max(0, currentHex.maxLevel) };
    return checkGrowthCondition(simulatedHex, player, neighbors, grid, botPositions, queueSize);
  }, [currentHex, player, grid, neighbors, botPositions, queueSize]);

  const canUpgrade = upgradeCondition.canGrow;

  const timeData = useMemo(() => {
    if (!currentHex) return { totalNeeded: 1, totalDone: 0, percent: 0, mode: 'IDLE' };
    
    const isRecovering = playerGrowthIntent === 'RECOVER';
    let totalNeeded = 0;
    let mode = 'IDLE';

    if (isRecovering) {
        totalNeeded = getSecondsToGrow(currentHex.maxLevel);
        mode = 'RECOVERY';
    } else {
        const calculationTarget = currentHex.maxLevel + 1;
        for (let l = currentHex.currentLevel + 1; l <= calculationTarget; l++) {
            totalNeeded += getSecondsToGrow(l);
        }
        mode = 'UPGRADE';
    }

    const currentStepProgress = currentHex.progress;
    const currentStepNeeded = isRecovering 
        ? getSecondsToGrow(currentHex.maxLevel) 
        : getSecondsToGrow(currentHex.currentLevel + 1);

    const percent = currentStepNeeded > 0 ? (currentStepProgress / currentStepNeeded) * 100 : 0;
    const remaining = Math.max(0, currentStepNeeded - currentStepProgress);

    return { totalNeeded, remaining, percent, mode };
  }, [currentHex, isPlayerGrowing, canUpgrade, playerGrowthIntent]);

  const tooltipData = useMemo(() => {
    if (!hoveredHexId) return null;
    const hex = grid[hoveredHexId];
    if (!hex) return null;

    const obstacles = safeBots.map(b => ({ q: b.q, r: b.r }));
    const isBlockedByBot = obstacles.some(o => o.q === hex.q && o.r === hex.r);
    const isPlayerPos = hex.q === player.q && hex.r === player.r;
    
    let label: string | null = null;
    let costMoves = 0;
    let costCoins = 0;
    let isReachable = false;
    let moveCost = 0;
    let canAffordCoins = true;
    
    if (isPlayerPos) {
        label = tooltips.CURRENT_LOC;
        isReachable = true;
    } else if (isBlockedByBot) {
        label = tooltips.BLOCKED;
    } else {
        const path = findPath({ q: player.q, r: player.r }, { q: hex.q, r: hex.r }, grid, player.playerLevel, obstacles);
        if (path) {
            isReachable = true;
            for (const step of path) {
                const stepHex = grid[getHexKey(step.q, step.r)];
                moveCost += (stepHex && stepHex.maxLevel >= 2) ? stepHex.maxLevel : 1;
            }
            const availableMoves = player.moves;
            const movesToSpend = Math.min(moveCost, availableMoves);
            const deficit = moveCost - movesToSpend;
            const coinsToSpend = deficit * EXCHANGE_RATE_COINS_PER_MOVE;

            costMoves = movesToSpend;
            costCoins = coinsToSpend;
            canAffordCoins = player.coins >= coinsToSpend;
        } else {
            label = tooltips.NA;
        }
    }

    const isLocked = hex.maxLevel > player.playerLevel;
    let statusText = "OK";
    let statusColor = "text-emerald-400";
    let Icon = CheckCircle2;

    if (isLocked) {
        statusText = `${tooltips.REQ} L${hex.maxLevel}`;
        statusColor = "text-red-400";
        Icon = Lock;
    } else if (isBlockedByBot) {
        statusText = tooltips.OCCUPIED;
        statusColor = "text-amber-400";
        Icon = AlertCircle;
    } else if (isPlayerPos) {
        statusText = tooltips.PLAYER;
        statusColor = "text-blue-400";
        Icon = MapPin;
    }

    return { 
        hex, label, costMoves, costCoins, canAffordCoins, isReachable, isLocked, statusText, statusColor, Icon 
    };
  }, [hoveredHexId, grid, player.q, player.r, player.playerLevel, player.moves, player.coins, safeBots, tooltips]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}m ${sec}s`;
  };

  const handleGrowClick = () => {
    onCenterPlayer(); 
    if (isMoving) return;
    if (!currentHex) return;
    if (!canRecover) return; 
    togglePlayerGrowth('RECOVER');
  };

  const handleUpgradeClick = () => {
    onCenterPlayer(); 
    if (isMoving) return; 
    if (!currentHex) return;
    if (!canUpgrade) return;
    togglePlayerGrowth('UPGRADE');
  };

  // Tutorial Helper
  const handleNextStep = () => {
      if (tutorialStep === 'WELCOME') advanceTutorial('CAMERA_ROTATE');
  };

  // Winner Calculation for End Screen
  const winner = useMemo(() => {
      if (gameStatus === 'VICTORY') return player;
      if (gameStatus === 'DEFEAT' && winCondition) {
          // Find the bot that met the condition
          const w = safeBots.find(b => {
              const reachedLevel = b.playerLevel >= winCondition.targetLevel;
              const reachedCoins = b.totalCoinsEarned >= winCondition.targetCoins;
              if (winCondition.winType === 'AND') return reachedLevel && reachedCoins;
              return reachedLevel || reachedCoins;
          });
          return w || safeBots[0]; // Fallback to first bot if logic gap
      }
      return null;
  }, [gameStatus, player, safeBots, winCondition]);

  const isCampaignLevel = winCondition && winCondition.levelId >= 0;
  const showNextLevel = gameStatus === 'VICTORY' && isCampaignLevel && CAMPAIGN_LEVELS.some(l => l.levelId === winCondition.levelId + 1);
  const isCampaignComplete = gameStatus === 'VICTORY' && isCampaignLevel && !showNextLevel;
  const showRetry = gameStatus === 'DEFEAT' && isCampaignLevel;

  const isTutorialActive = tutorialStep && tutorialStep !== 'NONE' && tutorialStep !== 'FREE_PLAY';
  // Highlight buttons if in action step
  const isActionStep = ['ACQUIRE_1', 'ACQUIRE_2', 'ACQUIRE_3', 'UPGRADE_CENTER_2', 'UPGRADE_CENTER_3'].includes(tutorialStep);
  const shouldDimControls = isTutorialActive && !isActionStep && tutorialStep !== 'BUILD_FOUNDATION';

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none">
      
      {/* TUTORIAL OVERLAY */}
      {tutorialStep && <TutorialOverlay step={tutorialStep} onNext={handleNextStep} />}

      {/* HEADER */}
      <div className="absolute inset-x-0 top-0 p-2 md:p-4 pointer-events-none z-30 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-start gap-2">
               
               {/* LEFT: STATS PILL (UPDATED DESKTOP LAYOUT) */}
               <div className="pointer-events-auto flex items-center bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden px-3 md:px-2 py-2 gap-2 md:gap-2 h-12 md:h-16 min-w-0">
                   
                   {/* Rank */}
                   <div onClick={() => { setHelpTopic('RANK'); playUiSound('CLICK'); }} className="flex items-center gap-1.5 md:gap-3 cursor-help opacity-90 hover:opacity-100 group shrink-0 md:px-4 md:bg-slate-800/30 md:rounded-xl md:h-full transition-colors">
                       <div className="hidden md:block p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                           <Crown className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                       </div>
                       <Crown className="w-4 h-4 md:hidden text-indigo-400" />
                       
                       <div className="flex flex-col justify-center">
                           <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">{t.RANK}</span>
                           <div className="flex items-baseline leading-none">
                             <span className="text-xs md:text-sm font-black text-white">{player.playerLevel}</span>
                             <span className="text-[9px] md:text-[10px] text-slate-500 font-bold ml-px md:ml-0.5">/{winCondition?.targetLevel || '?'}</span>
                           </div>
                       </div>
                   </div>

                   <div className="w-px h-4 md:h-8 bg-slate-700/50 shrink-0"></div>

                   {/* Queue */}
                   <div onClick={() => { setHelpTopic('QUEUE'); playUiSound('CLICK'); }} className="flex items-center gap-1.5 md:gap-3 cursor-help opacity-90 hover:opacity-100 group shrink-0 md:px-4 md:bg-slate-800/30 md:rounded-xl md:h-full transition-colors">
                       <div className="hidden md:block p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                           <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                       </div>
                       <TrendingUp className="w-4 h-4 md:hidden text-emerald-400" />

                       <div className="flex flex-col justify-center">
                           <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">{t.CYCLE}</span>
                           <div className="flex gap-0.5 md:gap-1">
                               {Array.from({length: queueSize}).map((_, i) => (
                                  <div key={i} className={`w-1.5 h-3 md:w-2 md:h-2 rounded-[1px] transition-all duration-300 ${player.recentUpgrades.length > i ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-700/50'}`} />
                               ))}
                           </div>
                       </div>
                   </div>

                   <div className="w-px h-4 md:h-8 bg-slate-700/50 shrink-0"></div>

                   {/* Coins */}
                   <div onClick={() => { setHelpTopic('COINS'); playUiSound('CLICK'); }} className="flex items-center gap-1.5 md:gap-3 cursor-help opacity-90 hover:opacity-100 group shrink-0 md:px-4 md:bg-slate-800/30 md:rounded-xl md:h-full transition-colors">
                       <div className="hidden md:block p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                           <Coins className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                       </div>
                       <Coins className="w-4 h-4 md:hidden text-amber-400" />

                       <div className="flex flex-col justify-center">
                           <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">{t.CREDITS}</span>
                           <div className="flex items-baseline leading-none">
                             <span className="text-xs md:text-sm font-black text-white">{player.coins}</span>
                             <span className="text-[9px] md:text-[10px] text-slate-500 font-bold ml-px md:ml-0.5">/{winCondition?.targetCoins || '?'}</span>
                           </div>
                       </div>
                   </div>

                   <div className="w-px h-4 md:h-8 bg-slate-700/50 shrink-0"></div>

                   {/* Moves */}
                   <div onClick={() => { setHelpTopic('MOVES'); playUiSound('CLICK'); }} className="flex items-center gap-1.5 md:gap-3 cursor-help opacity-90 hover:opacity-100 group shrink-0 md:px-4 md:bg-slate-800/30 md:rounded-xl md:h-full transition-colors">
                       <div className="hidden md:block p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                           <Footprints className={`w-4 h-4 ${isMoving ? 'text-slate-200 animate-pulse' : 'text-blue-400 group-hover:text-blue-300'}`} />
                       </div>
                       <Footprints className={`w-4 h-4 md:hidden ${isMoving ? 'text-slate-200 animate-pulse' : 'text-blue-400'}`} />

                       <div className="flex flex-col justify-center">
                           <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">{t.MOVES}</span>
                           <span className="text-xs md:text-sm font-black text-white leading-none">{player.moves}</span>
                       </div>
                   </div>
               </div>

               {/* RIGHT: SYSTEM CONTROLS */}
               <div className="pointer-events-auto flex items-start gap-1.5 md:gap-2 shrink-0">
                   <button 
                      onClick={() => { toggleMute(); playUiSound('CLICK'); }}
                      className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                   >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                   </button>

                   <div className={`flex flex-col bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-top-right ${isRankingsOpen ? 'w-56 md:w-80' : 'w-12 md:w-16 h-12 md:h-16'}`}>
                       <div onClick={() => { setIsRankingsOpen(!isRankingsOpen); playUiSound('CLICK'); }} className={`flex items-center justify-center w-full h-12 md:h-16 cursor-pointer hover:bg-white/5 transition-colors ${isRankingsOpen ? 'border-b border-slate-700/50' : ''}`}>
                           {isRankingsOpen ? (
                               <div className="flex items-center justify-between w-full px-3">
                                   <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /><span className="text-[10px] font-bold text-slate-300 uppercase">{t.LEADERBOARD_TITLE}</span></div>
                                   <ChevronUp className="w-3 h-3 text-slate-500" />
                               </div>
                           ) : (
                               <Trophy className="w-5 h-5 text-amber-500" />
                           )}
                       </div>
                       
                       {isRankingsOpen && (
                           <div className="flex flex-col p-2 gap-1.5 max-h-[40vh] overflow-y-auto no-scrollbar">
                               {/* Ranking Headers */}
                               <div className="grid grid-cols-4 px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                  <div className="col-span-2">Commander</div>
                                  <div className="col-span-1 text-center">Cycle</div>
                                  <div className="col-span-1 text-right">Credits</div>
                               </div>

                               {[player, ...safeBots].sort((a, b) => (b.totalCoinsEarned || 0) - (a.totalCoinsEarned || 0)).map((e) => {
                                   const isP = e.type === 'PLAYER';
                                   const color = isP ? (user?.avatarColor || '#3b82f6') : (e.avatarColor || '#ef4444');
                                   return (
                                       <div key={e.id} className="grid grid-cols-4 items-center p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                           {/* Column 1: Identity & Rank */}
                                           <div className="col-span-2 flex items-center gap-2 overflow-hidden">
                                               <div className="relative">
                                                 <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                               </div>
                                               <div className="flex flex-col min-w-0">
                                                 <span className={`text-[10px] font-bold truncate ${isP ? 'text-white' : 'text-slate-400'}`}>{isP ? 'YOU' : e.id.toUpperCase()}</span>
                                                 <span className="text-[9px] text-indigo-400 font-mono">Lvl {e.playerLevel}</span>
                                               </div>
                                           </div>

                                           {/* Column 2: Upgrade Points/Queue */}
                                           <div className="col-span-1 flex items-center justify-center">
                                              <div className="flex items-center gap-1 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">
                                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[9px] font-mono font-bold text-slate-300">{e.recentUpgrades.length}</span>
                                              </div>
                                           </div>

                                           {/* Column 3: Coins */}
                                           <div className="col-span-1 text-right">
                                              <span className="text-[10px] font-mono text-amber-500 font-bold">{e.coins}</span>
                                           </div>
                                       </div>
                                   );
                               })}
                           </div>
                       )}
                   </div>

                   <button 
                      onClick={() => { setShowExitConfirmation(true); playUiSound('CLICK'); }} 
                      className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                   >
                      <LogOut className="w-5 h-5" />
                   </button>
               </div>
          </div>
      </div>

      {/* HEX CONTROLS: BOTTOM BAR */}
      <div className={`absolute bottom-6 md:bottom-8 w-full flex justify-center items-end gap-3 md:gap-5 pointer-events-none z-40 pb-[env(safe-area-inset-bottom)] transition-opacity duration-300 ${shouldDimControls ? 'opacity-30 blur-[2px]' : 'opacity-100'}`}>
        
        {/* ROTATE LEFT */}
        <div className="pointer-events-auto mb-1">
          <HexButton size="sm" onClick={() => { onRotateCamera('left'); playUiSound('CLICK'); }} variant="slate">
            <RotateCcw className="w-5 h-5 text-slate-300 group-hover:text-white" />
          </HexButton>
        </div>

        {/* MAIN ACTIONS */}
        <div className="pointer-events-auto flex items-end gap-3">
           {isPlayerGrowing ? (
              // ACTIVE CHANNELING STATE (Single Large Button)
              <HexButton 
                onClick={() => { onCenterPlayer(); togglePlayerGrowth(timeData.mode === 'RECOVERY' ? 'RECOVER' : 'UPGRADE'); }}
                active={true}
                variant={timeData.mode === 'RECOVERY' ? 'blue' : 'amber'}
                progress={timeData.percent}
                size="lg"
                pulsate={true}
              >
                  <div className="flex flex-col items-center gap-1">
                      <Pause className="w-8 h-8 fill-current drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                      <span className="text-[10px] font-mono font-bold tracking-widest">{formatTime(timeData.remaining * 1000)}</span>
                  </div>
              </HexButton>
           ) : (
              // IDLE STATE (Double Buttons)
              <>
                <HexButton 
                  onClick={handleGrowClick} 
                  disabled={!canRecover || isMoving}
                  variant={(canRecover && !isMoving) ? 'blue' : 'slate'}
                  size="lg" // CHANGED: Equal size to upgrade
                  active={false}
                >
                    <RefreshCw className={`w-8 h-8 ${(canRecover && !isMoving) ? 'text-cyan-50 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-500'}`} />
                </HexButton>
                
                <div className={isActionStep ? 'animate-bounce drop-shadow-[0_0_20px_rgba(245,158,11,1)]' : ''}>
                  <HexButton 
                    onClick={handleUpgradeClick} 
                    disabled={!canUpgrade || isMoving}
                    variant={(canUpgrade && !isMoving) ? 'amber' : 'slate'}
                    size="lg" // CHANGED: Equal size to recover
                    pulsate={canUpgrade && !isMoving || isActionStep} 
                  >
                      <ChevronsUp className={`w-10 h-10 ${(canUpgrade && !isMoving) ? 'text-amber-50 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-slate-500'}`} />
                  </HexButton>
                </div>
              </>
           )}
        </div>

        {/* ROTATE RIGHT */}
        <div className="pointer-events-auto mb-1">
          <HexButton size="sm" onClick={() => { onRotateCamera('right'); playUiSound('CLICK'); }} variant="slate">
             <RotateCw className="w-5 h-5 text-slate-300 group-hover:text-white" />
          </HexButton>
        </div>

      </div>

      {helpTopic && (
        <div className="absolute inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center pointer-events-auto p-4" onClick={() => setHelpTopic(null)}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={() => setHelpTopic(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><XCircle className="w-5 h-5"/></button>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                        {helpTopic === 'RANK' && <Crown className="w-6 h-6 text-indigo-500" />}
                        {helpTopic === 'QUEUE' && <TrendingUp className="w-6 h-6 text-emerald-500" />}
                        {helpTopic === 'COINS' && <Coins className="w-6 h-6 text-amber-500" />}
                        {helpTopic === 'MOVES' && <Footprints className="w-6 h-6 text-blue-500" />}
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">
                        {helpTopic === 'RANK' && t.RANK}
                        {helpTopic === 'QUEUE' && t.CYCLE}
                        {helpTopic === 'COINS' && t.CREDITS}
                        {helpTopic === 'MOVES' && t.MOVES}
                    </h3>
                    <div className="text-sm text-slate-400 leading-relaxed px-2">
                        {helpTopic === 'RANK' && (<><p className="mb-2">Your Rank determines your maximum clearance level.</p><p className="text-indigo-400 font-bold">Goal: Rank {winCondition?.targetLevel}</p></>)}
                        {helpTopic === 'QUEUE' && (<><p className="mb-2">You must rotate between {queueSize} different sectors.</p><p className="text-emerald-400 font-bold">Green dots show momentum.</p></>)}
                        {helpTopic === 'COINS' && (<><p className="mb-2">Credits fund upgrades and can refuel movement.</p><p className="text-amber-500 font-bold">Goal: {winCondition?.targetCoins} Credits</p></>)}
                        {helpTopic === 'MOVES' && (<><p className="mb-2">Moves are replenished by upgrading or recovering.</p><p className="text-blue-400 font-bold">Tip: High levels cost more.</p></>)}
                    </div>
                </div>
            </div>
        </div>
      )}

      {showExitConfirmation && (
        <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
             <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20"><LogOut className="w-6 h-6 text-red-500" /></div>
             <h3 className="text-xl font-bold text-white mb-2">{t.ABORT_TITLE}</h3>
             <p className="text-slate-400 text-xs mb-6 leading-relaxed">{t.ABORT_DESC}</p>
             <div className="flex gap-3">
               <button onClick={() => { setShowExitConfirmation(false); playUiSound('CLICK'); }} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold text-xs uppercase tracking-wider">{t.BTN_CANCEL}</button>
               <button onClick={() => { abandonSession(); setShowExitConfirmation(false); playUiSound('CLICK'); }} className="flex-1 py-3 bg-red-900/50 hover:bg-red-800/50 border border-red-800/50 rounded-xl text-red-200 hover:text-white font-bold text-xs uppercase tracking-wider">{t.BTN_CONFIRM}</button>
             </div>
          </div>
        </div>
      )}

      { (gameStatus === 'VICTORY' || gameStatus === 'DEFEAT') && (
        <div className="absolute inset-0 z-[80] bg-black/80 backdrop-blur-lg flex items-center justify-center pointer-events-auto p-4 animate-in fade-in duration-500">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gameStatus === 'VICTORY' ? 'from-transparent via-amber-500 to-transparent' : 'from-transparent via-red-500 to-transparent'}`}></div>
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 ${gameStatus === 'VICTORY' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    {gameStatus === 'VICTORY' ? <Trophy className="w-8 h-8 text-amber-500" /> : <Shield className="w-8 h-8 text-red-500" />}
                </div>
                <h2 className={`text-4xl font-black mb-2 uppercase tracking-wider ${gameStatus === 'VICTORY' ? 'text-amber-400' : 'text-red-500'}`}>
                    {gameStatus === 'VICTORY' ? t.VICTORY : t.DEFEAT}
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                    {isCampaignComplete 
                        ? t.MISSION_COMPLETE
                        : `${winCondition?.label} ${gameStatus === 'VICTORY' ? '' : t.MISSION_FAILED}`
                    }
                </p>

                {/* WINNER DISPLAY (If Defeat) */}
                {gameStatus === 'DEFEAT' && winner && winner.type !== 'PLAYER' && (
                    <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-xl mb-6 flex items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: winner.avatarColor }} />
                            <div className="text-left">
                                <div className="text-[10px] font-bold text-red-300 uppercase tracking-wider">{t.WINNER}</div>
                                <div className="text-white font-bold text-sm tracking-wide">{winner.id.toUpperCase()}</div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-sm">
                                <span>{winner.totalCoinsEarned}</span>
                                <span className="text-[9px] text-amber-600 font-sans tracking-tight">CR</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-indigo-400 font-mono font-bold text-sm">
                                <span>L{winner.playerLevel}</span>
                                <span className="text-[9px] text-indigo-600 font-sans tracking-tight">RANK</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-8 flex justify-around text-left">
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.TIME}</span><span className="text-white font-mono font-bold text-lg">{formatTime(Date.now() - sessionStartTime)}</span></div>
                    <div className="w-px bg-slate-800"></div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.CREDITS}</span><span className="text-amber-400 font-mono font-bold text-lg">{player.totalCoinsEarned}</span></div>
                    <div className="w-px bg-slate-800"></div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.RANK}</span><span className="text-indigo-400 font-mono font-bold text-lg">L{player.playerLevel}</span></div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => { abandonSession(); playUiSound('CLICK'); }} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors">{t.BTN_MENU}</button>
                    {showNextLevel ? (
                        <button 
                            onClick={() => { startCampaignLevel(winCondition!.levelId + 1); playUiSound('CLICK'); }} 
                            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>{t.BTN_NEXT}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : showRetry ? (
                        <button 
                            onClick={() => { startCampaignLevel(winCondition!.levelId); playUiSound('CLICK'); }} 
                            className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>{t.BTN_RETRY}</span>
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={() => { abandonSession(); setUIState('LEADERBOARD'); playUiSound('CLICK'); }} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-colors">{t.BTN_VIEW_LEADERBOARD}</button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GameHUD;
