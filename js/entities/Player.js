class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // 입력값 검증
        if (!scene || typeof x !== 'number' || typeof y !== 'number') {
            console.error('Player: 잘못된 초기화 파라미터');
            return;
        }

        // 플레이어 스프라이트 생성
        this.sprite = scene.add.sprite(x, y, 'player_idle');
        this.sprite.play('player_idle');
        this.sprite.setScale(1.3); // 캐릭터 크기 약간 증가

        // 물리 바디 추가
        scene.physics.add.existing(this.sprite);

        // 히트박스 조정 (32x32 스프라이트 기준)
        this.sprite.body.setSize(20, 30);
        this.sprite.body.setOffset(6, 2);

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

        // 점프 관련
        this.jumpCount = 0;
        this.maxJumps = CONSTANTS.PLAYER.MAX_JUMPS;

        // 능력 시스템
        this.abilities = [null, null];
        this.currentAbilityIndex = 0;

        // 공격 상태
        this.isAttacking = false;
        this.lastAttackTime = 0;

        // 패시브 아이템 시스템
        this.passiveItems = [];
        this.maxPassiveItems = 3;

        // 아이템 보너스
        this.speedBonus = 0;
        this.jumpBonus = 0;
        this.cooldownReduction = 0;
        this.damageReduction = 0;
        this.dashCooldownReduction = 0;
        this.invincibilityBonus = 0;

        // 플레이어 데이터 저장
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'player');
    }

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

    getCurrentAbility() {
        return this.abilities[this.currentAbilityIndex];
    }

    swapAbility() {
        const oldIndex = this.currentAbilityIndex;
        this.currentAbilityIndex = (this.currentAbilityIndex + 1) % 2;

        const newAbility = this.getCurrentAbility();

        if (newAbility) {
            newAbility.onSwapIn();

            if (CONSTANTS.GAME.DEBUG) {
                console.log('능력 교체:', newAbility.name);
            }
        }
    }

    move(direction) {
        if (!this.isAlive || this.isDashing) return;

        const velocity = (CONSTANTS.PLAYER.SPEED + this.speedBonus) * direction;
        this.sprite.body.setVelocityX(velocity);

        // 방향 업데이트
        if (direction > 0) {
            this.facingRight = true;
            this.sprite.setFlipX(false);
        } else if (direction < 0) {
            this.facingRight = false;
            this.sprite.setFlipX(true);
        }
    }

    jump() {
        if (!this.isAlive || this.isDashing) return;

        if (this.sprite.body.touching.down) {
            this.jumpCount = 0;
        }

        if (this.jumpCount >= this.maxJumps) {
            return;
        }

        let jumpPower;
        if (this.jumpCount === 0) {
            jumpPower = CONSTANTS.PLAYER.JUMP_VELOCITY * (1 + this.jumpBonus);
        } else {
            jumpPower = CONSTANTS.PLAYER.DOUBLE_JUMP_VELOCITY * (1 + this.jumpBonus);
            this.playDoubleJumpEffect();
        }

        this.sprite.body.setVelocityY(jumpPower);
        this.jumpCount++;

        if (CONSTANTS.GAME.DEBUG && this.jumpCount > 1) {
            console.log('더블 점프!');
        }
    }

    playDoubleJumpEffect() {
        const cloud = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y + 15,
            15,
            0xFFFFFF,
            0.6
        );

        this.scene.tweens.add({
            targets: cloud,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                cloud.destroy();
            }
        });
    }

    dash() {
        if (!this.isAlive || this.isDashing) return;

        const currentTime = this.scene.time.now;

        const dashCooldown = CONSTANTS.PLAYER.DASH_COOLDOWN * (1 - this.dashCooldownReduction);
        if (currentTime - this.lastDashTime < dashCooldown) {
            return;
        }

        this.isDashing = true;
        this.isInvincible = true;
        this.lastDashTime = currentTime;

        const dashDirection = this.facingRight ? 1 : -1;
        this.sprite.body.setVelocityX(CONSTANTS.PLAYER.DASH_VELOCITY * dashDirection);

        this.sprite.setAlpha(0.5);

        this.createDashTrail();

        this.dashTimer = this.scene.time.delayedCall(
            CONSTANTS.PLAYER.DASH_DURATION,
            () => {
                this.isDashing = false;
                this.isInvincible = false;
                this.sprite.setAlpha(1);
            }
        );
    }

    createDashTrail() {
        const trailCount = 5;
        const trailInterval = CONSTANTS.PLAYER.DASH_DURATION / trailCount;

        for (let i = 0; i < trailCount; i++) {
            this.scene.time.delayedCall(i * trailInterval, () => {
                if (!this.sprite || !this.sprite.active) return;

                const trail = this.scene.add.sprite(
                    this.sprite.x,
                    this.sprite.y,
                    this.sprite.texture.key
                );
                trail.setFrame(this.sprite.frame.name);
                trail.setFlipX(this.sprite.flipX);
                trail.setAlpha(0.3);

                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        trail.destroy();
                    }
                });
            });
        }
    }

    basicAttack() {
        if (!this.isAlive || this.isAttacking || this.isDashing) return;

        const ability = this.getCurrentAbility();
        if (ability) {
            ability.basicAttack();
        }
    }

    strongAttack() {
        if (!this.isAlive || this.isAttacking || this.isDashing) return;

        const ability = this.getCurrentAbility();
        if (ability) {
            ability.strongAttack();
        }
    }

    specialSkill() {
        if (!this.isAlive || this.isAttacking || this.isDashing) return;

        const ability = this.getCurrentAbility();
        if (ability) {
            ability.specialSkill();
        }
    }

    takeDamage(damage) {
        if (!this.isAlive || this.isInvincible) return;

        const actualDamage = Math.ceil(damage * (1 - this.damageReduction));
        this.hp -= actualDamage;

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        } else {
            this.startInvincibility();
            this.playHitEffect();
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`플레이어 피격: ${actualDamage} 데미지, 남은 HP: ${this.hp}`);
        }
    }

    startInvincibility() {
        this.isInvincible = true;

        const invincibleTime = CONSTANTS.PLAYER.INVINCIBLE_TIME * (1 + this.invincibilityBonus);

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: invincibleTime / 200
        });

        this.scene.time.delayedCall(invincibleTime, () => {
            this.isInvincible = false;
            this.sprite.setAlpha(1);
        });
    }

    playHitEffect() {
        // 피격 애니메이션 재생
        this.sprite.play('player_hit');

        // 넉백
        const knockbackDirection = this.facingRight ? -1 : 1;
        this.sprite.body.setVelocityX(150 * knockbackDirection);
        this.sprite.body.setVelocityY(-100);

        // 피격 파티클 효과 (별 모양)
        for (let i = 0; i < 12; i++) {
            this.scene.time.delayedCall(i * 20, () => {
                if (!this.sprite || !this.sprite.active) return;

                const angle = (Math.PI * 2 * i) / 12;
                const speed = 120 + Math.random() * 60;

                const particle = this.scene.add.star(
                    this.sprite.x,
                    this.sprite.y - 10,
                    5,
                    5,
                    10,
                    0xFFFF00,
                    1
                );

                this.scene.physics.add.existing(particle);
                particle.body.setAllowGravity(false);
                particle.body.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );

                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0.5,
                    angle: 360,
                    duration: 600,
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }
    }

    die() {
        this.isAlive = false;

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            angle: 360,
            y: this.sprite.y + 50,
            duration: 500,
            onComplete: () => {
                this.scene.events.emit('playerDied');
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('플레이어 사망');
        }
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`체력 회복: +${amount}, 현재 HP: ${this.hp}`);
        }
    }

    addPassiveItem(item) {
        const existingItem = this.passiveItems.find(i => i.id === item.id);
        if (existingItem) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log('이미 보유 중인 아이템:', item.name);
            }
            return false;
        }

        if (this.passiveItems.length >= this.maxPassiveItems) {
            const removedItem = this.passiveItems.shift();
            if (CONSTANTS.GAME.DEBUG) {
                console.log('아이템 교체:', removedItem.name, '→', item.name);
            }
        }

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

    grantInvincibility(duration) {
        this.isInvincible = true;

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.8,
            duration: 150,
            yoyo: true,
            repeat: duration / 300
        });

        this.scene.time.delayedCall(duration, () => {
            this.isInvincible = false;
            this.sprite.setAlpha(1);
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`무적 부여: ${duration}ms`);
        }
    }

    updateAnimation() {
        if (!this.sprite || !this.sprite.body) return;

        // 피격 중이면 애니메이션 변경 안 함
        if (this.sprite.anims.currentAnim && this.sprite.anims.currentAnim.key === 'player_hit') {
            if (this.sprite.anims.isPlaying) return;
        }

        const velocityY = this.sprite.body.velocity.y;
        const velocityX = Math.abs(this.sprite.body.velocity.x);

        if (!this.sprite.body.touching.down) {
            // 공중
            if (this.jumpCount > 1) {
                this.sprite.play('player_double_jump', true);
            } else if (velocityY < 0) {
                this.sprite.play('player_jump', true);
            } else {
                this.sprite.play('player_fall', true);
            }
        } else {
            // 지상
            if (velocityX > 10) {
                this.sprite.play('player_run', true);
            } else {
                this.sprite.play('player_idle', true);
            }
        }
    }

    update(cursors, keys) {
        if (!this.isAlive) return;

        try {
            // 바닥에 닿으면 점프 카운트 리셋
            if (this.sprite.body.touching.down) {
                this.jumpCount = 0;
            }

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

            // 애니메이션 업데이트
            this.updateAnimation();

        } catch (error) {
            console.error('Player update 오류:', error);
        }
    }

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
