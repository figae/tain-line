/**
 * Extended Irish-Celtic mythology seed — run AFTER `mythology`.
 *
 * Works through the individual tales in detail and adds the full
 * supporting cast that the base seed leaves out:
 *
 *   - Lebor Gabála Érenn: complete invasion genealogies (Cessair's
 *     companions, Partholón's household, Nemed's sons, the five
 *     Fir Bolg brothers, the Fomorian kings, the Milesian family)
 *   - Tochmarc Étaíne: Eochu Airem's court
 *   - Aislinge Óenguso: Cáer Ibormeith
 *   - Cath Maige Tuired: the satirist Cairbre, Etan, the craftsmen's kin
 *   - Ulster: Conchobar's full court, the Táin's single combats,
 *     Serglige Con Culainn, Táin Bó Fraích, Aided Derbforgaill,
 *     Clann Chalatín, Medb's family
 *   - Fenian: Bran & Sceólang's origin, Bruidhean Chaorthainn,
 *     Cath Fionntrágha, the Gilla Decair, Créde
 *   - Kings: Togail Bruidne Dá Derga in full, Orgain Denna Ríg,
 *     Echtra Fergusa maic Léti (the leprechaun king), Cath Maige
 *     Rath, Aided Muirchertaig, Mongán, Crom Cruach
 *
 * All lookups are by name, so existing characters from the base seed
 * are referenced, not duplicated.
 */
import type { Seed } from "./types";

export const name = "Extended Irish-Celtic Mythology";
export const description =
  "Supporting cast from the individual tales: ~150 further characters, relations, events. Requires the 'mythology' seed.";

type Gender = "male" | "female" | "other" | "unknown";

interface CharDef {
  n: string;
  alt?: string[];
  g?: Gender;
  e?: string;
  d?: string;
  deity?: boolean;
  dead?: boolean;
  grp?: string[];
  props?: [string, string, string?][];
  src?: string;
}

interface EventDef {
  k: string;
  n: string;
  t: string;
  cy: string;
  d?: string;
  era?: string;
  parent?: string;
  lifecycleOf?: string;
  chars?: [string, string, string?][];
  places?: string[];
  artifacts?: string[];
  src?: string;
}

type EventRel = [string, string, string, string, string];
type FamRel = [string, string, string, string?];

export const seed: Seed["seed"] = (db) => {
  // ── Statements ─────────────────────────────────────────────────────────
  const insSource = db.prepare(
    `INSERT INTO sources (title, type, author, year, url, notes) VALUES (?,?,?,?,?,?)`
  );
  const selSource = db.prepare(`SELECT id FROM sources WHERE title = ?`);
  const insGroup = db.prepare(
    `INSERT OR IGNORE INTO groups (name, alt_names, description, source_id) VALUES (?,?,?,?)`
  );
  const selGroup = db.prepare(`SELECT id FROM groups WHERE name = ?`);
  const insChar = db.prepare(
    `INSERT INTO characters (name, alt_names, gender, description, epithet, is_deity, is_dead, source_id)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  const selChar = db.prepare(`SELECT id FROM characters WHERE name = ?`);
  const insCG = db.prepare(
    `INSERT INTO character_groups (character_id, group_id, source_id) VALUES (?,?,?)`
  );
  const selCG = db.prepare(
    `SELECT id FROM character_groups WHERE character_id = ? AND group_id = ?`
  );
  const insProp = db.prepare(
    `INSERT INTO character_properties (character_id, type, value, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const selProp = db.prepare(
    `SELECT id FROM character_properties WHERE character_id = ? AND type = ? AND value = ?`
  );
  const insFam = db.prepare(
    `INSERT INTO family_relations (from_character_id, to_character_id, relation_type, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const selFam = db.prepare(
    `SELECT id FROM family_relations WHERE from_character_id = ? AND to_character_id = ? AND relation_type = ?`
  );
  const insPlace = db.prepare(
    `INSERT INTO places (name, alt_names, type, modern_equivalent, description, source_id) VALUES (?,?,?,?,?,?)`
  );
  const selPlace = db.prepare(`SELECT id FROM places WHERE name = ?`);
  const insEvent = db.prepare(
    `INSERT INTO events (name, description, event_type, parent_event_id, character_id, cycle, approximate_era, source_id)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  const selEvent = db.prepare(`SELECT id FROM events WHERE name = ?`);
  const insEC = db.prepare(
    `INSERT INTO event_characters (event_id, character_id, role, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insEP = db.prepare(
    `INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`
  );
  const insERel = db.prepare(
    `INSERT INTO event_relations (from_event_id, to_event_id, relation_type, confidence, reason, source_id)
     VALUES (?,?,?,?,?,?)`
  );
  const insArtifact = db.prepare(
    `INSERT INTO artifacts (name, alt_names, type, description, powers, source_id) VALUES (?,?,?,?,?,?)`
  );
  const selArtifact = db.prepare(`SELECT id FROM artifacts WHERE name = ?`);
  const insAC = db.prepare(
    `INSERT INTO artifact_characters (artifact_id, character_id, relationship, notes, source_id) VALUES (?,?,?,?,?)`
  );

  // ── Sources (new tales) ────────────────────────────────────────────────
  const sourceDefs: Record<string, [string, string, string | null, number | null, string | null, string | null]> = {
    LGE:  ["Lebor Gabála Érenn (Book of Invasions)", "manuscript", null, 1150, "https://celt.ucc.ie/published/T100055/", null],
    CMT:  ["Cath Maige Tuired (The Second Battle of Mag Tuired)", "manuscript", null, 900, "https://celt.ucc.ie/published/T300010/", null],
    TAIN: ["Táin Bó Cúailnge (The Cattle Raid of Cooley)", "manuscript", null, 800, "https://celt.ucc.ie/published/T301035/", null],
    TE:   ["Tochmarc Étaíne (The Wooing of Étaín)", "manuscript", null, 900, "https://celt.ucc.ie/published/T300012/", null],
    LMU:  ["Longes mac n-Uislenn (The Exile of the Sons of Uisliu)", "manuscript", null, 900, "https://celt.ucc.ie/published/T301020/", null],
    TEM:  ["Tochmarc Emire (The Wooing of Emer)", "manuscript", null, 1000, null, null],
    ACS:  ["Acallam na Senórach (Tales of the Elders of Ireland)", "manuscript", null, 1200, null, null],
    TDG:  ["Tóraigheacht Dhiarmada agus Ghráinne (The Pursuit of Diarmuid and Gráinne)", "manuscript", null, 1600, null, null],
    TBDD: ["Togail Bruidne Dá Derga (The Destruction of Da Derga's Hostel)", "manuscript", null, 1100, "https://celt.ucc.ie/published/T301017/", null],
    BS:   ["Buile Shuibhne (The Frenzy of Suibhne)", "manuscript", null, 1200, "https://celt.ucc.ie/published/T302018/", null],
    CMM:  ["Cath Maige Mucrama (The Battle of Mag Mucrama)", "manuscript", null, 1000, null, null],
    ORT:  ["Orgain Denna Ríg (The Destruction of Dind Ríg)", "manuscript", null, 900, null, null],
    NIA:  ["Echtra mac nEchach Muigmedóin", "manuscript", null, 1100, null, null],
    ACT:  ["Oidheadh Chlainne Tuireann (The Fate of the Children of Tuireann)", "manuscript", null, 1500, null, null],
    MF:   ["Macgnímartha Finn (The Boyhood Deeds of Fionn)", "manuscript", null, 1200, null, null],
    // New tales introduced by this seed
    AISL: ["Aislinge Óenguso (The Dream of Aengus)", "manuscript", null, 800, "https://celt.ucc.ie/published/T300007/", "Aengus und die Schwanenjungfrau Cáer Ibormeith"],
    SCC:  ["Serglige Con Culainn (The Wasting Sickness of Cú Chulainn)", "manuscript", null, 1000, "https://celt.ucc.ie/published/T301016/", "Fand, Lí Ban und die Anderswelt-Krankheit"],
    TBF:  ["Táin Bó Fraích (The Cattle Raid of Fráech)", "manuscript", null, 800, "https://celt.ucc.ie/published/T301006/", "Fráech, Findabair und das Wasserungeheuer"],
    ADG:  ["Aided Derbforgaill (The Death of Derbforgaill)", "manuscript", null, 1000, null, "Die Schwanenjungfrau aus Lochlann"],
    EFL:  ["Echtra Fergusa maic Léti (The Adventure of Fergus mac Léti)", "manuscript", null, 800, null, "Der Königsrichter, die Lúchorpáin und das Seeungeheuer Muirdris"],
    CMR:  ["Cath Maige Rath (The Battle of Mag Rath)", "manuscript", null, 1100, null, "Domnall mac Áedo gegen Congal Cláen; Suibhnes Wahnsinn"],
    AMME: ["Aided Muirchertaig meic Erca (The Death of Muirchertach mac Erca)", "manuscript", null, 1100, null, "Die Anderswelt-Frau Sín und der dreifache Tod des Königs"],
    IMB:  ["Immram Brain / Compert Mongáin", "manuscript", null, 800, null, "Mongán, Sohn Manannáns"],
    BCH:  ["Bruidhean Chaorthainn (The Hostel of the Rowan Tree)", "manuscript", null, 1400, null, "Die Fianna in der Falle des Rowan-Hauses"],
    CFT:  ["Cath Fionntrágha (The Battle of Ventry)", "manuscript", null, 1400, null, "Dáire Donn, der König der Welt, landet in Irland"],
    GDEC: ["Tóraigheacht an Ghiolla Dheacair (The Pursuit of the Gilla Decair)", "manuscript", null, 1500, null, "Abarta und das graue Zauberpferd"],
    DSEN: ["Dinnshenchas & Banshenchas", "manuscript", null, 1100, "https://celt.ucc.ie/published/T106500A/", "Orts- und Frauenüberlieferung"],
    FDG:  ["Fled Dúin na nGéd (The Feast of Dún na nGéd)", "manuscript", null, 1100, null, "Der Gänseei-Streit, der zu Mag Rath führte"],
    AIDC: ["Aided Diarmata meic Cerbaill (The Death of Diarmait mac Cerbaill)", "manuscript", null, 1100, null, "Der dreifache Tod des letzten Tara-Königs"],
  };

  const S: Record<string, number> = {};
  for (const [key, def] of Object.entries(sourceDefs)) {
    const existing = selSource.get(def[0]) as { id: number } | undefined;
    S[key] = existing ? existing.id : (insSource.run(...def).lastInsertRowid as number);
  }

  // ── New groups ─────────────────────────────────────────────────────────
  const groupDefs: [string, string[], string, string][] = [
    ["Aes Sídhe", ["Aos Sí", "Volk der Hügel"], "Die Anderswelt-Bewohner der Síde — die Tuatha Dé Danann nach ihrem Rückzug und die Feenwesen der späteren Überlieferung.", "ACS"],
    ["Lúchorpáin", ["Leprechauns", "Kleinleute"], "Das Kleinvolk unter König Iubdán — ihre Begegnung mit Fergus mac Léti ist die älteste Leprechaun-Erzählung.", "EFL"],
    ["Clann Chalatín", ["Children of Calatín"], "Der Zauberer Calatín und seine 27 Söhne; nach ihrem Tod in der Táin ziehen die drei verstümmelten Töchter Cú Chulainn ins Verderben.", "TAIN"],
    ["Uí Néill", [], "Die Nachfahren Nialls der neun Geiseln, dominierende Königsdynastie des frühmittelalterlichen Irlands.", "NIA"],
  ];
  const G: Record<string, number> = {};
  for (const [gname, alt, desc, src] of groupDefs) {
    insGroup.run(gname, JSON.stringify(alt), desc, S[src]);
    G[gname] = (selGroup.get(gname) as { id: number }).id;
  }
  // Existing groups we attach to
  for (const gn of ["Tuatha Dé Danann", "Fomorians", "Fir Bolg", "Milesians", "Nemedians", "Partholonians", "Cessair's People", "Ulaid", "Connachta", "Fianna", "Clann Baíscne", "Clann Morna"]) {
    const row = selGroup.get(gn) as { id: number } | undefined;
    if (row) G[gn] = row.id;
  }

  // ── New places ─────────────────────────────────────────────────────────
  const placeDefs: { n: string; alt?: string[]; t: string; mod?: string; d?: string; src?: string }[] = [
    { n: "Loch Bél Dracon", t: "river", mod: "Lough Muskry, Co. Tipperary", d: "Der See, auf dem Cáer Ibormeith als Schwan unter 150 Schwänen schwimmt.", src: "AISL" },
    { n: "Mag Rath", alt: ["Moira"], t: "plain", mod: "Moira, Co. Down", d: "Schlachtfeld, auf dem Congal Cláen fiel und Suibhne dem Wahnsinn verfiel.", src: "CMR" },
    { n: "Fionntrá", alt: ["Ventry"], t: "sea", mod: "Ventry, Co. Kerry", d: "Strand der großen Landungsschlacht gegen Dáire Donn.", src: "CFT" },
    { n: "Mag Slécht", t: "plain", mod: "Co. Cavan", d: "Ebene der Verneigungen — Kultort des Crom Cruach.", src: "DSEN" },
    { n: "Cleitech", alt: ["Brug na Bóinne bei Rosnaree"], t: "fortress", mod: "bei Slane, Co. Meath", d: "Halle am Boyne, in der Muirchertach mac Ercae seinen dreifachen Tod fand.", src: "AMME" },
    { n: "Sídh ar Femhin", alt: ["Slievenamon"], t: "otherworld", mod: "Slievenamon, Co. Tipperary", d: "Síd des Bodb Derg in Munster.", src: "ACS" },
    { n: "Loch Rudraige", alt: ["Dundrum Bay"], t: "sea", mod: "Dundrum Bay, Co. Down", d: "Bucht des Ungeheuers Muirdris, Todesort des Fergus mac Léti.", src: "EFL" },
  ];
  const P: Record<string, number> = {};
  for (const p of placeDefs) {
    const existing = selPlace.get(p.n) as { id: number } | undefined;
    P[p.n] = existing
      ? existing.id
      : (insPlace.run(p.n, p.alt ? JSON.stringify(p.alt) : null, p.t, p.mod ?? null, p.d ?? null, p.src ? S[p.src] : null).lastInsertRowid as number);
  }
  for (const pn of ["Temair", "Emain Macha", "Cruachan", "Brú na Bóinne", "Tír na nÓg", "Cúailnge", "Mag Muirthemne", "Almu", "Binn Ghulbain", "Bruiden Dá Derga", "Dinn Ríg", "Mag Mucrama", "Gabhair", "Bóinn", "Glen Etive", "Áth Fhirdiad", "Sruth na Maoile", "Dún Scáith", "Loch Dairbhreach", "Tailtiu", "Uisneach", "Tech Duinn"]) {
    const row = selPlace.get(pn) as { id: number } | undefined;
    if (row) P[pn] = row.id;
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function charId(name: string): number {
    const row = selChar.get(name) as { id: number } | undefined;
    if (!row) throw new Error(`Unknown character referenced: ${name}`);
    return row.id;
  }

  function defineChars(defs: CharDef[]) {
    for (const c of defs) {
      const existing = selChar.get(c.n) as { id: number } | undefined;
      const id = existing
        ? existing.id
        : (insChar.run(
            c.n,
            c.alt ? JSON.stringify(c.alt) : null,
            c.g ?? "unknown",
            c.d ?? null,
            c.e ?? null,
            c.deity ? 1 : 0,
            c.dead ? 1 : 0,
            c.src ? S[c.src] : null
          ).lastInsertRowid as number);
      for (const g of c.grp ?? []) {
        if (G[g] === undefined) throw new Error(`Unknown group: ${g}`);
        if (!selCG.get(id, G[g])) insCG.run(id, G[g], c.src ? S[c.src] : null);
      }
      for (const [type, value, notes] of c.props ?? []) {
        if (!selProp.get(id, type, value)) insProp.run(id, type, value, notes ?? null, c.src ? S[c.src] : null);
      }
    }
  }

  function famRel(rels: FamRel[], srcKey: string) {
    for (const [from, type, to, notes] of rels) {
      const f = charId(from);
      const t = charId(to);
      if (!selFam.get(f, t, type)) insFam.run(f, t, type, notes ?? null, S[srcKey]);
    }
  }

  function eventId(key: string, nameMap: Record<string, number>): number {
    if (nameMap[key] !== undefined) return nameMap[key];
    throw new Error(`Unknown event key: ${key}`);
  }

  const E: Record<string, number> = {};

  // Resolve base-seed events by exact name so cross-links attach to them
  function baseEvent(key: string, eventName: string) {
    const row = selEvent.get(eventName) as { id: number } | undefined;
    if (!row) throw new Error(`Base event not found: ${eventName}`);
    E[key] = row.id;
  }

  function defineEvents(defs: EventDef[]) {
    for (const ev of defs) {
      const parentId = ev.parent ? eventId(ev.parent, E) : null;
      const lifecycleCharId = ev.lifecycleOf ? charId(ev.lifecycleOf) : null;
      const id = insEvent.run(
        ev.n,
        ev.d ?? null,
        ev.t,
        parentId,
        lifecycleCharId,
        ev.cy,
        ev.era ?? null,
        ev.src ? S[ev.src] : null
      ).lastInsertRowid as number;
      E[ev.k] = id;
      for (const [charName, role, notes] of ev.chars ?? []) {
        insEC.run(id, charId(charName), role, notes ?? null, ev.src ? S[ev.src] : null);
      }
      for (const placeName of ev.places ?? []) {
        if (P[placeName] === undefined) throw new Error(`Unknown place: ${placeName} (${ev.k})`);
        insEP.run(id, P[placeName], ev.src ? S[ev.src] : null);
      }
    }
  }

  function eventRels(rels: EventRel[], srcKey: string) {
    for (const [from, type, to, confidence, reason] of rels) {
      insERel.run(eventId(from, E), eventId(to, E), type, confidence, reason, S[srcKey]);
    }
  }

  function defineArtifacts(defs: { n: string; alt?: string[]; t: string; d?: string; powers?: string; src?: string; owners?: [string, string, string?][] }[]) {
    for (const a of defs) {
      const existing = selArtifact.get(a.n) as { id: number } | undefined;
      const id = existing
        ? existing.id
        : (insArtifact.run(a.n, a.alt ? JSON.stringify(a.alt) : null, a.t, a.d ?? null, a.powers ?? null, a.src ? S[a.src] : null).lastInsertRowid as number);
      if (!existing) {
        for (const [cn, rel, notes] of a.owners ?? []) {
          insAC.run(id, charId(cn), rel, notes ?? null, a.src ? S[a.src] : null);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // The data sections below are executed in order.
  // ═══════════════════════════════════════════════════════════════════════

  defineChars(CHARS_LGE);
  defineChars(CHARS_TDD_EXTENDED);
  defineChars(CHARS_ULSTER_COURT);
  defineChars(CHARS_TAIN_COMBATS);
  defineChars(CHARS_SIDHE_TALES);
  defineChars(CHARS_FENIAN_EXT);
  defineChars(CHARS_KINGS_EXT);

  famRel(FAM_LGE, "LGE");
  famRel(FAM_TDD, "LGE");
  famRel(FAM_ULSTER, "TAIN");
  famRel(FAM_FENIAN, "ACS");
  famRel(FAM_KINGS, "TBDD");

  defineArtifacts(ARTIFACTS_EXT);

  // Anchor points in the base seed's event graph
  baseEvent("base_inv_partholon", "Landung Partholóns");
  baseEvent("base_partholon_plague", "Die Seuche über Partholóns Volk");
  baseEvent("base_inv_nemed", "Landung Nemeds");
  baseEvent("base_tower_conand", "Sturm auf Conands Turm");
  baseEvent("base_inv_firbolg", "Landung der Fir Bolg");
  baseEvent("base_cmt1", "Erste Schlacht von Mag Tuired");
  baseEvent("base_bres_reign", "Herrschaft des Bres");
  baseEvent("base_first_satire", "Die erste Satire Irlands");
  baseEvent("base_cmt2", "Zweite Schlacht von Mag Tuired");
  baseEvent("base_inv_milesians", "Landung der Milesier");
  baseEvent("base_battle_tailtiu", "Schlacht von Tailtiu");
  baseEvent("base_eber_eremon", "Bruderkrieg: Éber gegen Éremón");
  baseEvent("base_aengus_brug", "Aengus gewinnt den Brú na Bóinne");
  baseEvent("base_tdd_underground", "Rückzug in die Síde");
  baseEvent("base_conchobar_king", "Conchobar wird König von Ulster");
  baseEvent("base_cu_arms", "Cú Chulainn nimmt die Waffen");
  baseEvent("base_scathach_training", "Ausbildung bei Scáthach");
  baseEvent("base_emer_wooing", "Die Werbung um Emer");
  baseEvent("base_cu_emer_marriage", "Hochzeit von Cú Chulainn und Emer");
  baseEvent("base_deirdre_birth", "Geburt Deirdres");
  baseEvent("base_naoise_death", "Mord an den Söhnen Uislius");
  baseEvent("base_tain_muster", "Aufbruch des Heeres von Connacht");
  baseEvent("base_tain_defense", "Cú Chulainns Einzelverteidigung");
  baseEvent("base_ferdiad_duel", "Der Kampf an der Furt: Ferdiad");
  baseEvent("base_gairech", "Schlacht von Gáirech");
  baseEvent("base_cu_death", "Tod Cú Chulainns");
  baseEvent("base_connla_death", "Cú Chulainn tötet Connla");
  baseEvent("base_fionn_leader", "Fionn wird Anführer der Fianna");
  baseEvent("base_pursuit", "Die Verfolgung von Diarmuid und Gráinne");
  baseEvent("base_diarmuid_death", "Der Eber von Benbulbin");
  baseEvent("base_gabhra", "Schlacht von Gabhair");
  baseEvent("base_conaire_reign", "Herrschaft des Conaire Mór");
  baseEvent("base_daderga", "Zerstörung von Dá Dergas Halle");
  baseEvent("base_labraid_dinnrig", "Labraid erobert Dinn Ríg");
  baseEvent("base_cormac_reign", "Herrschaft des Cormac mac Airt");
  baseEvent("base_niall_sovereignty", "Niall und die Herrin der Herrschaft");
  baseEvent("base_niall_reign", "Herrschaft des Niall Noígíallach");
  baseEvent("base_ronan_curse", "Rónáns Fluch");
  baseEvent("base_suibhne_madness", "Suibhnes Wahnsinn");
  baseEvent("base_suibhne_death", "Tod des Suibhne");
  baseEvent("base_mucrama", "Schlacht von Mag Mucrama");
  baseEvent("base_conn_reign", "Herrschaft des Conn Cétchathach");

  defineEvents(EVENTS_EXT);
  eventRels(RELS_EXT, "DSEN");
};

// ═══════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════

// ── Lebor Gabála Érenn: die vollständigen Landnahme-Genealogien ──────────
const CHARS_LGE: CharDef[] = [
  // Cessair's people
  { n: "Bith", g: "male", grp: ["Cessair's People"], src: "LGE", dead: true,
    d: "Sohn Noahs in der Klosterüberlieferung, Vater der Cessair. Ihm wird der Norden der Insel zugeteilt; er stirbt noch vor der Flut." },
  { n: "Ladra", g: "male", e: "Der Steuermann", grp: ["Cessair's People"], src: "LGE", dead: true,
    d: "Steuermann von Cessairs Schiff — »der erste Tote Irlands«." },
  // Partholón's household
  { n: "Delgnat", g: "female", grp: ["Partholonians"], src: "LGE",
    d: "Partholóns Frau. Ihr Ehebruch mit dem Diener Topa ist der »erste Ehebruch Irlands« — und ihre Verteidigungsrede das erste Rechtsurteil zugunsten einer Frau." },
  { n: "Topa", g: "male", grp: ["Partholonians"], src: "LGE", dead: true,
    d: "Diener Partholóns, Delgnats Geliebter." },
  { n: "Tuan mac Cairill", alt: ["Tuan mac Stairn"], g: "male", e: "Der Wiedergeborene", grp: ["Partholonians"], src: "LGE",
    d: "Einziger Überlebender der Partholonier. Durchlebt die Zeitalter als Hirsch, Eber, Adler und Lachs, wird als Mensch wiedergeboren und erzählt ganz Irlands Vorzeit.",
    props: [["animal", "Hirsch", "Erste Gestalt"], ["animal", "Eber", "Zweite Gestalt"], ["animal", "Adler", "Dritte Gestalt"], ["animal", "Lachs", "Vierte Gestalt — als Lachs gegessen und wiedergeboren"]] },
  // Nemed's line
  { n: "Starn", g: "male", grp: ["Nemedians"], src: "LGE", dead: true,
    d: "Sohn Nemeds, Vater des Tuan in der Überlieferung; fällt gegen die Fomorer." },
  { n: "Iarbonél", alt: ["Iarbonel Fáid"], g: "male", e: "Der Seher", grp: ["Nemedians"], src: "LGE",
    d: "Sohn Nemeds — von ihm stammen die Tuatha Dé Danann ab." },
  { n: "Fergus Lethderg", alt: ["Fergus Redside"], g: "male", grp: ["Nemedians"], src: "LGE",
    d: "Sohn Nemeds, führt den Sturm auf Conands Turm; von ihm stammen die Britannier in der Sage." },
  { n: "Ainninn", g: "male", grp: ["Nemedians"], src: "LGE", dead: true, d: "Sohn Nemeds." },
  { n: "Semion", g: "male", grp: ["Nemedians"], src: "LGE",
    d: "Nachfahre Nemeds — von ihm stammen die Fir Bolg ab." },
  { n: "Britán Máel", g: "male", grp: ["Nemedians"], src: "LGE",
    d: "Enkel Nemeds, Namensgeber Britanniens in der irischen Überlieferung." },
  // Fomorian kings of the early ages
  { n: "Cichol Gricenchos", alt: ["Cíocal"], g: "male", e: "Der Fußlose", grp: ["Fomorians"], src: "LGE", dead: true,
    d: "Erster Anführer der Fomorer in Irland, fällt gegen Partholón in der Schlacht von Mag Itha — der ersten Schlacht Irlands." },
  { n: "Morc", alt: ["Morc mac Dela"], g: "male", grp: ["Fomorians"], src: "LGE",
    d: "Fomorenkönig, mit Conand Unterdrücker der Nemedier; seine Flotte vernichtet die Sieger des Turmsturms." },
  { n: "Domnu", g: "female", deity: true, e: "Urmutter der Fomorer", grp: ["Fomorians"], src: "CMT",
    d: "Göttin der Tiefe, nach der die Fomorer »das Volk der Domnu« heißen. Indech ist ihr Sohn." },
  { n: "Búarainech", g: "male", grp: ["Fomorians"], src: "CMT",
    d: "Vater Balors — »der mit dem Rindergesicht«." },
  // Fir Bolg: the five brothers, sons of Dela
  { n: "Slainge", alt: ["Slánga"], g: "male", grp: ["Fir Bolg"], src: "LGE", dead: true,
    d: "Ältester der fünf Söhne Delas, erster Hochkönig Irlands in der Zählung der Fir Bolg; erhält Leinster." },
  { n: "Gann", g: "male", grp: ["Fir Bolg"], src: "LGE", dead: true, d: "Sohn Delas, erhält Nord-Munster." },
  { n: "Genann", g: "male", grp: ["Fir Bolg"], src: "LGE", dead: true, d: "Sohn Delas, erhält Connacht." },
  { n: "Sengann", g: "male", grp: ["Fir Bolg"], src: "LGE", dead: true, d: "Sohn Delas, erhält Süd-Munster." },
  { n: "Rudraige mac Dela", g: "male", grp: ["Fir Bolg"], src: "LGE", dead: true, d: "Sohn Delas, erhält Ulster." },
  { n: "Fiacha Cennfinnán", g: "male", grp: ["Fir Bolg"], src: "LGE",
    d: "Fir-Bolg-König — in seiner Zeit trugen alle Rinder Irlands weiße Köpfe." },
  { n: "Rinnal", g: "male", grp: ["Fir Bolg"], src: "LGE",
    d: "Fir-Bolg-König — unter ihm erhielten die Speere Irlands zuerst eiserne Spitzen." },
  { n: "Fodbgen", g: "male", grp: ["Fir Bolg"], src: "LGE", d: "Fir-Bolg-König vor Eochaid mac Eirc." },
  // Milesian family
  { n: "Breogán", g: "male", grp: ["Milesians"], src: "LGE",
    d: "Ahnherr der Milesier in Iberien, Erbauer des Turms von Brigantia, von dem aus Íth Irland erblickt." },
  { n: "Bile", g: "male", grp: ["Milesians"], src: "LGE",
    d: "Sohn Breogáns, Vater des Míl Espáine." },
  { n: "Íth", g: "male", grp: ["Milesians"], src: "LGE", dead: true,
    d: "Sohn Breogáns. Erblickt Irland vom Turm Brigantias, reist als Erster hinüber — die drei Danann-Könige lassen ihn erschlagen: der Kriegsgrund der Landnahme." },
  { n: "Ír", g: "male", grp: ["Milesians"], src: "LGE", dead: true,
    d: "Sohn Míls, zerschellt beim Ruderwettstreit vor der Küste — begraben auf Skellig." },
  { n: "Colptha", g: "male", grp: ["Milesians"], src: "LGE",
    d: "Sohn Míls — nach ihm heißt die Boyne-Mündung Inber Colptha." },
  { n: "Érannán", g: "male", grp: ["Milesians"], src: "LGE", dead: true,
    d: "Jüngster Sohn Míls, stürzt beim Ausspähen vom Mast." },
  { n: "Scéne", g: "female", grp: ["Milesians"], src: "LGE", dead: true,
    d: "Frau des Dichters Amergin, stirbt auf der Überfahrt — die Bucht Inber Scéne trägt ihren Namen." },
  { n: "Tea", g: "female", grp: ["Milesians"], src: "DSEN",
    d: "Frau Éremóns — Temair (Tara) ist »Teas Wall«, ihr Totenhügel." },
  { n: "Odba", g: "female", grp: ["Milesians"], src: "DSEN",
    d: "Erste Gefährtin Éremóns, Mutter seiner älteren Söhne, verlassen für Tea." },
  { n: "Míodhchaoin", g: "male", src: "ACT", dead: true,
    d: "Wächter des Hügels im Norden, auf dem die Söhne Tuirenns die drei verbotenen Schreie rufen müssen — er und seine Söhne fallen, doch die Brüder empfangen den Tod." },
];

// ── Tuatha Dé Danann: erweiterter Kreis, Étaíns Hof, Aislinge Óenguso ────
const CHARS_TDD_EXTENDED: CharDef[] = [
  { n: "Nechtan", g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "DSEN",
    d: "Herr des Brunnens der Weisheit in Síd Nechtain, Gemahl der Boann in der Dindshenchas — nur er und seine Mundschenke dürfen dem Brunnen nahen." },
  { n: "Cermait", alt: ["Cermait Milbél"], g: "male", deity: true, e: "Honigmund", grp: ["Tuatha Dé Danann"], src: "LGE", dead: true,
    d: "Sohn des Dagda. Von Lugh wegen einer Affäre mit dessen Frau erschlagen; seine drei Söhne rächen ihn — sie werden die letzten Könige der Tuatha Dé Danann." },
  { n: "Aed Minbhrec", alt: ["Aed mac Dagda"], g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "DSEN", dead: true,
    d: "Sohn des Dagda mit dem Síd bei Ess Ruaid (Assaroe)." },
  { n: "Cairbre mac Étaíne", alt: ["Coirpre"], g: "male", deity: true, e: "Der Satiriker", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Dichter der Tuatha Dé Danann, Sohn der Dichterin Étan. Seine Satire über den geizigen Bres — die erste Irlands — treibt dem König die Röte ins Gesicht und stürzt ihn.",
    props: [["skill", "Satire", "Die erste Satire Irlands"]] },
  { n: "Étan", alt: ["Etan ingen Dian Cécht"], g: "female", deity: true, grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Dichterin, Tochter Dian Céchts, Frau Ogmas, Mutter des Satirikers Cairbre." },
  { n: "Delbáeth", g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "LGE",
    d: "Danann-König zwischen Dagda und den Enkeln, Vater von Ériu, Banba und Fódla in der Genealogie des Lebor Gabála." },
  { n: "Bé Chuille", g: "female", deity: true, e: "Die Zauberin", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Zauberin der Tuatha Dé Danann — in der zweiten Schlacht verspricht sie, die Steine und Bäume gegen die Fomorer zu verhexen." },
  { n: "Flidais", g: "female", deity: true, e: "Herrin der Hirsche", grp: ["Tuatha Dé Danann"], src: "DSEN",
    d: "Göttin des Wildes und der Wälder; ihre Kuh nährt ganze Heere, das Rotwild ist ihr Vieh.",
    props: [["animal", "Hirschkuh", "Ihr Vieh ist das Rotwild"]] },
  { n: "Abcán", g: "male", deity: true, e: "Der Zwergdichter", grp: ["Tuatha Dé Danann"], src: "DSEN",
    d: "Zwergenhafter Dichter der Tuatha Dé Danann mit einem Boot aus Bronze und einem Segel aus Zinn." },
  { n: "Cethen", g: "male", grp: ["Tuatha Dé Danann"], src: "ACT", dead: true,
    d: "Bruder Cians, Sohn Dian Céchts." },
  { n: "Cú mac Cáinte", g: "male", grp: ["Tuatha Dé Danann"], src: "ACT", dead: true,
    d: "Bruder Cians, Sohn Dian Céchts." },
  { n: "Cáer Ibormeith", alt: ["Caer Ibormeith"], g: "female", deity: true, e: "Die Schwanenjungfrau", grp: ["Aes Sídhe"], src: "AISL",
    d: "Tochter des Ethal Anbuail aus dem Síd von Uaman. Lebt jedes zweite Jahr als Schwan; Aengus erkennt sie unter 150 Schwänen am Loch Bél Dracon und fliegt als Schwan mit ihr davon.",
    props: [["animal", "Schwan", "Jedes zweite Jahr Schwanengestalt"], ["attribute", "Traumerscheinung", "Erschien Aengus ein Jahr lang im Traum"]] },
  { n: "Ethal Anbuail", g: "male", deity: true, grp: ["Aes Sídhe"], src: "AISL",
    d: "Síd-König von Connacht, Vater der Cáer Ibormeith — erst Ailills Belagerung zwingt ihm das Geheimnis seiner Tochter ab." },
  // Étaín's mortal court
  { n: "Eochu Airem", alt: ["Eochaid Airem"], g: "male", e: "Hochkönig von Tara", src: "TE", dead: true,
    d: "Hochkönig, Gemahl der wiedergeborenen Étaín. Verliert sie im Fidchell-Spiel an Midir und gräbt die Síde Irlands auf, um sie zurückzuholen." },
  { n: "Ailill Anguba", g: "male", src: "TE",
    d: "Bruder Eochu Airems. Verzehrt sich in verbotener Liebe zu Étaín — Midir hält ihn in Zauberschlaf, damit die Ehre aller gewahrt bleibt." },
  { n: "Étar", g: "male", src: "TE",
    d: "Ulster-Krieger, dessen Frau die Fliegen-Étaín aus dem Becher trinkt: der sterbliche »Vater« der wiedergeborenen Étaín." },
  // Sídhe women of the south
  { n: "Áine", g: "female", deity: true, e: "Göttin von Knockainy", grp: ["Tuatha Dé Danann", "Aes Sídhe"], src: "DSEN",
    d: "Sommer- und Souveränitätsgöttin von Munster, Herrin des Hügels Cnoc Áine. Tochter (oder Ziehtochter) Manannáns in der Überlieferung.",
    props: [["animal", "Rote Stute", "Ihre Gestalt beim Umritt des Hügels"], ["place", "Cnoc Áine", "Knockainy, Co. Limerick"]] },
  { n: "Clíodhna", alt: ["Clídna", "Cleena"], g: "female", deity: true, e: "Königin der Banshees", grp: ["Aes Sídhe"], src: "DSEN",
    d: "Anderswelt-Frau von überirdischer Schönheit aus Manannáns Land. Die Flutwelle von Glandore — »Clíodhnas Welle« — riss sie in den Tod, als sie einem Sterblichen folgte.",
    props: [["animal", "Drei Zaubervögel", "Ihr Gesang heilt Kranke im Schlaf"]] },
  { n: "Aoibheall", alt: ["Aibell"], g: "female", deity: true, e: "Herrin von Craig Liath", grp: ["Aes Sídhe"], src: "DSEN",
    d: "Schutzgeist der Dál gCais am grauen Felsen von Killaloe; ihre Harfe kündet den Tod dessen, der sie hört." },
  { n: "Finnbheara", alt: ["Finvarra", "Fionnbharr"], g: "male", deity: true, e: "König der Feen von Connacht", grp: ["Aes Sídhe"], src: "DSEN",
    d: "Feenkönig von Cnoc Meadha. Gewinnt jedes Spiel, entführt Sterbliche in den Hügel — und segnet die Ernte derer, die ihn ehren." },
  { n: "Crom Cruach", alt: ["Cromm Crúaich", "Cenn Cruach"], g: "other", deity: true, e: "Der Gebeugte des Hügels", src: "DSEN",
    d: "Blutiger Götze von Mag Slécht, dem die Erstgeburt geopfert wurde. König Tigernmas und drei Viertel seines Volkes starben in einer Samhain-Nacht bei seiner Anbetung.",
    props: [["color", "Gold", "Das goldene Hauptidol unter zwölf Steinen"]] },
  { n: "Tigernmas", g: "male", e: "Hochkönig des Goldes", src: "DSEN", dead: true,
    d: "Früher Hochkönig: erschließt die erste Goldmine, führt Farben in die Kleidung ein — und stirbt mit drei Vierteln der Iren bei der Anbetung des Crom Cruach." },
];

// ── Ulster: Conchobars Hof (aus Táin, Longes mac n-Uislenn, Fled) ────────
const CHARS_ULSTER_COURT: CharDef[] = [
  { n: "Eochaid Sálbuide", g: "male", grp: ["Ulaid"], src: "TAIN", dead: true,
    d: "König von Ulster, Vater der Ness — von Cathbads Kriegerbande erschlagen: der Keim von Ness' List um das Königtum." },
  { n: "Fedlimid mac Daill", g: "male", e: "Der Erzähler Conchobars", grp: ["Ulaid"], src: "LMU",
    d: "Barde des Königs; in seinem Haus schreit das ungeborene Kind Deirdre aus dem Mutterleib." },
  { n: "Uisliu", alt: ["Uisnech", "Usnach"], g: "male", grp: ["Ulaid"], src: "LMU",
    d: "Vater von Naoise, Ainnle und Ardán — den »Söhnen Uislius«." },
  { n: "Sencha mac Ailella", g: "male", e: "Der Friedensstifter", grp: ["Ulaid"], src: "TAIN",
    d: "Weiser Richter und Redner Ulsters; sein Zweig gebietet streitenden Heeren Schweigen.",
    props: [["skill", "Rechtsprechung", ""], ["attribute", "Friedenszweig", "Sein Schütteln gebietet Stille"]] },
  { n: "Celtchar mac Uthechair", g: "male", e: "Der graue Riese von Dún Lethglaise", grp: ["Ulaid"], src: "TAIN", dead: true,
    d: "Grimmiger Ulter Held mit dem Todes-Speer Lúin. Muss drei Plagen von Ulster nehmen — die dritte, sein eigener Hund, kostet ihn das Leben: Ein Tropfen Hundeblut fährt durch ihn.",
    props: [["weapon", "Lúin Celtchair", "Der Speer, der von selbst tötet"]] },
  { n: "Dubthach Dóeltenga", alt: ["Dubthach Käferzunge"], g: "male", e: "Käferzunge", grp: ["Ulaid"], src: "LMU",
    d: "Bitterzüngiger Ulter, der nie ein gutes Wort gönnt. Folgt Fergus ins Exil, nachdem er an Conchobars Verrat mitschuldig wurde." },
  { n: "Cormac Cond Longas", g: "male", e: "Haupt der Verbannten", grp: ["Ulaid", "Connachta"], src: "LMU", dead: true,
    d: "Sohn Conchobars, geht aus Scham über den Verrat des Vaters mit Fergus ins Exil — »Haupt der Verbannten« an Medbs Hof." },
  { n: "Cúscraid Mend Macha", g: "male", e: "Der Stammler von Macha", grp: ["Ulaid"], src: "TAIN",
    d: "Sohn Conchobars; ein Speerstich in die Kehle bei seiner ersten Waffentat ließ ihn stammeln." },
  { n: "Furbaide Ferbend", g: "male", e: "Der Gehörnte", grp: ["Ulaid"], src: "TAIN", dead: true,
    d: "Sohn Conchobars, aus dem Leib der toten Mutter geschnitten. Er erschlägt Medb mit einem Stück Käse aus der Schleuder — Rache für seine Mutter Clothru." },
  { n: "Fedelm Noíchrothach", alt: ["Fedelm Neunmalschön"], g: "female", grp: ["Ulaid"], src: "TAIN",
    d: "Tochter Conchobars, »die Neunmalschöne«, Kriegerin und Frau von Ulsters Helden." },
  { n: "Mugain", alt: ["Mugain Aitencáetrech"], g: "female", e: "Königin von Ulster", grp: ["Ulaid"], src: "TAIN",
    d: "Conchobars Königin. Führt die Frauen von Emain dem rasenden Knaben Cú Chulainn entgegen — vor ihrer Blöße senkt er den Blick, und die Raserei kann gelöscht werden." },
  { n: "Finnchóem", g: "female", grp: ["Ulaid"], src: "TAIN",
    d: "Schwester Deichtines, Ziehmutter Cú Chulainns und Mutter Conall Cernachs." },
  { n: "Amergin mac Echit", alt: ["Amairgin mac Echit"], g: "male", e: "Der Dichter Ulsters", grp: ["Ulaid"], src: "TAIN",
    d: "Dichter und Krieger, Vater Conall Cernachs, einer der Erzieher Cú Chulainns." },
  { n: "Athirne", alt: ["Athirne Ailgesach"], g: "male", e: "Der unersättliche Dichter", grp: ["Ulaid"], src: "DSEN",
    d: "Habgierigster Dichter Irlands: fordert das eine Auge eines Königs, die Frauen seiner Gastgeber — bis die Ulter sein Haus über ihm anzünden." },
  { n: "Blaí Briugu", g: "male", e: "Der Gastgeber", grp: ["Ulaid"], src: "DSEN", dead: true,
    d: "Gastherr Ulsters, dessen Geis ihn zwingt, jede Frau ohne Begleitung zu beherbergen — Celtchar erschlägt ihn wegen seiner Frau." },
  { n: "Ferchertne", g: "male", e: "Dichter des Cú Roí", src: "TBDD", dead: true,
    d: "Treuer Dichter Cú Roís. Rächt seinen Herrn, indem er die Verräterin Bláthnat von der Klippe reißt — mit sich selbst." },
  { n: "Friuch", g: "male", e: "Der Schweinehirt des Bodb", grp: ["Aes Sídhe"], src: "TAIN",
    d: "Schweinehirt Bodb Dergs. Sein Streit mit Rucht eskaliert durch sieben Gestalten — als Stier Donn Cúailnge endet er.",
    props: [["attribute", "Gestaltwandel", "Rabe, Wassertier, Krieger, Dämon, Wurm — zuletzt Stier"]] },
  { n: "Rucht", g: "male", e: "Der Schweinehirt des Ochall", grp: ["Aes Sídhe"], src: "TAIN",
    d: "Schweinehirt des Síd-Königs Ochall Ochne; sein ewiger Rivale Friuch und er werden als die beiden großen Stiere wiedergeboren.",
    props: [["attribute", "Gestaltwandel", "Zuletzt der weiße Stier Finnbennach"]] },
];

// ── Ulster: die Táin im Detail — Einzelkämpfe, Medbs Familie, Calatín ────
const CHARS_TAIN_COMBATS: CharDef[] = [
  { n: "Eochaid Feidlech", g: "male", e: "Hochkönig, Vater Medbs", src: "TAIN",
    d: "Hochkönig von Tara, Vater von Medb, Clothru, Eithne und Mugain. Setzt Medb als Königin von Connacht ein — der Anfang ihrer Macht." },
  { n: "Clothru", g: "female", grp: ["Connachta"], src: "TAIN", dead: true,
    d: "Schwester Medbs, Königin auf Inis Clothrann. Von Medb im Kindbett erschlagen — ihr Sohn Furbaide wird aus ihrem Leib geschnitten und rächt sie." },
  { n: "Nad Crantail", g: "male", grp: ["Connachta"], src: "TAIN", dead: true,
    d: "Connacht-Kämpe, der den bartlosen Cú Chulainn erst nicht ernst nimmt — neun Holzspieße wirft er, den Todesstreich empfängt er." },
  { n: "Lóch mac Mofemis", g: "male", grp: ["Connachta"], src: "TAIN", dead: true,
    d: "Hornhäutiger Champion; kämpft nur gegen einen Bärtigen, also klebt sich Cú Chulainn einen Beerenbart. Der Gáe Bulg fällt ihn, während die Morrígan als Aal den Helden umschlingt." },
  { n: "Etarcomol", g: "male", grp: ["Connachta"], src: "TAIN", dead: true,
    d: "Übermütiger Ziehsohn Medbs, sucht unter Fergus' Schutz den Streit mit Cú Chulainn — und wird der Länge nach gespalten." },
  { n: "Cethern mac Fintain", g: "male", grp: ["Ulaid"], src: "TAIN", dead: true,
    d: "Verwundet aus der großen Schlacht, lässt sich von Fíngin die tödlichen Wunden deuten — und stürzt sich mit den Knochen eines Wagens als Panzer zurück ins Gefecht." },
  { n: "Fíngin Fáthliaig", g: "male", e: "Der Seher-Arzt", grp: ["Ulaid"], src: "TAIN",
    d: "Arzt Conchobars: liest an jeder Wunde, wer sie schlug und wie ihr Träger sterben wird." },
  { n: "Mac Roth", g: "male", e: "Der Bote Medbs", grp: ["Connachta"], src: "TAIN",
    d: "Oberster Bote Irlands — umrundet ganz Irland an einem Tag. Sein Bericht vom erwachten Heer Ulsters lässt Medb erblassen." },
  { n: "Fer Loga", g: "male", grp: ["Connachta"], src: "TAIN",
    d: "Medbs Wagenlenker. Springt Conchobar in den Wagen und erzwingt als Lösegeld: Die Frauen Ulsters müssen ihm ein Jahr lang jeden Abend singen." },
  { n: "Calatín", alt: ["Calatín Dána"], g: "male", grp: ["Connachta", "Clann Chalatín"], src: "TAIN", dead: true,
    d: "Zauberer mit 27 Söhnen, die als ein Leib kämpfen — jeder Speer vergiftet. Cú Chulainn erschlägt sie alle; die ungeborenen Töchter werden seine Nemesis." },
  { n: "Töchter des Calatín", alt: ["Clann Chalatín"], g: "female", grp: ["Clann Chalatín"], src: "TAIN",
    d: "Drei verstümmelte Zauberinnen, von Medb aufgezogen. Ihre Trugbilder aus Rauch und Heeren locken Cú Chulainn aus der Heilung in den letzten Ritt.",
    props: [["attribute", "Trugbilder", "Heere aus Gras und Blättern"]] },
  { n: "Fráech", alt: ["Fráech mac Idaith"], g: "male", e: "Der Schönste der Männer Irlands", grp: ["Connachta"], src: "TBF", dead: true,
    d: "Halb-Síd-Held, Sohn der Bé Find aus der Anderswelt. Wirbt um Findabair, besteht das Wasserungeheuer in Medbs Teich und fällt später in der Táin gegen Cú Chulainn.",
    props: [["attribute", "Schönheit", "Der Schönste nach Fróech griff jede Frau"]] },
  { n: "Bé Find", g: "female", deity: true, grp: ["Aes Sídhe"], src: "TBF",
    d: "Anderswelt-Frau, Schwester der Boann, Mutter des Fráech — ihre zwölf weißen Kühe mit roten Ohren sind sein Brautschatz." },
  { n: "Uathach", alt: ["Uathach von Glen"], g: "female", e: "Die Schreckliche", src: "TEM",
    d: "Tochter Scáthachs, Cú Chulainns Geliebte während der Lehrzeit — sie lehrt ihn den Zugang zu ihrer Mutter zu erzwingen." },
  { n: "Fial ingen Forgaill", g: "female", src: "TEM",
    d: "Emers ältere Schwester — Cú Chulainn schlägt sie aus, weil sie vor ihm einem anderen Mann gehörte." },
  { n: "Derbforgaill", alt: ["Derbforgaill von Lochlann"], g: "female", src: "ADG", dead: true,
    d: "Königstochter aus Lochlann, folgt Cú Chulainn als Schwan. Er verwundet sie unwissend mit der Schleuder und saugt den Stein aus der Wunde — Blutsbande verbieten die Ehe; sie stirbt an der Grausamkeit der Ulter Frauen." },
];

// ── Serglige Con Culainn & Anderswelt-Erzählungen ────────────────────────
const CHARS_SIDHE_TALES: CharDef[] = [
  { n: "Fand", g: "female", deity: true, e: "Die Perle der Schönheit", grp: ["Aes Sídhe"], src: "SCC",
    d: "Anderswelt-Frau, Gattin Manannáns. Ihre Liebe zu Cú Chulainn endet, als Manannán den Nebelmantel zwischen ihnen schüttelt — sie vergessen einander für immer.",
    props: [["animal", "Seevogel", "Erscheint mit Lí Ban als Vogelpaar in Silberketten"]] },
  { n: "Lí Ban", alt: ["Lí Ban ingen Áeda Abrat"], g: "female", deity: true, grp: ["Aes Sídhe"], src: "SCC",
    d: "Schwester Fands, Botin aus Mag Mell — mit der Gerte schlägt sie Cú Chulainn in die Jahreskrankheit." },
  { n: "Labraid Luathlám", alt: ["Labraid Schnellhand-am-Schwert"], g: "male", deity: true, e: "Herr von Mag Mell", grp: ["Aes Sídhe"], src: "SCC",
    d: "Anderswelt-König, Gemahl Lí Bans. Für seine Hilfe im Kampf gegen seine Feinde erhält Cú Chulainn Fand versprochen." },
  { n: "Áed Abrat", g: "male", deity: true, grp: ["Aes Sídhe"], src: "SCC",
    d: "Anderswelt-Fürst, Vater von Fand und Lí Ban." },
];

// ── Fenian-Zyklus: die Erzählungen im Detail ─────────────────────────────
const CHARS_FENIAN_EXT: CharDef[] = [
  { n: "Tuiren", alt: ["Tuireann ingen Muirne?"], g: "female", grp: ["Clann Baíscne"], src: "ACS",
    d: "Fionns Tante. Von der eifersüchtigen Síd-Frau des Ullan in eine Hündin verwandelt, gebiert sie Bran und Sceólang — Fionns Hunde sind seine Vettern.",
    props: [["animal", "Hündin", "Ihre verwandelte Gestalt"]] },
  { n: "Bran", g: "other", e: "Fionns Hund", grp: ["Fianna"], src: "ACS",
    d: "Fionns treuester Hund, als Kind der verwandelten Tuiren geboren — versteht Menschensprache und erkennt Verzauberte. Schont die Hirschkuh Sadhbh.",
    props: [["color", "Gelbe Flanken, weiße Brust", "Feuerrote Ohren in der Beschreibung der Lays"]] },
  { n: "Sceólang", alt: ["Sceolan"], g: "other", e: "Fionns Hund", grp: ["Fianna"], src: "ACS",
    d: "Brans Wurfgeschwister, ebenso menschengeboren — die beiden Hunde weinen, wenn die Fianna trauern." },
  { n: "Fergus Finnbél", alt: ["Fergus Weißmund"], g: "male", e: "Dichter der Fianna", grp: ["Fianna"], src: "ACS",
    d: "Dichter und Bote der Fianna — trägt die Streitgespräche zwischen Fionn und Goll aus." },
  { n: "Créde", alt: ["Créde ingen Chairbre"], g: "female", src: "ACS",
    d: "Königstochter von Kerry, gewonnen durch Caílte's Gedicht über ihr Haus voller Wunder. Stirbt aus Gram über ihren bei Fionntrá gefallenen Gatten Cael — die Wildnis klagt mit ihr." },
  { n: "Cael", alt: ["Cael Ua Nemhnainn"], g: "male", grp: ["Fianna"], src: "CFT", dead: true,
    d: "Fianna-Krieger, gewinnt Créde mit dem Lobgedicht; ertrinkt in der Schlacht von Fionntrá — im Grab vereint mit Créde." },
  { n: "Dáire Donn", alt: ["Der König der Welt"], g: "male", e: "König der Welt", src: "CFT", dead: true,
    d: "Weltenkönig, der mit den Flotten aller Länder bei Fionntrá landet. Ein Jahr und einen Tag hält die Schlacht am Strand — Fionn erschlägt ihn im letzten Zweikampf." },
  { n: "Abarta", alt: ["Giolla Deacair", "Der schwierige Knecht"], g: "male", e: "Der Gilla Decair", grp: ["Aes Sídhe"], src: "GDEC",
    d: "Anderswelt-Trickster. Sein klappriges Zauberpferd entführt fünfzehn Fianna übers Meer — Diarmuid und die Söhne des Königs von Iruaidhe holen sie aus der Anderswelt zurück.",
    props: [["animal", "Graues Zauberpferd", "Trägt fünfzehn Männer auf dem Rücken davon"]] },
  { n: "Searbhán", alt: ["Searbhán Lochlannach"], g: "male", e: "Der grimmige Riese", src: "TDG", dead: true,
    d: "Einäugiger Riese, Wächter des Vogelbeerbaums der Unsterblichkeit im Wald von Dubros. Nur seine eigene Eisenkeule kann ihn töten — Diarmuid entreißt sie ihm für Gráinnes Beeren.",
    props: [["weapon", "Eisenkeule", "Nur sie kann ihn verwunden"], ["attribute", "Ein Auge", "Feuerauge in der Stirnmitte"]] },
  { n: "Muadhan", g: "male", src: "TDG",
    d: "Treuer Diener, der Diarmuid und Gráinne auf der Flucht trägt, bewacht und mit gefangenem Lachs nährt." },
  { n: "Donn Ua Duibhne", g: "male", grp: ["Clann Baíscne"], src: "TDG", dead: true,
    d: "Diarmuids Vater. Erdrückt im Eifersuchtszorn das Kind des Haushofmeisters Roc — der Ursprung des Ebers von Benbulbin." },
  { n: "Roc mac Dícháin", g: "male", src: "TDG",
    d: "Haushofmeister des Aengus. Erweckt sein totes Kind als grünen, borstenlosen Eber und legt ihm die Geis auf, Diarmuid in den Tod zu führen." },
  { n: "Der Eber von Benbulbin", alt: ["Torc Binn Ghulbain"], g: "other", e: "Der verwandelte Ziehbruder", src: "TDG", dead: true,
    d: "Rocs wiedererwecktes Kind in Ebergestalt — Diarmuids Ziehbruder und Schicksal. Ohne Ohren und Schweif, unverwundbar für gewöhnliche Klingen.",
    props: [["color", "Grün", "Der grüne Eber ohne Borsten"], ["attribute", "Geis", "Bestimmt, Diarmuid zu töten und durch ihn zu fallen"]] },
  { n: "Bébinn", alt: ["Bebhionn"], g: "female", e: "Die Riesin aus dem Westen", src: "ACS", dead: true,
    d: "Riesenhafte Königstochter vom Land der Frauen, flieht vor ihrem Bräutigam zu den Fianna — sein Speer findet sie dennoch." },
  { n: "Crimall", g: "male", grp: ["Clann Baíscne", "Fianna"], src: "MF",
    d: "Bruder Cumhalls. Bewahrt den Kranichbeutel, bis der junge Fionn ihn einlöst." },
  { n: "Fiacail mac Conchinn", g: "male", grp: ["Fianna"], src: "MF",
    d: "Fionns Ziehonkel und erster Lehrer im Kriegshandwerk, Gatte der Druidin Bodhmall." },
  { n: "Fothad Canainne", g: "male", e: "Rivale der Fianna", src: "ACS", dead: true,
    d: "Anführer einer rivalisierenden Fian aus Connacht. Sein abgeschlagenes Haupt spricht noch das Totengedicht an seine Geliebte." },
  { n: "Cnú Deireóil", alt: ["Die kleine Nuss"], g: "male", e: "Fionns Harfner", grp: ["Fianna", "Aes Sídhe"], src: "ACS",
    d: "Zwergenhafter Harfner aus dem Síd — behauptet, Lughs Sohn zu sein; seine Musik heilt Schwermut.",
    props: [["skill", "Harfenspiel", "Heilt Schwermut"]] },
  { n: "Ailbhe ingen Chormaic", g: "female", src: "ACS",
    d: "Tochter Cormac mac Airts, klügste Frau Irlands im Rätselwettstreit — nach Gráinnes Flucht Fionns Gefährtin." },
];

// ── Königszyklus: die Erzählungen im Detail ──────────────────────────────
const CHARS_KINGS_EXT: CharDef[] = [
  // Togail Bruidne Dá Derga
  { n: "Eterscél", alt: ["Eterscél Mór"], g: "male", e: "Hochkönig", src: "TBDD", dead: true,
    d: "Hochkönig von Tara, nomineller Vater Conaire Mórs — heiratet die verborgene Mess Búachalla." },
  { n: "Nemglan", g: "male", deity: true, e: "Der Vogelkönig", grp: ["Aes Sídhe"], src: "TBDD",
    d: "Vogelwesen, wahrer Vater Conaire Mórs. Sein Gebot: Der Sohn darf nie Vögel jagen — die erste aller Geasa Conaires." },
  { n: "Donn Désa", g: "male", src: "TBDD",
    d: "Kämpe und Ziehvater der drei Räuber-Ziehbrüder Conaires — Fer Le, Fer Gar und Fer Rogain." },
  { n: "Fer Rogain", g: "male", src: "TBDD",
    d: "Ziehbruder Conaire Mórs, einer der Söhne des Donn Désa. Beweint bei der Räuber-Musterung jeden Helden, den der Überfall kosten wird — und reitet doch mit." },
  { n: "Ingcél Cáech", alt: ["Ingcél der Einäugige"], g: "male", e: "Der einäugige Plünderer", src: "TBDD",
    d: "Britischer Räuberfürst mit einem Auge, drei Pupillen darin. Sein Spähbericht aus Da Dergas Halle ist der berühmteste Katalog von Helden — dann gibt er das Zeichen zum Sturm.",
    props: [["attribute", "Ein Auge, drei Pupillen", "So breit wie eine Ochsenhaut"]] },
  { n: "Da Derga", g: "male", e: "Der Gastherr", src: "TBDD",
    d: "Herr des großen Gasthauses am Dodder mit den sieben Türen — Namensgeber der Katastrophe." },
  { n: "Mac Cécht mac Snaide Teichid", alt: ["Mac Cécht (Conaires Kämpe)"], g: "male", e: "Conaires Kämpe", src: "TBDD",
    d: "Riesenhafter Champion Conaires. Durchquert brennend vor Durst ganz Irland nach Wasser für den König — und kommt einen Herzschlag zu spät." },
  // Orgain Denna Ríg
  { n: "Ugaine Mór", g: "male", e: "Hochkönig der Fünfundzwanzig", src: "ORT",
    d: "Sagenhafter Hochkönig, teilt Irland unter 25 Kinder — Urahn von Lóegaire Lorc und Cobthach." },
  { n: "Lóegaire Lorc", g: "male", e: "König von Leinster", src: "ORT", dead: true,
    d: "Großvater Labraids. Sein neidkranker Bruder Cobthach ersticht ihn — der erste Mord der Dinn-Ríg-Fehde." },
  { n: "Cobthach Cóel Breg", alt: ["Cobthach der Magere"], g: "male", e: "Der Brudermörder", src: "ORT", dead: true,
    d: "Ermordet Bruder und Neffen, zwingt Labraid, Herz von Vater und Großvater zu essen — verbrennt am Ende mit 700 Gefolgsleuten in Dinn Ríg." },
  { n: "Moriath", alt: ["Moriath ingen Scoriath"], g: "female", src: "ORT",
    d: "Königstochter von Fir Morca. Ihre Liebe gibt dem stummen Labraid die Sprache zurück — Craiftines Harfe schläfert ihre Wächter." },
  { n: "Scoriath", g: "male", e: "König der Fir Morca", src: "ORT",
    d: "König in Munster, nimmt den verbannten Labraid auf und gibt ihm Heer und Tochter." },
  { n: "Craiftine", g: "male", e: "Der Harfner", src: "ORT",
    d: "Labraids Harfner. Seine Schlafmusik öffnet Moriaths Kammer und die Mauern von Dinn Ríg — und dem Schilf vertraut der Barbier das Geheimnis der Pferdeohren an.",
    props: [["skill", "Schlafmusik", "Suantraí, die Heere fällt"]] },
  // Mag Mucrama & Munster
  { n: "Éogan Mór", alt: ["Mug Nuadat", "Eógan Taídlech"], g: "male", e: "Mug Nuadat", src: "CMM", dead: true,
    d: "König von Munster, teilt Irland mit Conn in »Conns Hälfte« und »Mugs Hälfte« — fällt gegen ihn bei Mag Léna." },
  { n: "Sadb ingen Chuinn", g: "female", src: "CMM",
    d: "Tochter Conns, Frau Ailill Auloms, Ziehmutter des Lugaid Mac Con — die Banshenchas rühmt ihre Würde." },
  { n: "Lugaid Lága", g: "male", src: "CMM",
    d: "Bruder Ailill Auloms, gewaltigster Kämpe Munsters — erschlägt an Mac Cons Seite den Hochkönig Art bei Mag Mucrama." },
  { n: "Fithal", g: "male", e: "Richter Cormacs", src: "DSEN",
    d: "Weiser Richter an Cormacs Hof; seine Sprüche über Recht und Maß gehören zur Weisheitsliteratur Taras." },
  { n: "Eithne Tháebfhota", alt: ["Eithne Langseite"], g: "female", e: "Königin von Tara", src: "DSEN",
    d: "Tochter des Leinster-Königs, Frau Cormac mac Airts, Mutter Cairbre Lifechairs." },
  { n: "Cellach mac Cormaic", g: "male", src: "DSEN", dead: true,
    d: "Sohn Cormacs. Sein Frauenraub gegen die Déisi bringt Cormac das Auge und Cellach das Leben — und die Déisi die Verbannung." },
  // Niall & Uí Néill
  { n: "Eochaid Mugmedón", g: "male", e: "Hochkönig", grp: ["Uí Néill"], src: "NIA",
    d: "Hochkönig, Vater Nialls und der Connachta-Ahnen Brión, Fiachra und Ailill." },
  { n: "Cairenn", alt: ["Cairenn Chasdub"], g: "female", grp: ["Uí Néill"], src: "NIA",
    d: "Britannische Königstochter, Sklavin an Eochaids Hof, Mutter Nialls — Mongfind zwingt sie zum Wasserschleppen, bis der Sohn sie erhöht." },
  { n: "Mongfind", g: "female", e: "Die Zauberkönigin", src: "NIA", dead: true,
    d: "Eochaids Königin, Todfeindin Cairenns und Nialls. Stirbt am Gifttrank, den sie für ihren Bruder mischte — die Samhain-Nacht hieß danach »Fest der Mongfind«." },
  { n: "Brión", alt: ["Brión mac Echach"], g: "male", grp: ["Uí Néill"], src: "NIA",
    d: "Ältester Sohn Mongfinds, Ahnherr der Uí Briúin Connachts — unterliegt Niall in der Schmiede-Probe und im Krieg." },
  { n: "Fiachra mac Echach", g: "male", grp: ["Uí Néill"], src: "NIA",
    d: "Sohn Eochaids, Ahnherr der Uí Fiachrach; rettet aus der brennenden Schmiede das Werkzeug." },
  { n: "Torna Éces", g: "male", e: "Der Dichter", src: "NIA",
    d: "Munsterdichter, Ziehvater Nialls — sein Preislied begleitet den Aufstieg des Königs." },
  // Muirchertach, Mongán, Mag Rath, Diarmait
  { n: "Muirchertach mac Ercae", g: "male", e: "Hochkönig von Ailech", grp: ["Uí Néill"], src: "AMME", dead: true,
    d: "Uí-Néill-Hochkönig. Die Anderswelt-Frau Sín umgarnt ihn, bis er in der Samhain-Nacht von Cleitech Wein, Feuer und Flut zugleich erliegt — der dreifache Tod." },
  { n: "Sín", alt: ["Storm", "Sigh"], g: "female", e: "Die Rächerin", grp: ["Aes Sídhe"], src: "AMME", dead: true,
    d: "Zauberfrau, deren Sippe Muirchertach erschlug. Aus Wasser macht sie Wein, aus Farn Schweine, aus Steinen Krieger — und den König zu Asche. Ihr eigener Gram tötet sie danach.",
    props: [["attribute", "Trugzauber", "Wein aus Wasser, Heere aus Steinen"]] },
  { n: "Mongán mac Fiachnai", g: "male", e: "Der Sohn Manannáns", src: "IMB", dead: true,
    d: "König von Dál nAraidi, heimlicher Sohn Manannáns — gezeugt, während der Gott in Fiachnas Gestalt bei dessen Frau lag. Gestaltwandler und Wiedergeburt Fionns in der Deutung der Dichter.",
    props: [["attribute", "Gestaltwandel", "Erbe des göttlichen Vaters"]] },
  { n: "Fiachna mac Báetáin", g: "male", e: "König von Dál nAraidi", src: "IMB", dead: true,
    d: "Mongáns irdischer Vater. Manannán rettet ihm die Schlacht in Alba — zum Preis einer Nacht bei seiner Frau." },
  { n: "Caíntigern", g: "female", src: "IMB",
    d: "Fiachnas Königin, Mutter Mongáns von Manannán." },
  { n: "Domnall mac Áedo", g: "male", e: "Hochkönig", grp: ["Uí Néill"], src: "CMR",
    d: "Hochkönig der Uí Néill, Ziehvater und dann Gegner Congal Cláens — Sieger von Mag Rath." },
  { n: "Congal Cláen", alt: ["Congal Cáech"], g: "male", e: "Der schielende König", src: "CMR", dead: true,
    d: "König der Ulaid, von einer Biene geblendet — »Cáech«, der Einäugige. Der Streit um ein Gänseei beim Fest von Dún na nGéd treibt ihn in die Schlacht von Mag Rath, wo er fällt." },
  { n: "Eorann", g: "female", src: "BS",
    d: "Suibhnes Königin. Hält dem Vogelkönig die Treue — ihre Wiedersehens-Dialoge gehören zu den zartesten Versen des Buile Shuibhne." },
  { n: "Loingsechán", g: "male", src: "BS",
    d: "Suibhnes Milchbruder. Fängt den Wahnsinnigen immer wieder ein — zuletzt mit der Lüge vom Tod seiner Familie." },
  { n: "Die Mühlenhexe", alt: ["Cailleach an Mhuilinn"], g: "female", src: "BS", dead: true,
    d: "Hexe der Mühle, fordert Suibhne zum Sprungwettstreit durch ganz Irland — bis sie an den Klippen zerschellt." },
  { n: "Moling", alt: ["Saint Moling"], g: "male", e: "Der Heilige", src: "BS",
    d: "Heiliger von Tech Moling. Nimmt den sterbenden Suibhne auf, schreibt seine Verse nieder und begräbt ihn an der Kirchentür." },
  { n: "Mongán der Hirte", alt: ["Mongán muccaid"], g: "male", src: "BS", dead: true,
    d: "Molings Schweinehirt — durchbohrt Suibhne aus Eifersucht mit dem Speer: der vorhergesagte Tod durch eine Speerspitze." },
  { n: "Diarmait mac Cerbaill", g: "male", e: "Der letzte König von Tara", grp: ["Uí Néill"], src: "AIDC", dead: true,
    d: "Letzter Hochkönig, der das heidnische Fest von Tara beging. Der Fluch des heiligen Ruadán entvölkert Tara; sein prophezeiter dreifacher Tod — erschlagen, verbrannt, ertrunken — erfüllt sich in Banbans Halle." },
  { n: "Bec mac Dé", g: "male", e: "Der Seher", src: "AIDC", dead: true,
    d: "Prophet Diarmaits — sagt dem König den dreifachen Tod voraus, an den niemand glauben will, weil er unmöglich scheint." },
  // Echtra Fergusa maic Léti
  { n: "Fergus mac Léti", g: "male", e: "König von Ulster", grp: ["Ulaid"], src: "EFL", dead: true,
    d: "Ulster-König. Die Lúchorpáin schenken ihm die Kraft, unter Wasser zu gehen — mit einer Geis: nie in Loch Rudraige. Er bricht sie, das Ungeheuer Muirdris verzerrt sein Gesicht, und im zweiten Kampf sterben beide." },
  { n: "Iubdán", g: "male", e: "König der Lúchorpáin", grp: ["Lúchorpáin"], src: "EFL",
    d: "Winzigkönig, dessen Prahlerei ihn an Fergus' Hof als Geisel bringt — sein Preis für die Freiheit sind die Wunderschuhe, mit denen man über Wasser geht.",
    props: [["attribute", "Winzigkeit", "Der Hofzwerg Irlands ist ein Riese neben ihm"]] },
  { n: "Bebo", g: "female", grp: ["Lúchorpáin"], src: "EFL",
    d: "Iubdáns Königin, teilt seine Gefangenschaft bei Fergus." },
  { n: "Eisirt", g: "male", e: "Dichter der Lúchorpáin", grp: ["Lúchorpáin"], src: "EFL",
    d: "Hofdichter Iubdáns. Beweist dem eigenen König, dass es Riesen gibt — sein Spott bringt die Kleinleute an Fergus' Hof." },
  { n: "Muirdris", alt: ["Sínach"], g: "other", e: "Das Ungeheuer von Loch Rudraige", src: "EFL", dead: true,
    d: "Seeungeheuer, das sich aufbläht und zusammenzieht wie ein Blasebalg. Sein Anblick verzerrt Fergus' Gesicht — ein König darf keinen Makel tragen, und so muss der zweite Kampf fallen." },
];

// ── Family relations ─────────────────────────────────────────────────────
// Convention: [A, "father", B] = A is the father of B.

const FAM_LGE: FamRel[] = [
  ["Bith", "father", "Cessair"],
  ["Ladra", "lover", "Cessair", "Einer der drei Männer unter fünfzig Frauen"],
  ["Fintan mac Bóchra", "spouse", "Cessair"],
  ["Partholón", "spouse", "Delgnat"],
  ["Delgnat", "lover", "Topa", "Der erste Ehebruch Irlands"],
  ["Starn", "father", "Tuan mac Cairill"],
  ["Nemed", "father", "Starn"],
  ["Nemed", "father", "Iarbonél"],
  ["Nemed", "father", "Fergus Lethderg"],
  ["Nemed", "father", "Ainninn"],
  ["Starn", "sibling", "Iarbonél"],
  ["Starn", "sibling", "Fergus Lethderg"],
  ["Iarbonél", "sibling", "Fergus Lethderg"],
  ["Fergus Lethderg", "father", "Britán Máel"],
  ["Slainge", "sibling", "Gann"],
  ["Slainge", "sibling", "Genann"],
  ["Slainge", "sibling", "Sengann"],
  ["Slainge", "sibling", "Rudraige mac Dela"],
  ["Gann", "sibling", "Sengann"],
  ["Genann", "sibling", "Rudraige mac Dela"],
  ["Búarainech", "father", "Balor"],
  ["Domnu", "mother", "Indech"],
  ["Breogán", "father", "Bile"],
  ["Breogán", "father", "Íth"],
  ["Bile", "father", "Míl Espáine"],
  ["Bile", "sibling", "Íth"],
  ["Míl Espáine", "father", "Ír"],
  ["Míl Espáine", "father", "Colptha"],
  ["Míl Espáine", "father", "Érannán"],
  ["Ír", "sibling", "Éremón"],
  ["Colptha", "sibling", "Éber Finn"],
  ["Érannán", "sibling", "Donn"],
  ["Amergin", "spouse", "Scéne"],
  ["Éremón", "spouse", "Tea", "Tara ist ihr Totenhügel"],
  ["Éremón", "spouse", "Odba", "Die verlassene erste Gefährtin"],
];

const FAM_TDD: FamRel[] = [
  ["Dagda", "father", "Cermait"],
  ["Dagda", "father", "Aed Minbhrec"],
  ["Cermait", "sibling", "Aengus"],
  ["Cermait", "father", "Mac Cuill", "Die drei Enkel des Dagda, letzte Könige der Danann"],
  ["Cermait", "father", "Mac Cécht"],
  ["Cermait", "father", "Mac Gréine"],
  ["Mac Cuill", "sibling", "Mac Cécht"],
  ["Mac Cuill", "sibling", "Mac Gréine"],
  ["Mac Cécht", "sibling", "Mac Gréine"],
  ["Nechtan", "spouse", "Boann", "In der Dindshenchas-Fassung"],
  ["Dian Cécht", "father", "Étan"],
  ["Ogma", "spouse", "Étan"],
  ["Étan", "mother", "Cairbre mac Étaíne"],
  ["Ogma", "father", "Cairbre mac Étaíne"],
  ["Delbáeth", "father", "Ériu", "Genealogie des Lebor Gabála"],
  ["Delbáeth", "father", "Banba"],
  ["Delbáeth", "father", "Fódla"],
  ["Dian Cécht", "father", "Cethen"],
  ["Dian Cécht", "father", "Cú mac Cáinte"],
  ["Cian", "sibling", "Cethen"],
  ["Cian", "sibling", "Cú mac Cáinte"],
  ["Ethal Anbuail", "father", "Cáer Ibormeith"],
  ["Aengus", "spouse", "Cáer Ibormeith", "Als Schwäne vereint über Loch Bél Dracon"],
  ["Manannán mac Lir", "foster_parent", "Áine", "In der munsterschen Überlieferung seine Tochter"],
  ["Manannán mac Lir", "spouse", "Fand"],
  ["Áed Abrat", "father", "Fand"],
  ["Áed Abrat", "father", "Lí Ban"],
  ["Fand", "sibling", "Lí Ban"],
  ["Labraid Luathlám", "spouse", "Lí Ban"],
  ["Bé Find", "sibling", "Boann"],
  ["Bé Find", "mother", "Fráech"],
];

const FAM_ULSTER: FamRel[] = [
  ["Eochaid Sálbuide", "father", "Ness"],
  ["Fedlimid mac Daill", "father", "Deirdre"],
  ["Uisliu", "father", "Naoise"],
  ["Uisliu", "father", "Ainnle"],
  ["Uisliu", "father", "Ardán"],
  ["Cathbad", "father", "Finnchóem", "In der Überlieferung von Conalls Abkunft"],
  ["Finnchóem", "sibling", "Deichtine"],
  ["Finnchóem", "mother", "Conall Cernach"],
  ["Amergin mac Echit", "father", "Conall Cernach"],
  ["Finnchóem", "foster_parent", "Cú Chulainn"],
  ["Conchobar mac Nessa", "father", "Cormac Cond Longas"],
  ["Conchobar mac Nessa", "father", "Cúscraid Mend Macha"],
  ["Conchobar mac Nessa", "father", "Furbaide Ferbend"],
  ["Conchobar mac Nessa", "father", "Fedelm Noíchrothach"],
  ["Conchobar mac Nessa", "spouse", "Mugain"],
  ["Fergus mac Róich", "foster_parent", "Cormac Cond Longas"],
  ["Eochaid Feidlech", "father", "Medb"],
  ["Eochaid Feidlech", "father", "Clothru"],
  ["Medb", "sibling", "Clothru"],
  ["Clothru", "mother", "Furbaide Ferbend", "Aus ihrem Leib geschnitten"],
  ["Clothru", "mother", "Lugaid Riab nDerg", "Von ihren drei Brüdern — der »Rotgestreifte«"],
  ["Eochaid Feidlech", "grandparent", "Lugaid Riab nDerg"],
  ["Lugaid Riab nDerg", "spouse", "Derbforgaill"],
  ["Scáthach", "mother", "Uathach"],
  ["Cú Chulainn", "lover", "Uathach"],
  ["Forgall Monach", "father", "Fial ingen Forgaill"],
  ["Fial ingen Forgaill", "sibling", "Emer"],
  ["Friuch", "aspect", "Donn Cúailnge", "Wiedergeboren als der braune Stier"],
  ["Rucht", "aspect", "Finnbennach", "Wiedergeboren als der weiße Stier"],
];

const FAM_FENIAN: FamRel[] = [
  ["Tuiren", "sibling", "Muirne"],
  ["Tuiren", "mother", "Bran", "In Hündinnengestalt geboren"],
  ["Tuiren", "mother", "Sceólang"],
  ["Bran", "sibling", "Sceólang"],
  ["Crimall", "sibling", "Cumhall"],
  ["Fiacail mac Conchinn", "spouse", "Bodhmall"],
  ["Donn Ua Duibhne", "father", "Diarmuid Ua Duibhne"],
  ["Roc mac Dícháin", "father", "Der Eber von Benbulbin", "Das wiedererweckte Kind"],
  ["Der Eber von Benbulbin", "sibling", "Diarmuid Ua Duibhne", "Ziehbrüder — und einander zum Tod bestimmt"],
  ["Cael", "spouse", "Créde"],
  ["Cormac mac Airt", "father", "Ailbhe ingen Chormaic"],
  ["Ailbhe ingen Chormaic", "sibling", "Gráinne"],
  ["Fionn mac Cumhaill", "spouse", "Ailbhe ingen Chormaic", "Nach Gráinnes Flucht"],
];

const FAM_KINGS: FamRel[] = [
  ["Eterscél", "spouse", "Mess Búachalla"],
  ["Nemglan", "father", "Conaire Mór", "Der wahre Vater aus dem Vogelvolk"],
  ["Donn Désa", "foster_parent", "Conaire Mór"],
  ["Donn Désa", "father", "Fer Rogain"],
  ["Ugaine Mór", "father", "Lóegaire Lorc"],
  ["Ugaine Mór", "father", "Cobthach Cóel Breg"],
  ["Lóegaire Lorc", "sibling", "Cobthach Cóel Breg"],
  ["Lóegaire Lorc", "grandparent", "Labraid Loingsech"],
  ["Scoriath", "father", "Moriath"],
  ["Labraid Loingsech", "spouse", "Moriath"],
  ["Conn Cétchathach", "father", "Sadb ingen Chuinn"],
  ["Sadb ingen Chuinn", "sibling", "Art mac Cuinn"],
  ["Ailill Aulom", "spouse", "Sadb ingen Chuinn"],
  ["Ailill Aulom", "sibling", "Lugaid Lága"],
  ["Éogan Mór", "father", "Ailill Aulom", "In der Eóganachta-Genealogie"],
  ["Cormac mac Airt", "spouse", "Eithne Tháebfhota"],
  ["Eithne Tháebfhota", "mother", "Cairbre Lifechair"],
  ["Cormac mac Airt", "father", "Cellach mac Cormaic"],
  ["Eochaid Mugmedón", "father", "Niall Noígíallach"],
  ["Cairenn", "mother", "Niall Noígíallach"],
  ["Eochaid Mugmedón", "spouse", "Mongfind"],
  ["Eochaid Mugmedón", "spouse", "Cairenn"],
  ["Mongfind", "mother", "Brión"],
  ["Mongfind", "mother", "Fiachra mac Echach"],
  ["Eochaid Mugmedón", "father", "Brión"],
  ["Eochaid Mugmedón", "father", "Fiachra mac Echach"],
  ["Brión", "sibling", "Fiachra mac Echach"],
  ["Niall Noígíallach", "half_sibling", "Brión"],
  ["Niall Noígíallach", "half_sibling", "Fiachra mac Echach"],
  ["Torna Éces", "foster_parent", "Niall Noígíallach"],
  ["Manannán mac Lir", "father", "Mongán mac Fiachnai", "Gezeugt in Fiachnas Gestalt"],
  ["Fiachna mac Báetáin", "father", "Mongán mac Fiachnai", "Der irdische Vater"],
  ["Caíntigern", "mother", "Mongán mac Fiachnai"],
  ["Fiachna mac Báetáin", "spouse", "Caíntigern"],
  ["Suibhne", "spouse", "Eorann"],
  ["Loingsechán", "sibling", "Suibhne", "Milchbrüder"],
  ["Domnall mac Áedo", "foster_parent", "Congal Cláen"],
  ["Iubdán", "spouse", "Bebo"],
];

// ── New artifacts ────────────────────────────────────────────────────────
const ARTIFACTS_EXT: { n: string; alt?: string[]; t: string; d?: string; powers?: string; src?: string; owners?: [string, string, string?][] }[] = [
  { n: "Lúin Celtchair", alt: ["Speer des Celtchar"], t: "weapon", src: "TBDD",
    d: "Der große Speer, bei Mag Tuired gefunden. Muss in einem Kessel aus Gift ruhen, sonst entflammt sein Schaft.",
    powers: "Tötet neun Männer bei jedem Wurf — einer davon stets ein König; ahnt Blut, bevor die Schlacht beginnt.",
    owners: [["Celtchar mac Uthechair", "wielder"], ["Dubthach Dóeltenga", "keeper", "Trug ihn in Da Dergas Halle"]] },
  { n: "Wunderschuhe des Iubdán", t: "garment", src: "EFL",
    d: "Iubdáns Lösegeld an Fergus mac Léti.",
    powers: "Wer sie trägt, wandelt über und unter Wasser.",
    owners: [["Iubdán", "owner"], ["Fergus mac Léti", "other", "Der Preis der Freiheit der Kleinleute"]] },
  { n: "Fidchell des Crimthann", alt: ["Fidchell-Brett von Tara"], t: "other", src: "TE",
    d: "Das Spielbrett von Tara — Silberbrett, Goldfiguren, an jeder Ecke ein leuchtender Edelstein.",
    powers: "Um dieses Brett spielte Midir um Étaín: erst Reichtümer, dann Arbeiten, zuletzt den Kuss.",
    owners: [["Eochu Airem", "owner"], ["Midir", "seeker", "Verlor absichtlich, bis der Einsatz stimmte"]] },
  { n: "Harfe des Craiftine", t: "instrument", src: "ORT",
    d: "Die Harfe, in deren Holz das Schilf von Labraids Geheimnis flüsterte.",
    powers: "Ihre Suantraí schläfert Wachen und Heere; ungefragt singt sie: »Labraid hat Pferdeohren.«",
    owners: [["Craiftine", "wielder"]] },
  { n: "Eisenkeule des Searbhán", t: "weapon", src: "TDG",
    d: "Die Keule des Riesen von Dubros — an sein Handgelenk gekettet.",
    powers: "Das einzige Ding der Welt, das Searbhán verwunden kann.",
    owners: [["Searbhán", "owner"], ["Diarmuid Ua Duibhne", "wielder", "Entriss sie ihm und erschlug ihn damit"]] },
  { n: "Vogelbeeren von Dubros", alt: ["Beeren des Vogelbeerbaums"], t: "other", src: "TDG",
    d: "Beeren vom Baum der Tuatha Dé Danann im Wald von Dubros.",
    powers: "Drei Beeren vertreiben Krankheit und Alter — Gráinnes Verlangen, das den Riesen das Leben kostete.",
    owners: [["Searbhán", "keeper", "Bis zu seinem Tod"]] },
];

// ── Events of the individual tales ───────────────────────────────────────
const EVENTS_EXT: EventDef[] = [
  // LGE detail
  { k: "mag_itha", n: "Schlacht von Mag Itha", t: "battle", cy: "mythological", src: "LGE",
    d: "Partholón schlägt die fußlosen, einarmigen Fomorer unter Cichol Gricenchos — die erste Schlacht Irlands.",
    chars: [["Partholón", "protagonist"], ["Cichol Gricenchos", "victim"]] },
  { k: "first_adultery", n: "Der erste Ehebruch Irlands", t: "meeting", cy: "mythological", src: "LGE",
    d: "Delgnat und der Diener Topa betrügen Partholón; ihr Rechtsspruch — »der Honig war bei der Frau gelassen« — ist Irlands erstes Urteil.",
    chars: [["Delgnat", "protagonist"], ["Topa", "victim"], ["Partholón", "antagonist"]] },
  { k: "tuan_lives", n: "Die Leben des Tuan mac Cairill", t: "transformation", cy: "mythological", src: "LGE",
    d: "Der letzte Partholonier durchlebt Hirsch, Eber, Adler und Lachs — gegessen von einer Königin, als Mensch wiedergeboren, erzählt er Irlands Vorzeit.",
    chars: [["Tuan mac Cairill", "protagonist"]] },
  { k: "ith_death", n: "Tod des Íth", t: "death", cy: "mythological", src: "LGE", lifecycleOf: "Íth",
    d: "Die drei Danann-Könige lassen den iberischen Gast erschlagen — sein Leichnam, heimgebracht, ruft die Söhne Míls zu den Waffen.",
    chars: [["Íth", "victim"], ["Mac Cuill", "antagonist"], ["Mac Cécht", "antagonist"], ["Mac Gréine", "antagonist"]] },
  { k: "crom_worship", n: "Der Kult des Crom Cruach", t: "other", cy: "mythological", src: "DSEN",
    d: "Auf Mag Slécht opfert Irland dem goldenen Götzen die Erstgeburt für Milch und Korn — bis Tigernmas und drei Viertel seines Volkes in einer Samhain-Nacht vor ihm sterben.",
    chars: [["Crom Cruach", "protagonist"], ["Tigernmas", "victim"]],
    places: ["Mag Slécht"] },
  // Aislinge Óenguso
  { k: "aengus_dream", n: "Der Traum des Aengus", t: "prophecy", cy: "mythological", src: "AISL",
    d: "Ein Jahr lang erscheint dem Aengus nachts die schönste Gestalt Irlands — er verfällt in Liebeskrankheit, bis Boann und der Dagda die Suche beginnen.",
    chars: [["Aengus", "protagonist"], ["Cáer Ibormeith", "protagonist"], ["Boann", "ally"], ["Dagda", "ally"]] },
  { k: "aengus_swans", n: "Aengus und Cáer als Schwäne", t: "transformation", cy: "mythological", src: "AISL",
    d: "Am Samhain erkennt Aengus Cáer unter 150 Schwänen am Loch Bél Dracon; er wird selbst zum Schwan, dreimal umkreisen sie den See und singen die Anderswelt in Schlaf.",
    chars: [["Aengus", "protagonist"], ["Cáer Ibormeith", "protagonist"], ["Ethal Anbuail", "victim", "Belagert, bis er das Geheimnis preisgab"], ["Medb", "ally", "Half bei der Belagerung"], ["Ailill mac Máta", "ally"]],
    places: ["Loch Bél Dracon", "Brú na Bóinne"] },
  // CMT detail
  { k: "cairbre_satire", n: "Cairbres Gang zu Bres", t: "meeting", cy: "mythological", src: "CMT",
    d: "Der Dichter Cairbre erhält bei Bres eine dunkle Kammer ohne Feuer, drei trockene Kuchen — am Morgen spricht er die Satire, die den König entehrt.",
    chars: [["Cairbre mac Étaíne", "protagonist"], ["Bres", "victim"]] },
  // Ulster detail
  { k: "macha_race", n: "Machas Wettlauf", t: "other", cy: "ulster", src: "TAIN",
    d: "Ihr Mann prahlt, sie laufe schneller als die Königspferde — hochschwanger gewinnt Macha den Lauf, gebiert Zwillinge im Ziel und spricht den Fluch.",
    chars: [["Macha", "protagonist"], ["Conchobar mac Nessa", "antagonist"]],
    places: ["Emain Macha"] },
  { k: "ness_trick", n: "Ness erlistet das Königtum", t: "meeting", cy: "ulster", src: "TAIN",
    d: "Als Preis ihrer Hand fordert Ness von Fergus ein Jahr Königtum für ihren Sohn — ihre Geschenke kaufen die Ulter, und das Jahr endet nie.",
    chars: [["Ness", "protagonist"], ["Fergus mac Róich", "victim"], ["Conchobar mac Nessa", "ally"]],
    places: ["Emain Macha"] },
  { k: "uathach_glen", n: "Uathach und die Brücke der Schüler", t: "meeting", cy: "ulster", src: "TEM",
    d: "Cú Chulainn überspringt die schwingende Brücke, gewinnt Uathach und erzwingt mit dem Schwert an Scáthachs Brust die drei Wünsche: Lehre, Freundschaft, Prophezeiung.",
    chars: [["Cú Chulainn", "protagonist"], ["Uathach", "ally"], ["Scáthach", "victim"]],
    places: ["Dún Scáith"] },
  { k: "frach_wooing", n: "Fráech wirbt um Findabair", t: "meeting", cy: "ulster", src: "TBF",
    d: "Der schönste Held Irlands kommt mit Anderswelt-Gaben nach Cruachan; Medb und Ailill fordern den unmöglichen Brautpreis.",
    chars: [["Fráech", "protagonist"], ["Findabair", "protagonist"], ["Medb", "antagonist"], ["Ailill mac Máta", "antagonist"]],
    places: ["Cruachan"] },
  { k: "frach_monster", n: "Fráech und das Wasserungeheuer", t: "battle", cy: "ulster", src: "TBF",
    d: "Ailill schickt Fráech in den Teich des Ungeheuers; Findabair wirft ihm das Schwert zu — er erschlägt es, doch die Anderswelt-Frauen tragen ihn zur Heilung in den Síd.",
    chars: [["Fráech", "protagonist"], ["Findabair", "ally"], ["Ailill mac Máta", "antagonist"]],
    places: ["Cruachan"] },
  { k: "nad_crantail_duel", n: "Zweikampf mit Nad Crantail", t: "battle", cy: "ulster", src: "TAIN", parent: "base_tain_defense",
    d: "Neun Spieße aus Stechpalme wirft Nad Crantail; Cú Chulainn tritt auf jeder Spitze wie ein Vogel — der Todesstreich spaltet den Spötter bis zum Nabel.",
    chars: [["Cú Chulainn", "protagonist"], ["Nad Crantail", "victim"]] },
  { k: "loch_duel", n: "Zweikampf mit Lóch", t: "battle", cy: "ulster", src: "TAIN", parent: "base_tain_defense",
    d: "Während die Morrígan als Aal, Wölfin und Färse angreift, fällt der hornhäutige Lóch durch den Gáe Bulg — er bittet, vorwärts zu fallen, der Ehre wegen.",
    chars: [["Cú Chulainn", "protagonist"], ["Lóch mac Mofemis", "victim"], ["Morrígan", "antagonist"]] },
  { k: "etarcomol_duel", n: "Etarcomols Übermut", t: "battle", cy: "ulster", src: "TAIN", parent: "base_tain_defense",
    d: "Unter Fergus' Schutz kommt der Ziehsohn Medbs zum Schauen — und bleibt zum Sterben: erst geschont, dann der Länge nach gespalten.",
    chars: [["Cú Chulainn", "protagonist"], ["Etarcomol", "victim"], ["Fergus mac Róich", "other", "Sein Schutzwort wurde missbraucht"]] },
  { k: "calatin_fight", n: "Kampf gegen Calatín und seine Söhne", t: "battle", cy: "ulster", src: "TAIN", parent: "base_tain_defense",
    d: "Achtundzwanzig Hände werfen als eine; Cú Chulainn geht unter — bis der Ulter Fiacha im Heer Connachts die Treue bricht und ihm die Hand freischlägt.",
    chars: [["Cú Chulainn", "protagonist"], ["Calatín", "victim"]] },
  { k: "cethern_wounds", n: "Cetherns Wundenschau", t: "other", cy: "ulster", src: "TAIN",
    d: "Der Arzt Fíngin liest aus jeder Wunde den Gegner; Cethern wählt: drei Tage Heilung und Kampf statt langer Genesung — und fällt wie ein Sturm ins Heer.",
    chars: [["Cethern mac Fintain", "protagonist"], ["Fíngin Fáthliaig", "ally"]] },
  { k: "serglige", n: "Die Jahreskrankheit Cú Chulainns", t: "transformation", cy: "ulster", src: "SCC",
    d: "Zwei Anderswelt-Frauen als Vögel; seine Schleuder fehlt, ihre Gerten treffen: Ein Jahr liegt der Held sprachlos — bis Lí Ban die Botschaft Fands bringt.",
    chars: [["Cú Chulainn", "victim"], ["Fand", "protagonist"], ["Lí Ban", "protagonist"]],
    places: ["Mag Muirthemne"] },
  { k: "fand_love", n: "Cú Chulainn und Fand", t: "meeting", cy: "ulster", src: "SCC",
    d: "Für Labraids Schlachthilfe erhält er Fand; einen Monat leben sie vereint — bis Emer mit fünfzig Messern kommt und Fand den Verzicht wählt: »Nimm du ihn, Emer — er ist dein.«",
    chars: [["Cú Chulainn", "protagonist"], ["Fand", "protagonist"], ["Emer", "antagonist"], ["Labraid Luathlám", "ally"]] },
  { k: "manannan_cloak", n: "Der Nebelmantel zwischen den Liebenden", t: "transformation", cy: "ulster", src: "SCC",
    d: "Manannán holt Fand heim und schüttelt den Féth Fíada zwischen ihr und Cú Chulainn — sie werden einander nie wieder begegnen; Vergessenstränke heilen Held und Emer.",
    chars: [["Manannán mac Lir", "protagonist"], ["Fand", "victim"], ["Cú Chulainn", "victim"], ["Emer", "other"]] },
  { k: "derbforgaill_death", n: "Tod der Derbforgaill", t: "death", cy: "ulster", src: "ADG", lifecycleOf: "Derbforgaill",
    d: "Der Schneewettstreit der Frauen verrät ihre Vollkommenheit; aus Neid verstümmelt, stirbt sie — Cú Chulainn rächt sie an hundertfünfzig Königinnen.",
    chars: [["Derbforgaill", "victim"], ["Lugaid Riab nDerg", "victim", "Stirbt aus Gram neben ihr"], ["Cú Chulainn", "other", "Der Rächer"]],
    places: ["Emain Macha"] },
  { k: "athirne_siege", n: "Athirnes Rundreise und Belagerung", t: "other", cy: "ulster", src: "DSEN",
    d: "Der unersättliche Dichter presst Irland aus — ein Auge hier, die Königinnen dort. Leinster belagert Ulster seinetwegen; am Ende brennen die Ulter sein Haus nieder.",
    chars: [["Athirne", "antagonist"]] },
  { k: "fergus_leti_geis", n: "Fergus und die Lúchorpáin", t: "meeting", cy: "ulster", src: "EFL",
    d: "Die Kleinleute tragen den schlafenden König aufs Meer; wach greift er drei — und erhält für ihre Freiheit die Kraft, unter Wasser zu wandeln. Nur Loch Rudraige ist ihm verboten.",
    chars: [["Fergus mac Léti", "protagonist"], ["Iubdán", "victim"], ["Bebo", "victim"], ["Eisirt", "other"]],
    places: ["Loch Rudraige"] },
  { k: "fergus_muirdris", n: "Fergus und Muirdris", t: "battle", cy: "ulster", src: "EFL",
    d: "Er bricht die Geis: Das Ungeheuer verzerrt sein Gesicht zum Makel, den man dem König sieben Jahre verbirgt. Im zweiten Kampf tötet er Muirdris — »Ich bin der Überlebende!« — und stirbt.",
    chars: [["Fergus mac Léti", "victim"], ["Muirdris", "victim"]],
    places: ["Loch Rudraige"] },
  // Fenian detail
  { k: "tuiren_hounds", n: "Tuirens Verwandlung — Bran und Sceólang", t: "transformation", cy: "fenian", src: "ACS",
    d: "Die eifersüchtige Síd-Frau verwandelt Fionns Tante in eine Hündin; ihre in Tiergestalt geborenen Kinder bleiben Hunde — Fionns treueste Gefährten und Verwandte.",
    chars: [["Tuiren", "victim"], ["Bran", "protagonist"], ["Sceólang", "protagonist"], ["Fionn mac Cumhaill", "other"]] },
  { k: "rowan_hostel", n: "Das Haus der Vogelbeere", t: "other", cy: "fenian", src: "BCH",
    d: "Der Rachegast Midac lockt die Fianna in die verzauberte Halle: Sie kleben an Boden und Bänken, während draußen die Heere landen — Diarmuid und die Getreuen halten die Furt bis zum Morgen.",
    chars: [["Fionn mac Cumhaill", "victim"], ["Conán Maol", "victim", "Verliert die Haut vom Rücken — das Schafsfell wächst an"], ["Diarmuid Ua Duibhne", "protagonist"], ["Goll mac Morna", "ally"]] },
  { k: "ventry_battle", n: "Schlacht von Fionntrá", t: "battle", cy: "fenian", src: "CFT",
    d: "Der König der Welt landet mit den Flotten aller Länder; ein Jahr und einen Tag hält die Schlacht am Strand von Ventry, bis Fionn Dáire Donn im Zweikampf fällt.",
    chars: [["Dáire Donn", "victim"], ["Fionn mac Cumhaill", "protagonist"], ["Cael", "victim"], ["Oscar", "ally"], ["Caílte mac Rónáin", "ally"]],
    places: ["Fionntrá"] },
  { k: "crede_grief", n: "Crédes Totenklage", t: "death", cy: "fenian", src: "CFT", lifecycleOf: "Créde",
    d: "Créde birgt den ertrunkenen Cael; ihre Klage — »die Welle schlägt an den Strand, sie beweint ihn« — endet, als sie sich zu ihm ins Grab legt.",
    chars: [["Créde", "victim"], ["Cael", "mentioned"]],
    places: ["Fionntrá"] },
  { k: "gilla_decair", n: "Der Gilla Decair und das graue Pferd", t: "journey", cy: "fenian", src: "GDEC",
    d: "Der mürrische Riesenknecht lässt fünfzehn Fianna auf sein klappriges Pferd steigen — es rennt übers Meer. Diarmuid folgt, und die Fianna kehren aus der Anderswelt mit Lohn heim.",
    chars: [["Abarta", "antagonist"], ["Diarmuid Ua Duibhne", "protagonist"], ["Fionn mac Cumhaill", "ally"], ["Conán Maol", "victim", "Klebte als Erster auf dem Pferd"]] },
  { k: "searbhan_berries", n: "Searbhán und die Vogelbeeren", t: "battle", cy: "fenian", src: "TDG", parent: "base_pursuit",
    d: "Gráinne verlangt die Beeren der Unsterblichkeit; der einäugige Riese verweigert sie — Diarmuid entreißt ihm die Eisenkeule und erschlägt ihn mit seiner eigenen Waffe.",
    chars: [["Diarmuid Ua Duibhne", "protagonist"], ["Searbhán", "victim"], ["Gráinne", "other"]] },
  { k: "bebinn_death", n: "Bébinn, die Riesin", t: "death", cy: "fenian", src: "ACS", lifecycleOf: "Bébinn",
    d: "Die riesenhafte Königstochter flieht vor ihrem Bräutigam unter Fionns Schutz — sein Speer durchbohrt sie mitten unter den Fianna, und der Riese entkommt übers Meer.",
    chars: [["Bébinn", "victim"], ["Fionn mac Cumhaill", "other"]] },
  { k: "fothad_head", n: "Fothad Canainnes sprechendes Haupt", t: "death", cy: "fenian", src: "ACS", lifecycleOf: "Fothad Canainne",
    d: "Der Rivale der Fianna raubt die Frau eines Getreuen und fällt; sein abgeschlagenes Haupt spricht das Totengedicht an die Geliebte über der eigenen Leiche.",
    chars: [["Fothad Canainne", "victim"], ["Fionn mac Cumhaill", "antagonist"]] },
  // Kings detail
  { k: "conaire_birds", n: "Nemglans Gebot", t: "prophecy", cy: "kings", src: "TBDD",
    d: "Auf dem Weg nach Tara jagt Conaire Vögel — sie werfen die Federkleider ab: sein Vatervolk. Nemglan schickt ihn nackt mit der Schleuder nach Tara, wo der Stier-Traum ihn zum König weist.",
    chars: [["Nemglan", "protagonist"], ["Conaire Mór", "protagonist"]],
    places: ["Temair"] },
  { k: "geasa_breaking", n: "Das Zerbrechen der Geasa", t: "prophecy", cy: "kings", src: "TBDD",
    d: "Eine Geis nach der anderen zerbricht auf dem letzten Weg: Er folgt drei roten Reitern, Plünderung in seiner Zeit, die Eine-Frau nach Sonnenuntergang — das Verhängnis schließt sich.",
    chars: [["Conaire Mór", "victim"]],
    places: ["Bruiden Dá Derga"] },
  { k: "ingcel_scouting", n: "Ingcéls Spähbericht", t: "meeting", cy: "kings", src: "TBDD", parent: "base_daderga",
    d: "Das eine Auge des Räubers mustert Da Dergas Halle: Held um Held beschreibt er, und Fer Rogain beweint jeden — dann stürmen dreimal die Scharen.",
    chars: [["Ingcél Cáech", "protagonist"], ["Fer Rogain", "other"], ["Conaire Mór", "mentioned"]],
    places: ["Bruiden Dá Derga"] },
  { k: "maccecht_water", n: "Mac Céchts Wasserlauf", t: "journey", cy: "kings", src: "TBDD", parent: "base_daderga",
    d: "Kein Wasser in ganz Irland — Flüsse und Seen verbergen sich vor Conaires Durst. Mac Cécht findet zuletzt den See Uarán Garad; er kehrt zurück, als dem König das Haupt genommen wird — und das Haupt dankt ihm trinkend mit einem Vers.",
    chars: [["Mac Cécht mac Snaide Teichid", "protagonist"], ["Conaire Mór", "victim"]],
    places: ["Bruiden Dá Derga"] },
  { k: "cobthach_murders", n: "Cobthachs Brudermord", t: "death", cy: "kings", src: "ORT", lifecycleOf: "Lóegaire Lorc",
    d: "Der neidkranke Cobthach stellt sich tot; als Lóegaire sich über die Bahre beugt, fährt das Messer. Dem Enkel Labraid zwingt er Herz von Vater und Großvater als Speise auf — der Knabe verstummt.",
    chars: [["Cobthach Cóel Breg", "antagonist"], ["Lóegaire Lorc", "victim"], ["Labraid Loingsech", "victim"]],
    places: ["Dinn Ríg"] },
  { k: "labraid_speech", n: "Labraid findet die Sprache", t: "transformation", cy: "kings", src: "ORT",
    d: "Ein Schlag beim Hurling — und der Stumme spricht. Im Exil bei Scoriath gewinnt er Moriath; Craiftines Schlafharfe deckt die Liebenden.",
    chars: [["Labraid Loingsech", "protagonist"], ["Moriath", "protagonist"], ["Craiftine", "ally"], ["Scoriath", "other"]] },
  { k: "dinnrig_burning", n: "Cobthach verbrennt in Dinn Ríg", t: "death", cy: "kings", src: "ORT", parent: "base_labraid_dinnrig", lifecycleOf: "Cobthach Cóel Breg",
    d: "Labraid lädt den Mörder in ein eisernes Haus — Monate heimlich gebaut. Türen verkeilt, Blasebälge angesetzt: Cobthach und siebenhundert brennen.",
    chars: [["Labraid Loingsech", "protagonist"], ["Cobthach Cóel Breg", "victim"]],
    places: ["Dinn Ríg"] },
  { k: "mag_lena", n: "Schlacht von Mag Léna", t: "battle", cy: "kings", src: "CMM",
    d: "Éogan Mór, der Irland mit Conn teilte, fordert auch die Schifffahrt der anderen Hälfte — bei Mag Léna fällt er im Morgengrauen gegen Conn.",
    chars: [["Conn Cétchathach", "protagonist"], ["Éogan Mór", "victim"]] },
  { k: "eogan_death", n: "Tod des Éogan Mór", t: "death", cy: "kings", src: "CMM", parent: "mag_lena", lifecycleOf: "Éogan Mór",
    chars: [["Éogan Mór", "victim"], ["Conn Cétchathach", "antagonist"]] },
  { k: "deisi_expulsion", n: "Cormacs Auge und die Vertreibung der Déisi", t: "battle", cy: "kings", src: "DSEN",
    d: "Óengus Gaíbúaibthech rächt den Frauenraub des Königssohns: Sein Speer tötet Cellach und blendet Cormac — ein makelbehafteter König muss Tara lassen; die Déisi ziehen nach Munster.",
    chars: [["Cellach mac Cormaic", "victim"], ["Cormac mac Airt", "victim"], ["Fithal", "mentioned"]],
    places: ["Temair"] },
  { k: "smithy_test", n: "Die Probe der brennenden Schmiede", t: "prophecy", cy: "kings", src: "NIA",
    d: "Der Schmied zündet die eigene Werkstatt: Brión rettet die Streitwagen, Fiachra den Bierbottich — Niall trägt Amboss und Werkzeug heraus: das Königszeichen.",
    chars: [["Niall Noígíallach", "protagonist"], ["Brión", "ally"], ["Fiachra mac Echach", "ally"], ["Mongfind", "antagonist"], ["Eochaid Mugmedón", "other"]] },
  { k: "mongfind_poison", n: "Das Fest der Mongfind", t: "death", cy: "kings", src: "NIA", lifecycleOf: "Mongfind",
    d: "Um ihrem Bruder die Krone zu mischen, reicht Mongfind den Gifttrank — Misstrauen zwingt sie zum ersten Schluck: Sie stirbt in der Samhain-Nacht, die ihren Namen trägt.",
    chars: [["Mongfind", "victim"]] },
  { k: "goose_egg", n: "Der Streit um das Gänseei", t: "meeting", cy: "kings", src: "FDG",
    d: "Beim Fest von Dún na nGéd erhält Congal statt des Gänseeis ein Hühnerei auf Silber — die Kränkung, aus der Mag Rath wächst.",
    chars: [["Congal Cláen", "victim"], ["Domnall mac Áedo", "antagonist"]] },
  { k: "mag_rath", n: "Schlacht von Mag Rath", t: "battle", cy: "kings", src: "CMR",
    d: "Eine Woche Schlacht bei Moira: Congal Cláen fällt gegen seinen Ziehvater Domnall — und über dem Getöse verliert Suibhne den Verstand.",
    chars: [["Domnall mac Áedo", "protagonist"], ["Congal Cláen", "victim"], ["Suibhne", "victim", "Hier bricht der Wahnsinn aus"]],
    places: ["Mag Rath"] },
  { k: "congal_death", n: "Tod des Congal Cláen", t: "death", cy: "kings", src: "CMR", parent: "mag_rath", lifecycleOf: "Congal Cláen",
    chars: [["Congal Cláen", "victim"], ["Domnall mac Áedo", "antagonist"]] },
  { k: "suibhne_eorann", n: "Suibhne und Eorann", t: "meeting", cy: "kings", src: "BS",
    d: "Der Vogelkönig besucht die verlassene Königin: »Schlank bist du geworden, Suibhne« — ihre Verse gehören zum Zartesten der Sage.",
    chars: [["Suibhne", "protagonist"], ["Eorann", "protagonist"]] },
  { k: "hag_leap", n: "Der Sprungwettstreit mit der Mühlenhexe", t: "journey", cy: "kings", src: "BS",
    d: "Die Hexe der Mühle jagt Suibhne im Sprungwettstreit durch ganz Irland — bis sie an Dún Sobairche zerschellt.",
    chars: [["Suibhne", "protagonist"], ["Die Mühlenhexe", "victim"]] },
  { k: "moling_verses", n: "Moling schreibt Suibhnes Verse", t: "meeting", cy: "kings", src: "BS",
    d: "Ein Jahr kommt der Wahnsinnige zur Vesper nach Tech Moling; der Heilige setzt ihm Milch und schreibt jede Strophe nieder — bis der Speer des Hirten ihn findet.",
    chars: [["Moling", "protagonist"], ["Suibhne", "protagonist"], ["Mongán der Hirte", "antagonist"]] },
  { k: "sin_revenge", n: "Sín und der dreifache Tod des Muirchertach", t: "death", cy: "kings", src: "AMME", lifecycleOf: "Muirchertach mac Ercae",
    d: "Die Zauberfrau, deren Sippe der König erschlug, macht Wein aus Wasser und Krieger aus Steinen. In der Samhain-Nacht von Cleitech trifft ihn alles zugleich: Schwertwunde, Feuer, Weinfass — ertrunken, verbrannt, erschlagen.",
    chars: [["Sín", "protagonist"], ["Muirchertach mac Ercae", "victim"]],
    places: ["Cleitech"] },
  { k: "mongan_birth", n: "Zeugung des Mongán", t: "birth", cy: "kings", src: "IMB", lifecycleOf: "Mongán mac Fiachnai",
    d: "Manannán rettet Fiachnas Schlacht in Alba — zum Preis einer Nacht in dessen Gestalt bei Caíntigern: Mongán, der Gestaltwandler, wird geboren und drei Nächte alt in die Anderswelt geholt.",
    chars: [["Manannán mac Lir", "protagonist"], ["Caíntigern", "protagonist"], ["Fiachna mac Báetáin", "other"], ["Mongán mac Fiachnai", "protagonist"]] },
  { k: "diarmait_death", n: "Der dreifache Tod des Diarmait mac Cerbaill", t: "death", cy: "kings", src: "AIDC", lifecycleOf: "Diarmait mac Cerbaill",
    d: "Bec mac Dé weissagt: erschlagen, verbrannt, ertrunken — in Banbans Halle trifft der Balken, brennt das Dach, ertrinkt der König im Bierbottich. Danach verwaist Tara für immer.",
    chars: [["Diarmait mac Cerbaill", "victim"], ["Bec mac Dé", "other", "Der ungeglaubte Seher"]] },
];

// ── Relations wiring the new events into the DAG ─────────────────────────
const RELS_EXT: EventRel[] = [
  // LGE detail
  ["base_inv_partholon", "before", "mag_itha", "certain", "Die erste Schlacht folgt der Landung"],
  ["mag_itha", "before", "first_adultery", "probable", "Die Sage stellt den Ehebruch in die Siedlungszeit"],
  ["first_adultery", "before", "base_partholon_plague", "certain", ""],
  ["base_partholon_plague", "causes", "tuan_lives", "certain", "Tuan bleibt allein zurück"],
  ["tuan_lives", "before", "base_inv_nemed", "certain", "Tuan bezeugt die folgenden Landnahmen"],
  ["base_cmt2", "before", "ith_death", "speculative", "Íth kommt lange nach den Götterschlachten nach Irland"],
  ["ith_death", "causes", "base_inv_milesians", "certain", "Der Mord ist der Kriegsgrund"],
  ["base_eber_eremon", "before", "crom_worship", "speculative", "Tigernmas folgt Éremón in der Königsliste"],
  // Aislinge
  ["base_aengus_brug", "before", "aengus_dream", "certain", "Aengus ist Herr des Brú"],
  ["aengus_dream", "causes", "aengus_swans", "certain", "Die Suche endet am Schwanensee"],
  ["aengus_swans", "before", "base_tdd_underground", "speculative", "Die Sage gehört ins Götterzeitalter"],
  // CMT
  ["base_bres_reign", "before", "cairbre_satire", "certain", "Der Dichter kommt an Bres' Hof"],
  ["cairbre_satire", "meets", "base_first_satire", "certain", "Der Besuch endet mit der Satire"],
  // Ulster
  ["ness_trick", "meets", "base_conchobar_king", "certain", "Das Leihjahr wird nie zurückgegeben"],
  ["base_conchobar_king", "before", "macha_race", "probable", "Der Fluch fällt in Conchobars Zeit"],
  ["base_scathach_training", "contains", "uathach_glen", "certain", "Der Zugang zur Lehrmeisterin"],
  ["frach_wooing", "causes", "frach_monster", "certain", "Der Brautpreis ist die Ungeheuerprobe"],
  ["frach_monster", "before", "base_tain_muster", "probable", "Fráech zieht später mit Medbs Heer"],
  ["nad_crantail_duel", "before", "loch_duel", "probable", "Reihenfolge der Furtkämpfe"],
  ["loch_duel", "before", "base_ferdiad_duel", "certain", "Ferdiad ist der letzte Furtkampf"],
  ["etarcomol_duel", "before", "nad_crantail_duel", "probable", ""],
  ["calatin_fight", "before", "base_ferdiad_duel", "certain", "Vor dem Waffenbruder kommt der Zauberer"],
  ["cethern_wounds", "before", "base_gairech", "certain", "Die Wundenschau vor der Endschlacht"],
  ["base_cu_emer_marriage", "before", "serglige", "certain", "Emer ist längst seine Frau"],
  ["serglige", "causes", "fand_love", "certain", "Die Botschaft Fands beendet die Krankheit"],
  ["fand_love", "causes", "manannan_cloak", "certain", "Manannán holt Fand heim"],
  ["base_cu_emer_marriage", "before", "derbforgaill_death", "probable", "Derbforgaill folgt dem verheirateten Helden"],
  ["derbforgaill_death", "before", "base_cu_death", "certain", ""],
  ["manannan_cloak", "before", "base_cu_death", "certain", ""],
  ["athirne_siege", "before", "base_naoise_death", "speculative", "Athirnes Zeit liegt in Conchobars Blüte"],
  ["fergus_leti_geis", "causes", "fergus_muirdris", "certain", "Die gebrochene Geis ruft das Ungeheuer"],
  ["fergus_muirdris", "before", "ness_trick", "speculative", "Fergus mac Léti gehört einer älteren Königsschicht an"],
  // Fenian
  ["tuiren_hounds", "before", "base_fionn_leader", "probable", "Die Hunde begleiten Fionn von Beginn an"],
  ["base_fionn_leader", "before", "rowan_hostel", "probable", ""],
  ["base_fionn_leader", "before", "ventry_battle", "probable", ""],
  ["ventry_battle", "contains", "crede_grief", "certain", "Cael fällt in der Strandschlacht"],
  ["base_fionn_leader", "before", "gilla_decair", "probable", ""],
  ["gilla_decair", "before", "base_gabhra", "probable", ""],
  ["rowan_hostel", "before", "base_pursuit", "probable", "Diarmuids Ruhm wächst vor der Flucht"],
  ["searbhan_berries", "before", "base_diarmuid_death", "certain", ""],
  ["ventry_battle", "before", "base_gabhra", "probable", ""],
  ["bebinn_death", "before", "base_gabhra", "probable", ""],
  ["fothad_head", "before", "base_gabhra", "probable", ""],
  // Kings
  ["conaire_birds", "meets", "base_conaire_reign", "certain", "Das Vogelgebot führt zum Thron"],
  ["base_conaire_reign", "before", "geasa_breaking", "certain", ""],
  ["geasa_breaking", "causes", "base_daderga", "certain", "Die zerbrochenen Geasa führen zur Halle"],
  ["cobthach_murders", "before", "labraid_speech", "certain", "Der Mord verstummt den Knaben"],
  ["labraid_speech", "before", "base_labraid_dinnrig", "certain", "Aus dem Exil zur Eroberung"],
  ["base_conn_reign", "contains", "mag_lena", "certain", "Conns Sieg über Mug Nuadat"],
  ["mag_lena", "before", "base_mucrama", "certain", ""],
  ["base_cormac_reign", "before", "deisi_expulsion", "certain", "Das Auge beendet Cormacs Herrschaft"],
  ["deisi_expulsion", "before", "base_gabhra", "probable", "Cairbre folgt dem geblendeten Vater"],
  ["smithy_test", "before", "base_niall_sovereignty", "certain", "Erst die Probe, dann der Brunnen"],
  ["smithy_test", "before", "mongfind_poison", "certain", ""],
  ["mongfind_poison", "before", "base_niall_reign", "certain", ""],
  ["base_niall_reign", "before", "sin_revenge", "probable", "Muirchertach ist Nialls Urenkel"],
  ["sin_revenge", "before", "diarmait_death", "probable", "Diarmait folgt Muirchertach in Tara"],
  ["diarmait_death", "before", "mongan_birth", "probable", "Mongán gehört der nächsten Generation an"],
  ["mongan_birth", "before", "goose_egg", "probable", "Fiachnas Zeit liegt vor Domnalls Fest"],
  ["goose_egg", "causes", "mag_rath", "certain", "Die Kränkung wird zum Krieg"],
  ["mag_rath", "contains", "congal_death", "certain", ""],
  ["base_ronan_curse", "before", "mag_rath", "certain", "Der Fluch fällt auf dem Weg zur Schlacht"],
  ["mag_rath", "meets", "base_suibhne_madness", "certain", "Im Schlachtenlärm bricht der Wahnsinn aus"],
  ["base_suibhne_madness", "before", "suibhne_eorann", "certain", ""],
  ["base_suibhne_madness", "before", "hag_leap", "certain", ""],
  ["suibhne_eorann", "before", "moling_verses", "probable", ""],
  ["hag_leap", "before", "moling_verses", "probable", ""],
  ["moling_verses", "meets", "base_suibhne_death", "certain", "Der Speer findet ihn an Molings Tür"],
];
