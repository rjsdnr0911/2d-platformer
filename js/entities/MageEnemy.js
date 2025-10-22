// 마법사 적
class MageEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, CONSTANTS.ENEMIES.MAGE);

        this.aggroRange = 250; // 인식 범위
        this.attackRange = 200; // 공격 범위 (원거리)
        this.safeDistance = 150; // 유지하려는 거리
        this.attackCooldown = 0;
        this.attackInterval = 2000; // 2초마다 공격
        this.isAttacking = false;
        this.projectiles = [];
    }

    updateAI() {
        if (!this.isAlive || this.isHit || this.isAttacking) return;

        // 플레이어 찾기
        if (typeof window.player === 'undefined' || !window.player || !window.player.isAlive) {
            super.updateAI();
            return;
        }

        const playerX = window.player.sprite.x;
        const distanceToPlayer = Math.abs(this.sprite.x - playerX);

        // 인식 범위 내에 플레이어가 있으면
        if (distanceToPlayer < this.aggroRange) {
            // 플레이어 방향 결정
            this.direction = playerX > this.sprite.x ? 1 : -1;

            // 너무 가까우면 후퇴
            if (distanceToPlayer < this.safeDistance) {
                this.sprite.body.setVelocityX(this.speed * -this.direction);
            }
            // 공격 범위 내에 있으면 공격
            else if (distanceToPlayer < this.attackRange) {
                this.tryAttack();
            }
            // 공격 범위 밖이면 다가감
            else {
                this.sprite.body.setVelocityX(this.speed * this.direction);
            }
        } else {
            // 인식 범위 밖이면 순찰
            super.updateAI();
        }
    }

    tryAttack() {
        const currentTime = this.scene.time.now;

        if (currentTime - this.attackCooldown > this.attackInterval) {
            this.attackCooldown = currentTime;
            this.attack();
        } else {
            // 공격 쿨타임 중에는 정지
            this.sprite.body.setVelocityX(0);
        }
    }

    attack() {
        this.isAttacking = true;
        this.sprite.body.setVelocityX(0);

        // 마법 준비 애니메이션
        const chargingEffect = this.scene.add.circle(
            this.sprite.x + (30 * this.direction),
            this.sprite.y,
            8,
            0x8844FF,
            0.7
        );

        this.scene.tweens.add({
            targets: chargingEffect,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                chargingEffect.destroy();
                this.shootFireball();
                this.isAttacking = false;
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('마법사: 공격');
        }
    }

    shootFireball() {
        // 화염구 생성
        const fireball = this.scene.add.circle(
            this.sprite.x + (40 * this.direction),
            this.sprite.y,
            10,
            0xFF6600
        );

        this.scene.physics.add.existing(fireball);
        fireball.body.setAllowGravity(false);

        // 플레이어 방향으로 발사
        if (window.player && window.player.sprite) {
            const angleToPlayer = Phaser.Math.Angle.Between(
                this.sprite.x,
                this.sprite.y,
                window.player.sprite.x,
                window.player.sprite.y
            );

            const speed = 200;
            const velocityX = Math.cos(angleToPlayer) * speed;
            const velocityY = Math.sin(angleToPlayer) * speed;

            fireball.body.setVelocity(velocityX, velocityY);
        } else {
            // 플레이어 없으면 앞으로
            fireball.body.setVelocityX(200 * this.direction);
        }

        fireball.setData('damage', this.damage);
        fireball.setData('type', 'enemyAttack');
        fireball.setData('owner', this);
        fireball.setData('startX', this.sprite.x);
        fireball.setData('range', 300);

        // 화염구 회전
        this.scene.tweens.add({
            targets: fireball,
            angle: 360,
            duration: 500,
            repeat: -1
        });

        this.projectiles.push(fireball);

        // 플레이어와 충돌 체크
        const checkCollision = this.scene.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: () => {
                if (!fireball || !fireball.active) {
                    checkCollision.remove();
                    return;
                }

                // 범위 체크
                const distance = Math.abs(fireball.x - fireball.getData('startX'));
                if (distance > fireball.getData('range')) {
                    fireball.destroy();
                    checkCollision.remove();
                    return;
                }

                // 플레이어와 충돌
                if (window.player && window.player.sprite && window.player.sprite.active) {
                    this.scene.physics.overlap(
                        fireball,
                        window.player.sprite,
                        () => {
                            if (window.player.isAlive && !window.player.isInvincible) {
                                window.player.takeDamage(this.damage);
                                fireball.destroy();
                                checkCollision.remove();
                            }
                        }
                    );
                }
            }
        });
    }

    onDeath() {
        // 마법 능력 오브 드롭
        this.dropAbilityOrb('magic');

        // 발사한 투사체 모두 제거
        this.projectiles.forEach(proj => {
            if (proj && proj.active) {
                proj.destroy();
            }
        });
    }

    dropAbilityOrb(abilityType) {
        const orb = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            15,
            0x8844FF,
            0.8
        );

        this.scene.physics.add.existing(orb);
        orb.body.setVelocity(
            Phaser.Math.Between(-100, 100),
            -200
        );
        orb.body.setBounce(0.5);
        orb.body.setCollideWorldBounds(true);

        orb.setData('type', 'abilityOrb');
        orb.setData('abilityType', abilityType);

        // 깜빡임 효과
        this.scene.tweens.add({
            targets: orb,
            alpha: 0.5,
            duration: 300,
            yoyo: true,
            repeat: -1
        });

        // 전역 배열에 저장
        if (typeof window.abilityOrbs !== 'undefined') {
            window.abilityOrbs.push(orb);
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('능력 오브 드롭:', abilityType);
        }
    }

    destroy() {
        // 투사체 정리
        this.projectiles.forEach(proj => {
            if (proj && proj.active) {
                proj.destroy();
            }
        });

        super.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.MageEnemy = MageEnemy;
}
