// 슬라임 적
class Slime extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, CONSTANTS.ENEMIES.SLIME);

        this.jumpCooldown = 0;
        this.jumpInterval = 2000; // 2초마다 점프
    }

    updateAI() {
        if (!this.isAlive || this.isHit) return;

        // 기본 순찰
        super.updateAI();

        // 가끔 점프
        const currentTime = this.scene.time.now;
        if (currentTime - this.jumpCooldown > this.jumpInterval) {
            if (this.sprite.body.touching.down) {
                this.jump();
                this.jumpCooldown = currentTime;
            }
        }

        // 슬라임 특유의 통통 튀는 애니메이션
        if (this.sprite.body.touching.down && !this.bouncing) {
            this.bouncing = true;
            this.scene.tweens.add({
                targets: this.sprite,
                scaleY: 0.8,
                scaleX: 1.2,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.bouncing = false;
                }
            });
        }
    }

    jump() {
        this.sprite.body.setVelocityY(-200);
    }

    onDeath() {
        // 슬라임 죽을 때 작은 슬라임 2개로 분열 (나중에 추가 가능)
        if (CONSTANTS.GAME.DEBUG) {
            console.log('슬라임 사망');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.Slime = Slime;
}
