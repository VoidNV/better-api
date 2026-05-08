# Crypto Payment Providers Expansion — Design Spec

## Goal

Expand crypto payment options by adding three new providers (Plisio, OxaPay, CoinGate) for wallet top-up, and remove the unusable Creem provider.

## Current State

Six payment providers exist: ePay, Stripe, NOWPayments (crypto), Creem (crypto), Waffo, Waffo Pancake. NOWPayments is kept. Creem is removed.

## Scope

1. **Remove Creem** — backend (settings, controller, router, webhook availability, model constants) + frontend (hook, settings UI section, API calls, types)
2. **Add Plisio** — full top-up flow with admin settings
3. **Add OxaPay** — full top-up flow with admin settings
4. **Add CoinGate** — full top-up flow with admin settings

Out of scope: subscription payments for new providers (only ePay and Stripe support subscriptions today, NOWPayments is top-up only — new providers follow the same top-up-only pattern).

---

## Architecture

Each new provider follows the identical pattern established by NOWPayments:

```
setting/payment_{provider}.go     — Config variables (Enabled, Sandbox, ApiKey, etc.)
controller/topup_{provider}.go    — RequestAmount, RequestPay, Webhook handlers
controller/payment_webhook_availability.go — is{Provider}TopUpEnabled(), is{Provider}WebhookEnabled()
router/api-router.go              — Route registration
model/                            — PaymentMethod/PaymentProvider constants, Recharge function
web/default/src/                  — Frontend hook, settings UI, API calls, types
```

### Per-Provider Settings

Every provider has these settings (stored in the options table via the existing mechanism):

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| `{Provider}Enabled` | bool | false | Master toggle |
| `{Provider}Sandbox` | bool | false | Test mode — uses sandbox/test APIs |
| `{Provider}ApiKey` | string | "" | API authentication key |
| `{Provider}WebhookSecret` | string | "" | Webhook verification secret (where applicable) |
| `{Provider}UnitPrice` | float64 | 1.0 | Local currency per USD |
| `{Provider}MinTopUp` | int | 1 | Minimum top-up amount |

Additional per-provider settings where needed (see provider sections below).

---

## Provider Details

### Plisio

- **Create invoice**: `GET https://api.plisio.net/api/v1/invoices/new` with query params including `api_key`, `source_currency=USD`, `source_amount`, `order_number`, `callback_url` (must include `?json=true`), `expire_min`
- **Response**: `{ "status": "success", "data": { "txn_id": "...", "invoice_url": "..." } }` — return `invoice_url` to frontend
- **Webhook**: POST JSON to callback URL. Verification: HMAC-SHA1 over the JSON body (with `verify_hash` field removed, keys sorted alphabetically), key = API key. The `verify_hash` field in the body contains the expected signature.
- **Success status**: `completed`
- **Terminal failure statuses**: `expired`, `error`, `cancelled`
- **Sandbox**: Plisio has no formal sandbox. The `PlisioSandbox` bool setting controls whether invoice creation is allowed in test mode (admin can use Plisio's test API keys from their dashboard).
- **Extra settings**: `PlisioFeePaidByUser` (bool, default true), `PlisioFixedRate` (bool, default true)

### OxaPay

- **Create invoice**: `POST https://api.oxapay.com/v1/payment/invoice` with JSON body. Auth via `merchant_api_key` header.
- **Request body**: `{ "amount": 10.00, "currency": "USD", "order_id": "...", "callback_url": "...", "return_url": "...", "fee_paid_by_payer": 1, "sandbox": true/false }`
- **Response**: `{ "status": 200, "data": { "track_id": "...", "payment_url": "..." } }` — return `payment_url` to frontend
- **Webhook**: POST JSON to callback URL. Verification: HMAC-SHA512 over raw body bytes, key = merchant API key. Signature in `HMAC` header.
- **Success status**: `Paid` (case-sensitive)
- **Terminal failure statuses**: `Expired`, `Failed`
- **Sandbox**: Send `"sandbox": true` in the invoice request body. Same host, same API key.
- **Extra settings**: `OxaPayFeePaidByPayer` (bool, default true)

### CoinGate

- **Create order**: `POST https://api.coingate.com/v2/orders` (or `api-sandbox.coingate.com` in sandbox). Form-encoded body. Auth via `Authorization: Bearer <token>` header.
- **Request fields**: `price_amount`, `price_currency=USD`, `receive_currency` (configurable), `order_id`, `callback_url`, `success_url`, `cancel_url`, `title`, `description`, `token` (per-order random secret for webhook verification)
- **Response**: JSON `{ "id": 123, "payment_url": "...", "status": "new", "token": "..." }` — return `payment_url` to frontend
- **Webhook**: POST form-encoded to callback URL. Verification: constant-time compare incoming `token` field against stored per-order token, then re-fetch order via `GET /v2/orders/{id}` to confirm status server-side.
- **Success status**: `paid`
- **Terminal failure statuses**: `expired`, `canceled`, `invalid`
- **Sandbox**: Toggle base URL between `api.coingate.com` (production) and `api-sandbox.coingate.com` (sandbox). Requires separate sandbox API token.
- **Extra settings**: `CoinGateReceiveCurrency` (string, default "USDT" — settlement currency)

---

## Remove Creem

Files to remove or modify:

**Backend (delete):**
- `setting/payment_creem.go`
- `controller/subscription_payment_creem.go`
- Controller functions for Creem top-up (in existing controller files)

**Backend (modify):**
- `controller/payment_webhook_availability.go` — remove `isCreemTopUpEnabled()`, `isCreemWebhookConfigured()`, `isCreemWebhookEnabled()`
- `router/api-router.go` — remove Creem route registrations
- `model/` — remove Creem payment method/provider constants and `RechargeCreem` function (if exists)
- Any option-map initialization referencing Creem settings

**Frontend (delete):**
- `web/default/src/features/wallet/hooks/use-creem-payment.ts`

**Frontend (modify):**
- `web/default/src/features/system-settings/integrations/payment-settings-section.tsx` — remove entire Creem Gateway section
- `web/default/src/features/wallet/lib/payment.ts` — remove Creem references if any
- API call files — remove `requestCreemPayment` and related
- Types — remove Creem-related type fields
- i18n locale files — remove Creem-specific translation keys

---

## Frontend Integration

Each new provider follows the same frontend pattern as NOWPayments:

1. **API functions** (`web/default/src/features/wallet/api/`): `calculate{Provider}Amount()`, `request{Provider}Payment()`
2. **Payment hook**: either extend `use-payment.ts` or add a dedicated `use-{provider}-payment.ts` hook
3. **Payment dispatch**: update `use-payment.ts` to detect and route to the new provider
4. **Settings UI**: add a settings section per provider in `payment-settings-section.tsx` with the same field layout as NOWPayments (Enabled toggle, Sandbox toggle, API key, webhook secret, unit price, min top-up, provider-specific toggles)
5. **TopupInfo type**: extend with `enable_{provider}_topup`, `{provider}_min_topup` fields
6. **Payment constants**: add `PAYMENT_TYPES.{PROVIDER}`
7. **i18n**: add translation keys for new UI labels

---

## Webhook Security

All webhook handlers follow existing security patterns:

1. Read raw body before any framework binding (for signature computation)
2. Verify signature/token using constant-time comparison
3. Lock on order ID (`LockOrder`/`UnlockOrder`) to prevent concurrent processing
4. Check top-up status before crediting (idempotency)
5. Cross-check amount/currency against stored order
6. Log all webhook events with structured fields

---

## Database

No schema changes needed. The existing `TopUp` model with `PaymentMethod` and `PaymentProvider` string fields accommodates new providers by adding new constant values.

---

## Testing

Each provider's test mode:

| Provider | Test Mode Behavior |
|----------|-------------------|
| Plisio | Uses test API keys from Plisio dashboard; `PlisioSandbox=true` |
| OxaPay | Adds `"sandbox": true` to invoice request; same API host |
| CoinGate | Switches to `api-sandbox.coingate.com`; requires separate sandbox token |

Admins configure sandbox credentials, enable sandbox mode, and test the full flow before going live. Switching to production is just toggling `Sandbox=false` and updating API keys.
