
import { GameState, GameAction, GameEvent, ValidationResult, SessionState, EntityState, TutorialStep } from '../types';
import { WorldIndex } from './WorldIndex';
import { System } from './systems/System';
import { MovementSystem } from './systems/MovementSystem';
import { GrowthSystem } from './systems/GrowthSystem';
import { AiSystem } from './systems/AiSystem';
import { VictorySystem } from './systems/VictorySystem';
import { ActionProcessor } from './ActionProcessor';
import { SAFETY_CONFIG } from '../rules/config';
import { GameEventFactory } from './events';

export interface TickResult {
  state: SessionState;
  events: GameEvent[];
}

export class GameEngine {
  private _state: SessionState | null;
  private _index: WorldIndex | null;
  private _systems: System[];
  private _actionProcessor: ActionProcessor | null;

  constructor(initialState: SessionState) {
    this._state = JSON.parse(JSON.stringify(initialState));
    this._state!.stateVersion = this._state!.stateVersion || 0;
    
    this._index = new WorldIndex(this._state!.grid, [this._state!.player, ...this._state!.bots]);
    this._actionProcessor = new ActionProcessor();
    
    this._systems = [
      new GrowthSystem(),
      new AiSystem(this._actionProcessor!),
      new MovementSystem(),
      new VictorySystem()
    ];
  }

  public get state(): SessionState | null {
    return this._state;
  }

  private cloneState(source: SessionState): SessionState {
    return {
      ...source,
      grid: source.grid, 
      player: {
        ...source.player,
        movementQueue: [...source.player.movementQueue],
        recentUpgrades: [...source.player.recentUpgrades],
        memory: source.player.memory ? { ...source.player.memory } : undefined
      },
      bots: source.bots.map(b => ({
        ...b,
        movementQueue: [...b.movementQueue],
        recentUpgrades: [...b.recentUpgrades],
        memory: b.memory ? { ...b.memory } : undefined
      })),
      messageLog: source.messageLog.map(l => ({ ...l })),
      botActivityLog: source.botActivityLog.map(l => ({ ...l })),
      growingBotIds: [...source.growingBotIds],
      telemetry: source.telemetry ? [...source.telemetry] : undefined,
      effects: source.effects.map(e => ({ ...e }))
    };
  }

  public setPlayerIntent(isGrowing: boolean, intent: 'RECOVER' | 'UPGRADE' | null) {
      if (!this._state) return;
      const nextState = this.cloneState(this._state);
      nextState.isPlayerGrowing = isGrowing;
      nextState.playerGrowthIntent = intent;
      nextState.stateVersion++;
      this._state = nextState;
  }

  public setTutorialStep(step: TutorialStep) {
      if (!this._state) return;
      const nextState = this.cloneState(this._state);
      nextState.tutorialStep = step;
      nextState.stateVersion++;
      this._state = nextState;
  }

  /**
   * Завершает туториал и генерирует необходимые события для UI
   */
  public triggerVictory() {
      if (!this._state) return;
      const nextState = this.cloneState(this._state);
      nextState.gameStatus = 'VICTORY';
      
      const msg = 'Tutorial Complete: Sector Secured';
      nextState.messageLog.unshift({
          id: `win-manual-${Date.now()}`,
          text: msg,
          type: 'SUCCESS',
          source: 'SYSTEM',
          timestamp: Date.now()
      });
      
      // Генерируем события вручную
      const winEvent = GameEventFactory.create('VICTORY', msg, nextState.player.id);
      
      if (!nextState.telemetry) nextState.telemetry = [];
      nextState.telemetry.push(winEvent);

      nextState.stateVersion++;
      this._state = nextState;
  }

  public startMission() {
      if (!this._state) return;
      const nextState = this.cloneState(this._state);
      nextState.gameStatus = 'PLAYING';
      nextState.stateVersion++;
      this._state = nextState;
  }

  public applyAction(actorId: string, action: GameAction): ValidationResult {
    if (!this._state || !this._index || !this._actionProcessor) return { ok: false, reason: "Engine Destroyed" };
    const nextState = this.cloneState(this._state);
    this._index.syncState(nextState);
    const result = this._actionProcessor.applyAction(nextState, this._index, actorId, action);
    if (result.ok) {
        nextState.stateVersion++;
        this._state = nextState;
    }
    return result;
  }
  
  public processTick(): TickResult {
    if (!this._state || !this._index) return { state: {} as any, events: [] };

    const nextState = this.cloneState(this._state);
    this._index.syncState(nextState);

    const tickEvents: GameEvent[] = [];

    // 1. Очистка старых эффектов
    const now = Date.now();
    nextState.effects = nextState.effects.filter(e => now - e.startTime < e.lifetime);

    // 2. Обновление систем
    for (const system of this._systems) {
        system.update(nextState, this._index, tickEvents);
    }

    // 3. Инъекция телеметрии (для ручных событий)
    if (nextState.telemetry && nextState.telemetry.length > 0) {
        tickEvents.push(...nextState.telemetry);
        nextState.telemetry = [];
    }

    this.enforceSafetyLimits(nextState);

    nextState.stateVersion++;
    this._state = nextState;

    return {
        state: this._state,
        events: tickEvents
    };
  }

  private enforceSafetyLimits(state: SessionState) {
      if (state.messageLog.length > SAFETY_CONFIG.MAX_LOG_SIZE) {
          state.messageLog = state.messageLog.slice(0, SAFETY_CONFIG.MAX_LOG_SIZE);
      }
      if (state.botActivityLog.length > SAFETY_CONFIG.MAX_LOG_SIZE) {
          state.botActivityLog = state.botActivityLog.slice(0, SAFETY_CONFIG.MAX_LOG_SIZE);
      }
      const entities = [state.player, ...state.bots];
      for (const ent of entities) {
          if (ent.movementQueue.length > SAFETY_CONFIG.MAX_MOVEMENT_QUEUE) {
              ent.movementQueue = ent.movementQueue.slice(0, SAFETY_CONFIG.MAX_MOVEMENT_QUEUE);
              ent.state = EntityState.IDLE; 
          }
      }
  }

  public destroy() {
    this._systems = [];
    this._index = null;
    this._state = null;
    this._actionProcessor = null;
  }
}
