import { InfraiClient } from "./infrai_dns_mail.ts";
import { publishSendingDomain } from "./media_delivery.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before publishing a sending domain");

const result = await publishSendingDomain({
  domain: process.env.SENDING_DOMAIN ?? "mail.example.test",
  mediaName: "weekly-stream",
  assetId: "asset-weekly-stream-001",
  processingJobId: "job-transcode-001",
  creatorId: "creator-001",
  spf: "v=spf1 include:spf.example.test ~all",
  dmarc: "v=DMARC1; p=none; rua=mailto:dmarc@example.test",
  selector: "stream",
  dkim: "v=DKIM1; k=rsa; p=PUBLIC_KEY_FROM_PROVIDER"
}, new InfraiClient(key));

console.log(JSON.stringify(result, null, 2));
