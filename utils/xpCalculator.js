// ─── Calculate XP based on time taken and attempts ────────────────────────────
const calculateXP = (timeTaken, attempts) => {

    // ── Base XP from time taken ───────────────────────────────────────
    let baseXP = 0;

    if      (timeTaken >= 0  && timeTaken <= 15) baseXP = 150;
    else if (timeTaken >= 16 && timeTaken <= 30) baseXP = 120;
    else if (timeTaken >= 31 && timeTaken <= 45) baseXP = 90;
    else if (timeTaken >= 46 && timeTaken <= 60) baseXP = 60;
    else                                          baseXP = 0;  

    // ── Bonus XP from attempts ────────────────────────────────────────
    let bonusXP = 0;

    if      (attempts === 1) bonusXP = 50;
    else if (attempts === 2) bonusXP = 30;
    else if (attempts === 3) bonusXP = 20;
    else if (attempts === 4) bonusXP = 10;
    else                     bonusXP = 0;   5

    const totalXP = baseXP + bonusXP;

    console.log(`⚡ XP Calculated — Time: ${timeTaken}s | Attempts: ${attempts} | Base: ${baseXP} | Bonus: ${bonusXP} | Total: ${totalXP}`);

    return totalXP;
};

module.exports = { calculateXP };