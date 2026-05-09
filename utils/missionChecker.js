const DailyMission = require('../models/DailyMission');

// ─── Mission definitions ──────────────────────────────────────────────────────
const DAILY_MISSIONS = [
    {
        key:         'classic_win_today',
        name:        'Classic Victor',
        description: 'Win classic mode today',
        xp_reward:   50,
    },
    {
        key:         'speed_win_under_30',
        name:        'Speed Racer',
        description: 'Win speed mode under 30 seconds',
        xp_reward:   80,
    },
    {
        key:         'play_2_games_today',
        name:        'Double Down',
        description: 'Play 2 games today',
        xp_reward:   30,
    },
];

// ─── Assign daily missions to user if not already assigned ───────────────────
const assignDailyMissions = async (userId) => {
    const today = new Date().toISOString().split('T')[0];

    // Check if already assigned today
    const existing = await DailyMission.findAll({
        where: {
            user_id:       userId,
            assigned_date: today,
        },
    });

    if (existing.length > 0) return existing;

    // Assign all 3 missions for today
    const missions = await DailyMission.bulkCreate(
        DAILY_MISSIONS.map(m => ({
            user_id:       userId,
            mission_key:   m.key,
            mission_name:  m.name,
            description:   m.description,
            xp_reward:     m.xp_reward,
            completed:     false,
            completed_at:  null,
            assigned_date: today,
        }))
    );

    return missions;
};

// ─── Check and complete a mission ─────────────────────────────────────────────
const completeMission = async (userId, missionKey) => {
    const today = new Date().toISOString().split('T')[0];

    const mission = await DailyMission.findOne({
        where: {
            user_id:       userId,
            mission_key:   missionKey,
            assigned_date: today,
            completed:     false,
        },
    });

    if (!mission) return null;  // already completed or not found

    await mission.update({
        completed:    true,
        completed_at: new Date(),
    });

    return mission;
};

// ─── Check missions after game actions ───────────────────────────────────────
const checkMissionsAfterGame = async (userId, context) => {
    const {
        won        = false,
        isSpeedMode = false,
        timeTaken  = null,
        totalGamesToday = 0,
    } = context;

    const { awardXP } = require('./xpCalculator');
    const completedMissions = [];

    // ── Mission 1: Win classic mode today ────────────────────────────
    if (won && !isSpeedMode) {
        const mission = await completeMission(userId, 'classic_win_today');
        if (mission) {
            await awardXP(userId, 'streak_bonus', mission.xp_reward, 'Mission: Win classic mode today');
            completedMissions.push(mission);
        }
    }

    // ── Mission 2: Win speed mode under 30 seconds ───────────────────
    if (won && isSpeedMode && timeTaken !== null && timeTaken <= 30) {
        const mission = await completeMission(userId, 'speed_win_under_30');
        if (mission) {
            await awardXP(userId, 'streak_bonus', mission.xp_reward, 'Mission: Win speed mode under 30s');
            completedMissions.push(mission);
        }
    }

    // ── Mission 3: Play 2 games today ────────────────────────────────
    if (totalGamesToday >= 2) {
        const mission = await completeMission(userId, 'play_2_games_today');
        if (mission) {
            await awardXP(userId, 'streak_bonus', mission.xp_reward, 'Mission: Play 2 games today');
            completedMissions.push(mission);
        }
    }

    return completedMissions;
};

module.exports = { DAILY_MISSIONS, assignDailyMissions, checkMissionsAfterGame };