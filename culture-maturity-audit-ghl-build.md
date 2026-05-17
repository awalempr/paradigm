# Culture Maturity Audit — GHL Build Guide

> **Conforms to:** [paradigm-ghl-workflow-pattern.md](paradigm-ghl-workflow-pattern.md) (v 2026-05-17). All deviations from that pattern must be approved as named exceptions in the pattern doc first.

**Generated:** April 2, 2026
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)

---

## STEP 1 — CREATE CUSTOM FIELDS

Create these custom fields in GHL under Settings > Custom Fields > Contact:

| Field | Key | Type |
|---|---|---|
| CMA Total Score | contact.cma_total_score | NUMBER |
| CMA Tier | contact.cma_tier | TEXT |
| CMA Tier Priority | contact.cma_tier_priority | NUMBER |
| CMA Section A Clarity | contact.cma_section_a_clarity | NUMBER |
| CMA Section B Accountability | contact.cma_section_b_accountability | NUMBER |
| CMA Section C Incentive Alignment | contact.cma_section_c_incentive_alignment | NUMBER |
| CMA Section D Leadership Stability | contact.cma_section_d_leadership_stability | NUMBER |
| CMA Weakest Section | contact.cma_weakest_section | TEXT |
| CMA Sections Completed | contact.cma_sections_completed | NUMBER |
| CMA Source | contact.cma_source | TEXT |
| CMA Submitted At | contact.cma_submitted_at | DATE |
| CMA Business Name | contact.cma_business_name | TEXT |

**Notes:**
- CMA Tier Priority maps tiers to numeric values for workflow routing: 1 = Founder Dependent, 2 = Growing But Fragile, 3 = Structured But Still Personal, 4 = Institutional Culture
- CMA Weakest Section stores the label of the lowest-scoring section for use in email personalization

---

## STEP 2 — CREATE TAGS

| Tag |
|---|
| cma-lead |
| cma-founder-dependent (score ≤80) |
| cma-growing-fragile (score 81-120) |
| cma-structured-personal (score 121-160) |
| cma-institutional (score >160) |
| cma-weak-clarity |
| cma-weak-accountability |
| cma-weak-incentive-alignment |
| cma-weak-leadership-stability |

Per-source application tag (replaces shared `applied-3x3os` per pattern §2):
- cma-application

Pre-existing tags (already in system):
- applied-3x3os (DEPRECATED — replaced by `cma-application`; retained for historical contacts only)
- email-sequence-active
- sequence-completed
- paradigm-welcomed (new — see pattern §5 welcome suppression)

---

## STEP 3 — CREATE WEBHOOK TRIGGER

1. Go to Automation > Workflows > Create Workflow
2. Name: "Culture Maturity Audit"
3. Set trigger: Inbound Webhook
4. Copy the trigger ID from the webhook URL
5. Add trigger ID to Netlify env var: `WEBHOOK_CULTURE_MATURITY_AUDIT`

---

## STEP 4 — WEBHOOK PAYLOAD REFERENCE

The site sends four webhook payload types through `/api/webhook`:

### Payload 1 — Lead Started (source: `culture-maturity-audit`)

Fires when the user enters name/email and begins the assessment.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "source": "culture-maturity-audit",
  "event": "started",
  "timestamp": "2026-04-02T12:00:00.000Z"
}
```

### Payload 2 — Section Complete (source: `culture-maturity-audit`)

Fires after each of 4 sections is completed. Sent incrementally as the user progresses.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "source": "culture-maturity-audit",
  "event": "section_1_complete",
  "sections_completed": 1,
  "partial_score": 38,
  "section_a_clarity": 38,
  "timestamp": "2026-04-02T12:02:00.000Z"
}
```

Section events and fields by section:
- `section_1_complete` → `section_a_clarity`
- `section_2_complete` → `section_b_accountability`
- `section_3_complete` → `section_c_incentive_alignment`
- `section_4_complete` → `section_d_leadership_stability`

Each payload includes all section scores accumulated so far (unfilled sections are 0).

### Payload 3 — Scored / Final Results (source: `culture-maturity-audit`)

Fires when the assessment is fully completed and results are calculated.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "total_score": 142,
  "tier": "STRUCTURED BUT STILL PERSONAL",
  "section_a_clarity": 38,
  "section_b_accountability": 42,
  "section_c_incentive_alignment": 28,
  "section_d_leadership_stability": 34,
  "weakest_section": "Incentive Alignment",
  "source": "culture-maturity-audit",
  "event": "scored",
  "timestamp": "2026-04-02T12:05:00.000Z"
}
```

**Scoring breakdown:**
- 20 questions total, 1-10 scale each
- 4 sections of 5 questions = 50 points max per section, 200 max total
- Tiers: ≤80 FOUNDER DEPENDENT, 81-120 GROWING BUT FRAGILE, 121-160 STRUCTURED BUT STILL PERSONAL, >160 INSTITUTIONAL CULTURE

### Payload 4 — Application (source: `culture-maturity-audit-application`)

Fires when the founder submits the 3x3OS application from the results page.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "business_name": "Acme Corp",
  "total_score": 142,
  "tier": "STRUCTURED BUT STILL PERSONAL",
  "section_a_clarity": 38,
  "section_b_accountability": 42,
  "section_c_incentive_alignment": 28,
  "section_d_leadership_stability": 34,
  "source": "culture-maturity-audit-application",
  "event": "applied",
  "timestamp": "2026-04-02T12:10:00.000Z"
}
```

---

## WORKFLOW 1 — Culture Maturity Audit (Intake and Routing)

**Name:** Culture Maturity Audit
**Status:** Publish when complete
**Trigger:** Inbound Webhook (from Step 3)

### Step 1 — Filter by Event Type

Add an If/Else branch at the top of the workflow:

- **IF event = "started"** → Go to Step 2A (Lead Started path)
- **ELSE IF event = "scored"** → Go to Step 2B (Scored path — full intake)
- **ELSE IF event starts with "section_"** → Go to Step 2C (Section Complete path)
- **ELSE** → Stop (unknown event)

### Step 2A — Lead Started Path

1. Create or Update Contact:
   - first_name → First Name (only if currently empty — see Duplicate-handling rule)
   - email → Email (dedupe key)
   - source → CMA Source
   - timestamp → CMA Submitted At

   **Duplicate-handling rule:**
   - Match on `email`
   - If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
   - For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `cma_business_name` regardless.

2. Add tag: cma-lead

3. ~~Add to Pipeline: Paradigm Leads → New Lead~~ — REMOVED per pattern §7 (lead-magnet intake; no pipeline)

4. Stop workflow (do not route to email sequence yet — wait for scored event)

### Step 2B — Scored Path (Full Intake)

#### Step 2B.1 — Create or Update Contact

Map from webhook payload:
- first_name → First Name (only if currently empty — see Duplicate-handling rule)
- email → Email (dedupe key)
- total_score → CMA Total Score
- tier → CMA Tier
- section_a_clarity → CMA Section A Clarity
- section_b_accountability → CMA Section B Accountability
- section_c_incentive_alignment → CMA Section C Incentive Alignment
- section_d_leadership_stability → CMA Section D Leadership Stability
- weakest_section → CMA Weakest Section
- source → CMA Source
- timestamp → CMA Submitted At

**Duplicate-handling rule:**
- Match on `email`
- If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
- For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `cma_business_name` regardless.

#### Step 2B.2 — Set Tier Priority

- IF tier = "FOUNDER DEPENDENT" → Set cma_tier_priority = 1
- ELSE IF tier = "GROWING BUT FRAGILE" → Set cma_tier_priority = 2
- ELSE IF tier = "STRUCTURED BUT STILL PERSONAL" → Set cma_tier_priority = 3
- ELSE → Set cma_tier_priority = 4

#### Step 2B.3 — Add to Pipeline

> **REMOVED per pattern §7.** Lead-magnet intake (non-`*-apply` source) does not get pipeline assignment. ~~Pipeline: Paradigm Leads · Stage: Assessment Submitted · Only if contact is NOT already at a higher stage (position > 1)~~

#### Step 2B.4 — Add Tag

- Tag: cma-lead (if not already present from started event)

#### Step 2B.5 — Tier Tagging (If/Else Branches)

**Branch A** — IF cma_total_score <= 80:
- Add tag: cma-founder-dependent

**Branch B** — ELSE IF cma_total_score <= 120:
- Add tag: cma-growing-fragile

**Branch C** — ELSE IF cma_total_score <= 160:
- Add tag: cma-structured-personal

**Branch D** — ELSE (cma_total_score > 160):
- Add tag: cma-institutional

#### Step 2B.6 — Weakest Section Tagging (If/Else Branches)

- IF weakest_section = "Clarity" → Add tag: cma-weak-clarity
- ELSE IF weakest_section = "Accountability" → Add tag: cma-weak-accountability
- ELSE IF weakest_section = "Incentive Alignment" → Add tag: cma-weak-incentive-alignment
- ELSE IF weakest_section = "Leadership Stability" → Add tag: cma-weak-leadership-stability

#### Step 2B.7 — Route to Email Sequence (If/Else Branches)

- IF cma_tier_priority = 1 → Enroll in workflow "CMA — Track 1 Founder Dependent"
- ELSE IF cma_tier_priority = 2 → Enroll in workflow "CMA — Track 2 Growing But Fragile"
- ELSE IF cma_tier_priority = 3 → Enroll in workflow "CMA — Track 3 Structured But Still Personal"
- ELSE → Enroll in workflow "CMA — Track 4 Institutional Culture"

After enrollment (all branches):
- Add tag: email-sequence-active
- ~~Move pipeline stage to: Email Sequence Active (only if currently at Assessment Submitted)~~ — REMOVED per pattern §7 (no pipeline for lead-magnet intake)

#### Step 2B.8 — Internal Notification Email

**To:** ari@paradigmconsulting.io, jay@paradigmconsulting.io

**Subject:** New CMA Lead — {{contact.first_name}} — Score {{contact.cma_total_score}}/200 — {{contact.cma_tier}}

**Body:**
```
Name: {{contact.first_name}}
Email: {{contact.email}}
Total Score: {{contact.cma_total_score}} / 200
Tier: {{contact.cma_tier}}
Tier Priority: {{contact.cma_tier_priority}}

Section Scores:
  Clarity: {{contact.cma_section_a_clarity}} / 50
  Accountability: {{contact.cma_section_b_accountability}} / 50
  Incentive Alignment: {{contact.cma_section_c_incentive_alignment}} / 50
  Leadership Stability: {{contact.cma_section_d_leadership_stability}} / 50

Weakest Section: {{contact.cma_weakest_section}}
Submitted: {{contact.cma_submitted_at}}
Check contact record for assessment suite data if applicable
```

### Step 2C — Section Complete Path

1. Update Contact:
   - sections_completed → CMA Sections Completed
   - partial_score → (do not store — transient value)
   - Map whichever section field is present (section_a_clarity, section_b_accountability, etc.)

   **Duplicate-handling rule:**
   - Match on `email`
   - If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
   - For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `cma_business_name` regardless.

2. Stop workflow (do not route — wait for scored event)

---

## WORKFLOW 2 — Culture Maturity Audit Application Handler

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md). Do not build this per-source workflow.

The shared workflow triggers on any `*-application` tag (including `cma-application`) and handles: hot-lead tagging, sequence pause, pipeline promotion, internal alert to ari@ + jay@paradigmconsulting.io, and 1-business-day SLA reminder.

**Per-source intake responsibility (what THIS doc still owns):** when the `culture-maturity-audit-apply` webhook fires, this intake workflow must still create-or-update the contact (using the same dedupe + company rules above), map `phone`, `business_name`, and assessment fields, and add the `cma-application` tag. The shared Application Hot Lead workflow takes over from there.

<!-- TODO: confirm this still applies given pattern v 2026-05-17 — the apply source string in webhook.js / culture-maturity-audit.html is still `culture-maturity-audit-application` per pattern §11 code-side TODOs. Rename to `culture-maturity-audit-apply` before live testing. -->

~~**Name:** Culture Maturity Audit — Application~~
~~**Status:** Publish when complete~~
~~**Trigger:** Inbound Webhook (same trigger ID — route by source field)~~

~~**Alternative:** Add an If/Else branch at the top of Workflow 1 that checks if `source` = `culture-maturity-audit-application`, then routes to the application steps below instead of the intake steps above.~~

~~### Step 1 — Update Contact~~

~~Map from webhook payload:~~
~~- phone → Phone~~
~~- business_name → Company (or a custom field)~~
~~- total_score → CMA Total Score (update in case it was not captured)~~
~~- tier → CMA Tier~~
~~- section_a_clarity → CMA Section A Clarity~~
~~- section_b_accountability → CMA Section B Accountability~~
~~- section_c_incentive_alignment → CMA Section C Incentive Alignment~~
~~- section_d_leadership_stability → CMA Section D Leadership Stability~~
~~- source → CMA Source (update to "culture-maturity-audit-application")~~

~~### Step 2 — Add Tag~~
~~- Tag: applied-3x3os~~

~~### Step 3 — Move Pipeline Stage~~
~~- Pipeline: Paradigm Leads · Stage: Application Link Clicked~~

~~### Step 4 — Remove Tag~~
~~- Remove: email-sequence-active~~

~~### Step 5 — Internal Notification Email~~
~~**To:** jay@paradigmconsulting.io · subject/body replaced by shared workflow's hot-lead alert template.~~

---

## EMAIL SEQUENCES

---

### CMA — Track 1 Founder Dependent (Score ≤80)

**Name:** CMA — Track 1 Founder Dependent
**Status:** Publish when complete
**Trigger:** Enrolled from Culture Maturity Audit intake workflow

Framing: The business culture is indistinguishable from the founder. Every standard, expectation, and decision lives inside one person. The 3x3OS message is about externalizing culture into infrastructure so the business can hold its identity without the founder in every room.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: cma-application
- Remove tag: email-sequence-active
- ~~Move pipeline stage to: Application Link Clicked~~ — pipeline assignment is handled by the shared "Application Hot Lead" workflow (pattern §8) on detection of the `cma-application` tag
- Stop all further steps immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending Email 1 below, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant (the Email 1 body that follows) AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant: same email with the intro/orientation paragraphs removed, jumping straight to results. Build-time decision on exact paragraph cuts.

#### Email 1 — Send immediately

**Subject:** Your culture audit results, {{contact.first_name}}
**Preview:** A score of {{contact.cma_total_score}} out of 200 means one thing. Here is what it is.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Culture Maturity Audit on the Paradigm Consulting site.

Your total score is {{contact.cma_total_score}} out of 200. That places your business in the Founder Dependent tier — and before that label creates resistance, I want to explain what it actually means.

It means the culture of your business currently lives inside you. The standards your team follows exist because you enforce them personally. The expectations for quality, communication, and decision-making are understood because you demonstrate them daily. The way things get done reflects how you do them — not a system that operates independently of you.

That is not a failure. It is the natural state of a business at your stage. Every company starts this way. The problem is not that the culture is founder-dependent today. The problem is when it stays founder-dependent as the business tries to grow.

Your weakest section was {{contact.cma_weakest_section}}. That is where the founder dependency shows up most visibly — and where it will create the most friction as you add people, delegate more, and try to scale.

Over the next two weeks I want to walk you through what it looks like to move culture out of the founder and into the infrastructure of the business. Not corporate HR programs. Not motivational frameworks. Structural installation.

If anything in your results surprised you, reply and tell me which section it was. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Culture Audit — link to culture-maturity-audit results page]**

#### Wait 2 days

#### Email 2

**Subject:** Why your weakest section matters more than the total score
**Preview:** {{contact.cma_weakest_section}} is where the cracks show first.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Culture Maturity Audit with a total score of {{contact.cma_total_score}} out of 200. Your weakest section was {{contact.cma_weakest_section}}.

I want to talk about why that weakest section matters more than the overall number.

Culture does not break evenly. It breaks at the weakest point first. A business with strong clarity but weak accountability will have people who understand what is expected and consistently fail to deliver it. A business with strong accountability but weak incentive alignment will have people who hit targets while quietly looking for other opportunities. A business with strong incentive alignment but weak leadership stability will have people who are motivated but confused by inconsistent direction.

Your section scores tell the story:
- Clarity: {{contact.cma_section_a_clarity}} / 50
- Accountability: {{contact.cma_section_b_accountability}} / 50
- Incentive Alignment: {{contact.cma_section_c_incentive_alignment}} / 50
- Leadership Stability: {{contact.cma_section_d_leadership_stability}} / 50

At a score of {{contact.cma_total_score}}, the culture infrastructure does not yet exist independently of you. That means every section depends on your personal presence to function. When you are in the room, standards hold. When you are not, they drift. That drift is not a people problem. It is an infrastructure problem.

The 3x3OS engagement starts by installing the infrastructure in your weakest section first — because that is where the founder dependency is most visible and most costly.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** What founder-dependent culture actually costs
**Preview:** It is not just your time. It is the ceiling on everything the business can become.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Culture Maturity Audit scored {{contact.cma_total_score}} out of 200. I want to talk about what founder-dependent culture actually costs — because the real cost is not what most founders assume.

The obvious cost is time. If every standard, expectation, and cultural norm requires your personal enforcement, you are spending hours every week on culture maintenance that should be handled by infrastructure. That is real and it is significant.

But the less obvious cost is the ceiling. A founder-dependent culture cannot scale beyond the founder's direct reach. Every new hire dilutes the culture because there is no documented infrastructure for them to absorb. Every new team creates its own micro-culture because there is no organizational culture strong enough to override individual defaults. Every time you step away — for a vacation, for a strategic project, for a health issue — the culture degrades because you are the culture.

That ceiling is what keeps businesses stuck at the stage where the founder can personally manage everything. Revenue might grow, but the operational capacity does not grow with it because the cultural infrastructure cannot support it.

Your weakest section — {{contact.cma_weakest_section}} — is where this ceiling shows up first. It is also where installation has the highest immediate impact.

The 3x3OS engagement installs culture infrastructure in 90 days. Not team-building exercises. Not values posters. Structural systems that hold without the founder in the room.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** The difference between culture you enforce and culture that holds on its own
**Preview:** One scales. The other breaks.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

One week ago you completed the Culture Maturity Audit. I want to draw a specific distinction that matters at your stage.

There are two kinds of organizational culture. Culture that the founder enforces through personal presence, and culture that holds because it is installed into the infrastructure of the business.

The first kind feels like culture. People behave the way you want them to when you are around. Meetings follow the format you prefer. Communication happens through the channels you check. Quality meets the standard you personally inspect. It looks like a functioning culture from the inside.

The test is what happens when you are not there. If standards slip when you travel. If communication breaks down when you are focused on a strategic project. If new hires take months to absorb how things work because no one can explain it — they just have to watch you do it until they understand. Those are the signatures of enforced culture, not installed culture.

Your score of {{contact.cma_total_score}} tells me the culture is still primarily enforced. The sections — Clarity at {{contact.cma_section_a_clarity}}, Accountability at {{contact.cma_section_b_accountability}}, Incentive Alignment at {{contact.cma_section_c_incentive_alignment}}, Leadership Stability at {{contact.cma_section_d_leadership_stability}} — tell me where specifically the enforcement is happening and where the installation needs to begin.

The 3x3OS engagement converts enforced culture into installed culture. 90 days. Specific deliverables for each section. Built around the exact gaps your audit identified.

I have room for one more engagement this quarter.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5

**Subject:** Last note on your culture audit, {{contact.first_name}}
**Preview:** The score does not change unless the infrastructure does.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Culture Maturity Audit results.

Your score was {{contact.cma_total_score}} out of 200. Your weakest section was {{contact.cma_weakest_section}}. Your business culture currently depends on your personal presence to hold.

That will not change on its own. Adding people does not install culture. Growing revenue does not install culture. Working harder does not install culture. Only deliberate structural installation changes where culture lives — and right now it lives entirely inside you.

If you want to change that — if you want a business where the culture holds without you in every room — the 3x3OS application is below. We review every application personally and only accept founders where the engagement will produce a measurable shift in how the business operates.

If the timing is not right, keep your audit results. The scores will be the same whenever you are ready.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- ~~If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term~~ — pipeline-stage move removed per pattern §7 (no pipeline for lead-magnet intake)

---

### CMA — Track 2 Growing But Fragile (Score 81-120)

**Name:** CMA — Track 2 Growing But Fragile
**Status:** Publish when complete
**Trigger:** Enrolled from Culture Maturity Audit intake workflow

Framing: The business has begun to build culture beyond the founder, but the infrastructure is incomplete and fragile. Some systems exist but they do not cover all four pillars. Growth will stress the weak points. The 3x3OS message is about completing the infrastructure before growth exposes the gaps.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: cma-application
- Remove tag: email-sequence-active
- ~~Move pipeline stage to: Application Link Clicked~~ — pipeline assignment handled by shared Application Hot Lead workflow (pattern §8)
- Stop all further steps immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending Email 1 below, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant (the Email 1 body that follows) AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant: same email with intro paragraphs removed, jumping straight to results. Build-time decision.

#### Email 1 — Send immediately

**Subject:** Your culture audit results, {{contact.first_name}}
**Preview:** A score of {{contact.cma_total_score}} means you have started building. Here is what is still missing.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Culture Maturity Audit on the Paradigm Consulting site.

Your total score is {{contact.cma_total_score}} out of 200. That places your business in the Growing But Fragile tier.

Here is what that actually means.

You have begun building culture infrastructure beyond yourself. Some of the systems, expectations, and accountability structures exist independently of your personal enforcement. That is real progress and it matters.

But the infrastructure is incomplete. Your section scores reveal where:
- Clarity: {{contact.cma_section_a_clarity}} / 50
- Accountability: {{contact.cma_section_b_accountability}} / 50
- Incentive Alignment: {{contact.cma_section_c_incentive_alignment}} / 50
- Leadership Stability: {{contact.cma_section_d_leadership_stability}} / 50

Your weakest section is {{contact.cma_weakest_section}}. That is where the fragility lives. The sections where you scored higher will hold under growth. The sections where you scored lower will not — and those are the sections where growth creates the most visible problems.

The pattern we see most often at your tier is selective infrastructure. Some pillars are strong because the founder prioritized them. Others are weak because they were never deliberately built. The business feels stable because the strong sections mask the weak ones — until growth puts pressure on a weak section and the whole thing wobbles.

Over the next two weeks I want to walk you through what completing the infrastructure looks like and why doing it now, before growth forces the issue, changes the trajectory of everything the business builds next.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Culture Audit — link to culture-maturity-audit results page]**

#### Wait 2 days

#### Email 2

**Subject:** The section that will break first under growth
**Preview:** Your audit already identified it. Here is why it matters now.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Culture Maturity Audit with a score of {{contact.cma_total_score}} out of 200. Your weakest section was {{contact.cma_weakest_section}}.

I want to be specific about what happens when a business at your tier grows without addressing the weak section.

If your weakest section is Clarity: new hires will not understand what the business stands for, what standards apply, or how decisions get made. They will learn by trial and error rather than by design. The result is inconsistency that the founder has to personally correct, which pulls you back into the enforcement role you are trying to leave.

If your weakest section is Accountability: people will understand what is expected but there will be no structural consequence for missing it. Performance conversations will be ad hoc. Standards will be aspirational rather than enforced. The best people will leave because they notice the gap.

If your weakest section is Incentive Alignment: your team will perform but their motivations will not be connected to the outcomes the business needs. Compensation, recognition, and advancement will feel arbitrary rather than earned. Turnover will be higher than it should be at your revenue stage.

If your weakest section is Leadership Stability: the team will experience inconsistent direction. Priorities will shift based on the founder's current focus rather than a documented strategy. The team will learn to wait for direction rather than act with autonomy.

Your weakest section is where the 3x3OS engagement starts. It is the highest-leverage installation point in your business right now.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** Fragile culture and the growth trap
**Preview:** The business can grow. The culture cannot absorb it yet.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Culture Maturity Audit scored {{contact.cma_total_score}} out of 200 — Growing But Fragile.

I want to name the specific trap that businesses at your tier fall into.

The revenue can grow. The business can add people. New clients can come in. Everything looks like progress from the outside. But the culture infrastructure cannot absorb the growth because it was not built to hold more than it currently holds.

Every new hire dilutes the strong sections slightly and stresses the weak sections significantly. Every new team creates coordination overhead that the existing culture systems were not designed to handle. Every new layer of complexity exposes the gaps between the sections that were built deliberately and the sections that were not.

The result is a business that grows in revenue but degrades in operational quality. The founder spends more and more time managing cultural friction — inconsistency, misalignment, accountability gaps, communication breakdowns — that would not exist if the infrastructure had been completed before the growth happened.

This is not inevitable. Businesses at your tier that complete the culture infrastructure before the next growth phase avoid the trap entirely. The growth gets absorbed rather than absorbed-and-then-managed.

The 3x3OS engagement completes the infrastructure in 90 days. Specific deliverables for each of the four sections, prioritized by your weakest section first.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** What completing your culture infrastructure is worth
**Preview:** The math is specific. The cost of not doing it is higher.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

One week ago you completed the Culture Maturity Audit with a score of {{contact.cma_total_score}}.

I want to talk about what completing the culture infrastructure at your stage is worth — not in theory, but in measurable operational impact.

Businesses with complete culture infrastructure — where all four pillars are strong and self-sustaining — experience lower turnover, faster onboarding, fewer escalations, more autonomous decision-making, and higher per-person output. None of those are soft benefits. They are measurable in dollars and in founder hours recovered.

Every percentage point of unwanted turnover costs 50-200% of the departing person's annual compensation in recruiting, training, and lost productivity. Every escalation that reaches the founder because the accountability infrastructure is weak costs the founder's most valuable asset — time that should be spent on strategy, not management.

Your section scores tell me exactly where the infrastructure gaps are creating these costs:
- Clarity at {{contact.cma_section_a_clarity}} means onboarding takes longer than it should
- Accountability at {{contact.cma_section_b_accountability}} means performance management requires more founder involvement than it should
- Incentive Alignment at {{contact.cma_section_c_incentive_alignment}} means retention depends on factors outside the business's control
- Leadership Stability at {{contact.cma_section_d_leadership_stability}} means the team's confidence in direction fluctuates more than it should

The 3x3OS engagement installs the infrastructure that closes these gaps. 90 days. Measurable shift in how the business operates.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5

**Subject:** Last note on your culture audit, {{contact.first_name}}
**Preview:** Fragile does not have to be permanent. But it does not fix itself.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Culture Maturity Audit results.

Your score was {{contact.cma_total_score}} out of 200. Your weakest section was {{contact.cma_weakest_section}}. Your business has real culture infrastructure in some areas and genuine gaps in others.

The fragility in your culture will not resolve through growth. It will be exposed by growth. The sections that are strong will hold. The sections that are weak will break — and they will break visibly, in the form of turnover, inconsistency, escalations, and founder time consumed by problems the infrastructure should be handling.

If you want to complete the infrastructure before the next growth phase stresses it — the 3x3OS application is below. We review every application personally and only accept founders where the engagement will produce a measurable shift.

If the timing is not right, keep your audit results. The gaps will still be there when you are ready.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- ~~If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term~~ — pipeline-stage move removed per pattern §7 (no pipeline for lead-magnet intake)

---

### CMA — Track 3 Structured But Still Personal (Score 121-160)

**Name:** CMA — Track 3 Structured But Still Personal
**Status:** Publish when complete
**Trigger:** Enrolled from Culture Maturity Audit intake workflow

Framing: The business has real culture infrastructure. Systems exist across most or all four pillars. But the founder's personal involvement is still required to keep the system running — the infrastructure works when maintained, but it is not yet self-sustaining. The 3x3OS message is about making the final shift from founder-maintained to self-sustaining culture.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: cma-application
- Remove tag: email-sequence-active
- ~~Move pipeline stage to: Application Link Clicked~~ — pipeline assignment handled by shared Application Hot Lead workflow (pattern §8)
- Stop all further steps immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending Email 1 below, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant (the Email 1 body that follows) AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant: same email with intro paragraphs removed, jumping straight to results. Build-time decision.

#### Email 1 — Send immediately

**Subject:** Your culture audit results, {{contact.first_name}}
**Preview:** A score of {{contact.cma_total_score}} means the structure is real. Here is what makes it permanent.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Culture Maturity Audit on the Paradigm Consulting site.

Your total score is {{contact.cma_total_score}} out of 200. That places your business in the Structured But Still Personal tier.

Here is what that means.

You have built genuine culture infrastructure across your business. Standards are documented or understood. Accountability mechanisms exist. People generally know what is expected and what happens when expectations are not met. The culture functions — and it functions because you built it deliberately.

The distinction at your tier is between structure that works and structure that sustains itself. Your culture infrastructure requires your ongoing involvement to maintain. You are not enforcing every standard personally anymore, but you are still the person who ensures the system keeps running. If you stepped away for 90 days, the infrastructure would degrade — not immediately, but steadily.

Your section scores:
- Clarity: {{contact.cma_section_a_clarity}} / 50
- Accountability: {{contact.cma_section_b_accountability}} / 50
- Incentive Alignment: {{contact.cma_section_c_incentive_alignment}} / 50
- Leadership Stability: {{contact.cma_section_d_leadership_stability}} / 50

Your weakest section — {{contact.cma_weakest_section}} — is where the personal dependency shows up most. That is the section where the system still needs you to function correctly.

Over the next two weeks I want to walk you through what self-sustaining culture infrastructure looks like and how the last structural shift changes everything about how the business operates.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Culture Audit — link to culture-maturity-audit results page]**

#### Wait 2 days

#### Email 2

**Subject:** The last mile of culture infrastructure is the most valuable
**Preview:** It is the shift from founder-maintained to self-sustaining. Here is what that means.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Culture Maturity Audit with a score of {{contact.cma_total_score}} — Structured But Still Personal.

I want to name the specific shift that separates your tier from the tier above it.

At your level, the culture infrastructure works. People understand what is expected. Systems exist to enforce standards. The business can operate without the founder in every room. But the founder is still the person who maintains the system — who notices when standards start to drift, who recalibrates when incentives fall out of alignment, who ensures the accountability structures are actually being used.

The shift from Structured But Still Personal to Institutional Culture is not about building more infrastructure. It is about making the existing infrastructure self-maintaining. It is about installing the feedback loops, review cadences, and escalation protocols that keep the system calibrated without founder intervention.

This is the shift that makes a business truly scalable. Not the revenue model. Not the marketing engine. The culture infrastructure that sustains itself without the founder monitoring it.

Your weakest section — {{contact.cma_weakest_section}} at {{contact.cma_section_a_clarity}}/50 — is where this shift needs to happen first.

The 3x3OS engagement at your position is not a rebuild. It is the final installation that makes the existing infrastructure permanent.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** What self-sustaining culture looks like from the inside
**Preview:** The founder stops maintaining and starts leading.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Culture Maturity Audit scored {{contact.cma_total_score}} out of 200.

I want to describe what the next tier looks like from the inside — because you are close enough to see it but might not recognize the specific changes that get you there.

In a business with self-sustaining culture infrastructure, the founder does not maintain standards. The system maintains standards. New hires absorb the culture through documented onboarding, not through months of osmosis. Performance issues are identified and addressed by the accountability infrastructure, not by the founder noticing something is off. Incentive structures are reviewed and recalibrated on a documented cadence, not when the founder remembers to look at them. Leadership consistency comes from documented decision frameworks, not from the founder being the consistent one.

The founder in that business spends time on strategy, on vision, on the work that only the founder can do. The culture runs without them not because they do not care about it but because they installed it correctly.

Your section scores tell me which parts of the infrastructure are closest to self-sustaining and which still need the final installation:
- Clarity: {{contact.cma_section_a_clarity}} / 50
- Accountability: {{contact.cma_section_b_accountability}} / 50
- Incentive Alignment: {{contact.cma_section_c_incentive_alignment}} / 50
- Leadership Stability: {{contact.cma_section_d_leadership_stability}} / 50

The 3x3OS engagement takes the structure you have built and makes it hold without you. 90 days. Section by section. Starting with {{contact.cma_weakest_section}}.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** The value of institutional culture at exit or investment
**Preview:** It is measurable. And acquirers look for it specifically.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

One week ago you completed the Culture Maturity Audit. I want to talk about something specific to your tier that most founders do not consider until it is too late.

Acquirers and investors assess culture infrastructure as a predictor of post-transaction performance. A business with founder-dependent culture is a risk — because when the founder transitions out, the culture transitions with them. A business with self-sustaining culture infrastructure is an asset — because the culture will hold through a transaction, a leadership change, or a growth phase.

The difference is measurable in valuation. Businesses with documented, self-sustaining culture infrastructure command higher multiples because they carry lower operational risk. The buyer or investor knows the business will not degrade when the founder reduces their involvement.

At your score of {{contact.cma_total_score}}, you are close to that standard but not there yet. The culture works but it still depends on you to maintain it. The gap between where you are and where the culture sustains itself is closable — and closing it before a transaction or investment conversation begins is significantly more valuable than closing it during one.

The 3x3OS engagement closes that gap in 90 days. Application-only.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5

**Subject:** You built the structure. Here is how to make it permanent, {{contact.first_name}}.
**Preview:** The last installation is the one that frees you.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Culture Maturity Audit results.

Your score was {{contact.cma_total_score}} out of 200. Your weakest section was {{contact.cma_weakest_section}}. Your business has genuine culture infrastructure that works — and it still requires your personal maintenance to keep working.

The final shift — from structured to institutional — is the shift that changes everything. It is the shift where the founder stops being the person who keeps the culture running and becomes the person who leads a business with a culture that runs itself.

That shift does not happen through time or growth. It happens through deliberate installation of the feedback loops, review cadences, and maintenance protocols that keep the existing infrastructure calibrated without you.

If you want to make that shift — the 3x3OS application is below. We review every application personally and only accept founders where the engagement will produce a measurable shift.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- ~~If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term~~ — pipeline-stage move removed per pattern §7 (no pipeline for lead-magnet intake)

---

### CMA — Track 4 Institutional Culture (Score >160)

**Name:** CMA — Track 4 Institutional Culture
**Status:** Publish when complete
**Trigger:** Enrolled from Culture Maturity Audit intake workflow

Framing: The business has strong, self-sustaining culture infrastructure. The founder has already done the hard work. The 3x3OS message is about maintenance governance, refinement, and protecting the asset they have built as the business enters its next growth phase.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: cma-application
- Remove tag: email-sequence-active
- ~~Move pipeline stage to: Application Link Clicked~~ — pipeline assignment handled by shared Application Hot Lead workflow (pattern §8)
- Stop all further steps immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending Email 1 below, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant (the Email 1 body that follows) AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant: same email with intro paragraphs removed, jumping straight to results. Build-time decision.

#### Email 1 — Send immediately

**Subject:** Your culture audit results, {{contact.first_name}}
**Preview:** A score of {{contact.cma_total_score}} out of 200. That is institutional-grade. Here is what maintaining it requires.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Culture Maturity Audit on the Paradigm Consulting site.

Your total score is {{contact.cma_total_score}} out of 200. That places your business in the Institutional Culture tier — the highest tier on the assessment.

I want to be direct about what that means and what it does not mean.

It means you have built genuine, self-sustaining culture infrastructure. The standards, accountability mechanisms, incentive structures, and leadership consistency in your business exist independently of your personal enforcement. That is rare, and it reflects deliberate work that most founders never do.

It does not mean the culture is permanent. Culture infrastructure that is strong today can degrade over time without a maintenance cadence — as the business grows, as the team changes, as the market shifts. What was institutional at your current stage may have gaps at the next stage.

Your section scores:
- Clarity: {{contact.cma_section_a_clarity}} / 50
- Accountability: {{contact.cma_section_b_accountability}} / 50
- Incentive Alignment: {{contact.cma_section_c_incentive_alignment}} / 50
- Leadership Stability: {{contact.cma_section_d_leadership_stability}} / 50

Even at your level, your weakest section — {{contact.cma_weakest_section}} — represents the area most likely to require attention as the business grows. It is not a gap today. It is the section to watch.

Over the next week I want to walk you through what maintaining institutional culture looks like at scale — and how the 3x3OS engagement protects what you have already built.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Culture Audit — link to culture-maturity-audit results page]**

#### Wait 2 days

#### Email 2

**Subject:** Culture infrastructure has a maintenance cadence. Here is what yours should look like.
**Preview:** The work that keeps institutional culture institutional.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Culture Maturity Audit with a score of {{contact.cma_total_score}} — Institutional Culture.

I want to be specific about what maintaining this level requires as the business continues to grow.

Institutional culture does not maintain itself through inertia. It maintains itself through documented cadences and review protocols. The businesses that hold institutional culture over time — through growth phases, leadership changes, market shifts, and team turnover — have specific practices in place.

Quarterly culture audit. Every 90 days, the four pillars are reviewed against current operations. Clarity documentation is verified against current roles and standards. Accountability structures are confirmed against current team composition. Incentive alignment is audited against current compensation and recognition practices. Leadership stability metrics are reviewed against actual decision-making patterns.

New hire culture integration. Every new hire triggers a documented culture integration protocol — not just onboarding for their role, but deliberate integration into the culture infrastructure. What are the standards. How are they enforced. What does accountability look like here. How does compensation and recognition work. What can they expect from leadership consistency.

Growth trigger review. Every significant growth event — new revenue milestone, new team size threshold, new market expansion — triggers a review of whether the culture infrastructure still fits the new scale.

The 3x3OS engagement at your position installs this maintenance cadence and ensures the culture infrastructure you have built holds through whatever growth comes next.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** What institutional culture is worth at transaction
**Preview:** Acquirers measure it specifically. Here is what they look for.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Culture Maturity Audit scored {{contact.cma_total_score}} out of 200.

I want to name something that matters whether you are planning a transaction or not.

Institutional culture infrastructure is one of the strongest predictors of post-acquisition performance. Acquirers and investors who conduct thorough due diligence assess it specifically — because a business where the culture sustains itself through a leadership transition is worth measurably more than a business where the culture is at risk when the founder reduces involvement.

Your score puts you in the category of businesses where the culture would hold through a transaction. That is a genuine competitive advantage in any valuation conversation. It is also an advantage you can lose if the maintenance cadence is not in place to keep the infrastructure current as the business grows.

The 3x3OS engagement at your position is refinement and protection — not installation. It ensures the infrastructure holds through the next growth phase and documents it in a way that would withstand institutional scrutiny.

Application-only. Reviewed personally.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** You built something rare, {{contact.first_name}}. Here is how to keep it.
**Preview:** Most founders never get here. The maintenance system is the last piece.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

One week ago you completed the Culture Maturity Audit.

Your score of {{contact.cma_total_score}} represents something most businesses never achieve. The culture infrastructure you have built is a genuine operational asset — one that reduces turnover, accelerates onboarding, enables autonomous decision-making, and supports scale without degradation.

The question at your stage is not whether the infrastructure works. It does. The question is whether it will still work in 12 months, after the next growth phase, after the next round of hiring, after the market shifts.

The businesses that hold institutional culture over time are the ones with the maintenance system in place. Not the ones who built it once and assumed it would persist.

The 3x3OS engagement at your position installs that maintenance system — the review cadences, the trigger protocols, and the documentation practices that make the culture infrastructure self-correcting rather than founder-monitored.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5

**Subject:** One last thing, {{contact.first_name}}
**Preview:** Institutional culture is an asset. Assets require protection.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Culture Maturity Audit results.

Your score was {{contact.cma_total_score}} out of 200. The culture infrastructure you have built is real, strong, and rare. It represents one of the most valuable operational assets in your business.

The 3x3OS engagement at your position is about protecting that asset — installing the maintenance governance that ensures the infrastructure holds through growth, change, and time.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

P.S. At your position the engagement is scoped specifically to maintenance governance and any emerging gap areas. We will confirm the exact scope in the application review.

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- ~~If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term~~ — pipeline-stage move removed per pattern §7 (no pipeline for lead-magnet intake)

---

## WORKFLOW 3 — CMA Application Link Clicked

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md). Do not build this per-source workflow.

If a CMA-specific confirmation auto-reply is desired, it must be templated inside the shared workflow with the `paradigm-welcomed` suppression check (pattern §5).

~~**Name:** CMA — Application Link Clicked~~
~~**Status:** Publish when complete~~
~~**Trigger:** Contact clicks tracked link tagged "Apply-3x3OS-Link" AND tag cma-lead exists~~

~~> **NOTE:** Check whether existing Application Link Clicked workflows already handle this globally. If so, skip this workflow.~~

~~#### Step 1 — Check for tag applied-3x3os. If exists, stop workflow.~~
~~#### Step 2 — Add tag: applied-3x3os~~
~~#### Step 3 — Move pipeline stage to: Application Link Clicked~~
~~#### Step 4 — Remove tag: email-sequence-active~~
~~#### Step 5 — Remove contact from all active CMA email sequence workflows~~
~~#### Step 6 — Wait 10 minutes~~
~~#### Step 7 — Internal notification to jay@paradigmconsulting.io — replaced by shared workflow's ari@ + jay@ alert template~~
~~#### Step 8 — Send contact email "We received your interest" — see note above re shared template + suppression~~

---

## WORKFLOW 4 — CMA Re-Engagement 30 Day

**Name:** CMA — Re-Engagement 30 Day
**Status:** Publish when complete
**Trigger:** Tag = `cma-lead` AND tag `cma-application` does NOT exist AND last activity > 30 days ago

> Pipeline-stage criteria removed (no pipeline for lead-magnet intake per pattern §7). Tag-based filtering is now the source of truth.

#### Step 1 — Check if multi_assessment_routing_active = YES. If yes, stop workflow.

#### Step 2 — Send Email

**Subject:** Still thinking about it, {{contact.first_name}}?
**Preview:** Your culture audit score has not changed. The gaps are still there.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A few weeks ago you completed the Culture Maturity Audit and scored {{contact.cma_total_score}} out of 200. Your weakest section was {{contact.cma_weakest_section}}.

The scores have not changed. The culture infrastructure gaps your audit identified are still there. Culture does not self-correct without deliberate installation.

If the timing was not right when we first reached out, it may be different now. The 3x3OS engagement is still accepting applications.

Five minutes. Reviewed personally. No obligation.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Step 3 — Wait 7 days

#### Step 4 — If no response and no apply click:
- Remove tag: email-sequence-active
- Add tag: sequence-completed
- ~~Move pipeline to: Nurture - Long Term~~ — pipeline assignment removed per pattern §7

---

## MULTI-ASSESSMENT PRIORITY ROUTER UPDATE

Open existing **Multi-Assessment Priority Router** workflow. Add:
- `cma_tier_priority` to the worst-score comparison logic
- When `worst_assessment_tool` = CMA → enroll in the appropriate **CMA — Track N** workflow based on `cma_tier_priority`

---

## SMART LISTS

Build these in GHL > Contacts > Smart Lists:

| List Name | Filters |
|---|---|
| CMA — All Leads | Tag = cma-lead |
| CMA — Founder Dependent | Tag = cma-founder-dependent |
| CMA — Growing But Fragile | Tag = cma-growing-fragile |
| CMA — Structured But Still Personal | Tag = cma-structured-personal |
| CMA — Institutional Culture | Tag = cma-institutional |
| CMA — Active Sequences | Tag = email-sequence-active AND Tag = cma-lead |
| CMA — Sequence Completed Not Applied | Tag = sequence-completed AND Tag = cma-lead AND Tag cma-application does NOT exist |
| CMA — Weak Clarity | Tag = cma-lead AND Tag = cma-weak-clarity |
| CMA — Weak Accountability | Tag = cma-lead AND Tag = cma-weak-accountability |
| CMA — Weak Incentive Alignment | Tag = cma-lead AND Tag = cma-weak-incentive-alignment |
| CMA — Weak Leadership Stability | Tag = cma-lead AND Tag = cma-weak-leadership-stability |
| CMA — High Priority (Founder Dependent) High Score Variance | Tag = cma-founder-dependent AND (cma_section_a_clarity >= 30 OR cma_section_b_accountability >= 30 OR cma_section_c_incentive_alignment >= 30 OR cma_section_d_leadership_stability >= 30) |
| CMA — Also In Assessment Suite | Tag = cma-lead AND (Tag = fei-lead OR Tag = cs-lead OR Tag = le-lead OR Tag = saa-lead OR Tag = fbe-lead) |

---

## FINAL TESTING CHECKLIST

After all workflows are built and published:

- [ ] Submit test lead with event "started" — confirm contact created, tag cma-lead applied, NO pipeline assignment (pattern §7), no email sequence triggered
- [ ] Submit test lead with event "section_1_complete" — confirm CMA Section A Clarity field updates, CMA Sections Completed = 1
- [ ] Submit test lead with event "section_2_complete" — confirm CMA Section B Accountability field updates, CMA Sections Completed = 2
- [ ] Submit test lead with total_score = 60 (tier FOUNDER DEPENDENT) — confirm Track 1, tag cma-founder-dependent, tier_priority = 1
- [ ] Submit test lead with total_score = 100 (tier GROWING BUT FRAGILE) — confirm Track 2, tag cma-growing-fragile, tier_priority = 2
- [ ] Submit test lead with total_score = 140 (tier STRUCTURED BUT STILL PERSONAL) — confirm Track 3, tag cma-structured-personal, tier_priority = 3
- [ ] Submit test lead with total_score = 180 (tier INSTITUTIONAL CULTURE) — confirm Track 4, tag cma-institutional, tier_priority = 4
- [ ] Confirm all custom fields populate correctly on contact record (all 4 section scores, total score, tier, weakest section)
- [ ] Confirm weakest section tags apply correctly (cma-weak-clarity, cma-weak-accountability, etc.)
- [ ] Confirm NO pipeline stage assignment for intake (pattern §7)
- [ ] Confirm internal notification email delivers to BOTH ari@paradigmconsulting.io AND jay@paradigmconsulting.io with all merge fields
- [ ] Confirm Day 0 emails send from "Matt | Founder, Paradigm Consulting"
- [ ] Confirm Apply-3x3OS-Link tracked links work in all email CTAs
- [ ] Confirm goal step fires on link click (tag cma-application added, email-sequence-active removed)
- [ ] Confirm shared Application Hot Lead workflow (pattern §8) fires on `cma-application` tag and pipeline-promotes there
- [ ] Confirm `paradigm-welcomed` suppression: 2nd assessment from same contact sends result-only variant, not warm welcome
- [ ] Confirm First Name and Phone are NOT overwritten on update if already populated
- [ ] Confirm standard Company is written only if empty; cma_business_name is always written
- [ ] Confirm contacts with existing assessment data update on same record (no duplicate created)
- [ ] Submit application payload (source: `culture-maturity-audit-apply` — see pattern §11 code-side rename TODO) — confirm tag `cma-application` added, phone + business mapped, email-sequence-active removed; pipeline promotion happens via shared workflow
- [ ] Confirm application internal notification email (sent by shared workflow) delivers with full section scores
- [ ] Submit same email through a second assessment → confirm Multi-Assessment Priority Router fires
- [ ] Confirm re-engagement stops for contacts where multi_assessment_routing_active = YES
- [ ] Verify all 4 tier email sequences deliver correct tier-specific copy with personalized section scores and weakest section references
- [ ] Confirm CMA smart lists surface correctly in GHL Contacts
