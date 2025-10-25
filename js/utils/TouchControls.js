// 모바일 터치 컨트롤 시스템
class TouchControls {
    constructor(scene) {
        this.scene = scene;

        // 입력 상태
        this.inputs = {
            left: false,
            right: false,
            jump: false,
            attack: false,
            dash: false
        };

        // UI 요소들
        this.leftButton = null;
        this.rightButton = null;
        this.jumpButton = null;
        this.attackButton = null;
        this.dashButton = null;

        // 터치 ID 추적
        this.activeTouches = {};

        this.createUI();
        this.setupTouchEvents();
    }

    createUI() {
        const buttonAlpha = 0.5;
        const buttonSize = 60;
        const margin = 20;

        // 왼쪽 화살표 버튼 (좌측 이동)
        this.leftButton = this.scene.add.circle(
            margin + buttonSize / 2,
            CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2,
            buttonSize / 2,
            0x888888,
            buttonAlpha
        );
        this.leftButton.setScrollFactor(0);
        this.leftButton.setDepth(3000);
        this.leftButton.setInteractive();

        // 왼쪽 화살표 아이콘
        const leftArrow = this.scene.add.text(
            this.leftButton.x,
            this.leftButton.y,
            '◀',
            {
                fontSize: '32px',
                fill: '#fff'
            }
        );
        leftArrow.setOrigin(0.5);
        leftArrow.setScrollFactor(0);
        leftArrow.setDepth(3001);

        // 오른쪽 화살표 버튼 (우측 이동)
        this.rightButton = this.scene.add.circle(
            margin + buttonSize / 2 + buttonSize + 10,
            CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2,
            buttonSize / 2,
            0x888888,
            buttonAlpha
        );
        this.rightButton.setScrollFactor(0);
        this.rightButton.setDepth(3000);
        this.rightButton.setInteractive();

        // 오른쪽 화살표 아이콘
        const rightArrow = this.scene.add.text(
            this.rightButton.x,
            this.rightButton.y,
            '▶',
            {
                fontSize: '32px',
                fill: '#fff'
            }
        );
        rightArrow.setOrigin(0.5);
        rightArrow.setScrollFactor(0);
        rightArrow.setDepth(3001);

        // 점프 버튼 (우측 하단)
        this.jumpButton = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2,
            CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2,
            buttonSize / 2,
            0x00ff00,
            buttonAlpha
        );
        this.jumpButton.setScrollFactor(0);
        this.jumpButton.setDepth(3000);
        this.jumpButton.setInteractive();

        const jumpText = this.scene.add.text(
            this.jumpButton.x,
            this.jumpButton.y,
            'UP',
            {
                fontSize: '16px',
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        jumpText.setOrigin(0.5);
        jumpText.setScrollFactor(0);
        jumpText.setDepth(3001);

        // 공격 버튼 (점프 위쪽)
        this.attackButton = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2,
            CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2 - buttonSize - 10,
            buttonSize / 2,
            0xff0000,
            buttonAlpha
        );
        this.attackButton.setScrollFactor(0);
        this.attackButton.setDepth(3000);
        this.attackButton.setInteractive();

        const attackText = this.scene.add.text(
            this.attackButton.x,
            this.attackButton.y,
            'ATK',
            {
                fontSize: '16px',
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        attackText.setOrigin(0.5);
        attackText.setScrollFactor(0);
        attackText.setDepth(3001);

        // 대시 버튼 (공격 위쪽)
        this.dashButton = this.scene.add.circle(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2,
            CONSTANTS.GAME.HEIGHT - margin - buttonSize / 2 - (buttonSize + 10) * 2,
            buttonSize / 2,
            0x0088ff,
            buttonAlpha
        );
        this.dashButton.setScrollFactor(0);
        this.dashButton.setDepth(3000);
        this.dashButton.setInteractive();

        const dashText = this.scene.add.text(
            this.dashButton.x,
            this.dashButton.y,
            'DASH',
            {
                fontSize: '14px',
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        dashText.setOrigin(0.5);
        dashText.setScrollFactor(0);
        dashText.setDepth(3001);
    }

    setupTouchEvents() {
        // 왼쪽 버튼
        this.leftButton.on('pointerdown', () => {
            this.inputs.left = true;
            this.leftButton.setAlpha(0.8);
        });
        this.leftButton.on('pointerup', () => {
            this.inputs.left = false;
            this.leftButton.setAlpha(0.5);
        });
        this.leftButton.on('pointerout', () => {
            this.inputs.left = false;
            this.leftButton.setAlpha(0.5);
        });

        // 오른쪽 버튼
        this.rightButton.on('pointerdown', () => {
            this.inputs.right = true;
            this.rightButton.setAlpha(0.8);
        });
        this.rightButton.on('pointerup', () => {
            this.inputs.right = false;
            this.rightButton.setAlpha(0.5);
        });
        this.rightButton.on('pointerout', () => {
            this.inputs.right = false;
            this.rightButton.setAlpha(0.5);
        });

        // 점프 버튼
        this.jumpButton.on('pointerdown', () => {
            this.inputs.jump = true;
            this.jumpButton.setAlpha(0.8);
        });
        this.jumpButton.on('pointerup', () => {
            this.inputs.jump = false;
            this.jumpButton.setAlpha(0.5);
        });

        // 공격 버튼
        this.attackButton.on('pointerdown', () => {
            this.inputs.attack = true;
            this.attackButton.setAlpha(0.8);
        });
        this.attackButton.on('pointerup', () => {
            this.inputs.attack = false;
            this.attackButton.setAlpha(0.5);
        });

        // 대시 버튼
        this.dashButton.on('pointerdown', () => {
            this.inputs.dash = true;
            this.dashButton.setAlpha(0.8);
        });
        this.dashButton.on('pointerup', () => {
            this.inputs.dash = false;
            this.dashButton.setAlpha(0.5);
        });
    }

    getInputs() {
        return this.inputs;
    }

    isLeft() {
        return this.inputs.left;
    }

    isRight() {
        return this.inputs.right;
    }

    isJump() {
        return this.inputs.jump;
    }

    isAttack() {
        return this.inputs.attack;
    }

    isDash() {
        return this.inputs.dash;
    }

    destroy() {
        if (this.leftButton) this.leftButton.destroy();
        if (this.rightButton) this.rightButton.destroy();
        if (this.jumpButton) this.jumpButton.destroy();
        if (this.attackButton) this.attackButton.destroy();
        if (this.dashButton) this.dashButton.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.TouchControls = TouchControls;
}
