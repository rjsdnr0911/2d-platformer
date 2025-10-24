// Mage Boss (아크메이지)
class MageBoss extends Enemy {
    constructor(scene, x, y) {
        // 보스 스탯
        const bossConfig = {
            WIDTH: 80,
            HEIGHT: 80,
            HP: 600,
            DAMAGE: 30,
            SPEED: 45,
            COLOR: 0xFF00FF
        };

        super(scene, x, y, bossConfig);

        // 보스 전용 속성
        this.isBoss = true;
        this.bossName = 'ARCHMAGE';
        this.maxHp = this.hp;
        this.phase = 1; // 페이즈 (1 or 2)

        // 공격 패턴
        this.currentPattern = null;
        this.patternCooldown = 0;
        this.patternInterval = 2200; // 2.2초마다 패턴 실행
        this.isExecutingPattern = false;

        // 마법 발사체
        this.projectiles = [];

        // 보스 외형 변경 (더 크고 마법적으로)
        this.sprite.setScale(2);
        this.sprite.setFillStyle(0xFF44FF); // Rectangle은 setFillStyle 사용

        // 보스 체력바 생성
        this.createHealthBar();

        // 보스 오라 생성
        this.createAura();

        if (CONSTANTS.GAME.DEBUG) {
            console.log('아크메이지 생성:', this.maxHp, 'HP');
        }
    }

    // 보스 오라 (마법 효과)
    createAura() {
        // 페이즈에 따라 오라 색상 변경
        const getAuraColor = () => {
            return this.phase === 1 ? 0xFF00FF : 0x8800FF;
        };

        // 마법 파티클 (별처럼 반짝이는)
        this.auraTimer = this.scene.time.addEvent({
            delay: 80,
            repeat: -1,
            callback: () => {
                if (!this.sprite || !this.sprite.active || !this.isAlive) {
                    if (this.auraTimer) this.auraTimer.remove();
                    return;
                }

                // 마법 별 파티클 (주변을 떠다님)
                const angle = Math.random() * Math.PI * 2;
                const radius = 60 + Math.random() * 20;
                const particle = this.scene.add.star(
                    this.sprite.x + Math.cos(angle) * radius,
                    this.sprite.y + Math.sin(angle) * radius,
                    5,
                    Math.random() * 3 + 2,
                    Math.random() * 5 + 3,
                    getAuraColor(),
                    0.7
                );

                // 파티클 회전 & 페이드
                this.scene.tweens.add({
                    targets: particle,
                    angle: 360,
                    alpha: 0,
                    y: particle.y - 40,
                    duration: 1200,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            }
        });

        // 마법진 효과 (보스 주변 빙글빙글)
        this.auraPulse = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            70,
            getAuraColor(),
            0.05
        );
        this.auraPulse.setStrokeStyle(2, getAuraColor(), 0.2);

        this.scene.tweens.add({
            targets: this.auraPulse,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0,
            duration: 1400,
            repeat: -1,
            ease: 'Sine.easeOut'
        });

        // 오라 위치 업데이트
        this.auraUpdateTimer = this.scene.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: () => {
                if (!this.sprite || !this.sprite.active) {
                    if (this.auraUpdateTimer) this.auraUpdateTimer.remove();
                    return;
                }
                if (this.auraPulse && this.auraPulse.active) {
                    this.auraPulse.x = this.sprite.x;
                    this.auraPulse.y = this.sprite.y;
                    this.auraPulse.setFillStyle(getAuraColor(), 0.05);
                    this.auraPulse.setStrokeStyle(2, getAuraColor(), 0.2);
                }
            }
        });
    }

    createHealthBar() {
        // 보스 이름 텍스트
        this.nameText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            50,
            this.bossName,
            {
                fontSize: '24px',
                fill: '#ff00ff',
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
            0xff00ff
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
            this.healthBarFill.setFillStyle(0xff00ff);
        } else if (hpRatio > 0.25) {
            this.healthBarFill.setFillStyle(0xaa00ff);
        } else {
            this.healthBarFill.setFillStyle(0x8800ff);
        }

        this.healthText.setText(`${this.hp}/${this.maxHp}`);

        // 페이즈 체크
        if (this.phase === 1 && hpRatio <= 0.5) {
            this.enterPhase2();
        }
    }

    enterPhase2() {
        this.phase = 2;
        this.patternInterval = 1500; // 공격 속도 대폭 증가

        // 화면 플래시 (보라색)
        const flash = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0x8800FF,
            0.7
        );
        flash.setScrollFactor(0);
        flash.setDepth(1999);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 700,
            onComplete: () => {
                flash.destroy();
            }
        });

        // 카메라 쉐이크
        this.scene.cameras.main.shake(1000, 0.025);

        // 마법 폭발 (마법진처럼 퍼짐)
        for (let i = 0; i < 20; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                if (!this.sprite || !this.sprite.active) return;

                const angle = Math.random() * Math.PI * 2;
                const particle = this.scene.add.star(
                    this.sprite.x,
                    this.sprite.y,
                    5,
                    Math.random() * 5 + 3,
                    Math.random() * 8 + 5,
                    0x8800FF,
                    0.9
                );

                this.scene.physics.add.existing(particle);
                particle.body.setVelocity(
                    Math.cos(angle) * 250,
                    Math.sin(angle) * 250
                );

                this.scene.tweens.add({
                    targets: particle,
                    angle: 720,
                    alpha: 0,
                    scale: 0.5,
                    duration: 1000,
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }

        // 마법진 효과
        const magicCircle = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            80,
            0x8800FF,
            0.3
        );
        magicCircle.setStrokeStyle(5, 0x8800FF, 0.8);

        this.scene.tweens.add({
            targets: magicCircle,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            angle: 360,
            duration: 1200,
            onComplete: () => {
                magicCircle.destroy();
            }
        });

        // 페이즈 2 알림
        const phaseText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            '🔮 PHASE 2 🔮',
            {
                fontSize: '64px',
                fill: '#8800ff',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 8
            }
        );
        phaseText.setOrigin(0.5);
        phaseText.setScrollFactor(0);
        phaseText.setDepth(2000);
        phaseText.setScale(0);

        this.scene.tweens.add({
            targets: phaseText,
            scale: 1.5,
            duration: 700,
            ease: 'Elastic.easeOut'
        });

        this.scene.time.delayedCall(1400, () => {
            this.scene.tweens.add({
                targets: phaseText,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    phaseText.destroy();
                }
            });
        });

        // 보스 색상 변경 (Rectangle은 setFillStyle 사용)
        this.sprite.setFillStyle(0x8800FF);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('아크메이지 페이즈 2 돌입!');
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

        // 패턴 실행 시간 체크
        if (currentTime - this.patternCooldown > this.patternInterval) {
            this.patternCooldown = currentTime;
            this.executeRandomPattern();
        }

        // 플레이어 방향 바라보기
        if (window.player && window.player.sprite && window.player.sprite.active) {
            const playerX = window.player.sprite.x;
            this.direction = playerX > this.sprite.x ? 1 : -1;

            // 플레이어와 일정 거리 유지 (원거리 공격자)
            const distance = Math.abs(this.sprite.x - playerX);
            if (distance < 200) {
                // 너무 가까우면 후퇴
                this.sprite.body.setVelocityX(-this.speed * this.direction);
            } else if (distance > 300) {
                // 너무 멀면 접근
                this.sprite.body.setVelocityX(this.speed * this.direction);
            } else {
                this.sprite.body.setVelocityX(0);
            }
        }
    }

    executeRandomPattern() {
        const patterns = ['magicMissile', 'fireball', 'lightningStrike', 'iceNova', 'teleportStrike'];
        const randomPattern = Phaser.Utils.Array.GetRandom(patterns);

        this[randomPattern]();
    }

    // 패턴 1: 마법 미사일 (유도탄)
    magicMissile() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        const missileCount = this.phase === 1 ? 2 : 3;

        for (let i = 0; i < missileCount; i++) {
            this.scene.time.delayedCall(i * 250, () => {
                this.shootMagicMissile();
            });
        }

        this.scene.time.delayedCall(missileCount * 250 + 600, () => {
            this.isExecutingPattern = false;
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('아크메이지: 마법 미사일');
        }
    }

    shootMagicMissile() {
        if (!window.player || !window.player.sprite) return;

        const missile = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            10,
            0xFF00FF
        );

        this.scene.physics.add.existing(missile);
        missile.body.setAllowGravity(false);

        missile.setData('damage', this.damage * 0.7);
        missile.setData('type', 'bossAttack');
        missile.setData('startTime', this.scene.time.now);
        missile.setData('lifetime', 3000);
        missile.setData('homing', true);

        this.projectiles.push(missile);

        // 유도 미사일 움직임
        const updateMissile = this.scene.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: () => {
                if (!missile || !missile.active) {
                    updateMissile.remove();
                    return;
                }

                const elapsed = this.scene.time.now - missile.getData('startTime');
                if (elapsed > missile.getData('lifetime')) {
                    missile.destroy();
                    updateMissile.remove();
                    return;
                }

                // 플레이어 방향으로 유도
                if (window.player && window.player.sprite && window.player.sprite.active) {
                    const angle = Phaser.Math.Angle.Between(
                        missile.x, missile.y,
                        window.player.sprite.x, window.player.sprite.y
                    );

                    const speed = 200;
                    missile.body.setVelocity(
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed
                    );

                    // 충돌 체크
                    this.scene.physics.overlap(
                        missile,
                        window.player.sprite,
                        () => {
                            if (window.player.isAlive && !window.player.isInvincible) {
                                window.player.takeDamage(Math.floor(missile.getData('damage')));
                                missile.destroy();
                                updateMissile.remove();
                            }
                        }
                    );
                }
            }
        });
    }

    // 패턴 2: 화염구 (대형 발사체)
    fireball() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        if (!window.player || !window.player.sprite) {
            this.isExecutingPattern = false;
            return;
        }

        const size = this.phase === 1 ? 25 : 35;
        const speed = 250;

        const fireball = this.scene.add.circle(
            this.sprite.x + (60 * this.direction),
            this.sprite.y,
            size,
            0xFF4400
        );

        this.scene.physics.add.existing(fireball);
        fireball.body.setAllowGravity(false);
        fireball.body.setVelocityX(speed * this.direction);

        fireball.setData('damage', this.damage * 1.2);
        fireball.setData('type', 'bossAttack');
        fireball.setData('startTime', this.scene.time.now);
        fireball.setData('lifetime', 2500);

        this.projectiles.push(fireball);

        // 화염구 애니메이션
        this.scene.tweens.add({
            targets: fireball,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.7,
            duration: 300,
            yoyo: true,
            repeat: -1
        });

        // 충돌 체크
        const checkCollision = this.scene.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: () => {
                if (!fireball || !fireball.active) {
                    checkCollision.remove();
                    return;
                }

                const elapsed = this.scene.time.now - fireball.getData('startTime');
                if (elapsed > fireball.getData('lifetime')) {
                    fireball.destroy();
                    checkCollision.remove();
                    return;
                }

                if (window.player && window.player.sprite && window.player.sprite.active) {
                    this.scene.physics.overlap(
                        fireball,
                        window.player.sprite,
                        () => {
                            if (window.player.isAlive && !window.player.isInvincible) {
                                window.player.takeDamage(Math.floor(fireball.getData('damage')));
                                fireball.destroy();
                                checkCollision.remove();
                            }
                        }
                    );
                }
            }
        });

        this.scene.time.delayedCall(800, () => {
            this.isExecutingPattern = false;
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('아크메이지: 화염구');
        }
    }

    // 패턴 3: 낙뢰 (플레이어 위치)
    lightningStrike() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        if (!window.player || !window.player.sprite) {
            this.isExecutingPattern = false;
            return;
        }

        const strikeCount = this.phase === 1 ? 2 : 3;

        for (let i = 0; i < strikeCount; i++) {
            this.scene.time.delayedCall(i * 600, () => {
                if (!window.player || !window.player.sprite) return;

                const targetX = window.player.sprite.x;
                const targetY = window.player.sprite.y;

                // 경고 표시
                const warning = this.scene.add.circle(targetX, targetY, 40, 0xFFFF00, 0.3);
                warning.setStrokeStyle(3, 0xFFFF00);

                this.scene.time.delayedCall(400, () => {
                    warning.destroy();

                    // 번개 발사
                    const lightning = this.scene.add.rectangle(
                        targetX,
                        targetY - 200,
                        20,
                        400,
                        0xFFFF00,
                        0.8
                    );

                    this.scene.physics.add.existing(lightning);
                    lightning.body.setAllowGravity(false);

                    // 플레이어 타격 체크
                    if (window.player && window.player.sprite && window.player.sprite.active) {
                        const distance = Math.abs(window.player.sprite.x - targetX);
                        if (distance < 50 && window.player.isAlive && !window.player.isInvincible) {
                            window.player.takeDamage(this.damage * 1.1);
                        }
                    }

                    // 번개 제거
                    this.scene.time.delayedCall(200, () => {
                        lightning.destroy();
                    });
                });
            });
        }

        this.scene.time.delayedCall(strikeCount * 600 + 800, () => {
            this.isExecutingPattern = false;
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('아크메이지: 낙뢰');
        }
    }

    // 패턴 4: 얼음 폭발 (8방향)
    iceNova() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        const directions = this.phase === 1 ? 8 : 12;
        const angleStep = 360 / directions;

        for (let i = 0; i < directions; i++) {
            const angle = angleStep * i;
            this.shootIceShard(angle);
        }

        this.scene.time.delayedCall(600, () => {
            this.isExecutingPattern = false;
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('아크메이지: 얼음 폭발');
        }
    }

    shootIceShard(angleDeg) {
        const angleRad = angleDeg * Math.PI / 180;
        const speed = 220;

        const shard = this.scene.add.triangle(
            this.sprite.x,
            this.sprite.y,
            0, 0,
            10, 20,
            -10, 20,
            0x00FFFF
        );

        this.scene.physics.add.existing(shard);
        shard.body.setAllowGravity(false);
        shard.body.setVelocity(
            Math.cos(angleRad) * speed,
            Math.sin(angleRad) * speed
        );

        shard.setAngle(angleDeg + 90);

        shard.setData('damage', this.damage * 0.6);
        shard.setData('type', 'bossAttack');
        shard.setData('startTime', this.scene.time.now);
        shard.setData('lifetime', 2000);

        this.projectiles.push(shard);

        // 충돌 체크
        const checkCollision = this.scene.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: () => {
                if (!shard || !shard.active) {
                    checkCollision.remove();
                    return;
                }

                const elapsed = this.scene.time.now - shard.getData('startTime');
                if (elapsed > shard.getData('lifetime')) {
                    shard.destroy();
                    checkCollision.remove();
                    return;
                }

                if (window.player && window.player.sprite && window.player.sprite.active) {
                    this.scene.physics.overlap(
                        shard,
                        window.player.sprite,
                        () => {
                            if (window.player.isAlive && !window.player.isInvincible) {
                                window.player.takeDamage(Math.floor(shard.getData('damage')));
                                shard.destroy();
                                checkCollision.remove();
                            }
                        }
                    );
                }
            }
        });
    }

    // 패턴 5: 순간이동 공격
    teleportStrike() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        if (!window.player || !window.player.sprite) {
            this.isExecutingPattern = false;
            return;
        }

        // 페이드 아웃
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                // 플레이어 근처로 순간이동
                const playerX = window.player.sprite.x;
                const offset = this.phase === 1 ? 100 : 80;
                const teleportX = playerX + (offset * (Math.random() > 0.5 ? 1 : -1));

                this.sprite.x = teleportX;
                this.sprite.y = window.player.sprite.y;

                // 페이드 인
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: 1,
                    duration: 300,
                    onComplete: () => {
                        // 근접 공격
                        const strikeArea = this.scene.add.circle(
                            this.sprite.x,
                            this.sprite.y,
                            80,
                            0xFF00FF,
                            0.4
                        );

                        this.scene.physics.add.existing(strikeArea);
                        strikeArea.body.setAllowGravity(false);

                        // 플레이어 타격 체크
                        if (window.player && window.player.sprite && window.player.sprite.active) {
                            const distance = Phaser.Math.Distance.Between(
                                this.sprite.x, this.sprite.y,
                                window.player.sprite.x, window.player.sprite.y
                            );

                            if (distance < 100 && window.player.isAlive && !window.player.isInvincible) {
                                window.player.takeDamage(this.damage * 1.3);
                            }
                        }

                        // 공격 범위 제거
                        this.scene.time.delayedCall(300, () => {
                            strikeArea.destroy();
                            this.isExecutingPattern = false;
                        });
                    }
                });
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('아크메이지: 순간이동 공격');
        }
    }

    onDeath() {
        // 보스 UI 제거
        if (this.nameText) this.nameText.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        if (this.healthText) this.healthText.destroy();

        // 남은 발사체 제거
        this.projectiles.forEach(proj => {
            if (proj && proj.active) {
                proj.destroy();
            }
        });

        // 보스 처치 이벤트 발생
        this.scene.events.emit('bossDefeated', 3);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('아크메이지 처치!');
        }
    }

    destroy() {
        if (this.nameText) this.nameText.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        if (this.healthText) this.healthText.destroy();

        // 오라 타이머 제거
        if (this.auraTimer) this.auraTimer.remove();
        if (this.auraUpdateTimer) this.auraUpdateTimer.remove();
        if (this.auraPulse) this.auraPulse.destroy();

        super.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.MageBoss = MageBoss;
}
