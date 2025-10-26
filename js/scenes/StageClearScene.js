// 스테이지 클리어 Scene
class StageClearScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StageClearScene' });
    }

    create() {
        try {
            // 배경색
            this.cameras.main.setBackgroundColor(0x1a1a2e);

            // 클리어한 스테이지 정보 가져오기
            this.clearedStage = this.registry.get('currentStage');
            this.clearTime = this.registry.get('clearTime');
            this.currentScore = this.registry.get('currentScore') || 0;

            // 난이도 정보
            this.difficulty = window.difficultyManager.getDifficulty();
            this.difficultyInfo = window.difficultyManager.getDifficultyInfo();

            // 저장 데이터 로드
            this.saveData = window.saveManager.load();

            // 스테이지 키 생성
            const stageKey = `Stage${this.clearedStage}Scene`;

            // 스테이지 정보
            const stageNames = {
                1: 'Stage 1: 슬라임 숲',
                2: 'Stage 2: 폐허의 성',
                3: 'Stage 3: 마법 탑'
            };

            const stageColors = {
                1: 0x4CAF50,
                2: 0xFF5722,
                3: 0x9C27B0
            };

            // 클리어 타이틀
            const clearTitle = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                80,
                '🎉 STAGE CLEAR! 🎉',
                {
                    fontSize: '48px',
                    fill: '#ffff00',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 6
                }
            );
            clearTitle.setOrigin(0.5);

            // 스테이지 이름
            const stageName = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                150,
                stageNames[this.clearedStage],
                {
                    fontSize: '32px',
                    fill: '#ffffff',
                    fontStyle: 'bold'
                }
            );
            stageName.setOrigin(0.5);

            // 난이도 표시
            const difficultyText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                200,
                `난이도: ${this.difficultyInfo.name}`,
                {
                    fontSize: '20px',
                    fill: this.difficultyInfo.color,
                    fontStyle: 'bold'
                }
            );
            difficultyText.setOrigin(0.5);

            // 클리어 시간
            const timeText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                240,
                `클리어 시간: ${this.formatTime(this.clearTime)}`,
                {
                    fontSize: '20px',
                    fill: '#ffffff',
                    backgroundColor: '#00000088',
                    padding: { x: 15, y: 8 }
                }
            );
            timeText.setOrigin(0.5);

            // 점수 표시
            const scoreText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                280,
                `점수: ${window.scoreManager.formatScore(this.currentScore)}`,
                {
                    fontSize: '24px',
                    fill: '#ffff00',
                    fontStyle: 'bold',
                    backgroundColor: '#00000088',
                    padding: { x: 20, y: 10 }
                }
            );
            scoreText.setOrigin(0.5);

            // 최고 점수 체크 및 저장
            const previousHighScore = window.scoreManager.getHighScore(stageKey, this.difficulty);
            const isNewRecord = window.scoreManager.saveHighScore(stageKey, this.difficulty, this.currentScore);

            let recordText = '';
            if (isNewRecord) {
                recordText = '🏆 신기록! 🏆';
            } else {
                recordText = `최고 점수: ${window.scoreManager.formatScore(previousHighScore)}`;
            }

            const recordDisplay = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                320,
                recordText,
                {
                    fontSize: '20px',
                    fill: isNewRecord ? '#ffff00' : '#aaaaaa',
                    fontStyle: 'bold'
                }
            );
            recordDisplay.setOrigin(0.5);

            // 다음 스테이지 해금 알림
            const nextStage = this.clearedStage + 1;
            if (nextStage <= 3) {
                const unlockText = this.add.text(
                    CONSTANTS.GAME.WIDTH / 2,
                    370,
                    `✨ ${stageNames[nextStage]} 해금! ✨`,
                    {
                        fontSize: '22px',
                        fill: '#00ff00',
                        fontStyle: 'bold',
                        stroke: '#000',
                        strokeThickness: 3
                    }
                );
                unlockText.setOrigin(0.5);
            } else {
                // 모든 스테이지 클리어
                const allClearText = this.add.text(
                    CONSTANTS.GAME.WIDTH / 2,
                    370,
                    '🎊 모든 스테이지 클리어! 🎊',
                    {
                        fontSize: '26px',
                        fill: '#ff00ff',
                        fontStyle: 'bold',
                        stroke: '#000',
                        strokeThickness: 4
                    }
                );
                allClearText.setOrigin(0.5);
            }

            // 버튼 생성
            const buttonY = 460;
            const buttonSpacing = 70;

            // 스테이지 선택으로 돌아가기
            this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                buttonY,
                '스테이지 선택',
                () => {
                    this.scene.start('StageSelectScene');
                },
                0x4444ff
            );

            // 다음 스테이지 시작 (있을 경우)
            if (nextStage <= 3) {
                this.createButton(
                    CONSTANTS.GAME.WIDTH / 2,
                    buttonY + buttonSpacing,
                    `다음 스테이지 →`,
                    () => {
                        // 스테이지 시작 시간 저장
                        this.registry.set('stageStartTime', Date.now());
                        this.registry.set('currentStage', nextStage);
                        this.scene.start(`Stage${nextStage}Scene`);
                    },
                    stageColors[nextStage]
                );
            }

            // 메인 메뉴
            this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                buttonY + (nextStage <= 3 ? buttonSpacing * 2 : buttonSpacing),
                '메인 메뉴',
                () => {
                    this.scene.start('MainMenuScene');
                },
                0x555555
            );

            // 축하 애니메이션
            this.tweens.add({
                targets: clearTitle,
                scale: 1.1,
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            if (CONSTANTS.GAME.DEBUG) {
                console.log('스테이지 클리어 화면 로드');
                console.log('클리어한 스테이지:', this.clearedStage);
                console.log('클리어 시간:', this.clearTime);
            }

        } catch (error) {
            console.error('StageClearScene create 오류:', error);
        }
    }

    createButton(x, y, text, onClick, color = 0x4444ff) {
        // 버튼 배경
        const button = this.add.rectangle(x, y, 250, 50, color);
        button.setInteractive({ useHandCursor: true });

        // 버튼 텍스트
        const buttonText = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // 호버 효과
        button.on('pointerover', () => {
            button.setFillStyle(color + 0x222222);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setFillStyle(color);
            buttonText.setScale(1);
        });

        // 클릭 이벤트
        button.on('pointerdown', () => {
            button.setFillStyle(color - 0x111111);
        });

        button.on('pointerup', () => {
            button.setFillStyle(color + 0x222222);
            if (onClick) {
                onClick();
            }
        });

        return { button, buttonText };
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.StageClearScene = StageClearScene;
}
