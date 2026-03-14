/**
 * Narrative enrichment seed: adds more historically significant events
 * across all cycles. Designed to run after the `core` seed.
 *
 * Events added:
 *  Mythological: Milesian invasion, Dagda's treaty, Morrígan's prophecy
 *  Ulster: Macha's curse, Conchobar's coronation, Cú Chulainn's death
 *  Fenian: Battle of Cnucha, Fionn's wisdom, Formation of the Fianna
 */
import type { Seed } from "./types";
import { makeStatements } from "./_helpers";

export const name = "Narrative Enrichment";
export const description =
  "Additional historical narrative events across Mythological, Ulster and Fenian cycles.";

export const seed: Seed["seed"] = (db) => {
  const stmts = makeStatements(db);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const findChar = db.prepare(`SELECT id FROM characters WHERE name = ? LIMIT 1`);
  const findSrc  = db.prepare(`SELECT id FROM sources WHERE title LIKE ? LIMIT 1`);
  const findEvent = db.prepare(`SELECT id FROM events WHERE name = ? LIMIT 1`);
  const findPlace = db.prepare(`SELECT id FROM places WHERE name = ? LIMIT 1`);

  const charId = (name: string): number | null => {
    const row = findChar.get(name) as { id: number } | undefined;
    return row?.id ?? null;
  };
  const srcId = (like: string): number | null => {
    const row = findSrc.get(`%${like}%`) as { id: number } | undefined;
    return row?.id ?? null;
  };
  const eventId = (name: string): number | null => {
    const row = findEvent.get(name) as { id: number } | undefined;
    return row?.id ?? null;
  };
  const placeId = (name: string): number | null => {
    const row = findPlace.get(name) as { id: number } | undefined;
    return row?.id ?? null;
  };

  const insEP = db.prepare(`INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`);

  // ── Source IDs ────────────────────────────────────────────────────────────
  const lgeSrc  = srcId("Lebor Gabála");
  const cmtSrc  = srcId("Cath Maige Tuired");
  const tainSrc = srcId("Táin Bó Cúailnge");

  // ── Look up existing characters and places ─────────────────────────────────
  const lugh       = charId("Lugh");
  const dagda      = charId("The Dagda");
  const morrigan   = charId("The Morrígan");
  const cuChulainn = charId("Cú Chulainn");
  const medb       = charId("Medb");
  const conchobar  = charId("Conchobar mac Nessa");
  const fionn      = charId("Fionn mac Cumhaill");

  const tara       = placeId("Tara");
  const magTuired  = placeId("Mag Tuired");
  const emainMacha = placeId("Emain Macha");

  // ── Look up existing events (for relations) ───────────────────────────────
  const e_secondBattle = eventId("Second Battle of Mag Tuired");
  const e_tain         = eventId("Táin Bó Cúailnge (The Cattle Raid of Cooley)");

  // ─────────────────────────────────────────────────────────────────────────
  // MYTHOLOGICAL CYCLE
  // ─────────────────────────────────────────────────────────────────────────

  // Treaty with the Fomorians after CMT
  const e_treaty = stmts.insEvent.run(
    "Treaty after the Second Battle of Mag Tuired",
    "After the Tuatha Dé Danann's victory, the Morrígan prophesies the prosperity of Ireland. Terms are set with the surviving Fomorians.",
    "meeting", null, null, "mythological", "Age of Gods", cmtSrc
  ).lastInsertRowid as number;
  if (morrigan) stmts.insEC.run(e_treaty, morrigan, "protagonist", "Delivers the victory prophecy", cmtSrc);
  if (dagda)    stmts.insEC.run(e_treaty, dagda,    "protagonist", "Oversees the settlement", cmtSrc);
  if (magTuired) insEP.run(e_treaty, magTuired, cmtSrc);

  // Morrígan's prophecy after CMT
  const e_morriganProphecy = stmts.insEvent.run(
    "The Morrígan's Victory Prophecy",
    "The Morrígan perches atop a standing stone and delivers a prophecy of peace and prosperity for Ireland following the defeat of the Fomorians.",
    "prophecy", null, null, "mythological", "Age of Gods", cmtSrc
  ).lastInsertRowid as number;
  if (morrigan) stmts.insEC.run(e_morriganProphecy, morrigan, "protagonist", "Delivers the prophecy", cmtSrc);

  // Milesian arrival and defeat of Tuatha Dé Danann
  const e_milesian = stmts.insEvent.run(
    "Arrival of the Milesians (Gaels) in Ireland",
    "The sons of Míl Espáine arrive from Iberia. After defeating the Tuatha Dé Danann in battle at Tailtiu and Druim Ligean, the Gaels claim the surface of Ireland. The Tuatha Dé Danann retreat underground into the sídhe.",
    "journey", null, null, "mythological", "Age of Gods", lgeSrc
  ).lastInsertRowid as number;

  const e_milBattle = stmts.insEvent.run(
    "Battle of Tailtiu — Milesians defeat Tuatha Dé Danann",
    "The decisive battle in which the Milesian Gaels defeat the three kings of the Tuatha Dé Danann. Ireland is divided: the Milesians take the surface, the Tuatha Dé Danann take the otherworld beneath the hills.",
    "battle", null, null, "mythological", "Age of Gods", lgeSrc
  ).lastInsertRowid as number;
  if (lugh) stmts.insEC.run(e_milBattle, lugh, "protagonist", "Fights for the Tuatha Dé Danann", lgeSrc);

  // Tuatha retreat to the Sídhe
  const e_sidheDescent = stmts.insEvent.run(
    "Tuatha Dé Danann descend into the Sídhe",
    "Following their defeat by the Milesians, the Tuatha Dé Danann are assigned the underground realms — the fairy mounds (sídhe) of Ireland. Each ruler receives a particular mound.",
    "other", null, null, "mythological", "Age of Gods", lgeSrc
  ).lastInsertRowid as number;
  if (dagda)  stmts.insEC.run(e_sidheDescent, dagda,  "protagonist", "Assigns the sídhe to each Tuatha ruler", lgeSrc);
  if (morrigan) stmts.insEC.run(e_sidheDescent, morrigan, "mentioned", "Among those who receive an otherworld realm", lgeSrc);

  // ─────────────────────────────────────────────────────────────────────────
  // ULSTER CYCLE
  // ─────────────────────────────────────────────────────────────────────────

  // Conchobar's coronation at Emain Macha
  const e_conchobarReign = stmts.insEvent.run(
    "Conchobar mac Nessa crowned King of Ulster",
    "Conchobar becomes King of Ulster. According to tradition, Nes (his mother) secured his kingship through a trick: allowing him to reign for a year, during which he cemented his rule.",
    "reign", null, null, "ulster", "Age of Heroes", tainSrc
  ).lastInsertRowid as number;
  if (conchobar) stmts.insEC.run(e_conchobarReign, conchobar, "protagonist", "Becomes king through his mother Nes's scheming", tainSrc);
  if (emainMacha) insEP.run(e_conchobarReign, emainMacha, tainSrc);

  // Macha's curse — Cess Noinden Ulad
  const e_machaCurse = stmts.insEvent.run(
    "Macha curses the men of Ulster (Cess Noinden Ulad)",
    "Macha, a woman with supernatural speed, is forced to race horses while pregnant by the king of Ulster. She gives birth at the finish line, cursing the men of Ulster to suffer the pangs of childbirth in their hour of greatest need — the curse that disables the Ulster warriors during the Táin.",
    "prophecy", null, null, "ulster", "Age of Heroes", tainSrc
  ).lastInsertRowid as number;
  if (emainMacha) insEP.run(e_machaCurse, emainMacha, tainSrc);

  // Cú Chulainn's training with Scáthach
  const e_scathach = stmts.insEvent.run(
    "Cú Chulainn trains with Scáthach in Alba",
    "Cú Chulainn travels to Alba (Scotland) to train under the female warrior Scáthach. She teaches him the Gáe Bulg and other supernatural battle skills. He also fights Aífe and fathers Connla.",
    "journey", null, null, "ulster", "Age of Heroes", tainSrc
  ).lastInsertRowid as number;
  if (cuChulainn) stmts.insEC.run(e_scathach, cuChulainn, "protagonist", "Receives the Gáe Bulg and mastery of combat from Scáthach", tainSrc);

  // The single combats at the ford (Táin)
  const e_fordCombats = stmts.insEvent.run(
    "Single combats at the ford (Áth Fhirdia)",
    "Cú Chulainn holds the ford at Áth Fhirdia, fighting single combats each day to delay Medb's army. Culminates in the three-day battle against his foster-brother Ferdiad, which Cú Chulainn wins using the Gáe Bulg.",
    "battle", e_tain, null, "ulster", "Age of Heroes", tainSrc
  ).lastInsertRowid as number;
  if (cuChulainn) stmts.insEC.run(e_fordCombats, cuChulainn, "protagonist", "Defends the ford; kills Ferdiad with the Gáe Bulg", tainSrc);
  if (medb)       stmts.insEC.run(e_fordCombats, medb,       "antagonist", "Sends warriors one by one against Cú Chulainn", tainSrc);

  // Death of Cú Chulainn
  const e_cuDeath = stmts.insEvent.run(
    "Death of Cú Chulainn",
    "Cú Chulainn is lured to his death through the breaking of his geasa. He is struck by a spear cast by Lugaid mac Con Roí, guided by the magic of the sons of Calatín. He ties himself to a standing stone to die on his feet. The Morrígan perches on his shoulder as a crow.",
    "death", null, cuChulainn, "ulster", "Age of Heroes", tainSrc
  ).lastInsertRowid as number;
  if (cuChulainn) stmts.insEC.run(e_cuDeath, cuChulainn, "victim", "Dies tied to a pillar stone", tainSrc);
  if (morrigan)   stmts.insEC.run(e_cuDeath, morrigan,   "other",  "Perches as a crow on his shoulder at death", tainSrc);

  // ─────────────────────────────────────────────────────────────────────────
  // FENIAN CYCLE
  // ─────────────────────────────────────────────────────────────────────────

  // Fionn gains wisdom from the Salmon of Knowledge
  const e_salmonOfKnowledge = stmts.insEvent.run(
    "Fionn tastes the Salmon of Knowledge",
    "While apprenticed to the poet Finnéces, Fionn accidentally tastes the Salmon of Knowledge (An Bradán Feasa) while cooking it. The salmon had absorbed all the wisdom of the world. Fionn gains all knowledge by putting his thumb in his mouth.",
    "transformation", null, null, "fenian", "Age of Heroes", null
  ).lastInsertRowid as number;
  if (fionn) stmts.insEC.run(e_salmonOfKnowledge, fionn, "protagonist", "Gains wisdom from an accidental taste", null);

  // Battle of Cnucha — formation of the Fianna under Fionn
  const e_cnucha = stmts.insEvent.run(
    "Battle of Cnucha",
    "The battle in which Fionn's father Cumhal is killed by Goll mac Morna. Fionn later avenges him and becomes leader of the Fianna, reconciling with Goll mac Morna.",
    "battle", null, null, "fenian", "Age of Heroes", null
  ).lastInsertRowid as number;

  // Formation of the Fianna under Fionn
  const e_fiannaFounded = stmts.insEvent.run(
    "Fionn mac Cumhaill becomes leader of the Fianna",
    "After avenging his father's death, Fionn is recognised as the rightful leader of the Fianna warrior band. He rebuilds the Fianna and establishes the strict code of conduct for its members.",
    "reign", null, null, "fenian", "Age of Heroes", null
  ).lastInsertRowid as number;
  if (fionn) stmts.insEC.run(e_fiannaFounded, fionn, "protagonist", "Becomes captain of the Fianna", null);
  if (tara)  insEP.run(e_fiannaFounded, tara, null);

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT ORDERING RELATIONS
  // ─────────────────────────────────────────────────────────────────────────
  const R = (from: number, to: number, type: string, conf: string, reason: string, src: number | null) =>
    stmts.insRel.run(from, to, type, conf, reason, src);

  // Mythological ordering
  if (e_secondBattle) {
    R(e_secondBattle, e_treaty,           "causes",  "certain",  "The treaty follows directly from the Tuatha Dé victory",  cmtSrc);
    R(e_secondBattle, e_morriganProphecy, "causes",  "certain",  "The Morrígan's prophecy is delivered after the battle",    cmtSrc);
    R(e_treaty,       e_milesian,         "before",  "probable", "The Tuatha Dé Danann rule Ireland before the Milesians arrive", lgeSrc);
  }
  R(e_morriganProphecy, e_milesian,       "before",  "probable", "Prophecy of peace precedes the Milesian era",              lgeSrc);
  R(e_milesian,    e_milBattle,           "causes",  "certain",  "The invasion leads to the decisive battle",                lgeSrc);
  R(e_milBattle,   e_sidheDescent,        "causes",  "certain",  "Defeat forces the Tuatha Dé Danann underground",           lgeSrc);

  // Ulster ordering
  R(e_machaCurse,  e_conchobarReign,     "before",  "probable", "Macha's curse was in Conchobar's time, likely before the Táin era", tainSrc);
  R(e_conchobarReign, e_scathach,        "before",  "certain",  "Conchobar is king when Cú Chulainn trains", tainSrc);
  R(e_scathach,    e_fordCombats,        "before",  "certain",  "Cú Chulainn learns the Gáe Bulg before using it at the ford", tainSrc);
  if (e_tain) {
    R(e_machaCurse, e_tain,              "causes",  "certain",  "The curse disables Ulster during the Táin",                tainSrc);
    R(e_conchobarReign, e_tain,          "before",  "certain",  "Conchobar is already king during the Táin",               tainSrc);
  }
  R(e_fordCombats, e_cuDeath,            "before",  "probable", "The ford battles precede Cú Chulainn's eventual death",    tainSrc);

  // Fenian ordering
  R(e_cnucha,          e_salmonOfKnowledge, "before", "probable", "Fionn's father dies before Fionn gains wisdom",          null);
  R(e_salmonOfKnowledge, e_fiannaFounded,   "before", "certain",  "Fionn gains wisdom before leading the Fianna",           null);
  R(e_cnucha,          e_fiannaFounded,     "causes", "certain",  "Fionn's father's death drives him to reclaim leadership", null);

  // Cross-cycle: Mythological before Ulster before Fenian
  if (e_sidheDescent && e_conchobarReign) {
    R(e_sidheDescent, e_conchobarReign, "before", "probable", "Ulster Cycle is in a later age than the Mythological Cycle", null);
  }
  if (e_tain && e_cnucha) {
    R(e_tain, e_cnucha, "before", "speculative", "The Ulster Cycle ends before the Fenian Cycle begins", null);
  }
};
