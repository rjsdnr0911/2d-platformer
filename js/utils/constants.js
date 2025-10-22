// 게임 상수 정의
const CONSTANTS = {
    // 게임 설정
    GAME: {
        WIDTH: 800,
        HEIGHT: 600,
        GRAVITY: 800,
        DEBUG: true
    },

    // 월드 설정
    WORLD: {
        WIDTH: 3200,
        HEIGHT: 600
    },

    // 플레이어 설정
    PLAYER: {
        WIDTH: 32,
        HEIGHT: 48,
        MAX_HP: 50, // 하트 5개 * 10HP
        SPEED: 200,
        JUMP_VELOCITY: -400,
        DOUBLE_JUMP_VELOCITY: -350, // 2단 점프는 조금 낮게
        MAX_JUMPS: 2, // 최대 점프 횟수 (더블 점프)
        DASH_VELOCITY: 400,
        DASH_DURATION: 200, // ms
        DASH_COOLDOWN: 1000, // ms
        INVINCIBLE_TIME: 1000, // ms (피격 후 무적)
        BOUNCE: 0.1,
        DRAG: 400,
        MAX_VELOCITY_X: 300,
        MAX_VELOCITY_Y: 1000
    },

    // 능력 설정
    ABILITIES: {
        SWORD: {
            BASIC_DAMAGE: 10,
            STRONG_DAMAGE: 25,
            SKILL_DAMAGE: 30,
            BASIC_COOLDOWN: 0,
            STRONG_COOLDOWN: 1000,
            SKILL_COOLDOWN: 3000,
            RANGE: 50
        },
        MAGIC: {
            BASIC_DAMAGE: 8,
            STRONG_DAMAGE: 20,
            SKILL_DAMAGE: 35,
            BASIC_COOLDOWN: 300,
            STRONG_COOLDOWN: 2000,
            SKILL_COOLDOWN: 5000,
            RANGE: 200
        },
        HAMMER: {
            BASIC_DAMAGE: 20,
            STRONG_DAMAGE: 40,
            SKILL_DAMAGE: 50,
            BASIC_COOLDOWN: 800,
            STRONG_COOLDOWN: 2500,
            SKILL_COOLDOWN: 6000,
            RANGE: 60
        },
        BOW: {
            BASIC_DAMAGE: 12,
            STRONG_DAMAGE: 30,
            SKILL_DAMAGE: 40,
            BASIC_COOLDOWN: 200,
            STRONG_COOLDOWN: 1500,
            SKILL_COOLDOWN: 4000,
            RANGE: 300
        }
    },

    // 적 설정
    ENEMIES: {
        SLIME: {
            WIDTH: 32,
            HEIGHT: 32,
            HP: 20,
            DAMAGE: 10,
            SPEED: 50,
            COLOR: 0x00FF00
        },
        SWORD_ENEMY: {
            WIDTH: 36,
            HEIGHT: 48,
            HP: 40,
            DAMAGE: 15,
            SPEED: 80,
            COLOR: 0xFF4444
        },
        MAGE: {
            WIDTH: 36,
            HEIGHT: 48,
            HP: 30,
            DAMAGE: 12,
            SPEED: 60,
            COLOR: 0x8844FF
        }
    },

    // 키 설정
    KEYS: {
        MOVE_LEFT: 'LEFT',
        MOVE_RIGHT: 'RIGHT',
        JUMP: 'UP',
        BASIC_ATTACK: 'Z',
        STRONG_ATTACK: 'X',
        SPECIAL_SKILL: 'C',
        DASH: 'SHIFT',
        ABILITY_SWAP_1: 'Q',
        ABILITY_SWAP_2: 'E',
        INTERACT: 'SPACE',
        PAUSE: 'ESC'
    },

    // 색상
    COLORS: {
        PLAYER: 0xFF6B6B,
        GROUND: 0x2d4a2b,
        PLATFORM: 0x8B4513,
        SKY: 0x87CEEB,
        HEALTH_BAR_BG: 0x333333,
        HEALTH_BAR_FILL: 0xFF0000,
        DAMAGE_FLASH: 0xFFFFFF
    }
};

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.CONSTANTS = CONSTANTS;
}
