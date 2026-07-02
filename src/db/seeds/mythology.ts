/**
 * Complete Irish-Celtic mythology seed.
 *
 * Covers all four cycles in one coherent, cross-linked dataset:
 *   - Mythological Cycle (Lebor Gabála Érenn, Cath Maige Tuired,
 *     Tochmarc Étaíne, Children of Lir, Sons of Tuireann)
 *   - Ulster Cycle (Táin Bó Cúailnge, Deirdre, Cú Chulainn saga)
 *   - Fenian Cycle (Fionn mac Cumhaill, Diarmuid & Gráinne, Oisín)
 *   - Cycle of the Kings (Conn, Cormac, Conaire Mór, Niall, Suibhne)
 *
 * Includes characters, family relations (complete family trees),
 * places, groups, artifacts with owners, narrative events with
 * participants, and the event-relation DAG that drives the timeline.
 *
 * Idempotent-ish: characters/places/groups/sources are looked up by
 * name/title first, so running it alongside `core` will not duplicate.
 */
import type { Seed } from "./types";

export const name = "Complete Irish-Celtic Mythology";
export const description =
  "All four cycles: ~95 characters, ~120 events, family trees, places, artifacts and the full timeline DAG.";

// ── Declarative data types ───────────────────────────────────────────────

type Gender = "male" | "female" | "other" | "unknown";

interface CharDef {
  n: string;              // canonical name
  alt?: string[];         // alternative names
  g?: Gender;
  e?: string;             // epithet
  d?: string;             // description
  deity?: boolean;
  dead?: boolean;
  grp?: string[];         // group names
  props?: [string, string, string?][]; // [type, value, notes]
  src?: string;           // source key
  quote?: string;         // source quote
}

interface PlaceDef {
  n: string;
  alt?: string[];
  t: string;              // place type
  mod?: string;           // modern equivalent
  d?: string;
  src?: string;
}

interface ArtifactDef {
  n: string;
  alt?: string[];
  t: string;              // artifact type
  d?: string;
  powers?: string;
  src?: string;
  owners?: [string, string, string?][]; // [characterName, relationship, notes]
}

interface EventDef {
  k: string;              // key for relations
  n: string;              // name
  t: string;              // event type
  cy: string;             // cycle
  d?: string;             // description
  era?: string;
  parent?: string;        // parent event key
  lifecycleOf?: string;   // character name for birth/death events
  chars?: [string, string, string?][]; // [characterName, role, notes]
  places?: string[];
  artifacts?: string[];
  src?: string;
}

// [fromKey, relationType, toKey, confidence, reason]
type EventRel = [string, string, string, string, string];

// [fromChar, relationType, toChar, notes?]  — from IS relationType OF to
type FamRel = [string, string, string, string?];

export const seed: Seed["seed"] = (db) => {
  // ── Prepared statements ────────────────────────────────────────────────
  const insSource = db.prepare(
    `INSERT INTO sources (title, type, author, year, url, notes) VALUES (?,?,?,?,?,?)`
  );
  const selSource = db.prepare(`SELECT id FROM sources WHERE title = ?`);
  const insGroup = db.prepare(
    `INSERT OR IGNORE INTO groups (name, alt_names, description, source_id) VALUES (?,?,?,?)`
  );
  const selGroup = db.prepare(`SELECT id FROM groups WHERE name = ?`);
  const insChar = db.prepare(
    `INSERT INTO characters (name, alt_names, gender, description, epithet, is_deity, is_dead, source_id, source_quote)
     VALUES (?,?,?,?,?,?,?,?,?)`
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
  const insArtifact = db.prepare(
    `INSERT INTO artifacts (name, alt_names, type, description, powers, source_id) VALUES (?,?,?,?,?,?)`
  );
  const selArtifact = db.prepare(`SELECT id FROM artifacts WHERE name = ?`);
  const insAC = db.prepare(
    `INSERT INTO artifact_characters (artifact_id, character_id, relationship, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insEvent = db.prepare(
    `INSERT INTO events (name, description, event_type, parent_event_id, character_id, cycle, approximate_era, source_id)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  const insEC = db.prepare(
    `INSERT INTO event_characters (event_id, character_id, role, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insEP = db.prepare(
    `INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`
  );
  const insEA = db.prepare(
    `INSERT INTO event_artifacts (event_id, artifact_id, notes, source_id) VALUES (?,?,?,?)`
  );
  const insERel = db.prepare(
    `INSERT INTO event_relations (from_event_id, to_event_id, relation_type, confidence, reason, source_id)
     VALUES (?,?,?,?,?,?)`
  );

  // ── SOURCES ────────────────────────────────────────────────────────────
  const sourceDefs: Record<string, [string, string, string | null, number | null, string | null, string | null]> = {
    LGE:  ["Lebor Gabála Érenn (Book of Invasions)", "manuscript", null, 1150, "https://celt.ucc.ie/published/T100055/", "Pseudohistorische Kompilation der Invasionen Irlands, Book of Leinster"],
    CMT:  ["Cath Maige Tuired (The Second Battle of Mag Tuired)", "manuscript", null, 900, "https://celt.ucc.ie/published/T300010/", "9. Jh., erhalten in Harley MS 5280"],
    CMT1: ["Cath Maige Tuired Cunga (The First Battle of Mag Tuired)", "manuscript", null, 1100, null, "Bericht über die Schlacht der Tuatha Dé Danann gegen die Fir Bolg"],
    TAIN: ["Táin Bó Cúailnge (The Cattle Raid of Cooley)", "manuscript", null, 800, "https://celt.ucc.ie/published/T301035/", "Zentralepos des Ulster-Zyklus, Lebor na hUidre"],
    TE:   ["Tochmarc Étaíne (The Wooing of Étaín)", "manuscript", null, 900, "https://celt.ucc.ie/published/T300012/", "Drei verbundene Erzählungen um Midir und Étaín"],
    ACL:  ["Oidheadh Chlainne Lir (The Fate of the Children of Lir)", "manuscript", null, 1200, "https://celt.ucc.ie/published/T301041/", "Eine der Drei Sorgen des Erzählens"],
    ACT:  ["Oidheadh Chlainne Tuireann (The Fate of the Children of Tuireann)", "manuscript", null, 1500, null, "Eine der Drei Sorgen des Erzählens"],
    LMU:  ["Longes mac n-Uislenn (The Exile of the Sons of Uisliu)", "manuscript", null, 900, "https://celt.ucc.ie/published/T301020/", "Deirdre-Sage, Vorgeschichte der Táin"],
    TEM:  ["Tochmarc Emire (The Wooing of Emer)", "manuscript", null, 1000, null, "Cú Chulainns Werbung und Ausbildung bei Scáthach"],
    AOA:  ["Aided Óenfhir Aífe (The Death of Aífe's Only Son)", "manuscript", null, 900, null, "Cú Chulainn tötet seinen Sohn Connla"],
    FB:   ["Fled Bricrenn (Bricriu's Feast)", "manuscript", null, 1100, "https://celt.ucc.ie/published/T301040/", "Streit um den Heldenbissen, Enthauptungsspiel"],
    ACS:  ["Acallam na Senórach (Tales of the Elders of Ireland)", "manuscript", null, 1200, null, "Rahmenerzählung des Fenian-Zyklus: Caílte und Oisín erzählen Patrick"],
    MF:   ["Macgnímartha Finn (The Boyhood Deeds of Fionn)", "manuscript", null, 1200, null, "Jugendtaten Fionn mac Cumhaills"],
    TDG:  ["Tóraigheacht Dhiarmada agus Ghráinne (The Pursuit of Diarmuid and Gráinne)", "manuscript", null, 1600, null, "Fenian-Liebes- und Verfolgungsgeschichte"],
    TBDD: ["Togail Bruidne Dá Derga (The Destruction of Da Derga's Hostel)", "manuscript", null, 1100, "https://celt.ucc.ie/published/T301017/", "Untergang König Conaire Mórs"],
    BS:   ["Buile Shuibhne (The Frenzy of Suibhne)", "manuscript", null, 1200, "https://celt.ucc.ie/published/T302018/", "Der wahnsinnige Vogelkönig Suibhne"],
    CMM:  ["Cath Maige Mucrama (The Battle of Mag Mucrama)", "manuscript", null, 1000, null, "Lugaid Mac Con gegen Ailill Aulom und Art mac Cuinn"],
    DIND: ["Metrical Dindshenchas", "manuscript", null, 1100, "https://celt.ucc.ie/published/T106500A/", "Ortsnamen-Überlieferung Irlands"],
    ORT:  ["Orgain Denna Ríg (The Destruction of Dind Ríg)", "manuscript", null, 900, null, "Labraid Loingsech erobert das Königtum von Leinster"],
    ECH:  ["Echtra Cormaic (Cormac's Adventure in the Land of Promise)", "manuscript", null, 1200, null, "Cormac mac Airt, Manannán und der Becher der Wahrheit"],
    NIA:  ["Echtra mac nEchach Muigmedóin", "manuscript", null, 1100, null, "Niall und die Herrin der Herrschaft (Sovereignty)"],
    SCHOL:["Gods and Fighting Men", "scholarly", "Lady Augusta Gregory", 1904, "https://www.gutenberg.org/ebooks/14465", "Klassische Nacherzählung der mythologischen und Fenian-Stoffe"],
  };

  const S: Record<string, number> = {};
  for (const [key, def] of Object.entries(sourceDefs)) {
    const existing = selSource.get(def[0]) as { id: number } | undefined;
    S[key] = existing
      ? existing.id
      : (insSource.run(...def).lastInsertRowid as number);
  }

  // ── GROUPS ─────────────────────────────────────────────────────────────
  const groupDefs: [string, string[], string, string][] = [
    ["Tuatha Dé Danann", ["People of the Goddess Danu", "Tribe of the Gods"], "Das göttliche Volk, das Irland vor den Gaelen beherrschte. Meister der Magie und Handwerkskunst, kamen aus den vier Städten des Nordens.", "LGE"],
    ["Fomorians", ["Fomoire", "Fomori"], "Uralte chaotische Wesen der See und der Dunkelheit, Gegenspieler jeder Siedlerwelle Irlands.", "LGE"],
    ["Fir Bolg", ["Men of Bags"], "Nachfahren der Nemedier, die aus Griechenland zurückkehrten und Irland vor den Tuatha Dé Danann beherrschten.", "LGE"],
    ["Milesians", ["Sons of Míl", "Gaelen"], "Die letzten Eroberer Irlands, mythische Vorfahren der Iren, aus Iberien kommend.", "LGE"],
    ["Nemedians", ["Muintir Nemid"], "Das Volk Nemeds, dritte Siedlerwelle, von den Fomorern unterworfen und zerstreut.", "LGE"],
    ["Partholonians", ["Muintir Partholóin"], "Zweite Siedlerwelle nach der Flut, durch eine Seuche vollständig ausgelöscht.", "LGE"],
    ["Cessair's People", ["Muintir Cessrach"], "Die erste Siedlergruppe Irlands vor der Flut, angeführt von Cessair.", "LGE"],
    ["Ulaid", ["Ulster men", "Men of Ulster", "Red Branch"], "Die Krieger Ulsters um König Conchobar mac Nessa, Helden des Ulster-Zyklus.", "TAIN"],
    ["Connachta", ["Men of Connacht"], "Das Heer Connachts unter Königin Medb und König Ailill.", "TAIN"],
    ["Fianna", ["Fénnidi"], "Umherziehende Kriegerbünde unter Fionn mac Cumhaill, Beschützer Irlands unter den Hochkönigen.", "ACS"],
    ["Clann Baíscne", [], "Fionns Sippe innerhalb der Fianna.", "ACS"],
    ["Clann Morna", [], "Rivalisierende Sippe der Fianna unter Goll mac Morna.", "ACS"],
  ];

  const G: Record<string, number> = {};
  for (const [gname, alt, desc, src] of groupDefs) {
    insGroup.run(gname, JSON.stringify(alt), desc, S[src]);
    G[gname] = (selGroup.get(gname) as { id: number }).id;
  }

  // ── PLACES ─────────────────────────────────────────────────────────────
  const placeDefs: PlaceDef[] = [
    { n: "Temair", alt: ["Tara", "Hill of Tara"], t: "hill", mod: "Hill of Tara, Co. Meath", d: "Sitz der Hochkönige Irlands; hier steht der Lia Fáil.", src: "LGE" },
    { n: "Emain Macha", alt: ["Navan Fort"], t: "fortress", mod: "Navan Fort, Co. Armagh", d: "Königssitz Ulsters unter Conchobar mac Nessa, benannt nach Macha.", src: "TAIN" },
    { n: "Cruachan", alt: ["Rathcroghan", "Ráth Cruachan"], t: "fortress", mod: "Rathcroghan, Co. Roscommon", d: "Königssitz Connachts, Hof von Medb und Ailill.", src: "TAIN" },
    { n: "Brú na Bóinne", alt: ["Newgrange", "Síd in Broga"], t: "otherworld", mod: "Newgrange, Co. Meath", d: "Großes Ganggrab am Boyne, Síd des Dagda und später des Aengus.", src: "TE" },
    { n: "Mag Tuired", alt: ["Moytura", "Moytirra"], t: "plain", mod: "Cong / Lough Arrow, Co. Sligo & Mayo", d: "Ebene der beiden großen Schlachten der Tuatha Dé Danann.", src: "CMT" },
    { n: "Tír na nÓg", alt: ["Land of Youth", "Tír na hÓige"], t: "otherworld", d: "Das Land der ewigen Jugend jenseits der westlichen See.", src: "ACS" },
    { n: "Mag Mell", alt: ["Plain of Delight"], t: "otherworld", d: "Anderswelt-Ebene der Freude, Reich Manannáns.", src: "TE" },
    { n: "Cúailnge", alt: ["Cooley"], t: "plain", mod: "Cooley Peninsula, Co. Louth", d: "Heimat des braunen Stiers Donn Cúailnge, Ziel des großen Rinderraubs.", src: "TAIN" },
    { n: "Mag Muirthemne", alt: ["Plain of Muirthemne"], t: "plain", mod: "Co. Louth", d: "Cú Chulainns Heimatebene und Ort seines Todes.", src: "TAIN" },
    { n: "Almu", alt: ["Hill of Allen", "Cnoc Almaine"], t: "hill", mod: "Hill of Allen, Co. Kildare", d: "Sitz Fionn mac Cumhaills und der Fianna.", src: "MF" },
    { n: "Dún Scáith", alt: ["Dun Scaith", "Fortress of Shadows"], t: "fortress", mod: "Isle of Skye, Schottland", d: "Festung der Kriegerin Scáthach, Ausbildungsstätte Cú Chulainns.", src: "TEM" },
    { n: "Loch Dairbhreach", alt: ["Lake Derravaragh"], t: "river", mod: "Lough Derravaragh, Co. Westmeath", d: "Erster Verbannungsort der Kinder Lirs — 300 Jahre.", src: "ACL" },
    { n: "Sruth na Maoile", alt: ["Sea of Moyle"], t: "sea", mod: "Nordkanal zwischen Irland und Schottland", d: "Zweiter Verbannungsort der Kinder Lirs — 300 stürmische Jahre.", src: "ACL" },
    { n: "Irrus Domnann", alt: ["Erris"], t: "sea", mod: "Erris, Co. Mayo", d: "Dritter Verbannungsort der Kinder Lirs an der Westsee.", src: "ACL" },
    { n: "Binn Ghulbain", alt: ["Benbulbin", "Ben Bulben"], t: "hill", mod: "Benbulbin, Co. Sligo", d: "Berg des verzauberten Ebers, Todesort Diarmuids.", src: "TDG" },
    { n: "Uisneach", alt: ["Hill of Uisneach"], t: "hill", mod: "Hill of Uisneach, Co. Westmeath", d: "Mythischer Mittelpunkt Irlands, Ort des ersten Feuers.", src: "DIND" },
    { n: "Bóinn", alt: ["River Boyne", "Boand's River"], t: "river", mod: "River Boyne", d: "Heiliger Fluss, entstanden aus dem Brunnen der Weisheit durch Boann.", src: "DIND" },
    { n: "Tech Duinn", alt: ["House of Donn", "Bull Rock"], t: "otherworld", mod: "Bull Rock, Co. Cork", d: "Haus des Totengottes Donn, Sammelort der Seelen.", src: "LGE" },
    { n: "Tailtiu", alt: ["Teltown"], t: "plain", mod: "Teltown, Co. Meath", d: "Ort der Tailteann-Spiele, benannt nach Lughs Ziehmutter.", src: "LGE" },
    { n: "Falias", t: "otherworld", d: "Eine der vier Städte des Nordens — Herkunft des Lia Fáil.", src: "LGE" },
    { n: "Gorias", t: "otherworld", d: "Eine der vier Städte des Nordens — Herkunft von Lughs Speer.", src: "LGE" },
    { n: "Findias", t: "otherworld", d: "Eine der vier Städte des Nordens — Herkunft des Schwerts von Nuada.", src: "LGE" },
    { n: "Murias", t: "otherworld", d: "Eine der vier Städte des Nordens — Herkunft des Kessels des Dagda.", src: "LGE" },
    { n: "Glen Etive", alt: ["Gleann Éite"], t: "forest", mod: "Glen Etive, Schottland", d: "Exil von Deirdre und Naoise in Alba.", src: "LMU" },
    { n: "Bruiden Dá Derga", alt: ["Da Derga's Hostel"], t: "fortress", mod: "Bohernabreena, Co. Dublin", d: "Gasthaus am Fluss Dodder, Untergangsort Conaire Mórs.", src: "TBDD" },
    { n: "Dinn Ríg", alt: ["Dind Ríg"], t: "fortress", mod: "Leighlinbridge, Co. Carlow", d: "Alte Königsburg von Leinster, von Labraid Loingsech erobert.", src: "ORT" },
    { n: "Mag Mucrama", t: "plain", mod: "bei Athenry, Co. Galway", d: "Schlachtfeld, auf dem Art mac Cuinn fiel.", src: "CMM" },
    { n: "Gabhair", alt: ["Gabhra", "Gowra"], t: "plain", mod: "Garristown, Co. Dublin", d: "Schlachtfeld des Untergangs der Fianna.", src: "ACS" },
    { n: "Cnucha", alt: ["Castleknock"], t: "hill", mod: "Castleknock, Co. Dublin", d: "Schlachtfeld, auf dem Cumhall fiel.", src: "MF" },
    { n: "Áth Fhirdiad", alt: ["Ardee", "Ferdiad's Ford"], t: "river", mod: "Ardee, Co. Louth", d: "Die Furt, an der Cú Chulainn Ferdiad erschlug.", src: "TAIN" },
  ];

  const P: Record<string, number> = {};
  for (const p of placeDefs) {
    const existing = selPlace.get(p.n) as { id: number } | undefined;
    P[p.n] = existing
      ? existing.id
      : (insPlace.run(
          p.n,
          p.alt ? JSON.stringify(p.alt) : null,
          p.t,
          p.mod ?? null,
          p.d ?? null,
          p.src ? S[p.src] : null
        ).lastInsertRowid as number);
  }


  // ── Section implementations ────────────────────────────────────────────

  function upsertChar(c: CharDef): number {
    const existing = selChar.get(c.n) as { id: number } | undefined;
    let id: number;
    if (existing) {
      id = existing.id;
    } else {
      id = insChar.run(
        c.n,
        c.alt ? JSON.stringify(c.alt) : null,
        c.g ?? "unknown",
        c.d ?? null,
        c.e ?? null,
        c.deity ? 1 : 0,
        c.dead ? 1 : 0,
        c.src ? S[c.src] : null,
        c.quote ?? null
      ).lastInsertRowid as number;
    }
    for (const g of c.grp ?? []) {
      if (!selCG.get(id, G[g])) insCG.run(id, G[g], c.src ? S[c.src] : null);
    }
    for (const [type, value, notes] of c.props ?? []) {
      if (!selProp.get(id, type, value)) {
        insProp.run(id, type, value, notes ?? null, c.src ? S[c.src] : null);
      }
    }
    return id;
  }

  const C: Record<string, number> = {};

  function defineChars(defs: CharDef[]) {
    for (const c of defs) C[c.n] = upsertChar(c);
  }

  function famRel(rels: FamRel[], srcKey: string) {
    for (const [from, type, to, notes] of rels) {
      if (C[from] === undefined || C[to] === undefined) {
        throw new Error(`famRel: unknown character ${from} or ${to}`);
      }
      if (!selFam.get(C[from], C[to], type)) {
        insFam.run(C[from], C[to], type, notes ?? null, S[srcKey]);
      }
    }
  }

  const A: Record<string, number> = {};

  function defineArtifacts(defs: ArtifactDef[]) {
    for (const a of defs) {
      const existing = selArtifact.get(a.n) as { id: number } | undefined;
      const id = existing
        ? existing.id
        : (insArtifact.run(
            a.n,
            a.alt ? JSON.stringify(a.alt) : null,
            a.t,
            a.d ?? null,
            a.powers ?? null,
            a.src ? S[a.src] : null
          ).lastInsertRowid as number);
      A[a.n] = id;
      if (!existing) {
        for (const [charName, relationship, notes] of a.owners ?? []) {
          if (C[charName] === undefined) throw new Error(`artifact owner unknown: ${charName}`);
          insAC.run(id, C[charName], relationship, notes ?? null, a.src ? S[a.src] : null);
        }
      }
    }
  }

  const E: Record<string, number> = {};

  function defineEvents(defs: EventDef[]) {
    for (const ev of defs) {
      const parentId = ev.parent ? E[ev.parent] : null;
      if (ev.parent && !parentId) throw new Error(`event parent unknown: ${ev.parent}`);
      const lifecycleCharId = ev.lifecycleOf ? C[ev.lifecycleOf] : null;
      const id = insEvent.run(
        ev.n,
        ev.d ?? null,
        ev.t,
        parentId,
        lifecycleCharId ?? null,
        ev.cy,
        ev.era ?? null,
        ev.src ? S[ev.src] : null
      ).lastInsertRowid as number;
      E[ev.k] = id;
      for (const [charName, role, notes] of ev.chars ?? []) {
        if (C[charName] === undefined) throw new Error(`event char unknown: ${charName} (${ev.k})`);
        insEC.run(id, C[charName], role, notes ?? null, ev.src ? S[ev.src] : null);
      }
      for (const placeName of ev.places ?? []) {
        if (P[placeName] === undefined) throw new Error(`event place unknown: ${placeName} (${ev.k})`);
        insEP.run(id, P[placeName], ev.src ? S[ev.src] : null);
      }
      for (const artName of ev.artifacts ?? []) {
        if (A[artName] === undefined) throw new Error(`event artifact unknown: ${artName} (${ev.k})`);
        insEA.run(id, A[artName], null, ev.src ? S[ev.src] : null);
      }
    }
  }

  function eventRels(rels: EventRel[], srcKey: string) {
    for (const [from, type, to, confidence, reason] of rels) {
      if (E[from] === undefined || E[to] === undefined) {
        throw new Error(`eventRel: unknown event ${from} or ${to}`);
      }
      insERel.run(E[from], E[to], type, confidence, reason, S[srcKey]);
    }
  }

  // The actual data lives in the functions below.

  function seedCharacters() {
    defineChars(CHARACTERS_MYTHOLOGICAL);
    defineChars(CHARACTERS_ULSTER);
    defineChars(CHARACTERS_FENIAN);
    defineChars(CHARACTERS_KINGS);
  }

  function seedFamily() {
    famRel(FAMILY_MYTHOLOGICAL, "LGE");
    famRel(FAMILY_ULSTER, "TAIN");
    famRel(FAMILY_FENIAN, "ACS");
    famRel(FAMILY_KINGS, "CMM");
  }

  function seedArtifacts() {
    defineArtifacts(ARTIFACTS);
  }

  function seedEvents() {
    defineEvents(EVENTS_MYTHOLOGICAL);
    defineEvents(EVENTS_ULSTER);
    defineEvents(EVENTS_FENIAN);
    defineEvents(EVENTS_KINGS);
    eventRels(RELS_MYTHOLOGICAL, "LGE");
    eventRels(RELS_ULSTER, "TAIN");
    eventRels(RELS_FENIAN, "ACS");
    eventRels(RELS_KINGS, "CMM");
    eventRels(RELS_CROSS_CYCLE, "SCHOL");
  }

  // Run everything (after all const bindings above are initialised)
  seedCharacters();
  seedFamily();
  seedArtifacts();
  seedEvents();
};

// ═══════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════

// ── Characters: Mythological Cycle ───────────────────────────────────────
const CHARACTERS_MYTHOLOGICAL: CharDef[] = [
  { n: "Danu", alt: ["Anu", "Dana"], g: "female", deity: true, e: "Mutter der Götter", grp: ["Tuatha Dé Danann"], src: "LGE",
    d: "Urmutter der Tuatha Dé Danann, Göttin des Landes und der Fruchtbarkeit. Sie erscheint kaum handelnd, gibt dem Göttervolk aber seinen Namen." },
  { n: "Dagda", alt: ["The Dagda", "Eochaid Ollathair", "Ruad Rofhessa"], g: "male", deity: true, e: "Der gute Gott", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Vatergestalt und König der Tuatha Dé Danann. Herr über Leben und Tod, Fruchtbarkeit und Verträge. Besitzt den unerschöpflichen Kessel, die Keule und die Harfe Uaithne.",
    props: [["attribute", "Stärke", "Übermenschliche Kraft"], ["skill", "Magie", "Druidenwissen und Jahreszeitenmagie"], ["place", "Brú na Bóinne", "Sein Síd am Boyne"]] },
  { n: "Lugh", alt: ["Lugh Lámhfhada", "Lug", "Samildánach"], g: "male", deity: true, e: "Der Langarmige, Meister aller Künste", grp: ["Tuatha Dé Danann"], src: "CMT",
    quote: "„Frage nicht weiter: Ich bin der Meister aller Künste zugleich.“",
    d: "Gott des Lichts und aller Fertigkeiten. Sohn Cians und der Fomorin Ethniu, Enkel Balors, den er in der zweiten Schlacht von Mag Tuired erschlägt. Göttlicher Vater Cú Chulainns.",
    props: [["skill", "Samildánach", "Meister aller Künste zugleich"], ["weapon", "Speer von Gorias", "Einer der vier Schätze"], ["animal", "Rabe", "Raben künden ihm Kunde"], ["color", "Gold", "Lichtgestalt"]] },
  { n: "Nuada", alt: ["Nuada Airgetlám", "Nuadu"], g: "male", deity: true, e: "Silberhand", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Erster König der Tuatha Dé Danann in Irland. Verliert in der ersten Schlacht von Mag Tuired den Arm und damit das Königtum, bis Dian Cécht und Miach ihn heilen. Fällt gegen Balor.",
    props: [["attribute", "Silberarm", "Prothese von Dian Cécht"], ["weapon", "Schwert von Findias", "Einer der vier Schätze"]] },
  { n: "Balor", alt: ["Balor of the Evil Eye", "Balor Birugderc"], g: "male", deity: true, e: "Balor vom bösen Auge", grp: ["Fomorians"], src: "CMT",
    quote: "„Sein Auge öffnete sich nur auf dem Schlachtfeld — vier Männer hoben das Lid mit einem geglätteten Haken.“",
    d: "Kriegsführer der Fomorer. Sein Blick tötet ganze Heere. Eine Prophezeiung sagt, sein Enkel werde ihn töten — Lugh erfüllt sie mit dem Schleuderstein.",
    props: [["attribute", "Böses Auge", "Vernichtender Blick"], ["place", "Tory Island", "Seine Inselfestung"]] },
  { n: "Bres", alt: ["Eochaid Bres", "Bres mac Elathan"], g: "male", deity: true, e: "Der Schöne", grp: ["Tuatha Dé Danann", "Fomorians"], src: "CMT",
    d: "Sohn des Fomorers Elatha und der Ériu. Als Nuada verstümmelt ist, wird er König — doch seine Geizherrschaft bringt die erste Satire Irlands und den Krieg.",
    props: [["attribute", "Schönheit", "Sein Beiname"], ["attribute", "Geiz", "»Die Messer der Gäste blieben ungefettet«"]] },
  { n: "Ériu", alt: ["Éire"], g: "female", deity: true, e: "Namensgeberin Irlands", grp: ["Tuatha Dé Danann"], src: "LGE",
    d: "Göttin des Landes, Mutter des Bres. Mit ihren Schwestern Banba und Fódla empfängt sie die Milesier — Amergin verspricht, die Insel nach ihr zu benennen." },
  { n: "Banba", g: "female", deity: true, grp: ["Tuatha Dé Danann"], src: "LGE",
    d: "Landesgöttin Irlands, Schwester von Ériu und Fódla." },
  { n: "Fódla", g: "female", deity: true, grp: ["Tuatha Dé Danann"], src: "LGE",
    d: "Landesgöttin Irlands, Schwester von Ériu und Banba." },
  { n: "Brigid", alt: ["Brígh", "Brigit"], g: "female", deity: true, e: "Die Erhabene", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Tochter des Dagda, Göttin der Dichtkunst, Schmiedekunst und Heilung. Frau des Bres, Mutter Ruadáns — ihre Totenklage um ihn gilt als das erste Keening Irlands.",
    props: [["skill", "Dichtkunst", ""], ["skill", "Schmiedekunst", ""], ["skill", "Heilkunst", ""], ["animal", "Eber Torc Triath", "König der Eber"]] },
  { n: "Ogma", alt: ["Oghma", "Ogma Grianainech"], g: "male", deity: true, e: "Sonnengesicht", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Champion der Tuatha Dé Danann und Gott der Beredsamkeit. Erfinder der Ogham-Schrift. Erbeutet in der zweiten Schlacht das Schwert des Fomorenkönigs Tethra.",
    props: [["skill", "Ogham", "Erfinder der Schrift"], ["attribute", "Beredsamkeit", ""]] },
  { n: "Dian Cécht", g: "male", deity: true, e: "Gott der Heilkunst", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Arzt der Götter. Schmiedet Nuada den Silberarm, tötet aber aus Neid seinen Sohn Miach, der den Arm aus Fleisch heilte. Am Heilbrunnen Sláine erweckt er Gefallene.",
    props: [["skill", "Heilkunst", "Brunnen Sláine"], ["attribute", "Neid", "Erschlägt den eigenen Sohn"]] },
  { n: "Miach", g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "CMT", dead: true,
    d: "Sohn Dian Céchts, größerer Heiler als sein Vater: Er ersetzt Nuadas Silberarm durch lebendes Fleisch — und wird dafür vom Vater erschlagen. Aus seinem Grab wachsen 365 Kräuter." },
  { n: "Airmed", alt: ["Airmid"], g: "female", deity: true, grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Tochter Dian Céchts. Ordnet die 365 Heilkräuter vom Grab ihres Bruders Miach nach ihren Kräften — der Vater verwirrt sie, und so bleibt das Wissen unvollständig." },
  { n: "Goibniu", g: "male", deity: true, e: "Der Schmied", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Schmiedegott. In der zweiten Schlacht von Mag Tuired schmiedet er mit drei Schlägen Speerspitzen, die niemals fehlen. Braut das Fest der Unsterblichkeit.",
    props: [["skill", "Schmiedekunst", "Drei Schläge je Speer"]] },
  { n: "Credne", g: "male", deity: true, e: "Der Bronzeschmied", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Gott der Bronzearbeit, fertigt Nieten für die Speere der Schlacht." },
  { n: "Luchta", alt: ["Luchtaine"], g: "male", deity: true, e: "Der Zimmermann", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Gott des Holzhandwerks, fertigt Schäfte und Schilde für die Schlacht." },
  { n: "Manannán mac Lir", alt: ["Manannan", "Oirbsiu"], g: "male", deity: true, e: "Herr der See", grp: ["Tuatha Dé Danann"], src: "LGE",
    d: "Meeresgott und Herr der Anderswelt-Inseln. Reist mit dem Boot Wellenfeger und dem Pferd Aonbharr über die See, hüllt die Síde in seinen Nebelmantel. Ziehvater Lughs.",
    props: [["animal", "Aonbharr", "Pferd, das über Wasser läuft"], ["place", "Mag Mell", "Sein Reich"], ["attribute", "Nebel", "Féth fíada, der Verbergungsnebel"]] },
  { n: "Lir", alt: ["Lir of Sídh Fionnachaidh"], g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "ACL",
    d: "Meeresgottheit, Vater Manannáns und der vier verwandelten Kinder. Nach dem Verlust der Königswahl zieht er sich zurück; sein Haus wird vom Schicksal seiner Kinder zerrissen." },
  { n: "Aobh", alt: ["Aeb"], g: "female", grp: ["Tuatha Dé Danann"], src: "ACL", dead: true,
    d: "Ziehtochter Bodb Dergs, erste Frau Lirs, Mutter der vier Kinder. Stirbt bei der Geburt der Zwillinge." },
  { n: "Aoife", alt: ["Aífe ingen Ailella"], g: "female", grp: ["Tuatha Dé Danann"], src: "ACL",
    d: "Zweite Frau Lirs, Schwester Aobhs. Verwandelt die vier Stiefkinder aus Eifersucht in Schwäne — und wird dafür von Bodb Derg in einen Luftdämon verwandelt." },
  { n: "Fionnuala", alt: ["Finnguala", "Fionnghuala"], g: "female", grp: ["Tuatha Dé Danann"], src: "ACL", dead: true,
    d: "Älteste der Kinder Lirs. Trägt als Schwan 900 Jahre lang die Geschwister unter ihren Flügeln durch die Stürme der Sea of Moyle." },
  { n: "Aodh", alt: ["Aed mac Lir"], g: "male", grp: ["Tuatha Dé Danann"], src: "ACL", dead: true,
    d: "Sohn Lirs, einer der vier Schwanenkinder." },
  { n: "Fiachra", g: "male", grp: ["Tuatha Dé Danann"], src: "ACL", dead: true,
    d: "Zwillingssohn Lirs, eines der Schwanenkinder." },
  { n: "Conn mac Lir", g: "male", grp: ["Tuatha Dé Danann"], src: "ACL", dead: true,
    d: "Zwillingssohn Lirs, eines der Schwanenkinder." },
  { n: "Bodb Derg", alt: ["Bodb the Red"], g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "ACL",
    d: "Sohn des Dagda, nach dem Rückzug in die Síde zum König der Tuatha Dé Danann gewählt. Ziehvater Aobhs und Aoifes." },
  { n: "Midir", alt: ["Midir of Brí Léith"], g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "TE",
    d: "Herr des Síd von Brí Léith, Ziehvater des Aengus. Gewinnt Étaín, verliert sie durch Fuamnachs Zauber für tausend Jahre — und holt sie mit einem Fidchell-Spiel zurück.",
    props: [["skill", "Fidchell", "Meister des Brettspiels"]] },
  { n: "Étaín", alt: ["Étaín Echraide", "Éadaoin"], g: "female", e: "Die Schönste Irlands", grp: ["Tuatha Dé Danann"], src: "TE",
    quote: "„Schön ist jede, bis man sie neben Étaín stellt.“",
    d: "Von Fuamnach in eine Fliege verwandelt, nach tausend Jahren als Menschentochter wiedergeboren und Königin an Eochu Airems Seite — bis Midir sie im Brettspiel zurückgewinnt.",
    props: [["attribute", "Schönheit", "Sprichwörtlich"], ["animal", "Purpurfliege", "Ihre verwandelte Gestalt"]] },
  { n: "Fuamnach", g: "female", grp: ["Tuatha Dé Danann"], src: "TE", dead: true,
    d: "Erste Frau Midirs, Zauberin aus dem Geschlecht der Druiden. Verwandelt Étaín aus Eifersucht — Aengus enthauptet sie dafür." },
  { n: "Aengus", alt: ["Óengus", "Aengus Óg", "Mac ind Óc"], g: "male", deity: true, e: "Gott der Jugend und Liebe", grp: ["Tuatha Dé Danann"], src: "TE",
    d: "Sohn des Dagda und der Boann, im »geliehenen Tag« gezeugt und geboren. Gewinnt Brú na Bóinne durch Wortwitz, beschützt Liebende — auch Diarmuid und Gráinne.",
    props: [["animal", "Vier Schwäne", "Seine Küsse wurden zu Vögeln"], ["place", "Brú na Bóinne", "Sein Síd"]] },
  { n: "Boann", alt: ["Boand"], g: "female", deity: true, e: "Göttin des Boyne", grp: ["Tuatha Dé Danann"], src: "DIND",
    d: "Flussgöttin. Trotzt dem Verbot, den Brunnen der Weisheit zu umschreiten — der Brunnen bricht aus und wird zum Fluss Boyne, der ihren Namen trägt." },
  { n: "Elcmar", g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "TE",
    d: "Gemahl der Boann und erster Herr des Brú na Bóinne, vom Dagda überlistet und später von Aengus verdrängt." },
  { n: "Morrígan", alt: ["Mórrígan", "Morrígu"], g: "female", deity: true, e: "Große Königin, Kriegsgöttin", grp: ["Tuatha Dé Danann"], src: "CMT",
    quote: "„Ich habe gefochten, obwohl ich keinen Speer trug — der Schrecken war meine Waffe.“",
    d: "Göttin des Krieges, des Schicksals und der Souveränität. Verbindet sich am Samhain mit dem Dagda, verheißt den Sieg über die Fomorer, begegnet Cú Chulainn als Krähe.",
    props: [["animal", "Krähe", "Ihre Schlachtgestalt"], ["animal", "Aal, Wölfin, Färse", "Gestalten gegen Cú Chulainn"], ["attribute", "Prophezeiung", "Verkündet Sieg und Weltende"]] },
  { n: "Badb", alt: ["Badb Catha"], g: "female", deity: true, e: "Schlachtkrähe", grp: ["Tuatha Dé Danann"], src: "CMT",
    d: "Kriegsgöttin, Schwester der Morrígan, erscheint als Krähe über dem Schlachtfeld und verwirrt die Heere." },
  { n: "Macha", g: "female", deity: true, e: "Herrin von Emain Macha", grp: ["Tuatha Dé Danann"], src: "TAIN",
    d: "Dreifache Gestalt: Göttin, Königin, verfluchende Läuferin. Gezwungen, hochschwanger gegen die Pferde des Königs zu rennen, verflucht sie die Männer Ulsters mit den Wehen.",
    props: [["animal", "Pferd", "Schneller als die Königsrosse"], ["place", "Emain Macha", "Nach ihr benannt"]] },
  { n: "Ethniu", alt: ["Eithne", "Ethlinn"], g: "female", grp: ["Fomorians"], src: "CMT",
    d: "Tochter Balors, im Glasturm eingeschlossen, damit die Prophezeiung sich nicht erfüllt. Cian gelangt dennoch zu ihr — sie wird Lughs Mutter." },
  { n: "Cian", alt: ["Cian mac Cáinte"], g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "ACT", dead: true,
    d: "Sohn Dian Céchts, Vater Lughs. Auf dem Weg nach Norden von den Söhnen Tuirenns erschlagen — die Erde selbst verrät die Mörder." },
  { n: "Tailtiu", g: "female", grp: ["Fir Bolg"], src: "LGE", dead: true,
    d: "Fir-Bolg-Königin und Ziehmutter Lughs. Stirbt an der Erschöpfung, nachdem sie die Ebenen Irlands für den Ackerbau gerodet hat; Lugh stiftet ihr die Tailteann-Spiele." },
  { n: "Elatha", alt: ["Elatha mac Delbaíth"], g: "male", deity: true, e: "Der schöne Fomorenfürst", grp: ["Fomorians"], src: "CMT",
    d: "Fomorenkönig von großer Schönheit, kommt über das mondbeschienene Meer zu Ériu — Vater des Bres, der ihn später vergeblich um Hilfe bittet." },
  { n: "Cethlenn", alt: ["Cethlenn of the Crooked Teeth"], g: "female", grp: ["Fomorians"], src: "CMT",
    d: "Gattin Balors, Prophetin der Fomorer. Verwundet den Dagda in der zweiten Schlacht von Mag Tuired." },
  { n: "Ruadán", g: "male", grp: ["Tuatha Dé Danann", "Fomorians"], src: "CMT", dead: true,
    d: "Sohn von Bres und Brigid. Als Spion und Attentäter gegen Goibniu geschickt, von dessen Speer durchbohrt — Brigids Klage um ihn ist das erste Keening Irlands." },
  { n: "Indech", alt: ["Indech mac Dé Domnann"], g: "male", grp: ["Fomorians"], src: "CMT", dead: true,
    d: "Fomorenkönig, einer der Anführer in der zweiten Schlacht von Mag Tuired, fällt gegen Ogma." },
  { n: "Tethra", g: "male", deity: true, grp: ["Fomorians"], src: "CMT",
    d: "Fomorenkönig, nach der Schlacht Herrscher über das Totenreich Mag Mell. Sein Schwert Orna erzählt seine Taten, wenn man es entblößt." },
  { n: "Néit", g: "male", deity: true, e: "Kriegsgott", grp: ["Fomorians", "Tuatha Dé Danann"], src: "CMT",
    d: "Alter Kriegsgott, Großvater Balors und Verwandter beider Völker — die Genealogie der Fomorer und Danann verflicht sich in ihm." },
  { n: "Tuirenn", alt: ["Tuireann"], g: "male", grp: ["Tuatha Dé Danann"], src: "ACT",
    d: "Vater der drei Brüder Brian, Iuchar und Iucharba, die Cian erschlagen. Sein Bittgesuch an Lugh um das Leben seiner Söhne bleibt vergeblich." },
  { n: "Brian mac Tuirenn", alt: ["Brian"], g: "male", grp: ["Tuatha Dé Danann"], src: "ACT", dead: true,
    d: "Ältester der Söhne Tuirenns. Führt die Brüder auf die unmögliche Bußfahrt für den Mord an Cian — die Wundergaben der Welt als Wergeld." },
  { n: "Iuchar", g: "male", grp: ["Tuatha Dé Danann"], src: "ACT", dead: true, d: "Sohn Tuirenns, stirbt an den Wunden der letzten Aufgabe." },
  { n: "Iucharba", g: "male", grp: ["Tuatha Dé Danann"], src: "ACT", dead: true, d: "Sohn Tuirenns, stirbt an den Wunden der letzten Aufgabe." },
  { n: "Cessair", g: "female", grp: ["Cessair's People"], src: "LGE", dead: true,
    d: "Führerin der ersten Siedler Irlands, Enkelin Noahs in der Klosterüberlieferung. Ihr Volk geht in der Flut unter — nur Fintan entkommt." },
  { n: "Fintan mac Bóchra", alt: ["Fintan the Wise"], g: "male", e: "Der Weise", grp: ["Cessair's People"], src: "LGE",
    d: "Überlebt die Flut in Gestalt von Lachs, Adler und Falke und trägt als ältester Zeuge die Erinnerung ganz Irlands durch die Zeitalter.",
    props: [["animal", "Lachs", "Erste Verwandlung"], ["animal", "Adler", "Zweite Verwandlung"], ["animal", "Falke", "Dritte Verwandlung"]] },
  { n: "Partholón", g: "male", grp: ["Partholonians"], src: "LGE", dead: true,
    d: "Anführer der zweiten Siedlerwelle. Sein Volk rodet Ebenen, braut das erste Bier, kämpft die erste Schlacht gegen die Fomorer — und stirbt an einer einzigen Seuchenwoche." },
  { n: "Nemed", alt: ["Nemed mac Agnomain"], g: "male", grp: ["Nemedians"], src: "LGE", dead: true,
    d: "Anführer der dritten Siedlerwelle. Siegt viermal über die Fomorer, doch nach seinem Tod knechten sie sein Volk mit Tributen von zwei Dritteln der Kinder und Ernte." },
  { n: "Conand", alt: ["Conand mac Febair"], g: "male", grp: ["Fomorians"], src: "LGE", dead: true,
    d: "Fomorenkönig im Glasturm auf Tory Island, Unterdrücker der Nemedier — fällt beim Sturm auf seinen Turm." },
  { n: "Sreng", g: "male", grp: ["Fir Bolg"], src: "CMT1",
    d: "Champion der Fir Bolg. Schlägt Nuada in der ersten Schlacht von Mag Tuired den Arm ab und erhält im Frieden die Provinz Connacht." },
  { n: "Eochaid mac Eirc", g: "male", grp: ["Fir Bolg"], src: "CMT1", dead: true,
    d: "Letzter König der Fir Bolg, unter dem kein Regen, nur Tau fiel — der erste gerechte König Irlands. Fällt in der ersten Schlacht von Mag Tuired." },
  { n: "Míl Espáine", alt: ["Milesius", "Míl of Spain"], g: "male", grp: ["Milesians"], src: "LGE", dead: true,
    d: "Namensgeber der Milesier. Stirbt in Iberien, bevor seine Söhne Irland erobern — sein Onkel Íths Tod liefert den Kriegsgrund." },
  { n: "Amergin", alt: ["Amergin Glúingel", "Amairgen"], g: "male", e: "Dichter der Milesier", grp: ["Milesians"], src: "LGE",
    quote: "„Ich bin der Wind auf dem Meer, ich bin die Woge der See …“",
    d: "Druide und Richter der Milesier. Sein Lied beim ersten Schritt an Land bannt den Sturm der Tuatha Dé Danann und nimmt Irland dichterisch in Besitz.",
    props: [["skill", "Dichtkunst", "Das Lied Amergins"], ["skill", "Rechtsprechung", "Erster Richter der Gaelen"]] },
  { n: "Éber Finn", g: "male", grp: ["Milesians"], src: "LGE", dead: true,
    d: "Sohn Míls, erhält den Süden Irlands — fällt ein Jahr später im Bruderkrieg gegen Éremón." },
  { n: "Éremón", g: "male", grp: ["Milesians"], src: "LGE", dead: true,
    d: "Sohn Míls, erster milesischer König des Nordens und nach dem Sieg über Éber ganz Irlands." },
  { n: "Donn", alt: ["Donn mac Míled", "Éber Donn"], g: "male", deity: true, e: "Der Dunkle, Herr der Toten", grp: ["Milesians"], src: "LGE", dead: true,
    d: "Ältester Sohn Míls. Beleidigt Ériu, ertrinkt vor der Küste und wird zum Totengott: Zu seinem Haus, Tech Duinn, ziehen die Seelen der Iren.",
    props: [["place", "Tech Duinn", "Haus des Todes"], ["color", "Dunkel", "Sein Name bedeutet »der Dunkle«"]] },
  { n: "Mac Cuill", g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "LGE", dead: true,
    d: "Einer der drei letzten Danann-Könige, Gemahl der Banba — fällt gegen die Milesier." },
  { n: "Mac Cécht", g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "LGE", dead: true,
    d: "Einer der drei letzten Danann-Könige, Gemahl der Fódla — fällt gegen die Milesier." },
  { n: "Mac Gréine", g: "male", deity: true, grp: ["Tuatha Dé Danann"], src: "LGE", dead: true,
    d: "Einer der drei letzten Danann-Könige, Gemahl der Ériu — fällt gegen die Milesier." },
  { n: "Ernmas", g: "female", deity: true, grp: ["Tuatha Dé Danann"], src: "LGE",
    d: "Muttergöttin, Mutter der Morrígan, Badb und Macha sowie von Ériu, Banba und Fódla." },
];


// ── Characters: Ulster Cycle ─────────────────────────────────────────────
const CHARACTERS_ULSTER: CharDef[] = [
  { n: "Cú Chulainn", alt: ["Sétanta", "The Hound of Ulster", "Cúchulainn"], g: "male", e: "Der Hund von Ulster", grp: ["Ulaid"], src: "TAIN", dead: true,
    quote: "„Mir ist gleich, ob ich nur einen Tag und eine Nacht lebe, wenn nur mein Ruhm und meine Taten fortleben.“",
    d: "Größter Held des Ulster-Zyklus. Sohn Lughs und Deichtines, als Sétanta geboren, nach dem Hund des Schmieds Culann benannt. Verteidigt Ulster allein in der Táin und stirbt aufrecht an einen Stein gebunden.",
    props: [
      ["attribute", "Ríastrad", "Die Verzerrung — Kampfeswut, die den Körper entstellt"],
      ["weapon", "Gáe Bulg", "Der Speer aus dem Bein des Seeungeheuers"],
      ["animal", "Liath Macha", "Das graue Schlachtross"],
      ["animal", "Dub Sainglend", "Das schwarze Schlachtross"],
      ["attribute", "Geasa", "Nie Hundefleisch essen; nie ein Mahl verweigern"],
    ] },
  { n: "Conchobar mac Nessa", alt: ["Conor mac Nessa"], g: "male", e: "König von Ulster", grp: ["Ulaid"], src: "TAIN",
    d: "König Ulsters in Emain Macha, Sohn der Ness und (je nach Fassung) des Druiden Cathbad. Sein Verrat an Naoise treibt Fergus ins Exil." },
  { n: "Ness", alt: ["Nessa"], g: "female", grp: ["Ulaid"], src: "TAIN",
    d: "Mutter Conchobars. Erlistet ihrem Sohn das Königtum, indem sie Fergus ein Jahr »Leihkönigtum« abhandelt — das Jahr wird nie zurückgegeben." },
  { n: "Cathbad", g: "male", e: "Druide von Emain Macha", grp: ["Ulaid"], src: "TAIN",
    d: "Oberster Druide Ulsters. Prophezeit Deirdres Verderben und den Ruhm des Tages, an dem Cú Chulainn die Waffen nimmt.",
    props: [["skill", "Prophezeiung", ""], ["skill", "Druidenkunst", ""]] },
  { n: "Deichtine", alt: ["Dechtire"], g: "female", grp: ["Ulaid"], src: "TAIN",
    d: "Schwester (nach anderen Fassungen Tochter) Conchobars, Mutter Cú Chulainns durch den Gott Lugh." },
  { n: "Sualtam", alt: ["Sualtam mac Róich"], g: "male", grp: ["Ulaid"], src: "TAIN", dead: true,
    d: "Irdischer Vater Cú Chulainns. Sein abgeschlagenes Haupt ruft die Ulter noch im Tod zu den Waffen." },
  { n: "Fergus mac Róich", g: "male", e: "Der Verbannte König", grp: ["Ulaid", "Connachta"], src: "TAIN",
    d: "Ehemaliger König Ulsters, Ziehvater Cú Chulainns. Nach Conchobars Verrat an den Söhnen Uislius tritt er in Medbs Dienste — schont in der Schlacht aber seinen Ziehsohn.",
    props: [["weapon", "Caladbolg", "Das Schwert, das Hügelkuppen abschlägt"], ["attribute", "Stärke", "Kraft von siebenhundert Männern"]] },
  { n: "Medb", alt: ["Maeve", "Medb of Cruachan"], g: "female", e: "Königin von Connacht", grp: ["Connachta"], src: "TAIN",
    quote: "„Ich verlangte ein Ehegut, wie es nie eine Frau zuvor verlangte: einen Mann ohne Geiz, ohne Furcht, ohne Eifersucht.“",
    d: "Herrscherin in Cruachan, treibende Kraft des Rinderraubs von Cooley. Das Kissengespräch mit Ailill über den Wert ihres Besitzes entfacht den Krieg um den braunen Stier.",
    props: [["attribute", "Souveränität", "Wer Irland regieren will, muss »mit Medb vermählt« sein"], ["animal", "Vogel und Eichhörnchen", "Ihre Schulterbegleiter"]] },
  { n: "Ailill mac Máta", g: "male", e: "König von Connacht", grp: ["Connachta"], src: "TAIN",
    d: "Gemahl Medbs, Besitzer des weißen Stiers Finnbennach — dessen Wert das Kissengespräch und damit die Táin auslöst." },
  { n: "Findabair", alt: ["Finnabair"], g: "female", grp: ["Connachta"], src: "TAIN", dead: true,
    d: "Tochter Medbs und Ailills, als Lohn den Kämpfern gegen Cú Chulainn versprochen — stirbt an Scham und Gram." },
  { n: "Fedelm", alt: ["Fedelm Banfháid"], g: "female", e: "Die Seherin", grp: ["Connachta"], src: "TAIN",
    quote: "„Ich sehe es purpurrot, ich sehe es rot.“",
    d: "Prophetin aus Cruachan. Auf Medbs Frage nach dem Ausgang des Feldzugs antwortet sie dreimal: »Ich sehe rot.«",
    props: [["skill", "Imbas forosnai", "Die erleuchtende Sehergabe"]] },
  { n: "Ferdiad", alt: ["Fer Diad mac Damáin"], g: "male", grp: ["Connachta"], src: "TAIN", dead: true,
    d: "Cú Chulainns Waffenbruder aus Scáthachs Schule, mit Hornhaut gepanzert. Von Medb mit List und Findabair in den Zweikampf getrieben — fällt nach drei Tagen an der Furt." },
  { n: "Láeg", alt: ["Láeg mac Riangabra"], g: "male", e: "Der Wagenlenker", grp: ["Ulaid"], src: "TAIN", dead: true,
    d: "Cú Chulainns treuer Wagenlenker, der König der Wagenlenker — fängt in der letzten Schlacht den Speer ab, der seinem Herrn galt." },
  { n: "Emer", alt: ["Emer ingen Forgaill"], g: "female", e: "Die der sechs Gaben", grp: ["Ulaid"], src: "TEM",
    d: "Tochter Forgall Monachs, Cú Chulainns Frau. Besitzt die sechs Gaben: Schönheit, Stimme, süße Rede, Nadelkunst, Weisheit und Keuschheit.",
    props: [["attribute", "Sechs Gaben", "Schönheit, Stimme, Rede, Nadelkunst, Weisheit, Keuschheit"]] },
  { n: "Forgall Monach", g: "male", e: "Der Listige", src: "TEM", dead: true,
    d: "Herr von Luglochta Loga, Vater Emers. Schickt Cú Chulainn zur Ausbildung zu Scáthach in der Hoffnung, er kehre nie zurück — stürzt bei der Brautraub-Belagerung vom Wall." },
  { n: "Scáthach", alt: ["Scáthach nUanaind"], g: "female", e: "Die Schattenhafte", src: "TEM",
    d: "Kriegerin und Waffenmeisterin auf Skye. Bildet Cú Chulainn und Ferdiad aus, gibt Cú Chulainn den Gáe Bulg und prophezeit seine Taten.",
    props: [["skill", "Waffenkunst", "Lehrerin der Helden"], ["place", "Dún Scáith", "Festung der Schatten"]] },
  { n: "Aífe", alt: ["Aífe ingen Árdgeimm"], g: "female", e: "Die Kriegerin von Alba", src: "AOA",
    d: "Scáthachs Rivalin, härteste Kriegerin der Welt. Von Cú Chulainn bezwungen, gebiert sie ihm den Sohn Connla — und schickt ihn Jahre später unter Geasa nach Irland." },
  { n: "Connla", alt: ["Conláech"], g: "male", grp: [], src: "AOA", dead: true,
    d: "Sohn Cú Chulainns und Aífes. Unter dem Gebot, sich nie zu nennen und nie zu weichen, fällt er unerkannt durch den Gáe Bulg seines eigenen Vaters." },
  { n: "Deirdre", alt: ["Derdriu", "Deirdre of the Sorrows"], g: "female", e: "Deirdre der Sorgen", grp: ["Ulaid"], src: "LMU", dead: true,
    quote: "„Ich sah einen Raben Blut im Schnee trinken — so soll mein Mann sein: Haar wie der Rabe, Wange wie Blut, Leib wie Schnee.“",
    d: "Bei ihrer Geburt als Verderben Ulsters prophezeit, von Conchobar für sich aufgezogen. Flieht mit Naoise nach Alba; nach dessen Ermordung wählt sie den Tod statt Conchobars Bett." },
  { n: "Naoise", alt: ["Noísiu mac Uisnig"], g: "male", grp: ["Ulaid"], src: "LMU", dead: true,
    d: "Ältester Sohn Uislius, Sänger und Krieger. Flieht mit Deirdre nach Alba und kehrt unter Fergus' Schutzwort zurück — Eogan mac Durthacht erschlägt ihn auf Conchobars Geheiß." },
  { n: "Ainnle", g: "male", grp: ["Ulaid"], src: "LMU", dead: true, d: "Sohn Uislius, Bruder Naoises, fällt mit ihm." },
  { n: "Ardán", g: "male", grp: ["Ulaid"], src: "LMU", dead: true, d: "Sohn Uislius, Bruder Naoises, fällt mit ihm." },
  { n: "Leborcham", g: "female", grp: ["Ulaid"], src: "LMU",
    d: "Dichterin und Botin Conchobars, Deirdres Vertraute — sie verrät ihr, wo Rabenhaar, Blut und Schnee zusammenkommen: in Naoise." },
  { n: "Eogan mac Durthacht", g: "male", grp: ["Ulaid"], src: "LMU",
    d: "König von Fernmag, erschlägt Naoise für Conchobar — Deirdre stürzt sich aus seinem Wagen zu Tode." },
  { n: "Conall Cernach", alt: ["Conall the Victorious"], g: "male", e: "Der Siegreiche", grp: ["Ulaid"], src: "TAIN",
    d: "Cú Chulainns Ziehbruder und Rächer: Er erschlägt Lugaid mac Con Roí und trägt die Köpfe der Feinde heim.",
    props: [["attribute", "Rache", "Rächer Cú Chulainns"]] },
  { n: "Lóegaire Búadach", alt: ["Lóegaire the Triumphant"], g: "male", grp: ["Ulaid"], src: "FB",
    d: "Ulter Held, dritter Anwärter auf den Heldenbissen bei Bricrius Fest." },
  { n: "Bricriu", alt: ["Bricriu Nemthenga"], g: "male", e: "Giftzunge", grp: ["Ulaid"], src: "FB",
    d: "Stänker der Ulter. Lädt zum Fest, nur um Helden und Frauen gegeneinanderzuhetzen — der Streit um den Heldenbissen führt zum Enthauptungsspiel." },
  { n: "Cú Roí", alt: ["Cú Roí mac Dáire"], g: "male", e: "König von Munster, Meister der Verwandlung", src: "FB", dead: true,
    d: "Zauberkundiger König Munsters. Als Riese im Enthauptungsspiel prüft er die Helden Ulsters; Cú Chulainn besteht. Bláthnats Verrat liefert ihn später dem Tod aus.",
    props: [["attribute", "Gestaltwandel", ""], ["attribute", "Rotierende Festung", "Seine Burg dreht sich nachts"]] },
  { n: "Bláthnat", alt: ["Bláthnait"], g: "female", src: "FB", dead: true,
    d: "Gattin Cú Roís, liebt Cú Chulainn. Verrät das Geheimnis von Cú Roís Seele — und wird vom Dichter Ferchertne mit in den Abgrund gerissen." },
  { n: "Culann", g: "male", e: "Der Schmied", grp: ["Ulaid"], src: "TAIN",
    d: "Schmied Ulsters. Sein Wachhund fällt durch den jungen Sétanta — der als Ersatz selbst »Culanns Hund«, Cú Chulainn, wird." },
  { n: "Donn Cúailnge", alt: ["The Brown Bull of Cooley"], g: "other", e: "Der braune Stier von Cooley", src: "TAIN", dead: true,
    d: "Der begehrte Stier der Táin, Wiedergeburt des Schweinehirten Friuch. Tötet Finnbennach, trägt ihn zerfetzt durch Irland und stirbt brüllend in Cúailnge.",
    props: [["color", "Braun", "Sein Name"], ["attribute", "Wiedergeburt", "Einst der Schweinehirt Friuch"]] },
  { n: "Finnbennach", alt: ["The White-Horned Bull"], g: "other", e: "Der Weißhörnige", src: "TAIN", dead: true,
    d: "Ailills weißer Stier, Wiedergeburt des Schweinehirten Rucht. Wechselte aus Stolz von Medbs Herde in die des Königs — fällt im Kampf gegen Donn Cúailnge.",
    props: [["color", "Weiß", "Weißhörnig"], ["attribute", "Wiedergeburt", "Einst der Schweinehirt Rucht"]] },
  { n: "Dáire mac Fiachna", g: "male", grp: ["Ulaid"], src: "TAIN",
    d: "Besitzer des Donn Cúailnge. Erst zur Leihgabe bereit — bis er hört, Medbs Boten hätten den Stier notfalls mit Gewalt genommen." },
  { n: "Lugaid mac Con Roí", g: "male", src: "TAIN",
    d: "Sohn Cú Roís. Rächt den Vater: Sein Speer trifft Cú Chulainn tödlich — Conall Cernach nimmt dafür sein Haupt." },
  { n: "Lugaid Riab nDerg", g: "male", grp: ["Ulaid"], src: "TAIN",
    d: "Ziehsohn Cú Chulainns, König von Tara, Gemahl der wiedergeborenen Étaín-Tochter in späten Fassungen." },
];

// ── Characters: Fenian Cycle ─────────────────────────────────────────────
const CHARACTERS_FENIAN: CharDef[] = [
  { n: "Fionn mac Cumhaill", alt: ["Finn McCool", "Demne"], g: "male", e: "Der Weiße, Anführer der Fianna", grp: ["Fianna", "Clann Baíscne"], src: "MF",
    quote: "„Wenn ich den Daumen an den Weisheitszahn lege, wird mir kund, was verborgen ist.“",
    d: "Als Demne geboren, im Verborgenen aufgezogen. Kostet den Lachs der Weisheit, tötet den Feuerdämon Aillen an Samhain und wird Anführer der Fianna. Sein Alter vergällt Eifersucht auf Diarmuid.",
    props: [
      ["attribute", "Daumen der Weisheit", "Wissen durch den Lachs der Weisheit"],
      ["animal", "Bran und Sceólang", "Seine Hunde — verwandelte Verwandte"],
      ["color", "Weißblond", "Fionn = »der Helle«"],
    ] },
  { n: "Cumhall", alt: ["Cumhall mac Trénmhoir"], g: "male", e: "Anführer der Fianna", grp: ["Fianna", "Clann Baíscne"], src: "MF", dead: true,
    d: "Fionns Vater, Anführer der Fianna. Raubt Muirne gegen den Willen ihres Vaters und fällt durch Goll mac Morna in der Schlacht von Cnucha." },
  { n: "Muirne", alt: ["Muirne Muncháem"], g: "female", grp: ["Clann Baíscne"], src: "MF",
    d: "Tochter des Druiden Tadg mac Nuadat, Enkelin Nuadas. Gebiert Fionn nach Cumhalls Tod und gibt ihn zur Sicherheit in die Obhut der Wildnis." },
  { n: "Tadg mac Nuadat", g: "male", e: "Druide von Almu", src: "MF",
    d: "Druide auf dem Hügel von Almu, Sohn Nuadas. Verweigert Cumhall die Tochter — und muss Almu später an den Enkel Fionn abtreten." },
  { n: "Bodhmall", g: "female", e: "Die Druidin", grp: ["Clann Baíscne"], src: "MF",
    d: "Cumhalls Schwester, Druidin. Zieht Fionn mit der Kriegerin Liath Luachra heimlich im Wald von Sliab Bladhma auf." },
  { n: "Liath Luachra", alt: ["The Grey One of Luachair"], g: "female", e: "Die Graue", src: "MF",
    d: "Kriegerin und zweite Ziehmutter Fionns, lehrt ihn Jagd und Kampf." },
  { n: "Finnegas", alt: ["Finn Éces"], g: "male", e: "Der Dichter am Boyne", src: "MF",
    d: "Dichter, der sieben Jahre den Lachs der Weisheit angelt. Der Junge Demne brät ihm den Fang — und verbrennt sich den Daumen: Das Wissen geht auf Fionn über." },
  { n: "Sadhbh", alt: ["Sadb ingen Bhoidb Dheirg"], g: "female", grp: ["Tuatha Dé Danann"], src: "ACS",
    d: "Tochter Bodb Dergs, vom Dunklen Druiden in eine Hirschkuh verwandelt. Als Frau Fionns kurz erlöst, wird sie erneut verzaubert — ihr Sohn Oisín wird im Wald gefunden.",
    props: [["animal", "Hirschkuh", "Ihre verwandelte Gestalt"]] },
  { n: "Oisín", alt: ["Ossian"], g: "male", e: "Der Dichter der Fianna", grp: ["Fianna", "Clann Baíscne"], src: "ACS",
    d: "Sohn Fionns und Sadhbhs, größter Dichter der Fianna. Folgt Niamh nach Tír na nÓg; bei der Heimkehr nach dreihundert Jahren macht ihn die Berührung der Erde zum Greis.",
    props: [["skill", "Dichtkunst", "Stimme des Zyklus"]] },
  { n: "Niamh", alt: ["Niamh Chinn Óir"], g: "female", e: "Niamh vom Goldhaar", grp: ["Tuatha Dé Danann"], src: "ACS",
    d: "Tochter Manannáns aus Tír na nÓg. Holt Oisín auf dem weißen Pferd übers Meer ins Land der Jugend.",
    props: [["color", "Gold", "Ihr Haar"], ["animal", "Embarr", "Das weiße Pferd über den Wellen"]] },
  { n: "Oscar", alt: ["Osgar"], g: "male", e: "Der Stärkste der Fianna", grp: ["Fianna", "Clann Baíscne"], src: "ACS", dead: true,
    d: "Sohn Oisíns, gewaltigster Krieger der jungen Fianna. Fällt in der Schlacht von Gabhair im gegenseitigen Todesstreich mit König Cairbre Lifechair." },
  { n: "Diarmuid Ua Duibhne", alt: ["Diarmuid of the Love Spot"], g: "male", e: "Diarmuid vom Liebesfleck", grp: ["Fianna", "Clann Baíscne"], src: "TDG", dead: true,
    d: "Ziehsohn des Aengus. Der Liebesfleck auf seiner Stirn macht ihn unwiderstehlich — Gráinne zwingt ihn mit einer Geis zur Flucht. Stirbt am Hauer des Ebers von Benbulbin, weil Fionn das rettende Wasser verrinnen lässt.",
    props: [["attribute", "Ball Seirce", "Der Liebesfleck"], ["weapon", "Gáe Dearg", "Der rote Speer für den Ernst"], ["weapon", "Moralltach", "Das Schwert Manannáns"]] },
  { n: "Gráinne", g: "female", grp: [], src: "TDG",
    d: "Tochter Cormac mac Airts, dem alternden Fionn versprochen. Legt Diarmuid am Verlobungsfest eine Geis auf und flieht mit ihm — sechzehn Jahre quer durch Irland." },
  { n: "Goll mac Morna", alt: ["Aed mac Morna"], g: "male", e: "Der Einäugige", grp: ["Fianna", "Clann Morna"], src: "MF",
    d: "Anführer der Clann Morna, Töter Cumhalls, später loyaler, stets gefährlicher Gefolgsmann Fionns.",
    props: [["attribute", "Ein Auge", "Goll = »der Einäugige«"]] },
  { n: "Caílte mac Rónáin", g: "male", e: "Der Schnellfüßige", grp: ["Fianna", "Clann Baíscne"], src: "ACS",
    d: "Fionns Neffe, schnellster Läufer der Fianna. Überlebt bis in die Zeit Patricks und erzählt ihm im Acallam die Taten der Fianna.",
    props: [["skill", "Lauf", "Schnellster der Fianna"], ["skill", "Erzählkunst", "Stimme des Acallam"]] },
  { n: "Conán Maol", alt: ["Conán mac Morna"], g: "male", e: "Der Kahle", grp: ["Fianna", "Clann Morna"], src: "ACS",
    d: "Spötter und Vielfraß der Fianna — scharfe Zunge, kahler Schädel, Schafsfell auf dem Rücken seit dem Haus der Quicken Trees." },
  { n: "Aillen", alt: ["Aillen mac Midgna", "The Burner"], g: "male", e: "Der Brenner", grp: ["Tuatha Dé Danann"], src: "MF", dead: true,
    d: "Feuerdämon aus dem Síd, brennt jedes Samhain Tara nieder, nachdem seine Musik alle in Schlaf gesungen hat. Fionn widersteht mit der Speerspitze an der Stirn und tötet ihn.",
    props: [["skill", "Schlafmusik", "Seine Harfe betäubt alle"], ["attribute", "Feueratem", "Verbrennt Tara"]] },
  { n: "Cairbre Lifechair", g: "male", e: "Hochkönig", src: "ACS", dead: true,
    d: "Sohn Cormac mac Airts. Bricht die Macht der Fianna in der Schlacht von Gabhair — er und Oscar töten einander." },
];

// ── Characters: Cycle of the Kings ───────────────────────────────────────
const CHARACTERS_KINGS: CharDef[] = [
  { n: "Conn Cétchathach", alt: ["Conn of the Hundred Battles"], g: "male", e: "Conn der hundert Schlachten", src: "CMM",
    d: "Hochkönig in Tara. Unter seinem Fuß schreit der Lia Fáil; die Vision des Baile in Scáil zeigt ihm alle künftigen Könige seiner Linie." },
  { n: "Art mac Cuinn", alt: ["Art Óenfher"], g: "male", e: "Der Einsame", src: "CMM", dead: true,
    d: "Sohn Conns, Hochkönig. Fällt in der Schlacht von Mag Mucrama gegen Lugaid Mac Con — sein Sohn Cormac wird in der Nacht zuvor gezeugt." },
  { n: "Lugaid Mac Con", g: "male", e: "Hochkönig aus dem Exil", src: "CMM",
    d: "Verstoßener Ziehsohn Ailill Auloms. Kehrt mit fremdem Heer zurück, siegt bei Mag Mucrama und herrscht in Tara — bis ein falsches Urteil ihn stürzt und Cormac Platz macht." },
  { n: "Ailill Aulom", g: "male", e: "König von Munster", src: "CMM",
    d: "König Munsters, Gemahl der Sadb ingen Chuinn. Verflucht und verstößt den Ziehsohn Mac Con — Stammvater der Eóganachta." },
  { n: "Cormac mac Airt", alt: ["Cormac ua Cuinn"], g: "male", e: "Der weiseste König Irlands", src: "ECH",
    quote: "„Sein Urteil war so gerecht, dass die Mauer von Tara einstürzte, als ein falsches gefällt wurde.“",
    d: "Hochkönig des goldenen Zeitalters von Tara, Gesetzgeber und Richter. Erhält von Manannán den Becher der Wahrheit; Vater Gráinnes und Cairbres.",
    props: [["attribute", "Gerechtigkeit", "Die berühmten Urteile Cormacs"]] },
  { n: "Conaire Mór", alt: ["Conaire the Great"], g: "male", e: "Der von den Geasa Umstellte", src: "TBDD", dead: true,
    d: "Hochkönig, Sohn der Mess Búachalla und des Vogelwesens Nemglan. Bricht eine Geis nach der anderen, bis ihn in Da Dergas Halle der brennende Durst und die Räuber Ingcéls vernichten.",
    props: [["attribute", "Geasa", "Neun Verbote banden sein Königtum"], ["animal", "Vögel", "Sein Vatergeschlecht"]] },
  { n: "Mess Búachalla", g: "female", src: "TBDD",
    d: "Tochter Étaíns Enkelin, heimlich aufgezogene Mutter Conaire Mórs." },
  { n: "Niall Noígíallach", alt: ["Niall of the Nine Hostages"], g: "male", e: "Niall der neun Geiseln", src: "NIA",
    d: "Hochkönig und Ahnherr der Uí Néill. Küsst am Brunnen die hässliche Alte — die Herrin der Herrschaft selbst — und gewinnt so das Königtum.",
    props: [["attribute", "Souveränität", "Der Kuss der Herrin der Herrschaft"]] },
  { n: "Labraid Loingsech", alt: ["Labraid the Exile", "Móen"], g: "male", e: "Der stumme Verbannte", src: "ORT",
    d: "Stumm geboren, im Exil zum Krieger gereift. Kehrt zurück, verbrennt Dinn Ríg und gewinnt Leinster — der König mit den Pferdeohren, die nur sein Harfner kennt.",
    props: [["attribute", "Pferdeohren", "Sein Geheimnis, das das Schilf flüsterte"]] },
  { n: "Suibhne", alt: ["Suibhne Geilt", "Mad Sweeney"], g: "male", e: "Der wahnsinnige Vogelkönig", src: "BS", dead: true,
    d: "König von Dál nAraidi. Vom Fluch des heiligen Rónán getroffen, flieht er in der Schlacht von Mag Rath in den Wahnsinn und lebt vogelgleich in den Wipfeln Irlands.",
    props: [["animal", "Vogel", "Lebt und springt wie ein Vogel"], ["attribute", "Wahnsinn", "Geilt — der Schreckenswahn der Schlacht"]] },
  { n: "Rónán Finn", g: "male", e: "Der Heilige", src: "BS",
    d: "Klosterheiliger, dessen Psalter Suibhne in den See warf — sein Fluch macht den König zum Vogelmenschen." },
  { n: "Pádraig", alt: ["Saint Patrick"], g: "male", e: "Der Apostel Irlands", src: "ACS",
    d: "Der Heilige, dem Caílte und Oisín im Acallam na Senórach die alten Taten der Fianna erzählen — die Brücke zwischen Heidentum und neuer Zeit." },
];

// ── Family relations ─────────────────────────────────────────────────────
// Convention: [A, "father", B] = A is the father of B.

const FAMILY_MYTHOLOGICAL: FamRel[] = [
  // Danu line
  ["Danu", "mother", "Dagda", "Stammmutter des Göttervolks"],
  // Dagda's children
  ["Dagda", "father", "Aengus", "Gezeugt mit Boann im angehaltenen Tag"],
  ["Boann", "mother", "Aengus"],
  ["Dagda", "father", "Brigid"],
  ["Dagda", "father", "Bodb Derg"],
  ["Dagda", "father", "Midir"],
  ["Elcmar", "spouse", "Boann", "Erster Herr des Brú na Bóinne"],
  ["Dagda", "lover", "Morrígan", "Die Vereinigung am Samhain vor der Schlacht"],
  ["Midir", "foster_parent", "Aengus", "Aengus wuchs in Brí Léith auf"],
  // Ernmas' daughters
  ["Ernmas", "mother", "Morrígan"],
  ["Ernmas", "mother", "Badb"],
  ["Ernmas", "mother", "Macha"],
  ["Ernmas", "mother", "Ériu"],
  ["Ernmas", "mother", "Banba"],
  ["Ernmas", "mother", "Fódla"],
  ["Morrígan", "sibling", "Badb"],
  ["Morrígan", "sibling", "Macha"],
  ["Ériu", "sibling", "Banba"],
  ["Ériu", "sibling", "Fódla"],
  ["Banba", "sibling", "Fódla"],
  // The three last kings and the land goddesses
  ["Mac Gréine", "spouse", "Ériu"],
  ["Mac Cuill", "spouse", "Banba"],
  ["Mac Cécht", "spouse", "Fódla"],
  // Bres line
  ["Elatha", "father", "Bres", "Der Fomorenfürst kam über das Meer zu Ériu"],
  ["Ériu", "mother", "Bres"],
  ["Bres", "spouse", "Brigid"],
  ["Bres", "father", "Ruadán"],
  ["Brigid", "mother", "Ruadán"],
  // Balor / Lugh line
  ["Néit", "grandparent", "Balor"],
  ["Balor", "spouse", "Cethlenn"],
  ["Balor", "father", "Ethniu"],
  ["Cethlenn", "mother", "Ethniu"],
  ["Dian Cécht", "father", "Cian"],
  ["Cian", "father", "Lugh"],
  ["Ethniu", "mother", "Lugh"],
  ["Balor", "grandparent", "Lugh", "Der Enkel, der ihn laut Prophezeiung töten wird"],
  ["Tailtiu", "foster_parent", "Lugh", "Fir-Bolg-Königin als Ziehmutter"],
  ["Manannán mac Lir", "foster_parent", "Lugh", "Aufgezogen in der Anderswelt"],
  // Dian Cécht's other children
  ["Dian Cécht", "father", "Miach"],
  ["Dian Cécht", "father", "Airmed"],
  ["Miach", "sibling", "Airmed"],
  // Tuirenn
  ["Tuirenn", "father", "Brian mac Tuirenn"],
  ["Tuirenn", "father", "Iuchar"],
  ["Tuirenn", "father", "Iucharba"],
  ["Brian mac Tuirenn", "sibling", "Iuchar"],
  ["Brian mac Tuirenn", "sibling", "Iucharba"],
  ["Iuchar", "sibling", "Iucharba"],
  // Lir / Manannán
  ["Lir", "father", "Manannán mac Lir"],
  ["Lir", "spouse", "Aobh", "Erste Ehe"],
  ["Lir", "spouse", "Aoife", "Zweite Ehe"],
  ["Aobh", "sibling", "Aoife", "Beide Ziehtöchter Bodb Dergs"],
  ["Bodb Derg", "foster_parent", "Aobh"],
  ["Bodb Derg", "foster_parent", "Aoife"],
  ["Lir", "father", "Fionnuala"],
  ["Lir", "father", "Aodh"],
  ["Lir", "father", "Fiachra"],
  ["Lir", "father", "Conn mac Lir"],
  ["Aobh", "mother", "Fionnuala"],
  ["Aobh", "mother", "Aodh"],
  ["Aobh", "mother", "Fiachra"],
  ["Aobh", "mother", "Conn mac Lir"],
  ["Fionnuala", "sibling", "Aodh"],
  ["Fionnuala", "sibling", "Fiachra"],
  ["Fionnuala", "sibling", "Conn mac Lir"],
  ["Fiachra", "sibling", "Conn mac Lir", "Zwillinge"],
  // Étaín cycle
  ["Midir", "spouse", "Étaín"],
  ["Midir", "spouse", "Fuamnach", "Erste Frau, die Zauberin"],
  // Manannán / Niamh (Fenian bridge)
  ["Manannán mac Lir", "father", "Niamh"],
  // Bodb Derg / Sadhbh (Fenian bridge)
  ["Bodb Derg", "father", "Sadhbh"],
  // Milesians
  ["Míl Espáine", "father", "Éber Finn"],
  ["Míl Espáine", "father", "Éremón"],
  ["Míl Espáine", "father", "Donn"],
  ["Míl Espáine", "father", "Amergin"],
  ["Éber Finn", "sibling", "Éremón"],
  ["Donn", "sibling", "Éremón"],
  ["Donn", "sibling", "Éber Finn"],
  ["Amergin", "sibling", "Éber Finn"],
  ["Amergin", "sibling", "Éremón"],
  ["Amergin", "sibling", "Donn"],
];

const FAMILY_ULSTER: FamRel[] = [
  ["Ness", "mother", "Conchobar mac Nessa"],
  ["Cathbad", "father", "Conchobar mac Nessa", "Nach der älteren Überlieferung"],
  ["Cathbad", "father", "Deichtine", "In den Fassungen, die Deichtine Cathbads Tochter nennen"],
  ["Conchobar mac Nessa", "sibling", "Deichtine", "Nach der Fassung, die sie als Schwester nennt"],
  ["Lugh", "father", "Cú Chulainn", "Der göttliche Vater"],
  ["Deichtine", "mother", "Cú Chulainn"],
  ["Sualtam", "father", "Cú Chulainn", "Der irdische Vater"],
  ["Fergus mac Róich", "foster_parent", "Cú Chulainn"],
  ["Conchobar mac Nessa", "foster_parent", "Cú Chulainn"],
  ["Cú Chulainn", "spouse", "Emer"],
  ["Forgall Monach", "father", "Emer"],
  ["Cú Chulainn", "lover", "Aífe"],
  ["Cú Chulainn", "father", "Connla"],
  ["Aífe", "mother", "Connla"],
  ["Scáthach", "sibling", "Aífe", "Rivalinnen und Schwestern in mancher Fassung"],
  ["Medb", "spouse", "Ailill mac Máta"],
  ["Medb", "mother", "Findabair"],
  ["Ailill mac Máta", "father", "Findabair"],
  ["Medb", "lover", "Fergus mac Róich", "Im Exil an Medbs Hof"],
  ["Naoise", "sibling", "Ainnle"],
  ["Naoise", "sibling", "Ardán"],
  ["Ainnle", "sibling", "Ardán"],
  ["Naoise", "lover", "Deirdre"],
  ["Conchobar mac Nessa", "spouse", "Deirdre", "Erzwungen — Deirdre wählte den Tod"],
  ["Leborcham", "foster_parent", "Deirdre"],
  ["Cú Roí", "spouse", "Bláthnat"],
  ["Bláthnat", "lover", "Cú Chulainn"],
  ["Cú Roí", "father", "Lugaid mac Con Roí"],
  ["Cú Chulainn", "foster_parent", "Lugaid Riab nDerg"],
  ["Conall Cernach", "sibling", "Cú Chulainn", "Ziehbrüder"],
];

const FAMILY_FENIAN: FamRel[] = [
  ["Cumhall", "father", "Fionn mac Cumhaill"],
  ["Muirne", "mother", "Fionn mac Cumhaill"],
  ["Tadg mac Nuadat", "father", "Muirne"],
  ["Nuada", "grandparent", "Tadg mac Nuadat", "Die Linie führt zum Silberhand-König"],
  ["Bodhmall", "sibling", "Cumhall"],
  ["Bodhmall", "foster_parent", "Fionn mac Cumhaill"],
  ["Liath Luachra", "foster_parent", "Fionn mac Cumhaill"],
  ["Fionn mac Cumhaill", "spouse", "Sadhbh"],
  ["Fionn mac Cumhaill", "father", "Oisín"],
  ["Sadhbh", "mother", "Oisín"],
  ["Oisín", "father", "Oscar"],
  ["Oisín", "lover", "Niamh"],
  ["Fionn mac Cumhaill", "spouse", "Gráinne", "Die Verlobung, die zur Flucht führte; spät versöhnt"],
  ["Diarmuid Ua Duibhne", "lover", "Gráinne"],
  ["Aengus", "foster_parent", "Diarmuid Ua Duibhne", "Der Liebesgott als Ziehvater"],
  ["Cormac mac Airt", "father", "Gráinne"],
  ["Fionn mac Cumhaill", "nephew", "Caílte mac Rónáin", "Caílte ist Fionns Neffe"],
  ["Goll mac Morna", "sibling", "Conán Maol"],
];

const FAMILY_KINGS: FamRel[] = [
  ["Conn Cétchathach", "father", "Art mac Cuinn"],
  ["Art mac Cuinn", "father", "Cormac mac Airt", "Gezeugt in der Nacht vor Mag Mucrama"],
  ["Cormac mac Airt", "father", "Cairbre Lifechair"],
  ["Cormac mac Airt", "father", "Gráinne"],
  ["Ailill Aulom", "foster_parent", "Lugaid Mac Con"],
  ["Mess Búachalla", "mother", "Conaire Mór"],
  ["Étaín", "grandparent", "Mess Búachalla", "Die Linie der wiedergeborenen Étaín"],
];

// ── Artifacts ────────────────────────────────────────────────────────────
const ARTIFACTS: ArtifactDef[] = [
  { n: "Lia Fáil", alt: ["Stone of Destiny", "Stein von Fál"], t: "treasure", src: "LGE",
    d: "Einer der vier Schätze der Tuatha Dé Danann, aus Falias gebracht. Steht auf Tara.",
    powers: "Schreit auf, wenn der rechtmäßige König Irlands ihn berührt.",
    owners: [["Nuada", "keeper", "Als König der Tuatha Dé Danann"], ["Conn Cétchathach", "other", "Der Stein schrie unter seinem Tritt"]] },
  { n: "Claíomh Solais", alt: ["Sword of Light", "Schwert von Nuada", "Schwert von Findias"], t: "weapon", src: "LGE",
    d: "Einer der vier Schätze, aus Findias gebracht — das Schwert Nuadas.",
    powers: "Niemand entkam ihm, war es einmal gezogen; keine Gegenwehr hielt ihm stand.",
    owners: [["Nuada", "wielder"]] },
  { n: "Sleá Bua", alt: ["Speer von Lugh", "Spear of Lugh", "Areadbhair", "Speer von Gorias"], t: "weapon", src: "ACT",
    d: "Einer der vier Schätze, aus Gorias. In der Fassung der Söhne Tuirenns als Bußgabe vom König von Persien geholt.",
    powers: "Kein Kampf ging je gegen den verloren, der ihn führte; seine Spitze musste in Wasser ruhen, damit sie nicht Feuer fing.",
    owners: [["Lugh", "wielder"], ["Brian mac Tuirenn", "seeker", "Teil des Wergelds für Cian"]] },
  { n: "Coire an Dagda", alt: ["Cauldron of the Dagda", "Kessel des Dagda", "Undry"], t: "vessel", src: "LGE",
    d: "Einer der vier Schätze, aus Murias — der unerschöpfliche Kessel.",
    powers: "Keine Gesellschaft ging unbefriedigt von ihm fort.",
    owners: [["Dagda", "owner"]] },
  { n: "Gáe Bulg", alt: ["Gáe Bolga"], t: "weapon", src: "TAIN",
    d: "Der furchtbare Speer aus dem Knochen eines Seeungeheuers, Geschenk Scáthachs an Cú Chulainn. Mit dem Fuß im Wasser der Furt geworfen.",
    powers: "Dringt als eine Wunde ein und öffnet sich zu dreißig Widerhaken — er kann nur aus dem toten Körper geschnitten werden.",
    owners: [["Scáthach", "creator", "Gab ihn ihrem Schüler"], ["Cú Chulainn", "wielder", "Tötete damit Ferdiad und Connla"]] },
  { n: "Fragarach", alt: ["The Answerer", "Der Antworter"], t: "weapon", src: "ACT",
    d: "Das Schwert Manannáns, später Lughs.",
    powers: "Kein Panzer hält ihm stand; an die Kehle gelegt, zwingt es zur Wahrheit.",
    owners: [["Manannán mac Lir", "owner"], ["Lugh", "wielder", "Vom Ziehvater überlassen"]] },
  { n: "Caladbolg", alt: ["Caladcholg"], t: "weapon", src: "TAIN",
    d: "Das Riesenschwert des Fergus mac Róich.",
    powers: "Sein Hieb fährt wie ein Regenbogen — in der Táin schlägt Fergus damit drei Hügeln die Kuppen ab.",
    owners: [["Fergus mac Róich", "wielder"]] },
  { n: "Uaithne", alt: ["Dagda's Harp", "Dur da Blá"], t: "instrument", src: "CMT",
    d: "Die Eichenharfe des Dagda, von den fliehenden Fomorern geraubt und zurückgeholt.",
    powers: "Kommt auf den Ruf ihres Herrn geflogen; spielt Trauer, Lachen und Schlaf — die drei edlen Weisen.",
    owners: [["Dagda", "owner"]] },
  { n: "Lorg Mór", alt: ["Keule des Dagda", "Club of the Dagda"], t: "weapon", src: "CMT",
    d: "Die gewaltige Keule des Dagda, auf einem Karren gezogen.",
    powers: "Das eine Ende erschlägt neun Männer, das andere erweckt sie wieder zum Leben.",
    owners: [["Dagda", "wielder"]] },
  { n: "Scuabtuinne", alt: ["Wave-Sweeper", "Wellenfeger"], t: "vessel", src: "ACT",
    d: "Manannáns Boot, das ohne Segel und Ruder fährt.",
    powers: "Gehorcht dem Gedanken seines Fahrers und findet jedes Ziel über See.",
    owners: [["Manannán mac Lir", "owner"], ["Lugh", "other", "Lieh es den Söhnen Tuirenns"], ["Brian mac Tuirenn", "other", "Fuhr damit die Bußfahrt"]] },
  { n: "Aonbharr", alt: ["Enbarr", "Splendid Mane"], t: "animal", src: "ACT",
    d: "Manannáns Pferd mit der prächtigen Mähne.",
    powers: "Läuft über Wasser wie über Land; niemand stirbt auf seinem Rücken.",
    owners: [["Manannán mac Lir", "owner"], ["Niamh", "other", "Trug Oisín nach Tír na nÓg"]] },
  { n: "Féth Fíada", alt: ["Cloak of Mists", "Nebelmantel"], t: "garment", src: "ACL",
    d: "Der Nebel(-mantel) Manannáns, der die Tuatha Dé Danann vor Sterblichen verbirgt.",
    powers: "Macht unsichtbar; sein Schwenken trennt Liebende für immer.",
    owners: [["Manannán mac Lir", "owner"]] },
  { n: "Corrbolg", alt: ["Crane Bag", "Kranichbeutel"], t: "vessel", src: "ACS",
    d: "Beutel aus der Haut der Kranichfrau Aoife (einer anderen Aoife), birgt die Schätze Manannáns.",
    powers: "Bei Flut sind die Schätze sichtbar, bei Ebbe verschwinden sie.",
    owners: [["Manannán mac Lir", "creator"], ["Cumhall", "keeper", "Hüter vor seinem Fall"], ["Fionn mac Cumhaill", "owner", "Erbe des Vaters"]] },
  { n: "Mac an Luin", alt: ["Son of the Waves"], t: "weapon", src: "ACS",
    d: "Fionns Schwert.",
    powers: "Ließ nie einen Schlag unvollendet.",
    owners: [["Fionn mac Cumhaill", "wielder"]] },
  { n: "Bratán Feasa", alt: ["Salmon of Knowledge", "Lachs der Weisheit"], t: "animal", src: "MF",
    d: "Der Lachs vom Brunnen der Weisheit, der die neun Haselnüsse des Wissens fraß.",
    powers: "Wer als Erster von ihm kostet, erhält alles Wissen der Welt.",
    owners: [["Finnegas", "seeker", "Angelte ihn sieben Jahre"], ["Fionn mac Cumhaill", "other", "Der verbrannte Daumen gab ihm das Wissen"]] },
  { n: "Moralltach", alt: ["Great Fury"], t: "weapon", src: "TDG",
    d: "Das Schwert Manannáns, von Aengus an Diarmuid gegeben — für den Ernstfall.",
    powers: "Ließ keinen Streich unvollendet, keine Wunde ungetötet.",
    owners: [["Manannán mac Lir", "owner", "Ursprünglicher Herr"], ["Aengus", "keeper"], ["Diarmuid Ua Duibhne", "wielder"]] },
  { n: "Gáe Dearg", alt: ["Red Spear"], t: "weapon", src: "TDG",
    d: "Diarmuids roter Speer für Kämpfe auf Leben und Tod.",
    powers: "Seine Wunden heilten nie.",
    owners: [["Diarmuid Ua Duibhne", "wielder"]] },
  { n: "Gáe Buidhe", alt: ["Yellow Spear"], t: "weapon", src: "TDG",
    d: "Diarmuids gelber Speer für die kleineren Gefahren.",
    owners: [["Diarmuid Ua Duibhne", "wielder"]] },
  { n: "Cup of Truth", alt: ["Becher der Wahrheit", "Cormacs Becher"], t: "vessel", src: "ECH",
    d: "Manannáns Geschenk an Cormac mac Airt.",
    powers: "Drei Lügen zerbrechen ihn, drei Wahrheiten fügen ihn wieder zusammen.",
    owners: [["Manannán mac Lir", "creator"], ["Cormac mac Airt", "owner", "Bis zu seinem Tod, dann kehrte er heim"]] },
  { n: "Craobh Airgid", alt: ["Silver Branch", "Silberzweig"], t: "other", src: "ECH",
    d: "Der Silberzweig mit neun goldenen Äpfeln, mit dem Manannán Cormac in die Anderswelt lockte.",
    powers: "Sein Klang schenkt Schlaf und lässt Kummer vergessen.",
    owners: [["Manannán mac Lir", "owner"], ["Cormac mac Airt", "other", "Tauschte dafür Frau und Kinder — und erhielt alles zurück"]] },
  { n: "Silberarm des Nuada", alt: ["Airgetlám"], t: "other", src: "CMT",
    d: "Die von Dian Cécht geschmiedete Armprothese, die Nuada den Beinamen gab.",
    powers: "Beweglich in jedem Finger und Gelenk wie ein lebender Arm.",
    owners: [["Dian Cécht", "creator"], ["Nuada", "owner"]] },
  { n: "Orna", t: "weapon", src: "CMT",
    d: "Das Schwert des Fomorenkönigs Tethra, von Ogma auf dem Schlachtfeld erbeutet.",
    powers: "Entblößt erzählt es alle Taten, die mit ihm vollbracht wurden.",
    owners: [["Tethra", "owner"], ["Ogma", "other", "Erbeutete es in der zweiten Schlacht"]] },
  { n: "Tathlum", t: "weapon", src: "CMT",
    d: "Der Schleuderstein — in späterer Überlieferung aus Kalk und Blut gehärtet —, mit dem Lugh Balors Auge durchschlug.",
    owners: [["Lugh", "wielder"]] },
];

// ── Events: Mythological Cycle ───────────────────────────────────────────
const EVENTS_MYTHOLOGICAL: EventDef[] = [
  { k: "inv_cessair", n: "Landung der Cessair", t: "journey", cy: "mythological", src: "LGE", era: "Vor der Flut",
    d: "Cessair erreicht mit fünfzig Frauen und drei Männern als erste Siedlerin Irland.",
    chars: [["Cessair", "protagonist"], ["Fintan mac Bóchra", "ally"]] },
  { k: "flood", n: "Die große Flut", t: "other", cy: "mythological", src: "LGE",
    d: "Die Flut vernichtet Cessairs Volk. Nur Fintan mac Bóchra entkommt.",
    chars: [["Cessair", "victim"], ["Fintan mac Bóchra", "protagonist"]] },
  { k: "fintan_shift", n: "Fintans Verwandlungen", t: "transformation", cy: "mythological", src: "LGE",
    d: "Fintan überdauert die Zeitalter als Lachs, Adler und Falke — das Gedächtnis Irlands.",
    chars: [["Fintan mac Bóchra", "protagonist"]] },
  { k: "inv_partholon", n: "Landung Partholóns", t: "journey", cy: "mythological", src: "LGE",
    d: "Partholón erreicht Irland, rodet vier Ebenen, kämpft die erste Schlacht gegen die Fomorer.",
    chars: [["Partholón", "protagonist"]] },
  { k: "partholon_plague", n: "Die Seuche über Partholóns Volk", t: "other", cy: "mythological", src: "LGE",
    d: "Binnen einer Woche rafft eine Seuche die fünftausend des Volkes dahin.",
    chars: [["Partholón", "victim"]] },
  { k: "inv_nemed", n: "Landung Nemeds", t: "journey", cy: "mythological", src: "LGE",
    d: "Nemed erreicht Irland und schlägt die Fomorer in vier Schlachten.",
    chars: [["Nemed", "protagonist"]] },
  { k: "nemed_death", n: "Tod Nemeds", t: "death", cy: "mythological", src: "LGE", lifecycleOf: "Nemed",
    d: "Nemed stirbt an der Seuche; die Fomorer knechten sein Volk.",
    chars: [["Nemed", "victim"]] },
  { k: "tower_conand", n: "Sturm auf Conands Turm", t: "battle", cy: "mythological", src: "LGE",
    d: "Die Nemedier stürmen den Glasturm auf Tory Island und töten Conand — die See verschlingt fast alle Sieger.",
    chars: [["Conand", "antagonist"], ["Nemed", "mentioned"]] },
  { k: "nemed_scatter", n: "Zerstreuung der Nemedier", t: "journey", cy: "mythological", src: "LGE",
    d: "Die Überlebenden fliehen — ihre Nachfahren kehren als Fir Bolg und Tuatha Dé Danann zurück.",
    chars: [] },
  { k: "inv_firbolg", n: "Landung der Fir Bolg", t: "journey", cy: "mythological", src: "LGE",
    d: "Die Fir Bolg kehren aus Griechenland zurück und teilen Irland in fünf Provinzen.",
    chars: [["Sreng", "ally"], ["Eochaid mac Eirc", "protagonist"]] },
  { k: "firbolg_reign", n: "Herrschaft des Eochaid mac Eirc", t: "reign", cy: "mythological", src: "LGE",
    d: "Unter dem gerechten Fir-Bolg-König fällt kein Regen, nur Tau; kein Jahr ohne Ernte.",
    chars: [["Eochaid mac Eirc", "protagonist"]] },
  { k: "inv_tdd", n: "Ankunft der Tuatha Dé Danann", t: "journey", cy: "mythological", src: "LGE",
    d: "Das Göttervolk landet in dunklen Wolken auf den Bergen des Westens und verbrennt die eigenen Schiffe.",
    chars: [["Nuada", "protagonist"], ["Dagda", "ally"], ["Lugh", "mentioned"]],
    artifacts: ["Lia Fáil", "Claíomh Solais", "Sleá Bua", "Coire an Dagda"] },
  { k: "cmt1", n: "Erste Schlacht von Mag Tuired", t: "battle", cy: "mythological", src: "CMT1",
    d: "Tuatha Dé Danann gegen Fir Bolg. Das Göttervolk siegt; Eochaid fällt, Sreng erhält Connacht.",
    chars: [["Nuada", "protagonist"], ["Sreng", "antagonist"], ["Eochaid mac Eirc", "victim"], ["Dagda", "ally"]],
    places: ["Mag Tuired"] },
  { k: "nuada_arm", n: "Nuada verliert den Arm", t: "other", cy: "mythological", src: "CMT1", parent: "cmt1",
    d: "Sreng schlägt Nuada im Zweikampf den rechten Arm ab — ein Makel, der ihn das Königtum kostet.",
    chars: [["Nuada", "victim"], ["Sreng", "antagonist"]], places: ["Mag Tuired"] },
  { k: "eochaid_death", n: "Tod des Eochaid mac Eirc", t: "death", cy: "mythological", src: "CMT1", parent: "cmt1", lifecycleOf: "Eochaid mac Eirc",
    d: "Der letzte Fir-Bolg-König fällt auf der Flucht nach Westen.",
    chars: [["Eochaid mac Eirc", "victim"]] },
  { k: "bres_reign", n: "Herrschaft des Bres", t: "reign", cy: "mythological", src: "CMT",
    d: "Der schöne Halbfomore wird König — und presst die Götter mit Tributen und Frondienst aus.",
    chars: [["Bres", "protagonist"], ["Dagda", "victim", "Musste Wälle graben"], ["Ogma", "victim", "Musste Holz schleppen"]] },
  { k: "first_satire", n: "Die erste Satire Irlands", t: "prophecy", cy: "mythological", src: "CMT",
    d: "Der Dichter Cairbre spricht die erste Satire über den geizigen Bres — »ohne Fett das Messer, ohne Lied der Abend« — und Bres' Glück zerbricht.",
    chars: [["Bres", "victim"]] },
  { k: "silver_arm", n: "Dian Cécht schmiedet den Silberarm", t: "transformation", cy: "mythological", src: "CMT",
    d: "Dian Cécht und Credne fertigen Nuada eine bewegliche Silberhand — der König heißt fortan Airgetlám.",
    chars: [["Dian Cécht", "protagonist"], ["Credne", "ally"], ["Nuada", "victim"]],
    artifacts: ["Silberarm des Nuada"] },
  { k: "miach_healing", n: "Miach heilt Nuadas Arm", t: "transformation", cy: "mythological", src: "CMT",
    d: "»Gelenk an Gelenk, Sehne an Sehne« — Miach lässt in dreimal neun Tagen lebendes Fleisch über den Arm wachsen.",
    chars: [["Miach", "protagonist"], ["Nuada", "ally"]] },
  { k: "miach_death", n: "Dian Cécht erschlägt Miach", t: "death", cy: "mythological", src: "CMT", lifecycleOf: "Miach",
    d: "Aus Neid führt Dian Cécht vier Schwerthiebe gegen den Sohn — den vierten heilt keine Kunst mehr.",
    chars: [["Dian Cécht", "antagonist"], ["Miach", "victim"]] },
  { k: "herbs_airmed", n: "Airmed ordnet die Heilkräuter", t: "other", cy: "mythological", src: "CMT",
    d: "365 Kräuter wachsen aus Miachs Grab; Airmed ordnet sie nach ihren Kräften, doch der Vater wirft sie durcheinander.",
    chars: [["Airmed", "protagonist"], ["Dian Cécht", "antagonist"]] },
  { k: "nuada_restored", n: "Nuada wird wieder König", t: "reign", cy: "mythological", src: "CMT",
    d: "Geheilt nimmt Nuada das Königtum zurück; Bres flieht zu den Fomorern.",
    chars: [["Nuada", "protagonist"], ["Bres", "antagonist"]] },
  { k: "lugh_tara", n: "Lugh kommt nach Tara", t: "meeting", cy: "mythological", src: "CMT",
    d: "Der Samildánach begehrt Einlass: Für jede Kunst hat Tara einen Meister — doch keinen, der alle beherrscht. Nuada räumt ihm den Thron der Schlachtführung ein.",
    chars: [["Lugh", "protagonist"], ["Nuada", "ally"], ["Ogma", "ally"]],
    places: ["Temair"] },
  { k: "cian_death", n: "Die Söhne Tuirenns erschlagen Cian", t: "death", cy: "mythological", src: "ACT", lifecycleOf: "Cian",
    d: "In Schweinsgestalt fliehend wird Cian erkannt und gesteinigt — die Erde gibt den Mord an Lugh preis.",
    chars: [["Cian", "victim"], ["Brian mac Tuirenn", "antagonist"], ["Iuchar", "antagonist"], ["Iucharba", "antagonist"]] },
  { k: "tuirenn_quest", n: "Bußfahrt der Söhne Tuirenns", t: "journey", cy: "mythological", src: "ACT",
    d: "Lughs Wergeld: drei Äpfel, die Schweinshaut, der Speer Areadbhair, Pferde und Wagen, sieben Schweine, ein Hündchen, ein Bratspieß, drei Schreie auf einem Hügel.",
    chars: [["Brian mac Tuirenn", "protagonist"], ["Iuchar", "ally"], ["Iucharba", "ally"], ["Lugh", "antagonist"]],
    artifacts: ["Sleá Bua", "Scuabtuinne"] },
  { k: "tuirenn_deaths", n: "Tod der Söhne Tuirenns", t: "death", cy: "mythological", src: "ACT",
    d: "Von den drei Schreien auf Miodhchaoins Hügel tödlich verwundet, bittet Tuirenn Lugh vergeblich um die heilende Schweinshaut.",
    chars: [["Brian mac Tuirenn", "victim"], ["Iuchar", "victim"], ["Iucharba", "victim"], ["Lugh", "antagonist"], ["Tuirenn", "mentioned"]] },
  { k: "cmt2", n: "Zweite Schlacht von Mag Tuired", t: "battle", cy: "mythological", src: "CMT",
    d: "Die Entscheidungsschlacht: Tuatha Dé Danann gegen die Fomorer unter Balor, Indech und Bres.",
    chars: [["Lugh", "protagonist"], ["Nuada", "ally"], ["Ogma", "ally"], ["Dagda", "ally"], ["Morrígan", "ally"], ["Goibniu", "ally"], ["Balor", "antagonist"], ["Indech", "antagonist"], ["Bres", "antagonist"], ["Cethlenn", "antagonist"]],
    places: ["Mag Tuired"] },
  { k: "dagda_morrigan", n: "Dagda und die Morrígan am Fluss", t: "meeting", cy: "mythological", src: "CMT",
    d: "Am Samhain vor der Schlacht vereinigt sich der Dagda mit der Morrígan über dem Fluss Unius — sie verheißt den Sieg.",
    chars: [["Dagda", "protagonist"], ["Morrígan", "protagonist"]] },
  { k: "dagda_porridge", n: "Dagdas Gang zu den Fomorern", t: "meeting", cy: "mythological", src: "CMT",
    d: "Als Unterhändler muss der Dagda den Riesenbrei aus dem Erdloch essen — Spott der Feinde, Zeitgewinn der Götter.",
    chars: [["Dagda", "protagonist"]] },
  { k: "ruadan_death", n: "Tod des Ruadán", t: "death", cy: "mythological", src: "CMT", parent: "cmt2", lifecycleOf: "Ruadán",
    d: "Als Attentäter gegen Goibniu geschickt, wird Ruadán vom eigenen Speerwurf des Schmieds durchbohrt. Brigids Klage ist das erste Keening.",
    chars: [["Ruadán", "victim"], ["Goibniu", "protagonist"], ["Brigid", "mentioned", "Ihre Totenklage"]] },
  { k: "nuada_death", n: "Balor erschlägt Nuada", t: "death", cy: "mythological", src: "CMT", parent: "cmt2", lifecycleOf: "Nuada",
    d: "Das böse Auge fällt auf den König mit der Silberhand — Nuada und Macha fallen.",
    chars: [["Balor", "antagonist"], ["Nuada", "victim"], ["Macha", "victim"]] },
  { k: "balor_death", n: "Lugh tötet Balor", t: "death", cy: "mythological", src: "CMT", parent: "cmt2", lifecycleOf: "Balor",
    d: "Der Schleuderstein fährt durch das sich öffnende Auge und wendet es gegen das eigene Heer — die Prophezeiung erfüllt sich.",
    chars: [["Lugh", "protagonist"], ["Balor", "victim"]], artifacts: ["Tathlum"] },
  { k: "indech_death", n: "Ogma und Indech fallen", t: "death", cy: "mythological", src: "CMT", parent: "cmt2", lifecycleOf: "Indech",
    d: "Der Champion der Götter und der Fomorenkönig erschlagen einander.",
    chars: [["Ogma", "protagonist"], ["Indech", "victim"]] },
  { k: "bres_spared", n: "Bres wird verschont", t: "meeting", cy: "mythological", src: "CMT", parent: "cmt2",
    d: "Für sein Leben verrät Bres die Geheimnisse von Pflügen, Säen und Ernten.",
    chars: [["Lugh", "protagonist"], ["Bres", "victim"]] },
  { k: "harp_recovery", n: "Rückholung der Harfe Uaithne", t: "journey", cy: "mythological", src: "CMT",
    d: "Dagda, Lugh und Ogma folgen den fliehenden Fomorern; die Harfe springt von der Wand, tötet neun und spielt die drei edlen Weisen.",
    chars: [["Dagda", "protagonist"], ["Lugh", "ally"], ["Ogma", "ally"]],
    artifacts: ["Uaithne"] },
  { k: "morrigan_prophecy", n: "Prophezeiung der Morrígan", t: "prophecy", cy: "mythological", src: "CMT",
    d: "Nach dem Sieg verkündet die Morrígan Frieden bis zum Himmel — und dann das Ende der Welt.",
    chars: [["Morrígan", "protagonist"]] },
  { k: "tailtiu_death", n: "Tod der Tailtiu und die ersten Spiele", t: "death", cy: "mythological", src: "LGE", lifecycleOf: "Tailtiu",
    d: "Lughs Ziehmutter stirbt an der Rodung der Ebenen; er stiftet ihr die Tailteann-Spiele.",
    chars: [["Tailtiu", "victim"], ["Lugh", "protagonist"]], places: ["Tailtiu"] },
  { k: "boann_well", n: "Boann und der Brunnen der Weisheit", t: "transformation", cy: "mythological", src: "DIND",
    d: "Boann umschreitet den verbotenen Brunnen — er bricht aus, verstümmelt sie und wird zum Fluss Boyne.",
    chars: [["Boann", "protagonist"]], places: ["Bóinn"] },
  { k: "aengus_conception", n: "Zeugung und Geburt des Aengus", t: "birth", cy: "mythological", src: "TE", lifecycleOf: "Aengus",
    d: "Der Dagda hält die Sonne neun Monate an: Aengus wird an einem einzigen »Tag« gezeugt und geboren.",
    chars: [["Dagda", "ally"], ["Boann", "ally"], ["Aengus", "protagonist"], ["Elcmar", "victim", "Der betrogene Gemahl"]] },
  { k: "aengus_brug", n: "Aengus gewinnt den Brú na Bóinne", t: "meeting", cy: "mythological", src: "TE",
    d: "»Tag und Nacht« erbittet Aengus den Brú — da alle Zeit aus Tag und Nacht besteht, bleibt er für immer.",
    chars: [["Aengus", "protagonist"], ["Elcmar", "victim"], ["Dagda", "mentioned"], ["Midir", "ally"]],
    places: ["Brú na Bóinne"] },
  { k: "midir_etain", n: "Midir gewinnt Étaín", t: "meeting", cy: "mythological", src: "TE",
    d: "Mit Aengus' Hilfe erhält Midir die schönste Frau Irlands zur Braut.",
    chars: [["Midir", "protagonist"], ["Étaín", "protagonist"], ["Aengus", "ally"]] },
  { k: "fuamnach_curse", n: "Fuamnach verwandelt Étaín", t: "transformation", cy: "mythological", src: "TE",
    d: "Erst Wasserlache, dann Wurm, dann Purpurfliege: Fuamnachs Zauberstab und der Sturmwind treiben Étaín tausend Jahre umher.",
    chars: [["Fuamnach", "antagonist"], ["Étaín", "victim"], ["Aengus", "ally", "Barg die Fliege im Glashaus"]] },
  { k: "fuamnach_death", n: "Aengus enthauptet Fuamnach", t: "death", cy: "mythological", src: "TE", lifecycleOf: "Fuamnach",
    chars: [["Aengus", "protagonist"], ["Fuamnach", "victim"]] },
  { k: "etain_rebirth", n: "Wiedergeburt der Étaín", t: "birth", cy: "mythological", src: "TE",
    d: "Die Fliege fällt in den Becher von Étars Frau — Étaín wird als Menschenkind neu geboren, tausend Jahre nach der ersten Geburt.",
    chars: [["Étaín", "protagonist"]] },
  { k: "eochu_etain", n: "Eochu Airem heiratet Étaín", t: "meeting", cy: "mythological", src: "TE",
    d: "Der Hochkönig findet die Schönste Irlands — ohne zu wissen, wessen Frau sie einst war.",
    chars: [["Étaín", "protagonist"]] },
  { k: "midir_chess", n: "Das Fidchell-Spiel um Étaín", t: "meeting", cy: "mythological", src: "TE",
    d: "Midir verliert absichtlich Spiel um Spiel — und fordert als letzten Einsatz einen Kuss von Étaín. Als Schwäne entschweben beide durch das Rauchloch.",
    chars: [["Midir", "protagonist"], ["Étaín", "protagonist"]],
    places: ["Temair"] },
  { k: "lir_aobh", n: "Lir heiratet Aobh", t: "meeting", cy: "mythological", src: "ACL",
    d: "Zur Versöhnung nach der Königswahl gibt Bodb Derg Lir seine Ziehtochter Aobh.",
    chars: [["Lir", "protagonist"], ["Aobh", "protagonist"], ["Bodb Derg", "ally"]] },
  { k: "lir_children_birth", n: "Geburt der Kinder Lirs", t: "birth", cy: "mythological", src: "ACL",
    d: "Fionnuala, Aodh und die Zwillinge Fiachra und Conn; Aobh stirbt bei der zweiten Geburt.",
    chars: [["Fionnuala", "protagonist"], ["Aodh", "protagonist"], ["Fiachra", "protagonist"], ["Conn mac Lir", "protagonist"], ["Aobh", "victim"]] },
  { k: "aoife_curse", n: "Aoifes Fluch", t: "transformation", cy: "mythological", src: "ACL",
    d: "Am Lough Derravaragh verwandelt die eifersüchtige Stiefmutter die vier Kinder in Schwäne — 900 Jahre, bis Glocke und neuer Glaube sie erlösen.",
    chars: [["Aoife", "antagonist"], ["Fionnuala", "victim"], ["Aodh", "victim"], ["Fiachra", "victim"], ["Conn mac Lir", "victim"]],
    places: ["Loch Dairbhreach"] },
  { k: "aoife_punished", n: "Bodb Derg bestraft Aoife", t: "transformation", cy: "mythological", src: "ACL",
    d: "Bodb Derg verwandelt Aoife in einen Dämon der Lüfte — auf immer.",
    chars: [["Bodb Derg", "protagonist"], ["Aoife", "victim"]] },
  { k: "swans_moyle", n: "Die Schwäne auf der Sea of Moyle", t: "journey", cy: "mythological", src: "ACL",
    d: "Dreihundert Jahre Sturm und Eis zwischen Irland und Alba; Fionnuala birgt die Brüder unter ihren Flügeln.",
    chars: [["Fionnuala", "protagonist"], ["Aodh", "ally"], ["Fiachra", "ally"], ["Conn mac Lir", "ally"]],
    places: ["Sruth na Maoile"] },
  { k: "swans_irrus", n: "Die Schwäne vor Irrus Domnann", t: "journey", cy: "mythological", src: "ACL",
    d: "Die letzten dreihundert Jahre an der Westsee.",
    chars: [["Fionnuala", "protagonist"], ["Aodh", "ally"], ["Fiachra", "ally"], ["Conn mac Lir", "ally"]],
    places: ["Irrus Domnann"] },
  { k: "swans_release", n: "Erlösung und Tod der Kinder Lirs", t: "death", cy: "mythological", src: "ACL",
    d: "Beim Klang der Glocke fällt das Federkleid: vier uralte Menschen, die getauft sterben und in einem Grab ruhen.",
    chars: [["Fionnuala", "victim"], ["Aodh", "victim"], ["Fiachra", "victim"], ["Conn mac Lir", "victim"]] },
  { k: "inv_milesians", n: "Landung der Milesier", t: "journey", cy: "mythological", src: "LGE",
    d: "Die Söhne Míls kommen, Íths Tod zu rächen. Der Druidensturm der Danann zerschellt an Amergins Lied.",
    chars: [["Amergin", "protagonist"], ["Éber Finn", "ally"], ["Éremón", "ally"], ["Donn", "ally"]] },
  { k: "amergin_song", n: "Das Lied des Amergin", t: "prophecy", cy: "mythological", src: "LGE",
    d: "»Ich bin der Wind auf dem Meer« — mit dem ersten Fuß auf irischem Boden nimmt der Dichter die Insel in Besitz.",
    chars: [["Amergin", "protagonist"]] },
  { k: "donn_death", n: "Tod des Donn", t: "death", cy: "mythological", src: "LGE", lifecycleOf: "Donn",
    d: "Donn schmäht Ériu und ertrinkt vor der Südwestküste — sein Felsen wird das Haus der Toten.",
    chars: [["Donn", "victim"], ["Ériu", "mentioned"]],
    places: ["Tech Duinn"] },
  { k: "three_queens", n: "Die drei Königinnen empfangen die Milesier", t: "meeting", cy: "mythological", src: "LGE",
    d: "Ériu, Banba und Fódla erbitten je, dass die Insel ihren Namen trage — Amergin verspricht es Ériu.",
    chars: [["Ériu", "protagonist"], ["Banba", "ally"], ["Fódla", "ally"], ["Amergin", "protagonist"]],
    places: ["Uisneach"] },
  { k: "battle_tailtiu", n: "Schlacht von Tailtiu", t: "battle", cy: "mythological", src: "LGE",
    d: "Die Milesier schlagen die Tuatha Dé Danann; die drei Könige und die drei Königinnen fallen.",
    chars: [["Éremón", "protagonist"], ["Éber Finn", "ally"], ["Mac Cuill", "victim"], ["Mac Cécht", "victim"], ["Mac Gréine", "victim"], ["Ériu", "victim"], ["Banba", "victim"], ["Fódla", "victim"]],
    places: ["Tailtiu"] },
  { k: "tdd_underground", n: "Rückzug in die Síde", t: "journey", cy: "mythological", src: "LGE",
    d: "Die Tuatha Dé Danann nehmen die Hügel Irlands: Jedem weist der Dagda (in anderen Fassungen Manannán) ein Síd zu; der Nebelmantel verbirgt sie fortan.",
    chars: [["Dagda", "protagonist"], ["Manannán mac Lir", "protagonist"], ["Bodb Derg", "ally"], ["Midir", "ally"], ["Aengus", "ally"]],
    artifacts: ["Féth Fíada"] },
  { k: "eber_eremon", n: "Bruderkrieg: Éber gegen Éremón", t: "battle", cy: "mythological", src: "LGE",
    d: "Nach einem Jahr geteilter Herrschaft fällt Éber Finn — Éremón wird erster Alleinkönig der Gaelen.",
    chars: [["Éremón", "protagonist"], ["Éber Finn", "victim"]] },
];

// Relations within the Mythological Cycle
const RELS_MYTHOLOGICAL: EventRel[] = [
  ["inv_cessair", "before", "flood", "certain", "Cessair landet vor der Flut"],
  ["flood", "causes", "fintan_shift", "certain", "Fintan überlebt die Flut durch Verwandlung"],
  ["flood", "before", "inv_partholon", "certain", "Partholón kommt nach der Flut"],
  ["inv_partholon", "before", "partholon_plague", "certain", "Die Seuche trifft das gelandete Volk"],
  ["partholon_plague", "before", "inv_nemed", "certain", "Irland liegt leer, ehe Nemed kommt"],
  ["inv_nemed", "before", "nemed_death", "certain", "Nemed stirbt nach der Landnahme"],
  ["nemed_death", "causes", "tower_conand", "probable", "Die Knechtschaft nach Nemeds Tod führt zum Aufstand"],
  ["tower_conand", "causes", "nemed_scatter", "certain", "Nach dem Pyrrhussieg zerstreuen sich die Überlebenden"],
  ["nemed_scatter", "before", "inv_firbolg", "certain", "Die Fir Bolg sind zurückkehrende Nemedier"],
  ["inv_firbolg", "before", "firbolg_reign", "certain", ""],
  ["nemed_scatter", "before", "inv_tdd", "certain", "Auch die Tuatha Dé Danann stammen von Nemed"],
  ["firbolg_reign", "before", "inv_tdd", "certain", "Die Danann treffen auf die herrschenden Fir Bolg"],
  ["inv_tdd", "causes", "cmt1", "certain", "Die Landnahme erzwingt die Schlacht"],
  ["cmt1", "contains", "nuada_arm", "certain", "Zweikampf innerhalb der Schlacht"],
  ["cmt1", "contains", "eochaid_death", "certain", ""],
  ["nuada_arm", "causes", "bres_reign", "certain", "Der Makel kostet Nuada das Königtum"],
  ["nuada_arm", "causes", "silver_arm", "certain", "Die Prothese antwortet auf den Verlust"],
  ["bres_reign", "causes", "first_satire", "certain", "Bres' Geiz provoziert die Satire"],
  ["silver_arm", "before", "miach_healing", "certain", "Miach ersetzt die Prothese durch Fleisch"],
  ["miach_healing", "causes", "miach_death", "certain", "Der Neid des Vaters folgt der besseren Heilung"],
  ["miach_death", "causes", "herbs_airmed", "certain", "Die Kräuter wachsen aus Miachs Grab"],
  ["miach_healing", "causes", "nuada_restored", "certain", "Der geheilte Nuada wird wieder König"],
  ["first_satire", "causes", "nuada_restored", "probable", "Die Satire beendet Bres' Herrschaft"],
  ["nuada_restored", "before", "lugh_tara", "certain", "Lugh tritt vor König Nuada"],
  ["lugh_tara", "before", "cian_death", "probable", "Cian fällt auf dem Weg, Lughs Heer zu sammeln"],
  ["cian_death", "causes", "tuirenn_quest", "certain", "Das Wergeld für den Mord"],
  ["tuirenn_quest", "causes", "tuirenn_deaths", "certain", "Die letzte Aufgabe wird tödlich"],
  ["tuirenn_quest", "before", "cmt2", "certain", "Die Gaben rüsten Lugh für die Schlacht"],
  ["nuada_restored", "before", "cmt2", "certain", ""],
  ["dagda_morrigan", "before", "cmt2", "certain", "Samhain-Begegnung vor der Schlacht"],
  ["dagda_porridge", "before", "cmt2", "certain", "Unterhandlung vor der Schlacht"],
  ["ruadan_death", "before", "nuada_death", "probable", "Die Attentate gehen der Hauptschlacht voraus"],
  ["cmt2", "contains", "ruadan_death", "certain", ""],
  ["cmt2", "contains", "nuada_death", "certain", ""],
  ["cmt2", "contains", "balor_death", "certain", ""],
  ["cmt2", "contains", "indech_death", "certain", ""],
  ["cmt2", "contains", "bres_spared", "certain", ""],
  ["nuada_death", "before", "balor_death", "certain", "Lugh rächt den gefallenen König"],
  ["balor_death", "before", "bres_spared", "certain", "Nach der Entscheidung wird Bres geschont"],
  ["cmt2", "causes", "harp_recovery", "certain", "Die fliehenden Fomorer rauben die Harfe"],
  ["cmt2", "causes", "morrigan_prophecy", "certain", "Der Siegesspruch nach der Schlacht"],
  ["cmt2", "before", "tailtiu_death", "probable", "Die Spiele werden nach dem Frieden gestiftet"],
  ["boann_well", "before", "aengus_conception", "speculative", "Boanns Fluss prägt die Landschaft der Erzählung"],
  ["aengus_conception", "before", "aengus_brug", "certain", "Aengus muss erst geboren werden"],
  ["aengus_brug", "before", "midir_etain", "certain", "Midir besucht den Ziehsohn im Brú"],
  ["midir_etain", "causes", "fuamnach_curse", "certain", "Die Eifersucht der ersten Frau"],
  ["fuamnach_curse", "causes", "fuamnach_death", "certain", "Aengus rächt Étaín"],
  ["fuamnach_curse", "causes", "etain_rebirth", "certain", "Die Fliege fällt in den Becher"],
  ["etain_rebirth", "before", "eochu_etain", "certain", "Die Wiedergeborene wird Königin"],
  ["eochu_etain", "before", "midir_chess", "certain", "Midir fordert die einstige Frau zurück"],
  ["morrigan_prophecy", "before", "lir_aobh", "probable", "Die Lir-Sage setzt nach den Schlachten ein"],
  ["battle_tailtiu", "before", "lir_aobh", "probable", "Die Königswahl der Síde folgt dem Rückzug"],
  ["lir_aobh", "before", "lir_children_birth", "certain", ""],
  ["lir_children_birth", "before", "aoife_curse", "certain", ""],
  ["aoife_curse", "causes", "aoife_punished", "certain", ""],
  ["aoife_curse", "causes", "swans_moyle", "certain", "Die zweite Station des Fluchs"],
  ["swans_moyle", "before", "swans_irrus", "certain", "Die dritte Station des Fluchs"],
  ["swans_irrus", "before", "swans_release", "certain", "Die Erlösung nach 900 Jahren"],
  ["midir_chess", "before", "inv_milesians", "speculative", "Die Étaín-Sage liegt vor der Landnahme der Gaelen"],
  ["tailtiu_death", "before", "inv_milesians", "probable", ""],
  ["inv_milesians", "contains", "amergin_song", "certain", "Das Lied beim ersten Schritt an Land"],
  ["inv_milesians", "contains", "donn_death", "certain", "Donn ertrinkt bei der Landung"],
  ["inv_milesians", "before", "three_queens", "certain", ""],
  ["three_queens", "before", "battle_tailtiu", "certain", ""],
  ["battle_tailtiu", "causes", "tdd_underground", "certain", "Die Niederlage treibt die Götter in die Hügel"],
  ["battle_tailtiu", "before", "eber_eremon", "certain", "Erst siegen, dann streiten die Brüder"],
  ["tdd_underground", "before", "swans_release", "certain", "Die Erlösung liegt am Ende des Danann-Zeitalters"],
];

// ── Events: Ulster Cycle ─────────────────────────────────────────────────
const EVENTS_ULSTER: EventDef[] = [
  { k: "conchobar_birth", n: "Geburt Conchobars", t: "birth", cy: "ulster", src: "TAIN", lifecycleOf: "Conchobar mac Nessa",
    d: "Ness gebiert Conchobar in der Stunde, die Cathbad als Geburtsstunde eines Königs weissagt.",
    chars: [["Ness", "protagonist"], ["Cathbad", "ally"], ["Conchobar mac Nessa", "protagonist"]] },
  { k: "conchobar_king", n: "Conchobar wird König von Ulster", t: "reign", cy: "ulster", src: "TAIN",
    d: "Ness erlistet Fergus das Königtum für ein Jahr — die Ulter geben es nie zurück.",
    chars: [["Conchobar mac Nessa", "protagonist"], ["Ness", "ally"], ["Fergus mac Róich", "victim"]],
    places: ["Emain Macha"] },
  { k: "macha_curse", n: "Machas Fluch über Ulster", t: "prophecy", cy: "ulster", src: "TAIN",
    d: "Hochschwanger zum Wettlauf gegen die Königspferde gezwungen, verflucht Macha die Männer Ulsters: In der Stunde höchster Not sollen sie die Wehen einer Gebärenden leiden — neun Generationen lang.",
    chars: [["Macha", "protagonist"], ["Conchobar mac Nessa", "antagonist"]],
    places: ["Emain Macha"] },
  { k: "cu_birth", n: "Geburt des Sétanta", t: "birth", cy: "ulster", src: "TAIN", lifecycleOf: "Cú Chulainn",
    d: "Deichtine gebiert den Sohn des Lichtgottes Lugh — Sétanta, der Cú Chulainn werden wird.",
    chars: [["Deichtine", "protagonist"], ["Lugh", "ally"], ["Sualtam", "ally"], ["Cú Chulainn", "protagonist"]],
    places: ["Mag Muirthemne"] },
  { k: "hound_culann", n: "Sétanta tötet Culanns Hund", t: "meeting", cy: "ulster", src: "TAIN",
    d: "Der Knabe erschlägt den Wachhund des Schmieds mit dem Hurlingball — und dient als Ersatz: Fortan heißt er Cú Chulainn, Culanns Hund.",
    chars: [["Cú Chulainn", "protagonist"], ["Culann", "victim"], ["Cathbad", "mentioned", "Gab den neuen Namen"]] },
  { k: "cu_arms", n: "Cú Chulainn nimmt die Waffen", t: "other", cy: "ulster", src: "TAIN",
    d: "Cathbad weissagt: Wer heute die Waffen nimmt, wird ewigen Ruhm und kurzes Leben haben. Der Knabe hört es — und zerbricht siebzehn Waffensätze, bis Conchobars eigene ihn aushalten.",
    chars: [["Cú Chulainn", "protagonist"], ["Cathbad", "ally"], ["Conchobar mac Nessa", "ally"]],
    places: ["Emain Macha"] },
  { k: "emer_wooing", n: "Die Werbung um Emer", t: "meeting", cy: "ulster", src: "TEM",
    d: "In Rätselreden werben Cú Chulainn und Emer umeinander; Forgall verlangt die Ausbildung bei Scáthach — hoffend, sie werde tödlich enden.",
    chars: [["Cú Chulainn", "protagonist"], ["Emer", "protagonist"], ["Forgall Monach", "antagonist"]] },
  { k: "scathach_training", n: "Ausbildung bei Scáthach", t: "journey", cy: "ulster", src: "TEM",
    d: "Auf Skye lernt Cú Chulainn den Heldensprung und den Gáe Bulg; Ferdiad wird sein Waffenbruder.",
    chars: [["Cú Chulainn", "protagonist"], ["Scáthach", "ally"], ["Ferdiad", "ally"]],
    places: ["Dún Scáith"], artifacts: ["Gáe Bulg"] },
  { k: "aife_duel", n: "Zweikampf mit Aífe", t: "battle", cy: "ulster", src: "AOA",
    d: "Cú Chulainn bezwingt die härteste Kriegerin der Welt mit einer List — und zeugt mit ihr den Sohn Connla.",
    chars: [["Cú Chulainn", "protagonist"], ["Aífe", "antagonist"], ["Scáthach", "mentioned"]] },
  { k: "connla_birth", n: "Geburt des Connla", t: "birth", cy: "ulster", src: "AOA", lifecycleOf: "Connla",
    d: "Aífe gebiert Connla; der Vater hinterlässt Ring und drei Geasa: nicht umkehren, sich niemandem nennen, keinem Kampf ausweichen.",
    chars: [["Aífe", "protagonist"], ["Connla", "protagonist"]] },
  { k: "forgall_death", n: "Brautraub und Tod Forgalls", t: "death", cy: "ulster", src: "TEM", lifecycleOf: "Forgall Monach",
    d: "Cú Chulainn stürmt Forgalls Festung, springt über drei Wälle — Forgall stürzt auf der Flucht vom eigenen Wall.",
    chars: [["Cú Chulainn", "protagonist"], ["Forgall Monach", "victim"], ["Emer", "ally"]] },
  { k: "cu_emer_marriage", n: "Hochzeit von Cú Chulainn und Emer", t: "meeting", cy: "ulster", src: "TEM",
    chars: [["Cú Chulainn", "protagonist"], ["Emer", "protagonist"]],
    places: ["Emain Macha"] },
  { k: "connla_death", n: "Cú Chulainn tötet Connla", t: "death", cy: "ulster", src: "AOA", lifecycleOf: "Connla",
    d: "Der namenlose Knabe aus Alba weicht keinem Kampf: Erst der Gáe Bulg fällt ihn — dann erkennt der Vater den Ring am Finger des Sohnes.",
    chars: [["Cú Chulainn", "protagonist"], ["Connla", "victim"], ["Emer", "mentioned", "Warnte vergeblich"]],
    artifacts: ["Gáe Bulg"] },
  { k: "deirdre_prophecy", n: "Cathbads Prophezeiung über Deirdre", t: "prophecy", cy: "ulster", src: "LMU",
    d: "Noch im Mutterleib schreit das Kind auf: Schönheit, um die Könige kämpfen — Verderben über Ulster.",
    chars: [["Cathbad", "protagonist"], ["Deirdre", "mentioned"], ["Conchobar mac Nessa", "ally", "Beansprucht das Kind für sich"]] },
  { k: "deirdre_birth", n: "Geburt Deirdres", t: "birth", cy: "ulster", src: "LMU", lifecycleOf: "Deirdre",
    chars: [["Deirdre", "protagonist"], ["Leborcham", "ally", "Ihre Erzieherin"]] },
  { k: "deirdre_flight", n: "Flucht Deirdres und der Söhne Uislius", t: "journey", cy: "ulster", src: "LMU",
    d: "Deirdre zwingt Naoise mit einer Geis; mit Ainnle und Ardán fliehen sie nach Alba, in die Wildnis von Glen Etive.",
    chars: [["Deirdre", "protagonist"], ["Naoise", "protagonist"], ["Ainnle", "ally"], ["Ardán", "ally"], ["Conchobar mac Nessa", "antagonist"]],
    places: ["Glen Etive"] },
  { k: "naoise_death", n: "Mord an den Söhnen Uislius", t: "death", cy: "ulster", src: "LMU", lifecycleOf: "Naoise",
    d: "Unter Fergus' Schutzwort zurückgelockt, werden Naoise und seine Brüder in Emain Macha erschlagen — Conchobars Wort bricht.",
    chars: [["Naoise", "victim"], ["Ainnle", "victim"], ["Ardán", "victim"], ["Eogan mac Durthacht", "antagonist"], ["Conchobar mac Nessa", "antagonist"], ["Deirdre", "mentioned"]],
    places: ["Emain Macha"] },
  { k: "fergus_exile", n: "Fergus' Exil nach Connacht", t: "journey", cy: "ulster", src: "TAIN",
    d: "Sein gebrochenes Schutzwort treibt Fergus mit dreitausend Ultern an Medbs Hof — Ulsters Schwert in Connachts Diensten.",
    chars: [["Fergus mac Róich", "protagonist"], ["Conchobar mac Nessa", "antagonist"], ["Medb", "ally"]],
    places: ["Cruachan"] },
  { k: "deirdre_death", n: "Tod Deirdres", t: "death", cy: "ulster", src: "LMU", lifecycleOf: "Deirdre",
    d: "Ein Jahr bei Conchobar, ohne Lächeln. Dem nächsten Peiniger übergeben, stürzt sie sich aus dem fahrenden Wagen gegen den Fels.",
    chars: [["Deirdre", "victim"], ["Conchobar mac Nessa", "antagonist"]] },
  { k: "pigkeepers", n: "Der Streit der Schweinehirten", t: "transformation", cy: "ulster", src: "TAIN",
    d: "Friuch und Rucht, Schweinehirten zweier Síd-Könige, bekriegen einander durch Gestalten — als Raben, Wassertiere, Krieger, Würmer — bis zwei Kühe sie als Stiere gebären: Donn Cúailnge und Finnbennach.",
    chars: [["Donn Cúailnge", "protagonist"], ["Finnbennach", "protagonist"]] },
  { k: "pillow_talk", n: "Das Kissengespräch von Cruachan", t: "meeting", cy: "ulster", src: "TAIN",
    d: "Medb und Ailill zählen ihre Schätze: Gleichstand — bis auf Finnbennach. Medb braucht den braunen Stier von Cooley.",
    chars: [["Medb", "protagonist"], ["Ailill mac Máta", "protagonist"], ["Finnbennach", "mentioned"], ["Donn Cúailnge", "mentioned"]],
    places: ["Cruachan"] },
  { k: "daire_refusal", n: "Dáires Weigerung", t: "meeting", cy: "ulster", src: "TAIN",
    d: "Dáire will den Stier leihen — bis ein trunkener Bote prahlt, man hätte ihn auch mit Gewalt geholt.",
    chars: [["Dáire mac Fiachna", "protagonist"], ["Medb", "antagonist"], ["Donn Cúailnge", "mentioned"]],
    places: ["Cúailnge"] },
  { k: "tain_muster", n: "Aufbruch des Heeres von Connacht", t: "journey", cy: "ulster", src: "TAIN",
    d: "Vier Provinzen sammeln sich unter Medb und Ailill; Fergus führt — und führt in die Irre, seinem alten Land zuliebe.",
    chars: [["Medb", "protagonist"], ["Ailill mac Máta", "ally"], ["Fergus mac Róich", "ally"], ["Ferdiad", "ally"]],
    places: ["Cruachan"] },
  { k: "fedelm_prophecy", n: "Fedelms Prophezeiung", t: "prophecy", cy: "ulster", src: "TAIN",
    d: "Die Seherin auf dem Wagen: »Ich sehe das Heer purpurrot, ich sehe es rot.«",
    chars: [["Fedelm", "protagonist"], ["Medb", "victim"]] },
  { k: "tain_defense", n: "Cú Chulainns Einzelverteidigung", t: "battle", cy: "ulster", src: "TAIN",
    d: "Während Ulster in Machas Wehen liegt, hält der Siebzehnjährige das Heer am Furtenrecht auf: jeden Tag ein Zweikampf.",
    chars: [["Cú Chulainn", "protagonist"], ["Láeg", "ally"], ["Medb", "antagonist"], ["Fergus mac Róich", "other", "Vermittelt das Furtenrecht"]],
    places: ["Cúailnge", "Mag Muirthemne"] },
  { k: "morrigan_cu", n: "Die Morrígan und Cú Chulainn", t: "meeting", cy: "ulster", src: "TAIN", parent: "tain_defense",
    d: "Als Jungfrau verschmäht, greift sie ihn als Aal, Wölfin und Färse an — verwundet segnet er sie unwissentlich mit drei Heilungen.",
    chars: [["Morrígan", "antagonist"], ["Cú Chulainn", "protagonist"]] },
  { k: "lugh_heals", n: "Lugh heilt den Sohn", t: "meeting", cy: "ulster", src: "TAIN", parent: "tain_defense",
    d: "Drei Tage steht der göttliche Vater am Wall und singt den zerschundenen Helden in den Schlaf der Heilung; die Knabenschar von Emain fällt derweil.",
    chars: [["Lugh", "protagonist"], ["Cú Chulainn", "victim"]] },
  { k: "ferdiad_duel", n: "Der Kampf an der Furt: Ferdiad", t: "battle", cy: "ulster", src: "TAIN", parent: "tain_defense",
    d: "Drei Tage kämpfen die Waffenbrüder; nachts teilen sie Heilkräuter und Speise. Am vierten Tag steigt der Gáe Bulg aus dem Wasser.",
    chars: [["Cú Chulainn", "protagonist"], ["Ferdiad", "antagonist"], ["Medb", "antagonist", "Trieb Ferdiad mit List in den Kampf"], ["Láeg", "ally"]],
    places: ["Áth Fhirdiad"], artifacts: ["Gáe Bulg"] },
  { k: "ferdiad_death", n: "Tod des Ferdiad", t: "death", cy: "ulster", src: "TAIN", parent: "ferdiad_duel", lifecycleOf: "Ferdiad",
    d: "»Alles Spiel war mir Spiel, bis Ferdiad an der Furt stand.« Cú Chulainn trägt den toten Freund selbst ans Nordufer.",
    chars: [["Cú Chulainn", "protagonist"], ["Ferdiad", "victim"]],
    places: ["Áth Fhirdiad"] },
  { k: "sualtam_death", n: "Sualtams Ruf und Tod", t: "death", cy: "ulster", src: "TAIN", lifecycleOf: "Sualtam",
    d: "»Männer werden gemordet, Frauen geraubt, Rinder getrieben!« Der scharfe Schildrand nimmt Sualtam das Haupt — das Haupt ruft weiter, bis Ulster erwacht.",
    chars: [["Sualtam", "victim"], ["Conchobar mac Nessa", "mentioned"]],
    places: ["Emain Macha"] },
  { k: "ulster_rising", n: "Ulster erwacht", t: "other", cy: "ulster", src: "TAIN",
    d: "Machas Fluch fällt ab; Conchobar sammelt die Ulter zur Schlacht.",
    chars: [["Conchobar mac Nessa", "protagonist"], ["Conall Cernach", "ally"], ["Lóegaire Búadach", "ally"]] },
  { k: "gairech_battle", n: "Schlacht von Gáirech", t: "battle", cy: "ulster", src: "TAIN",
    d: "Die Heere prallen aufeinander; Fergus' Caladbolg schlägt drei Hügeln die Kuppen ab, doch er weicht dem Ziehsohn — Connacht flieht.",
    chars: [["Conchobar mac Nessa", "protagonist"], ["Cú Chulainn", "protagonist"], ["Fergus mac Róich", "antagonist"], ["Medb", "antagonist"], ["Ailill mac Máta", "antagonist"]],
    artifacts: ["Caladbolg"] },
  { k: "bull_fight", n: "Der Kampf der Stiere", t: "battle", cy: "ulster", src: "TAIN",
    d: "Donn Cúailnge zerreißt Finnbennach und trägt die Fetzen durch Irland — dann bricht ihm das Herz. Die Namen der Orte bewahren die Stücke.",
    chars: [["Donn Cúailnge", "protagonist"], ["Finnbennach", "victim"]],
    places: ["Cruachan"] },
  { k: "bulls_death", n: "Tod der beiden Stiere", t: "death", cy: "ulster", src: "TAIN", parent: "bull_fight", lifecycleOf: "Donn Cúailnge",
    chars: [["Donn Cúailnge", "victim"], ["Finnbennach", "victim"]] },
  { k: "bricriu_feast", n: "Bricrius Fest", t: "meeting", cy: "ulster", src: "FB",
    d: "Giftzunge lädt und hetzt: Wem gebührt der Heldenbissen? Cú Chulainn, Conall und Lóegaire streiten — und ihre Frauen um den Vortritt.",
    chars: [["Bricriu", "protagonist"], ["Cú Chulainn", "ally"], ["Conall Cernach", "ally"], ["Lóegaire Búadach", "ally"], ["Emer", "ally"]] },
  { k: "beheading_game", n: "Das Enthauptungsspiel", t: "meeting", cy: "ulster", src: "FB",
    d: "Der Riese bietet den Tausch: sein Haupt heute, deines morgen. Nur Cú Chulainn hält das Wort — Cú Roís Beilrücken schont den einzig Wahrhaftigen.",
    chars: [["Cú Roí", "protagonist", "Der verkleidete Riese"], ["Cú Chulainn", "protagonist"], ["Conall Cernach", "victim", "Wich dem Gegenschlag aus"], ["Lóegaire Búadach", "victim", "Wich dem Gegenschlag aus"]] },
  { k: "curoi_death", n: "Tod des Cú Roí", t: "death", cy: "ulster", src: "FB", lifecycleOf: "Cú Roí",
    d: "Bláthnat verrät das Geheimnis seiner Seele; die Milch im Bach gibt das Zeichen, Cú Chulainn stürmt die Festung.",
    chars: [["Cú Chulainn", "protagonist"], ["Cú Roí", "victim"], ["Bláthnat", "ally", "Die Verräterin aus Liebe"]] },
  { k: "blathnat_death", n: "Tod der Bláthnat", t: "death", cy: "ulster", src: "FB", lifecycleOf: "Bláthnat",
    d: "Cú Roís Dichter Ferchertne reißt sie von der Klippe — Verräterin und Rächer stürzen vereint.",
    chars: [["Bláthnat", "victim"]] },
  { k: "cu_death", n: "Tod Cú Chulainns", t: "death", cy: "ulster", src: "TAIN", lifecycleOf: "Cú Chulainn",
    d: "Von gebrochenen Geasa geschwächt — Hundefleisch vom Wegesrand —, von Lugaids Speer durchbohrt, bindet er sich an den Stein. Erst als der Rabe auf der Schulter sitzt, wagen sich die Feinde heran.",
    chars: [["Cú Chulainn", "victim"], ["Lugaid mac Con Roí", "antagonist"], ["Medb", "antagonist", "Schmiedete das Bündnis der Rache"], ["Láeg", "victim"], ["Morrígan", "mentioned", "Der Rabe auf der Schulter"]],
    places: ["Mag Muirthemne"] },
  { k: "conall_revenge", n: "Conalls Rache", t: "battle", cy: "ulster", src: "TAIN",
    d: "Conall Cernach jagt die Mörder und kehrt mit Lugaids Haupt zurück.",
    chars: [["Conall Cernach", "protagonist"], ["Lugaid mac Con Roí", "victim"]] },
];

const RELS_ULSTER: EventRel[] = [
  ["conchobar_birth", "before", "conchobar_king", "certain", ""],
  ["conchobar_king", "before", "macha_curse", "probable", "Der Fluch fällt in Conchobars Herrschaft"],
  ["conchobar_king", "before", "cu_birth", "certain", "Deichtine gehört zu Conchobars Hof"],
  ["cu_birth", "before", "hound_culann", "certain", "Sétanta ist sieben Jahre alt"],
  ["hound_culann", "before", "cu_arms", "certain", "Die Waffennahme folgt den Knabentaten"],
  ["cu_arms", "before", "emer_wooing", "certain", ""],
  ["emer_wooing", "causes", "scathach_training", "certain", "Forgalls Bedingung"],
  ["scathach_training", "contains", "aife_duel", "certain", "Der Feldzug gegen Aífe während der Lehrzeit"],
  ["aife_duel", "causes", "connla_birth", "certain", ""],
  ["scathach_training", "before", "forgall_death", "certain", "Die Heimkehr bringt den Brautraub"],
  ["forgall_death", "causes", "cu_emer_marriage", "certain", ""],
  ["connla_birth", "before", "connla_death", "certain", "Connla wächst in Alba heran"],
  ["cu_emer_marriage", "before", "connla_death", "probable", "Emer warnt den Gatten vor dem eigenen Sohn"],
  ["deirdre_prophecy", "meets", "deirdre_birth", "certain", "Der Schrei aus dem Mutterleib"],
  ["deirdre_birth", "before", "deirdre_flight", "certain", ""],
  ["deirdre_flight", "before", "naoise_death", "certain", "Die Rückkehr unter Schutzwort"],
  ["naoise_death", "causes", "fergus_exile", "certain", "Das gebrochene Schutzwort"],
  ["naoise_death", "causes", "deirdre_death", "certain", "Deirdre überlebt Naoise nur ein Jahr"],
  ["pigkeepers", "before", "pillow_talk", "certain", "Die Stiere existieren vor dem Streit"],
  ["pillow_talk", "causes", "daire_refusal", "certain", "Medb schickt die Boten"],
  ["daire_refusal", "causes", "tain_muster", "certain", "Die Verweigerung wird zum Kriegsgrund"],
  ["fergus_exile", "before", "tain_muster", "certain", "Fergus führt Medbs Heer"],
  ["tain_muster", "meets", "fedelm_prophecy", "certain", "Die Seherin am Aufbruch"],
  ["tain_muster", "before", "tain_defense", "certain", ""],
  ["macha_curse", "causes", "tain_defense", "certain", "Ulster liegt in den Wehen, einer verteidigt"],
  ["cu_emer_marriage", "before", "tain_defense", "certain", ""],
  ["connla_death", "before", "tain_defense", "probable", ""],
  ["tain_defense", "contains", "morrigan_cu", "certain", ""],
  ["tain_defense", "contains", "lugh_heals", "certain", ""],
  ["tain_defense", "contains", "ferdiad_duel", "certain", ""],
  ["morrigan_cu", "before", "ferdiad_duel", "probable", ""],
  ["lugh_heals", "before", "ferdiad_duel", "probable", ""],
  ["scathach_training", "before", "ferdiad_duel", "certain", "Waffenbrüder aus derselben Schule"],
  ["ferdiad_duel", "contains", "ferdiad_death", "certain", ""],
  ["ferdiad_death", "before", "sualtam_death", "certain", ""],
  ["sualtam_death", "causes", "ulster_rising", "certain", "Das rufende Haupt weckt Ulster"],
  ["ulster_rising", "before", "gairech_battle", "certain", ""],
  ["gairech_battle", "before", "bull_fight", "certain", "Der Stier wird nach der Schlacht getrieben"],
  ["bull_fight", "contains", "bulls_death", "certain", ""],
  ["bulls_death", "before", "bricriu_feast", "probable", "Die Feste folgen dem Krieg"],
  ["bricriu_feast", "causes", "beheading_game", "certain", "Der Streit verlangt das Urteil Cú Roís"],
  ["beheading_game", "before", "curoi_death", "certain", ""],
  ["curoi_death", "causes", "blathnat_death", "certain", "Der Dichter rächt den Herrn"],
  ["curoi_death", "before", "cu_death", "certain", "Lugaid rächt den Vater"],
  ["gairech_battle", "before", "cu_death", "certain", "Medbs Rachebündnis nach der Táin"],
  ["cu_death", "causes", "conall_revenge", "certain", "Der Ziehbruder rächt den Helden"],
];

// ── Events: Fenian Cycle ─────────────────────────────────────────────────
const EVENTS_FENIAN: EventDef[] = [
  { k: "cnucha_battle", n: "Schlacht von Cnucha", t: "battle", cy: "fenian", src: "MF",
    d: "Clann Morna gegen Clann Baíscne: Goll erschlägt Cumhall — der Keim der Fehde, in die Fionn geboren wird.",
    chars: [["Goll mac Morna", "protagonist"], ["Cumhall", "victim"], ["Muirne", "mentioned"]],
    places: ["Cnucha"] },
  { k: "cumhall_death", n: "Tod des Cumhall", t: "death", cy: "fenian", src: "MF", parent: "cnucha_battle", lifecycleOf: "Cumhall",
    chars: [["Cumhall", "victim"], ["Goll mac Morna", "antagonist"]] },
  { k: "fionn_birth", n: "Geburt des Demne (Fionn)", t: "birth", cy: "fenian", src: "MF", lifecycleOf: "Fionn mac Cumhaill",
    d: "Muirne gebiert den Sohn des gefallenen Cumhall und gibt ihn in die Obhut der Wildnis.",
    chars: [["Muirne", "protagonist"], ["Fionn mac Cumhaill", "protagonist"]] },
  { k: "fionn_fostering", n: "Erziehung in der Wildnis", t: "other", cy: "fenian", src: "MF",
    d: "Die Druidin Bodhmall und die Kriegerin Liath Luachra lehren Demne Jagd, Kampf und Verborgenheit in Sliab Bladhma.",
    chars: [["Bodhmall", "protagonist"], ["Liath Luachra", "protagonist"], ["Fionn mac Cumhaill", "ally"]] },
  { k: "salmon_knowledge", n: "Der Lachs der Weisheit", t: "transformation", cy: "fenian", src: "MF",
    d: "Finnegas fängt nach sieben Jahren den Lachs; der Junge brät ihn, verbrennt sich den Daumen — und alles Wissen ist sein.",
    chars: [["Finnegas", "protagonist"], ["Fionn mac Cumhaill", "protagonist"]],
    places: ["Bóinn"], artifacts: ["Bratán Feasa"] },
  { k: "aillen_death", n: "Fionn tötet Aillen", t: "death", cy: "fenian", src: "MF", lifecycleOf: "Aillen",
    d: "Jedes Samhain sang Aillens Musik Tara in den Schlaf, ehe sein Feueratem es verbrannte. Fionn widersteht mit der Speerspitze an der Stirn und durchbohrt ihn.",
    chars: [["Fionn mac Cumhaill", "protagonist"], ["Aillen", "victim"], ["Goll mac Morna", "mentioned"]],
    places: ["Temair"] },
  { k: "fionn_leader", n: "Fionn wird Anführer der Fianna", t: "reign", cy: "fenian", src: "MF",
    d: "Zum Lohn für Aillens Tod erhält Fionn die Führung der Fianna; Goll beugt sich — Tadg tritt Almu ab.",
    chars: [["Fionn mac Cumhaill", "protagonist"], ["Goll mac Morna", "ally"], ["Tadg mac Nuadat", "victim"]],
    places: ["Almu"] },
  { k: "sadhbh_transformation", n: "Sadhbh, die Hirschkuh", t: "transformation", cy: "fenian", src: "ACS",
    d: "Fionns Hunde erkennen die Verwandelte; als Frau erlöst, wird sie vom Dunklen Druiden erneut verzaubert, als Fionn im Feld steht.",
    chars: [["Sadhbh", "victim"], ["Fionn mac Cumhaill", "protagonist"]],
    places: ["Almu"] },
  { k: "oisin_birth", n: "Geburt des Oisín", t: "birth", cy: "fenian", src: "ACS", lifecycleOf: "Oisín",
    d: "Auf Ben Bulben findet Fionn einen Knaben, den eine Hirschkuh aufzog — Oisín, »Rehkitz«, Sadhbhs Sohn.",
    chars: [["Oisín", "protagonist"], ["Sadhbh", "mentioned"], ["Fionn mac Cumhaill", "ally"]],
    places: ["Binn Ghulbain"] },
  { k: "grainne_betrothal", n: "Verlobungsfest in Tara", t: "meeting", cy: "fenian", src: "TDG",
    d: "Der alternde Fionn wirbt um Gráinne. Beim Fest schläfert sie die Halle — und legt Diarmuid die Geis der Flucht auf.",
    chars: [["Fionn mac Cumhaill", "protagonist"], ["Gráinne", "protagonist"], ["Cormac mac Airt", "ally"], ["Diarmuid Ua Duibhne", "victim", "Von der Geis gebunden"]],
    places: ["Temair"] },
  { k: "pursuit", n: "Die Verfolgung von Diarmuid und Gráinne", t: "journey", cy: "fenian", src: "TDG",
    d: "Sechzehn Jahre quer durch Irland: Dolmen als Nachtlager, Aengus als Schutzherr, Fionns Zorn im Rücken.",
    chars: [["Diarmuid Ua Duibhne", "protagonist"], ["Gráinne", "protagonist"], ["Fionn mac Cumhaill", "antagonist"], ["Aengus", "ally", "Der Ziehvater schützt die Liebenden"], ["Oisín", "other", "Mahnt den Vater zur Milde"]],
    artifacts: ["Gáe Dearg", "Moralltach"] },
  { k: "diarmuid_death", n: "Der Eber von Benbulbin", t: "death", cy: "fenian", src: "TDG", lifecycleOf: "Diarmuid Ua Duibhne",
    d: "Versöhnt jagt man auf Ben Bulben — doch die Geis bricht: Der Eber schlitzt Diarmuid auf, und Fionn lässt das heilende Wasser dreimal durch die Finger rinnen.",
    chars: [["Diarmuid Ua Duibhne", "victim"], ["Fionn mac Cumhaill", "antagonist"], ["Gráinne", "mentioned"], ["Oscar", "other", "Droht dem Großvater"], ["Aengus", "other", "Trägt den Leib nach Brú na Bóinne"]],
    places: ["Binn Ghulbain"] },
  { k: "oisin_niamh", n: "Oisín folgt Niamh nach Tír na nÓg", t: "journey", cy: "fenian", src: "ACS",
    d: "Auf dem weißen Pferd über die Wellen ins Land der Jugend — drei Jahre, die dreihundert sind.",
    chars: [["Niamh", "protagonist"], ["Oisín", "protagonist"], ["Fionn mac Cumhaill", "mentioned", "Sieht den Sohn nie wieder"]],
    places: ["Tír na nÓg"], artifacts: ["Aonbharr"] },
  { k: "gabhra_battle", n: "Schlacht von Gabhair", t: "battle", cy: "fenian", src: "ACS",
    d: "Hochkönig Cairbre bricht die Macht der Fianna; die Bünde zerreiben einander.",
    chars: [["Cairbre Lifechair", "antagonist"], ["Oscar", "protagonist"], ["Caílte mac Rónáin", "ally"], ["Oisín", "ally"]],
    places: ["Gabhair"] },
  { k: "oscar_death", n: "Tod des Oscar", t: "death", cy: "fenian", src: "ACS", parent: "gabhra_battle", lifecycleOf: "Oscar",
    d: "Oscar und Cairbre durchbohren einander; über der Leiche des Enkels weint Fionn zum einzigen Mal.",
    chars: [["Oscar", "victim"], ["Cairbre Lifechair", "victim"]] },
  { k: "cairbre_death", n: "Tod des Cairbre Lifechair", t: "death", cy: "fenian", src: "ACS", parent: "gabhra_battle", lifecycleOf: "Cairbre Lifechair",
    chars: [["Cairbre Lifechair", "victim"], ["Oscar", "antagonist"]] },
  { k: "oisin_return", n: "Oisíns Rückkehr", t: "transformation", cy: "fenian", src: "ACS",
    d: "Dreihundert Jahre später hebt er einen Stein, der Sattelgurt reißt, sein Fuß berührt Irland — und die Jahre stürzen über ihn.",
    chars: [["Oisín", "victim"], ["Niamh", "mentioned"]],
    places: ["Tír na nÓg"] },
  { k: "acallam", n: "Das Gespräch der Alten", t: "meeting", cy: "fenian", src: "ACS",
    d: "Caílte und der greise Oisín erzählen Patrick die Taten der Fianna — Ortsname um Ortsname, Sage um Sage.",
    chars: [["Caílte mac Rónáin", "protagonist"], ["Oisín", "protagonist"], ["Pádraig", "protagonist"]] },
];

const RELS_FENIAN: EventRel[] = [
  ["cnucha_battle", "contains", "cumhall_death", "certain", ""],
  ["cumhall_death", "before", "fionn_birth", "certain", "Fionn wird nach dem Fall des Vaters geboren"],
  ["fionn_birth", "before", "fionn_fostering", "certain", ""],
  ["fionn_fostering", "before", "salmon_knowledge", "certain", "Demne kommt als Junge zu Finnegas"],
  ["salmon_knowledge", "before", "aillen_death", "certain", "Das Wissen geht dem Heldenwerk voraus"],
  ["aillen_death", "causes", "fionn_leader", "certain", "Der Lohn für Taras Rettung"],
  ["fionn_leader", "before", "sadhbh_transformation", "certain", ""],
  ["sadhbh_transformation", "before", "oisin_birth", "certain", "Sadhbh gebiert den Sohn in Tiergestalt"],
  ["oisin_birth", "before", "grainne_betrothal", "certain", "Oisín sitzt beim Verlobungsfest"],
  ["grainne_betrothal", "causes", "pursuit", "certain", "Die Geis zwingt zur Flucht"],
  ["pursuit", "before", "diarmuid_death", "certain", "Die trügerische Versöhnung"],
  ["diarmuid_death", "before", "oisin_niamh", "probable", "Die Fianna altern, ehe Niamh kommt"],
  ["diarmuid_death", "before", "gabhra_battle", "probable", ""],
  ["oisin_niamh", "before", "gabhra_battle", "probable", "Oisín verpasst den Untergang in mancher Fassung"],
  ["gabhra_battle", "contains", "oscar_death", "certain", ""],
  ["gabhra_battle", "contains", "cairbre_death", "certain", ""],
  ["gabhra_battle", "before", "oisin_return", "certain", "Die Fianna sind Sage, als Oisín heimkehrt"],
  ["oisin_return", "meets", "acallam", "certain", "Der Heimgekehrte erzählt Patrick"],
];

// ── Events: Cycle of the Kings ───────────────────────────────────────────
const EVENTS_KINGS: EventDef[] = [
  { k: "labraid_dinnrig", n: "Labraid erobert Dinn Ríg", t: "battle", cy: "kings", src: "ORT",
    d: "Der stumme Verbannte kehrt zurück und verbrennt die Halle von Dinn Ríg — Leinsters Königtum ist sein.",
    chars: [["Labraid Loingsech", "protagonist"]],
    places: ["Dinn Ríg"] },
  { k: "labraid_ears", n: "Das Geheimnis der Pferdeohren", t: "other", cy: "kings", src: "ORT",
    d: "Jeder Barbier stirbt — bis einer das Geheimnis dem Baum anvertraut. Die Harfe aus seinem Holz singt: »Labraid hat Pferdeohren.«",
    chars: [["Labraid Loingsech", "protagonist"]] },
  { k: "conaire_reign", n: "Herrschaft des Conaire Mór", t: "reign", cy: "kings", src: "TBDD",
    d: "Vom Vogelvolk auf den Thron geführt: Frieden, Fülle, milde Jahre — solange die Geasa halten.",
    chars: [["Conaire Mór", "protagonist"], ["Mess Búachalla", "mentioned"]],
    places: ["Temair"] },
  { k: "daderga_destruction", n: "Zerstörung von Dá Dergas Halle", t: "battle", cy: "kings", src: "TBDD",
    d: "Geis um Geis zerbricht auf dem Weg; in der brennenden Halle verdurstet der König, dessen Durst kein Wasser Irlands mehr löscht.",
    chars: [["Conaire Mór", "victim"]],
    places: ["Bruiden Dá Derga"] },
  { k: "conaire_death", n: "Tod des Conaire Mór", t: "death", cy: "kings", src: "TBDD", parent: "daderga_destruction", lifecycleOf: "Conaire Mór",
    chars: [["Conaire Mór", "victim"]] },
  { k: "conn_reign", n: "Herrschaft des Conn Cétchathach", t: "reign", cy: "kings", src: "CMM",
    d: "Der Stein von Fál schreit unter Conns Tritt; hundert Schlachten geben ihm den Namen.",
    chars: [["Conn Cétchathach", "protagonist"]],
    places: ["Temair"], artifacts: ["Lia Fáil"] },
  { k: "mucrama_battle", n: "Schlacht von Mag Mucrama", t: "battle", cy: "kings", src: "CMM",
    d: "Lugaid Mac Con kehrt mit fremdem Heer zurück; Art mac Cuinn fällt, Mac Con nimmt Tara.",
    chars: [["Lugaid Mac Con", "protagonist"], ["Art mac Cuinn", "victim"], ["Ailill Aulom", "mentioned"]],
    places: ["Mag Mucrama"] },
  { k: "art_death", n: "Tod des Art mac Cuinn", t: "death", cy: "kings", src: "CMM", parent: "mucrama_battle", lifecycleOf: "Art mac Cuinn",
    chars: [["Art mac Cuinn", "victim"], ["Lugaid Mac Con", "antagonist"]] },
  { k: "maccon_reign", n: "Herrschaft des Lugaid Mac Con", t: "reign", cy: "kings", src: "CMM",
    d: "Sieben Jahre in Tara — bis ein falsches Urteil über Schafe und Waid die Mauer bersten lässt: Der Junge Cormac urteilt richtig.",
    chars: [["Lugaid Mac Con", "protagonist"], ["Cormac mac Airt", "other", "Das wahre Urteil des Knaben"]],
    places: ["Temair"] },
  { k: "cormac_reign", n: "Herrschaft des Cormac mac Airt", t: "reign", cy: "kings", src: "ECH",
    d: "Das goldene Zeitalter Taras: Recht, Fülle und die Bücher der Weisungen.",
    chars: [["Cormac mac Airt", "protagonist"]],
    places: ["Temair"] },
  { k: "cormac_otherworld", n: "Cormac im Land der Verheißung", t: "journey", cy: "kings", src: "ECH",
    d: "Dem Silberzweig folgt er bis vor Manannáns Haus; für Wahrheit erhält er Frau, Kinder und den Becher zurück.",
    chars: [["Cormac mac Airt", "protagonist"], ["Manannán mac Lir", "protagonist"]],
    places: ["Mag Mell"], artifacts: ["Cup of Truth", "Craobh Airgid"] },
  { k: "niall_sovereignty", n: "Niall und die Herrin der Herrschaft", t: "prophecy", cy: "kings", src: "NIA",
    d: "Am Brunnen fordert die Alte einen Kuss für Wasser; nur Niall küsst — und hält die Schönheit selbst im Arm: die Herrschaft Irlands.",
    chars: [["Niall Noígíallach", "protagonist"]] },
  { k: "niall_reign", n: "Herrschaft des Niall Noígíallach", t: "reign", cy: "kings", src: "NIA",
    d: "Neun Geiseln aus neun Reichen; von ihm stammen die Uí Néill.",
    chars: [["Niall Noígíallach", "protagonist"]],
    places: ["Temair"] },
  { k: "ronan_curse", n: "Rónáns Fluch", t: "prophecy", cy: "kings", src: "BS",
    d: "Suibhne wirft den Psalter des Heiligen in den See und wird verflucht: vogelgleich, ruhelos, wahnsinnig.",
    chars: [["Rónán Finn", "protagonist"], ["Suibhne", "victim"]] },
  { k: "suibhne_madness", n: "Suibhnes Wahnsinn", t: "transformation", cy: "kings", src: "BS",
    d: "Im Getöse der Schlacht von Mag Rath fällt der Fluch: Suibhne flieht in die Wipfel und dichtet die Kälte der Nächte.",
    chars: [["Suibhne", "victim"]] },
  { k: "suibhne_death", n: "Tod des Suibhne", t: "death", cy: "kings", src: "BS", lifecycleOf: "Suibhne",
    d: "Vom Speer des Hirten durchbohrt stirbt der Vogelkönig versöhnt an der Kirchentür.",
    chars: [["Suibhne", "victim"]] },
];

const RELS_KINGS: EventRel[] = [
  ["labraid_dinnrig", "before", "labraid_ears", "certain", ""],
  ["labraid_ears", "before", "conaire_reign", "speculative", "Labraid gilt als früher Leinster-König"],
  ["conaire_reign", "before", "daderga_destruction", "certain", ""],
  ["daderga_destruction", "contains", "conaire_death", "certain", ""],
  ["conaire_death", "before", "conn_reign", "speculative", "Königsabfolge der Überlieferung"],
  ["conn_reign", "before", "mucrama_battle", "certain", "Conns Sohn Art fällt bei Mag Mucrama"],
  ["mucrama_battle", "contains", "art_death", "certain", ""],
  ["mucrama_battle", "causes", "maccon_reign", "certain", "Der Sieger nimmt Tara"],
  ["maccon_reign", "before", "cormac_reign", "certain", "Das falsche Urteil macht Cormac Platz"],
  ["cormac_reign", "contains", "cormac_otherworld", "certain", "Die Anderswelt-Fahrt während der Herrschaft"],
  ["cormac_reign", "before", "niall_sovereignty", "probable", "Niall folgt Generationen später"],
  ["niall_sovereignty", "causes", "niall_reign", "certain", "Der Kuss bringt die Krone"],
  ["niall_reign", "before", "ronan_curse", "probable", "Suibhne gehört der christlichen Zeit an"],
  ["ronan_curse", "causes", "suibhne_madness", "certain", ""],
  ["suibhne_madness", "before", "suibhne_death", "certain", ""],
];

// ── Cross-cycle ordering ─────────────────────────────────────────────────
const RELS_CROSS_CYCLE: EventRel[] = [
  // Mythological → Ulster
  ["tdd_underground", "before", "conchobar_birth", "speculative", "Das Götterzeitalter liegt vor dem Heldenzeitalter"],
  ["tdd_underground", "before", "pigkeepers", "speculative", "Die Schweinehirten dienen Síd-Königen nach dem Rückzug"],
  ["cmt2", "before", "cu_birth", "certain", "Lugh, Sieger von Mag Tuired, zeugt Cú Chulainn"],
  ["battle_tailtiu", "before", "macha_curse", "speculative", "Machas Fluch fällt in die Menschenzeit"],
  // Ulster → Kings (Conaire wird traditionell neben/vor Conchobar gestellt, Conn folgt)
  ["cu_death", "before", "conn_reign", "speculative", "Conn folgt dem Heldenzeitalter Ulsters"],
  // Kings ↔ Fenian (Fionn dient unter Cormac)
  ["conn_reign", "before", "cnucha_battle", "probable", "Cumhall fällt zur Zeit Conns"],
  ["maccon_reign", "before", "aillen_death", "probable", "Fionns Aufstieg zur Zeit der Könige"],
  ["cormac_reign", "parallel", "fionn_leader", "probable", "Fionn führt die Fianna unter Cormac"],
  ["cormac_reign", "before", "grainne_betrothal", "certain", "Cormac gibt die Tochter"],
  ["cormac_reign", "before", "gabhra_battle", "certain", "Cormacs Sohn Cairbre bricht die Fianna"],
  ["gabhra_battle", "before", "niall_sovereignty", "probable", "Niall folgt dem Fenian-Zeitalter"],
  // Fenian → Christianisierung
  ["niall_reign", "before", "acallam", "probable", "Patrick wirkt nach Niall"],
  ["acallam", "before", "ronan_curse", "probable", "Suibhne ist der jüngste Stoff"],
];
