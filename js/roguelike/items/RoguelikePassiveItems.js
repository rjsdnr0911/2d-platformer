// 로그라이크 모드 패시브 아이템 정의
class RoguelikePassiveItems {
    constructor() {
        this.items = this.defineAllItems();
    }

    defineAllItems() {
        return {
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 🔥 화염 컨셉 (5개)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            fireRing: {
                id: 'fireRing',
                name: '화염의 반지',
                rarity: 'rare',
                icon: '🔥',
                description: '공격 시 10% 확률로 화상 부여\n화상: 초당 5 피해 (3초)',
                effectType: 'onAttack',
                effect: (player, target) => {
                    if (Math.random() < 0.1 && target && target.applyBurn) {
                        target.applyBurn(5, 3000);
                    }
                }
            },

            burningArmor: {
                id: 'burningArmor',
                name: '불타는 갑옷',
                rarity: 'rare',
                icon: '🛡️',
                description: '피격 시 주변에 화염 폭발',
                effectType: 'onHit',
                effect: (player, attacker) => {
                    if (!player.scene) return;

                    // 폭발 이펙트
                    const explosion = player.scene.add.circle(
                        player.x, player.y,
                        30, 0xFF4400, 0.7
                    );

                    player.scene.tweens.add({
                        targets: explosion,
                        radius: 70,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => explosion.destroy()
                    });

                    // 주변 적에게 피해
                    if (player.scene.enemyList) {
                        player.scene.enemyList.forEach(enemy => {
                            if (enemy.active) {
                                const distance = Phaser.Math.Distance.Between(
                                    player.x, player.y,
                                    enemy.sprite.x, enemy.sprite.y
                                );

                                if (distance < 70) {
                                    enemy.takeDamage(10);
                                    if (enemy.applyBurn) {
                                        enemy.applyBurn(3, 2000);
                                    }
                                }
                            }
                        });
                    }
                }
            },

            dragonHeart: {
                id: 'dragonHeart',
                name: '용의 심장',
                rarity: 'legendary',
                icon: '❤️‍🔥',
                description: '화염 피해 +30%',
                effectType: 'stat',
                effect: {
                    fireDamageBonus: 0.3
                }
            },

            flameBoots: {
                id: 'flameBoots',
                name: '불꽃 부츠',
                rarity: 'common',
                icon: '👢',
                description: '대시 시 화염 자국 생성',
                effectType: 'onDash',
                effect: (player) => {
                    if (!player.scene) return;

                    // 화염 자국 생성
                    const trail = player.scene.add.circle(
                        player.x, player.y,
                        15, 0xFF4400, 0.6
                    );

                    player.scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0.5,
                        duration: 1000,
                        onComplete: () => trail.destroy()
                    });

                    // 주변 적에게 약한 피해
                    if (player.scene.enemyList) {
                        player.scene.enemyList.forEach(enemy => {
                            if (enemy.active) {
                                const distance = Phaser.Math.Distance.Between(
                                    player.x, player.y,
                                    enemy.sprite.x, enemy.sprite.y
                                );

                                if (distance < 40) {
                                    enemy.takeDamage(5);
                                }
                            }
                        });
                    }
                }
            },

            phoenixFeather: {
                id: 'phoenixFeather',
                name: '불사조 깃털',
                rarity: 'rare',
                icon: '🪶',
                description: '화상 상태인 적에게 추가 피해 +25%',
                effectType: 'onAttack',
                effect: (player, target) => {
                    if (target && target.isBurning) {
                        // 추가 피해는 데미지 계산 시 적용되도록 플레이어에 플래그 설정
                        player.burnedEnemyBonus = 0.25;
                    }
                }
            },

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // ⚡ 전기 컨셉 (5개)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            lightningNecklace: {
                id: 'lightningNecklace',
                name: '번개 목걸이',
                rarity: 'rare',
                icon: '⚡',
                description: '공격 시 8% 확률로 연쇄 번개',
                effectType: 'onAttack',
                effect: (player, target) => {
                    if (Math.random() < 0.08 && target && player.scene) {
                        // 연쇄 번개 - 가까운 다른 적 찾기
                        let nearestEnemy = null;
                        let minDistance = Infinity;

                        if (player.scene.enemyList) {
                            player.scene.enemyList.forEach(enemy => {
                                if (enemy.active && enemy !== target) {
                                    const distance = Phaser.Math.Distance.Between(
                                        target.sprite.x, target.sprite.y,
                                        enemy.sprite.x, enemy.sprite.y
                                    );

                                    if (distance < 150 && distance < minDistance) {
                                        minDistance = distance;
                                        nearestEnemy = enemy;
                                    }
                                }
                            });
                        }

                        if (nearestEnemy) {
                            // 번개 선
                            const chain = player.scene.add.graphics();
                            chain.lineStyle(3, 0xFFFF00, 1);
                            chain.lineBetween(
                                target.sprite.x, target.sprite.y,
                                nearestEnemy.sprite.x, nearestEnemy.sprite.y
                            );

                            nearestEnemy.takeDamage(15);
                            if (nearestEnemy.applyShock) {
                                nearestEnemy.applyShock(0.3, 1500);
                            }

                            player.scene.tweens.add({
                                targets: chain,
                                alpha: 0,
                                duration: 200,
                                onComplete: () => chain.destroy()
                            });
                        }
                    }
                }
            },

            staticGloves: {
                id: 'staticGloves',
                name: '정전기 장갑',
                rarity: 'common',
                icon: '🧤',
                description: '대시 후 첫 공격이 감전 부여',
                effectType: 'passive',
                effect: {
                    dashElectric: true
                }
            },

            conductor: {
                id: 'conductor',
                name: '전도체',
                rarity: 'rare',
                icon: '🔌',
                description: '감전된 적이 주변에 전기 방출',
                effectType: 'passive',
                effect: {
                    shockAura: true
                }
            },

            chargedBattery: {
                id: 'chargedBattery',
                name: '충전 배터리',
                rarity: 'common',
                icon: '🔋',
                description: '스킬 쿨다운 -15%',
                effectType: 'stat',
                effect: {
                    skillCooldownReduction: 0.15
                }
            },

            thunderCloak: {
                id: 'thunderCloak',
                name: '천둥의 망토',
                rarity: 'legendary',
                icon: '🧥',
                description: '이동 시 정전기 축적, 공격 시 방전\n완충 시 추가 전기 피해',
                effectType: 'passive',
                effect: {
                    staticBuildup: true
                }
            },

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 💎 범용 유틸리티 (10개)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            speedBoots: {
                id: 'speedBoots',
                name: '신속의 부츠',
                rarity: 'common',
                icon: '👟',
                description: '이동속도 +15%',
                effectType: 'stat',
                effect: {
                    moveSpeed: 30  // 200 * 0.15 = 30
                }
            },

            attackSpeedGloves: {
                id: 'attackSpeedGloves',
                name: '공격 속도 장갑',
                rarity: 'common',
                icon: '✊',
                description: '공격속도 +20%',
                effectType: 'stat',
                effect: {
                    attackSpeed: 0.2
                }
            },

            healthRing: {
                id: 'healthRing',
                name: '체력 반지',
                rarity: 'common',
                icon: '💍',
                description: '최대 HP +20',
                effectType: 'stat',
                effect: {
                    maxHP: 20
                }
            },

            criticalAmulet: {
                id: 'criticalAmulet',
                name: '치명타 부적',
                rarity: 'rare',
                icon: '📿',
                description: '크리티컬 확률 +10%',
                effectType: 'stat',
                effect: {
                    criticalChance: 0.1
                }
            },

            powerStone: {
                id: 'powerStone',
                name: '힘의 돌',
                rarity: 'rare',
                icon: '💎',
                description: '공격력 +15%',
                effectType: 'stat',
                effect: {
                    attackPower: 0.15
                }
            },

            dashGem: {
                id: 'dashGem',
                name: '대시 젬',
                rarity: 'common',
                icon: '💨',
                description: '대시 쿨다운 -30%',
                effectType: 'stat',
                effect: {
                    dashCooldownReduction: 0.3
                }
            },

            ironShield: {
                id: 'ironShield',
                name: '강철 방패',
                rarity: 'rare',
                icon: '🛡️',
                description: '받는 피해 -15%',
                effectType: 'stat',
                effect: {
                    defense: 0.15
                }
            },

            lifeSteal: {
                id: 'lifeSteal',
                name: '흡혈의 이빨',
                rarity: 'legendary',
                icon: '🧛',
                description: '생명력 흡수 5%',
                effectType: 'onAttack',
                effect: (player, target, damage) => {
                    if (damage && player.health < player.maxHealth) {
                        const heal = Math.floor(damage * 0.05);
                        player.health = Math.min(player.maxHealth, player.health + heal);

                        // 회복 이펙트
                        if (player.scene) {
                            const healText = player.scene.add.text(
                                player.x,
                                player.y - 30,
                                `+${heal}`,
                                {
                                    fontFamily: 'Jua',
                                    fontSize: '16px',
                                    fill: '#00FF00',
                                    fontStyle: 'bold'
                                }
                            );
                            healText.setOrigin(0.5);

                            player.scene.tweens.add({
                                targets: healText,
                                y: healText.y - 20,
                                alpha: 0,
                                duration: 800,
                                onComplete: () => healText.destroy()
                            });
                        }
                    }
                }
            },

            doubleJump: {
                id: 'doubleJump',
                name: '날개 깃털',
                rarity: 'rare',
                icon: '🪽',
                description: '이중 점프 획득',
                effectType: 'stat',
                effect: {
                    hasDoubleJump: true
                }
            },

            luckyClover: {
                id: 'luckyClover',
                name: '행운의 클로버',
                rarity: 'legendary',
                icon: '🍀',
                description: '아이템 드롭률 +20%',
                effectType: 'stat',
                effect: {
                    dropRate: 0.2
                }
            }
        };
    }

    // ID로 아이템 가져오기
    getItem(id) {
        return this.items[id] || null;
    }

    // 희귀도별 아이템 목록
    getItemsByRarity(rarity) {
        return Object.values(this.items).filter(item => item.rarity === rarity);
    }

    // 랜덤 아이템 (희귀도 가중치 적용)
    getRandomItem() {
        const roll = Math.random();
        let rarity;

        if (roll < 0.6) {
            rarity = 'common';      // 60%
        } else if (roll < 0.9) {
            rarity = 'rare';        // 30%
        } else {
            rarity = 'legendary';   // 10%
        }

        const itemsOfRarity = this.getItemsByRarity(rarity);
        return Phaser.Utils.Array.GetRandom(itemsOfRarity);
    }

    // 모든 아이템 ID 목록
    getAllItemIds() {
        return Object.keys(this.items);
    }

    // 아이템 개수
    getItemCount() {
        return Object.keys(this.items).length;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RoguelikePassiveItems = RoguelikePassiveItems;
    // 싱글톤 인스턴스
    window.roguelikePassiveItems = new RoguelikePassiveItems();
}
