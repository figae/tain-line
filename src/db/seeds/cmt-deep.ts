/**
 * Deep seed: Cath Maige Tuired (The Second Battle of Mag Tuired)
 *
 * The full narrative broken into granular events with:
 * - Lifecycle events (birth/death) for every character
 * - Battle hierarchy: Second Battle as parent, sub-battles as children
 * - Rich event_type classification
 * - Complete event_relations network (before/causes/contains/parallel/meets)
 * - Automatic lifecycle bracket constraints for every participant
 *
 * This seed is designed to stress-test the schema and reveal structural gaps.
 */
import type { Seed } from "./types";
import { makeStatements, mkLifecycle, addLifecycleBrackets } from "./_helpers";

export const name = "Cath Maige Tuired — Deep Dive";
export const description =
  "Complete Second Battle narrative. 21 characters with full lifecycles, 16+ narrative events with hierarchy.";

export const seed: Seed["seed"] = (db) => {
  // ── SOURCES ──────────────────────────────────────────────────────────────
  const insertSource = db.prepare(
    `INSERT INTO sources (title, type, author, year, url, notes) VALUES (?,?,?,?,?,?)`
  );

  const cmtMs = insertSource.run(
    "Cath Maige Tuired (CELT edition T300010)", "manuscript", null, 900,
    "https://celt.ucc.ie/published/T300010/",
    "Primary text. 9th-century composition, preserved in 16th-century Harley MS 5280."
  ).lastInsertRowid as number;

  const lge = insertSource.run(
    "Lebor Gabála Érenn", "manuscript", null, 1150,
    "https://celt.ucc.ie/published/T100055/",
    "Provides genealogical context for the Tuatha Dé Danann."
  ).lastInsertRowid as number;

  const grayEdition = insertSource.run(
    "Cath Maige Tuired: The Second Battle of Mag Tuired",
    "scholarly", "Elizabeth A. Gray", 1982, null,
    "Standard modern edition and translation. Irish Texts Society vol. 52."
  ).lastInsertRowid as number;

  // ── GROUPS ───────────────────────────────────────────────────────────────
  const insertGroup = db.prepare(
    `INSERT INTO groups (name, alt_names, description, source_id) VALUES (?,?,?,?)`
  );

  const tuatha = insertGroup.run(
    "Tuatha Dé Danann",
    JSON.stringify(["People of the Goddess Danu", "Tribe of the Gods"]),
    "The divine race who came to Ireland from the northern islands. They brought four treasures and defeated the Fir Bolg.",
    lge
  ).lastInsertRowid as number;

  const fomor = insertGroup.run(
    "Fomorians",
    JSON.stringify(["Fomoire", "Fomori", "Fomóraig"]),
    "Primordial beings from under the sea. They represent chaos, darkness, and untamed nature. They oppressed the Tuatha Dé during Bres's reign.",
    cmtMs
  ).lastInsertRowid as number;

  const firBolg = insertGroup.run(
    "Fir Bolg", JSON.stringify(["Men of Bags", "Builg"]),
    "Pre-divine inhabitants of Ireland, defeated by the Tuatha Dé Danann at the First Battle.",
    lge
  ).lastInsertRowid as number;

  // ── CHARACTERS ───────────────────────────────────────────────────────────
  const insertChar = db.prepare(
    `INSERT INTO characters (name, alt_names, gender, description, epithet, is_deity, source_id)
     VALUES (?,?,?,?,?,?,?)`
  );
  const insertCG = db.prepare(
    `INSERT INTO character_groups (character_id, group_id, source_id) VALUES (?,?,?)`
  );
  const insertProp = db.prepare(
    `INSERT INTO character_properties (character_id, type, value, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insertFam = db.prepare(
    `INSERT INTO family_relations (from_character_id, to_character_id, relation_type, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insertPlace = db.prepare(
    `INSERT INTO places (name, alt_names, type, modern_equivalent, description, source_id) VALUES (?,?,?,?,?,?)`
  );
  const insertEP = db.prepare(
    `INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`
  );

  const stmts = makeStatements(db);

  // helper: shorthand for relation insertion
  const R = (from: number, to: number, type: string, conf: string, reason: string, src: number = cmtMs) =>
    stmts.insRel.run(from, to, type, conf, reason, src);

  // ─── Characters ──────────────────────────────────────────────────────────

  const nuada = insertChar.run(
    "Nuada", JSON.stringify(["Nuada Airgetlám", "Nudd", "Nodens"]),
    "male",
    "First king of the Tuatha Dé Danann. Lost his right arm to the Fir Bolg champion Sreng at the First Battle. No blemished man could be king — so he was replaced by Bres. After his arm was restored in flesh by Miach, he reclaimed the throne. Killed by Balor's Evil Eye at the Second Battle.",
    "Airgetlám (Silver Hand/Arm)", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(nuada, tuatha, cmtMs);
  insertProp.run(nuada, "weapon", "Claíomh Solais (Sword of Light)", "One of the Four Treasures — from Findias. No one could escape it once drawn.", cmtMs);
  insertProp.run(nuada, "attribute", "Silver arm (airget-lám)", "First a silver prosthetic by Dian Cécht, then restored to flesh by Miach", cmtMs);

  const bres = insertChar.run(
    "Bres", JSON.stringify(["Bres mac Elathan", "Eochaid Bres", "Bres the Beautiful"]),
    "male",
    "Half-Fomorian, half-Tuatha Dé. Made king after Nuada's blemish, but ruled as a tyrant — taxing the Tuatha Dé and giving tribute to the Fomorians. Deposed after Cairbre's satire raised boils on his face. Fled to the Fomorians to raise an army. Spared after the battle in exchange for agricultural knowledge.",
    "Bres the Beautiful", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(bres, tuatha, cmtMs);
  insertCG.run(bres, fomor, cmtMs);
  insertProp.run(bres, "attribute", "Inhospitable king", "No food, drink, or poets at his court — a grave offence in Irish law", cmtMs);

  const elathan = insertChar.run(
    "Elathan", JSON.stringify(["Elatha mac Delbáeth"]),
    "male",
    "Fomorian prince and father of Bres. Came from the sea in a silver boat to lie with Ériu. Later refused to help Bres reclaim the throne unjustly.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(elathan, fomor, cmtMs);

  const eriu = insertChar.run(
    "Ériu", JSON.stringify(["Éire", "Erin"]),
    "female",
    "Goddess of the sovereignty of Ireland. Mother of Bres by Elathan. One of three sisters (Ériu, Banba, Fódla) who gave Ireland its names.",
    "Sovereignty of Ireland", 1, lge
  ).lastInsertRowid as number;
  insertCG.run(eriu, tuatha, lge);

  const lugh = insertChar.run(
    "Lugh", JSON.stringify(["Lugh Lámhfhada", "Lugh Samildánach", "Lleu", "Lugus"]),
    "male",
    "God of all skills. Son of Cian (Tuatha Dé) and Ethniu (daughter of Balor). Raised in fosterage by Tailtiu and by Manannán mac Lir. Arrived at Tara and proved himself master of every craft at the gate. Commanded the war against the Fomorians. Killed his grandfather Balor by driving a sling-stone through his Evil Eye.",
    "Samildánach (Equally Skilled in All Arts), Lámhfhada (of the Long Arm)", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(lugh, tuatha, cmtMs);
  insertProp.run(lugh, "weapon", "Sling-stone (tathlum)", "The weapon he used to kill Balor — drove his eye through the back of his head", cmtMs);
  insertProp.run(lugh, "weapon", "Spear of Lugh (Areadbhair)", "One of the Four Treasures — from Gorias. Its tip had to be quenched in a cauldron of poppy juice lest it destroy the city.", cmtMs);
  insertProp.run(lugh, "skill", "Samildánach — all crafts", "At the gate of Tara he claimed: wright, smith, champion, harper, hero, poet, sorcerer, physician, cupbearer, brazier", cmtMs);

  const cian = insertChar.run(
    "Cian", JSON.stringify(["Cian mac Dian Cécht", "Scal Balb"]),
    "male",
    "Son of the physician-god Dian Cécht. Father of Lugh. Disguised himself to reach Ethniu in Balor's tower on Tory Island.",
    null, 1, lge
  ).lastInsertRowid as number;
  insertCG.run(cian, tuatha, lge);

  const ethniu = insertChar.run(
    "Ethniu", JSON.stringify(["Eithne", "Ethnea"]),
    "female",
    "Daughter of Balor, mother of Lugh. Balor imprisoned her in a crystal tower on Tory Island after a prophecy that her son would kill him.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(ethniu, fomor, cmtMs);

  const balor = insertChar.run(
    "Balor", JSON.stringify(["Balor of the Evil Eye", "Balor Béimnech", "Balor Birugderc"]),
    "male",
    "King of the Fomorians and grandfather of Lugh. His single enormous eye could kill entire armies when opened — it required four men to lift the lid. He gained this power as a boy when he watched his father's druids brew a poison. Killed Nuada before Lugh destroyed his eye with a sling-stone.",
    "Birugderc (of the Piercing Eye)", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(balor, fomor, cmtMs);
  insertProp.run(balor, "attribute", "Evil Eye (Súil Mhilltach)", "A single eye whose gaze killed all who looked upon it. Gained when he saw druid poison being brewed as a child.", cmtMs);

  const indech = insertChar.run(
    "Indech", JSON.stringify(["Indech mac Dé Domnann"]),
    "male",
    "Fomorian king, one of Balor's chief allies. Defeated by Ogma at the Second Battle, who captured his sword Orna.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(indech, fomor, cmtMs);

  const dianCecht = insertChar.run(
    "Dian Cécht", JSON.stringify(["Dían Cécht"]),
    "male",
    "Chief physician of the Tuatha Dé Danann. Crafted Nuada's silver arm. During the battle, he sang incantations over the healing well (Tipra Sláine) to restore fallen warriors. Killed his own son Miach out of jealousy.",
    "Divine Physician", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(dianCecht, tuatha, cmtMs);
  insertProp.run(dianCecht, "skill", "Healing magic", "Maintained the Well of Healing during battle", cmtMs);
  insertProp.run(dianCecht, "attribute", "Tipra Sláine (Well of Healing)", "Warriors cast into this well emerged whole", cmtMs);

  const miach = insertChar.run(
    "Miach", JSON.stringify(["Miach mac Dian Cécht"]),
    "male",
    "Son of Dian Cécht. Surpassed his father's skill by replacing Nuada's silver arm with real flesh. His father struck him dead out of jealousy. 365 healing herbs grew from his grave.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(miach, tuatha, cmtMs);
  insertProp.run(miach, "skill", "Flesh restoration", "Bone to bone, sinew to sinew — restored Nuada's living arm", cmtMs);

  const airmed = insertChar.run(
    "Airmed", JSON.stringify(["Airmid"]),
    "female",
    "Daughter of Dian Cécht, sister of Miach. Catalogued 365 healing herbs from Miach's grave. Dian Cécht scattered them — which is why no one knows all the healing herbs.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(airmed, tuatha, cmtMs);
  insertProp.run(airmed, "skill", "Herbal knowledge", "Catalogued 365 herbs from Miach's grave before Dian Cécht destroyed her work", cmtMs);

  const goibniu = insertChar.run(
    "Goibniu", JSON.stringify(["Goibhniu", "Gaibne"]),
    "male",
    "Divine smith of the Tuatha Dé Danann. One of the Trí Dé Dána. Could forge a perfect weapon in three blows. Wounded by Ruadán's spear but survived and killed his attacker. Hosted the Fled Goibnenn whose ale granted immortality.",
    "The Smith", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(goibniu, tuatha, cmtMs);
  insertProp.run(goibniu, "skill", "Three-blow forging", "Made a perfect spearhead in exactly three strikes", cmtMs);
  insertProp.run(goibniu, "attribute", "Fled Goibnenn", "His ale preserved the Tuatha Dé from age and sickness", cmtMs);

  const luchtaine = insertChar.run(
    "Luchtaine", JSON.stringify(["Luchta"]),
    "male",
    "Divine carpenter of the Tuatha Dé Danann. One of the Trí Dé Dána. Made perfect spear-shafts in three cuts.",
    "The Wright", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(luchtaine, tuatha, cmtMs);
  insertProp.run(luchtaine, "skill", "Three-cut shafts", "Made perfect spear-shafts in three cuts of the axe", cmtMs);

  const creidne = insertChar.run(
    "Creidne", JSON.stringify(["Credne"]),
    "male",
    "Divine brazier of the Tuatha Dé Danann. Third of the Trí Dé Dána. Made rivets, sword hilts, and shield rims. His rivets flew into spear-shafts from his tongs without holes being bored.",
    "The Brazier", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(creidne, tuatha, cmtMs);

  const dagda = insertChar.run(
    "The Dagda", JSON.stringify(["Eochaid Ollathair", "Ruad Rofhessa", "Deirgderc", "In Dagda Mór"]),
    "male",
    "Father-god. Before the battle he mated with the Morrígan at the river Unshin on Samhain, securing her alliance. The Fomorians humiliated him by making him eat a vast porridge from a hole in the ground. His club killed nine with one end and revived with the other. His harp Uaithne controlled seasons and emotions.",
    "Eochaid Ollathair (Father of All)", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(dagda, tuatha, cmtMs);
  insertProp.run(dagda, "weapon", "Lorg Mór (The Great Club)", "Kills nine with one end, revives with the other. Left a track like a boundary ditch.", cmtMs);
  insertProp.run(dagda, "attribute", "Cauldron of the Dagda (Undruimne)", "One of the Four Treasures — from Murias. No company ever went away unsatisfied.", cmtMs);
  insertProp.run(dagda, "attribute", "Uaithne (The Dagda's Harp)", "Commanded sorrow, joy, and sleep. Also called Daur Dá Bláo.", cmtMs);

  const morrigan = insertChar.run(
    "The Morrígan", JSON.stringify(["Morrigan", "Morrígu", "Phantom Queen", "Anand"]),
    "female",
    "Triple goddess of war, fate, and sovereignty. Mated with the Dagda at the river Unshin before the battle, promising to aid the Tuatha Dé. After the battle, proclaimed victory and prophesied the end of the world. Her three aspects: Badb (crow), Macha (sovereignty), Nemain (frenzy).",
    "Phantom Queen", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(morrigan, tuatha, cmtMs);
  insertProp.run(morrigan, "animal", "Crow (badb catha)", "Appears as a hooded crow on battlefields", cmtMs);
  insertProp.run(morrigan, "skill", "Prophecy", "After the battle she prophesied both peace and the eventual end of the world", cmtMs);
  insertProp.run(morrigan, "attribute", "Triple aspect", "Badb (crow/war), Macha (sovereignty), Nemain (frenzy/panic)", cmtMs);

  const cairbre = insertChar.run(
    "Cairbre mac Étaine", JSON.stringify(["Cairbre", "Coirpre"]),
    "male",
    "Chief poet (ollam) of the Tuatha Dé Danann. Composed the first satire ever made in Ireland against Bres, raising boils on his face and making him unfit to be king.",
    "Chief Poet of the Tuatha Dé", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(cairbre, tuatha, cmtMs);
  insertProp.run(cairbre, "skill", "Satire (áer)", "His satire was the first in Ireland — it had physical power, raising boils on the king's face", cmtMs);

  const ogma = insertChar.run(
    "Ogma", JSON.stringify(["Ogma Gríanainech", "Ogmios"]),
    "male",
    "Champion of the Tuatha Dé Danann and inventor of ogham script. Humiliated under Bres by being made to carry firewood. In the Second Battle he defeated Indech and captured the speaking sword Orna.",
    "Gríanainech (Sun-Faced)", 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(ogma, tuatha, cmtMs);
  insertProp.run(ogma, "weapon", "Orna", "Captured from Indech — recounted every deed performed with it when unsheathed", cmtMs);
  insertProp.run(ogma, "skill", "Inventor of Ogham", "Created the ogham alphabet, the first Irish writing system", lge);

  const tailtiu = insertChar.run(
    "Tailtiu", JSON.stringify(["Tailltiu"]),
    "female",
    "Foster-mother of Lugh. Originally a Fir Bolg princess. Cleared the forest of Coill Cuan to create an agricultural plain and died of exhaustion. Lugh established the festival of Lughnasadh in her honour.",
    null, 0, lge
  ).lastInsertRowid as number;
  insertCG.run(tailtiu, firBolg, lge);

  const ruadan = insertChar.run(
    "Ruadán", JSON.stringify(["Rúadán mac Bres"]),
    "male",
    "Son of Bres and Bríg. Sent by the Fomorians as a spy. Wounded Goibniu with a spear, but Goibniu pulled it out and killed him. Bríg's keening for Ruadán was the first keening ever heard in Ireland.",
    null, 1, cmtMs
  ).lastInsertRowid as number;

  // ── FAMILY RELATIONS ─────────────────────────────────────────────────────
  insertFam.run(elathan, bres, "father", "Elathan came from the sea and fathered Bres on Ériu", cmtMs);
  insertFam.run(eriu, bres, "mother", "Ériu bore Bres after her union with the Fomorian Elathan", cmtMs);
  insertFam.run(cian, lugh, "father", "Cian is Lugh's father from the Tuatha Dé side", lge);
  insertFam.run(ethniu, lugh, "mother", "Ethniu bore Lugh after Cian reached her in Balor's tower", cmtMs);
  insertFam.run(balor, ethniu, "father", "Balor imprisoned his daughter to prevent the prophecy", cmtMs);
  insertFam.run(balor, lugh, "other", "Maternal grandfather — killed by Lugh, fulfilling the prophecy", cmtMs);
  insertFam.run(dianCecht, cian, "father", "Dian Cécht is father of Cian, making him Lugh's paternal grandfather", lge);
  insertFam.run(dianCecht, miach, "father", "Dian Cécht killed his own son out of jealousy", cmtMs);
  insertFam.run(dianCecht, airmed, "father", null, cmtMs);
  insertFam.run(miach, airmed, "sibling", "Brother and sister", cmtMs);
  insertFam.run(bres, ruadan, "father", "Bres sent his own son as a spy", cmtMs);
  insertFam.run(tailtiu, lugh, "foster_parent", "Tailtiu raised Lugh; he established Lughnasadh games in her memory", lge);

  // Character properties
  insertProp.run(dianCecht, "skill", "Silver arm crafting", "Created a fully functional silver arm for Nuada", cmtMs);
  insertProp.run(ruadan, "attribute", "First keened death", "His mother Bríg's mourning was the first keening in Ireland", cmtMs);

  // ── PLACES ───────────────────────────────────────────────────────────────
  const magTuired = insertPlace.run(
    "Mag Tuired", JSON.stringify(["Moytura", "Plain of Pillars", "Mag Tuired na bFomorach"]),
    "plain", "Cong area, Mayo / Lough Arrow, Sligo (debated)",
    "The plain where both great battles were fought. 'Plain of Pillars' — possibly referring to standing stones. First Battle near Cong, Second near Lough Arrow.",
    cmtMs
  ).lastInsertRowid as number;

  const tara = insertPlace.run(
    "Tara", JSON.stringify(["Teamhair", "Teamhair na Rí"]),
    "hill", "Hill of Tara, County Meath",
    "Seat of the High Kings. Where Lugh proved his skills at the gate. The Lia Fáil (Stone of Destiny) stood here.",
    cmtMs
  ).lastInsertRowid as number;

  const toryIsland = insertPlace.run(
    "Tory Island", JSON.stringify(["Tor Inis", "Toraigh"]),
    "island", "Tory Island, County Donegal",
    "Balor's island fortress. He imprisoned Ethniu here in a crystal tower to prevent the prophecy of his death.",
    cmtMs
  ).lastInsertRowid as number;

  const unshinRiver = insertPlace.run(
    "River Unshin", JSON.stringify(["Abhainn Unciú"]),
    "river", "River Unshin, County Sligo",
    "Where the Dagda mated with the Morrígan on Samhain eve. She was washing at a ford, straddling the river with one foot on each bank.",
    cmtMs
  ).lastInsertRowid as number;

  const slaneTipra = insertPlace.run(
    "Tipra Sláine (Well of Healing)", JSON.stringify(["Well of Slane", "Loch Luibe"]),
    "other", null,
    "The enchanted well where Dian Cécht and his children sang incantations over the fallen. Wounded warriors were cast in and emerged whole. The Fomorians destroyed it by piling stones into it.",
    cmtMs
  ).lastInsertRowid as number;

  // ── LIFECYCLE EVENTS ──────────────────────────────────────────────────────
  // Create birth/death event pairs for all 21 characters.
  const LC = {
    nuada:    mkLifecycle(stmts, { characterId: nuada,    name: "Nuada",    cycle: "mythological", sourceId: cmtMs }),
    bres:     mkLifecycle(stmts, { characterId: bres,     name: "Bres",     cycle: "mythological", sourceId: cmtMs }),
    elathan:  mkLifecycle(stmts, { characterId: elathan,  name: "Elathan",  cycle: "mythological", sourceId: cmtMs }),
    eriu:     mkLifecycle(stmts, { characterId: eriu,     name: "Ériu",     cycle: "mythological", sourceId: lge  }),
    lugh:     mkLifecycle(stmts, { characterId: lugh,     name: "Lugh",     cycle: "mythological", sourceId: cmtMs }),
    cian:     mkLifecycle(stmts, { characterId: cian,     name: "Cian",     cycle: "mythological", sourceId: lge  }),
    ethniu:   mkLifecycle(stmts, { characterId: ethniu,   name: "Ethniu",   cycle: "mythological", sourceId: cmtMs }),
    balor:    mkLifecycle(stmts, { characterId: balor,    name: "Balor",    cycle: "mythological", sourceId: cmtMs }),
    indech:   mkLifecycle(stmts, { characterId: indech,   name: "Indech",   cycle: "mythological", sourceId: cmtMs }),
    dianCecht:mkLifecycle(stmts, { characterId: dianCecht,name: "Dian Cécht",cycle:"mythological", sourceId: cmtMs }),
    miach:    mkLifecycle(stmts, { characterId: miach,    name: "Miach",    cycle: "mythological", sourceId: cmtMs }),
    airmed:   mkLifecycle(stmts, { characterId: airmed,   name: "Airmed",   cycle: "mythological", sourceId: cmtMs }),
    goibniu:  mkLifecycle(stmts, { characterId: goibniu,  name: "Goibniu",  cycle: "mythological", sourceId: cmtMs }),
    luchtaine:mkLifecycle(stmts, { characterId: luchtaine,name: "Luchtaine",cycle:"mythological",  sourceId: cmtMs }),
    creidne:  mkLifecycle(stmts, { characterId: creidne,  name: "Creidne",  cycle: "mythological", sourceId: cmtMs }),
    dagda:    mkLifecycle(stmts, { characterId: dagda,    name: "The Dagda", cycle:"mythological", sourceId: cmtMs }),
    morrigan: mkLifecycle(stmts, { characterId: morrigan, name: "The Morrígan",cycle:"mythological",sourceId: cmtMs }),
    cairbre:  mkLifecycle(stmts, { characterId: cairbre,  name: "Cairbre",  cycle: "mythological", sourceId: cmtMs }),
    ogma:     mkLifecycle(stmts, { characterId: ogma,     name: "Ogma",     cycle: "mythological", sourceId: cmtMs }),
    tailtiu:  mkLifecycle(stmts, { characterId: tailtiu,  name: "Tailtiu",  cycle: "mythological", sourceId: lge  }),
    ruadan:   mkLifecycle(stmts, { characterId: ruadan,   name: "Ruadán",   cycle: "mythological", sourceId: cmtMs }),
  };

  // ── KNOWN GENEALOGICAL ORDERING ON LIFECYCLES ─────────────────────────────
  // From family_relations we can derive:
  R(LC.dianCecht.birthId, LC.cian.birthId,   "before", "certain",  "Dian Cécht is Cian's father — born first");
  R(LC.dianCecht.birthId, LC.miach.birthId,  "before", "certain",  "Dian Cécht is Miach's father — born first");
  R(LC.dianCecht.birthId, LC.airmed.birthId, "before", "certain",  "Dian Cécht is Airmed's father — born first");
  R(LC.balor.birthId,     LC.ethniu.birthId, "before", "certain",  "Balor is Ethniu's father — born first");
  R(LC.cian.birthId,      LC.lugh.birthId,   "before", "certain",  "Cian is Lugh's father — born first");
  R(LC.ethniu.birthId,    LC.lugh.birthId,   "before", "certain",  "Ethniu is Lugh's mother — born first");
  R(LC.balor.birthId,     LC.lugh.birthId,   "before", "certain",  "Balor is Lugh's grandfather — born well before him");
  R(LC.elathan.birthId,   LC.bres.birthId,   "before", "certain",  "Elathan is Bres's father — born first");
  R(LC.eriu.birthId,      LC.bres.birthId,   "before", "certain",  "Ériu is Bres's mother — born first");
  R(LC.bres.birthId,      LC.ruadan.birthId, "before", "certain",  "Bres is Ruadán's father — born first");
  // Tailtiu died before Lugh's adulthood (she fostered him)
  R(LC.tailtiu.deathId,   LC.lugh.birthId,   "before", "probable", "Tailtiu died from clearing forest — probably before Lugh reached adulthood");
  // Miach dies before Airmed catalogues his herbs (she does it after his death)
  R(LC.miach.deathId,     LC.airmed.deathId, "before", "certain",  "Airmed outlives Miach");

  // ── NARRATIVE EVENTS ─────────────────────────────────────────────────────

  // 1. Nuada loses his arm
  const e_nuadaArm = stmts.insEvent.run(
    "Nuada loses his arm at the First Battle",
    "In the First Battle of Mag Tuired, Nuada fights the Fir Bolg champion Sreng. Sreng's sword-blow cuts off Nuada's right arm at the shoulder. The Tuatha Dé win but Nuada is blemished.",
    "battle", null, null, "mythological", "Age of Gods — Arrival", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_nuadaArm, nuada, "victim", "Loses his arm to Sreng", cmtMs);
  insertEP.run(e_nuadaArm, magTuired, cmtMs);

  // 2. Elathan meets Ériu → Bres is conceived
  const e_elathanEriu = stmts.insEvent.run(
    "Elathan comes from the sea and lies with Ériu",
    "Elathan, Fomorian prince, sails from the sea in a silver boat and lies with the goddess Ériu. Bres is conceived from this union.",
    "meeting", null, null, "mythological", "Age of Gods — Origins", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_elathanEriu, elathan, "protagonist", "Comes from the sea to lie with Ériu", cmtMs);
  stmts.insEC.run(e_elathanEriu, eriu, "protagonist", "Bears Bres from this union", cmtMs);

  // 3. Bres made king
  const e_bresMadeKing = stmts.insEvent.run(
    "Bres made king of the Tuatha Dé Danann",
    "Since no blemished man may be king, Nuada is deposed. The Tuatha Dé offer the kingship to Bres — half-Fomorian — hoping to forge peace. A catastrophic mistake.",
    "reign", null, null, "mythological", "Age of Gods — Bres's Reign", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_bresMadeKing, bres, "protagonist", "Accepts the kingship", cmtMs);
  stmts.insEC.run(e_bresMadeKing, nuada, "mentioned", "Deposed due to blemish", cmtMs);
  insertEP.run(e_bresMadeKing, tara, cmtMs);

  // 4. Bres's tyranny
  const e_bresTyranny = stmts.insEvent.run(
    "Bres's tyranny — the oppression of the Tuatha Dé",
    "Bres rules as a Fomorian puppet. Ogma carries firewood. The Dagda digs ditches. No hospitality, no poets, no entertainment. The knives of the Tuatha Dé are never greased. Crushing tribute is paid to the Fomorians.",
    "reign", null, null, "mythological", "Age of Gods — Bres's Reign", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_bresTyranny, bres, "antagonist", "Rules as a tyrant", cmtMs);
  stmts.insEC.run(e_bresTyranny, ogma, "victim", "Reduced to carrying firewood", cmtMs);
  stmts.insEC.run(e_bresTyranny, dagda, "victim", "Made to dig ditches and build a fortress", cmtMs);
  insertEP.run(e_bresTyranny, tara, cmtMs);

  // 5. Cairbre's satire deposes Bres
  const e_satire = stmts.insEvent.run(
    "Cairbre's satire deposes Bres",
    "The poet Cairbre visits Bres's court and is treated inhospitably — a dark room, no fire, three dry cakes. He composes the first satire in Ireland: 'Without food quickly on a dish...'. The satire raises boils on Bres's face, blemishing the king. The Tuatha Dé demand his abdication.",
    "meeting", null, null, "mythological", "Age of Gods — Fall of Bres", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_satire, cairbre, "protagonist", "Composes the first satire in Ireland", cmtMs);
  stmts.insEC.run(e_satire, bres, "victim", "Boils rise on his face — he is now blemished", cmtMs);
  insertEP.run(e_satire, tara, cmtMs);

  // 6. Cian meets Ethniu on Tory Island → Lugh conceived
  const e_cianEthniu = stmts.insEvent.run(
    "Cian meets Ethniu on Tory Island — Lugh is conceived",
    "Cian, disguised in woman's form with Manannán's help, reaches Ethniu imprisoned in Balor's crystal tower on Tory Island. Lugh is conceived from their union.",
    "meeting", null, null, "mythological", "Age of Gods — Origins", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_cianEthniu, cian, "protagonist", "Reaches Ethniu in Balor's tower", cmtMs);
  stmts.insEC.run(e_cianEthniu, ethniu, "protagonist", "Bears Lugh from this union", cmtMs);
  stmts.insEC.run(e_cianEthniu, balor, "mentioned", "His tower — he is unaware of the meeting", cmtMs);
  insertEP.run(e_cianEthniu, toryIsland, cmtMs);

  // 7. Nuada's arm restored — Miach surpasses Dian Cécht and is killed
  const e_armRestored = stmts.insEvent.run(
    "Dian Cécht crafts Nuada's silver arm; Miach restores flesh; Dian Cécht kills Miach",
    "Dian Cécht makes Nuada a functional silver arm. His son Miach surpasses him by causing flesh to grow — bone to bone, sinew to sinew. Dian Cécht, enraged, strikes Miach four times. Miach heals the first three wounds but the fourth blow to the brain kills him. Airmed collects 365 herbs from his grave; Dian Cécht scatters them.",
    "other", null, null, "mythological", "Age of Gods — Restoration", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_armRestored, nuada,    "protagonist", "Receives silver arm then flesh arm", cmtMs);
  stmts.insEC.run(e_armRestored, dianCecht,"protagonist", "Makes silver arm; then kills Miach", cmtMs);
  stmts.insEC.run(e_armRestored, miach,    "victim",      "Restores Nuada's real arm — killed by jealous father", cmtMs);
  stmts.insEC.run(e_armRestored, airmed,   "other",       "Collects herbs from Miach's grave", cmtMs);

  // Miach dies within this event
  R(e_armRestored, LC.miach.deathId, "causes", "certain", "Dian Cécht kills Miach during this event");

  // 8. Nuada restored as king — Bres flees
  const e_nuadaRestored = stmts.insEvent.run(
    "Nuada restored as king; Bres flees to the Fomorians",
    "With his arm restored and the blemish removed, Nuada reclaims the throne. Bres flees to his Fomorian father Elathan, then to the king Indech, to raise an army of vengeance.",
    "reign", null, null, "mythological", "Age of Gods — Restoration", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_nuadaRestored, nuada,   "protagonist", "Reclaims his throne", cmtMs);
  stmts.insEC.run(e_nuadaRestored, bres,    "antagonist",  "Flees to the Fomorians to raise an army", cmtMs);
  stmts.insEC.run(e_nuadaRestored, elathan, "mentioned",   "Bres seeks his father's support", cmtMs);
  insertEP.run(e_nuadaRestored, tara, cmtMs);

  // 9. Lugh arrives at Tara
  const e_lughArrives = stmts.insEvent.run(
    "Lugh arrives at Tara and proves himself Samildánach",
    "A young warrior arrives at Tara's gate. Asked his skill, he names every craft — smith, champion, harper, hero, poet, sorcerer, physician, cupbearer, brazier — but each is filled. Then he asks: 'Do you have anyone who possesses ALL of these?' The doorkeeper has no answer. Nuada tests him in fidchell, then cedes war command.",
    "meeting", null, null, "mythological", "Age of Gods — War Preparations", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_lughArrives, lugh,  "protagonist", "Proves himself master of all arts", cmtMs);
  stmts.insEC.run(e_lughArrives, nuada, "ally",        "Tests Lugh and cedes war command", cmtMs);
  insertEP.run(e_lughArrives, tara, cmtMs);

  // 10. War council
  const e_warCouncil = stmts.insEvent.run(
    "Lugh's war council — each craftsman pledges their magic",
    "Lugh asks each of the Tuatha Dé what they will contribute. Goibniu: three-blow weapons. Dian Cécht: the healing well. Creidne: rivets and hilts. Luchtaine: spear-shafts. The Dagda: his club. Ogma: his strength. The Morrígan: terror and pursuit. Each pledge is a magical guarantee.",
    "meeting", null, null, "mythological", "Age of Gods — War Preparations", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_warCouncil, lugh,     "protagonist", "Leads the council", cmtMs);
  stmts.insEC.run(e_warCouncil, goibniu,  "ally",        "Pledges three-blow forging", cmtMs);
  stmts.insEC.run(e_warCouncil, dianCecht,"ally",        "Pledges the Well of Healing", cmtMs);
  stmts.insEC.run(e_warCouncil, creidne,  "ally",        "Pledges magical rivets", cmtMs);
  stmts.insEC.run(e_warCouncil, luchtaine,"ally",        "Pledges three-cut spear-shafts", cmtMs);
  stmts.insEC.run(e_warCouncil, dagda,    "ally",        "Pledges his club and strength", cmtMs);
  stmts.insEC.run(e_warCouncil, ogma,     "ally",        "Pledges his champion's strength", cmtMs);
  stmts.insEC.run(e_warCouncil, morrigan, "ally",        "Pledges terror and pursuit of the enemy", cmtMs);
  insertEP.run(e_warCouncil, tara, cmtMs);

  // 11. Dagda meets the Morrígan
  const e_dagdaMorrigan = stmts.insEvent.run(
    "The Dagda mates with the Morrígan at the river Unshin on Samhain",
    "On Samhain eve, the Dagda finds the Morrígan washing at a ford, straddling the river with one foot on each bank. They mate. She promises to destroy Indech — draining his blood and scattering his kidneys before the armies.",
    "meeting", null, null, "mythological", "Age of Gods — Samhain Eve", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_dagdaMorrigan, dagda,    "protagonist", "Mates with the Morrígan", cmtMs);
  stmts.insEC.run(e_dagdaMorrigan, morrigan, "protagonist", "Promises to destroy Indech and aid the Tuatha Dé", cmtMs);
  insertEP.run(e_dagdaMorrigan, unshinRiver, cmtMs);

  // 12. Fomorian humiliation of the Dagda
  const e_dagdaHumiliation = stmts.insEvent.run(
    "The Fomorians humiliate the Dagda with a vast porridge pit",
    "The Fomorians force the Dagda to eat an enormous porridge made with meal, lard, pigs, and goats in a hole dug in the ground — mocking his famous appetite. He eats it all with a ladle the size of a man and a woman. He then falls into a heavy sleep.",
    "meeting", null, null, "mythological", "Age of Gods — War Preparations", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_dagdaHumiliation, dagda, "victim", "Humiliated by the Fomorians", cmtMs);

  // 13. Ruadán's espionage and death
  const e_ruadan = stmts.insEvent.run(
    "Ruadán spies on the forge and is killed by Goibniu",
    "Bres sends his son Ruadán to discover the Tuatha Dé weapon-making secret. Ruadán enters the forge, obtains a spear, and hurls it at Goibniu, wounding him. But Goibniu pulls the spear from his body and kills Ruadán with it. Bríg (Ruadán's mother) keens for her dead son — the first keening ever heard in Ireland.",
    "meeting", null, null, "mythological", "Age of Gods — War Preparations", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_ruadan, ruadan,  "protagonist", "Wounds Goibniu but is killed in return", cmtMs);
  stmts.insEC.run(e_ruadan, goibniu, "protagonist", "Wounded but survives; kills Ruadán", cmtMs);
  stmts.insEC.run(e_ruadan, bres,    "mentioned",   "Sent his son on the espionage mission", cmtMs);

  // Ruadán dies within this event
  R(e_ruadan, LC.ruadan.deathId, "causes", "certain", "Goibniu kills Ruadán during the espionage attempt");

  // ── THE SECOND BATTLE — parent event with children ───────────────────────

  const e_secondBattle = stmts.insEvent.run(
    "Second Battle of Mag Tuired (Cath Maige Tuired)",
    "The great war between the Tuatha Dé Danann and the Fomorians on the plain of Mag Tuired. The Tuatha Dé have the advantage of the healing well and renewed weapons. The battle is decided when Lugh kills his grandfather Balor.",
    "battle", null, null, "mythological", "Age of Gods — The Battle", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_secondBattle, lugh,    "protagonist", "Commands the Tuatha Dé forces", cmtMs);
  stmts.insEC.run(e_secondBattle, balor,   "antagonist",  "Commands the Fomorian forces", cmtMs);
  stmts.insEC.run(e_secondBattle, nuada,   "protagonist", "Fights as king", cmtMs);
  stmts.insEC.run(e_secondBattle, dagda,   "ally",        "Fights for the Tuatha Dé", cmtMs);
  stmts.insEC.run(e_secondBattle, morrigan,"ally",        "Assists the Tuatha Dé as promised", cmtMs);
  stmts.insEC.run(e_secondBattle, ogma,    "protagonist", "Champions of the Tuatha Dé", cmtMs);
  stmts.insEC.run(e_secondBattle, bres,    "antagonist",  "Fights on the Fomorian side", cmtMs);
  stmts.insEC.run(e_secondBattle, indech,  "antagonist",  "Leads Fomorian forces alongside Balor", cmtMs);
  insertEP.run(e_secondBattle, magTuired, cmtMs);

  // CHILDREN of the Second Battle (parent_event_id = e_secondBattle)

  const e_healingWell = stmts.insEvent.run(
    "The Healing Well sustains the Tuatha Dé throughout the battle",
    "Dian Cécht and his children sing incantations over the Tipra Sláine (Well of Healing). Warriors who fall are cast into the well and emerge whole. The Fomorians discover and destroy it by filling it with stones.",
    "other", e_secondBattle, null, "mythological", "Age of Gods — The Battle", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_healingWell, dianCecht, "protagonist", "Maintains the healing well", cmtMs);
  stmts.insEC.run(e_healingWell, airmed,    "ally",        "Assists with healing", cmtMs);
  insertEP.run(e_healingWell, slaneTipra, cmtMs);

  const e_nuadaDies = stmts.insEvent.run(
    "Balor kills Nuada with the Evil Eye",
    "Balor's servants lift the lid of his Evil Eye. Its gaze falls on Nuada Airgetlám, king of the Tuatha Dé Danann. Nuada is killed instantly.",
    "death", e_secondBattle, nuada, "mythological", "Age of Gods — The Battle", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_nuadaDies, nuada, "victim",     "Killed by the gaze of the Evil Eye", cmtMs);
  stmts.insEC.run(e_nuadaDies, balor, "antagonist", "Opens his eye upon the Tuatha Dé king", cmtMs);
  insertEP.run(e_nuadaDies, magTuired, cmtMs);

  // Wire Nuada's lifecycle death to this death event
  R(e_nuadaDies, LC.nuada.deathId, "meets", "certain",
    "Nuada's death event IS his lifecycle death — they are the same moment");

  const e_lughKillsBalor = stmts.insEvent.run(
    "Lugh kills Balor with a sling-stone through the Evil Eye",
    "As Balor's servants begin to lift his eyelid to destroy the Tuatha Dé, Lugh hurls a sling-stone (tathlum) with such force that it drives Balor's eye through the back of his skull. The eye's gaze now falls on the Fomorian army, devastating them. The prophecy is fulfilled: Balor dies by his own grandson's hand.",
    "meeting", e_secondBattle, null, "mythological", "Age of Gods — The Battle", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_lughKillsBalor, lugh,  "protagonist", "Fulfils the prophecy — kills his grandfather", cmtMs);
  stmts.insEC.run(e_lughKillsBalor, balor, "victim",      "Killed by his own grandson, as foretold", cmtMs);
  insertEP.run(e_lughKillsBalor, magTuired, cmtMs);

  // Balor's lifecycle death caused by this event
  R(e_lughKillsBalor, LC.balor.deathId, "causes", "certain",
    "Lugh's sling-stone kills Balor — the moment of Balor's lifecycle death");

  const e_ogmaOrna = stmts.insEvent.run(
    "Ogma defeats Indech and captures the sword Orna",
    "Ogma, champion of the Tuatha Dé, defeats the Fomorian king Indech mac Dé Domnann and captures his sword, Orna. When the sword is unsheathed and cleaned, it speaks — recounting every deed ever performed with it.",
    "meeting", e_secondBattle, null, "mythological", "Age of Gods — The Battle", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_ogmaOrna, ogma,   "protagonist", "Defeats Indech and captures Orna", cmtMs);
  stmts.insEC.run(e_ogmaOrna, indech, "antagonist",  "Defeated by Ogma; may die here", cmtMs);
  insertEP.run(e_ogmaOrna, magTuired, cmtMs);

  // 15. Victory and the Morrígan's prophecy
  const e_victory = stmts.insEvent.run(
    "The Morrígan proclaims victory and prophesies the end of the world",
    "The Fomorians are routed. The Morrígan proclaims victory to the royal hills of Ireland. She then speaks a dark prophecy of the world's end: summers flowerless, cows milkless, women shameless, men strengthless — sea and land barren. 'I shall not see a world that will be dear to me.'",
    "prophecy", null, null, "mythological", "Age of Gods — Aftermath", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_victory, morrigan, "protagonist", "Proclaims victory and speaks the eschatological prophecy", cmtMs);
  stmts.insEC.run(e_victory, lugh,     "mentioned",   "Victor of the battle", cmtMs);
  insertEP.run(e_victory, magTuired, cmtMs);

  // 16. Bres spared — teaches agriculture
  const e_bresSpared = stmts.insEvent.run(
    "Bres is spared in exchange for teaching agriculture",
    "After the battle, Bres is captured. He offers to make cows always give milk (refused). Then he offers to teach when to plough, when to sow, when to reap. This knowledge is accepted, and Bres is spared. The Tuatha Dé value agriculture over vengeance.",
    "meeting", null, null, "mythological", "Age of Gods — Aftermath", cmtMs
  ).lastInsertRowid as number;
  stmts.insEC.run(e_bresSpared, bres, "protagonist", "Trades agricultural knowledge for his life", cmtMs);
  stmts.insEC.run(e_bresSpared, lugh, "other",       "Accepts Bres's offer on behalf of the Tuatha Dé", cmtMs);

  // ── LIFECYCLE BRACKETS ────────────────────────────────────────────────────
  // Wire birth/death lifecycle events to narrative events for each character.

  addLifecycleBrackets(stmts, { name: "Nuada",
    birthId: LC.nuada.birthId, deathId: LC.nuada.deathId,
    eventIds: [e_nuadaArm, e_bresMadeKing, e_armRestored, e_nuadaRestored, e_lughArrives, e_secondBattle],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Bres",
    birthId: LC.bres.birthId, deathId: LC.bres.deathId,
    eventIds: [e_bresMadeKing, e_bresTyranny, e_satire, e_nuadaRestored, e_secondBattle, e_bresSpared],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Elathan",
    birthId: LC.elathan.birthId, deathId: LC.elathan.deathId,
    eventIds: [e_elathanEriu, e_nuadaRestored],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Ériu",
    birthId: LC.eriu.birthId, deathId: LC.eriu.deathId,
    eventIds: [e_elathanEriu],
    sourceId: lge });

  addLifecycleBrackets(stmts, { name: "Lugh",
    birthId: LC.lugh.birthId, deathId: LC.lugh.deathId,
    eventIds: [e_lughArrives, e_warCouncil, e_secondBattle, e_lughKillsBalor, e_victory, e_bresSpared],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Cian",
    birthId: LC.cian.birthId, deathId: LC.cian.deathId,
    eventIds: [e_cianEthniu],
    sourceId: lge });

  addLifecycleBrackets(stmts, { name: "Ethniu",
    birthId: LC.ethniu.birthId, deathId: LC.ethniu.deathId,
    eventIds: [e_cianEthniu],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Balor",
    birthId: LC.balor.birthId, deathId: LC.balor.deathId,
    eventIds: [e_cianEthniu, e_secondBattle, e_nuadaDies, e_lughKillsBalor],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Indech",
    birthId: LC.indech.birthId, deathId: LC.indech.deathId,
    eventIds: [e_secondBattle, e_ogmaOrna],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Dian Cécht",
    birthId: LC.dianCecht.birthId, deathId: LC.dianCecht.deathId,
    eventIds: [e_armRestored, e_warCouncil, e_healingWell],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Miach",
    birthId: LC.miach.birthId, deathId: LC.miach.deathId,
    eventIds: [e_armRestored],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Airmed",
    birthId: LC.airmed.birthId, deathId: LC.airmed.deathId,
    eventIds: [e_armRestored, e_healingWell],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Goibniu",
    birthId: LC.goibniu.birthId, deathId: LC.goibniu.deathId,
    eventIds: [e_warCouncil, e_ruadan],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Luchtaine",
    birthId: LC.luchtaine.birthId, deathId: LC.luchtaine.deathId,
    eventIds: [e_warCouncil],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Creidne",
    birthId: LC.creidne.birthId, deathId: LC.creidne.deathId,
    eventIds: [e_warCouncil],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "The Dagda",
    birthId: LC.dagda.birthId, deathId: LC.dagda.deathId,
    eventIds: [e_bresTyranny, e_warCouncil, e_dagdaMorrigan, e_dagdaHumiliation, e_secondBattle],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "The Morrígan",
    birthId: LC.morrigan.birthId, deathId: LC.morrigan.deathId,
    eventIds: [e_warCouncil, e_dagdaMorrigan, e_secondBattle, e_victory],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Cairbre",
    birthId: LC.cairbre.birthId, deathId: LC.cairbre.deathId,
    eventIds: [e_satire],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Ogma",
    birthId: LC.ogma.birthId, deathId: LC.ogma.deathId,
    eventIds: [e_bresTyranny, e_warCouncil, e_secondBattle, e_ogmaOrna],
    sourceId: cmtMs });

  addLifecycleBrackets(stmts, { name: "Ruadán",
    birthId: LC.ruadan.birthId, deathId: LC.ruadan.deathId,
    eventIds: [e_ruadan],
    sourceId: cmtMs });

  // Bres must exist before Ruadán's birth (Bres is the father)
  R(LC.bres.birthId, LC.ruadan.birthId, "before", "certain",
    "Bres (Ruadán's father) must be born before Ruadán");

  // ── NARRATIVE ORDERING ────────────────────────────────────────────────────

  // Origins (parallel — independent genealogical threads)
  R(e_elathanEriu, LC.bres.birthId, "causes", "certain",
    "Elathan-Ériu union causes Bres's birth");
  R(e_cianEthniu, LC.lugh.birthId, "causes", "certain",
    "Cian-Ethniu union causes Lugh's birth");
  R(LC.tailtiu.deathId, e_lughArrives, "before", "probable",
    "Tailtiu died before Lugh came of age and arrived at Tara");

  // Main narrative chain
  R(e_nuadaArm,    e_bresMadeKing, "causes",  "certain",  "Nuada's blemish necessitates Bres's kingship");
  R(e_bresMadeKing,e_bresTyranny,  "before",  "certain",  "Bres must be king before his tyranny");
  R(e_bresTyranny, e_satire,       "before",  "certain",  "Cairbre visits during Bres's tyrannical reign");
  R(e_satire,      e_nuadaRestored,"causes",  "certain",  "Bres's deposition (caused by satire) allows Nuada's return");
  R(e_nuadaArm,    e_armRestored,  "before",  "certain",  "Nuada must lose his arm before it can be healed");
  R(e_armRestored, e_nuadaRestored,"before",  "certain",  "Nuada needs arm restored before reclaiming the throne");
  R(e_nuadaRestored,e_lughArrives, "before",  "certain",  "Nuada must be king when Lugh arrives");
  R(e_lughArrives, e_warCouncil,   "before",  "certain",  "Lugh must arrive before he can lead the war council");
  R(e_warCouncil,  e_dagdaMorrigan,"before",  "probable", "War preparations precede Samhain eve encounter");
  R(e_warCouncil,  e_dagdaHumiliation,"before","probable","War preparations period encompasses Dagda's humiliation");
  R(e_warCouncil,  e_ruadan,       "before",  "certain",  "The forge must be operating before Ruadán can spy on it");
  R(e_cianEthniu,  e_lughArrives,  "before",  "certain",  "Lugh must be born before arriving at Tara");

  // Bres contacts Fomorians after deposition — connects to Second Battle
  R(e_nuadaRestored,e_secondBattle,"before",  "certain",  "Bres flees to Fomorians after deposition, sets up the war");

  // Battle ordering
  R(e_dagdaMorrigan,e_secondBattle,"before",  "certain",  "Morrígan's alliance secured before battle");
  R(e_ruadan,       e_secondBattle,"before",  "probable", "Ruadán's espionage occurs during preparations, before the main battle");
  R(e_lughArrives,  e_secondBattle,"before",  "certain",  "Lugh must be established at Tara before commanding the war");

  // Children contained within Second Battle
  R(e_secondBattle, e_healingWell,  "contains","certain", "The healing well operates throughout the Second Battle");
  R(e_secondBattle, e_nuadaDies,    "contains","certain", "Nuada's death occurs during the Second Battle");
  R(e_secondBattle, e_lughKillsBalor,"contains","certain","Lugh kills Balor during the Second Battle");
  R(e_secondBattle, e_ogmaOrna,     "contains","certain", "Ogma defeats Indech during the Second Battle");

  // Internal battle ordering (what we can infer)
  R(e_nuadaDies,    e_lughKillsBalor,"before", "probable","Nuada's death motivates Lugh's direct confrontation with Balor");
  R(e_healingWell,  e_nuadaDies,     "parallel","certain","The healing well and the battles proceed simultaneously");

  // Aftermath
  R(e_lughKillsBalor,e_victory,     "causes",  "certain", "Balor's death turns the tide — the Morrígan can proclaim victory");
  R(e_secondBattle, e_victory,      "meets",   "certain", "The Morrígan's proclamation immediately follows the battle's end");
  R(e_victory,      e_bresSpared,   "meets",   "certain", "Bres is captured and spared right after the battle");
};
