// 로그라이크 모드 전용 메뉴 Scene
class RoguelikeMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RoguelikeMenuScene' });
    }

    preload() {
        // 로그라이크 전용 배경 이미지 (추후 추가 예정)
        // this.load.image('roguelikeBG', 'assets/roguelike/menu_bg.jpg');
    }

    create() {
        // 임시 배경 (어두운 보라색 그라데이션)
        this.cameras.main.setBackgroundColor('#1a0033');

        // 어두운 오버레이
        const overlay = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0x000000,
            0.5
        );

        // 타이틀
        const title = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            100,
            'NEXUS DUNGEON',
            {
                fontFamily: 'Orbitron',
                fontSize: '56px',
                fill: '#9D4EDD',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 6
            }
        );
        title.setOrigin(0.5);

        // 타이틀 빛나는 효과
        this.tweens.add({
            targets: title,
            alpha: 0.7,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 부제
        const subtitle = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            160,
            '━━━━━━━━━━━━━━━━━━━━',
            {
                fontSize: '20px',
                fill: '#9D4EDD'
            }
        );
        subtitle.setOrigin(0.5);

        const subtitle2 = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            185,
            '스컬을 교체하며 던전을 정복하라!',
            {
                fontFamily: 'Jua',
                fontSize: '20px',
                fill: '#E0AAFF'
            }
        );
        subtitle2.setOrigin(0.5);

        // 버튼들
        this.createButton(
            CONSTANTS.GAME.WIDTH / 2,
            260,
            '🎮 게임 시작',
            () => {
                this.showSkullSelection();
            },
            0x9D4EDD
        );

        this.createButton(
            CONSTANTS.GAME.WIDTH / 2,
            330,
            '📊 통계 보기',
            () => {
                // Phase 3에서 구현 예정
                this.showComingSoon('통계 시스템은 곧 추가됩니다!');
            },
            0x7209B7
        );

        this.createButton(
            CONSTANTS.GAME.WIDTH / 2,
            400,
            '❓ 도움말',
            () => {
                // Phase 3에서 구현 예정
                this.showHelpDialog();
            },
            0x560BAD
        );

        this.createButton(
            CONSTANTS.GAME.WIDTH / 2,
            470,
            '⬅️ 메인 메뉴로',
            () => {
                this.scene.start('MainMenuScene');
            },
            0x3C096C
        );

        // 버전 정보
        const version = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT - 20,
            'Roguelike Mode - Phase 1 (개발 중)',
            {
                fontFamily: 'Orbitron',
                fontSize: '14px',
                fill: '#888',
                align: 'center'
            }
        );
        version.setOrigin(0.5);
    }

    createButton(x, y, text, callback, color = 0x9D4EDD) {
        // 버튼 배경
        const button = this.add.rectangle(x, y, 280, 55, color);
        button.setInteractive({ useHandCursor: true });

        // 버튼 텍스트
        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Jua',
            fontSize: '28px',
            fill: '#FFFFFF',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // 색상 계산
        const lightenColor = (hexColor) => {
            const r = Math.min(255, ((hexColor >> 16) & 0xFF) + 0x33);
            const g = Math.min(255, ((hexColor >> 8) & 0xFF) + 0x33);
            const b = Math.min(255, (hexColor & 0xFF) + 0x33);
            return (r << 16) | (g << 8) | b;
        };

        const hoverColor = lightenColor(color);

        // 호버 효과
        button.on('pointerover', () => {
            button.setFillStyle(hoverColor);
            buttonText.setScale(1.05);

            // 글로우 효과
            this.tweens.add({
                targets: button,
                alpha: 0.8,
                duration: 200,
                yoyo: true
            });
        });

        button.on('pointerout', () => {
            button.setFillStyle(color);
            buttonText.setScale(1.0);
            button.setAlpha(1);
        });

        // 클릭 이벤트
        button.on('pointerup', () => {
            if (callback) {
                callback();
            }
        });

        return { button, buttonText };
    }

    showSkullSelection() {
        // 임시 - Phase 1에서 구현 예정
        this.showComingSoon('스컬 선택 화면은 곧 추가됩니다!\n\nPhase 1에서 구현 중...');
    }

    showHelpDialog() {
        // 도움말 팝업
        const bg = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            600,
            400,
            0x000000,
            0.95
        );
        bg.setInteractive();
        bg.setDepth(1000);

        const border = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            600,
            400
        );
        border.setStrokeStyle(4, 0x9D4EDD);
        border.setDepth(1000);

        const helpText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2 - 150,
            '🎮 로그라이크 모드 가이드',
            {
                fontFamily: 'Jua',
                fontSize: '28px',
                fill: '#9D4EDD',
                fontStyle: 'bold'
            }
        );
        helpText.setOrigin(0.5);
        helpText.setDepth(1001);

        const content = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2 - 50,
            [
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                '',
                '• 스컬(직업)을 교체하며 전투',
                '• SPACE 키로 스컬 교체 (2초 쿨다운)',
                '• 최대 2개의 스컬 장착 가능',
                '• 다양한 아이템으로 빌드 구성',
                '• 죽으면 처음부터 다시 시작',
                '',
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                '',
                '클릭하여 닫기'
            ].join('\n'),
            {
                fontFamily: 'Jua',
                fontSize: '18px',
                fill: '#E0AAFF',
                align: 'center',
                lineSpacing: 5
            }
        );
        content.setOrigin(0.5);
        content.setDepth(1001);

        // 닫기 버튼
        const closeButton = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2 + 160,
            '[ 확인 ]',
            {
                fontFamily: 'Jua',
                fontSize: '24px',
                fill: '#FFD700',
                fontStyle: 'bold'
            }
        );
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.setDepth(1001);

        // 닫기 이벤트
        const closeDialog = () => {
            bg.destroy();
            border.destroy();
            helpText.destroy();
            content.destroy();
            closeButton.destroy();
        };

        bg.on('pointerup', closeDialog);
        closeButton.on('pointerup', closeDialog);

        // 호버 효과
        closeButton.on('pointerover', () => {
            closeButton.setScale(1.1);
        });
        closeButton.on('pointerout', () => {
            closeButton.setScale(1.0);
        });
    }

    showComingSoon(message) {
        // 준비 중 메시지
        const bg = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            500,
            250,
            0x000000,
            0.95
        );
        bg.setInteractive();
        bg.setDepth(1000);

        const border = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            500,
            250
        );
        border.setStrokeStyle(4, 0x9D4EDD);
        border.setDepth(1000);

        const text = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2 - 30,
            message,
            {
                fontFamily: 'Jua',
                fontSize: '24px',
                fill: '#E0AAFF',
                align: 'center',
                lineSpacing: 10
            }
        );
        text.setOrigin(0.5);
        text.setDepth(1001);

        const closeButton = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2 + 80,
            '[ 확인 ]',
            {
                fontFamily: 'Jua',
                fontSize: '24px',
                fill: '#FFD700',
                fontStyle: 'bold'
            }
        );
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.setDepth(1001);

        // 닫기 이벤트
        const closeDialog = () => {
            bg.destroy();
            border.destroy();
            text.destroy();
            closeButton.destroy();
        };

        bg.on('pointerup', closeDialog);
        closeButton.on('pointerup', closeDialog);

        // 호버 효과
        closeButton.on('pointerover', () => {
            closeButton.setScale(1.1);
        });
        closeButton.on('pointerout', () => {
            closeButton.setScale(1.0);
        });
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RoguelikeMenuScene = RoguelikeMenuScene;
}
