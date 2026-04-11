require('dotenv').config();
const sequelize = require('../config/db');
const Word      = require('../models/Word');

const words = [
    "about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult",
    "after", "again", "agent", "agree", "ahead", "alarm", "album", "alert",
    "alike", "align", "alive", "alley", "allow", "alone", "along", "aloud",
    "alter", "angel", "anger", "angle", "angry", "anime", "ankle", "annex",
    "antic", "anvil", "aorta", "apart", "apple", "apply", "apron", "argue",
    "arise", "armor", "army",  "aroma", "arose", "array", "arrow", "aside",
    "asked", "asset", "atlas", "attic", "audio", "audit", "augur", "aunts",
    "avail", "avoid", "awake", "award", "aware", "awful", "awoke", "axial",

    "badge", "balls", "bands", "banjo", "banks", "baron", "basic", "basin",
    "basis", "batch", "beach", "beard", "beast", "began", "begin", "being",
    "below", "bench", "bible", "birth", "black", "blade", "blame", "bland",
    "blank", "blare", "blast", "blaze", "bleak", "bleed", "blend", "bless",
    "blind", "block", "blood", "bloom", "blown", "blunt", "blurb", "blurt",
    "board", "bonus", "boost", "booth", "bound", "boxer", "brace", "brain",
    "brand", "brave", "bread", "break", "breed", "brick", "bride", "brief",
    "bring", "brisk", "broad", "broke", "brook", "broom", "brown", "brush",
    "build", "built", "bulge", "bunch", "burnt", "burst", "buyer", "bylaw",

    "cabin", "cable", "camel", "canal", "candy", "cargo", "carry", "catch",
    "cause", "cease", "cedar", "chain", "chair", "chaos", "charm", "chart",
    "chase", "cheap", "check", "cheek", "chess", "chest", "chief", "child",
    "china", "choir", "chord", "civic", "civil", "claim", "clamp", "clash",
    "clasp", "class", "clean", "clear", "clerk", "click", "cliff", "climb",
    "cling", "clock", "clone", "close", "cloth", "cloud", "clown", "coach",
    "coast", "cobra", "combo", "comic", "comma", "coral", "comet", "coral",
    "count", "court", "cover", "crack", "craft", "crane", "crash", "crazy",
    "cream", "crest", "crime", "crisp", "cross", "crowd", "crown", "cruel",
    "crush", "crypt", "cubic", "curly", "curve", "cycle", "cynic", "cleat",

    "daily", "dance", "datum", "daunt", "deals", "death", "debut", "decal",
    "decay", "decoy", "defer", "delta", "depot", "depth", "derby", "devil",
    "digit", "ditch", "diver", "dizzy", "dodge", "doing", "donor", "doubt",
    "dough", "dowel", "dowry", "draft", "drain", "drama", "drank", "drawl",
    "drawn", "dread", "dream", "dress", "drift", "drill", "drink", "drive",
    "drone", "drove", "drugs", "drums", "drunk", "dryer", "duchy", "dully",
    "dumpy", "dunce", "dusky", "dusty", "dwarf", "dwell", "dying", "ditty",

    "eager", "early", "earth", "eight", "elite", "ember", "empty", "enemy",
    "enjoy", "enter", "entry", "envoy", "equal", "error", "essay", "every",
    "exact", "exert", "exile", "exist", "extra", "exult", "eject", "elbow",
    "elder", "elect", "elfin", "email", "emote", "endow", "epoch", "equip",

    "fable", "facet", "faint", "fairy", "faith", "falls", "false", "fancy",
    "fatal", "fault", "feast", "fence", "ferry", "fever", "fewer", "fiber",
    "field", "fiery", "fifth", "fifty", "fight", "final", "first", "fixed",
    "fjord", "flail", "flame", "flank", "flare", "flask", "fleet", "flesh",
    "float", "flood", "floor", "flora", "flour", "flown", "fluid", "flute",
    "focus", "force", "forge", "forth", "found", "frame", "frank", "fraud",
    "fresh", "front", "frost", "froze", "fruit", "fully", "funny", "furor",
    "fuzzy", "foyer", "forte", "freak", "froth", "fatal", "fancy", "fleet",

    "gamut", "gauze", "gavel", "gawky", "gears", "genre", "ghost", "girth",
    "given", "gizmo", "glade", "gland", "glare", "glass", "gleam", "glide",
    "glint", "gloat", "gloom", "gloss", "glove", "glyph", "gnash", "going",
    "grace", "grade", "grand", "grant", "grasp", "grass", "grate", "grave",
    "graze", "greed", "greet", "grief", "grind", "groan", "groin", "grope",
    "gross", "group", "grove", "growl", "grown", "gruel", "guard", "guess",
    "guest", "guide", "guild", "guile", "guise", "gusto", "gypsy", "gruff",

    "habit", "halve", "handy", "happy", "harsh", "haste", "haven", "heart",
    "heavy", "hence", "herbs", "hinge", "hippo", "hoist", "homer", "honor",
    "horse", "hotel", "hound", "human", "humid", "hurry", "hyena", "hyper",
    "haven", "hedge", "heist", "henna", "heron", "helix", "holly", "hornet",

    "ideal", "image", "imply", "inbox", "index", "indie", "infer", "inner",
    "input", "inter", "intro", "irony", "issue", "ivory", "icons", "icing",
    "idyll", "inept", "inert", "ingot", "inlet", "ionic", "irate", "itchy",

    "joker", "jolly", "joust", "judge", "juice", "juicy", "jumbo", "juror",
    "jaunt", "jazzy", "jelly", "jewel", "jiffy", "jingo", "joint", "joker",

    "karma", "kayak", "kinky", "kitty", "knack", "knave", "kneel", "knife",
    "knock", "knoll", "knots", "known", "koala", "kudos", "kebab", "khaki",

    "label", "lance", "large", "laser", "latch", "later", "laugh", "layer",
    "leach", "leapt", "learn", "lease", "least", "leave", "ledge", "legal",
    "lemon", "level", "light", "limit", "linen", "liver", "llama", "local",
    "lodge", "logic", "login", "loose", "lover", "lower", "loyal", "lucid",
    "lucky", "lunar", "lyric", "lapse", "larva", "latte", "lavish","leafy",

    "magic", "major", "maker", "manga", "maple", "march", "marry", "match",
    "maxim", "mayor", "media", "mercy", "merit", "metal", "micro", "might",
    "mimic", "mirth", "mixed", "model", "money", "month", "moral", "motor",
    "mount", "mourn", "mouth", "movie", "mulch", "mummy", "murky", "music",
    "myrrh", "manor", "manly", "mania", "mantle","mauve", "maxim", "moody",

    "naive", "naval", "nerve", "never", "night", "ninja", "noble", "noise",
    "north", "notch", "noted", "novel", "nurse", "nymph", "niche", "niece",
    "nitro", "nomad", "nudge", "nifty", "nexus", "newsy", "nasty", "natty",

    "occur", "ocean", "offer", "onset", "opera", "orbit", "order", "other",
    "outer", "outdo", "oxide", "ozone", "olive", "onion", "onset", "optic",
    "offal", "organ", "ortho", "owing", "ovoid", "oaken", "obese", "odder",

    "paint", "panda", "panic", "panel", "paper", "party", "pasta", "patch",
    "pause", "peace", "pearl", "penny", "perch", "peril", "petty", "phase",
    "phone", "photo", "piano", "pilot", "pinch", "pixel", "pizza", "place",
    "plain", "plait", "plane", "plant", "plate", "plaza", "plead", "pluck",
    "plumb", "plume", "plump", "plunge","plunk", "point", "polar", "posed",
    "power", "press", "price", "pride", "prime", "print", "prior", "prize",
    "probe", "prone", "proof", "prose", "proud", "prove", "psalm", "pulse",
    "punch", "pupil", "purge", "query", "quest", "queue", "quota", "quote",

    "rabbi", "radar", "rainy", "rally", "ranch", "range", "rapid", "ratio",
    "reach", "react", "ready", "realm", "rebel", "refer", "reign", "relax",
    "repay", "repel", "resin", "revel", "rhyme", "rider", "ridge", "right",
    "risky", "rival", "river", "robin", "robot", "rocky", "rodeo", "rouge",
    "rough", "round", "route", "royal", "rugby", "ruler", "rural", "rusty",
    "radar", "racer", "ramen", "raven", "recap", "redux", "reedy", "remix",

    "sadly", "saint", "salad", "sauce", "scale", "scare", "scene", "scone",
    "scope", "score", "scout", "seize", "sense", "serve", "seven", "shard",
    "share", "shark", "sharp", "sheer", "shelf", "shell", "shift", "shine",
    "shirt", "shock", "shore", "short", "shout", "sight", "sigma", "skill",
    "skull", "slack", "slant", "slash", "slate", "slave", "sleek", "sleep",
    "sleet", "slept", "slice", "slide", "slime", "slimy", "slope", "sloth",
    "small", "smart", "smash", "smell", "smile", "smite", "smoke", "snack",
    "snake", "snare", "sneak", "solar", "solid", "solve", "sonic", "sorry",
    "south", "space", "spare", "spark", "speak", "spear", "speck", "speed",
    "spend", "spice", "spill", "spine", "spite", "split", "spoke", "spoon",
    "spray", "squad", "stack", "staff", "stage", "stain", "stair", "stake",
    "stale", "stall", "stamp", "stand", "stare", "start", "state", "stays",
    "steak", "steal", "steam", "steel", "steep", "steer", "stern", "stick",
    "stiff", "still", "stock", "stone", "stood", "storm", "story", "stout",
    "strap", "straw", "stray", "strip", "strut", "study", "stump", "style",
    "sugar", "suite", "sunny", "super", "surge", "swamp", "swarm", "swear",
    "sweep", "sweet", "swept", "swift", "swirl", "sword", "swore", "sworn",

    "table", "talon", "tango", "tapir", "taunt", "teach", "tease", "teeth",
    "tempo", "tense", "terms", "terse", "thank", "thaw",  "theft", "their",
    "theme", "there", "these", "thing", "think", "third", "thorn", "those",
    "three", "threw", "thrill","throw", "thumb", "tidal", "tiger", "tight",
    "timer", "tired", "titan", "today", "token", "tonal", "torch", "total",
    "totem", "touch", "tough", "towel", "tower", "toxic", "trace", "track",
    "trade", "trail", "train", "trait", "tramp", "trash", "trawl", "trend",
    "trial", "tribe", "tried", "troop", "trout", "trove", "truce", "truck",
    "truly", "trump", "trunk", "trust", "truth", "tulip", "tumor", "tuner",
    "tunic", "twang", "tweak", "twice", "twist", "typed", "tryst", "taffy",

    "udder", "ulcer", "ultra", "uncle", "under", "unify", "union", "unite",
    "until", "upper", "upset", "urban", "usage", "usher", "utter", "umbra",

    "valid", "valor", "value", "valve", "vapid", "vault", "vaunt", "vicar",
    "vigil", "vigor", "viral", "virus", "visor", "vista", "vivid", "vixen",
    "vocal", "vodka", "vogue", "voice", "voila", "voter", "vouch", "vying",

    "wacky", "wafer", "wager", "wagon", "waltz", "warty", "waste", "watch",
    "water", "weary", "weave", "wedge", "weedy", "weird", "whale", "wheat",
    "wheel", "where", "which", "while", "whiff", "whirl", "white", "whole",
    "whose", "wider", "witch", "witty", "woman", "world", "worry", "worse",
    "worst", "worth", "would", "wound", "wrath", "wrist", "wrong", "wrote",

    "xenon", "xylem", "yacht", "yearn", "yield", "young", "yours", "youth",
    "zebra", "zesty", "zilch", "zippy", "zloty", "zombi", "zonal", "zones",
];

const seedWords = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Remove duplicates from the list
        const unique = [...new Set(words)];

        // Filter only 5-letter words
        const fiveLetterWords = unique.filter(w => w.trim().length === 5);

        // Bulk insert — ignore duplicates already in DB
        const inserted = await Word.bulkCreate(
            fiveLetterWords.map(w => ({ word: w.toLowerCase().trim() })),
            { ignoreDuplicates: true }
        );

        console.log(`Seeded ${inserted.length} words into the database.`);
        process.exit(0);

    } catch (err) {
        console.error('Seeding failed:', err.message);
        process.exit(1);
    }
};

seedWords();