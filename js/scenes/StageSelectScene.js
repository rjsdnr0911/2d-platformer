// 스테이지 선택 Scene
class StageSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StageSelectScene' });
    }

    create() {
        try {
            // 배경색
            this.cameras.main.setBackgroundColor(0x1a1a2e);

            // 저장 데이터 로드
            this.saveData = window.saveManager.load();

            // 타이틀
            const title = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                80,
                'STAGE SELECT',
                {
                    fontSize: '42px',
                    fill: '#fff',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 6
                }
            );
            title.setOrigin(0.5);

            // 스테이지 정보
            const stages = [
                {
                    number: 1,
                    name: 'Stage 1: 슬라임 숲',
                    description: '평화로운 숲을 침략한 슬라임들\n거대 슬라임을 물리쳐라!',
                    color: 0x4CAF50,
                    boss: '슬라임 킹'
                },
                {
                    number: 2,
                    name: 'Stage 2: 폐허의 성',
                    description: '검병들이 지키는 고대 성곽\n검의 달인을 이겨내라!',
                    color: 0xFF5722,
                    boss: '레드 나이트'
                },
                {
                    number: 3,
                    name: 'Stage 3: 마법 탑',
                    description: '강력한 마법이 소용돌이치는 탑\n대마법사를 격파하라!',
                    color: 0x9C27B0,
                    boss: '아크메이지'
                }
            ];

            // 스테이지 버튼 생성
            const startY = 180;
            const spacing = 130;

            stages.forEach((stage, index) => {
                const y = startY + (index * spacing);
                this.createStageButton(stage, y);
            });

            // 뒤로 가기 버튼
            this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                550,
                '메인 메뉴',
                () => {
                    this.scene.start('MainMenuScene');
                },
                0x555555
            );

            // 저장 데이터 초기화 버튼 (디버그용)
            if (CONSTANTS.GAME.DEBUG) {
                const resetButton = this.add.text(
                    CONSTANTS.GAME.WIDTH - 10,
                    CONSTANTS.GAME.HEIGHT - 10,
                    '진행도 초기화',
                    {
                        fontSize: '12px',
                        fill: '#ff0000',
                        backgroundColor: '#000',
                        padding: { x: 5, y: 3 }
                    }
                );
                resetButton.setOrigin(1, 1);
                resetButton.setInteractive({ useHandCursor: true });
                resetButton.on('pointerdown', () => {
                    window.saveManager.reset();
                    this.scene.restart();
                });
            }

            if (CONSTANTS.GAME.DEBUG) {
                console.log('스테이지 선택 화면 로드');
                console.log('저장 데이터:', this.saveData);
            }

        } catch (error) {
            console.error('StageSelectScene create 오류:', error);
        }
    }

    createStageButton(stage, y) {
        const isUnlocked = window.saveManager.isStageUnlocked(stage.number, this.saveData);
        const isCleared = window.saveManager.isStageCleared(stage.number, this.saveData);

        // 스테이지 컨테이너
        const container = this.add.container(CONSTANTS.GAME.WIDTH / 2, y);

        // 배경 박스
        const bgWidth = 500;
        const bgHeight = 100;
        const bg = this.add.rectangle(0, 0, bgWidth, bgHeight, stage.color, isUnlocked ? 0.8 : 0.3);
        bg.setStrokeStyle(3, 0xffffff, isUnlocked ? 1 : 0.3);

        // 잠금 표시
        if (!isUnlocked) {
            const lockIcon = this.add.text(0, 0, '🔒', {
                fontSize: '48px'
            });
            lockIcon.setOrigin(0.5);
            container.add([bg, lockIcon]);
            return;
        }

        // 스테이지 번호
        const numberText = this.add.text(-220, -25, `${stage.number}`, {
            fontSize: '48px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        numberText.setOrigin(0.5);

        // 스테이지 이름
        const nameText = this.add.text(-100, -25, stage.name, {
            fontSize: '20px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        nameText.setOrigin(0, 0.5);

        // 보스 이름
        const bossText = this.add.text(-100, 5, `보스: ${stage.boss}`, {
            fontSize: '14px',
            fill: '#ffff00'
        });
        bossText.setOrigin(0, 0.5);

        // 클리어 표시
        if (isCleared) {
            const clearIcon = this.add.text(220, 0, '✓', {
                fontSize: '42px',
                fill: '#00ff00',
                fontStyle: 'bold'
            });
            clearIcon.setOrigin(0.5);
            container.add(clearIcon);

            // 최단 시간
            const bestTime = this.saveData.bestTimes[stage.number];
            if (bestTime) {
                const timeText = this.add.text(-100, 25, `최단 기록: ${this.formatTime(bestTime)}`, {
                    fontSize: '12px',
                    fill: '#aaaaaa'
                });
                timeText.setOrigin(0, 0.5);
                container.add(timeText);
            }
        }

        container.add([bg, numberText, nameText, bossText]);

        // 인터랙티브 설정
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
            bg.setFillStyle(stage.color, 1);
            container.setScale(1.05);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(stage.color, 0.8);
            container.setScale(1);
        });
        bg.on('pointerdown', () => {
            bg.setFillStyle(stage.color, 0.6);
        });
        bg.on('pointerup', () => {
            bg.setFillStyle(stage.color, 1);
            this.startStage(stage.number);
        });
    }

    createButton(x, y, text, onClick, color = 0x4444ff) {
        const button = this.add.rectangle(x, y, 200, 50, color);
        button.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        button.on('pointerover', () => {
            button.setFillStyle(color + 0x222222);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setFillStyle(color);
            buttonText.setScale(1);
        });

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

    startStage(stageNumber) {
        // 선택된 스테이지 저장
        this.registry.set('selectedStage', stageNumber);

        // 게임 모드 확인
        const gameMode = this.registry.get('gameMode') || 'normal';

        if (gameMode === 'classSelect') {
            // 캐릭터 선택 모드: 직업 선택 화면으로
            this.scene.start('ClassSelectScene');
        } else {
            // 일반 모드: 바로 스테이지로 (근접/마법 전환)
            this.registry.set('selectedClass', 'normal'); // 일반 모드 표시

            // 스테이지 시작 시간 기록
            this.registry.set('stageStartTime', Date.now());

            const stageKey = `Stage${stageNumber}Scene`;
            this.scene.start(stageKey);
        }
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
    window.StageSelectScene = StageSelectScene;
}
