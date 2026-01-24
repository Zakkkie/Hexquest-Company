
import { System } from './System';
import { GameState, GameEvent, EntityState, EntityType, SessionState } from '../../types';
import { WorldIndex } from '../WorldIndex';
import { calculateBotMove } from '../../bot/calculateBotMove';
import { ActionProcessor } from '../ActionProcessor';
import { GAME_CONFIG } from '../../rules/config';
import { getHexKey } from '../../services/hexUtils';

export class AiSystem implements System {
  private actionProcessor: ActionProcessor;

  constructor(actionProcessor: ActionProcessor) {
    this.actionProcessor = actionProcessor;
  }

  update(state: SessionState, index: WorldIndex, events: GameEvent[]): void {
    const now = Date.now();
    
    // Optimization check: Do any bots actually need to run this tick?
    const baseInterval = GAME_CONFIG.BOT_ACTION_INTERVAL_MS;
    const shuffledBots = [...state.bots].sort(() => Math.random() - 0.5);
    
    const anyBotReady = shuffledBots.some(b => {
        if (b.state !== EntityState.IDLE) return false;
        const interval = b.playerLevel < 3 ? baseInterval * 2 : baseInterval;
        return (now - (b.lastActionTime || 0)) >= interval;
    });

    // Only sync expensive index state if we are actually going to calculate moves
    if (anyBotReady) {
        index.syncState(state);
    } else {
        // Just sync grid structure (cheaper) for other systems if needed, 
        // though strictly AI is the main consumer of full grid analysis.
        index.syncGrid(state.grid);
    }
    
    const tickObstacles = index.getOccupiedHexesList();
    const tickReservedKeys = new Set<string>();

    for (const bot of shuffledBots) {
      if (bot.state !== EntityState.IDLE) continue;
      
      // --- SPEED THROTTLE ---
      const interval = bot.playerLevel < 3 ? baseInterval * 2 : baseInterval;
      
      const lastAct = bot.lastActionTime || 0;
      if (now - lastAct < interval) {
          continue; 
      }
      
      const aiResult = calculateBotMove(
        bot, 
        state.grid, 
        state.player, 
        state.winCondition, 
        tickObstacles, 
        index, 
        state.stateVersion,
        state.difficulty,
        tickReservedKeys 
      );

      // PERSIST MEMORY
      if (aiResult.memory) {
          bot.memory = aiResult.memory;
      }

      state.botActivityLog.unshift({
          botId: bot.id,
          action: aiResult.action ? aiResult.action.type : 'WAIT',
          reason: aiResult.debug,
          timestamp: now,
          target: aiResult.action && aiResult.action.type === 'MOVE' 
              ? `${aiResult.action.path[aiResult.action.path.length-1].q},${aiResult.action.path[aiResult.action.path.length-1].r}`
              : undefined
      });
      if (state.botActivityLog.length > 50) state.botActivityLog.pop();

      if (aiResult.action && aiResult.action.type !== 'WAIT') {
         const res = this.actionProcessor.applyAction(state, index, bot.id, aiResult.action);
         if (!res.ok) {
             events.push({
                 type: 'ERROR',
                 message: `Bot ${bot.id} action failed: ${res.reason}`,
                 timestamp: now
             });
             if (bot.memory) {
                 bot.memory.lastActionFailed = true;
                 bot.memory.stuckCounter = (bot.memory.stuckCounter || 0) + 1;
             }
         } else {
             if (aiResult.action.type === 'MOVE') {
                 const target = aiResult.action.path[aiResult.action.path.length - 1];
                 tickReservedKeys.add(getHexKey(target.q, target.r));
             }
             if (bot.memory) bot.memory.stuckCounter = 0;
         }
      }
      
      bot.lastActionTime = now;
    }

    state.lastBotActionTime = now;
  }
}
