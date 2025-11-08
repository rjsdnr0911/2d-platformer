// 레인저 스컬 (일반 등급)
class RangerSkull extends SkullBase {
    constructor() {
        super({
            id: 'ranger',
            name: '레인저',
            rarity: 'common',
            type: 'ranged',
            description: '빠르고 정확한 원거리 공격',

            // 스탯
            baseHP: -5,
            moveSpeed: 1.1,
            jumpPower: 1.0,
            attackPower: 0.9,

            // 기본 공격: 빠른 화살
            basicAttack: function() {
                const direction = this.flipX ? -1 : 1;

                // 화살 생성
                const arrow = this.scene.add.rectangle(
                    this.x + direction * 30,
                    this.y - 10,
                    20, 4,
                    0xFFD700
                );
                arrow.damage = 12 * this.attackMultiplier;
                arrow.hasHit = false;

                this.scene.physics.add.existing(arrow);
                arrow.body.setVelocityX(direction * 400);
                arrow.body.setAllowGravity(false);

                // 주기적으로 적과 충돌 체크
                const checkCollision = this.scene.time.addEvent({
                    delay: 16,
                    callback: () => {
                        if (!arrow.active || arrow.hasHit) {
                            checkCollision.remove();
                            return;
                        }

                        if (this.scene.enemyList) {
                            this.scene.enemyList.forEach(enemy => {
                                if (enemy && enemy.active && enemy.sprite && !arrow.hasHit) {
                                    const distance = Phaser.Math.Distance.Between(
                                        arrow.x, arrow.y,
                                        enemy.sprite.x, enemy.sprite.y
                                    );

                                    if (distance < 25) {
                                        enemy.takeDamage(arrow.damage);
                                        arrow.hasHit = true;
                                        arrow.destroy();
                                        checkCollision.remove();
                                    }
                                }
                            });
                        }
                    },
                    loop: true
                });

                // 2초 후 제거
                this.scene.time.delayedCall(2000, () => {
                    if (arrow.active) {
                        arrow.destroy();
                        checkCollision.remove();
                    }
                });
            },

            // 스킬 1: 관통 화살
            skill1: {
                name: '관통 화살',
                cooldown: 4000,
                effect: function(player) {
                    const direction = player.flipX ? -1 : 1;

                    // 관통 화살 생성
                    const arrow = player.scene.add.rectangle(
                        player.x + direction * 30,
                        player.y - 10,
                        30, 6,
                        0x00FFFF
                    );
                    arrow.damage = 20 * player.attackMultiplier;
                    arrow.pierce = true;
                    arrow.hitEnemies = new Set();

                    player.scene.physics.add.existing(arrow);
                    arrow.body.setVelocityX(direction * 500);
                    arrow.body.setAllowGravity(false);

                    // 빛나는 효과
                    player.scene.tweens.add({
                        targets: arrow,
                        alpha: 0.5,
                        duration: 100,
                        yoyo: true,
                        repeat: -1
                    });

                    // 적과 충돌 (관통)
                    const checkCollision = () => {
                        if (!arrow.active) return;

                        if (player.scene.enemyList) {
                            player.scene.enemyList.forEach(enemy => {
                                if (enemy.active && !arrow.hitEnemies.has(enemy) &&
                                    player.scene.physics.overlap(arrow, enemy.sprite)) {
                                    enemy.takeDamage(arrow.damage);
                                    arrow.hitEnemies.add(enemy);

                                    // 관통 이펙트
                                    const impact = player.scene.add.circle(
                                        enemy.sprite.x, enemy.sprite.y,
                                        15, 0x00FFFF, 0.6
                                    );
                                    player.scene.tweens.add({
                                        targets: impact,
                                        alpha: 0,
                                        scale: 1.5,
                                        duration: 200,
                                        onComplete: () => impact.destroy()
                                    });
                                }
                            });
                        }
                    };

                    const collisionInterval = player.scene.time.addEvent({
                        delay: 50,
                        callback: checkCollision,
                        loop: true
                    });

                    // 3초 후 제거
                    player.scene.time.delayedCall(3000, () => {
                        collisionInterval.remove();
                        if (arrow.active) arrow.destroy();
                    });
                }
            },

            // 스킬 2: 폭발 화살
            skill2: {
                name: '폭발 화살',
                cooldown: 10000,
                effect: function(player) {
                    const direction = player.flipX ? -1 : 1;

                    // 폭발 화살 생성
                    const arrow = player.scene.add.rectangle(
                        player.x + direction * 30,
                        player.y - 10,
                        25, 5,
                        0xFF4444
                    );

                    player.scene.physics.add.existing(arrow);
                    arrow.body.setVelocityX(direction * 350);
                    arrow.body.setAllowGravity(false);

                    // 폭발 함수
                    const explode = (x, y) => {
                        // 폭발 이펙트
                        const explosion = player.scene.add.circle(
                            x, y, 20, 0xFF4444, 0.8
                        );

                        player.scene.tweens.add({
                            targets: explosion,
                            radius: 100,
                            alpha: 0,
                            duration: 400,
                            onComplete: () => explosion.destroy()
                        });

                        // 범위 피해
                        if (player.scene.enemyList) {
                            player.scene.enemyList.forEach(enemy => {
                                if (enemy.active) {
                                    const distance = Phaser.Math.Distance.Between(
                                        x, y,
                                        enemy.sprite.x, enemy.sprite.y
                                    );

                                    if (distance < 100) {
                                        const damage = 35 * player.attackMultiplier;
                                        enemy.takeDamage(damage);

                                        // 넉백
                                        const angle = Phaser.Math.Angle.Between(
                                            x, y,
                                            enemy.sprite.x, enemy.sprite.y
                                        );
                                        enemy.knockback(
                                            Math.cos(angle) * 200,
                                            Math.sin(angle) * 200 - 100
                                        );
                                    }
                                }
                            });
                        }
                    };

                    // 적과 충돌 시 폭발
                    if (player.scene.enemyList) {
                        player.scene.enemyList.forEach(enemy => {
                            player.scene.physics.add.overlap(arrow, enemy.sprite, () => {
                                if (enemy.active && arrow.active) {
                                    explode(arrow.x, arrow.y);
                                    arrow.destroy();
                                }
                            });
                        });
                    }

                    // 2초 후 자동 폭발
                    player.scene.time.delayedCall(2000, () => {
                        if (arrow.active) {
                            explode(arrow.x, arrow.y);
                            arrow.destroy();
                        }
                    });
                }
            },

            // 교체 효과: 후방 점프
            swapEffect: function(player) {
                const direction = player.flipX ? 1 : -1;

                // 뒤로 점프
                player.setVelocity(direction * 200, -200);

                // 잔상 효과
                const afterimage = player.scene.add.rectangle(
                    player.x, player.y,
                    player.width, player.height,
                    0x00FF00, 0.3
                );

                player.scene.tweens.add({
                    targets: afterimage,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => afterimage.destroy()
                });
            },

            // 패시브: 없음 (일반 등급)
            passive: null
        });
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RangerSkull = RangerSkull;
}
