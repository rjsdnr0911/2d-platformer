// 해머 능력
class HammerAbility extends AbilityBase {
    constructor(scene) {
        super(scene, '해머', CONSTANTS.ABILITIES.HAMMER);
    }

    // 기본 공격: 강한 내려찍기
    _performBasicAttack() {
        if (!this.owner) return;

        // 느리지만 강한 공격
        const hitbox = this.createMeleeHitbox(
            35, 10,  // 위치
            50, 60,  // 크기 (크고 길쭉)
            this.config.BASIC_DAMAGE,
            300      // 긴 지속 시간
        );

        // 해머 스윙 애니메이션 (위에서 아래로)
        this.scene.tweens.add({
            targets: this.owner.sprite,
            angle: this.owner.facingRight ? 45 : -45,
            duration: 100,
            yoyo: true
        });

        // 지면 충격 효과
        if (this.owner.sprite.body.touching.down) {
            const shockwave = this.scene.add.circle(
                this.owner.sprite.x + (this.owner.facingRight ? 40 : -40),
                this.owner.sprite.y + 30,
                20,
                0x888888,
                0.5
            );

            this.scene.tweens.add({
                targets: shockwave,
                scaleX: 2,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    shockwave.destroy();
                }
            });

            // 충격파 파티클
            this.createGroundHitParticles(shockwave.x, shockwave.y);
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('해머: 내려찍기');
        }
    }

    // 강공격: 지면 충격파
    _performStrongAttack() {
        if (!this.owner) return;

        // 플레이어를 약간 위로
        this.owner.sprite.body.setVelocityY(-150);

        // 착지 후 충격파
        const checkLanding = this.scene.time.addEvent({
            delay: 100,
            repeat: -1,
            callback: () => {
                if (this.owner.sprite.body.touching.down) {
                    checkLanding.remove();
                    this.createShockwave();
                }
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('해머: 지면 충격파');
        }
    }

    createShockwave() {
        const playerX = this.owner.sprite.x;
        const playerY = this.owner.sprite.y;

        // 양쪽으로 퍼지는 충격파
        const shockwaveDistance = 120;

        // 왼쪽 충격파
        const leftWave = this.scene.add.rectangle(
            playerX - shockwaveDistance / 2,
            playerY + 10,
            shockwaveDistance,
            40,
            0x888888,
            0.5
        );

        this.scene.physics.add.existing(leftWave);
        leftWave.body.setAllowGravity(false);
        leftWave.body.setImmovable(true);

        leftWave.setData('damage', this.config.STRONG_DAMAGE);
        leftWave.setData('type', 'playerAttack');
        leftWave.setData('owner', this.owner);

        this.activeAttacks.push(leftWave);

        // 오른쪽 충격파
        const rightWave = this.scene.add.rectangle(
            playerX + shockwaveDistance / 2,
            playerY + 10,
            shockwaveDistance,
            40,
            0x888888,
            0.5
        );

        this.scene.physics.add.existing(rightWave);
        rightWave.body.setAllowGravity(false);
        rightWave.body.setImmovable(true);

        rightWave.setData('damage', this.config.STRONG_DAMAGE);
        rightWave.setData('type', 'playerAttack');
        rightWave.setData('owner', this.owner);

        this.activeAttacks.push(rightWave);

        // 충격파 애니메이션
        [leftWave, rightWave].forEach(wave => {
            this.scene.tweens.add({
                targets: wave,
                scaleX: 1.5,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (wave && wave.active) {
                        wave.destroy();
                    }
                }
            });
        });

        // 화면 흔들림
        this.scene.cameras.main.shake(200, 0.005);
    }

    // 특수 스킬: 점프 후 낙하 공격
    _performSpecialSkill() {
        if (!this.owner) return;

        // 플레이어를 높이 띄움
        this.owner.sprite.body.setVelocityY(-500);
        this.owner.isInvincible = true;

        // 스킬 상태 표시
        this.owner.sprite.setTint(0xFFFF00);

        // 최고점 도달 시 빠르게 낙하
        const checkPeak = this.scene.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: () => {
                if (this.owner.sprite.body.velocity.y > 0) {
                    checkPeak.remove();

                    // 빠른 낙하
                    this.owner.sprite.body.setVelocityY(700);

                    // 낙하 중 히트박스
                    const fallingInterval = this.scene.time.addEvent({
                        delay: 50,
                        repeat: -1,
                        callback: () => {
                            if (this.owner.sprite.body.touching.down) {
                                fallingInterval.remove();
                                this.createMassiveShockwave();
                            } else {
                                // 낙하 중 타격
                                this.createMeleeHitbox(
                                    0, 20,
                                    60, 60,
                                    this.config.SKILL_DAMAGE / 4,
                                    100
                                );
                            }
                        }
                    });
                }
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('해머: 점프 낙하 공격');
        }
    }

    createMassiveShockwave() {
        this.owner.isInvincible = false;
        this.owner.sprite.clearTint();

        const playerX = this.owner.sprite.x;
        const playerY = this.owner.sprite.y;

        // 거대한 충격파
        const shockwaveRadius = 150;

        // 중앙 타격
        const centerHit = this.scene.add.circle(
            playerX,
            playerY,
            shockwaveRadius,
            0xFF6600,
            0.4
        );

        this.scene.physics.add.existing(centerHit);
        centerHit.body.setAllowGravity(false);
        centerHit.body.setImmovable(true);

        centerHit.setData('damage', this.config.SKILL_DAMAGE);
        centerHit.setData('type', 'playerAttack');
        centerHit.setData('owner', this.owner);

        if (!CONSTANTS.GAME.DEBUG) {
            centerHit.setAlpha(0);
        }

        this.activeAttacks.push(centerHit);

        // 폭발 이펙트
        const explosion = this.scene.add.circle(
            playerX,
            playerY,
            0,
            0xFF8800,
            0.6
        );

        this.scene.tweens.add({
            targets: explosion,
            radius: shockwaveRadius,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                explosion.destroy();
            }
        });

        // 중앙 히트박스 제거
        this.scene.time.delayedCall(200, () => {
            if (centerHit && centerHit.active) {
                centerHit.destroy();
            }
        });

        // 강한 화면 흔들림
        this.scene.cameras.main.shake(400, 0.01);

        // 거대 충격파 파티클
        this.createMassiveShockParticles(playerX, playerY);
    }

    // 지면 타격 파티클
    createGroundHitParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            const particle = this.scene.add.circle(
                x + (Math.random() * 30 - 15),
                y + (Math.random() * 10 - 5),
                2 + Math.random() * 2,
                0x888888,
                0.7
            );

            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 20 - Math.random() * 20,
                x: particle.x + (Math.random() * 40 - 20),
                alpha: 0,
                scale: 0,
                duration: 300 + Math.random() * 200,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    // 거대 충격파 파티클
    createMassiveShockParticles(x, y) {
        // 폭발 링
        for (let r = 0; r < 3; r++) {
            const radius = 50 + r * 40;
            const delay = r * 100;

            this.scene.time.delayedCall(delay, () => {
                const ring = this.scene.add.circle(x, y, radius, 0xFF8800, 0.3);
                this.scene.tweens.add({
                    targets: ring,
                    scale: 1.5,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        ring.destroy();
                    }
                });
            });
        }

        // 파편 파티클
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;

            const particle = this.scene.add.circle(
                x,
                y,
                3 + Math.random() * 3,
                Math.random() > 0.5 ? 0x888888 : 0xFFAA00,
                0.8
            );

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 500 + Math.random() * 300,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    // 능력 교체 시 호출
    onSwapIn() {
        if (!this.owner) return;

        // 교체 효과: 폭발 충격파
        const playerX = this.owner.sprite.x;
        const playerY = this.owner.sprite.y;

        const shockwave = this.scene.add.circle(
            playerX,
            playerY,
            80,
            0xFF6600,
            0.4
        );

        this.scene.physics.add.existing(shockwave);
        shockwave.body.setAllowGravity(false);
        shockwave.body.setImmovable(true);

        shockwave.setData('damage', 10);
        shockwave.setData('type', 'playerAttack');
        shockwave.setData('owner', this.owner);

        this.activeAttacks.push(shockwave);

        this.scene.tweens.add({
            targets: shockwave,
            scale: 1.3,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                if (shockwave && shockwave.active) {
                    shockwave.destroy();
                }
            }
        });

        this.scene.cameras.main.shake(150, 0.003);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('해머: 교체 - 충격파');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.HammerAbility = HammerAbility;
}
