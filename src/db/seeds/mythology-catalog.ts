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

export const name = "Name Catalog (all cycles)";
export const description =
  "Complete name inventory across all cycles: LGE catalogs (fifty women, chieftains, Roll of Kings), the Da Derga and Táin musters, the Fianna rolls and the Roll of Kings from Ugaine to Conn. Requires 'mythology' + 'mythology-extended'.";

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

  // ═════════════════════════════════════════════════════════════════════
  // 4. Die Musterung aus Togail Bruidne Dá Derga
  // ═════════════════════════════════════════════════════════════════════

  const daDerga: Def[] = [
    { n: "Lomna Drúth", g: "male", e: "Der Narr der Räuber", dead: true,
      d: "Sohn des Donn Désa, Narr unter den Räubern. Warnt als Einziger vor dem Überfall — und fällt als Erster: Sein Haupt wird dreimal in die Halle geworfen und dreimal hinaus." },
    { n: "Fer Le", g: "male", dead: true,
      d: "Sohn des Donn Désa, Ziehbruder Conaire Mórs — einer der drei, deren Räuberei der König nicht richten wollte und die ihn dafür richteten." },
    { n: "Fer Gar", g: "male", dead: true,
      d: "Sohn des Donn Désa, Ziehbruder Conaire Mórs, Räuber von Da Dergas Halle." },
    { n: "Le Fri Flaith", g: "male", dead: true,
      d: "Kleiner Sohn Conaire Mórs, auf drei Kissen in der Halle — sein Tod ist die bitterste Klage der Musterung." },
    { n: "Tulchinne", g: "male", e: "Der Gaukler des Königs",
      d: "Jongleur Conaires in Da Dergas Halle: neun Schwerter, neun Silberschilde, neun Goldäpfel zugleich in der Luft — als die Geasa brechen, fallen sie ihm zu Boden." },
    { n: "Die drei Roten", alt: ["Na trí Deirg"], g: "other", deity: true, grp: ["Aes Sídhe"],
      d: "Drei rote Reiter auf roten Pferden aus dem Síd — Conaire folgt ihnen wider seine Geis zur Halle: »Wir reiten die Pferde des Todes.«" },
  ];
  for (const c of daDerga) upsert(c);
  rel("Donn Désa", "father", "Lomna Drúth");
  rel("Donn Désa", "father", "Fer Le");
  rel("Donn Désa", "father", "Fer Gar");
  rel("Fer Rogain", "sibling", "Fer Le");
  rel("Fer Rogain", "sibling", "Fer Gar");
  rel("Lomna Drúth", "sibling", "Fer Rogain");
  rel("Conaire Mór", "father", "Le Fri Flaith");

  const evDaDerga = baseEvent("Zerstörung von Dá Dergas Halle");
  insEC.run(evDaDerga, charId("Lomna Drúth"), "victim", "Sein Haupt ward dreimal hineingeworfen", LGE);
  insEC.run(evDaDerga, charId("Le Fri Flaith"), "victim", null, LGE);
  insEC.run(evDaDerga, charId("Tulchinne"), "other", "Die Goldäpfel fielen, als das Unheil kam", LGE);
  insEC.run(evDaDerga, charId("Die drei Roten"), "mentioned", "Das Omen vor der Halle", LGE);

  // ═════════════════════════════════════════════════════════════════════
  // 5. Die Heerschau der Táin (Ulster-Musterung)
  // ═════════════════════════════════════════════════════════════════════

  const tainMuster: Def[] = [
    { n: "Rochad mac Faithemain", g: "male", grp: ["Ulaid"],
      d: "Junger Ulter Held, den Findabair heimlich liebte — Medb bot ihn der Tochter zur Nacht, um ihn vom Heer fernzuhalten: »Rochads blutlose Schlacht«." },
    { n: "Íliach", g: "male", e: "Der nackte Alte im Klappernden Wagen", grp: ["Ulaid"], dead: true,
      d: "Greis der Ulter: Zieht nackt im zerfallenden Wagen mit Steinen und Brocken ins Heer Connachts und zermalmt es, bis man ihm auf eigene Bitte das Haupt nimmt — »Íliachs Mahlwerk«." },
    { n: "Fintan mac Néill", g: "male", grp: ["Ulaid"],
      d: "Vater des Cethern. Sein »Zahnkampf« — dreimal fünfzig Männer, Rücken an Rücken durchgebissen — gehört zu den grimmigsten Stücken der Heerschau." },
    { n: "Lugaid mac Nóis", g: "male", grp: ["Ulaid"],
      d: "König von Munster im Exil, Jugendfreund Cú Chulainns; warb einst um Emer, trat aber zurück, als er die Liebe des Freundes erkannte." },
    { n: "Lendabair", g: "female", grp: ["Ulaid"],
      d: "Tochter Eogans, Frau Conall Cernachs — im Frauenstreit von Bricrius Fest die zweite der drei, die um den Vortritt wetteiferten." },
    { n: "Eithne Ingubai", g: "female", grp: ["Ulaid"],
      d: "Frau (oder Geliebte) Cú Chulainns in der älteren Fassung des Serglige — die spätere Überlieferung setzt Emer an ihre Stelle." },
    { n: "Muinremur mac Gerrcind", g: "male", grp: ["Ulaid"], conf: "speculative",
      d: "Ulter Held der Heerschau der Táin — »Dicknacken«; über Name und Musterung hinaus ist wenig überliefert." },
    { n: "Errge Echbél", g: "male", grp: ["Ulaid"], conf: "speculative",
      d: "»Pferdemaul« — Ulter Held der Heerschau; nur namentlich mit Beinamen bezeugt." },
    { n: "Mend mac Sálchada", g: "male", grp: ["Ulaid"], conf: "speculative",
      d: "Ulter Held der Heerschau der Táin; nur namentlich bezeugt." },
  ];
  for (const c of tainMuster) upsert(c);
  rel("Fintan mac Néill", "father", "Cethern mac Fintain");
  rel("Lendabair", "spouse", "Conall Cernach");
  rel("Rochad mac Faithemain", "lover", "Findabair");
  rel("Eithne Ingubai", "lover", "Cú Chulainn", "In der älteren Serglige-Fassung seine Frau");

  // ═════════════════════════════════════════════════════════════════════
  // 6. Die Fianna-Rollen (Acallam, Bruidhean-Erzählungen, Fionntrá)
  // ═════════════════════════════════════════════════════════════════════

  const fiannaRoll: Def[] = [
    { n: "Faolán mac Fionn", g: "male", grp: ["Fianna", "Clann Baíscne"],
      d: "Sohn Fionns, treuer Kämpe der Fianna — hält in der Nacht des Rowan-Hauses mit Diarmuid die Furt." },
    { n: "Raighne Roisclethan", g: "male", grp: ["Fianna", "Clann Baíscne"], conf: "speculative",
      d: "»Weitauge«, Sohn Fionns in den Fianna-Rollen des Acallam; über Name und Zugehörigkeit hinaus wenig überliefert." },
    { n: "Art Óg mac Morna", g: "male", grp: ["Fianna", "Clann Morna"], conf: "speculative",
      d: "Krieger der Clann Morna in den Fianna-Rollen; namentlich bezeugt." },
    { n: "Garraidh mac Morna", g: "male", grp: ["Fianna", "Clann Morna"],
      d: "Alter Kämpe der Clann Morna — sein Streich mit den ans Haus genagelten Haarzöpfen der Frauen von Almu gehört zu den derbsten Fianna-Schwänken." },
    { n: "Aidín", alt: ["Aideen"], g: "female", dead: true,
      d: "Frau Oscars. Stirbt aus Gram über seinen Fall bei Gabhair — Oisín begräbt sie am Binn Éadair (Howth); der Dolmen dort gilt als ihr Grab." },
    { n: "Colga", alt: ["Colga mac Teine Bhrisgthe"], g: "male", e: "König von Lochlann", dead: true,
      d: "König von Lochlann, fällt bei seiner Invasion Irlands gegen die Fianna — sein jüngster Sohn Miodhach wird geschont und aufgezogen: die Saat des Rowan-Hauses." },
    { n: "Miodhach mac Colgáin", alt: ["Midac"], g: "male", e: "Der Verräter des Rowan-Hauses", dead: true,
      d: "Als Kind geschont, als Mann der Rächer: Vierzehn Jahre plant er, lädt die Fianna ins verzauberte Haus der Vogelbeere und ruft die Heere der Welt — Diarmuid nimmt ihm das Haupt." },
    { n: "Sinsear na gCath", alt: ["Sinsear of the Battles"], g: "male", e: "König der Welt", dead: true,
      d: "Weltenkönig, den Miodhach ins Land ruft — vor dem Rowan-Haus fällt er mit seinen Heeren an der Furt." },
    { n: "Borba", alt: ["Borba der Hochmütige"], g: "male", dead: true,
      d: "Sohn des Sinsear na gCath — fällt an der Furt des Rowan-Hauses gegen die Getreuen Fionns." },
    { n: "Bolcán", alt: ["Bolcán König von Frankreich"], g: "male", e: "König von Frankreich",
      d: "König der Franken in der Schlacht von Fionntrá — flieht wahnsinnig aus dem Gemetzel: Der Sage nach irrte er fortan als Geilt durch die Täler." },
  ];
  for (const c of fiannaRoll) upsert(c);
  rel("Fionn mac Cumhaill", "father", "Faolán mac Fionn");
  rel("Fionn mac Cumhaill", "father", "Raighne Roisclethan");
  rel("Goll mac Morna", "sibling", "Art Óg mac Morna");
  rel("Goll mac Morna", "sibling", "Garraidh mac Morna");
  rel("Oscar", "spouse", "Aidín");
  rel("Colga", "father", "Miodhach mac Colgáin");
  rel("Sinsear na gCath", "father", "Borba");

  const evRowan = baseEvent("Das Haus der Vogelbeere");
  insEC.run(evRowan, charId("Miodhach mac Colgáin"), "antagonist", "Der Gastgeber der Falle", LGE);
  insEC.run(evRowan, charId("Sinsear na gCath"), "antagonist", "Der gerufene Weltenkönig", LGE);
  insEC.run(evRowan, charId("Borba"), "victim", "Fiel an der Furt", LGE);
  insEC.run(evRowan, charId("Faolán mac Fionn"), "ally", null, LGE);
  const evVentry = baseEvent("Schlacht von Fionntrá");
  insEC.run(evVentry, charId("Bolcán"), "victim", "Floh wahnsinnig aus der Schlacht", LGE);

  // ═════════════════════════════════════════════════════════════════════
  // 7. Königsrolle II: von Ugaine Mór bis Conn Cétchathach
  // ═════════════════════════════════════════════════════════════════════

  const KINGS2: [string, string, ("established" | "speculative")?][] = [
    ["Meilge Molbthach", "Sohn Cobthachs — »der Löbliche«; unter seinem Grab brach Loch Melge hervor."],
    ["Mug Corb", "König der Rolle."],
    ["Óengus Ollam", "König der Rolle."],
    ["Irereo", "König der Rolle, von Fer Corb gefällt."],
    ["Fer Corb", "König der Rolle."],
    ["Connla Cáem", "»Der Anmutige«, König der Rolle."],
    ["Ailill Caisfiaclach", "»Der mit den gekrümmten Zähnen«, König der Rolle."],
    ["Eochaid Ailtlethan", "König der Rolle."],
    ["Fergus Fortamail", "»Der Übermächtige«, König der Rolle."],
    ["Óengus Tuirmech Temrach", "»Der Beschämte von Tara« — Vater des Fíacha Fer Mara, den er ausgesetzt aufs Meer gab."],
    ["Conall Collamrach", "König der Rolle."],
    ["Nia Segamain", "In seiner Herrschaft ließen sich die Hirschkühe melken wie Hauskühe — Gabe seiner Mutter, der Göttin Flidais.", "established"],
    ["Énna Aignech", "»Der Gastfreie«, König der Rolle."],
    ["Crimthann Coscrach", "»Der Siegreiche«, König der Rolle."],
    ["Finnat Már", "König der Rolle."],
    ["Bresal Bó-Díbad", "In seiner Zeit raffte die große Rinderpest fast alles Vieh Irlands dahin — bis auf einen Stier und eine Färse in Gleann Samhaisce.", "established"],
    ["Lugaid Luaigne", "König der Rolle."],
    ["Congal Cláiringnech", "»Der Flachnägelige«, König der Rolle."],
    ["Dui Dallta Dedad", "»Der von Deda Geblendete«, König der Rolle."],
    ["Nuadu Necht", "Kurzkönig aus Leinster vor Conaire Mór."],
    ["Conchobar Abratruad", "»Der Rotbrauige« — Namensvetter des Ulster-Königs in der Rolle von Tara."],
    ["Crimthann Nia Náir", "Fuhr mit der Anderswelt-Frau Nár auf große Fahrt und kehrte mit Wunderschätzen heim — an denen er starb.", "established"],
    ["Fíatach Finn", "König der Rolle, Ahnherr der Dál Fiatach."],
    ["Fíachu Finnolach", "König der Rolle, Vater Túathal Techtmars, von den Untertanenvölkern erschlagen."],
    ["Elim mac Conrach", "Usurpator der Untertanenvölker — unter ihm verweigerte das Land Korn und Milch, bis Túathal zurückkehrte."],
    ["Mal mac Rochride", "König der Rolle, Töter Túathals."],
  ];
  for (const [n, note, conf] of KINGS2) {
    upsert({
      n, g: "male", dead: true, conf: (conf ?? "speculative"),
      d: note + " Eintrag der Königsrolle (Réim Rígraide) zwischen Ugaine Mór und Conn Cétchathach.",
    });
  }
  rel("Cobthach Cóel Breg", "father", "Meilge Molbthach");
  rel("Flidais", "mother", "Nia Segamain", "Die Gabe der gemolkenen Hirschkühe");

  // Substantive kings and their circle
  const kingsCircle: Def[] = [
    { n: "Fachtna Fáthach", g: "male", e: "Der Weise", grp: ["Ulaid"], dead: true,
      d: "König von Ulster und Tara, Gemahl der Ness — in der jüngeren Überlieferung Conchobars leiblicher Vater, wo die ältere Cathbad nennt." },
    { n: "Rudraige mac Sithrigi", g: "male", e: "Ahnherr der Clanna Rudraige", dead: true,
      d: "König der Rolle, von dem die großen Ulter Geschlechter — Fergus mac Róich, Conall Cernach, die Clanna Rudraige — ihre Abkunft zählen." },
    { n: "Feradach Finnfechtnach", g: "male", e: "Der Wahrhaft-Gesegnete", dead: true,
      d: "König von Tara, in dessen Zeit der Richter Morann urteilte — Wahrheit und Fülle kennzeichnen seine Herrschaft in der Rolle." },
    { n: "Morann", alt: ["Morann mac Máin"], g: "male", e: "Der Richter mit dem Halsreif",
      d: "Der große Richter der Königszeit: Sein Halsreif, das Id Morainn, zog sich um den Hals des Lügners zusammen und weitete sich beim wahren Urteil — Verfasser der ältesten Fürstenlehre Irlands." },
    { n: "Túathal Techtmar", g: "male", e: "Der Rechtmäßige", grp: ["Uí Néill"], dead: true,
      d: "Kehrt aus dem Exil zurück, bricht den Aufstand der Untertanenvölker und schneidet aus den vier Provinzen das Königsland Mide. Der Betrug an seinen Töchtern Fithir und Dáirine bringt Leinster die Bórama — den Kuhtribut, um den Jahrhunderte gekämpft wird." },
    { n: "Fithir", g: "female", dead: true,
      d: "Tochter Túathal Techtmars, dem Leinster-König Eochaid Ainchenn vermählt — stirbt vor Scham, als der Betrug an ihrer Schwester offenbar wird." },
    { n: "Dáirine", g: "female", dead: true,
      d: "Tochter Túathal Techtmars. Eochaid erschlich sie mit der Lüge, Fithir sei tot — beim Wiedersehen der Schwestern stirbt Fithir vor Scham, Dáirine vor Gram." },
    { n: "Eochaid Ainchenn", g: "male", e: "König von Leinster",
      d: "Betrog Túathal um beide Töchter — sein Betrug kostet Leinster die Bórama, den Kuhtribut an Tara." },
    { n: "Fedlimid Rechtmar", g: "male", e: "Der Gesetzgeber", grp: ["Uí Néill"], dead: true,
      d: "Sohn Túathals, Vater Conn Cétchathachs — führte das Vergeltungsrecht »Auge um Auge« ein, und Irland war friedlich in seiner Zeit." },
    { n: "Cathair Mór", g: "male", e: "König von Leinster und Tara", dead: true,
      d: "Letzter Leinster-König von Tara vor Conn. Sein »Testament« verteilt Schätze an die Sippen Leinsters — von ihm stammen ihre Königslinien." },
    { n: "Nath Í", alt: ["Dathí"], g: "male", e: "Der letzte Heidenkönig", grp: ["Uí Néill"], dead: true,
      d: "Neffe und Nachfolger Nialls, letzter heidnischer Hochkönig — vom Blitz erschlagen am Fuß der Alpen auf großer Heerfahrt; sein Leichnam ward heimgetragen und in Cruachan begraben." },
  ];
  for (const c of kingsCircle) upsert(c);
  rel("Fachtna Fáthach", "spouse", "Ness");
  rel("Fachtna Fáthach", "father", "Conchobar mac Nessa", "In der jüngeren Fassung; die ältere nennt Cathbad");
  rel("Rudraige mac Sithrigi", "other", "Fergus mac Róich", "Ahnherr der Clanna Rudraige");
  rel("Fíachu Finnolach", "father", "Túathal Techtmar");
  rel("Túathal Techtmar", "father", "Fithir");
  rel("Túathal Techtmar", "father", "Dáirine");
  rel("Fithir", "sibling", "Dáirine");
  rel("Eochaid Ainchenn", "spouse", "Fithir");
  rel("Eochaid Ainchenn", "spouse", "Dáirine", "Erschlichen mit der Lüge vom Tod der Schwester");
  rel("Túathal Techtmar", "father", "Fedlimid Rechtmar");
  rel("Fedlimid Rechtmar", "father", "Conn Cétchathach");
  rel("Niall Noígíallach", "uncle", "Nath Í");

  // Artifact: the Collar of Morann
  const insArtifact2 = db.prepare(
    "INSERT INTO artifacts (name, alt_names, type, description, powers, source_id) VALUES (?,?,?,?,?,?)"
  );
  const selArtifact2 = db.prepare("SELECT id FROM artifacts WHERE name = ?");
  const insAC2 = db.prepare(
    "INSERT INTO artifact_characters (artifact_id, character_id, relationship, notes, source_id) VALUES (?,?,?,?,?)"
  );
  if (!selArtifact2.get("Id Morainn")) {
    const aid = insArtifact2.run(
      "Id Morainn",
      JSON.stringify(["Collar of Morann", "Halsreif des Morann"]),
      "jewel",
      "Der Richter-Halsreif des Morann.",
      "Zieht sich um den Hals des ungerechten Richters zusammen und weitet sich, wenn die Wahrheit gesprochen wird.",
      LGE
    ).lastInsertRowid as number;
    insAC2.run(aid, charId("Morann"), "owner", null, LGE);
  }

  // Events
  const evBorama = addEvent({
    n: "Der Ursprung der Bórama",
    d: "Eochaid Ainchenn erschleicht sich beide Töchter Túathals mit der Lüge vom Tod der ersten; beim Wiedersehen sterben Fithir vor Scham und Dáirine vor Gram. Túathal legt Leinster die Bórama auf — den Kuhtribut, um den Jahrhunderte gestritten wird.",
    t: "other", cy: "kings",
    chars: [["Túathal Techtmar", "protagonist"], ["Fithir", "victim"], ["Dáirine", "victim"], ["Eochaid Ainchenn", "antagonist"]],
  });
  R(evEmain, "before", evBorama, "probable", "Túathal steht spät in der Rolle");
  R(evBorama, "before", baseEvent("Herrschaft des Conn Cétchathach"), "certain", "Túathal ist Conns Großvater");

  const evNathi = addEvent({
    n: "Tod des Nath Í am Fuß der Alpen",
    d: "Auf großer Heerfahrt bis an die Alpen erschlägt der Blitz den letzten Heidenkönig — sein Leichnam wird heimgetragen und im roten Hügel von Cruachan begraben.",
    t: "death", cy: "kings", lifecycleOf: "Nath Í",
    chars: [["Nath Í", "victim"]],
  });
  R(baseEvent("Herrschaft des Niall Noígíallach"), "before", evNathi, "certain", "Nath Í folgt Niall");
  R(evNathi, "before", baseEvent("Patrick in Tara"), "certain", "Lóegaire folgt Nath Í");
};
