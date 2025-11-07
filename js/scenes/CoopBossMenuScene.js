// ==================================================
// 협동 보스 레이드 메뉴 Scene
// ==================================================
// 협동 보스 레이드 매칭 대기 화면
// ==================================================

class CoopBossMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CoopBossMenuScene' });
        this.socket = null;  // Socket.io 클라이언트
        this.isSearching = false;  // 매칭 검색 중 여부
        this.SERVER_URL = 'https://twod-platformer-1.onrender.com';  // Render 서버 주소
    }

    create() {
        try {
            // 배경색
            this.cameras.main.setBackgroundColor(CONSTANTS.COLORS.SKY);

            // 타이틀
            const title = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                60,
                '🤝 협동 보스 레이드',
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
                130,
                '2명이 협력하여 강력한 보스를 처치하세요!',
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
                200,
                '매칭 시작',
                () => this.startMatchmaking(),
                0x44FF44  // 초록색
            );

            // 회전하는 로딩 아이콘 (처음엔 보이지 않음)
            this.loadingIcon = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                280,
                '⟳',
                {
                    fontFamily: 'Arial',
                    fontSize: '48px',
                    fill: '#00FFFF'
                }
            );
            this.loadingIcon.setOrigin(0.5);
            this.loadingIcon.setVisible(false);

            // 상태 표시 텍스트 (로딩 아이콘 아래)
            this.statusText = this.add.text(
                CONSTANTS.GAME.WIDTH / 2,
                350,
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

            // 게임 팁 표시 (깔끔한 박스 안에)
            this.tipContainer = this.add.container(CONSTANTS.GAME.WIDTH / 2, 430);

            const tipBg = this.add.rectangle(0, 0, 700, 80, 0x1a1a2e, 0.8);
            tipBg.setStrokeStyle(2, 0x00FFFF);

            this.tipText = this.add.text(0, 0, '', {
                fontFamily: 'Jua',
                fontSize: '16px',
                fill: '#ffffff',
                align: 'center',
                wordWrap: { width: 660 }
            });
            this.tipText.setOrigin(0.5);

            this.tipContainer.add([tipBg, this.tipText]);
            this.tipContainer.setVisible(false);

            // 취소 버튼 (매칭 중에만 표시, 강조된 빨간색)
            this.cancelButton = this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                530,
                '✕ 매칭 취소',
                () => this.cancelMatchmaking(),
                0xFF4444  // 빨간색
            );
            this.cancelButton.button.setVisible(false);
            this.cancelButton.buttonText.setVisible(false);

            // 돌아가기 버튼
            this.backButton = this.createButton(
                CONSTANTS.GAME.WIDTH / 2,
                530,
                '← 돌아가기',
                () => {
                    this.cleanup();
                    this.scene.start('MainMenuScene');
                },
                0x888888  // 회색
            );

            // 게임 팁 데이터
            this.gameTips = [
                '💡 Q/E 키로 능력을 교체하면 특별한 효과가 발동됩니다!',
                '💡 보스의 패턴을 파악하고 협력하면 승리 확률이 높아집니다!',
                '💡 F키로 쓰러진 동료를 부활시킬 수 있습니다! (HP 30 소모)',
                '💡 대시(Shift)를 활용하여 보스의 공격을 회피하세요!',
                '💡 각 직업마다 고유한 특수 스킬(C키)이 있습니다!'
            ];
            this.currentTipIndex = 0;

            if (CONSTANTS.GAME.DEBUG) {
                console.log('[CoopBossMenuScene] 생성 완료');
            }

        } catch (error) {
            console.error('[CoopBossMenuScene] create 오류:', error);
        }
    }

    // ============================================
    // 매칭 시작
    // ============================================
    startMatchmaking() {
        if (this.isSearching) return;

        try {
            this.isSearching = true;

            // UI 전환: 매칭 시작 버튼 숨기기, 취소 버튼 보이기
            this.matchButton.button.setVisible(false);
            this.matchButton.buttonText.setVisible(false);
            this.backButton.button.setVisible(false);
            this.backButton.buttonText.setVisible(false);
            this.cancelButton.button.setVisible(true);
            this.cancelButton.buttonText.setVisible(true);

            // 로딩 아이콘 표시 및 회전 애니메이션
            this.loadingIcon.setVisible(true);
            this.tweens.add({
                targets: this.loadingIcon,
                angle: 360,
                duration: 1000,
                repeat: -1,
                ease: 'Linear'
            });

            // 팁 표시 시작
            this.tipContainer.setVisible(true);
            this.showNextTip();
            this.tipRotationTimer = this.time.addEvent({
                delay: 4000,
                callback: () => this.showNextTip(),
                loop: true
            });

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
                this.statusText.setText('✅ 서버 연결 완료! 파트너 찾는 중...');

                // 협동 매칭 요청
                this.socket.emit('findCoopMatch');
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
                console.log('[Socket] 협동 매칭 대기 중...');
                this.statusText.setText('⏳ 파트너를 찾는 중...');
            });

            // 5. 매칭 성공!
            this.socket.on('coopMatchFound', (data) => {
                console.log('[Socket] 협동 매칭 성공!', data);
                this.statusText.setText('✅ 매칭 완료! 보스 레이드 시작...');

                // UI 정리
                this.loadingIcon.setVisible(false);
                this.tipContainer.setVisible(false);
                this.cancelButton.button.setVisible(false);
                this.cancelButton.buttonText.setVisible(false);

                // 협동 보스 레이드 Scene으로 이동 (1초 후)
                this.time.delayedCall(1000, () => {
                    // Socket 객체와 매칭 정보 전달
                    this.scene.start('CoopBossRaidScene', {
                        socket: this.socket,
                        roomId: data.roomId,
                        playerNumber: data.playerNumber,
                        opponentId: data.opponentId
                    });
                });
            });

        } catch (error) {
            console.error('[CoopBossMenuScene] 매칭 시작 오류:', error);
            this.statusText.setText('오류 발생: ' + error.message);
            this.resetMatchButton();
        }
    }

    // ============================================
    // 팁 로테이션
    // ============================================
    showNextTip() {
        if (!this.gameTips || this.gameTips.length === 0) return;

        const tip = this.gameTips[this.currentTipIndex];
        this.tipText.setText(tip);

        // 페이드 인 효과
        this.tipText.setAlpha(0);
        this.tweens.add({
            targets: this.tipText,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        this.currentTipIndex = (this.currentTipIndex + 1) % this.gameTips.length;
    }

    // ============================================
    // 매칭 취소
    // ============================================
    cancelMatchmaking() {
        console.log('[취소] 매칭 취소 요청');

        // 소켓 정리
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        // UI 리셋
        this.resetMatchButton();
    }

    // ============================================
    // 매칭 버튼 리셋
    // ============================================
    resetMatchButton() {
        this.isSearching = false;

        // 버튼 전환
        this.matchButton.button.setVisible(true);
        this.matchButton.buttonText.setVisible(true);
        this.backButton.button.setVisible(true);
        this.backButton.buttonText.setVisible(true);
        this.cancelButton.button.setVisible(false);
        this.cancelButton.buttonText.setVisible(false);

        // 로딩 아이콘 및 팁 숨기기
        this.loadingIcon.setVisible(false);
        this.tipContainer.setVisible(false);

        // 팁 타이머 정리
        if (this.tipRotationTimer) {
            this.tipRotationTimer.remove();
            this.tipRotationTimer = null;
        }

        // 상태 텍스트 초기화
        this.statusText.setText('');
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
        // Socket 이벤트 리스너 제거
        if (this.socket) {
            this.socket.off('connect');
            this.socket.off('connect_error');
            this.socket.off('disconnect');
            this.socket.off('waitingForMatch');
            this.socket.off('coopMatchFound');

            if (this.socket.connected) {
                this.socket.disconnect();
            }
            this.socket = null;
        }

        // 팁 타이머 정리
        if (this.tipRotationTimer) {
            this.tipRotationTimer.remove();
            this.tipRotationTimer = null;
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
    window.CoopBossMenuScene = CoopBossMenuScene;
}
