// 패시브 아이템들 (Skul 스타일 - 영구 효과)

// 신발 - 이동속도 +30%
class SpeedBoots extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '질풍의 신발',
            icon: '👟',
            type: 'passive',
            color: 0x00CED1
        });
    }

    applyEffect(player) {
        player.addPassiveItem({
            id: 'speed_boots',
            name: '질풍의 신발',
            icon: '👟',
            effect: () => {
                // 이동속도 30% 증가
                const speedBonus = CONSTANTS.PLAYER.SPEED * 0.3;
                player.speedBonus = (player.speedBonus || 0) + speedBonus;
            }
        });
    }
}

// 날개 - 점프력 +40%
class WingedBoots extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '하늘의 날개',
            icon: '🪶',
            type: 'passive',
            color: 0xFFD700
        });
    }

    applyEffect(player) {
        player.addPassiveItem({
            id: 'winged_boots',
            name: '하늘의 날개',
            icon: '🪶',
            effect: () => {
                // 점프력 40% 증가
                player.jumpBonus = (player.jumpBonus || 0) + 0.4;
            }
        });
    }
}

// 시계 - 쿨타임 -20%
class TimeClock extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '시간의 시계',
            icon: '⏰',
            type: 'passive',
            color: 0x4169E1
        });
    }

    applyEffect(player) {
        player.addPassiveItem({
            id: 'time_clock',
            name: '시간의 시계',
            icon: '⏰',
            effect: () => {
                // 쿨타임 20% 감소
                player.cooldownReduction = (player.cooldownReduction || 0) + 0.2;
            }
        });
    }
}

// 방패 - 피격 시 데미지 -30%
class IronShield extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '철의 방패',
            icon: '🛡️',
            type: 'passive',
            color: 0x708090
        });
    }

    applyEffect(player) {
        player.addPassiveItem({
            id: 'iron_shield',
            name: '철의 방패',
            icon: '🛡️',
            effect: () => {
                // 받는 데미지 30% 감소
                player.damageReduction = (player.damageReduction || 0) + 0.3;
            }
        });
    }
}

// 반지 - 최대 HP +20
class HealthRing extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '생명의 반지',
            icon: '💍',
            type: 'passive',
            color: 0xFF69B4
        });
    }

    applyEffect(player) {
        player.addPassiveItem({
            id: 'health_ring',
            name: '생명의 반지',
            icon: '💍',
            effect: () => {
                // 최대 HP 20 증가
                player.maxHp += 20;
                player.hp = Math.min(player.hp + 20, player.maxHp); // 현재 HP도 20 증가
            }
        });
    }
}

// 보석 - 대시 쿨타임 -40%
class DashGem extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '신속의 보석',
            icon: '💎',
            type: 'passive',
            color: 0x9370DB
        });
    }

    applyEffect(player) {
        player.addPassiveItem({
            id: 'dash_gem',
            name: '신속의 보석',
            icon: '💎',
            effect: () => {
                // 대시 쿨타임 40% 감소
                player.dashCooldownReduction = (player.dashCooldownReduction || 0) + 0.4;
            }
        });
    }
}

// 망토 - 무적 시간 +50%
class PhantomCloak extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '환영의 망토',
            icon: '🧥',
            type: 'passive',
            color: 0x800080
        });
    }

    applyEffect(player) {
        player.addPassiveItem({
            id: 'phantom_cloak',
            name: '환영의 망토',
            icon: '🧥',
            effect: () => {
                // 무적 시간 50% 증가
                player.invincibilityBonus = (player.invincibilityBonus || 0) + 0.5;
            }
        });
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.SpeedBoots = SpeedBoots;
    window.WingedBoots = WingedBoots;
    window.TimeClock = TimeClock;
    window.IronShield = IronShield;
    window.HealthRing = HealthRing;
    window.DashGem = DashGem;
    window.PhantomCloak = PhantomCloak;
}
