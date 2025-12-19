// 직업 세트 선택 Scene
class JobSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'JobSelectScene' });
    }

    create() {
        try {
            // 배경색
            this.cameras.main.setBackgroundColor(0x0f0f1e);

            // 타이틀
            const title = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                50,
                '직업 세트 선택',
                {
                    fontFamily: 'Jua',
                    fontSize: '42px',
                    fill: '#fff',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 6
                }
            );
            title.setOrigin(0.5);

            // 안내 텍스트
            const guide = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                110,
                'Q/E 키로 전환 가능한 직업 세트를 선택하세요',
                {
                    fontFamily: 'Jua',
                    fontSize: '18px',
                    fill: '#ffff00'
                }
            );
            guide.setOrigin(0.5);

            // 직업 세트 데이터
            this.jobSets = {
                swordMagic: {
                    name: '검/마법 세트',
                    description: '근접과 원거리를 자유롭게\n전환하는 밸런스형 세트',
                    color: 0x4444ff,
                    recommended: true,
                    jobs: [
                        { name: '마법', description: '화염구와 순간이동' },
                        { name: '검술', description: '빠른 3연타와 회전 베기' }
                    ],
                    features: [
                        '✓ 초보자 추천',
                        '✓ 근접/원거리 밸런스',
                        '✓ 빠른 전환 속도'
                    ]
                },
                hammerBow: {
                    name: '해머/활 세트',
                    description: '강력한 파워와 정밀한\n저격을 겸비한 세트',
                    color: 0xff6b6b,
                    recommended: false,
                    jobs: [
                        { name: '활', description: '차징 화살과 분열 화살' },
                        { name: '해머', description: '지면 충격과 낙하 공격' }
                    ],
                    features: [
                        '✓ 높은 데미지',
                        '✓ 넓은 공격 범위',
                        '✓ 차별화된 플레이'
                    ]
                }
            };

            // 직업 세트 카드 배치
            this.createJobSetCards();

            // 뒤로가기 버튼
            this.createBackButton();

            if (CONSTANTS.GAME.DEBUG) {
                console.log('직업 세트 선택 화면 로드');
            }

        } catch (error) {
            console.error('JobSelectScene create 오류:', error);
        }
    }

    createJobSetCards() {
        const centerX = CONSTANTS.GAME.WIDTH / 2;
        const cardY = 340;
        const cardSpacing = 280;

        // 검/마법 세트 카드 (왼쪽)
        this.createJobSetCard(
            centerX - cardSpacing / 2,
            cardY,
            'swordMagic',
            this.jobSets.swordMagic
        );

        // 해머/활 세트 카드 (오른쪽)
        this.createJobSetCard(
            centerX + cardSpacing / 2,
            cardY,
            'hammerBow',
            this.jobSets.hammerBow
        );
    }

    createJobSetCard(x, y, setKey, setData) {
        const cardWidth = 240;
        const cardHeight = 340;

        // 카드 컨테이너
        const container = this.add.container(x, y);

        // 카드 배경
        const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x1a1a2e);
        cardBg.setStrokeStyle(3, 0x444444);
        cardBg.setInteractive({ useHandCursor: true });

        // 추천 배지 (검/마법 세트에만)
        if (setData.recommended) {
            const badge = this.add.rectangle(0, -cardHeight / 2 - 20, 100, 30, 0xffaa00);
            const badgeText = this.add.text(0, -cardHeight / 2 - 20, '추천', {
                fontFamily: 'Jua',
                fontSize: '16px',
                fill: '#fff',
                fontStyle: 'bold'
            });
            badgeText.setOrigin(0.5);
            container.add([badge, badgeText]);
        }

        // 카드 헤더
        const headerBg = this.add.rectangle(0, -cardHeight / 2 + 30, cardWidth, 60, setData.color);

        // 세트 이름
        const setName = this.add.text(0, -cardHeight / 2 + 30, setData.name, {
            fontFamily: 'Jua',
            fontSize: '22px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        setName.setOrigin(0.5);

        // 세트 설명
        const description = this.add.text(0, -cardHeight / 2 + 80, setData.description, {
            fontFamily: 'Jua',
            fontSize: '14px',
            fill: '#cccccc',
            align: 'center',
            wordWrap: { width: cardWidth - 30 },
            lineSpacing: 4
        });
        description.setOrigin(0.5, 0);

        // 직업 목록
        let jobListY = -cardHeight / 2 + 150;
        const jobListTitle = this.add.text(-cardWidth / 2 + 15, jobListY, '[ 포함 직업 ]', {
            fontFamily: 'Jua',
            fontSize: '14px',
            fill: setData.color,
            fontStyle: 'bold'
        });
        jobListTitle.setOrigin(0, 0);
        jobListY += 25;

        const jobTexts = [];
        setData.jobs.forEach(job => {
            const jobText = this.add.text(-cardWidth / 2 + 15, jobListY, `• ${job.name}: ${job.description}`, {
                fontFamily: 'Jua',
                fontSize: '12px',
                fill: '#aaaaaa',
                wordWrap: { width: cardWidth - 30 }
            });
            jobText.setOrigin(0, 0);
            jobTexts.push(jobText);
            jobListY += 28;
        });

        // 특징 목록
        jobListY += 10;
        const featureTitle = this.add.text(-cardWidth / 2 + 15, jobListY, '[ 특징 ]', {
            fontFamily: 'Jua',
            fontSize: '14px',
            fill: setData.color,
            fontStyle: 'bold'
        });
        featureTitle.setOrigin(0, 0);
        jobListY += 25;

        const featureTexts = [];
        setData.features.forEach(feature => {
            const featureText = this.add.text(-cardWidth / 2 + 15, jobListY, feature, {
                fontFamily: 'Jua',
                fontSize: '12px',
                fill: '#999999'
            });
            featureText.setOrigin(0, 0);
            featureTexts.push(featureText);
            jobListY += 20;
        });

        // 선택 버튼
        const selectButton = this.add.rectangle(0, cardHeight / 2 - 30, cardWidth - 20, 45, setData.color);
        selectButton.setInteractive({ useHandCursor: true });

        const selectButtonText = this.add.text(0, cardHeight / 2 - 30, '선택하기 ▶', {
            fontFamily: 'Jua',
            fontSize: '18px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        selectButtonText.setOrigin(0.5);

        // 컨테이너에 추가
        container.add([cardBg, headerBg, setName, description, jobListTitle, ...jobTexts, featureTitle, ...featureTexts, selectButton, selectButtonText]);

        // 호버 효과
        cardBg.on('pointerover', () => {
            cardBg.setStrokeStyle(4, setData.color);
            container.setScale(1.05);
            this.tweens.add({
                targets: container,
                y: y - 10,
                duration: 200,
                ease: 'Power2'
            });
        });

        cardBg.on('pointerout', () => {
            cardBg.setStrokeStyle(3, 0x444444);
            container.setScale(1);
            this.tweens.add({
                targets: container,
                y: y,
                duration: 200,
                ease: 'Power2'
            });
        });

        selectButton.on('pointerover', () => {
            selectButton.setFillStyle(setData.color + 0x222222);
            selectButtonText.setScale(1.1);
        });

        selectButton.on('pointerout', () => {
            selectButton.setFillStyle(setData.color);
            selectButtonText.setScale(1);
        });

        // 클릭 이벤트
        selectButton.on('pointerup', () => {
            this.selectJobSet(setKey);
        });

        cardBg.on('pointerup', () => {
            this.selectJobSet(setKey);
        });
    }

    selectJobSet(setKey) {
        try {
            // 선택된 직업 세트 저장
            this.registry.set('selectedJobSet', setKey);

            // 선택 효과
            this.cameras.main.flash(200, 255, 255, 255);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('선택된 직업 세트:', setKey);
            }

            // 게임 모드 확인
            const gameMode = this.registry.get('gameMode');

            // 잠시 후 다음 씬으로 전환
            this.time.delayedCall(200, () => {
                if (gameMode === 'bossRush') {
                    // 보스 러쉬 모드: 바로 시작
                    this.scene.start('BossRushScene');
                } else {
                    // 일반 모드: 스테이지 선택 화면으로
                    this.scene.start('StageSelectScene');
                }
            });

        } catch (error) {
            console.error('selectJobSet 오류:', error);
        }
    }

    createBackButton() {
        const button = this.add.rectangle(80, 550, 140, 45, 0x333333);
        button.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(80, 550, '← 뒤로가기', {
            fontFamily: 'Jua',
            fontSize: '18px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // 호버 효과
        button.on('pointerover', () => {
            button.setFillStyle(0x555555);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x333333);
            buttonText.setScale(1);
        });

        // 클릭 이벤트
        button.on('pointerup', () => {
            this.scene.start('MainMenuScene');
        });
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.JobSelectScene = JobSelectScene;
}
