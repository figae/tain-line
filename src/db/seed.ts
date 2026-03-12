/**
 * Seed the database with core Irish-Celtic mythology data.
 * A small but solid starting set — expand via the UI.
 * Usage: npx tsx src/db/seed.ts
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "tain-line.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("foreign_keys = ON");

const run = sqlite.transaction(() => {
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
  const insertSource = sqlite.prepare(
    `INSERT INTO sources (title, type, author, year, url, notes) VALUES (?,?,?,?,?,?)`
  );
  for (const s of sources) {
    const res = insertSource.run(s.title, s.type, s.author, s.year, s.url, s.notes);
    sourceIds.push(res.lastInsertRowid as number);
  }
  const [lgeSrc, tainSrc, cmtSrc, , lirSrc] = sourceIds;

  // ── GROUPS ───────────────────────────────────────────────────────────────
  const insertGroup = sqlite.prepare(
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
    "Ancient chaotic beings associated with darkness and the primordial world. Often in conflict with the Tuatha Dé Danann.",
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
  const insertChar = sqlite.prepare(
    `INSERT INTO characters (name, alt_names, gender, description, epithet, is_deity, source_id)
     VALUES (?,?,?,?,?,?,?)`
  );
  const insertCG = sqlite.prepare(
    `INSERT INTO character_groups (character_id, group_id, source_id) VALUES (?,?,?)`
  );
  const insertProp = sqlite.prepare(
    `INSERT INTO character_properties (character_id, type, value, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insertRel = sqlite.prepare(
    `INSERT INTO family_relations (from_character_id, to_character_id, relation_type, notes, source_id) VALUES (?,?,?,?,?)`
  );

  // Lugh Lámhfhada
  const lugh = insertChar.run(
    "Lugh",
    JSON.stringify(["Lugh Lámhfhada", "Lleu", "Lugus"]),
    "male",
    "God of skill, crafts, and light. Champion of the Tuatha Dé Danann against the Fomorians.",
    "Lámhfhada (of the Long Arm)",
    1,
    cmtSrc
  ).lastInsertRowid as number;
  insertCG.run(lugh, tuatha, cmtSrc);
  insertProp.run(lugh, "weapon", "Spear of Lugh (Lúin of Celtchar)", "One of the Four Treasures of the Tuatha Dé Danann", cmtSrc);
  insertProp.run(lugh, "skill", "Master of all crafts", "He claims mastery of every skill at the gate of Tara", cmtSrc);
  insertProp.run(lugh, "animal", "Raven", "Associated with ravens in tradition", lgeSrc);

  // The Dagda
  const dagda = insertChar.run(
    "The Dagda",
    JSON.stringify(["Eochaid Ollathair", "Ruad Rofhessa", "Deirgderc"]),
    "male",
    "Father-god of the Tuatha Dé Danann. Possessor of the magic cauldron that never empties and a club that kills and revives.",
    "Mór Día (Great God)",
    1,
    lgeSrc
  ).lastInsertRowid as number;
  insertCG.run(dagda, tuatha, lgeSrc);
  insertProp.run(dagda, "weapon", "Lorg Mór (The Great Club)", "Kills with one end, revives with the other", cmtSrc);
  insertProp.run(dagda, "attribute", "Undruimne Dagdae (Cauldron of the Dagda)", "A cauldron from which no company ever went away unsatisfied", cmtSrc);
  insertProp.run(dagda, "color", "Brown", "Often described wearing brown or earthy tones", lgeSrc);

  // Nuada
  const nuada = insertChar.run(
    "Nuada",
    JSON.stringify(["Nuada Airgetlám", "Nudd", "Nodens"]),
    "male",
    "First king of the Tuatha Dé Danann. Lost his arm in the First Battle of Mag Tuired, had it replaced with a silver one by Dian Cécht.",
    "Airgetlám (Silver Hand/Arm)",
    1,
    cmtSrc
  ).lastInsertRowid as number;
  insertCG.run(nuada, tuatha, cmtSrc);
  insertProp.run(nuada, "weapon", "Claíomh Solais (Sword of Light)", "One of the Four Treasures of the Tuatha Dé Danann", cmtSrc);
  insertProp.run(nuada, "attribute", "Silver arm", "Crafted by the physician-god Dian Cécht after he lost his original arm", cmtSrc);

  // The Morrígan
  const morrigan = insertChar.run(
    "The Morrígan",
    JSON.stringify(["Morrigan", "Morrígu", "Phantom Queen"]),
    "female",
    "Triple goddess of fate, war, and death. She appears as a crow or raven on the battlefield. Can appear as Badb, Macha, or Nemain.",
    "Phantom Queen",
    1,
    cmtSrc
  ).lastInsertRowid as number;
  insertCG.run(morrigan, tuatha, cmtSrc);
  insertProp.run(morrigan, "animal", "Crow", "Appears as a hooded crow (badb catha) on battlefields", cmtSrc);
  insertProp.run(morrigan, "animal", "Raven", "Also shapeshifts into a raven", cmtSrc);
  insertProp.run(morrigan, "animal", "Wolf", "Can also take wolf form", cmtSrc);
  insertProp.run(morrigan, "color", "Red", "Associated with red and black", cmtSrc);

  // Balor
  const balor = insertChar.run(
    "Balor",
    JSON.stringify(["Balor of the Evil Eye", "Balor Béimnech"]),
    "male",
    "King of the Fomorians. Possessed a single, enormous eye whose gaze could kill entire armies. Prophecy foretold he would be killed by his own grandson.",
    "Béimnech (of the Mighty Blows)",
    1,
    cmtSrc
  ).lastInsertRowid as number;
  insertCG.run(balor, fomor, cmtSrc);
  insertProp.run(balor, "attribute", "Evil Eye (Súil Mhilltach)", "His eye killed all who it looked upon; required four men with a hook to lift the lid", cmtSrc);

  // Cian (father of Lugh)
  const cian = insertChar.run(
    "Cian",
    JSON.stringify(["Cian mac Dian Cécht"]),
    "male",
    "Son of the divine physician Dian Cécht. Father of Lugh by Ethniu, daughter of Balor.",
    null,
    1,
    lgeSrc
  ).lastInsertRowid as number;
  insertCG.run(cian, tuatha, lgeSrc);
  insertRel.run(cian, lugh, "father", "Lugh's father from the Tuatha Dé Danann side", lgeSrc);
  // Balor is grandfather of Lugh through Ethniu
  insertRel.run(balor, lugh, "other", "Maternal grandfather — Ethniu (Balor's daughter) was Lugh's mother", cmtSrc);

  // Cú Chulainn
  const cuChulainn = insertChar.run(
    "Cú Chulainn",
    JSON.stringify(["Sétanta", "Hound of Culann", "The Hound of Ulster"]),
    "male",
    "Greatest hero of the Ulster Cycle. Son of Lugh and the mortal Deichtire. Capable of the terrifying battle-frenzy (riastrad). Defender of Ulster single-handedly against the armies of Connacht.",
    "Hound of Ulster",
    0,
    tainSrc
  ).lastInsertRowid as number;
  insertCG.run(cuChulainn, ulaid, tainSrc);
  insertProp.run(cuChulainn, "weapon", "Gáe Bulg", "A terrible spear made from the bone of a sea-monster, thrown with the foot", tainSrc);
  insertProp.run(cuChulainn, "attribute", "Riastrad (warp-spasm)", "Battle-frenzy that distorts his body into a terrifying form", tainSrc);
  insertProp.run(cuChulainn, "color", "Dark", "Described with dark features, though sometimes fair", tainSrc);
  insertRel.run(lugh, cuChulainn, "father", "Lugh is the divine father of Cú Chulainn", tainSrc);

  // Conchobar mac Nessa
  const conchobar = insertChar.run(
    "Conchobar mac Nessa",
    JSON.stringify(["Conor mac Nessa", "Conchobar"]),
    "male",
    "King of Ulster. Central figure of the Ulster Cycle. Uncle of Cú Chulainn. His poor treatment of Deirdre caused great tragedy.",
    null,
    0,
    tainSrc
  ).lastInsertRowid as number;
  insertCG.run(conchobar, ulaid, tainSrc);

  // Medb
  const medb = insertChar.run(
    "Medb",
    JSON.stringify(["Maeve", "Medb of Connacht"]),
    "female",
    "Queen of Connacht. Instigated the great cattle raid of Cooley to acquire the Brown Bull of Cooley. Proud, fierce, and politically powerful.",
    "Queen of Connacht",
    0,
    tainSrc
  ).lastInsertRowid as number;
  insertProp.run(medb, "animal", "Squirrel and bird", "A squirrel and bird rested on her shoulders as tokens of power", tainSrc);
  insertProp.run(medb, "color", "Gold", "Often described with golden hair and golden armor", tainSrc);

  // Fionn mac Cumhaill
  const fionn = insertChar.run(
    "Fionn mac Cumhaill",
    JSON.stringify(["Finn McCool", "Demne", "Fionn"]),
    "male",
    "Leader of the Fianna. Gained wisdom by accidentally tasting the Salmon of Knowledge. Hero of the Fenian Cycle.",
    null,
    0,
    null
  ).lastInsertRowid as number;
  insertCG.run(fionn, fianna, null);
  insertProp.run(fionn, "animal", "Salmon of Knowledge", "The salmon he cooked for his druid master, giving him supernatural wisdom", null);
  insertProp.run(fionn, "weapon", "Mac an Lúin (Son of the Waves)", "His enchanted spear", null);

  // Lir (father of the Children of Lir)
  const lir = insertChar.run(
    "Lir",
    JSON.stringify(["Ler", "Allod"]),
    "male",
    "Sea god and father of the Children of Lir. His four children were transformed into swans by their jealous stepmother Aoife.",
    null,
    1,
    lirSrc
  ).lastInsertRowid as number;
  insertCG.run(lir, tuatha, lirSrc);

  // Manannán mac Lir
  const manannan = insertChar.run(
    "Manannán mac Lir",
    JSON.stringify(["Manannán", "Manannan", "Manawyddan"]),
    "male",
    "God of the sea and the Otherworld. Guardian of Tír na nÓg. Possessor of many magical treasures including a self-navigating boat.",
    "Son of the Sea",
    1,
    lgeSrc
  ).lastInsertRowid as number;
  insertCG.run(manannan, tuatha, lgeSrc);
  insertRel.run(lir, manannan, "father", "Manannán is the son of Lir the sea god", lgeSrc);
  insertProp.run(manannan, "attribute", "Cloak of Invisibility", "A magical cloak that makes the wearer invisible", lgeSrc);
  insertProp.run(manannan, "weapon", "Fragarach (The Answerer)", "A sword that could cut through any armor", lgeSrc);
  insertProp.run(manannan, "animal", "Horse Enbarr", "A magical horse that could travel on sea and land", lgeSrc);

  // ── PLACES ───────────────────────────────────────────────────────────────
  const insertPlace = sqlite.prepare(
    `INSERT INTO places (name, alt_names, type, modern_equivalent, description, source_id) VALUES (?,?,?,?,?,?)`
  );

  const tara = insertPlace.run(
    "Tara",
    JSON.stringify(["Teamhair na Rí", "Hill of Tara"]),
    "hill",
    "County Meath, Ireland",
    "The ancient seat of the High Kings of Ireland. Sacred site associated with the sovereignty of the land.",
    lgeSrc
  ).lastInsertRowid as number;

  const magTuired = insertPlace.run(
    "Mag Tuired",
    JSON.stringify(["Moytura", "Plain of Pillars"]),
    "plain",
    "County Sligo/Roscommon, Ireland",
    "Site of two great mythological battles between the Tuatha Dé Danann and their enemies.",
    cmtSrc
  ).lastInsertRowid as number;

  const tirNaNog = insertPlace.run(
    "Tír na nÓg",
    JSON.stringify(["Land of Youth", "Tír na Óige"]),
    "otherworld",
    null,
    "The Otherworld — an island paradise where time passes differently and the inhabitants never age.",
    lgeSrc
  ).lastInsertRowid as number;

  const sidBrug = insertPlace.run(
    "Brú na Bóinne",
    JSON.stringify(["Newgrange", "Síd in Broga"]),
    "fortress",
    "Newgrange, County Meath",
    "The great megalithic monument home of the Dagda and later Oengus mac Og. Portal to the Otherworld.",
    lgeSrc
  ).lastInsertRowid as number;

  const emainMacha = insertPlace.run(
    "Emain Macha",
    JSON.stringify(["Navan Fort"]),
    "fortress",
    "Navan Fort, County Armagh",
    "Capital of Ulster, seat of King Conchobar mac Nessa. Center of the Ulster Cycle.",
    tainSrc
  ).lastInsertRowid as number;

  // ── EVENTS ───────────────────────────────────────────────────────────────
  const insertEvent = sqlite.prepare(
    `INSERT INTO events (name, description, cycle, approximate_era, source_id) VALUES (?,?,?,?,?)`
  );
  const insertEC = sqlite.prepare(
    `INSERT INTO event_characters (event_id, character_id, role, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insertEP = sqlite.prepare(
    `INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`
  );
  const insertDep = sqlite.prepare(
    `INSERT INTO event_dependencies (before_event_id, after_event_id, reason, confidence, source_id) VALUES (?,?,?,?,?)`
  );

  // Event 1: First Battle of Mag Tuired
  const e_firstBattle = insertEvent.run(
    "First Battle of Mag Tuired (Cath Maige Tuired Cunga)",
    "The Tuatha Dé Danann defeat the Fir Bolg and claim Ireland. Nuada loses his arm in the battle.",
    "mythological",
    "Age of Gods",
    cmtSrc
  ).lastInsertRowid as number;
  insertEC.run(e_firstBattle, nuada, "protagonist", "Nuada loses his arm here", cmtSrc);
  insertEP.run(e_firstBattle, magTuired, cmtSrc);

  // Event 2: Nuada receives silver arm
  const e_silverArm = insertEvent.run(
    "Nuada receives his silver arm",
    "The divine physician Dian Cécht crafts a silver arm for Nuada, restoring his kingship eligibility.",
    "mythological",
    "Age of Gods",
    cmtSrc
  ).lastInsertRowid as number;
  insertEC.run(e_silverArm, nuada, "protagonist", "Receives the silver arm", cmtSrc);

  // Event 3: Lugh arrives at Tara
  const e_lughArrives = insertEvent.run(
    "Lugh arrives at Tara and claims his place",
    "Lugh arrives at the fortress of Tara and is challenged at the gate. He claims mastery of every craft and skill, gaining entry. Nuada later cedes the kingship to him.",
    "mythological",
    "Age of Gods",
    cmtSrc
  ).lastInsertRowid as number;
  insertEC.run(e_lughArrives, lugh, "protagonist", "Claims mastery of all crafts at the gate", cmtSrc);
  insertEC.run(e_lughArrives, nuada, "ally", "King at the time of Lugh's arrival", cmtSrc);
  insertEP.run(e_lughArrives, tara, cmtSrc);

  // Event 4: Second Battle of Mag Tuired
  const e_secondBattle = insertEvent.run(
    "Second Battle of Mag Tuired (Cath Maige Tuired)",
    "The great war between the Tuatha Dé Danann and the Fomorians. Lugh kills his grandfather Balor by driving a stone through his evil eye. The Fomorians are defeated.",
    "mythological",
    "Age of Gods",
    cmtSrc
  ).lastInsertRowid as number;
  insertEC.run(e_secondBattle, lugh, "protagonist", "Kills Balor with a sling-stone through his evil eye", cmtSrc);
  insertEC.run(e_secondBattle, balor, "antagonist", "Killed by his grandson Lugh — fulfilling the prophecy", cmtSrc);
  insertEC.run(e_secondBattle, dagda, "protagonist", "Fights for the Tuatha Dé Danann", cmtSrc);
  insertEC.run(e_secondBattle, morrigan, "ally", "Assists the Tuatha Dé Danann; lies with the Dagda before battle", cmtSrc);
  insertEC.run(e_secondBattle, nuada, "victim", "Killed in battle by Balor before Lugh strikes the killing blow", cmtSrc);
  insertEP.run(e_secondBattle, magTuired, cmtSrc);

  // Event 5: Death of Nuada
  const e_nuadaDies = insertEvent.run(
    "Death of Nuada at Mag Tuired",
    "Nuada is slain by Balor during the Second Battle of Mag Tuired.",
    "mythological",
    "Age of Gods",
    cmtSrc
  ).lastInsertRowid as number;
  insertEC.run(e_nuadaDies, nuada, "victim", "Slain by Balor's evil eye", cmtSrc);
  insertEC.run(e_nuadaDies, balor, "antagonist", "Kills Nuada with his eye", cmtSrc);
  insertEP.run(e_nuadaDies, magTuired, cmtSrc);

  // Event 6: Táin Bó Cúailnge — The Cattle Raid of Cooley
  const e_tain = insertEvent.run(
    "Táin Bó Cúailnge (The Cattle Raid of Cooley)",
    "Queen Medb of Connacht leads a great army to Ulster to steal the Brown Bull of Cooley (Donn Cúailnge). Cú Chulainn, alone and unaffected by the Ulster curse, defends the province in single combat.",
    "ulster",
    "Age of Heroes",
    tainSrc
  ).lastInsertRowid as number;
  insertEC.run(e_tain, cuChulainn, "protagonist", "Defends Ulster single-handedly through single combat at the ford", tainSrc);
  insertEC.run(e_tain, medb, "antagonist", "Leads the Connacht forces into Ulster", tainSrc);
  insertEC.run(e_tain, conchobar, "ally", "King of Ulster, cursed and unable to fight initially", tainSrc);
  insertEP.run(e_tain, emainMacha, tainSrc);

  // Event 7: The Children of Lir transformed
  const e_lirChildren = insertEvent.run(
    "The Children of Lir transformed into swans",
    "Aoife, jealous stepmother of Lir's four children (Fionnuala, Aodh, Fiachra, Conn), transforms them into swans for 900 years.",
    "mythological",
    "Age of Gods",
    lirSrc
  ).lastInsertRowid as number;
  insertEC.run(e_lirChildren, lir, "mentioned", "Father of the transformed children", lirSrc);

  // ── EVENT DEPENDENCIES (the timeline logic) ───────────────────────────
  // 1. First battle BEFORE silver arm (Nuada loses arm at first battle)
  insertDep.run(
    e_firstBattle, e_silverArm,
    "Nuada lost his arm at the First Battle, which necessitated the silver replacement",
    "certain", cmtSrc
  );
  // 2. Silver arm BEFORE Lugh arrives (Nuada is king when Lugh arrives)
  insertDep.run(
    e_silverArm, e_lughArrives,
    "Nuada's restored kingship is the political context for Lugh's arrival at Tara",
    "probable", cmtSrc
  );
  // 3. First battle BEFORE second battle
  insertDep.run(
    e_firstBattle, e_secondBattle,
    "The two battles are sequential — First Battle of Mag Tuired precedes the Second",
    "certain", cmtSrc
  );
  // 4. Lugh arrives BEFORE second battle (he becomes war leader first)
  insertDep.run(
    e_lughArrives, e_secondBattle,
    "Lugh must have established himself at Tara before leading the Tuatha Dé Danann to war",
    "certain", cmtSrc
  );
  // 5. Second battle contains Nuada's death
  insertDep.run(
    e_secondBattle, e_nuadaDies,
    "Nuada's death occurs during the Second Battle of Mag Tuired",
    "certain", cmtSrc
  );
  // 6. Nuada's death implies all events where Nuada is alive come before it
  insertDep.run(
    e_silverArm, e_nuadaDies,
    "Nuada receives his arm before the battle in which he dies",
    "certain", cmtSrc
  );
  // 7. The Táin is in the Ulster Cycle — after the Mythological Cycle
  insertDep.run(
    e_secondBattle, e_tain,
    "The Ulster Cycle takes place in a later age than the Mythological Cycle",
    "probable", cmtSrc
  );
});

run();
console.log("✓ Seed data inserted successfully");
sqlite.close();
