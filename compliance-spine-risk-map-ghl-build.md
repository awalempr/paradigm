# Compliance Spine Risk Map — GHL Build Guide

**Generated:** May 16, 2026
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)
**Page:** https://paradigmconsulting.io/compliance-spine-risk-map
**Offer:** $4,995 productized compliance deliverable, two-week delivery, credited toward a full Compliance Spine engagement if the buyer continues within 90 days.

---

## COMPLETED VIA API

### Custom Fields (5/5 Created)

| Field | Key | Type | ID |
|---|---|---|---|
| RM Product Inquiry | `contact.rm_product_inquiry` | TEXT | Jm9a29KKOChlOTuP14cP |
| RM Offer Price | `contact.rm_offer_price` | TEXT | ZMhNGZZXXylYiYZ2Di3I |
| RM Company | `contact.rm_company` | TEXT | HZBntuLGEJXoDSONOyZK |
| RM Submitted At | `contact.rm_submitted_at` | DATE | 5A2Ogrq6oFRt52hDh6rJ |
| RM Stage | `contact.rm_stage` | TEXT | 6mEQoA9YJheWQh5h46Sj |

Script: [scripts/ghl-create-rm-fields.mjs](scripts/ghl-create-rm-fields.mjs)

### Tags (6/6 Created)

| Tag | ID |
|---|---|
| compliance-spine-risk-map-lead | lbGv2Nnob2c2WZGH3Jx4 |
| compliance-spine-risk-map-booked | OjAoLTZ9mmuubJElKYRi |
| compliance-spine-risk-map-paid | RfhNiAMtmjg7ryycivY4 |
| compliance-spine-risk-map-delivered | DRku46AmxzSxNQTItPhf |
| compliance-spine-risk-map-converted | mVwpoR0xqW31xuxYmMfF |
| compliance-spine-risk-map-cold | xwdRSDX0u5F8OFSzI71p |

Script: [scripts/ghl-create-rm-tags.mjs](scripts/ghl-create-rm-tags.mjs)

### Pipeline: Compliance Spine Risk Map (✅ Created in UI)

- **Pipeline ID:** `ov7qEKgULph4h7Fm8EqB`

| Position | Stage | ID |
|---|---|---|
| 0 | Requested | d68ebc25-fe0a-4548-b9ed-2e65ff5d7e2e |
| 1 | Discovery Booked | e04ace51-eddf-498e-bb67-d5587fd0a1cf |
| 2 | In Delivery | 87c083c4-51e6-4992-b028-85d37b98185e |
| 3 | Delivered | 431ddb4a-98c4-484a-b936-b980cca54b62 |
| 4 | Converted | abe5f34f-6c64-44ef-aaf8-c6d381648041 |
| 5 | Nurture | 614a60dd-4e36-4e36-a086-99edd3eb0e88 |
| 6 | Lost | bf940262-ce3a-4c8e-822b-ce4c1c8378c0 |

Read fallback script (pulls IDs via API): [scripts/ghl-create-rm-pipeline.mjs](scripts/ghl-create-rm-pipeline.mjs)

---

## Why this is a separate workflow

The Compliance Spine intake (workflow `compliance-spine`) handles **assessment leads** — operators who filled out a free checklist and need a 5-email nurture sequence keyed to gap count. That flow is engineered for cold-to-warm conversion.

The Risk Map is a different motion entirely. Buyers who fill out this form are not assessment-takers; they are **buyers who clicked the price card and asked Ari's team to schedule the discovery call.** The right response is operator-fast acknowledgment, an internal alert to Ari, and a short structured intake — not a five-email nurture drip.

Keeping the workflows separate lets us:
- Route Risk Map leads directly to Ari without cross-contaminating the assessment pipeline.
- Measure Risk Map → full Compliance Spine engagement conversion cleanly.
- Run a different cadence (operator handoff in <1 business day) without modifying the assessment workflow.

---

## What's wired up in code already

- Form posts to `/api/webhook` with `source: 'compliance-spine-risk-map'`.
- Webhook proxy at `netlify/functions/webhook.js` maps `compliance-spine-risk-map` to `process.env.WEBHOOK_COMPLIANCE_SPINE_RISK_MAP`.
- Form fields delivered to GHL: `name`, `firstName`, `email`, `phone`, `company`, `product_inquiry` (`"Compliance Spine Risk Map"`), `offer_price` (`"$4995"`), `source`, `lead_source`.
- Honeypot field (`company_url`) is rejected server-side; 5 req/min/IP rate limit; phone normalized to `+1 (XXX) XXX-XXXX` before GHL receives it.

---

## REMAINING MANUAL BUILD — webhook trigger + 3 workflows (~40 min)

> Custom fields, tags, and the pipeline are all in place (see top). The list below is what's left.

---

### 1. Create the inbound webhook trigger

GHL → Automation → Workflows → New Workflow → Trigger: Inbound Webhook → Save → copy the trigger ID from the generated URL.

- **URL format:** `https://services.leadconnectorhq.com/hooks/{LOCATION_ID}/webhook-trigger/{TRIGGER_ID}`
- Set the Netlify environment variable `WEBHOOK_COMPLIANCE_SPINE_RISK_MAP` to the trigger ID portion only (the UUID after `/webhook-trigger/`).

Send a test payload from the live page (or via curl through `/api/webhook`) to confirm the webhook receives and parses the fields.

---

### 2. Custom fields — ✅ DONE (created via API)

All 5 custom fields were created via [scripts/ghl-create-rm-fields.mjs](scripts/ghl-create-rm-fields.mjs). IDs are in the **COMPLETED VIA API** section at the top of this doc.

**Field purposes for workflow mapping reference:**

| Field | Purpose |
|---|---|
| RM Product Inquiry | Stores `"Compliance Spine Risk Map"` so multi-product analytics can group |
| RM Offer Price | Stores `"$4995"` for revenue forecasting against pipeline |
| RM Company | Buyer's company name (separate from any reserved `contact.company` slot) |
| RM Submitted At | Used for SLA dashboards and review-call scheduling math |
| RM Stage | Current delivery stage: `requested` → `discovery-booked` → `workbook-sent` → `discovery-done` → `deliverable-sent` → `review-done` → `converted` / `closed` |

---

### 3. Tags — ✅ DONE (created via API)

All 6 tags were created via [scripts/ghl-create-rm-tags.mjs](scripts/ghl-create-rm-tags.mjs). IDs are in the **COMPLETED VIA API** section at the top.

**Tag purposes for workflow mapping reference:**

| Tag | When applied |
|---|---|
| `compliance-spine-risk-map-lead` | Every inbound submission |
| `compliance-spine-risk-map-booked` | Discovery call is scheduled |
| `compliance-spine-risk-map-paid` | $4,995 payment is received |
| `compliance-spine-risk-map-delivered` | Written deliverable is sent |
| `compliance-spine-risk-map-converted` | Buyer signs the full Compliance Spine engagement (the $4,995 credit triggers here) |
| `compliance-spine-risk-map-cold` | No-booking follow-up exhausted; buyer moves to long-term nurture |

---

### 4. Pipeline — ✅ DONE (built in UI)

The Risk Map is its own delivery motion, not a continuation of the Paradigm Leads sales pipeline. A standalone pipeline makes reporting cleaner ("of N Risk Maps sold, X converted to full engagement") and prevents Risk Map leads from cluttering the assessment-driven sales view.

**Pipeline name:** `Compliance Spine Risk Map`

**Stages (7, in order):**

| Position | Stage | When used |
|---|---|---|
| 1 | Requested | Inbound form submitted, no contact yet |
| 2 | Discovery Booked | 90-min discovery call scheduled |
| 3 | In Delivery | Workbook sent, call done, deliverable in flight |
| 4 | Delivered | Written deliverable sent, review call scheduled or done |
| 5 | Converted | Buyer signed the full Compliance Spine engagement (credit applied) |
| 6 | Nurture | Cold leads who didn't book or who didn't convert — long-term cadence target |
| 7 | Lost | Confirmed no-go (timing, fit, or explicit decline) |

**Build steps (GHL UI):**

1. Open GHL → **Opportunities** → **Pipelines** (top right).
2. Click **+ New Pipeline**.
3. Name: `Compliance Spine Risk Map`.
4. Add 7 stages in the order above. Toggle "Show in Funnel" on for all stages.
5. Save.
6. Click into the new pipeline; copy the pipeline ID and each stage ID from the URL or via Settings. Append IDs below.

> **API note (tested May 16, 2026):** Pipeline creation via PIT was attempted with `opportunities.readonly` + `opportunities.write` scopes granted to the token. The read endpoint works (the script can list existing pipelines), but `POST /opportunities/pipelines` continues to return `401 not authorized for this scope` — likely because GHL treats pipeline configuration as an OAuth-app-tier action, not a PIT-tier action. Net: pipeline creation needs UI. Stage IDs can be auto-pulled via read API once the pipeline exists; see [scripts/ghl-create-rm-pipeline.mjs](scripts/ghl-create-rm-pipeline.mjs) for the read fallback.

**Pipeline + Stage IDs:** See the **COMPLETED VIA API** section at the top of this doc for the captured pipeline and stage IDs.

---

### 5. Build **Workflow 1 — Risk Map Intake**

**Name:** Compliance Spine Risk Map — Intake
**Status:** Publish when complete
**Trigger:** Inbound Webhook (created in step 1)

#### Step 1 — Create or update contact

Map webhook payload → contact fields:

- `firstName` → First Name
- `name` → Full Name (split if needed; First Name takes priority)
- `email` → Email
- `phone` → Phone
- `company` → `contact.rm_company`
- `product_inquiry` → `contact.rm_product_inquiry`
- `offer_price` → `contact.rm_offer_price`
- Set `contact.rm_submitted_at` = workflow runtime
- Set `contact.rm_stage` = `requested`

**Duplicate rule:** Update existing contact if email matches. Do not overwrite First Name or Phone if already populated (preserves prior touch data).

#### Step 2 — Tag and pipeline

- Add tag: `compliance-spine-risk-map-lead`
- Add to pipeline **Compliance Spine Risk Map**, stage **Requested**
  - If contact already has an opportunity in this pipeline at a more advanced stage (position > 1), skip the stage move and just refresh the contact fields. (A buyer who re-submits while still in delivery shouldn't get reset to "Requested.")

#### Step 3 — Internal notification (Ari is the lead delivery person)

**To:** `ari@paradigmconsulting.co`, `jay@paradigmconsulting.co`
**Subject:** `New Risk Map request — {{contact.first_name}} at {{contact.rm_company}} — $4,995`

**Body:**
```
A new Compliance Spine Risk Map request just came in.

Name:    {{contact.first_name}}
Email:   {{contact.email}}
Phone:   {{contact.phone}}
Company: {{contact.rm_company}}
Time:    {{contact.rm_submitted_at}}

SLA: one business day to first outreach.

Action: reply to {{contact.email}} from Ari's calendar with two 90-minute
discovery call slots in the next 5 business days. The page promises a
written 9-category risk profile within ~2 weeks of the discovery call,
so we want the call booked within 5 business days of submission to keep
delivery on track.

Pipeline: contact is at Compliance Spine Risk Map → Requested. Move to
Discovery Booked once they confirm a slot. Apply tag
compliance-spine-risk-map-booked at that point.
```

#### Step 4 — Confirmation email to buyer (send immediately)

**From:** `Ari Barton | Paradigm Consulting <ari@paradigmconsulting.co>`
**Subject:** `We received your Risk Map request, {{contact.first_name}}`
**Preview:** `Two 90-min call options coming in the next business day. Here's what to expect.`

**Body:**

```
{{contact.first_name}},

Thanks for reaching out about the Compliance Spine Risk Map. I'll be the
one running the engagement directly, and someone from my team will be in
your inbox within one business day with two options for the 90-minute
discovery call.

In the meantime, three things worth knowing:

1. The pre-call workbook lands in your inbox once the discovery call is
   booked. It takes about 30 minutes to fill out and covers company
   structure, states of operation, products and revenue mix, and rep
   operating model. The more specific you are, the more value comes out
   of the 90-minute call.

2. The 9-category risk profile lands in your inbox roughly 10-12 days
   after the discovery call. You'll have it in writing before the
   60-minute review call.

3. If the Risk Map surfaces work worth doing as a full engagement,
   the $4,995 is credited toward the Compliance Spine installation if
   you go forward within 90 days. If it doesn't, the deliverable is
   yours to use — for board, investor, or counsel — without any
   follow-on pressure.

Looking forward to digging in.

Ari Barton
COO & Compliance Lead, Paradigm Consulting
ari@paradigmconsulting.co
```

#### Step 5 — Safety net: 1-business-day SLA reminder

- Wait 1 business day after submission
- IF contact.rm_stage is still `requested` (no human has moved it forward), send a second internal alert to Ari and Jay:

**Subject:** `SLA REMINDER — Risk Map request from {{contact.first_name}} not yet contacted`
**Body:** `{{contact.first_name}} at {{contact.rm_company}} submitted a Risk Map request {{contact.rm_submitted_at}} and is still at stage "requested". Page promises a one-business-day reply.`

---

### 6. Build **Workflow 2 — Risk Map No-Response Follow-Up**

**Name:** Compliance Spine Risk Map — Follow-Up (No Booking)
**Status:** Publish when complete
**Trigger:** Tag `compliance-spine-risk-map-lead` exists AND tag `compliance-spine-risk-map-booked` does NOT exist AND submission was 4+ business days ago

#### Step 1 — Send follow-up email from Ari

**From:** `Ari Barton | Paradigm Consulting <ari@paradigmconsulting.co>`
**Subject:** `Still want to run the Risk Map, {{contact.first_name}}?`
**Preview:** `Two options below. Reply with whichever is easier.`

**Body:**
```
{{contact.first_name}},

Following up on the Risk Map request from your team. I have two slots
opening this week and two next week — happy to send specific times if
you reply with a couple of mornings or afternoons that work.

If timing has shifted on your side, no concern. The Risk Map is
available whenever the operation is ready. Reply with a sentence and
I'll adjust.

Ari Barton
COO & Compliance Lead, Paradigm Consulting
```

#### Step 2 — Wait 5 business days

#### Step 3 — Final touch from Ari if still unbooked

**Subject:** `Closing the loop on the Risk Map, {{contact.first_name}}`
**Body:**
```
{{contact.first_name}},

Closing the loop on the Risk Map request from a couple of weeks back. I
don't want to keep pinging if the timing isn't right — but if it is,
the page is at paradigmconsulting.io/compliance-spine-risk-map and you
can re-submit any time. We'll pick it back up from there.

Ari Barton
COO & Compliance Lead, Paradigm Consulting
```

#### Step 4 — If still no booking after this email

- Remove tag: `compliance-spine-risk-map-lead` (keep historical record on contact, but stop the cadence)
- Add tag: `compliance-spine-risk-map-cold`
- Move pipeline stage to: **Compliance Spine Risk Map → Nurture**

---

### 7. Build **Workflow 3 — Risk Map Delivered → Conversion Window**

**Name:** Compliance Spine Risk Map — Conversion Window
**Status:** Publish when complete
**Trigger:** Tag `compliance-spine-risk-map-delivered` added to contact

The page commits that the $4,995 is credited toward a full engagement if the buyer continues within 90 days. This workflow runs the conversion cadence inside that window — light touch, all from Ari.

#### Email 1 — Day 0 (review call recap, send immediately after `compliance-spine-risk-map-delivered` is applied)

**Subject:** `Your Risk Map deliverable and the top three actions, {{contact.first_name}}`
**Body:** Confirms the deliverable was sent, restates the top 3 priority actions from the deliverable (manually populated by Ari before workflow trigger), reminds buyer of the credit window.

#### Email 2 — Day 14

**Subject:** `Two weeks in, {{contact.first_name}} — what landed?`
**Body:** Asks which of the three priority actions has moved, offers to scope a full Compliance Spine engagement focused on those gaps.

#### Email 3 — Day 45

**Subject:** `Halfway through the credit window`
**Body:** Reminds of the 90-day credit, surfaces the conversion path.

#### Email 4 — Day 80

**Subject:** `Credit window closes in 10 days`
**Body:** Final touch on the credit. Honest framing — no fake urgency.

After day 90:
- Remove tag: `compliance-spine-risk-map-delivered`
- If contact does not have tag `compliance-spine-risk-map-converted`, move pipeline to **Compliance Spine Risk Map → Nurture**

When buyer converts to a full Compliance Spine engagement:
- Apply tag: `compliance-spine-risk-map-converted`
- Move pipeline stage to: **Compliance Spine Risk Map → Converted**
- Create a NEW opportunity in **Paradigm Leads** pipeline at stage **Discovery Call** (the credit handoff). This way Risk Map reporting stays clean and the full engagement is tracked in the assessment pipeline.

---

## Smart lists

| List | Filters |
|---|---|
| RM — All Leads | Tag = `compliance-spine-risk-map-lead` |
| RM — Awaiting Outreach | Tag = `compliance-spine-risk-map-lead` AND `contact.rm_stage` = `requested` AND submission < 2 business days ago |
| RM — Discovery Booked | Tag = `compliance-spine-risk-map-booked` |
| RM — Delivered (Inside Credit Window) | Tag = `compliance-spine-risk-map-delivered` AND `contact.rm_submitted_at` < 90 days ago |
| RM — Converted | Tag = `compliance-spine-risk-map-converted` |
| RM — Cold (No Booking) | Tag = `compliance-spine-risk-map-cold` |

---

## Custom Field IDs

See the **COMPLETED VIA API** section at the top of this doc for all field and tag IDs.

## Webhook Trigger ID (fill after creation)

- URL: `https://services.leadconnectorhq.com/hooks/toKhUkB5BEHB9Jn52ktG/webhook-trigger/{FILL_AFTER_CREATE}`
- Netlify env var name: `WEBHOOK_COMPLIANCE_SPINE_RISK_MAP`
- Test payload sent and received: _confirm after build_

---

## Final testing checklist

After all three workflows are published:

- [ ] Submit a test entry through https://paradigmconsulting.io/compliance-spine-risk-map → confirm webhook fires, contact is created with all 5 custom fields populated.
- [ ] Confirm tag `compliance-spine-risk-map-lead` is applied.
- [ ] Confirm pipeline stage is `Risk Map Requested`.
- [ ] Confirm Ari + Jay receive the internal notification email with merge fields populated.
- [ ] Confirm the buyer-facing confirmation email arrives from `ari@paradigmconsulting.co` with the right preview text and signature.
- [ ] Wait 1 business day with no manual action → confirm SLA reminder fires.
- [ ] Manually advance test contact to `Risk Map Discovery Booked` and add tag `compliance-spine-risk-map-booked` → confirm the no-response follow-up workflow does NOT fire (because tag now exists).
- [ ] Manually add tag `compliance-spine-risk-map-delivered` → confirm conversion-window workflow starts.
- [ ] Confirm phone numbers arriving from the form are normalized to `+1 (XXX) XXX-XXXX` (proxy handles this — verify in contact record).
- [ ] Submit honeypot test (fill `company_url` via dev tools) → confirm webhook rejects with `Bot detected` and no contact is created.
