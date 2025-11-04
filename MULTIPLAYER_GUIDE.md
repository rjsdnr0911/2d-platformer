# 🎮 온라인 1대1 멀티플레이어 가이드

## 📖 목차
1. [로컬 테스트 방법](#로컬-테스트-방법)
2. [Render 무료 배포 방법](#render-무료-배포-방법)
3. [트러블슈팅](#트러블슈팅)

---

## 🧪 로컬 테스트 방법

### **1단계: 서버 실행하기**

#### Windows (명령 프롬프트 또는 PowerShell):
```bash
# 서버 폴더로 이동
cd C:\Users\rjsdn\Desktop\2d-platformer\server

# 서버 시작
npm start
```

#### 성공 시 다음과 같은 메시지가 표시됩니다:
```
==================================================
  2D 플랫포머 멀티플레이어 서버 시작!
==================================================
  포트: 3000
  주소: http://localhost:3000
==================================================
```

> **💡 Tip**: 서버를 종료하려면 `Ctrl+C`를 누르세요.

---

### **2단계: 게임 실행하기 (2개 브라우저 창)**

1. **첫 번째 브라우저 창 열기**
   - Chrome 또는 Edge에서 `C:\Users\rjsdn\Desktop\2d-platformer\index.html` 파일을 엽니다.
   - 메인 메뉴에서 **"🌐 온라인 1대1"** 버튼 클릭
   - 서버 주소는 기본값 `localhost:3000` 유지
   - **"매칭 시작"** 버튼 클릭
   - "⏳ 상대방을 찾는 중..." 메시지가 표시됩니다.

2. **두 번째 브라우저 창 열기 (새 창)**
   - **Ctrl + N**으로 새 브라우저 창 열기 (같은 브라우저 사용)
   - 다시 `C:\Users\rjsdn\Desktop\2d-platformer\index.html` 파일 열기
   - 동일하게 **"🌐 온라인 1대1"** → **"매칭 시작"** 클릭

3. **매칭 성공!**
   - 양쪽 화면에 "✅ 매칭 완료! 게임 시작..." 메시지 표시
   - 1초 후 자동으로 게임 시작

---

### **3단계: 게임 플레이**

#### **조작법**
- **이동**: 방향키 (← →)
- **점프**: 위쪽 방향키 (↑)
- **대시**: Shift
- **기본 공격**: Z
- **강공격**: X
- **필살기**: C

#### **게임 규칙**
- 상대방을 공격하여 체력을 0으로 만들면 승리!
- 먼저 사망하면 패배!
- 체력바는 화면 상단에 표시됩니다.

---

## 🚀 Render 무료 배포 방법

Render에서 서버를 무료로 호스팅하면 인터넷 연결만 있으면 누구와도 플레이할 수 있습니다!

### **1단계: GitHub에 서버 코드 업로드**

1. **GitHub 계정 생성** (없다면): https://github.com/signup

2. **새 저장소(Repository) 생성**:
   - GitHub에서 **"New repository"** 클릭
   - 이름: `2d-platformer-server` (원하는 이름)
   - Public 선택
   - **"Create repository"** 클릭

3. **Git 설치 확인** (명령 프롬프트에서):
   ```bash
   git --version
   ```
   - 설치되어 있지 않다면: https://git-scm.com/downloads

4. **서버 폴더를 Git 저장소로 초기화**:
   ```bash
   cd C:\Users\rjsdn\Desktop\2d-platformer\server
   git init
   git add .
   git commit -m "Initial commit: 2D platformer multiplayer server"
   ```

5. **GitHub에 푸시**:
   ```bash
   git remote add origin https://github.com/[당신의사용자명]/2d-platformer-server.git
   git branch -M main
   git push -u origin main
   ```
   - `[당신의사용자명]`을 실제 GitHub 사용자명으로 변경하세요.

---

### **2단계: Render에 서버 배포**

1. **Render 계정 생성**: https://render.com/
   - "Sign up with GitHub" 선택 (GitHub 연동)

2. **새 웹 서비스 생성**:
   - Dashboard에서 **"New +"** 클릭 → **"Web Service"** 선택
   - GitHub 저장소 연결: `2d-platformer-server` 선택
   - 다음 설정 입력:

   | 항목 | 값 |
   |------|-----|
   | **Name** | `2d-platformer-server` (또는 원하는 이름) |
   | **Environment** | `Node` |
   | **Region** | `Singapore` (한국과 가장 가까움) |
   | **Branch** | `main` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

3. **"Create Web Service"** 클릭

4. **배포 대기** (약 3-5분):
   - 로그에서 "서버 시작!" 메시지가 보이면 성공!
   - 상단에 서버 주소가 표시됩니다:
     ```
     예: https://2d-platformer-server.onrender.com
     ```

---

### **3단계: 게임 클라이언트 설정**

1. **게임에서 서버 주소 입력**:
   - 게임 실행 → **"🌐 온라인 1대1"** 클릭
   - 서버 주소 클릭하여 변경:
     ```
     2d-platformer-server.onrender.com
     ```
     (https:// 제외)

2. **매칭 시작**:
   - **"매칭 시작"** 클릭
   - 상대방이 접속할 때까지 대기

3. **친구와 플레이**:
   - 친구에게 서버 주소를 알려주세요!
   - 같은 서버 주소를 입력하면 자동 매칭됩니다.

---

## ⚠️ Render 무료 플랜 주의사항

### **콜드 스타트 (Cold Start)**
- 15분 동안 아무도 접속하지 않으면 서버가 **절전 모드**로 전환됩니다.
- 다시 접속하면 **15-30초** 후 서버가 깨어납니다.
- 첫 번째 매칭 시도가 실패하면, 30초 후 다시 시도하세요.

### **월 사용 시간 제한**
- 무료 플랜: **월 750시간** (약 31일)
- 5명 이하 플레이는 충분합니다!

### **대역폭**
- 무료 플랜: **월 100GB**
- 플랫포머 게임은 데이터 사용량이 적어서 문제없습니다.

---

## 🛠 트러블슈팅

### **1. "서버 연결 실패!" 메시지**

**원인**: 서버가 실행되지 않았거나 주소가 잘못되었습니다.

**해결 방법**:
- 서버가 실행 중인지 확인 (`npm start`)
- 서버 주소가 정확한지 확인
- 방화벽이 3000번 포트를 차단하는지 확인

---

### **2. 로컬 테스트 시 매칭이 안 됨**

**원인**: 브라우저가 같은 세션을 공유하고 있습니다.

**해결 방법**:
- **방법 1**: 다른 브라우저 사용 (예: Chrome과 Edge)
- **방법 2**: 시크릿 모드 사용
  - Chrome: `Ctrl + Shift + N`
  - Edge: `Ctrl + Shift + P`

---

### **3. Render 배포 후 "Application failed to respond" 오류**

**원인**: 서버가 PORT 환경변수를 사용하지 않았습니다.

**해결 방법**:
- `server.js` 파일 확인:
  ```javascript
  const PORT = process.env.PORT || 3000;
  ```
  이 코드가 있는지 확인 (이미 포함되어 있습니다)

---

### **4. 게임 플레이 중 끊김**

**원인**: 네트워크 지연 (Ping이 높음)

**해결 방법**:
- Render Region을 가까운 곳으로 변경 (예: Singapore)
- 안정적인 인터넷 연결 사용 (Wi-Fi보다 유선)

---

## 📝 서버 상태 확인

### **로컬 서버**
브라우저에서 접속:
```
http://localhost:3000
```

### **Render 서버**
브라우저에서 접속:
```
https://[당신의서버이름].onrender.com
```

**응답 예시**:
```json
{
  "status": "running",
  "message": "2D 플랫포머 멀티플레이어 서버",
  "connections": 0,
  "rooms": 0,
  "waitingPlayers": 0
}
```

---

## 🎉 완성!

이제 친구와 온라인으로 대전할 수 있습니다!

### **다음 개선 사항 (선택사항)**
- [ ] 능력 시스템 동기화 (검술, 마법, 해머, 활)
- [ ] 더 많은 맵 추가
- [ ] 관전 모드
- [ ] 채팅 기능
- [ ] 리더보드 (순위표)
- [ ] 재시합 기능

---

## 📞 문제 발생 시

1. **서버 로그 확인**: 터미널에서 오류 메시지 확인
2. **브라우저 콘솔 확인**: F12 → Console 탭
3. **Render 로그 확인**: Render Dashboard → Logs 탭

즐거운 게임 되세요! 🎮✨
