// Slime Boss (슬라임 킹)
class SlimeBoss extends BaseBoss {
    constructor(scene, x, y) {
        // 적 스탯
        const enemyConfig = {
            WIDTH: 80,
            HEIGHT: 80,
            HP: 400,
            DAMAGE: 20,
            SPEED: 40,
            COLOR: 0x00FF00
        };

        // 보스 설정
        const bossConfig = {
            name: 'SLIME KING',
            color: 0x00FF00
        };

        super(scene, x, y, bossConfig, enemyConfig);

        // Rectangle sprite 제거
        if (this.sprite) {
            this.sprite.destroy();
        }

        // Slime 스프라이트시트로 교체 (보스 버전 - 크게)
        this.sprite = scene.add.sprite(x, y, 'slime_idle');
        this.sprite.play('slime_idle');
        this.sprite.setScale(2.5); // 보스는 일반 슬라임보다 훨씬 크게

        // 물리 바디 재설정
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setBounce(0.1);
        this.sprite.body.setCollideWorldBounds(true);

        // 히트박스 조정 (44x30 스프라이트 * 2.5 스케일)
        this.sprite.body.setSize(40, 26);
        this.sprite.body.setOffset(2, 4);

        // 데이터 재설정
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'enemy');
        this.sprite.setData('damage', this.damage);

        // 공격 패턴
        this.currentPattern = null;
        this.patternCooldown = 0;
        this.patternInterval = 3000; // 3초마다 패턴 실행
        this.isExecutingPattern = false;

        // 소환된 미니언
        this.minions = [];

        // 보스 오라 생성
        this.createAura();
    }

    // 보스 오라 (지속적인 파티클 효과)
    createAura() {
        // 페이즈에 따라 오라 색상 변경
        const getAuraColor = () => {
            return this.phase === 1 ? 0x00FF00 : 0xFF4444;
        };

        // 오라 파티클 생성
        this.auraTimer = this.scene.time.addEvent({
            delay: 100,
            repeat: -1,
            callback: () => {
                if (!this.sprite || !this.sprite.active || !this.isAlive) {
                    if (this.auraTimer) this.auraTimer.remove();
                    return;
                }

                // 랜덤 위치에 파티클 생성
                const angle = Math.random() * Math.PI * 2;
                const radius = 50;
                const particle = this.scene.add.circle(
                    this.sprite.x + Math.cos(angle) * radius,
                    this.sprite.y + Math.sin(angle) * radius,
                    Math.random() * 4 + 2,
                    getAuraColor(),
                    0.6
                );

                // 파티클 상승 및 페이드
                this.scene.tweens.add({
                    targets: particle,
                    y: particle.y - 30,
                    alpha: 0,
                    duration: 1000,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            }
        });

        // 펄스 효과 (보스 주변 빛나는 원)
        this.auraPulse = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            60,
            getAuraColor(),
            0.1
        );
        this.auraPulse.setStrokeStyle(2, getAuraColor(), 0.3);

        this.scene.tweens.add({
            targets: this.auraPulse,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 1500,
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
                    this.auraPulse.setFillStyle(getAuraColor(), 0.1);
                    this.auraPulse.setStrokeStyle(2, getAuraColor(), 0.3);
                }
            }
        });
    }

    updateHealthBar() {
        // BaseBoss의 updateHealthBar 호출
        super.updateHealthBar();

        // 페이즈 체크 (SlimeBoss 전용)
        const hpRatio = this.hp / this.maxHp;
        if (this.phase === 1 && hpRatio <= 0.5) {
            this.enterPhase2();
        }
    }

    enterPhase2() {
        this.phase = 2;
        this.patternInterval = 2000; // 공격 속도 증가

        // 화면 플래시 (흰색)
        const flash = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0xFFFFFF,
            0.8
        );
        flash.setScrollFactor(0);
        flash.setDepth(1999);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                flash.destroy();
            }
        });

        // 카메라 쉐이크
        this.scene.cameras.main.shake(800, 0.015);

        // 폭발 파티클 (8방향)
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const particle = this.scene.add.circle(
                this.sprite.x,
                this.sprite.y,
                Math.random() * 8 + 5,
                0xFF4444,
                0.8
            );

            this.scene.physics.add.existing(particle);
            particle.body.setVelocity(
                Math.cos(angle) * 200,
                Math.sin(angle) * 200
            );

            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.3,
                duration: 800,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // 페이즈 2 알림
        const phaseText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            '⚡ PHASE 2 ⚡',
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
        phaseText.setScale(0);

        this.scene.tweens.add({
            targets: phaseText,
            scale: 1.5,
            duration: 500,
            ease: 'Back.easeOut'
        });

        this.scene.time.delayedCall(1000, () => {
            this.scene.tweens.add({
                targets: phaseText,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    phaseText.destroy();
                }
            });
        });

        // 보스 색상 변경 (스프라이트에 틴트 적용)
        this.sprite.setTint(0xFF4444);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('슬라임 킹 페이즈 2 돌입!');
        }
    }

    // BaseBoss에서 이미 takeDamage와 updateHealthBar를 처리하므로 제거

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

            // 플레이어에게 천천히 이동
            const distance = Math.abs(this.sprite.x - playerX);
            if (distance > 100) {
                this.sprite.body.setVelocityX(this.speed * this.direction);
                this.sprite.play('slime_run', true);
            } else {
                this.sprite.body.setVelocityX(0);
                this.sprite.play('slime_idle', true);
            }

            // 방향에 따라 스프라이트 뒤집기
            if (this.direction > 0) {
                this.sprite.setFlipX(false);
            } else {
                this.sprite.setFlipX(true);
            }
        }
    }

    executeRandomPattern() {
        const patterns = ['jumpSlam', 'shootSlimes', 'split'];
        const randomPattern = Phaser.Utils.Array.GetRandom(patterns);

        this[randomPattern]();
    }

    // 패턴 1: 점프 슬램
    jumpSlam() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        // 차징 효과 (찌그러지면서 에너지 모음)
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 2.3,
            scaleY: 1.7,
            duration: 300,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        // 차징 파티클 (아래로 모임)
        for (let i = 0; i < 8; i++) {
            this.scene.time.delayedCall(i * 40, () => {
                if (!this.sprite || !this.sprite.active) return;

                const particle = this.scene.add.circle(
                    this.sprite.x + (Math.random() - 0.5) * 100,
                    this.sprite.y - Math.random() * 50,
                    Math.random() * 5 + 3,
                    0x00FF00,
                    0.7
                );

                this.scene.tweens.add({
                    targets: particle,
                    x: this.sprite.x,
                    y: this.sprite.y + 40,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }

        // 점프 실행 (차징 후)
        this.scene.time.delayedCall(300, () => {
            // 높이 점프
            const jumpPower = this.phase === 1 ? -600 : -700;
            this.sprite.body.setVelocityY(jumpPower);
        });

        // 착지 감지
        const checkLanding = this.scene.time.addEvent({
            delay: 100,
            repeat: -1,
            callback: () => {
                if (this.sprite.body.touching.down) {
                    checkLanding.remove();
                    this.createShockwave();
                    this.isExecutingPattern = false;
                }
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('슬라임 킹: 점프 슬램');
        }
    }

    createShockwave() {
        const range = this.phase === 1 ? 150 : 200;

        // 좌우 충격파
        [-1, 1].forEach(dir => {
            const shockwave = this.scene.add.circle(
                this.sprite.x,
                this.sprite.y + 40,
                20,
                0x00FF00,
                0.6
            );

            this.scene.physics.add.existing(shockwave);
            shockwave.body.setAllowGravity(false);
            shockwave.body.setVelocityX(200 * dir);

            shockwave.setData('damage', this.damage);
            shockwave.setData('type', 'bossAttack');
            shockwave.setData('startX', this.sprite.x);
            shockwave.setData('range', range);

            // 충격파 확대 애니메이션
            this.scene.tweens.add({
                targets: shockwave,
                scaleX: 3,
                scaleY: 1.5,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    shockwave.destroy();
                }
            });

            // 플레이어와 충돌 체크
            const checkCollision = this.scene.time.addEvent({
                delay: 50,
                repeat: -1,
                callback: () => {
                    if (!shockwave || !shockwave.active) {
                        checkCollision.remove();
                        return;
                    }

                    const distance = Math.abs(shockwave.x - shockwave.getData('startX'));
                    if (distance > range) {
                        shockwave.destroy();
                        checkCollision.remove();
                        return;
                    }

                    if (window.player && window.player.sprite && window.player.sprite.active) {
                        this.scene.physics.overlap(
                            shockwave,
                            window.player.sprite,
                            () => {
                                if (window.player.isAlive && !window.player.isInvincible) {
                                    window.player.takeDamage(this.damage);
                                }
                            }
                        );
                    }
                }
            });
        });

        // 카메라 쉐이크
        this.scene.cameras.main.shake(300, 0.01);
    }

    // 패턴 2: 슬라임 탄 발사
    shootSlimes() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        const shotCount = this.phase === 1 ? 3 : 5;
        const angleStep = this.phase === 1 ? 30 : 20;
        const startAngle = -(angleStep * (shotCount - 1) / 2);

        for (let i = 0; i < shotCount; i++) {
            const angle = startAngle + (angleStep * i);
            this.scene.time.delayedCall(i * 100, () => {
                this.shootSlimeProjectile(angle);
            });
        }

        this.scene.time.delayedCall(shotCount * 100 + 500, () => {
            this.isExecutingPattern = false;
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('슬라임 킹: 슬라임 탄 발사');
        }
    }

    shootSlimeProjectile(angleDeg) {
        const angleRad = (angleDeg + (this.direction > 0 ? 0 : 180)) * Math.PI / 180;
        const speed = 250;

        const projectile = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            12,
            0x44FF44
        );

        this.scene.physics.add.existing(projectile);
        projectile.body.setAllowGravity(false);
        projectile.body.setVelocity(
            Math.cos(angleRad) * speed,
            Math.sin(angleRad) * speed
        );

        projectile.setData('damage', this.damage * 0.7);
        projectile.setData('type', 'bossAttack');
        projectile.setData('startTime', this.scene.time.now);
        projectile.setData('lifetime', 2000);

        // 회전 애니메이션
        this.scene.tweens.add({
            targets: projectile,
            scaleX: 1.3,
            scaleY: 0.7,
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        // 플레이어와 충돌 체크
        const checkCollision = this.scene.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: () => {
                if (!projectile || !projectile.active) {
                    checkCollision.remove();
                    return;
                }

                const elapsed = this.scene.time.now - projectile.getData('startTime');
                if (elapsed > projectile.getData('lifetime')) {
                    projectile.destroy();
                    checkCollision.remove();
                    return;
                }

                if (window.player && window.player.sprite && window.player.sprite.active) {
                    this.scene.physics.overlap(
                        projectile,
                        window.player.sprite,
                        () => {
                            if (window.player.isAlive && !window.player.isInvincible) {
                                window.player.takeDamage(Math.floor(projectile.getData('damage')));
                                projectile.destroy();
                                checkCollision.remove();
                            }
                        }
                    );
                }
            }
        });
    }

    // 패턴 3: 분열 (미니언 소환)
    split() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        const minionCount = this.phase === 1 ? 2 : 3;

        // 분열 이펙트
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 2.5,
            scaleY: 1.5,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                for (let i = 0; i < minionCount; i++) {
                    this.summonMinion(i, minionCount);
                }
                this.isExecutingPattern = false;
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('슬라임 킹: 분열 소환');
        }
    }

    summonMinion(index, total) {
        const offset = (index - (total - 1) / 2) * 80;
        const minion = new Slime(this.scene, this.sprite.x + offset, this.sprite.y - 50);

        // 미니언은 작게
        minion.sprite.setScale(0.7);
        minion.hp = 15;

        this.minions.push(minion);

        // BossRushScene의 플랫폼과 충돌 설정
        if (this.scene.platforms) {
            this.scene.physics.add.collider(minion.sprite, this.scene.platforms);
        }
        if (this.scene.groundGroup) {
            this.scene.physics.add.collider(minion.sprite, this.scene.groundGroup);
        }

        // Scene의 enemies 그룹에 추가
        if (this.scene.enemies) {
            this.scene.enemies.add(minion.sprite);
        }

        // Scene의 enemyList에 추가
        if (this.scene.enemyList) {
            this.scene.enemyList.push(minion);
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('미니언 소환됨, 위치:', minion.sprite.x, minion.sprite.y);
        }
    }

    playHitEffect() {
        // 피격 애니메이션
        this.sprite.play('slime_hit');

        // 원래 애니메이션으로 복귀
        this.scene.time.delayedCall(400, () => {
            if (this.sprite && this.sprite.active && this.isAlive) {
                this.sprite.play('slime_idle');
            }
        });

        // 넉백
        const knockbackDirection = this.direction * -1;
        this.sprite.body.setVelocityX(50 * knockbackDirection);
        this.sprite.body.setVelocityY(-30);

        // 피격 파티클
        for (let i = 0; i < 5; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                if (!this.sprite || !this.sprite.active) return;

                const particle = this.scene.add.circle(
                    this.sprite.x + (Math.random() - 0.5) * 40,
                    this.sprite.y + (Math.random() - 0.5) * 26,
                    Math.random() * 6 + 3,
                    this.phase === 1 ? 0x44FF44 : 0xFF4444,
                    0.8
                );

                this.scene.physics.add.existing(particle);
                particle.body.setVelocity(
                    (Math.random() - 0.5) * 100,
                    -Math.random() * 100
                );

                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }
    }

    onDeath() {
        // 화려한 보스 처치 파티클 효과
        // 1. 화면 플래시 (흰색)
        const deathFlash = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0xFFFFFF,
            0.9
        );
        deathFlash.setScrollFactor(0);
        deathFlash.setDepth(1999);

        this.scene.tweens.add({
            targets: deathFlash,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                deathFlash.destroy();
            }
        });

        // 2. 카메라 쉐이크 (강렬하게)
        this.scene.cameras.main.shake(1200, 0.025);

        // 3. 폭발 파티클 (여러 단계)
        // 1단계: 큰 폭발
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            this.scene.time.delayedCall(i * 20, () => {
                if (!this.sprite) return;

                const particle = this.scene.add.star(
                    this.sprite.x,
                    this.sprite.y,
                    8,
                    10,
                    20,
                    this.phase === 1 ? 0x00FF00 : 0xFF4444,
                    1
                );

                this.scene.physics.add.existing(particle);
                particle.body.setVelocity(
                    Math.cos(angle) * 300,
                    Math.sin(angle) * 300
                );

                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0.3,
                    angle: 720,
                    duration: 1200,
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }

        // 2단계: 작은 폭발 파티클
        for (let i = 0; i < 40; i++) {
            this.scene.time.delayedCall(i * 15, () => {
                if (!this.sprite) return;

                const angle = Math.random() * Math.PI * 2;
                const speed = 150 + Math.random() * 150;

                const particle = this.scene.add.circle(
                    this.sprite.x,
                    this.sprite.y,
                    Math.random() * 8 + 4,
                    Phaser.Display.Color.RandomRGB().color,
                    0.9
                );

                this.scene.physics.add.existing(particle);
                particle.body.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );

                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0.2,
                    duration: 800,
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }

        // 3단계: 승리 텍스트
        this.scene.time.delayedCall(500, () => {
            const victoryText = this.scene.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                CONSTANTS.GAME.HEIGHT / 2 - 50,
                '★ BOSS DEFEATED! ★',
                {
                    fontSize: '48px',
                    fill: '#FFD700',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 8
                }
            );
            victoryText.setOrigin(0.5);
            victoryText.setScrollFactor(0);
            victoryText.setDepth(2000);
            victoryText.setScale(0);

            this.scene.tweens.add({
                targets: victoryText,
                scale: 1.3,
                duration: 600,
                ease: 'Back.easeOut'
            });

            this.scene.time.delayedCall(1500, () => {
                this.scene.tweens.add({
                    targets: victoryText,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        victoryText.destroy();
                    }
                });
            });
        });

        // 미니언 제거
        this.minions.forEach(minion => {
            if (minion && minion.isAlive) {
                minion.destroy();
            }
        });

        // 보스 처치 이벤트 발생
        this.scene.events.emit('bossDefeated', 1);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('슬라임 킹 처치!');
        }
    }

    destroy() {
        // 오라 타이머 제거
        if (this.auraTimer) this.auraTimer.remove();
        if (this.auraUpdateTimer) this.auraUpdateTimer.remove();
        if (this.auraPulse) this.auraPulse.destroy();

        // BaseBoss의 destroy 호출 (UI 정리 포함)
        super.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.SlimeBoss = SlimeBoss;
}
