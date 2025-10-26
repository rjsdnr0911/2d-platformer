(function() {
    'use strict';

    // 게임 설정 (멀티 Scene 구조)
    const config = {
        type: Phaser.AUTO,
        width: CONSTANTS.GAME.WIDTH,
        height: CONSTANTS.GAME.HEIGHT,
        parent: 'game-container',
        backgroundColor: CONSTANTS.COLORS.SKY,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: CONSTANTS.GAME.WIDTH,
            height: CONSTANTS.GAME.HEIGHT
        },
        input: {
            activePointers: 10  // 멀티터치 지원 (최대 10개 동시 터치)
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: CONSTANTS.GAME.GRAVITY },
                debug: CONSTANTS.GAME.DEBUG
            }
        },
        scene: [
            MainMenuScene,
            StageSelectScene,
            ClassSelectScene,
            Stage1Scene,
            Stage2Scene,
            Stage3Scene,
            Stage4Scene,
            StageClearScene,
            PauseScene,
            GameScene,
            GameOverScene
        ]  // Scene 순서: 메뉴 → 스테이지 선택 → 직업 선택 → Stage1~4 → 클리어 → 일시정지 → 게임오버
    };

    // 게임 인스턴스 생성
    const game = new Phaser.Game(config);

    // 전역 에러 핸들러
    window.onerror = function(msg, url, lineNo, columnNo, error) {
        if (CONSTANTS.GAME.DEBUG) {
            console.error('전역 에러:', {
                message: msg,
                url: url,
                line: lineNo,
                column: columnNo,
                error: error
            });
        }
        return false;
    };

    if (CONSTANTS.GAME.DEBUG) {
        console.log('게임 초기화 완료 (멀티 Scene 모드)');
        console.log('Scene 목록:', config.scene.map(s => s.name));
    }

})();
