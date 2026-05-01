const { checkLevelUp, getLevelFromXP } = require('./levelCalculator');

// ─── Calculate XP — Speed Mode ────────────────────────────────────────────────
const calculateXP = (timeTaken, attempts) => {
    let baseXP = 0;

    if      (timeTaken >= 0  && timeTaken <= 15) baseXP = 150;
    else if (timeTaken >= 16 && timeTaken <= 30) baseXP = 120;
    else if (timeTaken >= 31 && timeTaken <= 45) baseXP = 90;
    else if (timeTaken >= 46 && timeTaken <= 60) baseXP = 60;
    else                                          baseXP = 0;

    let bonusXP = 0;
    if      (attempts === 1) bonusXP = 50;
    else if (attempts === 2) bonusXP = 30;
    else if (attempts === 3) bonusXP = 20;
    else if (attempts === 4) bonusXP = 10;

    return baseXP + bonusXP;
};

// ─── Calculate XP — Classic Mode ─────────────────────────────────────────────
const calculateClassicXP = (won, attempts) => {
    if (!won) return 10;

    if      (attempts === 1) return 150;
    else if (attempts === 2) return 120;
    else if (attempts === 3) return 100;
    else if (attempts === 4) return 80;
    else if (attempts === 5) return 60;
    else                     return 40;
};

// ─── Calculate streak bonus XP ────────────────────────────────────────────────
const calculateStreakBonus = (streak) => {
    if (streak >= 30) return 150;
    if (streak >= 7)  return 50;
    if (streak >= 3)  return 20;
    return 0;
};

// ─── Award XP to user ─────────────────────────────────────────────────────────
const awardXP = async (userId, source, amount, description) => {
    const { User, UserXpLog, UserReward } = require('../models');

    // ── Get current user XP ───────────────────────────────────────────
    const user = await User.findByPk(userId, {
        attributes: ['id', 'total_xp', 'current_level', 'current_title'],
    });

    if (!user) throw new Error('User not found');

    const oldXp = user.total_xp || 0;
    const newXp = oldXp + amount;

    // ── Check level up ────────────────────────────────────────────────
    const levelUpResult = checkLevelUp(oldXp, newXp);
    const newLevelInfo  = getLevelFromXP(newXp);

    // ── Update user ───────────────────────────────────────────────────
    await user.update({
        total_xp:      newXp,
        current_level: newLevelInfo.level,
        current_title: newLevelInfo.title,
    });

    // ── Log XP event ─────────────────────────────────────────────────
    await UserXpLog.create({
        user_id:     userId,
        source,
        xp_amount:   amount,
        description,
    });

    // ── Handle level up rewards ───────────────────────────────────────
    if (levelUpResult.leveledUp) {
        const { LEVELS } = require('./levelCalculator');

        for (let lvl = levelUpResult.oldLevel + 1; lvl <= levelUpResult.newLevel; lvl++) {
            const levelDef = LEVELS.find(l => l.level === lvl);

            // ── Unlock reward if exists ───────────────────────────────
            if (levelDef?.reward_type && levelDef?.reward_value) {
                await UserReward.create({
                    user_id:      userId,
                    reward_type:  levelDef.reward_type,
                    reward_value: levelDef.reward_value,
                });
            }

            // ── Award level up bonus XP ───────────────────────────────
            let bonusXp = 0;
            if (lvl === 10) bonusXp = 200;
            if (lvl === 25) bonusXp = 500;
            if (lvl === 50) bonusXp = 1000;

            if (bonusXp > 0) {
                await awardXP(userId, 'level_up_bonus', bonusXp, `Reached Level ${lvl} bonus!`);
            }
        }
    }

    return {
        xpEarned:    amount,
        oldXp,
        newXp,
        leveledUp:   levelUpResult.leveledUp,
        oldLevel:    levelUpResult.oldLevel   || newLevelInfo.level,
        newLevel:    levelUpResult.newLevel   || newLevelInfo.level,
        newTitle:    levelUpResult.newTitle   || newLevelInfo.title,
        progressPercent: newLevelInfo.progressPercent,
        xpToNextLevel:   newLevelInfo.xpToNextLevel,
    };
};

module.exports = { calculateXP, calculateClassicXP, calculateStreakBonus, awardXP };