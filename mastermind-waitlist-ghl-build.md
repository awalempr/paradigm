# 3×3 Mastermind Waitlist — GHL Build Guide

**Generated:** April 3, 2026

> **Conforms to:** [paradigm-ghl-workflow-pattern.md](paradigm-ghl-workflow-pattern.md) (v 2026-05-17). All deviations must be approved as named exceptions in the pattern doc first.

---

## Overview

The 3×3 Mastermind Waitlist collects name, email, phone, and location from the events page modal. The goal is to reach 100 waitlist members before opening the mastermind. Submissions go through the Netlify serverless proxy (`/api/webhook`) with source `mastermind-waitlist`.

Short key: `mwl` (per pattern doc §1).

> **Intake decision:** This doc treats the waitlist signup itself as a lead-stage event (applies `mwl-lead`). Apply `mwl-application` only if a separate "join the cohort" form is added later that captures qualifying info beyond the waitlist intake. <!-- TODO: confirm given pattern v 2026-05-17 -->

---

## STEP 1: Create Custom Fields

Create these custom fields to store waitlist data:

| Field Name | Key | Object | Type |
|---|---|---|---|
| MWL Location | `contact.mwl_location` | Contact | Single Line Text |
| MWL Business Name | `contact.mwl_business_name` | Contact | Single Line Text |
| MWL Submitted At | `contact.mwl_submitted_at` | Contact | DATE |

**Path:** Settings → Custom Fields → Contact → Add Field

> **Field rename:** the prior `mastermind_location` field is renamed to `mwl_location` to conform to the short-key custom field convention (pattern doc §3). Migrate any existing data in `mastermind_location` into `mwl_location`, then archive the old field.

---

## STEP 2: Create Tags

Standardized to the per-source lifecycle tag pattern (pattern doc §2):

| Tag | When applied |
|---|---|
| `mwl-lead` | On waitlist signup (intake) |
| `mwl-completed` | (Reserved — no current completion-distinct event) |
| `mwl-application` | Only if a separate "join the cohort" / qualifying form fires |
| `mwl-converted` | When the contact pays / joins the cohort |

**Path:** Settings → Tags → Create Tag

> **Tag rename:** the prior `mastermind-waitlist` tag is renamed to `mwl-lead`. Find-and-replace any existing automations and smart lists.

---

## STEP 3: Create Pipeline (REQUIRED)

Per pattern doc §7, the Mastermind pipeline is a **required** paid-product pipeline (previously marked optional — upgraded by pattern v 2026-05-17).

| Pipeline Name | Stages (in order) |
|---|---|
| Mastermind | Waitlisted → Invited → Joined → Declined |

**Path:** Opportunities → Pipelines → Create Pipeline

Stage semantics:
- **Waitlisted** — `mwl-lead` applied; contact is queued
- **Invited** — Cohort invitation sent; awaiting response
- **Joined** — Contact accepted and paid (apply `mwl-converted`)
- **Declined** — Contact declined or did not respond

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
| `location` | MWL Location (`contact.mwl_location`) |
| `business_name` (if present) | MWL Business Name + standard `Company` (per company-field strategy below) |
| `timestamp` | MWL Submitted At |

**Duplicate-handling rule:**
- Match on `email`
- If contact exists: update assessment custom fields, but **do not overwrite First Name or Phone if either is already populated.** Preserves earlier-touch identity.
- For the standard `Company` field: write only if currently empty (first-write-wins). Always write to `mwl_business_name` regardless.

#### 2. Add Tag
- Tag: `mwl-lead`

#### 3. Add to Pipeline (REQUIRED)
- Pipeline: Mastermind
- Stage: Waitlisted

#### 4. Send Confirmation Email

**Suppression check (REQUIRED — see [paradigm-ghl-workflow-pattern.md §5](paradigm-ghl-workflow-pattern.md)):**

Before sending this email, check the contact for the `paradigm-welcomed` tag:
- IF contact does NOT have tag `paradigm-welcomed` → send the warm-welcome variant below AND apply tag `paradigm-welcomed`
- ELSE → send the result-only variant (a shortened version without the "intro to Paradigm" paragraphs)

- Subject: `You're on the 3×3 Mastermind waitlist`
- Body (warm-welcome variant):

```
Hi {{contact.first_name}},

You're officially on the waitlist for the 3×3 Mastermind.

We open the room at 100 members. When we hit that number, you'll be the first to know.

In the meantime — if you haven't already, take the free 3×3 diagnostic on our site to see where your business stands.

— The Paradigm Team
```

Body (result-only variant — for contacts already `paradigm-welcomed`):

```
Hi {{contact.first_name}},

You're on the 3×3 Mastermind waitlist. We open the room at 100 members and you'll be the first to know when we hit that number.

— The Paradigm Team
```

#### 5. Internal Notification (REQUIRED)
- **To:** `ari@paradigmconsulting.io`, `jay@paradigmconsulting.io`
- **Subject:** `New MWL Lead — {{contact.first_name}}`
- **Body — include:** `{{contact.full_name}}`, `{{contact.email}}`, `{{contact.phone}}`, `{{contact.mwl_location}}`, `{{contact.mwl_business_name}}`

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

## WORKFLOW 2 — MWL Application Handler (deferred)

**DEPRECATED** — Application handling is now performed by the shared "Application Hot Lead" workflow defined in [paradigm-ghl-workflow-pattern.md §8](paradigm-ghl-workflow-pattern.md). The shared workflow triggers on any `*-application` tag (including `mwl-application`).

~~Per-source application handler steps used to live here.~~ If/when a separate "join the cohort" form is added that fires a distinct webhook, that workflow should apply `mwl-application` to the contact — the shared Application Hot Lead workflow then takes over (sends alert to ari@ + jay@paradigmconsulting.io, moves contact in the Mastermind pipeline to "Invited", etc.).

---

## STEP 6: Create Smart List for Waitlist Count

**Path:** Contacts → Smart Lists → Create

| Filter | Value |
|---|---|
| Tag | is `mwl-lead` |

Name it **`mwl-leads-this-week`** (or `mwl-waitlist-all` for the cumulative count) — the contact count on this list is your live progress toward 100. See pattern doc §10 for smart-list naming convention.

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
