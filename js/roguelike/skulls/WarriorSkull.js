// 전사 스컬 (일반 등급)
class WarriorSkull extends SkullBase {
    constructor() {
        super({
            id: 'warrior',
            name: '전사',
            rarity: 'common',
            type: 'melee',
            description: '균형잡힌 근접 전투의 달인',

            // 스탯
            baseHP: 10,
            moveSpeed: 1.0,
            jumpPower: 1.0,
            attackPower: 1.0,

            // 기본 공격
            basicAttack: function() {
                // 3단 콤보 근접 공격
                this.performMeleeCombo();
            },

            // 스킬 1: 돌진 베기
            skill1: {
                name: '돌진 베기',
                cooldown: 3000,
                effect: function(player) {
                    // 전방으로 빠르게 돌진하며 공격
                    const direction = player.flipX ? -1 : 1;
                    const dashDistance = 150;

                    // 돌진
                    player.setVelocityX(direction * 400);

                    // 0.3초 후 정지
                    player.scene.time.delayedCall(300, () => {
                        player.setVelocityX(0);
                    });

                    // 검기 생성
                    const slash = player.scene.add.rectangle(
                        player.x + direction * 50,
                        player.y,
                        80, 60,
                        0xFFFFFF, 0.6
                    );
                    slash.damage = 25 * player.attackMultiplier;

                    player.scene.physics.add.existing(slash);

                    // 적과 충돌 (거리 기반)
                    if (player.scene.enemyList) {
                        player.scene.enemyList.forEach(enemy => {
                            if (enemy && enemy.active && enemy.sprite) {
                                const distance = Phaser.Math.Distance.Between(
                                    slash.x, slash.y,
                                    enemy.sprite.x, enemy.sprite.y
                                );

                                if (distance < 60) {
                                    enemy.takeDamage(slash.damage);
                                    if (enemy.sprite && enemy.sprite.body) {
                                        enemy.knockback(direction * 200, -100);
                                    }
                                }
                            }
                        });
                    }

                    // 이펙트 제거
                    player.scene.tweens.add({
                        targets: slash,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => slash.destroy()
                    });
                }
            },

            // 스킬 2: 방어 태세
            skill2: {
                name: '방어 태세',
                cooldown: 8000,
                effect: function(player) {
                    // 3초간 받는 피해 50% 감소
                    player.defenseBuffActive = true;
                    player.defenseMultiplier = 0.5;

                    // 방어 이펙트
                    const shield = player.scene.add.circle(
                        player.x, player.y,
                        40,
                        0x4444FF, 0.3
                    );
                    shield.setStrokeStyle(3, 0x0000FF);

                    // 플레이어 따라다니기
                    const updateShield = () => {
                        if (shield.active) {
                            shield.setPosition(player.x, player.y);
                        }
                    };

                    player.scene.events.on('update', updateShield);

                    // 3초 후 제거
                    player.scene.time.delayedCall(3000, () => {
                        player.defenseBuffActive = false;
                        player.defenseMultiplier = 1.0;
                        player.scene.events.off('update', updateShield);
                        shield.destroy();
                    });
                }
            },

            // 교체 효과: 충격파
            swapEffect: function(player) {
                // 주변에 작은 충격파
                const shockwave = player.scene.add.circle(
                    player.x, player.y,
                    30,
                    0xFFFFFF, 0.5
                );

                // 확장 애니메이션
                player.scene.tweens.add({
                    targets: shockwave,
                    radius: 80,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => shockwave.destroy()
                });

                // 주변 적 밀치기
                if (player.scene.enemyList) {
                    player.scene.enemyList.forEach(enemy => {
                        if (enemy.active) {
                            const distance = Phaser.Math.Distance.Between(
                                player.x, player.y,
                                enemy.sprite.x, enemy.sprite.y
                            );

                            if (distance < 80) {
                                const angle = Phaser.Math.Angle.Between(
                                    player.x, player.y,
                                    enemy.sprite.x, enemy.sprite.y
                                );
                                enemy.knockback(
                                    Math.cos(angle) * 150,
                                    Math.sin(angle) * 150 - 50
                                );
                            }
                        }
                    });
                }
            },

            // 패시브: 없음 (일반 등급)
            passive: null
        });
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.WarriorSkull = WarriorSkull;
}
