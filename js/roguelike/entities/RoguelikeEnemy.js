// 로그라이크 모드 전용 적 클래스 (안정성 우선 재구현)
class RoguelikeEnemy {
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        this.active = true;

        // 설정 (기본값 포함)
        this.name = config.name || 'Enemy';
        this.maxHealth = config.hp || 30;
        this.health = this.maxHealth;
        this.damage = config.damage || 5;
        this.moveSpeed = config.speed || 80;
        this.color = config.color || 0xFF4444;
        this.size = config.size || 30;

        // 적 스프라이트 생성 (physics.add.sprite 사용)
        this.sprite = scene.physics.add.sprite(x, y, null);

        // 원형으로 그리기 (간단한 시각화)
        const textureName = 'enemy_' + this.color.toString();
        if (!scene.textures.exists(textureName)) {
            const graphics = scene.add.graphics();
            graphics.fillStyle(this.color, 1);
            graphics.fillCircle(0, 0, this.size / 2);
            graphics.generateTexture(textureName, this.size, this.size);
            graphics.destroy();
        }

        this.sprite.setTexture(textureName);
        this.sprite.setDisplaySize(this.size, this.size);

        // 물리 설정
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0);
        this.sprite.body.setSize(this.size - 5, this.size - 5);

        // AI 설정
        this.aiType = config.aiType || 'melee';
        this.aggroRange = config.aggroRange || 300;
        this.attackRange = config.attackRange || 40;
        this.attackCooldown = config.attackCooldown || 1500;

        // 상태
        this.patrolDirection = Math.random() > 0.5 ? 1 : -1;
        this.canAttack = true;
        this.lastAttackTime = 0;

        // HP 바 생성
        this.createHealthBar();

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`${this.name} created (simplified) at (${x}, ${y})`);
        }
    }

    // HP 바 생성
    createHealthBar() {
        this.hpBarBg = this.scene.add.rectangle(0, 0, this.size, 4, 0x000000);
        this.hpBarBg.setOrigin(0.5);
        this.hpBar = this.scene.add.rectangle(0, 0, this.size, 4, 0xFF0000);
        this.hpBar.setOrigin(0.5);
        this.updateHealthBar();
    }

    // HP 바 업데이트
    updateHealthBar() {
        if (!this.hpBar || !this.sprite || !this.sprite.active) return;

        const hpRatio = Math.max(0, this.health / this.maxHealth);
        this.hpBar.width = this.size * hpRatio;

        // 위치 업데이트
        const barY = this.sprite.y - this.size / 2 - 8;
        this.hpBarBg.setPosition(this.sprite.x, barY);
        this.hpBar.setPosition(this.sprite.x, barY);
    }

    // 업데이트
    update(time, delta) {
        if (!this.active || !this.sprite || !this.sprite.body) return;

        // 플레이어 찾기
        const player = this.scene.player;
        if (!player || !player.active || !player.sprite) {
            this.patrol();
            this.updateHealthBar();
            return;
        }

        // 플레이어와의 거리 계산
        const distance = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );

        // AI 행동
        if (distance < this.aggroRange) {
            this.chasePlayer(player);

            // 공격 범위 내면 공격
            if (distance < this.attackRange && this.canAttack) {
                this.attack(player, time);
            }
        } else {
            this.patrol();
        }

        this.updateHealthBar();
    }

    // 순찰
    patrol() {
        if (!this.sprite || !this.sprite.body) return;

        // 간단한 좌우 이동
        this.sprite.setVelocityX(this.patrolDirection * this.moveSpeed * 0.5);

        // 가끔 방향 전환
        if (Math.random() < 0.01) {
            this.patrolDirection *= -1;
        }
    }

    // 플레이어 추적
    chasePlayer(player) {
        if (!this.sprite || !this.sprite.body || !player.sprite) return;

        const direction = player.sprite.x > this.sprite.x ? 1 : -1;
        this.sprite.setVelocityX(direction * this.moveSpeed);
    }

    // 공격 (거리 기반만 사용)
    attack(player, time) {
        if (!this.canAttack || !player) return;

        try {
            // 플레이어에게 피해
            if (typeof player.takeDamage === 'function') {
                player.takeDamage(this.damage);
            }

            // 공격 이펙트
            const attackEffect = this.scene.add.circle(
                this.sprite.x,
                this.sprite.y,
                20,
                0xFF0000,
                0.5
            );

            this.scene.tweens.add({
                targets: attackEffect,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                onComplete: () => {
                    if (attackEffect && attackEffect.active) {
                        attackEffect.destroy();
                    }
                }
            });

            // 공격 쿨다운
            this.canAttack = false;
            this.lastAttackTime = time;
            this.scene.time.delayedCall(this.attackCooldown, () => {
                this.canAttack = true;
            });

        } catch (error) {
            if (CONSTANTS.GAME.DEBUG) {
                console.warn('Enemy attack error:', error);
            }
        }
    }

    // 피해 받기
    takeDamage(amount) {
        if (!this.active) return;

        this.health = Math.max(0, this.health - amount);

        // 피격 효과
        if (this.sprite && this.sprite.active) {
            this.sprite.setTint(0xFFFFFF);
            this.scene.time.delayedCall(100, () => {
                if (this.sprite && this.sprite.active) {
                    this.sprite.clearTint();
                }
            });
        }

        // 피해 텍스트
        if (this.sprite && this.sprite.active) {
            const damageText = this.scene.add.text(
                this.sprite.x,
                this.sprite.y - 30,
                `-${Math.floor(amount)}`,
                {
                    fontFamily: 'Orbitron',
                    fontSize: '16px',
                    fill: '#FF0000',
                    fontStyle: 'bold'
                }
            );
            damageText.setOrigin(0.5);

            this.scene.tweens.add({
                targets: damageText,
                y: damageText.y - 30,
                alpha: 0,
                duration: 800,
                onComplete: () => {
                    if (damageText && damageText.active) {
                        damageText.destroy();
                    }
                }
            });
        }

        this.updateHealthBar();

        // 죽음 체크
        if (this.health <= 0) {
            this.die();
        }
    }

    // 넉백
    knockback(velocityX, velocityY) {
        if (!this.sprite || !this.sprite.body) return;

        try {
            this.sprite.setVelocity(velocityX, velocityY);
        } catch (error) {
            if (CONSTANTS.GAME.DEBUG) {
                console.warn('Knockback error:', error);
            }
        }
    }

    // 죽음
    die() {
        if (!this.active) return;

        this.active = false;

        // 죽음 이펙트
        if (this.sprite && this.sprite.active) {
            const deathEffect = this.scene.add.circle(
                this.sprite.x, this.sprite.y,
                this.size / 2,
                this.color, 0.8
            );

            this.scene.tweens.add({
                targets: deathEffect,
                radius: this.size,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    if (deathEffect && deathEffect.active) {
                        deathEffect.destroy();
                    }
                }
            });
        }

        // 정리
        this.destroy();

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`${this.name} died`);
        }
    }

    // 정리
    destroy() {
        this.active = false;

        if (this.hpBarBg) this.hpBarBg.destroy();
        if (this.hpBar) this.hpBar.destroy();
        if (this.sprite) this.sprite.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RoguelikeEnemy = RoguelikeEnemy;
}
