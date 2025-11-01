// 활 능력
class BowAbility extends AbilityBase {
    constructor(scene) {
        super(scene, '활', CONSTANTS.ABILITIES.BOW);

        this.isCharging = false;
        this.chargeStartTime = 0;
        this.maxChargeTime = 1000; // 1초 최대 차징
    }

    // 기본 공격: 빠른 화살
    _performBasicAttack() {
        if (!this.owner) return;

        // 화살 발사
        const arrow = this.createProjectile(
            40, 0,
            400, 0,  // 빠른 속도
            this.config.BASIC_DAMAGE,
            this.config.RANGE
        );

        if (arrow) {
            // 화살 모양 (작은 직사각형)
            arrow.destroy();
            const direction = this.owner.facingRight ? 1 : -1;

            const arrow2 = this.scene.add.rectangle(
                this.owner.sprite.x + (40 * direction),
                this.owner.sprite.y,
                20, 4,
                0x8B4513
            );

            this.scene.physics.add.existing(arrow2);
            arrow2.body.setAllowGravity(false);
            arrow2.body.setVelocityX(400 * direction);

            arrow2.setData('damage', this.config.BASIC_DAMAGE);
            arrow2.setData('type', 'playerAttack');
            arrow2.setData('owner', this.owner);
            arrow2.setData('startX', this.owner.sprite.x);
            arrow2.setData('range', this.config.RANGE);

            // 화살 방향
            arrow2.angle = direction > 0 ? 0 : 180;

            this.activeAttacks.push(arrow2);

            // 화살 궤적 파티클
            this.createArrowTrail(arrow2);
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('활: 빠른 화살');
        }
    }

    // 강공격: 차징 강력한 화살
    _performStrongAttack() {
        if (!this.owner) return;

        // 차징 시작
        this.isCharging = true;
        this.chargeStartTime = this.scene.time.now;

        // 차징 이펙트
        const chargeEffect = this.scene.add.circle(
            this.owner.sprite.x,
            this.owner.sprite.y,
            10,
            0x00FFFF,
            0.5
        );

        // 차징 애니메이션
        const chargeTween = this.scene.tweens.add({
            targets: chargeEffect,
            scale: 2,
            alpha: 0.8,
            duration: this.maxChargeTime,
            yoyo: true,
            repeat: -1
        });

        // 차징 완료 체크 및 이펙트 위치 업데이트
        const checkRelease = this.scene.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: () => {
                // 이펙트를 플레이어 위치로 이동
                if (chargeEffect && chargeEffect.active && this.owner) {
                    chargeEffect.x = this.owner.sprite.x;
                    chargeEffect.y = this.owner.sprite.y;
                }

                // 키를 뗐거나 최대 차징 시간 도달
                const currentTime = this.scene.time.now;
                const chargeTime = currentTime - this.chargeStartTime;

                if (!this.isCharging || chargeTime >= this.maxChargeTime) {
                    checkRelease.remove();
                    chargeTween.stop();
                    chargeEffect.destroy();

                    if (this.isCharging) {
                        this.isCharging = false;
                        this.releaseChargedArrow(chargeTime);
                    }
                }
            }
        });

        // 일정 시간 후 자동 발사
        this.scene.time.delayedCall(this.maxChargeTime, () => {
            this.isCharging = false;
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('활: 차징 시작');
        }
    }

    releaseChargedArrow(chargeTime) {
        const chargeRatio = Math.min(chargeTime / this.maxChargeTime, 1);
        const damage = this.config.STRONG_DAMAGE * (0.5 + chargeRatio * 0.5); // 50%~100%
        const size = 15 + (chargeRatio * 15); // 크기도 증가
        const speed = 500 + (chargeRatio * 300); // 속도도 증가

        const direction = this.owner.facingRight ? 1 : -1;

        const chargedArrow = this.scene.add.rectangle(
            this.owner.sprite.x + (40 * direction),
            this.owner.sprite.y,
            size * 2, size / 2,
            0xFFD700 // 골드 색상
        );

        this.scene.physics.add.existing(chargedArrow);
        chargedArrow.body.setAllowGravity(false);
        chargedArrow.body.setVelocityX(speed * direction);

        chargedArrow.setData('damage', Math.floor(damage));
        chargedArrow.setData('type', 'playerAttack');
        chargedArrow.setData('owner', this.owner);
        chargedArrow.setData('startX', this.owner.sprite.x);
        chargedArrow.setData('range', this.config.RANGE * 1.5);

        chargedArrow.angle = direction > 0 ? 0 : 180;

        // 빛나는 효과
        this.scene.tweens.add({
            targets: chargedArrow,
            alpha: 0.7,
            duration: 100,
            yoyo: true,
            repeat: -1
        });

        this.activeAttacks.push(chargedArrow);

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`활: 차징 화살 발사 (${Math.floor(chargeRatio * 100)}%)`);
        }
    }

    // 특수 스킬: 분열 화살
    _performSpecialSkill() {
        if (!this.owner) return;

        const direction = this.owner.facingRight ? 1 : -1;

        // 중앙 화살
        const mainArrow = this.createSplitArrow(0, 0, 500 * direction, 0);

        // 위아래 화살
        const topArrow = this.createSplitArrow(0, -20, 450 * direction, -100);
        const bottomArrow = this.createSplitArrow(0, 20, 450 * direction, 100);

        // 일정 거리 후 추가 분열
        this.scene.time.delayedCall(300, () => {
            this.splitArrow(mainArrow);
            this.splitArrow(topArrow);
            this.splitArrow(bottomArrow);
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('활: 분열 화살');
        }
    }

    createSplitArrow(offsetY, startOffsetY, velocityX, velocityY) {
        const direction = this.owner.facingRight ? 1 : -1;

        const arrow = this.scene.add.rectangle(
            this.owner.sprite.x + (40 * direction),
            this.owner.sprite.y + startOffsetY,
            18, 4,
            0x00FFFF
        );

        this.scene.physics.add.existing(arrow);
        arrow.body.setAllowGravity(false);
        arrow.body.setVelocity(velocityX, velocityY);

        arrow.setData('damage', this.config.SKILL_DAMAGE / 2);
        arrow.setData('type', 'playerAttack');
        arrow.setData('owner', this.owner);
        arrow.setData('startX', this.owner.sprite.x);
        arrow.setData('range', this.config.RANGE);

        arrow.angle = direction > 0 ? 0 : 180;

        this.activeAttacks.push(arrow);

        return arrow;
    }

    splitArrow(arrow) {
        if (!arrow || !arrow.active) return;

        const arrowX = arrow.x;
        const arrowY = arrow.y;
        const velocityX = arrow.body.velocity.x;

        // 원래 화살 제거는 하지 않고, 2개 추가 생성
        const split1 = this.scene.add.rectangle(
            arrowX, arrowY,
            15, 3,
            0x00FFFF
        );

        const split2 = this.scene.add.rectangle(
            arrowX, arrowY,
            15, 3,
            0x00FFFF
        );

        [split1, split2].forEach((splitArrow, index) => {
            this.scene.physics.add.existing(splitArrow);
            splitArrow.body.setAllowGravity(false);

            const angle = index === 0 ? -30 : 30;
            const radians = angle * Math.PI / 180;
            const speed = 400;

            const vx = velocityX + Math.cos(radians) * speed * (velocityX > 0 ? 1 : -1);
            const vy = Math.sin(radians) * speed * (index === 0 ? -1 : 1);

            splitArrow.body.setVelocity(vx, vy);

            splitArrow.setData('damage', this.config.SKILL_DAMAGE / 3);
            splitArrow.setData('type', 'playerAttack');
            splitArrow.setData('owner', this.owner);
            splitArrow.setData('startX', arrowX);
            splitArrow.setData('range', 150);

            this.activeAttacks.push(splitArrow);
        });
    }

    // 화살 궤적 파티클
    createArrowTrail(arrow) {
        const particleInterval = this.scene.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: () => {
                if (!arrow || !arrow.active) {
                    particleInterval.remove();
                    return;
                }

                // 화살 뒤 파티클
                for (let i = 0; i < 2; i++) {
                    const particle = this.scene.add.circle(
                        arrow.x,
                        arrow.y + (Math.random() * 6 - 3),
                        1 + Math.random(),
                        0x8B4513,
                        0.5
                    );

                    this.scene.tweens.add({
                        targets: particle,
                        alpha: 0,
                        scale: 0,
                        duration: 150,
                        onComplete: () => {
                            particle.destroy();
                        }
                    });
                }
            }
        });
    }

    // 능력 교체 시 호출
    onSwapIn() {
        if (!this.owner) return;

        // 교체 효과: 뒤로 회피 점프
        const direction = this.owner.facingRight ? -1 : 1; // 반대 방향
        this.owner.sprite.body.setVelocity(150 * direction, -200);

        // 잔상 효과
        const afterimage = this.scene.add.rectangle(
            this.owner.sprite.x,
            this.owner.sprite.y,
            CONSTANTS.PLAYER.WIDTH,
            CONSTANTS.PLAYER.HEIGHT,
            CONSTANTS.COLORS.PLAYER,
            0.5
        );

        this.scene.tweens.add({
            targets: afterimage,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                afterimage.destroy();
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('활: 교체 - 회피 점프');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.BowAbility = BowAbility;
}
