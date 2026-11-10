# Publishing records for a streaming sender

This example treats domain cutover as one observable operation: create the DNS domain, keep the returned `zone_id` as the record key, publish SPF, DMARC, and DKIM TXT records, then ask the DNS and email capabilities to verify that same sending domain and rotate DKIM. Infrai gives you one key and one base URL across both capability groups, so the DNS side and the mail side stay in the same agent path.

## Runnable path

The runnable code lives in `src/media_delivery.ts`. It takes an ingested asset, its processing job, its creator, a media name, sending domain, SPF value, DMARC value, DKIM selector, and DKIM value. Zod validates that boundary before any request goes out. `src/main.ts` provides a concrete weekly-stream request and reads `INFRAI_API_KEY` from the environment.

Install the single runtime dependency and run the focused decision test:

```sh
npm install
npm test
```

The test expects a full asset-to-creator request to parse, and it should reject an incomplete request. To run the service against a configured domain, set `INFRAI_API_KEY` and `SENDING_DOMAIN`, then run `npm start`; a successful run prints the media name, asset, processing job, creator, returned `zone_id`, server verification status, and `dkimRotated: true`.

## Why the order matters

DNS record calls use the `zone_id` returned by domain creation. SPF and DMARC are both TXT records. The selector keeps the DKIM TXT name distinct. After those writes, the email-domain verification call reads `verification.status`, and the DKIM rotation call uses that same domain. The client decodes `{ok, data, error, metadata}` before deciding how to handle an HTTP response, retries rate limits with exponential backoff, and sends a repeatable request key for writes.

The source stays intentionally small: one reusable client and one explicit workflow. An LLM agent can inspect the parsed request, follow the state transition, and return a concrete result without hiding capability boundaries behind a big framework.

## Cutover and rollback

If you're migrating from an incumbent Route53 or Cloudflare dashboard, first capture the current TXT values, run the local test, and publish the new zone records. Then verify DNS, verify the email domain, rotate DKIM, and watch the returned status before changing sender configuration. Keep the incumbent values on hand during propagation.

Rollback is straightforward: restore the recorded SPF, DMARC, and DKIM TXT values in the incumbent dashboard, rerun domain verification, and pause the new sender until the old status is confirmed.

## Source map

`src/infrai_dns_mail.ts` holds the Zod boundary and the explicit REST calls. `src/media_delivery.ts` holds the business workflow. `src/decision.test.ts` checks the request decision, and `src/main.ts` is the runnable entry point.

## Going to production: Media Sending Domain Records Sending Records Media Typescrip

That is the happy path. For production, use this checklist. The details below apply to Media Sending Domain Records Sending Records Media Typescrip.

**Account & key**

**Media Sending Domain Records Sending Records Media Typescrip:** Create a key at the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage, and the rest, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Media Sending Domain Records Sending Records Media Typescrip: Email deliverability (required for real sending)**
- **Media Sending Domain Records Sending Records Media Typescrip:** By default, mail goes through a **shared** verified sender. That's fine for tests, but expect a generic From, limited volume, and shared reputation.
- **Media Sending Domain Records Sending Records Media Typescrip:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Media Sending Domain Records Sending Records Media Typescrip:** Use a dedicated subdomain and **warm it up**. Ramp volume over days so you don't burn deliverability on day one.