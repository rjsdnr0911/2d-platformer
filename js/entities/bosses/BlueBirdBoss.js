// BlueBird Boss (스테이지 4 보스 - 푸른 새)
class BlueBirdBoss extends Enemy {
    constructor(scene, x, y) {
        // 보스 스탯
        const bossConfig = {
            WIDTH: 32,
            HEIGHT: 32,
            HP: 700,
            DAMAGE: 40,
            SPEED: 90,
            COLOR: 0x0000FF
        };

        super(scene, x, y, bossConfig);

        // Rectangle sprite 제거
        if (this.sprite) {
            this.sprite.destroy();
        }

        // BlueBird 스프라이트시트로 교체
        this.sprite = scene.add.sprite(x, y, 'bluebird_flying');
        this.sprite.play('bluebird_flying');
        this.sprite.setScale(2.2); // 보스는 더 크게

        // 물리 바디 재설정
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setBounce(0.1);
        this.sprite.body.setCollideWorldBounds(true);

        // 히트박스 조정 (32x32 스프라이트 기준)
        this.sprite.body.setSize(28, 28);
        this.sprite.body.setOffset(2, 2);

        // 중력 제거 (비행)
        this.sprite.body.setAllowGravity(false);

        // 데이터 재설정
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'enemy');
        this.sprite.setData('damage', this.damage);

        // 보스 전용 속성
        this.isBoss = true;
        this.bossName = 'SKY GUARDIAN';
        this.maxHp = this.hp;
        this.phase = 1;

        // 공격 패턴
        this.patternCooldown = 0;
        this.patternInterval = 2800;
        this.isExecutingPattern = false;

        // 비행 효과
        this.initialY = y;
        this.flyAmplitude = 40;
        this.flySpeed = 0.0015;

        // 보스 체력바 생성
        this.createHealthBar();

        if (CONSTANTS.GAME.DEBUG) {
            console.log('BlueBird 보스 생성:', this.maxHp, 'HP');
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
                fill: '#00BFFF',
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
            0x00BFFF
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
            this.healthBarFill.setFillStyle(0x00BFFF); // 청록색
        } else if (hpRatio > 0.25) {
            this.healthBarFill.setFillStyle(0x1E90FF); // 진한 파랑
        } else {
            this.healthBarFill.setFillStyle(0x0000CD); // 남색
        }

        this.healthText.setText(`${this.hp}/${this.maxHp}`);

        // 페이즈 2 전환
        if (this.phase === 1 && hpRatio <= 0.5) {
            this.enterPhase2();
        }
    }

    enterPhase2() {
        this.phase = 2;
        this.patternInterval = 2000; // 공격 더 빠르게
        this.flySpeed = 0.0025; // 비행 속도 증가

        // 화면 플래시 (파란색)
        const flash = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0x00BFFF,
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
            '🌪️ TEMPEST MODE 🌪️',
            {
                fontSize: '64px',
                fill: '#00BFFF',
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
            console.log('BlueBird 보스 페이즈 2 돌입!');
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

        // 맵 경계 체크
        const margin = 80;
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

        // 비행 효과 (더 역동적)
        const time = this.scene.time.now;
        const flyY = this.initialY + Math.sin(time * this.flySpeed) * this.flyAmplitude;

        // Y 좌표 경계 체크 (바닥 밑으로 안 내려가도록)
        const minY = 150;
        const maxY = CONSTANTS.GAME.HEIGHT - 100;
        this.sprite.y = Phaser.Math.Clamp(flyY, minY, maxY);

        // 플레이어 추적 (빠르게)
        if (window.player && window.player.sprite && window.player.sprite.active) {
            const playerX = window.player.sprite.x;
            this.direction = playerX > this.sprite.x ? 1 : -1;

            const distance = Math.abs(this.sprite.x - playerX);
            if (distance > 200) {
                this.sprite.body.setVelocityX(this.speed * this.direction);
            } else {
                this.sprite.body.setVelocityX(this.speed * 0.5 * this.direction);
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
        const patterns = ['windGust', 'diveBomb', 'featherStorm'];
        const randomPattern = Phaser.Utils.Array.GetRandom(patterns);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('BlueBird 보스 패턴:', randomPattern);
        }

        this[randomPattern]();
    }

    // 패턴 1: 바람 돌풍 (수평 발사)
    windGust() {
        this.isExecutingPattern = true;

        const gustCount = this.phase === 1 ? 3 : 5;

        for (let i = 0; i < gustCount; i++) {
            this.scene.time.delayedCall(i * 350, () => {
                this.shootWindGust();
            });
        }

        this.scene.time.delayedCall(gustCount * 350 + 500, () => {
            this.isExecutingPattern = false;
        });
    }

    shootWindGust() {
        if (!this.sprite || !this.sprite.active || !window.player) return;

        const gust = this.scene.add.ellipse(
            this.sprite.x + (this.direction * 30),
            this.sprite.y,
            25,
            15,
            0x87CEEB,
            0.8
        );

        this.scene.physics.add.existing(gust);
        gust.body.setAllowGravity(false);

        // 플레이어 방향으로 발사
        const speed = this.phase === 1 ? 350 : 420;
        gust.body.setVelocityX(this.direction * speed);

        gust.setData('damage', this.damage * 0.8);
        gust.setData('startTime', this.scene.time.now);

        // 회전 효과
        this.scene.tweens.add({
            targets: gust,
            angle: 360,
            duration: 800,
            repeat: -1
        });

        // 플레이어 충돌 체크
        this.createProjectileCollision(gust, 4000);
    }

    // 패턴 2: 급강하 공격
    diveBomb() {
        this.isExecutingPattern = true;

        if (!window.player || !window.player.sprite) {
            this.isExecutingPattern = false;
            return;
        }

        // 플레이어 위로 순간이동
        const targetX = window.player.sprite.x;
        const targetY = 150;

        this.scene.tweens.add({
            targets: this.sprite,
            x: targetX,
            y: targetY,
            duration: 400,
            ease: 'Power2'
        });

        this.scene.time.delayedCall(600, () => {
            // 급강하
            const diveSpeed = this.phase === 1 ? 600 : 800;
            this.sprite.body.setVelocityY(diveSpeed);

            // 급강하 중 충돌 데미지 증가
            const originalDamage = this.damage;
            this.sprite.setData('damage', this.damage * 1.5);

            this.scene.time.delayedCall(800, () => {
                // 원래대로 복귀
                this.sprite.body.setVelocityY(0);
                this.sprite.setData('damage', originalDamage);
                this.initialY = this.sprite.y;

                this.scene.time.delayedCall(300, () => {
                    this.isExecutingPattern = false;
                });
            });
        });
    }

    // 패턴 3: 깃털 폭풍 (사방으로 퍼짐)
    featherStorm() {
        this.isExecutingPattern = true;

        const featherCount = this.phase === 1 ? 8 : 12;

        for (let i = 0; i < featherCount; i++) {
            const angle = (i / featherCount) * Math.PI * 2;

            const feather = this.scene.add.triangle(
                this.sprite.x,
                this.sprite.y,
                0, 0,
                8, 12,
                16, 0,
                0x87CEEB,
                0.9
            );

            this.scene.physics.add.existing(feather);
            feather.body.setAllowGravity(false);

            const speed = this.phase === 1 ? 180 : 220;
            feather.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            // 깃털 회전 효과
            this.scene.tweens.add({
                targets: feather,
                angle: 360,
                duration: 1000,
                repeat: -1
            });

            feather.setData('damage', this.damage * 0.6);
            feather.setData('startTime', this.scene.time.now);

            // 플레이어 충돌 체크
            this.createProjectileCollision(feather, 3500);
        }

        this.scene.time.delayedCall(1000, () => {
            this.isExecutingPattern = false;
        });
    }

    // 투사체 충돌 처리 헬퍼 함수
    createProjectileCollision(projectile, lifetime) {
        const checkCollision = this.scene.time.addEvent({
            delay: 50,
            repeat: Math.floor(lifetime / 50),
            callback: () => {
                if (!projectile || !projectile.active) {
                    checkCollision.remove();
                    return;
                }

                const elapsed = this.scene.time.now - projectile.getData('startTime');
                if (elapsed > lifetime) {
                    projectile.destroy();
                    checkCollision.remove();
                    return;
                }

                if (window.player && window.player.sprite && window.player.sprite.active) {
                    this.scene.physics.overlap(projectile, window.player.sprite, () => {
                        if (window.player.isAlive && !window.player.isInvincible) {
                            window.player.takeDamage(Math.floor(projectile.getData('damage')));
                            projectile.destroy();
                            checkCollision.remove();
                        }
                    });
                }
            }
        });
    }

    playHitEffect() {
        // 피격 애니메이션
        this.sprite.play('bluebird_hit');

        // 원래 애니메이션으로 복귀
        this.scene.time.delayedCall(300, () => {
            if (this.sprite && this.sprite.active && this.isAlive) {
                this.sprite.play('bluebird_flying');
            }
        });

        // 피격 파티클 (푸른 깃털)
        for (let i = 0; i < 5; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                if (!this.sprite || !this.sprite.active) return;

                const particle = this.scene.add.triangle(
                    this.sprite.x + (Math.random() - 0.5) * 50,
                    this.sprite.y + (Math.random() - 0.5) * 50,
                    0, 0,
                    4, 8,
                    8, 0,
                    0x87CEEB,
                    0.9
                );

                this.scene.physics.add.existing(particle);
                particle.body.setAllowGravity(false);
                particle.body.setVelocity(
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 150
                );

                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    angle: 360,
                    duration: 500,
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }
    }

    onDeath() {
        // 보스 UI 제거
        if (this.nameText) this.nameText.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        if (this.healthText) this.healthText.destroy();

        // 보스 처치 이벤트
        this.scene.events.emit('bossDefeated', 4);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('BlueBird 보스 처치!');
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
    window.BlueBirdBoss = BlueBirdBoss;
    console.log('✅ BlueBirdBoss 클래스 등록 완료');
} else {
    console.error('❌ window 객체를 찾을 수 없습니다');
}
