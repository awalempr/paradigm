# Compliance Spine Risk Map — GHL Webhook Mapping Reference

**Page:** https://paradigmconsulting.io/compliance-spine-risk-map
**Location:** Paradigm Consulting (`toKhUkB5BEHB9Jn52ktG`)
**Inbound Webhook Trigger URL:** `https://services.leadconnectorhq.com/hooks/toKhUkB5BEHB9Jn52ktG/webhook-trigger/ed7291fc-7f47-4785-8e93-57c0399265b7`
**Netlify env var:** `WEBHOOK_COMPLIANCE_SPINE_RISK_MAP` (set)

Use this document while configuring the **Inbound Webhook trigger** and the **Create/Update Contact** action in GHL Workflow 1 (Risk Map Intake).

---

## Sample webhook payload

GHL needs a sample payload to populate the field picker. Either submit a real test from the live form, or paste this JSON into the trigger's "Sample Request" capture:

```json
{
  "source": "compliance-spine-risk-map",
  "lead_source": "compliance-spine-risk-map",
  "name": "Test Buyer",
  "firstName": "Test",
  "email": "test@example.com",
  "phone": "+1 555-555-1234",
  "company": "Test Co",
  "product_inquiry": "Compliance Spine Risk Map",
  "offer_price": "$4995"
}
```

---

## Field mapping (Inbound Webhook → Contact)

| Webhook field      | GHL field                          | Custom field ID         | Notes                                                  |
|--------------------|------------------------------------|-------------------------|--------------------------------------------------------|
| `firstName`        | **First Name** (standard)          | —                       | Use this; takes priority over `name`                   |
| `name`             | **Full Name** (standard, optional) | —                       | Fallback if `firstName` is missing                     |
| `email`            | **Email** (standard)               | —                       | Duplicate-match key (see rule below)                   |
| `phone`            | **Phone** (standard)               | —                       | Already formatted with country code                    |
| `company`          | `contact.rm_company`               | `HZBntuLGEJXoDSONOyZK`  | Text                                                   |
| `product_inquiry`  | `contact.rm_product_inquiry`       | `Jm9a29KKOChlOTuP14cP`  | Text — always "Compliance Spine Risk Map"              |
| `offer_price`      | `contact.rm_offer_price`           | `ZMhNGZZXXylYiYZ2Di3I`  | Text — always "$4995"                                  |
| *(workflow time)*  | `contact.rm_submitted_at`          | `5A2Ogrq6oFRt52hDh6rJ`  | Date — set to workflow runtime                         |
| *(literal)*        | `contact.rm_stage`                 | `6mEQoA9YJheWQh5h46Sj`  | Text — set to `requested`                              |

---

## Duplicate-handling rule (Create/Update Contact action)

- **Match on:** `email`
- **If contact exists:** update Risk Map custom fields, but do **NOT** overwrite First Name or Phone if either is already populated. This preserves prior touch data from other lead-magnet entries.

---

## Tags + pipeline (after contact create/update)

### Tag to apply

| Tag                                  | ID                       |
|--------------------------------------|--------------------------|
| `compliance-spine-risk-map-lead`     | `lbGv2Nnob2c2WZGH3Jx4`   |

### Pipeline + stage

- **Pipeline:** Compliance Spine Risk Map
- **Stage:** Requested

### Pipeline-stage safeguard

If the contact already has an opportunity in this pipeline at a later stage (position > 1), **skip the stage move and just refresh the custom fields**. A buyer who resubmits while still in delivery shouldn't get reset back to "Requested."

---

## Lifecycle tag reference (used by Workflows 2 + 3)

These are the other Risk Map tags already created in GHL. Workflow 1 only applies the `-lead` tag; the rest are applied later in the lifecycle.

| Tag                                       | ID                       | Applied when                                          |
|-------------------------------------------|--------------------------|-------------------------------------------------------|
| `compliance-spine-risk-map-lead`          | `lbGv2Nnob2c2WZGH3Jx4`   | Form submitted (Workflow 1, step 2)                   |
| `compliance-spine-risk-map-booked`        | `OjAoLTZ9mmuubJElKYRi`   | Discovery call confirmed (manual or calendar webhook) |
| `compliance-spine-risk-map-paid`          | `RfhNiAMtmjg7ryycivY4`   | Invoice paid                                          |
| `compliance-spine-risk-map-delivered`     | (in build doc)           | Written risk profile delivered to buyer               |
| `compliance-spine-risk-map-converted`     | (in build doc)           | Buyer signs full Compliance Spine engagement          |
| `compliance-spine-risk-map-not-converted` | (in build doc)           | 90-day conversion window expires without engagement   |

---

## Quick smoke test

After Workflow 1 is published, send a real test from https://paradigmconsulting.io/compliance-spine-risk-map and verify in GHL:

- [ ] New contact created (or matched on email if duplicate)
- [ ] First Name, Email, Phone populated
- [ ] All 5 `rm_*` custom fields populated correctly
- [ ] Tag `compliance-spine-risk-map-lead` applied
- [ ] Opportunity created in pipeline **Compliance Spine Risk Map**, stage **Requested**
- [ ] Internal alert email arrives at `ari@paradigmconsulting.io` and `jay@paradigmconsulting.io`
- [ ] Confirmation email arrives at the test buyer's email from `ari@paradigmconsulting.io`
