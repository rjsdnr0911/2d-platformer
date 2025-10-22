class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // 입력값 검증
        if (!scene || typeof x !== 'number' || typeof y !== 'number') {
            console.error('Player: 잘못된 초기화 파라미터');
            return;
        }

        // 플레이어 스프라이트 생성 (사각형으로 시작)
        this.sprite = scene.add.rectangle(
            x, y,
            CONSTANTS.PLAYER.WIDTH,
            CONSTANTS.PLAYER.HEIGHT,
            CONSTANTS.COLORS.PLAYER
        );

        // 물리 바디 추가
        scene.physics.add.existing(this.sprite);

        // 물리 속성 설정
        this.sprite.body.setBounce(CONSTANTS.PLAYER.BOUNCE);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setMaxVelocity(
            CONSTANTS.PLAYER.MAX_VELOCITY_X,
            CONSTANTS.PLAYER.MAX_VELOCITY_Y
        );
        this.sprite.body.setDrag(CONSTANTS.PLAYER.DRAG, 0);

        // 플레이어 상태
        this.hp = CONSTANTS.PLAYER.MAX_HP;
        this.maxHp = CONSTANTS.PLAYER.MAX_HP;
        this.isAlive = true;
        this.isDashing = false;
        this.isInvincible = false;
        this.facingRight = true;

        // 대시 관련
        this.lastDashTime = 0;
        this.dashTimer = null;

        // 능력 시스템
        this.abilities = [null, null]; // [슬롯A, 슬롯B]
        this.currentAbilityIndex = 0;

        // 공격 상태
        this.isAttacking = false;
        this.lastAttackTime = 0;

        // 패시브 아이템 시스템 (최대 3개)
        this.passiveItems = [];
        this.maxPassiveItems = 3;

        // 아이템 보너스
        this.speedBonus = 0;
        this.jumpBonus = 0;
        this.cooldownReduction = 0;
        this.damageReduction = 0;
        this.dashCooldownReduction = 0;
        this.invincibilityBonus = 0;

        // 플레이어 데이터 저장 (접근용)
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'player');
    }

    // 능력 장착
    equipAbility(ability, slotIndex) {
        if (!ability || slotIndex < 0 || slotIndex > 1) {
            console.error('Player: 잘못된 능력 장착');
            return false;
        }

        this.abilities[slotIndex] = ability;
        ability.setOwner(this);

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`능력 장착: 슬롯 ${slotIndex}`, ability.name);
        }
        return true;
    }

    // 현재 능력 가져오기
    getCurrentAbility() {
        return this.abilities[this.currentAbilityIndex];
    }

    // 능력 교체
    swapAbility() {
        const oldIndex = this.currentAbilityIndex;
        this.currentAbilityIndex = (this.currentAbilityIndex + 1) % 2;

        const newAbility = this.getCurrentAbility();

        if (newAbility) {
            // 스왑 특수 효과 발동
            newAbility.onSwapIn();

            if (CONSTANTS.GAME.DEBUG) {
                console.log('능력 교체:', newAbility.name);
            }
        }
    }

    // 이동
    move(direction) {
        if (!this.isAlive || this.isDashing) return;

        const velocity = (CONSTANTS.PLAYER.SPEED + this.speedBonus) * direction;
        this.sprite.body.setVelocityX(velocity);

        // 방향 업데이트
        if (direction > 0) {
            this.facingRight = true;
        } else if (direction < 0) {
            this.facingRight = false;
        }
    }

    // 점프
    jump() {
        if (!this.isAlive || this.isDashing) return;

        // 바닥에 닿아 있을 때만 점프
        if (this.sprite.body.touching.down) {
            const jumpPower = CONSTANTS.PLAYER.JUMP_VELOCITY * (1 + this.jumpBonus);
            this.sprite.body.setVelocityY(jumpPower);
        }
    }

    // 대시
    dash() {
        if (!this.isAlive || this.isDashing) return;

        const currentTime = this.scene.time.now;

        // 쿨타임 체크 (쿨타임 감소 적용)
        const dashCooldown = CONSTANTS.PLAYER.DASH_COOLDOWN * (1 - this.dashCooldownReduction);
        if (currentTime - this.lastDashTime < dashCooldown) {
            return;
        }

        this.isDashing = true;
        this.isInvincible = true;
        this.lastDashTime = currentTime;

        // 대시 방향 (현재 바라보는 방향)
        const dashDirection = this.facingRight ? 1 : -1;
        this.sprite.body.setVelocityX(CONSTANTS.PLAYER.DASH_VELOCITY * dashDirection);

        // 대시 시각 효과 (투명도)
        this.sprite.setAlpha(0.5);

        // 대시 종료 타이머
        this.dashTimer = this.scene.time.delayedCall(
            CONSTANTS.PLAYER.DASH_DURATION,
            () => {
                this.isDashing = false;
                this.isInvincible = false;
                this.sprite.setAlpha(1);
            }
        );
    }

    // 기본 공격
    basicAttack() {
        if (!this.isAlive || this.isAttacking || this.isDashing) return;

        const ability = this.getCurrentAbility();
        if (ability) {
            ability.basicAttack();
        }
    }

    // 강공격
    strongAttack() {
        if (!this.isAlive || this.isAttacking || this.isDashing) return;

        const ability = this.getCurrentAbility();
        if (ability) {
            ability.strongAttack();
        }
    }

    // 특수 스킬
    specialSkill() {
        if (!this.isAlive || this.isAttacking || this.isDashing) return;

        const ability = this.getCurrentAbility();
        if (ability) {
            ability.specialSkill();
        }
    }

    // 피격
    takeDamage(damage) {
        if (!this.isAlive || this.isInvincible) return;

        // 데미지 감소 적용
        const actualDamage = Math.ceil(damage * (1 - this.damageReduction));
        this.hp -= actualDamage;

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        } else {
            // 무적 시간 부여
            this.startInvincibility();

            // 피격 효과
            this.playHitEffect();
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`플레이어 피격: ${actualDamage} 데미지, 남은 HP: ${this.hp}`);
        }
    }

    // 무적 시간 시작
    startInvincibility() {
        this.isInvincible = true;

        // 무적 시간 보너스 적용
        const invincibleTime = CONSTANTS.PLAYER.INVINCIBLE_TIME * (1 + this.invincibilityBonus);

        // 깜빡임 효과
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: invincibleTime / 200
        });

        // 무적 종료
        this.scene.time.delayedCall(invincibleTime, () => {
            this.isInvincible = false;
            this.sprite.setAlpha(1);
        });
    }

    // 피격 효과
    playHitEffect() {
        // 색상 플래시
        const originalColor = this.sprite.fillColor;
        this.sprite.setFillStyle(CONSTANTS.COLORS.DAMAGE_FLASH);

        this.scene.time.delayedCall(100, () => {
            this.sprite.setFillStyle(originalColor);
        });

        // 넉백
        const knockbackDirection = this.facingRight ? -1 : 1;
        this.sprite.body.setVelocityX(150 * knockbackDirection);
        this.sprite.body.setVelocityY(-100);
    }

    // 사망
    die() {
        this.isAlive = false;

        // 사망 애니메이션
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            angle: 360,
            y: this.sprite.y + 50,
            duration: 500,
            onComplete: () => {
                // 게임 오버 처리
                this.scene.events.emit('playerDied');
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('플레이어 사망');
        }
    }

    // 체력 회복
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`체력 회복: +${amount}, 현재 HP: ${this.hp}`);
        }
    }

    // 패시브 아이템 추가 (Skul 스타일)
    addPassiveItem(item) {
        // 이미 같은 아이템을 가지고 있는지 확인
        const existingItem = this.passiveItems.find(i => i.id === item.id);
        if (existingItem) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log('이미 보유 중인 아이템:', item.name);
            }
            return false;
        }

        // 최대 개수 체크
        if (this.passiveItems.length >= this.maxPassiveItems) {
            // 가장 오래된 아이템 제거
            const removedItem = this.passiveItems.shift();
            if (CONSTANTS.GAME.DEBUG) {
                console.log('아이템 교체:', removedItem.name, '→', item.name);
            }
        }

        // 아이템 추가 및 효과 적용
        this.passiveItems.push(item);
        if (item.effect) {
            item.effect();
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('패시브 아이템 획득:', item.name);
            console.log('현재 패시브 아이템:', this.passiveItems.map(i => i.name));
        }

        return true;
    }

    // 무적 부여 (무적 사탕용)
    grantInvincibility(duration) {
        this.isInvincible = true;

        // 골드 색상으로 변경
        const originalColor = this.sprite.fillColor;
        this.sprite.setFillStyle(0xFFD700);

        // 깜빡임 효과
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.8,
            duration: 150,
            yoyo: true,
            repeat: duration / 300
        });

        // 무적 종료
        this.scene.time.delayedCall(duration, () => {
            this.isInvincible = false;
            this.sprite.setFillStyle(originalColor);
            this.sprite.setAlpha(1);
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`무적 부여: ${duration}ms`);
        }
    }

    // 업데이트
    update(cursors, keys) {
        if (!this.isAlive) return;

        try {
            // 좌우 이동
            if (cursors.left.isDown) {
                this.move(-1);
            } else if (cursors.right.isDown) {
                this.move(1);
            }

            // 점프
            if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
                this.jump();
            }

            // 대시
            if (Phaser.Input.Keyboard.JustDown(keys.dash)) {
                this.dash();
            }

            // 공격
            if (Phaser.Input.Keyboard.JustDown(keys.basicAttack)) {
                this.basicAttack();
            }

            if (Phaser.Input.Keyboard.JustDown(keys.strongAttack)) {
                this.strongAttack();
            }

            if (Phaser.Input.Keyboard.JustDown(keys.specialSkill)) {
                this.specialSkill();
            }

            // 능력 교체
            if (Phaser.Input.Keyboard.JustDown(keys.abilitySwap1) ||
                Phaser.Input.Keyboard.JustDown(keys.abilitySwap2)) {
                this.swapAbility();
            }

            // 현재 능력 업데이트
            const ability = this.getCurrentAbility();
            if (ability) {
                ability.update();
            }

        } catch (error) {
            console.error('Player update 오류:', error);
        }
    }

    // 파괴
    destroy() {
        if (this.dashTimer) {
            this.dashTimer.remove();
        }

        this.abilities.forEach(ability => {
            if (ability) ability.destroy();
        });

        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.Player = Player;
}
