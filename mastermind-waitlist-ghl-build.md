# 3×3 Mastermind Waitlist — GHL Build Guide

**Generated:** April 3, 2026

---

## Overview

The 3×3 Mastermind Waitlist collects name, email, phone, and location from the events page modal. The goal is to reach 100 waitlist members before opening the mastermind. Submissions go through the Netlify serverless proxy (`/api/webhook`) with source `mastermind-waitlist`.

---

## STEP 1: Create Custom Field

Create one custom field to store the location data:

| Field Name | Object | Type |
|---|---|---|
| Mastermind Location | Contact | Single Line Text |

**Path:** Settings → Custom Fields → Contact → Add Field

---

## STEP 2: Create Tag

| Tag |
|---|
| `mastermind-waitlist` |

**Path:** Settings → Tags → Create Tag

---

## STEP 3: Create Pipeline (Optional — for tracking count toward 100)

| Pipeline Name | Stage |
|---|---|
| Mastermind Waitlist | Waitlisted |

**Path:** Opportunities → Pipelines → Create Pipeline

---

## STEP 4: Create Inbound Webhook Workflow

**Path:** Automations → Create Workflow → Start from Scratch

### Trigger
- Type: **Inbound Webhook**
- Copy the webhook URL that GHL generates

### Actions (in order)

#### 1. Create / Update Contact
Map the incoming webhook fields:

| Webhook Field | GHL Field |
|---|---|
| `full_name` | Contact Name |
| `email` | Email |
| `phone` | Phone |
| `location` | Mastermind Location (custom field) |

#### 2. Add Tag
- Tag: `mastermind-waitlist`

#### 3. Add to Pipeline (optional)
- Pipeline: Mastermind Waitlist
- Stage: Waitlisted

#### 4. Send Confirmation Email (recommended)
- Subject: `You're on the 3×3 Mastermind waitlist`
- Body:

```
Hi {{contact.first_name}},

You're officially on the waitlist for the 3×3 Mastermind.

We open the room at 100 members. When we hit that number, you'll be the first to know.

In the meantime — if you haven't already, take the free 3×3 diagnostic on our site to see where your business stands.

— The Paradigm Team
```

#### 5. Internal Notification (recommended)
- Send an internal email or Slack notification so you can track signups in real time
- Include: `{{contact.full_name}}`, `{{contact.email}}`, `{{contact.phone}}`, `{{custom_field.mastermind_location}}`

---

## STEP 5: Add Webhook URL to Environment Variables

Once you have the webhook URL from Step 4:

### Netlify (production)
**Path:** Site settings → Environment variables → Add variable

| Key | Value |
|---|---|
| `WEBHOOK_MASTERMIND_WAITLIST` | `your_webhook_trigger_id` |

> **Note:** Only add the trigger ID portion of the URL, not the full URL. The base URL (`https://services.leadconnectorhq.com/hooks`) is already configured in `webhook.js`.

### Local (.env)
Add to your `.env` file:
```
WEBHOOK_MASTERMIND_WAITLIST=your_webhook_trigger_id
```

---

## STEP 6: Create Smart List for Waitlist Count

**Path:** Contacts → Smart Lists → Create

| Filter | Value |
|---|---|
| Tag | is `mastermind-waitlist` |

Name it **"Mastermind Waitlist"** — the contact count on this list is your live progress toward 100.

---

## Payload Reference

The form sends this JSON to `/api/webhook`:

```json
{
  "full_name": "John Smith",
  "email": "john@company.com",
  "phone": "(555) 123-4567",
  "location": "Austin, TX",
  "company_url": "",
  "source": "mastermind-waitlist",
  "lead_source": "mastermind-waitlist",
  "timestamp": "2026-04-03T12:00:00.000Z"
}
```

The `company_url` field is a honeypot — if it contains any value, the server-side proxy silently rejects the submission.

---

## Files Modified

| File | Change |
|---|---|
| `events.html` | Added waitlist modal with form, searchable location dropdown, and submission handler |
| `netlify/functions/webhook.js` | Added `mastermind-waitlist` to `WEBHOOK_MAP` |
| `.env.example` | Added `WEBHOOK_MASTERMIND_WAITLIST` placeholder |
