require('dotenv').config();
const sequelize = require('../config/db');
const Word      = require('../models/Word');

const words = [
    "abate", "abhor", "abide", "abode", "abort", "abase", "abash", "abbey",
    "abbot", "abler", "abode", "abort", "abyss", "ached", "aches", "acids",
    "acorn", "acres", "acted", "adept", "adore", "adorn", "aegis", "afire",
    "afoot", "afoul", "agape", "agate", "agave", "aging", "aglow", "aided",
    "aider", "ailed", "aimed", "aisle", "algae", "alias", "alibi", "alien",
    "aloft", "aloha", "aloof", "alpha", "amino", "amiss", "amity", "among",
    "ample", "amply", "amuse", "angst", "anime", "anise", "anode", "antic",
    "antsy", "aping", "arbor", "ardor", "arena", "argon", "arson", "artsy",
    
    "bacon", "badge", "badly", "bagel", "baggy", "baked", "baker", "bales",
    "balmy", "banal", "barge", "barns", "baron", "basal", "baste", "batch",
    "baton", "batty", "bawdy", "bayou", "beans", "bears", "beats", "beaus",
    "beech", "beefy", "beeps", "beers", "beets", "befit", "begat", "beget",
    "belle", "belly", "belts", "berry", "berth", "beset", "betel", "bevel",
    "bezel", "biddy", "bided", "biker", "bilge", "bills", "bingo", "biome",
    "biped", "birch", "birds", "bison", "bitty", "blabs", "backs", "blest",
    "blimp", "blink", "blips", "bliss", "blitz", "bloat", "blobs", "blocs",
    
    "cacti", "caddy", "cadet", "caged", "cages", "cagey", "cairn", "caked",
    "cakes", "calif", "calla", "calls", "calms", "calve", "camel", "cameo",
    "camps", "canny", "canoe", "canon", "caper", "carat", "cards", "cared",
    "carer", "cares", "caret", "carob", "carps", "carts", "carve", "cased",
    "caste", "casts", "cater", "catty", "caulk", "caved", "caver", "caves",
    "cease", "ceded", "cedes", "cells", "cello", "chafe", "chaff", "champ",
    "chant", "chaps", "chard", "chars", "chary", "chasm", "chats", "cheat",
    "cheer", "chefs", "chess", "chew", "chews", "chide", "chili", "chill",
    
    "dabs", "daddy", "dados", "daffy", "daft", "dales", "dally", "dames",
    "damns", "damps", "dandy", "dared", "dares", "darks", "darns", "darts",
    "dated", "dates", "datum", "daubed", "dawns", "dazed", "dazes", "deacon",
    "dealt", "deans", "dears", "deary", "debar", "debts", "debug", "decaf",
    "decks", "decor", "decry", "deeds", "deems", "deeps", "deity", "deign",
    "deist", "deity", "delay", "delft", "dells", "demon", "demos", "demur",
    "denim", "dense", "dents", "depart", "depos", "derby", "desks", "deter",
    "detox", "deuce", "diary", "diced", "dicer", "dices", "dicey", "dicks",
    
    "eager", "eagle", "eared", "earls", "earns", "easel", "eased", "eases",
    "eaten", "eater", "eaves", "ebbed", "ebony", "ebook", "edged", "edger",
    "edges", "edict", "edify", "edits", "eerie", "egret", "eider", "eject",
    "eking", "elate", "elbows", "elect", "elegy", "elfin", "elide", "elide",
    "elite", "elope", "elude", "elves", "emcee", "emend", "emery", "emits",
    "emoji", "enact", "ended", "endow", "enema", "enemy", "enfold", "enjoy",
    "ennui", "enrol", "ensue", "enter", "entry", "envoy", "eosin", "epics",
    
    "fable", "faced", "facer", "faces", "facet", "facts", "faded", "fades",
    "fails", "faint", "fairs", "fairy", "faker", "fakes", "falls", "famed",
    "fames", "fancied", "fanny", "farce", "fared", "fares", "farms", "fasts",
    "fatal", "fated", "fates", "fatty", "fauns", "fauna", "fawns", "fazed",
    "fazes", "fears", "feast", "feats", "fecal", "feeds", "feels", "feign",
    "feint", "fella", "felon", "felts", "femme", "femur", "fends", "feral",
    "ferns", "ferny", "fetal", "fetch", "feted", "fetes", "fetid", "fetus",
    "feuds", "fewer", "fibre", "ficus", "fiend", "fifer", "fifes", "fifth",
    
    "gable", "gaffe", "gaffs", "gaged", "gages", "gains", "gaits", "galas",
    "gales", "galls", "gamed", "gamer", "games", "gamma", "gamut", "gangs",
    "gaped", "gapes", "garbs", "gases", "gasps", "gassy", "gated", "gates",
    "gaudy", "gauge", "gaunt", "gauze", "gawky", "gazed", "gazer", "gazes",
    "gecko", "geeks", "geeky", "geese", "genie", "genre", "gents", "geode",
    "germs", "getup", "ghoul", "giant", "giddy", "gifts", "gilds", "gills",
    "gilts", "gimps", "gipsy", "girds", "girls", "girth", "gists", "given",
    "giver", "gives", "gizmo", "glade", "glads", "gland", "glans", "glare",
    
    "hacks", "haiku", "hails", "hairs", "hairy", "hajj", "haled", "hales",
    "halfs", "halls", "halos", "halts", "halve", "hammed", "hands", "hangs",
    "hanks", "hardy", "hared", "harem", "hares", "harks", "harms", "harps",
    "harry", "harts", "hasps", "haste", "hasty", "hatch", "hated", "hater",
    "hates", "hauls", "haunt", "haven", "haver", "haves", "havoc", "hawks",
    "hawse", "hazed", "hazel", "hazes", "heads", "heady", "heals", "heaps",
    "hears", "heard", "hears", "harts", "heats", "heave", "heavy", "hedge",
    "hedgy", "heeds", "heels", "hefty", "heirs", "heist", "helix", "hello",
    
    "icier", "icily", "icing", "icons", "ideal", "ideas", "idiom", "idiot",
    "idled", "idler", "idles", "idols", "idyll", "igloo", "ileum", "image",
    "imams", "imbue", "impel", "inane", "inapt", "incur", "index", "inept",
    "inert", "infer", "infix", "ingot", "inked", "inker", "inlay", "inlet",
    "inner", "input", "inset", "inter", "intros", "inure", "iodine", "ionic",
    "irate", "irked", "irons", "irony", "isles", "islet", "issue", "itchy",
    "items", "ivied", "ivies", "ivory", "ixora", "izard",
    
    "jacks", "jaded", "jades", "jails", "jams", "janitor", "jarred", "jaunty",
    "jawed", "jazzy", "jeans", "jeeps", "jeers", "jells", "jelly", "jerks",
    "jerky", "jests", "jetty", "jewel", "jiffy", "jihad", "jilts", "jimmy",
    "jingo", "jinks", "jinni", "jinns", "jived", "jives", "joint", "joist",
    "joked", "joker", "jokes", "jolly", "jolts", "joust", "jowar", "jowls",
    "jowly", "joyed", "jubile", "judge", "juice", "juicy", "julep", "jumbo",
    "jumps", "jumpy", "junco", "junks", "junky", "junta", "juror", "jurat",
    
    "kabob", "kappa", "kaput", "karat", "karma", "karst", "kayak", "kebab",
    "keels", "keens", "keeps", "kelps", "kempt", "kendo", "kenos", "kerbs",
    "keyed", "khaki", "khans", "kicks", "kicky", "kiddy", "kills", "kilns",
    "kilos", "kilts", "kinda", "kinds", "kings", "kinks", "kinky", "kiosk",
    "kissy", "kited", "kites", "kitty", "kiwis", "klieg", "klutz", "knack",
    "knave", "knead", "kneed", "kneel", "knees", "knell", "knelt", "knife",
    "knits", "knobs", "knock", "knoll", "knots", "known", "knows", "knurl",
    
    "label", "labor", "laced", "lacer", "laces", "lacey", "lacks", "laded",
    "laden", "lades", "ladle", "lager", "laird", "laity", "lakes", "lamas",
    "lambs", "lamed", "lamer", "lames", "lamps", "lands", "lanes", "lanky",
    "lapel", "lapse", "larch", "lards", "lardy", "large", "larks", "larva",
    "lased", "laser", "lasso", "lasts", "latch", "later", "latex", "lathe",
    "laths", "latte", "lauds", "laughs", "lawns", "laxer", "laxly", "layer",
    "lazed", "lazes", "leach", "leads", "leafs", "leafy", "leaks", "leaky",
    
    "macho", "macro", "madam", "madly", "mafia", "magic", "magma", "maids",
    "mails", "maims", "mains", "maize", "major", "makes", "males", "malls",
    "malts", "malty", "mamas", "mamba", "mambo", "mamma", "mammy", "maned",
    "manes", "manga", "mange", "mango", "mangy", "mania", "manic", "manly",
    "manna", "manor", "manse", "manta", "maple", "march", "mares", "maria",
    "marks", "marls", "marry", "marsh", "marts", "maser", "masks", "mason",
    "masse", "masts", "match", "mated", "mater", "mates", "maths", "matey",
    
    "naans", "nabob", "nacho", "nacre", "nadir", "naiad", "nails", "naive",
    "naked", "named", "namer", "names", "nanny", "napkin", "nappy", "narco",
    "narcs", "nards", "nares", "nasal", "nasty", "natal", "natch", "natty",
    "naval", "navel", "naves", "navvy", "nazis", "neaps", "nears", "neath",
    "necks", "needs", "needy", "neigh", "neons", "nerds", "nerdy", "nerve",
    "nervy", "nests", "never", "newel", "newer", "newly", "newsy", "newts",
    "nexus", "nicer", "niche", "nicks", "niece", "nifty", "night", "nimbi",
    
    "oaken", "oakum", "oared", "oases", "oasis", "oaths", "oaten", "oater",
    "oaths", "obese", "obeys", "object", "oboes", "occur", "ocean", "ocher",
    "ochre", "octal", "octet", "odder", "oddly", "odium", "odors", "odour",
    "offal", "offed", "offer", "often", "ogled", "ogler", "ogles", "ogres",
    "ohmic", "oiled", "oiler", "oinks", "okapi", "okays", "olden", "older",
    "oldie", "oleic", "oleos", "olive", "omega", "omens", "omits", "onion",
    "ontic", "oohed", "oomph", "oozed", "oozes", "opals", "opens", "opera",
    
    "paced", "pacer", "paces", "packs", "pacts", "paddy", "padre", "paean",
    "pagan", "paged", "pager", "pages", "pails", "pains", "pairs", "paled",
    "paler", "pales", "palls", "palms", "palmy", "palsy", "panda", "paned",
    "panes", "pangs", "panic", "pansy", "pants", "papal", "papaw", "paper",
    "pappy", "parch", "pards", "pared", "parer", "pares", "parka", "parks",
    "parry", "parse", "parts", "party", "parvo", "passe", "pasta", "paste",
    "pasty", "patch", "pated", "paten", "pater", "pates", "paths", "patio",
    
    "quack", "quads", "quaff", "quail", "quake", "qualm", "quark", "quart",
    "quash", "quasi", "quass", "quays", "queen", "queer", "quell", "query",
    "quest", "queue", "quick", "quids", "quiet", "quiff", "quill", "quilt",
    "quins", "quint", "quips", "quire", "quirk", "quite", "quits", "quota",
    "quote", "quoth", "quoits",
    
    "rabbi", "rabid", "racer", "races", "racks", "radar", "radii", "radio",
    "radix", "radon", "rafts", "raged", "rages", "raids", "rails", "rains",
    "rainy", "raise", "rajas", "raked", "raker", "rakes", "rales", "rally",
    "ralph", "ramen", "ramps", "ranch", "rands", "randy", "ranee", "range",
    "rangy", "ranks", "rants", "raped", "raper", "rapes", "rapid", "rapt",
    "rared", "rarer", "rares", "rased", "rases", "rasps", "raspy", "rated",
    
    "sabed", "saber", "sable", "sabot", "sabra", "sacks", "sacra", "sadly",
    "safer", "safes", "sagas", "sager", "sages", "saggy", "sahib", "sails",
    "saint", "saith", "sakes", "salad", "salem", "sales", "sally", "salmi",
    "salon", "salsa", "salts", "salty", "salve", "salvo", "samba", "sames",
    "samey", "sands", "sandy", "saner", "sanes", "sangs", "sank", "sapid",
    "sappy", "saran", "sards", "saree", "sarge", "saris", "sarky", "saros",
    "sated", "sates", "satin", "satyr", "sauce", "saucy", "sauna", "saute",
    
    "tabby", "taber", "tabes", "table", "taboo", "tabor", "tabus", "tacet",
    "tache", "tacit", "tacks", "tacky", "tacos", "tacts", "taffy", "taiga",
    "tails", "taint", "taken", "taker", "takes", "taled", "tales", "talks",
    "talky", "tally", "talon", "talus", "tamed", "tamer", "tames", "tamis",
    "tammy", "tamps", "tanga", "tango", "tangs", "tangy", "tanka", "tanks",
    "tansy", "tapas", "taped", "taper", "tapes", "tapir", "tapis", "tardo",
    "tardy", "tared", "tares", "targe", "tarns", "taros", "tarot", "tarps",
    
    "udder", "uglier", "uhlan", "ukase", "ulama", "ulans", "ulcer", "ulema",
    "ulnad", "ulnae", "ulnar", "ulnas", "ultra", "ulvas", "umbel", "umber",
    "umbos", "umbra", "umiac", "umiak", "umiaq", "ummah", "umped", "unarm",
    "unary", "unbag", "unbar", "unbox", "uncap", "uncle", "uncut", "under",
    "undid", "undue", "unfed", "unfit", "unfix", "ungot", "unhat", "unhex",
    "unify", "union", "unite", "units", "unity", "unjam", "unlay", "unled",
    
    "vague", "vails", "vain", "vairs", "vales", "valet", "valid", "valor",
    "value", "valve", "vamps", "vampy", "vaned", "vanes", "vangs", "vapid",
    "vapor", "varas", "varia", "varied", "varus", "varve", "vasty", "vatic",
    "vatus", "vault", "vaunt", "veals", "vealy", "veena", "veeps", "veers",
    "veery", "vegan", "vegas", "veils", "veins", "veiny", "velar", "velds",
    "veldt", "velum", "venal", "vends", "venge", "venin", "venom", "vents",
    "venue", "verbs", "verge", "verse", "verso", "verst", "verts", "vertu",
    
    "wacke", "wacky", "waddy", "waded", "wader", "wades", "wadis", "wafer",
    "wafts", "waged", "wager", "wages", "wagon", "wahoo", "waifs", "wails",
    "wains", "waist", "waits", "waive", "waked", "waken", "waker", "wakes",
    "waled", "waler", "wales", "walks", "walls", "wally", "waltz", "wands",
    "waned", "wanes", "wanns", "wants", "wards", "wared", "wares", "warms",
    "warns", "warps", "warts", "warty", "washy", "wasps", "waspy", "waste",
    "wasts", "watch", "water", "watts", "waugh", "wauks", "wauls", "waved",
    
    "xenon", "xenia", "xenic", "xenon", "xeric", "xerox", "xerus", "xylan",
    "xylem", "xylyl", "xysti", "xysts",
    
    "yacht", "yacks", "yahoo", "yaird", "yamen", "yamun", "yangs", "yanks",
    "yapok", "yapon", "yards", "yarer", "yarns", "yauds", "yauld", "yaups",
    "yawed", "yawls", "yawns", "yawps", "yeahs", "yearn", "years", "yeast",
    "yecch", "yechs", "yeggs", "yelks", "yells", "yelps", "yenta", "yente",
    "yerba", "yerks", "yeses", "yetis", "yield", "yikes", "yills", "yince",
    "yipes", "yirds", "yirrs", "yirth", "ylems", "yobbo", "yobs", "yodel",
    
    "zayin", "zeals", "zebra", "zebus", "zeins", "zeros", "zests", "zesty",
    "zetas", "zibet", "zilch", "zincs", "zincy", "zineb", "zines", "zings",
    "zingy", "zinky", "zippy", "ziram", "zitis", "zizit", "zloty", "zoeae",
    "zoeal", "zoeas", "zombi", "zonal", "zoned", "zoner", "zones", "zonks",
    "zooey", "zooid", "zooks", "zooms", "zoons", "zooty", "zoril", "zoris",
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

        console.log(`Seeded ${inserted.length} new words into the database.`);
        console.log(`Total unique 5-letter words in this batch: ${fiveLetterWords.length}`);
        process.exit(0);

    } catch (err) {
        console.error('Seeding failed:', err.message);
        process.exit(1);
    }
};

seedWords();