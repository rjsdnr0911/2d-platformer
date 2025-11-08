// 검술 전용 증강
const SWORD_AUGMENTS = [
    {
        id: 'sword_beam',
        name: '검기 발사',
        description: '기본 공격 시 원거리 검기를 발사합니다',
        rarity: 'rare',
        requiredJob: '검술',
        icon: '⚔️',
        effectHandler: (scene, player, handler) => {
            return handler.swordBeam();
        }
    },
    {
        id: 'whirlwind_slash',
        name: '회오리 베기',
        description: 'Z+X 동시 입력 시 주변 360도 회전 공격 (쿨다운 5초)',
        rarity: 'epic',
        requiredJob: '검술',
        icon: '🌪️',
        effectHandler: (scene, player, handler) => {
            return handler.whirlwindSlash();
        }
    },
    {
        id: 'vampiric_blade',
        name: '흡혈 칼날',
        description: '모든 공격으로 피해량의 30% 체력 회복',
        rarity: 'rare',
        requiredJob: '검술',
        icon: '🩸',
        effectHandler: (scene, player, handler) => {
            // 기존 흡혈에 30% 추가
            player.lifesteal = (player.lifesteal || 0) + 0.3;
            return { update: () => {} };
        }
    },
    {
        id: 'executioner',
        name: '처형자',
        description: 'HP 30% 이하 적 공격 시 20% 확률로 즉사',
        rarity: 'epic',
        requiredJob: '검술',
        icon: '💀',
        effectHandler: (scene, player, handler) => {
            player.hasExecutioner = true;
            player.executeChance = 0.2;
            player.executeThreshold = 0.3;
            return { update: () => {} };
        }
    },
    {
        id: 'counter_stance',
        name: '반격 자세',
        description: '피격 시 30% 확률로 피해 무효화 + 2배 반격',
        rarity: 'epic',
        requiredJob: '검술',
        icon: '🛡️',
        effectHandler: (scene, player, handler) => {
            return handler.counterStance();
        }
    },
    {
        id: 'blade_dance',
        name: '검의 춤',
        description: '연속 공격 시마다 공격속도 +10% (최대 50%)',
        rarity: 'rare',
        requiredJob: '검술',
        icon: '💃',
        effectHandler: (scene, player, handler) => {
            player.bladeDanceStacks = 0;
            player.bladeDanceMaxStacks = 5;
            let lastAttackTime = 0;

            // 기존 공격 함수 래핑
            const ability = player.getCurrentAbility();
            if (ability && ability.name === '검술') {
                const originalBasicAttack = ability.basicAttack.bind(ability);

                ability.basicAttack = () => {
                    originalBasicAttack();

                    const now = Date.now();
                    // 1초 이내 연속 공격 시 스택 증가
                    if (now - lastAttackTime < 1000) {
                        player.bladeDanceStacks = Math.min(
                            player.bladeDanceStacks + 1,
                            player.bladeDanceMaxStacks
                        );
                    } else {
                        player.bladeDanceStacks = 0;
                    }
                    lastAttackTime = now;

                    // 공격속도 버프 적용
                    const speedBonus = player.bladeDanceStacks * 0.1;
                    player.attackSpeedBonus = speedBonus;
                };
            }

            return {
                update: () => {
                    // 3초간 공격 없으면 스택 초기화
                    if (Date.now() - lastAttackTime > 3000) {
                        player.bladeDanceStacks = 0;
                        player.attackSpeedBonus = 0;
                    }
                }
            };
        }
    },
    {
        id: 'double_slash',
        name: '이중 베기',
        description: '모든 검 공격이 2회 적용됩니다',
        rarity: 'legendary',
        requiredJob: '검술',
        icon: '⚔️⚔️',
        effectHandler: (scene, player, handler) => {
            const ability = player.getCurrentAbility();
            if (ability && ability.name === '검술') {
                const originalBasicAttack = ability.basicAttack.bind(ability);
                const originalStrongAttack = ability.strongAttack.bind(ability);

                ability.basicAttack = () => {
                    originalBasicAttack();
                    scene.time.delayedCall(100, () => originalBasicAttack());
                };

                ability.strongAttack = () => {
                    originalStrongAttack();
                    scene.time.delayedCall(150, () => originalStrongAttack());
                };
            }

            return { update: () => {} };
        }
    }
];

// 전역 접근
if (typeof window !== 'undefined') {
    window.SWORD_AUGMENTS = SWORD_AUGMENTS;
}
