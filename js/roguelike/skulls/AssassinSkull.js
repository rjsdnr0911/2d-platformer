// 암살자 스컬 (희귀 등급)
class AssassinSkull extends SkullBase {
    constructor() {
        super({
            id: 'assassin',
            name: '암살자',
            rarity: 'rare',
            type: 'melee',
            description: '빠르고 치명적인 암살 전문가',

            // 스탯
            baseHP: 0,
            moveSpeed: 1.3,
            jumpPower: 1.1,
            attackPower: 1.1,

            // 기본 공격: 빠른 단검 공격
            basicAttack: function() {
                const direction = this.flipX ? -1 : 1;

                // 단검 공격 히트박스
                const dagger = this.scene.add.rectangle(
                    this.x + direction * 40,
                    this.y,
                    50, 40,
                    0x8800FF, 0.3
                );

                // 크리티컬 확률 (15% 기본 + 패시브)
                const critChance = 0.15 + (this.criticalBonus || 0);
                const isCritical = Math.random() < critChance;
                const baseDamage = 14 * this.attackMultiplier;
                dagger.damage = isCritical ? baseDamage * 2 : baseDamage;

                this.scene.physics.add.existing(dagger);

                // 적과 충돌
                if (this.scene.enemyList) {
                    this.scene.enemyList.forEach(enemy => {
                        if (enemy.active && this.scene.physics.overlap(dagger, enemy.sprite)) {
                            enemy.takeDamage(dagger.damage);

                            // 크리티컬 이펙트
                            if (isCritical) {
                                const critText = this.scene.add.text(
                                    enemy.sprite.x,
                                    enemy.sprite.y - 40,
                                    'CRITICAL!',
                                    {
                                        fontFamily: 'Orbitron',
                                        fontSize: '16px',
                                        fill: '#FF0000',
                                        fontStyle: 'bold'
                                    }
                                );
                                critText.setOrigin(0.5);

                                this.scene.tweens.add({
                                    targets: critText,
                                    y: critText.y - 30,
                                    alpha: 0,
                                    duration: 800,
                                    onComplete: () => critText.destroy()
                                });
                            }

                            enemy.knockback(direction * 120, -50);
                        }
                    });
                }

                // 즉시 제거
                this.scene.time.delayedCall(100, () => dagger.destroy());
            },

            // 스킬 1: 연막탄 (2초 은신)
            skill1: {
                name: '연막탄',
                cooldown: 6000,
                effect: function(player) {
                    // 연막 생성
                    const smoke = player.scene.add.circle(
                        player.x, player.y,
                        50, 0x555555, 0.6
                    );

                    player.scene.tweens.add({
                        targets: smoke,
                        radius: 80,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => smoke.destroy()
                    });

                    // 은신 효과 (2초)
                    player.isInvisible = true;
                    player.setAlpha(0.3);

                    // 은신 중 이동속도 증가
                    const originalSpeed = player.moveSpeed;
                    player.moveSpeed = originalSpeed * 1.5;

                    // 2초 후 해제
                    player.scene.time.delayedCall(2000, () => {
                        player.isInvisible = false;
                        player.setAlpha(1.0);
                        player.moveSpeed = originalSpeed;
                    });
                }
            },

            // 스킬 2: 암살 (순간이동 + 강타)
            skill2: {
                name: '암살',
                cooldown: 12000,
                effect: function(player) {
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

                                if (distance < minDistance && distance < 300) {
                                    minDistance = distance;
                                    targetEnemy = enemy;
                                }
                            }
                        });
                    }

                    if (targetEnemy) {
                        // 잔상 효과 (출발점)
                        const afterimage1 = player.scene.add.rectangle(
                            player.x, player.y,
                            player.width, player.height,
                            0x8800FF, 0.5
                        );

                        player.scene.tweens.add({
                            targets: afterimage1,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => afterimage1.destroy()
                        });

                        // 순간이동
                        const direction = targetEnemy.sprite.x > player.x ? 1 : -1;
                        player.x = targetEnemy.sprite.x - direction * 30;
                        player.y = targetEnemy.sprite.y;
                        player.flipX = direction === -1;

                        // 잔상 효과 (도착점)
                        const afterimage2 = player.scene.add.rectangle(
                            player.x, player.y,
                            player.width, player.height,
                            0x8800FF, 0.5
                        );

                        player.scene.tweens.add({
                            targets: afterimage2,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => afterimage2.destroy()
                        });

                        // 강력한 일격
                        const damage = 60 * player.attackMultiplier;
                        targetEnemy.takeDamage(damage);
                        targetEnemy.knockback(direction * 300, -200);

                        // 암살 이펙트
                        const assassinationEffect = player.scene.add.circle(
                            targetEnemy.sprite.x,
                            targetEnemy.sprite.y,
                            20, 0xFF0000, 0.8
                        );

                        player.scene.tweens.add({
                            targets: assassinationEffect,
                            radius: 60,
                            alpha: 0,
                            duration: 400,
                            onComplete: () => assassinationEffect.destroy()
                        });
                    } else {
                        // 적이 없으면 전방 대시
                        const direction = player.flipX ? -1 : 1;
                        player.setVelocityX(direction * 400);

                        player.scene.time.delayedCall(200, () => {
                            player.setVelocityX(0);
                        });
                    }
                }
            },

            // 교체 효과: 짧은 은신
            swapEffect: function(player) {
                // 0.5초 은신 + 이동속도 증가
                player.setAlpha(0.3);

                const originalSpeed = player.moveSpeed;
                player.moveSpeed = originalSpeed * 1.8;

                player.scene.time.delayedCall(500, () => {
                    player.setAlpha(1.0);
                    player.moveSpeed = originalSpeed;
                });

                // 연기 효과
                const smoke = player.scene.add.circle(
                    player.x, player.y,
                    30, 0x555555, 0.5
                );

                player.scene.tweens.add({
                    targets: smoke,
                    radius: 50,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => smoke.destroy()
                });
            },

            // 패시브: 치명타 (크리티컬 확률 +15%)
            passive: {
                name: '치명타',
                description: '크리티컬 확률 +15%',
                onActivate: function(player) {
                    player.criticalBonus = (player.criticalBonus || 0) + 0.15;
                },
                onDeactivate: function(player) {
                    player.criticalBonus = (player.criticalBonus || 0.15) - 0.15;
                }
            }
        });
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.AssassinSkull = AssassinSkull;
}
