# Research note: 2026 coverage and benchmark comparison

Research coverage: through 2026-08-31. Methodology version 1.2.0.

## v1.2.0 revisions (framing and audit)

- The A–C headline is relabeled **"jobs in verified AI-linked workforce reductions"** — the total
  headcount of actions AI is linked to, not a claim that AI caused every job. A stronger causal
  subset, **direct or AI-enabled reductions (A+B)**, is shown alongside it.
- Events now separate **total workforce-action headcount** from a **specifically-quantified
  AI-attributed** figure (`aiAttributedJobsGlobal` / `aiAttributedJobsUS`), populated only where a
  source states an AI-specific number. Oracle's 21,000 keeps `aiAttributedJobsGlobal: null`
  (unquantified); BT's plan carries `aiAttributedJobsGlobal: 10000` (the company's stated
  automation/AI portion).
- Added a **reduction mechanism** to every event (Oracle = net headcount decline, not 21,000
  documented layoffs).
- **Salesforce 2026 reclassified A → B.** Evidence specific to the 2026 rounds describes running
  leaner from AI productivity gains ("a reshape, not a shrink") across marketing, product, and data
  teams — not AI performing those specific roles. The clearer direct-replacement evidence concerns
  the separate 2025 support reduction and is not used to classify the 2026 event. This lowers the
  direct-replacement (A) total, which is the correct outcome.

## Verified ledger (this tracker)

- Confirmed AI-attributed cuts (A–C, executed/in-progress, medium+ confidence, AI-attribution source): **81,600** across 17 events at 15 companies (2023–2026, global).
- All verified AI-linked cuts (A–E, executed): **97,336** across 24 events.
- Direct AI replacement (A): **5,200**.
- AI capital reallocation (D): **14,550**.
- Announced / planned AI-attributed (A–E, planned): **14,760**.
- Verified US-specific confirmed headcount: **471** (only Cisco disclosed a US figure, via a California WARN filing). This is why US wage and household estimates have very low coverage.

## External benchmarks (context only, not added to our ledger)

- Challenger, Gray & Christmas — US job-cut announcements citing AI, 2026 through August: **116,175** (announcement-based, US-only, employer self-reported).
- Challenger — cumulative AI-cited US announcements since 2023: ~**188,000**.
- jobloss.ai — US AI-linked job losses, since 2025 through 2026-09-02: **129,810**.

## Why our number is lower than the benchmarks

For rough comparison, our 2026 executed AI-linked total is about 61,000 (global) against Challenger's 116,175 (US-only, 2026, announced). The difference is explained by:

1. **Events excluded for insufficient causal evidence.** Examples evaluated and excluded:
   - **Dell (~11,000, FY2026):** AI was cited only as a growth business (AI-server demand), not as a cause of the cuts, which were tied to PC-demand and cost optimization.
   - **Atlassian (~1,600, Mar 2026):** the CEO explicitly said AI "doesn't change the mix of skills we need or the number of roles required" — an explicit denial.
   - **Microsoft (4,800, Jul 2026):** the company said the cuts are "not the result of AI directly replacing employees." Recorded as context-only (F), not counted — consistent with the 2025 Microsoft treatment.
   - **GitLab, Google, IBM (2026):** growth-context AI language, no firm figure, or no clear company causal attribution.
2. **Announced but not executed.** Multi-year plans (e.g. PayPal's ~4,760 phased over 2–3 years) are held as "planned" and excluded from executed totals.
3. **Scope.** Our ledger is global and multi-year; the Challenger 2026 figure is US-only and announcement-based. We keep US and global counts separate and do not assume a global reduction is US.
4. **Curated, not exhaustive.** We have not yet reviewed many smaller employers that appear in aggregate trackers.

If our verified number were far below a credible benchmark with no explanation, that would signal incomplete research. Here the gap is accounted for by explicit exclusions, planned-versus-executed handling, and scope — not by missing the major documented events.

## Accepted 2026 events (14)

Amazon (C, 16,000), Salesforce (A, ~1,000), Block (B, ~4,000), Snap (B, ~1,000), Coinbase (C, ~700), PayPal (D, ~4,760, planned), Cloudflare (B, ~1,100), General Motors (E, ~550), Cisco (C, ~4,000), Meta (D, ~8,000), Intuit (D, ~3,000), Oracle (C, ~21,000), monday.com (C, ~600), Microsoft (F, 4,800, context-only).

## Added missing 2025 events (3)

CrowdStrike (B, ~500), Accenture (C, ~11,000), Chegg second round (E, ~388).

## Rejected / excluded after research (5)

Dell, Atlassian, GitLab, Google (2026 quiet cuts, no firm figure), IBM (2026).

## Notable classification calls

- **Oracle (21,000):** a binding SEC filing names AI among several reasons (management/product changes, performance, acquisitions, AI). Recorded as C at medium confidence. The 21,000 is a net year-over-year headcount decline; the AI-specific share is not quantified, which is stated on the event.
- **Amazon:** the January 2026 round (16,000) is recorded as a distinct event from the October 2025 round (14,000); they are not merged.
- **Salesforce, Intuit, Chegg:** 2026/2025 rounds are recorded separately from their earlier rounds under a shared `programId`, never double-counted.
