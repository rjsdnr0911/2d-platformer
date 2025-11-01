// 소모성 아이템들

// 작은 하트 - HP 10 회복
class SmallHeart extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '작은 하트',
            icon: '💚',
            type: 'consumable',
            color: 0x00FF00
        });
    }

    applyEffect(player) {
        player.heal(10);

        // 아이템 획득 알림 UI 표시
        if (this.scene.itemNotificationUI) {
            const description = ItemNotificationUI.getConsumableItemDescription(this.config.name);
            this.scene.itemNotificationUI.showItemAcquired(this.config, description);
        }
    }
}

// 큰 하트 - HP 30 회복
class BigHeart extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '큰 하트',
            icon: '❤️',
            type: 'consumable',
            color: 0xFF0000
        });
    }

    applyEffect(player) {
        player.heal(30);

        // 아이템 획득 알림 UI 표시
        if (this.scene.itemNotificationUI) {
            const description = ItemNotificationUI.getConsumableItemDescription(this.config.name);
            this.scene.itemNotificationUI.showItemAcquired(this.config, description);
        }
    }
}

// 맥시멀 토마토 (Kirby) - 체력 완전 회복
class MaximalTomato extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '맥시멀 토마토',
            icon: '🍅',
            type: 'consumable',
            color: 0xFF6347
        });
    }

    applyEffect(player) {
        player.heal(player.maxHp); // 완전 회복

        // 아이템 획득 알림 UI 표시
        if (this.scene.itemNotificationUI) {
            const description = ItemNotificationUI.getConsumableItemDescription(this.config.name);
            this.scene.itemNotificationUI.showItemAcquired(this.config, description);
        }
    }
}

// 무적 사탕 (Kirby) - 5초 무적
class InvincibleCandy extends ItemBase {
    constructor(scene, x, y) {
        super(scene, x, y, {
            name: '무적 사탕',
            icon: '🍬',
            type: 'consumable',
            color: 0xFF1493
        });
    }

    applyEffect(player) {
        player.grantInvincibility(5000); // 5초 무적

        // 아이템 획득 알림 UI 표시
        if (this.scene.itemNotificationUI) {
            const description = ItemNotificationUI.getConsumableItemDescription(this.config.name);
            this.scene.itemNotificationUI.showItemAcquired(this.config, description);
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.SmallHeart = SmallHeart;
    window.BigHeart = BigHeart;
    window.MaximalTomato = MaximalTomato;
    window.InvincibleCandy = InvincibleCandy;
}
