// 인벤토리 관리 시스템
class InventoryManager {
    constructor(player) {
        this.player = player;

        // 패시브 아이템
        this.passiveItems = [];
        this.maxPassiveSlots = 9;

        // 액티브 아이템
        this.activeItems = [];
        this.maxActiveSlots = 1;

        // UI 요소
        this.inventoryUI = null;
        this.isOpen = false;
    }

    // 패시브 아이템 추가
    addPassiveItem(item) {
        if (this.passiveItems.length < this.maxPassiveSlots) {
            this.passiveItems.push(item);
            this.applyPassiveEffect(item);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('Passive item added:', item.name);
            }

            return { success: true, replaced: null };
        } else {
            // 9개 초과 - 교체 UI 필요
            if (CONSTANTS.GAME.DEBUG) {
                console.log('Inventory full, need to replace item');
            }

            return { success: false, needsReplacement: true, newItem: item };
        }
    }

    // 패시브 아이템 제거
    removePassiveItem(index) {
        if (index < 0 || index >= this.passiveItems.length) {
            return false;
        }

        const item = this.passiveItems[index];

        // 효과 제거
        this.removePassiveEffect(item);

        // 배열에서 제거
        this.passiveItems.splice(index, 1);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('Passive item removed:', item.name);
        }

        return true;
    }

    // 패시브 아이템 교체
    replacePassiveItem(index, newItem) {
        if (index < 0 || index >= this.passiveItems.length) {
            return false;
        }

        // 기존 아이템 제거
        const oldItem = this.passiveItems[index];
        this.removePassiveEffect(oldItem);

        // 새 아이템 추가
        this.passiveItems[index] = newItem;
        this.applyPassiveEffect(newItem);

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`Replaced ${oldItem.name} with ${newItem.name}`);
        }

        return true;
    }

    // 패시브 효과 적용
    applyPassiveEffect(item) {
        if (!item || !item.effect) return;

        // 효과 타입별 처리
        switch (item.effectType) {
            case 'stat':
                // 스탯 증가
                this.applyStatBonus(item.effect);
                break;

            case 'onAttack':
                // 공격 시 효과
                if (!this.player.onAttackEffects) {
                    this.player.onAttackEffects = [];
                }
                this.player.onAttackEffects.push(item.effect);
                break;

            case 'onHit':
                // 피격 시 효과
                if (!this.player.onHitEffects) {
                    this.player.onHitEffects = [];
                }
                this.player.onHitEffects.push(item.effect);
                break;

            case 'passive':
                // 지속 효과
                if (!this.player.passiveEffects) {
                    this.player.passiveEffects = [];
                }
                this.player.passiveEffects.push(item.effect);
                break;

            default:
                // 커스텀 효과
                if (item.effect.onApply) {
                    item.effect.onApply(this.player);
                }
                break;
        }
    }

    // 패시브 효과 제거
    removePassiveEffect(item) {
        if (!item || !item.effect) return;

        switch (item.effectType) {
            case 'stat':
                // 스탯 보너스 제거
                this.removeStatBonus(item.effect);
                break;

            case 'onAttack':
                // 공격 효과 제거
                if (this.player.onAttackEffects) {
                    const index = this.player.onAttackEffects.indexOf(item.effect);
                    if (index > -1) {
                        this.player.onAttackEffects.splice(index, 1);
                    }
                }
                break;

            case 'onHit':
                // 피격 효과 제거
                if (this.player.onHitEffects) {
                    const index = this.player.onHitEffects.indexOf(item.effect);
                    if (index > -1) {
                        this.player.onHitEffects.splice(index, 1);
                    }
                }
                break;

            case 'passive':
                // 지속 효과 제거
                if (this.player.passiveEffects) {
                    const index = this.player.passiveEffects.indexOf(item.effect);
                    if (index > -1) {
                        this.player.passiveEffects.splice(index, 1);
                    }
                }
                break;

            default:
                // 커스텀 효과 제거
                if (item.effect.onRemove) {
                    item.effect.onRemove(this.player);
                }
                break;
        }
    }

    // 스탯 보너스 적용
    applyStatBonus(effect) {
        if (effect.maxHP) this.player.maxHealth += effect.maxHP;
        if (effect.moveSpeed) this.player.moveSpeed += effect.moveSpeed;
        if (effect.attackPower) this.player.attackMultiplier += effect.attackPower;
        if (effect.defense) this.player.defense = (this.player.defense || 0) + effect.defense;
        // 추가 스탯...
    }

    // 스탯 보너스 제거
    removeStatBonus(effect) {
        if (effect.maxHP) this.player.maxHealth -= effect.maxHP;
        if (effect.moveSpeed) this.player.moveSpeed -= effect.moveSpeed;
        if (effect.attackPower) this.player.attackMultiplier -= effect.attackPower;
        if (effect.defense) this.player.defense = (this.player.defense || 0) - effect.defense;
        // 추가 스탯...
    }

    // 액티브 아이템 추가
    addActiveItem(item) {
        if (this.activeItems.length < this.maxActiveSlots) {
            this.activeItems.push(item);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('Active item added:', item.name);
            }

            return { success: true };
        } else {
            // 슬롯 가득 참 - 교체 필요
            return { success: false, needsReplacement: true, newItem: item };
        }
    }

    // 액티브 아이템 사용
    useActiveItem(index = 0) {
        if (index < 0 || index >= this.activeItems.length) {
            return false;
        }

        const item = this.activeItems[index];

        // 쿨다운 확인
        if (item.lastUseTime) {
            const now = Date.now();
            const cooldown = item.cooldown || 10000;
            if (now - item.lastUseTime < cooldown) {
                return false;  // 아직 쿨다운 중
            }
        }

        // 아이템 사용
        if (item.use) {
            item.use(this.player);
            item.lastUseTime = Date.now();

            if (CONSTANTS.GAME.DEBUG) {
                console.log('Active item used:', item.name);
            }

            return true;
        }

        return false;
    }

    // 액티브 아이템 쿨다운 확인
    getActiveCooldown(index = 0) {
        if (index < 0 || index >= this.activeItems.length) {
            return { ready: false, remaining: 0 };
        }

        const item = this.activeItems[index];
        if (!item.lastUseTime) {
            return { ready: true, remaining: 0 };
        }

        const now = Date.now();
        const cooldown = item.cooldown || 10000;
        const elapsed = now - item.lastUseTime;
        const remaining = Math.max(0, cooldown - elapsed);

        return {
            ready: remaining === 0,
            remaining: remaining,
            progress: Math.min(1.0, elapsed / cooldown)
        };
    }

    // 인벤토리 UI 생성 (I 키로 열기)
    createUI(scene) {
        // Phase 3에서 완전한 UI 구현 예정
        // 지금은 기본 구조만

        this.inventoryUI = {
            scene: scene,
            isCreated: true
        };

        if (CONSTANTS.GAME.DEBUG) {
            console.log('Inventory UI created (basic structure)');
        }
    }

    // 인벤토리 열기/닫기
    toggleInventory() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.showInventory();
        } else {
            this.hideInventory();
        }
    }

    // 인벤토리 표시 (Phase 3에서 구현)
    showInventory() {
        // TODO: Phase 3에서 완전한 UI 구현
        if (CONSTANTS.GAME.DEBUG) {
            console.log('Inventory opened');
            console.log('Passive items:', this.passiveItems.map(i => i.name));
            console.log('Active items:', this.activeItems.map(i => i.name));
        }
    }

    // 인벤토리 숨기기
    hideInventory() {
        if (CONSTANTS.GAME.DEBUG) {
            console.log('Inventory closed');
        }
    }

    // 간단한 인벤토리 정보 HUD (화면 우측 상단)
    createSimpleHUD(scene) {
        const hudX = CONSTANTS.GAME.WIDTH - 10;
        const hudY = 100;
        const iconSize = 30;
        const spacing = 35;

        // 패시브 아이템 아이콘들
        this.passiveItemIcons = [];

        for (let i = 0; i < this.maxPassiveSlots; i++) {
            const x = hudX - (i % 3) * spacing;
            const y = hudY + Math.floor(i / 3) * spacing;

            const icon = scene.add.rectangle(
                x, y,
                iconSize, iconSize,
                0x444444, 0.6
            );
            icon.setOrigin(1, 0);
            icon.setScrollFactor(0);
            icon.setDepth(100);

            this.passiveItemIcons.push(icon);
        }

        // 액티브 아이템 아이콘
        this.activeItemIcon = scene.add.rectangle(
            hudX,
            hudY + 110,
            iconSize + 10,
            iconSize + 10,
            0x9D4EDD,
            0.8
        );
        this.activeItemIcon.setOrigin(1, 0);
        this.activeItemIcon.setScrollFactor(0);
        this.activeItemIcon.setDepth(100);

        // 액티브 아이템 키 표시
        this.activeKeyText = scene.add.text(
            hudX - 20,
            hudY + 110 + 15,
            'V',
            {
                fontFamily: 'Orbitron',
                fontSize: '16px',
                fill: '#FFD700',
                fontStyle: 'bold'
            }
        );
        this.activeKeyText.setOrigin(0.5);
        this.activeKeyText.setScrollFactor(0);
        this.activeKeyText.setDepth(101);
    }

    // HUD 업데이트
    updateHUD() {
        // 패시브 아이템 아이콘 색상 업데이트
        if (this.passiveItemIcons) {
            this.passiveItemIcons.forEach((icon, index) => {
                if (index < this.passiveItems.length) {
                    // 아이템 있음
                    const item = this.passiveItems[index];
                    const color = this.getRarityColor(item.rarity);
                    icon.setFillStyle(color, 0.9);
                } else {
                    // 빈 슬롯
                    icon.setFillStyle(0x444444, 0.4);
                }
            });
        }

        // 액티브 아이템 쿨다운 표시
        if (this.activeItemIcon && this.activeItems.length > 0) {
            const cooldownInfo = this.getActiveCooldown(0);

            if (cooldownInfo.ready) {
                this.activeItemIcon.setAlpha(1.0);
            } else {
                this.activeItemIcon.setAlpha(0.5);
            }
        }
    }

    // 희귀도별 색상
    getRarityColor(rarity) {
        switch (rarity) {
            case 'common': return 0x888888;
            case 'rare': return 0x4444FF;
            case 'legendary': return 0xFFD700;
            default: return 0x666666;
        }
    }

    // 매 프레임 업데이트
    update(time, delta) {
        // 패시브 효과 업데이트
        if (this.player.passiveEffects) {
            this.player.passiveEffects.forEach(effect => {
                if (effect.update) {
                    effect.update(this.player, time, delta);
                }
            });
        }

        // HUD 업데이트
        this.updateHUD();
    }

    // 정리
    destroy() {
        // 모든 효과 제거
        this.passiveItems.forEach(item => {
            this.removePassiveEffect(item);
        });

        this.passiveItems = [];
        this.activeItems = [];

        // UI 정리
        if (this.passiveItemIcons) {
            this.passiveItemIcons.forEach(icon => icon.destroy());
            this.passiveItemIcons = null;
        }

        if (this.activeItemIcon) {
            this.activeItemIcon.destroy();
            this.activeItemIcon = null;
        }

        if (this.activeKeyText) {
            this.activeKeyText.destroy();
            this.activeKeyText = null;
        }

        this.player = null;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.InventoryManager = InventoryManager;
}
