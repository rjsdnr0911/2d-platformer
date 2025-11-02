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
                'NEXUS',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '64px',
                    fill: '#00FFFF',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 8
                }
            );
            title.setOrigin(0.5);

            // 타이틀 빛나는 효과
            this.tweens.add({
                targets: title,
                alpha: 0.7,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // 부제
            const subtitle = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                220,
                '능력을 바꿔가며 적을 물리쳐라!',
                {
                    fontFamily: 'Jua',
                    fontSize: '20px',
                    fill: '#ffff00'
                }
            );
            subtitle.setOrigin(0.5);

            // 난이도 선택
            this.createDifficultyButtons();

            // 게임 모드 버튼들 (가로 배치)
            const centerX = CONSTANTS.GAME.WIDTH / 2;
            const buttonSpacing = 115; // 버튼 간격 (줄임)

            // 일반 게임 버튼 (왼쪽)
            const normalButton = this.createButton(
                centerX - buttonSpacing,
                360,
                '일반 게임',
                () => {
                    // 일반 모드: 직업 세트 선택 후 Stage1 시작
                    this.registry.set('gameMode', 'normal');
                    this.scene.start('JobSelectScene');
                }
            );

            // 보스 러쉬 모드 버튼 (오른쪽)
            const bossRushButton = this.createButton(
                centerX + buttonSpacing,
                360,
                '보스 러쉬 모드',
                () => {
                    // 보스 러쉬 모드: 직업 세트 선택 후 시작
                    this.registry.set('gameMode', 'bossRush');
                    this.scene.start('JobSelectScene');
                },
                0xFF4444 // 빨간색
            );

            // 최고 점수 표시 (아래로 이동)
            this.highScoreText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                460,
                '',
                {
                    fontFamily: 'Jua',
                    fontSize: '14px',
                    fill: '#fff',
                    backgroundColor: '#00000088',
                    padding: { x: 12, y: 8 },
                    align: 'center'
                }
            );
            this.highScoreText.setOrigin(0.5);
            this.updateHighScoreDisplay();

            // 버전 정보
            const version = this.add.text(
                CONSTANTS.GAME.WIDTH - 10,
                CONSTANTS.GAME.HEIGHT - 10,
                'v0.5.0 - Phase 5 (진행중)',
                {
                    fontFamily: 'Orbitron',
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

    createButton(x, y, text, onClick, color = 0x4444ff) {
        // 버튼 배경
        const button = this.add.rectangle(x, y, 200, 50, color);
        button.setInteractive({ useHandCursor: true });

        // 버튼 텍스트
        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Jua',
            fontSize: '24px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // 색상 계산 (밝기 조절용)
        const lightenColor = (hexColor) => {
            const r = Math.min(255, ((hexColor >> 16) & 0xFF) + 0x22);
            const g = Math.min(255, ((hexColor >> 8) & 0xFF) + 0x22);
            const b = Math.min(255, (hexColor & 0xFF) + 0x22);
            return (r << 16) | (g << 8) | b;
        };

        const darkenColor = (hexColor) => {
            const r = Math.max(0, ((hexColor >> 16) & 0xFF) - 0x11);
            const g = Math.max(0, ((hexColor >> 8) & 0xFF) - 0x11);
            const b = Math.max(0, (hexColor & 0xFF) - 0x11);
            return (r << 16) | (g << 8) | b;
        };

        const hoverColor = lightenColor(color);
        const pressColor = darkenColor(color);

        // 호버 효과
        button.on('pointerover', () => {
            button.setFillStyle(hoverColor);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setFillStyle(color);
            buttonText.setScale(1);
        });

        // 클릭 이벤트
        button.on('pointerdown', () => {
            button.setFillStyle(pressColor);
        });

        button.on('pointerup', () => {
            button.setFillStyle(hoverColor);
            if (onClick) {
                onClick();
            }
        });

        return { button, buttonText };
    }

    createDifficultyButtons() {
        const centerX = CONSTANTS.GAME.WIDTH / 2;
        const y = 290;
        const buttonWidth = 100;
        const spacing = 120;

        // 난이도 레이블
        const label = this.add.text(
            centerX,
            y - 30,
            '[ 난이도 ]',
            {
                fontFamily: 'Jua',
                fontSize: '18px',
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        label.setOrigin(0.5);

        // 현재 난이도
        const currentDifficulty = window.difficultyManager.getDifficulty();
        const difficulties = window.difficultyManager.getAllDifficulties();

        this.difficultyButtons = [];

        difficulties.forEach((diff, index) => {
            const xPos = centerX + (index - 1) * spacing;
            const isSelected = diff.key === currentDifficulty;

            // 버튼 배경
            const button = this.add.rectangle(
                xPos,
                y,
                buttonWidth,
                40,
                isSelected ? 0xffffff : 0x666666
            );
            button.setInteractive({ useHandCursor: true });

            // 버튼 텍스트
            const buttonText = this.add.text(
                xPos,
                y,
                diff.name,
                {
                    fontFamily: 'Jua',
                    fontSize: '20px',
                    fill: isSelected ? '#000' : '#fff',
                    fontStyle: 'bold'
                }
            );
            buttonText.setOrigin(0.5);

            // 호버 효과
            button.on('pointerover', () => {
                if (!isSelected) {
                    button.setFillStyle(0x888888);
                }
                buttonText.setScale(1.1);
            });

            button.on('pointerout', () => {
                button.setFillStyle(isSelected ? 0xffffff : 0x666666);
                buttonText.setScale(1);
            });

            // 클릭 이벤트
            button.on('pointerup', () => {
                // 난이도 변경
                window.difficultyManager.setDifficulty(diff.key);

                // 모든 버튼 업데이트
                this.updateDifficultyButtons();

                // 최고점수 표시 업데이트
                this.updateHighScoreDisplay();
            });

            this.difficultyButtons.push({ button, buttonText, key: diff.key });
        });
    }

    updateDifficultyButtons() {
        const currentDifficulty = window.difficultyManager.getDifficulty();

        this.difficultyButtons.forEach(item => {
            const isSelected = item.key === currentDifficulty;
            item.button.setFillStyle(isSelected ? 0xffffff : 0x666666);
            item.buttonText.setStyle({
                fill: isSelected ? '#000' : '#fff'
            });
        });
    }

    updateHighScoreDisplay() {
        const currentDifficulty = window.difficultyManager.getDifficulty();
        const diffInfo = window.difficultyManager.getDifficultyInfo();
        const scores = window.scoreManager.getAllHighScores(currentDifficulty);

        const stageNames = {
            'Stage1Scene': '슬라임 숲',
            'Stage2Scene': '폐허 성',
            'Stage3Scene': '마법 탑'
        };

        const scoreLines = [
            `[ ${diffInfo.name} 난이도 최고 점수 ]`,
            ''
        ];

        Object.keys(scores).forEach(stageKey => {
            const stageName = stageNames[stageKey] || stageKey;
            const score = scores[stageKey];
            scoreLines.push(`${stageName}: ${window.scoreManager.formatScore(score)}`);
        });

        const totalScore = window.scoreManager.getTotalHighScore(currentDifficulty);
        scoreLines.push('');
        scoreLines.push(`총합: ${window.scoreManager.formatScore(totalScore)}`);

        this.highScoreText.setText(scoreLines.join('\n'));
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
                fontFamily: 'Orbitron',
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
