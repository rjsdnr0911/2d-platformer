// 무투가 능력 - 분노 게이지 시스템
class FighterAbility extends AbilityBase {
    constructor(scene) {
        super(scene, '무투가', CONSTANTS.ABILITIES.FIGHTER);

        // 분노 게이지 시스템
        this.rage = 0;
        this.maxRage = this.config.MAX_RAGE;
        this.rageDecayTimer = null;
        this.lastRageGainTime = 0;

        // 대시 쿨다운 감소 (패시브)
        this.dashCooldownReduction = 0.3; // 30% 감소

        // 슈퍼 아머 (강공격 중)
        this.hasSuperArmor = false;
    }

    // 분노 게이지 증가
    gainRage(amount) {
        this.rage = Math.min(this.rage + amount, this.maxRage);
        this.lastRageGainTime = this.scene.time.now;

        // 분노 게이지 100% 도달 시 효과
        if (this.rage >= this.maxRage) {
            this.activateMaxRage();
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('무투가: 분노 게이지', this.rage, '/', this.maxRage);
        }

        // 분노 감소 타이머 재시작
        this.startRageDecay();
    }

    // 분노 게이지 감소 시작
    startRageDecay() {
        // 기존 타이머 제거
        if (this.rageDecayTimer) {
            this.rageDecayTimer.remove();
        }

        // 5초 후부터 초당 5씩 감소
        this.rageDecayTimer = this.scene.time.addEvent({
            delay: 5000, // 5초 대기
            callback: () => {
                if (this.rage > 0) {
                    this.rage = Math.max(0, this.rage - this.config.RAGE_DECAY);

                    if (CONSTANTS.GAME.DEBUG && this.rage > 0) {
                        console.log('무투가: 분노 감소', this.rage);
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    // 최대 분노 활성화 (시간 느려짐 효과)
    activateMaxRage() {
        if (!this.owner || !this.scene) return;

        // 시간 느려짐 효과 (적들만)
        if (this.scene.enemyList) {
            this.scene.enemyList.forEach(enemy => {
                if (enemy && enemy.sprite && enemy.sprite.body) {
                    // 적 속도 50% 감소
                    enemy.sprite.body.setVelocityX(enemy.sprite.body.velocity.x * 0.5);
                    enemy.sprite.setTint(0x8888FF); // 파란색 틴트
                }
            });
        }

        // 3초 후 원래대로
        this.scene.time.delayedCall(3000, () => {
            if (this.scene && this.scene.enemyList) {
                this.scene.enemyList.forEach(enemy => {
                    if (enemy && enemy.sprite) {
                        enemy.sprite.clearTint();
                    }
                });
            }

            // 분노 게이지 0으로
            this.rage = 0;
        });

        // 화면 효과
        this.createMaxRageEffect();

        if (CONSTANTS.GAME.DEBUG) {
            console.log('무투가: 최대 분노! 시간 느려짐 효과');
        }
    }

    // 최대 분노 화면 효과
    createMaxRageEffect() {
        if (!this.owner) return;

        // 화면 전체 붉은 플래시
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.scrollX + CONSTANTS.GAME.WIDTH / 2,
            this.scene.cameras.main.scrollY + CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0xFF0000,
            0.4
        );
        flash.setScrollFactor(0);
        flash.setDepth(999);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                flash.destroy();
            }
        });

        // 플레이어 주변 충격파
        const shockwave = this.scene.add.circle(
            this.owner.sprite.x,
            this.owner.sprite.y,
            40,
            0xFF0000,
            0.5
        );

        this.scene.tweens.add({
            targets: shockwave,
            scale: 5,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                shockwave.destroy();
            }
        });
    }

    // 분노 데미지 배율 계산
    getRageDamageMultiplier() {
        // 분노 게이지에 따라 1.0 ~ 1.5배
        return 1 + (this.rage / this.maxRage) * 0.5;
    }

    // 기본 공격: 빠른 잽
    _performBasicAttack() {
        if (!this.owner) return;

        const damageMultiplier = this.getRageDamageMultiplier();
        const damage = Math.round(this.config.BASIC_DAMAGE * damageMultiplier);

        // 빠른 펀치
        this.createMeleeHitbox(
            25, -5,
            35, 30,
            damage,
            120
        );

        // 앞으로 살짝 이동
        if (this.owner.facingRight) {
            this.owner.sprite.body.setVelocityX(80);
        } else {
            this.owner.sprite.body.setVelocityX(-80);
        }

        // 분노 게이지 증가
        this.gainRage(this.config.RAGE_PER_HIT);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('무투가: 잽 (데미지:', damage, ')');
        }
    }

    // 강공격: 가드 브레이킹 타격 (슈퍼 아머)
    _performStrongAttack() {
        if (!this.owner) return;

        // 슈퍼 아머 활성화
        this.hasSuperArmor = true;
        if (this.owner) {
            this.owner.isInvincible = true;
            this.owner.sprite.setTint(0xFFAA00); // 주황색 틴트
        }

        const damageMultiplier = this.getRageDamageMultiplier();
        const damage = Math.round(this.config.STRONG_DAMAGE * damageMultiplier);

        // 강력한 주먹 공격
        this.createMeleeHitbox(
            35, 0,
            55, 45,
            damage,
            250
        );

        // 강하게 전진
        if (this.owner.facingRight) {
            this.owner.sprite.body.setVelocityX(200);
        } else {
            this.owner.sprite.body.setVelocityX(-200);
        }

        // 충격파 이펙트
        this.scene.time.delayedCall(100, () => {
            if (!this.owner) return;

            const impact = this.scene.add.circle(
                this.owner.sprite.x + (this.owner.facingRight ? 40 : -40),
                this.owner.sprite.y,
                35,
                0xFFAA00,
                0.6
            );

            this.scene.tweens.add({
                targets: impact,
                scale: 2,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    impact.destroy();
                }
            });
        });

        // 슈퍼 아머 해제
        this.scene.time.delayedCall(250, () => {
            this.hasSuperArmor = false;
            if (this.owner) {
                this.owner.isInvincible = false;
                this.owner.sprite.clearTint();
            }
        });

        // 분노 게이지 증가
        this.gainRage(this.config.RAGE_PER_HIT * 1.5);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('무투가: 가드 브레이킹 (데미지:', damage, ')');
        }
    }

    // 궁극기: 엘보우 드롭 콤보
    _performSpecialSkill() {
        if (!this.owner) return;

        const damageMultiplier = this.getRageDamageMultiplier();

        // 1단계: 상승 엘보우
        this.owner.sprite.body.setVelocityY(-300);
        this.owner.sprite.body.setVelocityX(
            this.owner.facingRight ? 150 : -150
        );

        this.createMeleeHitbox(
            0, -20,
            50, 50,
            Math.round(this.config.SKILL_DAMAGE * 0.3 * damageMultiplier),
            200
        );

        // 2단계: 공중 연타 (500ms 후)
        this.scene.time.delayedCall(500, () => {
            if (!this.owner) return;

            // 공중에서 정지
            this.owner.sprite.body.setVelocityY(0);
            this.owner.sprite.body.setVelocityX(0);

            // 연타 (5회)
            for (let i = 0; i < 5; i++) {
                this.scene.time.delayedCall(i * 80, () => {
                    if (!this.owner) return;

                    this.createMeleeHitbox(
                        20, 0,
                        40, 40,
                        Math.round(this.config.SKILL_DAMAGE * 0.1 * damageMultiplier),
                        100
                    );

                    // 펀치 이펙트
                    const punch = this.scene.add.circle(
                        this.owner.sprite.x + (this.owner.facingRight ? 25 : -25),
                        this.owner.sprite.y,
                        15,
                        0xFF4444,
                        0.7
                    );

                    this.scene.tweens.add({
                        targets: punch,
                        scale: 1.5,
                        alpha: 0,
                        duration: 150,
                        onComplete: () => {
                            punch.destroy();
                        }
                    });
                });
            }
        });

        // 3단계: 강하 엘보우 드롭 (900ms 후)
        this.scene.time.delayedCall(900, () => {
            if (!this.owner) return;

            // 급강하
            this.owner.sprite.body.setVelocityY(600);
            this.owner.sprite.body.setVelocityX(
                this.owner.facingRight ? 100 : -100
            );

            // 착지 시 강력한 충격파
            const checkLanding = this.scene.time.addEvent({
                delay: 50,
                repeat: 20,
                callback: () => {
                    if (!this.owner || !this.owner.sprite.body.touching.down) return;

                    // 착지 감지
                    checkLanding.remove();

                    // 충격파 생성
                    this.createMeleeHitbox(
                        0, 10,
                        120, 80,
                        Math.round(this.config.SKILL_DAMAGE * 0.6 * damageMultiplier),
                        400
                    );

                    // 착지 이펙트
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 * i) / 8;
                        const particle = this.scene.add.circle(
                            this.owner.sprite.x,
                            this.owner.sprite.y + 15,
                            10,
                            0xFF4444,
                            0.8
                        );

                        this.scene.tweens.add({
                            targets: particle,
                            x: particle.x + Math.cos(angle) * 80,
                            y: particle.y + Math.sin(angle) * 50,
                            alpha: 0,
                            duration: 400,
                            onComplete: () => {
                                particle.destroy();
                            }
                        });
                    }

                    // 화면 흔들림
                    this.scene.cameras.main.shake(200, 0.01);
                }
            });
        });

        // 분노 게이지 최대치 증가
        this.gainRage(this.config.RAGE_PER_HIT * 3);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('무투가: 엘보우 드롭 콤보');
        }
    }

    // 능력 장착 시 (대시 쿨다운 감소 적용)
    setOwner(owner) {
        super.setOwner(owner);

        if (owner) {
            // 대시 쿨다운 감소 적용
            owner.dashCooldownReduction = Math.max(
                owner.dashCooldownReduction || 0,
                this.dashCooldownReduction
            );

            if (CONSTANTS.GAME.DEBUG) {
                console.log('무투가: 대시 쿨다운', this.dashCooldownReduction * 100, '% 감소');
            }
        }

        // 분노 감소 시작
        this.startRageDecay();
    }

    // 업데이트
    update() {
        super.update();

        // 분노 게이지 UI 업데이트는 Scene에서 처리
    }

    // 능력 교체 시 (분노 게이지 유지)
    onSwapIn() {
        if (CONSTANTS.GAME.DEBUG) {
            console.log('무투가: 시작 (분노:', this.rage, '/', this.maxRage, ')');
        }
    }

    // 파괴 시 타이머 정리
    destroy() {
        super.destroy();

        if (this.rageDecayTimer) {
            this.rageDecayTimer.remove();
            this.rageDecayTimer = null;
        }
    }

    // 분노 게이지 가져오기 (UI 표시용)
    getRage() {
        return this.rage;
    }

    getMaxRage() {
        return this.maxRage;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.FighterAbility = FighterAbility;
}
