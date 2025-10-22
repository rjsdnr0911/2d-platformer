// 게임 오버 Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        try {
            // 배경색 (어두운 빨강)
            this.cameras.main.setBackgroundColor(0x330000);

            // 페이드 인 효과
            this.cameras.main.fadeIn(500);

            // GAME OVER 텍스트
            const gameOverText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                150,
                'GAME OVER',
                {
                    fontSize: '64px',
                    fill: '#ff0000',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 8
                }
            );
            gameOverText.setOrigin(0.5);

            // 깜빡임 효과
            this.tweens.add({
                targets: gameOverText,
                alpha: 0.5,
                duration: 500,
                yoyo: true,
                repeat: -1
            });

            // 재시작 버튼
            this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                300,
                '다시 시작',
                () => {
                    this.scene.start('GameScene');
                }
            );

            // 메인 메뉴 버튼
            this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                380,
                '메인 메뉴',
                () => {
                    this.scene.start('MainMenuScene');
                }
            );

            // 힌트 텍스트
            const hintText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                480,
                '팁: 능력을 교체하면 특별한 효과가 발동됩니다!\n각 능력의 교체 효과를 활용해보세요.',
                {
                    fontSize: '16px',
                    fill: '#ffff88',
                    align: 'center'
                }
            );
            hintText.setOrigin(0.5);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('게임 오버 화면 로드');
            }

        } catch (error) {
            console.error('GameOverScene create 오류:', error);
        }
    }

    createButton(x, y, text, onClick) {
        // 버튼 배경
        const button = this.add.rectangle(x, y, 220, 50, 0x444444);
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
            button.setFillStyle(0x666666);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x444444);
            buttonText.setScale(1);
        });

        // 클릭 이벤트
        button.on('pointerdown', () => {
            button.setFillStyle(0x222222);
        });

        button.on('pointerup', () => {
            button.setFillStyle(0x666666);
            if (onClick) {
                onClick();
            }
        });

        return { button, buttonText };
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.GameOverScene = GameOverScene;
}
