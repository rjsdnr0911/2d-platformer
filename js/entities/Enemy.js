// 적 기본 클래스
class Enemy {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.config = config;

        // 입력값 검증
        if (!scene || typeof x !== 'number' || typeof y !== 'number') {
            console.error('Enemy: 잘못된 초기화 파라미터');
            return;
        }

        // 적 스프라이트 생성
        this.sprite = scene.add.rectangle(
            x, y,
            config.WIDTH,
            config.HEIGHT,
            config.COLOR
        );

        // 물리 바디 추가
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);

        // 적 상태
        this.hp = config.HP;
        this.maxHp = config.HP;
        this.damage = config.DAMAGE;
        this.speed = config.SPEED;
        this.isAlive = true;
        this.isHit = false;

        // AI 상태
        this.direction = 1; // 1: 오른쪽, -1: 왼쪽
        this.patrolDistance = 150;
        this.startX = x;

        // 적 데이터 저장
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'enemy');
        this.sprite.setData('damage', this.damage);
    }

    // 피격
    takeDamage(damage) {
        if (!this.isAlive || this.isHit) return;

        this.hp -= damage;
        this.isHit = true;

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        } else {
            this.playHitEffect();

            // 짧은 경직
            this.scene.time.delayedCall(100, () => {
                this.isHit = false;
            });
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`적 피격: ${damage} 데미지, 남은 HP: ${this.hp}`);
        }
    }

    // 피격 효과
    playHitEffect() {
        // 색상 플래시
        const originalColor = this.sprite.fillColor;
        this.sprite.setFillStyle(0xFFFFFF);

        this.scene.time.delayedCall(100, () => {
            if (this.sprite && this.sprite.active) {
                this.sprite.setFillStyle(originalColor);
            }
        });

        // 넉백 (플레이어 반대 방향)
        const knockbackDirection = this.direction * -1;
        this.sprite.body.setVelocityX(100 * knockbackDirection);
        this.sprite.body.setVelocityY(-50);
    }

    // 사망
    die() {
        this.isAlive = false;

        // 사망 애니메이션
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            y: this.sprite.y + 20,
            duration: 300,
            onComplete: () => {
                // 아이템 드롭 (나중에 구현)
                this.onDeath();
                this.destroy();
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('적 사망');
        }
    }

    // 사망 시 호출 (하위 클래스에서 오버라이드 가능)
    onDeath() {
        // 아이템 드롭, 점수 추가 등
    }

    // AI 업데이트 (하위 클래스에서 오버라이드)
    updateAI() {
        // 기본 AI: 좌우 순찰
        if (!this.isAlive || this.isHit) return;

        // 이동 범위 체크
        const distanceFromStart = this.sprite.x - this.startX;

        if (Math.abs(distanceFromStart) > this.patrolDistance) {
            this.direction *= -1;
        }

        // 이동
        this.sprite.body.setVelocityX(this.speed * this.direction);
    }

    // 업데이트
    update() {
        if (!this.sprite || !this.sprite.active) return;

        try {
            this.updateAI();
        } catch (error) {
            console.error('Enemy update 오류:', error);
        }
    }

    // 파괴
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.Enemy = Enemy;
}
