# Leverage Engine — GHL Build Guide

**Generated:** March 30, 2026
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)

> **Conforms to:** [paradigm-ghl-workflow-pattern.md](paradigm-ghl-workflow-pattern.md) (v 2026-05-17). All deviations must be approved as named exceptions in the pattern doc first.

Short key: `le` (per pattern doc §1).

---

## STEP 1 — CREATE CUSTOM FIELDS

Create these custom fields in GHL under Settings > Custom Fields > Contact:

| Field | Key | Type |
|---|---|---|
| LE Current Revenue | contact.le_current_revenue | NUMBER |
| LE Target Revenue | contact.le_target_revenue | NUMBER |
| LE Founder Hours Per Week | contact.le_founder_hours_per_week | NUMBER |
| LE Team Size | contact.le_team_size | NUMBER |
| LE Leverage Score | contact.le_leverage_score | NUMBER |
| LE Hours To Replace | contact.le_hours_to_replace | NUMBER |
| LE Leverage Multiplier | contact.le_leverage_multiplier | NUMBER |
| LE Current Leverage Ratio | contact.le_current_leverage_ratio | NUMBER |
| LE Target Leverage Ratio | contact.le_target_leverage_ratio | NUMBER |
| LE Founder Dependency Pct | contact.le_founder_dependency_pct | NUMBER |
| LE Revenue Per Founder Hour | contact.le_revenue_per_founder_hour | NUMBER |
| LE Systems Hours | contact.le_systems_hours | NUMBER |
| LE Delegation Hours | contact.le_delegation_hours | NUMBER |
| LE Technology Hours | contact.le_technology_hours | NUMBER |
| LE Weekly Revenue Lost | contact.le_weekly_revenue_lost | NUMBER |
| LE Annual Revenue Lost | contact.le_annual_revenue_lost | NUMBER |
| LE Business Name | contact.le_business_name | TEXT |
| LE Source | contact.le_source | TEXT |
| LE Submitted At | contact.le_submitted_at | DATE |

> **NOTE — `le_annual_revenue_lost`:** GHL merge tags don't support inline arithmetic. `leverage-engine.html` must compute this field client-side as `weekly_revenue_lost * 52` and include it in the webhook payload. See pattern doc §11. <!-- TODO: confirm leverage-engine.html sends `annual_revenue_lost` in payload -->

> **Field type rule:** all numeric fields use `NUMBER` (not `NUMERICAL`) — pattern doc §3.

---

## STEP 2 — CREATE TAGS

Lifecycle tags (per pattern doc §2):

| Tag | When applied |
|---|---|
| `le-lead` | On webhook intake (replaces legacy `leverage-engine-lead`) |
| `le-completed` | Reserved (LE has no completion-distinct event yet) |
| `le-application` | When the `leverage-engine-apply` webhook fires (replaces legacy `applied-3x3os`) |
| `le-converted` | When the contact pays for the related engagement |

Score-bucket tags:

| Tag |
|---|
| le-low-leverage (score 0-25) |
| le-moderate-leverage (score 26-50) |
| le-good-leverage (score 51-75) |
| le-strong-leverage (score 76-100) |
| le-solo-founder (team size 1-2) |
| le-small-team (team size 3-7) |
| le-medium-team (team size 8-20) |
| le-large-team (team size 21+) |

Pre-existing tags (already in system):
- `paradigm-welcomed` (per pattern doc §5 — suppression gate)
- `email-sequence-active`
- `sequence-completed`

---

## STEP 3 — CREATE WEBHOOK TRIGGER

1. Go to Automation > Workflows > Create Workflow
2. Name: "Leverage Engine"
3. Set trigger: Inbound Webhook
4. Copy the trigger ID from the webhook URL
5. Add trigger ID to Netlify env var: `WEBHOOK_LEVERAGE_ENGINE`

---

## STEP 4 — WEBHOOK PAYLOAD REFERENCE

The site sends two webhook payloads through `/api/webhook`:

### Payload 1 — Calculator Results (source: `leverage-engine`)

Fires automatically when results load on Screen 3.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "current_revenue": 1200000,
  "target_revenue": 2500000,
  "founder_hours_per_week": 55,
  "team_size": 6,
  "current_leverage_ratio": 21818,
  "target_leverage_ratio": 45455,
  "hours_to_replace": 29,
  "leverage_multiplier": 2.1,
  "leverage_score": 48,
  "founder_dependency_pct": 23,
  "revenue_per_founder_hour": 420,
  "systems_hours": 10,
  "delegation_hours": 12,
  "technology_hours": 7,
  "weekly_revenue_lost": 25000,
  "source": "leverage-engine",
  "timestamp": "2026-03-30T12:00:00.000Z"
}
```

### Payload 2 — Application (source: `leverage-engine-apply`)

Fires when founder clicks "Apply for 3x3OS" and submits phone + business name.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "business_name": "Acme Corp",
  "leverage_score": 48,
  "hours_to_replace": 29,
  "current_revenue": 1200000,
  "target_revenue": 2500000,
  "source": "leverage-engine-apply",
  "timestamp": "2026-03-30T12:00:00.000Z"
}
```

---

## WORKFLOW 1 — Leverage Engine (Intake and Routing)

**Name:** Leverage Engine
**Status:** Publish when complete
**Trigger:** Inbound Webhook (from Step 3)

### Step 1 — Create or Update Contact

Map from webhook payload:
- first_name → First Name (see duplicate-handling rule)
- email → Email (dedupe key)
- phone → Phone (see duplicate-handling rule)
- business_name → LE Business Name + standard `Company` (see Company-field strategy below)
- current_revenue → LE Current Revenue
- target_revenue → LE Target Revenue
- founder_hours_per_week → LE Founder Hours Per Week
- team_size → LE Team Size
- leverage_score → LE Leverage Score
- hours_to_replace → LE Hours To Replace
- leverage_multiplier → LE Leverage Multiplier
- current_leverage_ratio → LE Current Leverage Ratio
- target_leverage_ratio → LE Target Leverage Ratio
- founder_dependency_pct → LE Founder Dependency Pct
- revenue_per_founder_hour → LE Revenue Per Founder Hour
- systems_hours → LE Systems Hours
- delegation_hours → LE Delegation Hours
- technology_hours → LE Technology Hours
- weekly_revenue_lost → LE Weekly Revenue Lost
- annual_revenue_lost → LE Annual Revenue Lost (computed client-side as `weekly_revenue_lost * 52`)
- source → LE Source
- timestamp → LE Submitted At

**Duplicate-handling rule:**
- Match on `email`
- If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
- For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `le_business_name` regardless.

### Step 2 — Add to Pipeline

> **Pipeline note (pattern doc §7):** Leverage Engine is a paid offer and should have its own dedicated pipeline ("Leverage Engine"). Do NOT reuse Paradigm Leads for LE intake going forward. The intake (free calculator) does NOT get a pipeline assignment — it lives as tags + custom fields only. Only the `leverage-engine-apply` source promotes the contact into the Leverage Engine pipeline at the "Application Received" stage. <!-- TODO: confirm Leverage Engine pipeline exists in GHL; if not, build it before this workflow goes live -->

For lead-magnet intake (this workflow): **no pipeline assignment.** Leave Step 2 blank or remove it. The pattern doc lists `le` (intake) under "Lead-magnet sources do NOT get pipelines."

### Step 3 — Add Tag

- Tag: `le-lead`

### Step 4 — Team Size Tagging (If/Else Branches)

- IF le_team_size <= 2 → Add tag: le-solo-founder
- ELSE IF le_team_size <= 7 → Add tag: le-small-team
- ELSE IF le_team_size <= 20 → Add tag: le-medium-team
- ELSE → Add tag: le-large-team

### Step 5 — Leverage Score Routing (If/Else Branches)

**Branch A** — IF le_leverage_score <= 25:
- Add tag: le-low-leverage

**Branch B** — ELSE IF le_leverage_score <= 50:
- Add tag: le-moderate-leverage

**Branch C** — ELSE IF le_leverage_score <= 75:
- Add tag: le-good-leverage

**Branch D** — ELSE (le_leverage_score 76-100):
- Add tag: le-strong-leverage

### Step 6 — Route to Email Sequence (If/Else Branches)

- IF le_leverage_score <= 25 → Enroll in workflow "LE — Track 1 Low Leverage"
- ELSE IF le_leverage_score <= 50 → Enroll in workflow "LE — Track 2 Moderate Leverage"
- ELSE IF le_leverage_score <= 75 → Enroll in workflow "LE — Track 3 Good Leverage"
- ELSE → Enroll in workflow "LE — Track 4 Strong Leverage"

After enrollment (all branches):
- Add tag: email-sequence-active
- (Pipeline stage move removed — intake is no longer assigned to Paradigm Leads pipeline. See Step 2 note.)

### Step 7 — Internal Notification Email

**To:** ari@paradigmconsulting.io, jay@paradigmconsulting.io

**Subject:** New LE Lead — {{contact.first_name}}

**Body:**
```
Name: {{contact.first_name}}
Email: {{contact.email}}
Current Revenue: ${{contact.le_current_revenue}}
Target Revenue: ${{contact.le_target_revenue}}
Founder Hours/Week: {{contact.le_founder_hours_per_week}}
Team Size: {{contact.le_team_size}}
Leverage Score: {{contact.le_leverage_score}} / 100
Hours to Replace: {{contact.le_hours_to_replace}}
Leverage Multiplier: {{contact.le_leverage_multiplier}}x
Founder Dependency: {{contact.le_founder_dependency_pct}}%
Revenue Per Founder Hour: ${{contact.le_revenue_per_founder_hour}}
Weekly Revenue Lost: ${{contact.le_weekly_revenue_lost}}
Systems Hours: {{contact.le_systems_hours}}
Delegation Hours: {{contact.le_delegation_hours}}
Technology Hours: {{contact.le_technology_hours}}
Submitted: {{contact.le_submitted_at}}
```

---

## WORKFLOW 2 — Leverage Engine Application Handler

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md).

The shared workflow triggers on any `*-application` tag (including `le-application`). It pauses nurture sequences, moves the contact into the appropriate paid pipeline (here: Leverage Engine, "Application Received" stage), sends a HOT LEAD internal alert to ari@ + jay@paradigmconsulting.io, and runs the 1-business-day SLA reminder.

### Per-source responsibility (LE webhook → application tag)

When the `leverage-engine-apply` webhook fires, the LE-specific workflow only needs to:

1. Update contact (apply duplicate-handling rule from Workflow 1 Step 1)
   - phone → Phone (preserve if populated)
   - business_name → standard `Company` (only if empty) AND `le_business_name` (always)
   - source → LE Source (update to "leverage-engine-apply")
2. Apply tag `le-application` (THIS is what triggers the shared Application Hot Lead workflow)
3. Remove tag `email-sequence-active`

~~Per-source pipeline moves, internal notifications, and SLA logic previously documented here have been deleted. They are now centralized in the shared Application Hot Lead workflow.~~

---

## EMAIL SEQUENCES

### LE — Track 1 Low Leverage (Score 0-25)

Framing: The founder IS the business. Every dollar requires their personal involvement. The 3x3OS message is about building the first layer of infrastructure that allows revenue to happen without the founder in every transaction.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: `le-application` (triggers shared Application Hot Lead workflow — pattern doc §8)
- Remove tag: email-sequence-active
- Stop all further steps immediately

(Pipeline stage move handled by shared Application Hot Lead workflow.)

#### Email 1 — Send immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

**Subject:** Your leverage calculation, {{contact.first_name}}
**Preview:** {{contact.le_hours_to_replace}} hours of your week need to change. Here is the breakdown.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just ran the Leverage Engine on the Paradigm Consulting site.

Your calculation showed something that most founders at your stage already feel but have never quantified: {{contact.le_hours_to_replace}} of the {{contact.le_founder_hours_per_week}} hours you work each week need to stop requiring you personally for the business to hit your revenue target.

Your leverage score is {{contact.le_leverage_score}} out of 100. That means almost every dollar your business generates currently requires your direct involvement. That is not a criticism — it is the reality of early-stage founder economics. But it also means your revenue has a hard ceiling: your personal capacity.

The calculation broke your leverage gap into three categories: {{contact.le_systems_hours}} hours in systems and documentation, {{contact.le_delegation_hours}} hours in delegation and authority, and {{contact.le_technology_hours}} hours in technology and automation.

Over the next two weeks I want to walk you through what each of those categories means in practice — and what it looks like to build leverage into a business that has never had it.

If any number in your results surprised you, reply and tell me which one. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Leverage Calculation — link to leverage-engine page]**

#### Wait 2 days

#### Email 2

**Subject:** The first lever most founders should pull
**Preview:** It is not hiring. It is not automation. It is documentation.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago your Leverage Engine calculation showed that {{contact.le_hours_to_replace}} hours of your week need to become leverage.

The instinct most founders have when they see a number like that is to think about hiring. Or about buying software. Or about working harder.

None of those are the first move.

The first lever is almost always documentation — and not the kind founders think of. Not employee handbooks or procedure manuals that sit in a drive folder no one opens.

I mean decision authority documentation. The kind that answers: what can your team decide without asking you? What criteria determine whether a decision escalates or gets resolved at the team level? What context does someone need to make the same call you would make?

Your calculation allocated {{contact.le_systems_hours}} hours per week to systems and documentation. That is not busywork. That is the foundation that makes delegation possible and automation sustainable.

Without it, every person you hire still routes decisions through you. Every tool you implement still requires you to configure, monitor, and override. The hours never actually leave your calendar — they just change shape.

The 3x3OS engagement starts with Month 1: Install. It is entirely focused on building the documentation and decision infrastructure that lets the other two levers work.

If you have ever delegated a task and had it come back to you within a week, you have experienced what happens when you delegate without installing the system first.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** What ${{contact.le_weekly_revenue_lost}} per week actually looks like
**Preview:** The cost of your leverage gap is not theoretical.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Leverage Engine calculation included a number that most founders glance past but should not: ${{contact.le_weekly_revenue_lost}} per week.

That is the gap between what your business generates now and what it could generate at your target revenue — divided into weekly increments so you can see the real cost of waiting.

Over 12 months, that gap compounds to ${{contact.le_annual_revenue_lost}} in unrealized revenue.

<!-- TODO: leverage-engine.html must compute `annual_revenue_lost = weekly_revenue_lost * 52` client-side and include it in the webhook payload (GHL merge tags do not support inline arithmetic). See pattern doc §11. -->


That revenue is not being lost to competitors or bad marketing or a weak product. It is being lost to a structural constraint: the business cannot produce more than what the founder can personally touch.

Your leverage multiplier is {{contact.le_leverage_multiplier}}x. Every hour you work currently generates ${{contact.le_revenue_per_founder_hour}}. At your target, that number needs to be significantly higher — not because you work harder, but because the infrastructure around you works at all.

The 3x3OS engagement exists for exactly this gap. It is a 90-day structured installation of systems, delegation infrastructure, and technology that replaces founder hours with leverage. Not theory. Not coaching. Installation.

I have room for one more engagement this quarter. If the numbers in your calculation felt urgent, this is the application.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 4 (Final)

**Subject:** Last note on your leverage calculation
**Preview:** The numbers do not change unless the structure does.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Leverage Engine results.

Your leverage score was {{contact.le_leverage_score}} out of 100. Your business needs {{contact.le_hours_to_replace}} hours of your weekly time converted into systems, delegation, and technology to reach your target revenue at your current hours.

Those numbers will not change on their own. Revenue growth without leverage growth just means the founder works more. The ceiling moves up but the founder moves up with it.

If you want to change the structure — not just the revenue — the 3x3OS application is below. We review every application personally and only accept founders where the engagement will produce a measurable shift.

If the timing is not right, keep your calculation. The math will be the same whenever you are ready.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 4:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active

---

### LE — Track 2 Moderate Leverage (Score 26-50)

Same structure as Track 1 with adjusted framing: The founder has some leverage but is still the primary revenue engine. Focus on the specific lever split (systems vs delegation vs technology) and which one closes the gap fastest.

Use the same email cadence (immediate, +2d, +5d, +9d) with the same goal step (apply `le-application` tag → triggers shared Application Hot Lead workflow) and the same Email 1 `paradigm-welcomed` suppression check (pattern doc §5). Adjust the copy to acknowledge existing infrastructure while emphasizing the gap.

---

### LE — Track 3 Good Leverage (Score 51-75)

Framing: The founder has meaningful leverage in some areas. The message shifts from "you need leverage" to "you need to close the remaining gap with targeted installation." Shorter sequence — 3 emails instead of 4.

Same goal step (apply `le-application`) and Email 1 `paradigm-welcomed` suppression check as Track 1.

---

### LE — Track 4 Strong Leverage (Score 76-100)

Framing: The leverage ratio is strong. The remaining gap is closable with targeted moves. Position 3x3OS as refinement rather than rescue. 2 emails only — one with results, one with application.

Same goal step (apply `le-application`) and Email 1 `paradigm-welcomed` suppression check as Track 1.

---

## SMART LIST SUGGESTIONS

Create these saved filters in GHL for ongoing lead management:

| List Name | Filter |
|---|---|
| `le-high-value-leads` | le_leverage_score <= 25 AND le_current_revenue >= 500000 |
| `le-quick-wins` | le_leverage_score >= 51 AND le_hours_to_replace <= 20 |
| `le-large-gap` | le_hours_to_replace >= 30 AND NOT tagged `le-application` |
| `le-applied` | tagged `le-application` AND le_source contains "leverage-engine" |
| `le-high-revenue-lost` | le_weekly_revenue_lost >= 10000 |
| `le-solo-founders` | tagged `le-solo-founder` AND le_current_revenue >= 200000 |
