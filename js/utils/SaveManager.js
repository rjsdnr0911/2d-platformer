// 게임 진행도 저장 관리자
class SaveManager {
    constructor() {
        this.storageKey = '2d-platformer-save';
        this.defaultData = {
            unlockedStages: [1], // 처음에는 Stage 1만 해금
            clearedStages: [], // 클리어한 스테이지
            bestTimes: {}, // 스테이지별 최단 시간
            totalPlayTime: 0,
            stats: {
                totalKills: 0,
                totalDeaths: 0,
                bossesDefeated: 0
            }
        };
    }

    // 저장 데이터 불러오기
    load() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                if (CONSTANTS.GAME.DEBUG) {
                    console.log('저장 데이터 로드:', data);
                }
                return { ...this.defaultData, ...data };
            }
        } catch (error) {
            console.error('저장 데이터 로드 실패:', error);
        }
        return { ...this.defaultData };
    }

    // 저장 데이터 저장
    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            if (CONSTANTS.GAME.DEBUG) {
                console.log('저장 완료:', data);
            }
            return true;
        } catch (error) {
            console.error('저장 실패:', error);
            return false;
        }
    }

    // 스테이지 해금
    unlockStage(stageNumber, currentData) {
        if (!currentData.unlockedStages.includes(stageNumber)) {
            currentData.unlockedStages.push(stageNumber);
            currentData.unlockedStages.sort((a, b) => a - b);
            this.save(currentData);
        }
    }

    // 스테이지 클리어
    clearStage(stageNumber, clearTime, currentData) {
        // 클리어 목록에 추가
        if (!currentData.clearedStages.includes(stageNumber)) {
            currentData.clearedStages.push(stageNumber);
            currentData.clearedStages.sort((a, b) => a - b);
        }

        // 최단 시간 갱신
        if (!currentData.bestTimes[stageNumber] || clearTime < currentData.bestTimes[stageNumber]) {
            currentData.bestTimes[stageNumber] = clearTime;
        }

        // 다음 스테이지 해금
        if (stageNumber < 4) {
            this.unlockStage(stageNumber + 1, currentData);
        }

        this.save(currentData);
    }

    // 스테이지 해금 여부 확인
    isStageUnlocked(stageNumber, currentData) {
        return currentData.unlockedStages.includes(stageNumber);
    }

    // 스테이지 클리어 여부 확인
    isStageCleared(stageNumber, currentData) {
        return currentData.clearedStages.includes(stageNumber);
    }

    // 통계 업데이트
    updateStats(stat, value, currentData) {
        if (currentData.stats.hasOwnProperty(stat)) {
            currentData.stats[stat] += value;
            this.save(currentData);
        }
    }

    // 저장 데이터 초기화
    reset() {
        try {
            localStorage.removeItem(this.storageKey);
            if (CONSTANTS.GAME.DEBUG) {
                console.log('저장 데이터 초기화 완료');
            }
            return true;
        } catch (error) {
            console.error('초기화 실패:', error);
            return false;
        }
    }
}

// 전역 싱글톤 인스턴스
if (typeof window !== 'undefined') {
    window.saveManager = new SaveManager();
}
