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

        // 이전 프레임 입력 상태 (JustDown 감지용)
        this.previousInputs = {
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

        // 각 버튼을 누르고 있는 포인터 ID 추적 (멀티터치 지원)
        this.activePointers = {
            left: null,
            right: null,
            jump: null,
            basicAttack: null,
            strongAttack: null,
            skill: null,
            dash: null,
            abilitySwap1: null,
            abilitySwap2: null
        };

        // UI 요소들
        this.buttons = {};
        this.buttonTexts = {};

        this.createUI();
        this.setupTouchEvents();
    }

    createUI() {
        // 버튼 설정 (크기 확대, 투명도 조절)
        const buttonAlpha = 0.5; // 기본 투명도 (더 투명하게)
        const buttonPressedAlpha = 0.85; // 눌렸을 때 투명도
        const buttonSize = 70; // 55 → 70 (27% 확대)
        const moveButtonSize = 90; // 좌우 이동 버튼은 더 크게 (90px)
        const smallButtonSize = 58; // 45 → 58 (29% 확대)
        const margin = 20; // 16 → 20 (여유 공간 증가)

        // 투명도 설정 저장 (나중에 사용)
        this.buttonAlpha = buttonAlpha;
        this.buttonPressedAlpha = buttonPressedAlpha;

        // === 좌측: 이동 버튼 ===
        // 왼쪽 버튼 (크기 증가)
        this.buttons.left = this.scene.add.circle(
            margin + moveButtonSize / 2,
            CONSTANTS.GAME.HEIGHT - margin - moveButtonSize / 2,
            moveButtonSize / 2,
            0x555555,
            buttonAlpha
        );
        this.buttons.left.setScrollFactor(0).setDepth(3000);

        this.buttonTexts.left = this.scene.add.text(
            this.buttons.left.x, this.buttons.left.y, '◀',
            { fontFamily: 'Orbitron', fontSize: '44px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.left.setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // 오른쪽 버튼 (크기 증가)
        this.buttons.right = this.scene.add.circle(
            margin + moveButtonSize / 2 + moveButtonSize + 12,
            CONSTANTS.GAME.HEIGHT - margin - moveButtonSize / 2,
            moveButtonSize / 2,
            0x555555,
            buttonAlpha
        );
        this.buttons.right.setScrollFactor(0).setDepth(3000);

        this.buttonTexts.right = this.scene.add.text(
            this.buttons.right.x, this.buttons.right.y, '▶',
            { fontFamily: 'Orbitron', fontSize: '44px', fill: '#fff', fontStyle: 'bold' }
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
        this.buttons.jump.setScrollFactor(0).setDepth(3000);

        this.buttonTexts.jump = this.scene.add.text(
            this.buttons.jump.x, this.buttons.jump.y, 'UP',
            { fontFamily: 'Orbitron', fontSize: '19px', fill: '#fff', fontStyle: 'bold' }
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
        this.buttons.dash.setScrollFactor(0).setDepth(3000);

        this.buttonTexts.dash = this.scene.add.text(
            this.buttons.dash.x, this.buttons.dash.y, 'DASH',
            { fontFamily: 'Orbitron', fontSize: '15px', fill: '#fff', fontStyle: 'bold' }
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
        this.buttons.basicAttack.setScrollFactor(0).setDepth(3000);

        this.buttonTexts.basicAttack = this.scene.add.text(
            this.buttons.basicAttack.x, this.buttons.basicAttack.y, 'Z',
            { fontFamily: 'Orbitron', fontSize: '24px', fill: '#fff', fontStyle: 'bold' }
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
        this.buttons.strongAttack.setScrollFactor(0).setDepth(3000);

        this.buttonTexts.strongAttack = this.scene.add.text(
            this.buttons.strongAttack.x, this.buttons.strongAttack.y, 'X',
            { fontFamily: 'Orbitron', fontSize: '24px', fill: '#fff', fontStyle: 'bold' }
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
        this.buttons.skill.setScrollFactor(0).setDepth(3000);

        this.buttonTexts.skill = this.scene.add.text(
            this.buttons.skill.x, this.buttons.skill.y, 'C',
            { fontFamily: 'Orbitron', fontSize: '24px', fill: '#fff', fontStyle: 'bold' }
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
        this.buttons.abilitySwap1.setScrollFactor(0).setDepth(3000);

        this.buttonTexts.abilitySwap1 = this.scene.add.text(
            this.buttons.abilitySwap1.x, this.buttons.abilitySwap1.y, 'Q',
            { fontFamily: 'Orbitron', fontSize: '22px', fill: '#fff', fontStyle: 'bold' }
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
        this.buttons.abilitySwap2.setScrollFactor(0).setDepth(3000);

        this.buttonTexts.abilitySwap2 = this.scene.add.text(
            this.buttons.abilitySwap2.x, this.buttons.abilitySwap2.y, 'E',
            { fontFamily: 'Orbitron', fontSize: '22px', fill: '#fff', fontStyle: 'bold' }
        );
        this.buttonTexts.abilitySwap2.setOrigin(0.5).setScrollFactor(0).setDepth(3001);
    }

    setupTouchEvents() {
        // Scene 레벨에서 모든 포인터 추적 (멀티터치 완전 지원)
        this.scene.input.on('pointerdown', (pointer) => {
            this.checkPointerOnButtons(pointer, true);
        });

        this.scene.input.on('pointermove', (pointer) => {
            this.checkPointerOnButtons(pointer, pointer.isDown);
        });

        this.scene.input.on('pointerup', (pointer) => {
            this.releasePointer(pointer);
        });
    }

    // 포인터가 어느 버튼 위에 있는지 확인
    checkPointerOnButtons(pointer, isDown) {
        if (!isDown) return;

        Object.keys(this.buttons).forEach(key => {
            const button = this.buttons[key];
            const bounds = button.getBounds();

            // 포인터가 버튼 영역 안에 있는지 확인
            if (bounds.contains(pointer.x, pointer.y)) {
                // 아직 이 버튼을 누르는 포인터가 없거나, 같은 포인터인 경우
                if (this.activePointers[key] === null || this.activePointers[key] === pointer.id) {
                    this.inputs[key] = true;
                    this.activePointers[key] = pointer.id;
                    button.setAlpha(this.buttonPressedAlpha);
                }
            } else {
                // 이 포인터가 버튼을 누르고 있었는데 영역 밖으로 나간 경우
                if (this.activePointers[key] === pointer.id) {
                    this.inputs[key] = false;
                    this.activePointers[key] = null;
                    button.setAlpha(this.buttonAlpha);
                }
            }
        });
    }

    // 포인터 떼어짐 처리
    releasePointer(pointer) {
        Object.keys(this.buttons).forEach(key => {
            if (this.activePointers[key] === pointer.id) {
                this.inputs[key] = false;
                this.activePointers[key] = null;
                this.buttons[key].setAlpha(this.buttonAlpha);
            }
        });
    }

    getInputs() {
        return this.inputs;
    }

    // 매 프레임 호출하여 이전 입력 상태 업데이트
    update() {
        // 이전 프레임 상태를 현재 프레임으로 복사
        Object.keys(this.inputs).forEach(key => {
            this.previousInputs[key] = this.inputs[key];
        });
    }

    // "방금 눌렸는지" 체크 (이전 프레임: false, 현재 프레임: true)
    justPressed(key) {
        return !this.previousInputs[key] && this.inputs[key];
    }

    destroy() {
        // Scene 이벤트 리스너 제거
        this.scene.input.off('pointerdown');
        this.scene.input.off('pointermove');
        this.scene.input.off('pointerup');

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
