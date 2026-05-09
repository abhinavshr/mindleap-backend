const DailyMission = require('../models/DailyMission');

// ─── All possible missions pool ───────────────────────────────────────────────
const MISSION_POOL = [
    // ── Classic missions ──────────────────────────────────────────────
    {
        key:         'classic_win_today',
        name:        'Classic Victor',
        description: 'Win classic mode today',
        xp_reward:   50,
        type:        'classic',
    },
    {
        key:         'classic_win_3_attempts',
        name:        'Sharp Mind',
        description: 'Win classic mode in 3 attempts or less',
        xp_reward:   80,
        type:        'classic',
    },
    {
        key:         'classic_win_1_attempt',
        name:        'Big Brain',
        description: 'Win classic mode in 1 attempt',
        xp_reward:   150,
        type:        'classic',
    },
    {
        key:         'classic_play_today',
        name:        'Show Up',
        description: 'Play classic mode today',
        xp_reward:   20,
        type:        'classic',
    },

    // ── Speed missions ────────────────────────────────────────────────
    {
        key:         'speed_win_under_15',
        name:        'Lightning Fast',
        description: 'Win speed mode under 15 seconds',
        xp_reward:   120,
        type:        'speed',
    },
    {
        key:         'speed_win_under_30',
        name:        'Speed Racer',
        description: 'Win speed mode under 30 seconds',
        xp_reward:   80,
        type:        'speed',
    },
    {
        key:         'speed_win_under_45',
        name:        'Quick Thinker',
        description: 'Win speed mode under 45 seconds',
        xp_reward:   60,
        type:        'speed',
    },
    {
        key:         'speed_win_today',
        name:        'Speed Winner',
        description: 'Win any speed mode game today',
        xp_reward:   50,
        type:        'speed',
    },
    {
        key:         'play_2_speed_games_today',
        name:        'Double Down',
        description: 'Play 2 speed games today',
        xp_reward:   30,
        type:        'speed',
    },
    {
        key:         'play_3_speed_games_today',
        name:        'Speed Addict',
        description: 'Play 3 speed games today',
        xp_reward:   50,
        type:        'speed',
    },

    // ── Combined missions ─────────────────────────────────────────────
    {
        key:         'play_2_games_any_mode',
        name:        'Grinder',
        description: 'Play 2 games in any mode today',
        xp_reward:   30,
        type:        'any',
    },
    {
        key:         'win_both_modes_today',
        name:        'All Rounder',
        description: 'Win both classic and speed mode today',
        xp_reward:   100,
        type:        'any',
    },
    {
        key:         'play_3_games_any_mode',
        name:        'Dedicated',
        description: 'Play 3 games in any mode today',
        xp_reward:   50,
        type:        'any',
    },
];

// ─── Pick 3 missions based on today's date (deterministic) ───────────────────
const pickTodaysMissions = () => {
    const today     = new Date().toISOString().split('T')[0];
    const dateSeed  = today.replace(/-/g, '');    // e.g. "20260411"
    const seed      = parseInt(dateSeed) % 1000;  // numeric seed from date

    // ── Shuffle pool using seed ───────────────────────────────────────
    const shuffled = [...MISSION_POOL].sort((a, b) => {
        const hashA = (MISSION_POOL.indexOf(a) * 31 + seed) % MISSION_POOL.length;
        const hashB = (MISSION_POOL.indexOf(b) * 31 + seed) % MISSION_POOL.length;
        return hashA - hashB;
    });

    // ── Pick one from each category ───────────────────────────────────
    const classic = shuffled.find(m => m.type === 'classic');
    const speed   = shuffled.find(m => m.type === 'speed');
    const any     = shuffled.find(m => m.type === 'any');

    return [classic, speed, any].filter(Boolean);
};

// ─── Assign today's missions to user ─────────────────────────────────────────
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

    // Pick today's 3 missions
    const todaysMissions = pickTodaysMissions();

    const missions = await DailyMission.bulkCreate(
        todaysMissions.map(m => ({
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

    console.log(`📋 Assigned missions for ${today}:`, todaysMissions.map(m => m.key));
    return missions;
};

// ─── Complete a mission ───────────────────────────────────────────────────────
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

    if (!mission) return null;

    await mission.update({
        completed:    true,
        completed_at: new Date(),
    });

    return mission;
};

// ─── Check missions after game ────────────────────────────────────────────────
const checkMissionsAfterGame = async (userId, context) => {
    const {
        won                  = false,
        isSpeedMode          = false,
        timeTaken            = null,
        totalGamesToday      = 0,
        totalSpeedGamesToday = 0,
        totalClassicGamesToday = 0,
        classicWonToday      = false,
        speedWonToday        = false,
        attempts             = 0,
    } = context;

    const { awardXP }       = require('./xpCalculator');
    const completedMissions = [];

    const tryComplete = async (key, xpDesc) => {
        const mission = await completeMission(userId, key);
        if (mission) {
            await awardXP(userId, 'streak_bonus', mission.xp_reward, xpDesc);
            completedMissions.push(mission);
        }
    };

    // ── Classic missions ──────────────────────────────────────────────
    if (won && !isSpeedMode) {
        await tryComplete('classic_win_today',       'Mission: Win classic mode today');
        await tryComplete('classic_play_today',      'Mission: Play classic mode today');

        if (attempts <= 3)
            await tryComplete('classic_win_3_attempts', 'Mission: Win classic in 3 attempts or less');
        if (attempts === 1)
            await tryComplete('classic_win_1_attempt',  'Mission: Win classic in 1 attempt');
    }

    if (!won && !isSpeedMode) {
        await tryComplete('classic_play_today', 'Mission: Play classic mode today');
    }

    // ── Speed missions ────────────────────────────────────────────────
    if (isSpeedMode) {
        if (won) {
            await tryComplete('speed_win_today', 'Mission: Win speed mode today');

            if (timeTaken !== null && timeTaken <= 15)
                await tryComplete('speed_win_under_15', 'Mission: Win speed under 15s');

            if (timeTaken !== null && timeTaken <= 30)
                await tryComplete('speed_win_under_30', 'Mission: Win speed under 30s');

            if (timeTaken !== null && timeTaken <= 45)
                await tryComplete('speed_win_under_45', 'Mission: Win speed under 45s');
        }

        if (totalSpeedGamesToday >= 2)
            await tryComplete('play_2_speed_games_today', 'Mission: Play 2 speed games today');

        if (totalSpeedGamesToday >= 3)
            await tryComplete('play_3_speed_games_today', 'Mission: Play 3 speed games today');
    }

    // ── Combined missions ─────────────────────────────────────────────
    if (totalGamesToday >= 2)
        await tryComplete('play_2_games_any_mode', 'Mission: Play 2 games today');

    if (totalGamesToday >= 3)
        await tryComplete('play_3_games_any_mode', 'Mission: Play 3 games today');

    if (classicWonToday && speedWonToday)
        await tryComplete('win_both_modes_today', 'Mission: Win both modes today');

    return completedMissions;
};

module.exports = { MISSION_POOL, assignDailyMissions, checkMissionsAfterGame, pickTodaysMissions };