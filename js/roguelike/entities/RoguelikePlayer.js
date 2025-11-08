// 로그라이크 모드 전용 플레이어 클래스 (안정성 우선 재구현)
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

        // 기본 스탯
        this.maxHealth = 100;
        this.health = 100;
        this.moveSpeed = 200;
        this.jumpVelocity = -400;
        this.attackPower = 10;
        this.attackRange = 60;

        // 상태
        this.isInvincible = false;
        this.canAttack = true;
        this.attackCooldown = 300;

        // 입력
        this.keys = scene.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            z: Phaser.Input.Keyboard.KeyCodes.Z  // 기본 공격
        });

        // HP UI 생성
        this.createHealthUI();

        if (CONSTANTS.GAME.DEBUG) {
            console.log('RoguelikePlayer created (simplified)');
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

    // 공격 (거리 기반만 사용)
    handleAttack(time) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.z) && this.canAttack) {
            this.performAttack();

            // 공격 쿨다운
            this.canAttack = false;
            this.scene.time.delayedCall(this.attackCooldown, () => {
                this.canAttack = true;
            });
        }
    }

    // 공격 실행
    performAttack() {
        const direction = this.sprite.flipX ? -1 : 1;
        const attackX = this.sprite.x + direction * 40;
        const attackY = this.sprite.y;

        // 공격 이펙트 (시각적 피드백)
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
                // null 체크 및 안전성 확인
                if (!enemy || !enemy.active || !enemy.sprite || !enemy.sprite.active) {
                    return;
                }

                try {
                    const distance = Phaser.Math.Distance.Between(
                        attackX, attackY,
                        enemy.sprite.x, enemy.sprite.y
                    );

                    if (distance < this.attackRange) {
                        // 적에게 피해 (안전하게 함수 호출)
                        if (typeof enemy.takeDamage === 'function') {
                            enemy.takeDamage(this.attackPower);
                        }

                        // 넉백 (안전하게 함수 호출)
                        if (typeof enemy.knockback === 'function' && enemy.sprite.body) {
                            enemy.knockback(direction * 150, -80);
                        }
                    }
                } catch (error) {
                    // 에러 발생 시 무시하고 계속 진행
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
