// 게임 플레이 Scene (기존 game.js 로직을 여기로 이동)
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        try {
            // 이미지 에셋은 나중에 추가
        } catch (error) {
            console.error('GameScene preload 오류:', error);
        }
    }

    create() {
        try {
            // 전역 변수 초기화
            window.player = null;
            window.abilityOrbs = [];
            window.items = []; // 아이템 배열

            // 로컬 변수
            this.platforms = null;
            this.groundGroup = null;
            this.enemies = null;
            this.enemyList = [];
            this.itemList = [];

            // 입력
            this.cursors = null;
            this.keys = null;

            // UI
            this.healthText = null;
            this.abilityText = null;
            this.cooldownText = null;
            this.passiveItemsText = null;

            // 패시브 아이템 툴팁 UI
            this.passiveItemTooltipUI = null;

            // 월드 크기 설정
            this.physics.world.setBounds(0, 0, CONSTANTS.WORLD.WIDTH, CONSTANTS.WORLD.HEIGHT);

            // 플랫폼 그룹 생성
            this.platforms = this.physics.add.staticGroup();
            this.groundGroup = this.physics.add.staticGroup();

            // 바닥 생성
            this.createGround();

            // 플랫폼 생성
            this.createPlatforms();

            // 플레이어 생성
            window.player = new Player(this, 100, 400);

            // 모든 능력 장착
            const swordAbility = new SwordAbility(this);
            const magicAbility = new MagicAbility(this);

            window.player.equipAbility(swordAbility, 0);
            window.player.equipAbility(magicAbility, 1);

            // 카메라 설정
            this.setupCamera();

            // 적 생성
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

            // 패시브 아이템 툴팁 UI 초기화
            this.passiveItemTooltipUI = new PassiveItemTooltipUI(this);

            // 이벤트 리스너
            this.events.on('playerDied', this.handlePlayerDeath, this);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('게임 씬 초기화 완료');
                console.log('플레이어 능력:', window.player.abilities.map(a => a ? a.name : '없음'));
            }

        } catch (error) {
            console.error('GameScene create 오류:', error);
            alert('게임 초기화 실패: ' + error.message);
        }
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
                CONSTANTS.COLORS.GROUND
            );
            this.groundGroup.add(ground);
        }

        this.groundGroup.refresh();
    }

    createPlatforms() {
        const platformData = [
            // 시작 지점
            { x: 200, y: 450, w: 150, h: 20 },
            { x: 400, y: 350, w: 120, h: 20 },
            { x: 600, y: 450, w: 150, h: 20 },

            // 전투 구간
            { x: 900, y: 400, w: 200, h: 20 },
            { x: 1200, y: 300, w: 150, h: 20 },
            { x: 1400, y: 450, w: 120, h: 20 },
            { x: 1600, y: 350, w: 180, h: 20 },

            // 점프 구간
            { x: 1900, y: 500, w: 100, h: 20 },
            { x: 2100, y: 400, w: 100, h: 20 },
            { x: 2300, y: 300, w: 100, h: 20 },
            { x: 2500, y: 400, w: 150, h: 20 },

            // 끝 지점
            { x: 2800, y: 450, w: 200, h: 20 },
            { x: 3000, y: 350, w: 150, h: 20 }
        ];

        platformData.forEach(data => {
            const platform = this.add.rectangle(
                data.x,
                data.y,
                data.w,
                data.h,
                CONSTANTS.COLORS.PLATFORM
            );
            this.platforms.add(platform);
        });

        this.platforms.refresh();
    }

    createEnemies() {
        // 슬라임 (3마리)
        const slimePositions = [
            { x: 500, y: 300 },
            { x: 1300, y: 250 },
            { x: 2200, y: 350 }
        ];

        slimePositions.forEach(pos => {
            const slime = new Slime(this, pos.x, pos.y);
            this.enemyList.push(slime);
            this.enemies.add(slime.sprite);
        });

        // 검병 (2마리)
        const swordPositions = [
            { x: 1000, y: 350 },
            { x: 2700, y: 400 }
        ];

        swordPositions.forEach(pos => {
            const swordEnemy = new SwordEnemy(this, pos.x, pos.y);
            this.enemyList.push(swordEnemy);
            this.enemies.add(swordEnemy.sprite);
        });

        // 마법사 (2마리)
        const magePositions = [
            { x: 1800, y: 400 },
            { x: 2400, y: 350 }
        ];

        magePositions.forEach(pos => {
            const mage = new MageEnemy(this, pos.x, pos.y);
            this.enemyList.push(mage);
            this.enemies.add(mage.sprite);
        });
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

        // 플레이어와 적 충돌 (오버랩)
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

            // 공격 객체 제거 (관통하지 않음)
            if (attackObj && attackObj.active) {
                attackObj.destroy();
            }
        }
    }

    handleAbilityOrbCollision(playerSprite, orb) {
        if (!orb || !orb.active) return;

        const abilityType = orb.getData('abilityType');

        // 능력 추가
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
            // 빈 슬롯이 있으면 추가, 없으면 현재 능력 교체
            const emptySlot = window.player.abilities.findIndex(a => a === null);

            if (emptySlot !== -1) {
                window.player.equipAbility(newAbility, emptySlot);
            } else {
                // 현재 능력 교체
                const oldAbility = window.player.getCurrentAbility();
                if (oldAbility) {
                    oldAbility.destroy();
                }
                window.player.equipAbility(newAbility, window.player.currentAbilityIndex);
            }

            // 오브 제거
            orb.destroy();

            // 배열에서 제거
            window.abilityOrbs = window.abilityOrbs.filter(o => o !== orb);

            if (CONSTANTS.GAME.DEBUG) {
                console.log('능력 획득:', abilityType);
            }
        }
    }

    createUI() {
        // 체력 표시
        this.healthText = this.add.text(16, 16, '', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.healthText.setScrollFactor(0);

        // 능력 표시
        this.abilityText = this.add.text(16, 50, '', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.abilityText.setScrollFactor(0);

        // 쿨타임 표시
        this.cooldownText = this.add.text(16, 80, '', {
            fontSize: '14px',
            fill: '#ffff00',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.cooldownText.setScrollFactor(0);

        // 조작법 표시
        const controlsText = this.add.text(
            CONSTANTS.GAME.WIDTH - 16,
            16,
            '← → 이동 | ↑ 점프 | Shift 대시\nZ 공격 | X 강공격 | C 스킬 | Q/E 능력 교체',
            {
                fontSize: '14px',
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 10, y: 5 },
                align: 'right'
            }
        );
        controlsText.setOrigin(1, 0);
        controlsText.setScrollFactor(0);

        // 패시브 아이템 표시
        this.passiveItemsText = this.add.text(16, 110, '', {
            fontSize: '14px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
        this.passiveItemsText.setScrollFactor(0);
    }

    updateUI() {
        if (window.player && this.healthText) {
            const hearts = Math.ceil(window.player.hp / 10); // 10HP = 1하트
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

        // 패시브 아이템 툴팁 UI 업데이트 (기존 텍스트 대체)
        if (this.passiveItemTooltipUI) {
            this.passiveItemTooltipUI.update(16, 110);
        }
    }

    handlePlayerDeath() {
        console.log('플레이어 사망!');

        // 0.5초 후 게임 오버 화면으로 전환
        this.time.delayedCall(500, () => {
            this.scene.start('GameOverScene');
        });
    }

    update() {
        try {
            if (!window.player) return;

            // 플레이어 업데이트
            window.player.update(this.cursors, this.keys);

            // 적 업데이트
            this.enemyList.forEach(enemy => {
                if (enemy && enemy.isAlive) {
                    enemy.update();
                }
            });

            // 사망한 적 제거
            this.enemyList = this.enemyList.filter(enemy => enemy.isAlive);

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

            // 능력 오브 정리
            window.abilityOrbs = window.abilityOrbs.filter(orb => orb && orb.active);

            // 아이템 업데이트 및 충돌 체크
            window.items.forEach(item => {
                if (item && item.isActive) {
                    item.update();

                    // 플레이어와 아이템 충돌
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

            // 비활성 아이템 제거
            window.items = window.items.filter(item => item && item.isActive);

            // UI 업데이트
            this.updateUI();

        } catch (error) {
            console.error('GameScene update 오류:', error);
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.GameScene = GameScene;
}
