/**
 * Cath Maige Tuired — section-by-section pass through the saga.
 * Run AFTER `mythology`, `mythology-extended`, `mythology-catalog`.
 *
 * Follows the Gray edition (§§) and turns each narrative beat into an
 * event wired into the existing graph around "Zweite Schlacht von Mag
 * Tuired": the schooling in the four cities, Bres' conception by the
 * sea, the doorkeeper scene, the council of the arts, the well of
 * Sláine, Octriallach's cairn, the sparing of Loch Lethglas, Orna,
 * and the Dagda's cattle.
 *
 * Deliberately kept: the tradition's own contradiction — §§33–35 kill
 * Miach, §123 has him working at the well of Sláine. Both statements
 * are entered as the text gives them; the consistency checker must
 * flag the resulting cycle (derived "well before Miach's death" vs.
 * explicit "Miach dead before the council").
 */
import type { Seed } from "./types";

export const name = "Cath Maige Tuired — Saga-Durchgang";
export const description =
  "CMT2 §-für-§: 6 neue Figuren, 12 feingranulare Events am bestehenden Schlachtgraphen. Enthält den Miach-Widerspruch des Textes als Konsistenz-Testfall.";

export const seed: Seed["seed"] = (db) => {
  const selSource = db.prepare(`SELECT id FROM sources WHERE title = ?`);
  const cmtRow = selSource.get("Cath Maige Tuired (The Second Battle of Mag Tuired)") as { id: number } | undefined;
  if (!cmtRow) throw new Error("CMT source missing — run the mythology seed first");
  const CMT = cmtRow.id;

  const selChar = db.prepare(`SELECT id FROM characters WHERE name = ?`);
  const insChar = db.prepare(
    `INSERT INTO characters (name, alt_names, gender, description, epithet, is_deity, is_dead, source_id)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  const selGroup = db.prepare(`SELECT id FROM groups WHERE name = ?`);
  const insCG = db.prepare(`INSERT INTO character_groups (character_id, group_id, source_id) VALUES (?,?,?)`);
  const selCG = db.prepare(`SELECT id FROM character_groups WHERE character_id = ? AND group_id = ?`);
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
  const insEP = db.prepare(`INSERT INTO event_places (event_id, place_id, source_id) VALUES (?,?,?)`);
  const selPlace = db.prepare(`SELECT id FROM places WHERE name = ?`);
  const insERel = db.prepare(
    `INSERT INTO event_relations (from_event_id, to_event_id, relation_type, confidence, reason, source_id)
     VALUES (?,?,?,?,?,?)`
  );

  const charId = (n: string): number => {
    const row = selChar.get(n) as { id: number } | undefined;
    if (!row) throw new Error(`Unknown character: ${n}`);
    return row.id;
  };
  const groupId = (n: string): number => (selGroup.get(n) as { id: number }).id;
  const placeId = (n: string): number | undefined => (selPlace.get(n) as { id: number } | undefined)?.id;
  const baseEvent = (n: string): number => {
    const row = selEvent.get(n) as { id: number } | undefined;
    if (!row) throw new Error(`Base event not found: ${n}`);
    return row.id;
  };

  // ── §§ Figuren, die der Text nennt ─────────────────────────────────────
  const newChars: [string, string[] | null, string, string | null, string, string[]][] = [
    // [name, altNames, gender, epithet, description, groups]
    ["Octriallach", ["Octriallach mac Indech"], "male", "Der Brunnenfüller",
      "Sohn des Fomorenkönigs Indech (§123): Er erkennt, dass der Brunnen Sláine die Gefallenen der Danann heilt, und lässt jeden Fomorer einen Stein darauf werfen — der Cairn Octriallach. Fällt in der Schlacht gegen Ogma.",
      ["Fomorians"]],
    ["Loch Lethglas", ["Loch Halbgrün"], "male", "Der halbgrüne Dichter",
      "Dichter der Fomorer, halb grün von der Erde bis zum Scheitel (§§133–138). Von Lugh nach der Schlacht verschont, gelobt er, die Raubzüge der Fomorer von Irland abzuwenden, und gibt dem Sieger Urteil und Namenslob.",
      ["Fomorians"]],
    ["Figol mac Mamois", null, "male", "Der Feuerdruide",
      "Druide der Tuatha Dé Danann im Kriegsrat (§111): »Drei Feuerregen lasse ich auf die Fomorer fallen, nehme ihnen zwei Drittel von Mut und Kraft — und jeder Atemzug, den sie lassen, kehrt nicht zurück.«",
      ["Tuatha Dé Danann"]],
    ["Mathgen", null, "male", "Der Bergewerfer",
      "Zauberer der Tuatha Dé Danann im Kriegsrat (§110): Er verspricht, die zwölf großen Berge Irlands auf die Fomorer zu schleudern — und nennt sie alle beim Namen.",
      ["Tuatha Dé Danann"]],
    ["Camall mac Riagail", null, "male", "Der Torwächter von Tara",
      "Türhüter Nuadas (§§53–71). An ihm prüft der junge Lugh Kunst um Kunst — bis Camall dem König melden muss: Einer steht vor dem Tor, der alle Künste zugleich besitzt.",
      ["Tuatha Dé Danann"]],
    ["Tochter des Indech", null, "female", null,
      "Ungenannte Tochter des Fomorenkönigs Indech (§§93–99): Nach dem Brei-Gelage ringt sie mit dem Dagda, gewinnt ihn — und verspricht, ihre Zauberkraft gegen das eigene Heer zu wenden.",
      ["Fomorians"]],
  ];
  for (const [n, alt, g, e, d, grps] of newChars) {
    const existing = selChar.get(n) as { id: number } | undefined;
    const id = existing
      ? existing.id
      : (insChar.run(n, alt ? JSON.stringify(alt) : null, g, d, e, 0, n === "Octriallach" ? 1 : 0, CMT).lastInsertRowid as number);
    for (const grp of grps) {
      if (!selCG.get(id, groupId(grp))) insCG.run(id, groupId(grp), CMT);
    }
  }
  const famRel = (from: string, type: string, to: string, notes?: string) => {
    if (!selFam.get(charId(from), charId(to), type)) {
      insFam.run(charId(from), charId(to), type, notes ?? null, CMT);
    }
  };
  famRel("Indech", "father", "Octriallach");
  famRel("Indech", "father", "Tochter des Indech");
  famRel("Octriallach", "sibling", "Tochter des Indech");
  famRel("Dagda", "lover", "Tochter des Indech", "Nach dem Brei-Gelage (§93)");

  // ── Events §-für-§ ─────────────────────────────────────────────────────
  const E: Record<string, number> = {};
  function ev(opts: {
    k: string; n: string; d: string; t: string;
    parent?: string; lifecycleOf?: string;
    chars?: [string, string, string?][];
    places?: string[];
  }) {
    const id = insEvent.run(
      opts.n, opts.d, opts.t,
      opts.parent ? E[opts.parent] ?? baseEvent(opts.parent) : null,
      opts.lifecycleOf ? charId(opts.lifecycleOf) : null,
      "mythological", "Cath Maige Tuired", CMT
    ).lastInsertRowid as number;
    E[opts.k] = id;
    for (const [cn, role, note] of opts.chars ?? []) {
      insEC.run(id, charId(cn), role, note ?? null, CMT);
    }
    for (const pn of opts.places ?? []) {
      const pid = placeId(pn);
      if (pid) insEP.run(id, pid, CMT);
    }
    return id;
  }
  const R = (fromKey: string | number, type: string, toKey: string | number, conf: string, reason: string) => {
    const f = typeof fromKey === "number" ? fromKey : E[fromKey] ?? baseEvent(fromKey);
    const t = typeof toKey === "number" ? toKey : E[toKey] ?? baseEvent(toKey);
    insERel.run(f, t, type, conf, reason, CMT);
  };

  // §1–7: Die Lehrjahre im Norden
  ev({ k: "schooling", n: "Die Lehrjahre in den vier Städten", t: "other",
    d: "§§1–7: In Falias, Gorias, Findias und Murias lernen die Tuatha Dé Danann Wissen, Druidenkunst und Zauber — und empfangen die vier Schätze.",
    chars: [["Nuada", "protagonist"], ["Dagda", "ally"]],
    places: ["Falias", "Gorias", "Findias", "Murias"] });
  R("schooling", "before", "Ankunft der Tuatha Dé Danann", "certain", "§7: Mit Wissen und Schätzen brechen sie auf");

  // §§14–25: Zeugung des Bres
  ev({ k: "bres_birth", n: "Zeugung des Bres am Meer", t: "birth", lifecycleOf: "Bres",
    d: "§§14–25: Ein Silberschiff auf glatter See — Elatha in Gold tritt zu Ériu. Er lässt ihr den Ring und den Namen: Eochu Bres soll der Knabe heißen; nach sieben Jahren trägt er das Wachstum von vierzehn.",
    chars: [["Elatha", "ally"], ["Ériu", "protagonist"], ["Bres", "protagonist"]] });
  R("Ankunft der Tuatha Dé Danann", "before", "bres_birth", "probable", "Ériu gehört zum gelandeten Göttervolk");
  R("bres_birth", "before", "Erste Schlacht von Mag Tuired", "probable", "Bres ist erwachsen, als Nuada den Arm verliert");

  // §§39–46: Bres' Gang zu den Fomorern
  ev({ k: "bres_exile", n: "Bres' Gang zu Elatha", t: "journey",
    d: "§§39–46: Entthront sucht Bres den Vater. Elatha weist den ungerechten Anspruch ab — »Recht ging dir verloren, Recht bringt dich nicht zurück« — und schickt ihn zu Balor und Indech: Sie sammeln die Flotte von Lochlann bis Irland.",
    chars: [["Bres", "protagonist"], ["Ériu", "ally", "Zeigt ihm den Ring des Vaters"], ["Elatha", "other"], ["Balor", "ally"], ["Indech", "ally"]] });
  R("Die erste Satire Irlands", "before", "bres_exile", "certain", "Die Satire stürzt Bres, dann geht er");
  R("bres_exile", "before", "Zweite Schlacht von Mag Tuired", "certain", "§46: Die gesammelte Flotte führt zur Schlacht");

  // §§53–71: Der Samildánach am Tor
  ev({ k: "doorkeeper", n: "Der Samildánach am Tor", t: "meeting", parent: "Lugh kommt nach Tara",
    d: "§§53–71: Zimmermann? Haben wir. Schmied? Haben wir. Kämpe, Harfner, Held, Dichter, Zauberer, Arzt, Mundschenk, Erzgießer? Haben wir alle. — »Dann frage den König, ob er einen Mann hat, der alle diese Künste zugleich kann.«",
    chars: [["Lugh", "protagonist"], ["Camall mac Riagail", "other", "Der Türhüter, der die Meldung bringt"], ["Nuada", "mentioned"]],
    places: ["Temair"] });
  ev({ k: "fidchell", n: "Lughs Fidchell-Siege", t: "meeting", parent: "Lugh kommt nach Tara",
    d: "§69: Zur Probe lässt Nuada die Fidchell-Bretter bringen — Lugh gewinnt jede Partie; da räumt ihm der König den Sitz des Weisen.",
    chars: [["Lugh", "protagonist"], ["Nuada", "other"]],
    places: ["Temair"] });
  R("doorkeeper", "before", "fidchell", "certain", "Erst der Einlass, dann die Probe");

  // §§78–120: Der Kriegsrat der Künste
  ev({ k: "council", n: "Der Kriegsrat der Künste", t: "meeting",
    d: "§§78–120: Lugh fragt jeden nach seiner Kraft. Goibniu: jede Speerspitze mit drei Schlägen, kein Wurf verfehlt. Dian Cécht: jeden Verwundeten heil, dem der Kopf nicht ab ist. Credne: Nieten, Luchta: Schäfte. Ogma: das Schwert des Königs. Morrígan: verfolgen und vernichten. Bé Chuille: Bäume und Steine zu Kriegern. Cairbre: die Satire, die Gesichter rötet. Mathgen: die zwölf Berge. Figol: drei Feuerregen. Und der Dagda: »Was ihr alle versprecht, tue ich allein.« — »Du bist der Dagda!«",
    chars: [["Lugh", "protagonist"], ["Goibniu", "ally"], ["Dian Cécht", "ally"], ["Credne", "ally"], ["Luchta", "ally"], ["Ogma", "ally"], ["Morrígan", "ally"], ["Bé Chuille", "ally"], ["Cairbre mac Étaíne", "ally"], ["Mathgen", "ally"], ["Figol mac Mamois", "ally"], ["Dagda", "ally", "»Was ihr alle versprecht, tue ich allein«"]] });
  R("Lugh kommt nach Tara", "before", "council", "certain", "Lugh beruft den Rat");
  R("council", "before", "Zweite Schlacht von Mag Tuired", "certain", "Der Rat rüstet die Schlacht");
  // Der Text-Widerspruch, den die Konsistenz-Prüfung finden soll:
  R("Dian Cécht erschlägt Miach", "before", "council", "probable",
    "§35 vor §78: Miach ist erschlagen, ehe der Kriegsrat tagt");

  // §§93–99: Indechs Tochter
  const porridge = baseEvent("Dagdas Gang zu den Fomorern");
  insEC.run(porridge, charId("Tochter des Indech"), "protagonist",
    "§§93–99: Ringt den breischweren Dagda — und verspricht, ihre Zauberkraft gegen das eigene Heer zu wenden", CMT);

  // §123: Der Brunnen Sláine — mit dem Miach-Widerspruch des Textes
  ev({ k: "well", n: "Der Brunnen Sláine", t: "transformation", parent: "Zweite Schlacht von Mag Tuired",
    d: "§123: Die tödlich Verwundeten werden in den Brunnen getaucht und steigen heil heraus — durch den Zaubersang von Dian Cécht, seinen Kindern... und, so der Text wörtlich, auch Miach: Der Widerspruch zur eigenen Erzählung (§35) steht so in der Überlieferung.",
    chars: [["Dian Cécht", "protagonist"], ["Airmed", "ally"], ["Miach", "ally", "§123 nennt ihn hier — obwohl §35 ihn erschlägt: Widerspruch im Text"], ["Octriallach", "mentioned", "Er wird den Brunnen entdecken"]],
    places: ["Mag Tuired"] });
  R("council", "before", "well", "certain", "Dian Céchts Zusage aus dem Rat wird am Brunnen eingelöst");

  // §124: Octriallachs Cairn
  ev({ k: "cairn", n: "Octriallach füllt den Brunnen", t: "other", parent: "Zweite Schlacht von Mag Tuired",
    d: "§124: Jeder Fomorer wirft einen Stein in den Brunnen Sláine — der Steinhügel heißt fortan Cairn Octriallach.",
    chars: [["Octriallach", "protagonist"], ["Indech", "mentioned"]],
    places: ["Mag Tuired"] });
  R("well", "before", "cairn", "certain", "Der Brunnen heilt, ehe er gefüllt wird");
  ev({ k: "octriallach_death", n: "Tod des Octriallach", t: "death", parent: "Zweite Schlacht von Mag Tuired", lifecycleOf: "Octriallach",
    d: "Im Schlachtgetümmel fallen Octriallach und Omna durch Ogma — Vers der Schlachtaufzählung.",
    chars: [["Octriallach", "victim"], ["Ogma", "protagonist"]] });
  R("cairn", "before", "octriallach_death", "certain", "Der Cairn steht, ehe sein Namensgeber fällt");

  // §§133–138: Loch Lethglas
  ev({ k: "loch_spared", n: "Lugh verschont Loch Lethglas", t: "meeting",
    d: "§§133–138: Der halbgrüne Dichter bittet um Gnade und zahlt mit Gelöbnis und Lied: Die Raubzüge der Fomorer sollen Irland meiden, solange Lughs Geschlecht wacht.",
    chars: [["Lugh", "protagonist"], ["Loch Lethglas", "victim"]] });
  R("Zweite Schlacht von Mag Tuired", "before", "loch_spared", "certain", "Die Gnade folgt dem Sieg");

  // §§160–162: Orna
  ev({ k: "orna", n: "Ogma erbeutet Orna", t: "other",
    d: "§§160–162: Ogma findet Orna, das Schwert Tethras, auf dem Schlachtfeld und entblößt es — da erzählt das Schwert die Taten, die mit ihm getan wurden: »denn Schwerter ehrten damals, was sie taten.«",
    chars: [["Ogma", "protagonist"], ["Tethra", "mentioned"]] });
  R("Zweite Schlacht von Mag Tuired", "before", "orna", "certain", "Die Beute nach der Schlacht");

  // §§163–165: Die Rinder des Dagda
  ev({ k: "cattle", n: "Die Rinder folgen der Färse des Dagda", t: "other",
    d: "§§163–165: Für seine Mühen hatte sich der Dagda nur eine schwarzmähnige Färse erbeten — die Fomorer lachten. Nun brüllt sie: und alles Vieh Irlands, das die Fomorer als Tribut nahmen, folgt ihrem Ruf nach Hause.",
    chars: [["Dagda", "protagonist"]] });
  R("Zweite Schlacht von Mag Tuired", "before", "cattle", "certain", "Die Herden kehren nach dem Sieg zurück");
  R("cattle", "before", "Prophezeiung der Morrígan", "probable", "Der Siegesspruch beschließt die Erzählung");
};
