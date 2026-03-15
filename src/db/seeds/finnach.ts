/**
 * Seed: Gods and Fighting Men (Lady Gregory, 1905)
 *
 * Covers two interlocking cycles:
 *   Part I  — The Gods:      The Fate of the Children of Lir
 *   Part II — The Fianna:    The Coming of Finn + the Battle of the White Strand
 *
 * Characters, events, lifecycle brackets, and event_relations following the
 * same conventions as cmt-deep.ts.
 */
import type { Seed } from "./types";
import { makeStatements, mkLifecycle, addLifecycleBrackets } from "./_helpers";

export const name = "Gods and Fighting Men (Lady Gregory)";
export const description =
  "Children of Lir + Fenian cycle. 18 characters with lifecycles, 14 narrative events, full event_relations network.";

export const seed: Seed["seed"] = (db) => {
  // ── SOURCES ──────────────────────────────────────────────────────────────
  const insertSource = db.prepare(
    `INSERT INTO sources (title, type, author, year, url, notes) VALUES (?,?,?,?,?,?)`
  );

  const gfm = insertSource.run(
    "Gods and Fighting Men", "folklore", "Lady Gregory", 1905,
    "https://www.gutenberg.org/ebooks/14465",
    "Popular English retelling of Tuatha Dé Danann and Fenian tales. Gutenberg eBook #14465."
  ).lastInsertRowid as number;

  // ── GROUPS ───────────────────────────────────────────────────────────────
  const insertGroup = db.prepare(
    `INSERT OR IGNORE INTO groups (name, alt_names, description, source_id) VALUES (?,?,?,?)`
  );
  const selectGroup = db.prepare(`SELECT id FROM groups WHERE name = ?`);

  const upsertGroup = (name: string, altNames: string[], description: string, sourceId: number): number => {
    insertGroup.run(name, JSON.stringify(altNames), description, sourceId);
    return (selectGroup.get(name) as { id: number }).id;
  };

  const tuatha = upsertGroup(
    "Tuatha Dé Danann",
    ["People of the Goddess Danu", "Tribe of the Gods", "Men of Dea"],
    "The divine race who ruled Ireland before the coming of the Gael. After defeat they retreated into the hills and became the Sídhe.",
    gfm
  );

  const fianna = upsertGroup(
    "Fianna of Ireland",
    ["An Fhiann", "Fian"],
    "The warrior band of Ireland, led by Finn mac Cumhaill. Guardians of the High King, renowned hunters and fighters.",
    gfm
  );

  const sonsOfMorna = upsertGroup(
    "Sons of Morna",
    ["Clann Mhorna", "Morna's clan"],
    "The rival clan of Goll mac Morna, who slew Cumhal and took leadership of the Fianna before Finn reclaimed it.",
    gfm
  );

  const armiesOfTheWorld = upsertGroup(
    "Armies of the World",
    ["Great World Alliance", "Forces of Daire Donn"],
    "The foreign alliance assembled by Daire Donn, High King of the Great World, to conquer Ireland at the Battle of the White Strand.",
    gfm
  );

  // ── PREPARED STATEMENTS ──────────────────────────────────────────────────
  const insertChar = db.prepare(
    `INSERT INTO characters (name, alt_names, gender, description, epithet, is_deity, source_id)
     VALUES (?,?,?,?,?,?,?)`
  );
  const insertCG = db.prepare(
    `INSERT INTO character_groups (character_id, group_id, source_id) VALUES (?,?,?)`
  );
  const insertFam = db.prepare(
    `INSERT INTO family_relations (from_character_id, to_character_id, relation_type, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insertProp = db.prepare(
    `INSERT INTO character_properties (character_id, type, value, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insertPlace = db.prepare(
    `INSERT INTO places (name, alt_names, type, modern_equivalent, description, source_id) VALUES (?,?,?,?,?,?)`
  );
  const insertEP = db.prepare(
    `INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`
  );

  const stmts = makeStatements(db);
  const R = (from: number, to: number, type: string, conf: string, reason: string, src: number = gfm) =>
    stmts.insRel.run(from, to, type, conf, reason, src);

  // ── PART I: GODS — Characters ─────────────────────────────────────────────

  const lir = insertChar.run(
    "Lir", JSON.stringify(["Lir of Sidhe Fionnachaidh", "Ler"]),
    "male",
    "One of the lords of the Tuatha Dé Danann, dwelling at Sidhe Fionnachaidh (Hill of the White Field). Father of the four children whose stepmother Aoife transformed them into swans. He refused to accept Bodb Dearg as king after the battle of Tailltin, but was later reconciled through marriage.",
    "Lord of Sidhe Fionnachaidh", 1, gfm
  ).lastInsertRowid as number;
  insertCG.run(lir, tuatha, gfm);

  const bodbDearg = insertChar.run(
    "Bodb Dearg", JSON.stringify(["Bodb the Red", "Bodb Derg", "son of the Dagda"]),
    "male",
    "Son of the Dagda, chosen as High King of the Tuatha Dé Danann after the battle of Tailltin. Ruled wisely from Sidhe Femen (Loch Dearg). He punished Aoife for cursing the children of Lir by turning her into a witch of the air.",
    "High King of the Tuatha Dé Danann", 1, gfm
  ).lastInsertRowid as number;
  insertCG.run(bodbDearg, tuatha, gfm);

  const aobh = insertChar.run(
    "Aobh", JSON.stringify(["Aobh, daughter of Oilell of Aran", "Aev"]),
    "female",
    "First wife of Lir, eldest foster-daughter of Bodb Dearg. She bore Lir two children before her first confinement: Fionnuala and Aodh. She died at the birth of her twins Fiachra and Conn. Her death brought grief to Lir and set in motion the tragedy of the children.",
    null, 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(aobh, tuatha, gfm);

  const aoife = insertChar.run(
    "Aoife", JSON.stringify(["Aoife, daughter of Oilell of Aran", "Aoife the Jealous"]),
    "female",
    "Second wife of Lir, younger sister of Aobh. Consumed by jealousy of Lir's love for his four children, she transformed them into swans at Loch Dairbhreach using a druid rod, condemning them to 900 years in bird-form. Bodb Dearg punished her by turning her into a witch of the air, a form she keeps to the end of time.",
    "The Jealous Stepmother", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(aoife, tuatha, gfm);
  insertProp.run(aoife, "skill", "Druid magic", "Used a druid rod (slat draíochta) to transform the children of Lir into swans", gfm);

  const oilellOfAran = insertChar.run(
    "Oilell of Aran", JSON.stringify(["Oilill of Aran"]),
    "male",
    "Father of Aobh, Aoife, and Ailbhe; foster-father of the three daughters was Bodb Dearg. His daughters were described as the three women of the best shape, appearance, and name in all Ireland.",
    null, 0, gfm
  ).lastInsertRowid as number;

  const fionnuala = insertChar.run(
    "Fionnuala", JSON.stringify(["Fionnghuala", "Finnuala"]),
    "female",
    "Eldest daughter of Lir and Aobh. Leader and protector of her three brothers through 900 years as swans. She sheltered Conn under her left wing, Fiachra under her right, and Aodh at her breast during storms. She directed their baptism and burial before they died. Her laments are among the most beautiful passages in the story.",
    "Eldest of the Children of Lir", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(fionnuala, tuatha, gfm);
  insertProp.run(fionnuala, "skill", "Sweet music of the Sídhe", "Their singing could send all hearers into peaceful sleep and was unmatched in Ireland", gfm);

  const aodh = insertChar.run(
    "Aodh", JSON.stringify(["Aed", "Hugh"]),
    "male",
    "Son of Lir and Aobh, second eldest of the four children. Transformed into a swan with his siblings. In the storm on the Sea of Moyle he arrived last — but his head was dry and his feathers beautiful, suggesting supernatural endurance.",
    null, 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(aodh, tuatha, gfm);

  const fiachra = insertChar.run(
    "Fiachra", JSON.stringify(["Fiacra"]),
    "male",
    "Son of Lir and Aobh, younger twin. Transformed into a swan. Born alongside Conn at the birth that killed their mother Aobh. Survived 900 years of exile under Fionnuala's protection.",
    null, 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(fiachra, tuatha, gfm);

  const conn = insertChar.run(
    "Conn", JSON.stringify(["Conn of the Children of Lir"]),
    "male",
    "Youngest son of Lir and Aobh, younger twin. Transformed into a swan. Named possibly after 'Conn Cétchathach'. During the great storm on the Sea of Moyle, he arrived at the Rock of the Seals cold and perished — sheltered under Fionnuala's left wing.",
    null, 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(conn, tuatha, gfm);

  // ── PART II: FIANNA — Characters ──────────────────────────────────────────

  const cumhal = insertChar.run(
    "Cumhal", JSON.stringify(["Cumhal mac Trenmor", "Cool"]),
    "male",
    "Head of the Fianna of Ireland and father of Finn. Son of Trenmor, of the sons of Baiscne. He was killed in battle by the Sons of Morna, who disputed his leadership. His death forced Muirne to hide their infant son Finn.",
    "Head of the Fianna", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(cumhal, fianna, gfm);

  const finn = insertChar.run(
    "Finn mac Cumhaill", JSON.stringify(["Fionn mac Cumhaill", "Finn", "Demne", "Fionn"]),
    "male",
    "Son of Cumhal and Muirne. Leader of the Fianna of Ireland. Raised in hiding by Bodhmall and Liath Luachra. Gained prophetic wisdom by accidentally tasting the Salmon of Knowledge. Claimed his father's place at Teamhair by slaying the fire-breathing Aillen, then led the Fianna for hundreds of years through hunting, enchantments, and the great Battle of the White Strand.",
    "Demne (childhood name); Finn (Fair)", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(finn, fianna, gfm);
  insertProp.run(finn, "skill", "Imbas forosnai (prophetic wisdom)", "Obtained by tasting the Salmon of Knowledge at the Boinn — accessed by biting his thumb", gfm);
  insertProp.run(finn, "skill", "Poetry", "Proved his bardic learning by composing praise-verse for the month of May", gfm);
  insertProp.run(finn, "weapon", "Spear", "Used against Aillen mac Midhna to stay awake through the fairy music", gfm);

  const gollMacMorna = insertChar.run(
    "Goll mac Morna", JSON.stringify(["Goll", "Aodh mac Morna"]),
    "male",
    "Chief of the Sons of Morna, leader of the Fianna after slaying Cumhal. When Finn proved himself at Teamhair, Goll gave his submission and thereafter served loyally alongside Finn. He died alone of hunger in a cave rather than accept defeat, but spoke beautiful words to his wife.",
    "One-Eyed Champion", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(gollMacMorna, sonsOfMorna, gfm);
  insertCG.run(gollMacMorna, fianna, gfm);

  const caoilte = insertChar.run(
    "Caoilte mac Ronáin", JSON.stringify(["Caoilte", "Caelte", "Cailte"]),
    "male",
    "One of the swiftest men of the Fianna, poet and champion. He was present at the gathering when Finn first came to Teamhair and remained one of the last survivors of the Fianna, outliving most of his companions. He is among the figures who appear in old age speaking to St Patrick.",
    "Swiftest of the Fianna", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(caoilte, fianna, gfm);
  insertProp.run(caoilte, "skill", "Running", "Best runner of all the Fianna — could outpace any pursuit", gfm);
  insertProp.run(caoilte, "skill", "Poetry", "Memory and recitation of the Fianna's deeds", gfm);

  const oisin = insertChar.run(
    "Oisín", JSON.stringify(["Oisin", "Ossian"]),
    "male",
    "Son of Finn mac Cumhaill and Sadb (a woman of the Sídhe). Renowned poet of the Fianna and father of Osgar. After the end of the Fianna he travelled to the Land of Youth (Tír na nÓg) and returned centuries later to find his world gone, where he disputed with St Patrick about the old heroic life.",
    "Poet of the Fianna", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(oisin, fianna, gfm);
  insertProp.run(oisin, "skill", "Poetry", "Greatest poet of the Fianna; his laments are celebrated", gfm);

  const osgar = insertChar.run(
    "Osgar", JSON.stringify(["Oscar"]),
    "male",
    "Son of Oisín and grandson of Finn mac Cumhaill. Considered the greatest warrior of the Fianna. He died at the Battle of Gabhra in the decline of the Fianna — proud and unbowed even in his death, saying 'I am as you would have me be'.",
    "Greatest Warrior of the Fianna", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(osgar, fianna, gfm);

  const diarmuid = insertChar.run(
    "Diarmuid ua Duibhne", JSON.stringify(["Diarmuid", "Dermot O'Dyna"]),
    "male",
    "A leading champion of the Fianna, grandson of Duibhne. Famous for the love-spot on his forehead that made any woman who saw it fall in love with him. He eloped with Grania, Finn's promised bride, and spent years as a fugitive before making peace. He was killed by the enchanted boar of Beinn Gulbain.",
    "The Love-Spot", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(diarmuid, fianna, gfm);
  insertProp.run(diarmuid, "attribute", "Love-spot (ball seirce)", "Any woman who looked on it was consumed with love for him — obtained at Donn mac Midhir's house", gfm);

  const daireDonn = insertChar.run(
    "Daire Donn", JSON.stringify(["King of the World", "High King of the Great World"]),
    "male",
    "High King of the Great World and leader of the foreign alliance against Ireland. Assembled kings from Greece, France, Lochlann, the Cat-Heads, the Dog-Heads, and many other nations for the Battle of the White Strand. Killed by Finn during the great battle.",
    "High King of the Great World", 0, gfm
  ).lastInsertRowid as number;
  insertCG.run(daireDonn, armiesOfTheWorld, gfm);

  const muirne = insertChar.run(
    "Muirne", JSON.stringify(["Muirne of the White Neck", "Muirne Muncháem"]),
    "female",
    "Mother of Finn mac Cumhaill, daughter of Tadg son of Nuada of the Tuatha Dé Danann, and of Ethlinn (mother of Lugh of the Long Hand). Long-haired and beautiful. She dared not keep her infant son after Cumhal's death and gave him to the two women druids to raise in secret.",
    "White-Necked Muirne", 0, gfm
  ).lastInsertRowid as number;

  // ── FAMILY RELATIONS ──────────────────────────────────────────────────────

  // Children of Lir
  insertFam.run(oilellOfAran, aobh,      "father",   "Oilell of Aran is father of Aobh", gfm);
  insertFam.run(oilellOfAran, aoife,     "father",   "Oilell of Aran is father of Aoife", gfm);
  insertFam.run(aobh,         aoife,     "sibling",  "Aobh and Aoife are sisters, daughters of Oilell of Aran", gfm);
  insertFam.run(lir,          aobh,      "spouse",   "Lir's first wife, chosen at Bodb's hall — he took the eldest as noblest", gfm);
  insertFam.run(lir,          aoife,     "spouse",   "Lir's second wife, given by Bodb after Aobh's death", gfm);
  insertFam.run(lir,          fionnuala, "father",   "Lir's eldest daughter, born before the twins", gfm);
  insertFam.run(aobh,         fionnuala, "mother",   "Aobh bore Fionnuala and Aodh before dying at the birth of the twins", gfm);
  insertFam.run(lir,          aodh,      "father",   null, gfm);
  insertFam.run(aobh,         aodh,      "mother",   null, gfm);
  insertFam.run(lir,          fiachra,   "father",   "One of the twin sons whose birth cost Aobh her life", gfm);
  insertFam.run(aobh,         fiachra,   "mother",   "Aobh died giving birth to Fiachra and Conn", gfm);
  insertFam.run(lir,          conn,      "father",   "Youngest son, twin of Fiachra", gfm);
  insertFam.run(aobh,         conn,      "mother",   "Aobh died giving birth to Conn and Fiachra", gfm);
  insertFam.run(fionnuala,    aodh,      "sibling",  null, gfm);
  insertFam.run(fionnuala,    fiachra,   "sibling",  null, gfm);
  insertFam.run(fionnuala,    conn,      "sibling",  null, gfm);
  insertFam.run(aodh,         fiachra,   "sibling",  null, gfm);
  insertFam.run(aodh,         conn,      "sibling",  null, gfm);
  insertFam.run(fiachra,      conn,      "sibling",  "Twins", gfm);

  // Fianna
  insertFam.run(cumhal,  finn,   "father",       "Cumhal was killed before Finn was born — Finn never knew him", gfm);
  insertFam.run(muirne,  finn,   "mother",       "Muirne hid Finn from the sons of Morna", gfm);
  insertFam.run(finn,    oisin,  "father",       "Oisín's mother was Sadb, a woman of the Sídhe", gfm);
  insertFam.run(oisin,   osgar,  "father",       "Osgar is Oisín's son and Finn's grandson", gfm);
  insertFam.run(finn,    osgar,  "grandparent",  "Finn's grandson, greatest warrior of the Fianna", gfm);

  // ── PLACES ───────────────────────────────────────────────────────────────
  const lochDairbhreach = insertPlace.run(
    "Loch Dairbhreach", JSON.stringify(["Lake of the Oaks", "Lough Derravaragh"]),
    "island", "Lough Derravaragh, County Westmeath",
    "Where Aoife struck the children of Lir with her druid rod and transformed them into swans. They spent their first 300 years here, singing to the Men of Dea and Sons of Gael.",
    gfm
  ).lastInsertRowid as number;

  const sruthNaMaoile = insertPlace.run(
    "Sruth na Maoile", JSON.stringify(["Sea of Moyle", "North Channel"]),
    "sea", "North Channel between Ireland and Scotland",
    "The cold, stormy strait between Ireland and Alban (Scotland). The children of Lir spent their second 300 years here, enduring frost, storms, and loneliness at Carraig na Ron (Rock of the Seals).",
    gfm
  ).lastInsertRowid as number;

  const inisGluaire = insertPlace.run(
    "Inis Gluaire", JSON.stringify(["Inishglora"]),
    "island", "Inishglora, off the coast of Mayo",
    "The island in the west of Ireland where the children of Lir spent their final 300 years. Saint Mochaomhog came here, and it was here that the spell was at last broken.",
    gfm
  ).lastInsertRowid as number;

  const sidheFionnachaidh = insertPlace.run(
    "Sidhe Fionnachaidh", JSON.stringify(["Hill of the White Field", "Síde Fionnachaid"]),
    "hill", "Uncertain; possibly north Ulster",
    "The sidhe-mound dwelling of Lir, where the four children were raised and where they returned during their exile on Sruth na Maoile to sing sweet music one last night.",
    gfm
  ).lastInsertRowid as number;

  const teamhair = insertPlace.run(
    "Teamhair", JSON.stringify(["Tara", "Teamhair na Rí"]),
    "hill", "Hill of Tara, County Meath",
    "The seat of the High Kings. Finn came here at Samhain to claim his father's place as head of the Fianna, killing the fire-breathing Aillen mac Midhna on the lawn of Teamhair.",
    gfm
  ).lastInsertRowid as number;

  const whiteStrand = insertPlace.run(
    "White Strand", JSON.stringify(["Traigh Eochaille", "Corca Duibhne harbour"]),
    "sea", "Ventry Strand, County Kerry",
    "The white sandy harbour in Munster (Corca Duibhne) where Daire Donn's armies landed and the great battle was fought between the Fianna and the Armies of the World.",
    gfm
  ).lastInsertRowid as number;

  // ── LIFECYCLES ───────────────────────────────────────────────────────────
  const lc = {
    lir:       mkLifecycle(stmts, { characterId: lir,       name: "Lir",              cycle: "mythological", sourceId: gfm }),
    bodbDearg: mkLifecycle(stmts, { characterId: bodbDearg, name: "Bodb Dearg",        cycle: "mythological", sourceId: gfm }),
    aobh:      mkLifecycle(stmts, { characterId: aobh,      name: "Aobh",              cycle: "mythological", sourceId: gfm }),
    aoife:     mkLifecycle(stmts, { characterId: aoife,     name: "Aoife",             cycle: "mythological", sourceId: gfm }),
    fionnuala: mkLifecycle(stmts, { characterId: fionnuala, name: "Fionnuala",         cycle: "mythological", sourceId: gfm }),
    aodh:      mkLifecycle(stmts, { characterId: aodh,      name: "Aodh",              cycle: "mythological", sourceId: gfm }),
    fiachra:   mkLifecycle(stmts, { characterId: fiachra,   name: "Fiachra",           cycle: "mythological", sourceId: gfm }),
    conn:      mkLifecycle(stmts, { characterId: conn,      name: "Conn",              cycle: "mythological", sourceId: gfm }),
    cumhal:    mkLifecycle(stmts, { characterId: cumhal,    name: "Cumhal",            cycle: "fenian",       sourceId: gfm }),
    finn:      mkLifecycle(stmts, { characterId: finn,      name: "Finn mac Cumhaill", cycle: "fenian",       sourceId: gfm }),
    goll:      mkLifecycle(stmts, { characterId: gollMacMorna, name: "Goll mac Morna", cycle: "fenian",       sourceId: gfm }),
    caoilte:   mkLifecycle(stmts, { characterId: caoilte,   name: "Caoilte mac Ronáin",cycle: "fenian",       sourceId: gfm }),
    oisin:     mkLifecycle(stmts, { characterId: oisin,     name: "Oisín",             cycle: "fenian",       sourceId: gfm }),
    osgar:     mkLifecycle(stmts, { characterId: osgar,     name: "Osgar",             cycle: "fenian",       sourceId: gfm }),
    diarmuid:  mkLifecycle(stmts, { characterId: diarmuid,  name: "Diarmuid",          cycle: "fenian",       sourceId: gfm }),
    daireDonn: mkLifecycle(stmts, { characterId: daireDonn, name: "Daire Donn",        cycle: "fenian",       sourceId: gfm }),
  };

  // ── NARRATIVE EVENTS ─────────────────────────────────────────────────────

  // — Mythological cycle: Children of Lir —

  const battleOfTailltin = stmts.insEvent.run(
    "Battle of Tailltin",
    "The Tuatha Dé Danann are defeated by the Sons of Miled (the Gael). After the battle a king is chosen from among the Tuatha Dé — Bodb Dearg is selected, though Lir resents the choice and leaves without submission.",
    "battle", null, null, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(battleOfTailltin, bodbDearg, "protagonist", "Bodb is chosen king after Tailltin", gfm);
  stmts.insEC.run(battleOfTailltin, lir, "other", "Lir refuses to submit and withdraws", gfm);

  const lirMarriesAobh = stmts.insEvent.run(
    "Lir Marries Aobh",
    "Reconciled with Bodb Dearg through the offer of a bride, Lir travels to Loch Dearg and chooses Aobh, eldest of the three daughters of Oilell of Aran. He stops for a fortnight and brings her home to Sidhe Fionnachaidh for a wedding-feast.",
    "meeting", null, null, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(lirMarriesAobh, lir, "protagonist", null, gfm);
  stmts.insEC.run(lirMarriesAobh, aobh, "protagonist", null, gfm);
  stmts.insEC.run(lirMarriesAobh, bodbDearg, "ally", "Gave Aobh as bride to reconcile with Lir", gfm);

  const deathOfAobh = stmts.insEvent.run(
    "Death of Aobh",
    "Aobh dies in childbirth, delivering the twins Fiachra and Conn. She had already borne Fionnuala and Aodh. Lir is devastated; only his love for the four children keeps him from dying of grief.",
    "death", null, aobh, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(deathOfAobh, aobh, "victim", null, gfm);
  stmts.insEC.run(deathOfAobh, lir, "other", "Lir mourns deeply", gfm);

  const birthOfTwins = stmts.insEvent.run(
    "Birth of Fiachra and Conn",
    "Aobh gives birth to twin sons Fiachra and Conn, dying at their birth. This is the fourth child-birth; the first had produced Fionnuala and Aodh.",
    "birth", null, null, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(birthOfTwins, fiachra, "protagonist", null, gfm);
  stmts.insEC.run(birthOfTwins, conn, "protagonist", null, gfm);

  const lirMarriesAoife = stmts.insEvent.run(
    "Lir Marries Aoife",
    "Bodb Dearg offers Aoife, Aobh's sister, to Lir as a second wife. Lir accepts and brings her home. At first there is honour and affection between Aoife and the children, but jealousy grows.",
    "meeting", null, null, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(lirMarriesAoife, lir, "protagonist", null, gfm);
  stmts.insEC.run(lirMarriesAoife, aoife, "protagonist", null, gfm);
  stmts.insEC.run(lirMarriesAoife, bodbDearg, "ally", null, gfm);

  const transformationOfChildren = stmts.insEvent.run(
    "Transformation of the Children of Lir",
    "Aoife drives the four children towards Bodb's palace but stops at Loch Dairbhreach. There she strikes them with a druid rod and transforms them into four white swans, sentencing them to 900 years in bird-form: 300 years on Loch Dairbhreach, 300 on Sruth na Maoile, and 300 at Irrus Domnann and Inis Gluaire. The condition of release: when the Woman from the South and the Man from the North come together.",
    "transformation", null, null, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(transformationOfChildren, aoife, "protagonist", "Struck the children with a druid rod", gfm);
  stmts.insEC.run(transformationOfChildren, fionnuala, "victim", null, gfm);
  stmts.insEC.run(transformationOfChildren, aodh, "victim", null, gfm);
  stmts.insEC.run(transformationOfChildren, fiachra, "victim", null, gfm);
  stmts.insEC.run(transformationOfChildren, conn, "victim", null, gfm);
  insertEP.run(transformationOfChildren, lochDairbhreach, gfm);

  const aoifePunished = stmts.insEvent.run(
    "Aoife Punished by Bodb Dearg",
    "When Lir reveals what Aoife did, Bodb Dearg strikes her with a druid wand and turns her into a witch of the air. She flies away in that shape and remains so to the end of life and time.",
    "transformation", null, aoife, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(aoifePunished, bodbDearg, "protagonist", "Punished Aoife for the curse on the children", gfm);
  stmts.insEC.run(aoifePunished, aoife, "victim", "Turned into a witch of the air forever", gfm);
  stmts.insEC.run(aoifePunished, lir, "other", "Lir revealed the treachery", gfm);

  const yearsOnLochDairbhreach = stmts.insEvent.run(
    "300 Years on Loch Dairbhreach",
    "The children of Lir spend 300 years as swans on Loch Dairbhreach, singing sweet music of the Sídhe. The Men of Dea and Sons of Gael gather to hear them. At the end Fionnuala leads her brothers away north to the Sea of Moyle.",
    "reign", null, null, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(yearsOnLochDairbhreach, fionnuala, "protagonist", null, gfm);
  stmts.insEC.run(yearsOnLochDairbhreach, aodh, "protagonist", null, gfm);
  stmts.insEC.run(yearsOnLochDairbhreach, fiachra, "protagonist", null, gfm);
  stmts.insEC.run(yearsOnLochDairbhreach, conn, "protagonist", null, gfm);
  stmts.insEC.run(yearsOnLochDairbhreach, bodbDearg, "ally", "Came to the shore with the Tuatha Dé to hear the swans", gfm);
  stmts.insEC.run(yearsOnLochDairbhreach, lir, "ally", "Lir came to listen to his children", gfm);
  insertEP.run(yearsOnLochDairbhreach, lochDairbhreach, gfm);

  const yearsOnMaoile = stmts.insEvent.run(
    "300 Years on the Sea of Moyle",
    "The children spend 300 cold and stormy years on Sruth na Maoile between Ireland and Alban. They endure a great storm that separates them; Fionnuala gathers her brothers at Carraig na Ron. Their feathers freeze to the rock in winter. They return briefly to Sidhe Fionnachaidh.",
    "journey", null, null, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(yearsOnMaoile, fionnuala, "protagonist", "Protected her brothers through cold and storm", gfm);
  stmts.insEC.run(yearsOnMaoile, aodh, "protagonist", null, gfm);
  stmts.insEC.run(yearsOnMaoile, fiachra, "protagonist", null, gfm);
  stmts.insEC.run(yearsOnMaoile, conn, "protagonist", null, gfm);
  insertEP.run(yearsOnMaoile, sruthNaMaoile, gfm);
  insertEP.run(yearsOnMaoile, sidheFionnachaidh, gfm);

  const yearsAtInisGluaire = stmts.insEvent.run(
    "300 Years at Inis Gluaire",
    "The children spend their final 300 years at Inis Gluaire off the Connacht coast. They meet a young man Aibric who loves their singing and records their story. Saint Mochaomhog comes to the island; the children hear his bell and submit to him, wearing silver chains.",
    "journey", null, null, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(yearsAtInisGluaire, fionnuala, "protagonist", null, gfm);
  stmts.insEC.run(yearsAtInisGluaire, aodh, "protagonist", null, gfm);
  stmts.insEC.run(yearsAtInisGluaire, fiachra, "protagonist", null, gfm);
  stmts.insEC.run(yearsAtInisGluaire, conn, "protagonist", null, gfm);
  insertEP.run(yearsAtInisGluaire, inisGluaire, gfm);

  const deathOfChildrenOfLir = stmts.insEvent.run(
    "Death of the Children of Lir",
    "King Lairgnen seizes the swans from Mochaomhog's altar. Their bird-skins fall away revealing four withered old people. Fionnuala asks to be baptized and buried — Conn at her right side, Fiachra at her left, Aodh before her face between her arms. They are baptized and die. A stone is raised over them and their names written in Ogham.",
    "death", null, null, "mythological", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(deathOfChildrenOfLir, fionnuala, "victim", null, gfm);
  stmts.insEC.run(deathOfChildrenOfLir, aodh, "victim", null, gfm);
  stmts.insEC.run(deathOfChildrenOfLir, fiachra, "victim", null, gfm);
  stmts.insEC.run(deathOfChildrenOfLir, conn, "victim", null, gfm);
  insertEP.run(deathOfChildrenOfLir, inisGluaire, gfm);

  // — Fenian cycle —

  const deathOfCumhal = stmts.insEvent.run(
    "Death of Cumhal",
    "Cumhal, Head of the Fianna, is killed in battle by the Sons of Morna who dispute his leadership. His wife Muirne is pregnant with Finn. His death forces Muirne to give the infant Finn to two women druids to be raised in hiding.",
    "battle", null, cumhal, "fenian", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(deathOfCumhal, cumhal, "victim", null, gfm);
  stmts.insEC.run(deathOfCumhal, gollMacMorna, "protagonist", "Goll mac Morna led the Sons of Morna against Cumhal", gfm);

  const comingOfFinn = stmts.insEvent.run(
    "The Coming of Finn",
    "Finn mac Cumhaill, raised in hiding, arrives at the Samhain gathering of the High King at Teamhair. He slays the fire-breathing Aillen mac Midhna, who had been burning the hall every year for 23 years. As reward Finn is given his father's place as Head of the Fianna. Goll mac Morna submits and joins Finn.",
    "battle", null, null, "fenian", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(comingOfFinn, finn, "protagonist", "Killed Aillen with his poisoned spear, staying awake despite the fairy music", gfm);
  stmts.insEC.run(comingOfFinn, gollMacMorna, "other", "Submitted to Finn after the feat — chose service over exile", gfm);
  stmts.insEC.run(comingOfFinn, caoilte, "ally", "One of the Fianna already present", gfm);
  insertEP.run(comingOfFinn, teamhair, gfm);

  const battleOfWhiteStrand = stmts.insEvent.run(
    "Battle of the White Strand",
    "Daire Donn, High King of the Great World, assembles a vast alliance of foreign kings — including the Kings of Greece, France, Lochlann, the Cat-Heads, the Dog-Heads, and Ogarmach daughter of the King of Greece, best woman-warrior in the world — and sails for Ireland guided by the traitor Glas son of Dremen. Finn calls the seven battalions of the Fianna to the White Strand in Munster. After months of fighting Finn kills Daire Donn, and the Fianna win their greatest fame.",
    "battle", null, null, "fenian", null, gfm
  ).lastInsertRowid as number;
  stmts.insEC.run(battleOfWhiteStrand, finn, "protagonist", "Led the Fianna; killed Daire Donn in single combat", gfm);
  stmts.insEC.run(battleOfWhiteStrand, gollMacMorna, "ally", null, gfm);
  stmts.insEC.run(battleOfWhiteStrand, caoilte, "ally", null, gfm);
  stmts.insEC.run(battleOfWhiteStrand, osgar, "ally", null, gfm);
  stmts.insEC.run(battleOfWhiteStrand, daireDonn, "antagonist", "High King of the World, killed by Finn", gfm);
  stmts.insEC.run(battleOfWhiteStrand, daireDonn, "victim", null, gfm);
  insertEP.run(battleOfWhiteStrand, whiteStrand, gfm);

  // ── LIFECYCLE BRACKETS ───────────────────────────────────────────────────

  addLifecycleBrackets(stmts, {
    name: "Lir", birthId: lc.lir.birthId, deathId: lc.lir.deathId,
    eventIds: [battleOfTailltin, lirMarriesAobh, lirMarriesAoife, transformationOfChildren, yearsOnLochDairbhreach],
    sourceId: gfm,
  });

  addLifecycleBrackets(stmts, {
    name: "Bodb Dearg", birthId: lc.bodbDearg.birthId, deathId: lc.bodbDearg.deathId,
    eventIds: [battleOfTailltin, lirMarriesAobh, lirMarriesAoife, aoifePunished, yearsOnLochDairbhreach],
    sourceId: gfm,
  });

  addLifecycleBrackets(stmts, {
    name: "Aobh", birthId: lc.aobh.birthId, deathId: lc.aobh.deathId,
    eventIds: [lirMarriesAobh],
    sourceId: gfm,
  });

  addLifecycleBrackets(stmts, {
    name: "Aoife", birthId: lc.aoife.birthId, deathId: lc.aoife.deathId,
    eventIds: [lirMarriesAoife, transformationOfChildren, aoifePunished],
    sourceId: gfm,
  });

  for (const [name, charId, lci] of [
    ["Fionnuala", fionnuala, lc.fionnuala],
    ["Aodh",     aodh,      lc.aodh],
    ["Fiachra",  fiachra,   lc.fiachra],
    ["Conn",     conn,      lc.conn],
  ] as [string, number, typeof lc.fionnuala][]) {
    addLifecycleBrackets(stmts, {
      name, birthId: lci.birthId, deathId: lci.deathId,
      eventIds: [transformationOfChildren, yearsOnLochDairbhreach, yearsOnMaoile, yearsAtInisGluaire, deathOfChildrenOfLir],
      sourceId: gfm,
    });
  }

  addLifecycleBrackets(stmts, {
    name: "Cumhal", birthId: lc.cumhal.birthId, deathId: lc.cumhal.deathId,
    eventIds: [deathOfCumhal],
    sourceId: gfm,
  });

  addLifecycleBrackets(stmts, {
    name: "Finn mac Cumhaill", birthId: lc.finn.birthId, deathId: lc.finn.deathId,
    eventIds: [comingOfFinn, battleOfWhiteStrand],
    sourceId: gfm,
  });

  addLifecycleBrackets(stmts, {
    name: "Goll mac Morna", birthId: lc.goll.birthId, deathId: lc.goll.deathId,
    eventIds: [deathOfCumhal, comingOfFinn, battleOfWhiteStrand],
    sourceId: gfm,
  });

  addLifecycleBrackets(stmts, {
    name: "Caoilte mac Ronáin", birthId: lc.caoilte.birthId, deathId: lc.caoilte.deathId,
    eventIds: [comingOfFinn, battleOfWhiteStrand],
    sourceId: gfm,
  });

  addLifecycleBrackets(stmts, {
    name: "Osgar", birthId: lc.osgar.birthId, deathId: lc.osgar.deathId,
    eventIds: [battleOfWhiteStrand],
    sourceId: gfm,
  });

  addLifecycleBrackets(stmts, {
    name: "Daire Donn", birthId: lc.daireDonn.birthId, deathId: lc.daireDonn.deathId,
    eventIds: [battleOfWhiteStrand],
    sourceId: gfm,
  });

  // ── EVENT RELATIONS (DAG) ─────────────────────────────────────────────────

  // Mythological chain
  R(battleOfTailltin,         lirMarriesAobh,             "before",  "certain",   "Bodb is king first; Lir's reconciliation follows");
  R(lirMarriesAobh,           deathOfAobh,                "before",  "certain",   "Aobh must marry Lir before she can die bearing his children");
  R(lirMarriesAobh,           birthOfTwins,               "before",  "certain",   "Marriage before births");
  R(deathOfAobh,              birthOfTwins,               "meets",   "certain",   "Aobh dies at the birth of the twins — simultaneous events");
  R(deathOfAobh,              lirMarriesAoife,            "causes",  "certain",   "Aobh's death is the reason Bodb gives Aoife to Lir");
  R(lirMarriesAoife,          transformationOfChildren,   "before",  "certain",   "Aoife's jealousy grows over time before she acts");
  R(transformationOfChildren, aoifePunished,              "causes",  "certain",   "Lir reveals Aoife's crime; Bodb punishes her");
  R(transformationOfChildren, yearsOnLochDairbhreach,     "causes",  "certain",   "The transformation begins the 300-year period on the lake");
  R(yearsOnLochDairbhreach,   yearsOnMaoile,              "meets",   "certain",   "After 300 years Fionnuala leads her brothers north");
  R(yearsOnMaoile,            yearsAtInisGluaire,         "meets",   "certain",   "After 300 years on Sruth na Maoile they move west");
  R(yearsAtInisGluaire,       deathOfChildrenOfLir,       "causes",  "certain",   "Saint Mochaomhog's arrival at Inis Gluaire fulfils the condition of release and leads to their death");

  // Aoife punished runs parallel to the three 300-year periods (she is cursed before they end)
  R(aoifePunished,            yearsOnLochDairbhreach,     "parallel","probable",  "Aoife's punishment is meted out before or during the first 300 years on the lake");

  // Fenian chain
  R(deathOfCumhal,            comingOfFinn,               "causes",  "certain",   "Cumhal's death forces Finn into hiding; when he is grown he comes to reclaim his father's place");
  R(comingOfFinn,             battleOfWhiteStrand,        "before",  "certain",   "Finn must lead the Fianna before the Battle of the White Strand");

  // Cross-cycle: Children of Lir story is in the mythological cycle; Finn is fenian
  // The Children of Lir ends at the coming of Christianity, which is roughly contemporary with the Fenian cycle's end
  R(deathOfChildrenOfLir,     comingOfFinn,               "before",  "probable",  "The Children of Lir live through the entire Fenian era — their deaths come at Christianity's arrival, which the Fianna decline also approaches");
};
