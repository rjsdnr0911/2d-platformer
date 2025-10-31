// 원형 쿨타임 UI 시스템
class CircularCooldownUI {
    constructor(scene) {
        this.scene = scene;

        // UI 컨테이너
        this.container = null;

        // 원형 게이지 그래픽스
        this.basicGraphics = null;
        this.strongGraphics = null;
        this.skillGraphics = null;

        // 라벨 텍스트
        this.basicLabel = null;
        this.strongLabel = null;
        this.skillLabel = null;

        // 쿨타임 진행 표시 텍스트 (초 단위)
        this.basicTimeText = null;
        this.strongTimeText = null;
        this.skillTimeText = null;

        // UI 위치 (화면 하단 중앙)
        this.baseX = CONSTANTS.GAME.WIDTH / 2;
        this.baseY = CONSTANTS.GAME.HEIGHT - 80;

        // 원 설정
        this.radius = 24;
        this.lineWidth = 4;

        this.createUI();
    }

    createUI() {
        // Graphics 객체 생성 (3개)
        this.basicGraphics = this.scene.add.graphics();
        this.basicGraphics.setScrollFactor(0);
        this.basicGraphics.setDepth(100);

        this.strongGraphics = this.scene.add.graphics();
        this.strongGraphics.setScrollFactor(0);
        this.strongGraphics.setDepth(100);

        this.skillGraphics = this.scene.add.graphics();
        this.skillGraphics.setScrollFactor(0);
        this.skillGraphics.setDepth(100);

        // 라벨 텍스트 (Z, X, C 키 표시)
        const labelStyle = {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        };

        this.basicLabel = this.scene.add.text(
            this.baseX - 80,
            this.baseY,
            'Z',
            labelStyle
        );
        this.basicLabel.setOrigin(0.5);
        this.basicLabel.setScrollFactor(0);
        this.basicLabel.setDepth(101);

        this.strongLabel = this.scene.add.text(
            this.baseX,
            this.baseY,
            'X',
            labelStyle
        );
        this.strongLabel.setOrigin(0.5);
        this.strongLabel.setScrollFactor(0);
        this.strongLabel.setDepth(101);

        this.skillLabel = this.scene.add.text(
            this.baseX + 80,
            this.baseY,
            'C',
            labelStyle
        );
        this.skillLabel.setOrigin(0.5);
        this.skillLabel.setScrollFactor(0);
        this.skillLabel.setDepth(101);

        // 쿨타임 시간 표시 텍스트 (작은 글씨)
        const timeStyle = {
            fontSize: '12px',
            fill: '#ffff00',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        };

        this.basicTimeText = this.scene.add.text(
            this.baseX - 80,
            this.baseY + 30,
            '',
            timeStyle
        );
        this.basicTimeText.setOrigin(0.5);
        this.basicTimeText.setScrollFactor(0);
        this.basicTimeText.setDepth(101);

        this.strongTimeText = this.scene.add.text(
            this.baseX,
            this.baseY + 30,
            '',
            timeStyle
        );
        this.strongTimeText.setOrigin(0.5);
        this.strongTimeText.setScrollFactor(0);
        this.strongTimeText.setDepth(101);

        this.skillTimeText = this.scene.add.text(
            this.baseX + 80,
            this.baseY + 30,
            '',
            timeStyle
        );
        this.skillTimeText.setOrigin(0.5);
        this.skillTimeText.setScrollFactor(0);
        this.skillTimeText.setDepth(101);
    }

    // 원형 게이지 그리기 (시계방향으로 채워짐)
    drawCircularGauge(graphics, x, y, progress) {
        graphics.clear();

        // 배경 원 (회색)
        graphics.lineStyle(this.lineWidth, 0x444444, 0.5);
        graphics.strokeCircle(x, y, this.radius);

        // 진행 원 (시계방향, 12시 방향부터 시작)
        if (progress > 0) {
            const startAngle = -Math.PI / 2; // 12시 (위)
            const endAngle = startAngle + (Math.PI * 2 * progress); // 시계방향

            // 쿨타임 중: 빨간색 게이지
            graphics.lineStyle(this.lineWidth, 0xff0000, 1);
            graphics.beginPath();
            graphics.arc(x, y, this.radius, startAngle, endAngle, false);
            graphics.strokePath();
        } else {
            // 사용 가능: 초록색 원
            graphics.lineStyle(this.lineWidth, 0x00ff00, 1);
            graphics.strokeCircle(x, y, this.radius);
        }
    }

    // 쿨타임 진행도 계산 (0.0 ~ 1.0)
    getCooldownProgress(lastUseTime, cooldown) {
        if (cooldown === 0) return 0; // 쿨타임이 없으면 항상 사용 가능

        const currentTime = this.scene.time.now;
        const elapsed = currentTime - lastUseTime;
        const remaining = Math.max(0, cooldown - elapsed);

        return remaining / cooldown; // 1.0 (쿨타임 시작) → 0.0 (쿨타임 끝)
    }

    // 남은 쿨타임 시간 (초 단위 소수점 1자리)
    getRemainingCooldownTime(lastUseTime, cooldown) {
        if (cooldown === 0) return 0;

        const currentTime = this.scene.time.now;
        const elapsed = currentTime - lastUseTime;
        const remaining = Math.max(0, cooldown - elapsed);

        return (remaining / 1000).toFixed(1); // 밀리초 → 초
    }

    update() {
        // 플레이어가 없으면 업데이트 안 함
        if (!window.player) return;

        const ability = window.player.getCurrentAbility();
        if (!ability) return;

        // 쿨타임 적용 (패시브 아이템 쿨다운 감소 적용)
        const cooldownReduction = window.player.cooldownReduction || 0;

        const basicCooldown = ability.config.BASIC_COOLDOWN * (1 - cooldownReduction);
        const strongCooldown = ability.config.STRONG_COOLDOWN * (1 - cooldownReduction);
        const skillCooldown = ability.config.SKILL_COOLDOWN * (1 - cooldownReduction);

        // 진행도 계산
        const basicProgress = this.getCooldownProgress(ability.lastBasicAttackTime, basicCooldown);
        const strongProgress = this.getCooldownProgress(ability.lastStrongAttackTime, strongCooldown);
        const skillProgress = this.getCooldownProgress(ability.lastSkillTime, skillCooldown);

        // 원형 게이지 그리기
        this.drawCircularGauge(this.basicGraphics, this.baseX - 80, this.baseY, basicProgress);
        this.drawCircularGauge(this.strongGraphics, this.baseX, this.baseY, strongProgress);
        this.drawCircularGauge(this.skillGraphics, this.baseX + 80, this.baseY, skillProgress);

        // 남은 시간 표시 (쿨타임 중일 때만)
        if (basicProgress > 0) {
            this.basicTimeText.setText(this.getRemainingCooldownTime(ability.lastBasicAttackTime, basicCooldown) + 's');
        } else {
            this.basicTimeText.setText('');
        }

        if (strongProgress > 0) {
            this.strongTimeText.setText(this.getRemainingCooldownTime(ability.lastStrongAttackTime, strongCooldown) + 's');
        } else {
            this.strongTimeText.setText('');
        }

        if (skillProgress > 0) {
            this.skillTimeText.setText(this.getRemainingCooldownTime(ability.lastSkillTime, skillCooldown) + 's');
        } else {
            this.skillTimeText.setText('');
        }
    }

    destroy() {
        if (this.basicGraphics) this.basicGraphics.destroy();
        if (this.strongGraphics) this.strongGraphics.destroy();
        if (this.skillGraphics) this.skillGraphics.destroy();
        if (this.basicLabel) this.basicLabel.destroy();
        if (this.strongLabel) this.strongLabel.destroy();
        if (this.skillLabel) this.skillLabel.destroy();
        if (this.basicTimeText) this.basicTimeText.destroy();
        if (this.strongTimeText) this.strongTimeText.destroy();
        if (this.skillTimeText) this.skillTimeText.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.CircularCooldownUI = CircularCooldownUI;
}
