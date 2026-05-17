# Events Speaker Request — GHL Build Guide

> **Conforms to:** [paradigm-ghl-workflow-pattern.md](paradigm-ghl-workflow-pattern.md) (v 2026-05-17). All deviations must be approved as named exceptions in the pattern doc first.

**Generated:** April 2, 2026
**Updated:** 2026-05-17 (conformed to canonical pattern)
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)
**Short key:** `spk`

---

## STEP 1 — CREATE CUSTOM FIELDS

Create these custom fields in GHL under Settings > Custom Fields > Contact:

| Field | Key | Type |
|---|---|---|
| SPK Organization | contact.spk_organization | TEXT |
| SPK Event Type | contact.spk_event_type | TEXT |
| SPK Event Date | contact.spk_event_date | DATE |
| SPK Audience Size | contact.spk_audience_size | TEXT |
| SPK Additional Details | contact.spk_additional_details | LARGE_TEXT |
| SPK Business Name | contact.spk_business_name | TEXT |
| SPK Submitted At | contact.spk_submitted_at | DATE |

**Note:** `spk_business_name` is the prefixed mirror of the organization field (per pattern doc §4). The standard GHL `Company` field gets first-write-wins treatment; `spk_business_name` is written unconditionally on every submission.

---

## STEP 2 — CREATE TAGS

| Tag | Purpose |
|---|---|
| spk-lead | Applied on every form submission |
| spk-completed | (Reserved — speaker request has no distinct "completed" event today; tag exists for future symmetry with pattern doc §2) |
| spk-application | Applied manually by ops when the requester escalates to a paid speaking engagement / sales conversation. Triggers the shared "Application Hot Lead" workflow (pattern doc §8). |
| spk-converted | Applied when the contact pays / books a confirmed speaking engagement |

Per pattern doc §2: replaces legacy `applied-3x3os` shared tag. A speaker request typically has no "Apply" CTA in the confirmation email itself — `spk-application` is applied **manually by ops** when the conversation escalates from "interested in having Matt speak" to "actively scoping a paid engagement."

Shared pre-existing tag:
- `paradigm-welcomed` — welcome-email suppression gate (see pattern doc §5)

---

## STEP 3 — PIPELINE

Per pattern doc §7: speaker requests are a lead-magnet-style intake and do **not** get their own pipeline. Use the existing **Paradigm Leads** pipeline (`mgAoodSdPPjT4sxBokR2`).

Assign new speaker request contacts to stage: **New Lead** (`2f9115b0-0527-4353-b668-a84f36eb15d0`).

Do not move the contact through "Discovery Call" / "Proposal Sent" / "Closed" stages from the intake workflow — those stages apply only after a human sales engagement has begun.

---

## STEP 4 — CREATE WEBHOOK TRIGGER

1. Go to Automation > Workflows > Create Workflow
2. Name: "Speaker Request Intake"
3. Set trigger: Inbound Webhook
4. Copy the trigger ID from the webhook URL
5. Add trigger ID to Netlify env var: `WEBHOOK_EVENTS`

---

## STEP 5 — WEBHOOK PAYLOAD REFERENCE

The site sends this payload through `/api/webhook` with source key `events-speaker-request`:

```json
{
  "full_name": "Jane Smith",
  "organization": "Acme Corp",
  "email": "jane@acme.com",
  "phone": "555-123-4567",
  "event_type": "keynote",
  "event_date": "2026-06-15",
  "audience_size": "200",
  "additional_details": "Looking for a 45-minute keynote on operational scaling.",
  "company_url": "",
  "source": "events-speaker-request",
  "lead_source": "speaker-request",
  "timestamp": "2026-04-02T12:00:00.000Z"
}
```

`event_type` values: `keynote`, `panel`, `workshop`, `private`, `other`

`company_url` is a honeypot field — always empty for real submissions. The server-side proxy silently rejects any submission where this field is filled.

---

## WORKFLOW — Speaker Request Intake

**Name:** Speaker Request Intake
**Status:** Publish when complete
**Trigger:** Inbound Webhook (from Step 4)

### Step 1 — Create or Update Contact

Map from webhook payload:

- full_name → First Name + Last Name (split on first space) **(see duplicate-handling rule below)**
- email → Email **(dedupe key)**
- phone → Phone **(see duplicate-handling rule)**
- organization → standard `Company` (first-write-wins) AND `contact.spk_business_name` (always)
- event_type → SPK Event Type
- event_date → SPK Event Date
- audience_size → SPK Audience Size
- additional_details → SPK Additional Details
- timestamp → SPK Submitted At

**Duplicate-handling rule (per pattern doc §4):**
- Match on `email`
- If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
- For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `spk_business_name` regardless.

### Step 2 — Add Tag

- Tag: `spk-lead`

### Step 3 — Add to Pipeline

- Pipeline: Paradigm Leads
- Stage: New Lead
- Only if contact is NOT already in the pipeline at a more advanced stage

### Step 4 — Internal Notification Email

**To:** `ari@paradigmconsulting.io`, `jay@paradigmconsulting.io`

**Subject:** `New SPK Lead — {{contact.first_name}}`

**Body:**
```
SPEAKER REQUEST RECEIVED

Name: {{contact.first_name}} {{contact.last_name}}
Organization: {{contact.spk_business_name}}
Email: {{contact.email}}
Phone: {{contact.phone}}
Event Type: {{contact.spk_event_type}}
Event Date: {{contact.spk_event_date}}
Audience Size: {{contact.spk_audience_size}}

Additional Details:
{{contact.spk_additional_details}}

Submitted: {{contact.spk_submitted_at}}
```

### Step 5 — Confirmation Email to Requester

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

**To:** {{contact.email}}
**From:** Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>
**Subject:** We received your speaker request
**Preview:** Our team will review and follow up within 48 hours.

**Body (warm-welcome variant — first touch):**

{{contact.first_name}},

Thank you for reaching out about a speaking engagement. We have received your request and our team will review the details.

A quick note on who you're talking to: Paradigm Consulting helps founders install the operational infrastructure — compliance, culture, technology — that lets a business scale without breaking. Speaking engagements are how we share the underlying frameworks with rooms of founders and operators.

Here is what we have on file:

- **Event type:** {{contact.spk_event_type}}
- **Date:** {{contact.spk_event_date}}
- **Organization:** {{contact.spk_business_name}}

You can expect to hear back from us within 48 hours. If your event is time-sensitive, reply to this email and we will prioritize your request.

Matt
Founder, Paradigm Consulting

---

**Body (result-only variant — subsequent touch, contact already has `paradigm-welcomed` tag):**

{{contact.first_name}},

Thanks for the speaker request. We have it on file:

- **Event type:** {{contact.spk_event_type}}
- **Date:** {{contact.spk_event_date}}
- **Organization:** {{contact.spk_business_name}}

You can expect to hear back from us within 48 hours. If your event is time-sensitive, reply and we'll prioritize.

Matt
Founder, Paradigm Consulting

---

## APPLICATION HANDLING

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md).

When ops decides a speaker request has escalated into an active paid-engagement conversation, ops applies the `spk-application` tag manually. That tag triggers the shared workflow, which:

1. Applies `hot-lead`
2. Pauses any active nurture sequence
3. Moves the contact into the relevant pipeline at "Application Received" (for SPK, this is the Paradigm Leads pipeline — Paradigm does not yet have a dedicated Speaker Engagements pipeline)
4. Sends internal alert to ari@ + jay@paradigmconsulting.io
5. Escalates with SLA reminder if no human contact within 1 business day

---

## SMART LIST

Create these saved filters in GHL (per pattern doc §10 naming convention):

| List Name | Filter |
|---|---|
| spk-leads-all | Tag = `spk-lead` |
| spk-leads-this-week | Tag = `spk-lead` AND `spk_submitted_at` ≥ 7 days ago |
| spk-application-open | Tag = `spk-application` AND Tag `spk-converted` does NOT exist |

---

## MANUAL CHECKLIST

- [ ] Create 7 custom fields (SPK_ prefix, including `spk_business_name` and `spk_submitted_at`) in GHL
- [ ] Create tags: `spk-lead`, `spk-completed`, `spk-application`, `spk-converted`
- [ ] Confirm shared tag `paradigm-welcomed` exists
- [ ] Build Speaker Request Intake workflow with webhook trigger
- [ ] Copy webhook trigger ID to Netlify env var `WEBHOOK_EVENTS`
- [ ] Confirm `events-speaker-request` source key exists in `WEBHOOK_MAP` in `webhook.js` (already added)
- [ ] Configure internal notification email to BOTH ari@paradigmconsulting.io AND jay@paradigmconsulting.io
- [ ] Configure confirmation email from "Matt | Founder, Paradigm Consulting <matt@paradigmconsulting.io>" with welcome-suppression branching
- [ ] Confirm Create-or-Update Contact step uses dedupe-on-email rule and preserves First Name + Phone + Company on update
- [ ] Confirm shared "Application Hot Lead" workflow (per pattern doc §8) is built and listens for `spk-application` tag
- [ ] Create smart lists
- [ ] Submit test lead and confirm:
  - Contact created with all SPK_ fields mapped (including `spk_business_name` and `spk_submitted_at`)
  - Standard `Company` field written only on first submission
  - Tag `spk-lead` applied
  - Pipeline stage set to New Lead in Paradigm Leads
  - Internal notification email received by BOTH ari@ and jay@
  - Confirmation email sent to requester (warm-welcome variant on first touch, result-only on repeat)
  - `paradigm-welcomed` tag applied after first send
