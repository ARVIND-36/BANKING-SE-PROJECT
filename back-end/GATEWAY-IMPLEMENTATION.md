 # NIDHI Gateway — Very Simple Step-by-Step Guide

 This short guide explains, in plain words, how to add NIDHI payments to any project. It is written for non-technical people.

 ---

 ## Quick summary (one sentence)
 1) Get keys from NIDHI. 2) Give keys to your developer. 3) Developer connects and tests. 4) Go live.

 ## What you must do (easy checklist)
 - Sign up for a NIDHI account (ask for sandbox/test and production access).
 - Ask NIDHI for these items and save them safely:
    - Sandbox API key and secret
    - Production API key and secret
    - Webhook signing secret
 - Give the keys to your developer using a secure method (password manager, encrypted message).
 - Provide the developer with the public website URL where customers will pay.

 ## What your developer will do (very simple)
 - Add a “Pay” button to the site or app.
 - When a customer clicks “Pay”, the developer’s server asks NIDHI to create a payment.
 - NIDHI gives a payment link or token. The customer completes payment on NIDHI's page.
 - NIDHI then sends a message (webhook) to your server to say if the payment succeeded or failed.
 - The developer checks that webhook is really from NIDHI, then marks the order as paid or failed.

 ## What to ask NIDHI (exact items to request)
 - Sandbox API key and secret (for testing)
 - Production API key and secret (for real payments)
 - Webhook signing secret (used to verify messages)
 - Any test card numbers or sample data to use in sandbox

 ## Simple testing steps (do these with your developer)
 1. Developer uses sandbox keys and test card details.
 2. Create one test order and attempt to pay.
 3. Confirm the site shows payment success and the order is marked paid.
 4. Repeat a failed payment test and confirm order is marked failed.

 ## Short go-live checklist (before switching to real money)
 - Sandbox tests are all successful.
 - Production keys are obtained and stored in the live server.
 - Webhook URL is registered in NIDHI dashboard.
 - HTTPS is enabled on your site (secure, not HTTP).

 ## NOTHING WORKING ?
 - contant pnarvind06@gmail.com
 