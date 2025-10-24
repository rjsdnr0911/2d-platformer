// 일시정지 Scene
class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    preload() {
        // 버튼 이미지 로드
        this.load.image('btn_restart', 'assets/Menu ui/Buttons/Restart.png');
        this.load.image('btn_close', 'assets/Menu ui/Buttons/Close.png');
        this.load.image('btn_back', 'assets/Menu ui/Buttons/Back.png');
    }

    create() {
        // 반투명 배경
        const overlay = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0x000000,
            0.7
        );
        overlay.setScrollFactor(0);
        overlay.setDepth(2000);

        // 일시정지 텍스트
        const pauseText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            100,
            'PAUSED',
            {
                fontSize: '64px',
                fill: '#fff',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 8
            }
        );
        pauseText.setOrigin(0.5);
        pauseText.setScrollFactor(0);
        pauseText.setDepth(2001);

        // 버튼 배경 패널
        const panel = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            400,
            300,
            0x333333,
            0.9
        );
        panel.setScrollFactor(0);
        panel.setDepth(2001);

        // 계속하기 버튼
        const resumeButton = this.createButton(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2 - 60,
            '계속하기',
            () => {
                this.resumeGame();
            }
        );

        // 재시작 버튼
        const restartButton = this.createImageButton(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2 + 10,
            'btn_restart',
            () => {
                this.restartGame();
            }
        );

        // 메인메뉴로 버튼
        const menuButton = this.createImageButton(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2 + 80,
            'btn_back',
            () => {
                this.returnToMenu();
            }
        );

        // ESC 키로 다시 게임 재개
        this.input.keyboard.on('keydown-ESC', () => {
            this.resumeGame();
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('일시정지 메뉴 로드 완료');
        }
    }

    createButton(x, y, text, onClick) {
        const button = this.add.rectangle(x, y, 250, 50, 0x4444ff);
        button.setInteractive({ useHandCursor: true });
        button.setScrollFactor(0);
        button.setDepth(2002);

        const buttonText = this.add.text(x, y, text, {
            fontSize: '24px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        buttonText.setScrollFactor(0);
        buttonText.setDepth(2003);

        // 호버 효과
        button.on('pointerover', () => {
            button.setFillStyle(0x6666ff);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x4444ff);
            buttonText.setScale(1);
        });

        button.on('pointerdown', () => {
            button.setFillStyle(0x3333cc);
        });

        button.on('pointerup', () => {
            button.setFillStyle(0x6666ff);
            if (onClick) {
                onClick();
            }
        });

        return { button, buttonText };
    }

    createImageButton(x, y, imageKey, onClick) {
        const button = this.add.image(x, y, imageKey);
        button.setScale(2); // 버튼 크기 조절
        button.setInteractive({ useHandCursor: true });
        button.setScrollFactor(0);
        button.setDepth(2002);

        // 호버 효과
        button.on('pointerover', () => {
            button.setScale(2.2);
            button.setTint(0xcccccc);
        });

        button.on('pointerout', () => {
            button.setScale(2);
            button.clearTint();
        });

        button.on('pointerdown', () => {
            button.setScale(2);
            button.setTint(0x888888);
        });

        button.on('pointerup', () => {
            button.setScale(2.2);
            button.clearTint();
            if (onClick) {
                onClick();
            }
        });

        return button;
    }

    resumeGame() {
        // 일시정지 해제
        this.scene.resume(this.scene.get('activeScene'));
        this.scene.stop('PauseScene');
    }

    restartGame() {
        // 현재 씬 재시작
        const activeScene = this.scene.get('activeScene');
        this.scene.stop('PauseScene');
        this.scene.stop(activeScene);
        this.scene.start(activeScene);
    }

    returnToMenu() {
        // 메인 메뉴로
        const activeScene = this.scene.get('activeScene');
        this.scene.stop('PauseScene');
        this.scene.stop(activeScene);
        this.scene.start('MainMenuScene');
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.PauseScene = PauseScene;
}
