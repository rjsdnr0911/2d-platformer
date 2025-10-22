// 검병 적
class SwordEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, CONSTANTS.ENEMIES.SWORD_ENEMY);

        this.aggroRange = 200; // 인식 범위
        this.attackRange = 60; // 공격 범위
        this.attackCooldown = 0;
        this.attackInterval = 1500; // 1.5초마다 공격
        this.isAttacking = false;
    }

    updateAI() {
        if (!this.isAlive || this.isHit || this.isAttacking) return;

        // 플레이어 찾기 (전역 변수 window.player 사용 - game.js에서 정의됨)
        if (typeof window.player === 'undefined' || !window.player || !window.player.isAlive) {
            // 플레이어 없으면 순찰
            super.updateAI();
            return;
        }

        const playerX = window.player.sprite.x;
        const distanceToPlayer = Math.abs(this.sprite.x - playerX);

        // 인식 범위 내에 플레이어가 있으면
        if (distanceToPlayer < this.aggroRange) {
            // 플레이어 방향 결정
            this.direction = playerX > this.sprite.x ? 1 : -1;

            // 공격 범위 내에 있으면 공격
            if (distanceToPlayer < this.attackRange) {
                this.tryAttack();
            } else {
                // 플레이어에게 다가감
                this.sprite.body.setVelocityX(this.speed * 1.5 * this.direction);
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

        // 공격 애니메이션 (앞으로 찌르기)
        const originalX = this.sprite.x;
        const attackDistance = 30 * this.direction;

        this.scene.tweens.add({
            targets: this.sprite,
            x: originalX + attackDistance,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.isAttacking = false;
            }
        });

        // 공격 판정 생성
        const hitbox = this.scene.add.rectangle(
            this.sprite.x + (40 * this.direction),
            this.sprite.y,
            50, 40,
            0xFF0000,
            CONSTANTS.GAME.DEBUG ? 0.3 : 0
        );

        this.scene.physics.add.existing(hitbox);
        hitbox.body.setAllowGravity(false);
        hitbox.body.setImmovable(true);

        hitbox.setData('damage', this.damage);
        hitbox.setData('type', 'enemyAttack');
        hitbox.setData('owner', this);

        // 플레이어와 충돌 체크
        this.scene.physics.overlap(
            hitbox,
            window.player.sprite,
            (hitboxObj, playerSprite) => {
                if (window.player && window.player.isAlive && !window.player.isInvincible) {
                    window.player.takeDamage(this.damage);
                }
            }
        );

        // 잠시 후 제거
        this.scene.time.delayedCall(150, () => {
            if (hitbox && hitbox.active) {
                hitbox.destroy();
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('검병: 공격');
        }
    }

    onDeath() {
        // 검술 능력 오브 드롭
        this.dropAbilityOrb('sword');
    }

    dropAbilityOrb(abilityType) {
        const orb = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            15,
            0xFF4444,
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

        // 전역 배열에 저장 (game.js에서 충돌 체크용)
        if (typeof window.abilityOrbs !== 'undefined') {
            window.abilityOrbs.push(orb);
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('능력 오브 드롭:', abilityType);
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.SwordEnemy = SwordEnemy;
}
