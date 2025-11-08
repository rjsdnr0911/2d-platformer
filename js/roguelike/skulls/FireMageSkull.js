// 화염 마법사 스컬 (희귀 등급)
class FireMageSkull extends SkullBase {
    constructor() {
        super({
            id: 'fireMage',
            name: '화염 마법사',
            rarity: 'rare',
            type: 'ranged',
            description: '강력한 화염 마법으로 적을 불태운다',

            // 스탯
            baseHP: -10,
            moveSpeed: 0.9,
            jumpPower: 1.0,
            attackPower: 1.2,

            // 기본 공격: 화염구
            basicAttack: function() {
                const direction = this.flipX ? -1 : 1;

                // 화염구 생성
                const fireball = this.scene.add.circle(
                    this.x + direction * 30,
                    this.y - 10,
                    10, 0xFF4400, 1.0
                );
                fireball.damage = 15 * this.attackMultiplier;

                this.scene.physics.add.existing(fireball);
                fireball.body.setVelocityX(direction * 300);
                fireball.body.setAllowGravity(false);

                // 불꽃 효과
                this.scene.tweens.add({
                    targets: fireball,
                    scale: 1.2,
                    duration: 100,
                    yoyo: true,
                    repeat: -1
                });

                // 적과 충돌
                if (this.scene.enemyList) {
                    this.scene.enemyList.forEach(enemy => {
                        this.scene.physics.add.overlap(fireball, enemy.sprite, () => {
                            if (enemy.active && fireball.active) {
                                enemy.takeDamage(fireball.damage);

                                // 화상 부여 (3초간 초당 5 피해)
                                enemy.applyBurn(5, 3000);

                                // 폭발 이펙트
                                const explosion = this.scene.add.circle(
                                    fireball.x, fireball.y,
                                    15, 0xFF4400, 0.7
                                );
                                this.scene.tweens.add({
                                    targets: explosion,
                                    scale: 2,
                                    alpha: 0,
                                    duration: 300,
                                    onComplete: () => explosion.destroy()
                                });

                                fireball.destroy();
                            }
                        });
                    });
                }

                // 2초 후 제거
                this.scene.time.delayedCall(2000, () => {
                    if (fireball.active) fireball.destroy();
                });
            },

            // 스킬 1: 화염 기둥
            skill1: {
                name: '화염 기둥',
                cooldown: 5000,
                effect: function(player) {
                    const direction = player.flipX ? -1 : 1;
                    const distance = 120;

                    for (let i = 0; i < 3; i++) {
                        const xPos = player.x + direction * (distance / 2 + i * distance);

                        // 화염 기둥 생성
                        const pillar = player.scene.add.rectangle(
                            xPos, player.y,
                            40, 150,
                            0xFF6600, 0.7
                        );
                        pillar.damage = 20 * player.attackMultiplier;

                        player.scene.physics.add.existing(pillar);
                        pillar.body.setAllowGravity(false);

                        // 상승 애니메이션
                        pillar.setScale(1, 0);
                        player.scene.tweens.add({
                            targets: pillar,
                            scaleY: 1,
                            duration: 200,
                            delay: i * 100
                        });

                        // 적과 충돌
                        if (player.scene.enemyList) {
                            player.scene.enemyList.forEach(enemy => {
                                player.scene.physics.add.overlap(pillar, enemy.sprite, () => {
                                    if (enemy.active && pillar.active) {
                                        enemy.takeDamage(pillar.damage);
                                        enemy.applyBurn(7, 3000);
                                        enemy.knockback(0, -150);
                                    }
                                });
                            });
                        }

                        // 1초 후 제거
                        player.scene.time.delayedCall(1000 + i * 100, () => {
                            player.scene.tweens.add({
                                targets: pillar,
                                alpha: 0,
                                duration: 200,
                                onComplete: () => pillar.destroy()
                            });
                        });
                    }
                }
            },

            // 스킬 2: 메테오
            skill2: {
                name: '메테오',
                cooldown: 15000,
                effect: function(player) {
                    // 3개의 메테오가 떨어짐
                    for (let i = 0; i < 3; i++) {
                        player.scene.time.delayedCall(i * 500, () => {
                            // 랜덤 위치 (플레이어 주변)
                            const xPos = player.x + Phaser.Math.Between(-200, 200);
                            const yPos = -50;

                            // 메테오 생성
                            const meteor = player.scene.add.circle(
                                xPos, yPos,
                                20, 0xFF0000, 1.0
                            );
                            meteor.damage = 50 * player.attackMultiplier;

                            player.scene.physics.add.existing(meteor);
                            meteor.body.setVelocityY(400);

                            // 불타는 효과
                            player.scene.tweens.add({
                                targets: meteor,
                                alpha: 0.6,
                                duration: 100,
                                yoyo: true,
                                repeat: -1
                            });

                            // 바닥 충돌 감지
                            const checkLanding = player.scene.time.addEvent({
                                delay: 50,
                                callback: () => {
                                    if (meteor.y >= player.scene.physics.world.bounds.height - 100) {
                                        checkLanding.remove();

                                        // 폭발
                                        const explosion = player.scene.add.circle(
                                            meteor.x, meteor.y,
                                            30, 0xFF4400, 0.8
                                        );

                                        player.scene.tweens.add({
                                            targets: explosion,
                                            radius: 120,
                                            alpha: 0,
                                            duration: 500,
                                            onComplete: () => explosion.destroy()
                                        });

                                        // 범위 피해
                                        if (player.scene.enemyList) {
                                            player.scene.enemyList.forEach(enemy => {
                                                if (enemy.active) {
                                                    const distance = Phaser.Math.Distance.Between(
                                                        meteor.x, meteor.y,
                                                        enemy.sprite.x, enemy.sprite.y
                                                    );

                                                    if (distance < 120) {
                                                        enemy.takeDamage(meteor.damage);
                                                        enemy.applyBurn(10, 5000);

                                                        const angle = Phaser.Math.Angle.Between(
                                                            meteor.x, meteor.y,
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

                                        meteor.destroy();
                                    }
                                },
                                loop: true
                            });
                        });
                    }
                }
            },

            // 교체 효과: 화염 폭발
            swapEffect: function(player) {
                // 주변에 화염 폭발
                const explosion = player.scene.add.circle(
                    player.x, player.y,
                    40, 0xFF4400, 0.7
                );

                player.scene.tweens.add({
                    targets: explosion,
                    radius: 100,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => explosion.destroy()
                });

                // 주변 적에게 피해 + 화상
                if (player.scene.enemyList) {
                    player.scene.enemyList.forEach(enemy => {
                        if (enemy.active) {
                            const distance = Phaser.Math.Distance.Between(
                                player.x, player.y,
                                enemy.sprite.x, enemy.sprite.y
                            );

                            if (distance < 100) {
                                enemy.takeDamage(15 * player.attackMultiplier);
                                enemy.applyBurn(5, 3000);

                                const angle = Phaser.Math.Angle.Between(
                                    player.x, player.y,
                                    enemy.sprite.x, enemy.sprite.y
                                );
                                enemy.knockback(
                                    Math.cos(angle) * 180,
                                    Math.sin(angle) * 180 - 80
                                );
                            }
                        }
                    });
                }
            },

            // 패시브: 화염 친화 (화염 피해 +20%)
            passive: {
                name: '화염 친화',
                description: '화염 피해 +20%',
                onActivate: function(player) {
                    player.fireDamageBonus = (player.fireDamageBonus || 1.0) + 0.2;
                },
                onDeactivate: function(player) {
                    player.fireDamageBonus = (player.fireDamageBonus || 1.2) - 0.2;
                }
            }
        });
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.FireMageSkull = FireMageSkull;
}
