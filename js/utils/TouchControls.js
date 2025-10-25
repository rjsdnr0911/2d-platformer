// 모바일 터치 컨트롤 시스템
class TouchControls {
    constructor(scene) {
        this.scene = scene;

        // 입력 상태
        this.inputs = {
            left: false,
            right: false,
            jump: false,
            basicAttack: false,
            strongAttack: false,
            skill: false,
            dash: false,
            abilitySwap1: false,
            abilitySwap2: false
        };

        // UI 요소들
        this.buttons = {};
        this.buttonTexts = {};

        this.createUI();
        this.setupTouchEvents();
    }

    createUI() {
        const buttonAlpha = 0.6;
        const buttonSize = 55;
        const smallButtonSize = 45;
        const margin = 16;

        // === 좌측: 이동 버튼 ===
        // 왼쪽 버튼
        this.buttons.left = this.scene.add.circle(
            margin + buttonSize / 2,
            CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2,
            buttonSize / 2,
            0x555555,
            buttonAlpha
        );
        this.buttons.left.setScrollFactor(0).setDepth(3000).setInteractive();

        this.buttonTexts.left = this.scene.add.text(
            this.buttons.left.x, this.buttons.left.y, '◀',
            { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.left.setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // 오른쪽 버튼
        this.buttons.right = this.scene.add.circle(
            margin + buttonSize / 2 + buttonSize + 12,
            CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2,
            buttonSize / 2,
            0x555555,
            buttonAlpha
        );
        this.buttons.right.setScrollFactor(0).setDepth(3000).setInteractive();

        this.buttonTexts.right = this.scene.add.text(
            this.buttons.right.x, this.buttons.right.y, '▶',
            { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.right.setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // === 우측 하단: 점프, 대시 ===
        // 점프 버튼 (우측 하단)
        this.buttons.jump = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2,
            CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2,
            buttonSize / 2,
            0x00cc00,
            buttonAlpha
        );
        this.buttons.jump.setScrollFactor(0).setDepth(3000).setInteractive();

        this.buttonTexts.jump = this.scene.add.text(
            this.buttons.jump.x, this.buttons.jump.y, 'UP',
            { fontSize: '15px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.jump.setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // 대시 버튼 (점프 왼쪽)
        this.buttons.dash = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2 - buttonSize - 12,
            CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2,
            buttonSize / 2,
            0x0088ff,
            buttonAlpha
        );
        this.buttons.dash.setScrollFactor(0).setDepth(3000).setInteractive();

        this.buttonTexts.dash = this.scene.add.text(
            this.buttons.dash.x, this.buttons.dash.y, 'DASH',
            { fontSize: '12px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.dash.setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // === 우측 중단: 공격 버튼들 ===
        const attackY = CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2 - buttonSize - 18;

        // 기본 공격 (Z)
        this.buttons.basicAttack = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2,
            attackY,
            buttonSize / 2,
            0xff3333,
            buttonAlpha
        );
        this.buttons.basicAttack.setScrollFactor(0).setDepth(3000).setInteractive();

        this.buttonTexts.basicAttack = this.scene.add.text(
            this.buttons.basicAttack.x, this.buttons.basicAttack.y, 'Z',
            { fontSize: '18px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.basicAttack.setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // 강공격 (X) - 기본공격 왼쪽
        this.buttons.strongAttack = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2 - buttonSize - 12,
            attackY,
            buttonSize / 2,
            0xff6600,
            buttonAlpha
        );
        this.buttons.strongAttack.setScrollFactor(0).setDepth(3000).setInteractive();

        this.buttonTexts.strongAttack = this.scene.add.text(
            this.buttons.strongAttack.x, this.buttons.strongAttack.y, 'X',
            { fontSize: '18px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.strongAttack.setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // === 우측 상단: 스킬 ===
        const skillY = attackY - buttonSize - 18;

        // 스킬 (C)
        this.buttons.skill = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2,
            skillY,
            buttonSize / 2,
            0xaa00ff,
            buttonAlpha
        );
        this.buttons.skill.setScrollFactor(0).setDepth(3000).setInteractive();

        this.buttonTexts.skill = this.scene.add.text(
            this.buttons.skill.x, this.buttons.skill.y, 'C',
            { fontSize: '18px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.skill.setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // === 상단 중앙: 능력 교체 버튼 ===
        const swapY = margin + smallButtonSize / 2 + 50;

        // Q 버튼 (능력1)
        this.buttons.abilitySwap1 = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH / 2 - smallButtonSize - 8,
            swapY,
            smallButtonSize / 2,
            0xffaa00,
            buttonAlpha
        );
        this.buttons.abilitySwap1.setScrollFactor(0).setDepth(3000).setInteractive();

        this.buttonTexts.abilitySwap1 = this.scene.add.text(
            this.buttons.abilitySwap1.x, this.buttons.abilitySwap1.y, 'Q',
            { fontSize: '16px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.abilitySwap1.setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // E 버튼 (능력2)
        this.buttons.abilitySwap2 = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH / 2 + smallButtonSize + 8,
            swapY,
            smallButtonSize / 2,
            0xffaa00,
            buttonAlpha
        );
        this.buttons.abilitySwap2.setScrollFactor(0).setDepth(3000).setInteractive();

        this.buttonTexts.abilitySwap2 = this.scene.add.text(
            this.buttons.abilitySwap2.x, this.buttons.abilitySwap2.y, 'E',
            { fontSize: '16px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.abilitySwap2.setOrigin(0.5).setScrollFactor(0).setDepth(3001);
    }

    setupTouchEvents() {
        // 모든 버튼에 대해 동일한 이벤트 처리
        Object.keys(this.buttons).forEach(key => {
            const button = this.buttons[key];

            button.on('pointerdown', () => {
                this.inputs[key] = true;
                button.setAlpha(0.9);
            });

            button.on('pointerup', () => {
                this.inputs[key] = false;
                button.setAlpha(0.6);
            });

            button.on('pointerout', () => {
                this.inputs[key] = false;
                button.setAlpha(0.6);
            });
        });
    }

    getInputs() {
        return this.inputs;
    }

    destroy() {
        // 모든 버튼과 텍스트 제거
        Object.values(this.buttons).forEach(button => {
            if (button) button.destroy();
        });
        Object.values(this.buttonTexts).forEach(text => {
            if (text) text.destroy();
        });
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.TouchControls = TouchControls;
}
