// 미니맵 시스템
class MinimapSystem {
    constructor(scene, worldWidth, worldHeight) {
        this.scene = scene;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // 미니맵 설정
        this.minimapWidth = 200;
        this.minimapHeight = 100;
        this.minimapX = CONSTANTS.GAME.WIDTH - this.minimapWidth - 16;
        this.minimapY = 100; // 위쪽으로 이동

        // 스케일 계산
        this.scaleX = this.minimapWidth / this.worldWidth;
        this.scaleY = this.minimapHeight / this.worldHeight;

        // UI 요소
        this.minimapContainer = null;
        this.minimapBg = null;
        this.minimapBorder = null;
        this.playerDot = null;
        this.bossDot = null;
        this.enemyDots = [];

        this.createUI();
    }

    createUI() {
        // 미니맵 배경 (반투명 검은색)
        this.minimapBg = this.scene.add.rectangle(
            this.minimapX,
            this.minimapY,
            this.minimapWidth,
            this.minimapHeight,
            0x000000,
            0.5
        );
        this.minimapBg.setOrigin(0, 0);
        this.minimapBg.setScrollFactor(0);
        this.minimapBg.setDepth(1900);

        // 미니맵 테두리
        this.minimapBorder = this.scene.add.rectangle(
            this.minimapX,
            this.minimapY,
            this.minimapWidth,
            this.minimapHeight,
            0xffffff,
            0
        );
        this.minimapBorder.setOrigin(0, 0);
        this.minimapBorder.setStrokeStyle(2, 0xffffff, 0.8);
        this.minimapBorder.setScrollFactor(0);
        this.minimapBorder.setDepth(1900);

        // 미니맵 라벨
        const minimapLabel = this.scene.add.text(
            this.minimapX + this.minimapWidth / 2,
            this.minimapY - 20,
            'MAP',
            {
                fontSize: '12px',
                fill: '#fff',
                fontStyle: 'bold',
                backgroundColor: '#000',
                padding: { x: 6, y: 2 }
            }
        );
        minimapLabel.setOrigin(0.5, 0);
        minimapLabel.setScrollFactor(0);
        minimapLabel.setDepth(1900);

        // 플레이어 점 (파란색)
        this.playerDot = this.scene.add.circle(
            this.minimapX,
            this.minimapY,
            3,
            0x00ffff,
            1
        );
        this.playerDot.setScrollFactor(0);
        this.playerDot.setDepth(1902);

        // 보스 점 (빨간색, 처음엔 숨김)
        this.bossDot = this.scene.add.circle(
            this.minimapX,
            this.minimapY,
            4,
            0xff0000,
            1
        );
        this.bossDot.setScrollFactor(0);
        this.bossDot.setDepth(1901);
        this.bossDot.setVisible(false);

        // 보스 점 펄스 애니메이션
        this.scene.tweens.add({
            targets: this.bossDot,
            scale: 1.3,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    worldToMinimap(worldX, worldY) {
        return {
            x: this.minimapX + (worldX * this.scaleX),
            y: this.minimapY + (worldY * this.scaleY)
        };
    }

    update(player, enemyList) {
        if (!player || !player.sprite) return;

        // 플레이어 위치 업데이트
        const playerPos = this.worldToMinimap(player.sprite.x, player.sprite.y);
        this.playerDot.setPosition(playerPos.x, playerPos.y);

        // 기존 적 점 제거
        this.enemyDots.forEach(dot => {
            if (dot) dot.destroy();
        });
        this.enemyDots = [];

        // 보스 위치 업데이트 및 일반 적 표시
        let bossFound = false;

        enemyList.forEach(enemy => {
            if (!enemy || !enemy.isAlive || !enemy.sprite) return;

            if (enemy.isBoss) {
                // 보스 위치 업데이트
                const bossPos = this.worldToMinimap(enemy.sprite.x, enemy.sprite.y);
                this.bossDot.setPosition(bossPos.x, bossPos.y);
                this.bossDot.setVisible(true);
                bossFound = true;
            } else {
                // 일반 적은 작은 주황색 점으로 표시
                const enemyPos = this.worldToMinimap(enemy.sprite.x, enemy.sprite.y);
                const enemyDot = this.scene.add.circle(
                    enemyPos.x,
                    enemyPos.y,
                    2,
                    0xff8800,
                    0.7
                );
                enemyDot.setScrollFactor(0);
                enemyDot.setDepth(1901);
                this.enemyDots.push(enemyDot);
            }
        });

        // 보스가 없으면 점 숨김
        if (!bossFound) {
            this.bossDot.setVisible(false);
        }
    }

    destroy() {
        if (this.minimapBg) this.minimapBg.destroy();
        if (this.minimapBorder) this.minimapBorder.destroy();
        if (this.playerDot) this.playerDot.destroy();
        if (this.bossDot) this.bossDot.destroy();

        this.enemyDots.forEach(dot => {
            if (dot) dot.destroy();
        });
        this.enemyDots = [];
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.MinimapSystem = MinimapSystem;
}
