// 직업 선택 Scene
class ClassSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClassSelectScene' });
        this.currentView = 'list'; // 'list' or 'detail'
        this.selectedClassKey = null;
    }

    create() {
        try {
            // 배경색
            this.cameras.main.setBackgroundColor(0x0f0f1e);

            // 선택된 스테이지 정보 가져오기
            this.selectedStage = this.registry.get('selectedStage') || 1;

            // 스테이지 이름
            this.stageNames = {
                1: 'Stage 1: 슬라임 숲',
                2: 'Stage 2: 폐허의 성',
                3: 'Stage 3: 마법 탑'
            };

            // 직업 데이터 (확장 가능하도록 자세한 정보 추가)
            this.classes = {
                warrior: {
                    name: '근접 전사',
                    description: '강력한 근접 공격으로\n적을 섬멸하는 전사',
                    detailedDescription: '검을 휘두르며 적진을 파고드는 근접 전투의 달인입니다.\n빠른 3연타 공격과 회전 베기로 다수의 적을 제압하며,\n강력한 돌진 베기로 단숨에 전황을 뒤집을 수 있습니다.\n\n초보자에게 추천하는 밸런스형 직업입니다.',
                    color: 0xff6b6b,
                    skills: [
                        '• 기본 공격 (Z): 검 베기 3연타',
                        '  빠르게 3번 베어 적을 압박합니다',
                        '',
                        '• 강공격 (X): 회전 베기',
                        '  주변의 모든 적을 한 번에 베어냅니다',
                        '',
                        '• 궁극기 (C): 돌진 베기',
                        '  전방으로 돌진하며 강력한 일격을 날립니다'
                    ],
                    stats: {
                        '난이도': '★★☆☆☆',
                        '공격력': '★★★☆☆',
                        '공격 속도': '★★★★☆',
                        '사거리': '★★☆☆☆',
                        '생존력': '★★★☆☆'
                    },
                    locked: false
                },
                wizard: {
                    name: '마법사',
                    description: '강력한 원거리 마법으로\n적을 소탕하는 마법사',
                    detailedDescription: '고대의 비전 마법을 다루는 원거리 전투의 대가입니다.\n마법 화살로 안전한 거리에서 적을 공격하고,\n순간이동으로 위험에서 벗어나며,\n마법 폭발로 전장을 초토화시킬 수 있습니다.\n\n원거리 전투를 선호하는 플레이어에게 추천합니다.',
                    color: 0x4ecdc4,
                    skills: [
                        '• 기본 공격 (Z): 마법 화살',
                        '  빠른 속도의 마법 화살을 발사합니다',
                        '',
                        '• 강공격 (X): 순간이동',
                        '  마우스 방향으로 순간이동하여 위험을 회피합니다',
                        '',
                        '• 궁극기 (C): 마법 폭발',
                        '  주변에 강력한 마법 폭발을 일으킵니다'
                    ],
                    stats: {
                        '난이도': '★★★☆☆',
                        '공격력': '★★★★☆',
                        '공격 속도': '★★★☆☆',
                        '사거리': '★★★★★',
                        '생존력': '★★☆☆☆'
                    },
                    locked: false
                },
                weaponmaster: {
                    name: '웨폰마스터',
                    description: '3가지 폼을 전환하며\n전투하는 마스터',
                    detailedDescription: '모든 무기를 자유자재로 다루는 전투의 마스터입니다.\n수호의 기사, 황혼의 궁수, 정령 마법사 세 가지 폼을\nQ/E 키로 실시간 전환하며 상황에 맞는 전술을 구사합니다.\n\n각 폼마다 고유한 공격 방식을 가지고 있어\n높은 숙련도가 요구되는 고난이도 직업입니다.',
                    color: 0xffd700,
                    skills: [
                        '• 폼 전환 (Q/E): 3가지 폼 변경',
                        '  전투 중 언제든지 폼을 전환할 수 있습니다',
                        '',
                        '• 수호의 기사: 근접 전투 특화',
                        '  검과 충격파로 적을 제압합니다',
                        '',
                        '• 황혼의 궁수: 원거리 콤보 특화',
                        '  연속 공격으로 데미지를 증폭시킵니다',
                        '',
                        '• 정령 마법사: 원소 마법 특화',
                        '  화염과 물의 정령으로 다채로운 공격을 펼칩니다'
                    ],
                    stats: {
                        '난이도': '★★★★★',
                        '공격력': '★★★★☆',
                        '공격 속도': '★★★★☆',
                        '사거리': '★★★★☆',
                        '생존력': '★★★☆☆'
                    },
                    locked: false // TODO: 나중에 true로 변경
                },
                fighter: {
                    name: '무투가',
                    description: '분노를 쌓아 강해지는\n격투가',
                    detailedDescription: '맨손으로 적과 맞서는 분노의 격투가입니다.\n공격할수록 쌓이는 분노 게이지로 데미지가 증가하며,\n최대 분노 시 적의 시간을 느리게 만드는 압도적인 힘을 발휘합니다.\n\n짧은 사거리를 빠른 기동력으로 극복하는\n공격적인 플레이어에게 추천합니다.',
                    color: 0xff4444,
                    skills: [
                        '• 패시브: 분노 게이지 시스템',
                        '  공격 시 분노 게이지가 쌓여 데미지 증가 (최대 1.5배)',
                        '  최대 분노 시 3초간 적의 시간을 느리게 만듭니다',
                        '',
                        '• 기본 공격 (Z): 빠른 잽',
                        '  매우 빠른 속도로 주먹을 날립니다',
                        '',
                        '• 강공격 (X): 가드 브레이크',
                        '  슈퍼 아머 상태로 강력한 일격을 날립니다',
                        '',
                        '• 궁극기 (C): 엘보우 드롭',
                        '  어퍼컷 → 공중 콤보 → 강력한 착지 공격'
                    ],
                    stats: {
                        '난이도': '★★★★☆',
                        '공격력': '★★★★★',
                        '공격 속도': '★★★★★',
                        '사거리': '★☆☆☆☆',
                        '생존력': '★★★★☆'
                    },
                    locked: false
                }
            };

            // 직업 목록 화면 표시
            this.showClassList();

            if (CONSTANTS.GAME.DEBUG) {
                console.log('직업 선택 화면 로드');
            }

        } catch (error) {
            console.error('ClassSelectScene create 오류:', error);
        }
    }

    showClassList() {
        try {
            // 기존 요소들 정리
            this.children.removeAll();
            this.currentView = 'list';

            // 제목
            const title = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                50,
                '직업 선택',
                {
                    fontSize: '42px',
                    fill: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 6
                }
            );
            title.setOrigin(0.5);

            // 스테이지 이름 표시
            const stageNameText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                100,
                this.stageNames[this.selectedStage],
                {
                    fontSize: '22px',
                    fill: '#ffff00',
                    fontStyle: 'bold'
                }
            );
            stageNameText.setOrigin(0.5);

            // 안내 텍스트
            const guideText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                135,
                '직업을 클릭하여 자세한 정보를 확인하세요',
                {
                    fontSize: '16px',
                    fill: '#aaaaaa',
                    align: 'center'
                }
            );
            guideText.setOrigin(0.5);

            // 직업 카드 생성 (3열 그리드, 스크롤 가능)
            const cardWidth = 180;
            const cardHeight = 240;
            const cardSpacing = 20;
            const cols = 3;

            const classKeys = Object.keys(this.classes);
            const rows = Math.ceil(classKeys.length / cols);

            const totalWidth = cardWidth * cols + cardSpacing * (cols - 1);
            const startX = (CONSTANTS.GAME.WIDTH - totalWidth) / 2;
            const startY = 170;

            classKeys.forEach((classKey, index) => {
                const classData = this.classes[classKey];
                const col = index % cols;
                const row = Math.floor(index / cols);

                const x = startX + col * (cardWidth + cardSpacing) + cardWidth / 2;
                const y = startY + row * (cardHeight + cardSpacing);

                this.createClassCard(x, y, cardWidth, cardHeight, classKey, classData);
            });

            // 뒤로가기 버튼
            this.createBackButton();

        } catch (error) {
            console.error('showClassList 오류:', error);
        }
    }

    createClassCard(x, y, width, height, classKey, classData) {
        try {
            // 카드 컨테이너
            const container = this.add.container(x, y);

            // 카드 배경
            const cardBg = this.add.rectangle(0, 0, width, height, 0x1a1a2e);
            cardBg.setStrokeStyle(3, 0x444444);

            // 잠김 상태가 아니면 인터랙티브
            if (!classData.locked) {
                cardBg.setInteractive({ useHandCursor: true });
            }

            // 카드 헤더 (직업 색상)
            const headerColor = classData.locked ? 0x555555 : classData.color;
            const headerBg = this.add.rectangle(0, -height / 2 + 25, width, 50, headerColor);

            // 직업 이름
            const className = this.add.text(0, -height / 2 + 25, classData.name, {
                fontSize: '20px',
                fill: classData.locked ? '#777777' : '#ffffff',
                fontStyle: 'bold'
            });
            className.setOrigin(0.5);

            // 직업 간단 설명
            const description = this.add.text(0, -40, classData.description, {
                fontSize: '13px',
                fill: classData.locked ? '#666666' : '#cccccc',
                align: 'center',
                wordWrap: { width: width - 20 }
            });
            description.setOrigin(0.5);

            // 스킬 미리보기 (간단하게)
            const skillPreview = classData.skills.slice(0, 3).map(s => s.split(':')[0]).join('\n');
            const skills = this.add.text(0, 20, skillPreview, {
                fontSize: '11px',
                fill: classData.locked ? '#555555' : '#999999',
                align: 'left',
                lineSpacing: 2
            });
            skills.setOrigin(0.5, 0);

            // 자세히 보기 안내
            const detailHint = this.add.text(0, height / 2 - 20,
                classData.locked ? '🔒 잠김' : '클릭하여 자세히 보기 >', {
                fontSize: '12px',
                fill: classData.locked ? '#666666' : '#ffff00',
                fontStyle: 'bold'
            });
            detailHint.setOrigin(0.5);

            // 컨테이너에 추가
            container.add([cardBg, headerBg, className, description, skills, detailHint]);

            // 잠김 상태면 여기서 리턴
            if (classData.locked) {
                return;
            }

            // 호버 효과
            cardBg.on('pointerover', () => {
                cardBg.setStrokeStyle(4, classData.color);
                container.setScale(1.05);
                this.tweens.add({
                    targets: container,
                    y: y - 5,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            cardBg.on('pointerout', () => {
                cardBg.setStrokeStyle(3, 0x444444);
                container.setScale(1);
                this.tweens.add({
                    targets: container,
                    y: y,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            // 클릭 시 상세 화면으로 이동
            cardBg.on('pointerup', () => {
                this.showClassDetail(classKey);
            });

        } catch (error) {
            console.error('createClassCard 오류:', error);
        }
    }

    showClassDetail(classKey) {
        try {
            // 기존 요소들 정리
            this.children.removeAll();
            this.currentView = 'detail';
            this.selectedClassKey = classKey;

            const classData = this.classes[classKey];

            // 배경 어둡게
            const overlay = this.add.rectangle(
                CONSTANTS.GAME.WIDTH / 2,
                CONSTANTS.GAME.HEIGHT / 2,
                CONSTANTS.GAME.WIDTH,
                CONSTANTS.GAME.HEIGHT,
                0x000000,
                0.7
            );

            // 상세 정보 패널
            const panelWidth = 600;
            const panelHeight = 500;
            const panelX = CONSTANTS.GAME.WIDTH / 2;
            const panelY = CONSTANTS.GAME.HEIGHT / 2;

            const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a2e);
            panel.setStrokeStyle(4, classData.color);

            // 헤더 영역
            const headerBg = this.add.rectangle(panelX, panelY - panelHeight / 2 + 40, panelWidth, 80, classData.color);

            // 직업 이름
            const className = this.add.text(panelX, panelY - panelHeight / 2 + 40, classData.name, {
                fontSize: '36px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4
            });
            className.setOrigin(0.5);

            // 스크롤 가능한 컨텐츠 영역 (텍스트만)
            let contentY = panelY - panelHeight / 2 + 100;

            // 자세한 설명
            const detailedDesc = this.add.text(panelX, contentY, classData.detailedDescription, {
                fontSize: '14px',
                fill: '#dddddd',
                align: 'center',
                wordWrap: { width: panelWidth - 60 },
                lineSpacing: 4
            });
            detailedDesc.setOrigin(0.5, 0);

            contentY += detailedDesc.height + 20;

            // 스탯 정보
            const statsTitle = this.add.text(panelX - panelWidth / 2 + 30, contentY, '[ 특성 ]', {
                fontSize: '16px',
                fill: classData.color,
                fontStyle: 'bold'
            });

            contentY += 25;

            let statsText = '';
            for (const [key, value] of Object.entries(classData.stats)) {
                statsText += `${key}: ${value}\n`;
            }

            const stats = this.add.text(panelX - panelWidth / 2 + 30, contentY, statsText, {
                fontSize: '13px',
                fill: '#cccccc',
                lineSpacing: 3
            });

            contentY += stats.height + 20;

            // 스킬 정보
            const skillsTitle = this.add.text(panelX - panelWidth / 2 + 30, contentY, '[ 스킬 상세 ]', {
                fontSize: '16px',
                fill: classData.color,
                fontStyle: 'bold'
            });

            contentY += 25;

            const skillsText = classData.skills.join('\n');
            const skills = this.add.text(panelX - panelWidth / 2 + 30, contentY, skillsText, {
                fontSize: '12px',
                fill: '#aaaaaa',
                align: 'left',
                lineSpacing: 2,
                wordWrap: { width: panelWidth - 60 }
            });

            // 버튼 영역 (하단)
            const buttonY = panelY + panelHeight / 2 - 40;

            // 뒤로가기 버튼
            const backButton = this.add.rectangle(panelX - 120, buttonY, 180, 50, 0x555555);
            backButton.setInteractive({ useHandCursor: true });

            const backButtonText = this.add.text(panelX - 120, buttonY, '← 뒤로가기', {
                fontSize: '18px',
                fill: '#ffffff',
                fontStyle: 'bold'
            });
            backButtonText.setOrigin(0.5);

            // 시작 버튼
            const startButton = this.add.rectangle(panelX + 120, buttonY, 180, 50, classData.color);
            startButton.setInteractive({ useHandCursor: true });

            const startButtonText = this.add.text(panelX + 120, buttonY, '시작하기 ▶', {
                fontSize: '18px',
                fill: '#ffffff',
                fontStyle: 'bold'
            });
            startButtonText.setOrigin(0.5);

            // 뒤로가기 버튼 이벤트
            backButton.on('pointerover', () => {
                backButton.setFillStyle(0x777777);
                backButtonText.setScale(1.1);
            });

            backButton.on('pointerout', () => {
                backButton.setFillStyle(0x555555);
                backButtonText.setScale(1);
            });

            backButton.on('pointerup', () => {
                this.showClassList();
            });

            // 시작 버튼 이벤트
            startButton.on('pointerover', () => {
                startButton.setFillStyle(classData.color + 0x222222);
                startButtonText.setScale(1.1);
            });

            startButton.on('pointerout', () => {
                startButton.setFillStyle(classData.color);
                startButtonText.setScale(1);
            });

            startButton.on('pointerup', () => {
                this.selectClass(classKey);
            });

        } catch (error) {
            console.error('showClassDetail 오류:', error);
        }
    }

    selectClass(classKey) {
        try {
            // 선택된 직업 저장
            this.registry.set('selectedClass', classKey);

            // 선택 효과
            this.cameras.main.flash(200, 255, 255, 255);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('선택된 직업:', classKey);
                console.log('시작할 스테이지:', this.selectedStage);
            }

            // 스테이지 시작 시간 저장
            this.registry.set('stageStartTime', Date.now());
            this.registry.set('currentStage', this.selectedStage);

            // 스테이지 시작
            const stageKey = `Stage${this.selectedStage}Scene`;
            this.time.delayedCall(200, () => {
                this.scene.start(stageKey);
            });

        } catch (error) {
            console.error('selectClass 오류:', error);
        }
    }

    createBackButton() {
        try {
            const button = this.add.rectangle(80, 550, 140, 45, 0x333333);
            button.setInteractive({ useHandCursor: true });

            const buttonText = this.add.text(80, 550, '← 뒤로가기', {
                fontSize: '18px',
                fill: '#ffffff',
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
            button.on('pointerdown', () => {
                button.setFillStyle(0x222222);
            });

            button.on('pointerup', () => {
                button.setFillStyle(0x555555);
                this.scene.start('StageSelectScene');
            });

        } catch (error) {
            console.error('createBackButton 오류:', error);
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.ClassSelectScene = ClassSelectScene;
}
