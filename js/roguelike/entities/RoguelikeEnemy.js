// 로그라이크 모드 적 기본 클래스
class RoguelikeEnemy {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.active = true;

        // 설정
        this.name = config.name || 'Enemy';
        this.maxHealth = config.hp || 50;
        this.health = this.maxHealth;
        this.damage = config.damage || 10;
        this.moveSpeed = config.speed || 60;
        this.color = config.color || 0xFF0000;
        this.size = config.size || 40;

        // 스프라이트 생성 (단일 이미지 - 원형)
        this.sprite = scene.add.circle(x, y, this.size / 2, this.color);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);

        // AI 타입
        this.aiType = config.aiType || 'melee';  // 'melee', 'ranged', 'flying'
        this.aggroRange = config.aggroRange || 200;
        this.attackRange = config.attackRange || 50;
        this.attackCooldown = config.attackCooldown || 2000;
        this.lastAttackTime = 0;

        // 이동 패턴
        this.patrolDirection = 1;
        this.patrolTimer = 0;

        // 상태 효과
        this.isBurning = false;
        this.burnDamage = 0;
        this.burnDuration = 0;
        this.burnTimer = null;

        this.isShocked = false;
        this.shockSlowAmount = 0;
        this.shockDuration = 0;
        this.shockTimer = null;

        // HP 바
        this.createHealthBar();

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`${this.name} created at (${x}, ${y})`);
        }
    }

    // HP 바 생성
    createHealthBar() {
        const barWidth = this.size;
        const barHeight = 4;

        this.hpBarBg = this.scene.add.rectangle(
            this.sprite.x, this.sprite.y - this.size / 2 - 10,
            barWidth, barHeight,
            0x333333
        );

        this.hpBar = this.scene.add.rectangle(
            this.sprite.x, this.sprite.y - this.size / 2 - 10,
            barWidth, barHeight,
            0x00FF00
        );
        this.hpBar.setOrigin(0, 0.5);
        this.hpBarBg.setOrigin(0, 0.5);
        this.hpBar.x = this.hpBarBg.x - barWidth / 2;

        this.updateHealthBar();
    }

    // HP 바 업데이트
    updateHealthBar() {
        if (!this.hpBar || !this.hpBarBg) return;

        const hpRatio = Math.max(0, this.health / this.maxHealth);
        this.hpBar.width = this.size * hpRatio;

        // 색상 변경
        if (hpRatio > 0.5) {
            this.hpBar.setFillStyle(0x00FF00);
        } else if (hpRatio > 0.25) {
            this.hpBar.setFillStyle(0xFFFF00);
        } else {
            this.hpBar.setFillStyle(0xFF0000);
        }

        // 위치 업데이트
        this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - this.size / 2 - 10);
        this.hpBar.setPosition(
            this.sprite.x - this.size / 2,
            this.sprite.y - this.size / 2 - 10
        );
    }

    // 업데이트
    update(time, delta) {
        if (!this.active) return;

        // AI 업데이트
        this.updateAI(time, delta);

        // HP 바 업데이트
        this.updateHealthBar();
    }

    // AI 업데이트 (오버라이드 필요)
    updateAI(time, delta) {
        const player = this.scene.player || window.player;
        if (!player) return;

        const distance = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.x, player.y
        );

        switch (this.aiType) {
            case 'melee':
                this.meleeAI(player, distance, time);
                break;
            case 'ranged':
                this.rangedAI(player, distance, time);
                break;
            case 'flying':
                this.flyingAI(player, distance, time);
                break;
            default:
                this.meleeAI(player, distance, time);
                break;
        }
    }

    // 근접 AI
    meleeAI(player, distance, time) {
        if (distance < this.aggroRange) {
            // 플레이어 방향으로 이동
            const direction = player.x > this.sprite.x ? 1 : -1;
            const currentSpeed = this.isShocked ? this.moveSpeed * (1 - this.shockSlowAmount) : this.moveSpeed;

            this.sprite.body.setVelocityX(direction * currentSpeed);

            // 공격 범위 내면 공격
            if (distance < this.attackRange && time - this.lastAttackTime >= this.attackCooldown) {
                this.attack(player);
                this.lastAttackTime = time;
            }
        } else {
            // 순찰
            this.patrol();
        }
    }

    // 원거리 AI
    rangedAI(player, distance, time) {
        const keepDistance = 150;

        if (distance < this.aggroRange) {
            // 일정 거리 유지
            if (distance < keepDistance) {
                // 후퇴
                const direction = player.x > this.sprite.x ? -1 : 1;
                this.sprite.body.setVelocityX(direction * this.moveSpeed);
            } else {
                this.sprite.body.setVelocityX(0);
            }

            // 공격
            if (time - this.lastAttackTime >= this.attackCooldown) {
                this.rangedAttack(player);
                this.lastAttackTime = time;
            }
        } else {
            this.patrol();
        }
    }

    // 비행 AI
    flyingAI(player, distance, time) {
        if (distance < this.aggroRange) {
            // 플레이어 방향으로 이동 (x, y 모두)
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x, this.sprite.y,
                player.x, player.y
            );

            const currentSpeed = this.isShocked ? this.moveSpeed * (1 - this.shockSlowAmount) : this.moveSpeed;

            this.sprite.body.setVelocity(
                Math.cos(angle) * currentSpeed,
                Math.sin(angle) * currentSpeed
            );

            // 공격
            if (distance < this.attackRange && time - this.lastAttackTime >= this.attackCooldown) {
                this.attack(player);
                this.lastAttackTime = time;
            }
        } else {
            // 천천히 움직임
            this.sprite.body.setVelocity(
                this.patrolDirection * 30,
                Math.sin(Date.now() / 500) * 20
            );
        }
    }

    // 순찰
    patrol() {
        this.sprite.body.setVelocityX(this.patrolDirection * 30);

        // 일정 시간마다 방향 전환
        this.patrolTimer += 16;
        if (this.patrolTimer > 2000) {
            this.patrolDirection *= -1;
            this.patrolTimer = 0;
        }
    }

    // 공격
    attack(player) {
        if (player.takeDamage) {
            player.takeDamage(this.damage);
        }
    }

    // 원거리 공격
    rangedAttack(player) {
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            player.x, player.y
        );

        // 투사체 생성
        const projectile = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            6, 0xFF00FF
        );

        this.scene.physics.add.existing(projectile);
        projectile.body.setVelocity(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200
        );
        projectile.body.setAllowGravity(false);

        // 플레이어와 충돌
        this.scene.physics.add.overlap(projectile, player, () => {
            if (player.takeDamage) {
                player.takeDamage(this.damage);
            }
            projectile.destroy();
        });

        // 2초 후 제거
        this.scene.time.delayedCall(2000, () => {
            if (projectile.active) projectile.destroy();
        });
    }

    // 피해 받기
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);

        // 피격 이펙트
        this.sprite.setTint(0xFFFFFF);
        this.scene.time.delayedCall(100, () => {
            this.sprite.setTint(this.color);
        });

        // 피해 텍스트
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
            onComplete: () => damageText.destroy()
        });

        this.updateHealthBar();

        if (this.health <= 0) {
            this.die();
        }
    }

    // 넉백
    knockback(vx, vy) {
        if (this.sprite.body) {
            this.sprite.body.setVelocity(vx, vy);
        }
    }

    // 화상 적용
    applyBurn(damagePerSecond, duration) {
        // 기존 화상 제거
        if (this.burnTimer) {
            this.burnTimer.remove();
        }

        this.isBurning = true;
        this.burnDamage = damagePerSecond;
        this.burnDuration = duration;

        // 화상 이펙트
        const burnEffect = this.scene.add.circle(
            this.sprite.x, this.sprite.y,
            this.size / 2 + 5,
            0xFF4400, 0.3
        );

        const updateBurn = () => {
            if (burnEffect.active && this.active) {
                burnEffect.setPosition(this.sprite.x, this.sprite.y);
            }
        };

        this.scene.events.on('update', updateBurn);

        // 지속 피해
        this.burnTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.active) {
                    this.takeDamage(this.burnDamage);
                }
            },
            repeat: Math.floor(duration / 1000) - 1
        });

        // 종료
        this.scene.time.delayedCall(duration, () => {
            this.isBurning = false;
            this.scene.events.off('update', updateBurn);
            burnEffect.destroy();
        });
    }

    // 감전 적용
    applyShock(slowAmount, duration) {
        // 기존 감전 제거
        if (this.shockTimer) {
            this.shockTimer.remove();
        }

        this.isShocked = true;
        this.shockSlowAmount = slowAmount;
        this.shockDuration = duration;

        // 감전 이펙트
        const shockEffect = this.scene.add.circle(
            this.sprite.x, this.sprite.y,
            this.size / 2 + 8,
            0xFFFF00, 0.4
        );

        const updateShock = () => {
            if (shockEffect.active && this.active) {
                shockEffect.setPosition(this.sprite.x, this.sprite.y);
            }
        };

        this.scene.events.on('update', updateShock);

        // 종료
        this.scene.time.delayedCall(duration, () => {
            this.isShocked = false;
            this.shockSlowAmount = 0;
            this.scene.events.off('update', updateShock);
            shockEffect.destroy();
        });
    }

    // 죽음
    die() {
        this.active = false;

        // 죽음 이펙트
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
            onComplete: () => deathEffect.destroy()
        });

        // 드롭 아이템 (30% 확률)
        if (Math.random() < 0.3) {
            this.dropItem();
        }

        // 제거
        if (this.burnTimer) this.burnTimer.remove();
        if (this.shockTimer) this.shockTimer.remove();

        if (this.hpBar) this.hpBar.destroy();
        if (this.hpBarBg) this.hpBarBg.destroy();
        this.sprite.destroy();

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`${this.name} died`);
        }
    }

    // 아이템 드롭
    dropItem() {
        // 랜덤으로 패시브 아이템 드롭
        if (window.roguelikePassiveItems) {
            const item = window.roguelikePassiveItems.getRandomItem();

            // 아이템 오브젝트 생성
            const itemDrop = this.scene.add.text(
                this.sprite.x,
                this.sprite.y,
                item.icon || '💎',
                {
                    fontSize: '24px'
                }
            );
            itemDrop.setOrigin(0.5);
            itemDrop.itemData = item;

            this.scene.physics.add.existing(itemDrop);
            itemDrop.body.setVelocity(
                Phaser.Math.Between(-50, 50),
                -150
            );

            // 플레이어와 충돌 시 획득
            if (this.scene.player) {
                this.scene.physics.add.overlap(itemDrop, this.scene.player, () => {
                    this.scene.player.inventoryManager.addPassiveItem(item);
                    itemDrop.destroy();

                    // 알림
                    const notification = this.scene.add.text(
                        this.scene.player.x,
                        this.scene.player.y - 50,
                        `${item.name} 획득!`,
                        {
                            fontFamily: 'Jua',
                            fontSize: '16px',
                            fill: '#FFD700',
                            fontStyle: 'bold'
                        }
                    );
                    notification.setOrigin(0.5);

                    this.scene.tweens.add({
                        targets: notification,
                        y: notification.y - 30,
                        alpha: 0,
                        duration: 1500,
                        onComplete: () => notification.destroy()
                    });
                });
            }
        }
    }

    // 정리
    destroy() {
        this.active = false;

        if (this.burnTimer) this.burnTimer.remove();
        if (this.shockTimer) this.shockTimer.remove();
        if (this.hpBar) this.hpBar.destroy();
        if (this.hpBarBg) this.hpBarBg.destroy();
        if (this.sprite) this.sprite.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RoguelikeEnemy = RoguelikeEnemy;
}
