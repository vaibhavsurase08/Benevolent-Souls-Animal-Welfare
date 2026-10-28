# Donation Module ChangeLog — Benevolent Souls Foundation

**Project:** animal-welfare-website  
**File changed:** `app/donate/page.tsx`  
**Files created:** `WEBSITE_AUDIT_REPORT.md`, `DONATION_MODULE_CHANGELOG.md`  
**Date:** 24/10/2026  
**Changed by:** Cline (AI coding agent)

---

## Objective

Add the NGO's official QR code and bank transfer details to the existing public donation page (`/donate`) so donors can make a direct UPI or bank transfer to Benevolent Souls Foundation, while preserving the existing donation form, Supabase integration, design, and navigation. This is a frontend-only enhancement — no payment gateway is implemented.

---

---

## Refinement (UPI-conditional display)

The Scan to Donate section is now conditionally rendered: it appears **only when the donor selects "UPI"** as the payment method in the donation form. When any other payment method is selected (Bank Transfer, Online Payment, Other), the QR section is hidden. The Bank Transfer Details section remains visible at all times. The existing QR section was reused — no duplicate was created.


---

## UI and functionality changes

### Added to `app/donate/page.tsx` (Information column, outside the donation form)

1. **Scan to Donate section**
   - Heading: "Scan to Donate".
   - Official QR image: `src="/ngo-upi-qr.png"`, accessible alt text `"UPI QR code for Benevolent Souls Foundation donations"`, 160×160, rounded, with border/shadow.
   - Caption: "Scan with any UPI app".
   - "Verify before you pay" note telling donors to confirm the recipient name is **Benevolent Souls Foundation** in their UPI or banking app before completing the transfer.
   - Note telling donors to submit their transaction reference using the donation form on the right after transferring.

2. **Bank transfer details section**
   - NGO Name: Benevolent Souls Foundation
   - Bank: HDFC Bank
   - Branch / Location: Near Pratik Nagar
   - Account Number: `50200111951032` (monospace, with Copy button)
   - IFSC Code: `HDFC0001796` (monospace, with Copy button)

3. **Copy buttons (account number and IFSC)**
   - `type="button"` — they do **not** submit the donation form.
   - `aria-label` for accessibility ("Copy account number", "Copy IFSC code").
   - Call `copyToClipboard(text, field)` which uses `navigator.clipboard.writeText`.
   - Success feedback: button shows "Copied!"; failure feedback: "Failed to copy". Feedback auto-clears after 2 seconds.
   - Loading/disabled state while copying.

4. **New component state**
   - `copyLoading`, `copyFeedback` (account/ifsc: "success" | "failure" | null).

### NGO payment details integrated
- NGO name: Benevolent Souls Foundation
- Bank: HDFC Bank
- Branch/location: Near Pratik Nagar

---

## Tests executed and results

| Check | Command | Result |
|---|---|---|
| TypeScript type-check | `npx tsc --noEmit` | **Clean** — no type errors. |
| ESLint (`app/donate/page.tsx`) | `npx eslint app/donate/page.tsx` | 3 pre-existing errors (unrelated `<a>` vs `<Link />` and unescaped entity) + **1 new warning** (`` tag could use `<Image />`, consistent with codebase). **No new errors introduced.** |
| ESLint (whole project) | `npm run lint` | 39 pre-existing problems (22 errors, 17 warnings) — not caused by this change. |

### Verified by code inspection
- `public/ngo-upi-qr.png` — **MISSING**. There are zero `.png` files in `public/`. The `<img src="/ngo-upi-qr.png">` will not render until the official image is placed at that path. (No substitute QR image was created, per instructions.)
- Copy buttons use `type="button"` and the section is **outside** the `<form>`, so they do not submit the donation form.
- Original Supabase form field names and the `supabase.from("donations").insert(...)` call remain intact.

### Tests that could not be completed
- End-to-end browser test of copy-to-clipboard (requires clipboard permissions in a real browser and the missing QR image).
- Supabase integration test (requires live Supabase credentials).
- Production build (`npm run build`) — not executed; type-check passed.

---

## Remaining manual steps

1. **Place the official QR image** at `public/ngo-upi-qr.png`. Do not create or substitute a QR image — use the one supplied by the project team.
2. After placing the image, visually verify the QR section renders on `/donate`.

---

## Explanation for a college project presentation

"The Benevolent Souls Foundation website is a Next.js + React app that lets visitors donate to an animal-welfare NGO. The donation page previously only had a form to record donor details. My task was to add the NGO's official payment options directly on that page without changing how the form works.

I added a 'Scan to Donate' section with the official UPI QR code and a bank transfer section showing HDFC Bank account and IFSC details. I added copy buttons so donors can copy the account number and IFSC with one click, with 'Copied!' / 'Failed to copy' feedback. The buttons are marked `type="button"` and sit outside the donation form so they never accidentally submit the form. I also added safety notes reminding donors to verify the recipient name and to submit their transaction reference after paying.

I did not build a payment gateway — the form still only records donor details in Supabase, exactly as before. All original colours, layout, mobile behaviour, and form fields are preserved. TypeScript and ESLint checks pass with no new errors. One thing still needed: the project team must place the official QR image at `public/ngo-upi-qr.png` before it will display."

---

**End of changelog.**

3. Manually test the Copy buttons in a browser (confirm "Copied!" appears and text is pasted correctly).
4. Consider server-side admin authorisation and verified Supabase RLS before production use (documented in `WEBSITE_AUDIT_REPORT.md`).
5. Do not change the database schema or add a `payment_status` field without approval.

---

## Known limitations

- No payment gateway, webhook, or transaction verification is implemented. Submitting the form records donor details only; it does not verify payment.
- The QR image is missing from the repository, so the QR section cannot be functionally verified until the asset is supplied.
- No automated test suite exists in the project; validation is by static checks and code inspection only.

- Account number: 50200111951032
- IFSC: HDFC0001796

### Preserved (unchanged)
- Existing donation form fields: `donor_name`, `email`, `phone`, `amount`, `payment_method`, `transaction_id`, `message`.
- Supabase insert into `donations` table (unchanged call and field mapping).
- Form validation, loading/success/error banners, submit button.
- Page header, navigation ("← BACK TO HOME" → `/#donate`), intro section, colours (`#FAF8F0`, `#25283B`, `#FFC928`, `#C49A00`), mobile-responsive grid layout.
- The placeholder text "Official payment details ... will be added after confirmation" was replaced (no duplicate payment section exists).


## Files modified and created

### Modified
- `app/donate/page.tsx` — Added a "Scan to Donate" section (QR image + verify-before-you-pay note + submit-transaction-reference note) and a "Bank Transfer Details" section (NGO name, bank, branch, account number with copy button, IFSC code with copy button) plus copy success/failure feedback. Also added React state and a `copyToClipboard` helper function.

### Created
- `WEBSITE_AUDIT_REPORT.md` — Full website audit report (14 sections).
- `DONATION_MODULE_CHANGELOG.md` — This file.
