/**
 * Core seed: A broad overview of Irish-Celtic mythology.
 * Covers key figures across Mythological, Ulster, and Fenian cycles.
 * Good for general exploration and UI development.
 */
import type { Seed } from "./types";
import { makeStatements, mkLifecycle, addLifecycleBrackets } from "./_helpers";

export const name = "Core Irish-Celtic Mythology";
export const description =
  "12 characters, 5 places, 7 narrative events + lifecycle events across all major cycles.";

export const seed: Seed["seed"] = (db) => {
  // ── SOURCES ──────────────────────────────────────────────────────────────
  const sources = [
    {
      title: "Lebor Gabála Érenn (Book of Invasions)",
      type: "manuscript",
      author: null,
      year: 1150,
      url: "https://celt.ucc.ie/published/T100055/",
      notes: "Middle Irish text compiled c. 1150, preserved in the Book of Leinster",
    },
    {
      title: "Táin Bó Cúailnge (The Cattle Raid of Cooley)",
      type: "manuscript",
      author: null,
      year: 800,
      url: "https://celt.ucc.ie/published/T301035/",
      notes: "Earliest version in Lebor na hUidre (c. 1100), oral tradition much older",
    },
    {
      title: "Cath Maige Tuired (The Battle of Mag Tuired)",
      type: "manuscript",
      author: null,
      year: 900,
      url: "https://celt.ucc.ie/published/T300010/",
      notes: "Preserved in a 16th-century manuscript, content from 9th century or earlier",
    },
    {
      title: "Celtic Mythology – The Nature and Influence of Celtic Myth",
      type: "scholarly",
      author: "Proinsias Mac Cana",
      year: 1970,
      url: null,
      notes: "Standard scholarly overview",
    },
    {
      title: "Aided Chlainne Lir (The Fate of the Children of Lir)",
      type: "manuscript",
      author: null,
      year: 1200,
      url: "https://celt.ucc.ie/published/T301041/",
      notes: "One of the Three Sorrows of Irish Storytelling",
    },
  ];

  const sourceIds: number[] = [];
  const insertSource = db.prepare(
    `INSERT INTO sources (title, type, author, year, url, notes) VALUES (?,?,?,?,?,?)`
  );
  for (const s of sources) {
    const res = insertSource.run(s.title, s.type, s.author, s.year, s.url, s.notes);
    sourceIds.push(res.lastInsertRowid as number);
  }
  const [lgeSrc, tainSrc, cmtSrc, , lirSrc] = sourceIds;

  // ── GROUPS ───────────────────────────────────────────────────────────────
  const insertGroup = db.prepare(
    `INSERT INTO groups (name, alt_names, description, source_id) VALUES (?,?,?,?)`
  );
  const tuatha = insertGroup.run(
    "Tuatha Dé Danann",
    JSON.stringify(["People of the Goddess Danu", "Tribe of the Gods"]),
    "The divine race who ruled Ireland before the Gaels. Masters of magic and craftsmanship.",
    lgeSrc
  ).lastInsertRowid as number;

  const fomor = insertGroup.run(
    "Fomorians",
    JSON.stringify(["Fomoire", "Fomori"]),
    "Ancient chaotic beings associated with darkness and the primordial world.",
    lgeSrc
  ).lastInsertRowid as number;

  const fianna = insertGroup.run(
    "Fianna",
    JSON.stringify(["Fénnidi"]),
    "A band of warriors led by Fionn mac Cumhaill. Protectors of Ireland during the reign of the High Kings.",
    null
  ).lastInsertRowid as number;

  const ulaid = insertGroup.run(
    "Ulaid",
    JSON.stringify(["Ulster men", "Men of Ulster"]),
    "The warriors of Ulster, central to the Ulster Cycle. Led by Conchobar mac Nessa.",
    tainSrc
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
  const insertRel = db.prepare(
    `INSERT INTO family_relations (from_character_id, to_character_id, relation_type, notes, source_id) VALUES (?,?,?,?,?)`
  );

  const stmts = makeStatements(db);

  // Lugh Lámhfhada
  const lugh = insertChar.run(
    "Lugh", JSON.stringify(["Lugh Lámhfhada", "Lleu", "Lugus"]),
    "male", "God of skill, crafts, and light. Champion of the Tuatha Dé Danann against the Fomorians.",
    "Lámhfhada (of the Long Arm)", 1, cmtSrc
  ).lastInsertRowid as number;
  insertCG.run(lugh, tuatha, cmtSrc);
  insertProp.run(lugh, "weapon", "Spear of Lugh (Lúin of Celtchar)", "One of the Four Treasures of the Tuatha Dé Danann", cmtSrc);
  insertProp.run(lugh, "skill", "Master of all crafts", "He claims mastery of every skill at the gate of Tara", cmtSrc);
  insertProp.run(lugh, "animal", "Raven", "Associated with ravens in tradition", lgeSrc);

  // The Dagda
  const dagda = insertChar.run(
    "The Dagda", JSON.stringify(["Eochaid Ollathair", "Ruad Rofhessa", "Deirgderc"]),
    "male", "Father-god of the Tuatha Dé Danann. Possessor of the magic cauldron and a club that kills and revives.",
    "Mór Día (Great God)", 1, lgeSrc
  ).lastInsertRowid as number;
  insertCG.run(dagda, tuatha, lgeSrc);
  insertProp.run(dagda, "weapon", "Lorg Mór (The Great Club)", "Kills with one end, revives with the other", cmtSrc);
  insertProp.run(dagda, "attribute", "Undruimne Dagdae (Cauldron of the Dagda)", "No company ever went away unsatisfied", cmtSrc);

  // Nuada
  const nuada = insertChar.run(
    "Nuada", JSON.stringify(["Nuada Airgetlám", "Nudd", "Nodens"]),
    "male", "First king of the Tuatha Dé Danann. Lost his arm in the First Battle of Mag Tuired, had it replaced with silver by Dian Cécht.",
    "Airgetlám (Silver Hand/Arm)", 1, cmtSrc
  ).lastInsertRowid as number;
  insertCG.run(nuada, tuatha, cmtSrc);
  insertProp.run(nuada, "weapon", "Claíomh Solais (Sword of Light)", "One of the Four Treasures", cmtSrc);
  insertProp.run(nuada, "attribute", "Silver arm", "Crafted by Dian Cécht after he lost his original arm", cmtSrc);

  // The Morrígan
  const morrigan = insertChar.run(
    "The Morrígan", JSON.stringify(["Morrigan", "Morrígu", "Phantom Queen"]),
    "female", "Triple goddess of fate, war, and death. Appears as Badb, Macha, or Nemain.",
    "Phantom Queen", 1, cmtSrc
  ).lastInsertRowid as number;
  insertCG.run(morrigan, tuatha, cmtSrc);
  insertProp.run(morrigan, "animal", "Crow", "Appears as a hooded crow on battlefields", cmtSrc);
  insertProp.run(morrigan, "animal", "Raven", "Also shapeshifts into a raven", cmtSrc);
  insertProp.run(morrigan, "animal", "Wolf", "Can also take wolf form", cmtSrc);

  // Balor
  const balor = insertChar.run(
    "Balor", JSON.stringify(["Balor of the Evil Eye", "Balor Béimnech"]),
    "male", "King of the Fomorians. Possessed a single eye whose gaze could kill entire armies. Killed by his own grandson Lugh.",
    "Béimnech (of the Mighty Blows)", 1, cmtSrc
  ).lastInsertRowid as number;
  insertCG.run(balor, fomor, cmtSrc);
  insertProp.run(balor, "attribute", "Evil Eye (Súil Mhilltach)", "Required four men with a hook to lift the lid", cmtSrc);

  // Cian (father of Lugh)
  const cian = insertChar.run(
    "Cian", JSON.stringify(["Cian mac Dian Cécht"]),
    "male", "Son of Dian Cécht. Father of Lugh by Ethniu, daughter of Balor.",
    null, 1, lgeSrc
  ).lastInsertRowid as number;
  insertCG.run(cian, tuatha, lgeSrc);
  insertRel.run(cian, lugh, "father", "Lugh's father from the Tuatha Dé Danann side", lgeSrc);
  insertRel.run(balor, lugh, "other", "Maternal grandfather — Ethniu (Balor's daughter) was Lugh's mother", cmtSrc);

  // Cú Chulainn
  const cuChulainn = insertChar.run(
    "Cú Chulainn", JSON.stringify(["Sétanta", "Hound of Culann", "The Hound of Ulster"]),
    "male", "Greatest hero of the Ulster Cycle. Son of Lugh and the mortal Deichtire. Defender of Ulster single-handedly against Connacht.",
    "Hound of Ulster", 0, tainSrc
  ).lastInsertRowid as number;
  insertCG.run(cuChulainn, ulaid, tainSrc);
  insertProp.run(cuChulainn, "weapon", "Gáe Bulg", "A terrible spear made from a sea-monster's bone, thrown with the foot", tainSrc);
  insertProp.run(cuChulainn, "attribute", "Riastrad (warp-spasm)", "Battle-frenzy that distorts his body into a terrifying form", tainSrc);
  insertRel.run(lugh, cuChulainn, "father", "Lugh is the divine father of Cú Chulainn", tainSrc);

  // Conchobar mac Nessa
  const conchobar = insertChar.run(
    "Conchobar mac Nessa", JSON.stringify(["Conor mac Nessa", "Conchobar"]),
    "male", "King of Ulster. Central figure of the Ulster Cycle. Uncle of Cú Chulainn.",
    null, 0, tainSrc
  ).lastInsertRowid as number;
  insertCG.run(conchobar, ulaid, tainSrc);

  // Medb
  const medb = insertChar.run(
    "Medb", JSON.stringify(["Maeve", "Medb of Connacht"]),
    "female", "Queen of Connacht. Instigated the great cattle raid of Cooley to acquire the Brown Bull.",
    "Queen of Connacht", 0, tainSrc
  ).lastInsertRowid as number;
  insertProp.run(medb, "animal", "Squirrel and bird", "Rested on her shoulders as tokens of power", tainSrc);
  insertProp.run(medb, "color", "Gold", "Often described with golden hair and armor", tainSrc);

  // Fionn mac Cumhaill
  const fionn = insertChar.run(
    "Fionn mac Cumhaill", JSON.stringify(["Finn McCool", "Demne", "Fionn"]),
    "male", "Leader of the Fianna. Gained wisdom by accidentally tasting the Salmon of Knowledge.",
    null, 0, null
  ).lastInsertRowid as number;
  insertCG.run(fionn, fianna, null);
  insertProp.run(fionn, "animal", "Salmon of Knowledge", "The salmon he cooked for his druid master", null);
  insertProp.run(fionn, "weapon", "Mac an Lúin (Son of the Waves)", "His enchanted spear", null);

  // Lir
  const lir = insertChar.run(
    "Lir", JSON.stringify(["Ler", "Allod"]),
    "male", "Sea god and father of the Children of Lir. His four children were transformed into swans by their jealous stepmother.",
    null, 1, lirSrc
  ).lastInsertRowid as number;
  insertCG.run(lir, tuatha, lirSrc);

  // Manannán mac Lir
  const manannan = insertChar.run(
    "Manannán mac Lir", JSON.stringify(["Manannán", "Manannan", "Manawyddan"]),
    "male", "God of the sea and the Otherworld. Guardian of Tír na nÓg.",
    "Son of the Sea", 1, lgeSrc
  ).lastInsertRowid as number;
  insertCG.run(manannan, tuatha, lgeSrc);
  insertRel.run(lir, manannan, "father", "Manannán is the son of Lir", lgeSrc);
  insertProp.run(manannan, "weapon", "Fragarach (The Answerer)", "A sword that could cut through any armor", lgeSrc);
  insertProp.run(manannan, "animal", "Horse Enbarr", "A magical horse that could travel on sea and land", lgeSrc);

  // ── PLACES ───────────────────────────────────────────────────────────────
  const insertPlace = db.prepare(
    `INSERT INTO places (name, alt_names, type, modern_equivalent, description, source_id) VALUES (?,?,?,?,?,?)`
  );

  const tara = insertPlace.run(
    "Tara", JSON.stringify(["Teamhair na Rí", "Hill of Tara"]),
    "hill", "County Meath, Ireland",
    "The ancient seat of the High Kings of Ireland. Sacred site associated with the sovereignty of the land.",
    lgeSrc
  ).lastInsertRowid as number;

  const magTuired = insertPlace.run(
    "Mag Tuired", JSON.stringify(["Moytura", "Plain of Pillars"]),
    "plain", "County Sligo/Roscommon, Ireland",
    "Site of two great mythological battles between the Tuatha Dé Danann and their enemies.",
    cmtSrc
  ).lastInsertRowid as number;

  insertPlace.run(
    "Tír na nÓg", JSON.stringify(["Land of Youth", "Tír na Óige"]),
    "otherworld", null,
    "The Otherworld — an island paradise where time passes differently and the inhabitants never age.",
    lgeSrc
  );

  insertPlace.run(
    "Brú na Bóinne", JSON.stringify(["Newgrange", "Síd in Broga"]),
    "fortress", "Newgrange, County Meath",
    "The great megalithic monument home of the Dagda and later Oengus mac Og. Portal to the Otherworld.",
    lgeSrc
  );

  const emainMacha = insertPlace.run(
    "Emain Macha", JSON.stringify(["Navan Fort"]),
    "fortress", "Navan Fort, County Armagh",
    "Capital of Ulster, seat of King Conchobar mac Nessa. Center of the Ulster Cycle.",
    tainSrc
  ).lastInsertRowid as number;

  // ── LIFECYCLE EVENTS ──────────────────────────────────────────────────────
  // Create birth/death events for characters whose lifecycle constrains the
  // narrative events below.

  const nuadaLC = mkLifecycle(stmts, { characterId: nuada, name: "Nuada", cycle: "mythological", sourceId: cmtSrc });
  const balorLC = mkLifecycle(stmts, { characterId: balor, name: "Balor", cycle: "mythological", sourceId: cmtSrc });
  const lughLC   = mkLifecycle(stmts, { characterId: lugh,  name: "Lugh",  cycle: "mythological", sourceId: cmtSrc });
  const cuLC     = mkLifecycle(stmts, { characterId: cuChulainn, name: "Cú Chulainn", cycle: "ulster", sourceId: tainSrc });
  const medbLC   = mkLifecycle(stmts, { characterId: medb,  name: "Medb",  cycle: "ulster", sourceId: tainSrc });

  // Family constraint: Lugh's birth is after Balor's birth (grandfather)
  stmts.insRel.run(balorLC.birthId, lughLC.birthId, "before", "certain",
    "Balor is Lugh's maternal grandfather — he must be born first", cmtSrc);

  // ── NARRATIVE EVENTS ─────────────────────────────────────────────────────
  const e_firstBattle = stmts.insEvent.run(
    "First Battle of Mag Tuired",
    "The Tuatha Dé Danann defeat the Fir Bolg and claim Ireland. Nuada loses his arm in the battle.",
    "battle", null, null, "mythological", "Age of Gods", cmtSrc
  ).lastInsertRowid as number;
  stmts.insEC.run(e_firstBattle, nuada, "protagonist", "Nuada loses his arm here", cmtSrc);
  db.prepare(`INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`).run(e_firstBattle, magTuired, cmtSrc);

  const e_silverArm = stmts.insEvent.run(
    "Nuada receives his silver arm; Miach restores flesh",
    "Dian Cécht crafts a silver arm for Nuada. His son Miach later restores a real arm — and is killed by Dian Cécht out of jealousy.",
    "other", null, null, "mythological", "Age of Gods", cmtSrc
  ).lastInsertRowid as number;
  stmts.insEC.run(e_silverArm, nuada, "protagonist", "Receives first a silver arm, then a flesh one", cmtSrc);

  const e_lughArrives = stmts.insEvent.run(
    "Lugh arrives at Tara and claims his place",
    "Lugh arrives at Tara claiming mastery of every craft. Nuada cedes war command to him.",
    "meeting", null, null, "mythological", "Age of Gods", cmtSrc
  ).lastInsertRowid as number;
  stmts.insEC.run(e_lughArrives, lugh, "protagonist", "Claims mastery of all crafts at the gate", cmtSrc);
  stmts.insEC.run(e_lughArrives, nuada, "ally", "King at the time of Lugh's arrival", cmtSrc);
  db.prepare(`INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`).run(e_lughArrives, tara, cmtSrc);

  const e_secondBattle = stmts.insEvent.run(
    "Second Battle of Mag Tuired",
    "The great war between the Tuatha Dé Danann and the Fomorians. Lugh kills his grandfather Balor. The Fomorians are defeated.",
    "battle", null, null, "mythological", "Age of Gods", cmtSrc
  ).lastInsertRowid as number;
  stmts.insEC.run(e_secondBattle, lugh, "protagonist", "Kills Balor with a sling-stone through his evil eye", cmtSrc);
  stmts.insEC.run(e_secondBattle, balor, "antagonist", "Killed by his grandson Lugh", cmtSrc);
  stmts.insEC.run(e_secondBattle, dagda, "protagonist", "Fights for the Tuatha Dé Danann", cmtSrc);
  stmts.insEC.run(e_secondBattle, morrigan, "ally", "Assists the Tuatha Dé Danann; lies with the Dagda before battle", cmtSrc);
  stmts.insEC.run(e_secondBattle, nuada, "victim", "Killed by Balor before Lugh strikes the killing blow", cmtSrc);
  db.prepare(`INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`).run(e_secondBattle, magTuired, cmtSrc);

  const e_nuadaDies = stmts.insEvent.run(
    "Death of Nuada at Mag Tuired",
    "Nuada is slain by Balor's Evil Eye during the Second Battle of Mag Tuired.",
    "death", e_secondBattle, nuada, "mythological", "Age of Gods", cmtSrc
  ).lastInsertRowid as number;
  stmts.insEC.run(e_nuadaDies, nuada, "victim", "Slain by Balor's evil eye", cmtSrc);
  stmts.insEC.run(e_nuadaDies, balor, "antagonist", "Kills Nuada with his eye", cmtSrc);

  const e_tain = stmts.insEvent.run(
    "Táin Bó Cúailnge (The Cattle Raid of Cooley)",
    "Queen Medb leads Connacht forces into Ulster to steal the Brown Bull. Cú Chulainn defends Ulster alone through single combat.",
    "battle", null, null, "ulster", "Age of Heroes", tainSrc
  ).lastInsertRowid as number;
  stmts.insEC.run(e_tain, cuChulainn, "protagonist", "Defends Ulster single-handedly at the ford", tainSrc);
  stmts.insEC.run(e_tain, medb, "antagonist", "Leads the Connacht forces into Ulster", tainSrc);
  stmts.insEC.run(e_tain, conchobar, "ally", "King of Ulster, cursed and unable to fight initially", tainSrc);
  db.prepare(`INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`).run(e_tain, emainMacha, tainSrc);

  const e_lirChildren = stmts.insEvent.run(
    "The Children of Lir transformed into swans",
    "Aoife, jealous stepmother, transforms Lir's four children into swans for 900 years.",
    "transformation", null, null, "mythological", "Age of Gods", lirSrc
  ).lastInsertRowid as number;
  stmts.insEC.run(e_lirChildren, lir, "mentioned", "Father of the transformed children", lirSrc);

  // ── LIFECYCLE BRACKETS ────────────────────────────────────────────────────
  // Nuada dies at e_nuadaDies — wire lifecycle death to this event
  stmts.insRel.run(e_nuadaDies, nuadaLC.deathId, "meets", "certain",
    "Nuada's death event IS his lifecycle death", cmtSrc);
  // Balor dies at e_secondBattle
  stmts.insRel.run(e_secondBattle, balorLC.deathId, "causes", "certain",
    "Balor is killed at the Second Battle", cmtSrc);

  addLifecycleBrackets(stmts, {
    name: "Nuada",
    birthId: nuadaLC.birthId, deathId: nuadaLC.deathId,
    eventIds: [e_firstBattle, e_silverArm, e_lughArrives],
    sourceId: cmtSrc,
  });
  addLifecycleBrackets(stmts, {
    name: "Balor",
    birthId: balorLC.birthId, deathId: balorLC.deathId,
    eventIds: [e_secondBattle],
    sourceId: cmtSrc,
  });
  addLifecycleBrackets(stmts, {
    name: "Lugh",
    birthId: lughLC.birthId, deathId: lughLC.deathId,
    eventIds: [e_lughArrives, e_secondBattle],
    sourceId: cmtSrc,
  });
  addLifecycleBrackets(stmts, {
    name: "Cú Chulainn",
    birthId: cuLC.birthId, deathId: cuLC.deathId,
    eventIds: [e_tain],
    sourceId: tainSrc,
  });
  addLifecycleBrackets(stmts, {
    name: "Medb",
    birthId: medbLC.birthId, deathId: medbLC.deathId,
    eventIds: [e_tain],
    sourceId: tainSrc,
  });

  // ── NARRATIVE ORDERING (event_relations) ─────────────────────────────────
  const R = (from: number, to: number, type: string, conf: string, reason: string) =>
    stmts.insRel.run(from, to, type, conf, reason, cmtSrc);

  R(e_firstBattle, e_silverArm,   "causes", "certain",  "Nuada lost his arm at the First Battle, necessitating the replacement");
  R(e_silverArm,   e_lughArrives, "before", "probable", "Nuada's restored kingship is the context for Lugh's arrival");
  R(e_firstBattle, e_secondBattle,"before", "certain",  "The First Battle precedes the Second");
  R(e_lughArrives, e_secondBattle,"before", "certain",  "Lugh established himself at Tara before leading the war");
  R(e_secondBattle,e_nuadaDies,   "contains","certain", "Nuada's death occurs during the Second Battle");
  R(e_silverArm,   e_nuadaDies,   "before", "certain",  "Nuada receives his arm before the battle in which he dies");
  R(e_secondBattle,e_tain,        "before", "probable", "The Ulster Cycle takes place in a later age than the Mythological Cycle");
};
