/**
 * Runs automated discovery. Writes only candidate files under data/candidates/.
 * Never writes to data/events, never changes headline totals, never merges anything.
 */
import { runDiscovery } from "./discovery";

runDiscovery()
  .then((summary) => {
    console.log("\nDiscovery summary:");
    for (const r of summary.providerResults) {
      console.log(
        `  - ${r.provider}: ${r.enabled ? (r.ok ? "ok" : "failed") : "disabled"}` +
          `${r.enabled ? `, ${r.items} item(s)` : ""}${r.error ? ` (${r.error})` : ""}`,
      );
    }
    console.log(`  items discovered: ${summary.itemsDiscovered}`);
    console.log(`  new candidates:   ${summary.newCandidates}`);
    console.log(`  deduplicated:     ${summary.deduped}`);
    if (summary.candidateIds.length) console.log(`  ids: ${summary.candidateIds.join(", ")}`);
    console.log("\nProduction event data was not modified.");
  })
  .catch((error) => {
    console.error(`discover failed: ${(error as Error).message}`);
    process.exit(1);
  });
