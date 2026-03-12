/**
 * Deep seed: Cath Maige Tuired (The Second Battle of Mag Tuired)
 *
 * The full narrative broken into granular events, with every character,
 * relationship, place, and object tracked in detail. This seed is
 * designed to stress-test the schema and find structural gaps.
 *
 * Based on the 9th-century Irish text preserved in British Library
 * MS Harley 5280 and the CELT edition (T300010).
 */
import type { Seed } from "./types";

export const name = "Cath Maige Tuired — Deep Dive";
export const description =
  "Complete narrative of the Second Battle. ~25 characters, ~15 events, full genealogy. Schema stress-test.";

export const seed: Seed["seed"] = (db) => {
  // ── SOURCES ──────────────────────────────────────────────────────────────
  const insertSource = db.prepare(
    `INSERT INTO sources (title, type, author, year, url, notes) VALUES (?,?,?,?,?,?)`
  );

  const cmtMs = insertSource.run(
    "Cath Maige Tuired (CELT edition T300010)",
    "manuscript",
    null,
    900,
    "https://celt.ucc.ie/published/T300010/",
    "The primary text. 9th-century composition, preserved in 16th-century Harley MS 5280."
  ).lastInsertRowid as number;

  const lge = insertSource.run(
    "Lebor Gabála Érenn",
    "manuscript",
    null,
    1150,
    "https://celt.ucc.ie/published/T100055/",
    "Provides broader genealogical context for the Tuatha Dé Danann."
  ).lastInsertRowid as number;

  const grayEdition = insertSource.run(
    "Cath Maige Tuired: The Second Battle of Mag Tuired",
    "scholarly",
    "Elizabeth A. Gray",
    1982,
    null,
    "Standard modern edition and translation with commentary. Irish Texts Society vol. 52."
  ).lastInsertRowid as number;

  // ── GROUPS ───────────────────────────────────────────────────────────────
  const insertGroup = db.prepare(
    `INSERT INTO groups (name, alt_names, description, source_id) VALUES (?,?,?,?)`
  );

  const tuatha = insertGroup.run(
    "Tuatha Dé Danann",
    JSON.stringify(["People of the Goddess Danu", "Tribe of the Gods"]),
    "The divine race who came to Ireland from the northern islands of the world. They brought four treasures and defeated the Fir Bolg.",
    lge
  ).lastInsertRowid as number;

  const fomor = insertGroup.run(
    "Fomorians",
    JSON.stringify(["Fomoire", "Fomori", "Fomóraig"]),
    "Primordial beings from under the sea and beyond the horizon. They represent chaos, darkness, and the untamed forces of nature. Under Balor, they oppressed the Tuatha Dé Danann during Bres's reign.",
    cmtMs
  ).lastInsertRowid as number;

  const firBolg = insertGroup.run(
    "Fir Bolg",
    JSON.stringify(["Men of Bags", "Builg"]),
    "The pre-divine inhabitants of Ireland, defeated by the Tuatha Dé Danann at the First Battle of Mag Tuired.",
    lge
  ).lastInsertRowid as number;

  // ── CHARACTERS ───────────────────────────────────────────────────────────
  const insertChar = db.prepare(
    `INSERT INTO characters (name, alt_names, gender, description, epithet, is_deity, source_id) VALUES (?,?,?,?,?,?,?)`
  );
  const insertCG = db.prepare(
    `INSERT INTO character_groups (character_id, group_id, source_id) VALUES (?,?,?)`
  );
  const insertProp = db.prepare(
    `INSERT INTO character_properties (character_id, type, value, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insertRel = db.prepare(
    `INSERT INTO family_relations (from_character_id, to_character_id, relation_type, notes, source_id) VALUES (?,?,?,?,?)`
  );

  // ─── The Kings ───────────────────────────────────────────────────────────

  const nuada = insertChar.run(
    "Nuada",
    JSON.stringify(["Nuada Airgetlám", "Nudd", "Nodens"]),
    "male",
    "First king of the Tuatha Dé Danann. Lost his right arm to the Fir Bolg champion Sreng at the First Battle of Mag Tuired. The law said no blemished man could be king, so he was replaced by Bres. After Dian Cécht crafted a silver arm, and later Miach restored his flesh arm, he reclaimed the throne — only to be killed by Balor at the Second Battle.",
    "Airgetlám (Silver Hand/Arm)",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(nuada, tuatha, cmtMs);
  insertProp.run(nuada, "weapon", "Claíomh Solais (Sword of Light)", "One of the Four Treasures — brought from the city of Findias. No one could escape it once drawn.", cmtMs);
  insertProp.run(nuada, "attribute", "Silver arm (airget-lám)", "First a silver prosthetic by Dian Cécht, then restored to flesh by Miach", cmtMs);

  const bres = insertChar.run(
    "Bres",
    JSON.stringify(["Bres mac Elathan", "Eochaid Bres", "Bres the Beautiful"]),
    "male",
    "Half-Fomorian, half-Tuatha Dé. Made king after Nuada lost his arm, but he ruled as a tyrant — taxing the Tuatha Dé, giving the Fomorians tribute, and showing no hospitality. The poet Cairbre satirized him, and he was deposed. He then went to the Fomorians to raise an army against his former people.",
    "Bres the Beautiful",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(bres, tuatha, cmtMs);
  insertCG.run(bres, fomor, cmtMs);
  insertProp.run(bres, "attribute", "Inhospitable king", "Failed to provide food, drink, or entertainment to guests — a grave offence in Irish law", cmtMs);

  // ─── Bres's parents ──────────────────────────────────────────────────────

  const elathan = insertChar.run(
    "Elathan",
    JSON.stringify(["Elatha mac Delbáeth"]),
    "male",
    "Fomorian prince and father of Bres. Came from the sea in a silver boat to lie with Ériu. Later, when Bres was deposed, Elathan refused to help him reclaim the throne unjustly.",
    null,
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(elathan, fomor, cmtMs);
  insertRel.run(elathan, bres, "father", "Elathan came from the sea and fathered Bres on Ériu", cmtMs);

  const eriu = insertChar.run(
    "Ériu",
    JSON.stringify(["Éire", "Erin"]),
    "female",
    "Goddess of the sovereignty of Ireland. Mother of Bres by the Fomorian Elathan. One of three sisters (Ériu, Banba, Fódla) who gave Ireland its names.",
    "Sovereignty of Ireland",
    1, lge
  ).lastInsertRowid as number;
  insertCG.run(eriu, tuatha, lge);
  insertRel.run(eriu, bres, "mother", "Ériu bore Bres after her union with the Fomorian Elathan", cmtMs);

  // ─── The Champion: Lugh ──────────────────────────────────────────────────

  const lugh = insertChar.run(
    "Lugh",
    JSON.stringify(["Lugh Lámhfhada", "Lugh Samildánach", "Lleu", "Lugus"]),
    "male",
    "God of all skills. Son of Cian (Tuatha Dé) and Ethniu (daughter of Balor). Raised in fosterage by Tailtiu and by Manannán mac Lir. Arrived at Tara during Nuada's restored reign and proved himself master of every craft at the gate. Nuada gave him command of the war effort. He killed his grandfather Balor by slinging a stone through his Evil Eye.",
    "Samildánach (Equally Skilled in All Arts), Lámhfhada (of the Long Arm)",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(lugh, tuatha, cmtMs);
  insertProp.run(lugh, "weapon", "Sling-stone (tathlum)", "The weapon he used to kill Balor — drove his eye through the back of his head", cmtMs);
  insertProp.run(lugh, "weapon", "Spear of Lugh (Areadbhair)", "One of the Four Treasures — brought from Gorias. Its tip had to be quenched in a cauldron of poppy juice lest it destroy the city.", cmtMs);
  insertProp.run(lugh, "skill", "Samildánach — all crafts", "At the gate of Tara he claimed: wright, smith, champion, harper, hero, poet, sorcerer, physician, cupbearer, brazier", cmtMs);
  insertProp.run(lugh, "attribute", "Master strategist", "Organized the war preparations, assigned each craftsman a magical role in the coming battle", cmtMs);

  // Lugh's parents
  const cian = insertChar.run(
    "Cian",
    JSON.stringify(["Cian mac Dian Cécht", "Scal Balb"]),
    "male",
    "Son of the physician-god Dian Cécht. Father of Lugh. Disguised himself in woman's form to reach Ethniu in Balor's tower on Tory Island.",
    null, 1, lge
  ).lastInsertRowid as number;
  insertCG.run(cian, tuatha, lge);
  insertRel.run(cian, lugh, "father", "Cian is Lugh's father, from the Tuatha Dé side", lge);

  const ethniu = insertChar.run(
    "Ethniu",
    JSON.stringify(["Eithne", "Ethnea"]),
    "female",
    "Daughter of Balor, mother of Lugh. Balor imprisoned her in a crystal tower on Tory Island after a prophecy said her son would kill him. Cian reached her through trickery.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(ethniu, fomor, cmtMs);
  insertRel.run(ethniu, lugh, "mother", "Ethniu bore Lugh after Cian reached her in Balor's tower", cmtMs);

  // ─── The Fomorian Lords ──────────────────────────────────────────────────

  const balor = insertChar.run(
    "Balor",
    JSON.stringify(["Balor of the Evil Eye", "Balor Béimnech", "Balor Birugderc"]),
    "male",
    "King of the Fomorians and grandfather of Lugh. His single enormous eye, when opened, could kill entire armies. It required four men with a polished handle to lift the lid. He gained this power as a boy when he looked into a window where his father's druids were brewing a potion of death. Killed Nuada in the Second Battle before Lugh destroyed his eye with a sling-stone.",
    "Birugderc (of the Piercing Eye)",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(balor, fomor, cmtMs);
  insertProp.run(balor, "attribute", "Evil Eye (Súil Mhilltach)", "A single eye whose gaze killed all who looked upon it. Required four men with a hook to open. Gained when he saw druid poison being brewed as a child.", cmtMs);
  insertRel.run(balor, ethniu, "father", "Balor imprisoned his daughter Ethniu to prevent the prophecy", cmtMs);
  insertRel.run(balor, lugh, "other", "Maternal grandfather — killed by Lugh, fulfilling the prophecy", cmtMs);

  const indech = insertChar.run(
    "Indech",
    JSON.stringify(["Indech mac Dé Domnann"]),
    "male",
    "Fomorian king, one of Balor's chief allies. Fought in the Second Battle of Mag Tuired.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(indech, fomor, cmtMs);

  // ─── The Craftsmen and Healers ───────────────────────────────────────────

  const dianCecht = insertChar.run(
    "Dian Cécht",
    JSON.stringify(["Dían Cécht"]),
    "male",
    "Chief physician of the Tuatha Dé Danann. Crafted Nuada's silver arm. During the battle, he sang incantations over a well (Slane's Well / Tipra Sláine) into which wounded warriors were cast and emerged healed. Jealous of his son Miach's superior healing, he killed him.",
    "Divine Physician",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(dianCecht, tuatha, cmtMs);
  insertProp.run(dianCecht, "skill", "Healing magic", "With Creidne, Luchtaine, and his children, he maintained the Well of Healing (Tipra Sláine) during battle", cmtMs);
  insertProp.run(dianCecht, "attribute", "Well of Healing (Tipra Sláine)", "Wounded Tuatha Dé warriors were cast into this well and emerged whole — a decisive advantage in the battle", cmtMs);
  insertRel.run(dianCecht, cian, "father", "Dian Cécht is father of Cian, making him Lugh's grandfather on the paternal side", lge);

  const miach = insertChar.run(
    "Miach",
    JSON.stringify(["Miach mac Dian Cécht"]),
    "male",
    "Son of Dian Cécht. A more skilled healer than his father — he replaced Nuada's silver arm with a real arm of flesh. Dian Cécht, jealous of this feat, struck Miach three times; Miach healed each wound. On the fourth blow to the brain, Miach died. 365 herbs grew from his grave.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(miach, tuatha, cmtMs);
  insertProp.run(miach, "skill", "Flesh restoration", "Replaced Nuada's silver arm with a living arm — bone to bone, sinew to sinew", cmtMs);
  insertRel.run(dianCecht, miach, "father", "Dian Cécht killed his own son out of jealousy", cmtMs);

  const airmed = insertChar.run(
    "Airmed",
    JSON.stringify(["Airmid"]),
    "female",
    "Daughter of Dian Cécht, sister of Miach. After Miach's death, 365 herbs grew from his grave. Airmed sorted them by their healing properties, but Dian Cécht scattered them — which is why no one knows all the herbs of healing.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(airmed, tuatha, cmtMs);
  insertProp.run(airmed, "skill", "Herbal knowledge", "She catalogued 365 herbs from Miach's grave before Dian Cécht destroyed her work", cmtMs);
  insertRel.run(dianCecht, airmed, "father", null, cmtMs);
  insertRel.run(miach, airmed, "sibling", "Brother and sister, both children of Dian Cécht", cmtMs);

  const goibniu = insertChar.run(
    "Goibniu",
    JSON.stringify(["Goibhniu", "Gaibne"]),
    "male",
    "Divine smith of the Tuatha Dé Danann. One of the Trí Dé Dána (Three Gods of Craft). Could forge a perfect weapon in three blows. Hosted the Fled Goibnenn — a feast whose ale granted immortality.",
    "The Smith",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(goibniu, tuatha, cmtMs);
  insertProp.run(goibniu, "skill", "Three-blow forging", "Could make a perfect spearhead or sword in exactly three strikes", cmtMs);
  insertProp.run(goibniu, "attribute", "Fled Goibnenn (Goibniu's Feast)", "His ale preserved the Tuatha Dé from age and sickness", cmtMs);

  const luchtaine = insertChar.run(
    "Luchtaine",
    JSON.stringify(["Luchta"]),
    "male",
    "Divine carpenter/wright of the Tuatha Dé Danann. One of the Trí Dé Dána. During the battle preparations, he crafted spear-shafts in three cuts.",
    "The Wright",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(luchtaine, tuatha, cmtMs);
  insertProp.run(luchtaine, "skill", "Three-cut shafts", "Made perfect spear-shafts in three cuts of the axe", cmtMs);

  const creidne = insertChar.run(
    "Creidne",
    JSON.stringify(["Credne"]),
    "male",
    "Divine brazier/metalworker of the Tuatha Dé Danann. Third of the Trí Dé Dána. Made rivets, sword hilts, and shield rims. Together with Goibniu and Luchtaine, they formed the divine manufacturing line for weapons.",
    "The Brazier",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(creidne, tuatha, cmtMs);
  insertProp.run(creidne, "skill", "Rivet-making", "His rivets flew into the spear-shafts from his tongs without needing holes bored", cmtMs);

  // ─── The Dagda ───────────────────────────────────────────────────────────

  const dagda = insertChar.run(
    "The Dagda",
    JSON.stringify(["Eochaid Ollathair", "Ruad Rofhessa", "Deirgderc", "In Dagda Mór"]),
    "male",
    "Father-god. Before the battle he mated with the Morrígan at the river Unshin at Samhain — securing her alliance. The Fomorians humiliated him by making him eat a vast porridge from a hole in the ground (mocking his famous appetite). Yet he remained powerful: his club could kill nine men with one end and revive them with the other. His cauldron fed all and left none hungry. His harp Uaithne controlled the seasons and emotions.",
    "Eochaid Ollathair (Father of All), Ruad Rofhessa (Lord of Great Knowledge)",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(dagda, tuatha, cmtMs);
  insertProp.run(dagda, "weapon", "Lorg Mór (The Great Club)", "Kills nine with one end, revives with the other. So heavy it left a track like a boundary ditch.", cmtMs);
  insertProp.run(dagda, "attribute", "Undruimne (Cauldron of the Dagda)", "One of the Four Treasures — brought from Murias. No company ever went away unsatisfied.", cmtMs);
  insertProp.run(dagda, "attribute", "Uaithne (The Dagda's Harp)", "Also called Daur Dá Bláo and Cóir Cetharchair. When played, it commanded sorrow, joy, and sleep.", cmtMs);

  // ─── The Morrígan ────────────────────────────────────────────────────────

  const morrigan = insertChar.run(
    "The Morrígan",
    JSON.stringify(["Morrigan", "Morrígu", "Phantom Queen", "Anand"]),
    "female",
    "Triple goddess of war, fate, and sovereignty. She mated with the Dagda at the river Unshin before the battle, promising to aid the Tuatha Dé. After the battle, she proclaimed victory and prophesied the end of the world. Her three aspects are Badb (crow), Macha (sovereignty), and Nemain (battle frenzy).",
    "Phantom Queen",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(morrigan, tuatha, cmtMs);
  insertProp.run(morrigan, "animal", "Crow (badb catha)", "Appears as a hooded crow on battlefields", cmtMs);
  insertProp.run(morrigan, "skill", "Prophecy", "After the battle she prophesied both peace and the eventual end of the world", cmtMs);
  insertProp.run(morrigan, "attribute", "Triple aspect", "Badb (crow/war), Macha (sovereignty/horses), Nemain (frenzy/panic)", cmtMs);

  // ─── The Poet ────────────────────────────────────────────────────────────

  const cairbre = insertChar.run(
    "Cairbre mac Étaine",
    JSON.stringify(["Cairbre", "Coirpre"]),
    "male",
    "Chief poet (ollam) of the Tuatha Dé Danann. He visited Bres's court and was treated inhospitably — given a tiny dark room with no fire, no food, and a dry bed. In revenge, he composed the first satire ever made in Ireland, which raised boils on Bres's face — making him blemished and thus unfit to be king.",
    "Chief Poet of the Tuatha Dé",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(cairbre, tuatha, cmtMs);
  insertProp.run(cairbre, "skill", "Satire (áer)", "His satire against Bres was the first ever composed in Ireland and had physical power — raising boils on the king's face", cmtMs);

  // ─── Ogma ────────────────────────────────────────────────────────────────

  const ogma = insertChar.run(
    "Ogma",
    JSON.stringify(["Ogma Gríanainech", "Ogmios"]),
    "male",
    "Champion of the Tuatha Dé Danann and inventor of ogham script. During Bres's tyranny, Ogma was reduced to carrying firewood — a humiliation for the champion. In the Second Battle he fought Indech mac Dé Domnann and captured the sword Orna, which could recount all deeds done with it.",
    "Gríanainech (Sun-Faced)",
    1, cmtMs
  ).lastInsertRowid as number;
  insertCG.run(ogma, tuatha, cmtMs);
  insertProp.run(ogma, "weapon", "Orna", "Captured from Indech — a sword that spoke and recounted every deed performed with it when unsheathed", cmtMs);
  insertProp.run(ogma, "skill", "Inventor of Ogham", "Created the ogham alphabet, the first writing system in Ireland", lge);
  insertRel.run(dagda, ogma, "sibling", "Ogma and the Dagda are brothers in many genealogies", lge);

  // ─── Lugh's foster-mother ────────────────────────────────────────────────

  const tailtiu = insertChar.run(
    "Tailtiu",
    JSON.stringify(["Tailltiu"]),
    "female",
    "Foster-mother of Lugh. Originally a Fir Bolg princess. She cleared the forest of Coill Cuan to make a plain for agriculture and died of exhaustion. Lugh established the festival of Lughnasadh in her honour.",
    null, 0, lge
  ).lastInsertRowid as number;
  insertCG.run(tailtiu, firBolg, lge);
  insertRel.run(tailtiu, lugh, "foster_parent", "Tailtiu raised Lugh; he established Lughnasadh games in her memory", lge);

  // ─── Ruadán ──────────────────────────────────────────────────────────────

  const ruadan = insertChar.run(
    "Ruadán",
    JSON.stringify(["Rúadán mac Bres"]),
    "male",
    "Son of Bres and Bríg. Sent by the Fomorians as a spy to discover the secret of the Tuatha Dé weapons. He wounded Goibniu with a spear, but Goibniu pulled it out and killed him. Bríg's keening for Ruadán was the first keening heard in Ireland.",
    null, 1, cmtMs
  ).lastInsertRowid as number;
  insertRel.run(bres, ruadan, "father", "Bres sent his own son as a spy", cmtMs);
  insertProp.run(ruadan, "attribute", "First keened death", "His mother Bríg's mourning cry was the first keening in Ireland", cmtMs);

  // ── PLACES ───────────────────────────────────────────────────────────────
  const insertPlace = db.prepare(
    `INSERT INTO places (name, alt_names, type, modern_equivalent, description, source_id) VALUES (?,?,?,?,?,?)`
  );

  const magTuired = insertPlace.run(
    "Mag Tuired",
    JSON.stringify(["Moytura", "Plain of Pillars", "Mag Tuired na bFomorach"]),
    "plain",
    "Cong area, County Mayo / County Sligo (debated)",
    "The plain where both great battles were fought. The name means 'Plain of Pillars', possibly referring to standing stones. The First Battle was near Cong (Mayo), the Second near Lough Arrow (Sligo).",
    cmtMs
  ).lastInsertRowid as number;

  const tara = insertPlace.run(
    "Tara",
    JSON.stringify(["Teamhair", "Teamhair na Rí"]),
    "hill",
    "Hill of Tara, County Meath",
    "Seat of the High Kings. Where Lugh arrived and proved his skills at the gate. The Lia Fáil (Stone of Destiny) stood here.",
    cmtMs
  ).lastInsertRowid as number;

  const toryIsland = insertPlace.run(
    "Tory Island",
    JSON.stringify(["Tor Inis", "Toraigh"]),
    "island",
    "Tory Island, County Donegal",
    "Balor's island fortress off the northwest coast. Here he imprisoned Ethniu in a crystal tower to prevent the prophecy of his death.",
    cmtMs
  ).lastInsertRowid as number;

  const unshinRiver = insertPlace.run(
    "River Unshin",
    JSON.stringify(["Abhainn Unciú"]),
    "river",
    "River Unshin, County Sligo",
    "Where the Dagda mated with the Morrígan on Samhain eve before the battle. She was washing at a ford, straddling the river with one foot on each bank.",
    cmtMs
  ).lastInsertRowid as number;

  const slaneTipra = insertPlace.run(
    "Tipra Sláine (Well of Healing)",
    JSON.stringify(["Well of Slane", "Loch Luibe"]),
    "other",
    null,
    "The enchanted well where Dian Cécht and his children sang incantations. Wounded warriors were cast in and emerged whole. The Fomorians discovered and destroyed it by piling stones into it.",
    cmtMs
  ).lastInsertRowid as number;

  // ── EVENTS (the full narrative arc) ──────────────────────────────────────
  const insertEvent = db.prepare(
    `INSERT INTO events (name, description, cycle, approximate_era, source_id) VALUES (?,?,?,?,?)`
  );
  const insertEC = db.prepare(
    `INSERT INTO event_characters (event_id, character_id, role, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insertEP = db.prepare(
    `INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`
  );
  const insertDep = db.prepare(
    `INSERT INTO event_dependencies (before_event_id, after_event_id, reason, confidence, source_id) VALUES (?,?,?,?,?)`
  );

  // 1. Nuada loses his arm
  const e_nuadaArm = insertEvent.run(
    "Nuada loses his arm at the First Battle",
    "In the First Battle of Mag Tuired, Nuada fights the Fir Bolg champion Sreng. Sreng's sword-blow cuts off Nuada's right arm at the shoulder. The Tuatha Dé win the battle but Nuada is now blemished.",
    "mythological", "Age of Gods — Arrival", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_nuadaArm, nuada, "victim", "Loses his arm to Sreng", cmtMs);
  insertEP.run(e_nuadaArm, magTuired, cmtMs);

  // 2. Bres made king
  const e_bresMadeKing = insertEvent.run(
    "Bres made king of the Tuatha Dé Danann",
    "Since no blemished man may be king, Nuada is deposed. The Tuatha Dé offer the kingship to Bres — half-Fomorian, half-Tuatha Dé — hoping to forge peace. They give him Bríg in marriage. It is a catastrophic mistake.",
    "mythological", "Age of Gods — Bres's Reign", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_bresMadeKing, bres, "protagonist", "Accepts the kingship", cmtMs);
  insertEC.run(e_bresMadeKing, nuada, "mentioned", "Deposed due to blemish", cmtMs);
  insertEP.run(e_bresMadeKing, tara, cmtMs);

  // 3. Bres's tyranny
  const e_bresTyranny = insertEvent.run(
    "Bres's tyranny and the oppression of the Tuatha Dé",
    "Bres rules as a Fomorian puppet. He imposes crushing tribute. The great champions are humiliated: Ogma carries firewood, the Dagda digs ditches. There is no hospitality — no ale, no poets, no entertainment at court. The knives of the Tuatha Dé are never greased.",
    "mythological", "Age of Gods — Bres's Reign", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_bresTyranny, bres, "antagonist", "Rules as a tyrant", cmtMs);
  insertEC.run(e_bresTyranny, ogma, "victim", "Reduced to carrying firewood", cmtMs);
  insertEC.run(e_bresTyranny, dagda, "victim", "Made to dig ditches and build a fortress", cmtMs);
  insertEP.run(e_bresTyranny, tara, cmtMs);

  // 4. Cairbre's satire
  const e_satire = insertEvent.run(
    "Cairbre's satire deposes Bres",
    "The poet Cairbre visits Bres's court. He is given a dark room, no fire, three dry cakes, no butter. He composes the first satire: 'Without food quickly on a dish, / Without milk enough for a calf... / That is the condition of Bres.' The satire raises boils on Bres's face, blemishing the king. The Tuatha Dé demand his abdication.",
    "mythological", "Age of Gods — Fall of Bres", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_satire, cairbre, "protagonist", "Composes the first satire in Ireland", cmtMs);
  insertEC.run(e_satire, bres, "victim", "Boils rise on his face — he is now blemished", cmtMs);
  insertEP.run(e_satire, tara, cmtMs);

  // 5. Nuada's arm restored
  const e_silverArm = insertEvent.run(
    "Dian Cécht crafts Nuada's silver arm; Miach restores flesh",
    "The physician Dian Cécht makes Nuada a functional arm of silver. Later, his son Miach surpasses him by causing flesh to grow over the silver — 'joint to joint, sinew to sinew.' Dian Cécht, enraged with jealousy, strikes Miach four times. Miach heals the first three wounds, but the fourth (to the brain) kills him.",
    "mythological", "Age of Gods — Restoration", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_silverArm, nuada, "protagonist", "Receives first a silver arm, then a flesh one", cmtMs);
  insertEC.run(e_silverArm, dianCecht, "ally", "Creates the silver arm but then murders his own son", cmtMs);
  insertEC.run(e_silverArm, miach, "protagonist", "Restores Nuada's real arm — killed by his jealous father", cmtMs);
  insertEC.run(e_silverArm, airmed, "mentioned", "Miach's sister, who later collected healing herbs from his grave", cmtMs);

  // 6. Nuada restored as king
  const e_nuadaRestored = insertEvent.run(
    "Nuada restored as king",
    "With his arm restored and the blemish removed, Nuada reclaims the throne. Bres flees to the Fomorians to seek vengeance.",
    "mythological", "Age of Gods — Restoration", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_nuadaRestored, nuada, "protagonist", "Reclaims his throne", cmtMs);
  insertEC.run(e_nuadaRestored, bres, "antagonist", "Flees to the Fomorians", cmtMs);
  insertEP.run(e_nuadaRestored, tara, cmtMs);

  // 7. Lugh arrives at Tara
  const e_lughArrives = insertEvent.run(
    "Lugh arrives at Tara and proves himself Samildánach",
    "A young warrior arrives at the gate of Tara. The doorkeeper asks his skill. Lugh names each craft — smith, champion, harper, hero, poet, sorcerer, physician, cupbearer, brazier — but is told each is already filled. Then Lugh asks: 'Do you have anyone who possesses ALL of these arts?' The doorkeeper has no answer. Nuada tests Lugh in a fidchell game, then cedes command of the war to him.",
    "mythological", "Age of Gods — War Preparations", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_lughArrives, lugh, "protagonist", "Proves himself master of all arts", cmtMs);
  insertEC.run(e_lughArrives, nuada, "ally", "Tests Lugh and cedes war command", cmtMs);
  insertEP.run(e_lughArrives, tara, cmtMs);

  // 8. War council: Lugh questions each craftsman
  const e_warCouncil = insertEvent.run(
    "Lugh's war council — each craftsman pledges their magic",
    "Lugh asks each of the Tuatha Dé what they will contribute to the battle. Goibniu: three-blow weapons. Dian Cécht: healing the wounded. Creidne: rivets and hilts. Luchtaine: spear-shafts. The Dagda: his club. Ogma: his strength. The Morrígan: terror and destruction. Each pledge is a magical guarantee — the weapons will never miss, the dead will rise from the well.",
    "mythological", "Age of Gods — War Preparations", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_warCouncil, lugh, "protagonist", "Leads the council", cmtMs);
  insertEC.run(e_warCouncil, goibniu, "ally", "Pledges three-blow forging", cmtMs);
  insertEC.run(e_warCouncil, dianCecht, "ally", "Pledges the Well of Healing", cmtMs);
  insertEC.run(e_warCouncil, creidne, "ally", "Pledges magical rivets", cmtMs);
  insertEC.run(e_warCouncil, luchtaine, "ally", "Pledges three-cut shafts", cmtMs);
  insertEC.run(e_warCouncil, dagda, "ally", "Pledges his club and strength", cmtMs);
  insertEC.run(e_warCouncil, ogma, "ally", "Pledges his champion's strength", cmtMs);
  insertEC.run(e_warCouncil, morrigan, "ally", "Pledges terror and pursuit of the enemy", cmtMs);
  insertEP.run(e_warCouncil, tara, cmtMs);

  // 9. Dagda meets the Morrígan
  const e_dagdaMorrigan = insertEvent.run(
    "The Dagda mates with the Morrígan at the Unshin",
    "On Samhain eve, the Dagda goes to the river Unshin. He finds the Morrígan washing herself, straddling the river with one foot on each bank. They mate, and she promises to assist the Tuatha Dé by destroying the Fomorian king Indech — draining his blood and scattering his kidneys before the armies.",
    "mythological", "Age of Gods — Samhain Eve", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_dagdaMorrigan, dagda, "protagonist", "Mates with the Morrígan to secure her aid", cmtMs);
  insertEC.run(e_dagdaMorrigan, morrigan, "protagonist", "Promises to destroy Indech and aid the Tuatha Dé", cmtMs);
  insertEP.run(e_dagdaMorrigan, unshinRiver, cmtMs);

  // 10. Ruadán's espionage and death
  const e_ruadan = insertEvent.run(
    "Ruadán spies on the forge and is killed by Goibniu",
    "Bres sends his son Ruadán to discover the secret of the Tuatha Dé weapon-making. Ruadán enters the forge and sees the three craftsmen at work. He obtains a spear and hurls it at Goibniu, wounding him. But Goibniu pulls the spear from his body and casts it back, killing Ruadán. Bríg (Ruadán's mother) keens for her dead son — the first keening ever heard in Ireland.",
    "mythological", "Age of Gods — War Preparations", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_ruadan, ruadan, "protagonist", "Wounded Goibniu but was killed in return", cmtMs);
  insertEC.run(e_ruadan, goibniu, "protagonist", "Wounded but survived; killed Ruadán", cmtMs);
  insertEC.run(e_ruadan, bres, "mentioned", "Sent his own son on the espionage mission", cmtMs);

  // 11. The Battle begins
  const e_battleBegins = insertEvent.run(
    "The Second Battle of Mag Tuired begins",
    "The two armies array on the plain of Mag Tuired. The Fomorians marvel: every weapon broken in battle is replaced overnight by the three craftsmen, and every warrior killed rises from the Well of Healing. The Fomorians send a spy who discovers the well.",
    "mythological", "Age of Gods — The Battle", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_battleBegins, lugh, "protagonist", "Commands the Tuatha Dé forces", cmtMs);
  insertEC.run(e_battleBegins, balor, "antagonist", "Commands the Fomorian forces", cmtMs);
  insertEC.run(e_battleBegins, nuada, "protagonist", "Fights as king", cmtMs);
  insertEP.run(e_battleBegins, magTuired, cmtMs);

  // 12. Balor kills Nuada
  const e_nuadaDies = insertEvent.run(
    "Balor kills Nuada with the Evil Eye",
    "In the thick of battle, Balor's servants lift the lid of his Evil Eye. Its gaze falls on Nuada Airgetlám. The king of the Tuatha Dé Danann is killed instantly.",
    "mythological", "Age of Gods — The Battle", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_nuadaDies, nuada, "victim", "Killed by the gaze of the Evil Eye", cmtMs);
  insertEC.run(e_nuadaDies, balor, "antagonist", "Opens his eye upon the Tuatha Dé king", cmtMs);
  insertEP.run(e_nuadaDies, magTuired, cmtMs);

  // 13. Lugh kills Balor
  const e_lughKillsBalor = insertEvent.run(
    "Lugh kills Balor with a sling-stone through the Evil Eye",
    "As Balor's servants begin to lift his eyelid again, Lugh hurls a sling-stone (tathlum) with such force that it drives Balor's eye through the back of his skull. The eye's gaze now falls on the Fomorian army, devastating their own ranks. The prophecy is fulfilled: Balor is killed by his own grandson.",
    "mythological", "Age of Gods — The Battle", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_lughKillsBalor, lugh, "protagonist", "Fulfils the prophecy — kills his grandfather with a sling-stone", cmtMs);
  insertEC.run(e_lughKillsBalor, balor, "victim", "Killed by his own grandson, as foretold", cmtMs);
  insertEP.run(e_lughKillsBalor, magTuired, cmtMs);

  // 14. Ogma captures Orna
  const e_ogmaOrna = insertEvent.run(
    "Ogma captures the sword Orna from Indech",
    "Ogma, champion of the Tuatha Dé, fights Indech mac Dé Domnann. He defeats the Fomorian king and takes his sword, Orna. When the sword is unsheathed and cleaned, it speaks — recounting every deed ever done with it.",
    "mythological", "Age of Gods — The Battle", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_ogmaOrna, ogma, "protagonist", "Defeats Indech and captures Orna", cmtMs);
  insertEC.run(e_ogmaOrna, indech, "antagonist", "Defeated by Ogma", cmtMs);
  insertEP.run(e_ogmaOrna, magTuired, cmtMs);

  // 15. Victory and the Morrígan's prophecy
  const e_victory = insertEvent.run(
    "The Morrígan proclaims victory and prophesies the end of the world",
    "The Fomorians are routed. The Morrígan proclaims victory to the royal hills of Ireland, to the hosts, to the waters. She then speaks a dark prophecy of the world's end: a time when summers will be flowerless, cows milkless, women shameless, men strengthless — the sea and land will be barren. 'I shall not see a world that will be dear to me.'",
    "mythological", "Age of Gods — Aftermath", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_victory, morrigan, "protagonist", "Proclaims victory and speaks the eschatological prophecy", cmtMs);
  insertEC.run(e_victory, lugh, "mentioned", "Victor of the battle", cmtMs);
  insertEP.run(e_victory, magTuired, cmtMs);

  // 16. Bres spared — teaches agriculture
  const e_bresSpared = insertEvent.run(
    "Bres is spared in exchange for teaching agriculture",
    "After the battle, Bres is captured. He begs for his life, offering first to make the cows of Ireland always give milk (refused — 'you have no power over their nature'). Then he offers to teach when to plough, when to sow, and when to reap. This knowledge is accepted, and Bres is spared.",
    "mythological", "Age of Gods — Aftermath", cmtMs
  ).lastInsertRowid as number;
  insertEC.run(e_bresSpared, bres, "protagonist", "Trades agricultural knowledge for his life", cmtMs);
  insertEC.run(e_bresSpared, lugh, "other", "Accepts Bres's offer", cmtMs);

  // ── EVENT DEPENDENCIES ─────────────────────────────────────────────────
  // The narrative chain
  insertDep.run(e_nuadaArm, e_bresMadeKing, "Nuada's blemish from losing his arm is why Bres becomes king", "certain", cmtMs);
  insertDep.run(e_bresMadeKing, e_bresTyranny, "Bres must be king before his tyranny can occur", "certain", cmtMs);
  insertDep.run(e_bresTyranny, e_satire, "Cairbre visits the court during Bres's tyrannical reign", "certain", cmtMs);
  insertDep.run(e_nuadaArm, e_silverArm, "Nuada must lose his arm before it can be healed", "certain", cmtMs);
  insertDep.run(e_satire, e_nuadaRestored, "Bres's deposition allows Nuada's return", "certain", cmtMs);
  insertDep.run(e_silverArm, e_nuadaRestored, "Nuada needs his arm restored before he can be king again", "certain", cmtMs);
  insertDep.run(e_nuadaRestored, e_lughArrives, "Nuada must be king when Lugh arrives at Tara", "certain", cmtMs);
  insertDep.run(e_lughArrives, e_warCouncil, "Lugh must arrive before he can lead the war council", "certain", cmtMs);
  insertDep.run(e_warCouncil, e_dagdaMorrigan, "War preparations precede the Samhain eve encounter", "probable", cmtMs);
  insertDep.run(e_warCouncil, e_ruadan, "The forge must be operating before Ruadán can spy on it", "certain", cmtMs);
  insertDep.run(e_dagdaMorrigan, e_battleBegins, "The Morrígan's aid must be secured before battle", "certain", cmtMs);
  insertDep.run(e_ruadan, e_battleBegins, "Ruadán's espionage occurs during preparations, before the main battle", "probable", cmtMs);
  insertDep.run(e_battleBegins, e_nuadaDies, "The battle must begin before Nuada can fall in it", "certain", cmtMs);
  insertDep.run(e_nuadaDies, e_lughKillsBalor, "Nuada's death motivates Lugh's direct confrontation with Balor", "probable", cmtMs);
  insertDep.run(e_battleBegins, e_ogmaOrna, "Ogma fights Indech during the battle", "certain", cmtMs);
  insertDep.run(e_lughKillsBalor, e_victory, "Balor's death turns the tide, leading to victory", "certain", cmtMs);
  insertDep.run(e_victory, e_bresSpared, "Bres is captured after the Fomorian defeat", "certain", cmtMs);
};
