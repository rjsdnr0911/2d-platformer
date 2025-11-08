// 스컬 베이스 클래스
class SkullBase {
    constructor(config) {
        this.id = config.id || 'unknown';
        this.name = config.name || 'Unknown Skull';
        this.rarity = config.rarity || 'common';  // 'common', 'rare', 'legendary'
        this.type = config.type || 'melee';       // 'melee', 'ranged', 'special', 'hybrid'

        // 기본 스탯
        this.stats = {
            baseHP: config.baseHP || 0,              // 추가 최대 HP
            moveSpeed: config.moveSpeed || 1.0,      // 이동속도 배율
            jumpPower: config.jumpPower || 1.0,      // 점프력 배율
            attackPower: config.attackPower || 1.0   // 공격력 배율
        };

        // 능력
        this.basicAttack = config.basicAttack || null;  // 기본 공격 함수
        this.skill1 = config.skill1 || null;            // 스킬 1
        this.skill2 = config.skill2 || null;            // 스킬 2
        this.swapEffect = config.swapEffect || null;    // 교체 시 효과
        this.passive = config.passive || null;          // 패시브 능력

        // 설명
        this.description = config.description || '';
    }

    // 희귀도별 색상
    getRarityColor() {
        switch (this.rarity) {
            case 'common': return '#888888';
            case 'rare': return '#4444FF';
            case 'legendary': return '#FFD700';
            default: return '#666666';
        }
    }

    // 타입별 아이콘 (이모지)
    getTypeIcon() {
        switch (this.type) {
            case 'melee': return '⚔️';
            case 'ranged': return '🏹';
            case 'special': return '🔮';
            case 'hybrid': return '⚡';
            default: return '💀';
        }
    }

    // 스컬 정보 문자열
    getInfoText() {
        const rarityText = {
            'common': '일반',
            'rare': '희귀',
            'legendary': '전설'
        }[this.rarity] || this.rarity;

        const typeText = {
            'melee': '근거리',
            'ranged': '원거리',
            'special': '특수',
            'hybrid': '혼합'
        }[this.type] || this.type;

        let info = `${this.name}\n`;
        info += `등급: ${rarityText} | 타입: ${typeText}\n\n`;

        // 스탯
        info += `━━━ 스탯 ━━━\n`;
        if (this.stats.baseHP !== 0) {
            info += `HP: ${this.stats.baseHP > 0 ? '+' : ''}${this.stats.baseHP}\n`;
        }
        if (this.stats.moveSpeed !== 1.0) {
            const percent = ((this.stats.moveSpeed - 1.0) * 100).toFixed(0);
            info += `이동속도: ${percent > 0 ? '+' : ''}${percent}%\n`;
        }
        if (this.stats.jumpPower !== 1.0) {
            const percent = ((this.stats.jumpPower - 1.0) * 100).toFixed(0);
            info += `점프력: ${percent > 0 ? '+' : ''}${percent}%\n`;
        }
        if (this.stats.attackPower !== 1.0) {
            const percent = ((this.stats.attackPower - 1.0) * 100).toFixed(0);
            info += `공격력: ${percent > 0 ? '+' : ''}${percent}%\n`;
        }

        // 스킬
        info += `\n━━━ 능력 ━━━\n`;
        info += `기본 공격: ${this.basicAttack ? this.basicAttack.name || '있음' : '없음'}\n`;
        if (this.skill1) {
            info += `스킬 1: ${this.skill1.name || 'Skill 1'}\n`;
        }
        if (this.skill2) {
            info += `스킬 2: ${this.skill2.name || 'Skill 2'}\n`;
        }
        if (this.passive) {
            info += `패시브: ${this.passive.name || '특수 능력'}\n`;
        }

        return info;
    }
}

// 전역에서 접근 가능하도록
if (typeof window !== 'undefined') {
    window.SkullBase = SkullBase;
}
