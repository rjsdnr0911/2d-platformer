// Stage 1: 슬라임 숲
class Stage1Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Stage1Scene' });
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

        // 슬라임 스프라이트시트 로드
        this.load.spritesheet('slime_idle', 'assets/Slime/Idle-Run (44x30).png', {
            frameWidth: 44,
            frameHeight: 30
        });
        this.load.spritesheet('slime_hit', 'assets/Slime/Hit (44x30).png', {
            frameWidth: 44,
            frameHeight: 30
        });

        // 플랫폼 이미지 로드
        this.load.image('platform_brown', 'assets/Platforms/Brown Off.png');
        this.load.spritesheet('platform_brown_on', 'assets/Platforms/Brown On (32x8).png', {
            frameWidth: 32,
            frameHeight: 8
        });

        // Menu UI 로드
        this.load.image('btn_restart', 'assets/Menu ui/Buttons/Restart.png');
        this.load.image('btn_close', 'assets/Menu ui/Buttons/Close.png');
        this.load.image('btn_back', 'assets/Menu ui/Buttons/Back.png');
    }

    create() {
        try {
            // 페이드 인 효과
            this.cameras.main.fadeIn(800, 0, 0, 0);

            // 배경색 (초록 숲)
            this.cameras.main.setBackgroundColor(0x7CB342);

            // 플레이어 애니메이션 생성
            this.createPlayerAnimations();

            // 슬라임 애니메이션 생성
            this.createSlimeAnimations();

            // 전역 변수 초기화
            window.player = null;
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
            this.stageNumber = 1;
            this.stageName = 'Stage 1: 슬라임 숲';

            // 키보드 입력
            this.cursors = null;
            this.keys = null;

            // UI
            this.healthText = null;
            this.abilityText = null;
            this.cooldownText = null;
            this.passiveItemsText = null;
            this.stageText = null;

            // 콤보 시스템
            this.comboSystem = null;

            // 미니맵 시스템
            this.minimapSystem = null;


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

            // 플랫폼 생성 (Stage 1 레이아웃)
            this.createPlatforms();

            // 플레이어 생성
            window.player = new Player(this, 100, 400);

            // 게임 모드에 따라 능력 장착
            const selectedClass = this.registry.get('selectedClass') || 'normal';

            if (selectedClass === 'normal') {
                // 일반 모드: 근접/마법 전환 (둘 다 장착)
                const swordAbility = new SwordAbility(this);
                const magicAbility = new MagicAbility(this);

                window.player.equipAbility(swordAbility, 0);
                window.player.equipAbility(magicAbility, 1);
                window.player.setCurrentAbilityIndex(0); // 시작은 근접전사

                console.log('일반 모드: 근접전사/마법사 전환 가능');
            } else {
                // 캐릭터 선택 모드: 선택한 직업만
                let ability = null;

                switch (selectedClass) {
                    case 'warrior':
                        ability = new SwordAbility(this);
                        break;
                    case 'wizard':
                        ability = new MagicAbility(this);
                        break;
                    case 'weaponmaster':
                        ability = new WeaponMasterAbility(this);
                        break;
                    default:
                        ability = new SwordAbility(this);
                }

                window.player.equipAbility(ability, 0);

                console.log('캐릭터 선택 모드:', selectedClass, '능력:', ability.name);
            }

            // 카메라 설정
            this.setupCamera();

            // 적 생성 (슬라임 중심)
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

            // ESC 키로 일시정지
            this.input.keyboard.on('keydown-ESC', () => {
                this.pauseGame();
            });

            // UI 생성
            this.createUI();

            // 콤보 시스템 초기화
            this.comboSystem = new ComboSystem(this);

            // 미니맵 시스템 초기화
            this.minimapSystem = new MinimapSystem(this, CONSTANTS.WORLD.WIDTH, CONSTANTS.WORLD.HEIGHT);


            // 터치 컨트롤 초기화 (모바일에서만)
            if (this.isMobile) {
                this.touchControls = new TouchControls(this);
                if (CONSTANTS.GAME.DEBUG) {
                    console.log('모바일 터치 컨트롤 활성화');
                }
            }

            // 이벤트 리스너
            this.events.on('playerDied', this.handlePlayerDeath, this);

            // 현재 씬을 레지스트리에 저장 (일시정지 시 사용)
            this.registry.set('activeScene', 'Stage1Scene');

            // 점수 시스템 시작
            window.scoreManager.startGame();
            this.registry.set('currentScore', 0);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('Stage 1 로드 완료');
            }

        } catch (error) {
            console.error('Stage1Scene create 오류:', error);
        }
    }

    createPlayerAnimations() {
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

    createSlimeAnimations() {
        // Idle/Run 애니메이션 (10 프레임)
        this.anims.create({
            key: 'slime_idle',
            frames: this.anims.generateFrameNumbers('slime_idle', { start: 0, end: 9 }),
            frameRate: 10,
            repeat: -1
        });

        // Hit 애니메이션
        this.anims.create({
            key: 'slime_hit',
            frames: this.anims.generateFrameNumbers('slime_hit', { start: 0, end: 4 }),
            frameRate: 12
        });
    }

    createGround() {
        const tileWidth = 32;
        const tileHeight = 8;
        const groundY = CONSTANTS.WORLD.HEIGHT - tileHeight/2;

        // 타일 기반 바닥 생성
        for (let x = 0; x < CONSTANTS.WORLD.WIDTH; x += tileWidth) {
            const ground = this.add.tileSprite(
                x + tileWidth / 2,
                groundY,
                tileWidth,
                tileHeight,
                'platform_brown'
            );
            ground.setScale(1, 5); // 세로 크기 확대
            this.physics.add.existing(ground, true);
            this.groundGroup.add(ground);
        }

        this.groundGroup.refresh();
    }

    createPlatforms() {
        const tileWidth = 32;
        const tileHeight = 8;

        const platformData = [
            // 시작 구간
            { x: 200, y: 450, tiles: 5 },  // 150px → 5 타일
            { x: 400, y: 350, tiles: 4 },  // 120px → 4 타일
            { x: 600, y: 450, tiles: 5 },

            // 슬라임 구간 1
            { x: 900, y: 400, tiles: 6 },   // 200px → 6 타일
            { x: 1100, y: 300, tiles: 5 },
            { x: 1300, y: 450, tiles: 4 },

            // 슬라임 구간 2
            { x: 1600, y: 350, tiles: 6 },  // 180px → 6 타일
            { x: 1900, y: 500, tiles: 5 },
            { x: 2100, y: 400, tiles: 5 },

            // 보스 전 구간
            { x: 2400, y: 300, tiles: 3 },  // 100px → 3 타일
            { x: 2600, y: 450, tiles: 5 },

            // 보스 구역 (넓은 공간)
            { x: 2900, y: 500, tiles: 8 }   // 250px → 8 타일
        ];

        platformData.forEach(data => {
            const platformWidth = tileWidth * data.tiles;
            const platform = this.add.tileSprite(
                data.x,
                data.y,
                platformWidth,
                tileHeight,
                'platform_brown'
            );
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
        });

        this.platforms.refresh();
    }

    createEnemies() {
        // 슬라임 배치 (6마리)
        const slimePositions = [
            { x: 500, y: 300 },
            { x: 1000, y: 350 },
            { x: 1200, y: 250 },
            { x: 1500, y: 300 },
            { x: 2000, y: 350 },
            { x: 2500, y: 400 }
        ];

        slimePositions.forEach(pos => {
            const slime = new Slime(this, pos.x, pos.y);

            // 난이도 적용
            const difficultyMultiplier = window.difficultyManager.getDifficultyInfo();
            slime.maxHp = Math.round(slime.maxHp * difficultyMultiplier.enemyHpMultiplier);
            slime.hp = slime.maxHp;
            slime.damage = Math.round(slime.damage * difficultyMultiplier.enemyDamageMultiplier);
            slime.sprite.setData('damage', slime.damage);

            this.enemyList.push(slime);
            this.enemies.add(slime.sprite);
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('Stage 1 적 생성 완료: 슬라임', slimePositions.length, '마리 (난이도:', window.difficultyManager.getDifficulty(), ')');
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
            // 콤보 시스템에 히트 추가
            const comboMultiplier = this.comboSystem ? this.comboSystem.addHit() : 1.0;

            // 콤보 배율 적용 데미지
            const finalDamage = Math.floor(damage * comboMultiplier);

            // 적이 죽을지 체크
            const willDie = enemyEntity.hp <= finalDamage;

            enemyEntity.takeDamage(finalDamage);

            // 적 처치 시 점수 추가 & 근접 캐릭터 흡혈
            if (willDie) {
                const score = window.scoreManager.addEnemyScore('slime');
                if (score > 0) {
                    this.registry.set('currentScore', window.scoreManager.getCurrentScore());

                    if (CONSTANTS.GAME.DEBUG) {
                        console.log('슬라임 처치 점수:', score, '총점:', window.scoreManager.getCurrentScore());
                    }
                }

                // 근접 캐릭터 흡혈 (검술 능력만 해당)
                const currentAbility = window.player.getCurrentAbility();
                if (currentAbility && currentAbility.name === '검술') {
                    window.player.vampiricHeal(3);
                }
            }

            // 콤보 파티클 효과
            if (this.comboSystem && this.comboSystem.getComboCount() >= 3) {
                this.createComboParticles(enemySprite.x, enemySprite.y, this.comboSystem.getComboCount());
            }

            if (attackObj && attackObj.active) {
                attackObj.destroy();
            }
        }
    }

    createComboParticles(x, y, comboCount) {
        // 콤보 수에 따라 파티클 개수 증가
        const particleCount = Math.min(comboCount, 15);

        for (let i = 0; i < particleCount; i++) {
            this.time.delayedCall(i * 20, () => {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = 100 + (comboCount * 10);

                const particle = this.add.circle(
                    x,
                    y,
                    4 + Math.random() * 4,
                    comboCount >= 10 ? 0xff00ff : (comboCount >= 5 ? 0xff0000 : 0xffff00),
                    1
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
                    scale: 0,
                    duration: 500,
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
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

        // 점수 표시 (오른쪽 위)
        this.scoreText = this.add.text(
            CONSTANTS.GAME.WIDTH - 16,
            50,
            '',
            {
                fontSize: '18px',
                fill: '#ffff00',
                backgroundColor: '#000',
                padding: { x: 10, y: 5 },
                fontStyle: 'bold'
            }
        );
        this.scoreText.setOrigin(1, 0);
        this.scoreText.setScrollFactor(0);

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

        // 쿨타임 표시 (초 단위)
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

        // 조작법 (Q/E 전환 추가)
        // 게임 모드에 따라 다른 가이드 표시
        const selectedClass = this.registry.get('selectedClass') || 'normal';
        let controlsGuide = '← → 이동 | ↑ 점프(x2) | Shift 대시\nZ/X/C 공격';

        if (selectedClass === 'normal') {
            // 일반 모드: 직업 전환 가능
            controlsGuide += ' | Q/E 전환';
        } else if (selectedClass === 'weaponmaster') {
            // 웨폰마스터: 폼 전환
            controlsGuide += ' | Q/E 폼';
        }

        const controlsText = this.add.text(
            CONSTANTS.GAME.WIDTH - 16,
            16,
            controlsGuide,
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
        // 점수 표시
        if (this.scoreText) {
            const currentScore = window.scoreManager.getCurrentScore();
            this.scoreText.setText(`점수: ${window.scoreManager.formatScore(currentScore)}`);
        }

        if (window.player && this.healthText) {
            const hearts = Math.ceil(window.player.hp / 10);
            this.healthText.setText(`HP: ${'❤'.repeat(hearts)} (${window.player.hp}/${window.player.maxHp})`);
        }

        if (window.player && this.abilityText) {
            const currentAbility = window.player.getCurrentAbility();
            const abilityName = currentAbility ? currentAbility.name : '없음';

            // 웨폰마스터인 경우 현재 폼 표시
            if (currentAbility && currentAbility.name === '웨폰마스터') {
                const formName = currentAbility.getCurrentFormName();
                this.abilityText.setText(`직업: ${abilityName} [${formName}]`);
            } else {
                this.abilityText.setText(`직업: ${abilityName}`);
            }
        }

        if (window.player && this.cooldownText) {
            const ability = window.player.getCurrentAbility();
            if (ability) {
                // 쿨타임 적용 (패시브 아이템 쿨다운 감소 적용)
                const cooldownReduction = window.player.cooldownReduction || 0;
                const basicCooldown = ability.config.BASIC_COOLDOWN * (1 - cooldownReduction);
                const strongCooldown = ability.config.STRONG_COOLDOWN * (1 - cooldownReduction);
                const skillCooldown = ability.config.SKILL_COOLDOWN * (1 - cooldownReduction);

                // 남은 쿨타임 계산 (초 단위)
                const currentTime = this.time.now;
                const basicRemaining = Math.max(0, (basicCooldown - (currentTime - ability.lastBasicAttackTime)) / 1000);
                const strongRemaining = Math.max(0, (strongCooldown - (currentTime - ability.lastStrongAttackTime)) / 1000);
                const skillRemaining = Math.max(0, (skillCooldown - (currentTime - ability.lastSkillTime)) / 1000);

                // 쿨타임 표시 (0이면 ●, 아니면 초 표시)
                const basicText = basicRemaining > 0 ? basicRemaining.toFixed(1) + 's' : '●';
                const strongText = strongRemaining > 0 ? strongRemaining.toFixed(1) + 's' : '●';
                const skillText = skillRemaining > 0 ? skillRemaining.toFixed(1) + 's' : '●';

                this.cooldownText.setText(`Z: ${basicText} | X: ${strongText} | C: ${skillText}`);
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

        // 페이드 아웃 효과
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // 현재 스테이지 정보 저장 (다시하기 시 사용)
            this.registry.set('lastStage', 'Stage1Scene');
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

        // 보스 등장 알림
        const bossText = this.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            CONSTANTS.GAME.HEIGHT / 2,
            '⚠️ 보스 등장! ⚠️\nSLIME KING',
            {
                fontSize: '48px',
                fill: '#ff0000',
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

                    if (CONSTANTS.GAME.DEBUG) {
                        console.log('보스 텍스트 제거 완료, 보스 객체 생성 시작...');
                    }

                    // 보스 생성 (보스 구역: x=2900 근처)
                    this.boss = new SlimeBoss(this, 2900, 400);

                    // 난이도 적용
                    const difficultyMultiplier = window.difficultyManager.getDifficultyInfo();
                    this.boss.maxHp = Math.round(this.boss.maxHp * difficultyMultiplier.enemyHpMultiplier);
                    this.boss.hp = this.boss.maxHp;
                    this.boss.damage = Math.round(this.boss.damage * difficultyMultiplier.enemyDamageMultiplier);
                    if (this.boss.sprite) {
                        this.boss.sprite.setData('damage', this.boss.damage);
                    }

                    if (CONSTANTS.GAME.DEBUG) {
                        console.log('SlimeBoss 객체 생성 성공');
                        console.log('보스 sprite:', this.boss.sprite);
                        console.log('보스 sprite.body:', this.boss.sprite ? this.boss.sprite.body : null);
                        console.log('보스 isAlive:', this.boss.isAlive);
                        console.log('보스 isBoss:', this.boss.isBoss);
                        console.log('보스 HP:', this.boss.hp, '난이도:', window.difficultyManager.getDifficulty());
                    }

                    this.enemyList.push(this.boss);
                    this.enemies.add(this.boss.sprite);

                    // 보스 처치 이벤트 리스너
                    this.events.on('bossDefeated', this.handleBossDefeated, this);

                    if (CONSTANTS.GAME.DEBUG) {
                        console.log('슬라임 킹 생성 완료! enemyList 크기:', this.enemyList.length);
                    }
                } catch (error) {
                    console.error('보스 생성 중 오류 발생:', error);
                    console.error('에러 스택:', error.stack);
                    // 에러 발생 시 플래그 리셋
                    this.bossSpawned = false;
                }
            }
        });
    }

    handleBossDefeated(stageNumber) {
        console.log('Stage', stageNumber, '보스 처치!');

        // 보스 처치 점수 추가
        const bossScore = window.scoreManager.addEnemyScore('boss');
        this.registry.set('currentScore', window.scoreManager.getCurrentScore());

        if (CONSTANTS.GAME.DEBUG) {
            console.log('보스 처치 점수:', bossScore, '총점:', window.scoreManager.getCurrentScore());
        }

        // 스테이지 클리어
        this.time.delayedCall(2000, () => {
            this.handleStageClear();
        });
    }

    handleStageClear() {
        // 스테이지 클리어 시간 계산
        const startTime = this.registry.get('stageStartTime');
        const clearTime = Date.now() - startTime;

        // 스테이지 클리어 보너스
        const stageClearScore = window.scoreManager.addStageClearScore();

        // 시간 보너스
        const timeBonus = window.scoreManager.calculateTimeBonus();

        // 최종 점수
        const finalScore = window.scoreManager.getCurrentScore();
        this.registry.set('currentScore', finalScore);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('스테이지 클리어 점수:', stageClearScore);
            console.log('시간 보너스:', timeBonus);
            console.log('최종 점수:', finalScore);
        }

        // 저장 데이터 업데이트
        const saveData = window.saveManager.load();
        window.saveManager.clearStage(this.stageNumber, clearTime, saveData);

        // 클리어 시간 레지스트리에 저장
        this.registry.set('clearTime', clearTime);

        // 페이드 아웃 효과 후 씬 전환
        this.cameras.main.fadeOut(800, 255, 255, 255);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('StageClearScene');
        });
    }

    pauseGame() {
        // 현재 씬을 레지스트리에 저장
        this.registry.set('activeScene', 'Stage1Scene');

        // 현재 씬 일시정지
        this.scene.pause();

        // 일시정지 씬 시작
        this.scene.launch('PauseScene');
    }

    update() {
        try {
            if (!window.player) return;

            // 터치 입력과 키보드 입력 통합
            let inputCursors = this.cursors;
            let inputKeys = this.keys;

            if (this.isMobile && this.touchControls) {
                // 터치 입력 JustPressed 처리 (Player.update() 전에 먼저 처리)
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

                // 터치 컨트롤 업데이트 (다음 프레임을 위해 이전 상태 저장)
                this.touchControls.update();

                // 모바일: 터치 입력을 키보드 입력처럼 변환 (이동만 처리)
                const touchInputs = this.touchControls.getInputs();

                // 커서 키 시뮬레이션 (이동만)
                inputCursors = {
                    left: { isDown: touchInputs.left },
                    right: { isDown: touchInputs.right },
                    up: { isDown: false }, // 점프는 위에서 직접 처리
                    down: { isDown: false }
                };

                // 액션 키는 더미 (위에서 직접 처리했으므로)
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

            // 콤보 시스템 업데이트
            if (this.comboSystem) {
                this.comboSystem.update();
            }

            // 미니맵 업데이트
            if (this.minimapSystem) {
                this.minimapSystem.update(window.player, this.enemyList);
            }


        } catch (error) {
            console.error('Stage1Scene update 오류:', error);
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.Stage1Scene = Stage1Scene;
}
