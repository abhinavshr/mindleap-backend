const LEVELS = [
    { level: 1,  title: 'Beginner',          totalXpNeeded: 0      },
    { level: 2,  title: 'Novice',            totalXpNeeded: 100    },
    { level: 3,  title: 'Learner',           totalXpNeeded: 300    },
    { level: 4,  title: 'Thinker',           totalXpNeeded: 600    },
    { level: 5,  title: 'Explorer',          totalXpNeeded: 1000   },
    { level: 6,  title: 'Solver',            totalXpNeeded: 1500   },
    { level: 7,  title: 'Wordsmith',         totalXpNeeded: 2100   },
    { level: 8,  title: 'Challenger',        totalXpNeeded: 2800   },
    { level: 9,  title: 'Strategist',        totalXpNeeded: 3600   },
    { level: 10, title: 'Sharpshooter',      totalXpNeeded: 4600   },
    { level: 11, title: 'Veteran I',         totalXpNeeded: 5800   },
    { level: 12, title: 'Veteran II',        totalXpNeeded: 7000   },
    { level: 13, title: 'Veteran III',       totalXpNeeded: 8200   },
    { level: 14, title: 'Veteran IV',        totalXpNeeded: 9400   },
    { level: 15, title: 'Veteran V',         totalXpNeeded: 10600  },
    { level: 16, title: 'Veteran VI',        totalXpNeeded: 11800  },
    { level: 17, title: 'Veteran VII',       totalXpNeeded: 13000  },
    { level: 18, title: 'Veteran VIII',      totalXpNeeded: 14200  },
    { level: 19, title: 'Veteran IX',        totalXpNeeded: 15400  },
    { level: 20, title: 'Elite',             totalXpNeeded: 20000  },
    { level: 21, title: 'Master I',          totalXpNeeded: 23000  },
    { level: 22, title: 'Master II',         totalXpNeeded: 26000  },
    { level: 23, title: 'Master III',        totalXpNeeded: 29000  },
    { level: 24, title: 'Master IV',         totalXpNeeded: 32000  },
    { level: 25, title: 'Master V',          totalXpNeeded: 35000  },
    { level: 26, title: 'Master VI',         totalXpNeeded: 38000  },
    { level: 27, title: 'Master VII',        totalXpNeeded: 41000  },
    { level: 28, title: 'Master VIII',       totalXpNeeded: 44000  },
    { level: 29, title: 'Master IX',         totalXpNeeded: 47000  },
    { level: 30, title: 'Legend',            totalXpNeeded: 50000  },
    { level: 31, title: 'Grandmaster I',     totalXpNeeded: 54000  },
    { level: 32, title: 'Grandmaster II',    totalXpNeeded: 58000  },
    { level: 33, title: 'Grandmaster III',   totalXpNeeded: 62000  },
    { level: 34, title: 'Grandmaster IV',    totalXpNeeded: 66000  },
    { level: 35, title: 'Grandmaster V',     totalXpNeeded: 70000  },
    { level: 36, title: 'Grandmaster VI',    totalXpNeeded: 74000  },
    { level: 37, title: 'Grandmaster VII',   totalXpNeeded: 78000  },
    { level: 38, title: 'Grandmaster VIII',  totalXpNeeded: 82000  },
    { level: 39, title: 'Grandmaster IX',    totalXpNeeded: 86000  },
    { level: 40, title: 'Champion',          totalXpNeeded: 90000  },
    { level: 41, title: 'Mythic I',          totalXpNeeded: 95000  },
    { level: 42, title: 'Mythic II',         totalXpNeeded: 100000 },
    { level: 43, title: 'Mythic III',        totalXpNeeded: 105000 },
    { level: 44, title: 'Mythic IV',         totalXpNeeded: 110000 },
    { level: 45, title: 'Mythic V',          totalXpNeeded: 115000 },
    { level: 46, title: 'Mythic VI',         totalXpNeeded: 120000 },
    { level: 47, title: 'Mythic VII',        totalXpNeeded: 125000 },
    { level: 48, title: 'Mythic VIII',       totalXpNeeded: 130000 },
    { level: 49, title: 'Mythic IX',         totalXpNeeded: 135000 },
    { level: 50, title: 'MindLeap Master',   totalXpNeeded: 150000 },
];

// ─── Get level info from total XP ────────────────────────────────────────────
const getLevelFromXP = (totalXp) => {
    let currentLevel = LEVELS[0];

    for (let i = 0; i < LEVELS.length; i++) {
        if (totalXp >= LEVELS[i].totalXpNeeded) {
            currentLevel = LEVELS[i];
        } else {
            break;
        }
    }

    const nextLevel        = LEVELS.find(l => l.level === currentLevel.level + 1);
    const currentLevelXp   = totalXp - currentLevel.totalXpNeeded;
    const nextLevelXp      = nextLevel ? nextLevel.totalXpNeeded - currentLevel.totalXpNeeded : 0;
    const xpToNextLevel    = nextLevel ? nextLevel.totalXpNeeded - totalXp : 0;
    const progressPercent  = nextLevel
        ? Math.min(parseFloat(((currentLevelXp / nextLevelXp) * 100).toFixed(1)), 100)
        : 100;

    return {
        level:           currentLevel.level,
        title:           currentLevel.title,
        totalXp,
        currentLevelXp,
        nextLevelXp,
        xpToNextLevel:   Math.max(xpToNextLevel, 0),
        progressPercent,
        isMaxLevel:      currentLevel.level === 50,
    };
};

// ─── Get XP needed for next level ────────────────────────────────────────────
const getXPForNextLevel = (currentLevel) => {
    const next = LEVELS.find(l => l.level === currentLevel + 1);
    return next ? next.totalXpNeeded : null;
};

// ─── Check if user leveled up ─────────────────────────────────────────────────
const checkLevelUp = (oldXp, newXp) => {
    const oldLevel = getLevelFromXP(oldXp);
    const newLevel = getLevelFromXP(newXp);

    if (newLevel.level > oldLevel.level) {
        return {
            leveledUp: true,
            oldLevel:  oldLevel.level,
            newLevel:  newLevel.level,
            newTitle:  newLevel.title,
        };
    }

    return { leveledUp: false };
};

module.exports = { LEVELS, getLevelFromXP, getXPForNextLevel, checkLevelUp };