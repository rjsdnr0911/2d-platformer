// Rino Boss (스테이지 2 보스 - 돌진 라이노)
class RinoBoss extends BaseBoss {
    constructor(scene, x, y) {
        // 적 스탯
        const enemyConfig = {
            WIDTH: 52,
            HEIGHT: 34,
            HP: 500,
            DAMAGE: 30,
            SPEED: 80,
            COLOR: 0x808080
        };

        // 보스 설정
        const bossConfig = {
            name: 'RAGING RHINO',
            color: 0x808080
        };

        super(scene, x, y, bossConfig, enemyConfig);

        // Rectangle sprite 제거
        if (this.sprite) {
            this.sprite.destroy();
        }

        // Rino 스프라이트시트로 교체
        this.sprite = scene.add.sprite(x, y, 'rino_idle');
        this.sprite.play('rino_idle');
        this.sprite.setScale(2.0); // 보스는 더 크게 (1.5 -> 2.0)

        // 물리 바디 재설정
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setBounce(0.1);
        this.sprite.body.setCollideWorldBounds(true);

        // 히트박스 조정
        this.sprite.body.setSize(46, 30);
        this.sprite.body.setOffset(3, 2);

        // 데이터 재설정
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'enemy');
        this.sprite.setData('damage', this.damage);

        // 공격 패턴
        this.patternCooldown = 0;
        this.patternInterval = 3000;
        this.isExecutingPattern = false;
        this.isCharging = false;
    }

    updateHealthBar() {
        // BaseBoss의 updateHealthBar 호출
        super.updateHealthBar();

        // 페이즈 체크 (RinoBoss 전용)
        const hpRatio = this.hp / this.maxHp;
        if (this.phase === 1 && hpRatio <= 0.5) {
            this.enterPhase2();
        }
    }

    enterPhase2() {
        this.phase = 2;
        this.patternInterval = 2000; // 공격 더 빠르게

        // 화면 쉐이크
        this.scene.cameras.main.shake(800, 0.03);

        // 페이즈 2 알림
        const phaseText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            '💢 ENRAGED! 💢',
            {
                fontSize: '64px',
                fill: '#ff0000',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 8
            }
        );
        phaseText.setOrigin(0.5);
        phaseText.setScrollFactor(0);
        phaseText.setDepth(2000);

        this.scene.tweens.add({
            targets: phaseText,
            scale: 1.5,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                phaseText.destroy();
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('라이노 보스 페이즈 2 돌입!');
        }
    }

    // BaseBoss에서 이미 takeDamage와 updateHealthBar를 처리하므로 제거

    updateAI() {
        if (!this.isAlive || this.isHit || this.isExecutingPattern) return;
        if (!this.sprite || !this.sprite.body) return;

        const currentTime = this.scene.time.now;

        // 패턴 실행
        if (currentTime - this.patternCooldown > this.patternInterval) {
            this.patternCooldown = currentTime;
            this.executeAttackPattern();
        }

        // 플레이어 추적 (돌진 중이 아닐 때)
        if (!this.isCharging && window.player && window.player.sprite && window.player.sprite.active) {
            const playerX = window.player.sprite.x;
            this.direction = playerX > this.sprite.x ? 1 : -1;

            // 플레이어 방향으로 이동
            const distance = Math.abs(this.sprite.x - playerX);
            if (distance > 100) {
                this.sprite.body.setVelocityX(this.speed * this.direction);
                this.sprite.play('rino_run', true);
            } else {
                this.sprite.body.setVelocityX(0);
                this.sprite.play('rino_idle', true);
            }

            // 방향에 따라 스프라이트 뒤집기
            if (this.direction > 0) {
                this.sprite.setFlipX(false);
            } else {
                this.sprite.setFlipX(true);
            }
        }
    }

    executeAttackPattern() {
        const patterns = ['chargeAttack', 'stomp'];
        const randomPattern = Phaser.Utils.Array.GetRandom(patterns);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('라이노 보스 패턴:', randomPattern);
        }

        this[randomPattern]();
    }

    // 패턴 1: 돌진 공격
    chargeAttack() {
        this.isExecutingPattern = true;
        this.isCharging = true;

        // 차징 준비 (뒤로 물러남)
        this.sprite.body.setVelocityX(-this.direction * 100);

        this.scene.time.delayedCall(500, () => {
            if (!this.sprite || !this.sprite.active) return;

            // 돌진!
            const chargeSpeed = this.phase === 1 ? 400 : 500;
            this.sprite.body.setVelocityX(chargeSpeed * this.direction);
            this.sprite.play('rino_run', true);

            // 돌진 지속 시간
            this.scene.time.delayedCall(1000, () => {
                if (this.sprite && this.sprite.body) {
                    this.sprite.body.setVelocityX(0);
                    this.sprite.play('rino_idle', true);
                }
                this.isCharging = false;
                this.isExecutingPattern = false;
            });

            // 플레이어 충돌 체크
            const chargeCheck = this.scene.time.addEvent({
                delay: 50,
                repeat: 20,
                callback: () => {
                    if (!this.sprite || !this.sprite.active) {
                        chargeCheck.remove();
                        return;
                    }

                    if (window.player && window.player.sprite && window.player.sprite.active) {
                        const dist = Phaser.Math.Distance.Between(
                            this.sprite.x, this.sprite.y,
                            window.player.sprite.x, window.player.sprite.y
                        );

                        if (dist < 60 && window.player.isAlive && !window.player.isInvincible) {
                            window.player.takeDamage(this.damage * 1.5); // 돌진은 1.5배 데미지
                            chargeCheck.remove();
                        }
                    }
                }
            });
        });
    }

    // 패턴 2: 발 구르기 (충격파)
    stomp() {
        this.isExecutingPattern = true;

        // 발 구르기 애니메이션
        this.sprite.body.setVelocityY(-100);

        this.scene.time.delayedCall(300, () => {
            if (!this.sprite || !this.sprite.active) return;

            // 착지 충격파
            this.scene.cameras.main.shake(300, 0.02);

            // 충격파 생성
            const shockwaveCount = this.phase === 1 ? 2 : 3;
            for (let i = 0; i < shockwaveCount; i++) {
                const direction = i % 2 === 0 ? 1 : -1;
                this.createShockwave(direction);
            }

            this.scene.time.delayedCall(800, () => {
                this.isExecutingPattern = false;
            });
        });
    }

    createShockwave(direction) {
        const shockwave = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y + 15,
            20,
            0x808080,
            0.5
        );

        this.scene.physics.add.existing(shockwave);
        shockwave.body.setAllowGravity(false);
        shockwave.body.setVelocityX(200 * direction);

        this.scene.tweens.add({
            targets: shockwave,
            scaleX: 2,
            scaleY: 0.5,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                shockwave.destroy();
            }
        });

        // 플레이어 충돌 체크
        const shockCheck = this.scene.time.addEvent({
            delay: 50,
            repeat: 20,
            callback: () => {
                if (!shockwave || !shockwave.active) {
                    shockCheck.remove();
                    return;
                }

                if (window.player && window.player.sprite && window.player.sprite.active) {
                    this.scene.physics.overlap(shockwave, window.player.sprite, () => {
                        if (window.player.isAlive && !window.player.isInvincible) {
                            window.player.takeDamage(Math.floor(this.damage * 0.7));
                            shockwave.destroy();
                            shockCheck.remove();
                        }
                    });
                }
            }
        });
    }

    playHitEffect() {
        // 피격 애니메이션
        this.sprite.play('rino_hit');

        // 원래 애니메이션으로 복귀
        this.scene.time.delayedCall(300, () => {
            if (this.sprite && this.sprite.active && this.isAlive) {
                this.sprite.play('rino_idle');
            }
        });

        // 넉백
        const knockbackDirection = this.direction * -1;
        this.sprite.body.setVelocityX(80 * knockbackDirection);
    }

    onDeath() {
        // 보스 처치 이벤트
        this.scene.events.emit('bossDefeated', 2);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('라이노 보스 처치!');
        }
    }

    destroy() {
        // BaseBoss의 destroy 호출 (UI 정리 포함)
        super.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RinoBoss = RinoBoss;
    console.log('✅ RinoBoss 클래스 등록 완료');
} else {
    console.error('❌ window 객체를 찾을 수 없습니다');
}
