// 로그라이크 게임 씬 (스컬 시스템 + 방 생성 통합)
class RoguelikeGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RoguelikeGameScene' });
    }

    init(data) {
        // 시작 스컬 (선택된 경우)
        this.startingSkull = data.skull || null;
        this.gameOver = false;
        this.combatCleared = false;
    }

    create() {
        // 배경
        this.cameras.main.setBackgroundColor('#1a0033');

        // 방 생성기
        this.roomGenerator = new RoomGenerator(this);

        // 플레이어 생성
        this.player = new RoguelikePlayer(this, 100, 600);

        // 스컬 매니저 초기화
        if (this.startingSkull) {
            this.player.initSkullManager(this.startingSkull);
        } else {
            // 기본 스컬 (전사) 장착
            const warriorSkull = new WarriorSkull();
            this.player.initSkullManager(warriorSkull);
        }

        // 첫 방 생성
        this.roomGenerator.generateRoom(1);

        // 적 리스트 참조
        this.enemyList = this.roomGenerator.enemies;

        // 충돌 설정
        this.setupCollisions();

        // 카메라 설정
        this.cameras.main.setBounds(0, 0, this.roomGenerator.roomWidth, this.roomGenerator.roomHeight);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

        // 물리 월드 설정
        this.physics.world.setBounds(0, 0, this.roomGenerator.roomWidth, this.roomGenerator.roomHeight);

        // UI 생성
        this.createUI();

        // ESC 키로 메인 메뉴
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('RoguelikeMenuScene');
        });
    }

    // 충돌 설정
    setupCollisions() {
        // 플레이어 vs 플랫폼
        this.roomGenerator.platforms.forEach(platform => {
            this.physics.add.collider(this.player.sprite, platform);
        });

        // 적 vs 플랫폼
        this.enemyList.forEach(enemy => {
            this.roomGenerator.platforms.forEach(platform => {
                this.physics.add.collider(enemy.sprite, platform);
            });
        });
    }

    update(time, delta) {
        // 플레이어 업데이트
        if (this.player && this.player.active) {
            this.player.update(time, delta);
        }

        // 적 업데이트
        this.enemyList.forEach(enemy => {
            if (enemy.active) {
                enemy.update(time, delta);
            }
        });

        // 적 전멸 확인 (전투방)
        if (this.roomGenerator.currentRoomType === 'combat' || this.roomGenerator.currentRoomType === 'boss') {
            if (this.roomGenerator.areAllEnemiesDead() && !this.combatCleared) {
                this.combatCleared = true;
                this.roomGenerator.onCombatClear();
            }
        } else {
            this.combatCleared = false;
        }

        // 플레이어 사망 체크
        if (this.player && this.player.health <= 0 && !this.gameOver) {
            this.gameOver = true;
            this.handleGameOver();
        }

        // UI 업데이트
        this.updateUI();

        // 새로운 충돌 설정 (적이나 플랫폼이 추가되었을 때)
        this.updateCollisions();
    }

    // 충돌 업데이트 (동적으로 생성된 오브젝트)
    updateCollisions() {
        // 새로 생성된 플랫폼과 플레이어 충돌
        this.roomGenerator.platforms.forEach(platform => {
            if (platform.body && !platform.hasPlayerCollider) {
                this.physics.add.collider(this.player.sprite, platform);
                platform.hasPlayerCollider = true;
            }
        });

        // 새로 생성된 적 충돌
        this.enemyList.forEach(enemy => {
            if (enemy.sprite && enemy.sprite.body && !enemy.hasColliders) {
                this.roomGenerator.platforms.forEach(platform => {
                    this.physics.add.collider(enemy.sprite, platform);
                });
                enemy.hasColliders = true;
            }
        });
    }

    // UI 생성
    createUI() {
        // 층수 표시
        this.floorText = this.add.text(
            20, 20,
            `FLOOR ${this.roomGenerator.currentFloor}`,
            {
                fontFamily: 'Orbitron',
                fontSize: '28px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        this.floorText.setScrollFactor(0);
        this.floorText.setDepth(1000);

        // 방 타입 표시
        this.roomTypeText = this.add.text(
            20, 55,
            '',
            {
                fontFamily: 'Jua',
                fontSize: '20px',
                fill: '#AAAAAA'
            }
        );
        this.roomTypeText.setScrollFactor(0);
        this.roomTypeText.setDepth(1000);

        // 조작법 안내 (처음에만)
        if (this.roomGenerator.currentFloor === 1) {
            const controlsText = this.add.text(
                this.roomGenerator.roomWidth / 2,
                100,
                '방향키: 이동 | UP: 점프 | Z: 공격 | X/C: 스킬 | SPACE: 스컬 교체 | ESC: 메뉴',
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
                    onComplete: () => controlsText.destroy()
                });
            });
        }
    }

    // UI 업데이트
    updateUI() {
        // 층수 업데이트
        if (this.floorText) {
            this.floorText.setText(`FLOOR ${this.roomGenerator.currentFloor}`);
        }

        // 방 타입 업데이트
        if (this.roomTypeText) {
            const typeNames = {
                combat: '전투',
                boss: '보스',
                treasure: '보물',
                shop: '상점',
                rest: '휴식'
            };
            const typeName = typeNames[this.roomGenerator.currentRoomType] || '';
            const enemyCount = this.enemyList.filter(e => e.active && e.health > 0).length;

            if (this.roomGenerator.currentRoomType === 'combat' || this.roomGenerator.currentRoomType === 'boss') {
                this.roomTypeText.setText(`${typeName} - 적: ${enemyCount}`);
            } else {
                this.roomTypeText.setText(typeName);
            }
        }
    }

    // 게임 오버 처리
    handleGameOver() {
        // 화면 어둡게
        const overlay = this.add.rectangle(
            this.cameras.main.scrollX + this.roomGenerator.roomWidth / 2,
            this.cameras.main.scrollY + this.roomGenerator.roomHeight / 2,
            this.roomGenerator.roomWidth,
            this.roomGenerator.roomHeight,
            0x000000, 0.7
        );
        overlay.setDepth(999);

        // 게임 오버 텍스트
        const gameOverText = this.add.text(
            this.cameras.main.scrollX + this.roomGenerator.roomWidth / 2,
            this.cameras.main.scrollY + this.roomGenerator.roomHeight / 2 - 100,
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
        gameOverText.setDepth(1000);

        // 도달 층수
        const floorReachedText = this.add.text(
            this.cameras.main.scrollX + this.roomGenerator.roomWidth / 2,
            this.cameras.main.scrollY + this.roomGenerator.roomHeight / 2,
            `도달 층수: ${this.roomGenerator.currentFloor}`,
            {
                fontFamily: 'Jua',
                fontSize: '32px',
                fill: '#FFFFFF'
            }
        );
        floorReachedText.setOrigin(0.5);
        floorReachedText.setDepth(1000);

        // 재시작 버튼
        const retryButton = this.add.rectangle(
            this.cameras.main.scrollX + this.roomGenerator.roomWidth / 2 - 120,
            this.cameras.main.scrollY + this.roomGenerator.roomHeight / 2 + 100,
            200, 60,
            0x4444FF
        );
        retryButton.setStrokeStyle(3, 0xFFFFFF);
        retryButton.setInteractive();
        retryButton.setDepth(1000);

        const retryText = this.add.text(
            retryButton.x,
            retryButton.y,
            '재시작',
            {
                fontFamily: 'Jua',
                fontSize: '28px',
                fill: '#FFFFFF'
            }
        );
        retryText.setOrigin(0.5);
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
            this.cameras.main.scrollX + this.roomGenerator.roomWidth / 2 + 120,
            this.cameras.main.scrollY + this.roomGenerator.roomHeight / 2 + 100,
            200, 60,
            0xFF4444
        );
        menuButton.setStrokeStyle(3, 0xFFFFFF);
        menuButton.setInteractive();
        menuButton.setDepth(1000);

        const menuText = this.add.text(
            menuButton.x,
            menuButton.y,
            '메뉴로',
            {
                fontFamily: 'Jua',
                fontSize: '28px',
                fill: '#FFFFFF'
            }
        );
        menuText.setOrigin(0.5);
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
