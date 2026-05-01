const { Op } = require("sequelize");
const { pickRandomWord } = require("../utils/wordSelector");
const { calculateXP } = require("../utils/xpCalculator");

const {
  User,
  Word,
  SpeedSession,
  SpeedGame,
  SpeedLeaderboard,
} = require("../models");

const SPEED_TIME_LIMIT = 60;
const MAX_GUESSES = 6;

const evaluateGuess = (guess, answer) => {
  const result = Array(5).fill("absent");
  const answerArr = answer.split("");
  const guessArr = guess.split("");

  guessArr.forEach((letter, i) => {
    if (letter === answerArr[i]) {
      result[i] = "correct";
      answerArr[i] = null;
      guessArr[i] = null;
    }
  });

  guessArr.forEach((letter, i) => {
    if (!letter) return;
    const foundIndex = answerArr.indexOf(letter);
    if (foundIndex !== -1) {
      result[i] = "present";
      answerArr[foundIndex] = null;
    }
  });

  return result;
};

const saveSpeedGame = async (
  userId,
  wordId,
  sessionId,
  guesses,
  won,
  attempts,
  timeTaken,
  xpEarned,
) => {
  return await SpeedGame.create({
    user_id: userId,
    word_id: wordId,
    session_id: sessionId,
    guesses,
    won,
    attempts,
    time_taken: timeTaken,
    xp_earned: xpEarned,
  });
};

const updateSpeedLeaderboard = async (
  userId,
  won,
  timeTaken,
  attempts,
  xpEarned,
) => {
  let board = await SpeedLeaderboard.findOne({ where: { user_id: userId } });

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (!board) {
    return await SpeedLeaderboard.create({
      user_id: userId,
      total_speed_wins: won ? 1 : 0,
      total_speed_games: 1,
      best_time: won ? timeTaken : null,
      avg_time: won ? timeTaken : 0,
      avg_attempts: won ? attempts : 0,
      total_xp: xpEarned,
      current_streak: won ? 1 : 0,
      max_streak: won ? 1 : 0,
      last_played: today,
    });
  }

  const newTotalGames = board.total_speed_games + 1;
  const newTotalXP = board.total_xp + xpEarned;

  let newTotalWins = board.total_speed_wins;
  let newBestTime = board.best_time;
  let newAvgTime = parseFloat(board.avg_time);
  let newAvgAttempts = parseFloat(board.avg_attempts);
  let newStreak = board.current_streak;
  let newMaxStreak = board.max_streak;

  if (won) {
    newTotalWins = board.total_speed_wins + 1;

    // ── Update best time ──────────────────────────────────────────
    if (board.best_time === null || timeTaken < board.best_time) {
      newBestTime = timeTaken;
    }

    // ── Update avg time ───────────────────────────────────────────
    newAvgTime = parseFloat(
      (
        (board.avg_time * board.total_speed_wins + timeTaken) /
        newTotalWins
      ).toFixed(2),
    );

    // ── Update avg attempts ───────────────────────────────────────
    newAvgAttempts = parseFloat(
      (
        (board.avg_attempts * board.total_speed_wins + attempts) /
        newTotalWins
      ).toFixed(2),
    );

    // ── Update streak ─────────────────────────────────────────────
    const lastPlayed = board.last_played
      ? new Date(board.last_played).toISOString().split("T")[0]
      : null;

    newStreak = lastPlayed === yesterday ? board.current_streak + 1 : 1;
    newMaxStreak = Math.max(board.max_streak, newStreak);
  } else {
    newStreak = 0;
  }

  await board.update({
    total_speed_wins: newTotalWins,
    total_speed_games: newTotalGames,
    best_time: newBestTime,
    avg_time: newAvgTime,
    avg_attempts: newAvgAttempts,
    total_xp: newTotalXP,
    current_streak: newStreak,
    max_streak: newMaxStreak,
    last_played: today,
    updated_at: new Date(),
  });

  return board;
};

const startSpeedSession = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── Check for existing active session ─────────────────────────
    const existingSession = await SpeedSession.findOne({
      where: { user_id: userId, status: "active" },
      include: [{ model: Word }],
    });

    if (existingSession) {
      const now = new Date();
      const started = new Date(existingSession.started_at);
      const elapsed = Math.floor((now - started) / 1000);
      const timeLeft = SPEED_TIME_LIMIT - elapsed;

      if (elapsed > SPEED_TIME_LIMIT) {
        await existingSession.update({ status: "expired" });
      } else {
        return res.status(200).json({
          sessionId: existingSession.id,
          timeLeft,
          wordLength: 5,
          maxGuesses: MAX_GUESSES,
          resumed: true,
        });
      }
    }

    // ── Pick a random word for speed mode ─────────────────────────
    const word = await pickRandomWord();
    if (!word) {
      return res
        .status(503)
        .json({ message: "No words available. Please try again." });
    }

    // ── Create new session ────────────────────────────────────────
    const session = await SpeedSession.create({
      user_id: userId,
      word_id: word.id,
      started_at: new Date(),
      status: "active",
    });

    return res.status(201).json({
      sessionId: session.id,
      timeLeft: SPEED_TIME_LIMIT,
      wordLength: 5,
      maxGuesses: MAX_GUESSES,
      resumed: false,
    });
  } catch (err) {
    console.error("StartSpeedSession error:", err.message);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

const getSpeedLeaderboard = async (req, res) => {
  try {
    const leaderboard = await SpeedLeaderboard.findAll({
      limit: 20,
      order: [
        ["total_speed_wins", "DESC"],
        ["best_time", "ASC"],
      ],
      include: [
        {
          model: User,
          attributes: ["username"],
        },
      ],
    });

    const ranked = leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.User.username,
      total_speed_wins: entry.total_speed_wins,
      total_speed_games: entry.total_speed_games,
      best_time: entry.best_time,
      avg_time: entry.avg_time,
      avg_attempts: entry.avg_attempts,
      total_xp: entry.total_xp,
      current_streak: entry.current_streak,
      max_streak: entry.max_streak,
      last_played: entry.last_played,
      win_rate:
        entry.total_speed_games > 0
          ? parseFloat(
              (
                (entry.total_speed_wins / entry.total_speed_games) *
                100
              ).toFixed(1),
            )
          : 0,
    }));

    return res.status(200).json({ success: true, data: ranked });
  } catch (err) {
    console.error("GetSpeedLeaderboard error:", err.message);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

const submitSpeedGuess = async (req, res) => {
  try {
    const { sessionId, guess, attempts } = req.body;

    // ── Validate input ────────────────────────────────────────────
    if (!sessionId || !guess || !attempts)
      return res
        .status(400)
        .json({ message: "sessionId, guess and attempts are required." });

    if (guess.length !== 5)
      return res
        .status(400)
        .json({ message: "Guess must be exactly 5 letters." });

    if (!/^[a-zA-Z]+$/.test(guess))
      return res
        .status(400)
        .json({ message: "Guess must contain only letters." });

    // ── Check if guess is a valid word in the words table ─────────
    const normalizedGuess = guess.toLowerCase().trim();

    const validWord = await Word.findOne({ where: { word: normalizedGuess } });
    if (!validWord) {
      return res
        .status(400)
        .json({ message: "Not a valid word. Please try again." });
    }

    // ── Find session ──────────────────────────────────────────────
    const session = await SpeedSession.findOne({
      where: { id: sessionId, user_id: req.user.id },
      include: [{ model: Word }],
    });

    if (!session)
      return res.status(404).json({ message: "Session not found." });

    if (session.status !== "active")
      return res
        .status(400)
        .json({ message: "Session already ended.", status: session.status });

    // ── Check if time is up ───────────────────────────────────────
    const now = new Date();
    const started = new Date(session.started_at);
    const elapsed = Math.floor((now - started) / 1000);

    if (elapsed > SPEED_TIME_LIMIT) {
      await session.update({ status: "expired" });
      return res.status(200).json({
        timeUp: true,
        secret: session.Word.word,
      });
    }

    // ── Evaluate guess ────────────────────────────────────────────
    const secret = session.Word.word.toLowerCase();
    const result = evaluateGuess(normalizedGuess, secret);
    const won = normalizedGuess === secret;
    const timeTaken = elapsed;

    // ── Won ───────────────────────────────────────────────────────
    if (won) {
      const xpEarned = calculateXP(timeTaken, attempts);

      await session.update({ status: "won" });

      await saveSpeedGame(
        req.user.id,
        session.word_id,
        session.id,
        [{ guess: normalizedGuess, result }],
        true,
        attempts,
        timeTaken,
        xpEarned,
      );

      await updateSpeedLeaderboard(
        req.user.id,
        true,
        timeTaken,
        attempts,
        xpEarned,
      );

      return res.status(200).json({
        result,
        won: true,
        timeTaken,
        xpEarned,
        secret,
      });
    }

    // ── Lost — used all guesses ───────────────────────────────────
    if (attempts >= MAX_GUESSES) {
      await session.update({ status: "lost" });

      await saveSpeedGame(
        req.user.id,
        session.word_id,
        session.id,
        [{ guess: normalizedGuess, result }],
        false,
        attempts,
        timeTaken,
        0,
      );

      await updateSpeedLeaderboard(req.user.id, false, timeTaken, attempts, 0);

      return res.status(200).json({
        result,
        won: false,
        lost: true,
        secret,
      });
    }

    // ── Still has guesses ─────────────────────────────────────────
    return res.status(200).json({
      result,
      won: false,
      timeLeft: SPEED_TIME_LIMIT - elapsed,
      attempts,
    });
  } catch (err) {
    console.error("SubmitSpeedGuess error:", err.message);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

const getMySpeedStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── Get personal stats ────────────────────────────────────────
    const stats = await SpeedLeaderboard.findOne({
      where: { user_id: userId },
    });

    // ── Get last 10 games ─────────────────────────────────────────
    const recentGames = await SpeedGame.findAll({
      where: { user_id: userId },
      limit: 10,
      order: [["played_at", "DESC"]],
      include: [{ model: Word, attributes: ["word"] }],
    });

    // ── Calculate rank ────────────────────────────────────────────
    const allEntries = await SpeedLeaderboard.findAll({
      order: [
        ["total_speed_wins", "DESC"],
        ["best_time", "ASC"],
      ],
    });

    const rankIndex = allEntries.findIndex((e) => e.user_id === userId);
    const myRank = rankIndex === -1 ? null : rankIndex + 1;

    return res.status(200).json({
      rank: myRank,
      stats: stats || null,
      recentGames: recentGames.map((g) => ({
        word: g.Word.word,
        won: g.won,
        attempts: g.attempts,
        time_taken: g.time_taken,
        xp_earned: g.xp_earned,
        played_at: g.played_at,
      })),
    });
  } catch (err) {
    console.error("GetMySpeedStats error:", err.message);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = {
  startSpeedSession,
  submitSpeedGuess,
  getSpeedLeaderboard,
  getMySpeedStats,
};
