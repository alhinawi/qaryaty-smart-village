# Paymob online payment

Two Edge Functions. The app never sees a Paymob key and never marks an order paid.

- `paymob-checkout`: the app sends an order id; the function reads the total the database computed, creates a Paymob payment intention and returns the checkout page's link.
- `paymob-webhook`: Paymob calls it after each transaction. It checks the HMAC, then that the amount matches the order, and only then sets `payment_status = 'paid'`.

Cash on delivery needs none of this and keeps working without it.

## Set up (sandbox first)

1. In the Paymob dashboard (test mode): copy the Secret key, the Public key and the HMAC secret, and the integration IDs for Card and for Mobile Wallet.
2. Set the secrets:

```
supabase secrets set \
  PAYMOB_SECRET_KEY=... PAYMOB_PUBLIC_KEY=... PAYMOB_HMAC_SECRET=... \
  PAYMOB_CARD_INTEGRATION_ID=... PAYMOB_WALLET_INTEGRATION_ID=... \
  APP_URL=https://your-app.example
```

3. Deploy:

```
supabase functions deploy paymob-checkout
supabase functions deploy paymob-webhook --no-verify-jwt
```

4. Turn the options on in the app: `VITE_PAYMOB_ENABLED=true` in `.env`, then rebuild.

Switching to live means the live keys, HMAC secret and integration IDs in the same secrets; nothing in the code changes.
