// ==================================================
// 2D 플랫포머 온라인 멀티플레이어 서버
// ==================================================
// 이 서버는 2명의 플레이어를 매칭하고,
// 게임 상태(위치, 점프, 공격 등)를 실시간으로 전달합니다.
// ==================================================

// 1. 필요한 라이브러리 불러오기
const express = require('express');        // 웹 서버 생성 도구
const http = require('http');              // HTTP 서버
const socketIO = require('socket.io');     // 실시간 통신 라이브러리
const cors = require('cors');              // 다른 주소에서도 접속 가능하게

// 2. Express 앱 생성
const app = express();
app.use(cors());  // CORS 활성화 (중요!)
app.use(express.json());  // JSON 데이터 처리

// 3. HTTP 서버 생성
const server = http.createServer(app);

// 4. Socket.io 설정
const io = socketIO(server, {
    cors: {
        origin: "*",  // 모든 주소 허용 (개발용, 배포 시 변경 추천)
        methods: ["GET", "POST"]
    },
    // 연결 옵션
    pingTimeout: 60000,    // 60초 타임아웃
    pingInterval: 25000    // 25초마다 연결 확인
});

// ==================================================
// 5. 게임 방(Room) 관리 시스템
// ==================================================
const waitingPlayers = [];  // 매칭 대기 중인 플레이어 목록
const rooms = new Map();    // 게임 방 저장소 (roomId => room 정보)

// 방 생성 함수
function createRoom(player1, player2) {
    const roomId = `room_${Date.now()}`;  // 고유한 방 ID 생성

    const room = {
        id: roomId,
        players: {
            player1: {
                id: player1.id,
                socket: player1,
                ready: false,
                // 플레이어 초기 상태
                x: 100,
                y: 300,
                velocityX: 0,
                velocityY: 0,
                animation: 'idle',
                facingRight: true,
                isAlive: true
            },
            player2: {
                id: player2.id,
                socket: player2,
                ready: false,
                // 플레이어 2는 오른쪽에서 시작
                x: 700,
                y: 300,
                velocityX: 0,
                velocityY: 0,
                animation: 'idle',
                facingRight: false,
                isAlive: true
            }
        },
        createdAt: Date.now(),
        gameStarted: false
    };

    rooms.set(roomId, room);

    // 두 플레이어를 방에 입장시킴
    player1.join(roomId);
    player2.join(roomId);

    // 두 플레이어에게 매칭 성공 알림
    player1.emit('matchFound', {
        roomId,
        playerNumber: 1,
        opponentId: player2.id
    });

    player2.emit('matchFound', {
        roomId,
        playerNumber: 2,
        opponentId: player1.id
    });

    console.log(`[방 생성] ${roomId} - Player1: ${player1.id}, Player2: ${player2.id}`);

    return room;
}

// ==================================================
// 6. Socket.io 이벤트 처리
// ==================================================
io.on('connection', (socket) => {
    console.log(`[연결] 새 플레이어 접속: ${socket.id}`);

    // ============================================
    // 6-1. 매칭 요청 처리
    // ============================================
    socket.on('findMatch', () => {
        console.log(`[매칭 요청] ${socket.id}`);

        // 이미 대기 중인 플레이어가 있으면 매칭
        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();  // 대기자 꺼내기

            // 방 생성 및 게임 시작
            createRoom(opponent, socket);

        } else {
            // 대기자가 없으면 대기 목록에 추가
            waitingPlayers.push(socket);
            socket.emit('waitingForMatch');
            console.log(`[대기 중] ${socket.id} - 현재 대기자: ${waitingPlayers.length}명`);
        }
    });

    // ============================================
    // 6-2. 플레이어 이동 동기화
    // ============================================
    socket.on('playerMove', (data) => {
        // data = { roomId, x, y, velocityX, velocityY, facingRight }

        const room = rooms.get(data.roomId);
        if (!room) return;

        // 상대방에게만 전달 (자기 자신 제외)
        socket.to(data.roomId).emit('opponentMove', {
            playerId: socket.id,
            x: data.x,
            y: data.y,
            velocityX: data.velocityX,
            velocityY: data.velocityY,
            facingRight: data.facingRight
        });
    });

    // ============================================
    // 6-3. 점프 동기화
    // ============================================
    socket.on('playerJump', (data) => {
        // data = { roomId }
        socket.to(data.roomId).emit('opponentJump', {
            playerId: socket.id
        });
    });

    // ============================================
    // 6-4. 대시 동기화
    // ============================================
    socket.on('playerDash', (data) => {
        // data = { roomId, direction }
        socket.to(data.roomId).emit('opponentDash', {
            playerId: socket.id,
            direction: data.direction
        });
    });

    // ============================================
    // 6-5. 공격 동기화
    // ============================================
    socket.on('playerAttack', (data) => {
        // data = { roomId, attackType, x, y, direction }
        socket.to(data.roomId).emit('opponentAttack', {
            playerId: socket.id,
            attackType: data.attackType,  // 'basic', 'strong', 'special'
            x: data.x,
            y: data.y,
            direction: data.direction
        });
    });

    // ============================================
    // 6-6. 피격 동기화
    // ============================================
    socket.on('playerHit', (data) => {
        // data = { roomId, damage, hp }
        socket.to(data.roomId).emit('opponentHit', {
            playerId: socket.id,
            damage: data.damage,
            hp: data.hp
        });
    });

    // ============================================
    // 6-7. 플레이어 사망 처리
    // ============================================
    socket.on('playerDied', (data) => {
        // data = { roomId }
        const room = rooms.get(data.roomId);
        if (!room) return;

        // 상대방에게 승리 알림
        socket.to(data.roomId).emit('opponentDied', {
            playerId: socket.id
        });

        // 게임 종료
        setTimeout(() => {
            rooms.delete(data.roomId);
            console.log(`[게임 종료] ${data.roomId} 제거됨`);
        }, 5000);  // 5초 후 방 제거
    });

    // ============================================
    // 6-8. 애니메이션 동기화
    // ============================================
    socket.on('playerAnimation', (data) => {
        // data = { roomId, animation }
        socket.to(data.roomId).emit('opponentAnimation', {
            playerId: socket.id,
            animation: data.animation  // 'idle', 'run', 'jump', 'fall', 'attack' 등
        });
    });

    // ============================================
    // 6-9. 연결 해제 처리
    // ============================================
    socket.on('disconnect', () => {
        console.log(`[연결 해제] ${socket.id}`);

        // 대기 목록에서 제거
        const waitingIndex = waitingPlayers.indexOf(socket);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
            console.log(`[대기 취소] ${socket.id} - 남은 대기자: ${waitingPlayers.length}명`);
        }

        // 게임 중이었다면 상대에게 알림
        rooms.forEach((room, roomId) => {
            if (room.players.player1.id === socket.id ||
                room.players.player2.id === socket.id) {

                socket.to(roomId).emit('opponentDisconnected');
                rooms.delete(roomId);
                console.log(`[방 종료] ${roomId} - 플레이어 나감`);
            }
        });
    });

    // ============================================
    // 6-10. 게임 재시작 요청
    // ============================================
    socket.on('requestRematch', (data) => {
        // data = { roomId }
        socket.to(data.roomId).emit('rematchRequested', {
            playerId: socket.id
        });
    });
});

// ==================================================
// 7. 기본 HTTP 엔드포인트 (서버 상태 확인용)
// ==================================================
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: '2D 플랫포머 멀티플레이어 서버',
        connections: io.engine.clientsCount,
        rooms: rooms.size,
        waitingPlayers: waitingPlayers.length
    });
});

// 서버 상태 확인용
app.get('/status', (req, res) => {
    res.json({
        activeConnections: io.engine.clientsCount,
        activeRooms: rooms.size,
        waitingPlayers: waitingPlayers.length,
        uptime: process.uptime()
    });
});

// ==================================================
// 8. 서버 시작
// ==================================================
const PORT = process.env.PORT || 3000;  // Render는 자동으로 PORT 환경변수 설정

server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('  2D 플랫포머 멀티플레이어 서버 시작!');
    console.log('='.repeat(50));
    console.log(`  포트: ${PORT}`);
    console.log(`  주소: http://localhost:${PORT}`);
    console.log('='.repeat(50));
});

// ==================================================
// 9. 주기적인 청소 작업 (메모리 관리)
// ==================================================
setInterval(() => {
    const now = Date.now();

    // 1시간 이상 된 방 제거
    rooms.forEach((room, roomId) => {
        if (now - room.createdAt > 3600000) {  // 1시간 = 3600000ms
            rooms.delete(roomId);
            console.log(`[청소] 오래된 방 제거: ${roomId}`);
        }
    });

}, 600000);  // 10분마다 청소

// ==================================================
// 10. 에러 핸들링
// ==================================================
process.on('uncaughtException', (error) => {
    console.error('[서버 에러]', error);
});

process.on('unhandledRejection', (error) => {
    console.error('[처리되지 않은 Promise 에러]', error);
});
