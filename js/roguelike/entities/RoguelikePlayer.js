// 로그라이크 모드 전용 플레이어 클래스
class RoguelikePlayer {
    constructor(scene, x, y) {
        this.scene = scene;
        this.active = true;

        // 플레이어 스프라이트 생성 (원형)
        this.sprite = scene.add.circle(x, y, 20, 0x00AAFF);
        scene.physics.add.existing(this.sprite);

        // 물리 설정
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setMaxVelocity(300, 1000);

        // 충돌 박스 조정 (원형의 중심 기준)
        this.sprite.body.setCircle(20);

        // 위치 프로퍼티 포워딩
        Object.defineProperties(this, {
            x: {
                get() { return this.sprite.x; },
                set(value) { this.sprite.x = value; }
            },
            y: {
                get() { return this.sprite.y; },
                set(value) { this.sprite.y = value; }
            },
            body: {
                get() { return this.sprite.body; }
            },
            flipX: {
                get() { return this.sprite.flipX; },
                set(value) { this.sprite.flipX = value; }
            }
        });

        // 기본 스탯
        this.maxHealth = 50;
        this.health = 50;
        this.moveSpeed = 200;
        this.jumpVelocity = -400;
        this.attackMultiplier = 1.0;
        this.defense = 0;

        // 시스템
        this.skullManager = new SkullManager(this);
        this.inventoryManager = new InventoryManager(this);

        // 상태
        this.isInvincible = false;
        this.isInvisible = false;
        this.isDashing = false;
        this.lastDashTime = 0;
        this.dashCooldown = 1000;

        // 공격 상태
        this.lastAttackTime = 0;
        this.attackCooldown = 300;

        // 점프
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;

        // 입력
        this.keys = scene.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            z: Phaser.Input.Keyboard.KeyCodes.Z,      // 기본 공격
            x: Phaser.Input.Keyboard.KeyCodes.X,      // 스킬 1
            c: Phaser.Input.Keyboard.KeyCodes.C,      // 스킬 2
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,  // 스컬 교체
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,  // 대시
            v: Phaser.Input.Keyboard.KeyCodes.V,      // 액티브 아이템
            i: Phaser.Input.Keyboard.KeyCodes.I       // 인벤토리
        });

        // 효과 배열
        this.onAttackEffects = [];
        this.onHitEffects = [];
        this.passiveEffects = [];

        // HP UI 생성
        this.createHealthUI(scene);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('RoguelikePlayer created');
        }
    }

    // HP UI 생성
    createHealthUI(scene) {
        const uiX = 20;
        const uiY = 20;

        // HP 바 배경
        this.hpBarBg = scene.add.rectangle(uiX, uiY, 200, 20, 0x333333);
        this.hpBarBg.setOrigin(0, 0);
        this.hpBarBg.setScrollFactor(0);
        this.hpBarBg.setDepth(100);

        // HP 바
        this.hpBar = scene.add.rectangle(uiX + 2, uiY + 2, 196, 16, 0x00FF00);
        this.hpBar.setOrigin(0, 0);
        this.hpBar.setScrollFactor(0);
        this.hpBar.setDepth(101);

        // HP 텍스트
        this.hpText = scene.add.text(uiX + 100, uiY + 10, '', {
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
        this.handleMovement();
        this.handleJump();
        this.handleAttack(time);
        this.handleSkills(time);
        this.handleDash(time);
        this.handleSkullSwap();
        this.handleActiveItem();

        // 시스템 업데이트
        this.skullManager.update(time, delta);
        this.inventoryManager.update(time, delta);

        // UI 업데이트
        this.updateHealthUI();

        // 착지 시 더블 점프 리셋
        if (this.body.touching.down) {
            this.hasDoubleJumped = false;
        }
    }

    // 이동
    handleMovement() {
        if (this.keys.left.isDown) {
            this.sprite.body.setVelocityX(-this.moveSpeed);
            this.flipX = true;
        } else if (this.keys.right.isDown) {
            this.sprite.body.setVelocityX(this.moveSpeed);
            this.flipX = false;
        } else {
            this.sprite.body.setVelocityX(0);
        }
    }

    // 점프
    handleJump() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
            if (this.body.touching.down) {
                // 일반 점프
                this.sprite.body.setVelocityY(this.jumpVelocity);
            } else if (this.canDoubleJump && !this.hasDoubleJumped) {
                // 더블 점프
                this.sprite.body.setVelocityY(this.jumpVelocity * 0.9);
                this.hasDoubleJumped = true;
            }
        }
    }

    // 공격
    handleAttack(time) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.z)) {
            if (time - this.lastAttackTime >= this.attackCooldown) {
                this.performBasicAttack();
                this.lastAttackTime = time;
            }
        }
    }

    // 기본 공격 실행
    performBasicAttack() {
        const currentSkull = this.skullManager.getCurrentSkull();
        if (currentSkull && currentSkull.basicAttack) {
            currentSkull.basicAttack.call(this);

            // onAttack 효과 발동
            if (this.onAttackEffects && this.onAttackEffects.length > 0) {
                this.onAttackEffects.forEach(effect => {
                    if (typeof effect === 'function') {
                        effect(this, null);
                    }
                });
            }
        } else {
            // 기본 공격 (스컬 없을 때)
            this.defaultBasicAttack();
        }
    }

    // 기본 공격 (스컬 없을 때)
    defaultBasicAttack() {
        const direction = this.flipX ? -1 : 1;

        const hitboxX = this.x + direction * 40;
        const hitboxY = this.y;

        // 시각적 히트박스 (디버그용)
        const hitbox = this.scene.add.rectangle(
            hitboxX,
            hitboxY,
            50, 50,
            0xFFFFFF, 0.3
        );

        // 적과 충돌 체크 (거리 기반)
        if (this.scene.enemyList) {
            this.scene.enemyList.forEach(enemy => {
                if (enemy && enemy.active && enemy.sprite) {
                    const distance = Phaser.Math.Distance.Between(
                        hitboxX, hitboxY,
                        enemy.sprite.x, enemy.sprite.y
                    );

                    // 히트박스 범위 내에 있으면 피격
                    if (distance < 50) {
                        const damage = 10 * this.attackMultiplier;
                        enemy.takeDamage(damage);

                        // 넉백
                        if (enemy.sprite && enemy.sprite.body) {
                            enemy.knockback(direction * 150, -80);
                        }
                    }
                }
            });
        }

        this.scene.time.delayedCall(100, () => {
            if (hitbox && hitbox.active) {
                hitbox.destroy();
            }
        });
    }

    // 스킬 사용
    handleSkills(time) {
        const currentSkull = this.skullManager.getCurrentSkull();
        if (!currentSkull) return;

        // 스킬 1 (X키)
        if (Phaser.Input.Keyboard.JustDown(this.keys.x)) {
            if (currentSkull.skill1 && currentSkull.skill1.effect) {
                const cooldown = currentSkull.skill1.cooldown || 3000;
                if (!this.lastSkill1Time || time - this.lastSkill1Time >= cooldown) {
                    currentSkull.skill1.effect(this);
                    this.lastSkill1Time = time;
                }
            }
        }

        // 스킬 2 (C키)
        if (Phaser.Input.Keyboard.JustDown(this.keys.c)) {
            if (currentSkull.skill2 && currentSkull.skill2.effect) {
                const cooldown = currentSkull.skill2.cooldown || 8000;
                if (!this.lastSkill2Time || time - this.lastSkill2Time >= cooldown) {
                    currentSkull.skill2.effect(this);
                    this.lastSkill2Time = time;
                }
            }
        }
    }

    // 대시
    handleDash(time) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
            if (time - this.lastDashTime >= this.dashCooldown) {
                const direction = this.flipX ? -1 : 1;

                this.sprite.body.setVelocityX(direction * 400);
                this.isDashing = true;

                // onDash 효과 발동
                if (this.onDashEffects) {
                    this.onDashEffects.forEach(effect => {
                        if (typeof effect === 'function') {
                            effect(this);
                        }
                    });
                }

                this.scene.time.delayedCall(200, () => {
                    this.isDashing = false;
                });

                this.lastDashTime = time;
            }
        }
    }

    // 스컬 교체
    handleSkullSwap() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.skullManager.swap();
        }
    }

    // 액티브 아이템 사용
    handleActiveItem() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.v)) {
            this.inventoryManager.useActiveItem(0);
        }
    }

    // 피해 받기
    takeDamage(amount) {
        if (this.isInvincible) return;

        // 방어력 적용
        const actualDamage = amount * (1 - this.defense);
        this.health = Math.max(0, this.health - actualDamage);

        // 피격 효과
        this.sprite.setTint(0xFF0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });

        // onHit 효과 발동
        if (this.onHitEffects && this.onHitEffects.length > 0) {
            this.onHitEffects.forEach(effect => {
                if (typeof effect === 'function') {
                    effect(this, null);
                }
            });
        }

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
        if (CONSTANTS.GAME.DEBUG) {
            console.log('Player died');
        }

        // 게임 오버 처리
        if (this.scene.onPlayerDeath) {
            this.scene.onPlayerDeath();
        }
    }

    // 기본 근접 콤보 (스컬용 헬퍼)
    performMeleeCombo() {
        this.defaultBasicAttack();
    }

    // 헬퍼 메서드들 (스컬에서 사용)
    setVelocityX(value) {
        this.sprite.body.setVelocityX(value);
    }

    setVelocityY(value) {
        this.sprite.body.setVelocityY(value);
    }

    setVelocity(x, y) {
        this.sprite.body.setVelocity(x, y);
    }

    setTint(color) {
        this.sprite.setTint(color);
    }

    clearTint() {
        this.sprite.clearTint();
    }

    setAlpha(value) {
        this.sprite.setAlpha(value);
    }

    // 정리
    destroy() {
        this.active = false;

        if (this.skullManager) {
            this.skullManager.destroy();
        }

        if (this.inventoryManager) {
            this.inventoryManager.destroy();
        }

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
