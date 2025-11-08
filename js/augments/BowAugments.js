// 활 전용 증강
const BOW_AUGMENTS = [
    {
        id: 'piercing_arrow',
        name: '관통 화살',
        description: '화살이 적을 관통합니다',
        rarity: 'rare',
        requiredJob: '활',
        icon: '🎯',
        effectHandler: (scene, player, handler) => {
            const ability = player.getCurrentAbility();
            if (ability && ability.name === '활') {
                ability.piercingArrows = true;
            }
            return { update: () => {} };
        }
    },
    {
        id: 'explosive_arrow',
        name: '폭발 화살',
        description: '화살 착탄 시 범위 폭발 발생',
        rarity: 'epic',
        requiredJob: '활',
        icon: '💣',
        effectHandler: (scene, player, handler) => {
            return handler.explosiveArrow();
        }
    },
    {
        id: 'multi_shot',
        name: '다중 발사',
        description: '화살을 3발 동시에 발사합니다',
        rarity: 'epic',
        requiredJob: '활',
        icon: '🎯🎯🎯',
        effectHandler: (scene, player, handler) => {
            return handler.multiShot();
        }
    },
    {
        id: 'poison_arrow',
        name: '독 화살',
        description: '화살이 5초간 지속 독 피해를 입힙니다',
        rarity: 'rare',
        requiredJob: '활',
        icon: '☠️',
        effectHandler: (scene, player, handler) => {
            const ability = player.getCurrentAbility();
            if (ability && ability.name === '활') {
                ability.poisonArrows = true;
                ability.poisonDamage = 2;
                ability.poisonDuration = 5000;
            }
            return { update: () => {} };
        }
    },
    {
        id: 'sniper_mode',
        name: '저격 모드',
        description: '정지 상태 1초 이상 시 다음 공격 크리티컬 (3배)',
        rarity: 'epic',
        requiredJob: '활',
        icon: '🎯',
        effectHandler: (scene, player, handler) => {
            player.sniperMode = true;
            player.sniperStandingTime = 0;
            player.sniperReady = false;

            return {
                update: () => {
                    const velocity = player.sprite.body.velocity;
                    const isStanding = Math.abs(velocity.x) < 10 && Math.abs(velocity.y) < 10;

                    if (isStanding) {
                        player.sniperStandingTime += 16; // ~1 frame at 60fps
                        if (player.sniperStandingTime >= 1000 && !player.sniperReady) {
                            player.sniperReady = true;

                            // 저격 준비 표시
                            if (!player.sniperIndicator) {
                                player.sniperIndicator = scene.add.text(
                                    player.sprite.x,
                                    player.sprite.y - 60,
                                    '🎯 READY',
                                    {
                                        fontSize: '20px',
                                        fill: '#FF0000',
                                        fontStyle: 'bold'
                                    }
                                );
                                player.sniperIndicator.setOrigin(0.5);
                            }
                        }
                    } else {
                        player.sniperStandingTime = 0;
                        player.sniperReady = false;
                        if (player.sniperIndicator) {
                            player.sniperIndicator.destroy();
                            player.sniperIndicator = null;
                        }
                    }

                    // 인디케이터 위치 업데이트
                    if (player.sniperIndicator) {
                        player.sniperIndicator.x = player.sprite.x;
                        player.sniperIndicator.y = player.sprite.y - 60;
                    }
                }
            };
        }
    },
    {
        id: 'homing_missile',
        name: '유도 미사일',
        description: '화살이 가장 가까운 적을 추적합니다',
        rarity: 'legendary',
        requiredJob: '활',
        icon: '🚀',
        effectHandler: (scene, player, handler) => {
            const ability = player.getCurrentAbility();
            if (ability && ability.name === '활') {
                ability.homingArrows = true;
            }
            return { update: () => {} };
        }
    },
    {
        id: 'frost_arrow',
        name: '빙결 화살',
        description: '화살이 적을 2초간 동결시킵니다',
        rarity: 'epic',
        requiredJob: '활',
        icon: '❄️',
        effectHandler: (scene, player, handler) => {
            const ability = player.getCurrentAbility();
            if (ability && ability.name === '활') {
                ability.frostArrows = true;
                ability.freezeDuration = 2000;
            }
            return { update: () => {} };
        }
    }
];

// 전역 접근
if (typeof window !== 'undefined') {
    window.BOW_AUGMENTS = BOW_AUGMENTS;
}
