// Sword Boss (레드 나이트) - 간소화 버전
class SwordBoss extends Enemy {
    constructor(scene, x, y) {
        // 보스 스탯
        const bossConfig = {
            WIDTH: 80,
            HEIGHT: 80,
            HP: 500,
            DAMAGE: 25,
            SPEED: 50,
            COLOR: 0xFF0000
        };

        super(scene, x, y, bossConfig);

        // 보스 전용 속성
        this.isBoss = true;
        this.bossName = 'RED KNIGHT';
        this.maxHp = this.hp;
        this.phase = 1;

        // 공격 패턴
        this.patternCooldown = 0;
        this.patternInterval = 2500;
        this.isExecutingPattern = false;

        // 보스 외형
        this.sprite.setScale(2);
        this.sprite.setFillStyle(0xFF4444);

        // 보스 체력바 생성
        this.createHealthBar();

        if (CONSTANTS.GAME.DEBUG) {
            console.log('레드 나이트 생성:', this.maxHp, 'HP');
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
            this.healthBarFill.setFillStyle(0xff8800);
        } else {
            this.healthBarFill.setFillStyle(0xff00ff);
        }

        this.healthText.setText(`${this.hp}/${this.maxHp}`);

        // 페이즈 2 전환
        if (this.phase === 1 && hpRatio <= 0.5) {
            this.enterPhase2();
        }
    }

    enterPhase2() {
        this.phase = 2;
        this.patternInterval = 1800;

        // 화면 플래시
        const flash = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0xFF0000,
            0.6
        );
        flash.setScrollFactor(0);
        flash.setDepth(1999);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 600,
            onComplete: () => {
                flash.destroy();
            }
        });

        // 카메라 쉐이크
        this.scene.cameras.main.shake(500, 0.02);

        // 페이즈 2 알림
        const phaseText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            '⚔️ PHASE 2 ⚔️',
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

        this.sprite.setFillStyle(0xCC0000);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('레드 나이트 페이즈 2 돌입!');
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

        // 패턴 실행
        if (currentTime - this.patternCooldown > this.patternInterval) {
            this.patternCooldown = currentTime;
            this.executeAttackPattern();
        }

        // 플레이어 추적
        if (window.player && window.player.sprite && window.player.sprite.active) {
            const playerX = window.player.sprite.x;
            this.direction = playerX > this.sprite.x ? 1 : -1;

            const distance = Math.abs(this.sprite.x - playerX);
            if (distance > 150) {
                this.sprite.body.setVelocityX(this.speed * this.direction);
            } else {
                this.sprite.body.setVelocityX(0);
            }
        }
    }

    executeAttackPattern() {
        const patterns = ['dashAttack', 'swordWave', 'slashCombo'];
        const randomPattern = Phaser.Utils.Array.GetRandom(patterns);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('레드 나이트 패턴:', randomPattern);
        }

        this[randomPattern]();
    }

    // 패턴 1: 대시 공격
    dashAttack() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        const dashSpeed = this.phase === 1 ? 400 : 500;

        // 대시
        this.sprite.setFillStyle(0xFFFFFF);
        this.sprite.body.setVelocityX(dashSpeed * this.direction);

        this.scene.time.delayedCall(100, () => {
            if (this.sprite && this.sprite.active) {
                this.sprite.setFillStyle(this.phase === 1 ? 0xFF4444 : 0xCC0000);
            }
        });

        this.scene.time.delayedCall(300, () => {
            if (this.sprite && this.sprite.body) {
                this.sprite.body.setVelocityX(0);
            }
            this.isExecutingPattern = false;
        });
    }

    // 패턴 2: 검기 발사
    swordWave() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        const waveCount = this.phase === 1 ? 1 : 2;

        for (let i = 0; i < waveCount; i++) {
            this.scene.time.delayedCall(i * 300, () => {
                this.shootWave();
            });
        }

        this.scene.time.delayedCall(waveCount * 300 + 500, () => {
            this.isExecutingPattern = false;
        });
    }

    shootWave() {
        if (!this.sprite || !this.sprite.active) return;

        const speed = 300;
        const wave = this.scene.add.rectangle(
            this.sprite.x + (50 * this.direction),
            this.sprite.y,
            15,
            40,
            0xFF8888
        );

        this.scene.physics.add.existing(wave);
        wave.body.setAllowGravity(false);
        wave.body.setVelocityX(speed * this.direction);

        this.scene.tweens.add({
            targets: wave,
            angle: 360 * this.direction,
            duration: 1000,
            repeat: -1
        });

        // 2초 후 제거
        this.scene.time.delayedCall(2000, () => {
            if (wave && wave.active) {
                wave.destroy();
            }
        });

        // 플레이어 충돌 체크
        const checkCollision = this.scene.time.addEvent({
            delay: 50,
            repeat: 40,
            callback: () => {
                if (!wave || !wave.active) {
                    checkCollision.remove();
                    return;
                }

                if (window.player && window.player.sprite && window.player.sprite.active) {
                    this.scene.physics.overlap(wave, window.player.sprite, () => {
                        if (window.player.isAlive && !window.player.isInvincible) {
                            window.player.takeDamage(Math.floor(this.damage * 0.8));
                            if (wave && wave.active) {
                                wave.destroy();
                            }
                            checkCollision.remove();
                        }
                    });
                }
            }
        });
    }

    // 패턴 3: 연속 베기
    slashCombo() {
        this.isExecutingPattern = true;
        this.sprite.body.setVelocityX(0);

        const slashCount = 3;
        const slashDelay = this.phase === 1 ? 400 : 300;

        for (let i = 0; i < slashCount; i++) {
            this.scene.time.delayedCall(i * slashDelay, () => {
                this.performSlash();
            });
        }

        this.scene.time.delayedCall(slashCount * slashDelay + 300, () => {
            this.isExecutingPattern = false;
        });
    }

    performSlash() {
        if (!this.sprite || !this.sprite.active) return;

        const slash = this.scene.add.rectangle(
            this.sprite.x + (50 * this.direction),
            this.sprite.y,
            80,
            60,
            0xFF0000,
            0.3
        );

        this.scene.physics.add.existing(slash);
        slash.body.setAllowGravity(false);

        if (window.player && window.player.sprite && window.player.sprite.active) {
            this.scene.physics.overlap(slash, window.player.sprite, () => {
                if (window.player.isAlive && !window.player.isInvincible) {
                    window.player.takeDamage(this.damage);
                }
            });
        }

        this.scene.time.delayedCall(200, () => {
            if (slash && slash.active) {
                slash.destroy();
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
        this.scene.events.emit('bossDefeated', 2);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('레드 나이트 처치!');
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
    window.SwordBoss = SwordBoss;
    console.log('✅ SwordBoss 클래스 등록 완료');
} else {
    console.error('❌ window 객체를 찾을 수 없습니다');
}
