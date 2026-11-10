import { deliveryRequest, InfraiClient } from "./infrai_dns_mail.ts";

export type DeliveryResult = { mediaName: string; assetId: string; processingJobId: string; creatorId: string; zone_id: string; verification: string; dkimRotated: boolean };

export async function publishSendingDomain(input: unknown, client: InfraiClient): Promise<DeliveryResult> {
  const request = deliveryRequest.parse(input);
  const zone = await client.addDomain(request.domain);
  await client.upsertRecord({ zone_id: zone.zone_id, record_type: "TXT", name: request.domain, content: request.spf, ttl: 300 });
  await client.upsertRecord({ zone_id: zone.zone_id, record_type: "TXT", name: `_dmarc.${request.domain}`, content: request.dmarc, ttl: 300 });
  await client.upsertRecord({ zone_id: zone.zone_id, record_type: "TXT", name: `${request.selector}._domainkey.${request.domain}`, content: request.dkim, ttl: 300 });
  await client.verifyDns(request.domain);
  const email = await client.verifyEmailDomain(request.domain);
  await client.rotateDkim(request.domain);
  return { mediaName: request.mediaName, assetId: request.assetId, processingJobId: request.processingJobId, creatorId: request.creatorId, zone_id: zone.zone_id, verification: email.verification.status, dkimRotated: true };
}
