// 난이도 관리 클래스
class DifficultyManager {
    constructor() {
        this.difficulties = {
            easy: {
                name: '쉬움',
                enemyHpMultiplier: 0.7,
                enemyDamageMultiplier: 0.7,
                scoreMultiplier: 0.8,
                color: '#4CAF50'
            },
            normal: {
                name: '보통',
                enemyHpMultiplier: 1.0,
                enemyDamageMultiplier: 1.0,
                scoreMultiplier: 1.0,
                color: '#2196F3'
            },
            hard: {
                name: '어려움',
                enemyHpMultiplier: 1.3,
                enemyDamageMultiplier: 1.3,
                scoreMultiplier: 1.5,
                color: '#F44336'
            }
        };

        // 현재 난이도 (기본값: normal)
        this.currentDifficulty = this.loadDifficulty();
    }

    // 난이도 설정
    setDifficulty(difficultyKey) {
        if (this.difficulties[difficultyKey]) {
            this.currentDifficulty = difficultyKey;
            this.saveDifficulty();
            return true;
        }
        return false;
    }

    // 현재 난이도 가져오기
    getDifficulty() {
        return this.currentDifficulty;
    }

    // 난이도 정보 가져오기
    getDifficultyInfo(difficultyKey = null) {
        const key = difficultyKey || this.currentDifficulty;
        return this.difficulties[key];
    }

    // 적 HP 계산
    getEnemyHp(baseHp) {
        const multiplier = this.getDifficultyInfo().enemyHpMultiplier;
        return Math.round(baseHp * multiplier);
    }

    // 적 공격력 계산
    getEnemyDamage(baseDamage) {
        const multiplier = this.getDifficultyInfo().enemyDamageMultiplier;
        return Math.round(baseDamage * multiplier);
    }

    // 점수 배율 가져오기
    getScoreMultiplier() {
        return this.getDifficultyInfo().scoreMultiplier;
    }

    // localStorage에 저장
    saveDifficulty() {
        try {
            localStorage.setItem('gameDifficulty', this.currentDifficulty);
        } catch (error) {
            console.error('난이도 저장 실패:', error);
        }
    }

    // localStorage에서 불러오기
    loadDifficulty() {
        try {
            const saved = localStorage.getItem('gameDifficulty');
            if (saved && this.difficulties[saved]) {
                return saved;
            }
        } catch (error) {
            console.error('난이도 불러오기 실패:', error);
        }
        return 'normal'; // 기본값
    }

    // 모든 난이도 목록
    getAllDifficulties() {
        return Object.keys(this.difficulties).map(key => ({
            key: key,
            ...this.difficulties[key]
        }));
    }
}

// 전역 싱글톤 인스턴스
if (typeof window !== 'undefined') {
    window.DifficultyManager = DifficultyManager;
    window.difficultyManager = new DifficultyManager();
}
