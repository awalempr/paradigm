# Founder Bottleneck Eliminator — GHL Build Guide

**Generated:** April 2, 2026
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)

---

## STEP 1 — CREATE CUSTOM FIELDS

Create these custom fields in GHL under Settings > Custom Fields > Contact:

| Field | Key | Type |
|---|---|---|
| FBE Total Score | contact.fbe_total_score | NUMERICAL |
| FBE Correct Allocations | contact.fbe_correct_allocations | NUMERICAL |
| FBE Tier | contact.fbe_tier | TEXT |
| FBE Section A Operational | contact.fbe_section_a_operational | NUMERICAL |
| FBE Section B Management | contact.fbe_section_b_management | NUMERICAL |
| FBE Section C Executive | contact.fbe_section_c_executive | NUMERICAL |
| FBE Section D Strategic | contact.fbe_section_d_strategic | NUMERICAL |
| FBE Most Misallocated Section | contact.fbe_most_misallocated_section | TEXT |
| FBE Source | contact.fbe_source | TEXT |
| FBE Submitted At | contact.fbe_submitted_at | DATE |

**Scoring Reference:**
- 20 questions across 4 sections (Operational, Management, Executive, Strategic)
- Each question tests whether the user assigns a decision to the correct tier (Team / Manager / Executive / Founder)
- Points per question: exact match = 5, off by 1 tier = 3, off by 2 = 1, off by 3 = 0
- Max score: 100
- Correct Allocations: count of exact matches out of 20

---

## STEP 2 — CREATE TAGS

| Tag |
|---|
| fbe-lead |
| fbe-critical-bottleneck (score 0-40) |
| fbe-moderate-bottleneck (score 41-65) |
| fbe-structured-delegator (score 66-85) |
| fbe-decision-ready (score 86-100) |

Pre-existing tags (already in system):
- applied-3x3os
- email-sequence-active
- sequence-completed

---

## STEP 3 — CREATE WEBHOOK TRIGGER

1. Go to Automation > Workflows > Create Workflow
2. Name: "Founder Bottleneck Eliminator"
3. Set trigger: Inbound Webhook
4. Copy the trigger ID from the webhook URL
5. Add trigger ID to Netlify env var: `WEBHOOK_FOUNDER_BOTTLENECK_ELIMINATOR`

---

## STEP 4 — WEBHOOK PAYLOAD REFERENCE

The site sends two webhook payloads through `/api/webhook`:

### Payload 1 — Assessment Completion (source: `founder-bottleneck-eliminator`)

Fires automatically when results load on the results screen.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "total_score": 52,
  "correct_allocations": 11,
  "tier": "MODERATE BOTTLENECK",
  "section_a_operational": 15,
  "section_b_management": 10,
  "section_c_executive": 12,
  "section_d_strategic": 15,
  "most_misallocated_section": "Management Decisions",
  "source": "founder-bottleneck-eliminator",
  "timestamp": "2026-04-02T12:00:00.000Z"
}
```

### Payload 2 — Application (source: `founder-bottleneck-eliminator-apply`)

Fires when founder clicks "Apply for 3x3OS" and submits phone + business name.

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "business_name": "Acme Corp",
  "company_url": "",
  "total_score": 52,
  "tier": "MODERATE BOTTLENECK",
  "section_a_operational": 15,
  "section_b_management": 10,
  "section_c_executive": 12,
  "section_d_strategic": 15,
  "source": "founder-bottleneck-eliminator-apply",
  "lead_source": "founder-bottleneck-eliminator",
  "timestamp": "2026-04-02T12:00:00.000Z"
}
```

**Note:** `company_url` is a honeypot field. If filled, the submission is silently rejected by the server-side proxy.

---

## STEP 5 — PIPELINE (EXISTS)

Pipeline: **Paradigm Leads** — `mgAoodSdPPjT4sxBokR2`

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

---

## WORKFLOW 1 — Founder Bottleneck Eliminator (Intake and Routing)

**Name:** Founder Bottleneck Eliminator
**Status:** Publish when complete
**Trigger:** Inbound Webhook (from Step 3)

### Step 1 — Create or Update Contact

Map from webhook payload:
- first_name → First Name
- email → Email
- total_score → FBE Total Score
- correct_allocations → FBE Correct Allocations
- tier → FBE Tier
- section_a_operational → FBE Section A Operational
- section_b_management → FBE Section B Management
- section_c_executive → FBE Section C Executive
- section_d_strategic → FBE Section D Strategic
- most_misallocated_section → FBE Most Misallocated Section
- source → FBE Source
- timestamp → FBE Submitted At

Duplicate rule: Update existing contact if email matches.

### Step 2 — Add to Pipeline

- Pipeline: Paradigm Leads
- Stage: Assessment Submitted
- Only if contact is NOT already at a higher stage (position > 1)

### Step 3 — Add Tag

- Tag: fbe-lead

### Step 4 — Tier Tagging (If/Else Branches)

**Branch A** — IF fbe_total_score <= 40:
- Add tag: fbe-critical-bottleneck

**Branch B** — ELSE IF fbe_total_score <= 65:
- Add tag: fbe-moderate-bottleneck

**Branch C** — ELSE IF fbe_total_score <= 85:
- Add tag: fbe-structured-delegator

**Branch D** — ELSE (fbe_total_score 86-100):
- Add tag: fbe-decision-ready

### Step 5 — Route to Email Sequence (If/Else Branches)

- IF fbe_total_score <= 40 → Enroll in workflow "FBE — Track 1 Critical Bottleneck"
- ELSE IF fbe_total_score <= 65 → Enroll in workflow "FBE — Track 2 Moderate Bottleneck"
- ELSE IF fbe_total_score <= 85 → Enroll in workflow "FBE — Track 3 Structured Delegator"
- ELSE → Enroll in workflow "FBE — Track 4 Decision-Ready Business"

After enrollment (all branches):
- Add tag: email-sequence-active
- Move pipeline stage to: Email Sequence Active (only if currently at Assessment Submitted)

### Step 6 — Internal Notification Email

**To:** jay@paradigmconsulting.co

**Subject:** New FBE Lead — {{contact.first_name}} — Score {{contact.fbe_total_score}} — {{contact.fbe_tier}}

**Body:**
```
Name: {{contact.first_name}}
Email: {{contact.email}}
Total Score: {{contact.fbe_total_score}} / 100
Correct Allocations: {{contact.fbe_correct_allocations}} / 20
Tier: {{contact.fbe_tier}}
Section A (Operational): {{contact.fbe_section_a_operational}} / 25
Section B (Management): {{contact.fbe_section_b_management}} / 25
Section C (Executive): {{contact.fbe_section_c_executive}} / 25
Section D (Strategic): {{contact.fbe_section_d_strategic}} / 25
Most Misallocated Section: {{contact.fbe_most_misallocated_section}}
Submitted: {{contact.fbe_submitted_at}}
```

---

## WORKFLOW 2 — Founder Bottleneck Eliminator Application Handler

**Name:** Founder Bottleneck Eliminator — Application
**Status:** Publish when complete
**Trigger:** Inbound Webhook (same trigger ID — route by source field)

**Alternative:** Add an If/Else branch at the top of Workflow 1 that checks if `source` = `founder-bottleneck-eliminator-apply`, then routes to the application steps below instead of the intake steps above.

### Step 1 — Update Contact

Map from webhook payload:
- phone → Phone
- business_name → Company (or a custom field)
- source → FBE Source (update to "founder-bottleneck-eliminator-apply")

### Step 2 — Add Tag

- Tag: applied-3x3os

### Step 3 — Move Pipeline Stage

- Pipeline: Paradigm Leads
- Stage: Application Link Clicked

### Step 4 — Remove Tag

- Remove: email-sequence-active

### Step 5 — Internal Notification Email

**To:** jay@paradigmconsulting.co

**Subject:** 3x3OS APPLICATION — {{contact.first_name}} — Founder Bottleneck Eliminator — Score {{contact.fbe_total_score}}

**Body:**
```
APPLICATION RECEIVED

Name: {{contact.first_name}}
Email: {{contact.email}}
Phone: {{contact.phone}}
Business: (from webhook business_name)
Total Score: {{contact.fbe_total_score}} / 100
Tier: {{contact.fbe_tier}}
Most Misallocated Section: {{contact.fbe_most_misallocated_section}}
Section A (Operational): {{contact.fbe_section_a_operational}} / 25
Section B (Management): {{contact.fbe_section_b_management}} / 25
Section C (Executive): {{contact.fbe_section_c_executive}} / 25
Section D (Strategic): {{contact.fbe_section_d_strategic}} / 25

This lead applied through the Founder Bottleneck Eliminator assessment.
Review contact record for full assessment data.
```

---

## EMAIL SEQUENCES

### FBE — Track 1 Critical Bottleneck (Score 0-40)

Framing: The founder is the bottleneck in every decision category. Most decisions that should be resolved at the team, manager, or executive level are routing through the founder. The 3x3OS message is about installing the decision authority infrastructure that breaks the bottleneck permanently.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: applied-3x3os
- Remove tag: email-sequence-active
- Move pipeline stage to: Application Link Clicked
- Stop all further steps immediately

#### Email 1 — Send immediately

**Subject:** Your bottleneck score, {{contact.first_name}}
**Preview:** {{contact.fbe_correct_allocations}} of 20 decisions were allocated to the right level. Here is what that means.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Founder Bottleneck Eliminator on the Paradigm Consulting site.

Your results confirmed something that most founders at your stage feel but have never measured: you are the decision bottleneck in your own business.

Your score was {{contact.fbe_total_score}} out of 100. Of the 20 decision scenarios, you allocated {{contact.fbe_correct_allocations}} to the correct authority level. The rest — the ones that should have been resolved by your team, your managers, or your executives — you assigned to yourself or to the wrong tier entirely.

This is not a failure of judgment. It is a structural problem. Without documented decision authority — clear boundaries for who decides what and under what conditions — every decision defaults to the founder. Not because the founder wants every decision, but because no one else has been given the authority, criteria, or context to make it.

Your weakest section was {{contact.fbe_most_misallocated_section}}. That is the category where the gap between where decisions are being made and where they should be made is widest. It is also where the bottleneck is costing you the most time.

Over the next two weeks I want to walk you through what a decision authority structure looks like in practice — and what it means to install one in a business that has never had it.

If any result surprised you, reply and tell me which scenario it was. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Results — link to founder-bottleneck-eliminator results page]**

#### Wait 2 days

#### Email 2

**Subject:** Why your team keeps asking you things they should already know the answer to
**Preview:** It is not a competence problem. It is a documentation problem.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago your Bottleneck Eliminator results showed that you are making decisions across every category — operational, management, executive, and strategic — that should be distributed across your organization.

The instinct most founders have when they see results like yours is to blame the team. Why can they not figure this out? Why does everything come back to me? Why do they ask for permission on things that seem obvious?

The answer is almost always the same: because no one has documented what they are authorized to decide.

Decision authority is not about trust. It is about infrastructure. Your team members — no matter how capable — will not make decisions outside the scope they believe they have been given. And if that scope has never been documented, the default scope is: ask the founder.

Your {{contact.fbe_most_misallocated_section}} score was the weakest at {{contact.fbe_section_a_operational}} out of 25. That means the decisions in that category — the ones that should be resolved at lower levels of your organization — are all routing through you. Not because your team cannot handle them, but because no one has installed the framework that makes delegation possible.

The 3x3OS engagement starts with Month 1: Install. It is entirely focused on building the decision authority documentation that lets your team make the right calls without asking you first.

If you have ever delegated something and had it come right back to your desk, you have seen what happens when you delegate without the infrastructure.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** The real cost of being the bottleneck
**Preview:** It is not just your time. It is every decision that waits for you to be available.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Bottleneck Eliminator score was {{contact.fbe_total_score}} out of 100. I want to talk about what that number actually costs — because it is more than your time.

When every decision routes through the founder, three things happen simultaneously.

First, decision speed drops to the speed of the founder's availability. Your team has a question at 10am. You are in a meeting until 2pm. The decision waits four hours. Multiply that by every decision across every category, every day, and the cumulative delay is staggering.

Second, decision quality drops because the founder is making calls on things they should not be touching. You scored {{contact.fbe_section_a_operational}} out of 25 on operational decisions — these are the day-to-day calls that your team should be resolving without you. When you make those calls, you are using strategic capacity on operational problems. The operational decisions do not get better. The strategic decisions get worse.

Third, the team stops growing. People develop judgment by making decisions and experiencing the consequences. When the founder makes every decision, the team never develops the capacity to operate without the founder. The bottleneck becomes permanent.

Your assessment showed the bottleneck is worst in {{contact.fbe_most_misallocated_section}}. That is where the 3x3OS engagement starts — installing the decision framework that breaks the bottleneck in the highest-cost area first.

I have room for one more engagement this quarter. If the bottleneck felt urgent, this is the application.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** What a decision-ready business actually looks like
**Preview:** Every decision has a documented owner, criteria, and escalation threshold. Here is how it works.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Bottleneck Eliminator results showed a score of {{contact.fbe_total_score}} with your weakest area in {{contact.fbe_most_misallocated_section}}.

I want to be specific about what the end state looks like — what a decision-ready business operates like after the bottleneck is eliminated.

In a decision-ready business, every recurring decision has three documented components: who owns it (the specific role authorized to make the call), what criteria govern it (the conditions and thresholds that determine the right call), and when it escalates (the specific circumstances under which the decision moves up a level).

When this infrastructure exists, your team does not ask you for permission on operational calls. Your managers do not escalate management decisions to you. Your executives handle executive-level decisions within the documented framework. You — the founder — make strategic decisions only. The decisions that actually require you.

The difference between where you are and where that description lives is not training. It is not hiring better people. It is documentation and installation. Specifically, it is the decision authority framework that the 3x3OS engagement installs in Month 1.

Your {{contact.fbe_correct_allocations}} correct allocations out of 20 will change when the structure changes. Not because you think differently — because the business operates differently.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5 (Final)

**Subject:** Last note on your bottleneck results
**Preview:** The bottleneck does not resolve itself. The structure has to change.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Founder Bottleneck Eliminator results.

Your score was {{contact.fbe_total_score}} out of 100. You correctly allocated {{contact.fbe_correct_allocations}} of 20 decisions. Your weakest section was {{contact.fbe_most_misallocated_section}}.

Those numbers will not change on their own. The decisions that are routing through you today will still be routing through you in six months unless the decision authority infrastructure changes. Hiring will not fix it — new people will default to the same pattern of asking you. Working harder will not fix it — you will just make more decisions faster while the team stays dependent. Hoping the team figures it out will not fix it — they are operating rationally within the system you have built.

The 3x3OS engagement installs the system that breaks the bottleneck. 90 days. Decision authority documentation, delegation frameworks, and escalation protocols across all four decision tiers. The founder gets out of the decisions they should not be making so they can focus on the ones only they can.

If you want to change the structure — not just manage the bottleneck — the application is below. We review every application personally and only accept founders where the engagement will produce a measurable shift.

If the timing is not right, keep your results. The bottleneck will be the same whenever you are ready.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### FBE — Track 2 Moderate Bottleneck (Score 41-65)

**Name:** FBE — Track 2 Moderate Bottleneck
**Status:** Publish when complete
**Trigger:** Enrolled from Founder Bottleneck Eliminator intake workflow

Framing: The founder has some decision distribution but is still the primary bottleneck in specific categories. The message shifts from "everything routes through you" to "the bottleneck is concentrated in specific areas — and those areas are identifiable and fixable." Focus on the section scores and the most misallocated section as the lever.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: applied-3x3os
- Remove tag: email-sequence-active
- Move pipeline stage to: Application Link Clicked
- Stop all further steps immediately

#### Email 1 — Send immediately

**Subject:** Your bottleneck score, {{contact.first_name}}
**Preview:** You are not bottlenecked everywhere — but the places you are matter. Here is the breakdown.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Founder Bottleneck Eliminator on the Paradigm Consulting site.

Your score was {{contact.fbe_total_score}} out of 100. That puts you in the Moderate Bottleneck tier — which means you have some decision distribution working in your business, but specific categories are still routing through you when they should not be.

Of 20 decision scenarios, you correctly allocated {{contact.fbe_correct_allocations}}. The misallocated decisions are not random. They are concentrated in specific areas — and the area with the widest gap is {{contact.fbe_most_misallocated_section}}.

Here is the section breakdown:
- Operational Decisions: {{contact.fbe_section_a_operational}} / 25
- Management Decisions: {{contact.fbe_section_b_management}} / 25
- Executive Decisions: {{contact.fbe_section_c_executive}} / 25
- Strategic Decisions: {{contact.fbe_section_d_strategic}} / 25

The pattern at your score is typical of founders who have done some delegation work but have not installed the underlying decision authority framework. Some things are working. Other things are still stuck. And the stuck areas are creating a bottleneck that constrains everything around them.

Over the next two weeks I want to walk you through where your specific bottleneck is concentrated and what it takes to install the decision infrastructure that breaks it.

Reply if anything in your results surprised you. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Results — link to founder-bottleneck-eliminator results page]**

#### Wait 2 days

#### Email 2

**Subject:** The bottleneck is not everywhere — it is in {{contact.fbe_most_misallocated_section}}
**Preview:** When you know where the constraint is, you know where to start.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago your Bottleneck Eliminator results identified {{contact.fbe_most_misallocated_section}} as your most misallocated decision category.

I want to explain why this matters more than the overall score.

A founder who is bottlenecked everywhere has a structural problem — no decision authority exists at any level. But a founder who is bottlenecked in one or two specific categories has a targeted problem. The infrastructure exists in some areas. In others, decisions are still routing through the founder because the authority, criteria, and escalation rules for that category have never been documented.

At your score of {{contact.fbe_total_score}}, the bottleneck is not a total absence of delegation. It is a gap in specific categories. And gaps in specific categories have specific solutions.

The 3x3OS engagement identifies the exact categories where decision authority is missing, documents the framework for those categories, and installs it so the team can operate within it. It does not rebuild what is already working. It closes the gaps that remain.

The first step is always the most misallocated section — the area where the distance between current decision routing and correct decision routing is widest. In your case, that is {{contact.fbe_most_misallocated_section}}.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** What happens when half the decisions are delegated and half are not
**Preview:** Partial delegation creates a different kind of bottleneck. One that feels like it should be working.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Bottleneck Eliminator score of {{contact.fbe_total_score}} puts you in a position that is uniquely frustrating — you have done real delegation work, and it still does not feel like enough.

That is because partial delegation creates its own kind of bottleneck. When some decisions flow without the founder and others do not, the organization develops an uneven rhythm. Your team moves quickly on the decisions they own. Then they hit a wall on the decisions that require you. They wait. Momentum stalls. Then you become available, make the call, and the system lurches forward again.

This is not a team problem. It is a system design problem. The decisions your team handles well are the ones where — consciously or not — you have communicated the authority, criteria, and boundaries. The decisions that still route through you are the ones where that communication has never happened.

Your section scores tell the story: Operational {{contact.fbe_section_a_operational}}/25, Management {{contact.fbe_section_b_management}}/25, Executive {{contact.fbe_section_c_executive}}/25, Strategic {{contact.fbe_section_d_strategic}}/25. The low scores are the categories where the decision authority framework is missing. The high scores are proof that when the framework exists, it works.

The 3x3OS engagement installs the framework in the categories where it is missing. 90 days. Targeted at the specific gaps your assessment identified.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** Your team can handle more than you think — if the structure lets them
**Preview:** The bottleneck is not their capability. It is the infrastructure.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Bottleneck Eliminator.

I want to name something that founders at your score often discover during the 3x3OS engagement: the team is already more capable than the founder realizes.

The bottleneck at a score of {{contact.fbe_total_score}} is not usually a team capability problem. The people in the organization can handle the decisions. They are not making them because the decision authority has not been explicitly granted. No one told them they could. No one documented the criteria. No one defined the escalation threshold.

When the 3x3OS engagement installs the decision authority framework, the most common reaction from the founder is surprise at how quickly the team adapts. Not because the team suddenly became more competent — but because they were always competent and now they have the documented authority to act on it.

Your most misallocated section — {{contact.fbe_most_misallocated_section}} — is the category where this gap between team capability and documented authority is widest. That is where the engagement starts and where the results show up fastest.

Application-only. Reviewed personally.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5 (Final)

**Subject:** The bottleneck is specific and the fix is specific, {{contact.first_name}}
**Preview:** Your results showed exactly where the constraint lives. Here is what to do about it.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Bottleneck Eliminator results.

Your score was {{contact.fbe_total_score}} out of 100. Your weakest section was {{contact.fbe_most_misallocated_section}}. You correctly allocated {{contact.fbe_correct_allocations}} of 20 decisions.

The bottleneck in your business is not a vague feeling of being overwhelmed. It is specific, measurable, and concentrated in identifiable categories. That means it is fixable — with the right infrastructure.

The 3x3OS engagement installs decision authority frameworks across all four tiers of your organization. At your score, the work is targeted rather than a total rebuild — addressing the categories where the bottleneck is concentrated while reinforcing the areas that are already working.

If you want the bottleneck to change, the structure has to change. The application is below.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### FBE — Track 3 Structured Delegator (Score 66-85)

**Name:** FBE — Track 3 Structured Delegator
**Status:** Publish when complete
**Trigger:** Enrolled from Founder Bottleneck Eliminator intake workflow

Framing: The founder has meaningful decision distribution. Most decisions are allocated to the correct level. The message shifts from "you are the bottleneck" to "you have built something real — the remaining misallocations are costing you more than you think because they are the decisions that should not reach you at all." Position 3x3OS as the system that closes the last gaps and makes the delegation infrastructure permanent.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: applied-3x3os
- Remove tag: email-sequence-active
- Move pipeline stage to: Application Link Clicked
- Stop all further steps immediately

#### Email 1 — Send immediately

**Subject:** Your bottleneck results, {{contact.first_name}}
**Preview:** {{contact.fbe_correct_allocations}} of 20 decisions allocated correctly. You have built real infrastructure. Here is what is left.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Founder Bottleneck Eliminator on the Paradigm Consulting site.

Your score was {{contact.fbe_total_score}} out of 100, which puts you in the Structured Delegator tier. Of 20 decision scenarios, you correctly allocated {{contact.fbe_correct_allocations}}. That is a strong result — most founders who take this assessment score significantly lower.

What that score means is that you have built real decision distribution in your business. The infrastructure exists. Decisions are reaching the right level in most categories. Your team has meaningful authority and they are using it.

The remaining gap is in {{contact.fbe_most_misallocated_section}} — the category where decisions are still not landing at the correct tier. At your score, these remaining misallocations are not a crisis. But they are a drag. Every decision that reaches you when it should not is a decision that uses founder-level time on a non-founder-level problem.

Over the next two weeks I want to walk you through what the final step looks like — closing the remaining gaps in your decision authority framework and installing the system that keeps the infrastructure permanent as the business scales.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Results — link to founder-bottleneck-eliminator results page]**

#### Wait 2 days

#### Email 2

**Subject:** The decisions that still reach you are the most expensive ones
**Preview:** Not because they are complex. Because they should not be there at all.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Bottleneck Eliminator with a score of {{contact.fbe_total_score}}.

I want to make a specific point about the decisions that are still reaching you when they should not be.

At your score, you have built meaningful delegation infrastructure. The decisions that still misallocate are not the obvious ones — they are the subtle ones. The management call that feels like it needs the founder's input but does not. The executive decision that escalates because the criteria for resolution at that level were never made explicit. The operational question that someone brings to you because the documented process covers 90% of cases but not the edge case they just encountered.

These decisions are individually small. They do not feel like a bottleneck because they are quick. But they are expensive precisely because they should not be there. Every one of them represents a moment where the delegation infrastructure has a gap — and that gap routes the decision back to you.

Your weakest section was {{contact.fbe_most_misallocated_section}}. That is where the remaining gaps are concentrated. The 3x3OS engagement at your position is not a delegation overhaul — it is a targeted close-out of the specific decision authority gaps that your assessment identified.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** From Structured Delegator to Decision-Ready
**Preview:** The gap is smaller than you think. The impact is larger than you expect.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Bottleneck Eliminator score of {{contact.fbe_total_score}} puts you close to what we call a Decision-Ready Business — an organization where every recurring decision has a documented owner, criteria, and escalation threshold, and the founder makes only the decisions that genuinely require the founder.

The gap between where you are and that standard is specific and closable. Your section scores — Operational {{contact.fbe_section_a_operational}}/25, Management {{contact.fbe_section_b_management}}/25, Executive {{contact.fbe_section_c_executive}}/25, Strategic {{contact.fbe_section_d_strategic}}/25 — show exactly where the remaining work is.

The 3x3OS engagement at your position is targeted. It closes the decision authority gaps in your weakest categories, adds the documentation layer that makes the framework self-maintaining, and produces a decision infrastructure that holds under growth without reverting to founder dependency.

At your score, you have done the hard work. What remains is the final installation that makes it permanent.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** Your delegation infrastructure is an asset — if it is documented
**Preview:** Undocumented delegation reverts under pressure. Documented delegation holds.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Bottleneck Eliminator.

I want to name a risk that exists specifically at your tier. Founders who have built meaningful delegation often have not documented it. The team knows what they are authorized to decide — but it lives in institutional knowledge rather than documented frameworks. When someone leaves, the knowledge leaves with them. When the business grows and new people join, they do not inherit the delegation structure because it was never written down.

Undocumented delegation is fragile. Under pressure — a crisis, a key departure, rapid growth — it reverts to the founder. The bottleneck returns because the infrastructure was never installed as a system. It was installed as a set of habits and relationships.

The 3x3OS engagement at your position documents the delegation infrastructure you have already built, closes the gaps your assessment identified, and installs the maintenance system that keeps it current as the business evolves.

Application-only. Reviewed personally.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5 (Final)

**Subject:** You are closer than most, {{contact.first_name}}
**Preview:** The remaining gap is specific, small, and worth closing before the next phase of growth.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Bottleneck Eliminator results.

Your score was {{contact.fbe_total_score}} out of 100. You correctly allocated {{contact.fbe_correct_allocations}} of 20 decisions. You have built real delegation infrastructure that most founders at your stage have not.

The remaining gap — concentrated in {{contact.fbe_most_misallocated_section}} — is the last step between a business that delegates well and a business that is genuinely decision-ready.

The 3x3OS engagement at your position is a targeted installation: closing the specific gaps, documenting the delegation infrastructure, and installing the maintenance system that makes it permanent.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

P.S. At your position the engagement scope is specific to your remaining gaps. We confirm the exact scope in the application review.

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### FBE — Track 4 Decision-Ready Business (Score 86-100)

**Name:** FBE — Track 4 Decision-Ready Business
**Status:** Publish when complete
**Trigger:** Enrolled from Founder Bottleneck Eliminator intake workflow

Framing: The founder has a strong decision authority structure. Almost all decisions are allocated correctly. The message is about protecting and optimizing what exists — documentation, maintenance governance, and stress-testing the framework for the next phase of growth. Position 3x3OS as refinement and permanence rather than rescue.

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: applied-3x3os
- Remove tag: email-sequence-active
- Move pipeline stage to: Application Link Clicked
- Stop all further steps immediately

#### Email 1 — Send immediately

**Subject:** Your bottleneck results, {{contact.first_name}}
**Preview:** {{contact.fbe_correct_allocations}} of 20 correct. You have built something most founders never do. Here is what maintaining it requires.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Founder Bottleneck Eliminator on the Paradigm Consulting site.

Your score was {{contact.fbe_total_score}} out of 100. That puts you in the Decision-Ready tier — you correctly allocated {{contact.fbe_correct_allocations}} of 20 decision scenarios. That result reflects real infrastructure you have built in your business.

I want to be direct about what that means and what the remaining edge looks like.

Your decision authority structure is strong. Decisions are reaching the correct level across most categories. Your team operates with real authority. The bottleneck that constrains most founders at your revenue stage is not present in your business in a meaningful way.

The remaining question is not whether decisions are being made correctly. It is whether the framework is documented, stress-tested, and maintained in a way that holds under the next phase of growth — new team members, new complexity, new decision categories that did not exist at the previous stage.

The 3x3OS engagement at your position is not about breaking a bottleneck. It is about documenting and stress-testing the infrastructure you have built so it scales without reverting to founder dependency under pressure.

Over the next week I want to share what that looks like in practice.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Results — link to founder-bottleneck-eliminator results page]**

#### Wait 2 days

#### Email 2

**Subject:** Decision infrastructure that holds under growth
**Preview:** What works at your current stage may not hold at the next one — unless it is documented.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Bottleneck Eliminator with a score of {{contact.fbe_total_score}}.

The decision authority structure you have built works. The question is whether it will keep working.

Decision infrastructure that lives in institutional knowledge — in habits, relationships, and the team's understanding of how things work — is fragile under growth. New hires do not inherit institutional knowledge. New complexity creates decision categories that were not part of the original framework. A key departure removes knowledge that was never documented.

The businesses that maintain strong decision distribution over time are the ones that have documented it explicitly: who decides what, under what criteria, and when it escalates. Not as a static document that sits in a folder. As a living framework that updates when roles change, when new decision categories emerge, and when the business enters a new phase.

The 3x3OS engagement at your position documents your existing framework, identifies the gaps that will emerge under growth, and installs the governance cadence that keeps the infrastructure current.

Your score reflects real work. The engagement makes it permanent.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** The difference between good delegation and permanent infrastructure
**Preview:** One depends on the current team. The other survives beyond them.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Bottleneck Eliminator score of {{contact.fbe_total_score}} puts your business in rare territory. Most founders at your stage are making decisions that should not reach them. You have built the structure that prevents that.

I want to draw one more distinction that matters at your position.

Good delegation means the current team makes the right decisions. Permanent infrastructure means any team — current or future — makes the right decisions because the framework is documented, maintained, and independent of any individual.

That distinction matters at exit, at scale, at any transition point where the business needs to operate beyond the current set of relationships. A business with documented decision authority infrastructure is worth more, scales more predictably, and transitions more cleanly than one where the delegation lives in the founder's head and the team's institutional memory.

The 3x3OS engagement at your position is about converting good delegation into documented permanent infrastructure. Application-only. Reviewed personally.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 4

**Subject:** Protecting what you have built, {{contact.first_name}}
**Preview:** The delegation works. The question is whether it is documented well enough to survive growth.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Bottleneck Eliminator with a strong result.

The decision authority structure you have built is a competitive advantage. Most businesses at your stage are founder-dependent. Yours is not — or at least not in the ways that constrain growth.

The 3x3OS engagement at your position does not rebuild your delegation. It documents it, stress-tests it against the next phase of growth, and installs the maintenance governance that keeps it current as the business evolves.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

P.S. At your position the engagement is scoped to documentation, stress-testing, and governance. We confirm the exact scope in the application review.

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5 (Final)

**Subject:** You built something worth documenting, {{contact.first_name}}
**Preview:** The framework works. Make it permanent.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

This is my last email about your Bottleneck Eliminator results.

Your score was {{contact.fbe_total_score}} out of 100. You correctly allocated {{contact.fbe_correct_allocations}} of 20 decisions. Your business operates with a level of decision distribution that most founders aspire to but few achieve.

The question is whether that infrastructure is documented well enough to hold under growth, survive transitions, and exist independently of the people who currently operate within it.

The 3x3OS engagement at your position answers that question — and installs the documentation and governance that makes the answer permanently yes.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

After Email 5:
- Wait 3 days
- Add tag: sequence-completed
- Remove tag: email-sequence-active
- If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

## WORKFLOW 3 — FBE Application Link Clicked

**Name:** FBE — Application Link Clicked
**Status:** Publish when complete
**Trigger:** Contact clicks tracked link tagged "Apply-3x3OS-Link" AND tag fbe-lead exists

> **NOTE:** Check whether the existing LE/CS/SAA/CMA/12MCC Application Link Clicked workflows already handle this globally. If so, skip this workflow.

### Step 1 — Check for tag applied-3x3os. If exists, stop workflow.
### Step 2 — Add tag: applied-3x3os
### Step 3 — Move pipeline stage to: Application Link Clicked
### Step 4 — Remove tag: email-sequence-active
### Step 5 — Remove contact from all active FBE email sequence workflows
### Step 6 — Wait 10 minutes

### Step 7 — Internal notification to jay@paradigmconsulting.co

**Subject:** Apply Link Clicked — {{contact.first_name}} — {{contact.email}} — FBE Lead

**Body:**
```
Name: {{contact.first_name}}
Email: {{contact.email}}
Total Score: {{contact.fbe_total_score}} / 100
Tier: {{contact.fbe_tier}}
Most Misallocated Section: {{contact.fbe_most_misallocated_section}}
Section A (Operational): {{contact.fbe_section_a_operational}} / 25
Section B (Management): {{contact.fbe_section_b_management}} / 25
Section C (Executive): {{contact.fbe_section_c_executive}} / 25
Section D (Strategic): {{contact.fbe_section_d_strategic}} / 25
Check contact record for assessment suite data if applicable
Submitted: {{contact.fbe_submitted_at}}
```

### Step 8 — Send contact email

**Subject:** We received your interest, {{contact.first_name}}
**Preview:** Someone will be in touch within 48 hours.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

We saw that you clicked through to the 3x3OS application.

If you submitted the application, we will review it personally and be in touch within 48 hours.

If you clicked through but did not complete it, the link is below. It takes five minutes and gives us everything we need to determine whether the 3x3OS engagement is the right fit for where your business is right now.

We do not accept every application. Not because of exclusivity, but because we only work with founders where we are confident the engagement is the right next step. The application is how we make that determination.

Matt
Founder, Paradigm Consulting

**[CTA Button: Complete My Application — link to application page]**

---

## WORKFLOW 4 — FBE Re-Engagement 30 Day

**Name:** FBE — Re-Engagement 30 Day
**Status:** Publish when complete
**Trigger:** Tag = fbe-lead AND pipeline stage = Assessment Submitted OR Email Sequence Active AND last activity > 30 days ago AND tag applied-3x3os does NOT exist

### Step 1 — Send Email

**Subject:** Still thinking about it, {{contact.first_name}}?
**Preview:** Your decision bottleneck has not changed. The structure is the same as the day you took the assessment.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A few weeks ago you completed the Founder Bottleneck Eliminator and scored {{contact.fbe_total_score}} out of 100 — placing you in the {{contact.fbe_tier}} tier with your widest gap in {{contact.fbe_most_misallocated_section}}.

The decisions that were routing through you then are still routing through you now. Decision bottlenecks do not self-correct. The structure has to change for the pattern to change.

If the timing was not right when we first reached out, it may be different now. The 3x3OS engagement is still accepting applications.

Five minutes. Reviewed personally. No obligation.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

### Step 2 — Wait 7 days

### Step 3 — If no response and no apply click:
- Remove tag: email-sequence-active
- Add tag: sequence-completed
- Move pipeline to: Nurture - Long Term

---

## SMART LISTS

Build these in GHL > Contacts > Smart Lists:

| List Name | Filters |
|---|---|
| FBE — All Leads | Tag = fbe-lead |
| FBE — Critical Bottleneck | Tag = fbe-critical-bottleneck |
| FBE — Moderate Bottleneck | Tag = fbe-moderate-bottleneck |
| FBE — Structured Delegators | Tag = fbe-structured-delegator |
| FBE — Decision-Ready | Tag = fbe-decision-ready |
| FBE — Active Sequences | Tag = email-sequence-active AND Tag = fbe-lead |
| FBE — Sequence Completed Not Applied | Tag = sequence-completed AND Tag = fbe-lead AND Tag applied-3x3os does NOT exist |
| FBE — Low Score High Priority | fbe_total_score <= 40 AND correct_allocations <= 8 |
| FBE — Operational Bottleneck | Tag = fbe-lead AND fbe_section_a_operational <= 10 |
| FBE — Management Bottleneck | Tag = fbe-lead AND fbe_section_b_management <= 10 |
| FBE — Also In Assessment Suite | Tag = fbe-lead AND (Tag = leverage-engine-lead OR Tag = compliance-spine-lead OR Tag = system-architecture-lead) |

---

## MULTI-ASSESSMENT PRIORITY ROUTER UPDATE

Open existing **Multi-Assessment Priority Router** workflow. Add:
- FBE tier priority to the worst-score comparison logic:
  - CRITICAL BOTTLENECK = priority 1
  - MODERATE BOTTLENECK = priority 2
  - STRUCTURED DELEGATOR = priority 3
  - DECISION-READY BUSINESS = priority 4
- When `worst_assessment_tool` = FBE → enroll in the worst-tier FBE email sequence

**Note:** If a `fbe_tier_priority` custom field is needed, create it (NUMERICAL type, key `contact.fbe_tier_priority`) and set it in Workflow 1 Step 4 alongside the tier tag:
- CRITICAL BOTTLENECK → fbe_tier_priority = 1
- MODERATE BOTTLENECK → fbe_tier_priority = 2
- STRUCTURED DELEGATOR → fbe_tier_priority = 3
- DECISION-READY BUSINESS → fbe_tier_priority = 4

---

## FINAL TESTING CHECKLIST

After all workflows are built and published:

- [ ] Submit test lead with score 30 → confirm Track 1, tag fbe-critical-bottleneck, tier = CRITICAL BOTTLENECK
- [ ] Submit test lead with score 55 → confirm Track 2, tag fbe-moderate-bottleneck, tier = MODERATE BOTTLENECK
- [ ] Submit test lead with score 75 → confirm Track 3, tag fbe-structured-delegator, tier = STRUCTURED DELEGATOR
- [ ] Submit test lead with score 95 → confirm Track 4, tag fbe-decision-ready, tier = DECISION-READY BUSINESS
- [ ] Confirm all custom fields populate correctly on contact record (total_score, correct_allocations, tier, all 4 section scores, most_misallocated_section)
- [ ] Confirm pipeline stage moves to Assessment Submitted then Email Sequence Active
- [ ] Confirm internal notification email delivers to jay@paradigmconsulting.co with all merge fields
- [ ] Confirm Day 0 emails send from "Matt | Founder, Paradigm Consulting"
- [ ] Confirm Apply-3x3OS-Link tracked links work in all email CTAs
- [ ] Confirm goal step fires on link click (tag applied-3x3os, remove email-sequence-active, move stage)
- [ ] Confirm contacts with existing assessment data update on same record (no duplicate)
- [ ] Submit application payload → confirm phone and business_name map, applied-3x3os tag added, pipeline moves to Application Link Clicked
- [ ] Confirm honeypot field (company_url) rejects submission when filled
- [ ] Submit same email through a second assessment → confirm Multi-Assessment Priority Router fires
- [ ] Confirm re-engagement workflow fires after 30 days of inactivity for non-applied leads
- [ ] Confirm re-engagement stops for contacts where multi_assessment_routing_active = YES
- [ ] Verify all 4 tier-specific email sequences send correct branch content
