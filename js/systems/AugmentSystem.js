// 증강 시스템 - 직업별 증강 & 유니버셜 증강 통합
class AugmentSystem {
    constructor(scene) {
        this.scene = scene;
        this.selectedAugments = [];
        this.effectHandler = null; // AugmentEffectHandler는 나중에 초기화

        // 모든 증강 풀 통합
        this.augmentPool = this.createAugmentPool();
    }

    // 증강 풀 생성 (모든 증강 통합)
    createAugmentPool() {
        const allAugments = [];

        // 직업별 증강 추가
        if (window.SWORD_AUGMENTS) {
            allAugments.push(...window.SWORD_AUGMENTS);
        }
        if (window.MAGIC_AUGMENTS) {
            allAugments.push(...window.MAGIC_AUGMENTS);
        }
        if (window.HAMMER_AUGMENTS) {
            allAugments.push(...window.HAMMER_AUGMENTS);
        }
        if (window.BOW_AUGMENTS) {
            allAugments.push(...window.BOW_AUGMENTS);
        }

        // 유니버셜 증강 추가
        if (window.UNIVERSAL_AUGMENTS) {
            allAugments.push(...window.UNIVERSAL_AUGMENTS);
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`증강 풀 생성 완료: ${allAugments.length}개`);
        }

        return allAugments;
    }

    // 플레이어 직업에 맞는 증강 필터링
    getAvailableAugments(player) {
        if (!player || !player.getCurrentAbility()) {
            return this.augmentPool.filter(aug => !aug.requiredJob);
        }

        const currentJob = player.getCurrentAbility().name;

        return this.augmentPool.filter(augment => {
            // 이미 선택한 증강 제외
            if (this.selectedAugments.some(selected => selected.id === augment.id)) {
                return false;
            }

            // 직업 요구사항 체크
            if (augment.requiredJob === null) {
                // 유니버셜 증강
                return true;
            } else if (augment.requiredJob === currentJob) {
                // 현재 직업 전용 증강
                return true;
            }

            return false;
        });
    }

    // 랜덤 증강 3개 선택 (희귀도 가중치 적용)
    getRandomAugments(player, count = 3) {
        const availableAugments = this.getAvailableAugments(player);

        if (availableAugments.length === 0) {
            console.warn('선택 가능한 증강이 없습니다!');
            return [];
        }

        // 희귀도별 가중치
        const rarityWeights = {
            common: 50,
            rare: 30,
            epic: 15,
            legendary: 5
        };

        // 가중치 기반 랜덤 선택
        const selected = [];
        const tempPool = [...availableAugments];

        for (let i = 0; i < Math.min(count, tempPool.length); i++) {
            // 가중치 합계
            const totalWeight = tempPool.reduce((sum, aug) =>
                sum + (rarityWeights[aug.rarity] || 1), 0
            );

            // 랜덤 값으로 증강 선택
            let random = Math.random() * totalWeight;
            let selectedAugment = null;

            for (const aug of tempPool) {
                random -= (rarityWeights[aug.rarity] || 1);
                if (random <= 0) {
                    selectedAugment = aug;
                    break;
                }
            }

            if (selectedAugment) {
                selected.push(selectedAugment);
                tempPool.splice(tempPool.indexOf(selectedAugment), 1);
            }
        }

        return selected;
    }

    // 증강 적용
    applyAugment(augment, player) {
        if (!augment || !player) return false;

        try {
            // EffectHandler 없으면 생성
            if (!this.effectHandler) {
                this.effectHandler = new AugmentEffectHandler(this.scene, player);
            }

            // 증강 효과 실행
            if (augment.effectHandler) {
                this.effectHandler.activateAugment(augment);
            } else {
                console.warn(`증강 ${augment.name}에 effectHandler가 없습니다.`);
            }

            this.selectedAugments.push(augment);

            if (CONSTANTS.GAME.DEBUG) {
                console.log(`증강 적용: ${augment.name} (${augment.rarity})`);
            }

            return true;
        } catch (error) {
            console.error('증강 적용 실패:', error);
            return false;
        }
    }

    // 증강 선택 UI 생성
    showAugmentSelection(player, callback) {
        const augments = this.getRandomAugments(player, 3);

        if (augments.length === 0) {
            // 더 이상 증강이 없으면 바로 콜백 실행
            if (callback) callback();
            return;
        }

        // 게임 일시정지
        this.scene.physics.pause();

        // 카메라 중앙 좌표 계산
        const camera = this.scene.cameras.main;
        const centerX = camera.worldView.x + camera.width / 2;
        const centerY = camera.worldView.y + camera.height / 2;

        // 화면 오버레이
        const overlay = this.scene.add.rectangle(
            centerX,
            centerY,
            camera.width, camera.height,
            0x000000, 0.9
        );
        overlay.setDepth(900);
        overlay.setScrollFactor(0);

        // 제목
        const titleText = this.scene.add.text(
            centerX, centerY - 240,
            '🎯 증강 선택',
            {
                fontFamily: 'Jua',
                fontSize: '48px',
                fill: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        titleText.setOrigin(0.5);
        titleText.setDepth(901);
        titleText.setScrollFactor(0);

        // 직업 표시
        const jobText = this.scene.add.text(
            centerX, centerY - 190,
            `현재 직업: ${player.getCurrentAbility()?.name || '없음'}`,
            {
                fontFamily: 'Jua',
                fontSize: '22px',
                fill: '#AAAAAA',
                fontStyle: 'bold'
            }
        );
        jobText.setOrigin(0.5);
        jobText.setDepth(901);
        jobText.setScrollFactor(0);

        // 희귀도 색상
        const rarityColors = {
            common: '#AAAAAA',
            rare: '#4488FF',
            epic: '#AA00FF',
            legendary: '#FF8800'
        };

        const rarityNames = {
            common: '일반',
            rare: '레어',
            epic: '에픽',
            legendary: '전설'
        };

        // 증강 카드 생성
        const cardWidth = 220;
        const cardHeight = 300;
        const spacing = 20;
        const totalWidth = cardWidth * 3 + spacing * 2;
        const startX = centerX - totalWidth / 2 + cardWidth / 2;
        const cardY = centerY;
        const cards = [];

        augments.forEach((augment, index) => {
            const cardX = startX + (cardWidth + spacing) * index;

            // 카드 배경
            const cardBg = this.scene.add.rectangle(
                cardX, cardY,
                cardWidth, cardHeight,
                0x1a1a1a
            );
            cardBg.setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(rarityColors[augment.rarity]).color);
            cardBg.setDepth(901);
            cardBg.setScrollFactor(0);
            cardBg.setInteractive();

            // 직업 태그 (직업 전용인 경우)
            let jobTag = null;
            if (augment.requiredJob) {
                jobTag = this.scene.add.text(
                    cardX, cardY - cardHeight / 2 + 20,
                    `[${augment.requiredJob}]`,
                    {
                        fontFamily: 'Jua',
                        fontSize: '16px',
                        fill: '#FFFF00',
                        fontStyle: 'bold'
                    }
                );
                jobTag.setOrigin(0.5);
                jobTag.setDepth(902);
                jobTag.setScrollFactor(0);
            }

            // 희귀도 표시
            const rarityText = this.scene.add.text(
                cardX, cardY - cardHeight / 2 + (jobTag ? 45 : 30),
                rarityNames[augment.rarity],
                {
                    fontFamily: 'Jua',
                    fontSize: '18px',
                    fill: rarityColors[augment.rarity],
                    fontStyle: 'bold'
                }
            );
            rarityText.setOrigin(0.5);
            rarityText.setDepth(902);
            rarityText.setScrollFactor(0);

            // 아이콘
            const iconText = this.scene.add.text(
                cardX, cardY - 80,
                augment.icon || '⭐',
                {
                    fontSize: '48px'
                }
            );
            iconText.setOrigin(0.5);
            iconText.setDepth(902);
            iconText.setScrollFactor(0);

            // 증강 이름
            const nameText = this.scene.add.text(
                cardX, cardY - 20,
                augment.name,
                {
                    fontFamily: 'Jua',
                    fontSize: '26px',
                    fill: '#FFFFFF',
                    fontStyle: 'bold',
                    wordWrap: { width: cardWidth - 30 }
                }
            );
            nameText.setOrigin(0.5);
            nameText.setDepth(902);
            nameText.setScrollFactor(0);

            // 증강 설명
            const descText = this.scene.add.text(
                cardX, cardY + 60,
                augment.description,
                {
                    fontFamily: 'Jua',
                    fontSize: '17px',
                    fill: '#CCCCCC',
                    align: 'center',
                    wordWrap: { width: cardWidth - 40 }
                }
            );
            descText.setOrigin(0.5);
            descText.setDepth(902);
            descText.setScrollFactor(0);

            const elements = [cardBg, rarityText, iconText, nameText, descText];
            if (jobTag) elements.push(jobTag);

            // 호버 효과
            cardBg.on('pointerover', () => {
                cardBg.setFillStyle(0x2a2a2a);
                this.scene.tweens.add({
                    targets: elements,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            cardBg.on('pointerout', () => {
                cardBg.setFillStyle(0x1a1a1a);
                this.scene.tweens.add({
                    targets: elements,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            // 클릭 이벤트
            cardBg.on('pointerdown', () => {
                // 증강 적용
                this.applyAugment(augment, player);

                // UI 제거
                cards.forEach(card => {
                    card.elements.forEach(el => el.destroy());
                });
                overlay.destroy();
                titleText.destroy();
                jobText.destroy();

                // 게임 재개
                this.scene.physics.resume();

                // 콜백 실행
                if (callback) {
                    callback(augment);
                }
            });

            cards.push({
                augment,
                elements
            });
        });
    }

    // 업데이트 (매 프레임)
    update() {
        if (this.effectHandler) {
            this.effectHandler.update();
        }
    }

    // 정리
    destroy() {
        if (this.effectHandler) {
            this.effectHandler.destroy();
        }
        this.selectedAugments = [];
        this.scene = null;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.AugmentSystem = AugmentSystem;
}
