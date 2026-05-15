# Leverage Engine — GHL Build Guide

**Generated:** March 30, 2026
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)

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
| LE Source | contact.le_source | TEXT |
| LE Submitted At | contact.le_submitted_at | DATE |

---

## STEP 2 — CREATE TAGS

| Tag |
|---|
| leverage-engine-lead |
| le-low-leverage (score 0-25) |
| le-moderate-leverage (score 26-50) |
| le-good-leverage (score 51-75) |
| le-strong-leverage (score 76-100) |
| le-solo-founder (team size 1-2) |
| le-small-team (team size 3-7) |
| le-medium-team (team size 8-20) |
| le-large-team (team size 21+) |

Pre-existing tags (already in system):
- applied-3x3os
- email-sequence-active
- sequence-completed

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
- first_name → First Name
- email → Email
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
- source → LE Source
- timestamp → LE Submitted At

Duplicate rule: Update existing contact if email matches.

### Step 2 — Add to Pipeline

- Pipeline: Paradigm Leads
- Stage: Assessment Submitted
- Only if contact is NOT already at a higher stage (position > 1)

### Step 3 — Add Tag

- Tag: leverage-engine-lead

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
- Move pipeline stage to: Email Sequence Active (only if currently at Assessment Submitted)

### Step 7 — Internal Notification Email

**To:** jay@paradigmconsulting.co

**Subject:** New Leverage Engine Lead — {{contact.first_name}} — Score {{contact.le_leverage_score}} — {{contact.le_hours_to_replace}} hrs to replace

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

**Name:** Leverage Engine — Application
**Status:** Publish when complete
**Trigger:** Inbound Webhook (same trigger ID — route by source field)

**Alternative:** Add an If/Else branch at the top of Workflow 1 that checks if `source` = `leverage-engine-apply`, then routes to the application steps below instead of the intake steps above.

### Step 1 — Update Contact

Map from webhook payload:
- phone → Phone
- business_name → Company (or a custom field)
- source → LE Source (update to "leverage-engine-apply")

### Step 2 — Add Tag

- Tag: applied-3x3os

### Step 3 — Move Pipeline Stage

- Pipeline: Paradigm Leads
- Stage: Application Link Clicked

### Step 4 — Remove Tag

- Remove: email-sequence-active

### Step 5 — Internal Notification Email

**To:** jay@paradigmconsulting.co

**Subject:** 3x3OS APPLICATION — {{contact.first_name}} — Leverage Engine — Score {{contact.le_leverage_score}}

**Body:**
```
APPLICATION RECEIVED

Name: {{contact.first_name}}
Email: {{contact.email}}
Phone: {{contact.phone}}
Business: (from webhook business_name)
Current Revenue: ${{contact.le_current_revenue}}
Target Revenue: ${{contact.le_target_revenue}}
Leverage Score: {{contact.le_leverage_score}} / 100
Hours to Replace: {{contact.le_hours_to_replace}}

This lead applied through the Leverage Engine calculator.
Review contact record for full leverage data.
```

---

## EMAIL SEQUENCES

### LE — Track 1 Low Leverage (Score 0-25)

Framing: The founder IS the business. Every dollar requires their personal involvement. The 3x3OS message is about building the first layer of infrastructure that allows revenue to happen without the founder in every transaction.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: applied-3x3os
- Remove tag: email-sequence-active
- Move pipeline stage to: Application Link Clicked
- Stop all further steps immediately

#### Email 1 — Send immediately

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

Over 12 months, that gap compounds to ${{contact.le_weekly_revenue_lost * 52}} in unrealized revenue.

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

Use the same email cadence (immediate, +2d, +5d, +9d) with the same goal step and tag management. Adjust the copy to acknowledge existing infrastructure while emphasizing the gap.

---

### LE — Track 3 Good Leverage (Score 51-75)

Framing: The founder has meaningful leverage in some areas. The message shifts from "you need leverage" to "you need to close the remaining gap with targeted installation." Shorter sequence — 3 emails instead of 4.

Same goal step and tag management pattern.

---

### LE — Track 4 Strong Leverage (Score 76-100)

Framing: The leverage ratio is strong. The remaining gap is closable with targeted moves. Position 3x3OS as refinement rather than rescue. 2 emails only — one with results, one with application.

Same goal step and tag management pattern.

---

## SMART LIST SUGGESTIONS

Create these saved filters in GHL for ongoing lead management:

| List Name | Filter |
|---|---|
| LE — High Value Leads | le_leverage_score <= 25 AND le_current_revenue >= 500000 |
| LE — Quick Wins | le_leverage_score >= 51 AND le_hours_to_replace <= 20 |
| LE — Large Gap | le_hours_to_replace >= 30 AND NOT tagged applied-3x3os |
| LE — Applied | tagged applied-3x3os AND le_source contains "leverage-engine" |
| LE — High Revenue Lost | le_weekly_revenue_lost >= 10000 |
| LE — Solo Founders | tagged le-solo-founder AND le_current_revenue >= 200000 |
