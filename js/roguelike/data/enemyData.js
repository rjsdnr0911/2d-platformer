// 로그라이크 적 데이터 정의
const ROGUELIKE_ENEMY_DATA = {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 일반 적 (5종)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    slime: {
        name: '슬라임',
        hp: 30,
        damage: 8,
        speed: 40,
        color: 0x00FF00,
        size: 35,
        aiType: 'melee',
        aggroRange: 180,
        attackRange: 45,
        attackCooldown: 2000
    },

    goblin: {
        name: '고블린',
        hp: 40,
        damage: 12,
        speed: 80,
        color: 0x88FF00,
        size: 38,
        aiType: 'melee',
        aggroRange: 220,
        attackRange: 50,
        attackCooldown: 1500
    },

    bat: {
        name: '박쥐',
        hp: 25,
        damage: 10,
        speed: 100,
        color: 0x880088,
        size: 30,
        aiType: 'flying',
        aggroRange: 250,
        attackRange: 40,
        attackCooldown: 1800
    },

    mage: {
        name: '마법사',
        hp: 35,
        damage: 15,
        speed: 50,
        color: 0x0088FF,
        size: 36,
        aiType: 'ranged',
        aggroRange: 280,
        attackRange: 200,
        attackCooldown: 2500
    },

    archer: {
        name: '궁수',
        hp: 32,
        damage: 14,
        speed: 60,
        color: 0xFF8800,
        size: 34,
        aiType: 'ranged',
        aggroRange: 300,
        attackRange: 220,
        attackCooldown: 2000
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 보스 (1종)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    goblinKing: {
        name: '고블린 왕',
        hp: 400,
        damage: 20,
        speed: 70,
        color: 0xFFCC00,
        size: 60,
        aiType: 'melee',
        aggroRange: 400,
        attackRange: 70,
        attackCooldown: 1200,
        isBoss: true
    }
};

// 적 생성 헬퍼 함수
function createRoguelikeEnemy(scene, x, y, enemyType) {
    const config = ROGUELIKE_ENEMY_DATA[enemyType];

    if (!config) {
        console.error(`Unknown enemy type: ${enemyType}`);
        return null;
    }

    return new RoguelikeEnemy(scene, x, y, config);
}

// 랜덤 적 생성 (플로어별)
function getRandomEnemyType(floor) {
    let enemyPool;

    if (floor <= 3) {
        enemyPool = ['slime', 'goblin'];
    } else if (floor <= 7) {
        enemyPool = ['slime', 'goblin', 'bat', 'archer'];
    } else {
        enemyPool = ['goblin', 'bat', 'mage', 'archer'];
    }

    return Phaser.Utils.Array.GetRandom(enemyPool);
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.ROGUELIKE_ENEMY_DATA = ROGUELIKE_ENEMY_DATA;
    window.createRoguelikeEnemy = createRoguelikeEnemy;
    window.getRandomEnemyType = getRandomEnemyType;
}
