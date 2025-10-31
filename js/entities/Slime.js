// 슬라임 적
class Slime extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, CONSTANTS.ENEMIES.SLIME);

        // Rectangle sprite 제거
        if (this.sprite) {
            this.sprite.destroy();
        }

        // 스프라이트시트로 교체
        this.sprite = scene.add.sprite(x, y, 'slime_idle');
        this.sprite.play('slime_idle');

        // 물리 바디 재설정
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setBounce(0.1);
        this.sprite.body.setCollideWorldBounds(true);

        // 히트박스 조정 (44x30 스프라이트 기준)
        this.sprite.body.setSize(40, 26);
        this.sprite.body.setOffset(2, 4);

        // 데이터 재설정
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'enemy');
        this.sprite.setData('damage', this.damage);

        this.jumpCooldown = 0;
        this.jumpInterval = 2000;
        this.bouncing = false;
    }

    updateAI() {
        if (!this.isAlive || this.isHit) return;
        if (!this.sprite || !this.sprite.body) return;

        // 맵 경계 강제 체크 (맵 밖으로 나가지 못하도록)
        const worldBounds = {
            left: 0,
            right: CONSTANTS.WORLD.WIDTH,
            top: 0,
            bottom: CONSTANTS.WORLD.HEIGHT
        };

        if (this.sprite.x < worldBounds.left + 20) {
            this.sprite.x = worldBounds.left + 20;
            this.direction = 1; // 오른쪽으로 방향 전환
        } else if (this.sprite.x > worldBounds.right - 20) {
            this.sprite.x = worldBounds.right - 20;
            this.direction = -1; // 왼쪽으로 방향 전환
        }

        // 바닥 아래로 떨어진 경우 제거
        if (this.sprite.y > worldBounds.bottom) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log('슬라임이 맵 아래로 떨어짐, 제거');
            }
            this.die();
            return;
        }

        // 이동 범위 체크
        const distanceFromStart = this.sprite.x - this.startX;

        if (Math.abs(distanceFromStart) > this.patrolDistance) {
            this.direction *= -1;
        }

        // 이동
        this.sprite.body.setVelocityX(this.speed * this.direction);

        // 방향에 따라 스프라이트 뒤집기
        if (this.direction > 0) {
            this.sprite.setFlipX(false);
        } else {
            this.sprite.setFlipX(true);
        }

        // 가끔 점프
        const currentTime = this.scene.time.now;
        if (currentTime - this.jumpCooldown > this.jumpInterval) {
            if (this.sprite.body.touching.down) {
                this.jump();
                this.jumpCooldown = currentTime;
            }
        }
    }

    jump() {
        this.sprite.body.setVelocityY(-200);
    }

    playHitEffect() {
        // 피격 애니메이션
        this.sprite.play('slime_hit');

        // 원래 애니메이션으로 복귀
        this.scene.time.delayedCall(400, () => {
            if (this.sprite && this.sprite.active && this.isAlive) {
                this.sprite.play('slime_idle');
            }
        });

        // 넉백
        const knockbackDirection = this.direction * -1;
        this.sprite.body.setVelocityX(100 * knockbackDirection);
        this.sprite.body.setVelocityY(-50);

        // 피격 파티클
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                if (!this.sprite || !this.sprite.active) return;

                const particle = this.scene.add.circle(
                    this.sprite.x + (Math.random() - 0.5) * 40,
                    this.sprite.y + (Math.random() - 0.5) * 30,
                    Math.random() * 4 + 2,
                    0x00FF00,
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
            console.log('슬라임 사망');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.Slime = Slime;
}
