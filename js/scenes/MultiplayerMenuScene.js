// ==================================================
// 멀티플레이어 메뉴 Scene
// ==================================================
// 서버 주소 입력 및 매칭 대기 화면
// ==================================================

class MultiplayerMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MultiplayerMenuScene' });
        this.socket = null;  // Socket.io 클라이언트
        this.isSearching = false;  // 매칭 검색 중 여부
        this.SERVER_URL = 'https://twod-platformer-1.onrender.com';  // 고정된 서버 주소
    }

    create() {
        try {
            // 배경색
            this.cameras.main.setBackgroundColor(CONSTANTS.COLORS.SKY);

            // 타이틀
            const title = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                80,
                '온라인 1대1 대전',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '48px',
                    fill: '#00FFFF',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 6
                }
            );
            title.setOrigin(0.5);

            // 설명 텍스트
            const description = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                150,
                '매칭을 시작하세요!',
                {
                    fontFamily: 'Jua',
                    fontSize: '18px',
                    fill: '#fff'
                }
            );
            description.setOrigin(0.5);

            // 매칭 찾기 버튼 (중앙에 크게)
            this.matchButton = this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                250,
                '매칭 시작',
                () => this.startMatchmaking(),
                0x44FF44  // 초록색
            );

            // 상태 표시 텍스트
            this.statusText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                330,
                '',
                {
                    fontFamily: 'Jua',
                    fontSize: '20px',
                    fill: '#ffff00',
                    backgroundColor: '#00000088',
                    padding: { x: 15, y: 10 }
                }
            );
            this.statusText.setOrigin(0.5);

            // 로딩 애니메이션 (처음엔 보이지 않음)
            this.loadingText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                400,
                '매칭 중.',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '24px',
                    fill: '#00FFFF'
                }
            );
            this.loadingText.setOrigin(0.5);
            this.loadingText.setVisible(false);

            // 돌아가기 버튼
            this.backButton = this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                480,
                '← 돌아가기',
                () => {
                    this.cleanup();
                    this.scene.start('MainMenuScene');
                },
                0x888888  // 회색
            );

            if (CONSTANTS.GAME.DEBUG) {
                console.log('[MultiplayerMenuScene] 생성 완료');
            }

        } catch (error) {
            console.error('[MultiplayerMenuScene] create 오류:', error);
        }
    }

    // ============================================
    // 매칭 시작
    // ============================================
    startMatchmaking() {
        if (this.isSearching) return;

        try {
            this.isSearching = true;

            // 버튼 비활성화
            this.matchButton.button.setFillStyle(0x666666);
            this.matchButton.buttonText.setText('매칭 중...');

            // 고정된 서버 주소 사용
            const serverURL = this.SERVER_URL;

            this.statusText.setText('서버 연결 중...');

            // Socket.io 연결
            this.socket = io(serverURL, {
                transports: ['websocket', 'polling'],  // 연결 방식
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000  // 10초 타임아웃
            });

            // ============================================
            // Socket.io 이벤트 리스너 설정
            // ============================================

            // 1. 연결 성공
            this.socket.on('connect', () => {
                console.log('[Socket] 서버 연결 성공:', this.socket.id);
                this.statusText.setText('✅ 서버 연결 완료! 상대방 찾는 중...');
                this.loadingText.setVisible(true);
                this.startLoadingAnimation();

                // 매칭 요청
                this.socket.emit('findMatch');
            });

            // 2. 연결 실패
            this.socket.on('connect_error', (error) => {
                console.error('[Socket] 연결 실패:', error);
                this.statusText.setText('❌ 서버 연결 실패! 주소를 확인하세요.');
                this.resetMatchButton();
            });

            // 3. 연결 끊김
            this.socket.on('disconnect', (reason) => {
                console.log('[Socket] 연결 끊김:', reason);
                this.statusText.setText('연결이 끊어졌습니다.');
                this.resetMatchButton();
            });

            // 4. 매칭 대기 중
            this.socket.on('waitingForMatch', () => {
                console.log('[Socket] 매칭 대기 중...');
                this.statusText.setText('⏳ 상대방을 찾는 중...');
            });

            // 5. 매칭 성공!
            this.socket.on('matchFound', (data) => {
                console.log('[Socket] 매칭 성공!', data);
                this.statusText.setText('✅ 매칭 완료! 게임 시작...');
                this.loadingText.setVisible(false);

                // 게임 Scene으로 이동 (1초 후)
                this.time.delayedCall(1000, () => {
                    // Socket 객체와 매칭 정보 전달
                    this.scene.start('OnlineGameScene', {
                        socket: this.socket,
                        roomId: data.roomId,
                        playerNumber: data.playerNumber,
                        opponentId: data.opponentId
                    });
                });
            });

        } catch (error) {
            console.error('[MultiplayerMenuScene] 매칭 시작 오류:', error);
            this.statusText.setText('오류 발생: ' + error.message);
            this.resetMatchButton();
        }
    }

    // ============================================
    // 로딩 애니메이션
    // ============================================
    startLoadingAnimation() {
        let dotCount = 1;
        this.loadingTimer = this.time.addEvent({
            delay: 500,
            callback: () => {
                dotCount = (dotCount % 3) + 1;
                this.loadingText.setText('매칭 중' + '.'.repeat(dotCount));
            },
            loop: true
        });
    }

    // ============================================
    // 매칭 버튼 리셋
    // ============================================
    resetMatchButton() {
        this.isSearching = false;
        this.matchButton.button.setFillStyle(0x44FF44);
        this.matchButton.buttonText.setText('매칭 시작');
        this.loadingText.setVisible(false);

        if (this.loadingTimer) {
            this.loadingTimer.remove();
        }
    }

    // ============================================
    // 버튼 생성 (MainMenuScene과 동일)
    // ============================================
    createButton(x, y, text, onClick, color = 0x4444ff) {
        const button = this.add.rectangle(x, y, 220, 50, color);
        button.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Jua',
            fontSize: '24px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // 호버 효과
        button.on('pointerover', () => {
            const lighterColor = Phaser.Display.Color.ValueToColor(color).lighten(20).color;
            button.setFillStyle(lighterColor);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setFillStyle(color);
            buttonText.setScale(1);
        });

        button.on('pointerup', () => {
            if (onClick) {
                onClick();
            }
        });

        return { button, buttonText };
    }

    // ============================================
    // 정리 (Scene 종료 시)
    // ============================================
    cleanup() {
        if (this.socket && this.socket.connected) {
            this.socket.disconnect();
        }

        if (this.loadingTimer) {
            this.loadingTimer.remove();
        }

        this.isSearching = false;
    }

    // Scene이 종료될 때 자동 호출
    shutdown() {
        this.cleanup();
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.MultiplayerMenuScene = MultiplayerMenuScene;
}
