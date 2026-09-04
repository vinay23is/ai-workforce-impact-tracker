# Candidates

Review artifacts that have **not** been verified to the project's standard. Files here are
never loaded by the site and never affect any counter — the data loader only reads
`data/events/*.json`. A candidate can never be published (`published: true` is rejected by
`npm run validate:candidates`).

Two kinds of files live here:

- `discovered/*.json` — produced automatically by `npm run discover` (SEC / GDELT providers).
  These follow the **candidate schema** in `lib/candidates.ts`: a pointer to evidence plus, at
  most, `suggested*` fields that stay `null`. A keyword match is not causation.
- `TEMPLATE.json` — the finished **WorkforceEvent** shape used as input when you *promote* a
  reviewed candidate into the dataset. It is not itself a candidate.

Workflow:

```
discover  →  data/candidates/discovered/*.json  →  human review  →
  npm run promote:candidate -- --candidate <id> --event path/to/event.json  →
  data/events/<year>.json  →  npm run validate:data  →  commit
```

Promotion is the only path into production and requires a human to author the final event.
`npm run add:event` remains available for adding events without a candidate.
