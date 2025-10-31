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
        // 공격 시작 시 짧은 무적 프레임
        this.giveAttackInvincibility();

        this.createMeleeHitbox(
            40, 0, // 위치 (30 → 40, 더 앞으로)
            55, 40, // 크기 (40x30 → 55x40, 확장)
            this.config.BASIC_DAMAGE,
            150 // 지속 시간
        );

        // 플레이어를 더 빠르게 앞으로 이동
        if (this.owner.facingRight) {
            this.owner.sprite.body.setVelocityX(150); // 100 → 150
        } else {
            this.owner.sprite.body.setVelocityX(-150);
        }
    }

    // 2단 공격
    performSlash2() {
        // 공격 시작 시 짧은 무적 프레임
        this.giveAttackInvincibility();

        this.createMeleeHitbox(
            45, -5, // 위치 (35 → 45, 더 앞으로)
            65, 45, // 크기 (45x35 → 65x45, 확장)
            this.config.BASIC_DAMAGE + 2,
            150
        );

        // 더 빠르게 이동
        if (this.owner.facingRight) {
            this.owner.sprite.body.setVelocityX(180); // 120 → 180
        } else {
            this.owner.sprite.body.setVelocityX(-180);
        }
    }

    // 3단 공격 (피니시)
    performSlash3() {
        // 공격 시작 시 짧은 무적 프레임
        this.giveAttackInvincibility();

        this.createMeleeHitbox(
            55, 0, // 위치 (40 → 55, 더 앞으로)
            80, 50, // 크기 (50x40 → 80x50, 확장)
            this.config.BASIC_DAMAGE + 5,
            200
        );

        // 매우 강한 전진
        if (this.owner.facingRight) {
            this.owner.sprite.body.setVelocityX(220); // 150 → 220
        } else {
            this.owner.sprite.body.setVelocityX(-220);
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

        // 3단 콤보 완성: 검기 발사
        this.scene.time.delayedCall(100, () => {
            this.fireSwordBeam();
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

    // 검기 발사 (3단 콤보 완성 보상)
    fireSwordBeam() {
        if (!this.owner) return;

        const direction = this.owner.facingRight ? 1 : -1;
        const beamSpeed = 500;
        const beamDistance = 150;
        const beamDamage = Math.floor((this.config.BASIC_DAMAGE + 5) * 0.6); // 3단 데미지의 60%

        // 검기 이펙트 생성
        const beam = this.scene.add.rectangle(
            this.owner.sprite.x + (30 * direction),
            this.owner.sprite.y,
            20, 30,
            0xFFFF00,
            0.8
        );

        // 검기에 물리 바디 추가
        this.scene.physics.add.existing(beam);
        beam.body.setAllowGravity(false);
        beam.body.setVelocityX(beamSpeed * direction);

        // 검기 데이터 저장
        beam.setData('damage', beamDamage);
        beam.setData('type', 'playerProjectile');
        beam.setData('hitEnemies', []); // 이미 맞은 적 추적

        // 검기 반짝임 효과
        this.scene.tweens.add({
            targets: beam,
            alpha: 0.4,
            duration: 100,
            yoyo: true,
            repeat: -1
        });

        // 일정 거리 이동 후 제거
        this.scene.time.delayedCall(beamDistance / beamSpeed * 1000, () => {
            if (beam && beam.active) {
                // 검기 소멸 이펙트
                const flash = this.scene.add.circle(beam.x, beam.y, 15, 0xFFFF00, 0.6);
                this.scene.tweens.add({
                    targets: flash,
                    alpha: 0,
                    scale: 2,
                    duration: 200,
                    onComplete: () => flash.destroy()
                });
                beam.destroy();
            }
        });

        // 적과 충돌 처리는 각 Stage Scene의 update에서 처리됨
        if (CONSTANTS.GAME.DEBUG) {
            console.log('검술: 검기 발사');
        }
    }

    // 공격 시작 시 짧은 무적 프레임 (0.15초)
    giveAttackInvincibility() {
        if (!this.owner) return;

        this.owner.isInvincible = true;
        this.owner.sprite.setAlpha(0.9);

        this.scene.time.delayedCall(150, () => {
            if (this.owner) {
                this.owner.isInvincible = false;
                this.owner.sprite.setAlpha(1);
            }
        });
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
