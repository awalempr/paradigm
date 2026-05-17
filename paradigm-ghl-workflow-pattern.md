# Paradigm GHL Workflow Pattern — Canonical Reference

**Status:** Source of truth as of 2026-05-17. Every per-source GHL build doc in this repo MUST conform to this pattern. When patterns drift, update this doc first, then patch the per-source docs to match.

---

## Why this exists

Paradigm runs 11 distinct webhook sources through one proxy (`/api/webhook`). A single founder can — and often does — take multiple assessments over weeks or months. Without a deliberate pattern, this produces: duplicate contacts, overwritten First Names, three identical "welcome" emails in one week, internal alerts that only reach Jay (Ari blind), and tag chaos that makes lifecycle reporting impossible.

This document fixes those failure modes once. Every workflow built in GHL — and every build doc in this repo — references this pattern.

---

## 1. The 11 sources and their canonical short keys

| Source (webhook payload `source` field)         | Short key | Purpose                              | Tier |
|--------------------------------------------------|-----------|--------------------------------------|------|
| `compliance-spine-risk-map`                      | `rm`      | Paid productized offer ($4,995)      | 1    |
| `compliance-spine` / `compliance-spine-apply`    | `cs`      | Assessment / paid-engagement apply   | 1    |
| `culture-maturity-audit` / `culture-maturity-audit-apply` | `cma` | Assessment / apply              | 1    |
| `founder-exposure-index` / `founder-exposure-index-apply` | `fei` | Assessment / apply              | 1    |
| `founder-bottleneck-eliminator` / `founder-bottleneck-eliminator-apply` | `fbe` | Assessment / apply | 1 |
| `system-architecture-audit` / `system-architecture-audit-apply` | `saa` | Assessment / apply        | 1    |
| `leverage-engine` / `leverage-engine-apply`      | `le`      | Assessment / paid-engagement apply   | 1    |
| `12-month-culture-calendar` / `12-month-culture-calendar-apply` | `csc` | Lead magnet / apply         | 1    |
| `mastermind-waitlist`                            | `mwl`     | Waitlist for paid product            | 1    |
| `homepage-contact`                               | `hp`      | Generic contact form                 | 1    |
| `events-speaker-request`                         | `spk`     | Speaker request                      | 1    |

**Note:** the user has decided every source is "Tier 1" for Company-field handling (see §4). The Tier column is preserved for future tier-based logic.

---

## 2. Tag taxonomy (per source, using the short key)

Each source uses a strict 4-tag lifecycle:

- `<key>-lead` — applied when the form is first submitted
- `<key>-completed` — applied when the assessment is completed (where completion is distinct from start — FEI and CMA branch on this; others don't yet)
- `<key>-application` — applied when the contact submits the corresponding `-apply` source
- `<key>-converted` — applied when the contact pays for the related engagement

**Replaces the legacy `applied-3x3os` shared tag.** Per-source application tags let one shared "Application Hot Lead" workflow trigger on any `*-application` tag and still know which assessment the contact converted from (by reading the contact's most recent `*_submitted_at` field or via the tag itself).

### Risk Map (rm) extends the lifecycle

Risk Map adds paid-deliverable sub-stages on top of the standard four:

- `rm-booked` — discovery call confirmed
- `rm-paid` — invoice paid
- `rm-delivered` — written risk profile delivered
- `rm-cold` — no response after 4 business days

These supplement, not replace, the standard pattern.

---

## 3. Custom field naming convention

Every per-source custom field uses the short-key as a prefix: `contact.<key>_<fieldname>`. Examples:

- `contact.rm_company`, `contact.rm_submitted_at`, `contact.rm_stage`
- `contact.cma_score`, `contact.cma_tier_priority`, `contact.cma_partial_score`
- `contact.fei_score`, `contact.fei_partial_score`
- `contact.cs_top_gap`, `contact.cs_submitted_at`
- etc.

**Field types:** standardize on `NUMBER` (not `NUMERICAL`). GHL accepts both; pick one.

**No bare/unprefixed assessment fields.** If two docs both write `contact.score`, the last one wins. Always prefix.

---

## 4. Standard GHL fields (First Name, Phone, Company, Email)

These are GHL-native, shared across all sources. Rules:

### Email — dedupe key (every workflow)
- Every Create-or-Update Contact action **matches on Email**.
- Never use a different dedupe key (phone, name combination, etc.) — would create duplicates.

### First Name and Phone — preserve on update
- **Never overwrite First Name or Phone if already populated.** Only set if the existing value is empty.
- This preserves the earliest-touch identity. If a contact entered "Jay" on FEI 6 months ago and now autofills "John" on CMA, we keep "Jay."

### Company — first-write-wins, with prefixed mirror
- Every source writes to standard `Company` **only if currently empty**.
- Every source also writes to its own `contact.<key>_business_name` field, every time, unconditionally.
- Rationale: standard `Company` is what shows in GHL list views and Smart Lists; preserving the first value keeps sales/ops UI stable. The prefixed mirror preserves per-source attribution for marketing analysis.

---

## 5. Welcome email suppression

Every assessment's intake workflow sends an initial "your results / welcome" email. To prevent a contact taking 3 assessments in a week from getting 3 warm-welcome emails, every Email 1 — and every confirmation email — uses the `paradigm-welcomed` tag as a gate.

### The pattern

In Workflow 1 → Step "Send confirmation email":

```
IF contact does NOT have tag `paradigm-welcomed`:
   → Send "Warm welcome + your <assessment> results" (long-form, intro-to-Paradigm tone)
   → Apply tag `paradigm-welcomed`
ELSE:
   → Send "Your <assessment> results" (short-form, result-only, assumes they know us)
```

Result: first touch gets the full warm intro; every subsequent assessment sends only the results email. The `paradigm-welcomed` tag is never removed.

---

## 6. Internal alert recipients

Every internal notification (lead capture, application received, hot-lead alerts, SLA reminders) is sent to **both**:

- `ari@paradigmconsulting.io`
- `jay@paradigmconsulting.io`

Domain: `.io` (not `.co`, not `.com`). The Mastermind Waitlist alert (currently spec'd as "internal email or Slack") needs a concrete recipient — use the same pair.

---

## 7. Pipelines vs. tags

- **Pipelines** are for paid offers and applications-in-flight. They have stages (Discovery Call, Proposal Sent, Engagement Won, Lost). A contact only belongs in a pipeline if there's an active sales process.
- **Tags** are for lifecycle state (where the contact is in any one assessment). Tags are cheap, pipelines are expensive (UI-heavy).

### Pipelines that exist or should exist

| Pipeline                          | Status            | Sources that promote into it           |
|-----------------------------------|-------------------|----------------------------------------|
| Compliance Spine Risk Map         | Exists            | `compliance-spine-risk-map`            |
| Compliance Spine (full)           | Build             | `compliance-spine-apply`               |
| Leverage Engine (full)            | Build             | `leverage-engine-apply`                |
| Mastermind                        | Build (was "optional" — make required) | `mastermind-waitlist`     |
| (Optional later) System Architecture | If/when paid offer launches | `system-architecture-audit-apply` |
| Paradigm Leads (legacy)           | Keep for now      | Lead magnets that don't convert        |

### Lead-magnet sources do NOT get pipelines

These live as tags + custom fields on the contact. No pipeline assignment:

- `culture-maturity-audit`, `fei`, `fbe`, `saa`, `le` (intake), `cs` (intake), `csc`, `hp`, `spk`

---

## 8. The shared Application Hot Lead workflow

ONE workflow, triggered on contact getting any `*-application` tag added. Replaces the per-source application workflows that currently live in each build doc.

**Trigger:** Tag added matching pattern `*-application` (any of: `cs-application`, `cma-application`, `fei-application`, `fbe-application`, `saa-application`, `le-application`, `csc-application`, `hp-application`).

**Actions:**
1. Apply tag `hot-lead`
2. Pause any active nurture/email sequence for this contact (skip if none)
3. Move to relevant pipeline at "Application Received" stage (look up by which `*-application` tag triggered)
4. Send internal alert to ari@ + jay@paradigmconsulting.io with subject `HOT LEAD — <Assessment Name> Application from {{contact.first_name}} at {{contact.<key>_business_name}}` and body summarizing assessment score(s) and `*_submitted_at` timestamps
5. Wait 1 business day; if no human contact event (manual stage move or "responded" tag), escalate with `SLA REMINDER` email

---

## 9. The multi-assessment detector workflow

Optional but high-value. Triggers when a contact has **2 or more tags matching `*-lead`** simultaneously.

**Actions:**
1. Apply tag `multi-assessment`
2. Send internal alert: `Multi-assessment signal — {{contact.first_name}} has now taken: <list>`
3. Do not modify any pipeline — this is purely a signal, not a process change

---

## 10. Smart-list naming convention

When building Smart Lists in GHL, name them with the same short-key convention:

- `rm-leads-this-week`
- `cma-completed-no-application`
- `multi-assessment-no-application`
- `hot-leads-7d`

Avoids confusion when filtering by tag.

---

## 11. Code-side requirements (NOT in this doc's scope, listed for completeness)

These code changes are required for the standardized pattern but live outside the GHL docs:

- [ ] `netlify/functions/webhook.js`: rename map key `culture-maturity-audit-application` → `culture-maturity-audit-apply`
- [ ] `culture-maturity-audit.html`: rename form source string from `culture-maturity-audit-application` → `culture-maturity-audit-apply`
- [ ] `leverage-engine.html` (when LE intake doc is rewritten): pre-compute `le_annual_revenue_lost = le_weekly_revenue_lost * 52` on the client and include in webhook payload (GHL merge tags don't support inline arithmetic)
- [ ] Set Netlify env var `WEBHOOK_MASTERMIND_WAITLIST` (currently the only unset webhook env var) once the Mastermind trigger is created in GHL

---

## 12. When patterns conflict with this doc

If a per-source build doc says one thing and this doc says another, **this doc wins.** Per-source docs are implementations of this pattern, not exceptions to it. Genuine exceptions (Risk Map's extended `-booked`/`-paid`/etc. lifecycle is the only one as of 2026-05-17) must be added here as named exceptions before being implemented.
