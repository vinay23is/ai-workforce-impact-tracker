/**
 * Validates candidate files. Candidates are review artifacts, not events: this
 * checks their shape and, critically, that none can leak into production (no
 * published:true, no id colliding with a real event).
 */
import fs from "node:fs";
import { candidateSchema, listCandidateFiles } from "../lib/candidates";
import { loadDataset } from "../lib/data";

const errors: string[] = [];
const warnings: string[] = [];

function main() {
  const files = listCandidateFiles();
  const eventIds = new Set(loadDataset().events.map((e) => e.id));
  const seenIds = new Set<string>();

  for (const file of files) {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      errors.push(`${file}: invalid JSON (${(error as Error).message})`);
      continue;
    }
    if (raw && typeof raw === "object" && (raw as { published?: unknown }).published === true) {
      errors.push(`${file}: a candidate must never have published:true`);
    }
    const result = candidateSchema.safeParse(raw);
    if (!result.success) {
      errors.push(
        `${file}: ${result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`,
      );
      continue;
    }
    const c = result.data;
    if (seenIds.has(c.candidateId)) errors.push(`${file}: duplicate candidateId ${c.candidateId}`);
    seenIds.add(c.candidateId);
    if (eventIds.has(c.candidateId)) {
      errors.push(`${file}: candidateId ${c.candidateId} collides with a published event id`);
    }
    if (c.status === "NEEDS_REVIEW" && c.possibleDuplicateOf.length) {
      warnings.push(`${c.candidateId}: possible duplicate of ${c.possibleDuplicateOf.join(", ")} — review before promotion`);
    }
  }

  if (warnings.length) {
    console.warn(`\nCandidate warnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
  if (errors.length) {
    console.error(`\nCandidate validation FAILED with ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`Candidate validation passed: ${files.length} candidate file(s).`);
}

main();
