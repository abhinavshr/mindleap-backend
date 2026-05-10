const StreakMilestone = require('../models/StreakMilestone');
const { UserBadge }   = require('../models');

// ─── Classic streak milestones ────────────────────────────────────────────────
const CLASSIC_MILESTONES = [
    {
        streak:   3,
        title:    'Warm Up 🔥',
        xp:       20,
        badge:    null,
        reward:   null,
    },
    {
        streak:   7,
        title:    'On Fire 🔥🔥',
        xp:       50,
        badge:    { key: 'classic_streak_7',   name: 'On Fire',          type: 'classic' },
        reward:   null,
    },
    {
        streak:   14,
        title:    'Unstoppable 💪',
        xp:       100,
        badge:    { key: 'classic_streak_14',  name: 'Unstoppable',      type: 'classic' },
        reward:   null,
    },
    {
        streak:   21,
        title:    'Obsessed 😤',
        xp:       150,
        badge:    { key: 'classic_streak_21',  name: 'Obsessed',         type: 'classic' },
        reward:   { type: 'theme', value: 'neon_theme' },
    },
    {
        streak:   30,
        title:    'Legendary 👑',
        xp:       300,
        badge:    { key: 'classic_streak_30',  name: 'Legendary',        type: 'classic' },
        reward:   { type: 'title', value: 'gold_title' },
    },
    {
        streak:   50,
        title:    'Mythic ⚡',
        xp:       500,
        badge:    { key: 'classic_streak_50',  name: 'Mythic',           type: 'classic' },
        reward:   { type: 'theme', value: 'mythic_theme' },
    },
    {
        streak:   100,
        title:    'MindLeap God 🧠',
        xp:       1000,
        badge:    { key: 'classic_streak_100', name: 'MindLeap God',     type: 'classic' },
        reward:   { type: 'badge_frame', value: 'exclusive_avatar_frame' },
    },
    {
        streak:   365,
        title:    'Eternal Master 🌟',
        xp:       5000,
        badge:    { key: 'classic_streak_365', name: 'Eternal Master',   type: 'classic' },
        reward:   { type: 'title', value: 'hall_of_fame' },
    },
];

// ─── Speed streak milestones ──────────────────────────────────────────────────
const SPEED_MILESTONES = [
    {
        streak:   3,
        title:    'Speed Starter ⚡',
        xp:       30,
        badge:    null,
        reward:   null,
    },
    {
        streak:   7,
        title:    'Lightning ⚡⚡',
        xp:       60,
        badge:    { key: 'speed_streak_7',   name: 'Lightning',        type: 'speed' },
        reward:   null,
    },
    {
        streak:   14,
        title:    'Blazing 🔥',
        xp:       120,
        badge:    { key: 'speed_streak_14',  name: 'Blazing',          type: 'speed' },
        reward:   null,
    },
    {
        streak:   30,
        title:    'Sonic 🚀',
        xp:       400,
        badge:    { key: 'speed_streak_30',  name: 'Sonic',            type: 'speed' },
        reward:   { type: 'theme', value: 'speed_theme' },
    },
    {
        streak:   60,
        title:    'Hypersonic 💫',
        xp:       800,
        badge:    { key: 'speed_streak_60',  name: 'Hypersonic',       type: 'speed' },
        reward:   { type: 'title', value: 'hypersonic_title' },
    },
    {
        streak:   100,
        title:    'Speed Legend 🌟',
        xp:       1500,
        badge:    { key: 'speed_streak_100', name: 'Speed Legend',     type: 'speed' },
        reward:   null,
    },
];

// ─── Combined streak milestones ───────────────────────────────────────────────
const COMBINED_MILESTONES = [
    {
        streak:   7,
        title:    'Double Threat 🎯',
        xp:       100,
        badge:    null,
        reward:   null,
    },
    {
        streak:   14,
        title:    'Dual Master 🏆',
        xp:       200,
        badge:    { key: 'combined_streak_14', name: 'Dual Master',    type: 'combined' },
        reward:   null,
    },
    {
        streak:   30,
        title:    'Ultimate Player 👑',
        xp:       500,
        badge:    { key: 'combined_streak_30', name: 'Ultimate Player', type: 'combined' },
        reward:   { type: 'badge_frame', value: 'special_frame' },
    },
];

// ─── Check and award streak milestone ────────────────────────────────────────
const checkStreakMilestone = async (userId, streak, mode) => {
    const { awardXP }    = require('./xpCalculator');
    const { UserReward } = require('../models');

    const milestones = mode === 'classic'
        ? CLASSIC_MILESTONES
        : mode === 'speed'
        ? SPEED_MILESTONES
        : COMBINED_MILESTONES;

    // ── Find matching milestone ───────────────────────────────────────
    const milestone = milestones.find(m => m.streak === streak);
    if (!milestone) return null;

    // ── Check if already awarded ──────────────────────────────────────
    const alreadyAwarded = await StreakMilestone.findOne({
        where: {
            user_id:        userId,
            mode,
            streak_reached: streak,
        },
    });

    if (alreadyAwarded) return null;

    // ── Save milestone record ─────────────────────────────────────────
    await StreakMilestone.create({
        user_id:         userId,
        mode,
        streak_reached:  streak,
        milestone_title: milestone.title,
        xp_awarded:      milestone.xp,
    });

    // ── Award XP ──────────────────────────────────────────────────────
    await awardXP(
        userId,
        'streak_bonus',
        milestone.xp,
        `${mode} streak milestone: ${milestone.title} (${streak} days)`,
    );

    // ── Award badge ───────────────────────────────────────────────────
    if (milestone.badge) {
        const existingBadge = await UserBadge.findOne({
            where: { user_id: userId, badge_key: milestone.badge.key },
        });

        if (!existingBadge) {
            await UserBadge.create({
                user_id:    userId,
                badge_key:  milestone.badge.key,
                badge_name: milestone.badge.name,
            });
        }
    }

    // ── Unlock reward ─────────────────────────────────────────────────
    if (milestone.reward) {
        const existingReward = await UserReward.findOne({
            where: {
                user_id:      userId,
                reward_type:  milestone.reward.type,
                reward_value: milestone.reward.value,
            },
        });

        if (!existingReward) {
            await UserReward.create({
                user_id:      userId,
                reward_type:  milestone.reward.type,
                reward_value: milestone.reward.value,
            });
        }
    }

    return {
        milestone: milestone.title,
        streak,
        mode,
        xpAwarded: milestone.xp,
        badge:     milestone.badge     || null,
        reward:    milestone.reward    || null,
    };
};

// ─── Check all milestones for a streak value ──────────────────────────────────
const checkAllStreakMilestones = async (userId, classicStreak, speedStreak, combinedStreak) => {
    const results = [];

    // ── Classic milestones ────────────────────────────────────────────
    if (classicStreak > 0) {
        const result = await checkStreakMilestone(userId, classicStreak, 'classic');
        if (result) results.push(result);
    }

    // ── Speed milestones ──────────────────────────────────────────────
    if (speedStreak > 0) {
        const result = await checkStreakMilestone(userId, speedStreak, 'speed');
        if (result) results.push(result);
    }

    // ── Combined milestones ───────────────────────────────────────────
    if (combinedStreak > 0) {
        const result = await checkStreakMilestone(userId, combinedStreak, 'combined');
        if (result) results.push(result);
    }

    return results;
};

// ─── Get user's streak milestone history ──────────────────────────────────────
const getUserMilestones = async (userId) => {
    return await StreakMilestone.findAll({
        where: { user_id: userId },
        order: [['reached_at', 'DESC']],
    });
};

module.exports = {
    CLASSIC_MILESTONES,
    SPEED_MILESTONES,
    COMBINED_MILESTONES,
    checkStreakMilestone,
    checkAllStreakMilestones,
    getUserMilestones,
};