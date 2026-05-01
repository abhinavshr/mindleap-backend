const { UserBadge } = require('../models');

const BADGES = [
    { key: 'first_game',    name: 'First Step',       description: 'Play your first game'            },
    { key: 'first_win',     name: 'First Victory',    description: 'Win your first game'             },
    { key: 'speed_demon',   name: 'Speed Demon',      description: 'Win speed mode under 15 seconds' },
    { key: 'big_brain',     name: 'Big Brain',        description: 'Win in 1 guess'                  },
    { key: 'on_fire',       name: 'On Fire',          description: 'Achieve a 7 day streak'          },
    { key: 'unstoppable',   name: 'Unstoppable',      description: 'Achieve a 30 day streak'         },
    { key: 'level_10',      name: 'Rising Star',      description: 'Reach Level 10'                  },
    { key: 'level_25',      name: 'Halfway There',    description: 'Reach Level 25'                  },
    { key: 'level_50',      name: 'MindLeap Master',  description: 'Reach Level 50'                  },
    { key: 'century',       name: 'Century Club',     description: 'Play 100 games'                  },
    { key: 'perfectionist', name: 'Perfectionist',    description: 'Win 10 games in 1 guess'         },
    { key: 'speedster',     name: 'Speedster',        description: 'Win 10 speed games'              },
];

// ─── Check and award badges ───────────────────────────────────────────────────
const checkAndAwardBadges = async (userId, context) => {
    const {
        won        = false,
        attempts   = 0,
        timeTaken  = null,
        streak     = 0,
        totalGames = 0,
        level      = 1,
        isSpeedWin = false,
        speedWins  = 0,
        totalWinsIn1 = 0,
    } = context;

    const newlyEarned = [];

    // ── Get already earned badges ─────────────────────────────────────
    const existing = await UserBadge.findAll({ where: { user_id: userId } });
    const earned   = existing.map(b => b.badge_key);

    const award = async (key) => {
        if (earned.includes(key)) return;
        const badge = BADGES.find(b => b.key === key);
        if (!badge) return;
        await UserBadge.create({
            user_id:    userId,
            badge_key:  badge.key,
            badge_name: badge.name,
        });
        newlyEarned.push(badge);
    };

    // ── Check conditions ──────────────────────────────────────────────
    if (totalGames >= 1)                          await award('first_game');
    if (won)                                      await award('first_win');
    if (won && attempts === 1)                    await award('big_brain');
    if (isSpeedWin && timeTaken <= 15)            await award('speed_demon');
    if (streak >= 7)                              await award('on_fire');
    if (streak >= 30)                             await award('unstoppable');
    if (level >= 10)                              await award('level_10');
    if (level >= 25)                              await award('level_25');
    if (level >= 50)                              await award('level_50');
    if (totalGames >= 100)                        await award('century');
    if (totalWinsIn1 >= 10)                       await award('perfectionist');
    if (speedWins >= 10)                          await award('speedster');

    return newlyEarned;
};

module.exports = { BADGES, checkAndAwardBadges };