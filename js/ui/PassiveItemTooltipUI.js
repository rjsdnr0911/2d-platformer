// 패시브 아이템 툴팁 UI (마우스 오버 시 설명 표시)
class PassiveItemTooltipUI {
    constructor(scene) {
        this.scene = scene;
        this.tooltip = null;
        this.itemIconTexts = []; // 개별 아이템 아이콘 텍스트 객체들
        this.isShowing = false;
    }

    // 패시브 아이템 UI 생성 (개별 아이콘으로 분리)
    createPassiveItemsUI(x, y) {
        // 기존 아이템 아이콘 제거
        this.itemIconTexts.forEach(iconObj => {
            if (iconObj.text) iconObj.text.destroy();
        });
        this.itemIconTexts = [];

        if (!window.player || window.player.passiveItems.length === 0) {
            return;
        }

        // 레이블 텍스트
        const labelText = this.scene.add.text(x, y, '패시브:', {
            fontSize: '14px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        labelText.setScrollFactor(0);
        labelText.setDepth(100);

        // 각 아이템 아이콘을 개별 텍스트 객체로 생성
        const startX = x + labelText.width + 5;
        const iconSize = 24;
        const spacing = 5;

        window.player.passiveItems.forEach((item, index) => {
            const iconX = startX + (index * (iconSize + spacing));

            const iconText = this.scene.add.text(iconX, y, item.icon, {
                fontSize: '20px',
                backgroundColor: '#222',
                padding: { x: 4, y: 4 }
            });
            iconText.setScrollFactor(0);
            iconText.setDepth(100);
            iconText.setInteractive({ useHandCursor: true });

            // 마우스 오버 이벤트
            iconText.on('pointerover', () => {
                this.showTooltip(item, iconX, y);
            });

            // 마우스 아웃 이벤트
            iconText.on('pointerout', () => {
                this.hideTooltip();
            });

            // 아이콘 저장
            this.itemIconTexts.push({
                text: iconText,
                item: item
            });
        });

        // 레이블도 저장 (파괴 시 같이 제거하기 위해)
        this.itemIconTexts.push({
            text: labelText,
            item: null
        });
    }

    // 툴팁 표시
    showTooltip(item, x, y) {
        if (this.isShowing) return;

        this.isShowing = true;

        // 아이템 설명 가져오기
        const description = this.getItemDescription(item.id);

        // 툴팁 배경
        const tooltipWidth = 250;
        const tooltipHeight = 80;
        const tooltipX = x;
        const tooltipY = y + 35; // 아이콘 아래에 표시

        const bg = this.scene.add.rectangle(
            tooltipX,
            tooltipY,
            tooltipWidth,
            tooltipHeight,
            0x1a1a1a,
            0.95
        );
        bg.setOrigin(0, 0);
        bg.setScrollFactor(0);
        bg.setDepth(1000);
        bg.setStrokeStyle(2, 0xFFD700); // 금색 테두리

        // 아이템 이름
        const nameText = this.scene.add.text(
            tooltipX + 10,
            tooltipY + 10,
            item.name,
            {
                fontSize: '16px',
                fill: '#FFD700',
                fontStyle: 'bold'
            }
        );
        nameText.setOrigin(0, 0);
        nameText.setScrollFactor(0);
        nameText.setDepth(1001);

        // 아이템 설명
        const descText = this.scene.add.text(
            tooltipX + 10,
            tooltipY + 35,
            description,
            {
                fontSize: '14px',
                fill: '#FFFFFF',
                wordWrap: { width: tooltipWidth - 20 }
            }
        );
        descText.setOrigin(0, 0);
        descText.setScrollFactor(0);
        descText.setDepth(1001);

        // 툴팁 저장
        this.tooltip = {
            bg,
            nameText,
            descText
        };

        // 페이드인 애니메이션
        this.scene.tweens.add({
            targets: [bg, nameText, descText],
            alpha: { from: 0, to: 1 },
            duration: 150,
            ease: 'Power2'
        });
    }

    // 툴팁 숨기기
    hideTooltip() {
        if (!this.tooltip) return;

        const { bg, nameText, descText } = this.tooltip;

        // 페이드아웃 후 제거
        this.scene.tweens.add({
            targets: [bg, nameText, descText],
            alpha: 0,
            duration: 100,
            ease: 'Power2',
            onComplete: () => {
                if (bg) bg.destroy();
                if (nameText) nameText.destroy();
                if (descText) descText.destroy();
                this.tooltip = null;
                this.isShowing = false;
            }
        });
    }

    // 아이템 설명 가져오기
    getItemDescription(itemId) {
        const descriptions = {
            'speed_boots': '이동속도가 30% 증가합니다.',
            'winged_boots': '점프력이 40% 증가합니다.',
            'time_clock': '모든 스킬의 쿨타임이 20% 감소합니다.',
            'iron_shield': '받는 피해가 30% 감소합니다.',
            'health_ring': '최대 HP가 20 증가합니다.',
            'dash_gem': '대시 쿨타임이 40% 감소합니다.',
            'phantom_cloak': '피격 후 무적 시간이 50% 증가합니다.'
        };

        return descriptions[itemId] || '특별한 효과를 가진 아이템입니다.';
    }

    // UI 업데이트 (패시브 아이템 변경 시 호출)
    update(x, y) {
        this.createPassiveItemsUI(x, y);
    }

    // 파괴
    destroy() {
        this.hideTooltip();

        this.itemIconTexts.forEach(iconObj => {
            if (iconObj.text) iconObj.text.destroy();
        });
        this.itemIconTexts = [];
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.PassiveItemTooltipUI = PassiveItemTooltipUI;
}
