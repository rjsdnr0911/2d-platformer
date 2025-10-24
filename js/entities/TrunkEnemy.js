// Trunk 적 (Stage 3 - 나무 적)
class TrunkEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, {
            WIDTH: 64,
            HEIGHT: 32,
            HP: 50,
            DAMAGE: 18,
            SPEED: 40,
            COLOR: 0x8B4513
        });

        // Rectangle sprite 제거
        if (this.sprite) {
            this.sprite.destroy();
        }

        // Trunk 스프라이트시트로 교체
        this.sprite = scene.add.sprite(x, y, 'trunk_idle');
        this.sprite.play('trunk_idle');

        // 물리 바디 재설정
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setBounce(0.1);
        this.sprite.body.setCollideWorldBounds(true);

        // 히트박스 조정 (64x32 스프라이트 기준)
        this.sprite.body.setSize(54, 28);
        this.sprite.body.setOffset(5, 2);

        // 데이터 재설정
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'enemy');
        this.sprite.setData('damage', this.damage);

        // Trunk 특성: 원거리 공격
        this.attackCooldown = 0;
        this.attackInterval = 3000; // 3초마다 공격
    }

    updateAI() {
        if (!this.isAlive || this.isHit) return;
        if (!this.sprite || !this.sprite.body) return;

        // 순찰 이동
        const distanceFromStart = this.sprite.x - this.startX;

        if (Math.abs(distanceFromStart) > this.patrolDistance) {
            this.direction *= -1;
        }

        this.sprite.body.setVelocityX(this.speed * this.direction);
        this.sprite.play('trunk_run', true);

        // 방향에 따라 스프라이트 뒤집기
        if (this.direction > 0) {
            this.sprite.setFlipX(false);
        } else {
            this.sprite.setFlipX(true);
        }

        // 플레이어가 감지 범위 내에 있으면 공격
        if (window.player && window.player.sprite && window.player.sprite.active) {
            const distance = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                window.player.sprite.x, window.player.sprite.y
            );

            // 200px 이내에 플레이어가 있으면 공격
            if (distance < 200) {
                const currentTime = this.scene.time.now;
                if (currentTime - this.attackCooldown > this.attackInterval) {
                    this.attackCooldown = currentTime;
                    this.shootBullet();
                }
            }
        }
    }

    shootBullet() {
        if (!this.sprite || !this.sprite.active) return;

        // 공격 애니메이션
        this.sprite.play('trunk_attack');

        // 원래 애니메이션으로 복귀
        this.scene.time.delayedCall(600, () => {
            if (this.sprite && this.sprite.active && this.isAlive) {
                this.sprite.play('trunk_run');
            }
        });

        // 발사체 생성
        this.scene.time.delayedCall(300, () => {
            if (!this.sprite || !this.sprite.active || !window.player) return;

            const bullet = this.scene.add.circle(
                this.sprite.x + (this.direction * 30),
                this.sprite.y,
                6,
                0x8B4513,
                1
            );

            this.scene.physics.add.existing(bullet);
            bullet.body.setAllowGravity(false);

            // 플레이어 방향으로 발사
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x, this.sprite.y,
                window.player.sprite.x, window.player.sprite.y
            );

            const speed = 250;
            bullet.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            bullet.setData('damage', this.damage * 0.5);
            bullet.setData('startTime', this.scene.time.now);

            // 플레이어 충돌 체크
            const checkCollision = this.scene.time.addEvent({
                delay: 50,
                repeat: 60,
                callback: () => {
                    if (!bullet || !bullet.active) {
                        checkCollision.remove();
                        return;
                    }

                    const elapsed = this.scene.time.now - bullet.getData('startTime');
                    if (elapsed > 3000) {
                        bullet.destroy();
                        checkCollision.remove();
                        return;
                    }

                    if (window.player && window.player.sprite && window.player.sprite.active) {
                        this.scene.physics.overlap(bullet, window.player.sprite, () => {
                            if (window.player.isAlive && !window.player.isInvincible) {
                                window.player.takeDamage(Math.floor(bullet.getData('damage')));
                                bullet.destroy();
                                checkCollision.remove();
                            }
                        });
                    }
                }
            });
        });
    }

    playHitEffect() {
        // 피격 애니메이션
        this.sprite.play('trunk_hit');

        // 원래 애니메이션으로 복귀
        this.scene.time.delayedCall(400, () => {
            if (this.sprite && this.sprite.active && this.isAlive) {
                this.sprite.play('trunk_idle');
            }
        });

        // 넉백
        const knockbackDirection = this.direction * -1;
        this.sprite.body.setVelocityX(100 * knockbackDirection);
        this.sprite.body.setVelocityY(-50);

        // 피격 파티클 (나무 조각)
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                if (!this.sprite || !this.sprite.active) return;

                const particle = this.scene.add.circle(
                    this.sprite.x + (Math.random() - 0.5) * 54,
                    this.sprite.y + (Math.random() - 0.5) * 28,
                    Math.random() * 4 + 2,
                    0x8B4513,
                    0.8
                );

                this.scene.physics.add.existing(particle);
                particle.body.setVelocity(
                    (Math.random() - 0.5) * 100,
                    -Math.random() * 100
                );

                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }
    }

    onDeath() {
        if (CONSTANTS.GAME.DEBUG) {
            console.log('나무 적 사망');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.TrunkEnemy = TrunkEnemy;
}
