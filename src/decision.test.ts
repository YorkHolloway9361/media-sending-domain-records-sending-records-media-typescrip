import test from "node:test";
import assert from "node:assert/strict";
import { deliveryRequest } from "./infrai_dns_mail.ts";

test("a media sending request requires all three DNS materials", () => {
  const parsed = deliveryRequest.safeParse({
    domain: "mail.example.test", mediaName: "weekly-stream", assetId: "asset-1", processingJobId: "job-1", creatorId: "creator-1", spf: "v=spf1 ~all",
    dmarc: "v=DMARC1; p=none", selector: "stream", dkim: "v=DKIM1; p=key"
  });
  assert.equal(parsed.success, true);
  assert.equal(deliveryRequest.safeParse({ domain: "mail.example.test" }).success, false);
});
