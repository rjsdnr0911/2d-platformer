// 스컬 교체 관리 시스템
class SkullManager {
    constructor(player) {
        this.player = player;
        this.equippedSkulls = [null, null];  // 최대 2개 스컬
        this.currentIndex = 0;                // 현재 활성 스컬 인덱스 (0 또는 1)
        this.swapCooldown = 2000;             // 2초 쿨다운
        this.lastSwapTime = 0;

        // UI 요소
        this.swapCooldownUI = null;
        this.skullIconsUI = [];
    }

    // 스컬 장착
    equipSkull(skull, slotIndex) {
        if (slotIndex < 0 || slotIndex > 1) {
            console.error('Invalid slot index:', slotIndex);
            return false;
        }

        // 기존 스컬 제거
        if (this.equippedSkulls[slotIndex]) {
            this.removeSkull(slotIndex);
        }

        // 새 스컬 장착
        this.equippedSkulls[slotIndex] = skull;

        // 첫 번째 스컬이면 바로 적용
        if (slotIndex === 0 || this.currentIndex === slotIndex) {
            this.applySkullStats(skull);
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`Skull equipped to slot ${slotIndex}:`, skull.name);
        }

        return true;
    }

    // 스컬 제거
    removeSkull(slotIndex) {
        if (slotIndex < 0 || slotIndex > 1) {
            console.error('Invalid slot index:', slotIndex);
            return false;
        }

        const skull = this.equippedSkulls[slotIndex];
        if (!skull) return false;

        // 패시브 효과 제거
        if (skull.passive && skull.passive.onRemove) {
            skull.passive.onRemove(this.player);
        }

        this.equippedSkulls[slotIndex] = null;

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`Skull removed from slot ${slotIndex}`);
        }

        return true;
    }

    // 스컬 교체 가능 여부 확인
    canSwap() {
        // 2개의 스컬이 모두 장착되어 있어야 함
        if (!this.equippedSkulls[0] || !this.equippedSkulls[1]) {
            return false;
        }

        // 쿨다운 확인
        const now = Date.now();
        return now - this.lastSwapTime >= this.swapCooldown;
    }

    // 스컬 교체 실행
    swap() {
        if (!this.canSwap()) {
            return false;
        }

        // 이전 스컬
        const oldSkull = this.equippedSkulls[this.currentIndex];

        // 인덱스 변경 (0 ↔ 1)
        this.currentIndex = 1 - this.currentIndex;

        // 새 스컬
        const newSkull = this.equippedSkulls[this.currentIndex];

        // 교체 효과 발동
        if (newSkull.swapEffect) {
            newSkull.swapEffect(this.player);
        }

        // 스탯 적용
        this.applySkullStats(newSkull);

        // 패시브 효과 재적용
        if (oldSkull.passive && oldSkull.passive.onDeactivate) {
            oldSkull.passive.onDeactivate(this.player);
        }
        if (newSkull.passive && newSkull.passive.onActivate) {
            newSkull.passive.onActivate(this.player);
        }

        // 쿨다운 시작
        this.lastSwapTime = Date.now();

        // UI 업데이트
        this.updateUI();

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`Swapped to skull: ${newSkull.name}`);
        }

        return true;
    }

    // 스컬 스탯 적용
    applySkullStats(skull) {
        if (!skull) return;

        // 기본 스탯으로 리셋 (로그라이크 플레이어 기본값)
        const baseStats = {
            maxHealth: 50,
            moveSpeed: 200,
            jumpVelocity: -400,
            attackMultiplier: 1.0
        };

        // 스컬 스탯 적용
        this.player.moveSpeed = baseStats.moveSpeed * skull.stats.moveSpeed;
        this.player.jumpVelocity = baseStats.jumpVelocity * skull.stats.jumpPower;
        this.player.attackMultiplier = skull.stats.attackPower;

        // HP는 현재 비율 유지하며 최대값만 변경
        const hpRatio = this.player.health / this.player.maxHealth;
        this.player.maxHealth = baseStats.maxHealth + skull.stats.baseHP;
        this.player.health = Math.min(this.player.health, this.player.maxHealth);

        // 만약 HP 비율을 유지하고 싶다면 (주석 해제)
        // this.player.health = this.player.maxHealth * hpRatio;

        // 능력 교체 (기본 공격, 스킬 등)
        this.applySkullAbilities(skull);
    }

    // 스컬 능력 적용
    applySkullAbilities(skull) {
        // 기본 공격 교체
        if (skull.basicAttack) {
            this.player.basicAttack = skull.basicAttack.bind(this.player);
        }

        // 스킬 1 교체
        if (skull.skill1) {
            this.player.skill1 = skull.skill1;
            this.player.skill1Cooldown = skull.skill1.cooldown || 3000;
            this.player.lastSkill1Time = 0;
        }

        // 스킬 2 교체
        if (skull.skill2) {
            this.player.skill2 = skull.skill2;
            this.player.skill2Cooldown = skull.skill2.cooldown || 8000;
            this.player.lastSkill2Time = 0;
        }
    }

    // 현재 활성 스컬 가져오기
    getCurrentSkull() {
        return this.equippedSkulls[this.currentIndex];
    }

    // 비활성 스컬 가져오기
    getInactiveSkull() {
        const inactiveIndex = 1 - this.currentIndex;
        return this.equippedSkulls[inactiveIndex];
    }

    // 남은 쿨다운 시간 (밀리초)
    getRemainingCooldown() {
        const now = Date.now();
        const elapsed = now - this.lastSwapTime;
        return Math.max(0, this.swapCooldown - elapsed);
    }

    // 쿨다운 진행률 (0.0 ~ 1.0)
    getCooldownProgress() {
        const remaining = this.getRemainingCooldown();
        return 1.0 - (remaining / this.swapCooldown);
    }

    // UI 생성 (Scene에서 호출)
    createUI(scene) {
        const uiX = 400;
        const uiY = 30;
        const iconSize = 50;
        const spacing = 70;

        // 스컬 아이콘 배경 1
        const icon1Bg = scene.add.rectangle(
            uiX - spacing,
            uiY,
            iconSize,
            iconSize,
            0x333333,
            0.8
        );
        icon1Bg.setScrollFactor(0);
        icon1Bg.setDepth(100);

        // 스컬 아이콘 배경 2
        const icon2Bg = scene.add.rectangle(
            uiX + spacing,
            uiY,
            iconSize,
            iconSize,
            0x333333,
            0.8
        );
        icon2Bg.setScrollFactor(0);
        icon2Bg.setDepth(100);

        // 스컬 이름 텍스트 1
        const skull1Text = scene.add.text(
            uiX - spacing,
            uiY,
            '',
            {
                fontFamily: 'Jua',
                fontSize: '14px',
                fill: '#fff',
                align: 'center'
            }
        );
        skull1Text.setOrigin(0.5);
        skull1Text.setScrollFactor(0);
        skull1Text.setDepth(101);

        // 스컬 이름 텍스트 2
        const skull2Text = scene.add.text(
            uiX + spacing,
            uiY,
            '',
            {
                fontFamily: 'Jua',
                fontSize: '14px',
                fill: '#fff',
                align: 'center'
            }
        );
        skull2Text.setOrigin(0.5);
        skull2Text.setScrollFactor(0);
        skull2Text.setDepth(101);

        // 교체 화살표
        const swapArrow = scene.add.text(
            uiX,
            uiY,
            '⇄',
            {
                fontFamily: 'Orbitron',
                fontSize: '24px',
                fill: '#00FFFF',
                fontStyle: 'bold'
            }
        );
        swapArrow.setOrigin(0.5);
        swapArrow.setScrollFactor(0);
        swapArrow.setDepth(101);

        // 쿨다운 표시 (원형 프로그레스)
        const cooldownCircle = scene.add.graphics();
        cooldownCircle.setScrollFactor(0);
        cooldownCircle.setDepth(102);

        // UI 요소 저장
        this.swapCooldownUI = {
            icon1Bg,
            icon2Bg,
            skull1Text,
            skull2Text,
            swapArrow,
            cooldownCircle,
            uiX,
            uiY,
            iconSize
        };

        // 초기 업데이트
        this.updateUI();
    }

    // UI 업데이트
    updateUI() {
        if (!this.swapCooldownUI) return;

        const ui = this.swapCooldownUI;

        // 스컬 1 표시
        if (this.equippedSkulls[0]) {
            const skull1 = this.equippedSkulls[0];
            ui.skull1Text.setText(skull1.name);

            // 활성 스컬 강조
            if (this.currentIndex === 0) {
                ui.icon1Bg.setFillStyle(0x9D4EDD, 1.0);
                ui.skull1Text.setStyle({ fill: '#FFD700' });
            } else {
                ui.icon1Bg.setFillStyle(0x333333, 0.8);
                ui.skull1Text.setStyle({ fill: '#fff' });
            }
        } else {
            ui.skull1Text.setText('빈 슬롯');
            ui.icon1Bg.setFillStyle(0x222222, 0.5);
        }

        // 스컬 2 표시
        if (this.equippedSkulls[1]) {
            const skull2 = this.equippedSkulls[1];
            ui.skull2Text.setText(skull2.name);

            // 활성 스컬 강조
            if (this.currentIndex === 1) {
                ui.icon2Bg.setFillStyle(0x9D4EDD, 1.0);
                ui.skull2Text.setStyle({ fill: '#FFD700' });
            } else {
                ui.icon2Bg.setFillStyle(0x333333, 0.8);
                ui.skull2Text.setStyle({ fill: '#fff' });
            }
        } else {
            ui.skull2Text.setText('빈 슬롯');
            ui.icon2Bg.setFillStyle(0x222222, 0.5);
        }

        // 쿨다운 원형 그래프 업데이트
        this.updateCooldownCircle();
    }

    // 쿨다운 원형 그래프 업데이트 (매 프레임 호출)
    updateCooldownCircle() {
        if (!this.swapCooldownUI) return;

        const ui = this.swapCooldownUI;
        const graphics = ui.cooldownCircle;

        graphics.clear();

        // 쿨다운 중일 때만 표시
        if (!this.canSwap() && this.equippedSkulls[0] && this.equippedSkulls[1]) {
            const progress = this.getCooldownProgress();
            const radius = ui.iconSize / 2 + 5;

            // 쿨다운 진행 원 그리기
            graphics.lineStyle(3, 0xFF0000, 0.8);
            graphics.beginPath();
            graphics.arc(
                ui.uiX,
                ui.uiY,
                radius,
                Phaser.Math.DegToRad(-90),  // 시작 각도 (12시 방향)
                Phaser.Math.DegToRad(-90 + 360 * progress),  // 끝 각도
                false
            );
            graphics.strokePath();
        }
    }

    // 매 프레임 업데이트
    update(time, delta) {
        // UI 업데이트 (쿨다운 표시)
        this.updateCooldownCircle();

        // 현재 활성 스컬의 패시브 업데이트
        const currentSkull = this.getCurrentSkull();
        if (currentSkull && currentSkull.passive && currentSkull.passive.update) {
            currentSkull.passive.update(this.player, time, delta);
        }
    }

    // 정리
    destroy() {
        if (this.swapCooldownUI) {
            Object.values(this.swapCooldownUI).forEach(obj => {
                if (obj && obj.destroy) {
                    obj.destroy();
                }
            });
            this.swapCooldownUI = null;
        }

        this.equippedSkulls = [null, null];
        this.player = null;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.SkullManager = SkullManager;
}
