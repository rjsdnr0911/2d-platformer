// 메인 메뉴 Scene
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        try {
            // 배경색
            this.cameras.main.setBackgroundColor(CONSTANTS.COLORS.SKY);

            // 타이틀
            const title = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                150,
                '2D PLATFORMER',
                {
                    fontSize: '48px',
                    fill: '#fff',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 6
                }
            );
            title.setOrigin(0.5);

            // 부제
            const subtitle = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                220,
                '능력을 바꿔가며 적을 물리쳐라!',
                {
                    fontSize: '20px',
                    fill: '#ffff00'
                }
            );
            subtitle.setOrigin(0.5);

            // 시작 버튼
            const startButton = this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                300,
                '게임 시작',
                () => {
                    this.scene.start('StageSelectScene');
                }
            );

            // 조작법 표시
            const controls = [
                '[ 조작법 ]',
                '',
                '← → : 이동',
                '↑ : 점프',
                'Shift : 대시',
                '',
                'Z : 기본 공격',
                'X : 강 공격',
                'C : 특수 스킬',
                '',
                'Q / E : 능력 교체'
            ];

            const controlsText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                420,
                controls.join('\n'),
                {
                    fontSize: '16px',
                    fill: '#fff',
                    backgroundColor: '#00000088',
                    padding: { x: 20, y: 15 },
                    align: 'center'
                }
            );
            controlsText.setOrigin(0.5);

            // 버전 정보
            const version = this.add.text(
                CONSTANTS.GAME.WIDTH - 10,
                CONSTANTS.GAME.HEIGHT - 10,
                'v0.5.0 - Phase 5 (진행중)',
                {
                    fontSize: '14px',
                    fill: '#888'
                }
            );
            version.setOrigin(1, 1);

            // 전체화면 버튼
            this.createFullscreenButton();

            if (CONSTANTS.GAME.DEBUG) {
                console.log('메인 메뉴 로드 완료');
            }

        } catch (error) {
            console.error('MainMenuScene create 오류:', error);
        }
    }

    createButton(x, y, text, onClick) {
        // 버튼 배경
        const button = this.add.rectangle(x, y, 200, 50, 0x4444ff);
        button.setInteractive({ useHandCursor: true });

        // 버튼 텍스트
        const buttonText = this.add.text(x, y, text, {
            fontSize: '24px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // 호버 효과
        button.on('pointerover', () => {
            button.setFillStyle(0x6666ff);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x4444ff);
            buttonText.setScale(1);
        });

        // 클릭 이벤트
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

    createFullscreenButton() {
        // 전체화면 버튼 (오른쪽 상단)
        const buttonSize = 40;
        const margin = 10;

        const fullscreenButton = this.add.rectangle(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2,
            margin + buttonSize / 2,
            buttonSize,
            buttonSize,
            0x333333,
            0.8
        );
        fullscreenButton.setInteractive({ useHandCursor: true });
        fullscreenButton.setScrollFactor(0);
        fullscreenButton.setDepth(1000);

        // 아이콘 텍스트 (전체화면 모드에 따라 변경)
        const iconText = this.add.text(
            CONSTANTS.GAME.WIDTH - margin - buttonSize / 2,
            margin + buttonSize / 2,
            this.scale.isFullscreen ? '⊡' : '⊞',
            {
                fontSize: '24px',
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        iconText.setOrigin(0.5);
        iconText.setScrollFactor(0);
        iconText.setDepth(1001);

        // 호버 효과
        fullscreenButton.on('pointerover', () => {
            fullscreenButton.setFillStyle(0x555555, 0.9);
            iconText.setScale(1.1);
        });

        fullscreenButton.on('pointerout', () => {
            fullscreenButton.setFillStyle(0x333333, 0.8);
            iconText.setScale(1);
        });

        // 클릭 이벤트 - 전체화면 토글
        fullscreenButton.on('pointerdown', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        });

        // 전체화면 상태 변경 감지
        this.scale.on('fullscreenchange', () => {
            iconText.setText(this.scale.isFullscreen ? '⊡' : '⊞');
        });

        return { fullscreenButton, iconText };
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.MainMenuScene = MainMenuScene;
}
