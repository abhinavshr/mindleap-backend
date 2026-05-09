const DailyMission = require('../models/DailyMission');

// ─── Helper: get Monday of current week ──────────────────────────────────────
const getWeekStart = () => {
    const now  = new Date();
    const day  = now.getDay();                          
    const diff = day === 0 ? -6 : 1 - day;             
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];         
};

// ─── Daily mission pool ───────────────────────────────────────────────────────
const MISSION_POOL = [
    // ── Classic ───────────────────────────────────────────────────────
    {
        key:         'classic_win_today',
        name:        'Classic Victor',
        description: 'Win classic mode today',
        xp_reward:   50,
        type:        'classic',
        target:      1,
    },
    {
        key:         'classic_win_3_attempts',
        name:        'Sharp Mind',
        description: 'Win classic mode in 3 attempts or less',
        xp_reward:   80,
        type:        'classic',
        target:      1,
    },
    {
        key:         'classic_win_1_attempt',
        name:        'Big Brain',
        description: 'Win classic mode in 1 attempt',
        xp_reward:   150,
        type:        'classic',
        target:      1,
    },
    {
        key:         'classic_play_today',
        name:        'Show Up',
        description: 'Play classic mode today',
        xp_reward:   20,
        type:        'classic',
        target:      1,
    },

    // ── Speed ─────────────────────────────────────────────────────────
    {
        key:         'speed_win_under_15',
        name:        'Lightning Fast',
        description: 'Win speed mode under 15 seconds',
        xp_reward:   120,
        type:        'speed',
        target:      1,
    },
    {
        key:         'speed_win_under_30',
        name:        'Speed Racer',
        description: 'Win speed mode under 30 seconds',
        xp_reward:   80,
        type:        'speed',
        target:      1,
    },
    {
        key:         'speed_win_under_45',
        name:        'Quick Thinker',
        description: 'Win speed mode under 45 seconds',
        xp_reward:   60,
        type:        'speed',
        target:      1,
    },
    {
        key:         'speed_win_today',
        name:        'Speed Winner',
        description: 'Win any speed mode game today',
        xp_reward:   50,
        type:        'speed',
        target:      1,
    },
    {
        key:         'play_2_speed_games_today',
        name:        'Double Down',
        description: 'Play 2 speed games today',
        xp_reward:   30,
        type:        'speed',
        target:      2,
    },
    {
        key:         'play_3_speed_games_today',
        name:        'Speed Addict',
        description: 'Play 3 speed games today',
        xp_reward:   50,
        type:        'speed',
        target:      3,
    },

    // ── Combined ──────────────────────────────────────────────────────
    {
        key:         'play_2_games_any_mode',
        name:        'Grinder',
        description: 'Play 2 games in any mode today',
        xp_reward:   30,
        type:        'any',
        target:      2,
    },
    {
        key:         'win_both_modes_today',
        name:        'All Rounder',
        description: 'Win both classic and speed mode today',
        xp_reward:   100,
        type:        'any',
        target:      1,
    },
    {
        key:         'play_3_games_any_mode',
        name:        'Dedicated',
        description: 'Play 3 games in any mode today',
        xp_reward:   50,
        type:        'any',
        target:      3,
    },
];

// ─── Weekly mission definitions ───────────────────────────────────────────────
const WEEKLY_MISSIONS = [
    {
        key:         'win_5_games_this_week',
        name:        'Weekly Warrior',
        description: 'Win 5 games this week (resets Monday)',
        xp_reward:   200,
        target:      5,
    },
    {
        key:         'maintain_7_day_streak',
        name:        'On Fire',
        description: 'Maintain a 7 day streak this week',
        xp_reward:   300,
        target:      7,
    },
];

// ─── Pick today's 3 daily missions (deterministic by date) ───────────────────
const pickTodaysMissions = () => {
    const today    = new Date().toISOString().split('T')[0];
    const dateSeed = today.replace(/-/g, '');
    const seed     = parseInt(dateSeed) % 1000;

    const shuffled = [...MISSION_POOL].sort((a, b) => {
        const hashA = (MISSION_POOL.indexOf(a) * 31 + seed) % MISSION_POOL.length;
        const hashB = (MISSION_POOL.indexOf(b) * 31 + seed) % MISSION_POOL.length;
        return hashA - hashB;
    });

    const classic = shuffled.find(m => m.type === 'classic');
    const speed   = shuffled.find(m => m.type === 'speed');
    const any     = shuffled.find(m => m.type === 'any');

    return [classic, speed, any].filter(Boolean);
};

// ─── Assign daily missions ────────────────────────────────────────────────────
const assignDailyMissions = async (userId) => {
    const today     = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart();

    // ── Check daily missions ──────────────────────────────────────────
    const existingDaily = await DailyMission.findAll({
        where: {
            user_id:       userId,
            assigned_date: today,
            mission_type:  'daily',
        },
    });

    if (existingDaily.length === 0) {
        const todaysMissions = pickTodaysMissions();
        await DailyMission.bulkCreate(
            todaysMissions.map(m => ({
                user_id:       userId,
                mission_key:   m.key,
                mission_name:  m.name,
                description:   m.description,
                xp_reward:     m.xp_reward,
                mission_type:  'daily',
                progress:      0,
                target:        m.target,
                completed:     false,
                completed_at:  null,
                assigned_date: today,
            }))
        );
        console.log(`📋 Daily missions assigned for ${today}`);
    }

    // ── Check weekly missions ─────────────────────────────────────────
    const existingWeekly = await DailyMission.findAll({
        where: {
            user_id:       userId,
            assigned_date: weekStart,
            mission_type:  'weekly',
        },
    });

    if (existingWeekly.length === 0) {
        await DailyMission.bulkCreate(
            WEEKLY_MISSIONS.map(m => ({
                user_id:       userId,
                mission_key:   m.key,
                mission_name:  m.name,
                description:   m.description,
                xp_reward:     m.xp_reward,
                mission_type:  'weekly',
                progress:      0,
                target:        m.target,
                completed:     false,
                completed_at:  null,
                assigned_date: weekStart,   // Monday date as key
            }))
        );
        console.log(`📋 Weekly missions assigned for week of ${weekStart}`);
    }

    return { daily: existingDaily, weekly: existingWeekly };
};

// ─── Complete a daily mission ─────────────────────────────────────────────────
const completeMission = async (userId, missionKey, type = 'daily') => {
    const dateKey = type === 'weekly'
        ? getWeekStart()
        : new Date().toISOString().split('T')[0];

    const mission = await DailyMission.findOne({
        where: {
            user_id:       userId,
            mission_key:   missionKey,
            assigned_date: dateKey,
            mission_type:  type,
            completed:     false,
        },
    });

    if (!mission) return null;

    await mission.update({
        completed:    true,
        completed_at: new Date(),
        progress:     mission.target,
    });

    return mission;
};

// ─── Update weekly mission progress ──────────────────────────────────────────
const updateWeeklyProgress = async (userId, missionKey, incrementBy = 1) => {
    const weekStart = getWeekStart();

    const mission = await DailyMission.findOne({
        where: {
            user_id:       userId,
            mission_key:   missionKey,
            assigned_date: weekStart,
            mission_type:  'weekly',
            completed:     false,
        },
    });

    if (!mission) return null;

    const newProgress = Math.min(mission.progress + incrementBy, mission.target);
    const completed   = newProgress >= mission.target;

    await mission.update({
        progress:     newProgress,
        completed,
        completed_at: completed ? new Date() : null,
    });

    return { mission, completed, newProgress };
};

// ─── Check missions after game ────────────────────────────────────────────────
const checkMissionsAfterGame = async (userId, context) => {
    const {
        won                    = false,
        isSpeedMode            = false,
        timeTaken              = null,
        totalGamesToday        = 0,
        totalSpeedGamesToday   = 0,
        totalClassicGamesToday = 0,
        classicWonToday        = false,
        speedWonToday          = false,
        attempts               = 0,
        currentStreak          = 0,
    } = context;

    const { awardXP }       = require('./xpCalculator');
    const completedMissions = [];

    // ── Helper to complete and award ──────────────────────────────────
    const tryComplete = async (key, xpDesc, type = 'daily') => {
        const mission = await completeMission(userId, key, type);
        if (mission) {
            await awardXP(userId, 'streak_bonus', mission.xp_reward, xpDesc);
            completedMissions.push({ ...mission.toJSON(), justCompleted: true });
        }
    };

    // ── Helper to update weekly progress and check completion ─────────
    const tryWeeklyProgress = async (key, increment, xpDesc) => {
        const result = await updateWeeklyProgress(userId, key, increment);
        if (result?.completed) {
            await awardXP(userId, 'streak_bonus', result.mission.xp_reward, xpDesc);
            completedMissions.push({ ...result.mission.toJSON(), justCompleted: true });
        }
        return result;
    };

    // ════════════════════════════════════════════════════════════════
    // ── DAILY MISSIONS ────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════

    // ── Classic daily missions ────────────────────────────────────────
    if (!isSpeedMode) {
        await tryComplete('classic_play_today', 'Mission: Play classic mode today');

        if (won) {
            await tryComplete('classic_win_today',      'Mission: Win classic mode today');
            if (attempts <= 3)
                await tryComplete('classic_win_3_attempts', 'Mission: Win classic in 3 attempts or less');
            if (attempts === 1)
                await tryComplete('classic_win_1_attempt',  'Mission: Win classic in 1 attempt');
        }
    }

    // ── Speed daily missions ──────────────────────────────────────────
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

    // ── Combined daily missions ───────────────────────────────────────
    if (totalGamesToday >= 2)
        await tryComplete('play_2_games_any_mode', 'Mission: Play 2 games today');
    if (totalGamesToday >= 3)
        await tryComplete('play_3_games_any_mode', 'Mission: Play 3 games today');
    if (classicWonToday && speedWonToday)
        await tryComplete('win_both_modes_today',  'Mission: Win both modes today');

    // ════════════════════════════════════════════════════════════════
    // ── WEEKLY MISSIONS ───────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════

    // ── Win 5 games this week ─────────────────────────────────────────
    if (won) {
        await tryWeeklyProgress(
            'win_5_games_this_week',
            1,
            'Weekly Mission: Win 5 games this week'
        );
    }

    // ── Maintain 7 day streak ─────────────────────────────────────────
    if (currentStreak >= 7) {
        await tryComplete(
            'maintain_7_day_streak',
            'Weekly Mission: 7 day streak achieved',
            'weekly'
        );
    } else if (currentStreak > 0) {
        // Update progress toward 7 day streak
        const weeklyStreakMission = await DailyMission.findOne({
            where: {
                user_id:       userId,
                mission_key:   'maintain_7_day_streak',
                assigned_date: getWeekStart(),
                mission_type:  'weekly',
                completed:     false,
            },
        });

        if (weeklyStreakMission) {
            await weeklyStreakMission.update({
                progress: Math.min(currentStreak, 7),
            });
        }
    }

    return completedMissions;
};

// ─── Get all missions for user ────────────────────────────────────────────────
const getUserMissions = async (userId) => {
    const today     = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart();

    const daily = await DailyMission.findAll({
        where: {
            user_id:       userId,
            assigned_date: today,
            mission_type:  'daily',
        },
        order: [['id', 'ASC']],
    });

    const weekly = await DailyMission.findAll({
        where: {
            user_id:       userId,
            assigned_date: weekStart,
            mission_type:  'weekly',
        },
        order: [['id', 'ASC']],
    });

    return { daily, weekly };
};

module.exports = {
    MISSION_POOL,
    WEEKLY_MISSIONS,
    assignDailyMissions,
    checkMissionsAfterGame,
    pickTodaysMissions,
    getWeekStart,
    getUserMissions,
};