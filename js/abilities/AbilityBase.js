// 능력 기본 클래스
class AbilityBase {
    constructor(scene, name, config) {
        this.scene = scene;
        this.name = name;
        this.config = config;

        this.owner = null; // 플레이어 참조

        // 쿨타임 관리
        this.lastBasicAttackTime = 0;
        this.lastStrongAttackTime = 0;
        this.lastSkillTime = 0;

        // 활성화된 공격 객체들
        this.activeAttacks = [];
    }

    // 주인(플레이어) 설정
    setOwner(owner) {
        this.owner = owner;
    }

    // 쿨타임 체크
    canUseBasicAttack() {
        const currentTime = this.scene.time.now;
        return (currentTime - this.lastBasicAttackTime) >= this.config.BASIC_COOLDOWN;
    }

    canUseStrongAttack() {
        const currentTime = this.scene.time.now;
        return (currentTime - this.lastStrongAttackTime) >= this.config.STRONG_COOLDOWN;
    }

    canUseSkill() {
        const currentTime = this.scene.time.now;
        return (currentTime - this.lastSkillTime) >= this.config.SKILL_COOLDOWN;
    }

    // 공격 메서드 (하위 클래스에서 오버라이드)
    basicAttack() {
        if (!this.canUseBasicAttack()) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log(`${this.name}: 기본 공격 쿨타임`);
            }
            return;
        }

        this.lastBasicAttackTime = this.scene.time.now;
        this._performBasicAttack();
    }

    strongAttack() {
        if (!this.canUseStrongAttack()) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log(`${this.name}: 강공격 쿨타임`);
            }
            return;
        }

        this.lastStrongAttackTime = this.scene.time.now;
        this._performStrongAttack();
    }

    specialSkill() {
        if (!this.canUseSkill()) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log(`${this.name}: 스킬 쿨타임`);
            }
            return;
        }

        this.lastSkillTime = this.scene.time.now;
        this._performSpecialSkill();
    }

    // 실제 공격 실행 (하위 클래스에서 구현)
    _performBasicAttack() {
        console.warn(`${this.name}: _performBasicAttack() 미구현`);
    }

    _performStrongAttack() {
        console.warn(`${this.name}: _performStrongAttack() 미구현`);
    }

    _performSpecialSkill() {
        console.warn(`${this.name}: _performSpecialSkill() 미구현`);
    }

    // 능력 교체 시 호출
    onSwapIn() {
        // 하위 클래스에서 오버라이드 가능
        if (CONSTANTS.GAME.DEBUG) {
            console.log(`${this.name}: 교체 효과`);
        }
    }

    // 공격 판정 생성 (범위 공격)
    createMeleeHitbox(offsetX, offsetY, width, height, damage, duration = 200) {
        if (!this.owner) return null;

        try {
            const playerX = this.owner.sprite.x;
            const playerY = this.owner.sprite.y;

            // 방향에 따라 오프셋 조정
            const directionMultiplier = this.owner.facingRight ? 1 : -1;
            const actualOffsetX = offsetX * directionMultiplier;

            // 히트박스 생성
            const hitbox = this.scene.add.rectangle(
                playerX + actualOffsetX,
                playerY + offsetY,
                width,
                height,
                0xFF0000,
                0.3 // 디버그용 투명도
            );

            // 물리 바디 추가
            this.scene.physics.add.existing(hitbox);
            hitbox.body.setAllowGravity(false);
            hitbox.body.setImmovable(true);

            // 데이터 저장
            hitbox.setData('damage', damage);
            hitbox.setData('type', 'playerAttack');
            hitbox.setData('owner', this.owner);

            // 디버그 모드가 아니면 보이지 않게
            if (!CONSTANTS.GAME.DEBUG) {
                hitbox.setAlpha(0);
            }

            // 일정 시간 후 제거
            this.scene.time.delayedCall(duration, () => {
                if (hitbox && hitbox.active) {
                    hitbox.destroy();
                }
            });

            this.activeAttacks.push(hitbox);

            return hitbox;

        } catch (error) {
            console.error('히트박스 생성 오류:', error);
            return null;
        }
    }

    // 원거리 투사체 생성
    createProjectile(offsetX, offsetY, velocityX, velocityY, damage, range) {
        if (!this.owner) return null;

        try {
            const playerX = this.owner.sprite.x;
            const playerY = this.owner.sprite.y;

            // 방향에 따라 속도 조정
            const directionMultiplier = this.owner.facingRight ? 1 : -1;
            const actualVelocityX = velocityX * directionMultiplier;

            // 투사체 생성 (작은 원)
            const projectile = this.scene.add.circle(
                playerX + (offsetX * directionMultiplier),
                playerY + offsetY,
                8,
                0xFFFF00
            );

            // 물리 바디 추가
            this.scene.physics.add.existing(projectile);
            projectile.body.setAllowGravity(false);
            projectile.body.setVelocity(actualVelocityX, velocityY);

            // 데이터 저장
            projectile.setData('damage', damage);
            projectile.setData('type', 'playerAttack');
            projectile.setData('owner', this.owner);
            projectile.setData('startX', playerX);
            projectile.setData('range', range);

            this.activeAttacks.push(projectile);

            return projectile;

        } catch (error) {
            console.error('투사체 생성 오류:', error);
            return null;
        }
    }

    // 업데이트
    update() {
        // 활성 공격 객체 업데이트 (범위 체크 등)
        this.activeAttacks = this.activeAttacks.filter(attack => {
            if (!attack || !attack.active) {
                return false;
            }

            // 투사체의 경우 범위 체크
            if (attack.getData('range')) {
                const startX = attack.getData('startX');
                const range = attack.getData('range');
                const distance = Math.abs(attack.x - startX);

                if (distance > range) {
                    attack.destroy();
                    return false;
                }
            }

            return true;
        });
    }

    // 파괴
    destroy() {
        this.activeAttacks.forEach(attack => {
            if (attack && attack.active) {
                attack.destroy();
            }
        });

        this.activeAttacks = [];
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.AbilityBase = AbilityBase;
}
