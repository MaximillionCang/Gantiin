# Treasurer PayPal login

11 November 2026, Asia/Makassar. Committee One has a real provider-linked identity; Treasurer consent fails on the PayPal-hosted page. The likely explanation is the merchant signing into the app it owns. This matches the restriction reported by Nextend's maintained PayPal integration documentation, but the generic provider error does not establish the exact cause: https://social-login.nextendweb.com/documentation/providers/paypal/

The optional separate identity client below is implemented and locally tested. Credentialed Treasurer consent with it has not been tested yet.

## Dashboard setup

1. In PayPal Developer Dashboard, select Sandbox, then Apps & Credentials, then Create App. Name it Gantiin Treasurer Login. Associate it with a different Sandbox Business account from the actual Treasurer sender. An existing spare Business account can be used. The Gantiin Treasurer website account and payout sender remain the same.
2. Enable Log in with PayPal. Select Full Name, Email, Account verification status and PayPal account ID. Enter the current PayPal Return URL printed by npm.cmd run start:https. For Sandbox testing, the privacy/user-agreement URLs can use https://example.com as documented by PayPal. Save the settings.
3. Copy this new identity app's Client ID and Secret into the two prepared empty fields in the private .env.sandbox:

```env
PAYPAL_TREASURER_LOGIN_CLIENT_ID=
PAYPAL_TREASURER_LOGIN_CLIENT_SECRET=
```

Do not paste the values in chat. The existing PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET continue to identify the original MY Business payout app and the working Committee sign-in flow.

4. Restart npm.cmd run start:https. Register its newly printed Return URL in both apps because a Quick Tunnel hostname changes on each run. Open the printed Website address, choose Treasurer, select Continue with PayPal and authenticate the original Treasurer Business account, not the identity app's separate owner.
5. Verify that consent returns to Gantiin and opens the existing Treasurer account. If it still fails on PayPal's own page, capture its error/debug reference for PayPal support; do not relax account/role/payer validation.

OAuth state binds the selected role before code exchange. Only Treasurer login uses the optional identity app. The same configured original sender payer ID must still match the verified identity. Payout authentication always uses the original payout app, never the optional login client. A half-filled identity configuration is rejected for Treasurer; Committee sign-in continues using its existing credentials.

Treasurer password login remains available. Login-provider consent and automatic Sandbox payout permission are separate capabilities. A Treasurer OAuth failure does not require replacing the sender/payment app.
