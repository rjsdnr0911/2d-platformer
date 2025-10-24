// Ghost 적 (Stage 2)
class GhostEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, {
            WIDTH: 44,
            HEIGHT: 30,
            HP: 40,
            DAMAGE: 15,
            SPEED: 60,
            COLOR: 0x00FFFF
        });

        // Rectangle sprite 제거
        if (this.sprite) {
            this.sprite.destroy();
        }

        // Ghost 스프라이트시트로 교체
        this.sprite = scene.add.sprite(x, y, 'ghost_idle');
        this.sprite.play('ghost_idle');

        // 물리 바디 재설정
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setBounce(0.1);
        this.sprite.body.setCollideWorldBounds(true);

        // 히트박스 조정 (44x30 스프라이트 기준)
        this.sprite.body.setSize(38, 26);
        this.sprite.body.setOffset(3, 2);

        // 데이터 재설정
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'enemy');
        this.sprite.setData('damage', this.damage);

        // Ghost 특성: 공중 부유
        this.sprite.body.setAllowGravity(false);
        this.floatAmplitude = 20;
        this.floatSpeed = 0.002;
        this.initialY = y;
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

        // 방향에 따라 스프라이트 뒤집기
        if (this.direction > 0) {
            this.sprite.setFlipX(false);
        } else {
            this.sprite.setFlipX(true);
        }

        // 부유 효과 (상하로 천천히 움직임)
        const time = this.scene.time.now;
        const floatY = this.initialY + Math.sin(time * this.floatSpeed) * this.floatAmplitude;
        this.sprite.y = floatY;
    }

    playHitEffect() {
        // 피격 애니메이션
        this.sprite.play('ghost_hit');

        // 원래 애니메이션으로 복귀
        this.scene.time.delayedCall(400, () => {
            if (this.sprite && this.sprite.active && this.isAlive) {
                this.sprite.play('ghost_idle');
            }
        });

        // 넉백
        const knockbackDirection = this.direction * -1;
        this.sprite.body.setVelocityX(100 * knockbackDirection);

        // 피격 파티클 (하늘색 유령 입자)
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                if (!this.sprite || !this.sprite.active) return;

                const particle = this.scene.add.circle(
                    this.sprite.x + (Math.random() - 0.5) * 40,
                    this.sprite.y + (Math.random() - 0.5) * 30,
                    Math.random() * 4 + 2,
                    0x00FFFF,
                    0.8
                );

                this.scene.physics.add.existing(particle);
                particle.body.setAllowGravity(false);
                particle.body.setVelocity(
                    (Math.random() - 0.5) * 100,
                    -Math.random() * 50
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
            console.log('유령 사망');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.GhostEnemy = GhostEnemy;
}
