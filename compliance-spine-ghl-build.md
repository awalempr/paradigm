# Compliance Spine — GHL Build Guide

**Generated:** March 29, 2026
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)

---

## COMPLETED VIA API

### Custom Fields (15/15 Created)

| Field | Key | Type | ID |
|---|---|---|---|
| CS Business Type | contact.cs_business_type | TEXT | m9KqNG93ht690EI5zIV0 |
| CS Revenue Stage | contact.cs_revenue_stage | TEXT | qx0pHM3CDlBSc39fxPhY |
| CS Has Contracts | contact.cs_has_contracts | TEXT | GBisFQAkq1kwjSyf4sDO |
| CS Has Financial Controls | contact.cs_has_financial_controls | TEXT | SEs5exlnD7RDDUhIrUul |
| CS Has Documented Processes | contact.cs_has_documented_processes | TEXT | CsfNH8xKe3TkNnA7D0Ah |
| CS Has Privacy Policy | contact.cs_has_privacy_policy | TEXT | l5yzbL2mtDu9kbqI8SEG |
| CS Has HR Documentation | contact.cs_has_hr_documentation | TEXT | nIkyJIx30B5X1CLLIAdD |
| CS Gaps Identified | contact.cs_gaps_identified | NUMBER | BCWn2mX8xh3cHIT5Ci9k |
| CS Needs Review | contact.cs_needs_review | NUMBER | XBPbjifQLOXpPI8ePheq |
| CS In Place | contact.cs_in_place | NUMBER | nCeYsGtfcRkVHXpRpptf |
| CS Total Exposure Low | contact.cs_total_exposure_low | NUMBER | Wut9JxXqVBVkYjyt5hKQ |
| CS Total Exposure High | contact.cs_total_exposure_high | NUMBER | 4jiwyRqqhvuIii9P05EO |
| CS Gap Track | contact.cs_gap_track | NUMBER | 8PCvVxJ3rF0z5nbnlbM4 |
| CS Source | contact.cs_source | TEXT | hc6dvdIgTgGl9hCUexpY |
| CS Submitted At | contact.cs_submitted_at | DATE | qyljsh5UfsBQ4eK4ahbG |

### Tags (10/10 Created)

| Tag | ID |
|---|---|
| compliance-spine-lead | b21dCDyfvmz6vJMqQGCm |
| cs-high-urgency | C6nRKpRc8CgAeCYkfsZk |
| cs-moderate-urgency | cdH4lHH5My1wbFRYA18K |
| cs-low-urgency | dSP2BpHnsitkbGYKrgB2 |
| cs-no-gaps | KrLZQXGY3zL10ihyrIbt |
| cs-digital | S1UtJndJL83UBqZ6XiSG |
| cs-service | 2Uj2RD4Vcn3J1pzpymiY |
| cs-ecommerce | PcdOhgPBgnsPvl8KaLvF |
| cs-hybrid | 68kZq0eNTcEN4ef76ke1 |
| cs-brick | lWlC8feZoWyAWRXYPGdd |

### Pre-Existing Tags (Confirmed)

| Tag | ID |
|---|---|
| applied-3x3os | aiZSuOijokIIPEarUmVe |
| email-sequence-active | tvajBiyQzWpiwRn2QNIY |
| sequence-completed | GZs1T0JnJ8lLkPF348qh |

### Pipeline: Paradigm Leads (mgAoodSdPPjT4sxBokR2)

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

### Webhook Trigger

- URL: https://services.leadconnectorhq.com/hooks/toKhUkB5BEHB9Jn52ktG/webhook-trigger/8aa75f5b-0548-4727-b4c4-3fa78e5a31b7
- Test payload sent and received successfully
- Netlify env var: WEBHOOK_COMPLIANCE_SPINE

---

## REMAINING MANUAL BUILD — WORKFLOWS

---

### WORKFLOW 1 — Compliance Spine (Intake and Routing)

**Name:** Compliance Spine
**Status:** Publish when complete
**Trigger:** Inbound Webhook (already created, mapping done)

#### Step 1 — Create or Update Contact

Map from webhook payload:
- first_name → First Name
- email → Email
- business_type → CS Business Type
- revenue_stage → CS Revenue Stage
- has_contracts → CS Has Contracts
- has_financial_controls → CS Has Financial Controls
- has_documented_processes → CS Has Documented Processes
- has_privacy_policy → CS Has Privacy Policy
- has_hr_documentation → CS Has HR Documentation
- gaps_identified → CS Gaps Identified
- review_needed → CS Needs Review (note: webhook sends "review_needed")
- in_place → CS In Place
- source → CS Source
- timestamp → CS Submitted At

Duplicate rule: Update existing contact if email matches.

#### Step 2 — Add to Pipeline

- Pipeline: Paradigm Leads
- Stage: Assessment Submitted
- Only if contact is NOT already at a higher stage (position > 1)

#### Step 3 — Add Tag

- Tag: compliance-spine-lead

#### Step 4 — Business Type Tagging (If/Else Branches)

- IF cs_business_type = "digital" → Add tag: cs-digital
- ELSE IF cs_business_type = "service" → Add tag: cs-service
- ELSE IF cs_business_type = "ecommerce" → Add tag: cs-ecommerce
- ELSE IF cs_business_type = "hybrid" → Add tag: cs-hybrid
- ELSE IF cs_business_type = "brick" → Add tag: cs-brick

#### Step 5 — Gap Track Assignment (If/Else Branches)

**Branch A** — IF cs_gaps_identified >= 8:
- Set field cs_gap_track = 1
- Add tag: cs-high-urgency

**Branch B** — ELSE IF cs_gaps_identified >= 4 AND cs_gaps_identified <= 7:
- Set field cs_gap_track = 2
- Add tag: cs-moderate-urgency

**Branch C** — ELSE IF cs_gaps_identified >= 1 AND cs_gaps_identified <= 3:
- Set field cs_gap_track = 3
- Add tag: cs-low-urgency

**Branch D** — ELSE (cs_gaps_identified = 0):
- Set field cs_gap_track = 4
- Add tag: cs-no-gaps

#### Step 6 — Route to Email Sequence (If/Else Branches)

- IF cs_gap_track = 1 → Enroll in workflow "CS — Track 1 High Urgency"
- ELSE IF cs_gap_track = 2 → Enroll in workflow "CS — Track 2 Moderate Urgency"
- ELSE IF cs_gap_track = 3 → Enroll in workflow "CS — Track 3 Low Urgency"
- ELSE → Enroll in workflow "CS — Track 4 No Gaps"

After enrollment (all branches):
- Add tag: email-sequence-active
- Move pipeline stage to: Email Sequence Active (only if currently at Assessment Submitted)

#### Step 7 — Internal Notification Email

**To:** jay@paradigmconsulting.co

**Subject:** New Compliance Spine Lead — {{contact.first_name}} — {{contact.cs_gaps_identified}} Gaps — ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} Exposure

**Body:**
```
Name: {{contact.first_name}}
Email: {{contact.email}}
Business Type: {{contact.cs_business_type}}
Revenue Stage: {{contact.cs_revenue_stage}}
Gaps Identified: {{contact.cs_gaps_identified}}
Needs Review: {{contact.cs_needs_review}}
In Place: {{contact.cs_in_place}}
Total Exposure Low: ${{contact.cs_total_exposure_low}}
Total Exposure High: ${{contact.cs_total_exposure_high}}
Gap Track: {{contact.cs_gap_track}} (1 = high urgency, 2 = moderate, 3 = low, 4 = no gaps)
Has Contracts: {{contact.cs_has_contracts}}
Has Financial Controls: {{contact.cs_has_financial_controls}}
Has Documented Processes: {{contact.cs_has_documented_processes}}
Has Privacy Policy: {{contact.cs_has_privacy_policy}}
Has HR Documentation: {{contact.cs_has_hr_documentation}}
Submitted: {{contact.cs_submitted_at}}
Check contact record for assessment suite data if applicable
```

---

### WORKFLOW 2A — CS Track 1 High Urgency (8+ gaps)

**Name:** CS — Track 1 High Urgency
**Status:** Publish when complete
**Trigger:** Enrolled from Compliance Spine intake workflow

**Goal Step:** Contact clicks tracked link tagged "Apply-3x3OS-Link"
When goal fires:
- Add tag: applied-3x3os
- Remove tag: email-sequence-active
- Move pipeline stage to: Application Link Clicked
- Stop all further steps immediately

#### Email 1 — Send immediately

**Subject:** Your Compliance Spine results, {{contact.first_name}}
**Preview:** You identified {{contact.cs_gaps_identified}} compliance gaps. Here is what that means.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Compliance Spine on the Paradigm Consulting site.

I want to give you a direct read on what your results mean.

Your checklist identified {{contact.cs_gaps_identified}} compliance gaps across your business. Based on your business type and revenue stage, the estimated unaddressed exposure across those gaps is ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}}.

That number is not theoretical. It reflects the actual regulatory fines, litigation costs, fraud exposure, and valuation discount that businesses at your stage carry when these gaps go unaddressed. Most founders do not encounter the cost until something goes wrong — an FTC inquiry, a contractor dispute, a platform ban, a payment processor termination. By then the cost of the gap is always higher than the cost of closing it would have been.

The gaps your checklist identified are not random. They are concentrated in the areas where scaling businesses most commonly build exposure without realizing it. And they are correctable.

Over the next two weeks I want to walk you through the 3x3OS Compliance pillar — what it audits, what it installs, and why addressing the foundation first changes the trajectory of everything the business builds on top of it.

If anything in your checklist felt immediately urgent, reply and tell me which category it was. I read every response.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Checklist — link to compliance-spine results page]**

#### Wait 2 days

#### Email 2

**Subject:** The compliance gap most founders discover too late
**Preview:** It is not the one that feels risky. It is the one that has been invisible.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Compliance Spine and identified {{contact.cs_gaps_identified}} gaps across your business.

I want to talk about how compliance exposure actually becomes a cost — because it is almost never the way founders expect.

Founders who have compliance gaps rarely encounter them as a single dramatic event. They encounter them as a slow accumulation of friction. A refund dispute that escalates because the policy was unclear. A contractor who leaves and claims ownership of work they created because there was no IP assignment. A platform ban that comes without warning because the ad copy crossed a line that was never documented. A financial discrepancy that went undetected for 14 months because no one was reconciling monthly.

Each of these individually feels manageable. Collectively they represent the ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} exposure your checklist identified.

The 3x3OS Compliance pillar is not a legal retainer and it is not a compliance course. It is a structured 90-day installation that closes your specific gaps in the right sequence — starting with the highest exposure items and building toward a governance infrastructure that prevents new gaps from opening as the business scales.

The checklist you generated is the starting point. The engagement is how you work through it.

Reply if you want to talk about where to start before the application.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 2 days

#### Email 3

**Subject:** What the Compliance pillar of the 3x3OS actually installs
**Preview:** Not a review. Not a report. A working infrastructure.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You identified {{contact.cs_gaps_identified}} compliance gaps carrying an estimated ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} in unaddressed exposure.

I want to be specific about what the 3x3OS Compliance pillar installs because it is different from what most founders imagine when they hear compliance.

It is not a legal audit that produces a report you file away. It is not a course that teaches you what compliance means. It is not a retainer where a lawyer reviews things on a monthly call.

It is a structured 90-day installation across three compliance layers.

The first layer is legal and regulatory infrastructure — income claim compliance, marketing material review, platform terms alignment, and entity structure review. This layer protects the business from the exposure that shows up as fines, bans, and regulatory inquiries.

The second layer is financial and operational governance — spending authority documentation, financial controls, SOP development, and decision authority frameworks. This layer protects the business from internal exposure and creates the infrastructure that makes the business transferable and fundable.

The third layer is contractual and HR infrastructure — client agreements, vendor contracts, IP assignments, NDA frameworks, and compensation documentation. This layer protects the business from the relationship-level exposure that most founders only discover when a relationship breaks down.

At the end of 90 days, the gaps your checklist identified are closed. The infrastructure is documented. And the business has a compliance foundation that holds under growth, transaction, and regulatory scrutiny.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 3 days

#### Email 4

**Subject:** What closing compliance gaps is worth at exit
**Preview:** The number is specific. Here is how it is calculated.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

One week ago you completed the Compliance Spine. I want to talk about what closing the gaps your checklist identified is worth — not just in avoided costs but in enterprise value.

Businesses with documented compliance infrastructure command measurably higher multiples than businesses with compliance gaps at the same revenue level. The premium exists for two reasons.

First, a buyer or investor conducting due diligence on a business with undocumented governance, missing contracts, and unreviewed regulatory exposure applies a risk discount to the valuation. That discount is not arbitrary — it reflects the cost of closing the gaps post-acquisition, plus the liability the buyer is absorbing. In most transactions, this discount is 0.5x to 1.5x EBITDA.

Second, businesses without compliance infrastructure take longer to close. Due diligence uncovers gaps. Gaps require remediation. Remediation takes time. Time kills transactions. The businesses that transact cleanly and at premium valuations are the ones where the compliance work was done before the process started.

Your estimated exposure of ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} is the cost side. The enterprise value premium from a clean compliance infrastructure is the upside. Both are in play simultaneously.

The 3x3OS engagement closes the gaps in 90 days. The application is open.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 7 days

#### Email 5

**Subject:** One last thing, {{contact.first_name}}
**Preview:** The gaps do not close on their own. The exposure does not shrink while you wait.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two weeks ago you completed the Compliance Spine and identified {{contact.cs_gaps_identified}} compliance gaps with an estimated ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} in unaddressed exposure.

I have shared what those gaps mean for your regulatory risk, your financial exposure, and your enterprise value. I am not going to say it again.

What I want to say is simpler.

Every day those gaps are open, the exposure is real. The regulatory environment does not pause while founders decide whether to address their compliance infrastructure. The FTC does not wait. Platform terms do not wait. Contractors without NDAs do not wait.

The founders who address compliance before something goes wrong pay the cost of installation. The founders who address it after pay the cost of remediation — which is always higher.

The 3x3OS engagement installs the compliance infrastructure your checklist revealed is missing. 90 days. Specific deliverables. Built around the exact gaps your checklist identified.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

P.S. Your highest exposure category is where the engagement starts. That is the gap that costs the most to leave open.

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 1 day
#### Remove tag: email-sequence-active
#### Add tag: sequence-completed
#### If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### WORKFLOW 2B — CS Track 2 Moderate Urgency (4-7 gaps)

**Name:** CS — Track 2 Moderate Urgency
**Status:** Publish when complete
**Trigger:** Enrolled from Compliance Spine intake workflow

**Goal Step:** Same as Track 1 (Apply-3x3OS-Link click → tag, untag, move stage, stop)

#### Email 1 — Send immediately

**Subject:** Your Compliance Spine results, {{contact.first_name}}
**Preview:** You identified {{contact.cs_gaps_identified}} compliance gaps. Here is what that reveals.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Compliance Spine on the Paradigm Consulting site.

Your checklist identified {{contact.cs_gaps_identified}} compliance gaps with an estimated ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} in unaddressed exposure.

Here is what that actually means at your stage.

You have infrastructure in some areas. Your checklist showed items marked IN PLACE — that work matters and it will not be undone. But the gaps that remain are concentrated in specific categories and they represent real exposure that compounds as the business grows.

The pattern we see most often at your gap count is partial compliance — some contracts in place but not all, some financial controls but not fully documented, some data practices addressed but not fully disclosed. Partial compliance creates a false sense of security that is actually more dangerous than no compliance at all, because it means the business assumes coverage it does not fully have.

Over the next two weeks I want to walk you through what a complete compliance infrastructure looks like and why the gaps that remain in your checklist carry disproportionate risk relative to the cost of closing them.

Reply if anything on your checklist felt immediately relevant.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Checklist — link to compliance-spine results page]**

#### Wait 2 days

#### Email 2

**Subject:** Partial compliance is not the same as protected
**Preview:** The gaps that remain carry the same weight as if nothing was in place.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Compliance Spine and identified {{contact.cs_gaps_identified}} gaps.

I want to name something specific about where you are that most founders in your position do not fully appreciate.

The compliance items marked IN PLACE on your checklist are genuinely protected. The items marked GAP IDENTIFIED carry their full exposure regardless of how many other items are in place around them.

A business with 15 compliance items in place and 5 gaps does not have 75% protection. It has 100% exposure in the five gap areas. An FTC inquiry about income claims does not account for the fact that your contracts are solid. A contractor IP dispute does not care that your privacy policy is current. Each gap carries its own independent risk.

Your estimated exposure of ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} reflects the gap areas specifically — not an average across the whole checklist.

The 3x3OS Compliance pillar closes the remaining gaps in 90 days. It does not rebuild what is already working. It installs what is still missing and creates the governance layer that prevents new gaps from opening as the business scales.

Reply if you want to talk about which gaps are highest priority before the application.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 2 days

#### Email 3

**Subject:** The compliance infrastructure that scaling businesses actually need
**Preview:** There is a difference between being defensible and being protected.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You identified {{contact.cs_gaps_identified}} compliance gaps carrying ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} in estimated exposure.

I want to draw a specific distinction that matters at your stage.

There is a difference between a compliance posture that would hold up under scrutiny and one that would not. Most scaling businesses have compliance practices that feel reasonable from the inside — some contracts, some policies, some documentation. The test is not how it feels from the inside. The test is how it looks from the outside when someone is specifically looking for gaps.

A regulatory investigator. An opposing attorney. An acquirer's due diligence team. A payment processor auditing chargeback patterns. These are not people who will give partial credit for partial compliance. They are looking for gaps and they are specifically trained to find them.

The 3x3OS Compliance pillar installs the infrastructure that passes that external scrutiny — not just the infrastructure that feels sufficient from the inside. That is the difference between being defensible and being protected.

Your checklist identified where the external vulnerabilities are. The engagement closes them.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 3 days

#### Email 4

**Subject:** Closing 4 to 7 compliance gaps is the highest-leverage 90 days available to your business
**Preview:** Not because the work is dramatic. Because the exposure is real and the cost is fixed.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Compliance Spine.

I want to make a specific argument about prioritization at your stage.

With {{contact.cs_gaps_identified}} compliance gaps and ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} in estimated exposure, the 90-day cost of closing those gaps through the 3x3OS engagement is fixed. The cost of leaving them open is not — it is unbounded and time-dependent.

The fixed cost of closing the gaps is known, scheduled, and finite. The cost of an FTC enforcement action, a contractor dispute, a data breach, or a payment processor termination is none of those things. It arrives without schedule, compounds through litigation and remediation, and always exceeds the cost of prevention.

Most of the compliance items on your checklist that are marked as gaps are not complex to close. They require documentation, legal review, and implementation — not months of work. The reason they are gaps is not because closing them is hard. It is because they were never prioritized.

The 3x3OS engagement makes them the priority for 90 days and installs them correctly so they do not require revisiting as the business grows.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 7 days

#### Email 5

**Subject:** The compliance work that prevents the problems you have not had yet, {{contact.first_name}}
**Preview:** The gaps are open. The exposure is real. The application is five minutes.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two weeks ago you completed the Compliance Spine and identified {{contact.cs_gaps_identified}} compliance gaps.

I want to close this sequence with something direct.

The founders who address compliance proactively and the founders who address it reactively end up in the same place eventually. The difference is the cost of getting there and the condition of the business when they arrive.

Proactive compliance installation through the 3x3OS engagement costs a fixed amount, takes 90 days, and produces documented infrastructure that protects the business, supports scale, and commands a premium at exit.

Reactive compliance remediation — after an FTC inquiry, a payment processor termination, a contractor lawsuit, or a failed acquisition due diligence — costs more, takes longer, happens at the worst possible time, and produces a business that has been through something rather than one that was built to withstand it.

Your checklist identified the gaps. The exposure is ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}}. The gaps do not close on their own.

The application is open. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 1 day
#### Remove tag: email-sequence-active
#### Add tag: sequence-completed
#### If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### WORKFLOW 2C — CS Track 3 Low Urgency (1-3 gaps)

**Name:** CS — Track 3 Low Urgency
**Status:** Publish when complete
**Trigger:** Enrolled from Compliance Spine intake workflow

**Goal Step:** Same as Track 1 (Apply-3x3OS-Link click → tag, untag, move stage, stop)

#### Email 1 — Send immediately

**Subject:** Your Compliance Spine results, {{contact.first_name}}
**Preview:** You identified {{contact.cs_gaps_identified}} compliance gaps. Here is what that means.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Compliance Spine on the Paradigm Consulting site.

Your checklist identified {{contact.cs_gaps_identified}} compliance gaps. That is a strong result — most businesses at your revenue stage carry significantly more exposure than your checklist revealed.

The compliance infrastructure you have built matters. The work you have done to close gaps before they become problems is exactly what protects a business as it scales.

The remaining gaps — the ones your checklist marked as GAP IDENTIFIED — still carry their full exposure regardless of how strong the rest of your infrastructure is. Your estimated remaining exposure is ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}}.

At your position, closing those specific gaps is the final step toward a compliance infrastructure that would pass institutional scrutiny — due diligence, regulatory review, or investor assessment — without remediation.

Over the next two weeks I want to walk you through what investment-grade compliance looks like at your stage and why the last few gaps are often the ones with the most disproportionate risk.

Reply if any of the remaining gaps felt immediately relevant.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Checklist — link to compliance-spine results page]**

#### Wait 2 days

#### Email 2

**Subject:** The last compliance gaps are often the most disproportionately risky
**Preview:** Not because of their complexity. Because of what they reveal to an outside reviewer.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Compliance Spine. With {{contact.cs_gaps_identified}} gaps remaining, you are closer to a complete compliance infrastructure than most businesses at your stage.

I want to make a specific point about the gaps that remain.

In any external review — due diligence, regulatory inquiry, investor assessment — the reviewer is not averaging your compliance score. They are identifying every gap and assessing each one independently. A business with one unresolved compliance gap looks like a business with one unresolved compliance gap to someone specifically looking for gaps, regardless of how clean everything else is.

The gaps your checklist identified are visible to anyone who knows where to look. At your stage — where you have already done the majority of the compliance work — closing the remaining items is both the highest-leverage action available and the lowest-effort work remaining. The hard work is done. What remains is specific and finite.

The 3x3OS engagement at your position is not a rebuild. It is a close-out — targeting the specific gaps your checklist identified and adding the governance layer that makes the whole infrastructure self-maintaining as the business continues to grow.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 2 days

#### Email 3

**Subject:** What investment-grade compliance looks like — and how close you are to it
**Preview:** The distance is shorter than you might think.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You identified {{contact.cs_gaps_identified}} compliance gaps with ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} in remaining exposure.

I want to define investment-grade compliance specifically because it is relevant to where you are.

Investment-grade compliance is not perfect compliance. It is compliance that would pass a thorough external review without requiring post-review remediation. It means every material gap has been identified, documented, and closed. It means the governance infrastructure is documented well enough that someone who has never worked in the business could read it and understand how the business protects itself. And it means the infrastructure has been reviewed recently enough that it reflects current operations rather than the state of the business at an earlier stage.

At your current gap count, you are close to this standard. The remaining {{contact.cs_gaps_identified}} gaps are the specific items standing between where you are and a compliance infrastructure that would hold under institutional scrutiny.

That gap is worth closing before a transaction, investment, or regulatory conversation begins — not during one.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 3 days

#### Email 4

**Subject:** You have done the hard work. Here is what completing it looks like.
**Preview:** Closing the last few gaps is faster than closing the first ones. Here is why.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Compliance Spine. Your strong result reflects real work you have already done on your business infrastructure. I want to acknowledge that specifically.

The businesses that close compliance gaps proactively — before they need to, before someone is specifically looking for them — are the ones that scale without the drag that unaddressed exposure creates. You are in that category. The work you have done is real.

The {{contact.cs_gaps_identified}} gaps that remain are the last items on the list. And because you have already built the surrounding infrastructure, closing them is faster and more straightforward than it would be for a business starting from scratch.

The 3x3OS engagement at your position is targeted and specific. It addresses the gaps your checklist identified, adds the maintenance cadence that keeps the infrastructure current as the business grows, and produces the documentation that makes the full compliance picture presentable to anyone outside the business.

Application-only. Reviewed personally.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 7 days

#### Email 5

**Subject:** The compliance finish line is closer than most founders get, {{contact.first_name}}
**Preview:** You are further along than most. Here is what the last step looks like.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two weeks ago you completed the Compliance Spine. With {{contact.cs_gaps_identified}} gaps remaining you are in the top tier of compliance readiness for businesses at your stage.

What remains is specific, closable, and worth closing before the business enters its next phase of growth.

The 3x3OS engagement at your position is a targeted installation — 90 days focused on the specific gaps your checklist identified plus the governance maintenance layer that ensures the infrastructure holds as the business scales. Not a rebuild. Not a generic compliance program. A close-out of the specific items standing between where you are and a complete institutional compliance infrastructure.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

P.S. At your position the engagement is scoped specifically to your remaining gaps. We will confirm the exact scope in the application review.

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 1 day
#### Remove tag: email-sequence-active
#### Add tag: sequence-completed
#### If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### WORKFLOW 2D — CS Track 4 No Gaps (0 gaps)

**Name:** CS — Track 4 No Gaps
**Status:** Publish when complete
**Trigger:** Enrolled from Compliance Spine intake workflow

**Goal Step:** Same as Track 1 (Apply-3x3OS-Link click → tag, untag, move stage, stop)

#### Email 1 — Send immediately

**Subject:** Your Compliance Spine results, {{contact.first_name}}
**Preview:** No gaps identified. Here is what that means — and what maintaining it requires.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

You just completed the Compliance Spine on the Paradigm Consulting site.

Your checklist identified no compliance gaps based on your current infrastructure answers. That is a strong result and it reflects real work you have done to protect your business.

I want to be direct about what that result means and what it does not mean.

It means your current infrastructure is solid based on your self-assessment across five compliance control areas. It does not mean your compliance posture is static or that new gaps cannot open as the business grows, regulations change, and operations evolve.

Compliance infrastructure that was complete at $500K in revenue may have gaps at $2M. Contracts that were appropriate for a team of five may need revision at fifteen. A privacy policy that was accurate when it was written may not reflect current data practices two years later.

The businesses that maintain clean compliance posture over time are not the ones that close gaps once. They are the ones with a governance cadence that audits and updates the infrastructure annually.

Over the next two weeks I want to walk you through what maintaining institutional compliance looks like as the business continues to scale — and how the 3x3OS engagement protects what you have already built.

Matt
Founder, Paradigm Consulting

**[CTA Button: Review My Checklist — link to compliance-spine results page]**

#### Wait 2 days

#### Email 2

**Subject:** Compliance infrastructure decays without active maintenance
**Preview:** What was complete at your last stage may already have gaps at your current one.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two days ago you completed the Compliance Spine with a clean result.

I want to name the specific risk that exists even when compliance is currently strong.

Compliance infrastructure has a shelf life. The specific items that create expiration are predictable: revenue growth (a new revenue stage often creates new regulatory obligations), team growth (new team members need NDAs, new roles need compensation documentation, new contractors need classification review), platform changes (Meta, Google, and payment processors update their terms regularly and businesses that were compliant last year may not be this year), and regulatory changes (FTC guidance, state privacy laws, and tax obligations evolve continuously).

A business that was fully compliant 18 months ago and has not audited since is not necessarily fully compliant today. The infrastructure exists but it has not been maintained against current operating conditions.

The 3x3OS Compliance pillar includes the maintenance governance layer — the quarterly review cadence, the update protocol, and the documentation practices that ensure the compliance infrastructure reflects current operations at every stage of growth rather than the state of the business at the last time someone looked.

Your clean checklist result means the foundation is solid. The engagement protects and extends it.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 2 days

#### Email 3

**Subject:** What compliance maintenance looks like at your stage
**Preview:** The audit cadence that keeps institutional infrastructure current.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Your Compliance Spine showed a strong infrastructure. I want to be specific about what maintaining that infrastructure at your stage actually requires.

Annual compliance audit. Every 12 months, the full checklist is reviewed against current operations. Contracts are verified to reflect current scope and terms. Financial controls are confirmed against current team structure and spending patterns. Data practices are audited against current collection and usage. HR documentation is reviewed against current team composition.

Platform terms review. Meta, Google, payment processors, email platforms, and any marketplace the business operates on update their terms regularly. A quarterly terms review confirms the business remains compliant with each platform it depends on.

New relationship documentation. Every new contractor, vendor, partner, and significant client relationship triggers the appropriate documentation protocol before the relationship begins — not after it has been operating informally for months.

Regulatory monitoring. FTC guidance, state privacy law updates, and tax obligation changes are monitored for changes that affect the business's current practices.

This is not an enormous amount of work. It is a quarterly 90-minute governance cadence and the habit of treating compliance as a living system rather than a completed project.

The 3x3OS engagement installs this cadence alongside closing any gaps that open between the checklist and the audit.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 3 days

#### Email 4

**Subject:** Institutional compliance is a posture, not a project
**Preview:** The businesses that hold their compliance advantage treat it as a system.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A week ago you completed the Compliance Spine with strong results.

I want to make a final point about what separates the businesses that hold their compliance advantage over time from the ones that let it decay.

It is not the quality of the initial infrastructure. It is whether the infrastructure is treated as a living system or a completed project.

The businesses that maintain institutional compliance over time have three things in place. A documented review cadence that audits the infrastructure annually and updates it based on what has changed. A new relationship protocol that ensures every new contractor, vendor, and client relationship triggers the right documentation before the relationship begins. And a regulatory monitoring habit that tracks the changes in FTC guidance, platform terms, and state law that affect current operations.

None of this is burdensome when it is systematized. It is burdensome when it is ad hoc — when someone remembers to review something, when a new relationship gets documented eventually, when a regulatory change gets addressed after someone notices.

The 3x3OS engagement at your position installs the maintenance system that keeps your existing infrastructure current without requiring the founder to manually manage it.

Application-only. Reviewed personally.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 7 days

#### Email 5

**Subject:** You built something worth protecting, {{contact.first_name}}
**Preview:** The last step is the system that makes sure it stays built.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

Two weeks ago you completed the Compliance Spine with a clean result.

The compliance infrastructure you have built is a genuine competitive advantage. Most businesses at your stage are carrying significant exposure that you have already addressed. That foundation protects the business, supports scale, and commands a premium if you ever choose to transact.

The question now is whether you have the maintenance system in place to keep it current as the business grows.

The 3x3OS engagement at your position installs that system — the audit cadence, the update protocols, the review triggers, and the documentation practices that make your compliance infrastructure self-maintaining rather than founder-dependent.

Application-only. Reviewed personally. Five minutes.

Matt
Founder, Paradigm Consulting

P.S. At your position the engagement is focused entirely on protection and maintenance governance. We will confirm the exact scope in the application review.

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Wait 1 day
#### Remove tag: email-sequence-active
#### Add tag: sequence-completed
#### If contact is still at pipeline stage "Email Sequence Active" → move to: Nurture - Long Term

---

### WORKFLOW 3 — CS Application Link Clicked

**Name:** CS — Application Link Clicked
**Status:** Publish when complete
**Trigger:** Contact clicks tracked link tagged "Apply-3x3OS-Link" AND tag compliance-spine-lead exists

> **NOTE:** Check whether the existing FEI/CMA/FBE/12MCC Application Link Clicked workflows already handle this globally. If so, skip this workflow.

#### Step 1 — Check for tag applied-3x3os. If exists, stop workflow.
#### Step 2 — Add tag: applied-3x3os
#### Step 3 — Move pipeline stage to: Application Link Clicked
#### Step 4 — Remove tag: email-sequence-active
#### Step 5 — Remove contact from all active CS email sequence workflows
#### Step 6 — Wait 10 minutes

#### Step 7 — Internal notification to jay@paradigmconsulting.co

**Subject:** Apply Link Clicked — {{contact.first_name}} — {{contact.email}} — Compliance Spine Lead

**Body:**
```
Name: {{contact.first_name}}
Email: {{contact.email}}
Gaps Identified: {{contact.cs_gaps_identified}}
Gap Track: {{contact.cs_gap_track}}
Total Exposure: ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}}
Business Type: {{contact.cs_business_type}}
Revenue Stage: {{contact.cs_revenue_stage}}
Check contact record for assessment suite data if applicable
Submitted: {{contact.cs_submitted_at}}
```

#### Step 8 — Send contact email

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

### WORKFLOW 4 — CS Re-Engagement 30 Day

**Name:** CS — Re-Engagement 30 Day
**Status:** Publish when complete
**Trigger:** Tag = compliance-spine-lead AND pipeline stage = Assessment Submitted OR Email Sequence Active AND last activity > 30 days ago AND tag applied-3x3os does NOT exist

#### Step 1 — Send Email

**Subject:** Still thinking about it, {{contact.first_name}}?
**Preview:** Your compliance gaps are still open. The exposure has not changed.
**From:** Matt | Founder, Paradigm Consulting

**Body:**

{{contact.first_name}},

A few weeks ago you completed the Compliance Spine and identified {{contact.cs_gaps_identified}} compliance gaps with ${{contact.cs_total_exposure_low}} to ${{contact.cs_total_exposure_high}} in estimated exposure.

The gaps are still there. Compliance exposure does not self-correct and it does not shrink while you wait.

If the timing was not right when we first reached out, it may be different now. The 3x3OS engagement is still accepting applications.

Five minutes. Reviewed personally. No obligation.

Matt
Founder, Paradigm Consulting

**[CTA Button: Apply for 3x3OS — link to application page]**

#### Step 2 — Wait 7 days

#### Step 3 — If no response and no apply click:
- Remove tag: email-sequence-active
- Add tag: sequence-completed
- Move pipeline to: Nurture - Long Term

---

## SMART LISTS

Build these in GHL > Contacts > Smart Lists:

| List Name | Filters |
|---|---|
| CS — All Leads | Tag = compliance-spine-lead |
| CS — High Urgency (8+ Gaps) | Tag = cs-high-urgency |
| CS — Moderate Urgency (4-7 Gaps) | Tag = cs-moderate-urgency |
| CS — Active Sequences | Tag = email-sequence-active AND Tag = compliance-spine-lead |
| CS — Sequence Completed Not Applied | Tag = sequence-completed AND Tag = compliance-spine-lead AND Tag applied-3x3os does NOT exist |
| CS — High Exposure Leads | Tag = compliance-spine-lead AND cs_total_exposure_high > 200000 |
| CS — Digital Business Leads | Tag = compliance-spine-lead AND Tag = cs-digital |
| CS — Service Business Leads | Tag = compliance-spine-lead AND Tag = cs-service |
| CS — Revenue Stage 500K to 2M | Tag = compliance-spine-lead AND cs_revenue_stage = "500k-2m" |
| CS — Revenue Stage 2M Plus | Tag = compliance-spine-lead AND (cs_revenue_stage = "2m-10m" OR cs_revenue_stage = "over10m") |
| CS — Also In Assessment Suite | Tag = compliance-spine-lead AND (Tag = fei-lead OR Tag = cma-lead OR Tag = fbe-lead OR Tag = 12mcc-lead) |
| CS — High Urgency High Revenue (Priority) | Tag = cs-high-urgency AND (cs_revenue_stage = "500k-2m" OR cs_revenue_stage = "2m-10m" OR cs_revenue_stage = "over10m") |

---

## FINAL TESTING CHECKLIST

After all workflows are built and published:

- [ ] Submit test lead with 0 gaps — confirm Track 4, tag cs-no-gaps, gap_track = 4
- [ ] Submit test lead with 2 gaps — confirm Track 3, tag cs-low-urgency, gap_track = 3
- [ ] Submit test lead with 5 gaps — confirm Track 2, tag cs-moderate-urgency, gap_track = 2
- [ ] Submit test lead with 10 gaps — confirm Track 1, tag cs-high-urgency, gap_track = 1
- [ ] Confirm all custom fields populate correctly on contact record
- [ ] Confirm business type tags apply correctly (cs-digital, cs-service, etc.)
- [ ] Confirm pipeline stage moves to Assessment Submitted then Email Sequence Active
- [ ] Confirm internal notification email delivers to jay@paradigmconsulting.co with all merge fields
- [ ] Confirm Day 0 emails send from "Matt | Founder, Paradigm Consulting"
- [ ] Confirm Apply-3x3OS-Link tracked links work in all email CTAs
- [ ] Confirm goal step fires on link click (tag applied-3x3os, remove email-sequence-active, move stage)
- [ ] Confirm contacts with existing assessment data update on same record (no duplicate)
- [ ] Confirm CS High Urgency High Revenue smart list surfaces correctly
- [ ] Verify print checklist button on compliance-spine.html triggers confetti and print dialog
