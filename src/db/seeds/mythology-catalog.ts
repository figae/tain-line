/**
 * Catalog seed — the complete name inventory of Lebor Gabála Érenn.
 * Run AFTER `mythology` and `mythology-extended`.
 *
 * Two layers:
 *
 * 1. Substantive late additions that earlier seeds missed:
 *    Scota, Lugaid mac Ítha, the druid Caicher, Partholón's sons,
 *    the "first-doers", Macha wife of Nemed, the Fomorian kings Gann
 *    and Sengann, Fiacha mac Delbaíth, and the founding of Emain Macha
 *    (Macha Mong Ruad, Áed Rúad, Díthorba, Cimbáeth).
 *
 * 2. Pure name catalogs, marked confidence='speculative' to signal
 *    "attested by name only, no narrative":
 *    - the fifty women of Cessair (three groups, per LGE ¶ and the
 *      mnemonic poem; the original list itself contains repeats)
 *    - the chieftains of the Milesian fleet
 *    - the Roll of Kings from Éremón to Ugaine Mór
 */
import type { Seed } from "./types";

export const name = "LGE Name Catalog";
export const description =
  "Complete Lebor Gabála inventory: ~25 substantive figures plus the name catalogs (fifty women of Cessair, Milesian chieftains, Roll of Kings). Requires 'mythology' + 'mythology-extended'.";

export const seed: Seed["seed"] = (db) => {
  const selSource = db.prepare(`SELECT id FROM sources WHERE title = ?`);
  const insSource = db.prepare(
    `INSERT INTO sources (title, type, author, year, url, notes) VALUES (?,?,?,?,?,?)`
  );
  const lgeRow = selSource.get("Lebor Gabála Érenn (Book of Invasions)") as { id: number } | undefined;
  const LGE = lgeRow
    ? lgeRow.id
    : (insSource.run("Lebor Gabála Érenn (Book of Invasions)", "manuscript", null, 1150, "https://celt.ucc.ie/published/T100055/", null).lastInsertRowid as number);
  const dsenRow = selSource.get("Dinnshenchas & Banshenchas") as { id: number } | undefined;
  const DSEN = dsenRow ? dsenRow.id : LGE;

  const selChar = db.prepare(`SELECT id FROM characters WHERE name = ?`);
  const insChar = db.prepare(
    `INSERT INTO characters (name, alt_names, gender, description, epithet, is_deity, is_dead, source_id, confidence)
     VALUES (?,?,?,?,?,?,?,?,?)`
  );
  const selGroup = db.prepare(`SELECT id FROM groups WHERE name = ?`);
  const insCG = db.prepare(
    `INSERT INTO character_groups (character_id, group_id, source_id) VALUES (?,?,?)`
  );
  const selCG = db.prepare(
    `SELECT id FROM character_groups WHERE character_id = ? AND group_id = ?`
  );
  const insFam = db.prepare(
    `INSERT INTO family_relations (from_character_id, to_character_id, relation_type, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const selFam = db.prepare(
    `SELECT id FROM family_relations WHERE from_character_id = ? AND to_character_id = ? AND relation_type = ?`
  );
  const insEvent = db.prepare(
    `INSERT INTO events (name, description, event_type, parent_event_id, character_id, cycle, approximate_era, source_id)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  const selEvent = db.prepare(`SELECT id FROM events WHERE name = ?`);
  const insEC = db.prepare(
    `INSERT INTO event_characters (event_id, character_id, role, notes, source_id) VALUES (?,?,?,?,?)`
  );
  const insERel = db.prepare(
    `INSERT INTO event_relations (from_event_id, to_event_id, relation_type, confidence, reason, source_id)
     VALUES (?,?,?,?,?,?)`
  );

  const G = (name: string): number => {
    const row = selGroup.get(name) as { id: number } | undefined;
    if (!row) throw new Error(`Unknown group: ${name}`);
    return row.id;
  };

  interface Def {
    n: string;
    alt?: string[];
    g?: "male" | "female" | "other" | "unknown";
    e?: string;
    d: string;
    deity?: boolean;
    dead?: boolean;
    grp?: string[];
    conf?: "established" | "probable" | "speculative";
  }

  function upsert(c: Def): number {
    const existing = selChar.get(c.n) as { id: number } | undefined;
    const id = existing
      ? existing.id
      : (insChar.run(
          c.n,
          c.alt ? JSON.stringify(c.alt) : null,
          c.g ?? "unknown",
          c.d,
          c.e ?? null,
          c.deity ? 1 : 0,
          c.dead ? 1 : 0,
          LGE,
          c.conf ?? "established"
        ).lastInsertRowid as number);
    for (const g of c.grp ?? []) {
      if (!selCG.get(id, G(g))) insCG.run(id, G(g), LGE);
    }
    return id;
  }

  function charId(name: string): number {
    const row = selChar.get(name) as { id: number } | undefined;
    if (!row) throw new Error(`Unknown character: ${name}`);
    return row.id;
  }

  function rel(from: string, type: string, to: string, notes?: string) {
    const f = charId(from);
    const t = charId(to);
    if (!selFam.get(f, t, type)) insFam.run(f, t, type, notes ?? null, LGE);
  }

  // ═════════════════════════════════════════════════════════════════════
  // 1. Substantive figures
  // ═════════════════════════════════════════════════════════════════════

  const substantive: Def[] = [
    { n: "Scota", g: "female", e: "Die Pharaonentochter", grp: ["Milesians"], dead: true,
      d: "Tochter des Pharao, Frau des Míl Espáine, Mutter seiner Söhne. Fällt in der Schlacht von Sliab Mis gegen die Tuatha Dé Danann — »Scotas Grab« im Tal bei Tralee trägt ihren Namen, und nach ihr heißen die Gaelen »Scoti«." },
    { n: "Lugaid mac Ítha", g: "male", grp: ["Milesians"],
      d: "Sohn des erschlagenen Íth. Fährt mit der Flotte Míls, den Vater zu rächen — Ahnherr der Corcu Loígde von Munster; nach seiner Frau Fial ist der Fluss Feale benannt." },
    { n: "Caicher", g: "male", e: "Der Druide der Flotte", grp: ["Milesians"],
      d: "Druide der Milesier. Bannt den Gesang der Meerfrauen mit Wachs in den Ohren der Mannschaft und prophezeit auf See: »Wir rasten nicht, bis wir Irland erreichen.«" },
    { n: "Bairrfhind", alt: ["Barrfhind"], g: "female", grp: ["Cessair's People"], dead: true,
      d: "Eine der drei Anführerinnen unter Cessairs fünfzig Frauen — ihr wurde mit sechzehn Gefährtinnen Bith zugeteilt." },
    { n: "Slánga mac Partholóin", g: "male", grp: ["Partholonians"], dead: true,
      d: "Sohn Partholóns — der erste Tote, der in Irland begraben wurde: Sliab Slángha (die Mourne Mountains) trägt seinen Namen." },
    { n: "Rudraige mac Partholóin", g: "male", grp: ["Partholonians"], dead: true,
      d: "Sohn Partholóns; bei seinem Grabaushub brach Loch Rudraige hervor." },
    { n: "Laiglinne", g: "male", grp: ["Partholonians"], dead: true,
      d: "Sohn Partholóns; bei seinem Grab brach Loch Laiglinne hervor — die Seen Irlands entstehen in dieser Sage mit den Toten." },
    { n: "Malaliach", g: "male", e: "Der erste Brauer", grp: ["Partholonians"],
      d: "Gefolgsmann Partholóns: braut das erste Bier Irlands aus Farnkraut und ist der erste Bürge, der erste Beter und der erste Gastgeber mit Kessel." },
    { n: "Brea mac Senboth", g: "male", grp: ["Partholonians"],
      d: "Gefolgsmann Partholóns: errichtet das erste Haus, setzt den ersten Kessel auf und ficht den ersten Zweikampf Irlands." },
    { n: "Bacorb Ladra", g: "male", e: "Der erste Lehrer", grp: ["Partholonians"],
      d: "Gelehrter Partholóns — der erste, der in Irland lehrte." },
    { n: "Macha (Frau Nemeds)", g: "female", grp: ["Nemedians"], dead: true,
      d: "Frau Nemeds, die zwölf Tage nach der Ankunft stirbt — die erste Tote der Nemedier; Ard Macha (Armagh) bewahrt ihren Namen, lange bevor die Göttin und die Königin ihn erneut prägen." },
    { n: "Gann (Fomore)", g: "male", grp: ["Fomorians"], dead: true,
      d: "Fomorenkönig, der mit Sengann Irland unterdrückte, bis Nemed beide in der Schlacht schlug — Namensvetter des späteren Fir-Bolg-Bruders." },
    { n: "Sengann (Fomore)", g: "male", grp: ["Fomorians"], dead: true,
      d: "Fomorenkönig an Ganns Seite, von Nemed gefällt." },
    { n: "Fiacha mac Delbaíth", g: "male", deity: true, grp: ["Tuatha Dé Danann"], dead: true,
      d: "König der Tuatha Dé Danann nach seinem Vater Delbáeth — das fehlende Glied der Königsfolge zwischen Dagda-Linie und den drei Enkeln Cermaits." },
    { n: "Áed Rúad", g: "male", e: "Der Rote", dead: true,
      d: "Einer der drei Könige im Siebenjahres-Turnus mit Díthorba und Cimbáeth. Ertrinkt im Wasserfall von Ess Ruaid (Assaroe), der seinen Namen trägt — Vater der Macha Mong Ruad." },
    { n: "Díthorba", g: "male", dead: true,
      d: "Zweiter der drei Turnus-Könige. Seine Söhne verweigern Macha die Herrschaft — sie besiegt sie und zwingt die Gefangenen, Emain Macha zu graben." },
    { n: "Cimbáeth", g: "male", e: "Erster König von Emain Macha", dead: true,
      d: "Dritter der Turnus-Könige, Feldherr und dann Gemahl der Macha Mong Ruad — mit ihm beginnt die gesicherte Zählung der Ulster-Könige." },
    { n: "Macha Mong Ruad", alt: ["Macha Rothaar"], g: "female", e: "Die einzige Hochkönigin der Königsliste", dead: true,
      d: "Tochter Áed Rúads. Erkämpft ihr Erbe gegen Díthorbas Söhne, nimmt sie als Gefangene und zeichnet mit ihrer Brosche (eo-muin) den Wall von Emain Macha vor, den sie graben müssen — die einzige Frau in der Königsliste Irlands." },
    { n: "Írial Fáith", g: "male", e: "Der Prophet", grp: ["Milesians"], dead: true,
      d: "Sohn Éremóns, der erste in Irland geborene König der Gaelen — »der Prophet«: rodet Ebenen, baut Königsburgen, sieht die Zukunft." },
    { n: "Ollom Fotla", alt: ["Ollamh Fodhla"], g: "male", e: "Der Gelehrtenkönig", dead: true,
      d: "Stiftet die Feis Temro, die Versammlung von Tara, und gibt Irland als erster Gesetze aus Gelehrsamkeit — Ahnherr einer ganzen Königslinie von Weisen." },
  ];

  for (const c of substantive) upsert(c);

  // Substantive relations
  rel("Míl Espáine", "spouse", "Scota");
  rel("Scota", "mother", "Éber Finn");
  rel("Scota", "mother", "Éremón");
  rel("Scota", "mother", "Amergin");
  rel("Scota", "mother", "Ír");
  rel("Scota", "mother", "Colptha");
  rel("Scota", "mother", "Érannán");
  rel("Íth", "father", "Lugaid mac Ítha");
  rel("Partholón", "father", "Slánga mac Partholóin");
  rel("Partholón", "father", "Rudraige mac Partholóin");
  rel("Partholón", "father", "Laiglinne");
  rel("Delgnat", "mother", "Slánga mac Partholóin");
  rel("Nemed", "spouse", "Macha (Frau Nemeds)");
  rel("Delbáeth", "father", "Fiacha mac Delbaíth");
  rel("Áed Rúad", "father", "Macha Mong Ruad");
  rel("Cimbáeth", "spouse", "Macha Mong Ruad");
  rel("Éremón", "father", "Írial Fáith");
  rel("Tea", "mother", "Írial Fáith");
  rel("Bith", "spouse", "Bairrfhind", "Ihm zugeteilt mit sechzehn Gefährtinnen");

  // ═════════════════════════════════════════════════════════════════════
  // 2. Name catalogs — confidence 'speculative' = only attested by name
  // ═════════════════════════════════════════════════════════════════════

  // The fifty women of Cessair (LGE poem; the original mnemonic list
  // itself repeats names — repeats are stored once).
  const WOMEN_FINTAN = ["Lot", "Luam", "Mall", "Mar", "Froechar", "Femar", "Faible", "Foroll", "Cipir", "Torrian", "Tamall", "Tam", "Abba", "Alla", "Baichne", "Sille"];
  const WOMEN_BITH   = ["Sella", "Della", "Duib", "Addeos", "Fotra", "Traige", "Nera", "Buana", "Tanna", "Nathra", "Leos", "Fodarg", "Rodarg", "Dos", "Clos"];
  const WOMEN_LADRA  = ["Alba", "Bona", "Albor", "Ail", "Gothiam", "German", "Aithne", "Inde", "Rinne", "Inchor", "Ain", "Irrand", "Espa", "Sine", "Samoll"];

  const womanNote: Record<string, string> = {
    Alba:    " Ihr Name gilt als Ahnname der Britannier (Alba).",
    German:  " Ihr Name gilt als Ahnname der Germanen.",
    Gothiam: " Ihr Name gilt als Ahnname der Goten.",
    Espa:    " Ihr Name gilt als Ahnname der Spanier (Hispania).",
    Traige:  " Ihr Name gilt als Ahnname der Thraker.",
  };

  const womenGroups: [string, string[]][] = [
    ["Fintan mac Bóchra", WOMEN_FINTAN],
    ["Bith", WOMEN_BITH],
    ["Ladra", WOMEN_LADRA],
  ];

  for (const [leader, women] of womenGroups) {
    for (const w of women) {
      upsert({
        n: w,
        g: "female",
        grp: ["Cessair's People"],
        dead: true,
        conf: "speculative",
        d: `Eine der fünfzig Frauen der Cessair, namentlich im Lebor Gabála Érenn genannt (Gruppe des ${leader.split(" ")[0]}).${womanNote[w] ?? ""} Die Namensliste des LGE ist mnemotechnisch gebaut; über den Namen hinaus ist nichts überliefert.`,
      });
    }
  }

  // Chieftains of the Milesian fleet (LGE roll of leaders)
  const CHIEFTAINS: [string, string][] = [
    ["Fulman", "Errichtete eine der ersten Königsburgen der Gaelen."],
    ["Mantán", "Errichtete eine der ersten Königsburgen der Gaelen."],
    ["Sétga", "Häuptling der Flotte Míls."],
    ["Suirge", "Häuptling der Flotte Míls."],
    ["Sobairce", "Häuptling der Flotte; Dún Sobairce (Dunseverick) an der Nordküste trägt seinen Namen — die Königsliste kennt ihn auch als Mitkönig Cermnas."],
    ["Cermna Finn", "Mit Sobairce erster König aus Ulster in der Königsliste; teilte Irland an einer Linie von Dún Cermna bis Dún Sobairce."],
    ["Én mac Occe", "Häuptling der Flotte Míls, Erbauer eines der ersten Raths."],
    ["Ún mac Uicce", "Häuptling der Flotte Míls, Erbauer eines der ersten Raths."],
    ["Goisten", "Häuptling der Flotte Míls."],
    ["Bres mac Míled?", "—"],
    ["Buas", "Einer der drei Brüder Bres, Buas und Buaigne in der Häuptlingsliste der Flotte."],
    ["Buaigne", "Einer der drei Brüder Bres, Buas und Buaigne in der Häuptlingsliste der Flotte."],
  ];

  for (const [n, note] of CHIEFTAINS) {
    if (n === "Bres mac Míled?") continue; // ambiguous with the god — skip
    upsert({
      n,
      g: "male",
      grp: ["Milesians"],
      conf: "speculative",
      d: `${note} Namentlich in der Häuptlingsliste des Lebor Gabála bezeugt.`,
    });
  }

  // Roll of Kings: Éremón → Ugaine Mór (LGE / Réim Rígraide).
  // Attested as a list; entries carry no narrative beyond the name,
  // an occasional epithet and the odd remembered detail.
  const KINGS: [string, string][] = [
    ["Muimne", "Sohn Éremóns, Mitkönig mit seinen Brüdern Luigne und Laigne."],
    ["Luigne", "Sohn Éremóns, Mitkönig."],
    ["Laigne", "Sohn Éremóns, Mitkönig."],
    ["Er mac Ébir", "Sohn Éber Finns; die vier Brüder herrschten ein halbes Jahr, ehe Írial Fáith sie schlug."],
    ["Orba", "Sohn Éber Finns, Mitkönig der vier."],
    ["Ferón", "Sohn Éber Finns, Mitkönig der vier."],
    ["Fergna", "Sohn Éber Finns, Mitkönig der vier."],
    ["Ethriel", "Sohn Írial Fáiths, von Conmáel gefällt."],
    ["Conmáel", "Erster König aus der Linie Ébers — »ohne Frauenlist«."],
    ["Eochaid Étgudach", "Führte die Rangordnung der Farben in der Kleidung ein."],
    ["Eochaid Fáebarglas", "»Von der grünen Schneide« — rodet Ebenen, fällt gegen Fíachu Labrainne."],
    ["Fíachu Labrainne", "Unter ihm brach der Fluss Labrainne hervor."],
    ["Eochu Mumo", "Nach ihm soll Munster (Mumu) benannt sein."],
    ["Óengus Olmucaid", "»Der der großen Schweine« — Sieger vieler Schlachten über See."],
    ["Énna Airgdech", "»Der mit den Silberschilden« — beschenkte seine Krieger mit Silber."],
    ["Rothechtaid mac Main", "König der Rolle, von Sétna Airt erschlagen."],
    ["Sétna Airt", "Erschlug Rothechtaid zum Schutz seines Sohnes — »Airt« für seinen Edelmut."],
    ["Fíachu Fínscothach", "»Der der Weinblüten« — in seiner Zeit troffen die Blüten von Wein."],
    ["Muinemón", "Führte goldene Halsreifen (muin) ein."],
    ["Fáildergdóit", "Unter ihm trugen die Edlen goldene Armringe."],
    ["Fínnachta", "In seiner Herrschaft schneite es Wein (fín)."],
    ["Slánoll", "»Ganz gesund« — in seiner Zeit kannte Irland keine Krankheit; starb ohne erkennbare Ursache."],
    ["Géde Ollgothach", "»Der Großstimmige« — die Stimmen seiner Untertanen klangen wie Harfensaiten."],
    ["Fíachu Findoilches", "Baut Cenannas (Kells); »jedes Kalb weiß«, das in seiner Zeit fiel."],
    ["Berngal", "König der Rolle in kargen Jahren."],
    ["Ailill mac Slánuill", "Sohn Slánolls, König der Rolle."],
    ["Sírna Sáeglach", "»Der Langlebige« — trennte Ulster von Tara und herrschte ein Menschenalter."],
    ["Rothechtaid Rotha", "»Der der Räder« — führte vierspännige Streitwagen ein."],
    ["Elim Olfínechta", "In seiner Zeit fiel Schnee mit dem Geschmack von Wein."],
    ["Gíallchad", "»Der Geiselnehmer« — nahm von jedem Fünftel Irlands Geiseln."],
    ["Art Imlech", "König der Rolle, Erbauer von Wällen."],
    ["Nuadu Finn Fáil", "»Der Weiße von Fál« — Namensvetter des Danann-Königs in der Menschenrolle."],
    ["Bres Rí", "König der Rolle — nicht der Danann-Bres; neun Jahre Kriege gegen die Fomorer der Küsten."],
    ["Eochu Apthach", "»Der Unheilvolle« — in jedem Monat seiner Herrschaft eine Seuche."],
    ["Finn mac Blatha", "König der Rolle, nicht zu verwechseln mit Fionn mac Cumhaill."],
    ["Sétna Innarraid", "»Der des Soldes« — zahlte als erster Kriegern Lohn."],
    ["Símón Brecc", "»Der Gefleckte« — riss den Vorgänger vom Thron und endete selbst am Galgen der Rache."],
    ["Dui Finn", "König der Rolle, Rächer seines Vaters."],
    ["Muiredach Bolgrach", "König der Rolle aus der Linie der Rächer."],
    ["Énda Derg", "»Der Rote« — starb mit seinem Gefolge an der Gelbsucht in Sliab Mis."],
    ["Lugaid Íardonn", "»Der Dunkelbraune«, König der Rolle."],
    ["Sírlám", "»Langhand« — seine Arme reichten bis zum Boden; erschlug den Vorgänger."],
    ["Eochu Uairches", "Der Verbannte, der über See zurückkehrte und das Königtum nahm."],
    ["Eochu Fíadmuine", "Mitkönig mit Conaing Bececlach — herrschte über den Süden."],
    ["Conaing Bececlach", "»Der Furchtlose« — Mitkönig des Nordens, zweimal auf dem Thron."],
    ["Lugaid Lámderg", "»Rothand« — erschlug Eochu Fíadmuine und nahm den Süden."],
    ["Art mac Luigdech", "König der Rolle, Vater des Ailill Finn."],
    ["Ailill Finn", "König der Rolle, fiel im Krieg gegen Airgetmár."],
    ["Eochu mac Ailella", "Hielt Airgetmár sieben Jahre von der Küste fern."],
    ["Airgetmár", "»Der Silberreiche« — kehrte aus der Verbannung zurück und nahm die Herrschaft."],
    ["Dui Ladrach", "König der Rolle, schneller Rächer und schnell Gerächter."],
    ["Lugaid Laígde", "Ahn der Corcu Loígde; mit ihm kehrt die Rolle nach Munster."],
    ["Rechtaid Rígderg", "»Rotkönig« — erschlug Macha Mong Ruad und fiel ihrer Rache-Nachfolge."],
  ];

  for (const [n, note] of KINGS) {
    upsert({
      n,
      g: "male",
      dead: true,
      conf: "speculative",
      d: `${note} Eintrag der Königsrolle (Réim Rígraide) des Lebor Gabála — über Name, Abfolge und diese Notiz hinaus ist nichts überliefert.`,
    });
  }

  // King-list filiations that the LGE states directly
  rel("Éremón", "father", "Muimne");
  rel("Éremón", "father", "Luigne");
  rel("Éremón", "father", "Laigne");
  rel("Éber Finn", "father", "Er mac Ébir");
  rel("Éber Finn", "father", "Orba");
  rel("Éber Finn", "father", "Ferón");
  rel("Éber Finn", "father", "Fergna");
  rel("Írial Fáith", "father", "Ethriel");
  rel("Slánoll", "father", "Ailill mac Slánuill");

  // ═════════════════════════════════════════════════════════════════════
  // 3. Events for the substantive additions
  // ═════════════════════════════════════════════════════════════════════

  function baseEvent(eventName: string): number {
    const row = selEvent.get(eventName) as { id: number } | undefined;
    if (!row) throw new Error(`Base event not found: ${eventName}`);
    return row.id;
  }

  function addEvent(opts: {
    n: string; d: string; t: string; cy: string;
    lifecycleOf?: string;
    chars?: [string, string, string?][];
  }): number {
    const id = insEvent.run(
      opts.n, opts.d, opts.t, null,
      opts.lifecycleOf ? charId(opts.lifecycleOf) : null,
      opts.cy, null, LGE
    ).lastInsertRowid as number;
    for (const [cn, role, notes] of opts.chars ?? []) {
      insEC.run(id, charId(cn), role, notes ?? null, LGE);
    }
    return id;
  }

  const evScota = addEvent({
    n: "Schlacht von Sliab Mis",
    d: "Erstes Treffen der Milesier mit den Tuatha Dé Danann nach der Landung: Sieg der Söhne Míls — doch Scota, die Pharaonentochter, fällt; ihr Grab liegt im Tal bei Tralee.",
    t: "battle", cy: "mythological", lifecycleOf: "Scota",
    chars: [["Scota", "victim"], ["Éber Finn", "protagonist"], ["Éremón", "ally"], ["Lugaid mac Ítha", "ally"]],
  });
  const evEmain = addEvent({
    n: "Macha Mong Ruad gründet Emain Macha",
    d: "Macha erzwingt ihr Erbrecht gegen Díthorbas Söhne, führt die Besiegten als Gefangene heim und zeichnet mit ihrer Brosche den Wall vor, den sie graben: Emain Macha, der künftige Königssitz Ulsters.",
    t: "other", cy: "kings",
    chars: [["Macha Mong Ruad", "protagonist"], ["Cimbáeth", "ally"], ["Áed Rúad", "mentioned"], ["Díthorba", "antagonist"]],
  });

  const R = (from: number, type: string, to: number, conf: string, reason: string) =>
    insERel.run(from, to, type, conf, reason, DSEN);

  R(baseEvent("Landung der Milesier"), "contains", evScota, "certain", "Die Schlacht folgt unmittelbar der Landung");
  R(evScota, "before", baseEvent("Schlacht von Tailtiu"), "certain", "Sliab Mis geht der Entscheidungsschlacht voraus");
  R(baseEvent("Bruderkrieg: Éber gegen Éremón"), "before", evEmain, "speculative", "Die Königsrolle liegt zwischen Landnahme und Ulster-Zyklus");
  R(evEmain, "before", baseEvent("Conchobar wird König von Ulster"), "certain", "Emain Macha besteht vor Conchobars Königtum");
  R(evEmain, "before", baseEvent("Machas Fluch über Ulster"), "certain", "Der Ort trägt bereits Machas Namen");
};
