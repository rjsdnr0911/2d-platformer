// 콤보 시스템
class ComboSystem {
    constructor(scene) {
        this.scene = scene;
        this.comboCount = 0;
        this.comboMultiplier = 1.0;
        this.lastHitTime = 0;
        this.comboTimeout = 2000; // 2초 이내에 다시 공격해야 콤보 유지

        // UI
        this.comboText = null;
        this.createUI();
    }

    createUI() {
        // 콤보 텍스트는 표시하지 않음 (배율만 내부적으로 적용)
        this.comboText = null;
    }

    addHit() {
        const currentTime = this.scene.time.now;

        // 콤보 타임아웃 체크
        if (currentTime - this.lastHitTime > this.comboTimeout) {
            // 콤보 초기화
            this.comboCount = 0;
            this.comboMultiplier = 1.0;
        }

        this.comboCount++;
        this.lastHitTime = currentTime;

        // 콤보 배율 계산 (최대 3배)
        this.comboMultiplier = Math.min(1.0 + (this.comboCount - 1) * 0.1, 3.0);

        // UI 업데이트
        this.updateUI();

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`콤보: ${this.comboCount}, 배율: ${this.comboMultiplier.toFixed(1)}x`);
        }

        return this.comboMultiplier;
    }

    updateUI() {
        // UI 표시 없음 (콤보는 내부적으로만 작동)
    }

    reset() {
        this.comboCount = 0;
        this.comboMultiplier = 1.0;
        // UI 없음
    }

    update() {
        const currentTime = this.scene.time.now;

        // 콤보 타임아웃 체크
        if (this.comboCount > 0 && currentTime - this.lastHitTime > this.comboTimeout) {
            if (CONSTANTS.GAME.DEBUG) {
                console.log('콤보 종료:', this.comboCount, '히트');
            }
            this.reset();
        }
    }

    getMultiplier() {
        return this.comboMultiplier;
    }

    getComboCount() {
        return this.comboCount;
    }

    destroy() {
        // UI 없음
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.ComboSystem = ComboSystem;
}
