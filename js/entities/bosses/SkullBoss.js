// Skull Boss (스테이지 3 보스 - 해골 마법사)
class SkullBoss extends Enemy {
    constructor(scene, x, y) {
        // 보스 스탯
        const bossConfig = {
            WIDTH: 52,
            HEIGHT: 54,
            HP: 600,
            DAMAGE: 35,
            SPEED: 60,
            COLOR: 0xFF0000
        };

        super(scene, x, y, bossConfig);

        // Rectangle sprite 제거
        if (this.sprite) {
            this.sprite.destroy();
        }

        // Skull 스프라이트시트로 교체
        this.sprite = scene.add.sprite(x, y, 'skull_idle');
        this.sprite.play('skull_idle');
        this.sprite.setScale(1.8); // 보스는 더 크게

        // 물리 바디 재설정
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setBounce(0.1);
        this.sprite.body.setCollideWorldBounds(true);

        // 히트박스 조정
        this.sprite.body.setSize(46, 48);
        this.sprite.body.setOffset(3, 3);

        // 중력 제거 (부유)
        this.sprite.body.setAllowGravity(false);

        // 데이터 재설정
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'enemy');
        this.sprite.setData('damage', this.damage);

        // 보스 전용 속성
        this.isBoss = true;
        this.bossName = 'DEATH SKULL';
        this.maxHp = this.hp;
        this.phase = 1;

        // 공격 패턴
        this.patternCooldown = 0;
        this.patternInterval = 2500;
        this.isExecutingPattern = false;

        // 부유 효과
        this.initialY = y;
        this.floatAmplitude = 30;
        this.floatSpeed = 0.001;

        // 보스 체력바 생성
        this.createHealthBar();

        if (CONSTANTS.GAME.DEBUG) {
            console.log('해골 보스 생성:', this.maxHp, 'HP');
        }
    }

    createHealthBar() {
        // 보스 이름
        this.nameText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            50,
            this.bossName,
            {
                fontSize: '24px',
                fill: '#ff0000',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4
            }
        );
        this.nameText.setOrigin(0.5);
        this.nameText.setScrollFactor(0);
        this.nameText.setDepth(1000);

        // 체력바 배경
        this.healthBarBg = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            75,
            400,
            20,
            0x333333
        );
        this.healthBarBg.setScrollFactor(0);
        this.healthBarBg.setDepth(1000);

        // 체력바
        this.healthBarFill = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            75,
            400,
            20,
            0xff0000
        );
        this.healthBarFill.setScrollFactor(0);
        this.healthBarFill.setDepth(1001);

        // 체력 텍스트
        this.healthText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            75,
            `${this.hp}/${this.maxHp}`,
            {
                fontSize: '14px',
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        this.healthText.setOrigin(0.5);
        this.healthText.setScrollFactor(0);
        this.healthText.setDepth(1002);
    }

    updateHealthBar() {
        if (!this.healthBarFill || !this.healthText) return;

        const hpRatio = this.hp / this.maxHp;
        this.healthBarFill.setScale(hpRatio, 1);
        this.healthBarFill.x = (CONSTANTS.GAME.WIDTH / 2) - (200 * (1 - hpRatio));

        // 체력에 따라 색상 변경
        if (hpRatio > 0.5) {
            this.healthBarFill.setFillStyle(0xff0000);
        } else if (hpRatio > 0.25) {
            this.healthBarFill.setFillStyle(0xff00ff);
        } else {
            this.healthBarFill.setFillStyle(0x8b00ff);
        }

        this.healthText.setText(`${this.hp}/${this.maxHp}`);

        // 페이즈 2 전환
        if (this.phase === 1 && hpRatio <= 0.5) {
            this.enterPhase2();
        }
    }

    enterPhase2() {
        this.phase = 2;
        this.patternInterval = 1800; // 공격 더 빠르게

        // 화면 플래시 (보라색)
        const flash = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0x8b00ff,
            0.6
        );
        flash.setScrollFactor(0);
        flash.setDepth(1999);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                flash.destroy();
            }
        });

        // 카메라 쉐이크
        this.scene.cameras.main.shake(1000, 0.03);

        // 페이즈 2 알림
        const phaseText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            '☠️ NIGHTMARE MODE ☠️',
            {
                fontSize: '64px',
                fill: '#8b00ff',
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
            console.log('해골 보스 페이즈 2 돌입!');
        }
    }

    takeDamage(damage) {
        super.takeDamage(damage);
        this.updateHealthBar();
    }

    updateAI() {
        if (!this.isAlive || this.isHit || this.isExecutingPattern) return;
        if (!this.sprite || !this.sprite.body) return;

        const currentTime = this.scene.time.now;

        // 맵 경계 체크 (보스가 맵 밖으로 나가지 않도록)
        const margin = 50;
        if (this.sprite.x < margin) {
            this.sprite.x = margin;
            this.sprite.body.setVelocityX(0);
        } else if (this.sprite.x > CONSTANTS.WORLD.WIDTH - margin) {
            this.sprite.x = CONSTANTS.WORLD.WIDTH - margin;
            this.sprite.body.setVelocityX(0);
        }

        // 패턴 실행
        if (currentTime - this.patternCooldown > this.patternInterval) {
            this.patternCooldown = currentTime;
            this.executeAttackPattern();
        }

        // 부유 효과
        const time = this.scene.time.now;
        const floatY = this.initialY + Math.sin(time * this.floatSpeed) * this.floatAmplitude;
        this.sprite.y = floatY;

        // 플레이어 추적 (천천히)
        if (window.player && window.player.sprite && window.player.sprite.active) {
            const playerX = window.player.sprite.x;
            this.direction = playerX > this.sprite.x ? 1 : -1;

            const distance = Math.abs(this.sprite.x - playerX);
            if (distance > 150) {
                this.sprite.body.setVelocityX(this.speed * this.direction);
            } else {
                this.sprite.body.setVelocityX(0);
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
        const patterns = ['fireballBarrage', 'darkOrbs', 'teleport'];
        const randomPattern = Phaser.Utils.Array.GetRandom(patterns);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('해골 보스 패턴:', randomPattern);
        }

        this[randomPattern]();
    }

    // 패턴 1: 연속 파이어볼
    fireballBarrage() {
        this.isExecutingPattern = true;

        const fireballCount = this.phase === 1 ? 3 : 5;

        for (let i = 0; i < fireballCount; i++) {
            this.scene.time.delayedCall(i * 400, () => {
                this.shootFireball();
            });
        }

        this.scene.time.delayedCall(fireballCount * 400 + 500, () => {
            this.isExecutingPattern = false;
        });
    }

    shootFireball() {
        if (!this.sprite || !this.sprite.active || !window.player) return;

        const fireball = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            10,
            0xFF4500,
            1
        );

        this.scene.physics.add.existing(fireball);
        fireball.body.setAllowGravity(false);

        // 플레이어 방향으로 발사
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            window.player.sprite.x, window.player.sprite.y
        );

        const speed = this.phase === 1 ? 300 : 350;
        fireball.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        fireball.setData('damage', this.damage);
        fireball.setData('startTime', this.scene.time.now);

        // 플레이어 충돌 체크
        const checkCollision = this.scene.time.addEvent({
            delay: 50,
            repeat: 80,
            callback: () => {
                if (!fireball || !fireball.active) {
                    checkCollision.remove();
                    return;
                }

                const elapsed = this.scene.time.now - fireball.getData('startTime');
                if (elapsed > 4000) {
                    fireball.destroy();
                    checkCollision.remove();
                    return;
                }

                if (window.player && window.player.sprite && window.player.sprite.active) {
                    this.scene.physics.overlap(fireball, window.player.sprite, () => {
                        if (window.player.isAlive && !window.player.isInvincible) {
                            window.player.takeDamage(Math.floor(fireball.getData('damage')));
                            fireball.destroy();
                            checkCollision.remove();
                        }
                    });
                }
            }
        });
    }

    // 패턴 2: 어둠의 구체 (원형으로 퍼짐)
    darkOrbs() {
        this.isExecutingPattern = true;

        const orbCount = this.phase === 1 ? 6 : 8;

        for (let i = 0; i < orbCount; i++) {
            const angle = (i / orbCount) * Math.PI * 2;

            const orb = this.scene.add.circle(
                this.sprite.x,
                this.sprite.y,
                8,
                0x8b00ff,
                1
            );

            this.scene.physics.add.existing(orb);
            orb.body.setAllowGravity(false);

            const speed = 150;
            orb.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            orb.setData('damage', this.damage * 0.7);
            orb.setData('startTime', this.scene.time.now);

            // 플레이어 충돌 체크
            const checkCollision = this.scene.time.addEvent({
                delay: 50,
                repeat: 60,
                callback: () => {
                    if (!orb || !orb.active) {
                        checkCollision.remove();
                        return;
                    }

                    const elapsed = this.scene.time.now - orb.getData('startTime');
                    if (elapsed > 3000) {
                        orb.destroy();
                        checkCollision.remove();
                        return;
                    }

                    if (window.player && window.player.sprite && window.player.sprite.active) {
                        this.scene.physics.overlap(orb, window.player.sprite, () => {
                            if (window.player.isAlive && !window.player.isInvincible) {
                                window.player.takeDamage(Math.floor(orb.getData('damage')));
                                orb.destroy();
                                checkCollision.remove();
                            }
                        });
                    }
                }
            });
        }

        this.scene.time.delayedCall(1000, () => {
            this.isExecutingPattern = false;
        });
    }

    // 패턴 3: 순간이동 (플레이어 반대편으로)
    teleport() {
        this.isExecutingPattern = true;

        // 페이드 아웃
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 300
        });

        this.scene.time.delayedCall(300, () => {
            if (!window.player || !window.player.sprite) {
                this.isExecutingPattern = false;
                return;
            }

            // 플레이어 반대편으로 텔레포트
            const playerX = window.player.sprite.x;
            const newX = playerX > CONSTANTS.WORLD.WIDTH / 2 ?
                         playerX - 300 : playerX + 300;

            this.sprite.x = Phaser.Math.Clamp(newX, 100, CONSTANTS.WORLD.WIDTH - 100);
            this.initialY = this.sprite.y;

            // 페이드 인
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: 1,
                duration: 300
            });

            this.scene.time.delayedCall(300, () => {
                this.isExecutingPattern = false;
            });
        });
    }

    playHitEffect() {
        // 피격 애니메이션
        this.sprite.play('skull_hit');

        // 원래 애니메이션으로 복귀
        this.scene.time.delayedCall(300, () => {
            if (this.sprite && this.sprite.active && this.isAlive) {
                this.sprite.play('skull_idle');
            }
        });
    }

    onDeath() {
        // 보스 UI 제거
        if (this.nameText) this.nameText.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        if (this.healthText) this.healthText.destroy();

        // 보스 처치 이벤트
        this.scene.events.emit('bossDefeated', 3);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('해골 보스 처치!');
        }
    }

    destroy() {
        if (this.nameText) this.nameText.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        if (this.healthText) this.healthText.destroy();

        super.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.SkullBoss = SkullBoss;
    console.log('✅ SkullBoss 클래스 등록 완료');
} else {
    console.error('❌ window 객체를 찾을 수 없습니다');
}
