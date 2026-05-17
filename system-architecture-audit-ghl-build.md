# System Architecture Audit — GHL Build Report

> **Conforms to:** [paradigm-ghl-workflow-pattern.md](paradigm-ghl-workflow-pattern.md) (v 2026-05-17). All deviations must be approved as named exceptions in the pattern doc first.

Short key: `saa` (per pattern doc §1).

## PHASE 1 — CUSTOM FIELDS (10/10 CREATED VIA API)

> **Field type rule:** all numeric fields should be `NUMBER` (not `NUMERICAL`) — pattern doc §3. GHL accepts both, but standardize on `NUMBER` going forward. Existing fields below are typed `NUMERICAL` historically; rename in GHL UI when convenient.

| Field Name | Field Key | Type | GHL ID |
|---|---|---|---|
| SAA Overall Score | `contact.saa_overall_score` | NUMBER | `Jloc5YoQisbMp4uq3ANW` |
| SAA Architecture Tier | `contact.saa_architecture_tier` | TEXT | `0C3c2jOXNcxi3E0xpyx3` |
| SAA Tier Priority | `contact.saa_tier_priority` | NUMBER | `LJmJveLMzSfztvI1I57g` |
| SAA Gap Count | `contact.saa_gap_count` | NUMBER | `v6SOFlegBllrUUveasMZ` |
| SAA Fragile Count | `contact.saa_fragile_count` | NUMBER | `YzORbenJbZFoOT9DL5qD` |
| SAA Estimated Cost Low | `contact.saa_estimated_cost_low` | NUMBER | `ejjDk6SMizx2qqqk4QZN` |
| SAA Estimated Cost High | `contact.saa_estimated_cost_high` | NUMBER | `ujh9bhaDGboTAut0x1cr` |
| SAA Submitted At | `contact.saa_submitted_at` | DATE | `iFpb5O9cJYJNBV0oY34C` |
| SAA Estimated Cost Low Quarterly | `contact.saa_estimated_cost_low_quarterly` | NUMBER | `aekypr06KbWtt1hRQxJN` |
| SAA Estimated Cost High Quarterly | `contact.saa_estimated_cost_high_quarterly` | NUMBER | `UdaqG9TFgp4zrRfk8bz2` |
| SAA Business Name | `contact.saa_business_name` | TEXT | <!-- TODO: create in GHL --> |

## PHASE 2 — TAGS

Lifecycle tags (per pattern doc §2):

| Tag | When applied | GHL ID |
|---|---|---|
| `saa-lead` | On webhook intake (rename of legacy `system-architecture-lead`) | `prrCV1UySJx0aJNOiHgE` (rename in GHL) |
| `saa-completed` | Reserved (SAA has no completion-distinct event yet) | <!-- TODO: create --> |
| `saa-application` | When `system-architecture-audit-apply` fires (replaces legacy `applied-3x3os`) | <!-- TODO: create --> |
| `saa-converted` | When the contact pays for the related engagement | <!-- TODO: create --> |

Tier tags:

| Tag Name | GHL ID |
|---|---|
| `saa-fragmented` | `SXUxcSKhay0TpLSYoMM4` |
| `saa-developing` | `2CyeNIV6HTYjwOjQbtCr` |
| `saa-structured` | `UxrMNz9Ofs9IJEics4A8` |
| `saa-integrated` | `ZLinALgAuA1IFE484A8H` |

## PHASE 3 — PIPELINE

> **Pipeline note (pattern doc §7):** SAA is a lead magnet. **Lead-magnet intake does NOT get a pipeline assignment.** Remove any Paradigm Leads pipeline move from the SAA intake workflow. Pipeline references below are kept for the `system-architecture-audit-apply` workflow (which promotes contacts via the shared Application Hot Lead workflow, pattern doc §8).
>
> (Optional later — pattern doc §7) If SAA ever launches a paid productized offer, build a dedicated "System Architecture" pipeline. Until then, applications can flow into Paradigm Leads or be handled tag-only.

Pipeline (kept for reference for `-apply` only): **Paradigm Leads** — `mgAoodSdPPjT4sxBokR2`

| Stage | ID | Position |
|---|---|---|
| New Lead | `2f9115b0-0527-4353-b668-a84f36eb15d0` | 0 |
| Assessment Submitted | `e9a147dd-c45b-4e37-8856-cb64fcd0025e` | 1 |
| Engaged | `4c8a9b45-1acf-488f-8cff-14721de5a874` | 2 |
| Email Sequence Active | `edf79245-7f75-4332-9b39-44b512915a24` | 3 |
| Application Link Clicked | `b7be6a4e-5457-4897-a561-278d92c08084` | 4 |
| Discovery Call | `b9bbf364-73cd-4f84-adca-2c6500fc2999` | 5 |
| Proposal Sent | `80f74b32-a418-454d-9316-ae6313ae2eed` | 6 |
| Closed | `3494c6f4-aeb1-4cda-b1ed-5d02a73cb5ed` | 7 |
| Lost | `288b8a51-6f62-408e-b06d-022ee3f2c629` | 8 |
| Nurture - Long Term | `c64e10c4-a4c6-45a4-8070-fb299b7aa751` | 9 |
| Nurture - Follow Up | `535c1f8b-a6ca-430f-9473-f0acca7dc922` | 10 |

> **Typo fix:** Stage 10 was `Nuture - Follow Up` (typo) — corrected to `Nurture - Follow Up`. The actual GHL stage name also needs to be renamed in the UI; the stage ID remains `535c1f8b-a6ca-430f-9473-f0acca7dc922`. <!-- TODO: rename stage in GHL UI -->

> **Intake / Create-or-Update Contact rule (applies to Workflow 1):**
> - Match on `email`
> - If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
> - For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `saa_business_name` regardless.

## PHASE 4 — WORKFLOWS

### Workflow 1: System Architecture Audit (EXISTS — PUBLISHED)
- **ID:** `52576f16-550b-4897-b51a-ef0dacefe017`
- **Status:** Published
- **Webhook URL:** Retrieved from GHL workflow trigger — set as `WEBHOOK_SYSTEM_ARCHITECTURE_AUDIT` in Netlify env vars

#### Required intake actions (verify configured in the existing workflow):
1. Create-or-Update Contact — apply duplicate-handling rule (preserve First Name + Phone if populated; standard `Company` first-write-wins; always write `saa_business_name`).
2. Add tag: `saa-lead`.
3. (No pipeline assignment — SAA is a lead magnet per pattern doc §7.)
4. Enroll in **SAA — Email Sequence**, add tag `email-sequence-active`.
5. Send internal notification:
   - **To:** ari@paradigmconsulting.io, jay@paradigmconsulting.io
   - **Subject:** `New SAA Lead — {{contact.first_name}}`
   - **Body:** Name, Email, SAA Overall Score, SAA Tier, SAA Gap Count, SAA Fragile Count, SAA Estimated Cost Low/High, SAA Submitted At.

### Workflow 2: SAA — Email Sequence (BUILD IN GHL UI)

**Cannot be created via API.** Build manually in GHL:

1. Create workflow: **SAA — Email Sequence**
2. Trigger: Enrolled from another workflow
3. Add Goal Step: Contact clicks tracked link tagged `Apply-3x3OS-Link`
   - On goal: Add tag `saa-application` (this triggers the shared Application Hot Lead workflow — pattern doc §8), remove tag `email-sequence-active`, stop workflow. Pipeline stage moves are handled by the shared Application Hot Lead workflow.

**Email 1 — Day 0 (Conditional by tier):**

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

- Branch on `saa_tier_priority`:
  - = 1 → Fragmented email
  - = 2 → Developing email
  - = 3 → Structured email
  - = 4 → Integrated email
- All branches send immediately
- See full email copy in the build instructions document

**Email 2 — Day 2:** "Where the cost actually comes from" (shared)
**Email 3 — Day 4:** "Why installation order matters" (shared)
**Email 4 — Day 7:** "Quarterly cost of inaction" (shared — uses `saa_estimated_cost_low_quarterly` and `saa_estimated_cost_high_quarterly` fields)
**Email 5 — Day 14:** "Final CTA" (shared)

**After Email 5:** Wait 1 day → Remove `email-sequence-active` → Add `sequence-completed` → If pipeline still at Email Sequence Active, move to Nurture - Long Term

### Workflow 3: SAA — Re-Engagement 30 Day (BUILD IN GHL UI)

**Cannot be created via API.** Build manually in GHL:

1. Create workflow: **SAA — Re-Engagement 30 Day**
2. Trigger: Tag `saa-lead` AND last activity > 30 days AND tag `saa-application` does NOT exist
   - (Removed pipeline-stage trigger conditions since SAA intake no longer assigns to a pipeline.)
3. Step 1: If `multi_assessment_routing_active` = YES → Stop
4. Step 2: Send re-engagement email
5. Step 3: Wait 7 days
6. Step 4: If no apply click → Remove `email-sequence-active`, add `sequence-completed`

### Workflow 4: SAA — Application Handler (stub)

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md).

The per-source SAA application workflow only needs to:

1. Update contact from the `system-architecture-audit-apply` webhook payload (apply duplicate-handling rule above — preserve First Name and Phone if populated; write to standard `Company` only if empty; always write to `saa_business_name`)
2. Apply tag `saa-application` (THIS is what triggers the shared Application Hot Lead workflow)
3. Remove tag `email-sequence-active`

~~Per-source pipeline moves, internal HOT LEAD notifications, and SLA logic previously documented here have been deleted. They are now centralized in the shared Application Hot Lead workflow which sends to ari@ + jay@paradigmconsulting.io and routes into the appropriate pipeline.~~

## PHASE 5 — MULTI-ASSESSMENT PRIORITY ROUTER UPDATE

Open existing **Multi-Assessment Priority Router** workflow. Add:
- `saa_tier_priority` to the worst-score comparison logic
- When `worst_assessment_tool` = SAA → enroll in **SAA — Email Sequence**

## PHASE 6 — SMART LISTS (BUILD IN GHL UI)

| List Name | Filter |
|---|---|
| `saa-all-leads` | Tag = `saa-lead` |
| `saa-fragmented-priority` | Tag = `saa-fragmented` |
| `saa-active-sequences` | Tag = `email-sequence-active` AND Tag = `saa-lead` |
| `saa-sequence-completed-no-application` | Tag = `sequence-completed` AND Tag = `saa-lead` AND Tag `saa-application` does NOT exist |

## PHASE 7 — WEBHOOK PAYLOAD UPDATE (COMPLETED)

Added `estimated_cost_low_quarterly` and `estimated_cost_high_quarterly` to the results webhook payload in `system-architecture-audit.html`. Pre-calculated as `Math.round(annualCost / 4)`.

## PHASE 8 — SHARED RESOURCES VERIFIED

| Resource | Status |
|---|---|
| `assessments_completed_count` field | EXISTS — `Ik4nj6wrxlijUXjXLWYP` |
| `multi_assessment_routing_active` field | EXISTS — `qQP2OHTjFJoJOsvvbSyh` |
| `worst_assessment_tool` field | EXISTS — `XSP1ZBiUaSDP4wORiT40` |
| `worst_assessment_tier_priority` field | EXISTS — `yXq9ks7DnhhBgqRrSD62` |
| `applied-3x3os` tag (LEGACY — replaced by per-source `*-application` tags per pattern doc §2) | EXISTS — `aiZSuOijokIIPEarUmVe` (keep for backfill; new automations should use `saa-application`) |
| `paradigm-welcomed` tag (welcome-suppression gate — pattern doc §5) | <!-- TODO: confirm exists or create --> |
| `email-sequence-active` tag | EXISTS — `tvajBiyQzWpiwRn2QNIY` |
| `sequence-completed` tag | EXISTS — `GZs1T0JnJ8lLkPF348qh` |
| Multi-Assessment Priority Router workflow | NOT FOUND (may be named differently or built in previous session) |
| Multi-Assessment Re-Engagement 30 Day workflow | NOT FOUND (may be named differently or built in previous session) |

## FAILURES / SKIPPED

1. **Workflow creation not supported via API** — GHL API does not expose workflow creation endpoints. Workflows 2 and 3 must be built in the GHL UI.
2. **Multi-Assessment Priority Router** — Not found in workflow list by that exact name. May need to be created or may exist under a different name. Check GHL UI.
3. **Multi-Assessment Re-Engagement 30 Day** — Same as above.

## MANUAL CHECKLIST — REMAINING STEPS

- [ ] Confirm SAA intake workflow webhook URL matches `WEBHOOK_SYSTEM_ARCHITECTURE_AUDIT` in Netlify env vars
- [ ] Build **SAA — Email Sequence** workflow in GHL UI with all 5 emails + conditional Day 0 branching
- [ ] Build **SAA — Re-Engagement 30 Day** workflow in GHL UI
- [ ] Apply tracked link trigger (`Apply-3x3OS-Link`) to SAA Email Sequence goal step
- [ ] Update application page URL in all SAA email CTA buttons
- [ ] Update results page URL in all Day 0 email CTA buttons (link to `paradigmconsulting.io/system-architecture-audit`)
- [ ] Create 4 smart lists in GHL UI
- [ ] Update Multi-Assessment Priority Router to include `saa_tier_priority` in comparison logic
- [ ] Add SAA routing branch: when `worst_assessment_tool` = SAA → enroll in SAA — Email Sequence
- [ ] Confirm all SAA emails send from "Matt | Founder, Paradigm Consulting"
- [ ] Deploy updated `system-architecture-audit.html` with quarterly cost fields
- [ ] Submit test leads for each tier and confirm:
  - Correct field mapping
  - Correct tier tag applied
  - `saa_tier_priority` set correctly
  - `assessments_completed_count` incremented
  - Correct Day 0 email branch fires
- [ ] Submit same email through a second assessment → confirm Multi-Assessment Priority Router fires
- [ ] Confirm re-engagement stops for contacts where `multi_assessment_routing_active` = YES
