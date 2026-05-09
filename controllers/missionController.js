const { assignDailyMissions, getUserMissions, getWeekStart } = require('../utils/missionChecker');

// ─── Get all missions ─────────────────────────────────────────────────────────
const getMyMissions = async (req, res) => {
    try {
        const userId    = req.user.id;
        const today     = new Date().toISOString().split('T')[0];
        const weekStart = getWeekStart();

        // Assign if not already
        await assignDailyMissions(userId);

        const { daily, weekly } = await getUserMissions(userId);

        // ── Daily stats ───────────────────────────────────────────────
        const dailyCompleted      = daily.filter(m => m.completed).length;
        const dailyXpAvailable    = daily.reduce((sum, m) => sum + m.xp_reward, 0);
        const dailyXpEarned       = daily.filter(m => m.completed).reduce((sum, m) => sum + m.xp_reward, 0);

        // ── Weekly stats ──────────────────────────────────────────────
        const weeklyCompleted     = weekly.filter(m => m.completed).length;
        const weeklyXpAvailable   = weekly.reduce((sum, m) => sum + m.xp_reward, 0);
        const weeklyXpEarned      = weekly.filter(m => m.completed).reduce((sum, m) => sum + m.xp_reward, 0);

        // ── Days until reset ──────────────────────────────────────────
        const now        = new Date();
        const nextMonday = new Date(weekStart);
        nextMonday.setDate(nextMonday.getDate() + 7);
        const daysUntilReset = Math.ceil((nextMonday - now) / (1000 * 60 * 60 * 24));

        return res.status(200).json({
            date:     today,
            weekStart,

            daily: {
                completed:      dailyCompleted,
                total:          daily.length,
                xpAvailable:    dailyXpAvailable,
                xpEarned:       dailyXpEarned,
                missions:       daily.map(m => ({
                    mission_key:  m.mission_key,
                    mission_name: m.mission_name,
                    description:  m.description,
                    xp_reward:    m.xp_reward,
                    progress:     m.progress,
                    target:       m.target,
                    completed:    m.completed,
                    completed_at: m.completed_at,
                })),
            },

            weekly: {
                completed:      weeklyCompleted,
                total:          weekly.length,
                xpAvailable:    weeklyXpAvailable,
                xpEarned:       weeklyXpEarned,
                daysUntilReset,
                weekResetsOn:   nextMonday.toISOString().split('T')[0],
                missions:       weekly.map(m => ({
                    mission_key:  m.mission_key,
                    mission_name: m.mission_name,
                    description:  m.description,
                    xp_reward:    m.xp_reward,
                    progress:     m.progress,
                    target:       m.target,
                    completed:    m.completed,
                    completed_at: m.completed_at,
                })),
            },
        });

    } catch (err) {
        console.error('GetMyMissions error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = { getMyMissions };