// 마법 능력
class MagicAbility extends AbilityBase {
    constructor(scene) {
        super(scene, '마법', CONSTANTS.ABILITIES.MAGIC);
    }

    // 기본 공격: 원거리 화염구
    _performBasicAttack() {
        if (!this.owner) return;

        // 화염구 발사
        const fireball = this.createProjectile(
            40, 0,           // 오프셋
            300, 0,          // 속도 (수평)
            this.config.BASIC_DAMAGE,
            this.config.RANGE
        );

        if (fireball) {
            // 화염구 효과 (주황색)
            fireball.setFillStyle(0xFF6600);

            // 화염구 회전
            this.scene.tweens.add({
                targets: fireball,
                angle: 360,
                duration: 500,
                repeat: -1
            });
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('마법: 화염구 발사');
        }
    }

    // 강공격: 3방향 화염 기둥
    _performStrongAttack() {
        if (!this.owner) return;

        const playerX = this.owner.sprite.x;
        const playerY = this.owner.sprite.y;
        const direction = this.owner.facingRight ? 1 : -1;

        // 3개의 화염 기둥 생성 (앞쪽 부채꼴)
        const angles = [-30, 0, 30]; // 각도
        const distance = 80;

        angles.forEach((angle, index) => {
            const radians = (angle * direction) * Math.PI / 180;
            const offsetX = Math.cos(radians) * distance;
            const offsetY = Math.sin(radians) * distance;

            // 화염 기둥 생성
            const pillar = this.scene.add.rectangle(
                playerX + offsetX,
                playerY + offsetY,
                30,
                100,
                0xFF3300,
                0.7
            );

            // 물리 바디
            this.scene.physics.add.existing(pillar);
            pillar.body.setAllowGravity(false);
            pillar.body.setImmovable(true);

            pillar.setData('damage', this.config.STRONG_DAMAGE);
            pillar.setData('type', 'playerAttack');
            pillar.setData('owner', this.owner);

            this.activeAttacks.push(pillar);

            // 화염 기둥 애니메이션 (솟아오름)
            pillar.setScale(1, 0);
            this.scene.tweens.add({
                targets: pillar,
                scaleY: 1,
                duration: 150,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    // 잠시 유지 후 사라짐
                    this.scene.time.delayedCall(200, () => {
                        this.scene.tweens.add({
                            targets: pillar,
                            alpha: 0,
                            scaleY: 0.5,
                            duration: 100,
                            onComplete: () => {
                                if (pillar && pillar.active) {
                                    pillar.destroy();
                                }
                            }
                        });
                    });
                }
            });
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('마법: 3방향 화염 기둥');
        }
    }

    // 특수 스킬: 주변 불폭풍
    _performSpecialSkill() {
        if (!this.owner) return;

        const playerX = this.owner.sprite.x;
        const playerY = this.owner.sprite.y;

        // 폭발 범위
        const explosionRadius = 150;

        // 시각 효과 (확장하는 원)
        const explosion = this.scene.add.circle(
            playerX,
            playerY,
            0,
            0xFF0000,
            0.5
        );

        this.scene.tweens.add({
            targets: explosion,
            radius: explosionRadius,
            alpha: 0,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                explosion.destroy();
            }
        });

        // 여러 개의 작은 화염구가 사방으로 퍼짐
        const fireballCount = 12;
        for (let i = 0; i < fireballCount; i++) {
            const angle = (360 / fireballCount) * i;
            const radians = angle * Math.PI / 180;

            const velocityX = Math.cos(radians) * 200;
            const velocityY = Math.sin(radians) * 200;

            // 화염구 생성
            const fireball = this.scene.add.circle(
                playerX,
                playerY,
                6,
                0xFF6600
            );

            this.scene.physics.add.existing(fireball);
            fireball.body.setAllowGravity(false);
            fireball.body.setVelocity(velocityX, velocityY);

            fireball.setData('damage', this.config.SKILL_DAMAGE / 2); // 여러 번 맞을 수 있으니 낮춤
            fireball.setData('type', 'playerAttack');
            fireball.setData('owner', this.owner);
            fireball.setData('startX', playerX);
            fireball.setData('range', explosionRadius);

            this.activeAttacks.push(fireball);

            // 화염구 회전
            this.scene.tweens.add({
                targets: fireball,
                angle: 360,
                duration: 300,
                repeat: -1
            });
        }

        // 중앙 히트박스 (큰 데미지)
        const centerHitbox = this.scene.add.circle(
            playerX,
            playerY,
            explosionRadius,
            0xFF0000,
            0.3
        );

        this.scene.physics.add.existing(centerHitbox);
        centerHitbox.body.setAllowGravity(false);
        centerHitbox.body.setImmovable(true);

        centerHitbox.setData('damage', this.config.SKILL_DAMAGE);
        centerHitbox.setData('type', 'playerAttack');
        centerHitbox.setData('owner', this.owner);

        if (!CONSTANTS.GAME.DEBUG) {
            centerHitbox.setAlpha(0);
        }

        this.activeAttacks.push(centerHitbox);

        // 중앙 히트박스 제거
        this.scene.time.delayedCall(300, () => {
            if (centerHitbox && centerHitbox.active) {
                centerHitbox.destroy();
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('마법: 불폭풍');
        }
    }

    // 능력 교체 시 호출
    onSwapIn() {
        if (!this.owner) return;

        // 교체 효과: 순간이동 (짧은 거리)
        const teleportDistance = 80;
        const direction = this.owner.facingRight ? 1 : -1;
        const newX = this.owner.sprite.x + (teleportDistance * direction);

        // 텔레포트 이펙트 (시작 위치)
        const startEffect = this.scene.add.circle(
            this.owner.sprite.x,
            this.owner.sprite.y,
            30,
            0x8844FF,
            0.7
        );

        this.scene.tweens.add({
            targets: startEffect,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => {
                startEffect.destroy();
            }
        });

        // 플레이어 이동
        this.owner.sprite.x = newX;

        // 텔레포트 이펙트 (도착 위치)
        const endEffect = this.scene.add.circle(
            this.owner.sprite.x,
            this.owner.sprite.y,
            30,
            0x8844FF,
            0.7
        );

        this.scene.tweens.add({
            targets: endEffect,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => {
                endEffect.destroy();
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('마법: 교체 - 순간이동');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.MagicAbility = MagicAbility;
}
