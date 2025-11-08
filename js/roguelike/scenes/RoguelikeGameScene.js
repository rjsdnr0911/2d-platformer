// 로그라이크 게임 플레이 Scene
class RoguelikeGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RoguelikeGameScene' });
    }

    init(data) {
        // 시작 데이터 (사용 안 함 - 간소화)
    }

    create() {
        // 배경
        this.cameras.main.setBackgroundColor('#1a0033');

        // 플레이어 생성 (간소화)
        this.player = new RoguelikePlayer(this, 100, 500);

        // 간단한 플랫폼 생성
        this.platforms = this.createPlatforms();

        // 간단한 적 생성 (테스트용)
        this.enemyList = this.createEnemies();

        // 충돌 설정
        this.setupCollisions();

        // UI 생성
        this.createUI();

        // 카메라 설정
        this.cameras.main.setBounds(0, 0, 1200, 700);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

        // 물리 월드 설정
        this.physics.world.setBounds(0, 0, 1200, 700);

        // ESC 키로 메인 메뉴
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('RoguelikeMenuScene');
        });
    }

    // 플랫폼 생성 (간단한 맵)
    createPlatforms() {
        const platforms = this.physics.add.staticGroup();

        // 바닥
        platforms.create(600, 680, null).setDisplaySize(1200, 40).refreshBody();
        const floorGraphics = this.add.graphics();
        floorGraphics.fillStyle(0x666666, 1);
        floorGraphics.fillRect(0, 660, 1200, 40);

        // 중간 플랫폼들
        const platformConfigs = [
            { x: 200, y: 550, w: 150, h: 20 },
            { x: 450, y: 450, w: 150, h: 20 },
            { x: 700, y: 550, w: 150, h: 20 },
            { x: 950, y: 450, w: 150, h: 20 }
        ];

        platformConfigs.forEach(config => {
            platforms.create(config.x, config.y, null).setDisplaySize(config.w, config.h).refreshBody();

            const graphics = this.add.graphics();
            graphics.fillStyle(0x888888, 1);
            graphics.fillRect(config.x - config.w / 2, config.y - config.h / 2, config.w, config.h);
        });

        return platforms;
    }

    // 적 생성 (간단한 테스트용)
    createEnemies() {
        const enemies = [];

        // 몇 개의 기본 적 생성
        enemies.push(new RoguelikeEnemy(this, 300, 500, {
            name: '슬라임',
            hp: 30,
            damage: 5,
            speed: 80,
            color: 0xFF4444
        }));

        enemies.push(new RoguelikeEnemy(this, 600, 400, {
            name: '고블린',
            hp: 40,
            damage: 8,
            speed: 100,
            color: 0x44FF44
        }));

        enemies.push(new RoguelikeEnemy(this, 900, 400, {
            name: '오크',
            hp: 50,
            damage: 10,
            speed: 60,
            color: 0x4444FF
        }));

        return enemies;
    }

    // 충돌 설정 (간소화)
    setupCollisions() {
        // 플레이어 vs 플랫폼
        this.physics.add.collider(this.player.sprite, this.platforms);

        // 적 vs 플랫폼
        this.enemyList.forEach(enemy => {
            if (enemy && enemy.sprite) {
                this.physics.add.collider(enemy.sprite, this.platforms);
            }
        });
    }

    update(time, delta) {
        // 플레이어 업데이트
        if (this.player && this.player.active) {
            this.player.update(time, delta);
        }

        // 적 업데이트
        if (this.enemyList && Array.isArray(this.enemyList)) {
            this.enemyList.forEach(enemy => {
                if (enemy && enemy.active) {
                    enemy.update(time, delta);
                }
            });
        }

        // 플레이어 사망 체크
        if (this.player && this.player.health <= 0 && !this.gameOver) {
            this.gameOver = true;
            this.handleGameOver();
        }

        // 적 전멸 체크
        if (!this.allEnemiesDead && this.areAllEnemiesDead()) {
            this.allEnemiesDead = true;
            this.showVictoryMessage();
        }
    }

    // 모든 적이 죽었는지 확인
    areAllEnemiesDead() {
        if (!this.enemyList || !Array.isArray(this.enemyList)) return false;

        return this.enemyList.every(enemy => !enemy || !enemy.active || enemy.health <= 0);
    }

    // 승리 메시지
    showVictoryMessage() {
        const victoryText = this.add.text(
            600, 200,
            '모든 적 처치 완료!',
            {
                fontFamily: 'Jua',
                fontSize: '48px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        victoryText.setOrigin(0.5);
        victoryText.setScrollFactor(0);
        victoryText.setDepth(1000);

        this.tweens.add({
            targets: victoryText,
            alpha: 0,
            duration: 3000,
            delay: 2000,
            onComplete: () => victoryText.destroy()
        });
    }

    // UI 생성
    createUI() {
        // 타이틀 표시
        this.titleText = this.add.text(
            20, 20,
            'ROGUELIKE TEST',
            {
                fontFamily: 'Orbitron',
                fontSize: '28px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        this.titleText.setScrollFactor(0);
        this.titleText.setDepth(1000);

        // 조작법 안내
        const controlsText = this.add.text(
            600, 50,
            '방향키: 이동 | UP: 점프 | Z: 공격 | ESC: 메뉴',
            {
                fontFamily: 'Jua',
                fontSize: '18px',
                fill: '#FFFFFF',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        );
        controlsText.setOrigin(0.5);
        controlsText.setScrollFactor(0);
        controlsText.setDepth(1000);

        // 5초 후 사라짐
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: controlsText,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    if (controlsText && controlsText.active) {
                        controlsText.destroy();
                    }
                }
            });
        });
    }

    // 게임 오버 처리
    handleGameOver() {
        // 화면 어둡게
        const overlay = this.add.rectangle(
            600, 350,
            1200, 700,
            0x000000, 0.7
        );
        overlay.setScrollFactor(0);
        overlay.setDepth(999);

        // 게임 오버 텍스트
        const gameOverText = this.add.text(
            600, 250,
            'GAME OVER',
            {
                fontFamily: 'Orbitron',
                fontSize: '72px',
                fill: '#FF0000',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);
        gameOverText.setDepth(1000);

        // 재시작 버튼
        const retryButton = this.add.rectangle(
            480, 450,
            200, 60,
            0x4444FF
        );
        retryButton.setStrokeStyle(3, 0xFFFFFF);
        retryButton.setInteractive();
        retryButton.setScrollFactor(0);
        retryButton.setDepth(1000);

        const retryText = this.add.text(
            480, 450,
            '재시작',
            {
                fontFamily: 'Jua',
                fontSize: '28px',
                fill: '#FFFFFF'
            }
        );
        retryText.setOrigin(0.5);
        retryText.setScrollFactor(0);
        retryText.setDepth(1000);

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
            720, 450,
            200, 60,
            0xFF4444
        );
        menuButton.setStrokeStyle(3, 0xFFFFFF);
        menuButton.setInteractive();
        menuButton.setScrollFactor(0);
        menuButton.setDepth(1000);

        const menuText = this.add.text(
            720, 450,
            '메뉴로',
            {
                fontFamily: 'Jua',
                fontSize: '28px',
                fill: '#FFFFFF'
            }
        );
        menuText.setOrigin(0.5);
        menuText.setScrollFactor(0);
        menuText.setDepth(1000);

        menuButton.on('pointerdown', () => {
            this.scene.start('RoguelikeMenuScene');
        });

        menuButton.on('pointerover', () => {
            menuButton.setFillStyle(0xFF6666);
        });

        menuButton.on('pointerout', () => {
            menuButton.setFillStyle(0xFF4444);
        });
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RoguelikeGameScene = RoguelikeGameScene;
}
