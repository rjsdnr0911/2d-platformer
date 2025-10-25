// Stage 2: 폐허의 성
class Stage2Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Stage2Scene' });
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

        // Ghost 스프라이트시트 로드
        this.load.spritesheet('ghost_idle', 'assets/Ghost/Idle (44x30).png', {
            frameWidth: 44,
            frameHeight: 30
        });
        this.load.spritesheet('ghost_hit', 'assets/Ghost/Hit (44x30).png', {
            frameWidth: 44,
            frameHeight: 30
        });

        // Rino 보스 스프라이트시트 로드
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
    }

    create() {
        try {
            // 플레이어 애니메이션 생성
            this.createPlayerAnimations();

            // Ghost 애니메이션 생성
            this.createGhostAnimations();

            // Rino 애니메이션 생성
            this.createRinoAnimations();

            // 배경색 (어두운 붉은색 - 폐허의 성)
            this.cameras.main.setBackgroundColor(0xB71C1C);

            // 전역 변수 초기화
            window.player = null;
            window.abilityOrbs = [];
            window.items = [];

            // 로컬 변수
            this.platforms = null;
            this.groundGroup = null;
            this.enemies = null;
            this.enemyList = [];
            this.boss = null;
            this.bossSpawned = false;
            this.bossSpawning = false; // 보스 소환 진행 중 플래그

            // 스테이지 정보
            this.stageNumber = 2;
            this.stageName = 'Stage 2: 폐허의 성';

            // 키보드 입력
            this.cursors = null;
            this.keys = null;

            // UI
            this.healthText = null;
            this.abilityText = null;
            this.cooldownText = null;
            this.passiveItemsText = null;
            this.stageText = null;

            // 터치 컨트롤 (모바일용)
            this.touchControls = null;
            this.isMobile = MobileDetector.isMobile();

            // 월드 크기 설정
            this.physics.world.setBounds(0, 0, CONSTANTS.WORLD.WIDTH, CONSTANTS.WORLD.HEIGHT);

            // 플랫폼 그룹 생성
            this.platforms = this.physics.add.staticGroup();
            this.groundGroup = this.physics.add.staticGroup();

            // 바닥 생성
            this.createGround();

            // 플랫폼 생성 (Stage 2 레이아웃 - 성곽 테마)
            this.createPlatforms();

            // 플레이어 생성
            window.player = new Player(this, 100, 400);

            // 시작 능력 장착
            const swordAbility = new SwordAbility(this);
            const magicAbility = new MagicAbility(this);
            window.player.equipAbility(swordAbility, 0);
            window.player.equipAbility(magicAbility, 1);

            // 카메라 설정
            this.setupCamera();

            // 적 생성 (검병 중심)
            this.enemies = this.physics.add.group();
            this.createEnemies();

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

            // 터치 컨트롤 초기화 (모바일에서만)
            if (this.isMobile) {
                this.touchControls = new TouchControls(this);
                if (CONSTANTS.GAME.DEBUG) {
                    console.log('모바일 터치 컨트롤 활성화');
                }
            }

            // 이벤트 리스너
            this.events.on('playerDied', this.handlePlayerDeath, this);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('Stage 2 로드 완료');
            }

        } catch (error) {
            console.error('Stage2Scene create 오류:', error);
        }
    }

    createPlayerAnimations() {
        if (this.anims.exists('player_idle')) return; // 이미 생성되었으면 스킵

        // Idle 애니메이션 (11 프레임)
        this.anims.create({
            key: 'player_idle',
            frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 10 }),
            frameRate: 10,
            repeat: -1
        });

        // Run 애니메이션 (12 프레임)
        this.anims.create({
            key: 'player_run',
            frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 11 }),
            frameRate: 12,
            repeat: -1
        });

        // Jump 애니메이션
        this.anims.create({
            key: 'player_jump',
            frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 0 }),
            frameRate: 1
        });

        // Fall 애니메이션
        this.anims.create({
            key: 'player_fall',
            frames: this.anims.generateFrameNumbers('player_fall', { start: 0, end: 0 }),
            frameRate: 1
        });

        // Double Jump 애니메이션
        this.anims.create({
            key: 'player_double_jump',
            frames: this.anims.generateFrameNumbers('player_double_jump', { start: 0, end: 5 }),
            frameRate: 12
        });

        // Hit 애니메이션
        this.anims.create({
            key: 'player_hit',
            frames: this.anims.generateFrameNumbers('player_hit', { start: 0, end: 6 }),
            frameRate: 12
        });
    }

    createGhostAnimations() {
        // Idle 애니메이션 (10 프레임)
        this.anims.create({
            key: 'ghost_idle',
            frames: this.anims.generateFrameNumbers('ghost_idle', { start: 0, end: 9 }),
            frameRate: 10,
            repeat: -1
        });

        // Hit 애니메이션
        this.anims.create({
            key: 'ghost_hit',
            frames: this.anims.generateFrameNumbers('ghost_hit', { start: 0, end: 4 }),
            frameRate: 12
        });
    }

    createRinoAnimations() {
        // Idle 애니메이션 (11 프레임)
        this.anims.create({
            key: 'rino_idle',
            frames: this.anims.generateFrameNumbers('rino_idle', { start: 0, end: 10 }),
            frameRate: 10,
            repeat: -1
        });

        // Run 애니메이션 (6 프레임)
        this.anims.create({
            key: 'rino_run',
            frames: this.anims.generateFrameNumbers('rino_run', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        // Hit 애니메이션
        this.anims.create({
            key: 'rino_hit',
            frames: this.anims.generateFrameNumbers('rino_hit', { start: 0, end: 4 }),
            frameRate: 12
        });
    }

    createGround() {
        const groundWidth = 400;
        const groundHeight = 40;
        const groundY = CONSTANTS.WORLD.HEIGHT - 20;

        for (let x = 0; x < CONSTANTS.WORLD.WIDTH; x += groundWidth) {
            const ground = this.add.rectangle(
                x + groundWidth / 2,
                groundY,
                groundWidth,
                groundHeight,
                0x616161 // 회색 돌 (성곽 바닥)
            );
            this.groundGroup.add(ground);
        }

        this.groundGroup.refresh();
    }

    createPlatforms() {
        const platformData = [
            // 시작 구간 (높낮이가 있는 성벽)
            { x: 200, y: 450, w: 150, h: 20 },
            { x: 400, y: 380, w: 120, h: 20 },
            { x: 600, y: 480, w: 150, h: 20 },

            // 검병 구간 1 (무너진 성벽)
            { x: 900, y: 420, w: 180, h: 20 },
            { x: 1100, y: 320, w: 130, h: 20 },
            { x: 1300, y: 460, w: 150, h: 20 },

            // 검병 구간 2 (층계 형태)
            { x: 1600, y: 380, w: 160, h: 20 },
            { x: 1800, y: 280, w: 120, h: 20 },
            { x: 2000, y: 480, w: 180, h: 20 },

            // 검병 구간 3
            { x: 2300, y: 360, w: 140, h: 20 },
            { x: 2500, y: 450, w: 150, h: 20 },

            // 보스 전 구간 (높은 탑)
            { x: 2700, y: 280, w: 100, h: 20 },

            // 보스 구역 (넓은 성 광장)
            { x: 2950, y: 500, w: 300, h: 20 }
        ];

        platformData.forEach(data => {
            const platform = this.add.rectangle(
                data.x,
                data.y,
                data.w,
                data.h,
                0x8D6E63 // 갈색 돌 (성벽 플랫폼)
            );
            this.platforms.add(platform);
        });

        this.platforms.refresh();
    }

    createEnemies() {
        // Ghost 배치 (6마리)
        const ghostEnemyPositions = [
            { x: 500, y: 400 },
            { x: 1000, y: 370 },
            { x: 1200, y: 270 },
            { x: 1700, y: 330 },
            { x: 2100, y: 430 },
            { x: 2400, y: 310 }
        ];

        ghostEnemyPositions.forEach(pos => {
            const ghostEnemy = new GhostEnemy(this, pos.x, pos.y);
            this.enemyList.push(ghostEnemy);
            this.enemies.add(ghostEnemy.sprite);
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('Stage 2 적 생성 완료: Ghost', ghostEnemyPositions.length, '마리');
        }
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, CONSTANTS.WORLD.WIDTH, CONSTANTS.WORLD.HEIGHT);
        this.cameras.main.startFollow(window.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
    }

    setupCollisions() {
        // 플레이어와 플랫폼
        this.physics.add.collider(window.player.sprite, this.platforms);
        this.physics.add.collider(window.player.sprite, this.groundGroup);

        // 적과 플랫폼
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.groundGroup);

        // 플레이어와 적 충돌
        this.physics.add.overlap(
            window.player.sprite,
            this.enemies,
            this.handlePlayerEnemyCollision,
            null,
            this
        );
    }

    handlePlayerEnemyCollision(playerSprite, enemySprite) {
        const enemyEntity = enemySprite.getData('entity');
        const damage = enemySprite.getData('damage');

        if (enemyEntity && enemyEntity.isAlive && window.player && window.player.isAlive) {
            window.player.takeDamage(damage);
        }
    }

    handleAttackEnemyCollision(attackObj, enemySprite) {
        const enemyEntity = enemySprite.getData('entity');
        const damage = attackObj.getData('damage');

        if (enemyEntity && enemyEntity.isAlive && !enemyEntity.isHit) {
            enemyEntity.takeDamage(damage);

            if (attackObj && attackObj.active) {
                attackObj.destroy();
            }
        }
    }

    handleAbilityOrbCollision(playerSprite, orb) {
        if (!orb || !orb.active) return;

        const abilityType = orb.getData('abilityType');

        // 중복 체크: 이미 같은 타입의 능력이 있는지 확인
        const hasSameAbility = window.player.abilities.some(ability => {
            if (!ability) return false;
            // 능력 타입 비교 (클래스 이름 기반)
            const abilityName = ability.constructor.name.toLowerCase();
            return abilityName.includes(abilityType);
        });

        if (hasSameAbility) {
            // 이미 같은 능력이 있으면 무시
            if (CONSTANTS.GAME.DEBUG) {
                console.log('이미 같은 능력이 있습니다:', abilityType);
            }
            orb.destroy();
            window.abilityOrbs = window.abilityOrbs.filter(o => o !== orb);
            return;
        }

        let newAbility = null;

        switch (abilityType) {
            case 'sword':
                newAbility = new SwordAbility(this);
                break;
            case 'magic':
                newAbility = new MagicAbility(this);
                break;
            case 'hammer':
                newAbility = new HammerAbility(this);
                break;
            case 'bow':
                newAbility = new BowAbility(this);
                break;
        }

        if (newAbility) {
            const emptySlot = window.player.abilities.findIndex(a => a === null);

            if (emptySlot !== -1) {
                window.player.equipAbility(newAbility, emptySlot);
            } else {
                const oldAbility = window.player.getCurrentAbility();
                if (oldAbility) {
                    oldAbility.destroy();
                }
                window.player.equipAbility(newAbility, window.player.currentAbilityIndex);
            }

            orb.destroy();
            window.abilityOrbs = window.abilityOrbs.filter(o => o !== orb);
        }
    }

    createUI() {
        // 스테이지 이름
        this.stageText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            16,
            this.stageName,
            {
                fontSize: '20px',
                fill: '#fff',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4
            }
        );
        this.stageText.setOrigin(0.5, 0);
        this.stageText.setScrollFactor(0);

        // 체력 표시
        this.healthText = this.add.text(16, 50, '', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.healthText.setScrollFactor(0);

        // 능력 표시
        this.abilityText = this.add.text(16, 84, '', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.abilityText.setScrollFactor(0);

        // 쿨타임 표시
        this.cooldownText = this.add.text(16, 114, '', {
            fontSize: '14px',
            fill: '#ffff00',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.cooldownText.setScrollFactor(0);

        // 패시브 아이템 표시
        this.passiveItemsText = this.add.text(16, 144, '', {
            fontSize: '14px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.passiveItemsText.setScrollFactor(0);

        // 조작법 (간략화)
        const controlsText = this.add.text(
            CONSTANTS.GAME.WIDTH - 16,
            16,
            '← → 이동 | ↑ 점프(x2) | Shift 대시\nZ/X/C 공격 | Q/E 능력교체',
            {
                fontSize: '12px',
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 8, y: 4 },
                align: 'right'
            }
        );
        controlsText.setOrigin(1, 0);
        controlsText.setScrollFactor(0);
    }

    updateUI() {
        if (window.player && this.healthText) {
            const hearts = Math.ceil(window.player.hp / 10);
            this.healthText.setText(`HP: ${'❤'.repeat(hearts)} (${window.player.hp}/${window.player.maxHp})`);
        }

        if (window.player && this.abilityText) {
            const ability1 = window.player.abilities[0];
            const ability2 = window.player.abilities[1];
            const current = window.player.currentAbilityIndex;

            const name1 = ability1 ? ability1.name : '없음';
            const name2 = ability2 ? ability2.name : '없음';

            const marker1 = current === 0 ? '→' : ' ';
            const marker2 = current === 1 ? '→' : ' ';

            this.abilityText.setText(`능력: ${marker1}[1] ${name1}  ${marker2}[2] ${name2}`);
        }

        if (window.player && this.cooldownText) {
            const ability = window.player.getCurrentAbility();
            if (ability) {
                const basicReady = ability.canUseBasicAttack() ? '●' : '○';
                const strongReady = ability.canUseStrongAttack() ? '●' : '○';
                const skillReady = ability.canUseSkill() ? '●' : '○';

                this.cooldownText.setText(`공격: ${basicReady} | 강공격: ${strongReady} | 스킬: ${skillReady}`);
            } else {
                this.cooldownText.setText('');
            }
        }

        if (window.player && this.passiveItemsText) {
            if (window.player.passiveItems.length > 0) {
                const itemIcons = window.player.passiveItems.map(item => item.icon).join(' ');
                this.passiveItemsText.setText(`패시브: ${itemIcons}`);
            } else {
                this.passiveItemsText.setText('');
            }
        }
    }

    handlePlayerDeath() {
        console.log('플레이어 사망!');
        this.time.delayedCall(500, () => {
            this.scene.start('GameOverScene');
        });
    }

    checkBossSpawn() {
        // 보스가 이미 존재하면 체크 안 함
        if (this.bossSpawned) return;

        // 모든 일반 적을 처치하면 보스 등장
        const aliveEnemies = this.enemyList.filter(e => e.isAlive && !e.isBoss);

        if (CONSTANTS.GAME.DEBUG) {
            // 적이 죽을 때마다 로그 출력
            if (aliveEnemies.length <= 3 && aliveEnemies.length > 0) {
                console.log('남은 일반 적:', aliveEnemies.length, 'bossSpawned:', this.bossSpawned);
            }
        }

        if (aliveEnemies.length === 0 && !this.bossSpawned) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log('보스 소환 조건 만족! 일반 적 처치 완료');
            }
            // 즉시 플래그 설정하여 중복 방지
            this.bossSpawned = true;
            this.spawnBoss();
        }
    }

    spawnBoss() {
        if (CONSTANTS.GAME.DEBUG) {
            console.log('spawnBoss() 호출됨');
        }

        // window.RinoBoss 존재 여부 확인
        if (typeof window.RinoBoss === 'undefined') {
            console.error('RinoBoss 클래스를 찾을 수 없습니다!');
            console.log('사용 가능한 보스 클래스:', Object.keys(window).filter(k => k.includes('Boss')));
            this.bossSpawned = false;
            return;
        }

        // 보스 등장 알림
        const bossText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            '⚠️ 보스 등장! ⚠️\nRAGING RHINO',
            {
                fontSize: '48px',
                fill: '#808080',
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
                try {
                    bossText.destroy();

                    // RinoBoss 참조를 먼저 저장
                    const RinoBossClass = window.RinoBoss;

                    if (!RinoBossClass) {
                        throw new Error('RinoBoss 클래스가 정의되지 않았습니다');
                    }

                    // 보스 생성 (보스 구역: x=2950 근처)
                    this.boss = new RinoBossClass(this, 2950, 400);
                    this.enemyList.push(this.boss);
                    this.enemies.add(this.boss.sprite);

                    // 보스 처치 이벤트 리스너
                    this.events.on('bossDefeated', this.handleBossDefeated, this);

                    if (CONSTANTS.GAME.DEBUG) {
                        console.log('라이노 보스 생성 완료!');
                    }
                } catch (error) {
                    console.error('보스 생성 중 오류:', error);
                    console.error('에러 상세:', error.stack);
                    this.bossSpawned = false;
                }
            }
        });
    }

    handleBossDefeated(stageNumber) {
        console.log('Stage', stageNumber, '보스 처치!');

        // 스테이지 클리어
        this.time.delayedCall(2000, () => {
            this.handleStageClear();
        });
    }

    handleStageClear() {
        // 스테이지 클리어 시간 계산
        const startTime = this.registry.get('stageStartTime');
        const clearTime = Date.now() - startTime;

        // 저장 데이터 업데이트
        const saveData = window.saveManager.load();
        window.saveManager.clearStage(this.stageNumber, clearTime, saveData);

        // 클리어 시간 레지스트리에 저장
        this.registry.set('clearTime', clearTime);

        // 스테이지 클리어 화면으로 전환
        this.scene.start('StageClearScene');
    }

    update() {
        try {
            if (!window.player) return;

            // 터치 입력과 키보드 입력 통합
            let inputCursors = this.cursors;
            let inputKeys = this.keys;

            if (this.isMobile && this.touchControls) {
                // 모바일: 터치 입력을 키보드 입력처럼 변환
                const touchInputs = this.touchControls.getInputs();

                // 커서 키 시뮬레이션
                inputCursors = {
                    left: { isDown: touchInputs.left },
                    right: { isDown: touchInputs.right },
                    up: { isDown: touchInputs.jump },
                    down: { isDown: false }
                };

                // 액션 키 시뮬레이션
                inputKeys = {
                    dash: { isDown: touchInputs.dash },
                    basicAttack: { isDown: touchInputs.basicAttack },
                    strongAttack: { isDown: touchInputs.strongAttack },
                    specialSkill: { isDown: touchInputs.skill },
                    abilitySwap1: { isDown: touchInputs.abilitySwap1 },
                    abilitySwap2: { isDown: touchInputs.abilitySwap2 }
                };
            }

            // 플레이어 업데이트
            window.player.update(inputCursors, inputKeys);

            // 적 업데이트
            this.enemyList.forEach(enemy => {
                if (enemy && enemy.isAlive) {
                    enemy.update();
                }
            });

            // 사망한 적 제거
            this.enemyList = this.enemyList.filter(enemy => enemy.isAlive);

            // 보스 스폰 체크
            this.checkBossSpawn();

            // 플레이어 공격과 적 충돌 체크
            const ability = window.player.getCurrentAbility();
            if (ability && ability.activeAttacks) {
                ability.activeAttacks.forEach(attack => {
                    if (attack && attack.active) {
                        this.physics.overlap(
                            attack,
                            this.enemies,
                            this.handleAttackEnemyCollision,
                            null,
                            this
                        );
                    }
                });
            }

            // 능력 오브 충돌 체크
            window.abilityOrbs.forEach(orb => {
                if (orb && orb.active && window.player && window.player.sprite) {
                    this.physics.overlap(
                        window.player.sprite,
                        orb,
                        this.handleAbilityOrbCollision,
                        null,
                        this
                    );
                }
            });

            window.abilityOrbs = window.abilityOrbs.filter(orb => orb && orb.active);

            // 아이템 업데이트 및 충돌 체크
            window.items.forEach(item => {
                if (item && item.isActive) {
                    item.update();

                    // 아이템과 바닥/플랫폼 충돌 설정 (땅 밑으로 떨어지지 않도록)
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
            console.error('Stage2Scene update 오류:', error);
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.Stage2Scene = Stage2Scene;
}
