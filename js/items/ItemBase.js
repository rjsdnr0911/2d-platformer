// 아이템 베이스 클래스
class ItemBase {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.config = config;
        this.isActive = true;

        // 아이템 스프라이트 생성
        this.sprite = scene.add.circle(x, y, 12, config.color, 0.8);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setAllowGravity(true);
        this.sprite.body.setBounce(0.3);
        this.sprite.body.setCollideWorldBounds(true);

        // 아이템 데이터 저장
        this.sprite.setData('item', this);
        this.sprite.setData('type', 'item');
        this.sprite.setData('itemType', config.type);

        // 떨어지는 효과
        this.sprite.body.setVelocity(
            Phaser.Math.Between(-50, 50),
            -150
        );

        // 깜빡임 효과
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 400,
            yoyo: true,
            repeat: -1
        });

        // 아이콘 텍스트 (아이템 위에 표시)
        this.iconText = scene.add.text(x, y - 20, config.icon, {
            fontSize: '20px'
        });
        this.iconText.setOrigin(0.5);
    }

    // 아이템 획득 시 호출
    onPickup(player) {
        if (CONSTANTS.GAME.DEBUG) {
            console.log('아이템 획득:', this.config.name);
        }

        // 아이템 효과음 (나중에 추가)
        // this.scene.sound.play('item_pickup');

        // 획득 효과
        this.playPickupEffect();

        // 아이템 적용
        this.applyEffect(player);

        // 아이템 제거
        this.destroy();
    }

    playPickupEffect() {
        // 반짝이는 효과 (여러 겹)
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                const flash = this.scene.add.circle(
                    this.sprite.x,
                    this.sprite.y,
                    15 + i * 5,
                    0xFFFF00,
                    0.8 - i * 0.2
                );

                this.scene.tweens.add({
                    targets: flash,
                    scale: 2.5,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => {
                        flash.destroy();
                    }
                });
            });
        }

        // 반짝이 파티클 (별 모양)
        for (let i = 0; i < 8; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                const angle = (Math.PI * 2 * i) / 8;
                const distance = 30 + Math.random() * 20;

                const star = this.scene.add.star(
                    this.sprite.x,
                    this.sprite.y,
                    4,
                    4,
                    8,
                    0xFFFFFF,
                    1
                );

                this.scene.tweens.add({
                    targets: star,
                    x: this.sprite.x + Math.cos(angle) * distance,
                    y: this.sprite.y + Math.sin(angle) * distance,
                    alpha: 0,
                    scale: 0.5,
                    angle: 720,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        star.destroy();
                    }
                });
            });
        }

        // 획득 텍스트
        const pickupText = this.scene.add.text(
            this.sprite.x,
            this.sprite.y - 30,
            this.config.name,
            {
                fontSize: '16px',
                fill: '#ffff00',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4
            }
        );
        pickupText.setOrigin(0.5);

        this.scene.tweens.add({
            targets: pickupText,
            y: pickupText.y - 40,
            scale: 1.2,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                pickupText.destroy();
            }
        });
    }

    // 하위 클래스에서 구현
    applyEffect(player) {
        console.warn('ItemBase.applyEffect: 하위 클래스에서 구현 필요');
    }

    update() {
        // 아이콘 텍스트를 아이템 위치에 맞춰 업데이트
        if (this.iconText && this.sprite) {
            this.iconText.setPosition(this.sprite.x, this.sprite.y - 20);
        }
    }

    destroy() {
        this.isActive = false;

        if (this.iconText) {
            this.iconText.destroy();
        }

        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.ItemBase = ItemBase;
}
