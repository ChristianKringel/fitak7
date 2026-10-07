// Title normalization used to group versions of the same song
// ("Ao Vivo", "Acústico", "Remaster", "feat." ...) and to produce clean
// display titles that don't hint at the version being played.

/** Lowercases and strips diacritics: "Acústico" -> "acustico". */
export function foldText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Folds and collapses whitespace; used for comparing artist names. */
export function foldName(text: string): string {
  return foldText(text).replace(/\s+/g, " ").trim();
}

// Words that mark a version of a song rather than a different song.
// Regex fragments, matched as whole words against folded text, inside
// brackets or after a dash (and anywhere in album titles).
const VERSION_WORDS = [
  "ao vivo",
  "en vivo",
  "live",
  "acustico",
  "acustica",
  "acoustic",
  "unplugged",
  "mtv",
  "remaster",
  "remastered",
  "remasterizado",
  "remasterizada",
  "remasterizacao",
  "versao",
  "version",
  "edit",
  "mono",
  "stereo",
  "demo",
  "instrumental",
  "playback",
  "karaoke",
  "remix",
  "mix",
  "mixagem",
  "dub",
  "beats?",
  "groove",
  "radio",
  "bonus",
  "outtake",
  "take \\d+",
  "intro",
  "vinheta",
  "espanhol",
  "spanish",
  "orquestrad[ao]",
  "sinfonico",
  "voz e violao",
  "microfonado",
];

// Markers that introduce guest artists; everything after them is dropped.
const FEATURING_PREFIX = String.raw`(?:feat\.?|ft\.|featuring|part\.|participacao(?: especial)?(?: de)?)`;

const VERSION_WORD_RE = new RegExp(
  String.raw`(?:^|[^\p{L}\p{N}])(?:${VERSION_WORDS.join("|")})(?=$|[^\p{L}\p{N}])`,
  "u",
);
const FEATURING_START_RE = new RegExp(String.raw`^\s*${FEATURING_PREFIX}(?=\s|$)`, "u");
// Unbracketed "feat. X" in the middle or end of a title.
const INLINE_FEATURING_RE = new RegExp(String.raw`\s${FEATURING_PREFIX}\s.*$`, "u");

// Bare suffixes with no brackets or dash: "Song Ao Vivo", "Song versão acústica",
// "Song Ao Vivo em Porto Alegre". A song whose real title ends in "ao vivo"
// would lose it; in Deezer data that is far rarer than the marker.
const BARE_SUFFIX_RE =
  /\s(?:ao vivo(?:\s(?:em|no|na)\s.*)?|versao (?:acustica|ao vivo|sem publico|single|original|instrumental|demo|estendida|remasterizada)(?:\s.*)?)$/u;

const MEDLEY_RE = /(?:^|[^\p{L}])(?:medley|pot[\s-]?pourri)(?:$|[^\p{L}])/u;
// Joined tracks ("Índios / Faroeste Caboclo") behave like medleys.
// Slashes between digits ("24/7") are not joins.
const JOINED_TRACKS_RE = /(?<!\d)\/|\/(?!\d)/u;

/** True when the (folded) text contains a version marker word. */
function hasVersionWord(folded: string): boolean {
  return VERSION_WORD_RE.test(folded);
}

function isMarkerSegment(content: string): boolean {
  const folded = foldText(content);
  return hasVersionWord(folded) || FEATURING_START_RE.test(folded);
}

/**
 * Removes version/featuring markers while preserving the original
 * casing and accents of the remaining title.
 */
function stripMarkers(title: string): string {
  let result = title;
  let previous: string;
  do {
    previous = result;

    // Bracketed segments: "(Ao Vivo)", "[Remastered 2011]", "(feat. X)".
    result = result.replace(/\s*[([]([^()[\]]*)[)\]]/g, (match, content: string) =>
      isMarkerSegment(content) ? "" : match,
    );

    // Dash suffix: "Song - Ao Vivo", "Song - 2004 Remaster".
    const dash = result.match(/^(.*\S)\s+[-–—]\s+([^-–—]+)$/u);
    if (dash && isMarkerSegment(dash[2])) {
      result = dash[1];
    }

    // Unbracketed featuring ("Song feat. X") and bare suffixes ("Song Ao Vivo").
    // Folding keeps the length for the characters involved, so match
    // indexes map back to the original text.
    const folded = foldText(result);
    if (folded.length === result.length) {
      const cut = [INLINE_FEATURING_RE, BARE_SUFFIX_RE]
        .map((re) => folded.match(re)?.index)
        .filter((i): i is number => i !== undefined && i > 0);
      if (cut.length > 0) result = result.slice(0, Math.min(...cut));
    }

    result = result.replace(/\s+/g, " ").replace(/[\s\-–—:,]+$/u, "").trim();
  } while (result !== previous);

  // Never strip a title down to nothing (e.g. a song literally called "Live").
  return result || title.trim();
}

/** Title shown to players: markers removed, casing and accents kept. */
export function displayTitle(title: string): string {
  return stripMarkers(title);
}

/** Key used to group versions of the same song. */
export function normalizeTitle(title: string): string {
  return foldText(stripMarkers(title))
    .replace(/&/g, " e ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** True if the title carries any version or featuring marker. */
export function hasVersionMarker(title: string): boolean {
  return stripMarkers(title) !== title.replace(/\s+/g, " ").trim();
}

/** True if an album title suggests a live/acoustic/remastered release. */
export function isVersionAlbumTitle(albumTitle: string): boolean {
  return hasVersionWord(foldText(albumTitle));
}

export function isMedley(title: string): boolean {
  return MEDLEY_RE.test(foldText(title)) || JOINED_TRACKS_RE.test(title);
}

/** URL-safe slug: "Bidê ou Balde" -> "bide-ou-balde". */
export function slugify(text: string): string {
  return foldText(text)
    .replace(/&/g, " e ")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/** Title without any bracketed segment or dash suffix, normalized. */
function baseTitle(title: string): string {
  const base = title
    .replace(/[([][^()[\]]*[)\]]/g, " ")
    .replace(/\s[-–—].*$/u, "");
  return normalizeTitle(base) || normalizeTitle(title);
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * Looser than `normalizeTitle` equality: also catches versions it can't
 * group ("Porque"/"Por que", "Song (Subtitle)", "Song Hard Mix", "Song 26",
 * typos). Used to keep options apart, where a false positive only means two
 * songs never appear together.
 */
export function areConfusableTitles(a: string, b: string): boolean {
  const keyA = baseTitle(a);
  const keyB = baseTitle(b);
  if (keyA === keyB) return true;
  // One title is the other plus extra words: "Song Hard Mix", "Song 26".
  if (keyA.startsWith(`${keyB} `) || keyB.startsWith(`${keyA} `)) return true;

  const compactA = keyA.replace(/ /g, "");
  const compactB = keyB.replace(/ /g, "");
  const shorter = Math.min(compactA.length, compactB.length);
  const maxEdits = Math.floor(shorter / 5);
  if (Math.abs(compactA.length - compactB.length) > maxEdits) return false;
  return editDistance(compactA, compactB) <= maxEdits;
}
