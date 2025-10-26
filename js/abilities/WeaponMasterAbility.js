// 웨폰마스터 능력 - 3가지 폼 전환 시스템
class WeaponMasterAbility extends AbilityBase {
    constructor(scene) {
        super(scene, '웨폰마스터', CONSTANTS.ABILITIES.WEAPON_MASTER);

        // 폼 시스템
        this.currentForm = 1; // 0: Knight, 1: Archer, 2: Wizard (시작은 Archer)
        this.lastFormSwitchTime = 0;

        this.formNames = [
            '수호의 기사', // Guardian Knight
            '황혼의 궁수', // Twilight Archer
            '정령 마법사'  // Elemental Wizard
        ];

        // Archer 폼 전용: 콤보 시스템
        this.archerCombo = 0;
        this.archerComboResetTime = 1000;
        this.lastArcherHitTime = 0;

        // Wizard 폼 전용: 원소 타입 (fire/water)
        this.currentElement = 'fire'; // 'fire' or 'water'
    }

    // 폼 이름 가져오기
    getCurrentFormName() {
        return this.formNames[this.currentForm];
    }

    // 폼 전환 (Q키 = 왼쪽, E키 = 오른쪽)
    switchForm(direction) {
        const currentTime = this.scene.time.now;

        if (currentTime - this.lastFormSwitchTime < this.config.FORM_SWITCH_COOLDOWN) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log('웨폰마스터: 폼 전환 쿨타임');
            }
            return false;
        }

        this.lastFormSwitchTime = currentTime;

        if (direction === 'left') {
            this.currentForm = (this.currentForm - 1 + 3) % 3;
        } else if (direction === 'right') {
            this.currentForm = (this.currentForm + 1) % 3;
        }

        // 폼 전환 이펙트
        this.createFormSwitchEffect();

        if (CONSTANTS.GAME.DEBUG) {
            console.log('웨폰마스터: 폼 전환 →', this.getCurrentFormName());
        }

        return true;
    }

    // 폼 전환 이펙트
    createFormSwitchEffect() {
        if (!this.owner) return;

        const colors = [0x4169E1, 0xFFD700, 0x9370DB]; // Knight: Blue, Archer: Gold, Wizard: Purple
        const color = colors[this.currentForm];

        // 폼 전환 원형 파장
        const wave = this.scene.add.circle(
            this.owner.sprite.x,
            this.owner.sprite.y,
            30,
            color,
            0.5
        );

        this.scene.tweens.add({
            targets: wave,
            scale: 3,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                wave.destroy();
            }
        });

        // 플레이어 주변 파티클
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.scene.add.circle(
                this.owner.sprite.x,
                this.owner.sprite.y,
                5,
                color,
                0.8
            );

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 60,
                y: particle.y + Math.sin(angle) * 60,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    // 기본 공격 - 폼에 따라 다름
    _performBasicAttack() {
        if (!this.owner) return;

        switch (this.currentForm) {
            case 0: // Guardian Knight
                this.knightBasicAttack();
                break;
            case 1: // Twilight Archer
                this.archerBasicAttack();
                break;
            case 2: // Elemental Wizard
                this.wizardBasicAttack();
                break;
        }
    }

    // 강공격 - 폼에 따라 다름
    _performStrongAttack() {
        if (!this.owner) return;

        switch (this.currentForm) {
            case 0: // Guardian Knight
                this.knightStrongAttack();
                break;
            case 1: // Twilight Archer
                this.archerStrongAttack();
                break;
            case 2: // Elemental Wizard
                this.wizardStrongAttack();
                break;
        }
    }

    // 궁극기 - 폼에 따라 다름
    _performSpecialSkill() {
        if (!this.owner) return;

        switch (this.currentForm) {
            case 0: // Guardian Knight
                this.knightSpecialSkill();
                break;
            case 1: // Twilight Archer
                this.archerSpecialSkill();
                break;
            case 2: // Elemental Wizard
                this.wizardSpecialSkill();
                break;
        }
    }

    // ===== Guardian Knight 폼 공격들 =====

    // Knight 기본: 검 베기 + 전방 충격파
    knightBasicAttack() {
        // 근접 검 베기
        this.createMeleeHitbox(
            30, 0,
            45, 35,
            this.config.KNIGHT_BASIC_DAMAGE,
            150
        );

        // 충격파 발사
        this.scene.time.delayedCall(100, () => {
            if (!this.owner) return;

            const shockwave = this.createProjectile(
                40, 0,
                400, 0,
                this.config.KNIGHT_BASIC_DAMAGE * 0.7,
                250
            );

            if (shockwave) {
                shockwave.setFillStyle(0x4169E1, 0.6);
                shockwave.setScale(1.5, 1);
            }
        });
    }

    // Knight 강공격: 회전 베기 (넉백)
    knightStrongAttack() {
        // 주변 원형 공격
        this.createMeleeHitbox(
            0, 0,
            90, 90,
            this.config.KNIGHT_STRONG_DAMAGE,
            350
        );

        // 회전 애니메이션
        this.scene.tweens.add({
            targets: this.owner.sprite,
            angle: this.owner.facingRight ? 360 : -360,
            duration: 350,
            onComplete: () => {
                this.owner.sprite.angle = 0;
            }
        });

        // 넉백 효과는 적 충돌 시 처리
    }

    // Knight 궁극기: 거대 참격 (부채꼴 범위)
    knightSpecialSkill() {
        const direction = this.owner.facingRight ? 1 : -1;

        // 여러 개의 히트박스로 부채꼴 형성
        for (let i = -1; i <= 1; i++) {
            const offsetY = i * 30;
            const offsetX = 50 + Math.abs(i) * 20;

            this.scene.time.delayedCall(50 + Math.abs(i) * 50, () => {
                if (!this.owner) return;

                this.createMeleeHitbox(
                    offsetX, offsetY,
                    80, 60,
                    this.config.KNIGHT_SKILL_DAMAGE,
                    300
                );

                // 거대 검기 이펙트
                const slash = this.scene.add.rectangle(
                    this.owner.sprite.x + offsetX * direction,
                    this.owner.sprite.y + offsetY,
                    80, 60,
                    0x4169E1,
                    0.4
                );

                this.scene.tweens.add({
                    targets: slash,
                    alpha: 0,
                    scaleX: 1.5,
                    duration: 300,
                    onComplete: () => {
                        slash.destroy();
                    }
                });
            });
        }
    }

    // ===== Twilight Archer 폼 공격들 =====

    // Archer 기본: 관통 화살
    archerBasicAttack() {
        const arrow = this.createProjectile(
            30, -5,
            500, 0,
            this.config.ARCHER_BASIC_DAMAGE,
            400
        );

        if (arrow) {
            arrow.setFillStyle(0xFFD700);
            arrow.setScale(1.5, 0.8);
            arrow.setData('piercing', true); // 관통 속성

            // 콤보 시스템 체크
            const currentTime = this.scene.time.now;
            if (currentTime - this.lastArcherHitTime < this.archerComboResetTime) {
                this.archerCombo++;
                // 콤보가 쌓이면 데미지 증가
                const comboDamage = this.config.ARCHER_BASIC_DAMAGE * (1 + this.archerCombo * 0.1);
                arrow.setData('damage', comboDamage);
            } else {
                this.archerCombo = 0;
            }
        }
    }

    // Archer 강공격: 3연발 속사
    archerStrongAttack() {
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                if (!this.owner) return;

                const arrow = this.createProjectile(
                    30, -5 + (i * 10 - 10),
                    550, 0,
                    this.config.ARCHER_STRONG_DAMAGE / 3,
                    350
                );

                if (arrow) {
                    arrow.setFillStyle(0xFFD700);
                    arrow.setScale(1.2, 0.6);
                }
            });
        }
    }

    // Archer 궁극기: 헤드샷 폭격 (낙하 화살)
    archerSpecialSkill() {
        const targetX = this.owner.sprite.x + (this.owner.facingRight ? 200 : -200);

        // 하늘에서 화살 낙하
        for (let i = 0; i < 7; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                if (!this.scene || !this.scene.physics) return;

                const xOffset = (Math.random() - 0.5) * 150;
                const arrow = this.scene.add.circle(
                    targetX + xOffset,
                    50,
                    8,
                    0xFFD700
                );

                this.scene.physics.add.existing(arrow);
                arrow.body.setAllowGravity(false);
                arrow.body.setVelocity(0, 600);

                arrow.setData('damage', this.config.ARCHER_SKILL_DAMAGE);
                arrow.setData('type', 'playerAttack');
                arrow.setData('owner', this.owner);

                this.activeAttacks.push(arrow);

                // 히트 이펙트
                this.scene.time.delayedCall(500, () => {
                    if (arrow && arrow.active) {
                        // 착탄 이펙트
                        const impact = this.scene.add.circle(
                            arrow.x, arrow.y,
                            30, 0xFFD700, 0.5
                        );

                        this.scene.tweens.add({
                            targets: impact,
                            scale: 2,
                            alpha: 0,
                            duration: 200,
                            onComplete: () => {
                                impact.destroy();
                            }
                        });

                        arrow.destroy();
                    }
                });
            });
        }
    }

    // ===== Elemental Wizard 폼 공격들 =====

    // Wizard 기본: 원소 구슬 (불=회복, 물=실드)
    wizardBasicAttack() {
        // 원소 타입 교체
        this.currentElement = this.currentElement === 'fire' ? 'water' : 'fire';

        const color = this.currentElement === 'fire' ? 0xFF4500 : 0x00CED1;

        const orb = this.createProjectile(
            30, 0,
            350, 0,
            this.config.WIZARD_BASIC_DAMAGE,
            300
        );

        if (orb) {
            orb.setFillStyle(color, 0.8);
            orb.setScale(1.3);
            orb.setData('element', this.currentElement);

            // 불 원소: 적 처치 시 체력 회복 효과는 적 충돌 처리에서
            // 물 원소: 실드 생성
            if (this.currentElement === 'water' && this.owner) {
                this.createWaterShield();
            }
        }
    }

    // 물 실드 생성
    createWaterShield() {
        if (!this.owner) return;

        const shield = this.scene.add.circle(
            this.owner.sprite.x,
            this.owner.sprite.y,
            40,
            0x00CED1,
            0.3
        );
        shield.setStrokeStyle(3, 0x00CED1, 0.8);

        // 실드는 3초간 유지
        this.owner.grantInvincibility(3000);

        this.scene.tweens.add({
            targets: shield,
            scale: 1.2,
            alpha: 0,
            duration: 3000,
            onUpdate: () => {
                if (this.owner && this.owner.sprite) {
                    shield.setPosition(this.owner.sprite.x, this.owner.sprite.y);
                }
            },
            onComplete: () => {
                shield.destroy();
            }
        });
    }

    // Wizard 강공격: 원소 폭발 (불=도트, 물=빙결)
    wizardStrongAttack() {
        const color = this.currentElement === 'fire' ? 0xFF4500 : 0x00CED1;

        // 범위 폭발
        this.createMeleeHitbox(
            50, 0,
            100, 80,
            this.config.WIZARD_STRONG_DAMAGE,
            400
        );

        // 폭발 이펙트
        const explosion = this.scene.add.circle(
            this.owner.sprite.x + (this.owner.facingRight ? 50 : -50),
            this.owner.sprite.y,
            50,
            color,
            0.6
        );

        this.scene.tweens.add({
            targets: explosion,
            scale: 2.5,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                explosion.destroy();
            }
        });

        // 불 원소: 도트 데미지 (지속 피해는 적 충돌 처리에서)
        // 물 원소: 빙결 (슬로우 효과는 적 충돌 처리에서)
    }

    // Wizard 궁극기: 원소의 심판 (랜덤 불/물)
    wizardSpecialSkill() {
        // 랜덤 원소 선택
        const element = Math.random() < 0.5 ? 'fire' : 'water';
        const color = element === 'fire' ? 0xFF4500 : 0x00CED1;

        // 화면 전체에 원소 낙하
        for (let i = 0; i < 12; i++) {
            this.scene.time.delayedCall(i * 80, () => {
                if (!this.owner || !this.scene) return;

                const xPos = this.owner.sprite.x + (Math.random() - 0.5) * 400;

                const meteor = this.scene.add.circle(
                    xPos,
                    20,
                    12,
                    color,
                    0.9
                );

                this.scene.physics.add.existing(meteor);
                meteor.body.setAllowGravity(false);
                meteor.body.setVelocity(0, 500);

                meteor.setData('damage', this.config.WIZARD_SKILL_DAMAGE);
                meteor.setData('type', 'playerAttack');
                meteor.setData('owner', this.owner);
                meteor.setData('element', element);

                this.activeAttacks.push(meteor);

                // 착탄 후 폭발
                this.scene.time.delayedCall(600, () => {
                    if (meteor && meteor.active) {
                        // 착탄 폭발
                        for (let j = 0; j < 5; j++) {
                            const angle = (Math.PI * 2 * j) / 5;
                            const splash = this.scene.add.circle(
                                meteor.x,
                                meteor.y,
                                8,
                                color,
                                0.7
                            );

                            this.scene.tweens.add({
                                targets: splash,
                                x: splash.x + Math.cos(angle) * 40,
                                y: splash.y + Math.sin(angle) * 40,
                                alpha: 0,
                                duration: 300,
                                onComplete: () => {
                                    splash.destroy();
                                }
                            });
                        }

                        meteor.destroy();
                    }
                });
            });
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log('웨폰마스터(마법사): 원소의 심판 -', element);
        }
    }

    // 업데이트 - Archer 콤보 타이머 체크
    update() {
        super.update();

        if (this.currentForm === 1) { // Archer
            const currentTime = this.scene.time.now;
            if (currentTime - this.lastArcherHitTime > this.archerComboResetTime) {
                if (this.archerCombo > 0) {
                    this.archerCombo = 0;
                    if (CONSTANTS.GAME.DEBUG) {
                        console.log('Archer 콤보 리셋');
                    }
                }
            }
        }
    }

    // 능력 교체 시 (이 직업은 직접 교체되지 않으므로 빈 구현)
    onSwapIn() {
        if (CONSTANTS.GAME.DEBUG) {
            console.log('웨폰마스터: 시작 -', this.getCurrentFormName());
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.WeaponMasterAbility = WeaponMasterAbility;
}
