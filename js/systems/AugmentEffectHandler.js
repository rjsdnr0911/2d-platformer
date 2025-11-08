// 증강 효과 핸들러 - 실제 증강 효과 구현
class AugmentEffectHandler {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.activeEffects = [];
        this.timers = [];
        this.particles = [];

        // 증강별 업데이트 함수
        this.updateFunctions = new Map();
    }

    // 증강 효과 활성화
    activateAugment(augment) {
        if (!augment || !augment.effectHandler) return;

        try {
            // 증강 효과 실행
            const effectData = augment.effectHandler(this.scene, this.player, this);

            if (effectData) {
                this.activeEffects.push({
                    augmentId: augment.id,
                    name: augment.name,
                    data: effectData
                });

                // 업데이트 함수 등록
                if (effectData.update) {
                    this.updateFunctions.set(augment.id, effectData.update);
                }

                if (CONSTANTS.GAME.DEBUG) {
                    console.log(`증강 효과 활성화: ${augment.name}`);
                }
            }

            return true;
        } catch (error) {
            console.error(`증강 효과 활성화 실패: ${augment.name}`, error);
            return false;
        }
    }

    // 매 프레임 업데이트
    update() {
        // 모든 활성 증강의 업데이트 함수 실행
        this.updateFunctions.forEach((updateFn, augmentId) => {
            try {
                updateFn();
            } catch (error) {
                console.error(`증강 업데이트 오류: ${augmentId}`, error);
            }
        });
    }

    // ========== 검술 전용 증강 효과 ==========

    // 검기 발사
    swordBeam() {
        const originalAttack = this.player.getCurrentAbility().basicAttack;

        this.player.getCurrentAbility().basicAttack = () => {
            // 기본 공격 실행
            originalAttack.call(this.player.getCurrentAbility());

            // 검기 발사
            const beam = this.scene.add.rectangle(
                this.player.sprite.x + (this.player.facingRight ? 30 : -30),
                this.player.sprite.y,
                40, 10,
                0x00FFFF
            );
            this.scene.physics.add.existing(beam);
            beam.body.setAllowGravity(false);
            beam.body.setVelocityX(this.player.facingRight ? 600 : -600);
            beam.setData('damage', 15);
            beam.setData('type', 'playerAttack');

            // 검기 이펙트
            const particles = this.scene.add.particles(beam.x, beam.y, 'particle', {
                speed: { min: 50, max: 100 },
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 300,
                tint: 0x00FFFF
            });

            // 적과 충돌 처리
            this.scene.physics.add.overlap(beam, this.scene.boss?.sprite, (beamObj, bossSprite) => {
                const bossEntity = bossSprite.getData('entity');
                if (bossEntity && bossEntity.isAlive) {
                    bossEntity.takeDamage(beamObj.getData('damage'));
                    beamObj.destroy();
                    particles.destroy();
                }
            });

            // 3초 후 자동 제거
            this.scene.time.delayedCall(3000, () => {
                if (beam.active) beam.destroy();
                if (particles.active) particles.destroy();
            });
        };

        return {
            update: () => {}
        };
    }

    // 회오리 베기
    whirlwindSlash() {
        // Z+X 동시 입력 시 회오리 베기
        let lastWhirlwindTime = 0;
        const whirlwindCooldown = 5000;

        return {
            update: () => {
                if (!this.scene.keys) return;

                const now = Date.now();
                if (this.scene.keys.basicAttack.isDown &&
                    this.scene.keys.strongAttack.isDown &&
                    now - lastWhirlwindTime > whirlwindCooldown) {

                    lastWhirlwindTime = now;
                    this.executeWhirlwind();
                }
            }
        };
    }

    executeWhirlwind() {
        // 회전 이펙트
        const whirlwind = this.scene.add.sprite(this.player.sprite.x, this.player.sprite.y, 'player_idle');
        whirlwind.setAlpha(0.5);
        whirlwind.setTint(0xFF0000);

        this.scene.tweens.add({
            targets: whirlwind,
            angle: 720,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => whirlwind.destroy()
        });

        // 주변 원형 범위 공격
        const attackRadius = 150;
        const attackCircle = this.scene.add.circle(
            this.player.sprite.x,
            this.player.sprite.y,
            attackRadius,
            0xFF0000,
            0.3
        );
        this.scene.physics.add.existing(attackCircle);
        attackCircle.body.setAllowGravity(false);

        // 보스와 충돌 체크
        if (this.scene.boss && this.scene.boss.isAlive) {
            const distance = Phaser.Math.Distance.Between(
                this.player.sprite.x,
                this.player.sprite.y,
                this.scene.boss.sprite.x,
                this.scene.boss.sprite.y
            );

            if (distance < attackRadius) {
                this.scene.boss.takeDamage(30);
            }
        }

        this.scene.time.delayedCall(500, () => {
            attackCircle.destroy();
        });
    }

    // 반격 자세
    counterStance() {
        const originalTakeDamage = this.player.takeDamage.bind(this.player);
        let lastCounterTime = 0;

        this.player.takeDamage = (damage, attacker) => {
            const now = Date.now();

            // 30% 확률로 반격
            if (Math.random() < 0.3 && now - lastCounterTime > 1000) {
                lastCounterTime = now;

                // 반격 텍스트
                const counterText = this.scene.add.text(
                    this.player.sprite.x,
                    this.player.sprite.y - 50,
                    'COUNTER!',
                    {
                        fontSize: '28px',
                        fill: '#FF0000',
                        fontStyle: 'bold',
                        stroke: '#000',
                        strokeThickness: 4
                    }
                );
                counterText.setOrigin(0.5);

                this.scene.tweens.add({
                    targets: counterText,
                    y: counterText.y - 30,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => counterText.destroy()
                });

                // 피해 무효화하고 반격
                if (attacker && attacker.takeDamage) {
                    attacker.takeDamage(damage * 2);
                }
                return;
            }

            // 일반 피해 처리
            originalTakeDamage(damage, attacker);
        };

        return { update: () => {} };
    }

    // ========== 마법 전용 증강 효과 ==========

    // 연쇄 번개
    chainLightning() {
        // 마법 공격 시 연쇄 효과 추가
        const originalBasicAttack = this.player.getCurrentAbility()?.basicAttack;
        if (!originalBasicAttack) return { update: () => {} };

        // 현재 능력이 마법인지 확인
        const ability = this.player.getCurrentAbility();
        if (ability && ability.name === '마법') {
            const originalAttack = ability.basicAttack.bind(ability);

            ability.basicAttack = () => {
                originalAttack();

                // 추가 연쇄 번개 효과는 기존 마법 발사 후 처리
                // 실제 구현은 MagicAbility 클래스와 연동 필요
            };
        }

        return { update: () => {} };
    }

    // 메테오
    meteor() {
        let lastMeteorTime = 0;
        const meteorCooldown = 10000;

        return {
            update: () => {
                if (!this.scene.keys) return;

                const now = Date.now();
                // C키 길게 누르기 시 메테오
                if (this.scene.keys.specialSkill.isDown &&
                    now - lastMeteorTime > meteorCooldown) {

                    lastMeteorTime = now;
                    this.summonMeteor();
                }
            }
        };
    }

    summonMeteor() {
        if (!this.scene.boss || !this.scene.boss.isAlive) return;

        const targetX = this.scene.boss.sprite.x;
        const targetY = this.scene.boss.sprite.y;

        // 운석 생성 (화면 위에서)
        const meteor = this.scene.add.circle(targetX, -100, 40, 0xFF4500);
        meteor.setStrokeStyle(4, 0xFF0000);
        this.scene.physics.add.existing(meteor);
        meteor.body.setAllowGravity(false);

        // 파티클 효과
        const trail = this.scene.add.particles(meteor.x, meteor.y, 'particle', {
            speed: { min: 20, max: 50 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            tint: 0xFF4500,
            follow: meteor
        });

        // 낙하
        this.scene.tweens.add({
            targets: meteor,
            y: targetY,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                // 폭발
                this.createExplosion(meteor.x, meteor.y, 120, 50);
                meteor.destroy();
                trail.destroy();
            }
        });
    }

    createExplosion(x, y, radius, damage) {
        // 폭발 이펙트
        const explosion = this.scene.add.circle(x, y, 10, 0xFF4500, 0.8);

        this.scene.tweens.add({
            targets: explosion,
            radius: radius,
            alpha: 0,
            duration: 500,
            onComplete: () => explosion.destroy()
        });

        // 범위 내 피해
        if (this.scene.boss && this.scene.boss.isAlive) {
            const distance = Phaser.Math.Distance.Between(x, y, this.scene.boss.sprite.x, this.scene.boss.sprite.y);
            if (distance < radius) {
                this.scene.boss.takeDamage(damage);
            }
        }
    }

    // 순간이동
    teleport() {
        let lastTeleportTime = 0;
        const teleportCooldown = 3000;

        return {
            update: () => {
                if (!this.scene.keys || !this.scene.cursors) return;

                const now = Date.now();
                // Shift + 방향키로 순간이동
                if (this.scene.keys.dash.isDown && now - lastTeleportTime > teleportCooldown) {
                    let teleportX = this.player.sprite.x;
                    let teleportY = this.player.sprite.y;

                    if (this.scene.cursors.left.isDown) {
                        teleportX -= 150;
                    } else if (this.scene.cursors.right.isDown) {
                        teleportX += 150;
                    } else if (this.scene.cursors.up.isDown) {
                        teleportY -= 150;
                    } else if (this.scene.cursors.down.isDown) {
                        teleportY += 150;
                    } else {
                        return;
                    }

                    lastTeleportTime = now;
                    this.executeTeleport(teleportX, teleportY);
                }
            }
        };
    }

    executeTeleport(targetX, targetY) {
        // 텔레포트 이펙트 (시작)
        const startEffect = this.scene.add.circle(this.player.sprite.x, this.player.sprite.y, 30, 0xAA00FF, 0.6);
        this.scene.tweens.add({
            targets: startEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => startEffect.destroy()
        });

        // 위치 이동
        this.player.sprite.x = targetX;
        this.player.sprite.y = targetY;

        // 텔레포트 이펙트 (도착)
        const endEffect = this.scene.add.circle(targetX, targetY, 30, 0xAA00FF, 0.6);
        this.scene.tweens.add({
            targets: endEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => endEffect.destroy()
        });
    }

    // ========== 해머 전용 증강 효과 ==========

    // 대지 균열
    earthquakeFissure() {
        let lastFissureTime = 0;
        const fissureCooldown = 8000;

        return {
            update: () => {
                if (!this.scene.keys) return;

                const now = Date.now();
                // 강공격 시 균열 생성
                if (Phaser.Input.Keyboard.JustDown(this.scene.keys.strongAttack) &&
                    now - lastFissureTime > fissureCooldown &&
                    this.player.sprite.body.touching.down) {

                    lastFissureTime = now;
                    this.createFissure();
                }
            }
        };
    }

    createFissure() {
        const fissureLength = 300;
        const fissureX = this.player.sprite.x + (this.player.facingRight ? fissureLength / 2 : -fissureLength / 2);

        // 균열 비주얼
        const fissure = this.scene.add.rectangle(
            fissureX,
            this.player.sprite.y + 20,
            fissureLength,
            10,
            0x8B4513
        );
        this.scene.physics.add.existing(fissure);
        fissure.body.setAllowGravity(false);

        // 균열에서 올라오는 바위들
        for (let i = 0; i < 5; i++) {
            const rockX = fissureX - fissureLength / 2 + (fissureLength / 5) * i;
            const rock = this.scene.add.rectangle(rockX, this.player.sprite.y, 20, 40, 0x696969);
            this.scene.physics.add.existing(rock);

            this.scene.tweens.add({
                targets: rock,
                y: rock.y - 100,
                duration: 500,
                yoyo: true,
                onComplete: () => rock.destroy()
            });

            // 보스와 충돌
            if (this.scene.boss && this.scene.boss.isAlive) {
                this.scene.physics.add.overlap(rock, this.scene.boss.sprite, () => {
                    this.scene.boss.takeDamage(20);
                });
            }
        }

        this.scene.time.delayedCall(1500, () => {
            fissure.destroy();
        });
    }

    // 충격파
    shockwave() {
        const originalUpdate = this.player.update.bind(this.player);
        let wasInAir = false;

        this.player.update = (cursors, keys) => {
            const inAir = !this.player.sprite.body.touching.down;

            // 공중에서 지상으로 착지할 때
            if (wasInAir && !inAir) {
                this.createShockwave();
            }

            wasInAir = inAir;
            originalUpdate(cursors, keys);
        };

        return { update: () => {} };
    }

    createShockwave() {
        // 충격파 링
        const wave = this.scene.add.circle(this.player.sprite.x, this.player.sprite.y + 15, 20, 0xFFD700, 0.5);

        this.scene.tweens.add({
            targets: wave,
            radius: 120,
            alpha: 0,
            duration: 400,
            onComplete: () => wave.destroy()
        });

        // 범위 피해
        if (this.scene.boss && this.scene.boss.isAlive) {
            const distance = Phaser.Math.Distance.Between(
                this.player.sprite.x,
                this.player.sprite.y,
                this.scene.boss.sprite.x,
                this.scene.boss.sprite.y
            );

            if (distance < 120) {
                this.scene.boss.takeDamage(15);
            }
        }
    }

    // ========== 활 전용 증강 효과 ==========

    // 폭발 화살
    explosiveArrow() {
        // 활 능력의 화살에 폭발 효과 추가
        const ability = this.player.getCurrentAbility();
        if (ability && ability.name === '활') {
            ability.explosiveArrows = true;
        }

        return { update: () => {} };
    }

    // 다중 발사
    multiShot() {
        const ability = this.player.getCurrentAbility();
        if (ability && ability.name === '활') {
            ability.multiShotCount = 3;
        }

        return { update: () => {} };
    }

    // ========== 유니버셜 증강 효과 ==========

    // 시간 왜곡
    timeWarp() {
        // 모든 적의 속도 50% 감소
        return {
            update: () => {
                if (this.scene.boss && this.scene.boss.sprite.body) {
                    // 보스 이동속도 감소 (기존 속도의 50%)
                    if (!this.scene.boss.timeWarpApplied) {
                        this.scene.boss.moveSpeed = (this.scene.boss.moveSpeed || 100) * 0.5;
                        this.scene.boss.timeWarpApplied = true;
                    }
                }
            }
        };
    }

    // 그림자 분신
    shadowClone() {
        let clone = null;
        let cloneSprite = null;

        return {
            update: () => {
                if (!cloneSprite || !cloneSprite.active) {
                    // 분신 생성
                    cloneSprite = this.scene.add.sprite(
                        this.player.sprite.x - 50,
                        this.player.sprite.y,
                        'player_idle'
                    );
                    cloneSprite.setAlpha(0.5);
                    cloneSprite.setTint(0x8800FF);
                    cloneSprite.play('player_idle');
                }

                // 플레이어 따라가기 (약간 느리게)
                const dx = this.player.sprite.x - cloneSprite.x;
                const dy = this.player.sprite.y - cloneSprite.y;

                cloneSprite.x += dx * 0.1;
                cloneSprite.y += dy * 0.1;

                // 플레이어와 같은 애니메이션
                if (this.player.sprite.anims.currentAnim) {
                    cloneSprite.play(this.player.sprite.anims.currentAnim.key, true);
                }
                cloneSprite.setFlipX(this.player.sprite.flipX);
            }
        };
    }

    // 복수의 칼날
    vengeanceBlade() {
        const originalTakeDamage = this.player.takeDamage.bind(this.player);

        this.player.takeDamage = (damage, attacker) => {
            // 피격 시 칼날 발사
            if (attacker && attacker.sprite) {
                this.shootVengeanceBlade(attacker);
            }

            originalTakeDamage(damage, attacker);
        };

        return { update: () => {} };
    }

    shootVengeanceBlade(target) {
        const blade = this.scene.add.rectangle(
            this.player.sprite.x,
            this.player.sprite.y,
            30, 10,
            0xFF0000
        );
        this.scene.physics.add.existing(blade);
        blade.body.setAllowGravity(false);

        // 타겟을 향해 발사
        const angle = Phaser.Math.Angle.Between(
            this.player.sprite.x,
            this.player.sprite.y,
            target.sprite.x,
            target.sprite.y
        );

        blade.body.setVelocity(
            Math.cos(angle) * 500,
            Math.sin(angle) * 500
        );

        blade.setData('damage', 20);

        // 충돌 처리
        this.scene.physics.add.overlap(blade, target.sprite, () => {
            if (target.takeDamage) {
                target.takeDamage(blade.getData('damage'));
            }
            blade.destroy();
        });

        // 3초 후 제거
        this.scene.time.delayedCall(3000, () => {
            if (blade.active) blade.destroy();
        });
    }

    // 정리
    destroy() {
        this.timers.forEach(timer => timer.remove());
        this.particles.forEach(particle => particle.destroy());
        this.updateFunctions.clear();
        this.activeEffects = [];
    }
}

// 전역 접근
if (typeof window !== 'undefined') {
    window.AugmentEffectHandler = AugmentEffectHandler;
}
