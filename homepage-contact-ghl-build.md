# Homepage Contact (Friction-Point Quiz) — GHL Build Guide

> **Conforms to:** [paradigm-ghl-workflow-pattern.md](paradigm-ghl-workflow-pattern.md) (v 2026-05-17). All deviations must be approved as named exceptions in the pattern doc first.

**Generated:** April 2, 2026
**Updated:** 2026-05-17 (conformed to canonical pattern)
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)
**Short key:** `hp`

> **Gap:** Homepage CTAs send leads to apply pages but no application-handler workflow is defined in this doc. Application handling is now performed by the shared "Application Hot Lead" workflow per pattern doc §8 — confirm CTA links route to a page that triggers the appropriate `-application` tag (in this case `hp-application`). <!-- TODO: confirm given pattern v 2026-05-17 -->

---

## STEP 1 — CREATE CUSTOM FIELDS

Create these custom fields in GHL under Settings > Custom Fields > Contact:

| Field | Key | Type |
|---|---|---|
| HP Paradigm Score | contact.hp_paradigm_score | NUMBER |
| HP Assigned Tier | contact.hp_assigned_tier | NUMBER |
| HP Primary Pillar | contact.hp_primary_pillar | NUMBER |
| HP Compliance Risk | contact.hp_compliance_risk | TEXT |
| HP Marketing Risk | contact.hp_marketing_risk | TEXT |
| HP Business Stage | contact.hp_business_stage | TEXT |
| HP Hard Tier 3 | contact.hp_hard_tier3 | TEXT |
| HP Subscriptions | contact.hp_subscriptions | TEXT |
| HP Lead Source | contact.hp_lead_source | TEXT |
| HP UTM Source | contact.hp_utm_source | TEXT |
| HP UTM Medium | contact.hp_utm_medium | TEXT |
| HP UTM Campaign | contact.hp_utm_campaign | TEXT |
| HP Submitted At | contact.hp_submitted_at | DATE |
| HP Business Name | contact.hp_business_name | TEXT |

**Notes:**
- `hp_assigned_tier` stores 1, 2, or 3 as a NUMBER. Tier 1 = Compliance-focused, Tier 2 = Culture-focused, Tier 3 = Technology/Systems-focused.
- `hp_primary_pillar` stores 1, 2, 3, or null as a NUMBER. 1 = Compliance, 2 = Culture, 3 = Technology.
- Boolean fields (`hp_compliance_risk`, `hp_marketing_risk`, `hp_hard_tier3`, `hp_subscriptions`) store "true" or "false" as text.
- `hp_business_name` is the prefixed mirror of company name (per pattern doc §4). The standard GHL `Company` field gets first-write-wins treatment; `hp_business_name` is written unconditionally on every submission.
- Field types standardize on `NUMBER` (not `NUMERICAL`) per pattern doc §3.

---

## STEP 2 — CREATE TAGS

| Tag | Purpose |
|---|---|
| hp-lead | Applied on every form submission |
| hp-completed | (Reserved — homepage quiz currently has no distinct "completed" event separate from intake; tag exists for future symmetry with pattern doc §2) |
| hp-application | Applied when contact clicks an "Apply for 3x3OS" CTA in any email (or when the apply landing page fires a webhook). Triggers shared "Application Hot Lead" workflow (pattern doc §8). |
| hp-converted | Applied when the contact pays for an engagement |
| tier-1-compliance |  |
| tier-2-culture |  |
| tier-3-technology |  |

Per pattern doc §2: replaces legacy `applied-3x3os` shared tag with the per-source `hp-application` tag.

Shared pre-existing tags:
- `paradigm-welcomed` — welcome-email suppression gate (see pattern doc §5)
- `email-sequence-active`
- `sequence-completed`
- `hot-lead` — applied by shared Application Hot Lead workflow (pattern doc §8)

---

## STEP 3 — CREATE WEBHOOK TRIGGER

1. Go to Automation > Workflows > Create Workflow
2. Name: "Homepage Contact"
3. Set trigger: Inbound Webhook
4. Copy the trigger ID from the webhook URL
5. Add trigger ID to Netlify env var: `WEBHOOK_INDEX`

---

## STEP 4 — WEBHOOK PAYLOAD REFERENCE

The site sends one webhook payload through `/api/webhook` with source `homepage-contact`.

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "company_name": "Acme Corp",
  "company_url": "(honeypot — if filled, submission is silently rejected)",
  "paradigm_score": 67,
  "assigned_tier": 2,
  "primary_pillar": 3,
  "compliance_risk": true,
  "marketing_risk": false,
  "hard_tier3": false,
  "business_stage": "mid",
  "subscriptions": true,
  "source": "homepage-contact",
  "lead_source": "friction-point-quiz",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "spring-2026"
}
```

**Field definitions:**

| Field | Values | Meaning |
|---|---|---|
| paradigm_score | 0-100 (number) | Overall friction-point quiz score |
| assigned_tier | 1, 2, 3 (number) | 1 = Compliance, 2 = Culture, 3 = Technology |
| primary_pillar | 1, 2, 3, or null (number) | Dominant pillar from quiz answers |
| compliance_risk | true / false | Quiz flagged compliance exposure |
| marketing_risk | true / false | Quiz flagged marketing exposure |
| hard_tier3 | true / false | Strong technology/systems signal — hard-routed to Tier 3 |
| business_stage | "early", "mid", "scale", or null | Self-reported business stage |
| subscriptions | true / false | Opted into email communications |

---

## WORKFLOW 1 — Homepage Contact (Intake and Routing)

**Name:** Homepage Contact
**Status:** Publish when complete
**Trigger:** Inbound Webhook (from Step 3)

### Step 1 — Create or Update Contact

Map from webhook payload:
- first_name → First Name **(see duplicate-handling rule below)**
- last_name → Last Name
- email → Email **(dedupe key)**
- phone → Phone **(see duplicate-handling rule)**
- company_name → standard `Company` (first-write-wins) AND `contact.hp_business_name` (always)
- paradigm_score → HP Paradigm Score
- assigned_tier → HP Assigned Tier
- primary_pillar → HP Primary Pillar
- compliance_risk → HP Compliance Risk
- marketing_risk → HP Marketing Risk
- hard_tier3 → HP Hard Tier 3
- business_stage → HP Business Stage
- subscriptions → HP Subscriptions
- lead_source → HP Lead Source
- utm_source → HP UTM Source
- utm_medium → HP UTM Medium
- utm_campaign → HP UTM Campaign
- (set HP Submitted At to current date/time)

**Duplicate-handling rule (per pattern doc §4):**
- Match on `email`
- If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
- For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `hp_business_name` regardless.

### Step 2 — Add to Pipeline

- Pipeline: Paradigm Leads (per pattern doc §7 — homepage contact is a lead-magnet source and does NOT get its own pipeline)
- Stage: New Lead
- Only if contact is NOT already at a higher stage (position > 0)
- Do not move through later stages (e.g. "Application Link Clicked", "Discovery Call", "Proposal Sent") from this workflow — those are managed by the shared "Application Hot Lead" workflow (pattern doc §8) or by manual sales-rep stage moves.

### Step 3 — Add Tag

- Tag: `hp-lead`

### Step 4 — Tier Tagging (If/Else Branches)

**Branch A** — IF hp_assigned_tier = 1:
- Add tag: tier-1-compliance

**Branch B** — ELSE IF hp_assigned_tier = 2:
- Add tag: tier-2-culture

**Branch C** — ELSE (hp_assigned_tier = 3):
- Add tag: tier-3-technology

### Step 5 — Route to Email Sequence (If/Else Branches)

- IF hp_assigned_tier = 1 → Enroll in workflow "HP — Tier 1 Compliance Sequence"
- ELSE IF hp_assigned_tier = 2 → Enroll in workflow "HP — Tier 2 Culture Sequence"
- ELSE → Enroll in workflow "HP — Tier 3 Technology Sequence"

After enrollment (all branches):
- Add tag: email-sequence-active

### Step 6 — Internal Notification Email

**To:** `ari@paradigmconsulting.io`, `jay@paradigmconsulting.io`

**Subject:** `New HP Lead — {{contact.first_name}}`

**Body:**
```
HOMEPAGE CONTACT — FRICTION-POINT QUIZ

Name: {{contact.first_name}} {{contact.last_name}}
Email: {{contact.email}}
Phone: {{contact.phone}}
Company: {{contact.hp_business_name}}

Paradigm Score: {{contact.hp_paradigm_score}} / 100
Assigned Tier: {{contact.hp_assigned_tier}}
Primary Pillar: {{contact.hp_primary_pillar}}
Business Stage: {{contact.hp_business_stage}}

Compliance Risk: {{contact.hp_compliance_risk}}
Marketing Risk: {{contact.hp_marketing_risk}}
Hard Tier 3: {{contact.hp_hard_tier3}}

Subscriptions: {{contact.hp_subscriptions}}
Lead Source: {{contact.hp_lead_source}}

UTM Source: {{contact.hp_utm_source}}
UTM Medium: {{contact.hp_utm_medium}}
UTM Campaign: {{contact.hp_utm_campaign}}

Submitted: {{contact.hp_submitted_at}}
```

---

## APPLICATION HANDLING

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md).

When a contact clicks any "Apply for 3x3OS" CTA in the email sequences below (or submits the apply landing page), the `hp-application` tag is applied. That tag triggers the shared workflow, which:

1. Applies `hot-lead`
2. Pauses the active HP nurture sequence
3. Moves contact into the relevant pipeline at "Application Received"
4. Sends internal alert to ari@ + jay@paradigmconsulting.io
5. Escalates with SLA reminder if no human contact within 1 business day

**Apply-link convention:** Every "Apply for 3x3OS" CTA below should be tracked with link tag `Apply-3x3OS-Link`. The Goal Step on each email sequence below adds the `hp-application` tag (NOT the legacy `applied-3x3os` tag) when this link is clicked. <!-- TODO: confirm given pattern v 2026-05-17 — confirm CTA links route to a page that fires the `hp-application` tag -->

---

## EMAIL SEQUENCES

All sequences share the same structural pattern:
- 5 emails per sequence
- From: Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>
- Goal Step on each: Contact clicks tracked link tagged "Apply-3x3OS-Link"
  - On goal: Add tag `hp-application`, remove tag `email-sequence-active`, stop workflow. (Shared "Application Hot Lead" workflow per pattern doc §8 takes it from here — including any pipeline stage move and internal alerts. Do NOT move pipeline stages from inside this nurture workflow.)
- After Email 5: Wait 3 days → Add tag `sequence-completed` → Remove tag `email-sequence-active` → If pipeline still at New Lead or Email Sequence Active, move to Nurture - Long Term

---

### HP — Tier 1 Compliance Sequence

**Framing:** This founder's primary friction point is compliance exposure. The business has gaps in contracts, financial controls, documentation, privacy, or HR that create real liability. The message is about installing the compliance infrastructure that eliminates exposure before it becomes a crisis.

#### Email 1 — Send immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

**Subject:** Your friction-point results, {{contact.first_name}}
**Preview:** Your score flagged compliance as the primary constraint. Here is what that means.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body (warm-welcome variant — first touch):**

{{contact.first_name}},

You just completed the friction-point quiz on the Paradigm Consulting site.

Your Paradigm Score came back at {{contact.hp_paradigm_score}} out of 100, and the quiz routed you to Tier 1 — Compliance. That means the biggest source of friction in your business right now is not marketing, not technology, not team culture. It is structural exposure in your compliance infrastructure.

That might sound abstract. It is not. Compliance gaps are the things that do not hurt until they do — and when they do, they hurt all at once. Missing contracts, undocumented financial controls, absent privacy policies, incomplete HR documentation. Each one is a liability that compounds silently.

Most founders at your stage know something is off but have not quantified where the gaps actually are. Your quiz results did that quantification for you.

Over the next two weeks I am going to walk you through what compliance infrastructure actually looks like when it is installed correctly — and why it has to come before growth initiatives, not after.

If anything in your results surprised you, reply and tell me. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Learn About Our Compliance Approach — link to paradigmconsulting.io]**

---

**Body (result-only variant — subsequent touch, contact already has `paradigm-welcomed` tag):**

{{contact.first_name}},

Your friction-point quiz routed you to Tier 1 — Compliance. Score: {{contact.hp_paradigm_score}} / 100.

The biggest source of friction in your business right now is structural exposure in your compliance infrastructure. Missing contracts, undocumented financial controls, absent privacy policies, incomplete HR documentation — gaps that compound silently until they don't.

I'll walk you through what installed compliance infrastructure looks like — and why it has to come before growth, not after — in the next few emails.

Reply if anything in the result surprised you.

Matt

**[CTA Button: Learn About Our Compliance Approach — link to paradigmconsulting.io]**

#### Wait 2 days

#### Email 2

**Subject:** The compliance gap most founders ignore
**Preview:** It is not the obvious one. It is the one that feels like it can wait.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

Two days ago your friction-point quiz flagged compliance as your primary constraint. I want to talk about the specific gap that causes the most damage — and it is not the one founders expect.

Most founders think their biggest compliance risk is the thing they know they are missing. The contract they have not updated. The privacy policy they copied from a template. The HR documentation they keep meaning to formalize.

Those are real gaps. But the most dangerous gap is the one between what you think is compliant and what actually is. The contract you have — but that does not cover the scenarios your business actually faces. The financial controls you believe exist — but that depend entirely on one person remembering to do them. The documentation you created — but that no one follows because it does not match how work actually gets done.

That gap between perceived compliance and actual compliance is where exposure lives. And it only becomes visible when something goes wrong.

The 3x3OS engagement starts with a compliance audit that maps every gap — not just the missing pieces, but the pieces that exist on paper but fail in practice. Month 1 is entirely focused on installing the infrastructure that closes both kinds of gaps.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** Why compliance before growth is not conservative — it is strategic
**Preview:** Every growth initiative built on compliance gaps carries hidden costs.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

There is a pattern I see with almost every founder whose quiz results flag compliance as the primary constraint. They know the gaps exist. They plan to address them. But they prioritize growth first because compliance feels like maintenance, not momentum.

Here is the problem with that sequence: every growth initiative you build on top of compliance gaps inherits those gaps. You scale marketing — and your privacy policy does not cover the data you are now collecting at volume. You hire faster — and your HR documentation cannot support the onboarding load. You sign bigger contracts — and the terms were written for a business half your current size.

Growth does not fix compliance gaps. Growth amplifies them. And the cost of fixing compliance retroactively — after it has been stressed by scale — is three to five times higher than installing it correctly before you grow.

Your Paradigm Score of {{contact.hp_paradigm_score}} reflects a business with meaningful friction in its compliance foundation. That is not a judgment. It is a structural reality that has a structural solution.

The 3x3OS engagement installs that solution in 90 days. Not a compliance audit that sits in a folder. An operational compliance infrastructure that your team actually uses.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 4

**Subject:** What a compliance-first 90 days actually looks like
**Preview:** Not paperwork. Not checklists. Operational infrastructure.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

I want to be specific about what happens when a founder at your stage goes through the compliance track of the 3x3OS engagement.

Month 1 — Install: We audit every compliance surface in the business. Contracts, financial controls, documented processes, privacy infrastructure, HR documentation. Not just whether they exist, but whether they function under the actual conditions of your business. We build the operational compliance layer — the documentation, decision frameworks, and controls that make compliance automatic rather than dependent on someone remembering.

Month 2 — Integrate: We connect the compliance infrastructure to your daily operations. This is where most compliance efforts fail — they produce documents that nobody uses. Integration means your team's actual workflows include compliance checkpoints that do not create friction. The systems enforce the standards without requiring manual oversight.

Month 3 — Scale: We stress-test the compliance infrastructure against your growth targets. What breaks when you double your client load? What gaps emerge when you add three team members? We identify and close those gaps before they become real exposures.

The result is not a binder of policies. It is a business that can grow without accumulating hidden liability.

I have room for one more compliance-track engagement this quarter.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5 (Final)

**Subject:** Last note on your friction-point results
**Preview:** The compliance gaps do not resolve themselves.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

This is my last email about your friction-point quiz results.

Your Paradigm Score was {{contact.hp_paradigm_score}} out of 100. The quiz identified compliance as your primary constraint — the area where structural friction is highest and where unaddressed gaps create the most risk.

Those gaps will not close on their own. They will not close because the business grows. They will compound as the business grows. Every month without compliance infrastructure is a month where exposure accumulates silently.

If you want to close the gaps — not with a checklist but with installed operational infrastructure — the 3x3OS application is below. We review every application personally and only accept founders where the engagement will produce a measurable structural shift.

If the timing is not right, keep your quiz results. The gaps will be the same whenever you are ready to address them.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

---

### HP — Tier 2 Culture Sequence

**Framing:** This founder's primary friction point is culture and team infrastructure. The business has gaps in how the team operates, communicates, makes decisions, or scales its people systems. The message is about installing the culture infrastructure that turns a founder-dependent team into an operationally independent one.

#### Email 1 — Send immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

**Subject:** Your friction-point results, {{contact.first_name}}
**Preview:** Your score flagged culture as the primary constraint. Here is what that means.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body (warm-welcome variant — first touch):**

{{contact.first_name}},

You just completed the friction-point quiz on the Paradigm Consulting site.

Your Paradigm Score came back at {{contact.hp_paradigm_score}} out of 100, and the quiz routed you to Tier 2 — Culture. That means the biggest source of friction in your business right now is not compliance infrastructure or technology. It is how your team operates.

Culture friction shows up in specific, measurable ways: decisions that require your approval when they should not, team members who cannot resolve conflicts without escalation, onboarding that takes twice as long as it should, or a general sense that the business cannot function at full capacity when you step away.

These are not personality problems. They are infrastructure problems. Your team does not lack talent or motivation — it lacks the systems, authority frameworks, and communication infrastructure that allow talent to operate independently.

Over the next two weeks I am going to walk you through what culture infrastructure actually looks like when it is installed — and why it is the single highest-leverage investment for a founder at your stage.

Reply if anything in your results resonated. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Learn About Our Culture Approach — link to paradigmconsulting.io]**

---

**Body (result-only variant — subsequent touch, contact already has `paradigm-welcomed` tag):**

{{contact.first_name}},

Your friction-point quiz routed you to Tier 2 — Culture. Score: {{contact.hp_paradigm_score}} / 100.

The biggest source of friction in your business right now is how your team operates — decisions that require your approval when they should not, onboarding that takes twice as long as it should, a team that cannot function at full capacity when you step away.

Not personality problems. Infrastructure problems. I'll walk you through what installed culture infrastructure looks like over the next few emails.

Reply if anything in the result resonated.

Matt

**[CTA Button: Learn About Our Culture Approach — link to paradigmconsulting.io]**

#### Wait 2 days

#### Email 2

**Subject:** The real cost of founder-dependent culture
**Preview:** It is not burnout. It is the revenue ceiling you cannot see.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

Two days ago your friction-point quiz flagged culture as your primary constraint. I want to talk about why that matters more than most founders realize.

The visible cost of culture friction is obvious — it is the meetings that should not require you, the decisions that stall when you are unavailable, the general sense that the team needs you more than it should.

The invisible cost is bigger. It is the revenue your business cannot generate because your team's capacity is capped by your personal bandwidth. Every decision that routes through you is a bottleneck. Every process that depends on tribal knowledge instead of documented authority is fragile. Every hire who takes three months to become productive instead of three weeks is compounding waste.

Your Paradigm Score of {{contact.hp_paradigm_score}} reflects a business where the team's operating capacity is constrained by cultural infrastructure — not by talent, not by market opportunity, not by product quality.

The 3x3OS engagement addresses this directly. Month 1 installs the decision authority and communication frameworks. Month 2 integrates them into daily operations. Month 3 scales them to handle your growth targets.

The result is a team that operates at full capacity without requiring the founder in every loop.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** Why hiring does not fix culture friction
**Preview:** More people on a broken operating system just creates more friction.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

The instinct when culture friction becomes visible is to hire. More people should mean more capacity. A new manager should mean fewer decisions routing to you. A bigger team should mean the founder can step back.

That logic only works if the operating infrastructure supports it. Without clear decision authority, every new hire creates more decisions that need your input, not fewer. Without documented processes, every new team member extends the onboarding burden. Without communication frameworks, a larger team generates more noise, not more signal.

Hiring into culture friction is like adding lanes to a highway that has a broken interchange. More lanes do not fix the bottleneck — they just put more cars in front of it.

The founders who come through the 3x3OS culture track often discover that their team's existing capacity — before any new hires — is thirty to fifty percent higher than what they are currently accessing. The constraint is not headcount. It is the infrastructure that allows headcount to produce output.

Install the infrastructure first. Then hire into a system that can actually absorb new capacity.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 4

**Subject:** What a culture-first 90 days actually looks like
**Preview:** Decision authority. Communication frameworks. Operational independence.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

Here is what the culture track of the 3x3OS engagement looks like in practice.

Month 1 — Install: We map every decision that currently requires the founder and categorize them by type — strategic (should stay with founder), operational (should be delegated with guardrails), and tactical (should be fully autonomous). We build the decision authority documentation that tells every team member exactly what they can decide, what criteria trigger escalation, and what context they need to make the same call you would make.

Month 2 — Integrate: We install the communication and meeting infrastructure that replaces ad-hoc founder access with structured information flow. This includes async communication standards, meeting cadences with clear outputs, conflict resolution frameworks, and accountability systems that do not depend on the founder checking in.

Month 3 — Scale: We stress-test the culture infrastructure against growth. What breaks when you add three people? What decisions still route to you that should not? We close every remaining gap and build the onboarding system that allows new hires to reach full productivity in weeks instead of months.

The output is not a culture deck or a set of values on the wall. It is operational infrastructure that changes how your team works every day.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5 (Final)

**Subject:** Last note on your friction-point results
**Preview:** The team's ceiling does not raise itself.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

This is my last email about your friction-point quiz results.

Your Paradigm Score was {{contact.hp_paradigm_score}} out of 100. The quiz identified culture as your primary constraint — the area where your team's operating infrastructure creates the most friction and limits the most capacity.

That infrastructure will not install itself. It will not improve because you hire better people. It will not fix itself because the team is loyal or talented. Good people on bad infrastructure produce mediocre results. The same people on good infrastructure produce exceptional ones.

If you want to install the operating infrastructure your team needs — not in theory, but in practice, in 90 days — the 3x3OS application is below. We review every application personally and only accept founders where the engagement will produce a measurable shift.

If the timing is not right, keep your quiz results. The friction will be the same whenever you are ready to address it.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

---

### HP — Tier 3 Technology Sequence

**Framing:** This founder's primary friction point is technology and systems infrastructure. The business either lacks the systems to operate efficiently, has fragmented tools that do not talk to each other, or is manually doing work that should be automated. The message is about installing the technology layer that turns manual operations into scalable systems.

#### Email 1 — Send immediately

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

**Subject:** Your friction-point results, {{contact.first_name}}
**Preview:** Your score flagged technology as the primary constraint. Here is what that means.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body (warm-welcome variant — first touch):**

{{contact.first_name}},

You just completed the friction-point quiz on the Paradigm Consulting site.

Your Paradigm Score came back at {{contact.hp_paradigm_score}} out of 100, and the quiz routed you to Tier 3 — Technology. That means the biggest source of friction in your business right now is not team culture or compliance exposure. It is your systems architecture.

Technology friction is deceptive because it often feels like a people problem. The team is slow because they are manually doing work that should be automated. Information lives in five different places and none of them agree. Client onboarding takes a week because every step requires a human to remember to do the next thing. Reporting takes hours because data has to be pulled from three systems and reconciled in a spreadsheet.

None of that is a people problem. It is a systems problem. Your team is not slow — your infrastructure is.

Over the next two weeks I am going to walk you through what technology infrastructure looks like when it is installed correctly — not as a collection of tools, but as an integrated operating system for your business.

Reply if anything in your results resonated. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Learn About Our Technology Approach — link to paradigmconsulting.io]**

---

**Body (result-only variant — subsequent touch, contact already has `paradigm-welcomed` tag):**

{{contact.first_name}},

Your friction-point quiz routed you to Tier 3 — Technology. Score: {{contact.hp_paradigm_score}} / 100.

Your biggest source of friction is systems architecture — fragmented tools, manual handoffs, data living in five places that don't agree. Often looks like a people problem; it's a systems problem.

I'll walk you through what installed technology infrastructure looks like — not a tool collection, an integrated operating system — over the next few emails.

Reply if the result resonated.

Matt

**[CTA Button: Learn About Our Technology Approach — link to paradigmconsulting.io]**

#### Wait 2 days

#### Email 2

**Subject:** Why more tools make the problem worse
**Preview:** The issue is not which tools you use. It is how they connect.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

Two days ago your friction-point quiz flagged technology as your primary constraint. I want to talk about the mistake most founders make when they see that result.

The instinct is to buy more software. A better CRM. A new project management tool. An AI tool that promises to automate everything. The problem is that every new tool you add to a fragmented stack makes the fragmentation worse. You do not need more tools. You need fewer tools that actually talk to each other.

The real cost of a fragmented technology stack is not the subscription fees. It is the human labor spent bridging the gaps between systems — the copy-pasting, the manual data entry, the reconciliation, the "let me check the other system" conversations. That labor is invisible on a P&L but it consumes twenty to forty percent of your team's productive capacity.

Your Paradigm Score of {{contact.hp_paradigm_score}} reflects a business where technology friction is consuming capacity that should be going toward revenue-generating work.

The 3x3OS technology track does not start by recommending tools. It starts by mapping your actual information flow — where data enters, how it moves, where it gets stuck, and where humans are doing work that a connected system should handle automatically. The tool decisions come after the architecture is clear.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 3 days

#### Email 3

**Subject:** The automation that matters vs. the automation that wastes money
**Preview:** Not all automation is equal. Most of it is premature.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

There is a hierarchy to technology installation that most founders skip. They jump straight to automation — "automate this workflow," "automate that notification," "automate the reporting." And then they wonder why the automation creates as many problems as it solves.

Automation built on top of fragmented systems automates the fragmentation. You get faster data moving between disconnected tools, which means errors propagate faster, inconsistencies multiply faster, and debugging becomes harder because the automation obscures what is actually happening.

The correct sequence is: consolidate, then connect, then automate.

Consolidate means reducing the number of systems that hold the same type of data. Connect means building reliable data flow between the systems that remain. Automate means removing human steps from workflows that now have clean, connected data flowing through them.

When founders come through the 3x3OS technology track, Month 1 is consolidation — mapping every system, eliminating redundancy, and establishing the single source of truth for each data type. Month 2 is connection — building the integrations and data flows that make the remaining systems work as one. Month 3 is automation — and by then, the automation is clean because it is built on a solid foundation.

Skip any step and the automation breaks within sixty days. Follow the sequence and it runs for years.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 4

**Subject:** What a technology-first 90 days actually looks like
**Preview:** Consolidate. Connect. Automate. In that order.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

Here is what the technology track of the 3x3OS engagement looks like in practice.

Month 1 — Install: We run a full system architecture audit. Every tool, every data flow, every manual process. We map where information enters the business, how it moves between systems, and where humans are doing work that should be automated. Then we build the consolidation plan — which systems stay, which get replaced, and what the target architecture looks like. We begin installation of the core stack.

Month 2 — Integrate: We connect the systems. API integrations, webhook automations, data sync pipelines. The goal is zero manual data transfer between systems. Every piece of information that enters the business once should be available everywhere it is needed without someone copying it. We also build the dashboards and reporting infrastructure so you can see what is happening in real time instead of waiting for someone to compile a report.

Month 3 — Scale: We build the automation layer. Client onboarding sequences. Internal workflow triggers. Notification systems. Reporting automations. All built on the clean, connected foundation from Months 1 and 2. We stress-test against your growth targets and ensure the architecture handles two to three times your current volume without breaking.

The result is not a collection of tools. It is an operating system for your business.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

#### Wait 4 days

#### Email 5 (Final)

**Subject:** Last note on your friction-point results
**Preview:** The systems do not fix themselves.
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>

**Body:**

{{contact.first_name}},

This is my last email about your friction-point quiz results.

Your Paradigm Score was {{contact.hp_paradigm_score}} out of 100. The quiz identified technology and systems as your primary constraint — the area where fragmented infrastructure is consuming the most capacity and creating the most operational friction.

That fragmentation will not resolve itself. It will get worse as you grow. Every new client, every new team member, every new tool adds complexity to a stack that already cannot handle the current load cleanly. The cost of manual workarounds compounds monthly.

If you want to replace the fragmentation with an integrated operating system — not in theory, but installed and running in 90 days — the 3x3OS application is below. We review every application personally and only accept founders where the engagement will produce a measurable shift.

If the timing is not right, keep your quiz results. The fragmentation will be the same whenever you are ready to address it.

Matt

**[CTA Button: Apply for 3x3OS — tracked link tagged "Apply-3x3OS-Link"]**

---

## SMART LIST SUGGESTIONS

Create these saved filters in GHL for ongoing lead management (per pattern doc §10 naming convention):

| List Name | Filter |
|---|---|
| hp-leads-all | Tag = `hp-lead` |
| hp-tier-1-compliance | Tag = `hp-lead` AND Tag = `tier-1-compliance` |
| hp-tier-2-culture | Tag = `hp-lead` AND Tag = `tier-2-culture` |
| hp-tier-3-technology | Tag = `hp-lead` AND Tag = `tier-3-technology` |
| hp-active-sequences | Tag = `email-sequence-active` AND Tag = `hp-lead` |
| hp-compliance-risk-flagged | Tag = `hp-lead` AND hp_compliance_risk = "true" |
| hp-marketing-risk-flagged | Tag = `hp-lead` AND hp_marketing_risk = "true" |
| hp-hard-tier-3 | Tag = `hp-lead` AND hp_hard_tier3 = "true" |
| hp-sequence-completed-no-application | Tag = `sequence-completed` AND Tag = `hp-lead` AND Tag `hp-application` does NOT exist |
| hp-applications | Tag = `hp-application` AND Tag = `hp-lead` |
| hp-high-score-low-engagement | hp_paradigm_score >= 70 AND Tag = `hp-lead` AND Tag `email-sequence-active` does NOT exist AND Tag `hp-application` does NOT exist |

---

## TESTING CHECKLIST

- [ ] Submit test lead with assigned_tier = 1 → confirm:
  - Contact created with all HP_ fields mapped correctly (including `hp_business_name`)
  - Standard `Company` field written only on first submission (re-submit confirms first-write-wins)
  - First Name and Phone NOT overwritten on re-submission if already populated
  - Tag `hp-lead` applied
  - Tag `tier-1-compliance` applied
  - Pipeline stage set to New Lead in Paradigm Leads
  - Enrolled in HP — Tier 1 Compliance Sequence
  - Tag `email-sequence-active` applied
  - Internal notification email received by BOTH ari@ AND jay@paradigmconsulting.io with correct data
  - Email 1 sends immediately with correct merge fields
  - Welcome-suppression: first-touch contact gets warm-welcome variant AND `paradigm-welcomed` tag is applied
  - Welcome-suppression: contact with `paradigm-welcomed` already applied gets result-only variant
- [ ] Submit test lead with assigned_tier = 2 → confirm:
  - Tag `tier-2-culture` applied
  - Enrolled in HP — Tier 2 Culture Sequence
- [ ] Submit test lead with assigned_tier = 3 → confirm:
  - Tag `tier-3-technology` applied
  - Enrolled in HP — Tier 3 Technology Sequence
- [ ] Submit test lead with hard_tier3 = true → confirm routed to Tier 3
- [ ] Submit test lead with compliance_risk = true → confirm field stored correctly
- [ ] Submit duplicate email → confirm contact updated (not duplicated), First Name + Phone preserved, `Company` not overwritten
- [ ] Submit with filled company_url honeypot → confirm submission silently rejected
- [ ] Click "Apply-3x3OS-Link" tracked link in test email → confirm:
  - Tag `hp-application` added
  - Tag `email-sequence-active` removed
  - Shared "Application Hot Lead" workflow (pattern doc §8) fires: `hot-lead` tag added, pipeline moved, internal alert sent to both ari@ and jay@
  - Email sequence stops
- [ ] Let sequence complete all 5 emails without clicking apply → confirm:
  - Tag `sequence-completed` added
  - Tag `email-sequence-active` removed
- [ ] Confirm all emails render correctly with merge fields populated
- [ ] Confirm UTM fields pass through and store correctly
- [ ] Verify all smart lists return expected contacts after test submissions
