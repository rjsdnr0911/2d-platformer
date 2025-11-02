// Base Boss 추상 클래스 - 모든 보스의 공통 기능
class BaseBoss extends Enemy {
    constructor(scene, x, y, bossConfig, enemyConfig) {
        // Enemy 클래스 초기화
        super(scene, x, y, enemyConfig);

        // 입력값 검증
        if (!bossConfig || !bossConfig.name || typeof bossConfig.color !== 'number') {
            console.error('BaseBoss: 잘못된 보스 설정');
            return;
        }

        // 보스 전용 속성
        this.isBoss = true;
        this.bossName = bossConfig.name;
        this.bossColor = bossConfig.color;
        this.maxHp = this.hp;
        this.phase = 1;

        // 보스 체력바 생성 (BossRushScene이 아닐 때만)
        if (scene.scene.key !== 'BossRushScene') {
            this.createHealthBar();
        }

        if (CONSTANTS.GAME.DEBUG) {
            console.log(`${this.bossName} 생성:`, this.maxHp, 'HP');
        }
    }

    // 보스 체력바 생성 (공통 로직)
    createHealthBar() {
        // 보스 이름 텍스트
        this.nameText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            50,
            this.bossName,
            {
                fontFamily: 'Orbitron',
                fontSize: '24px',
                fill: '#' + this.bossColor.toString(16).padStart(6, '0'),
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4
            }
        );
        this.nameText.setOrigin(0.5);
        this.nameText.setScrollFactor(0);
        this.nameText.setDepth(1000);

        // 체력바 배경
        this.healthBarBg = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            75,
            400,
            20,
            0x333333
        );
        this.healthBarBg.setScrollFactor(0);
        this.healthBarBg.setDepth(1000);

        // 체력바
        this.healthBarFill = this.scene.add.rectangle(
            CONSTANTS.GAME.WIDTH / 2,
            75,
            400,
            20,
            this.bossColor
        );
        this.healthBarFill.setScrollFactor(0);
        this.healthBarFill.setDepth(1001);

        // 체력 텍스트
        this.healthText = this.scene.add.text(
            CONSTANTS.GAME.WIDTH / 2,
            75,
            `${this.hp}/${this.maxHp}`,
            {
                fontFamily: 'Orbitron',
                fontSize: '14px',
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        this.healthText.setOrigin(0.5);
        this.healthText.setScrollFactor(0);
        this.healthText.setDepth(1002);
    }

    // 보스 체력바 업데이트 (공통 로직)
    updateHealthBar() {
        if (!this.healthBarFill || !this.healthText) return;

        const hpRatio = this.hp / this.maxHp;

        // 체력바 스케일 조정 (왼쪽 정렬)
        this.healthBarFill.setScale(hpRatio, 1);
        this.healthBarFill.x = (CONSTANTS.GAME.WIDTH / 2) - (200 * (1 - hpRatio));

        // 체력에 따라 색상 변경
        if (hpRatio > 0.5) {
            this.healthBarFill.setFillStyle(this.bossColor);
        } else if (hpRatio > 0.25) {
            this.healthBarFill.setFillStyle(0xffaa00); // 주황색
        } else {
            this.healthBarFill.setFillStyle(0xff0000); // 빨강색
        }

        // 체력 텍스트 업데이트
        this.healthText.setText(`${this.hp}/${this.maxHp}`);
    }

    // 피격 시 체력바 업데이트
    takeDamage(damage) {
        super.takeDamage(damage);
        this.updateHealthBar();
    }

    // 맵 경계 강제 체크 (보스 전용 - 돌진 등 강제 이동 중에도 적용)
    enforceMapBounds() {
        if (!this.sprite || !this.sprite.body) return;

        const margin = 50;
        let bounded = false;

        // X축 경계 체크
        if (this.sprite.x < margin) {
            this.sprite.x = margin;
            this.sprite.body.setVelocityX(0);
            bounded = true;
        } else if (this.sprite.x > CONSTANTS.WORLD.WIDTH - margin) {
            this.sprite.x = CONSTANTS.WORLD.WIDTH - margin;
            this.sprite.body.setVelocityX(0);
            bounded = true;
        }

        // Y축 경계 체크 (보스가 맵 아래로 떨어지는 것 방지)
        if (this.sprite.y > CONSTANTS.WORLD.HEIGHT - margin) {
            this.sprite.y = CONSTANTS.WORLD.HEIGHT - margin;
            this.sprite.body.setVelocityY(0);
            bounded = true;
        }

        // 경계에 부딪힌 경우 디버그 로그
        if (bounded && CONSTANTS.GAME.DEBUG) {
            console.log(`${this.bossName} 맵 경계 강제 제한:`, this.sprite.x, this.sprite.y);
        }
    }

    // 업데이트 (매 프레임 경계 체크)
    update() {
        if (!this.sprite || !this.sprite.active) return;
        if (!this.isAlive) return;

        // 매 프레임 맵 경계 강제 체크 (돌진 등 스킬 중에도 적용)
        this.enforceMapBounds();

        // 부모 클래스의 update 호출 (AI 업데이트)
        try {
            this.updateAI();
        } catch (error) {
            console.error(`${this.bossName} update 오류:`, error);
        }
    }

    // 보스 파괴 시 UI 정리 (공통 로직)
    destroy() {
        // 체력바 UI 제거
        if (this.nameText) this.nameText.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        if (this.healthText) this.healthText.destroy();

        // 부모 클래스 destroy 호출
        super.destroy();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.BaseBoss = BaseBoss;
}
