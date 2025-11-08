// TFT-스타일 증강 시스템 (Boss Rush용)
class AugmentSystem {
    constructor(scene) {
        this.scene = scene;
        this.selectedAugments = [];  // 플레이어가 선택한 증강 목록
        this.augmentPool = this.createAugmentPool();
    }

    // 증강 풀 생성 (20+ 다양한 증강)
    createAugmentPool() {
        return [
            // ===== 공격력 증강 =====
            {
                id: 'power_surge',
                name: '파워 서지',
                description: '공격력 +50%',
                rarity: 'common',
                effect: (player) => {
                    player.attackMultiplier *= 1.5;
                }
            },
            {
                id: 'berserker',
                name: '광전사',
                description: '공격력 +100%, 최대 HP -30%',
                rarity: 'epic',
                effect: (player) => {
                    player.attackMultiplier *= 2.0;
                    const hpRatio = player.health / player.maxHealth;
                    player.maxHealth = Math.floor(player.maxHealth * 0.7);
                    player.health = Math.min(player.health, player.maxHealth);
                }
            },
            {
                id: 'critical_strike',
                name: '치명타',
                description: '30% 확률로 2배 데미지',
                rarity: 'rare',
                effect: (player) => {
                    player.criticalChance = (player.criticalChance || 0) + 0.3;
                    player.criticalMultiplier = 2.0;
                }
            },

            // ===== 공격 속도 증강 =====
            {
                id: 'swift_striker',
                name: '신속한 타격',
                description: '공격 속도 +50%',
                rarity: 'common',
                effect: (player) => {
                    player.attackCooldown = Math.floor(player.attackCooldown * 0.5);
                }
            },
            {
                id: 'rapid_fire',
                name: '연발 사격',
                description: '공격 속도 +100%',
                rarity: 'rare',
                effect: (player) => {
                    player.attackCooldown = Math.floor(player.attackCooldown * 0.33);
                }
            },

            // ===== 체력 증강 =====
            {
                id: 'vitality',
                name: '생명력',
                description: '최대 HP +50, HP 즉시 회복',
                rarity: 'common',
                effect: (player) => {
                    player.maxHealth += 50;
                    player.health = player.maxHealth;
                }
            },
            {
                id: 'tank',
                name: '탱커',
                description: '최대 HP +100, 이동 속도 -20%',
                rarity: 'rare',
                effect: (player) => {
                    player.maxHealth += 100;
                    player.health = player.maxHealth;
                    player.moveSpeed *= 0.8;
                }
            },
            {
                id: 'last_stand',
                name: '최후의 저항',
                description: '체력 30% 이하일 때 공격력 +100%',
                rarity: 'epic',
                effect: (player) => {
                    player.hasLastStand = true;
                }
            },

            // ===== 이동 증강 =====
            {
                id: 'speed_boost',
                name: '질주',
                description: '이동 속도 +40%',
                rarity: 'common',
                effect: (player) => {
                    player.moveSpeed *= 1.4;
                }
            },
            {
                id: 'double_jump',
                name: '2단 점프',
                description: '공중에서 한 번 더 점프 가능',
                rarity: 'rare',
                effect: (player) => {
                    player.maxJumps = 2;
                    player.currentJumps = 2;
                }
            },
            {
                id: 'air_dash',
                name: '공중 대쉬',
                description: '공중에서 빠르게 이동 가능 (X키)',
                rarity: 'epic',
                effect: (player) => {
                    player.hasAirDash = true;
                    player.airDashCooldown = 2000;
                    player.lastAirDashTime = 0;
                }
            },

            // ===== 회복 증강 =====
            {
                id: 'regeneration',
                name: '재생',
                description: '매 초 HP 2 회복',
                rarity: 'rare',
                effect: (player) => {
                    player.healthRegen = (player.healthRegen || 0) + 2;
                }
            },
            {
                id: 'vampirism',
                name: '흡혈',
                description: '피해량의 20%만큼 HP 회복',
                rarity: 'epic',
                effect: (player) => {
                    player.lifesteal = (player.lifesteal || 0) + 0.2;
                }
            },
            {
                id: 'second_wind',
                name: '재기',
                description: '보스 처치 시 HP 50% 회복',
                rarity: 'rare',
                effect: (player) => {
                    player.healOnBossKill = (player.healOnBossKill || 0) + 0.5;
                }
            },

            // ===== 공격 범위 증강 =====
            {
                id: 'extended_reach',
                name: '사거리 연장',
                description: '공격 범위 +50%',
                rarity: 'common',
                effect: (player) => {
                    player.attackRange *= 1.5;
                }
            },
            {
                id: 'aoe_blast',
                name: '광역 폭발',
                description: '공격 시 주변 적도 피해',
                rarity: 'epic',
                effect: (player) => {
                    player.hasAOEAttack = true;
                    player.aoeRadius = 100;
                }
            },

            // ===== 방어 증강 =====
            {
                id: 'armor',
                name: '갑옷',
                description: '받는 피해 -20%',
                rarity: 'rare',
                effect: (player) => {
                    player.damageReduction = (player.damageReduction || 0) + 0.2;
                }
            },
            {
                id: 'shield',
                name: '보호막',
                description: '피해 받을 시 30% 확률로 무효화',
                rarity: 'epic',
                effect: (player) => {
                    player.dodgeChance = (player.dodgeChance || 0) + 0.3;
                }
            },
            {
                id: 'thorns',
                name: '가시',
                description: '피해 받을 시 공격자도 피해',
                rarity: 'rare',
                effect: (player) => {
                    player.thornsDamage = (player.thornsDamage || 0) + 10;
                }
            },

            // ===== 특수 효과 증강 =====
            {
                id: 'poison',
                name: '맹독',
                description: '공격 시 적에게 독 효과 (5초간 지속 피해)',
                rarity: 'epic',
                effect: (player) => {
                    player.hasPoisonAttack = true;
                    player.poisonDamage = 2;
                    player.poisonDuration = 5000;
                }
            },
            {
                id: 'freeze',
                name: '빙결',
                description: '공격 시 10% 확률로 적 동결',
                rarity: 'epic',
                effect: (player) => {
                    player.freezeChance = (player.freezeChance || 0) + 0.1;
                    player.freezeDuration = 2000;
                }
            },
            {
                id: 'knockback_master',
                name: '밀쳐내기 달인',
                description: '공격 시 넉백 거리 +100%',
                rarity: 'rare',
                effect: (player) => {
                    player.knockbackMultiplier = (player.knockbackMultiplier || 1) * 2;
                }
            },

            // ===== 유틸리티 증강 =====
            {
                id: 'lucky',
                name: '행운',
                description: '모든 보상 효과 +50%',
                rarity: 'rare',
                effect: (player) => {
                    player.luckMultiplier = (player.luckMultiplier || 1) * 1.5;
                }
            },
            {
                id: 'time_warp',
                name: '시간 왜곡',
                description: '모든 쿨다운 -30%',
                rarity: 'epic',
                effect: (player) => {
                    player.cooldownReduction = (player.cooldownReduction || 0) + 0.3;
                    // 현재 쿨다운에도 적용
                    player.attackCooldown = Math.floor(player.attackCooldown * 0.7);
                }
            },

            // ===== 극한 증강 =====
            {
                id: 'glass_cannon',
                name: '유리대포',
                description: '공격력 +200%, 최대 HP 1',
                rarity: 'legendary',
                effect: (player) => {
                    player.attackMultiplier *= 3.0;
                    player.maxHealth = 1;
                    player.health = 1;
                }
            },
            {
                id: 'immortal',
                name: '불사신',
                description: '죽음을 1회 회피 (부활)',
                rarity: 'legendary',
                effect: (player) => {
                    player.hasRevive = true;
                    player.reviveCount = (player.reviveCount || 0) + 1;
                }
            },
            {
                id: 'chaos',
                name: '혼돈',
                description: '모든 스탯이 매 초 랜덤하게 변화',
                rarity: 'legendary',
                effect: (player) => {
                    player.hasChaos = true;
                }
            }
        ];
    }

    // 랜덤 증강 3개 선택 (희귀도 가중치 적용)
    getRandomAugments(count = 3) {
        // 이미 선택한 증강 제외
        const availableAugments = this.augmentPool.filter(aug =>
            !this.selectedAugments.some(selected => selected.id === aug.id)
        );

        if (availableAugments.length === 0) {
            console.warn('No more augments available!');
            return [];
        }

        // 희귀도별 가중치
        const rarityWeights = {
            common: 60,
            rare: 25,
            epic: 10,
            legendary: 5
        };

        // 가중치 기반 랜덤 선택
        const selected = [];
        const tempPool = [...availableAugments];

        for (let i = 0; i < Math.min(count, tempPool.length); i++) {
            // 가중치 합계
            const totalWeight = tempPool.reduce((sum, aug) =>
                sum + (rarityWeights[aug.rarity] || 1), 0
            );

            // 랜덤 값으로 증강 선택
            let random = Math.random() * totalWeight;
            let selectedAugment = null;

            for (const aug of tempPool) {
                random -= (rarityWeights[aug.rarity] || 1);
                if (random <= 0) {
                    selectedAugment = aug;
                    break;
                }
            }

            if (selectedAugment) {
                selected.push(selectedAugment);
                // 선택된 증강은 풀에서 제거
                tempPool.splice(tempPool.indexOf(selectedAugment), 1);
            }
        }

        return selected;
    }

    // 증강 적용
    applyAugment(augment, player) {
        if (!augment || !player) return false;

        // 증강 효과 실행
        try {
            augment.effect(player);
            this.selectedAugments.push(augment);

            if (CONSTANTS.GAME.DEBUG) {
                console.log(`Augment applied: ${augment.name}`);
            }

            return true;
        } catch (error) {
            console.error('Failed to apply augment:', error);
            return false;
        }
    }

    // 증강 선택 UI 생성
    showAugmentSelection(player, callback) {
        const augments = this.getRandomAugments(3);

        if (augments.length === 0) {
            // 더 이상 증강이 없으면 바로 콜백 실행
            if (callback) callback();
            return;
        }

        // 화면 오버레이
        const overlay = this.scene.add.rectangle(
            this.scene.cameras.main.scrollX + 400,
            this.scene.cameras.main.scrollY + 300,
            800, 600,
            0x000000, 0.85
        );
        overlay.setDepth(900);
        overlay.setScrollFactor(0);

        // 제목
        const titleText = this.scene.add.text(
            400, 80,
            '증강 선택',
            {
                fontFamily: 'Orbitron',
                fontSize: '48px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        titleText.setOrigin(0.5);
        titleText.setDepth(901);
        titleText.setScrollFactor(0);

        // 희귀도 색상
        const rarityColors = {
            common: '#AAAAAA',
            rare: '#4488FF',
            epic: '#AA00FF',
            legendary: '#FF8800'
        };

        // 증강 카드 생성
        const cardWidth = 220;
        const cardHeight = 280;
        const startX = 400 - (cardWidth * 1.5 + 20);
        const cardY = 280;
        const cards = [];

        augments.forEach((augment, index) => {
            const cardX = startX + (cardWidth + 20) * index;

            // 카드 배경
            const cardBg = this.scene.add.rectangle(
                cardX, cardY,
                cardWidth, cardHeight,
                0x222222
            );
            cardBg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(rarityColors[augment.rarity]).color);
            cardBg.setDepth(901);
            cardBg.setScrollFactor(0);
            cardBg.setInteractive();

            // 희귀도 표시
            const rarityText = this.scene.add.text(
                cardX, cardY - cardHeight / 2 + 25,
                augment.rarity.toUpperCase(),
                {
                    fontFamily: 'Jua',
                    fontSize: '16px',
                    fill: rarityColors[augment.rarity],
                    fontStyle: 'bold'
                }
            );
            rarityText.setOrigin(0.5);
            rarityText.setDepth(902);
            rarityText.setScrollFactor(0);

            // 증강 이름
            const nameText = this.scene.add.text(
                cardX, cardY - 50,
                augment.name,
                {
                    fontFamily: 'Jua',
                    fontSize: '24px',
                    fill: '#FFFFFF',
                    fontStyle: 'bold',
                    wordWrap: { width: cardWidth - 20 }
                }
            );
            nameText.setOrigin(0.5);
            nameText.setDepth(902);
            nameText.setScrollFactor(0);

            // 증강 설명
            const descText = this.scene.add.text(
                cardX, cardY + 30,
                augment.description,
                {
                    fontFamily: 'Jua',
                    fontSize: '16px',
                    fill: '#CCCCCC',
                    align: 'center',
                    wordWrap: { width: cardWidth - 30 }
                }
            );
            descText.setOrigin(0.5);
            descText.setDepth(902);
            descText.setScrollFactor(0);

            // 호버 효과
            cardBg.on('pointerover', () => {
                cardBg.setFillStyle(0x333333);
                this.scene.tweens.add({
                    targets: [cardBg, nameText, descText, rarityText],
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            cardBg.on('pointerout', () => {
                cardBg.setFillStyle(0x222222);
                this.scene.tweens.add({
                    targets: [cardBg, nameText, descText, rarityText],
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            // 클릭 이벤트
            cardBg.on('pointerdown', () => {
                // 증강 적용
                this.applyAugment(augment, player);

                // UI 제거
                cards.forEach(card => {
                    card.elements.forEach(el => el.destroy());
                });
                overlay.destroy();
                titleText.destroy();

                // 콜백 실행
                if (callback) {
                    callback(augment);
                }
            });

            cards.push({
                augment,
                elements: [cardBg, nameText, descText, rarityText]
            });
        });
    }

    // 정리
    destroy() {
        this.selectedAugments = [];
        this.scene = null;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.AugmentSystem = AugmentSystem;
}
