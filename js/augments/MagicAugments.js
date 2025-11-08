// 마법 전용 증강
const MAGIC_AUGMENTS = [
    {
        id: 'chain_lightning',
        name: '연쇄 번개',
        description: '번개 마법이 최대 3명의 적에게 연쇄됩니다',
        rarity: 'epic',
        requiredJob: '마법',
        icon: '⚡',
        effectHandler: (scene, player, handler) => {
            player.hasChainLightning = true;
            player.chainCount = 3;
            return handler.chainLightning();
        }
    },
    {
        id: 'meteor_strike',
        name: '메테오',
        description: 'C키 길게 누르면 거대 운석 소환 (쿨다운 10초)',
        rarity: 'legendary',
        requiredJob: '마법',
        icon: '☄️',
        effectHandler: (scene, player, handler) => {
            return handler.meteor();
        }
    },
    {
        id: 'mana_shield',
        name: '마나 실드',
        description: '받는 피해의 50%를 HP 대신 마나로 차감',
        rarity: 'epic',
        requiredJob: '마법',
        icon: '🛡️',
        effectHandler: (scene, player, handler) => {
            player.hasManaShield = true;
            player.manaShieldRatio = 0.5;
            player.currentMana = 100;
            player.maxMana = 100;

            const originalTakeDamage = player.takeDamage.bind(player);
            player.takeDamage = (damage, attacker) => {
                if (player.currentMana > 0) {
                    const manaAbsorb = Math.floor(damage * player.manaShieldRatio);
                    const hpDamage = damage - manaAbsorb;

                    player.currentMana = Math.max(0, player.currentMana - manaAbsorb);
                    originalTakeDamage(hpDamage, attacker);
                } else {
                    originalTakeDamage(damage, attacker);
                }
            };

            return {
                update: () => {
                    // 마나 자동 회복 (초당 5)
                    if (!player.lastManaRegenTime) player.lastManaRegenTime = 0;
                    const now = Date.now();
                    if (now - player.lastManaRegenTime >= 1000) {
                        player.currentMana = Math.min(player.maxMana, player.currentMana + 5);
                        player.lastManaRegenTime = now;
                    }
                }
            };
        }
    },
    {
        id: 'teleport',
        name: '순간이동',
        description: 'Shift + 방향키로 해당 방향으로 순간이동 (쿨다운 3초)',
        rarity: 'epic',
        requiredJob: '마법',
        icon: '🌀',
        effectHandler: (scene, player, handler) => {
            return handler.teleport();
        }
    },
    {
        id: 'elemental_fusion',
        name: '원소 융합',
        description: '마법 공격 시 화염+얼음 동시 적용',
        rarity: 'legendary',
        requiredJob: '마법',
        icon: '🔥❄️',
        effectHandler: (scene, player, handler) => {
            player.hasElementalFusion = true;
            player.fireMultiplier = 1.5;
            player.iceSlowDuration = 2000;
            return { update: () => {} };
        }
    },
    {
        id: 'spell_amplify',
        name: '마법 증폭',
        description: '모든 마법의 크기와 범위가 2배가 됩니다',
        rarity: 'rare',
        requiredJob: '마법',
        icon: '🔮',
        effectHandler: (scene, player, handler) => {
            player.spellSizeMultiplier = 2.0;
            player.spellRangeMultiplier = 2.0;
            return { update: () => {} };
        }
    },
    {
        id: 'time_stop',
        name: '시간 정지',
        description: '특수 스킬 시 3초간 주변 적 시간 정지',
        rarity: 'legendary',
        requiredJob: '마법',
        icon: '⏸️',
        effectHandler: (scene, player, handler) => {
            const ability = player.getCurrentAbility();
            if (ability && ability.name === '마법') {
                const originalSpecialSkill = ability.specialSkill.bind(ability);

                ability.specialSkill = () => {
                    originalSpecialSkill();

                    // 시간 정지 효과
                    if (scene.boss && scene.boss.isAlive) {
                        scene.boss.isFrozen = true;
                        const originalVelocityX = scene.boss.sprite.body.velocity.x;
                        const originalVelocityY = scene.boss.sprite.body.velocity.y;

                        scene.boss.sprite.body.setVelocity(0, 0);
                        scene.boss.sprite.setTint(0x8888FF);

                        scene.time.delayedCall(3000, () => {
                            if (scene.boss && scene.boss.isAlive) {
                                scene.boss.isFrozen = false;
                                scene.boss.sprite.clearTint();
                                scene.boss.sprite.body.setVelocity(originalVelocityX, originalVelocityY);
                            }
                        });
                    }
                };
            }

            return { update: () => {} };
        }
    }
];

// 전역 접근
if (typeof window !== 'undefined') {
    window.MAGIC_AUGMENTS = MAGIC_AUGMENTS;
}
