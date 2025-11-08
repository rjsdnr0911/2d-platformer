// 로그라이크 모드 전용 플레이어 클래스 (스컬 시스템 통합)
class RoguelikePlayer {
    constructor(scene, x, y) {
        this.scene = scene;
        this.active = true;

        // 플레이어 스프라이트 생성 (physics.add.sprite 사용)
        this.sprite = scene.physics.add.sprite(x, y, null);

        // 원형으로 그리기 (간단한 시각화)
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x00AAFF, 1);
        graphics.fillCircle(0, 0, 20);
        graphics.generateTexture('player_circle', 40, 40);
        graphics.destroy();

        this.sprite.setTexture('player_circle');
        this.sprite.setDisplaySize(40, 40);

        // 물리 설정
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setMaxVelocity(300, 1000);
        this.sprite.body.setSize(30, 30);

        // 기본 스탯 (스컬에 의해 변경됨)
        this.maxHealth = 100;
        this.health = 100;
        this.moveSpeed = 200;
        this.jumpVelocity = -400;
        this.attackPower = 10;
        this.attackRange = 60;
        this.attackMultiplier = 1.0;

        // 상태
        this.isInvincible = false;
        this.canAttack = true;
        this.attackCooldown = 300;

        // 스킬 관련
        this.skill1 = null;
        this.skill2 = null;
        this.skill1Cooldown = 3000;
        this.skill2Cooldown = 8000;
        this.lastSkill1Time = 0;
        this.lastSkill2Time = 0;

        // 입력
        this.keys = scene.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            z: Phaser.Input.Keyboard.KeyCodes.Z,      // 기본 공격
            x: Phaser.Input.Keyboard.KeyCodes.X,      // 스킬 1
            c: Phaser.Input.Keyboard.KeyCodes.C,      // 스킬 2
            space: Phaser.Input.Keyboard.KeyCodes.SPACE  // 스컬 교체
        });

        // 스컬 매니저 (나중에 초기화)
        this.skullManager = null;

        // 기본 공격 함수 (스컬에 의해 오버라이드됨)
        this.basicAttack = this.defaultBasicAttack;

        // HP UI 생성
        this.createHealthUI();

        if (CONSTANTS.GAME.DEBUG) {
            console.log('RoguelikePlayer created with Skull system');
        }
    }

    // 스컬 매니저 초기화 (Scene에서 호출)
    initSkullManager(startingSkull = null) {
        this.skullManager = new SkullManager(this);
        this.skullManager.createUI(this.scene);

        // 시작 스컬 장착
        if (startingSkull) {
            this.skullManager.equipSkull(startingSkull, 0);
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('SkullManager initialized');
        }
    }

    // HP UI 생성
    createHealthUI() {
        const uiX = 20;
        const uiY = 20;

        // HP 바 배경
        this.hpBarBg = this.scene.add.rectangle(uiX, uiY, 200, 20, 0x333333);
        this.hpBarBg.setOrigin(0, 0);
        this.hpBarBg.setScrollFactor(0);
        this.hpBarBg.setDepth(100);

        // HP 바
        this.hpBar = this.scene.add.rectangle(uiX + 2, uiY + 2, 196, 16, 0x00FF00);
        this.hpBar.setOrigin(0, 0);
        this.hpBar.setScrollFactor(0);
        this.hpBar.setDepth(101);

        // HP 텍스트
        this.hpText = this.scene.add.text(uiX + 100, uiY + 10, '', {
            fontFamily: 'Jua',
            fontSize: '14px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        this.hpText.setOrigin(0.5);
        this.hpText.setScrollFactor(0);
        this.hpText.setDepth(102);

        this.updateHealthUI();
    }

    // HP UI 업데이트
    updateHealthUI() {
        if (!this.hpBar) return;

        const hpRatio = Math.max(0, this.health / this.maxHealth);
        this.hpBar.width = 196 * hpRatio;

        // 색상 변경
        if (hpRatio > 0.5) {
            this.hpBar.setFillStyle(0x00FF00);
        } else if (hpRatio > 0.25) {
            this.hpBar.setFillStyle(0xFFFF00);
        } else {
            this.hpBar.setFillStyle(0xFF0000);
        }

        this.hpText.setText(`${Math.floor(this.health)} / ${this.maxHealth}`);
    }

    // 업데이트
    update(time, delta) {
        if (!this.active || !this.sprite || !this.sprite.body) return;

        this.handleMovement();
        this.handleJump();
        this.handleAttack(time);
        this.handleSkills(time);
        this.handleSkullSwap();

        // 스컬 매니저 업데이트
        if (this.skullManager) {
            this.skullManager.update(time, delta);
        }

        this.updateHealthUI();
    }

    // 이동
    handleMovement() {
        if (this.keys.left.isDown) {
            this.sprite.setVelocityX(-this.moveSpeed);
            this.sprite.flipX = true;
        } else if (this.keys.right.isDown) {
            this.sprite.setVelocityX(this.moveSpeed);
            this.sprite.flipX = false;
        } else {
            this.sprite.setVelocityX(0);
        }
    }

    // 점프
    handleJump() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
            if (this.sprite.body.touching.down) {
                this.sprite.setVelocityY(this.jumpVelocity);
            }
        }
    }

    // 공격 (기본 공격 또는 스컬의 공격)
    handleAttack(time) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.z) && this.canAttack) {
            // 스컬의 기본 공격 실행
            if (typeof this.basicAttack === 'function') {
                this.basicAttack();
            }

            // 공격 쿨다운
            this.canAttack = false;
            this.scene.time.delayedCall(this.attackCooldown, () => {
                this.canAttack = true;
            });
        }
    }

    // 스킬 사용
    handleSkills(time) {
        // 스킬 1 (X)
        if (Phaser.Input.Keyboard.JustDown(this.keys.x)) {
            if (this.skill1 && time - this.lastSkill1Time >= this.skill1Cooldown) {
                if (typeof this.skill1.execute === 'function') {
                    this.skill1.execute(this);
                    this.lastSkill1Time = time;

                    if (CONSTANTS.GAME.DEBUG) {
                        console.log('Skill 1 used');
                    }
                }
            }
        }

        // 스킬 2 (C)
        if (Phaser.Input.Keyboard.JustDown(this.keys.c)) {
            if (this.skill2 && time - this.lastSkill2Time >= this.skill2Cooldown) {
                if (typeof this.skill2.execute === 'function') {
                    this.skill2.execute(this);
                    this.lastSkill2Time = time;

                    if (CONSTANTS.GAME.DEBUG) {
                        console.log('Skill 2 used');
                    }
                }
            }
        }
    }

    // 스컬 교체
    handleSkullSwap() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            if (this.skullManager && this.skullManager.canSwap()) {
                const swapped = this.skullManager.swap();

                if (swapped && CONSTANTS.GAME.DEBUG) {
                    console.log('Skull swapped');
                }
            }
        }
    }

    // 기본 공격 (스컬이 없을 때)
    defaultBasicAttack() {
        const direction = this.sprite.flipX ? -1 : 1;
        const attackX = this.sprite.x + direction * 40;
        const attackY = this.sprite.y;

        // 공격 이펙트
        const attackEffect = this.scene.add.rectangle(
            attackX, attackY,
            50, 50,
            0xFFFFFF, 0.5
        );

        this.scene.tweens.add({
            targets: attackEffect,
            alpha: 0,
            duration: 150,
            onComplete: () => attackEffect.destroy()
        });

        // 적과의 거리 기반 충돌 체크 (안전한 방식)
        if (this.scene.enemyList && Array.isArray(this.scene.enemyList)) {
            this.scene.enemyList.forEach(enemy => {
                if (!enemy || !enemy.active || !enemy.sprite || !enemy.sprite.active) {
                    return;
                }

                try {
                    const distance = Phaser.Math.Distance.Between(
                        attackX, attackY,
                        enemy.sprite.x, enemy.sprite.y
                    );

                    if (distance < this.attackRange) {
                        const finalDamage = this.attackPower * this.attackMultiplier;

                        if (typeof enemy.takeDamage === 'function') {
                            enemy.takeDamage(finalDamage);
                        }

                        if (typeof enemy.knockback === 'function' && enemy.sprite.body) {
                            enemy.knockback(direction * 150, -80);
                        }
                    }
                } catch (error) {
                    if (CONSTANTS.GAME.DEBUG) {
                        console.warn('Attack collision error:', error);
                    }
                }
            });
        }
    }

    // 피해 받기
    takeDamage(amount) {
        if (!this.active || this.isInvincible) return;

        this.health = Math.max(0, this.health - amount);

        // 피격 효과
        this.sprite.setTint(0xFF0000);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite && this.sprite.active) {
                this.sprite.clearTint();
            }
        });

        // 무적 시간
        this.isInvincible = true;
        this.scene.time.delayedCall(1000, () => {
            this.isInvincible = false;
        });

        // 죽음 체크
        if (this.health <= 0) {
            this.die();
        }

        this.updateHealthUI();
    }

    // 죽음
    die() {
        if (!this.active) return;

        this.active = false;

        if (CONSTANTS.GAME.DEBUG) {
            console.log('Player died');
        }

        // 게임 오버 처리
        if (this.scene.handleGameOver && typeof this.scene.handleGameOver === 'function') {
            this.scene.handleGameOver();
        }
    }

    // 정리
    destroy() {
        this.active = false;

        if (this.skullManager) this.skullManager.destroy();
        if (this.hpBarBg) this.hpBarBg.destroy();
        if (this.hpBar) this.hpBar.destroy();
        if (this.hpText) this.hpText.destroy();
        if (this.sprite) this.sprite.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RoguelikePlayer = RoguelikePlayer;
}
