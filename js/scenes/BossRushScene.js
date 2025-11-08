// 보스 러시 모드 - 3개 보스 연속 전투
class BossRushScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossRushScene' });
    }

    preload() {
        // 플레이어 스프라이트시트 로드
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

        // 슬라임 보스 스프라이트시트
        this.load.spritesheet('slime_idle', 'assets/Slime/Idle-Run (44x30).png', {
            frameWidth: 44,
            frameHeight: 30
        });
        this.load.spritesheet('slime_hit', 'assets/Slime/Hit (44x30).png', {
            frameWidth: 44,
            frameHeight: 30
        });

        // Rino 보스 스프라이트시트
        this.load.spritesheet('rino_idle', 'assets/Rino/Idle (52x34).png', {
            frameWidth: 52,
            frameHeight: 34
        });
        this.load.spritesheet('rino_run', 'assets/Rino/Run (52x34).png', {
            frameWidth: 52,
            frameHeight: 34
        });
        this.load.spritesheet('rino_hit', 'assets/Rino/Hit (52x34).png', {
            frameWidth: 52,
            frameHeight: 34
        });

        // Skull 보스 스프라이트시트
        this.load.spritesheet('skull_idle', 'assets/Skull/Idle 1 (52x54).png', {
            frameWidth: 52,
            frameHeight: 54
        });
        this.load.spritesheet('skull_hit', 'assets/Skull/Hit (52x54).png', {
            frameWidth: 52,
            frameHeight: 54
        });
    }

    create() {
        try {
            // 플레이어 애니메이션 생성
            this.createPlayerAnimations();

            // 보스 애니메이션 생성
            this.createSlimeAnimations();
            this.createRinoAnimations();
            this.createSkullAnimations();

            // 배경색 (어두운 보라색)
            this.cameras.main.setBackgroundColor(0x2a0845);

            // 전역 변수 초기화
            window.player = null;
            window.items = [];

            // 로컬 변수
            this.platforms = null;
            this.groundGroup = null;
            this.boss = null;
            this.currentBossIndex = 0;
            this.bossDefeated = false;
            this.isTransitioning = false;

            // 보스 순서 (7개 모든 보스, 난이도 순)
            this.bossSequence = [
                { name: 'SlimeBoss', class: window.SlimeBoss, title: 'SLIME KING', color: '#00ff00' },
                { name: 'BlueBirdBoss', class: window.BlueBirdBoss, title: 'SKY TERROR', color: '#00aaff' },
                { name: 'CoopBoss', class: window.CoopBoss, title: 'ROOSTER WARRIOR', color: '#ff8800' },
                { name: 'SwordBoss', class: window.SwordBoss, title: 'BLADE MASTER', color: '#ffff00' },
                { name: 'RinoBoss', class: window.RinoBoss, title: 'RAGING RHINO', color: '#808080' },
                { name: 'MageBoss', class: window.MageBoss, title: 'ARCHMAGE', color: '#aa00ff' },
                { name: 'SkullBoss', class: window.SkullBoss, title: 'DEATH SKULL', color: '#ff0000' }
            ];

            // 타이머 시작
            this.startTime = Date.now();
            this.elapsedTime = 0;

            // 증강 시스템 초기화
            this.augmentSystem = new AugmentSystem(this);

            // 키보드 입력
            this.cursors = null;
            this.keys = null;

            // UI
            this.healthText = null;
            this.abilityText = null;
            this.cooldownText = null;
            this.bossCountText = null;
            this.bossHpBar = null;
            this.bossHpBarBg = null;
            this.bossNameText = null;

            // 아이템 알림 UI
            this.itemNotificationUI = null;

            // 패시브 아이템 툴팁 UI
            this.passiveItemTooltipUI = null;

            // 터치 컨트롤 (모바일용)
            this.touchControls = null;
            this.isMobile = MobileDetector.isMobile();

            // 월드 크기 설정
            this.physics.world.setBounds(0, 0, CONSTANTS.GAME.WIDTH, CONSTANTS.GAME.HEIGHT);

            // 플랫폼 그룹 생성
            this.platforms = this.physics.add.staticGroup();
            this.groundGroup = this.physics.add.staticGroup();

            // 바닥 생성
            this.createGround();

            // 중앙 플랫폼 생성
            this.createPlatforms();

            // 플레이어 생성
            window.player = new Player(this, CONSTANTS.GAME.WIDTH / 2 - 200, 400);

            // 선택된 직업 세트에 따라 능력 장착
            const selectedJobSet = this.registry.get('selectedJobSet') || 'swordMagic';

            let ability1, ability2;

            if (selectedJobSet === 'swordMagic') {
                // 검/마법 세트
                ability1 = new SwordAbility(this);
                ability2 = new MagicAbility(this);

                if (CONSTANTS.GAME.DEBUG) {
                    console.log('보스 러시 - 직업 세트: 검/마법');
                }
            } else if (selectedJobSet === 'hammerBow') {
                // 해머/활 세트
                ability1 = new HammerAbility(this);
                ability2 = new BowAbility(this);

                if (CONSTANTS.GAME.DEBUG) {
                    console.log('보스 러시 - 직업 세트: 해머/활');
                }
            } else {
                // 기본값: 검/마법
                ability1 = new SwordAbility(this);
                ability2 = new MagicAbility(this);
            }

            window.player.equipAbility(ability1, 0);
            window.player.equipAbility(ability2, 1);
            window.player.setCurrentAbilityIndex(0); // 시작은 첫 번째 능력

            // 카메라 설정
            this.setupCamera();

            // 충돌 설정
            this.setupCollisions();

            // 키보드 입력 설정
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keys = {
                dash: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
                basicAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
                strongAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
                specialSkill: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
                abilitySwap1: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
                abilitySwap2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
            };

            // UI 생성
            this.createUI();

            // 아이템 알림 UI 초기화
            this.itemNotificationUI = new ItemNotificationUI(this);

            // 패시브 아이템 툴팁 UI 초기화
            this.passiveItemTooltipUI = new PassiveItemTooltipUI(this);

            // 터치 컨트롤 초기화 (모바일에서만)
            if (this.isMobile) {
                this.touchControls = new TouchControls(this);
                if (CONSTANTS.GAME.DEBUG) {
                    console.log('모바일 터치 컨트롤 활성화');
                }
            }

            // ESC 키로 일시정지
            this.input.keyboard.on('keydown-ESC', () => {
                this.pauseGame();
            });

            // 이벤트 리스너
            this.events.on('playerDied', this.handlePlayerDeath, this);
            this.events.on('bossDefeated', this.handleBossDefeated, this);

            // 현재 씬을 레지스트리에 저장
            this.registry.set('activeScene', 'BossRushScene');

            // 게임 시작 시 증강 선택
            this.time.delayedCall(1000, () => {
                this.augmentSystem.showAugmentSelection(window.player, () => {
                    // 증강 선택 후 첫 번째 보스 소환
                    this.spawnBoss(0);
                });
            });

            if (CONSTANTS.GAME.DEBUG) {
                console.log('보스 러시 모드 시작!');
            }

        } catch (error) {
            console.error('BossRushScene create 오류:', error);
        }
    }

    createPlayerAnimations() {
        if (this.anims.exists('player_idle')) return;

        this.anims.create({
            key: 'player_idle',
            frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 10 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'player_run',
            frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 11 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'player_jump',
            frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 0 }),
            frameRate: 1
        });

        this.anims.create({
            key: 'player_fall',
            frames: this.anims.generateFrameNumbers('player_fall', { start: 0, end: 0 }),
            frameRate: 1
        });

        this.anims.create({
            key: 'player_double_jump',
            frames: this.anims.generateFrameNumbers('player_double_jump', { start: 0, end: 5 }),
            frameRate: 12
        });

        this.anims.create({
            key: 'player_hit',
            frames: this.anims.generateFrameNumbers('player_hit', { start: 0, end: 6 }),
            frameRate: 12
        });
    }

    createSlimeAnimations() {
        if (this.anims.exists('slime_idle')) return;

        this.anims.create({
            key: 'slime_idle',
            frames: this.anims.generateFrameNumbers('slime_idle', { start: 0, end: 9 }),
            frameRate: 10,
            repeat: -1
        });

        // slime_run은 slime_idle과 동일하게 처리 (별도 스프라이트 없음)
        this.anims.create({
            key: 'slime_run',
            frames: this.anims.generateFrameNumbers('slime_idle', { start: 0, end: 9 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'slime_hit',
            frames: this.anims.generateFrameNumbers('slime_hit', { start: 0, end: 4 }),
            frameRate: 12
        });
    }

    createRinoAnimations() {
        if (this.anims.exists('rino_idle')) return;

        this.anims.create({
            key: 'rino_idle',
            frames: this.anims.generateFrameNumbers('rino_idle', { start: 0, end: 10 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'rino_run',
            frames: this.anims.generateFrameNumbers('rino_run', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'rino_hit',
            frames: this.anims.generateFrameNumbers('rino_hit', { start: 0, end: 4 }),
            frameRate: 12
        });
    }

    createSkullAnimations() {
        if (this.anims.exists('skull_idle')) return;

        this.anims.create({
            key: 'skull_idle',
            frames: this.anims.generateFrameNumbers('skull_idle', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'skull_hit',
            frames: this.anims.generateFrameNumbers('skull_hit', { start: 0, end: 4 }),
            frameRate: 12
        });
    }

    createGround() {
        const groundWidth = 400;
        const groundHeight = 40;
        const groundY = CONSTANTS.GAME.HEIGHT - 20;

        for (let x = 0; x < CONSTANTS.GAME.WIDTH; x += groundWidth) {
            const ground = this.add.rectangle(
                x + groundWidth / 2,
                groundY,
                groundWidth,
                groundHeight,
                0x444444
            );
            this.groundGroup.add(ground);
        }

        this.groundGroup.refresh();
    }

    createPlatforms() {
        // 중앙 플랫폼 (보스 전투 공간)
        const platformData = [
            { x: 200, y: 480, w: 120, h: 20 },
            { x: CONSTANTS.GAME.WIDTH - 200, y: 480, w: 120, h: 20 },
            { x: CONSTANTS.GAME.WIDTH / 2, y: 380, w: 200, h: 20 }
        ];

        platformData.forEach(data => {
            const platform = this.add.rectangle(
                data.x,
                data.y,
                data.w,
                data.h,
                0x666666
            );
            this.platforms.add(platform);
        });

        this.platforms.refresh();
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, CONSTANTS.GAME.WIDTH, CONSTANTS.GAME.HEIGHT);
        this.cameras.main.startFollow(window.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
    }

    setupCollisions() {
        // 플레이어와 플랫폼
        this.physics.add.collider(window.player.sprite, this.platforms);
        this.physics.add.collider(window.player.sprite, this.groundGroup);
    }

    spawnBoss(bossIndex) {
        if (bossIndex >= this.bossSequence.length) {
            // 모든 보스 처치 완료!
            this.handleAllBossesDefeated();
            return;
        }

        const bossInfo = this.bossSequence[bossIndex];

        // 보스 등장 알림
        const bossText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            `⚠️ BOSS ${bossIndex + 1}/7 ⚠️\n${bossInfo.title}`,
            {
                fontSize: '48px',
                fill: bossInfo.color,
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 6,
                align: 'center'
            }
        );
        bossText.setOrigin(0.5);
        bossText.setScrollFactor(0);
        bossText.setDepth(1000);

        // 보스 텍스트 애니메이션
        this.tweens.add({
            targets: bossText,
            scale: 1.2,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                bossText.destroy();

                try {
                    // 보스 생성
                    const BossClass = bossInfo.class;
                    console.log('보스 클래스 확인:', bossInfo.name, BossClass);

                    if (!BossClass) {
                        throw new Error(`${bossInfo.name} 클래스를 찾을 수 없습니다`);
                    }

                    this.boss = new BossClass(this, CONSTANTS.GAME.WIDTH / 2 + 150, 350);
                    console.log('보스 생성됨:', this.boss);
                    console.log('보스 스프라이트:', this.boss.sprite);
                    console.log('보스 위치:', this.boss.sprite.x, this.boss.sprite.y);
                    console.log('보스 visible:', this.boss.sprite.visible);
                    console.log('보스 active:', this.boss.sprite.active);

                    // 난이도 적용
                    const difficultyMultiplier = window.difficultyManager.getDifficultyInfo();
                    this.boss.maxHp = Math.round(this.boss.maxHp * difficultyMultiplier.enemyHpMultiplier);
                    this.boss.hp = this.boss.maxHp;
                    this.boss.damage = Math.round(this.boss.damage * difficultyMultiplier.enemyDamageMultiplier);
                    if (this.boss.sprite) {
                        this.boss.sprite.setData('damage', this.boss.damage);
                    }

                    // 보스와 플레이어 충돌 설정
                    this.physics.add.overlap(
                        window.player.sprite,
                        this.boss.sprite,
                        this.handlePlayerBossCollision,
                        null,
                        this
                    );

                    // 보스와 플랫폼 충돌
                    this.physics.add.collider(this.boss.sprite, this.platforms);
                    this.physics.add.collider(this.boss.sprite, this.groundGroup);

                    this.bossDefeated = false;

                    console.log(`${bossInfo.title} 생성 완료! HP: ${this.boss.hp}, 위치: (${this.boss.sprite.x}, ${this.boss.sprite.y})`);
                } catch (error) {
                    console.error('보스 생성 중 오류:', error);
                    console.error('오류 스택:', error.stack);
                }
            }
        });
    }

    handlePlayerBossCollision(playerSprite, bossSprite) {
        const bossEntity = bossSprite.getData('entity');
        const damage = bossSprite.getData('damage');

        if (bossEntity && bossEntity.isAlive && window.player && window.player.isAlive) {
            window.player.takeDamage(damage);
        }
    }

    handleAttackBossCollision(attackObj, bossSprite) {
        const bossEntity = bossSprite.getData('entity');
        const damage = attackObj.getData('damage');

        if (bossEntity && bossEntity.isAlive && !bossEntity.isHit) {
            // 보스가 죽을지 체크
            const willDie = bossEntity.hp <= damage;

            bossEntity.takeDamage(damage);

            // 보스 처치 시 흡혈 (검술 능력만)
            if (willDie) {
                const currentAbility = window.player.getCurrentAbility();
                if (currentAbility && currentAbility.name === '검술') {
                    window.player.vampiricHeal(3);
                }
            }

            if (attackObj && attackObj.active) {
                attackObj.destroy();
            }
        }
    }

    handleBossDefeated(stageNumber) {
        if (this.bossDefeated || this.isTransitioning) return;

        this.bossDefeated = true;
        this.isTransitioning = true;

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`보스 ${this.currentBossIndex + 1} 처치!`);
        }

        // 플레이어 체력 회복 (50% 기본 + 증강 보너스)
        const baseHealRatio = 0.5;
        const augmentHealRatio = window.player.healOnBossKill || 0;
        const totalHealRatio = baseHealRatio + augmentHealRatio;
        const healAmount = Math.floor(window.player.maxHp * totalHealRatio);
        window.player.hp = Math.min(window.player.maxHp, window.player.hp + healAmount);

        // 승리 텍스트
        const victoryText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            `BOSS ${this.currentBossIndex + 1} DEFEATED!\n체력 50% 회복!`,
            {
                fontSize: '36px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 6,
                align: 'center'
            }
        );
        victoryText.setOrigin(0.5);
        victoryText.setScrollFactor(0);
        victoryText.setDepth(1000);

        this.tweens.add({
            targets: victoryText,
            scale: 1.2,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                victoryText.destroy();

                // 다음 보스로 이동
                this.currentBossIndex++;
                this.isTransitioning = false;

                // 증강 선택 후 다음 보스 소환
                this.time.delayedCall(500, () => {
                    this.augmentSystem.showAugmentSelection(window.player, () => {
                        this.spawnBoss(this.currentBossIndex);
                    });
                });
            }
        });
    }

    handleAllBossesDefeated() {
        if (CONSTANTS.GAME.DEBUG) {
            console.log('모든 보스 처치 완료!');
        }

        // 클리어 시간 계산
        this.elapsedTime = Date.now() - this.startTime;
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        const milliseconds = Math.floor((this.elapsedTime % 1000) / 10);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;

        // 순위표 저장
        this.saveToLeaderboard(this.elapsedTime);
        const rank = this.getRank(this.elapsedTime);

        // 배경 어둡게
        const overlay = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            CONSTANTS.GAME.WIDTH,
            CONSTANTS.GAME.HEIGHT,
            0x000000,
            0.7
        );
        overlay.setScrollFactor(0);
        overlay.setDepth(999);

        // 최종 승리 텍스트
        const finalText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            150,
            '🎉 BOSS RUSH CLEAR! 🎉',
            {
                fontFamily: 'Orbitron',
                fontSize: '48px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 6,
                align: 'center'
            }
        );
        finalText.setOrigin(0.5);
        finalText.setScrollFactor(0);
        finalText.setDepth(1000);

        // 클리어 시간
        const timeText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            220,
            `⏱️ 클리어 시간: ${timeString}`,
            {
                fontFamily: 'Orbitron',
                fontSize: '32px',
                fill: '#FFFFFF',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4
            }
        );
        timeText.setOrigin(0.5);
        timeText.setScrollFactor(0);
        timeText.setDepth(1000);

        // 랭크 표시
        const rankText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            270,
            `🏆 순위: ${rank}위`,
            {
                fontFamily: 'Jua',
                fontSize: '28px',
                fill: rank <= 3 ? '#FFD700' : '#FFFFFF',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4
            }
        );
        rankText.setOrigin(0.5);
        rankText.setScrollFactor(0);
        rankText.setDepth(1000);

        // 순위표 표시
        this.showLeaderboard(330);

        // 버튼들
        const retryButton = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2 - 120,
            CONSTANTS.GAME.HEIGHT - 80,
            200, 50,
            0x4444FF
        );
        retryButton.setStrokeStyle(3, 0xFFFFFF);
        retryButton.setInteractive();
        retryButton.setScrollFactor(0);
        retryButton.setDepth(1000);

        const retryText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2 - 120,
            CONSTANTS.GAME.HEIGHT - 80,
            '다시 도전',
            {
                fontFamily: 'Jua',
                fontSize: '24px',
                fill: '#FFFFFF'
            }
        );
        retryText.setOrigin(0.5);
        retryText.setScrollFactor(0);
        retryText.setDepth(1001);

        retryButton.on('pointerdown', () => {
            this.scene.restart();
        });

        retryButton.on('pointerover', () => {
            retryButton.setFillStyle(0x6666FF);
        });

        retryButton.on('pointerout', () => {
            retryButton.setFillStyle(0x4444FF);
        });

        // 메뉴로 버튼
        const menuButton = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2 + 120,
            CONSTANTS.GAME.HEIGHT - 80,
            200, 50,
            0xFF4444
        );
        menuButton.setStrokeStyle(3, 0xFFFFFF);
        menuButton.setInteractive();
        menuButton.setScrollFactor(0);
        menuButton.setDepth(1000);

        const menuText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2 + 120,
            CONSTANTS.GAME.HEIGHT - 80,
            '메인 메뉴',
            {
                fontFamily: 'Jua',
                fontSize: '24px',
                fill: '#FFFFFF'
            }
        );
        menuText.setOrigin(0.5);
        menuText.setScrollFactor(0);
        menuText.setDepth(1001);

        menuButton.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });

        menuButton.on('pointerover', () => {
            menuButton.setFillStyle(0xFF6666);
        });

        menuButton.on('pointerout', () => {
            menuButton.setFillStyle(0xFF4444);
        });
    }

    // 순위표 저장 (로컬 스토리지)
    saveToLeaderboard(time) {
        let leaderboard = JSON.parse(localStorage.getItem('bossRushLeaderboard') || '[]');

        leaderboard.push({
            time: time,
            date: new Date().toLocaleDateString()
        });

        // 시간순 정렬 (짧은 시간부터)
        leaderboard.sort((a, b) => a.time - b.time);

        // 상위 10개만 저장
        leaderboard = leaderboard.slice(0, 10);

        localStorage.setItem('bossRushLeaderboard', JSON.stringify(leaderboard));
    }

    // 현재 랭크 가져오기
    getRank(time) {
        const leaderboard = JSON.parse(localStorage.getItem('bossRushLeaderboard') || '[]');
        const index = leaderboard.findIndex(entry => entry.time === time);
        return index + 1;
    }

    // 순위표 표시
    showLeaderboard(startY) {
        const leaderboard = JSON.parse(localStorage.getItem('bossRushLeaderboard') || '[]');

        const titleText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            startY,
            '📊 최고 기록 TOP 5',
            {
                fontFamily: 'Jua',
                fontSize: '24px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 3
            }
        );
        titleText.setOrigin(0.5);
        titleText.setScrollFactor(0);
        titleText.setDepth(1000);

        const top5 = leaderboard.slice(0, 5);
        top5.forEach((entry, index) => {
            const minutes = Math.floor(entry.time / 60000);
            const seconds = Math.floor((entry.time % 60000) / 1000);
            const milliseconds = Math.floor((entry.time % 1000) / 10);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;

            const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#FFFFFF';

            const entryText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                startY + 40 + (index * 30),
                `${index + 1}. ${timeString}`,
                {
                    fontFamily: 'Orbitron',
                    fontSize: '20px',
                    fill: rankColor,
                    fontStyle: 'bold'
                }
            );
            entryText.setOrigin(0.5);
            entryText.setScrollFactor(0);
            entryText.setDepth(1000);
        });
    }

    createUI() {
        // 스테이지 이름
        const titleText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            16,
            'BOSS RUSH MODE',
            {
                fontFamily: 'Orbitron',
                fontSize: '24px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4
            }
        );
        titleText.setOrigin(0.5, 0);
        titleText.setScrollFactor(0);

        // 보스 진행도 표시
        this.bossCountText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2 - 100,
            50,
            'BOSS: 1/7',
            {
                fontFamily: 'Orbitron',
                fontSize: '20px',
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 10, y: 5 },
                fontStyle: 'bold'
            }
        );
        this.bossCountText.setOrigin(0.5, 0);
        this.bossCountText.setScrollFactor(0);

        // 타이머 표시
        this.timerText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2 + 100,
            50,
            '⏱️ 0:00.00',
            {
                fontFamily: 'Orbitron',
                fontSize: '20px',
                fill: '#FFFF00',
                backgroundColor: '#000',
                padding: { x: 10, y: 5 },
                fontStyle: 'bold'
            }
        );
        this.timerText.setOrigin(0.5, 0);
        this.timerText.setScrollFactor(0);

        // 체력 표시
        this.healthText = this.add.text(16, 84, '', {
            fontFamily: 'Jua',
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.healthText.setScrollFactor(0);

        // 능력 표시
        this.abilityText = this.add.text(16, 118, '', {
            fontFamily: 'Jua',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.abilityText.setScrollFactor(0);

        // 쿨타임 표시
        this.cooldownText = this.add.text(16, 148, '', {
            fontFamily: 'Orbitron',
            fontSize: '14px',
            fill: '#ffff00',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.cooldownText.setScrollFactor(0);

        // 조작법 (Q/E 전환 포함)
        const controlsGuide = '← → 이동 | ↑ 점프(x2) | Shift 대시\nZ/X/C 공격 | Q/E 전환';
        const controlsText = this.add.text(
            CONSTANTS.GAME.WIDTH - 16,
            16,
            controlsGuide,
            {
                fontFamily: 'Jua',
                fontSize: '12px',
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 8, y: 4 },
                align: 'right'
            }
        );
        controlsText.setOrigin(1, 0);
        controlsText.setScrollFactor(0);

        // 보스 HP 바 배경
        this.bossHpBarBg = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            125,
            400,
            20,
            0x333333
        );
        this.bossHpBarBg.setScrollFactor(0);
        this.bossHpBarBg.setDepth(99);
        this.bossHpBarBg.setVisible(false);

        // 보스 HP 바
        this.bossHpBar = this.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            125,
            400,
            20,
            0xFF0000
        );
        this.bossHpBar.setScrollFactor(0);
        this.bossHpBar.setDepth(100);
        this.bossHpBar.setVisible(false);

        // 보스 이름
        this.bossNameText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            100,
            '',
            {
                fontFamily: 'Orbitron',
                fontSize: '18px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4
            }
        );
        this.bossNameText.setOrigin(0.5);
        this.bossNameText.setScrollFactor(0);
        this.bossNameText.setDepth(100);
        this.bossNameText.setVisible(false);
    }

    updateUI() {
        // 보스 진행도
        if (this.bossCountText) {
            this.bossCountText.setText(`BOSS: ${this.currentBossIndex + 1}/7`);
        }

        // 타이머 업데이트
        if (this.timerText && this.startTime) {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const milliseconds = Math.floor((elapsed % 1000) / 10);
            this.timerText.setText(`⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`);
        }

        // 플레이어 체력
        if (window.player && this.healthText) {
            const hearts = Math.ceil(window.player.hp / 10);
            this.healthText.setText(`HP: ${'❤'.repeat(hearts)} (${window.player.hp}/${window.player.maxHp})`);
        }

        // 능력 표시
        if (window.player && this.abilityText) {
            const currentAbility = window.player.getCurrentAbility();
            const abilityName = currentAbility ? currentAbility.name : '없음';
            this.abilityText.setText(`직업: ${abilityName}`);
        }

        // 쿨타임 표시
        if (window.player && this.cooldownText) {
            const ability = window.player.getCurrentAbility();
            if (ability) {
                const cooldownReduction = window.player.cooldownReduction || 0;
                const basicCooldown = ability.config.BASIC_COOLDOWN * (1 - cooldownReduction);
                const strongCooldown = ability.config.STRONG_COOLDOWN * (1 - cooldownReduction);
                const skillCooldown = ability.config.SKILL_COOLDOWN * (1 - cooldownReduction);

                const currentTime = this.time.now;
                const basicRemaining = Math.max(0, (basicCooldown - (currentTime - ability.lastBasicAttackTime)) / 1000);
                const strongRemaining = Math.max(0, (strongCooldown - (currentTime - ability.lastStrongAttackTime)) / 1000);
                const skillRemaining = Math.max(0, (skillCooldown - (currentTime - ability.lastSkillTime)) / 1000);

                const basicText = basicRemaining > 0 ? basicRemaining.toFixed(1) + 's' : '●';
                const strongText = strongRemaining > 0 ? strongRemaining.toFixed(1) + 's' : '●';
                const skillText = skillRemaining > 0 ? skillRemaining.toFixed(1) + 's' : '●';

                this.cooldownText.setText(`Z: ${basicText} | X: ${strongText} | C: ${skillText}`);
            } else {
                this.cooldownText.setText('');
            }
        }

        // 패시브 아이템 툴팁 UI 업데이트
        if (this.passiveItemTooltipUI) {
            this.passiveItemTooltipUI.update(16, 178);
        }

        // 보스 HP 바
        if (this.boss && this.boss.isAlive) {
            this.bossHpBarBg.setVisible(true);
            this.bossHpBar.setVisible(true);
            this.bossNameText.setVisible(true);

            const hpPercentage = this.boss.hp / this.boss.maxHp;
            this.bossHpBar.width = 400 * hpPercentage;

            const bossInfo = this.bossSequence[this.currentBossIndex];
            this.bossNameText.setText(`${bossInfo.title} - HP: ${this.boss.hp}/${this.boss.maxHp}`);
        } else {
            this.bossHpBarBg.setVisible(false);
            this.bossHpBar.setVisible(false);
            this.bossNameText.setVisible(false);
        }
    }

    handlePlayerDeath() {
        console.log('플레이어 사망!');
        this.time.delayedCall(500, () => {
            this.registry.set('lastStage', 'BossRushScene');
            this.scene.start('GameOverScene');
        });
    }

    pauseGame() {
        this.registry.set('activeScene', 'BossRushScene');
        this.scene.pause();
        this.scene.launch('PauseScene');
    }

    update() {
        try {
            if (!window.player) return;

            // 터치 입력과 키보드 입력 통합
            let inputCursors = this.cursors;
            let inputKeys = this.keys;

            if (this.isMobile && this.touchControls) {
                if (this.touchControls.justPressed('jump')) {
                    window.player.jump();
                }
                if (this.touchControls.justPressed('dash')) {
                    window.player.dash();
                }
                if (this.touchControls.justPressed('basicAttack')) {
                    window.player.basicAttack();
                }
                if (this.touchControls.justPressed('strongAttack')) {
                    window.player.strongAttack();
                }
                if (this.touchControls.justPressed('skill')) {
                    window.player.specialSkill();
                }
                if (this.touchControls.justPressed('abilitySwap1') ||
                    this.touchControls.justPressed('abilitySwap2')) {
                    window.player.swapAbility();
                }

                this.touchControls.update();

                const touchInputs = this.touchControls.getInputs();

                inputCursors = {
                    left: { isDown: touchInputs.left },
                    right: { isDown: touchInputs.right },
                    up: { isDown: false },
                    down: { isDown: false }
                };

                inputKeys = {
                    dash: { isDown: false },
                    basicAttack: { isDown: false },
                    strongAttack: { isDown: false },
                    specialSkill: { isDown: false },
                    abilitySwap1: { isDown: false },
                    abilitySwap2: { isDown: false }
                };
            }

            // 플레이어 업데이트
            window.player.update(inputCursors, inputKeys);

            // 보스 업데이트
            if (this.boss && this.boss.isAlive) {
                this.boss.update();
            }

            // 플레이어 공격과 보스 충돌 체크
            const ability = window.player.getCurrentAbility();
            if (ability && ability.activeAttacks && this.boss && this.boss.isAlive) {
                ability.activeAttacks.forEach(attack => {
                    if (attack && attack.active) {
                        this.physics.overlap(
                            attack,
                            this.boss.sprite,
                            this.handleAttackBossCollision,
                            null,
                            this
                        );
                    }
                });
            }

            // 아이템 업데이트 및 충돌 체크
            window.items.forEach(item => {
                if (item && item.isActive) {
                    item.update();

                    if (item.sprite && item.sprite.body) {
                        this.physics.collide(item.sprite, this.platforms);
                        this.physics.collide(item.sprite, this.groundGroup);
                    }

                    if (window.player && window.player.sprite) {
                        this.physics.overlap(
                            window.player.sprite,
                            item.sprite,
                            () => {
                                item.onPickup(window.player);
                            },
                            null,
                            this
                        );
                    }
                }
            });

            window.items = window.items.filter(item => item && item.isActive);

            // UI 업데이트
            this.updateUI();

        } catch (error) {
            console.error('BossRushScene update 오류:', error);
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.BossRushScene = BossRushScene;
}
