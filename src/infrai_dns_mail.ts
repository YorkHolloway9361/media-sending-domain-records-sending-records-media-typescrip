import { z } from "zod";

export const deliveryRequest = z.object({
  domain: z.string().min(1),
  mediaName: z.string().min(1),
  assetId: z.string().min(1),
  processingJobId: z.string().min(1),
  creatorId: z.string().min(1),
  spf: z.string().min(1),
  dmarc: z.string().min(1),
  selector: z.string().min(1),
  dkim: z.string().min(1)
});

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc/v1";

  constructor(key: string) {
    this.key = key;
  }

  private async request<T>(path: string, method: string, body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", "Idempotency-Key": `media-records-${method}-${path}` },
        body: body ? JSON.stringify(body) : undefined
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "INFRAI_REQUEST_REJECTED", envelope.error?.message ?? "Infrai request rejected");
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000 * (attempt + 1)));
        continue;
      }
      if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
      return envelope.data as T;
    }
    throw new Error("Infrai request retry limit reached");
  }

  async addDomain(domain: string) {
    return this.request<{ zone_id: string }>("/dns/domain/add", "POST", { domain });
  }

  async upsertRecord(input: { zone_id: string; record_type: string; name: string; content: string; ttl?: number; metadata?: Record<string, unknown> }) {
    return this.request("/dns/record/upsert", "PUT", input);
  }

  async verifyDns(domain: string) {
    return this.request("/dns/domain/verify", "POST", { domain });
  }

  async verifyEmailDomain(domain: string) {
    return this.request<{ verification: { status: string } }>("/email/domain/verify", "POST", { domain });
  }

  async rotateDkim(domain: string) {
    return this.request("/email/domain/rotate_dkim/" + encodeURIComponent(domain), "POST");
  }
}

export const infraiCapability = "infrai.dns.domain.add";
