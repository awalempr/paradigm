# Founder Exposure Index — GHL Build Guide

> **Conforms to:** [paradigm-ghl-workflow-pattern.md](paradigm-ghl-workflow-pattern.md) (v 2026-05-17). All deviations from that pattern must be approved as named exceptions in the pattern doc first.

**Generated:** April 2, 2026
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)

---

## STEP 1 — CREATE CUSTOM FIELDS

Create these custom fields in GHL under Settings > Custom Fields > Contact:

| Field | Key | Type |
|---|---|---|
| FEI Total Score | contact.fei_total_score | NUMBER |
| FEI Tier | contact.fei_tier | TEXT |
| FEI Section A Legal | contact.fei_section_a_legal | NUMBER |
| FEI Section B Financial | contact.fei_section_b_financial | NUMBER |
| FEI Section C Data Security | contact.fei_section_c_data_security | NUMBER |
| FEI Section D Governance | contact.fei_section_d_governance | NUMBER |
| FEI Weakest Section | contact.fei_weakest_section | TEXT |
| FEI Sections Completed | contact.fei_sections_completed | NUMBER |
| FEI Partial Score | contact.fei_partial_score | NUMBER |
| FEI Source | contact.fei_source | TEXT |
| FEI Submitted At | contact.fei_submitted_at | DATE |
| FEI Business Name | contact.fei_business_name | TEXT |

---

## STEP 2 — CREATE TAGS

| Tag |
|---|
| fei-lead |
| fei-high-founder-exposure (score 0-120) |
| fei-structured-but-vulnerable (score 121-180) |
| fei-scalable-foundation (score 181-210) |
| fei-institution-level (score 211-240) |

Per-source application tag (replaces shared `applied-3x3os` per pattern §2):
- fei-application

Pre-existing tags (already in system):
- applied-3x3os (DEPRECATED — replaced by `fei-application`; retained for historical contacts only)
- email-sequence-active
- sequence-completed
- paradigm-welcomed (new — see pattern §5 welcome suppression)

---

## STEP 3 — CREATE WEBHOOK TRIGGER

1. Go to Automation > Workflows > Create Workflow
2. Name: "Founder Exposure Index"
3. Set trigger: Inbound Webhook
4. Copy the trigger ID from the webhook URL
5. Add trigger ID to Netlify env var: `WEBHOOK_FOUNDER_EXPOSURE_INDEX`

---

## STEP 4 — WEBHOOK PAYLOAD REFERENCE

The site sends four webhook payload types through `/api/webhook`:

### Payload 1 — Lead Started (source: `founder-exposure-index`)

Fires when the founder submits their name and email to begin the assessment.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "source": "founder-exposure-index",
  "lead_source": "founder-exposure-index",
  "event": "started",
  "timestamp": "2026-04-02T12:00:00.000Z"
}
```

### Payload 2 — Section Complete (source: `founder-exposure-index`)

Fires after each of the 4 sections is completed. Sends cumulative progress.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "source": "founder-exposure-index",
  "event": "section_X_complete",
  "sections_completed": 2,
  "partial_score": 78,
  "section_a_legal": 42,
  "timestamp": "2026-04-02T12:05:00.000Z"
}
```

Note: `event` values are `section_1_complete`, `section_2_complete`, `section_3_complete`, `section_4_complete`. Section score fields populate cumulatively as sections are completed.

### Payload 3 — Final Results (source: `founder-exposure-index`)

Fires when the assessment is fully completed and results are displayed.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "total_score": 156,
  "tier": "STRUCTURED BUT VULNERABLE",
  "section_a_legal": 42,
  "section_b_financial": 38,
  "section_c_data_security": 35,
  "section_d_governance": 41,
  "weakest_section": "Data & Security",
  "source": "founder-exposure-index",
  "lead_source": "founder-exposure-index",
  "timestamp": "2026-04-02T12:10:00.000Z"
}
```

**Scoring:** 24 questions, 1-10 scale each, 4 sections of 6 questions = 240 max score

**Tier Thresholds:**
- 0-120 → HIGH FOUNDER EXPOSURE
- 121-180 → STRUCTURED BUT VULNERABLE
- 181-210 → SCALABLE FOUNDATION
- 211-240 → INSTITUTION-LEVEL GOVERNANCE

**Sections:**
- A: Legal Structure (6 questions, max 60)
- B: Financial Controls (6 questions, max 60)
- C: Data & Security (6 questions, max 60)
- D: Operational Governance (6 questions, max 60)

### Payload 4 — Application (source: `founder-exposure-index-apply`)

Fires when the founder clicks "Apply for 3x3OS" and submits phone + business name.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "business_name": "Acme Corp",
  "total_score": 156,
  "tier": "STRUCTURED BUT VULNERABLE",
  "section_a_legal": 42,
  "section_b_financial": 38,
  "section_c_data_security": 35,
  "section_d_governance": 41,
  "source": "founder-exposure-index-apply",
  "lead_source": "founder-exposure-index",
  "timestamp": "2026-04-02T12:15:00.000Z"
}
```

---

## WORKFLOW 1 — Founder Exposure Index (Intake and Routing)

**Name:** Founder Exposure Index
**Status:** Publish when complete
**Trigger:** Inbound Webhook (from Step 3)

### Step 1 — Branch on Event Type

**Branch A** — IF event = "started":
- Create or Update Contact (first_name, email only) — apply Duplicate-handling rule (see Step 3)
- Add tag: fei-lead
- ~~Add to Pipeline: Paradigm Leads → New Lead (only if not already in pipeline)~~ — REMOVED per pattern §7 (lead-magnet intake; no pipeline)
- Stop workflow

**Branch B** — IF event contains "section_" AND event contains "_complete":
- Update Contact:
  - sections_completed → FEI Sections Completed
  - partial_score → FEI Partial Score
  - section_a_legal → FEI Section A Legal (if present)
  - section_b_financial → FEI Section B Financial (if present)
  - section_c_data_security → FEI Section C Data Security (if present)
  - section_d_governance → FEI Section D Governance (if present)
  - timestamp → FEI Submitted At
- Stop workflow

**Branch C** — IF event is NOT present (final results payload — no event field) OR source = "founder-exposure-index-apply":
- Continue to Step 2 (apply Duplicate-handling rule from Step 3 on all create/update actions)

### Step 2 — Branch on Source

**Branch: Application** — IF source = "founder-exposure-index-apply":
- Jump to Workflow 2 steps (Application Handler below)

**Branch: Final Results** — ELSE (source = "founder-exposure-index"):
- Continue to Step 3

### Step 3 — Create or Update Contact (Final Results)

Map from webhook payload:
- first_name → First Name (only if currently empty — see Duplicate-handling rule)
- email → Email (dedupe key)
- total_score → FEI Total Score
- tier → FEI Tier
- section_a_legal → FEI Section A Legal
- section_b_financial → FEI Section B Financial
- section_c_data_security → FEI Section C Data Security
- section_d_governance → FEI Section D Governance
- weakest_section → FEI Weakest Section
- source → FEI Source
- timestamp → FEI Submitted At

**Duplicate-handling rule:**
- Match on `email`
- If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
- For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `fei_business_name` regardless.

### Step 4 — Add to Pipeline

> **REMOVED per pattern §7.** Lead-magnet intake (non-`*-apply` source) does not get pipeline assignment. ~~Pipeline: Paradigm Leads · Stage: Assessment Submitted · Only if contact is NOT already at a higher stage (position > 1)~~

### Step 5 — Add Tag

- Tag: fei-lead

### Step 6 — Tier Tagging and Routing (If/Else Branches)

**Branch A** — IF fei_total_score <= 120:
- Add tag: fei-high-founder-exposure
- Enroll in workflow "FEI — Track 1 High Founder Exposure"

**Branch B** — ELSE IF fei_total_score <= 180:
- Add tag: fei-structured-but-vulnerable
- Enroll in workflow "FEI — Track 2 Structured But Vulnerable"

**Branch C** — ELSE IF fei_total_score <= 210:
- Add tag: fei-scalable-foundation
- Enroll in workflow "FEI — Track 3 Scalable Foundation"

**Branch D** — ELSE (fei_total_score 211-240):
- Add tag: fei-institution-level
- Enroll in workflow "FEI — Track 4 Institution-Level Governance"

After enrollment (all branches):
- Add tag: email-sequence-active
- ~~Move pipeline stage to: Email Sequence Active (only if currently at Assessment Submitted)~~ — REMOVED per pattern §7 (no pipeline for lead-magnet intake)

### Step 7 — Internal Notification Email

**To:** ari@paradigmconsulting.io, jay@paradigmconsulting.io

**Subject:** New FEI Lead — {{contact.first_name}} — Score {{contact.fei_total_score}}/240 — {{contact.fei_tier}}

**Body:**
```
Name: {{contact.first_name}}
Email: {{contact.email}}
Total Score: {{contact.fei_total_score}} / 240
Tier: {{contact.fei_tier}}
Section A (Legal Structure): {{contact.fei_section_a_legal}} / 60
Section B (Financial Controls): {{contact.fei_section_b_financial}} / 60
Section C (Data & Security): {{contact.fei_section_c_data_security}} / 60
Section D (Operational Governance): {{contact.fei_section_d_governance}} / 60
Weakest Section: {{contact.fei_weakest_section}}
Submitted: {{contact.fei_submitted_at}}
Check contact record for assessment suite data if applicable
```

---

## WORKFLOW 2 — Founder Exposure Index Application Handler

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md). Do not build this per-source workflow.

**Per-source intake responsibility (what THIS doc still owns):** when the `founder-exposure-index-apply` webhook fires, this intake workflow must still create-or-update the contact (using the same dedupe + company rules above), map `phone`, `business_name` → `fei_business_name` (always) and standard Company (only if empty), and add the `fei-application` tag. The shared Application Hot Lead workflow takes over from there.

~~**Name:** Founder Exposure Index — Application~~
~~**Status:** Publish when complete~~
~~**Trigger:** Inbound Webhook (same trigger ID — route by source field)~~

~~**Alternative:** Add an If/Else branch at the top of Workflow 1 that checks if `source` = `founder-exposure-index-apply`, then routes to the application steps below instead of the intake steps above.~~

~~### Step 1 — Update Contact~~

~~Map from webhook payload:~~
~~- phone → Phone~~
~~- business_name → Company (or a custom field)~~
~~- total_score → FEI Total Score (update if changed)~~
~~- tier → FEI Tier (update if changed)~~
~~- section_a_legal → FEI Section A Legal~~
~~- section_b_financial → FEI Section B Financial~~
~~- section_c_data_security → FEI Section C Data Security~~
~~- section_d_governance → FEI Section D Governance~~
~~- source → FEI Source (update to "founder-exposure-index-apply")~~

~~### Step 2 — Add Tag — applied-3x3os~~
~~### Step 3 — Move Pipeline Stage — Paradigm Leads · Application Link Clicked~~
~~### Step 4 — Remove Tag — email-sequence-active~~
~~### Step 5 — Internal Notification Email to jay@paradigmconsulting.io — replaced by shared workflow's ari@ + jay@ alert template~~

---

## EMAIL SEQUENCES

---

### FEI — Track 1 High Founder Exposure (Score 0-120)

Framing: The founder's business has significant structural exposure across legal, financial, data, and governance areas. The business is operating without the protective infrastructure that prevents catastrophic loss events. The 3x3OS message is about installing the foundational governance that separates a business from its founder's personal risk.

**Name:** FEI — Track 1 High Founder Exposure
**Status:** Publish when complete
**Trigger:** Enrolled from Founder Exposure Index intake workflow

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: fei-application
- Remove tag: email-sequence-active
- ~~Move pipeline stage to: Application Link Clicked~~ — pipeline assignment handled by shared Application Hot Lead workflow (pattern §8)
- Stop all further steps immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending Email 1 below, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant (the Email 1 body that follows) AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant: same email with intro paragraphs removed, jumping straight to results. Build-time decision.

#### Email 1 — Send immediately

**Subject:** Your Founder Exposure Index results, {{contact.first_name}}
**Preview:** A score of {{contact.fei_total_score}} out of 240 means your business has significant structural exposure.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Founder Exposure Index on the Paradigm Consulting site.

Your total score was {{contact.fei_total_score}} out of 240. That places you in the HIGH FOUNDER EXPOSURE tier. I want to be direct about what that means.

Your business is carrying structural risk across multiple governance areas. The assessment scored four pillars — Legal Structure at {{contact.fei_section_a_legal}} out of 60, Financial Controls at {{contact.fei_section_b_financial}} out of 60, Data and Security at {{contact.fei_section_c_data_security}} out of 60, and Operational Governance at {{contact.fei_section_d_governance}} out of 60.

Your weakest section was {{contact.fei_weakest_section}}.

These scores are not abstract. Each area where the score is low represents a specific category of founder exposure — personal liability that has not been separated from the business, financial controls that would not survive an audit, data practices that create regulatory risk, or governance gaps that make the business untransferable.

The danger at your score level is not that something might go wrong eventually. It is that multiple exposure categories are open simultaneously, and the cost of any single one materializing is disproportionate to the cost of closing it proactively.

Over the next two weeks I want to walk you through what each exposure category means in practice and what it looks like to build governance infrastructure into a business that has been operating without it.

If any section of the assessment felt immediately urgent, reply and tell me which one. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Exposure Index — link to founder-exposure-index results page]**

#### Wait 2 days

#### Email 2

**Subject:** The exposure most founders discover after it costs them
**Preview:** It is not the risk you know about. It is the one that has been compounding silently.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Founder Exposure Index and scored {{contact.fei_total_score}} out of 240.

I want to talk about how founder exposure actually becomes a cost — because it almost never happens the way founders expect.

Founders with high structural exposure rarely encounter it as a single dramatic event. They encounter it as a cascade. A contract dispute reveals there was no IP assignment clause. An FTC inquiry reveals the marketing claims were never reviewed. A payment processor audit reveals the financial controls were informal. A data breach reveals there was no incident response protocol.

Each of these alone is manageable. But at your score level, the issue is that multiple categories are exposed simultaneously. When one materializes, it often triggers scrutiny in the others. An FTC inquiry does not only look at the complaint — it looks at the entire business structure. A lawsuit does not only examine the specific claim — discovery opens the books.

Your weakest section was {{contact.fei_weakest_section}}. That is where the highest probability of a triggering event lives. But the other sections determine how far that event cascades.

The 3x3OS engagement exists to close these exposure categories in sequence — starting with the highest-risk areas and building toward an integrated governance infrastructure that protects the founder personally and makes the business structurally sound.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** What founder exposure costs at your score level
**Preview:** The cost is not theoretical. It is specific and calculable.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Founder Exposure Index scored {{contact.fei_total_score}} out of 240 across four governance pillars. I want to be specific about what the cost of unaddressed founder exposure looks like at your level.

Legal Structure at {{contact.fei_section_a_legal}} out of 60 means the separation between the founder and the business is incomplete. Incomplete entity structure, missing operating agreements, and unreviewed liability exposure mean the founder's personal assets are reachable in a business dispute. The cost of a single pierced corporate veil event ranges from $50K to $500K depending on the claim.

Financial Controls at {{contact.fei_section_b_financial}} out of 60 means the financial governance of the business would not survive external scrutiny. Informal spending authority, undocumented financial processes, and incomplete reconciliation create exposure to fraud, embezzlement, and audit failure. The average cost of a financial controls failure in a scaling business is 3 to 7 percent of annual revenue.

Data and Security at {{contact.fei_section_c_data_security}} out of 60 means the business is collecting and storing data without the infrastructure to protect it. A single data breach at the small business level averages $120K in direct costs before reputational damage.

Operational Governance at {{contact.fei_section_d_governance}} out of 60 means the business lacks the decision infrastructure, documentation, and succession planning that makes it operable without the founder. This is the exposure that kills transactions — buyers and investors discount businesses without governance infrastructure by 0.5x to 2x EBITDA.

These are not cumulative risks that might happen someday. At your score level, you are carrying all four simultaneously. The 3x3OS engagement closes them in 90 days.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** The difference between a business and a liability
**Preview:** At your score level, the business is structurally indistinguishable from the founder.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Founder Exposure Index. I want to name something directly.

At a score of {{contact.fei_total_score}} out of 240, your business is structurally inseparable from you as the founder. The legal protections are insufficient to create meaningful separation. The financial controls are insufficient to demonstrate independent governance. The data practices are insufficient to survive regulatory scrutiny. The operational governance is insufficient to make the business operable or transferable without you.

This is not a criticism of the business or how it has been built. Most founder-led businesses at the growth stage carry this profile. The revenue is real. The product or service is real. The team may be real. But the protective infrastructure — the governance layer that separates the founder's personal exposure from the business's operational risk — has not been installed.

The 3x3OS engagement is a 90-day structured installation of that governance layer. Not theory. Not coaching. Not a compliance checklist. A working infrastructure across legal structure, financial controls, data security, and operational governance that is specific to your business and built to hold as it scales.

I have room for one more engagement this quarter. If your score felt urgent, this is the application.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5

**Subject:** Last note on your Exposure Index, {{contact.first_name}}
**Preview:** The exposure does not shrink while you wait. The score does not change on its own.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Founder Exposure Index results.

Your score was {{contact.fei_total_score}} out of 240. Your weakest section was {{contact.fei_weakest_section}}. Your business is carrying structural founder exposure across all four governance pillars.

Those scores will not change on their own. Growth without governance just means the exposure grows with the revenue. The founder's personal risk scales with the business rather than being separated from it.

If you want to change the structure — not just the revenue — the 3x3OS application is below. We review every application personally and only accept founders where the engagement will produce a measurable shift in the governance infrastructure.

If the timing is not right, keep your results. The scores will be the same whenever you are ready.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- ~~If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term~~ — pipeline-stage move removed per pattern §7 (no pipeline for lead-magnet intake)

---

### FEI — Track 2 Structured But Vulnerable (Score 121-180)

Framing: The founder has built some governance infrastructure but critical gaps remain. The business has structure in some areas but is exposed in others. The message shifts from "you need everything" to "the gaps that remain are the ones that create disproportionate risk."

**Name:** FEI — Track 2 Structured But Vulnerable
**Status:** Publish when complete
**Trigger:** Enrolled from Founder Exposure Index intake workflow

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: fei-application
- Remove tag: email-sequence-active
- ~~Move pipeline stage to: Application Link Clicked~~ — pipeline assignment handled by shared Application Hot Lead workflow (pattern §8)
- Stop all further steps immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending Email 1 below, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant (the Email 1 body that follows) AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant: same email with intro paragraphs removed. Build-time decision.

#### Email 1 — Send immediately

**Subject:** Your Founder Exposure Index results, {{contact.first_name}}
**Preview:** A score of {{contact.fei_total_score}} out of 240 — structured in some areas, exposed in others.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Founder Exposure Index on the Paradigm Consulting site.

Your total score was {{contact.fei_total_score}} out of 240. That places you in the STRUCTURED BUT VULNERABLE tier. Here is what that means.

You have governance infrastructure in place. The work you have done matters and it shows in your scores. But the assessment also revealed specific areas where the infrastructure is incomplete — and incomplete governance creates a specific kind of risk that most founders underestimate.

Your four pillars scored: Legal Structure at {{contact.fei_section_a_legal}} out of 60, Financial Controls at {{contact.fei_section_b_financial}} out of 60, Data and Security at {{contact.fei_section_c_data_security}} out of 60, and Operational Governance at {{contact.fei_section_d_governance}} out of 60.

Your weakest section was {{contact.fei_weakest_section}}.

The danger at your tier is not the absence of governance — it is the unevenness of it. Partial governance creates a false confidence that the business is protected when specific categories remain fully exposed. An investor or acquirer conducting due diligence will not average your scores. They will identify every gap and assess each one independently.

Over the next two weeks I want to walk you through what closing the remaining gaps looks like and why the vulnerable areas in your profile carry disproportionate weight relative to the areas that are already strong.

Reply if your weakest section felt immediately relevant.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Exposure Index — link to founder-exposure-index results page]**

#### Wait 2 days

#### Email 2

**Subject:** Partial governance is not partial protection
**Preview:** The areas that are strong do not compensate for the areas that are exposed.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Founder Exposure Index and scored {{contact.fei_total_score}} out of 240.

I want to name something specific about the STRUCTURED BUT VULNERABLE tier that most founders in your position do not fully appreciate.

The governance areas where you scored well are genuinely protected. The areas where you scored low carry their full exposure regardless of how strong the other areas are.

A business with strong financial controls and weak legal structure still carries the full legal exposure. A business with strong data security and weak operational governance still has a business that is untransferable without the founder. Each pillar is independently assessed in any external review — regulatory, transactional, or legal.

Your weakest section was {{contact.fei_weakest_section}} at a level that represents real, present exposure. That score does not get averaged away by the sections where you are stronger. It stands alone as an open vulnerability.

The 3x3OS engagement at your tier is not a rebuild. It is a targeted installation that closes the specific gaps your assessment identified while preserving and strengthening the infrastructure you have already built.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** Your weakest section is where the risk concentrates
**Preview:** {{contact.fei_weakest_section}} scored lowest. Here is what that exposure actually looks like.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Founder Exposure Index identified {{contact.fei_weakest_section}} as your weakest governance pillar.

I want to be specific about why uneven governance profiles create concentrated risk.

When an external event triggers scrutiny — a regulatory inquiry, a contract dispute, a data incident, a transaction due diligence — it does not examine the business holistically. It examines the specific area of concern. And in that specific area, your governance infrastructure either holds or it does not.

Your strongest sections will not be examined in that moment. Your weakest section will. And at the score level your assessment revealed, the infrastructure in that area would not hold under dedicated scrutiny.

The pattern we see most often in the STRUCTURED BUT VULNERABLE tier is founders who built governance infrastructure in the areas they naturally prioritized — often financial controls or legal basics — while leaving other areas undeveloped. The undeveloped areas are not undeveloped because they are less important. They are undeveloped because they were less visible.

The 3x3OS engagement starts with your weakest section and builds outward. 90 days. Specific deliverables targeting the exact gaps your assessment identified.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** What closing the governance gap is worth at transaction
**Preview:** The difference between structured-but-vulnerable and fully governed is measurable in multiples.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Founder Exposure Index and scored {{contact.fei_total_score}} out of 240.

I want to talk about what the difference between your current tier and a fully governed business is worth — not in avoided risk, but in enterprise value.

Businesses with complete governance infrastructure across legal, financial, data, and operational pillars command measurably higher multiples than businesses with uneven governance at the same revenue level. The premium exists because a buyer or investor conducting due diligence on a business with governance gaps applies a risk discount to the valuation. That discount reflects the cost of closing the gaps post-acquisition plus the liability being absorbed.

At your tier, the gaps are specific and closable. You are not starting from zero — you have meaningful infrastructure already in place. The distance between where you are and a governance profile that commands the full premium is shorter than most founders in your position assume.

The 3x3OS engagement closes that distance in 90 days. Application-only. Reviewed personally.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5

**Subject:** The gap between structured and protected, {{contact.first_name}}
**Preview:** You have done real work. Here is what completing it looks like.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Founder Exposure Index results.

Your score was {{contact.fei_total_score}} out of 240. You have governance infrastructure in place that most businesses at your stage do not have. That matters.

But the sections where you scored lower — particularly {{contact.fei_weakest_section}} — represent open exposure that carries its full weight regardless of how strong the other sections are.

The difference between STRUCTURED BUT VULNERABLE and SCALABLE FOUNDATION is the difference between a business that looks governed from the inside and one that holds under external scrutiny. Closing the remaining gaps is the highest-leverage governance work available to your business right now.

The 3x3OS engagement at your tier targets the specific gaps your assessment identified. 90 days. Specific deliverables. Built around the exact areas where your exposure is concentrated.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- ~~If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term~~ — pipeline-stage move removed per pattern §7 (no pipeline for lead-magnet intake)

---

### FEI — Track 3 Scalable Foundation (Score 181-210)

Framing: The founder has strong governance infrastructure with minor gaps remaining. The message shifts from risk prevention to completion and institutional readiness. The 3x3OS engagement is positioned as the final step toward governance that holds at scale and commands a premium at transaction.

**Name:** FEI — Track 3 Scalable Foundation
**Status:** Publish when complete
**Trigger:** Enrolled from Founder Exposure Index intake workflow

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: fei-application
- Remove tag: email-sequence-active
- ~~Move pipeline stage to: Application Link Clicked~~ — pipeline assignment handled by shared Application Hot Lead workflow (pattern §8)
- Stop all further steps immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending Email 1 below, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant (the Email 1 body that follows) AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant: same email with intro paragraphs removed. Build-time decision.

#### Email 1 — Send immediately

**Subject:** Your Founder Exposure Index results, {{contact.first_name}}
**Preview:** A score of {{contact.fei_total_score}} out of 240 — strong governance with specific areas to complete.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Founder Exposure Index on the Paradigm Consulting site.

Your total score was {{contact.fei_total_score}} out of 240. That places you in the SCALABLE FOUNDATION tier. That is a strong result that reflects meaningful governance work you have already done.

Your four pillars scored: Legal Structure at {{contact.fei_section_a_legal}} out of 60, Financial Controls at {{contact.fei_section_b_financial}} out of 60, Data and Security at {{contact.fei_section_c_data_security}} out of 60, and Operational Governance at {{contact.fei_section_d_governance}} out of 60.

Your weakest section was {{contact.fei_weakest_section}}.

At your tier, the governance foundation is solid. The remaining gap between where you are and institutional-level governance is specific and closable. The question is not whether to build governance infrastructure — you have already done that. The question is whether to complete it before the next phase of growth, transaction, or regulatory scrutiny.

Over the next two weeks I want to walk you through what completing governance at your level looks like and why the last increments of governance infrastructure carry disproportionate value relative to the effort required to install them.

Reply if your weakest section felt relevant.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Exposure Index — link to founder-exposure-index results page]**

#### Wait 2 days

#### Email 2

**Subject:** The last governance gaps carry disproportionate value
**Preview:** Not because they are more important. Because they complete a picture that is already strong.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Founder Exposure Index and scored {{contact.fei_total_score}} out of 240.

I want to make a specific point about the value of completing governance infrastructure that is already strong.

In any external review — due diligence, regulatory audit, investor assessment — the reviewer is looking for completeness. A business that is 90 percent governed looks meaningfully different from one that is 100 percent governed, not because the 10 percent gap is large in scope, but because it signals that the governance was never formally completed.

Institutional buyers and investors read incomplete governance as a risk signal even when the gaps are minor. The discount they apply reflects not just the cost of closing the gaps but the uncertainty about what the gaps represent. A business with minor governance gaps might have minor gaps. Or it might have larger gaps that the assessment did not catch. Incomplete governance creates ambiguity. Complete governance eliminates it.

At your score, completing the remaining infrastructure is both the lowest-effort and highest-return governance work available to your business. The hard work is done. What remains is specific, targeted, and finite.

The 3x3OS engagement at your tier is a close-out — not a rebuild.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** What institutional-level governance looks like — and how close you are
**Preview:** The distance is shorter than most founders at your tier assume.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Founder Exposure Index scored {{contact.fei_total_score}} out of 240. Your weakest section was {{contact.fei_weakest_section}}.

I want to define institutional-level governance specifically because it is relevant to where you are.

Institutional-level governance means every material governance area has been audited, documented, and closed. The legal structure creates complete separation between the founder and the business. The financial controls would survive an external audit without remediation. The data and security practices comply with applicable regulations and have documented incident response. The operational governance makes the business operable and transferable without the founder's continuous involvement.

At your score, you are close to this standard. The remaining gaps are specific items — not systemic deficiencies. Closing them is the final step toward a governance profile that holds under any level of external scrutiny.

The 3x3OS engagement at your position targets exactly those remaining items. 90 days. Specific to your assessment results. Built to complete the infrastructure rather than rebuild it.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** You have built something worth completing, {{contact.first_name}}
**Preview:** The governance foundation is strong. Completing it is the highest-leverage move available.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Founder Exposure Index with a strong result.

The governance infrastructure you have built is a genuine competitive advantage. Most businesses at your stage are carrying structural exposure that you have already addressed. That foundation protects the business, supports scale, and positions you for transactions at premium valuations.

The remaining gaps — the areas where your score fell below the institutional threshold — are the specific items standing between where you are and a governance infrastructure that would pass any level of external scrutiny without remediation.

The 3x3OS engagement at your tier is a completion engagement. It closes the remaining gaps, adds the governance maintenance cadence that keeps the infrastructure current as the business grows, and produces the documentation that makes the full governance picture presentable to anyone outside the business.

Application-only. Reviewed personally.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5

**Subject:** The finish line is closer than most founders get, {{contact.first_name}}
**Preview:** You are further along than most. Completing it is specific and finite.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Founder Exposure Index results.

Your score was {{contact.fei_total_score}} out of 240. You are in the top tier of governance readiness for founder-led businesses. The work you have done to build this infrastructure is real and it matters.

What remains is specific, closable, and worth completing before the business enters its next phase of growth or transaction.

The 3x3OS engagement at your tier is a targeted completion — 90 days focused on the specific gaps your assessment identified plus the governance maintenance layer that ensures the infrastructure holds as the business scales. Not a rebuild. Not a generic governance program. A close-out of the specific items standing between where you are and institutional-level governance.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

P.S. At your tier the engagement is scoped specifically to your remaining gaps. We will confirm the exact scope in the application review.

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- ~~If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term~~ — pipeline-stage move removed per pattern §7 (no pipeline for lead-magnet intake)

---

### FEI — Track 4 Institution-Level Governance (Score 211-240)

Framing: The founder has exceptional governance infrastructure. The message is about maintenance, refinement, and ensuring the infrastructure stays current as the business grows. The 3x3OS engagement is positioned as governance maintenance and institutional readiness rather than gap closure.

**Name:** FEI — Track 4 Institution-Level Governance
**Status:** Publish when complete
**Trigger:** Enrolled from Founder Exposure Index intake workflow

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: fei-application
- Remove tag: email-sequence-active
- ~~Move pipeline stage to: Application Link Clicked~~ — pipeline assignment handled by shared Application Hot Lead workflow (pattern §8)
- Stop all further steps immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending Email 1 below, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant (the Email 1 body that follows) AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant: same email with intro paragraphs removed. Build-time decision.

#### Email 1 — Send immediately

**Subject:** Your Founder Exposure Index results, {{contact.first_name}}
**Preview:** A score of {{contact.fei_total_score}} out of 240 — institutional-level governance. Here is what maintaining it requires.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Founder Exposure Index on the Paradigm Consulting site.

Your total score was {{contact.fei_total_score}} out of 240. That places you in the INSTITUTION-LEVEL GOVERNANCE tier. That is the highest tier and it reflects exceptional work you have done to protect and structure your business.

Your four pillars scored: Legal Structure at {{contact.fei_section_a_legal}} out of 60, Financial Controls at {{contact.fei_section_b_financial}} out of 60, Data and Security at {{contact.fei_section_c_data_security}} out of 60, and Operational Governance at {{contact.fei_section_d_governance}} out of 60.

I want to be direct about what this result means and what it does not mean.

It means your current governance infrastructure is strong across all four pillars. It does not mean your governance posture is static. Governance infrastructure that was complete at your current revenue level may develop gaps as the business grows, regulations change, and operations evolve.

The businesses that maintain institutional governance over time are not the ones that built it once. They are the ones with a governance maintenance cadence that audits and updates the infrastructure continuously.

Over the next week I want to walk you through what maintaining institutional governance looks like at scale — and how the 3x3OS engagement protects what you have already built.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Exposure Index — link to founder-exposure-index results page]**

#### Wait 2 days

#### Email 2

**Subject:** Governance infrastructure decays without active maintenance
**Preview:** What was institutional at your last stage may already have gaps at your current one.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Founder Exposure Index with an institutional-level result.

I want to name the specific risk that exists even when governance is currently strong.

Governance infrastructure has a shelf life. The specific triggers that create expiration are predictable: revenue growth creates new regulatory obligations and financial control requirements. Team growth requires updated employment documentation, new NDAs, revised compensation structures, and contractor classification review. Platform changes force compliance reviews against updated terms. Regulatory changes — FTC guidance, state privacy laws, data protection requirements — evolve continuously.

A business that was fully governed 18 months ago and has not audited since is not necessarily fully governed today. The infrastructure exists but it may not reflect current operating conditions.

The 3x3OS engagement at your tier includes the governance maintenance layer — the quarterly review cadence, the update protocol, and the documentation practices that ensure the infrastructure reflects current operations at every stage of growth rather than the state of the business at the last time someone looked.

Your strong result means the foundation is exceptional. The engagement protects and extends it.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** The governance maintenance cadence that institutional businesses run
**Preview:** The audit system that keeps governance current without founder dependency.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Founder Exposure Index showed exceptional governance infrastructure. I want to be specific about what maintaining that infrastructure at your stage actually requires.

Annual governance audit. Every 12 months, all four pillars are reviewed against current operations. Legal structure is verified against current entity and liability requirements. Financial controls are confirmed against current team structure, spending patterns, and regulatory obligations. Data and security practices are audited against current collection, storage, and usage. Operational governance is reviewed against current decision authority, documentation, and succession requirements.

Quarterly regulatory scan. FTC guidance, state privacy laws, platform terms, and tax obligation changes are monitored for impacts on current practices.

New relationship protocol. Every new contractor, vendor, partner, and significant client relationship triggers the appropriate documentation before the relationship begins.

Growth trigger review. Each meaningful growth event — new revenue milestone, new team members, new market, new product — triggers a targeted governance review of the areas affected.

This is not an enormous amount of work when systematized. It is burdensome when ad hoc. The 3x3OS engagement installs the system that makes it automatic.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** Institutional governance is a system, not a project
**Preview:** The businesses that hold their governance advantage treat it as living infrastructure.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Founder Exposure Index with institutional-level results.

I want to close this sequence with something direct.

The governance infrastructure you have built is a genuine competitive advantage. It protects the business, supports scale, and commands a premium at any transaction. Most founder-led businesses at your stage carry significant structural exposure. You have already addressed it.

The question is whether you have the maintenance system in place to keep it current as the business continues to grow.

The 3x3OS engagement at your tier installs that system — the audit cadence, the update protocols, the review triggers, and the documentation practices that make your governance infrastructure self-maintaining rather than founder-dependent.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

P.S. At your tier the engagement is focused entirely on governance maintenance and institutional readiness. We will confirm the exact scope in the application review.

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5

**Subject:** You built something worth protecting, {{contact.first_name}}
**Preview:** The last step is the system that makes sure it stays built.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Founder Exposure Index results.

Your score was {{contact.fei_total_score}} out of 240. The governance infrastructure you have built is exceptional. It represents a level of structural protection that most founder-led businesses never achieve.

The remaining question is not whether the governance is good enough. It is whether the maintenance system is in place to ensure it stays current through the next phase of growth, the next regulatory change, the next team expansion, and the next transaction opportunity.

The 3x3OS engagement at your tier installs the governance maintenance system that keeps institutional infrastructure current without requiring the founder to manually manage it. 90 days. Specific deliverables. Built to protect what you have already built.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- ~~If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term~~ — pipeline-stage move removed per pattern §7 (no pipeline for lead-magnet intake)

---

## WORKFLOW 3 — FEI Application Link Clicked

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md). Do not build this per-source workflow.

If an FEI-specific confirmation auto-reply is desired, it must be templated inside the shared workflow with the `paradigm-welcomed` suppression check (pattern §5).

~~**Name:** FEI — Application Link Clicked~~
~~**Status:** Publish when complete~~
~~**Trigger:** Contact clicks tracked link tagged "Apply-3x3OS-Link" AND tag fei-lead exists~~
~~#### Step 1-8 — entire workflow replaced by shared Application Hot Lead workflow on `fei-application` tag~~

---

## WORKFLOW 4 — FEI Re-Engagement 30 Day

**Name:** FEI — Re-Engagement 30 Day
**Status:** Publish when complete
**Trigger:** Tag = `fei-lead` AND tag `fei-application` does NOT exist AND last activity > 30 days ago

> Pipeline-stage criteria removed (no pipeline for lead-magnet intake per pattern §7). Tag-based filtering is the source of truth.

#### Step 1 — Send Email

**Subject:** Still thinking about it, {{contact.first_name}}?
**Preview:** Your founder exposure score has not changed. The structural risk is still open.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A few weeks ago you completed the Founder Exposure Index and scored {{contact.fei_total_score}} out of 240 across four governance pillars. Your weakest section was {{contact.fei_weakest_section}}.

The scores are still the same. Founder exposure does not self-correct and governance gaps do not close on their own.

If the timing was not right when we first reached out, it may be different now. The 3x3OS engagement is still accepting applications.

Five minutes. Reviewed personally. No obligation.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Step 2 — Wait 7 days

#### Step 3 — If no response and no apply click:
- Remove tag: email-sequence-active
- Add tag: sequence-completed
- ~~Move pipeline to: Nurture - Long Term~~ — pipeline assignment removed per pattern §7

---

## SMART LISTS

Build these in GHL > Contacts > Smart Lists:

| List Name | Filters |
|---|---|
| FEI — All Leads | Tag = fei-lead |
| FEI — High Founder Exposure | Tag = fei-high-founder-exposure |
| FEI — Structured But Vulnerable | Tag = fei-structured-but-vulnerable |
| FEI — Scalable Foundation | Tag = fei-scalable-foundation |
| FEI — Institution-Level | Tag = fei-institution-level |
| FEI — Active Sequences | Tag = email-sequence-active AND Tag = fei-lead |
| FEI — Sequence Completed Not Applied | Tag = sequence-completed AND Tag = fei-lead AND Tag fei-application does NOT exist |
| FEI — High Exposure Priority | Tag = fei-high-founder-exposure AND NOT tagged fei-application |
| FEI — Weak Legal | Tag = fei-lead AND fei_weakest_section = "Legal Structure" |
| FEI — Weak Financial | Tag = fei-lead AND fei_weakest_section = "Financial Controls" |
| FEI — Weak Data Security | Tag = fei-lead AND fei_weakest_section = "Data & Security" |
| FEI — Weak Governance | Tag = fei-lead AND fei_weakest_section = "Operational Governance" |
| FEI — Applied | Tagged fei-application |
| FEI — Also In Assessment Suite | Tag = fei-lead AND (Tag = cs-lead OR Tag = le-lead OR Tag = saa-lead OR Tag = cma-lead OR Tag = fbe-lead OR Tag = csc-lead) |

---

## FINAL TESTING CHECKLIST

After all workflows are built and published:

- [ ] Submit test lead with score 80 — confirm Track 1, tag fei-high-founder-exposure, tier = HIGH FOUNDER EXPOSURE
- [ ] Submit test lead with score 150 — confirm Track 2, tag fei-structured-but-vulnerable, tier = STRUCTURED BUT VULNERABLE
- [ ] Submit test lead with score 195 — confirm Track 3, tag fei-scalable-foundation, tier = SCALABLE FOUNDATION
- [ ] Submit test lead with score 225 — confirm Track 4, tag fei-institution-level, tier = INSTITUTION-LEVEL GOVERNANCE
- [ ] Confirm all custom fields populate correctly on contact record
- [ ] Confirm "started" event creates contact and adds fei-lead tag without triggering email sequence
- [ ] Confirm section_complete events update partial_score and sections_completed fields
- [ ] Confirm final results payload triggers tier tagging and email sequence enrollment
- [ ] Confirm NO pipeline stage assignment for intake (pattern §7)
- [ ] Confirm internal notification email delivers to BOTH ari@paradigmconsulting.io AND jay@paradigmconsulting.io with all merge fields
- [ ] Confirm weakest_section field populates correctly
- [ ] Confirm Day 0 emails send from "Matt | Founder, Paradigm Consulting"
- [ ] Confirm Apply-3x3OS-Link tracked links work in all email CTAs
- [ ] Confirm goal step fires on link click (tag fei-application added, email-sequence-active removed)
- [ ] Confirm shared Application Hot Lead workflow (pattern §8) fires on `fei-application` tag and pipeline-promotes there
- [ ] Confirm `paradigm-welcomed` suppression: 2nd assessment from same contact sends result-only variant, not warm welcome
- [ ] Confirm First Name and Phone are NOT overwritten on update if already populated
- [ ] Confirm standard Company is written only if empty; fei_business_name is always written
- [ ] Submit application payload — confirm phone, business_name, `fei-application` tag added
- [ ] Confirm contacts with existing assessment data update on same record (no duplicate)
- [ ] Confirm FEI High Exposure Priority smart list surfaces correctly
- [ ] Test same email through a second assessment — confirm multi-assessment routing if applicable
