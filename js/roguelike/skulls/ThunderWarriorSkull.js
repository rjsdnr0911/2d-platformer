// 뇌전 전사 스컬 (전설 등급)
class ThunderWarriorSkull extends SkullBase {
    constructor() {
        super({
            id: 'thunderWarrior',
            name: '뇌전 전사',
            rarity: 'legendary',
            type: 'hybrid',
            description: '번개를 다루는 최강의 전사',

            // 스탯
            baseHP: 5,
            moveSpeed: 1.1,
            jumpPower: 1.05,
            attackPower: 1.3,

            // 기본 공격: 전기 검 공격
            basicAttack: function() {
                const direction = this.flipX ? -1 : 1;

                // 전기 검 히트박스
                const thunderBlade = this.scene.add.rectangle(
                    this.x + direction * 45,
                    this.y,
                    60, 50,
                    0x00FFFF, 0.5
                );
                thunderBlade.damage = 18 * this.attackMultiplier;

                this.scene.physics.add.existing(thunderBlade);

                // 번개 이펙트
                const lightning = this.scene.add.graphics();
                lightning.lineStyle(2, 0xFFFF00, 1);

                for (let i = 0; i < 3; i++) {
                    const x1 = thunderBlade.x + Phaser.Math.Between(-20, 20);
                    const y1 = thunderBlade.y + Phaser.Math.Between(-25, 25);
                    const x2 = x1 + Phaser.Math.Between(-15, 15);
                    const y2 = y1 + Phaser.Math.Between(-15, 15);
                    lightning.lineBetween(x1, y1, x2, y2);
                }

                // 적과 충돌
                if (this.scene.enemyList) {
                    this.scene.enemyList.forEach(enemy => {
                        if (enemy.active && this.scene.physics.overlap(thunderBlade, enemy.sprite)) {
                            enemy.takeDamage(thunderBlade.damage);

                            // 감전 효과 (이동속도 -30%, 2초)
                            enemy.applyShock(0.3, 2000);

                            // 10% 확률로 연쇄 번개
                            if (Math.random() < 0.1) {
                                this.chainLightning(this.scene, enemy, thunderBlade.damage * 0.6);
                            }

                            enemy.knockback(direction * 150, -70);
                        }
                    });
                }

                // 정전기 축적 (패시브)
                if (this.staticCharge === undefined) this.staticCharge = 0;
                this.staticCharge = Math.min(100, this.staticCharge + 5);

                // 이펙트 제거
                this.scene.time.delayedCall(150, () => {
                    thunderBlade.destroy();
                    lightning.destroy();
                });
            },

            // 스킬 1: 번개 대시
            skill1: {
                name: '번개 대시',
                cooldown: 4000,
                effect: function(player) {
                    const direction = player.flipX ? -1 : 1;

                    // 무적 상태
                    player.isInvincible = true;

                    // 전방으로 빠르게 대시
                    player.setVelocityX(direction * 600);

                    // 번개 궤적
                    const trail = [];
                    const trailInterval = player.scene.time.addEvent({
                        delay: 30,
                        callback: () => {
                            const spark = player.scene.add.circle(
                                player.x,
                                player.y,
                                8, 0xFFFF00, 0.8
                            );

                            trail.push(spark);

                            player.scene.tweens.add({
                                targets: spark,
                                alpha: 0,
                                scale: 0.3,
                                duration: 300,
                                onComplete: () => spark.destroy()
                            });
                        },
                        loop: true
                    });

                    // 대시 중 적과 충돌 시 피해
                    const damageBox = player.scene.add.rectangle(
                        player.x, player.y,
                        60, 60,
                        0xFFFF00, 0.0
                    );
                    player.scene.physics.add.existing(damageBox);

                    const checkCollision = () => {
                        if (!damageBox.active) return;

                        damageBox.setPosition(player.x, player.y);

                        if (player.scene.enemyList) {
                            player.scene.enemyList.forEach(enemy => {
                                if (enemy.active && !enemy.hitByDash &&
                                    player.scene.physics.overlap(damageBox, enemy.sprite)) {
                                    const damage = 30 * player.attackMultiplier;
                                    enemy.takeDamage(damage);
                                    enemy.applyShock(0.5, 2000);
                                    enemy.knockback(direction * 200, -100);
                                    enemy.hitByDash = true;

                                    // 번개 충격 이펙트
                                    const impact = player.scene.add.circle(
                                        enemy.sprite.x, enemy.sprite.y,
                                        20, 0xFFFF00, 0.8
                                    );
                                    player.scene.tweens.add({
                                        targets: impact,
                                        radius: 50,
                                        alpha: 0,
                                        duration: 300,
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

                    // 0.4초 후 정지
                    player.scene.time.delayedCall(400, () => {
                        player.setVelocityX(0);
                        player.isInvincible = false;
                        trailInterval.remove();
                        collisionInterval.remove();
                        damageBox.destroy();

                        // 적의 hitByDash 플래그 초기화
                        if (player.scene.enemyList) {
                            player.scene.enemyList.forEach(enemy => {
                                enemy.hitByDash = false;
                            });
                        }
                    });
                }
            },

            // 스킬 2: 천둥 소환 (번개 낙뢰 3회)
            skill2: {
                name: '천둥 소환',
                cooldown: 10000,
                effect: function(player) {
                    // 3회 번개 낙뢰
                    for (let i = 0; i < 3; i++) {
                        player.scene.time.delayedCall(i * 600, () => {
                            // 랜덤 위치 (적 근처 우선)
                            let targetX, targetY;

                            if (player.scene.enemyList && player.scene.enemyList.length > 0) {
                                const randomEnemy = Phaser.Utils.Array.GetRandom(
                                    player.scene.enemyList.filter(e => e.active)
                                );

                                if (randomEnemy) {
                                    targetX = randomEnemy.sprite.x + Phaser.Math.Between(-30, 30);
                                    targetY = randomEnemy.sprite.y;
                                } else {
                                    targetX = player.x + Phaser.Math.Between(-150, 150);
                                    targetY = player.y;
                                }
                            } else {
                                targetX = player.x + Phaser.Math.Between(-150, 150);
                                targetY = player.y;
                            }

                            // 경고 표시
                            const warning = player.scene.add.circle(
                                targetX, targetY,
                                30, 0xFFFF00, 0.3
                            );
                            warning.setStrokeStyle(2, 0xFFFF00);

                            // 0.5초 후 번개 낙하
                            player.scene.time.delayedCall(500, () => {
                                warning.destroy();

                                // 번개 기둥
                                const lightning = player.scene.add.rectangle(
                                    targetX, targetY - 150,
                                    10, 300,
                                    0xFFFF00, 1.0
                                );

                                // 번개 그래픽
                                const bolt = player.scene.add.graphics();
                                bolt.lineStyle(4, 0xFFFFFF, 1);

                                let currentY = 0;
                                while (currentY < 300) {
                                    const nextY = currentY + Phaser.Math.Between(20, 40);
                                    const offsetX = Phaser.Math.Between(-10, 10);
                                    bolt.lineBetween(
                                        targetX,
                                        targetY - 150 + currentY,
                                        targetX + offsetX,
                                        targetY - 150 + nextY
                                    );
                                    currentY = nextY;
                                }

                                // 폭발 이펙트
                                const explosion = player.scene.add.circle(
                                    targetX, targetY,
                                    40, 0xFFFF00, 0.8
                                );

                                player.scene.tweens.add({
                                    targets: explosion,
                                    radius: 100,
                                    alpha: 0,
                                    duration: 500,
                                    onComplete: () => explosion.destroy()
                                });

                                // 범위 피해
                                if (player.scene.enemyList) {
                                    player.scene.enemyList.forEach(enemy => {
                                        if (enemy.active) {
                                            const distance = Phaser.Math.Distance.Between(
                                                targetX, targetY,
                                                enemy.sprite.x, enemy.sprite.y
                                            );

                                            if (distance < 100) {
                                                const damage = 50 * player.attackMultiplier;
                                                enemy.takeDamage(damage);
                                                enemy.applyShock(0.7, 3000);

                                                const angle = Phaser.Math.Angle.Between(
                                                    targetX, targetY,
                                                    enemy.sprite.x, enemy.sprite.y
                                                );
                                                enemy.knockback(
                                                    Math.cos(angle) * 250,
                                                    -200
                                                );
                                            }
                                        }
                                    });
                                }

                                // 이펙트 제거
                                player.scene.time.delayedCall(200, () => {
                                    lightning.destroy();
                                    bolt.destroy();
                                });
                            });
                        });
                    }
                }
            },

            // 교체 효과: 전기 충격
            swapEffect: function(player) {
                // 주변에 전기 충격
                const shockwave = player.scene.add.circle(
                    player.x, player.y,
                    40, 0xFFFF00, 0.6
                );

                player.scene.tweens.add({
                    targets: shockwave,
                    radius: 90,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => shockwave.destroy()
                });

                // 주변 적에게 감전 + 피해
                if (player.scene.enemyList) {
                    player.scene.enemyList.forEach(enemy => {
                        if (enemy.active) {
                            const distance = Phaser.Math.Distance.Between(
                                player.x, player.y,
                                enemy.sprite.x, enemy.sprite.y
                            );

                            if (distance < 90) {
                                enemy.takeDamage(12 * player.attackMultiplier);
                                enemy.applyShock(0.4, 2000);

                                const angle = Phaser.Math.Angle.Between(
                                    player.x, player.y,
                                    enemy.sprite.x, enemy.sprite.y
                                );
                                enemy.knockback(
                                    Math.cos(angle) * 150,
                                    Math.sin(angle) * 150 - 70
                                );
                            }
                        }
                    });
                }
            },

            // 패시브: 정전기 (이동 시 전기 축적, 공격 시 방전)
            passive: {
                name: '정전기',
                description: '이동 시 전기 축적, 공격 시 방전',
                onActivate: function(player) {
                    player.staticCharge = 0;
                    player.staticMaxCharge = 100;
                },
                update: function(player, time, delta) {
                    // 이동 중일 때 정전기 축적
                    if (player.body && Math.abs(player.body.velocity.x) > 50) {
                        player.staticCharge = Math.min(
                            player.staticMaxCharge,
                            (player.staticCharge || 0) + delta * 0.05
                        );
                    }

                    // 100% 축적 시 오라 표시
                    if (player.staticCharge >= 100 && !player.staticAura) {
                        player.staticAura = player.scene.add.circle(
                            player.x, player.y,
                            35, 0xFFFF00, 0.2
                        );
                        player.staticAura.setStrokeStyle(2, 0xFFFF00);
                    }

                    // 오라 업데이트
                    if (player.staticAura && player.staticAura.active) {
                        player.staticAura.setPosition(player.x, player.y);

                        if (player.staticCharge < 100) {
                            player.staticAura.destroy();
                            player.staticAura = null;
                        }
                    }
                },
                onDeactivate: function(player) {
                    if (player.staticAura && player.staticAura.active) {
                        player.staticAura.destroy();
                        player.staticAura = null;
                    }
                    player.staticCharge = 0;
                }
            }
        });

        // 연쇄 번개 헬퍼 함수
        this.chainLightning = function(scene, sourceEnemy, damage) {
            // 가까운 다른 적 찾기
            let nearestEnemy = null;
            let minDistance = Infinity;

            if (scene.enemyList) {
                scene.enemyList.forEach(enemy => {
                    if (enemy.active && enemy !== sourceEnemy) {
                        const distance = Phaser.Math.Distance.Between(
                            sourceEnemy.sprite.x, sourceEnemy.sprite.y,
                            enemy.sprite.x, enemy.sprite.y
                        );

                        if (distance < 150 && distance < minDistance) {
                            minDistance = distance;
                            nearestEnemy = enemy;
                        }
                    }
                });
            }

            if (nearestEnemy) {
                // 번개 선 그리기
                const chain = scene.add.graphics();
                chain.lineStyle(3, 0xFFFF00, 1);
                chain.lineBetween(
                    sourceEnemy.sprite.x, sourceEnemy.sprite.y,
                    nearestEnemy.sprite.x, nearestEnemy.sprite.y
                );

                // 피해
                nearestEnemy.takeDamage(damage);
                nearestEnemy.applyShock(0.3, 1500);

                // 이펙트 제거
                scene.tweens.add({
                    targets: chain,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => chain.destroy()
                });
            }
        };
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.ThunderWarriorSkull = ThunderWarriorSkull;
}
