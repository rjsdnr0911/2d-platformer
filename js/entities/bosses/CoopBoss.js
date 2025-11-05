// ==================================================
// 협동 보스 레이드 전용 보스 클래스
// ==================================================
// BaseBoss를 상속받아 협동 모드에 최적화된 보스
// 3단계 페이즈 시스템, 800 HP, 협동 전용 공격 패턴
// ==================================================

class CoopBoss extends BaseBoss {
    constructor(scene, x, y) {
        // 보스 설정
        const bossConfig = {
            name: '협동 보스',
            color: 0xFF0000  // 빨간색
        };

        // Enemy 설정 (HP 2배, 높은 공격력)
        const enemyConfig = {
            WIDTH: 80,
            HEIGHT: 80,
            COLOR: 0xFF0000,
            HP: 800,  // 2배 체력
            DAMAGE: 30,  // 높은 데미지
            SPEED: 100
        };

        // BaseBoss 초기화 (HP바 자동 생성)
        super(scene, x, y, bossConfig, enemyConfig);

        // 협동 보스 전용 속성
        this.phase = 1;  // 현재 페이즈 (1, 2, 3)
        this.attackCooldown = 2000;  // 2초 쿨타임
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.currentAttackType = null;

        // 공격 패턴 카운터
        this.attackCount = 0;

        // 타겟 플레이어 (AI용)
        this.targetPlayer = null;

        if (CONSTANTS.GAME.DEBUG) {
            console.log('[CoopBoss] 생성 완료 - HP:', this.maxHp);
        }
    }

    // ============================================
    // 페이즈 체크 및 전환
    // ============================================
    checkPhase() {
        const hpRatio = this.hp / this.maxHp;
        const oldPhase = this.phase;

        if (hpRatio <= 0.3 && this.phase < 3) {
            this.phase = 3;
            this.attackCooldown = 1000;  // 1초로 단축
            this.showPhaseTransition(3);
        } else if (hpRatio <= 0.6 && this.phase < 2) {
            this.phase = 2;
            this.attackCooldown = 1500;  // 1.5초로 단축
            this.showPhaseTransition(2);
        }

        if (oldPhase !== this.phase && CONSTANTS.GAME.DEBUG) {
            console.log(`[CoopBoss] 페이즈 전환: ${oldPhase} → ${this.phase}`);
        }
    }

    // ============================================
    // 페이즈 전환 이펙트
    // ============================================
    showPhaseTransition(phase) {
        // 보스 스프라이트 주위에 원형 폭발 이펙트
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 60;

            const particle = this.scene.add.circle(
                this.sprite.x + Math.cos(angle) * distance,
                this.sprite.y + Math.sin(angle) * distance,
                8,
                0xFF0000,
                0.8
            );

            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 2,
                duration: 800,
                onComplete: () => particle.destroy()
            });
        }

        // 보스 색상 변경 (페이즈별)
        const phaseColors = [0xFF0000, 0xFF8800, 0xFF0000];  // 빨강 → 주황 → 빨강(더 강렬)
        this.sprite.setFillStyle(phaseColors[phase - 1]);

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`[CoopBoss] Phase ${phase} 전환 이펙트 표시`);
        }
    }

    // ============================================
    // 가장 가까운 플레이어 찾기
    // ============================================
    getClosestPlayer(player1, player2) {
        if (!player1 || !player1.isAlive) return player2;
        if (!player2 || !player2.isAlive) return player1;

        const dist1 = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player1.sprite.x, player1.sprite.y
        );

        const dist2 = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player2.sprite.x, player2.sprite.y
        );

        return dist1 < dist2 ? player1 : player2;
    }

    // ============================================
    // 타겟을 향해 이동
    // ============================================
    moveTowards(target) {
        if (!target || !target.sprite) return;

        const dx = target.sprite.x - this.sprite.x;
        const dy = target.sprite.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            // 정규화된 방향 벡터
            const dirX = dx / distance;
            const dirY = dy / distance;

            this.sprite.body.setVelocityX(dirX * this.speed);
            this.sprite.body.setVelocityY(dirY * this.speed);

            // 방향 전환
            this.direction = dirX > 0 ? 1 : -1;
        }
    }

    // ============================================
    // 공격 수행
    // ============================================
    performAttack() {
        if (this.scene.time.now - this.lastAttackTime < this.attackCooldown) return;
        if (this.isAttacking) return;

        this.lastAttackTime = this.scene.time.now;
        this.isAttacking = true;
        this.attackCount++;

        // 페이즈별 공격 패턴 선택
        if (this.phase === 1) {
            // Phase 1: 기본 돌진
            this.dashAttack();
        } else if (this.phase === 2) {
            // Phase 2: 돌진 + 점프 공격 랜덤
            if (Math.random() > 0.5) {
                this.dashAttack();
            } else {
                this.jumpAttack();
            }
        } else if (this.phase === 3) {
            // Phase 3: 3연속 돌진 또는 광역 공격
            if (this.attackCount % 3 === 0) {
                this.areaAttack();
            } else {
                this.dashAttack();
            }
        }
    }

    // ============================================
    // 공격 패턴 1: 돌진 공격
    // ============================================
    dashAttack() {
        this.currentAttackType = 'dash';

        if (!this.targetPlayer || !this.targetPlayer.sprite) {
            this.isAttacking = false;
            return;
        }

        // 타겟 방향으로 빠르게 돌진
        const dx = this.targetPlayer.sprite.x - this.sprite.x;
        const dy = this.targetPlayer.sprite.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;

            const dashSpeed = 400;  // 빠른 속도
            this.sprite.body.setVelocity(dirX * dashSpeed, dirY * dashSpeed);
        }

        // 0.5초 후 돌진 종료
        this.scene.time.delayedCall(500, () => {
            this.sprite.body.setVelocity(0, 0);
            this.isAttacking = false;
            this.currentAttackType = null;
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('[CoopBoss] 돌진 공격!');
        }
    }

    // ============================================
    // 공격 패턴 2: 점프 공격
    // ============================================
    jumpAttack() {
        this.currentAttackType = 'jump';

        if (!this.targetPlayer || !this.targetPlayer.sprite) {
            this.isAttacking = false;
            return;
        }

        // 위로 점프
        this.sprite.body.setVelocityY(-300);

        // 0.3초 후 타겟 위치로 낙하
        this.scene.time.delayedCall(300, () => {
            if (!this.targetPlayer || !this.targetPlayer.sprite) {
                this.isAttacking = false;
                return;
            }

            const dx = this.targetPlayer.sprite.x - this.sprite.x;
            this.sprite.body.setVelocityX(dx * 0.5);
            this.sprite.body.setVelocityY(400);  // 빠른 낙하
        });

        // 1초 후 공격 종료
        this.scene.time.delayedCall(1000, () => {
            this.isAttacking = false;
            this.currentAttackType = null;
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('[CoopBoss] 점프 공격!');
        }
    }

    // ============================================
    // 공격 패턴 3: 광역 공격 (Phase 3 전용)
    // ============================================
    areaAttack() {
        this.currentAttackType = 'area';

        // 보스 주위에 충격파 생성
        const shockwaveRadius = 150;

        // 충격파 이펙트
        const shockwave = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            shockwaveRadius,
            0xFF0000,
            0.3
        );

        this.scene.tweens.add({
            targets: shockwave,
            scale: 1.5,
            alpha: 0,
            duration: 600,
            onComplete: () => shockwave.destroy()
        });

        // 0.5초 후 공격 종료
        this.scene.time.delayedCall(500, () => {
            this.isAttacking = false;
            this.currentAttackType = null;
        });

        if (CONSTANTS.GAME.DEBUG) {
            console.log('[CoopBoss] 광역 공격!');
        }
    }

    // ============================================
    // AI 업데이트 (Host만 실행)
    // ============================================
    updateAI(player1, player2) {
        if (!this.isAlive) return;

        // 페이즈 체크
        this.checkPhase();

        // 타겟 선택 (가장 가까운 플레이어)
        this.targetPlayer = this.getClosestPlayer(player1, player2);

        if (!this.targetPlayer || !this.targetPlayer.isAlive) return;

        // 거리 체크
        const distance = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            this.targetPlayer.sprite.x, this.targetPlayer.sprite.y
        );

        // 공격 중이 아니면 이동 또는 공격
        if (!this.isAttacking) {
            if (distance > 200) {
                // 멀면 접근
                this.moveTowards(this.targetPlayer);
            } else {
                // 가까우면 공격
                this.performAttack();
            }
        }
    }

    // ============================================
    // 업데이트 (매 프레임)
    // ============================================
    update(player1, player2) {
        if (!this.sprite || !this.sprite.active) return;
        if (!this.isAlive) return;

        // 맵 경계 강제 체크
        this.enforceMapBounds();

        // AI 업데이트 (Host만 호출)
        this.updateAI(player1, player2);
    }

    // ============================================
    // 피격 (오버라이드)
    // ============================================
    takeDamage(damage) {
        super.takeDamage(damage);

        // 페이즈 체크 (HP 변화 시)
        this.checkPhase();
    }

    // ============================================
    // 파괴 (오버라이드)
    // ============================================
    destroy() {
        // BaseBoss의 destroy 호출 (HP바 UI 자동 제거)
        super.destroy();

        if (CONSTANTS.GAME.DEBUG) {
            console.log('[CoopBoss] 파괴됨');
        }
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.CoopBoss = CoopBoss;
}
