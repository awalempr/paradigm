# 12-Month Culture Calendar — GHL Build Guide

**Generated:** April 3, 2026
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)

> **Conforms to:** [paradigm-ghl-workflow-pattern.md](paradigm-ghl-workflow-pattern.md) (v 2026-05-17). All deviations must be approved as named exceptions in the pattern doc first.

Short key: `csc` (per pattern doc §1). All custom fields, tags, smart lists, and workflow references previously prefixed with `cc_` / `cc-` / `12mcc-` have been standardized to `csc_` / `csc-`. <!-- TODO: rename existing GHL custom fields and tags from `cc_*`/`cc-*` to `csc_*`/`csc-*` -->

---

## STEP 1 — CREATE CUSTOM FIELDS

Create these custom fields in GHL under Settings > Custom Fields > Contact:

| Field | Key | Type |
|---|---|---|
| CSC Diagnostic Score | contact.csc_diagnostic_score | NUMBER |
| CSC Tier | contact.csc_tier | TEXT |
| CSC Section A Meeting Rhythm | contact.csc_section_a_meeting_rhythm | NUMBER |
| CSC Section B Team Drivers | contact.csc_section_b_team_drivers | NUMBER |
| CSC Section C Sprint Architecture | contact.csc_section_c_sprint_architecture | NUMBER |
| CSC Section D Culture Energy | contact.csc_section_d_culture_energy | NUMBER |
| CSC Team Size | contact.csc_team_size | TEXT |
| CSC Primary Goal | contact.csc_primary_goal | TEXT |
| CSC Team Celebrates | contact.csc_team_celebrates | TEXT |
| CSC Start Quarter | contact.csc_start_quarter | TEXT |
| CSC Culture Vision | contact.csc_culture_vision | TEXT |
| CSC Business Name | contact.csc_business_name | TEXT |
| CSC Source | contact.csc_source | TEXT |
| CSC Submitted At | contact.csc_submitted_at | DATE |

> **Field type rule:** all numeric fields use `NUMBER` — pattern doc §3.

---

## STEP 2 — CREATE TAGS

| Tag |
|---|
| csc-lead |
| csc-no-rhythm (score 0-35) |
| csc-early-stage (score 36-55) |
| csc-developing (score 56-75) |
| csc-calendar-ready (score 76-100) |
| csc-solo (team size solo) |
| csc-small-team (team size small) |
| csc-medium-team (team size medium) |
| csc-large-team (team size large) |

Lifecycle tags (per pattern doc §2):

| Tag | When applied |
|---|---|
| `csc-lead` | On webhook intake (already used above) |
| `csc-completed` | Reserved (CSC has no completion-distinct event yet) |
| `csc-application` | When the `12-month-culture-calendar-apply` webhook fires (replaces legacy `applied-3x3os`) |
| `csc-converted` | When the contact pays for the related engagement |

Pre-existing tags (already in system):
- `paradigm-welcomed` (welcome-suppression gate — pattern doc §5)
- `email-sequence-active`
- `sequence-completed`
- ~~`applied-3x3os`~~ (LEGACY — replaced by per-source `csc-application`)

---

## STEP 3 — PIPELINE

> **Pipeline note (pattern doc §7):** CSC is a lead magnet. **Lead-magnet intake does NOT get a pipeline assignment.** Remove the Paradigm Leads pipeline move from the CSC intake workflow (Workflow 1, Step 2). Pipeline references below are kept for the `12-month-culture-calendar-apply` workflow, which now defers to the shared Application Hot Lead workflow (pattern doc §8).

Pipeline (kept for reference for `-apply` only): **Paradigm Leads** — `mgAoodSdPPjT4sxBokR2`

| Stage | Position | ID |
|---|---|---|
| New Lead | 0 | 2f9115b0-0527-4353-b668-a84f36eb15d0 |
| Assessment Submitted | 1 | e9a147dd-c45b-4e37-8856-cb64fcd0025e |
| Engaged | 2 | 4c8a9b45-1acf-488f-8cff-14721de5a874 |
| Email Sequence Active | 3 | edf79245-7f75-4332-9b39-44b512915a24 |
| Application Link Clicked | 4 | b7be6a4e-5457-4897-a561-278d92c08084 |
| Discovery Call | 5 | b9bbf364-73cd-4f84-adca-2c6500fc2999 |
| Proposal Sent | 6 | 80f74b32-a418-454d-9316-ae6313ae2eed |
| Closed | 7 | 3494c6f4-aeb1-4cda-b1ed-5d02a73cb5ed |
| Lost | 8 | 288b8a51-6f62-408e-b06d-022ee3f2c629 |
| Nurture - Long Term | 9 | c64e10c4-a4c6-45a4-8070-fb299b7aa751 |
| Nurture - Follow Up | 10 | 535c1f8b-a6ca-430f-9473-f0acca7dc922 |

No new pipeline needed. Use existing stages.

---

## STEP 4 — CREATE WEBHOOK TRIGGER

1. Go to Automation > Workflows > Create Workflow
2. Name: "12-Month Culture Calendar"
3. Set trigger: Inbound Webhook
4. Copy the trigger ID from the webhook URL
5. Add trigger ID to Netlify env var: `WEBHOOK_CULTURE_CALENDAR`

---

## STEP 5 — WEBHOOK PAYLOAD REFERENCE

The site sends two webhook payloads through `/api/webhook`:

### Payload 1 — Assessment Completion (source: `12-month-culture-calendar`)

Fires automatically when results load on the results screen.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "diagnostic_score": 42,
  "tier": "EARLY STAGE",
  "section_a_meeting_rhythm": 12,
  "section_b_team_drivers": 8,
  "section_c_sprint_architecture": 10,
  "section_d_culture_energy": 12,
  "team_size": "small",
  "primary_goal": "team",
  "team_celebrates": "milestones",
  "start_quarter": "q2",
  "culture_vision": "ownership",
  "source": "12-month-culture-calendar",
  "event": "completed",
  "timestamp": "2026-04-03T12:00:00.000Z"
}
```

### Payload 2 — Application (source: `12-month-culture-calendar-apply`)

Fires when founder clicks "Apply for 3x3OS" and submits phone + business name.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "business_name": "Acme Corp",
  "total_score": 42,
  "tier": "EARLY STAGE",
  "section_a_meeting_rhythm": 12,
  "section_b_team_drivers": 8,
  "section_c_sprint_architecture": 10,
  "section_d_culture_energy": 12,
  "source": "12-month-culture-calendar-apply",
  "lead_source": "12-month-culture-calendar",
  "event": "applied",
  "timestamp": "2026-04-03T12:00:00.000Z"
}
```

### Tier Classification

| Score Range | Tier |
|---|---|
| 0-35 | NO RHYTHM |
| 36-55 | EARLY STAGE |
| 56-75 | DEVELOPING |
| 76-100 | CALENDAR READY |

### Section Scoring

20 questions across 4 sections, 5 questions per section. Each question scored 0-5. Section max: 25. Total max: 100.

- Section A: Meeting Rhythm
- Section B: Team Drivers
- Section C: Sprint Architecture
- Section D: Culture Energy

---

## WORKFLOW 1 — 12-Month Culture Calendar (Intake and Routing)

**Name:** 12-Month Culture Calendar
**Status:** Publish when complete
**Trigger:** Inbound Webhook (from Step 4)

### Step 1 — Create or Update Contact

Map from webhook payload:
- first_name → First Name (see duplicate-handling rule)
- email → Email (dedupe key)
- phone (if present in apply payload) → Phone (see duplicate-handling rule)
- business_name (if present in apply payload) → CSC Business Name + standard `Company` (see Company-field strategy below)
- diagnostic_score → CSC Diagnostic Score
- tier → CSC Tier
- section_a_meeting_rhythm → CSC Section A Meeting Rhythm
- section_b_team_drivers → CSC Section B Team Drivers
- section_c_sprint_architecture → CSC Section C Sprint Architecture
- section_d_culture_energy → CSC Section D Culture Energy
- team_size → CSC Team Size
- primary_goal → CSC Primary Goal
- team_celebrates → CSC Team Celebrates
- start_quarter → CSC Start Quarter
- culture_vision → CSC Culture Vision
- source → CSC Source
- timestamp → CSC Submitted At

**Duplicate-handling rule:**
- Match on `email`
- If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
- For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `csc_business_name` regardless.

### Step 2 — Add to Pipeline

> **Removed.** Per pattern doc §7, CSC is a lead magnet and intake does NOT get a pipeline assignment. Skip this step. (Pipeline references are kept for the `-apply` flow only — handled by the shared Application Hot Lead workflow per pattern doc §8.)

### Step 3 — Add Tag

- Tag: `csc-lead`

### Step 4 — Team Size Tagging (If/Else Branches)

- IF csc_team_size = "solo" → Add tag: csc-solo
- ELSE IF csc_team_size = "small" → Add tag: csc-small-team
- ELSE IF csc_team_size = "medium" → Add tag: csc-medium-team
- ELSE → Add tag: csc-large-team

### Step 5 — Tier Routing (If/Else Branches)

**Branch A** — IF csc_diagnostic_score <= 35:
- Add tag: csc-no-rhythm

**Branch B** — ELSE IF csc_diagnostic_score <= 55:
- Add tag: csc-early-stage

**Branch C** — ELSE IF csc_diagnostic_score <= 75:
- Add tag: csc-developing

**Branch D** — ELSE (csc_diagnostic_score 76-100):
- Add tag: csc-calendar-ready

### Step 6 — Route to Email Sequence (If/Else Branches)

- IF csc_diagnostic_score <= 35 → Enroll in workflow "CSC — Track 1 No Rhythm"
- ELSE IF csc_diagnostic_score <= 55 → Enroll in workflow "CSC — Track 2 Early Stage"
- ELSE IF csc_diagnostic_score <= 75 → Enroll in workflow "CSC — Track 3 Developing"
- ELSE → Enroll in workflow "CSC — Track 4 Calendar Ready"

After enrollment (all branches):
- Add tag: email-sequence-active
- (Pipeline stage move removed — intake no longer assigned to Paradigm Leads pipeline. See Step 2 note.)

### Step 7 — Internal Notification Email

**To:** ari@paradigmconsulting.io, jay@paradigmconsulting.io

**Subject:** New CSC Lead — {{contact.first_name}}

**Body:**
```
Name: {{contact.first_name}}
Email: {{contact.email}}
Diagnostic Score: {{contact.csc_diagnostic_score}} / 100
Tier: {{contact.csc_tier}}
Section A (Meeting Rhythm): {{contact.csc_section_a_meeting_rhythm}}
Section B (Team Drivers): {{contact.csc_section_b_team_drivers}}
Section C (Sprint Architecture): {{contact.csc_section_c_sprint_architecture}}
Section D (Culture Energy): {{contact.csc_section_d_culture_energy}}
Team Size: {{contact.csc_team_size}}
Primary Goal: {{contact.csc_primary_goal}}
Team Celebrates: {{contact.csc_team_celebrates}}
Start Quarter: {{contact.csc_start_quarter}}
Culture Vision: {{contact.csc_culture_vision}}
Submitted: {{contact.csc_submitted_at}}
```

---

## WORKFLOW 2 — Culture Calendar Application Handler

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md).

The per-source CSC application workflow only needs to:

1. Update contact from the `12-month-culture-calendar-apply` webhook payload (apply duplicate-handling rule from Workflow 1 Step 1 — preserve First Name and Phone if populated; write to standard `Company` only if empty; always write to `csc_business_name`)
2. Apply tag `csc-application` (THIS is what triggers the shared Application Hot Lead workflow)
3. Remove tag `email-sequence-active`

~~Per-source pipeline moves, internal HOT LEAD notifications, and SLA logic previously documented here have been deleted. They are now centralized in the shared Application Hot Lead workflow which sends to ari@ + jay@paradigmconsulting.io and routes into the appropriate pipeline.~~

---

## EMAIL SEQUENCES

---

### CSC — Track 1 No Rhythm (Score 0-35)

**Name:** CSC — Track 1 No Rhythm
**Status:** Publish when complete
**Trigger:** Enrolled from 12-Month Culture Calendar intake workflow

Framing: The business has no culture infrastructure. Team alignment is accidental, not designed. Meetings happen reactively. There is no rhythm to how the team operates. The 3x3OS message is about installing the first culture operating system — the meeting cadence, the sprint architecture, and the recognition structure that make culture a system instead of a byproduct.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: `csc-application` (triggers shared Application Hot Lead workflow — pattern doc §8)
- Remove tag: email-sequence-active
- Stop all further steps immediately

(Pipeline stage move handled by shared Application Hot Lead workflow.)

#### Email 1 — Send immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

**Subject:** Your culture diagnostic, {{contact.first_name}}
**Preview:** A score of {{contact.csc_diagnostic_score}} out of 100 means something specific. Here is what it tells you.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the 12-Month Culture Calendar diagnostic on the Paradigm Consulting site.

Your score was {{contact.csc_diagnostic_score}} out of 100. That places your business in the NO RHYTHM tier — which means the culture operating in your business right now is not being shaped by you. It is happening to you.

That is not a criticism. It is where most founder-led businesses start. Culture forms whether you design it or not. The question is whether the culture that formed is the one you would have chosen.

Your diagnostic broke into four areas. Meeting Rhythm: {{contact.csc_section_a_meeting_rhythm}}. Team Drivers: {{contact.csc_section_b_team_drivers}}. Sprint Architecture: {{contact.csc_section_c_sprint_architecture}}. Culture Energy: {{contact.csc_section_d_culture_energy}}.

The lowest of those scores is where the drift is most visible. It is where your team is most likely operating without structure — where decisions happen by default instead of by design.

Over the next two weeks I want to walk you through what a culture operating system actually looks like in practice, and what changes when you install one intentionally rather than hoping one develops on its own.

If any part of your diagnostic surprised you, reply and tell me which section. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Diagnostic — link to 12-month-culture-calendar results page]**

#### Wait 2 days

#### Email 2

**Subject:** Why your team does not know what matters this quarter
**Preview:** It is not a communication problem. It is a structure problem.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago your Culture Calendar diagnostic scored {{contact.csc_diagnostic_score}} out of 100.

I want to talk about what a NO RHYTHM score actually looks like inside a business, because most founders experience the symptoms without connecting them to the cause.

The symptoms look like this: team members working on different priorities without realizing it. Meetings that recap what happened instead of deciding what happens next. A founder who spends more time aligning the team than doing the work that moves the business forward. People who are busy but not building toward the same outcome.

The cause is always the same. There is no operating rhythm. No meeting cadence that creates shared context. No sprint structure that translates priorities into weekly commitments. No recognition system that reinforces the behaviors the business actually needs.

Your Meeting Rhythm score was {{contact.csc_section_a_meeting_rhythm}} out of 25. That is the foundation everything else is built on. Without a meeting rhythm, every other culture initiative — team recognition, sprint planning, energy management — is disconnected from the operating reality of the business.

The 3x3OS Culture pillar starts with meeting rhythm. Not because it is the most exciting. Because it is the infrastructure that makes everything else work.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** The culture your team is building without you
**Preview:** Every business has a culture. The question is whether you chose it.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Culture Calendar diagnostic showed a NO RHYTHM result — {{contact.csc_diagnostic_score}} out of 100.

I want to name something that founders in your position rarely think about directly.

Your team already has a culture. It was not designed. It was not documented. It was not chosen. It formed from the accumulated defaults of how decisions get made, what gets recognized, what gets ignored, and how people spend their time when no one is directing them.

That default culture is operating right now. It determines how your team responds to pressure. Whether problems get raised or buried. Whether initiative gets rewarded or goes unnoticed. Whether people stay because they are building something or because they have not found something better yet.

A score of {{contact.csc_diagnostic_score}} means there is no system overriding those defaults. No meeting structure creating shared context. No sprint cadence translating priorities into action. No recognition rhythm reinforcing the behaviors you actually want.

The 3x3OS engagement installs a 12-month culture operating system in 90 days. Not a workshop. Not a set of values on a wall. A working infrastructure — meeting cadences, sprint architecture, team driver systems, and culture energy practices — that runs on its own after installation.

Your team is going to have a culture either way. The question is whether it will be the one you designed or the one that happened by default.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** What the first 30 days of a culture installation looks like
**Preview:** It starts with the meeting cadence. Everything else builds from there.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Culture Calendar diagnostic. I want to be specific about what happens in the first 30 days of a 3x3OS Culture installation for a business at your score level.

Week 1: We audit the current meeting cadence — what exists, what is missing, what is consuming time without producing alignment. Most businesses at your score have meetings that exist by habit rather than design. Some are redundant. Some critical conversations are happening informally or not at all.

Week 2: We install the meeting rhythm — the specific cadence of daily standups, weekly planning sessions, and monthly retrospectives that creates shared context across the team. Each meeting has a defined purpose, a time limit, and a decision output. No status updates disguised as meetings.

Week 3: We build the sprint architecture — the quarterly planning structure that translates business priorities into weekly team commitments. Your Sprint Architecture score was {{contact.csc_section_c_sprint_architecture}} out of 25. This is where the gap between what the founder wants and what the team produces gets closed.

Week 4: We install the first team driver system — the recognition and accountability structure that reinforces the behaviors the business needs. Your Team Drivers score was {{contact.csc_section_b_team_drivers}} out of 25. This is where culture stops being a concept and becomes an operating system.

That is Month 1. Months 2 and 3 layer on the culture energy practices, the calendar of quarterly initiatives, and the self-sustaining rhythms that run without the founder managing them.

I have room for one more engagement starting {{contact.csc_start_quarter}}. If the timing aligns, the application is below.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 5

**Subject:** Last note on your culture diagnostic, {{contact.first_name}}
**Preview:** The score does not change unless the structure does.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Culture Calendar results.

Your score was {{contact.csc_diagnostic_score}} out of 100. Your business has no culture rhythm — no meeting infrastructure, no sprint architecture, no recognition system, no designed cadence that shapes how your team operates.

That will not change by itself. Hiring better people does not fix it. Working harder does not fix it. Another offsite does not fix it. Culture infrastructure is installed or it is absent. There is no middle state where it organically appears.

If you want a team that operates with shared context, aligned priorities, and a rhythm that produces results without the founder managing every piece of it — the 3x3OS Culture pillar installs that in 90 days.

If the timing is not right, keep your diagnostic. The score will be the same whenever you are ready.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 1 day
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### CSC — Track 2 Early Stage (Score 36-55)

**Name:** CSC — Track 2 Early Stage
**Status:** Publish when complete
**Trigger:** Enrolled from 12-Month Culture Calendar intake workflow

Framing: The business has fragments of culture infrastructure — some meetings exist, some recognition happens, but it is inconsistent and founder-dependent. The team has moments of alignment but they do not sustain. The 3x3OS message is about connecting the fragments into a working system and filling the gaps that cause the rhythm to break down.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: `csc-application` (triggers shared Application Hot Lead workflow — pattern doc §8)
- Remove tag: email-sequence-active
- Stop all further steps immediately

(Pipeline stage move handled by shared Application Hot Lead workflow.)

#### Email 1 — Send immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

**Subject:** Your culture diagnostic, {{contact.first_name}}
**Preview:** A score of {{contact.csc_diagnostic_score}} tells a specific story. Here is what the sections reveal.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the 12-Month Culture Calendar diagnostic on the Paradigm Consulting site.

Your score was {{contact.csc_diagnostic_score}} out of 100. That places your business in the EARLY STAGE tier. Here is what that means in practice.

You have pieces. Some meetings exist. Some recognition happens. Some planning structure is in place. The team has moments where everything clicks — where people are aligned and producing work that feels coordinated and purposeful.

But those moments do not sustain. The rhythm breaks down. Meetings drift. Priorities shift without the team fully recalibrating. Recognition happens when the founder remembers, not when a system triggers it. The culture operates on the founder's energy rather than its own infrastructure.

Your section scores tell the story. Meeting Rhythm: {{contact.csc_section_a_meeting_rhythm}} out of 25. Team Drivers: {{contact.csc_section_b_team_drivers}} out of 25. Sprint Architecture: {{contact.csc_section_c_sprint_architecture}} out of 25. Culture Energy: {{contact.csc_section_d_culture_energy}} out of 25.

The section with the lowest score is where the system breaks down first. The section with the highest score is what you have been compensating with.

Over the next two weeks I want to walk you through what connects these pieces into a system that sustains without the founder carrying it.

Reply if a specific section score surprised you. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Diagnostic — link to 12-month-culture-calendar results page]**

#### Wait 2 days

#### Email 2

**Subject:** Why good culture moments do not turn into good culture
**Preview:** The fragments are there. The system connecting them is not.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago your Culture Calendar diagnostic scored {{contact.csc_diagnostic_score}} out of 100 — EARLY STAGE.

I want to name the specific pattern that defines this tier because it is the most frustrating position a founder can be in.

You know what good culture looks like. You have experienced it in your own team — the weeks where meetings are productive, people are aligned, work gets done without constant oversight. You have hired people who are capable of operating that way. The team is not the problem.

The problem is that the good weeks are not reproducible. They happen when circumstances align — when the founder has energy to drive them, when no crisis interrupts the rhythm, when everyone happens to be focused on the same priority. The bad weeks happen when any of those conditions break.

That is not a people problem. It is an infrastructure problem. The meeting cadence is not strong enough to maintain alignment when the founder is not actively driving it. The sprint structure is not clear enough to keep priorities visible across weeks. The recognition system is not systematic enough to reinforce the right behaviors consistently.

Your score of {{contact.csc_diagnostic_score}} means the pieces exist but they are not connected into a system. The 3x3OS Culture pillar connects them — and fills the gaps that cause the rhythm to break every time the founder looks away.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** The difference between founder-driven culture and system-driven culture
**Preview:** One scales. The other burns out.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Culture Calendar diagnostic scored {{contact.csc_diagnostic_score}} out of 100.

I want to draw a line between two modes of operating that look similar from the outside but produce very different results over 12 months.

Founder-driven culture: the founder sets the tone every morning. The founder decides what to recognize. The founder runs the meetings that matter. The founder recalibrates priorities when the team drifts. The founder is the culture. When the founder is present and energized, the team operates well. When the founder is absent or depleted, the culture degrades.

System-driven culture: the meeting cadence creates shared context automatically. The sprint architecture translates priorities into weekly commitments without the founder translating them. The recognition system fires on triggers, not on the founder's memory. The culture operates on infrastructure, not on one person's capacity.

Your diagnostic tells me you are in the first mode. Your Culture Energy score of {{contact.csc_section_d_culture_energy}} out of 25 is the clearest signal — that section measures whether the culture generates energy on its own or requires the founder to supply it.

The 3x3OS engagement moves a business from mode one to mode two in 90 days. Not by replacing the founder's influence. By building the infrastructure that carries the culture the founder designed, without requiring the founder to run it manually every day.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** What your lowest section score is actually costing you
**Preview:** The weakest section is where your team loses alignment first.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Culture Calendar diagnostic. Your section scores were: Meeting Rhythm {{contact.csc_section_a_meeting_rhythm}}, Team Drivers {{contact.csc_section_b_team_drivers}}, Sprint Architecture {{contact.csc_section_c_sprint_architecture}}, Culture Energy {{contact.csc_section_d_culture_energy}}.

I want to talk about what the lowest of those numbers means in practice.

The lowest section score is the structural weak point. It is where alignment breaks first when pressure increases. It is the area where your team is most likely operating without clear direction — where default behaviors take over because no system exists to direct them.

If Meeting Rhythm is lowest, your team is making decisions without shared context. They are operating on assumptions about priorities rather than confirmed direction. That shows up as duplicated work, missed handoffs, and a founder who spends more time re-aligning than building.

If Team Drivers is lowest, the behaviors that matter are not being reinforced. People do not know what gets recognized. Initiative is not consistently rewarded. The culture rewards showing up rather than producing outcomes.

If Sprint Architecture is lowest, quarterly priorities are not translating into weekly execution. The team knows the big picture but not the specific commitments that advance it this week. Work drifts toward comfortable rather than strategic.

If Culture Energy is lowest, the team is operating on compliance rather than conviction. They do the work but they do not bring energy to it. Celebrations are rare. The culture feels functional rather than alive.

The 3x3OS engagement addresses the weakest section first and builds outward. The application is below.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 5

**Subject:** Last note on your culture diagnostic, {{contact.first_name}}
**Preview:** The fragments do not connect themselves. The system has to be built.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Culture Calendar results.

Your score was {{contact.csc_diagnostic_score}} out of 100. You have pieces of a culture system in place but they are not connected. The good weeks happen when you drive them. The bad weeks happen when you do not.

That pattern will not resolve with more effort. It resolves with infrastructure — a meeting cadence that maintains alignment, a sprint architecture that keeps priorities visible, a recognition system that reinforces the right behaviors, and a culture energy practice that generates momentum without requiring the founder to supply it.

The 3x3OS Culture pillar installs that infrastructure in 90 days. Specific deliverables. Built around the exact section scores your diagnostic revealed.

If the timing is not right, keep your diagnostic. The section scores will point you toward the same gaps whenever you are ready.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 1 day
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### CSC — Track 3 Developing (Score 56-75)

**Name:** CSC — Track 3 Developing
**Status:** Publish when complete
**Trigger:** Enrolled from 12-Month Culture Calendar intake workflow

Framing: The business has a working culture system with real infrastructure. Meetings happen, sprints exist, recognition is not accidental. But there are gaps — specific sections where the system is weaker — and those gaps prevent the culture from being self-sustaining. The 3x3OS message is about closing the remaining gaps and building the 12-month calendar that makes the culture system permanent.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: `csc-application` (triggers shared Application Hot Lead workflow — pattern doc §8)
- Remove tag: email-sequence-active
- Stop all further steps immediately

(Pipeline stage move handled by shared Application Hot Lead workflow.)

#### Email 1 — Send immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

**Subject:** Your culture diagnostic, {{contact.first_name}}
**Preview:** A score of {{contact.csc_diagnostic_score}} means you have built something real. Here is what the remaining gap looks like.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the 12-Month Culture Calendar diagnostic on the Paradigm Consulting site.

Your score was {{contact.csc_diagnostic_score}} out of 100. That places your business in the DEVELOPING tier — and that label understates what you have built.

A score in this range means your business has real culture infrastructure. Meetings happen with purpose. Sprints exist in some form. Team recognition is not entirely accidental. You have built a system that most founder-led businesses never achieve.

The gap that remains is specific. Your section scores tell you exactly where it is. Meeting Rhythm: {{contact.csc_section_a_meeting_rhythm}} out of 25. Team Drivers: {{contact.csc_section_b_team_drivers}} out of 25. Sprint Architecture: {{contact.csc_section_c_sprint_architecture}} out of 25. Culture Energy: {{contact.csc_section_d_culture_energy}} out of 25.

The section with the lowest score is where the system is most vulnerable. It is the area that reverts to default when the quarter gets busy, when a team member leaves, or when the founder's attention shifts to another part of the business.

Over the next two weeks I want to walk you through what closes that gap and turns a developing culture system into one that sustains through every quarter — not just the good ones.

Reply if a specific section stood out. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Diagnostic — link to 12-month-culture-calendar results page]**

#### Wait 2 days

#### Email 2

**Subject:** The gap between a good culture and a permanent one
**Preview:** You have built the system. Here is what makes it stick.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago your Culture Calendar diagnostic scored {{contact.csc_diagnostic_score}} out of 100 — DEVELOPING.

I want to name the specific challenge at your stage because it is different from what businesses at lower scores face.

Your challenge is not building culture infrastructure. You have already done that. Your challenge is making it permanent. Permanent means it runs through Q4 when everyone is exhausted. It runs when a key team member leaves and the new person needs to absorb the rhythm. It runs when the founder is traveling or focused on a deal or simply having an off week.

Most culture systems at your score level are 80% there. They work when conditions are normal. They degrade under stress. The 20% that is missing is almost always in two areas: the formalized calendar that structures culture initiatives across 12 months so they happen by schedule rather than by impulse, and the accountability system that ensures the rhythm is maintained even when no one is actively monitoring it.

Your diagnostic revealed the specific sections where that 20% gap exists. The 3x3OS Culture pillar does not rebuild what you have built. It closes the gap and installs the 12-month calendar that makes the whole system self-sustaining.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** What a 12-month culture calendar actually contains
**Preview:** Not team-building events. A structured operating calendar for culture.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Culture Calendar diagnostic scored {{contact.csc_diagnostic_score}} out of 100. At your level, I want to be specific about what the 12-month culture calendar actually installs — because it is not what most founders picture when they hear the word culture.

It is not a schedule of team lunches and birthday celebrations. It is the operating calendar that structures how your team aligns, executes, reflects, and recharges across every quarter.

Q1: Sprint cadence installation and quarterly kickoff structure. The meeting rhythm that sets context for the year. The sprint architecture that translates annual priorities into 90-day commitments and weekly deliverables.

Q2: Team driver systems and mid-year recalibration. The recognition infrastructure that reinforces the behaviors the business needs. The mid-year retrospective that adjusts the plan based on what the first two quarters revealed.

Q3: Culture energy practices and momentum building. The specific practices — structured celebrations, team challenges, milestone recognition — that generate energy rather than consuming it. The infrastructure that prevents the Q3 slump most teams experience.

Q4: Annual retrospective and next-year planning. The structured review that captures what worked, what did not, and what changes for the next cycle. The planning cadence that ensures January 1 starts with clarity rather than scramble.

You said your preferred start quarter is {{contact.csc_start_quarter}}. The calendar is built to start at any point in the cycle. The engagement installs it in 90 days regardless of when it begins.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** Your team already knows something is incomplete
**Preview:** A developing culture system creates a specific kind of frustration.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Culture Calendar diagnostic. Your score of {{contact.csc_diagnostic_score}} puts you in a position that creates a specific kind of tension.

Your team has experienced what a working culture feels like. The good weeks are good enough that people know the difference. They have been in meetings that were productive. They have experienced sprints where priorities were clear. They have felt the energy when the culture is operating well.

Which means they also feel it when it is not. They notice when meetings drift back to status updates. They notice when sprint priorities shift without explanation. They notice when recognition disappears for three weeks. They notice the inconsistency — and inconsistency is more frustrating than absence.

A team that has never experienced culture infrastructure does not know what it is missing. A team that has experienced it intermittently knows exactly what it is missing. That awareness creates either motivation or resignation depending on whether the system gets completed or remains incomplete.

The 3x3OS Culture pillar completes the system. It closes the gaps your diagnostic identified and installs the calendar that prevents the inconsistency your team already feels.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 5

**Subject:** Last note on your culture diagnostic, {{contact.first_name}}
**Preview:** You are closer than most. Here is what completing it looks like.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Culture Calendar results.

Your score was {{contact.csc_diagnostic_score}} out of 100. You have built real culture infrastructure — more than most founder-led businesses ever achieve. The gap that remains is specific, closable, and worth closing before the next quarter begins.

The 3x3OS Culture pillar does not rebuild what you have built. It completes the system — closing the section gaps your diagnostic revealed and installing the 12-month calendar that makes the whole infrastructure self-sustaining through every quarter.

Application-only. Reviewed personally. Five minutes.

If the timing is not right, keep your diagnostic. The section scores will be the same whenever you are ready.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 1 day
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### CSC — Track 4 Calendar Ready (Score 76-100)

**Name:** CSC — Track 4 Calendar Ready
**Status:** Publish when complete
**Trigger:** Enrolled from 12-Month Culture Calendar intake workflow

Framing: The business has strong culture infrastructure across most or all sections. The culture system is working. The 3x3OS message shifts from building to optimizing and protecting — installing the formalized 12-month calendar and maintenance rhythm that ensures the system holds as the business scales, and addressing any remaining weak sections before they become bottlenecks at the next stage of growth.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: `csc-application` (triggers shared Application Hot Lead workflow — pattern doc §8)
- Remove tag: email-sequence-active
- Stop all further steps immediately

(Pipeline stage move handled by shared Application Hot Lead workflow.)

#### Email 1 — Send immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

**Subject:** Your culture diagnostic, {{contact.first_name}}
**Preview:** A score of {{contact.csc_diagnostic_score}} puts your business in rare company. Here is what protecting it requires.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the 12-Month Culture Calendar diagnostic on the Paradigm Consulting site.

Your score was {{contact.csc_diagnostic_score}} out of 100. That places your business in the CALENDAR READY tier. That is a strong result — and it reflects real, intentional work you have done on your team's operating culture.

Your section scores confirm the strength is broad. Meeting Rhythm: {{contact.csc_section_a_meeting_rhythm}} out of 25. Team Drivers: {{contact.csc_section_b_team_drivers}} out of 25. Sprint Architecture: {{contact.csc_section_c_sprint_architecture}} out of 25. Culture Energy: {{contact.csc_section_d_culture_energy}} out of 25.

I want to be direct about what this score means and what it does not.

It means the culture infrastructure is strong today. It does not mean it will be strong at your next stage of growth. Culture systems that work at your current team size may not hold when the team grows by 50%. Meeting cadences that work today may need restructuring when you add a management layer. Sprint architecture designed for one team may not translate to multiple teams or departments.

The businesses that maintain strong culture through growth are the ones that formalize the system — document it, calendar it, and build the maintenance rhythm that adapts it proactively rather than reactively.

That is what the 12-month calendar is for. And at your score, you are ready to build it.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Diagnostic — link to 12-month-culture-calendar results page]**

#### Wait 3 days

#### Email 2

**Subject:** Culture infrastructure has a shelf life
**Preview:** What works at this stage may not hold at the next one. Here is how to protect it.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Three days ago your Culture Calendar diagnostic scored {{contact.csc_diagnostic_score}} out of 100 — CALENDAR READY.

I want to name the specific risk that exists even when culture is strong.

Culture infrastructure decays under two conditions. The first is growth — new team members dilute the culture by default unless the onboarding and rhythm are designed to absorb them. The second is complacency — when things are working, there is no urgency to formalize them, which means the system remains in the founder's head rather than in the business's operating structure.

Both conditions are more likely at your score level than at any other. Your culture is working. The temptation is to let it run without formalizing it. And the next hire, the next growth phase, or the next quarter where the founder is less present is when the unfomalized system begins to erode.

The 3x3OS Culture pillar at your position is not a rebuild. It is a formalization — taking the culture system you have built, documenting it into a 12-month operating calendar, and installing the maintenance rhythm that adapts it proactively as the business enters its next growth stage.

You said your culture vision is {{contact.csc_culture_vision}}. The calendar is built around that vision — making it the operating default rather than an aspiration.

Application-only. Reviewed personally.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** What separates a strong culture from a scalable one
**Preview:** The infrastructure exists. The question is whether it will hold through the next phase.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Culture Calendar diagnostic scored {{contact.csc_diagnostic_score}} out of 100. Your culture system is working.

The question I want to pose is specific to your stage: is the system documented well enough that someone other than you could maintain it?

A strong culture that lives in the founder's head is a strong culture with a single point of failure. If the meeting cadence depends on the founder running it. If sprint priorities depend on the founder setting them. If recognition depends on the founder noticing. If culture energy depends on the founder generating it. Then the culture is strong — but it is not scalable.

Scalable culture is documented culture. The meeting cadence has a written protocol. The sprint architecture has a planning template. The recognition system has triggers that fire regardless of who is managing them. The 12-month calendar exists as an operating document, not as a set of intentions in the founder's head.

The 3x3OS engagement at your position produces that documentation — the formalized 12-month culture operating calendar that runs on structure rather than on the founder's presence.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** You built something worth protecting, {{contact.first_name}}
**Preview:** The formalization is faster than the building was. Here is what it looks like.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Culture Calendar diagnostic scored {{contact.csc_diagnostic_score}} out of 100.

I want to close this sequence with something direct.

The culture infrastructure you have built is a genuine competitive advantage. Most founder-led businesses never achieve the operating rhythm your diagnostic reveals. That infrastructure attracts better talent, produces better work, and creates a business that is more resilient, more enjoyable, and more valuable.

The step that protects it is formalization. Documenting the system into a 12-month calendar. Installing the quarterly review cadence that keeps it current. Building the onboarding protocol that absorbs new team members into the rhythm rather than diluting it.

That work is faster and more straightforward than the building you have already done. The hard work is behind you. What remains is making it permanent.

The 3x3OS engagement at your position is scoped to formalization and protection. 90 days. Application-only. Reviewed personally.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 5

**Subject:** Last note on your culture diagnostic, {{contact.first_name}}
**Preview:** The system is working. The calendar makes it permanent.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Culture Calendar results.

Your score was {{contact.csc_diagnostic_score}} out of 100. You are in the top tier of culture readiness for founder-led businesses. The system is working. The team is operating with rhythm.

The only question is whether the system is formalized into a structure that survives the next growth phase — or whether it remains dependent on the founder's presence and energy to maintain.

The 3x3OS Culture pillar at your position formalizes what you have built into a documented 12-month operating calendar. It is the difference between a strong culture and a permanent one.

Application-only. Reviewed personally. Five minutes.

Matt

P.S. At your score the engagement is scoped specifically to formalization and calendar installation. We will confirm the exact scope in the application review.

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 1 day
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

## WORKFLOW 3 — CSC Application Link Clicked

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md). The CSC Email Sequence goal step (in each Track 1–4 workflow) applies `csc-application`, which triggers the shared workflow. No CSC-specific apply-link workflow is needed.

~~Original spec retained for reference (struck through):~~

~~**Name:** CSC — Application Link Clicked~~
~~**Trigger:** Contact clicks tracked link tagged "Apply-3x3OS-Link" AND tag csc-lead exists~~

~~Step 1 — Check for tag applied-3x3os. If exists, stop workflow.~~
~~Step 2 — Add tag: applied-3x3os~~
~~Step 3 — Move pipeline stage to: Application Link Clicked~~
~~Step 4 — Remove tag: email-sequence-active~~
~~Step 5 — Remove contact from all active CSC email sequence workflows~~
~~Step 6 — Wait 10 minutes~~
~~Step 7 — Internal notification to ari@ + jay@paradigmconsulting.io with full body~~
~~Step 8 — Send contact email "We received your interest" with subject, preview, body, and CTA — application acknowledgement is now handled by the shared Application Hot Lead workflow (pattern doc §8).~~

The original "We received your interest" acknowledgement copy is preserved below in case it should be reused as the contact-facing email inside the shared Application Hot Lead workflow:

> Subject: We received your interest, {{contact.first_name}}
> Preview: Someone will be in touch within 48 hours.
> From: Matt | Founder, Paradigm Consulting
>
> {{contact.first_name}},
> We saw that you clicked through to the 3x3OS application. If you submitted the application, we will review it personally and be in touch within 48 hours. If you clicked through but did not complete it, the link is below. It takes five minutes and gives us everything we need to determine whether the 3x3OS engagement is the right fit for where your business is right now. We do not accept every application. Not because of exclusivity, but because we only work with founders where we are confident the engagement is the right next step. The application is how we make that determination.
> Matt — Founder, Paradigm Consulting
> [CTA Button: Complete My Application — link to application page]

---

## WORKFLOW 4 — CSC Re-Engagement 30 Day

**Name:** CSC — Re-Engagement 30 Day
**Status:** Publish when complete
**Trigger:** Tag = `csc-lead` AND last activity > 30 days ago AND tag `csc-application` does NOT exist
> (Removed pipeline-stage trigger conditions since CSC intake no longer assigns to a pipeline.)

### Step 1 — Send Email

**Subject:** Still thinking about it, {{contact.first_name}}?
**Preview:** Your culture diagnostic results have not changed. The gaps are still there.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A few weeks ago you completed the 12-Month Culture Calendar diagnostic and scored {{contact.csc_diagnostic_score}} out of 100 — {{contact.csc_tier}}.

The culture gaps your diagnostic revealed have not changed. The meeting rhythm is the same. The sprint architecture is the same. The team driver systems and culture energy practices are operating at the same level they were when you took the diagnostic.

Culture infrastructure does not self-correct. It either gets installed intentionally or it stays at the level where it is.

If the timing was not right when we first reached out, it may be different now. The 3x3OS engagement is still accepting applications.

Five minutes. Reviewed personally. No obligation.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

### Step 2 — Wait 7 days

### Step 3 — If no response and no apply click:
- Remove tag: email-sequence-active
- Add tag: sequence-completed
- (Pipeline move removed — intake no longer in Paradigm Leads pipeline.)

---

## SMART LISTS

Build these in GHL > Contacts > Smart Lists:

| List Name | Filters |
|---|---|
| `csc-all-leads` | Tag = `csc-lead` |
| `csc-no-rhythm` | Tag = `csc-no-rhythm` |
| `csc-early-stage` | Tag = `csc-early-stage` |
| `csc-developing` | Tag = `csc-developing` |
| `csc-calendar-ready` | Tag = `csc-calendar-ready` |
| `csc-active-sequences` | Tag = `email-sequence-active` AND Tag = `csc-lead` |
| `csc-sequence-completed-no-application` | Tag = `sequence-completed` AND Tag = `csc-lead` AND Tag `csc-application` does NOT exist |
| `csc-solo-founders` | Tag = `csc-lead` AND Tag = `csc-solo` |
| `csc-large-teams` | Tag = `csc-lead` AND Tag = `csc-large-team` |
| `csc-goal-exit` | Tag = `csc-lead` AND `csc_primary_goal` = "exit" |
| `csc-goal-revenue` | Tag = `csc-lead` AND `csc_primary_goal` = "revenue" |
| `csc-low-meeting-rhythm` | Tag = `csc-lead` AND `csc_section_a_meeting_rhythm` <= 10 |
| `csc-low-culture-energy` | Tag = `csc-lead` AND `csc_section_d_culture_energy` <= 10 |
| `csc-high-value` | Tag = `csc-no-rhythm` AND (Tag = `csc-medium-team` OR Tag = `csc-large-team`) |
| `csc-multi-assessment` | Tag = `csc-lead` AND (Tag = `fei-lead` OR Tag = `cma-lead` OR Tag = `fbe-lead` OR Tag = `cs-lead` OR Tag = `le-lead` OR Tag = `saa-lead`) |

---

## MULTI-ASSESSMENT PRIORITY ROUTER UPDATE

Open existing **Multi-Assessment Priority Router** workflow. Add:
- `csc_diagnostic_score` and tier mapping to the worst-score comparison logic
- Tier priority mapping: NO RHYTHM = 1, EARLY STAGE = 2, DEVELOPING = 3, CALENDAR READY = 4
- When `worst_assessment_tool` = CSC → enroll in the appropriate **CSC — Track N** workflow based on tier

---

## FINAL TESTING CHECKLIST

After all workflows are built and published:

- [ ] Submit test lead with score 20 → confirm Track 1 (No Rhythm), tag csc-no-rhythm
- [ ] Submit test lead with score 45 → confirm Track 2 (Early Stage), tag csc-early-stage
- [ ] Submit test lead with score 65 → confirm Track 3 (Developing), tag csc-developing
- [ ] Submit test lead with score 85 → confirm Track 4 (Calendar Ready), tag csc-calendar-ready
- [ ] Confirm all 13 custom fields populate correctly on contact record
- [ ] Confirm team size tags apply correctly (csc-solo, csc-small-team, csc-medium-team, csc-large-team)
- [ ] Confirm intake does NOT add to Paradigm Leads pipeline (CSC is a lead magnet — pattern doc §7)
- [ ] Confirm internal notification email delivers to ari@paradigmconsulting.io + jay@paradigmconsulting.io with all merge fields
- [ ] Confirm internal notification subject is `New CSC Lead — {{contact.first_name}}` (pattern doc §11 — Internal notification subject standardization)
- [ ] Confirm Email 1 of each track checks `paradigm-welcomed` tag (pattern doc §5 suppression)
- [ ] Confirm Email 1 sends from "Matt | Founder, Paradigm Consulting" for each track
- [ ] Confirm Apply-3x3OS-Link tracked links work in all email CTAs
- [ ] Confirm goal step fires on link click (apply tag `csc-application`, remove `email-sequence-active`)
- [ ] Confirm shared Application Hot Lead workflow (pattern doc §8) fires on `csc-application` tag — sends HOT LEAD alert, moves into pipeline, runs SLA reminder
- [ ] Submit application payload → confirm phone preserved if previously populated; standard `Company` written only if empty; `csc_business_name` always populated
- [ ] Confirm contacts with existing assessment data update on same record (no duplicate), without overwriting First Name / Phone
- [ ] Submit same email through a second assessment → confirm Multi-Assessment Priority Router fires
- [ ] Confirm re-engagement workflow fires after 30 days of inactivity
- [ ] Confirm re-engagement stops for contacts where `csc-application` tag exists
- [ ] Verify all 4 email sequences complete correctly (`sequence-completed` tag added, `email-sequence-active` removed)
- [ ] Confirm `csc-high-value` smart list surfaces No Rhythm + Medium/Large Team leads correctly
