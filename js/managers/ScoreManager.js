// 점수 관리 클래스
class ScoreManager {
    constructor() {
        // 점수 계산 기준
        this.scoreValues = {
            // 적 처치 점수
            slime: 100,
            bat: 150,
            knight: 200,
            mage: 250,
            boss: 1000,

            // 스테이지 클리어 보너스
            stageClear: 500,

            // 시간 보너스 (초당)
            timeBonus: 10,
            maxTimeBonus: 3000 // 최대 시간 보너스
        };

        // 현재 게임 점수
        this.currentScore = 0;
        this.startTime = 0;
    }

    // 게임 시작 (시간 기록)
    startGame() {
        this.currentScore = 0;
        this.startTime = Date.now();
    }

    // 적 처치 점수 추가
    addEnemyScore(enemyType) {
        if (this.scoreValues[enemyType]) {
            const baseScore = this.scoreValues[enemyType];
            const difficultyMultiplier = window.difficultyManager.getScoreMultiplier();
            const score = Math.round(baseScore * difficultyMultiplier);
            this.currentScore += score;
            return score;
        }
        return 0;
    }

    // 스테이지 클리어 점수 추가
    addStageClearScore() {
        const baseScore = this.scoreValues.stageClear;
        const difficultyMultiplier = window.difficultyManager.getScoreMultiplier();
        const score = Math.round(baseScore * difficultyMultiplier);
        this.currentScore += score;
        return score;
    }

    // 시간 보너스 계산
    calculateTimeBonus() {
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const baseBonus = Math.max(0, 300 - elapsedSeconds); // 5분 기준
        const bonus = Math.min(baseBonus * this.scoreValues.timeBonus, this.scoreValues.maxTimeBonus);
        this.currentScore += bonus;
        return bonus;
    }

    // 현재 점수 가져오기
    getCurrentScore() {
        return this.currentScore;
    }

    // 최고 점수 저장 (난이도별, 스테이지별)
    saveHighScore(stage, difficulty, score) {
        try {
            const key = `highScore_${difficulty}_${stage}`;
            const currentHigh = parseInt(localStorage.getItem(key)) || 0;

            if (score > currentHigh) {
                localStorage.setItem(key, score.toString());
                return true; // 신기록
            }
            return false;
        } catch (error) {
            console.error('최고 점수 저장 실패:', error);
            return false;
        }
    }

    // 최고 점수 불러오기
    getHighScore(stage, difficulty) {
        try {
            const key = `highScore_${difficulty}_${stage}`;
            return parseInt(localStorage.getItem(key)) || 0;
        } catch (error) {
            console.error('최고 점수 불러오기 실패:', error);
            return 0;
        }
    }

    // 모든 스테이지의 최고 점수 가져오기 (특정 난이도)
    getAllHighScores(difficulty) {
        const stages = ['Stage1Scene', 'Stage2Scene', 'Stage3Scene'];
        const scores = {};

        stages.forEach(stage => {
            scores[stage] = this.getHighScore(stage, difficulty);
        });

        return scores;
    }

    // 총합 최고 점수 (전체 스테이지 합계)
    getTotalHighScore(difficulty) {
        const scores = this.getAllHighScores(difficulty);
        return Object.values(scores).reduce((sum, score) => sum + score, 0);
    }

    // 점수 포맷팅 (3자리마다 쉼표)
    formatScore(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // 점수 초기화
    resetCurrentScore() {
        this.currentScore = 0;
        this.startTime = Date.now();
    }

    // 모든 기록 삭제 (디버그용)
    clearAllHighScores() {
        try {
            const difficulties = ['easy', 'normal', 'hard'];
            const stages = ['Stage1Scene', 'Stage2Scene', 'Stage3Scene'];

            difficulties.forEach(difficulty => {
                stages.forEach(stage => {
                    const key = `highScore_${difficulty}_${stage}`;
                    localStorage.removeItem(key);
                });
            });

            console.log('모든 최고 점수 기록이 삭제되었습니다.');
            return true;
        } catch (error) {
            console.error('기록 삭제 실패:', error);
            return false;
        }
    }
}

// 전역 싱글톤 인스턴스
if (typeof window !== 'undefined') {
    window.ScoreManager = ScoreManager;
    window.scoreManager = new ScoreManager();
}
