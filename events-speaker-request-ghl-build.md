# Events Speaker Request — GHL Build Guide

**Generated:** April 2, 2026
**Location:** Paradigm Consulting (toKhUkB5BEHB9Jn52ktG)

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

---

## STEP 2 — CREATE TAGS

| Tag |
|---|
| speaker-request-lead |

---

## STEP 3 — PIPELINE

Use existing **Paradigm Leads** pipeline (`mgAoodSdPPjT4sxBokR2`).

Assign new speaker request contacts to stage: **New Lead** (`2f9115b0-0527-4353-b668-a84f36eb15d0`)

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

- full_name → First Name + Last Name (split on first space)
- email → Email
- phone → Phone
- organization → SPK Organization
- event_type → SPK Event Type
- event_date → SPK Event Date
- audience_size → SPK Audience Size
- additional_details → SPK Additional Details

Duplicate rule: Update existing contact if email matches.

### Step 2 — Add Tag

- Tag: `speaker-request-lead`

### Step 3 — Add to Pipeline

- Pipeline: Paradigm Leads
- Stage: New Lead
- Only if contact is NOT already in the pipeline

### Step 4 — Internal Notification Email

**To:** jay@paradigmconsulting.co

**Subject:** New Speaker Request — {{contact.full_name}} — {{contact.spk_event_type}}

**Body:**
```
SPEAKER REQUEST RECEIVED

Name: {{contact.full_name}}
Organization: {{contact.spk_organization}}
Email: {{contact.email}}
Phone: {{contact.phone}}
Event Type: {{contact.spk_event_type}}
Event Date: {{contact.spk_event_date}}
Audience Size: {{contact.spk_audience_size}}

Additional Details:
{{contact.spk_additional_details}}

Submitted: {{contact.spk_submitted_at}} (use timestamp from payload)
```

### Step 5 — Confirmation Email to Requester

**To:** {{contact.email}}
**From:** Matt | Founder, Paradigm Consulting
**Subject:** We received your speaker request
**Preview:** Our team will review and follow up within 48 hours.

**Body:**

{{contact.first_name}},

Thank you for reaching out about a speaking engagement. We have received your request and our team will review the details.

Here is what we have on file:

- **Event type:** {{contact.spk_event_type}}
- **Date:** {{contact.spk_event_date}}
- **Organization:** {{contact.spk_organization}}

You can expect to hear back from us within 48 hours. If your event is time-sensitive, reply to this email and we will prioritize your request.

Matt
Founder, Paradigm Consulting

---

## SMART LIST

Create this saved filter in GHL:

| List Name | Filter |
|---|---|
| Speaker Requests — All | Tag = `speaker-request-lead` |

---

## MANUAL CHECKLIST

- [ ] Create 5 custom fields (SPK_ prefix) in GHL
- [ ] Create `speaker-request-lead` tag
- [ ] Build Speaker Request Intake workflow with webhook trigger
- [ ] Copy webhook trigger ID to Netlify env var `WEBHOOK_EVENTS`
- [ ] Confirm `events-speaker-request` source key exists in `WEBHOOK_MAP` in `webhook.js` (already added)
- [ ] Configure internal notification email to jay@paradigmconsulting.co
- [ ] Configure confirmation email from "Matt | Founder, Paradigm Consulting"
- [ ] Create smart list
- [ ] Submit test lead and confirm:
  - Contact created with all SPK_ fields mapped
  - Tag `speaker-request-lead` applied
  - Pipeline stage set to New Lead
  - Internal notification email received
  - Confirmation email sent to requester
