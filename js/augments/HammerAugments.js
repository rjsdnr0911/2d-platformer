// 해머 전용 증강
const HAMMER_AUGMENTS = [
    {
        id: 'earthquake_fissure',
        name: '대지 균열',
        description: '강공격 시 전방에 균열 생성 (쿨다운 8초)',
        rarity: 'epic',
        requiredJob: '해머',
        icon: '🌋',
        effectHandler: (scene, player, handler) => {
            return handler.earthquakeFissure();
        }
    },
    {
        id: 'impact_shockwave',
        name: '충격파',
        description: '착지 시 주변에 충격파 발생 (범위 120)',
        rarity: 'rare',
        requiredJob: '해머',
        icon: '💥',
        effectHandler: (scene, player, handler) => {
            return handler.shockwave();
        }
    },
    {
        id: 'iron_will',
        name: '불굴의 의지',
        description: '치명적인 피해를 받으면 HP 1로 버팁니다 (1회)',
        rarity: 'legendary',
        requiredJob: '해머',
        icon: '🛡️',
        effectHandler: (scene, player, handler) => {
            player.hasIronWill = true;
            player.ironWillUsed = false;

            const originalTakeDamage = player.takeDamage.bind(player);
            player.takeDamage = (damage, attacker) => {
                if (player.hp - damage <= 0 && !player.ironWillUsed && player.hasIronWill) {
                    player.ironWillUsed = true;
                    player.hp = 1;
                    player.startInvincibility();

                    // 불굴 텍스트
                    const text = scene.add.text(
                        player.sprite.x,
                        player.sprite.y - 50,
                        'IRON WILL!',
                        {
                            fontSize: '32px',
                            fill: '#FFD700',
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

                originalTakeDamage(damage, attacker);
            };

            return { update: () => {} };
        }
    },
    {
        id: 'gravity_hammer',
        name: '중력 해머',
        description: '강공격이 적을 끌어당깁니다',
        rarity: 'rare',
        requiredJob: '해머',
        icon: '🌍',
        effectHandler: (scene, player, handler) => {
            const ability = player.getCurrentAbility();
            if (ability && ability.name === '해머') {
                const originalStrongAttack = ability.strongAttack.bind(ability);

                ability.strongAttack = () => {
                    originalStrongAttack();

                    // 적 끌어당기기
                    if (scene.boss && scene.boss.isAlive) {
                        const dx = player.sprite.x - scene.boss.sprite.x;
                        const dy = player.sprite.y - scene.boss.sprite.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < 300) {
                            const pullStrength = 500;
                            scene.boss.sprite.body.setVelocity(
                                (dx / distance) * pullStrength,
                                (dy / distance) * pullStrength
                            );
                        }
                    }
                };
            }

            return { update: () => {} };
        }
    },
    {
        id: 'berserker_mode',
        name: '버서커 모드',
        description: 'HP가 낮을수록 공격력 증가 (최대 +200%)',
        rarity: 'epic',
        requiredJob: '해머',
        icon: '😡',
        effectHandler: (scene, player, handler) => {
            player.hasBerserkerMode = true;

            return {
                update: () => {
                    const hpRatio = player.hp / player.maxHp;
                    // HP 10% 이하면 +200%, HP 50% 이하면 +100%
                    if (hpRatio <= 0.1) {
                        player.berserkerBonus = 2.0;
                    } else if (hpRatio <= 0.5) {
                        player.berserkerBonus = (1 - hpRatio) * 2;
                    } else {
                        player.berserkerBonus = 0;
                    }
                }
            };
        }
    },
    {
        id: 'defensive_stance',
        name: '방어 태세',
        description: '공격 중 받는 피해 -50%',
        rarity: 'rare',
        requiredJob: '해머',
        icon: '🛡️',
        effectHandler: (scene, player, handler) => {
            player.defensiveStance = true;
            player.defensiveReduction = 0.5;

            const originalTakeDamage = player.takeDamage.bind(player);
            player.takeDamage = (damage, attacker) => {
                let finalDamage = damage;

                // 공격 중이면 피해 감소
                if (player.isAttacking) {
                    finalDamage = Math.floor(damage * (1 - player.defensiveReduction));
                }

                originalTakeDamage(finalDamage, attacker);
            };

            return { update: () => {} };
        }
    },
    {
        id: 'rebound_strike',
        name: '반동 타격',
        description: '강공격 시 3초간 공격속도 +50%',
        rarity: 'rare',
        requiredJob: '해머',
        icon: '⚡',
        effectHandler: (scene, player, handler) => {
            const ability = player.getCurrentAbility();
            if (ability && ability.name === '해머') {
                const originalStrongAttack = ability.strongAttack.bind(ability);

                ability.strongAttack = () => {
                    originalStrongAttack();

                    // 공격속도 버프
                    const originalCooldown = ability.cooldown;
                    ability.cooldown = Math.floor(ability.cooldown * 0.5);

                    scene.time.delayedCall(3000, () => {
                        ability.cooldown = originalCooldown;
                    });
                };
            }

            return { update: () => {} };
        }
    }
];

// 전역 접근
if (typeof window !== 'undefined') {
    window.HAMMER_AUGMENTS = HAMMER_AUGMENTS;
}
