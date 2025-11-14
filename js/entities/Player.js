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

        // 게임 속성
        this.attackMultiplier = 1.0;          // 공격력 배율
        this.attackRange = 1.0;               // 공격 범위 배율
        this.criticalChance = 0;              // 치명타 확률
        this.criticalMultiplier = 1.0;        // 치명타 배율
        this.lifesteal = 0;                   // 흡혈 비율
        this.dodgeChance = 0;                 // 회피 확률
        this.thornsDamage = 0;                // 가시 데미지
        this.hasLastStand = false;            // 최후의 저항
        this.hasRevive = false;               // 부활
        this.reviveCount = 0;                 // 부활 가능 횟수
        this.hasAOEAttack = false;            // 광역 공격
        this.aoeRadius = 0;                   // 광역 범위
        this.hasPoisonAttack = false;         // 독 공격
        this.poisonDamage = 0;                // 독 데미지
        this.poisonDuration = 0;              // 독 지속시간
        this.freezeChance = 0;                // 빙결 확률
        this.freezeDuration = 0;              // 빙결 지속시간
        this.knockbackMultiplier = 1.0;       // 넉백 배율
        this.luckMultiplier = 1.0;            // 행운 배율
        this.hasAirDash = false;              // 공중 대쉬
        this.airDashCooldown = 0;             // 공중 대쉬 쿨다운
        this.lastAirDashTime = 0;             // 마지막 공중 대쉬 시간
        this.currentJumps = this.maxJumps;    // 현재 점프 횟수

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

    setCurrentAbilityIndex(index) {
        if (index >= 0 && index < this.abilities.length) {
            this.currentAbilityIndex = index;
        }
    }

    swapAbility() {
        const oldIndex = this.currentAbilityIndex;
        this.currentAbilityIndex = (this.currentAbilityIndex + 1) % 2;

        const newAbility = this.getCurrentAbility();

        if (newAbility) {
            newAbility.onSwapIn();

            // 능력 전환 UI 표시
            this.showAbilitySwapUI(newAbility.name);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('능력 교체:', newAbility.name);
            }
        }
    }

    // 능력 전환 UI 표시
    showAbilitySwapUI(abilityName) {
        // 아이콘 색상 결정
        let iconColor = 0xFFFFFF;
        let iconText = '⚔️';

        if (abilityName === '검술' || abilityName.includes('전사')) {
            iconColor = 0xFF6B6B;
            iconText = '⚔️';
        } else if (abilityName === '마법' || abilityName.includes('마법')) {
            iconColor = 0x8844FF;
            iconText = '✨';
        } else if (abilityName === '해머') {
            iconColor = 0xFF8800;
            iconText = '🔨';
        } else if (abilityName === '활') {
            iconColor = 0x44FF44;
            iconText = '🏹';
        }

        // UI 컨테이너 생성 (화면 중앙 하단)
        const uiX = CONSTANTS.GAME.WIDTH / 2;
        const uiY = CONSTANTS.GAME.HEIGHT - 100;

        // 배경 패널
        const panel = this.scene.add.rectangle(uiX, uiY, 200, 60, 0x000000, 0.7);
        panel.setScrollFactor(0); // 카메라에 고정
        panel.setDepth(1000);

        // 아이콘 텍스트
        const icon = this.scene.add.text(uiX - 70, uiY, iconText, {
            fontSize: '32px'
        });
        icon.setOrigin(0.5);
        icon.setScrollFactor(0);
        icon.setDepth(1001);

        // 능력 이름
        const nameText = this.scene.add.text(uiX + 20, uiY, abilityName, {
            fontSize: '24px',
            fill: `#${iconColor.toString(16).padStart(6, '0')}`,
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        });
        nameText.setOrigin(0.5);
        nameText.setScrollFactor(0);
        nameText.setDepth(1001);

        // 페이드 인 애니메이션
        panel.setAlpha(0);
        icon.setAlpha(0);
        nameText.setAlpha(0);
        panel.setScale(0.8);
        icon.setScale(0.8);
        nameText.setScale(0.8);

        this.scene.tweens.add({
            targets: [panel, icon, nameText],
            alpha: 1,
            scale: 1,
            duration: 150,
            ease: 'Back.easeOut'
        });

        // 1초 후 페이드 아웃 및 제거
        this.scene.time.delayedCall(1000, () => {
            this.scene.tweens.add({
                targets: [panel, icon, nameText],
                alpha: 0,
                y: uiY + 20,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    panel.destroy();
                    icon.destroy();
                    nameText.destroy();
                }
            });
        });
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

    takeDamage(damage, attacker = null) {
        if (!this.isAlive || this.isInvincible) return;

        // 회피 체크
        if (this.dodgeChance > 0 && Math.random() < this.dodgeChance) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log('공격 회피!');
            }
            // 회피 이펙트
            const dodgeText = this.scene.add.text(
                this.sprite.x, this.sprite.y - 50,
                'DODGE!',
                {
                    fontSize: '24px',
                    fill: '#00FFFF',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 3
                }
            );
            this.scene.tweens.add({
                targets: dodgeText,
                y: dodgeText.y - 30,
                alpha: 0,
                duration: 1000,
                onComplete: () => dodgeText.destroy()
            });
            return;
        }

        // 근접 캐릭터 방어력 버프 (검술 능력 사용 시 30% 피해 감소)
        let meleeDefenseBonus = 0;
        const currentAbility = this.getCurrentAbility();
        if (currentAbility && currentAbility.name === '검술') {
            meleeDefenseBonus = 0.3; // 30% 감소
        }

        const actualDamage = Math.ceil(damage * (1 - this.damageReduction - meleeDefenseBonus));
        this.hp -= actualDamage;

        // 가시 데미지
        if (this.thornsDamage > 0 && attacker && attacker.takeDamage) {
            attacker.takeDamage(this.thornsDamage);
            if (CONSTANTS.GAME.DEBUG) {
                console.log(`가시 데미지: ${this.thornsDamage}`);
            }
        }

        if (this.hp <= 0) {
            // 부활 체크
            if (this.hasRevive && this.reviveCount > 0) {
                this.reviveCount--;
                this.hp = Math.floor(this.maxHp * 0.5);
                this.hasRevive = this.reviveCount > 0;

                // 부활 이펙트
                const reviveText = this.scene.add.text(
                    this.sprite.x, this.sprite.y - 50,
                    'REVIVED!',
                    {
                        fontSize: '32px',
                        fill: '#FFD700',
                        fontStyle: 'bold',
                        stroke: '#000',
                        strokeThickness: 4
                    }
                );
                this.scene.tweens.add({
                    targets: reviveText,
                    y: reviveText.y - 50,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => reviveText.destroy()
                });

                // 무적 시간
                this.startInvincibility();
                this.playHitEffect();

                if (CONSTANTS.GAME.DEBUG) {
                    console.log(`부활! 남은 부활 횟수: ${this.reviveCount}`);
                }
            } else {
                this.hp = 0;
                this.die();
            }
        } else {
            this.startInvincibility();
            this.playHitEffect();
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`플레이어 피격: ${actualDamage} 데미지 (방어: ${(this.damageReduction + meleeDefenseBonus) * 100}%), 남은 HP: ${this.hp}`);
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

    // 흡혈 효과 (근접 캐릭터 전용)
    vampiricHeal(amount) {
        const healAmount = Math.min(amount, this.maxHp - this.hp);
        if (healAmount <= 0) return;

        this.hp += healAmount;

        // 흡혈 효과 시각화 (빨간 하트 파티클)
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                if (!this.sprite || !this.sprite.active) return;

                const heart = this.scene.add.text(
                    this.sprite.x + (Math.random() - 0.5) * 20,
                    this.sprite.y - 20,
                    '❤️',
                    { fontSize: '16px' }
                );

                this.scene.physics.add.existing(heart);
                heart.body.setAllowGravity(false);
                heart.body.setVelocityY(-80);

                this.scene.tweens.add({
                    targets: heart,
                    alpha: 0,
                    y: heart.y - 40,
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => {
                        heart.destroy();
                    }
                });
            });
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`흡혈: +${healAmount}HP`);
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

            // Q/E 키 처리 - 능력 전환
            const ability = this.getCurrentAbility();

            // 일반 모드: 둘 다 능력이 장착되어 있으면 Q/E로 능력 전환
            if (this.abilities[0] && this.abilities[1]) {
                // 일반 모드 (근접전사 <-> 마법사 전환)
                if (Phaser.Input.Keyboard.JustDown(keys.abilitySwap1) ||
                    Phaser.Input.Keyboard.JustDown(keys.abilitySwap2)) {
                    this.swapAbility();
                }
            }

            // 현재 능력 업데이트
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
