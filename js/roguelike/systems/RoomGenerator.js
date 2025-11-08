// 로그라이크 방 생성 시스템
class RoomGenerator {
    constructor(scene) {
        this.scene = scene;
        this.currentFloor = 1;
        this.currentRoomType = 'combat';

        // 방 크기
        this.roomWidth = 1200;
        this.roomHeight = 800;

        // 생성된 오브젝트 추적
        this.platforms = [];
        this.enemies = [];
        this.items = [];
        this.doors = [];
    }

    // 새로운 방 생성
    generateRoom(floor, roomType = null) {
        this.currentFloor = floor;

        // 방 타입 결정
        if (!roomType) {
            roomType = this.determineRoomType(floor);
        }
        this.currentRoomType = roomType;

        // 이전 방 정리
        this.clearRoom();

        // 방 레이아웃 생성
        this.generateLayout(roomType);

        // 방 타입별 컨텐츠 생성
        switch (roomType) {
            case 'combat':
                this.spawnEnemies(floor);
                break;
            case 'treasure':
                this.spawnTreasure();
                break;
            case 'shop':
                this.spawnShop();
                break;
            case 'boss':
                this.spawnBoss(floor);
                break;
            case 'rest':
                this.spawnRestArea();
                break;
        }

        // 출구 생성 (전투방은 클리어 후 활성화)
        if (roomType !== 'combat') {
            this.createExitDoor();
        }

        return {
            floor: this.currentFloor,
            roomType: this.currentRoomType,
            enemyCount: this.enemies.length
        };
    }

    // 방 타입 결정
    determineRoomType(floor) {
        // 보스 방 (10층마다)
        if (floor % 10 === 0) {
            return 'boss';
        }

        // 휴식 방 (5층마다, 보스 전 제외)
        if (floor % 5 === 0 && floor % 10 !== 0) {
            return 'rest';
        }

        // 상점/보물 확률
        const roll = Math.random();

        if (roll < 0.15) {
            return 'shop';
        } else if (roll < 0.3) {
            return 'treasure';
        }

        // 기본은 전투
        return 'combat';
    }

    // 방 레이아웃 생성
    generateLayout(roomType) {
        // 바닥 (항상 생성)
        this.createPlatform(this.roomWidth / 2, this.roomHeight - 30, this.roomWidth, 60);

        // 벽 (투명, 충돌용)
        this.createWall(-10, this.roomHeight / 2, 20, this.roomHeight);
        this.createWall(this.roomWidth + 10, this.roomHeight / 2, 20, this.roomHeight);

        // 천장 (투명, 충돌용)
        this.createWall(this.roomWidth / 2, -10, this.roomWidth, 20);

        // 방 타입별 플랫폼 배치
        if (roomType === 'combat') {
            this.generateCombatLayout();
        } else if (roomType === 'boss') {
            this.generateBossLayout();
        } else {
            this.generateSimpleLayout();
        }
    }

    // 전투 방 레이아웃 (다양한 플랫폼)
    generateCombatLayout() {
        const layoutType = Phaser.Math.Between(1, 3);

        if (layoutType === 1) {
            // 레이아웃 1: 계단식
            this.createPlatform(300, 650, 250, 30);
            this.createPlatform(600, 500, 250, 30);
            this.createPlatform(900, 350, 250, 30);
        } else if (layoutType === 2) {
            // 레이아웃 2: 좌우 대칭
            this.createPlatform(250, 550, 200, 30);
            this.createPlatform(950, 550, 200, 30);
            this.createPlatform(600, 400, 300, 30);
        } else {
            // 레이아웃 3: 중앙 집중
            this.createPlatform(600, 600, 400, 30);
            this.createPlatform(300, 450, 200, 30);
            this.createPlatform(900, 450, 200, 30);
            this.createPlatform(600, 300, 250, 30);
        }
    }

    // 보스 방 레이아웃 (넓은 공간)
    generateBossLayout() {
        // 양쪽에 작은 플랫폼만
        this.createPlatform(200, 650, 180, 30);
        this.createPlatform(1000, 650, 180, 30);
    }

    // 일반 레이아웃 (상점, 보물, 휴식)
    generateSimpleLayout() {
        // 중앙에 하나의 큰 플랫폼
        this.createPlatform(600, 600, 500, 30);
    }

    // 플랫폼 생성
    createPlatform(x, y, width, height) {
        const platform = this.scene.add.rectangle(x, y, width, height, 0x444444);
        this.scene.physics.add.existing(platform, true); // static body
        platform.body.checkCollision.down = false;
        platform.body.checkCollision.left = false;
        platform.body.checkCollision.right = false;

        this.platforms.push(platform);
        return platform;
    }

    // 벽 생성 (투명)
    createWall(x, y, width, height) {
        const wall = this.scene.add.rectangle(x, y, width, height, 0x000000, 0);
        this.scene.physics.add.existing(wall, true);
        this.platforms.push(wall);
        return wall;
    }

    // 적 생성
    spawnEnemies(floor) {
        // 층수에 따른 적 개수 (3~8마리)
        const enemyCount = Math.min(3 + Math.floor(floor / 3), 8);

        // 적 배치 위치 계산
        const spawnPositions = this.getEnemySpawnPositions(enemyCount);

        for (let i = 0; i < enemyCount; i++) {
            const pos = spawnPositions[i];
            const enemyType = getRandomEnemyType(floor);

            const enemy = createRoguelikeEnemy(this.scene, pos.x, pos.y, enemyType);

            if (enemy) {
                this.enemies.push(enemy);
            }
        }
    }

    // 적 생성 위치 계산
    getEnemySpawnPositions(count) {
        const positions = [];
        const spacing = this.roomWidth / (count + 1);

        for (let i = 0; i < count; i++) {
            positions.push({
                x: spacing * (i + 1) + Phaser.Math.Between(-50, 50),
                y: 500 + Phaser.Math.Between(-100, 100)
            });
        }

        return positions;
    }

    // 보스 생성
    spawnBoss(floor) {
        // 보스는 방 중앙에 생성
        const boss = createRoguelikeEnemy(
            this.scene,
            this.roomWidth / 2,
            400,
            'goblinKing'
        );

        if (boss) {
            // 층수에 따라 보스 강화
            const statMultiplier = 1 + (floor / 10) * 0.3;
            boss.maxHealth *= statMultiplier;
            boss.health = boss.maxHealth;
            boss.damage *= statMultiplier;

            this.enemies.push(boss);

            // 보스 등장 텍스트
            const bossText = this.scene.add.text(
                this.roomWidth / 2,
                200,
                '⚠️ BOSS BATTLE ⚠️',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '48px',
                    fill: '#FF0000',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            );
            bossText.setOrigin(0.5);

            this.scene.tweens.add({
                targets: bossText,
                scale: 1.2,
                alpha: 0,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => bossText.destroy()
            });
        }
    }

    // 보물 생성
    spawnTreasure() {
        const centerX = this.roomWidth / 2;
        const centerY = 500;

        // 3개의 아이템 상자
        for (let i = 0; i < 3; i++) {
            const x = centerX + (i - 1) * 150;
            this.createTreasureChest(x, centerY);
        }

        // 안내 텍스트
        const text = this.scene.add.text(
            centerX,
            250,
            '💎 보물을 선택하세요 💎',
            {
                fontFamily: 'Jua',
                fontSize: '32px',
                fill: '#FFD700',
                fontStyle: 'bold'
            }
        );
        text.setOrigin(0.5);
    }

    // 보물 상자 생성
    createTreasureChest(x, y) {
        const chest = this.scene.add.rectangle(x, y, 60, 60, 0xFFD700);
        chest.setStrokeStyle(4, 0xFF8800);
        chest.setInteractive();

        // 펄스 애니메이션
        this.scene.tweens.add({
            targets: chest,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // 클릭 이벤트
        chest.on('pointerdown', () => {
            if (chest.opened) return;
            chest.opened = true;

            // 아이템 드롭
            const item = window.roguelikePassiveItems.getRandomItem();

            // 아이템 획득 처리
            if (this.scene.player && this.scene.player.inventoryManager) {
                this.scene.player.inventoryManager.addPassiveItem(item);
            }

            // 상자 열림 효과
            chest.setFillStyle(0x888888);

            const itemIcon = this.scene.add.text(
                x, y - 50,
                item.icon,
                { fontSize: '40px' }
            );
            itemIcon.setOrigin(0.5);

            this.scene.tweens.add({
                targets: itemIcon,
                y: y - 100,
                alpha: 0,
                duration: 1500,
                onComplete: () => itemIcon.destroy()
            });

            // 다른 상자들 제거
            this.items.forEach(otherChest => {
                if (otherChest !== chest && !otherChest.opened) {
                    this.scene.tweens.add({
                        targets: otherChest,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => otherChest.destroy()
                    });
                }
            });

            // 출구 생성
            this.scene.time.delayedCall(1000, () => {
                this.createExitDoor();
            });
        });

        this.items.push(chest);
        return chest;
    }

    // 상점 생성
    spawnShop() {
        const centerX = this.roomWidth / 2;
        const centerY = 500;

        // 상점 주인 NPC
        const shopkeeper = this.scene.add.circle(centerX, centerY - 100, 30, 0x00AA00);
        const shopkeeperText = this.scene.add.text(
            centerX,
            centerY - 160,
            '🛒 상점',
            {
                fontFamily: 'Jua',
                fontSize: '24px',
                fill: '#FFFFFF'
            }
        );
        shopkeeperText.setOrigin(0.5);

        // 3개의 아이템 판매
        for (let i = 0; i < 3; i++) {
            const x = centerX + (i - 1) * 150;
            this.createShopItem(x, centerY + 50, i);
        }

        // 안내 텍스트
        const infoText = this.scene.add.text(
            centerX,
            250,
            '아이템을 클릭하여 구매 (골드 미구현)',
            {
                fontFamily: 'Jua',
                fontSize: '20px',
                fill: '#AAAAAA'
            }
        );
        infoText.setOrigin(0.5);

        this.items.push(shopkeeper, shopkeeperText, infoText);
    }

    // 상점 아이템 생성
    createShopItem(x, y, index) {
        const item = window.roguelikePassiveItems.getRandomItem();
        const price = item.rarity === 'common' ? 50 : item.rarity === 'rare' ? 100 : 200;

        // 아이템 배경
        const bg = this.scene.add.rectangle(x, y, 80, 100, 0x333333);
        bg.setStrokeStyle(2, 0xFFD700);
        bg.setInteractive();

        // 아이템 아이콘
        const icon = this.scene.add.text(x, y - 20, item.icon, { fontSize: '32px' });
        icon.setOrigin(0.5);

        // 가격
        const priceText = this.scene.add.text(
            x, y + 30,
            `${price}G`,
            {
                fontFamily: 'Jua',
                fontSize: '18px',
                fill: '#FFD700'
            }
        );
        priceText.setOrigin(0.5);

        // 클릭 이벤트 (골드 시스템 미구현으로 일단 무료)
        bg.on('pointerdown', () => {
            if (bg.purchased) return;
            bg.purchased = true;

            // 아이템 획득
            if (this.scene.player && this.scene.player.inventoryManager) {
                this.scene.player.inventoryManager.addPassiveItem(item);
            }

            // 구매 표시
            bg.setFillStyle(0x555555);
            priceText.setText('구매완료');
            priceText.setColor('#00FF00');
        });

        // 호버 효과
        bg.on('pointerover', () => {
            if (!bg.purchased) {
                bg.setStrokeStyle(3, 0xFFFFFF);
            }
        });

        bg.on('pointerout', () => {
            bg.setStrokeStyle(2, 0xFFD700);
        });

        this.items.push(bg, icon, priceText);
    }

    // 휴식 공간 생성
    spawnRestArea() {
        const centerX = this.roomWidth / 2;
        const centerY = 500;

        // 모닥불
        const campfire = this.scene.add.circle(centerX, centerY, 40, 0xFF4400);

        // 불꽃 효과
        const fireParticles = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                const particle = this.scene.add.circle(
                    centerX + Phaser.Math.Between(-20, 20),
                    centerY,
                    Phaser.Math.Between(3, 8),
                    0xFF4400,
                    0.8
                );

                this.scene.tweens.add({
                    targets: particle,
                    y: particle.y - Phaser.Math.Between(30, 60),
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => particle.destroy()
                });
            },
            loop: true
        });

        // 회복 텍스트
        const restText = this.scene.add.text(
            centerX,
            250,
            '🔥 휴식 공간 🔥\n\nHP가 최대치로 회복됩니다',
            {
                fontFamily: 'Jua',
                fontSize: '28px',
                fill: '#FFFFFF',
                align: 'center'
            }
        );
        restText.setOrigin(0.5);

        // 플레이어 HP 회복
        if (this.scene.player) {
            this.scene.player.health = this.scene.player.maxHealth;

            // 회복 이펙트
            const healEffect = this.scene.add.circle(
                this.scene.player.sprite.x,
                this.scene.player.sprite.y,
                30, 0x00FF00, 0.6
            );

            this.scene.tweens.add({
                targets: healEffect,
                radius: 80,
                alpha: 0,
                duration: 1000,
                onComplete: () => healEffect.destroy()
            });
        }

        this.items.push(campfire, restText);
    }

    // 출구 문 생성
    createExitDoor() {
        const doorX = this.roomWidth - 100;
        const doorY = this.roomHeight - 120;

        const door = this.scene.add.rectangle(doorX, doorY, 80, 120, 0x00AAFF);
        door.setStrokeStyle(4, 0x0088CC);
        door.setInteractive();

        // 문 텍스트
        const doorText = this.scene.add.text(
            doorX, doorY,
            '➡️',
            {
                fontSize: '48px'
            }
        );
        doorText.setOrigin(0.5);

        // 펄스 효과
        this.scene.tweens.add({
            targets: [door, doorText],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        // 클릭 시 다음 층으로
        door.on('pointerdown', () => {
            this.nextFloor();
        });

        this.doors.push(door, doorText);
    }

    // 다음 층으로 이동
    nextFloor() {
        this.currentFloor++;

        // 화면 페이드 아웃
        const fadeRect = this.scene.add.rectangle(
            0, 0,
            this.roomWidth * 2,
            this.roomHeight * 2,
            0x000000, 0
        );
        fadeRect.setOrigin(0);
        fadeRect.setDepth(1000);

        this.scene.tweens.add({
            targets: fadeRect,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                // 새 방 생성
                this.generateRoom(this.currentFloor);

                // 플레이어 위치 초기화
                if (this.scene.player && this.scene.player.sprite && this.scene.player.sprite.body) {
                    this.scene.player.sprite.x = 100;
                    this.scene.player.sprite.y = this.roomHeight - 200;
                    this.scene.player.sprite.body.setVelocity(0, 0);
                }

                // 페이드 인
                this.scene.tweens.add({
                    targets: fadeRect,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => fadeRect.destroy()
                });
            }
        });
    }

    // 전투 클리어 처리
    onCombatClear() {
        if (this.currentRoomType === 'combat' && this.doors.length === 0) {
            // 출구 생성
            this.createExitDoor();

            // 클리어 텍스트
            const clearText = this.scene.add.text(
                this.roomWidth / 2,
                300,
                '🎉 클리어! 🎉',
                {
                    fontFamily: 'Jua',
                    fontSize: '48px',
                    fill: '#FFD700',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            );
            clearText.setOrigin(0.5);
            clearText.setDepth(100);

            this.scene.tweens.add({
                targets: clearText,
                y: 250,
                scale: 1.2,
                alpha: 0,
                duration: 2000,
                onComplete: () => clearText.destroy()
            });
        }
    }

    // 방 정리
    clearRoom() {
        // 플랫폼 제거
        this.platforms.forEach(platform => {
            if (platform && platform.destroy) {
                platform.destroy();
            }
        });
        this.platforms = [];

        // 적 제거
        this.enemies.forEach(enemy => {
            if (enemy && enemy.destroy) {
                enemy.destroy();
            }
        });
        this.enemies = [];

        // 아이템 제거
        this.items.forEach(item => {
            if (item && item.destroy) {
                item.destroy();
            }
        });
        this.items = [];

        // 문 제거
        this.doors.forEach(door => {
            if (door && door.destroy) {
                door.destroy();
            }
        });
        this.doors = [];
    }

    // 적 전멸 확인
    areAllEnemiesDead() {
        return this.enemies.every(enemy => !enemy.active || enemy.health <= 0);
    }

    // 현재 층 정보
    getFloorInfo() {
        return {
            floor: this.currentFloor,
            roomType: this.currentRoomType,
            enemyCount: this.enemies.filter(e => e.active).length
        };
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.RoomGenerator = RoomGenerator;
}
