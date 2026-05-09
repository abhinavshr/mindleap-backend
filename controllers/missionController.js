const { assignDailyMissions, DAILY_MISSIONS } = require('../utils/missionChecker');
const DailyMission                             = require('../models/DailyMission');

// ─── Get today's missions ─────────────────────────────────────────────────────
const getMyMissions = async (req, res) => {
    try {
        const userId = req.user.id;
        const today  = new Date().toISOString().split('T')[0];

        // Assign missions if not already assigned
        await assignDailyMissions(userId);

        const missions = await DailyMission.findAll({
            where: {
                user_id:       userId,
                assigned_date: today,
            },
            order: [['id', 'ASC']],
        });

        const completed = missions.filter(m => m.completed).length;
        const totalXpAvailable = missions.reduce((sum, m) => sum + m.xp_reward, 0);
        const totalXpEarned    = missions
            .filter(m => m.completed)
            .reduce((sum, m) => sum + m.xp_reward, 0);

        return res.status(200).json({
            date:            today,
            completed:       completed,
            total:           missions.length,
            totalXpAvailable,
            totalXpEarned,
            missions:        missions.map(m => ({
                mission_key:  m.mission_key,
                mission_name: m.mission_name,
                description:  m.description,
                xp_reward:    m.xp_reward,
                completed:    m.completed,
                completed_at: m.completed_at,
            })),
        });

    } catch (err) {
        console.error('GetMyMissions error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = { getMyMissions };