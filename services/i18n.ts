
import { Language } from '../types';

interface Dictionary {
    MENU: {
        TITLE: string;
        SUBTITLE: string;
        CAMPAIGN: string;
        CAMPAIGN_SUB: string;
        SKIRMISH: string;
        SKIRMISH_SUB: string;
        RESUME: string;
        RESUME_SUB: string;
        LEADERBOARD: string;
        LEADERBOARD_SUB: string;
        END_SESSION: string;
        END_SESSION_SUB: string;
        EXIT: string;
        AUTH_GUEST: string;
        AUTH_LOGIN: string;
        AUTH_REGISTER: string;
        MODAL_LOGIN_TITLE: string;
        MODAL_REGISTER_TITLE: string;
        MODAL_GUEST_TITLE: string;
        BTN_LOGIN: string;
        BTN_REGISTER: string;
        BTN_GUEST: string;
        INPUT_NAME: string;
        INPUT_PASS: string;
        CONFIG_TITLE: string;
        CONFIG_SUB: string;
        DIFF_EASY: string;
        DIFF_MEDIUM: string;
        DIFF_HARD: string;
        BTN_START: string;
        BTN_CANCEL: string;
        LOGOUT_CONFIRM: string;
        ABANDON_CONFIRM: string;
    };
    HUD: {
        RANK: string;
        CYCLE: string;
        CREDITS: string;
        MOVES: string;
        LEADERBOARD_TITLE: string;
        ABORT_TITLE: string;
        ABORT_DESC: string;
        BTN_CANCEL: string;
        BTN_CONFIRM: string;
        VICTORY: string;
        DEFEAT: string;
        MISSION_COMPLETE: string;
        MISSION_FAILED: string;
        WINNER: string;
        BTN_MENU: string;
        BTN_NEXT: string;
        BTN_RETRY: string;
        BTN_VIEW_LEADERBOARD: string;
        TIME: string;
    };
    TOOLTIP: {
        CURRENT_LOC: string;
        BLOCKED: string;
        NA: string;
        REQ: string;
        OCCUPIED: string;
        PLAYER: string;
    };
    TUTORIAL: {
        WELCOME_TITLE: string;
        WELCOME_DESC: string;
        BTN_START: string;
        CAMERA_DESC: string;
        MOVE_A: string;
        MOVE_B: string;
        MOVE_CENTER: string;
        ACQUIRE: string;
        UPGRADE_L2: string;
        UPGRADE_L2_DESC: string;
        FOUNDATION_TITLE: string;
        FOUNDATION_DESC: string;
        FOUNDATION_TASK: string;
        FINAL_TITLE: string;
        FINAL_DESC: string;
        NO_POINTS_TITLE: string;
        NO_POINTS_DESC: string;
        NO_POINTS_HINT: string;
    };
    LEADERBOARD: {
        TITLE: string;
        SUBTITLE: string;
        BTN_BACK: string;
        HEADER_COMM: string;
        HEADER_CREDITS: string;
        HEADER_RANK: string;
        EMPTY: string;
    }
}

export const TEXT: Record<Language, Dictionary> = {
    EN: {
        MENU: {
            TITLE: "HexQuest",
            SUBTITLE: "Strategic Expansion Protocol",
            CAMPAIGN: "Campaign",
            CAMPAIGN_SUB: "Start Tutorial & Story",
            SKIRMISH: "Skirmish",
            SKIRMISH_SUB: "Custom Simulation",
            RESUME: "Resume Session",
            RESUME_SUB: "Return to active command",
            LEADERBOARD: "Leaderboard",
            LEADERBOARD_SUB: "Global rankings",
            END_SESSION: "End Session",
            END_SESSION_SUB: "Close current map",
            EXIT: "Exit to Desktop",
            AUTH_GUEST: "Guest",
            AUTH_LOGIN: "Login",
            AUTH_REGISTER: "Register",
            MODAL_LOGIN_TITLE: "Access Terminal",
            MODAL_REGISTER_TITLE: "New Commission",
            MODAL_GUEST_TITLE: "Guest Identity",
            BTN_LOGIN: "Authenticate",
            BTN_REGISTER: "Establish Link",
            BTN_GUEST: "Proceed as Guest",
            INPUT_NAME: "Callsign",
            INPUT_PASS: "Password",
            CONFIG_TITLE: "Mission Config",
            CONFIG_SUB: "Select Operational Parameters",
            DIFF_EASY: "Cadet",
            DIFF_MEDIUM: "Veteran",
            DIFF_HARD: "Elite",
            BTN_START: "Initialize Mission",
            BTN_CANCEL: "Cancel",
            LOGOUT_CONFIRM: "Logging out will end your current session. All progress is saved to your profile.",
            ABANDON_CONFIRM: "Are you sure you want to end this session? The map will be closed."
        },
        HUD: {
            RANK: "Rank",
            CYCLE: "Cycle",
            CREDITS: "Credits",
            MOVES: "Moves",
            LEADERBOARD_TITLE: "Rankings",
            ABORT_TITLE: "Abort Mission?",
            ABORT_DESC: "Terminating the session will disconnect from the current sector.",
            BTN_CANCEL: "Cancel",
            BTN_CONFIRM: "Confirm Exit",
            VICTORY: "VICTORY",
            DEFEAT: "DEFEAT",
            MISSION_COMPLETE: "Campaign Complete! All sectors secured. You are a legend.",
            MISSION_FAILED: "Objective Failed.",
            WINNER: "Winner",
            BTN_MENU: "Main Menu",
            BTN_NEXT: "Next Sector",
            BTN_RETRY: "Retry Sector",
            BTN_VIEW_LEADERBOARD: "View Leaderboard",
            TIME: "Time"
        },
        TOOLTIP: {
            CURRENT_LOC: "Current Location",
            BLOCKED: "BLOCKED",
            NA: "N/A",
            REQ: "REQ",
            OCCUPIED: "OCCUPIED",
            PLAYER: "PLAYER"
        },
        TUTORIAL: {
            WELCOME_TITLE: "Training Mode",
            WELCOME_DESC: "Commander, initializing manual expansion protocol. Build supports to reach high ground.",
            BTN_START: "Start Simulation",
            CAMERA_DESC: "Rotate View to Survey",
            MOVE_A: "Order Movement: Select Highlighted Sector (1, -1)",
            MOVE_B: "Expand West: Select Highlighted Sector (0, -1)",
            MOVE_CENTER: "Regroup: Return to Center (0, 0)",
            ACQUIRE: "Execute Upgrade: Claim Sector",
            UPGRADE_L2: "Establish Tier 2 Structure",
            UPGRADE_L2_DESC: "Requires L1 Supports",
            FOUNDATION_TITLE: "Phase 2: Independence",
            FOUNDATION_DESC: "To reach Level 3, the center needs three Level 2 neighbors.",
            FOUNDATION_TASK: "Objective: Upgrade 3 adjacent sectors to Level 2 to provide structural support.",
            FINAL_TITLE: "Structure Stable!",
            FINAL_DESC: "Return to the center and upgrade to Level 3 to complete mission.",
            NO_POINTS_TITLE: "Cycle Empty",
            NO_POINTS_DESC: "Missing Upgrade Point! You cannot upgrade the same hex consecutively.",
            NO_POINTS_HINT: "OBJECTIVE: Acquire a neutral sector (L0 -> L1) to generate momentum."
        },
        LEADERBOARD: {
            TITLE: "Hall of Fame",
            SUBTITLE: "Best Recorded Performance",
            BTN_BACK: "Back to Menu",
            HEADER_COMM: "Commander",
            HEADER_CREDITS: "Max Credits",
            HEADER_RANK: "Max Rank",
            EMPTY: "No records found."
        }
    },
    RU: {
        MENU: {
            TITLE: "HexQuest",
            SUBTITLE: "Протокол Расширения",
            CAMPAIGN: "Кампания",
            CAMPAIGN_SUB: "Обучение и История",
            SKIRMISH: "Схватка",
            SKIRMISH_SUB: "Настройка Симуляции",
            RESUME: "Продолжить",
            RESUME_SUB: "Вернуться в игру",
            LEADERBOARD: "Рекорды",
            LEADERBOARD_SUB: "Глобальный рейтинг",
            END_SESSION: "Завершить",
            END_SESSION_SUB: "Закрыть карту",
            EXIT: "Выход",
            AUTH_GUEST: "Гость",
            AUTH_LOGIN: "Вход",
            AUTH_REGISTER: "Рег-ция",
            MODAL_LOGIN_TITLE: "Терминал Доступа",
            MODAL_REGISTER_TITLE: "Новый Аккаунт",
            MODAL_GUEST_TITLE: "Гостевой Доступ",
            BTN_LOGIN: "Войти",
            BTN_REGISTER: "Создать",
            BTN_GUEST: "Войти как Гость",
            INPUT_NAME: "Позывной",
            INPUT_PASS: "Пароль",
            CONFIG_TITLE: "Настройка Миссии",
            CONFIG_SUB: "Выберите параметры операции",
            DIFF_EASY: "Кадет",
            DIFF_MEDIUM: "Ветеран",
            DIFF_HARD: "Элита",
            BTN_START: "Начать Миссию",
            BTN_CANCEL: "Отмена",
            LOGOUT_CONFIRM: "Выход завершит текущую сессию. Прогресс сохранен в профиле.",
            ABANDON_CONFIRM: "Вы уверены, что хотите завершить сессию? Карта будет закрыта."
        },
        HUD: {
            RANK: "Ранг",
            CYCLE: "Цикл",
            CREDITS: "Кредиты",
            MOVES: "Ходы",
            LEADERBOARD_TITLE: "Рейтинг",
            ABORT_TITLE: "Прервать Миссию?",
            ABORT_DESC: "Завершение сессии отключит вас от текущего сектора.",
            BTN_CANCEL: "Отмена",
            BTN_CONFIRM: "Выход",
            VICTORY: "ПОБЕДА",
            DEFEAT: "ПОРАЖЕНИЕ",
            MISSION_COMPLETE: "Кампания Завершена! Все сектора захвачены. Вы легенда.",
            MISSION_FAILED: "Цель провалена.",
            WINNER: "Победитель",
            BTN_MENU: "Меню",
            BTN_NEXT: "След. Сектор",
            BTN_RETRY: "Повторить",
            BTN_VIEW_LEADERBOARD: "К Рекордам",
            TIME: "Время"
        },
        TOOLTIP: {
            CURRENT_LOC: "Текущая позиция",
            BLOCKED: "ЗАБЛОКИРОВАНО",
            NA: "Н/Д",
            REQ: "ТРЕБ",
            OCCUPIED: "ЗАНЯТО",
            PLAYER: "ИГРОК"
        },
        TUTORIAL: {
            WELCOME_TITLE: "Режим Обучения",
            WELCOME_DESC: "Командир, инициализация протокола. Постройте опоры, чтобы достичь высот.",
            BTN_START: "Начать Симуляцию",
            CAMERA_DESC: "Вращение Камеры",
            MOVE_A: "Приказ: Перемещение в Сектор А (1, -1)",
            MOVE_B: "Приказ: Перемещение в Сектор Б (0, -1)",
            MOVE_CENTER: "Возврат в Центр (0, 0)",
            ACQUIRE: "Улучшить: Захватить Сектор",
            UPGRADE_L2: "Улучшить до Уровня 2",
            UPGRADE_L2_DESC: "Нужны опоры Ур.1",
            FOUNDATION_TITLE: "Фаза 2: Фундамент",
            FOUNDATION_DESC: "Для Центра Ур.3 нужны три соседа Уровня 2.",
            FOUNDATION_TASK: "Задача: Улучшите 3 соседних сектора до Уровня 2 для поддержки.",
            FINAL_TITLE: "Фундамент Готов!",
            FINAL_DESC: "Вернитесь в центр и улучшите его до Уровня 3.",
            NO_POINTS_TITLE: "Нет Очков",
            NO_POINTS_DESC: "Нет очка улучшения! Вы не можете улучшать один гекс подряд.",
            NO_POINTS_HINT: "ЦЕЛЬ: Захватите нейтральный сектор (L0 -> L1), чтобы получить импульс."
        },
        LEADERBOARD: {
            TITLE: "Зал Славы",
            SUBTITLE: "Лучшие результаты",
            BTN_BACK: "В Меню",
            HEADER_COMM: "Командир",
            HEADER_CREDITS: "Макс Кредиты",
            HEADER_RANK: "Макс Ранг",
            EMPTY: "Нет записей."
        }
    }
};
