// 유니버셜 증강 (모든 직업 사용 가능)
const UNIVERSAL_AUGMENTS = [
    // ===== 시간 조작 =====
    {
        id: 'time_warp',
        name: '시간 왜곡',
        description: '모든 적의 이동속도가 50% 감소합니다',
        rarity: 'epic',
        requiredJob: null,
        icon: '⏰',
        effectHandler: (scene, player, handler) => {
            return handler.timeWarp();
        }
    },
    {
        id: 'rewind',
        name: '리와인드',
        description: 'R키로 3초 전 위치/체력으로 되돌리기 (쿨다운 20초)',
        rarity: 'legendary',
        requiredJob: null,
        icon: '⏪',
        effectHandler: (scene, player, handler) => {
            const historySize = 180; // 3초 * 60fps
            const positionHistory = [];
            const hpHistory = [];
            let lastRewindTime = 0;
            const rewindCooldown = 20000;

            // R키 추가
            const rewindKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

            return {
                update: () => {
                    // 히스토리 기록
                    positionHistory.push({ x: player.sprite.x, y: player.sprite.y });
                    hpHistory.push(player.hp);

                    if (positionHistory.length > historySize) {
                        positionHistory.shift();
                        hpHistory.shift();
                    }

                    // 리와인드 실행
                    const now = Date.now();
                    if (Phaser.Input.Keyboard.JustDown(rewindKey) && now - lastRewindTime > rewindCooldown) {
                        lastRewindTime = now;

                        if (positionHistory.length > 0) {
                            const oldPos = positionHistory[0];
                            const oldHp = hpHistory[0];

                            player.sprite.x = oldPos.x;
                            player.sprite.y = oldPos.y;
                            player.hp = Math.max(player.hp, oldHp); // HP는 회복만 가능

                            // 리와인드 이펙트
                            const effect = scene.add.circle(player.sprite.x, player.sprite.y, 50, 0x00FFFF, 0.5);
                            scene.tweens.add({
                                targets: effect,
                                scale: 3,
                                alpha: 0,
                                duration: 500,
                                onComplete: () => effect.destroy()
                            });
                        }
                    }
                }
            };
        }
    },

    // ===== 소환 시스템 =====
    {
        id: 'shadow_clone',
        name: '그림자 분신',
        description: '나를 따라다니며 공격하는 분신 소환',
        rarity: 'legendary',
        requiredJob: null,
        icon: '👤',
        effectHandler: (scene, player, handler) => {
            return handler.shadowClone();
        }
    },
    {
        id: 'floating_swords',
        name: '검 소환진',
        description: '주변을 떠다니며 자동 공격하는 검 3개 소환',
        rarity: 'epic',
        requiredJob: null,
        icon: '⚔️⚔️⚔️',
        effectHandler: (scene, player, handler) => {
            const swords = [];
            const swordCount = 3;
            const orbitRadius = 80;

            // 검 생성
            for (let i = 0; i < swordCount; i++) {
                const sword = scene.add.rectangle(
                    player.sprite.x,
                    player.sprite.y,
                    30, 10,
                    0xFFD700
                );
                scene.physics.add.existing(sword);
                sword.body.setAllowGravity(false);
                sword.angle = (360 / swordCount) * i;
                swords.push(sword);
            }

            let swordAngle = 0;
            let lastAttackTime = 0;

            return {
                update: () => {
                    swordAngle += 2;

                    // 검 회전
                    swords.forEach((sword, i) => {
                        const angle = (swordAngle + (360 / swordCount) * i) * Math.PI / 180;
                        sword.x = player.sprite.x + Math.cos(angle) * orbitRadius;
                        sword.y = player.sprite.y + Math.sin(angle) * orbitRadius;

                        // 보스 감지 및 공격
                        const now = Date.now();
                        if (scene.boss && scene.boss.isAlive && now - lastAttackTime > 1000) {
                            const distance = Phaser.Math.Distance.Between(
                                sword.x, sword.y,
                                scene.boss.sprite.x, scene.boss.sprite.y
                            );

                            if (distance < 150) {
                                lastAttackTime = now;

                                // 검 발사
                                const projectile = scene.add.rectangle(sword.x, sword.y, 30, 10, 0xFFFFFF);
                                scene.physics.add.existing(projectile);
                                projectile.body.setAllowGravity(false);

                                const angle = Phaser.Math.Angle.Between(
                                    sword.x, sword.y,
                                    scene.boss.sprite.x, scene.boss.sprite.y
                                );
                                projectile.body.setVelocity(
                                    Math.cos(angle) * 400,
                                    Math.sin(angle) * 400
                                );
                                projectile.setData('damage', 10);

                                // 충돌
                                scene.physics.add.overlap(projectile, scene.boss.sprite, () => {
                                    scene.boss.takeDamage(projectile.getData('damage'));
                                    projectile.destroy();
                                });

                                scene.time.delayedCall(2000, () => {
                                    if (projectile.active) projectile.destroy();
                                });
                            }
                        }
                    });
                }
            };
        }
    },

    // ===== 공간 조작 =====
    {
        id: 'dimension_dash',
        name: '차원 이동',
        description: '대쉬가 순간이동으로 변경됩니다',
        rarity: 'epic',
        requiredJob: null,
        icon: '🌀',
        effectHandler: (scene, player, handler) => {
            player.dimensionDash = true;

            const originalDash = player.dash.bind(player);
            player.dash = (direction) => {
                const distance = 150;
                const targetX = player.sprite.x + (direction * distance);

                // 텔레포트 이펙트
                handler.executeTeleport(targetX, player.sprite.y);

                // 대쉬 쿨다운 적용
                player.lastDashTime = Date.now();
            };

            return { update: () => {} };
        }
    },
    {
        id: 'space_warp',
        name: '공간 왜곡',
        description: '적 투사체의 50%를 반사합니다',
        rarity: 'epic',
        requiredJob: null,
        icon: '🌌',
        effectHandler: (scene, player, handler) => {
            player.projectileReflectChance = 0.5;
            return { update: () => {} };
        }
    },

    // ===== 원소 각성 =====
    {
        id: 'flame_awakening',
        name: '화염 각성',
        description: '모든 공격에 화상 효과 추가 (3초간 초당 5 피해)',
        rarity: 'legendary',
        requiredJob: null,
        icon: '🔥',
        effectHandler: (scene, player, handler) => {
            player.flameAwakening = true;
            player.burnDamage = 5;
            player.burnDuration = 3000;
            return { update: () => {} };
        }
    },
    {
        id: 'frost_awakening',
        name: '빙결 각성',
        description: '모든 공격에 빙결 효과 추가 (2초 동결)',
        rarity: 'legendary',
        requiredJob: null,
        icon: '❄️',
        effectHandler: (scene, player, handler) => {
            player.frostAwakening = true;
            player.freezeDuration = 2000;
            return { update: () => {} };
        }
    },
    {
        id: 'lightning_awakening',
        name: '뇌전 각성',
        description: '모든 공격에 감전 효과 추가 (이동속도 -30%, 3초)',
        rarity: 'legendary',
        requiredJob: null,
        icon: '⚡',
        effectHandler: (scene, player, handler) => {
            player.lightningAwakening = true;
            player.shockSlowRatio = 0.3;
            player.shockDuration = 3000;
            return { update: () => {} };
        }
    },

    // ===== 유니크 메커니즘 =====
    {
        id: 'vengeance_blade',
        name: '복수의 칼날',
        description: '피격 시 자동으로 칼날을 발사하여 반격',
        rarity: 'epic',
        requiredJob: null,
        icon: '🗡️',
        effectHandler: (scene, player, handler) => {
            return handler.vengeanceBlade();
        }
    },
    {
        id: 'shadow_step',
        name: '그림자 스텝',
        description: '회피 시 그림자가 남아 적을 공격합니다',
        rarity: 'rare',
        requiredJob: null,
        icon: '👤',
        effectHandler: (scene, player, handler) => {
            const originalDash = player.dash.bind(player);
            player.dash = (direction) => {
                originalDash(direction);

                // 그림자 생성
                const shadow = scene.add.sprite(player.sprite.x, player.sprite.y, 'player_idle');
                shadow.setAlpha(0.3);
                shadow.setTint(0x000000);

                // 그림자가 적 공격
                if (scene.boss && scene.boss.isAlive) {
                    const distance = Phaser.Math.Distance.Between(
                        shadow.x, shadow.y,
                        scene.boss.sprite.x, scene.boss.sprite.y
                    );

                    if (distance < 200) {
                        scene.time.delayedCall(300, () => {
                            if (scene.boss && scene.boss.isAlive) {
                                scene.boss.takeDamage(15);
                            }
                        });
                    }
                }

                scene.tweens.add({
                    targets: shadow,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => shadow.destroy()
                });
            };

            return { update: () => {} };
        }
    },
    {
        id: 'overdrive',
        name: '오버드라이브',
        description: 'V키로 HP를 소모하여 5초간 모든 능력 2배 (HP 30 소모)',
        rarity: 'legendary',
        requiredJob: null,
        icon: '⚡',
        effectHandler: (scene, player, handler) => {
            let lastOverdriveTime = 0;
            const overdriveCooldown = 15000;
            const overdriveKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);

            return {
                update: () => {
                    const now = Date.now();
                    if (Phaser.Input.Keyboard.JustDown(overdriveKey) &&
                        now - lastOverdriveTime > overdriveCooldown &&
                        player.hp > 30) {

                        lastOverdriveTime = now;
                        player.hp -= 30;

                        // 오버드라이브 버프
                        player.overdriveActive = true;
                        player.sprite.setTint(0xFF0000);

                        const originalSpeedBonus = player.speedBonus;
                        player.speedBonus = (player.speedBonus || 0) + CONSTANTS.PLAYER.SPEED; // 2배 효과
                        player.attackMultiplier = (player.attackMultiplier || 1) * 2;

                        scene.time.delayedCall(5000, () => {
                            player.overdriveActive = false;
                            player.sprite.clearTint();
                            player.speedBonus = originalSpeedBonus;
                            player.attackMultiplier /= 2;
                        });
                    }
                }
            };
        }
    },
    {
        id: 'death_dance',
        name: '죽음의 춤',
        description: '적 처치 시 3초간 공격속도/이동속도 +20% (최대 5스택)',
        rarity: 'epic',
        requiredJob: null,
        icon: '💀',
        effectHandler: (scene, player, handler) => {
            player.deathDanceStacks = 0;
            player.deathDanceMaxStacks = 5;

            // 보스 처치 시
            scene.events.on('bossDefeated', () => {
                player.deathDanceStacks = Math.min(
                    player.deathDanceStacks + 1,
                    player.deathDanceMaxStacks
                );

                // 버프 적용
                const bonus = player.deathDanceStacks * 0.2;
                player.deathDanceBonus = bonus;

                // 3초 후 스택 감소
                scene.time.delayedCall(3000, () => {
                    if (player.deathDanceStacks > 0) {
                        player.deathDanceStacks--;
                        player.deathDanceBonus = player.deathDanceStacks * 0.2;
                    }
                });
            });

            return { update: () => {} };
        }
    },
    {
        id: 'dangerous_deal',
        name: '위험한 거래',
        description: '공격력 +150%, 받는 피해 +50%',
        rarity: 'legendary',
        requiredJob: null,
        icon: '😈',
        effectHandler: (scene, player, handler) => {
            player.attackMultiplier *= 2.5;
            player.damageTakenMultiplier = (player.damageTakenMultiplier || 1) * 1.5;

            const originalTakeDamage = player.takeDamage.bind(player);
            player.takeDamage = (damage, attacker) => {
                const increasedDamage = Math.floor(damage * 1.5);
                originalTakeDamage(increasedDamage, attacker);
            };

            return { update: () => {} };
        }
    },
    {
        id: 'phoenix',
        name: '불사조',
        description: '사망 시 폭발하며 HP 50%로 부활 (1회)',
        rarity: 'legendary',
        requiredJob: null,
        icon: '🔥🐦',
        effectHandler: (scene, player, handler) => {
            player.hasPhoenix = true;
            player.phoenixUsed = false;

            const originalDie = player.die.bind(player);
            player.die = () => {
                if (!player.phoenixUsed && player.hasPhoenix) {
                    player.phoenixUsed = true;

                    // 폭발 이펙트
                    handler.createExplosion(player.sprite.x, player.sprite.y, 150, 50);

                    // 부활
                    player.hp = Math.floor(player.maxHp * 0.5);
                    player.isAlive = true;
                    player.startInvincibility();

                    const text = scene.add.text(
                        player.sprite.x, player.sprite.y - 50,
                        'PHOENIX REBIRTH!',
                        {
                            fontSize: '32px',
                            fill: '#FF4500',
                            fontStyle: 'bold',
                            stroke: '#000',
                            strokeThickness: 4
                        }
                    );
                    text.setOrigin(0.5);
                    scene.tweens.add({
                        targets: text,
                        y: text.y - 50,
                        alpha: 0,
                        duration: 2000,
                        onComplete: () => text.destroy()
                    });

                    return;
                }

                originalDie();
            };

            return { update: () => {} };
        }
    }
];

// 전역 접근
if (typeof window !== 'undefined') {
    window.UNIVERSAL_AUGMENTS = UNIVERSAL_AUGMENTS;
}
