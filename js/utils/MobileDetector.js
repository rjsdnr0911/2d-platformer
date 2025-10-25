// 모바일 기기 감지 유틸리티
class MobileDetector {
    static isMobile() {
        // 터치 지원 여부 확인
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // 모바일 기기 User Agent 확인
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileDevice = mobileRegex.test(navigator.userAgent);

        // 화면 크기 확인 (작은 화면 = 모바일)
        const isSmallScreen = window.innerWidth <= 768;

        // 하나라도 해당하면 모바일로 판단
        return hasTouch && (isMobileDevice || isSmallScreen);
    }

    static isTablet() {
        const tabletRegex = /iPad|Android/i;
        const isTabletDevice = tabletRegex.test(navigator.userAgent);
        const isTabletScreen = window.innerWidth > 768 && window.innerWidth <= 1024;

        return isTabletDevice && isTabletScreen;
    }

    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    static getDeviceType() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.MobileDetector = MobileDetector;
}
