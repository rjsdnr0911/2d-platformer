// 검술 능력
class SwordAbility extends AbilityBase {
    constructor(scene) {
        super(scene, '검술', CONSTANTS.ABILITIES.SWORD);

        this.comboCount = 0;
        this.lastComboTime = 0;
        this.comboResetTime = 500; // 0.5초 내에 다시 공격해야 콤보 유지
    }

    // 기본 공격: 3연타 콤보
    _performBasicAttack() {
        if (!this.owner) return;

        const currentTime = this.scene.time.now;

        // 콤보 타이머 체크
        if (currentTime - this.lastComboTime > this.comboResetTime) {
            this.comboCount = 0;
        }

        this.comboCount = (this.comboCount % 3) + 1;
        this.lastComboTime = currentTime;

        // 콤보 단계별 다른 공격
        switch (this.comboCount) {
            case 1:
                this.performSlash1();
                break;
            case 2:
                this.performSlash2();
                break;
            case 3:
                this.performSlash3();
                break;
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`검술: 기본 공격 ${this.comboCount}단`);
        }
    }

    // 1단 공격
    performSlash1() {
        this.createMeleeHitbox(
            30, 0, // 위치 (플레이어 앞)
            40, 30, // 크기
            this.config.BASIC_DAMAGE,
            150 // 지속 시간
        );

        // 플레이어를 약간 앞으로 이동
        if (this.owner.facingRight) {
            this.owner.sprite.body.setVelocityX(100);
        } else {
            this.owner.sprite.body.setVelocityX(-100);
        }
    }

    // 2단 공격
    performSlash2() {
        this.createMeleeHitbox(
            35, -5, // 위치
            45, 35, // 더 큰 범위
            this.config.BASIC_DAMAGE + 2,
            150
        );

        // 약간 더 빠르게 이동
        if (this.owner.facingRight) {
            this.owner.sprite.body.setVelocityX(120);
        } else {
            this.owner.sprite.body.setVelocityX(-120);
        }
    }

    // 3단 공격 (피니시)
    performSlash3() {
        this.createMeleeHitbox(
            40, 0, // 위치
            50, 40, // 가장 큰 범위
            this.config.BASIC_DAMAGE + 5,
            200
        );

        // 강한 전진
        if (this.owner.facingRight) {
            this.owner.sprite.body.setVelocityX(150);
        } else {
            this.owner.sprite.body.setVelocityX(-150);
        }

        // 이펙트 (회전 공격 느낌)
        this.scene.tweens.add({
            targets: this.owner.sprite,
            angle: this.owner.facingRight ? 360 : -360,
            duration: 200,
            onComplete: () => {
                this.owner.sprite.angle = 0;
            }
        });
    }

    // 강공격: 360도 회전 베기
    _performStrongAttack() {
        if (!this.owner) return;

        // 주변 원형 범위 공격
        this.createMeleeHitbox(
            0, 0, // 플레이어 중심
            80, 80, // 원형처럼 보이도록 큰 사각형
            this.config.STRONG_DAMAGE,
            300
        );

        // 회전 애니메이션
        this.scene.tweens.add({
            targets: this.owner.sprite,
            angle: 720, // 2바퀴 회전
            duration: 300,
            onComplete: () => {
                this.owner.sprite.angle = 0;
            }
        });

        // 플레이어 약간 떠오름
        this.owner.sprite.body.setVelocityY(-100);

        if (CONSTANTS.GAME.DEBUG) {
            console.log('검술: 회전 베기');
        }
    }

    // 특수 스킬: 돌진 베기
    _performSpecialSkill() {
        if (!this.owner) return;

        const dashDirection = this.owner.facingRight ? 1 : -1;
        const dashSpeed = 500;
        const dashDuration = 300;

        // 돌진 시작
        this.owner.sprite.body.setVelocityX(dashSpeed * dashDirection);
        this.owner.sprite.body.setVelocityY(0);

        // 돌진 중 무적
        this.owner.isInvincible = true;
        this.owner.sprite.setAlpha(0.7);

        // 돌진 경로에 히트박스 생성 (여러 개)
        let hitboxInterval = this.scene.time.addEvent({
            delay: 50,
            repeat: dashDuration / 50 - 1,
            callback: () => {
                this.createMeleeHitbox(
                    0, 0,
                    50, 50,
                    this.config.SKILL_DAMAGE / 3, // 여러 번 맞을 수 있으니 낮춤
                    100
                );
            }
        });

        // 돌진 종료
        this.scene.time.delayedCall(dashDuration, () => {
            this.owner.sprite.body.setVelocityX(0);
            this.owner.isInvincible = false;
            this.owner.sprite.setAlpha(1);

            // 마지막 강한 일격
            this.createMeleeHitbox(
                40, 0,
                60, 60,
                this.config.SKILL_DAMAGE,
                200
            );

            if (hitboxInterval) {
                hitboxInterval.remove();
            }
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('검술: 돌진 베기');
        }
    }

    // 능력 교체 시 호출
    onSwapIn() {
        if (!this.owner) return;

        // 교체 효과: 주변 적 밀어내기
        const pushForce = 200;
        const pushRange = 100;

        // 주변에 작은 충격파
        const shockwave = this.scene.add.circle(
            this.owner.sprite.x,
            this.owner.sprite.y,
            pushRange,
            0xFFFFFF,
            0.3
        );

        // 페이드 아웃
        this.scene.tweens.add({
            targets: shockwave,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => {
                shockwave.destroy();
            }
        });

        // 범위 내 적들에게 밀어내기 효과
        // (적 구현 후 처리)

        if (CONSTANTS.GAME.DEBUG) {
            console.log('검술: 교체 - 밀어내기');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.SwordAbility = SwordAbility;
}
