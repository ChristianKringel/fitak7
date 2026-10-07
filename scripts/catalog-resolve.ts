// Fills `deezerId` for catalog artists that still have `deezerId: null`.
// Writes an ID only when the match is unambiguous; otherwise prints the
// top candidates so a human can pick one and edit data/catalog.json.

import { createDeezerClient } from "@/lib/deezer/client";
import { matchArtist } from "@/lib/game/artist-match";

import { readCatalog, writeCatalog } from "./lib/catalog-file";

async function main() {
  const catalog = await readCatalog();
  const deezer = createDeezerClient();
  const pending = catalog.artists.filter((a) => a.deezerId === null);

  if (pending.length === 0) {
    console.log("All artists already have a deezerId.");
    return;
  }
  console.log(`Resolving ${pending.length} artist(s)...\n`);

  const resolved: string[] = [];
  const ambiguous: string[] = [];

  for (const artist of pending) {
    // Search results are ranked by relevance; the first page is enough to
    // find an exact match and keeps the script fast.
    const results = await deezer.searchArtists(artist.name);
    const match = matchArtist(artist.name, results);

    if (match.kind === "resolved") {
      artist.deezerId = match.artist.id;
      // Show a few album titles so the human can sanity-check the pick.
      const albums = await deezer.get<{ data: { title: string }[] }>(
        `/artist/${match.artist.id}/albums`,
        { limit: 3 },
      );
      const sample = albums.data.map((a) => a.title).join(" · ");
      resolved.push(
        `✔ ${artist.name} → ${match.artist.name} (id ${match.artist.id}, ${match.artist.nb_fan.toLocaleString("pt-BR")} fãs) ${match.artist.link}\n    ${match.reason}; álbuns: ${sample || "—"}`,
      );
    } else {
      const lines = match.candidates.map(
        (cand, i) =>
          `    ${i + 1}. ${cand.name} — ${cand.nb_fan.toLocaleString("pt-BR")} fãs — ${cand.link}`,
      );
      ambiguous.push(
        `? ${artist.name} (${match.reason})\n${lines.join("\n") || "    (no results)"}`,
      );
    }
  }

  await writeCatalog(catalog);

  console.log(`Resolved (${resolved.length}):`);
  console.log(resolved.join("\n") || "  none");
  console.log(`\nAmbiguous — not written (${ambiguous.length}):`);
  console.log(ambiguous.join("\n") || "  none");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
