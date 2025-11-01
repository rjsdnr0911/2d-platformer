// 아이템 획득 알림 UI (화면 중앙)
class ItemNotificationUI {
    constructor(scene) {
        this.scene = scene;
        this.isShowing = false;
        this.currentNotification = null;
    }

    // 아이템 획득 알림 표시
    showItemAcquired(itemConfig, description) {
        // 이미 표시 중이면 무시 (큐 시스템은 나중에 추가 가능)
        if (this.isShowing) {
            return;
        }

        this.isShowing = true;

        // 화면 중앙 위치
        const centerX = CONSTANTS.GAME.WIDTH / 2;
        const centerY = CONSTANTS.GAME.HEIGHT / 2;

        // 배경 패널 (어두운 반투명)
        const bgPanel = this.scene.add.rectangle(
            centerX,
            centerY,
            500,
            180,
            0x000000,
            0.85
        );
        bgPanel.setScrollFactor(0);
        bgPanel.setDepth(2000);
        bgPanel.setStrokeStyle(4, 0xFFD700); // 금색 테두리

        // 금빛 반짝임 효과 (배경 레이어)
        const sparkles = [];
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const distance = 120 + Math.random() * 40;

            const sparkle = this.scene.add.star(
                centerX + Math.cos(angle) * distance,
                centerY + Math.sin(angle) * distance,
                5,
                6,
                12,
                0xFFD700,
                0.8
            );
            sparkle.setScrollFactor(0);
            sparkle.setDepth(1999);
            sparkles.push(sparkle);

            // 반짝임 회전 애니메이션
            this.scene.tweens.add({
                targets: sparkle,
                angle: 360,
                scale: { from: 0.5, to: 1.5 },
                alpha: { from: 0.8, to: 0 },
                duration: 1500,
                ease: 'Power2'
            });
        }

        // 아이템 아이콘 (크게)
        const iconText = this.scene.add.text(
            centerX,
            centerY - 40,
            itemConfig.icon,
            {
                fontSize: '64px'
            }
        );
        iconText.setOrigin(0.5);
        iconText.setScrollFactor(0);
        iconText.setDepth(2001);

        // 아이콘 펄스 애니메이션
        this.scene.tweens.add({
            targets: iconText,
            scale: { from: 0.5, to: 1.2 },
            duration: 300,
            ease: 'Back.easeOut'
        });

        // 아이템 이름
        const nameText = this.scene.add.text(
            centerX,
            centerY + 30,
            itemConfig.name,
            {
                fontSize: '28px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 5
            }
        );
        nameText.setOrigin(0.5);
        nameText.setScrollFactor(0);
        nameText.setDepth(2001);

        // 이름 슬라이드 애니메이션
        nameText.setAlpha(0);
        this.scene.tweens.add({
            targets: nameText,
            alpha: 1,
            y: centerY + 30,
            duration: 400,
            delay: 200,
            ease: 'Power2'
        });

        // 효과 설명
        const descText = this.scene.add.text(
            centerX,
            centerY + 65,
            description,
            {
                fontSize: '18px',
                fill: '#FFFFFF',
                fontStyle: 'italic',
                stroke: '#000',
                strokeThickness: 3,
                align: 'center'
            }
        );
        descText.setOrigin(0.5);
        descText.setScrollFactor(0);
        descText.setDepth(2001);

        // 설명 페이드인
        descText.setAlpha(0);
        this.scene.tweens.add({
            targets: descText,
            alpha: 1,
            y: centerY + 65,
            duration: 400,
            delay: 400,
            ease: 'Power2'
        });

        // 금빛 파티클 효과 (추가)
        for (let i = 0; i < 20; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                const particle = this.scene.add.circle(
                    centerX + (Math.random() - 0.5) * 300,
                    centerY + (Math.random() - 0.5) * 100,
                    3,
                    0xFFD700,
                    1
                );
                particle.setScrollFactor(0);
                particle.setDepth(2000);

                this.scene.tweens.add({
                    targets: particle,
                    y: particle.y - 50,
                    alpha: 0,
                    scale: 0,
                    duration: 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }

        // 2초 후 페이드아웃
        this.scene.time.delayedCall(2000, () => {
            // 모든 UI 요소 페이드아웃
            const allElements = [bgPanel, iconText, nameText, descText, ...sparkles];

            this.scene.tweens.add({
                targets: allElements,
                alpha: 0,
                scale: 0.8,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    // 모든 요소 제거
                    allElements.forEach(element => {
                        if (element && element.destroy) {
                            element.destroy();
                        }
                    });

                    this.isShowing = false;
                    this.currentNotification = null;
                }
            });
        });

        // 현재 알림 저장
        this.currentNotification = {
            bgPanel,
            iconText,
            nameText,
            descText,
            sparkles
        };
    }

    // 패시브 아이템 획득 시 설명 생성
    static getPassiveItemDescription(itemId) {
        const descriptions = {
            'speed_boots': '💨 이동속도 +30%',
            'winged_boots': '🪽 점프력 +40%',
            'time_clock': '⏱️ 쿨타임 -20%',
            'iron_shield': '🛡️ 받는 피해 -30%',
            'health_ring': '❤️ 최대 HP +20',
            'dash_gem': '⚡ 대시 쿨타임 -40%',
            'phantom_cloak': '👻 무적 시간 +50%'
        };

        return descriptions[itemId] || '✨ 특별한 효과!';
    }

    // 소비 아이템 획득 시 설명 생성
    static getConsumableItemDescription(itemName) {
        const descriptions = {
            '작은 하트': '❤️ HP +10 회복',
            '큰 하트': '💚 HP +30 회복',
            '맥시멀 토마토': '🍅 HP 완전 회복',
            '무적 사탕': '⭐ 3초간 무적'
        };

        return descriptions[itemName] || '✨ 회복 아이템!';
    }

    destroy() {
        if (this.currentNotification) {
            const { bgPanel, iconText, nameText, descText, sparkles } = this.currentNotification;

            if (bgPanel) bgPanel.destroy();
            if (iconText) iconText.destroy();
            if (nameText) nameText.destroy();
            if (descText) descText.destroy();
            if (sparkles) {
                sparkles.forEach(s => s.destroy());
            }

            this.currentNotification = null;
        }
        this.isShowing = false;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.ItemNotificationUI = ItemNotificationUI;
}
