# 🎮 2D Platformer Game

Kirby와 Skul: The Hero Slayer에서 영감을 받은 능력 교체 시스템을 가진 2D 액션 플랫포머 게임입니다.

![Version](https://img.shields.io/badge/version-0.3.0-blue)
![Phase](https://img.shields.io/badge/phase-3-green)
![Phaser](https://img.shields.io/badge/Phaser-3.87.0-ff69b4)

## 🌟 주요 특징

- **능력 교체 시스템**: 2개의 능력을 자유롭게 교체하며 전투
- **4가지 능력**: 검, 마법, 해머, 활 (각각 고유한 특성)
- **능력별 특수 효과**: 능력 교체 시 발동되는 고유 효과
- **3종류의 적**: 슬라임, 검병, 마법사
- **능력 획득 시스템**: 적을 처치하면 능력 오브 드롭

## 🎯 게임 방법

### 조작법

| 키 | 동작 |
|---|---|
| **← →** | 이동 |
| **↑** | 점프 |
| **Shift** | 대시 (무적) |
| **Z** | 기본 공격 |
| **X** | 강 공격 |
| **C** | 특수 스킬 |
| **Q / E** | 능력 교체 |

### 능력 설명

#### 🗡️ 검 (Sword)
- **기본**: 3단 콤보 공격
- **강공격**: 360° 회전 베기
- **스킬**: 대시 베기 (무적)
- **교체 효과**: 넉백 충격파

#### 🔮 마법 (Magic)
- **기본**: 화염구 발사
- **강공격**: 3방향 불기둥
- **스킬**: 12방향 화염 폭발
- **교체 효과**: 순간이동

#### 🔨 해머 (Hammer)
- **기본**: 내려찍기 + 지면 충격
- **강공격**: 점프 + 착지 충격파
- **스킬**: 메테오 크래쉬
- **교체 효과**: 폭발 충격파

#### 🏹 활 (Bow)
- **기본**: 빠른 화살
- **강공격**: 차징 화살 (X 홀드)
- **스킬**: 분열 화살 (9발)
- **교체 효과**: 후방 회피 점프

## 🚀 플레이 방법

### 온라인 플레이
GitHub Pages에서 바로 플레이: [게임 플레이하기](#) *(배포 후 링크 추가)*

### 로컬 플레이
1. 저장소 클론
```bash
git clone https://github.com/[사용자명]/2d-platformer.git
```

2. `index.html` 파일을 브라우저에서 열기
   - Chrome, Firefox, Edge 등 모던 브라우저 지원

## 🛠️ 기술 스택

- **Phaser 3.87.0**: 게임 프레임워크
- **Vanilla JavaScript (ES6+)**: 게임 로직
- **HTML5 Canvas**: 렌더링
- **CSS3**: 스타일링

## 📂 프로젝트 구조

```
2d-platformer/
├── index.html              # 메인 HTML
├── css/
│   └── style.css          # 스타일
└── js/
    ├── game.js            # 게임 초기화
    ├── utils/
    │   └── constants.js   # 게임 상수
    ├── abilities/         # 능력 시스템
    │   ├── AbilityBase.js
    │   ├── SwordAbility.js
    │   ├── MagicAbility.js
    │   ├── HammerAbility.js
    │   └── BowAbility.js
    ├── entities/          # 게임 엔티티
    │   ├── Player.js
    │   ├── Enemy.js
    │   ├── Slime.js
    │   ├── SwordEnemy.js
    │   └── MageEnemy.js
    └── scenes/            # 게임 씬
        ├── MainMenuScene.js
        ├── GameScene.js
        └── GameOverScene.js
```

## 📋 개발 단계

- [x] **Phase 1**: 핵심 전투 시스템
- [x] **Phase 2**: 모든 능력 & 적 구현
- [x] **Phase 3**: Scene 시스템 (메뉴, 게임, 게임오버)
- [ ] **Phase 4**: 아이템 시스템
- [ ] **Phase 5**: 스테이지 & 보스
- [ ] **Phase 6**: 사운드 & 비주얼 개선

## 🎨 개발 원칙

- **버그 없는 안정적인 코드** > 개발 속도
- **방어적 프로그래밍**: 모든 입력값 검증
- **에러 핸들링**: try-catch로 위험 구간 보호
- **클래스 기반 OOP**: 유지보수 용이한 구조

## 🤝 기여

버그 리포트와 기능 제안을 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 📞 연락처

프로젝트 링크: [https://github.com/[사용자명]/2d-platformer](https://github.com/[사용자명]/2d-platformer)

---

**⚠️ 주의**: 이 게임은 교육 목적으로 개발되었으며, 지속적으로 업데이트됩니다.

**🎮 즐거운 게임 되세요!**
