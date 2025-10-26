// 박쥐 적 (Stage 4 잡몹)
class BatEnemy extends Enemy {
    constructor(scene, x, y) {
        // BAT 설정이 없으면 기본값 사용
        const config = CONSTANTS.ENEMIES.BAT || {
            HP: 35,
            DAMAGE: 15,
            SPEED: 80,
            WIDTH: 46,
            HEIGHT: 30,
            COLOR: 0x8B4513
        };

        super(scene, x, y, config);

        // Rectangle sprite 제거
        if (this.sprite) {
            this.sprite.destroy();
        }

        // 스프라이트시트로 교체
        this.sprite = scene.add.sprite(x, y, 'bat_flying');
        this.sprite.play('bat_flying');

        // 물리 바디 재설정
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setAllowGravity(false); // 공중 비행
        this.sprite.body.setCollideWorldBounds(true);

        // 히트박스 조정 (46x30 스프라이트 기준)
        this.sprite.body.setSize(38, 24);
        this.sprite.body.setOffset(4, 3);

        // 데이터 재설정
        this.sprite.setData('entity', this);
        this.sprite.setData('type', 'enemy');
        this.sprite.setData('damage', this.damage);

        // 박쥐 전용 AI 상태
        this.detectionRange = 200; // 플레이어 감지 범위
        this.rushSpeed = 150; // 돌진 속도
        this.isRushing = false; // 돌진 중
        this.rushCooldown = 0; // 돌진 쿨타임
        this.rushInterval = 2000; // 돌진 간격 2초
        this.floatOffset = 0; // 부유 애니메이션용
        this.floatSpeed = 1; // 부유 속도
    }

    updateAI() {
        if (!this.isAlive || this.isHit) return;
        if (!this.sprite || !this.sprite.body) return;

        const currentTime = this.scene.time.now;

        // 맵 경계 체크 (박쥐가 맵 밖으로 나가지 않도록)
        const margin = 50;
        let hitBoundary = false;

        if (this.sprite.x < margin) {
            this.sprite.x = margin;
            this.sprite.body.setVelocityX(Math.abs(this.sprite.body.velocity.x) * 0.5);
            hitBoundary = true;
        } else if (this.sprite.x > CONSTANTS.WORLD.WIDTH - margin) {
            this.sprite.x = CONSTANTS.WORLD.WIDTH - margin;
            this.sprite.body.setVelocityX(-Math.abs(this.sprite.body.velocity.x) * 0.5);
            hitBoundary = true;
        }

        // Y 좌표 경계 체크
        if (this.sprite.y < 100) {
            this.sprite.y = 100;
            this.sprite.body.setVelocityY(Math.abs(this.sprite.body.velocity.y) * 0.5);
            hitBoundary = true;
        } else if (this.sprite.y > CONSTANTS.GAME.HEIGHT - 100) {
            this.sprite.y = CONSTANTS.GAME.HEIGHT - 100;
            this.sprite.body.setVelocityY(-Math.abs(this.sprite.body.velocity.y) * 0.5);
            hitBoundary = true;
        }

        // 경계에 닿았을 때 돌진 중이면 한 번만 중단
        if (hitBoundary && this.isRushing) {
            this.stopRush();
        }

        // 플레이어 위치 가져오기
        const player = window.player;
        if (!player || !player.sprite) return;

        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );

        // 플레이어 감지 범위 내
        if (distanceToPlayer < this.detectionRange) {
            // 돌진 쿨타임 확인
            if (!this.isRushing && currentTime - this.rushCooldown > this.rushInterval) {
                this.startRush(player);
            }
        }

        // 돌진 중
        if (this.isRushing) {
            // 돌진 지속시간 체크 (1.5초)
            if (currentTime - this.rushStartTime > 1500) {
                this.stopRush();
            }
        } else {
            // 평소: 좌우 순찰 + 부유 애니메이션
            this.patrolBehavior();
        }

        // 방향에 따라 스프라이트 뒤집기
        if (this.sprite.body.velocity.x > 0) {
            this.sprite.setFlipX(false);
        } else if (this.sprite.body.velocity.x < 0) {
            this.sprite.setFlipX(true);
        }
    }

    patrolBehavior() {
        // 순찰 범위 체크
        const distanceFromStart = this.sprite.x - this.startX;

        if (Math.abs(distanceFromStart) > this.patrolDistance) {
            this.direction *= -1;
        }

        // 좌우 이동
        this.sprite.body.setVelocityX(this.speed * this.direction);

        // 위아래 부유 애니메이션
        this.floatOffset += this.floatSpeed * 0.05;
        const floatY = Math.sin(this.floatOffset) * 20;
        this.sprite.body.setVelocityY(floatY);
    }

    startRush(player) {
        this.isRushing = true;
        this.rushStartTime = this.scene.time.now;

        // 플레이어 방향으로 돌진
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );

        this.sprite.body.setVelocity(
            Math.cos(angle) * this.rushSpeed,
            Math.sin(angle) * this.rushSpeed
        );

        // 돌진 이펙트 (빨간 잔상)
        this.sprite.setTint(0xff6666);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('박쥐 돌진!');
        }
    }

    stopRush() {
        this.isRushing = false;
        this.rushCooldown = this.scene.time.now;
        this.sprite.clearTint();

        // 속도 줄이기
        this.sprite.body.setVelocity(
            this.sprite.body.velocity.x * 0.5,
            this.sprite.body.velocity.y * 0.5
        );
    }

    playHitEffect() {
        // 피격 애니메이션
        this.sprite.play('bat_hit');

        // 원래 애니메이션으로 복귀
        this.scene.time.delayedCall(400, () => {
            if (this.sprite && this.sprite.active && this.isAlive) {
                this.sprite.play('bat_flying');
            }
        });

        // 돌진 중지
        if (this.isRushing) {
            this.stopRush();
        }

        // 넉백
        const knockbackDirection = this.direction * -1;
        this.sprite.body.setVelocityX(120 * knockbackDirection);
        this.sprite.body.setVelocityY(-80);

        // 피격 파티클 (갈색)
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                if (!this.sprite || !this.sprite.active) return;

                const particle = this.scene.add.circle(
                    this.sprite.x + (Math.random() - 0.5) * 40,
                    this.sprite.y + (Math.random() - 0.5) * 30,
                    Math.random() * 4 + 2,
                    0x8B4513, // 갈색
                    0.8
                );

                this.scene.physics.add.existing(particle);
                particle.body.setAllowGravity(false);
                particle.body.setVelocity(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100
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
            console.log('박쥐 사망');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.BatEnemy = BatEnemy;
}
