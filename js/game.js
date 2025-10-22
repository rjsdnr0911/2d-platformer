(function() {
    'use strict';

    // 게임 설정 (멀티 Scene 구조)
    const config = {
        type: Phaser.AUTO,
        width: CONSTANTS.GAME.WIDTH,
        height: CONSTANTS.GAME.HEIGHT,
        parent: 'game-container',
        backgroundColor: CONSTANTS.COLORS.SKY,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: CONSTANTS.GAME.GRAVITY },
                debug: CONSTANTS.GAME.DEBUG
            }
        },
        scene: [MainMenuScene, GameScene, GameOverScene]  // Scene 순서: 메뉴 → 게임 → 게임오버
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
