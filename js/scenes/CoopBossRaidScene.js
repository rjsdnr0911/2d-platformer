// ==================================================
// 협동 보스 레이드 Scene
// ==================================================
// 2명의 플레이어가 협력하여 강력한 보스를 처치하는 PvE 모드
// Host(Player 1)가 보스 AI 실행, Client(Player 2)는 보스 상태 수신
// ==================================================

class CoopBossRaidScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CoopBossRaidScene' });

        // 네트워크 관련
        this.socket = null;
        this.roomId = null;
        this.playerNumber = null;
        this.opponentId = null;

        // 플레이어 객체
        this.myPlayer = null;      // 내 플레이어
        this.opponentPlayer = null;  // 파트너 플레이어 (스프라이트만)

        // 보스 객체
        this.boss = null;  // CoopBoss 인스턴스 (Host만 생성)

        // 게임 상태
        this.myHp = 100;
        this.opponentHp = 100;
        this.gameOver = false;

        // 부활 시스템
        this.isDead = false;  // 내가 죽었는지
        this.opponentIsDead = false;  // 상대가 죽었는지
        this.reviveTimer = null;  // 부활 타이머
        this.reviveTimeLeft = 10;  // 부활 대기 시간 (10초)
        this.reviveKey = null;  // F키 (부활용)

        // 네트워크 업데이트 주기
        this.lastUpdateTime = 0;
        this.updateInterval = 50;  // 50ms마다 위치 전송 (초당 20회)

        // 직업 선택 관련
        this.jobSelectionPhase = true;   // 직업 선택 단계
        this.selectedJob = null;          // 내가 선택한 직업
        this.opponentJob = null;          // 상대방이 선택한 직업
        this.selectionTimer = 20;         // 20초 카운트다운

        // 터치 컨트롤 (모바일용)
        this.touchControls = null;
        this.isMobile = false;
    }

    // ============================================
    // 초기화 (이전 Scene에서 데이터 받기)
    // ============================================
    init(data) {
        this.socket = data.socket;
        this.roomId = data.roomId;
        this.playerNumber = data.playerNumber;
        this.opponentId = data.opponentId;

        if (CONSTANTS.GAME.DEBUG) {
            console.log('[CoopBossRaidScene] 초기화:', {
                roomId: this.roomId,
                playerNumber: this.playerNumber,
                partnerId: this.opponentId
            });
        }
    }

    // ============================================
    // 스프라이트 로드 (preload)
    // ============================================
    preload() {
        // 플레이어 스프라이트 로드
        this.load.spritesheet('player_idle', 'assets/player/Idle (32x32).png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('player_run', 'assets/player/Run (32x32).png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('player_jump', 'assets/player/Jump (32x32).png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('player_fall', 'assets/player/Fall (32x32).png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('player_double_jump', 'assets/player/Double Jump (32x32).png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('player_hit', 'assets/player/Hit (32x32).png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    // ============================================
    // 애니메이션 생성 (create에서 호출)
    // ============================================
    createAnimations() {
        // 애니메이션 생성
        if (!this.anims.exists('player_idle')) {
            this.anims.create({
                key: 'player_idle',
                frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 10 }),
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.anims.exists('player_run')) {
            this.anims.create({
                key: 'player_run',
                frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 11 }),
                frameRate: 15,
                repeat: -1
            });
        }

        if (!this.anims.exists('player_jump')) {
            this.anims.create({
                key: 'player_jump',
                frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 0 }),
                frameRate: 10,
                repeat: 0
            });
        }

        if (!this.anims.exists('player_fall')) {
            this.anims.create({
                key: 'player_fall',
                frames: this.anims.generateFrameNumbers('player_fall', { start: 0, end: 0 }),
                frameRate: 10,
                repeat: 0
            });
        }

        if (!this.anims.exists('player_double_jump')) {
            this.anims.create({
                key: 'player_double_jump',
                frames: this.anims.generateFrameNumbers('player_double_jump', { start: 0, end: 5 }),
                frameRate: 10,
                repeat: 0
            });
        }

        if (!this.anims.exists('player_hit')) {
            this.anims.create({
                key: 'player_hit',
                frames: this.anims.generateFrameNumbers('player_hit', { start: 0, end: 6 }),
                frameRate: 15,
                repeat: 0
            });
        }
    }

    // ============================================
    // 직업 선택 UI 생성
    // ============================================
    createJobSelectionUI() {
        // 제목
        this.jobTitle = this.add.text(
            400, 80,
            '직업 선택',
            {
                fontFamily: 'Orbitron',
                fontSize: '48px',
                fill: '#00FFFF',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 6
            }
        );
        this.jobTitle.setOrigin(0.5);

        // 타이머 텍스트
        this.timerText = this.add.text(
            400, 150,
            `남은 시간: ${this.selectionTimer}초`,
            {
                fontFamily: 'Jua',
                fontSize: '24px',
                fill: '#ffff00',
                fontStyle: 'bold'
            }
        );
        this.timerText.setOrigin(0.5);

        // 설명 텍스트
        const desc = this.add.text(
            400, 200,
            '20초 안에 직업을 선택하세요! (둘 다 선택하면 바로 시작)',
            {
                fontFamily: 'Jua',
                fontSize: '16px',
                fill: '#fff'
            }
        );
        desc.setOrigin(0.5);

        // 직업 버튼들 (2x2 그리드)
        const jobs = [
            { key: 'sword', name: '⚔️ 검술', color: 0x4444ff, x: 250, y: 300 },
            { key: 'magic', name: '🔮 마법', color: 0x8844ff, x: 550, y: 300 },
            { key: 'hammer', name: '🔨 해머', color: 0xff4444, x: 250, y: 400 },
            { key: 'bow', name: '🏹 활', color: 0x44ff44, x: 550, y: 400 }
        ];

        this.jobButtons = [];

        jobs.forEach(job => {
            const button = this.createJobButton(job.x, job.y, job.name, job.key, job.color);
            this.jobButtons.push(button);
        });

        // 상태 텍스트 (내 선택 / 상대방 선택)
        this.statusText = this.add.text(
            400, 500,
            '내 선택: 없음\n상대방 선택: 대기 중...',
            {
                fontFamily: 'Jua',
                fontSize: '18px',
                fill: '#fff',
                backgroundColor: '#00000088',
                padding: { x: 20, y: 10 },
                align: 'center'
            }
        );
        this.statusText.setOrigin(0.5);

        // 1초마다 타이머 업데이트
        this.jobSelectionInterval = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.selectionTimer--;
                this.timerText.setText(`남은 시간: ${this.selectionTimer}초`);

                if (this.selectionTimer <= 0) {
                    this.jobSelectionInterval.remove();
                }
            },
            loop: true
        });
    }

    // ============================================
    // 직업 버튼 생성
    // ============================================
    createJobButton(x, y, text, jobKey, color) {
        const button = this.add.rectangle(x, y, 250, 70, color);
        button.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Jua',
            fontSize: '28px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // 호버 효과
        button.on('pointerover', () => {
            const lighterColor = Phaser.Display.Color.ValueToColor(color).lighten(20).color;
            button.setFillStyle(lighterColor);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setFillStyle(color);
            buttonText.setScale(1);
        });

        // 클릭 이벤트
        button.on('pointerup', () => {
            this.selectJob(jobKey);
        });

        return { button, buttonText, jobKey };
    }

    // ============================================
    // 직업 선택 처리
    // ============================================
    selectJob(jobKey) {
        if (!this.jobSelectionPhase || this.selectedJob) return;

        this.selectedJob = jobKey;

        // 서버에 선택 전송
        this.socket.emit('playerJobSelected', {
            roomId: this.roomId,
            job: jobKey
        });

        // 상태 텍스트 업데이트
        const jobNames = {
            'sword': '⚔️ 검술',
            'magic': '🔮 마법',
            'hammer': '🔨 해머',
            'bow': '🏹 활'
        };

        this.statusText.setText(
            `내 선택: ${jobNames[jobKey]}\n상대방 선택: ${this.opponentJob ? jobNames[this.opponentJob] : '대기 중...'}`
        );

        // 선택한 버튼 강조
        this.jobButtons.forEach(btn => {
            if (btn.jobKey === jobKey) {
                btn.button.setFillStyle(0xffffff);
                btn.buttonText.setColor('#000');
            } else {
                btn.button.setAlpha(0.5);
                btn.buttonText.setAlpha(0.5);
            }
        });

        console.log(`[직업 선택] ${jobKey} 선택 완료`);
    }

    // ============================================
    // Scene 생성
    // ============================================
    create() {
        try {
            // 배경색
            this.cameras.main.setBackgroundColor('#87CEEB');

            // ============================================
            // 0. 애니메이션 생성 (Player 생성 전에 반드시 필요)
            // ============================================
            this.createAnimations();

            // ============================================
            // 1. Socket.io 이벤트 리스너 설정 (먼저 설정)
            // ============================================
            this.setupSocketListeners();

            // ============================================
            // 2. 직업 선택 UI 표시
            // ============================================
            this.createJobSelectionUI();

            if (CONSTANTS.GAME.DEBUG) {
                console.log('[CoopBossRaidScene] 직업 선택 단계 시작');
            }

        } catch (error) {
            console.error('[CoopBossRaidScene] create 오류:', error);
        }
    }

    // ============================================
    // 간단한 맵 생성
    // ============================================
    createSimpleMap() {
        // 플랫폼 그룹 생성
        this.platforms = this.physics.add.staticGroup();

        // 바닥
        const ground = this.add.rectangle(400, 580, 800, 40, 0x555555);
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        // 왼쪽 플랫폼
        const leftPlatform = this.add.rectangle(200, 450, 150, 20, 0x888888);
        this.physics.add.existing(leftPlatform, true);
        this.platforms.add(leftPlatform);

        // 오른쪽 플랫폼
        const rightPlatform = this.add.rectangle(600, 450, 150, 20, 0x888888);
        this.physics.add.existing(rightPlatform, true);
        this.platforms.add(rightPlatform);

        // 중앙 플랫폼
        const centerPlatform = this.add.rectangle(400, 350, 120, 20, 0x888888);
        this.physics.add.existing(centerPlatform, true);
        this.platforms.add(centerPlatform);

        // 월드 경계 설정
        this.physics.world.setBounds(0, 0, 800, 600);
    }

    // ============================================
    // UI 생성 (체력바, 플레이어 정보)
    // ============================================
    createUI() {
        const uiDepth = 1000;  // UI는 항상 최상단

        // 내 체력바 (왼쪽 상단)
        this.myHpBarBg = this.add.rectangle(20, 20, 200, 30, 0x000000, 0.7);
        this.myHpBarBg.setOrigin(0, 0);
        this.myHpBarBg.setScrollFactor(0);
        this.myHpBarBg.setDepth(uiDepth);

        this.myHpBar = this.add.rectangle(25, 25, 190, 20, 0x00ff00);
        this.myHpBar.setOrigin(0, 0);
        this.myHpBar.setScrollFactor(0);
        this.myHpBar.setDepth(uiDepth + 1);

        this.myHpText = this.add.text(115, 35, `Player ${this.playerNumber}: 100`, {
            fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        this.myHpText.setOrigin(0.5);
        this.myHpText.setScrollFactor(0);
        this.myHpText.setDepth(uiDepth + 2);

        // 상대 체력바 (오른쪽 상단)
        const oppNumber = this.playerNumber === 1 ? 2 : 1;

        this.oppHpBarBg = this.add.rectangle(580, 20, 200, 30, 0x000000, 0.7);
        this.oppHpBarBg.setOrigin(0, 0);
        this.oppHpBarBg.setScrollFactor(0);
        this.oppHpBarBg.setDepth(uiDepth);

        this.oppHpBar = this.add.rectangle(585, 25, 190, 20, 0xff0000);
        this.oppHpBar.setOrigin(0, 0);
        this.oppHpBar.setScrollFactor(0);
        this.oppHpBar.setDepth(uiDepth + 1);

        this.oppHpText = this.add.text(680, 35, `Player ${oppNumber}: 100`, {
            fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        this.oppHpText.setOrigin(0.5);
        this.oppHpText.setScrollFactor(0);
        this.oppHpText.setDepth(uiDepth + 2);

        // 메시지 텍스트 (중앙 상단)
        this.messageText = this.add.text(400, 100, '', {
            fontSize: '32px',
            fill: '#ffff00',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        });
        this.messageText.setOrigin(0.5);
        this.messageText.setScrollFactor(0);
        this.messageText.setDepth(uiDepth + 3);
        this.messageText.setVisible(false);

        // 조작키 안내 (중앙 위)
        const controlsText = this.isMobile
            ? '화면 터치 버튼으로 조작'
            : '이동: ←→  점프: ↑  대시: Shift  공격: Z/X/C  부활: F';

        this.controlsGuide = this.add.text(400, 70, controlsText, {
            fontFamily: 'Jua',
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 },
            align: 'center'
        });
        this.controlsGuide.setOrigin(0.5);
        this.controlsGuide.setScrollFactor(0);
        this.controlsGuide.setDepth(uiDepth + 2);
    }

    // ============================================
    // Socket.io 이벤트 리스너 설정
    // ============================================
    setupSocketListeners() {
        // 0-1. 상대방 직업 선택 수신
        this.socket.on('opponentJobSelected', (data) => {
            this.opponentJob = data.job;

            const jobNames = {
                'sword': '⚔️ 검술',
                'magic': '🔮 마법',
                'hammer': '🔨 해머',
                'bow': '🏹 활'
            };

            // 상태 텍스트 업데이트
            if (this.statusText) {
                this.statusText.setText(
                    `내 선택: ${this.selectedJob ? jobNames[this.selectedJob] : '없음'}\n상대방 선택: ${jobNames[data.job]}`
                );
            }

            console.log(`[상대방 직업 선택] ${data.job}`);
        });

        // 0-2. 게임 시작 수신
        this.socket.on('gameStart', (data) => {
            console.log('[게임 시작!]', data);

            // 직업 선택 UI 제거
            this.removeJobSelectionUI();

            // 선택된 직업으로 게임 시작
            const myJob = this.playerNumber === 1 ? data.player1Job : data.player2Job;
            const oppJob = this.playerNumber === 1 ? data.player2Job : data.player1Job;

            this.startGameWithJobs(myJob, oppJob);
        });

        // 1. 상대방 이동 수신
        this.socket.on('opponentMove', (data) => {
            if (!this.opponent || this.gameOver) return;

            // 상대방 위치 업데이트 (물리 바디 없이 직접 좌표 설정)
            this.opponent.x = data.x;
            this.opponent.y = data.y;
            this.opponent.setFlipX(!data.facingRight);
        });

        // 2. 상대방 점프
        this.socket.on('opponentJump', () => {
            if (!this.opponent || this.gameOver) return;
            // 점프 이펙트 표시
            this.createJumpEffect(this.opponent.x, this.opponent.y);
        });

        // 3. 상대방 대시
        this.socket.on('opponentDash', (data) => {
            if (!this.opponent || this.gameOver) return;
            // 대시 이펙트 표시
            this.createDashEffect(this.opponent.x, this.opponent.y);
        });

        // 4. 상대방 공격
        this.socket.on('opponentAttack', (data) => {
            if (!this.opponent || this.gameOver) return;

            // 공격 판정: 거리 + 방향 체크
            const distance = Phaser.Math.Distance.Between(
                this.myPlayer.sprite.x, this.myPlayer.sprite.y,
                data.x, data.y
            );

            // 상대방이 나를 향해 공격하는지 확인
            const dx = this.myPlayer.sprite.x - data.x;
            const isFacingMe = (data.direction > 0 && dx > 0) || (data.direction < 0 && dx < 0);

            // 공격 범위 확대 (80 → 150px) - 네트워크 지연 보상
            if (distance < 150 && isFacingMe) {
                let damage = 10;  // 기본
                if (data.attackType === 'strong') damage = 20;
                if (data.attackType === 'special') damage = 30;

                this.takeDamage(damage);

                // 피격 이펙트 (파티클)
                this.createHitEffect(this.myPlayer.sprite.x, this.myPlayer.sprite.y);

                console.log(`[피격 성공!] ${data.attackType} - 거리: ${Math.round(distance)}px - ${damage} 데미지`);
            } else {
                if (CONSTANTS.GAME.DEBUG) {
                    console.log(`[피격 실패] 거리: ${Math.round(distance)}px, 방향: ${isFacingMe ? '맞음' : '틀림'}`);
                }
            }

            // 공격 이펙트 표시 (항상)
            this.createAttackEffect(data.x, data.y, data.direction);
        });

        // 5. 상대방 피격
        this.socket.on('opponentHit', (data) => {
            if (this.gameOver) return;
            this.opponentHp = data.hp;
            this.updateOpponentHP();
        });

        // 6. 상대방 사망
        this.socket.on('opponentDied', () => {
            if (this.gameOver) return;

            // 협동 모드: 상대방이 죽으면 부활 대기 상태로
            this.opponentIsDead = true;
            this.opponentHp = 0;
            this.updateOpponentHP();

            // 상대 플레이어 투명도 낮추기 (사망 표시)
            if (this.opponent) {
                this.opponent.setAlpha(0.3);
            }

            console.log('[상대방 사망] 부활 가능 (F키)');
        });

        // 7. 상대방 연결 끊김
        this.socket.on('opponentDisconnected', () => {
            if (this.gameOver) return;
            this.gameOver = true;  // 게임 종료 플래그 설정
            this.showMessage('상대방이 나갔습니다!', 3000);
            this.time.delayedCall(3000, () => {
                this.scene.start('MainMenuScene');
            });
        });

        // 8. 애니메이션 동기화
        this.socket.on('opponentAnimation', (data) => {
            if (!this.opponent || this.gameOver) return;

            const animKey = `player_${data.animation}`;
            if (this.anims.exists(animKey)) {
                this.opponent.play(animKey, true);
            }
        });

        // 9. 보스 상태 동기화 (Client만 수신)
        this.socket.on('bossSync', (data) => {
            // Client만 보스 상태 수신
            if (this.playerNumber !== 1) {
                this.updateBossState(data);
            }
        });

        // 10. 플레이어 부활 (파트너가 부활시켜줌)
        this.socket.on('playerRevive', (data) => {
            // 내가 부활된 경우
            if (data.revivedPlayerNumber === this.playerNumber) {
                this.revive();
            }
        });

        console.log('[Socket] 이벤트 리스너 설정 완료');
    }

    // ============================================
    // 직업 선택 UI 제거
    // ============================================
    removeJobSelectionUI() {
        if (this.jobSelectionInterval) {
            this.jobSelectionInterval.remove();
        }

        if (this.jobTitle) this.jobTitle.destroy();
        if (this.timerText) this.timerText.destroy();
        if (this.statusText) this.statusText.destroy();

        if (this.jobButtons) {
            this.jobButtons.forEach(btn => {
                btn.button.destroy();
                btn.buttonText.destroy();
            });
        }
    }

    // ============================================
    // 선택된 직업으로 게임 시작
    // ============================================
    startGameWithJobs(myJob, opponentJob) {
        try {
            console.log(`[게임 시작] 내 직업: ${myJob}, 상대 직업: ${opponentJob}`);

            // 직업 선택 단계 종료
            this.jobSelectionPhase = false;

            // ============================================
            // 1. 기본 맵 생성
            // ============================================
            this.createSimpleMap();

            // ============================================
            // 2. 내 플레이어 생성
            // ============================================
            const myStartX = this.playerNumber === 1 ? 100 : 700;
            const myStartY = 300;

            this.myPlayer = new Player(this, myStartX, myStartY);

            // 선택한 직업에 따라 능력 장착
            this.equipAbility(this.myPlayer, myJob);

            // 카메라가 플레이어를 따라가도록
            this.cameras.main.startFollow(this.myPlayer.sprite);

            // ============================================
            // 3. 상대 플레이어 스프라이트 생성
            // ============================================
            const oppStartX = this.playerNumber === 1 ? 700 : 100;
            const oppStartY = 300;

            this.opponent = this.add.sprite(oppStartX, oppStartY, 'player_idle');
            this.opponent.play('player_idle');
            this.opponent.setScale(1.3);
            this.opponent.setTint(0xff8888);

            // ============================================
            // 4. 보스 생성 (Host만)
            // ============================================
            if (this.playerNumber === 1) {
                console.log('[Host] 협동 보스 생성 중...');
                this.boss = new CoopBoss(this, 400, 300);

                // Host는 CoopBoss의 내장 HP바 사용 (BaseBoss에서 자동 생성됨)
                // 별도 HP바 불필요

                // 보스 상태 동기화 시작 (50ms마다)
                this.startBossSync();
            } else {
                console.log('[Client] 보스 상태 수신 대기 중...');
                // Client는 첫 bossSync 수신 시 createBossHPBar 호출됨
            }

            // ============================================
            // 5. 플랫폼과 플레이어 충돌 설정
            // ============================================
            this.physics.add.collider(this.myPlayer.sprite, this.platforms);

            // ============================================
            // 5. UI 생성 (체력바, 플레이어 정보)
            // ============================================
            this.createUI();

            // ============================================
            // 6. 키보드 입력 설정
            // ============================================
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keys = {
                dash: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
                basicAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
                strongAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
                specialSkill: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
                abilitySwap1: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
                abilitySwap2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
            };

            // 부활 키 (F키)
            this.reviveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

            // ============================================
            // 6-1. 터치 컨트롤 초기화 (모바일에서만)
            // ============================================
            this.isMobile = MobileDetector.isMobile();
            if (this.isMobile) {
                this.touchControls = new TouchControls(this);
                if (CONSTANTS.GAME.DEBUG) {
                    console.log('모바일 터치 컨트롤 활성화');
                }
            }

            // ============================================
            // 7. 게임 시작 알림
            // ============================================
            this.showMessage('게임 시작!', 2000);

            console.log('[게임 초기화 완료]');

        } catch (error) {
            console.error('[startGameWithJobs] 오류:', error);
        }
    }

    // ============================================
    // 플레이어에게 직업 능력 장착
    // ============================================
    equipAbility(player, jobKey) {
        console.log(`[능력 장착] 직업: ${jobKey}`);

        if (jobKey === 'sword' && window.SwordAbility) {
            player.equipAbility(new SwordAbility(this, player), 0);
            console.log('[능력 장착 완료] ⚔️ 검술');
        } else if (jobKey === 'magic' && window.MagicAbility) {
            player.equipAbility(new MagicAbility(this, player), 0);
            console.log('[능력 장착 완료] 🔮 마법');
        } else if (jobKey === 'hammer' && window.HammerAbility) {
            player.equipAbility(new HammerAbility(this, player), 0);
            console.log('[능력 장착 완료] 🔨 해머');
        } else if (jobKey === 'bow' && window.BowAbility) {
            player.equipAbility(new BowAbility(this, player), 0);
            console.log('[능력 장착 완료] 🏹 활');
        } else {
            // 기본값: 검술
            console.warn(`[능력 장착 실패] ${jobKey} - 기본값(검술) 사용`);
            if (window.SwordAbility) {
                player.equipAbility(new SwordAbility(this, player), 0);
            }
        }

        // 장착 확인
        const ability = player.getCurrentAbility();
        if (ability) {
            console.log(`[능력 확인] ${ability.name} 장착됨`);
        } else {
            console.error('[능력 확인] 능력 장착 실패!');
        }
    }

    // ============================================
    // 보스 상태 동기화 시작 (Host만)
    // ============================================
    startBossSync() {
        if (!this.boss) return;

        this.bossSyncEvent = this.time.addEvent({
            delay: 50,  // 50ms마다 전송 (초당 20회)
            callback: () => {
                if (!this.boss || !this.boss.isAlive) {
                    // 보스가 죽으면 동기화 중단
                    if (this.bossSyncEvent) {
                        this.bossSyncEvent.remove();
                    }
                    return;
                }

                // 보스 상태를 서버로 전송 → Client로 브로드캐스트
                this.socket.emit('bossSync', {
                    roomId: this.roomId,
                    x: this.boss.sprite.x,
                    y: this.boss.sprite.y,
                    velocityX: this.boss.sprite.body.velocity.x,
                    velocityY: this.boss.sprite.body.velocity.y,
                    hp: this.boss.hp,
                    maxHp: this.boss.maxHp,
                    phase: this.boss.phase,
                    isAttacking: this.boss.isAttacking,
                    direction: this.boss.direction
                });
            },
            loop: true
        });

        console.log('[Host] 보스 동기화 시작됨 (50ms 간격)');
    }

    // ============================================
    // 보스 상태 업데이트 (Client만)
    // ============================================
    updateBossState(data) {
        // Client는 보스 스프라이트만 렌더링 (AI 없음)
        if (!this.boss) {
            // 첫 동기화: 보스 스프라이트 생성
            console.log('[Client] 보스 스프라이트 생성 중...');

            // 간단한 스프라이트 생성 (물리 바디 없이)
            this.boss = {
                sprite: this.add.circle(data.x, data.y, 40, 0xFF0000),
                hp: data.hp,
                maxHp: data.maxHp,
                phase: data.phase,
                isAlive: true
            };

            // HP바 생성 (Client도 보스 HP 표시 필요)
            this.createBossHPBar();
        }

        // 위치 업데이트
        this.boss.sprite.x = data.x;
        this.boss.sprite.y = data.y;

        // 상태 업데이트
        this.boss.hp = data.hp;
        this.boss.phase = data.phase;

        // HP바 업데이트
        if (this.bossHpBar) {
            const hpRatio = this.boss.hp / this.boss.maxHp;
            this.bossHpBar.width = 400 * hpRatio;
            this.bossHpText.setText(`Boss: ${this.boss.hp} / ${this.boss.maxHp} (Phase ${data.phase})`);
        }

        // 보스 사망 체크
        if (data.hp <= 0 && this.boss.isAlive) {
            this.boss.isAlive = false;
            this.onBossDefeated();
        }
    }

    // ============================================
    // 보스 HP바 생성 (Client 전용)
    // ============================================
    createBossHPBar() {
        const uiDepth = 1000;

        // 보스 HP바 (화면 상단 중앙)
        this.bossHpBarBg = this.add.rectangle(200, 60, 400, 30, 0x000000, 0.7);
        this.bossHpBarBg.setOrigin(0, 0);
        this.bossHpBarBg.setScrollFactor(0);
        this.bossHpBarBg.setDepth(uiDepth);

        this.bossHpBar = this.add.rectangle(205, 65, 390, 20, 0xFF0000);
        this.bossHpBar.setOrigin(0, 0);
        this.bossHpBar.setScrollFactor(0);
        this.bossHpBar.setDepth(uiDepth + 1);

        this.bossHpText = this.add.text(400, 75, 'Boss: 800 / 800 (Phase 1)', {
            fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        this.bossHpText.setOrigin(0.5);
        this.bossHpText.setScrollFactor(0);
        this.bossHpText.setDepth(uiDepth + 2);

        console.log('[Client] 보스 HP바 생성 완료');
    }

    // ============================================
    // 보스 처치 시
    // ============================================
    onBossDefeated() {
        console.log('[보스 처치!] 플레이어 승리');
        this.endGame(true);  // 협동 승리
    }

    // ============================================
    // Update (매 프레임마다 실행)
    // ============================================
    update(time, delta) {
        // 직업 선택 단계에서는 업데이트하지 않음
        if (this.jobSelectionPhase) return;

        if (this.gameOver || !this.myPlayer) return;

        try {
            // 0. F키 부활 처리 (살아있을 때만)
            if (!this.isDead && this.reviveKey && Phaser.Input.Keyboard.JustDown(this.reviveKey)) {
                this.attemptRevive();
            }

            // 죽은 상태에서는 일반 입력 무시
            if (this.isDead) {
                return;
            }

            // 1. 내 플레이어 입력 처리 (이동, 점프만)
            // 공격은 별도로 처리

            // 터치 컨트롤 업데이트 (모바일인 경우)
            if (this.isMobile && this.touchControls) {
                // JustPressed 처리 (Player.update() 전에 먼저 처리)
                if (this.touchControls.justPressed('jump')) {
                    this.myPlayer.jump();
                    // 서버에 점프 알림
                    this.socket.emit('playerJump', {
                        roomId: this.roomId
                    });
                }

                if (this.touchControls.justPressed('dash')) {
                    this.myPlayer.dash();
                    // 서버에 대시 알림
                    this.socket.emit('playerDash', {
                        roomId: this.roomId,
                        direction: this.myPlayer.facingRight ? 1 : -1
                    });
                }

                if (this.touchControls.justPressed('basicAttack')) {
                    this.performAttack('basic', 10);
                }

                if (this.touchControls.justPressed('strongAttack')) {
                    this.performAttack('strong', 20);
                }

                if (this.touchControls.justPressed('skill')) {
                    this.performAttack('special', 30);
                }

                // 연속 입력 처리 (좌우 이동)
                const touchInputs = this.touchControls.getInputs();
                if (touchInputs.left) {
                    this.myPlayer.move(-1);
                } else if (touchInputs.right) {
                    this.myPlayer.move(1);
                }

                // 터치 컨트롤 상태 업데이트
                this.touchControls.update();
            } else {
                // 키보드 입력 처리
                // 좌우 이동
                if (this.cursors.left.isDown) {
                    this.myPlayer.move(-1);
                } else if (this.cursors.right.isDown) {
                    this.myPlayer.move(1);
                }

                // 점프
                if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                    this.myPlayer.jump();
                    // 서버에 점프 알림
                    this.socket.emit('playerJump', {
                        roomId: this.roomId
                    });
                }

                // 대시
                if (Phaser.Input.Keyboard.JustDown(this.keys.dash)) {
                    this.myPlayer.dash();
                    // 서버에 대시 알림
                    this.socket.emit('playerDash', {
                        roomId: this.roomId,
                        direction: this.myPlayer.facingRight ? 1 : -1
                    });
                }

                // 공격 (Z 키 - 기본 공격)
                if (Phaser.Input.Keyboard.JustDown(this.keys.basicAttack)) {
                    this.performAttack('basic', 10);
                }

                // 강공격 (X 키)
                if (Phaser.Input.Keyboard.JustDown(this.keys.strongAttack)) {
                    this.performAttack('strong', 20);
                }

                // 필살기 (C 키)
                if (Phaser.Input.Keyboard.JustDown(this.keys.specialSkill)) {
                    this.performAttack('special', 30);
                }
            }

            // 애니메이션 업데이트
            this.myPlayer.updateAnimation();

            // 현재 능력 업데이트
            const ability = this.myPlayer.getCurrentAbility();
            if (ability) {
                ability.update();
            }

            // 2. 내 위치를 서버로 전송 (50ms마다)
            if (time - this.lastUpdateTime > this.updateInterval) {
                this.sendMyPosition();
                this.lastUpdateTime = time;
            }

            // 3. 보스 AI 업데이트 (Host만)
            if (this.boss && this.boss.update && this.playerNumber === 1) {
                // CoopBoss의 updateAI 메서드 호출 (player1, player2 전달)
                // opponent는 스프라이트만 있으므로 간단한 객체로 wrapping
                const player1 = this.myPlayer;
                const player2 = {
                    sprite: this.opponent,
                    isAlive: this.opponentHp > 0
                };

                this.boss.update(player1, player2);
            }

        } catch (error) {
            console.error('[CoopBossRaidScene] update 오류:', error);
        }
    }

    // ============================================
    // 공격 수행 및 서버 전송
    // ============================================
    performAttack(attackType, damage) {
        if (!this.myPlayer || this.gameOver) return;

        // 능력 쿨타임 체크 (서버 전송 전에 먼저 확인)
        const ability = this.myPlayer.getCurrentAbility();
        if (!ability) return;

        let canAttack = false;
        if (attackType === 'basic') {
            canAttack = ability.canUseBasicAttack();
        } else if (attackType === 'strong') {
            canAttack = ability.canUseStrongAttack();
        } else if (attackType === 'special') {
            canAttack = ability.canUseSkill();
        }

        // 쿨타임 중이면 공격하지 않음
        if (!canAttack) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log(`[공격 실패] ${attackType} 쿨타임 중`);
            }
            return;
        }

        // 공격 애니메이션 재생
        if (attackType === 'basic') {
            this.myPlayer.basicAttack();
        } else if (attackType === 'strong') {
            this.myPlayer.strongAttack();
        } else if (attackType === 'special') {
            this.myPlayer.specialSkill();
        }

        // 서버로 공격 정보 전송 (쿨타임 체크 통과 시에만)
        const direction = this.myPlayer.facingRight ? 1 : -1;
        this.socket.emit('playerAttack', {
            roomId: this.roomId,
            attackType: attackType,
            x: this.myPlayer.sprite.x,
            y: this.myPlayer.sprite.y,
            direction: direction
        });

        // ============================================
        // 보스 히트 판정 (협동 모드)
        // ============================================
        if (this.boss && this.boss.sprite) {
            const bossDist = Phaser.Math.Distance.Between(
                this.myPlayer.sprite.x,
                this.myPlayer.sprite.y,
                this.boss.sprite.x,
                this.boss.sprite.y
            );

            // 거리 체크 + 방향 체크
            const dx = this.boss.sprite.x - this.myPlayer.sprite.x;
            const isFacingBoss = (direction > 0 && dx > 0) || (direction < 0 && dx < 0);

            // 공격 범위 150px (네트워크 지연 보상)
            if (bossDist < 150 && isFacingBoss) {
                // Host만 보스에게 데미지 적용
                if (this.playerNumber === 1 && this.boss.takeDamage) {
                    this.boss.takeDamage(damage);
                    console.log(`[보스 피격!] ${attackType} - ${damage} 데미지 - 남은 HP: ${this.boss.hp}`);

                    // 피격 이펙트
                    this.createHitEffect(this.boss.sprite.x, this.boss.sprite.y);
                } else {
                    // Client는 피격 로그만 출력
                    console.log(`[보스 공격 적중!] ${attackType} - 거리: ${Math.round(bossDist)}px`);
                }
            }
        }

        // ============================================
        // 상대 플레이어 히트 판정 (PvP, 현재는 사용 안 함)
        // ============================================
        // 협동 모드에서는 플레이어끼리 공격하지 않음
        // 필요시 주석 해제
        /*
        if (this.opponent) {
            const distance = Phaser.Math.Distance.Between(
                this.myPlayer.sprite.x,
                this.myPlayer.sprite.y,
                this.opponent.x,
                this.opponent.y
            );

            const dx = this.opponent.x - this.myPlayer.sprite.x;
            const isFacingOpponent = (direction > 0 && dx > 0) || (direction < 0 && dx < 0);

            if (distance < 150 && isFacingOpponent) {
                console.log(`[공격 적중!] ${attackType} - 거리: ${Math.round(distance)}px - ${damage} 데미지`);
            }
        }
        */
    }

    // ============================================
    // 내 위치를 서버로 전송
    // ============================================
    sendMyPosition() {
        if (!this.socket || !this.myPlayer) return;

        this.socket.emit('playerMove', {
            roomId: this.roomId,
            x: this.myPlayer.sprite.x,
            y: this.myPlayer.sprite.y,
            velocityX: this.myPlayer.sprite.body.velocity.x,
            velocityY: this.myPlayer.sprite.body.velocity.y,
            facingRight: this.myPlayer.facingRight
        });
    }

    // ============================================
    // 피해 받기
    // ============================================
    takeDamage(damage) {
        if (this.myPlayer.isInvincible || this.gameOver) return;

        this.myHp = Math.max(0, this.myHp - damage);
        this.updateMyHP();

        // 서버에 피격 알림
        this.socket.emit('playerHit', {
            roomId: this.roomId,
            damage: damage,
            hp: this.myHp
        });

        // 사망 체크
        if (this.myHp <= 0) {
            this.die();
        }
    }

    // ============================================
    // 내 체력바 업데이트
    // ============================================
    updateMyHP() {
        const hpPercent = this.myHp / 100;
        this.myHpBar.width = 190 * hpPercent;
        this.myHpText.setText(`Player ${this.playerNumber}: ${this.myHp}`);

        // 체력에 따라 색상 변경
        if (hpPercent > 0.5) {
            this.myHpBar.setFillStyle(0x00ff00);  // 초록색
        } else if (hpPercent > 0.25) {
            this.myHpBar.setFillStyle(0xffff00);  // 노란색
        } else {
            this.myHpBar.setFillStyle(0xff0000);  // 빨간색
        }
    }

    // ============================================
    // 상대 체력바 업데이트
    // ============================================
    updateOpponentHP() {
        const hpPercent = this.opponentHp / 100;
        this.oppHpBar.width = 190 * hpPercent;
        this.oppHpText.setText(`Player ${this.playerNumber === 1 ? 2 : 1}: ${this.opponentHp}`);

        if (hpPercent > 0.5) {
            this.oppHpBar.setFillStyle(0xff0000);  // 빨간색
        } else if (hpPercent > 0.25) {
            this.oppHpBar.setFillStyle(0xff8800);  // 주황색
        } else {
            this.oppHpBar.setFillStyle(0xff0000);  // 빨간색
        }
    }

    // ============================================
    // 사망 처리
    // ============================================
    die() {
        if (this.gameOver || this.isDead) return;

        this.isDead = true;

        // 서버에 사망 알림
        this.socket.emit('playerDied', {
            roomId: this.roomId
        });

        // 플레이어 투명도 낮추기 (사망 표시)
        if (this.myPlayer && this.myPlayer.sprite) {
            this.myPlayer.sprite.setAlpha(0.3);
        }

        // 부활 대기 시작
        this.startReviveWaiting();

        console.log('[사망] 부활 대기 시작...');
    }

    // ============================================
    // 부활 대기 시작 (10초 카운트다운)
    // ============================================
    startReviveWaiting() {
        this.reviveTimeLeft = 10;

        // 부활 UI 표시
        this.showMessage(`💀 사망! 파트너가 부활 가능 (${this.reviveTimeLeft}초)`, 99999, '#ff0000');

        // 1초마다 타이머 업데이트
        this.reviveTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.reviveTimeLeft--;

                if (this.reviveTimeLeft > 0) {
                    this.showMessage(`💀 사망! 파트너가 부활 가능 (${this.reviveTimeLeft}초)`, 99999, '#ff0000');
                } else {
                    // 10초 경과 - 부활 실패
                    if (this.reviveTimer) {
                        this.reviveTimer.remove();
                    }

                    // 둘 다 죽었으면 게임 종료
                    if (this.opponentIsDead) {
                        console.log('[게임 종료] 양쪽 플레이어 모두 사망');
                        this.endGame(false);
                    } else {
                        this.showMessage('❌ 부활 실패... 혼자 버티세요!', 3000, '#ff0000');
                    }
                }
            },
            loop: true
        });
    }

    // ============================================
    // 파트너가 F키로 부활 시도
    // ============================================
    attemptRevive() {
        // 내가 살아있고, 파트너가 죽었고, HP가 30 이상이어야 부활 가능
        if (this.isDead || !this.opponentIsDead || this.myHp < 30) {
            return;
        }

        // 거리 체크 (100px 이내에 있어야 함)
        if (!this.opponent) return;

        const distance = Phaser.Math.Distance.Between(
            this.myPlayer.sprite.x,
            this.myPlayer.sprite.y,
            this.opponent.x,
            this.opponent.y
        );

        if (distance > 100) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log(`[부활 실패] 거리가 너무 멉니다: ${Math.round(distance)}px`);
            }
            return;
        }

        // 부활 실행
        this.myHp -= 30;  // HP 30 소모
        this.updateMyHP();

        // 서버에 부활 알림
        this.socket.emit('playerRevive', {
            roomId: this.roomId,
            revivedPlayerNumber: this.playerNumber === 1 ? 2 : 1  // 상대방 플레이어 번호
        });

        // 상대방이 부활했음을 표시
        this.opponentIsDead = false;
        this.opponentHp = 50;  // 50 HP로 부활
        this.updateOpponentHP();

        // 상대 플레이어 투명도 원래대로
        if (this.opponent) {
            this.opponent.setAlpha(1);
        }

        // 이펙트
        this.createReviveEffect(this.opponent.x, this.opponent.y);

        console.log(`[부활 성공] 파트너를 부활시켰습니다! (남은 HP: ${this.myHp})`);
        this.showMessage('✨ 파트너 부활 성공!', 2000, '#00ff00');
    }

    // ============================================
    // 부활 처리 (내가 부활될 때)
    // ============================================
    revive() {
        if (!this.isDead) return;

        this.isDead = false;
        this.myHp = 50;  // 50 HP로 부활
        this.updateMyHP();

        // 플레이어 투명도 원래대로
        if (this.myPlayer && this.myPlayer.sprite) {
            this.myPlayer.sprite.setAlpha(1);
        }

        // 부활 타이머 제거
        if (this.reviveTimer) {
            this.reviveTimer.remove();
            this.reviveTimer = null;
        }

        console.log('[부활] 파트너가 부활시켜줬습니다!');
        this.showMessage('✨ 부활!', 2000, '#00ff00');
    }

    // ============================================
    // 부활 이펙트
    // ============================================
    createReviveEffect(x, y) {
        // 빛나는 원형 이펙트
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 30;

            const particle = this.add.circle(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                5,
                0x00FF00,
                1
            );

            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 2,
                y: particle.y - 50,
                duration: 1000,
                onComplete: () => particle.destroy()
            });
        }
    }

    // ============================================
    // 게임 종료
    // ============================================
    endGame(isWin) {
        if (this.gameOver) return;
        this.gameOver = true;

        const message = isWin ? '🎉 승리!' : '💀 패배!';
        const color = isWin ? '#00ff00' : '#ff0000';

        this.showMessage(message, 3000, color);

        // 3초 후 메인 메뉴로 (cleanup은 shutdown에서 자동 호출됨)
        this.time.delayedCall(3000, () => {
            this.scene.start('MainMenuScene');
        });
    }

    // ============================================
    // 메시지 표시
    // ============================================
    showMessage(text, duration = 2000, color = '#ffff00') {
        this.messageText.setText(text);
        this.messageText.setColor(color);
        this.messageText.setVisible(true);
        this.messageText.setAlpha(0);

        // 페이드 인
        this.tweens.add({
            targets: this.messageText,
            alpha: 1,
            duration: 300,
            onComplete: () => {
                // duration 후 페이드 아웃
                this.time.delayedCall(duration, () => {
                    this.tweens.add({
                        targets: this.messageText,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            this.messageText.setVisible(false);
                        }
                    });
                });
            }
        });
    }

    // ============================================
    // 이펙트 생성 함수들
    // ============================================
    createJumpEffect(x, y) {
        const circle = this.add.circle(x, y + 15, 15, 0xffffff, 0.6);
        this.tweens.add({
            targets: circle,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => circle.destroy()
        });
    }

    createDashEffect(x, y) {
        const trail = this.add.sprite(x, y, 'player_idle');
        trail.setAlpha(0.3);
        this.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 200,
            onComplete: () => trail.destroy()
        });
    }

    createAttackEffect(x, y, direction) {
        const slash = this.add.rectangle(
            x + (direction * 30),
            y,
            40,
            10,
            0xffff00,
            0.8
        );
        this.tweens.add({
            targets: slash,
            alpha: 0,
            scaleX: 1.5,
            duration: 200,
            onComplete: () => slash.destroy()
        });
    }

    createHitEffect(x, y) {
        // 피격 파티클 (별 모양)
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 100;

            const particle = this.add.star(
                x, y, 5, 5, 10, 0xFF0000, 1
            );

            this.physics.add.existing(particle);
            particle.body.setAllowGravity(false);
            particle.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.5,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
    }

    // ============================================
    // 정리 (Scene 종료 시)
    // ============================================
    cleanup() {
        // 직업 선택 UI 제거
        this.removeJobSelectionUI();

        // 터치 컨트롤 제거 (모바일인 경우)
        if (this.touchControls) {
            this.touchControls.destroy();
            this.touchControls = null;
        }

        // 부활 타이머 제거
        if (this.reviveTimer) {
            this.reviveTimer.remove();
            this.reviveTimer = null;
        }

        // 보스 동기화 이벤트 제거 (Host)
        if (this.bossSyncEvent) {
            this.bossSyncEvent.remove();
            this.bossSyncEvent = null;
        }

        // 보스 파괴 (Host만 실제 CoopBoss 인스턴스 가지고 있음)
        if (this.boss) {
            if (this.boss.destroy) {
                this.boss.destroy();  // CoopBoss 인스턴스
            } else if (this.boss.sprite) {
                this.boss.sprite.destroy();  // Client의 간단한 스프라이트
            }
            this.boss = null;
        }

        // 보스 HP바 제거
        if (this.bossHpBarBg) this.bossHpBarBg.destroy();
        if (this.bossHpBar) this.bossHpBar.destroy();
        if (this.bossHpText) this.bossHpText.destroy();

        if (this.socket) {
            // 이벤트 리스너 제거
            this.socket.off('opponentJobSelected');
            this.socket.off('gameStart');
            this.socket.off('opponentMove');
            this.socket.off('opponentJump');
            this.socket.off('opponentDash');
            this.socket.off('opponentAttack');
            this.socket.off('opponentHit');
            this.socket.off('opponentDied');
            this.socket.off('opponentDisconnected');
            this.socket.off('opponentAnimation');
            this.socket.off('bossSync');  // 보스 동기화 이벤트 제거
            this.socket.off('playerRevive');  // 부활 이벤트 제거

            // Socket 연결 끊기 (중요!)
            if (this.socket.connected) {
                this.socket.disconnect();
            }

            // Socket 참조 제거
            this.socket = null;
        }

        if (this.myPlayer) {
            this.myPlayer.destroy();
        }

        // 게임 상태 초기화
        this.gameOver = false;
        this.jobSelectionPhase = true;
        this.selectedJob = null;
        this.opponentJob = null;
        this.selectionTimer = 20;
        this.myHp = 100;
        this.opponentHp = 100;
        this.isMobile = false;
    }

    shutdown() {
        this.cleanup();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.CoopBossRaidScene = CoopBossRaidScene;
}
