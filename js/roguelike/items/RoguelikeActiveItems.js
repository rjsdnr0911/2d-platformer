// 로그라이크 모드 액티브 아이템 정의
class RoguelikeActiveItems {
    constructor() {
        this.items = this.defineAllItems();
    }

    defineAllItems() {
        return {
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 공격형 액티브 아이템
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            grenade: {
                id: 'grenade',
                name: '수류탄',
                rarity: 'common',
                icon: '💣',
                description: '전방에 수류탄 투척\n범위 피해 50',
                cooldown: 10000,
                use: function(player) {
                    if (!player.scene) return;

                    const direction = player.flipX ? -1 : 1;

                    // 수류탄 생성
                    const grenade = player.scene.add.circle(
                        player.x + direction * 30,
                        player.y - 20,
                        8, 0x444444, 1.0
                    );

                    player.scene.physics.add.existing(grenade);
                    grenade.body.setVelocity(direction * 300, -200);
                    grenade.body.setBounce(0.5);

                    // 1.5초 후 폭발
                    player.scene.time.delayedCall(1500, () => {
                        if (!grenade.active) return;

                        // 폭발 이펙트
                        const explosion = player.scene.add.circle(
                            grenade.x, grenade.y,
                            30, 0xFF4444, 0.8
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
                                        grenade.x, grenade.y,
                                        enemy.sprite.x, enemy.sprite.y
                                    );

                                    if (distance < 100) {
                                        enemy.takeDamage(50);

                                        const angle = Phaser.Math.Angle.Between(
                                            grenade.x, grenade.y,
                                            enemy.sprite.x, enemy.sprite.y
                                        );
                                        enemy.knockback(
                                            Math.cos(angle) * 250,
                                            -150
                                        );
                                    }
                                }
                            });
                        }

                        grenade.destroy();
                    });
                }
            },

            lightningBolt: {
                id: 'lightningBolt',
                name: '번개 부적',
                rarity: 'rare',
                icon: '⚡',
                description: '번개 낙뢰 (60 피해)',
                cooldown: 12000,
                use: function(player) {
                    if (!player.scene) return;

                    // 가장 가까운 적 찾기
                    let targetEnemy = null;
                    let minDistance = Infinity;

                    if (player.scene.enemyList) {
                        player.scene.enemyList.forEach(enemy => {
                            if (enemy.active) {
                                const distance = Phaser.Math.Distance.Between(
                                    player.x, player.y,
                                    enemy.sprite.x, enemy.sprite.y
                                );

                                if (distance < minDistance) {
                                    minDistance = distance;
                                    targetEnemy = enemy;
                                }
                            }
                        });
                    }

                    if (targetEnemy) {
                        // 번개 낙하
                        const lightning = player.scene.add.rectangle(
                            targetEnemy.sprite.x,
                            targetEnemy.sprite.y - 150,
                            8, 300,
                            0xFFFF00, 1.0
                        );

                        player.scene.tweens.add({
                            targets: lightning,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => lightning.destroy()
                        });

                        targetEnemy.takeDamage(60);
                        if (targetEnemy.applyShock) {
                            targetEnemy.applyShock(0.5, 2000);
                        }
                    }
                }
            },

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 방어/회복형 액티브 아이템
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            healthPotion: {
                id: 'healthPotion',
                name: '회복 포션',
                rarity: 'common',
                icon: '🧪',
                description: 'HP 30 회복',
                cooldown: 15000,
                use: function(player) {
                    player.health = Math.min(player.maxHealth, player.health + 30);

                    // 회복 이펙트
                    if (player.scene) {
                        const healEffect = player.scene.add.circle(
                            player.x, player.y,
                            20, 0x00FF00, 0.6
                        );

                        player.scene.tweens.add({
                            targets: healEffect,
                            radius: 50,
                            alpha: 0,
                            duration: 600,
                            onComplete: () => healEffect.destroy()
                        });
                    }
                }
            },

            shield: {
                id: 'shield',
                name: '보호막',
                rarity: 'rare',
                icon: '🛡️',
                description: '3초간 피해 무효화',
                cooldown: 20000,
                use: function(player) {
                    player.isInvincible = true;

                    // 보호막 이펙트
                    if (player.scene) {
                        const shield = player.scene.add.circle(
                            player.x, player.y,
                            40, 0x4444FF, 0.3
                        );
                        shield.setStrokeStyle(3, 0x0000FF);

                        const updateShield = () => {
                            if (shield.active) {
                                shield.setPosition(player.x, player.y);
                            }
                        };

                        player.scene.events.on('update', updateShield);

                        // 3초 후 제거
                        player.scene.time.delayedCall(3000, () => {
                            player.isInvincible = false;
                            player.scene.events.off('update', updateShield);
                            shield.destroy();
                        });
                    }
                }
            },

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 유틸리티형 액티브 아이템
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            teleport: {
                id: 'teleport',
                name: '순간이동',
                rarity: 'rare',
                icon: '🌀',
                description: '전방 200px 이동',
                cooldown: 8000,
                use: function(player) {
                    const direction = player.flipX ? -1 : 1;

                    // 잔상 효과 (출발점)
                    if (player.scene) {
                        const afterimage1 = player.scene.add.rectangle(
                            player.x, player.y,
                            player.width || 40,
                            player.height || 60,
                            0x00FFFF, 0.5
                        );

                        player.scene.tweens.add({
                            targets: afterimage1,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => afterimage1.destroy()
                        });
                    }

                    // 순간이동
                    player.x += direction * 200;

                    // 잔상 효과 (도착점)
                    if (player.scene) {
                        const afterimage2 = player.scene.add.rectangle(
                            player.x, player.y,
                            player.width || 40,
                            player.height || 60,
                            0x00FFFF, 0.5
                        );

                        player.scene.tweens.add({
                            targets: afterimage2,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => afterimage2.destroy()
                        });
                    }
                }
            }
        };
    }

    // ID로 아이템 가져오기
    getItem(id) {
        return this.items[id] || null;
    }

    // 랜덤 액티브 아이템
    getRandomItem() {
        const itemIds = Object.keys(this.items);
        const randomId = Phaser.Utils.Array.GetRandom(itemIds);
        return this.items[randomId];
    }

    // 아이템 개수
    getItemCount() {
        return Object.keys(this.items).length;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RoguelikeActiveItems = RoguelikeActiveItems;
    // 싱글톤 인스턴스
    window.roguelikeActiveItems = new RoguelikeActiveItems();
}
