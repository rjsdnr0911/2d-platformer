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
                    this.scene.start('GameScene');
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
                'v0.3.0 - Phase 3',
                {
                    fontSize: '14px',
                    fill: '#888'
                }
            );
            version.setOrigin(1, 1);

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
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.MainMenuScene = MainMenuScene;
}
