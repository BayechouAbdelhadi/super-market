import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CampaignRecipient } from "@/lib/marketing/types";

/**
 * Minimal fake of the Supabase query builder: records each call chain and resolves it
 * with the result chosen by `respond(table, operation)`.
 */
type Result = { data?: unknown; error?: { message: string; code?: string } | null };
interface Call { table: string; op: string; args: unknown[]; filters: string[] }

const calls: Call[] = [];
let respond: (call: Call) => Result = () => ({ data: [], error: null });

function builder(table: string) {
  const call: Call = { table, op: "select", args: [], filters: [] };
  const chain: Record<string, unknown> = {};
  for (const op of ["select", "insert", "upsert", "update", "delete"]) {
    chain[op] = (...args: unknown[]) => {
      if (op !== "select" || call.op === "select") {
        call.op = op;
        call.args = args;
      }
      return chain;
    };
  }
  for (const f of ["eq", "in", "order", "range", "limit"]) {
    chain[f] = (...args: unknown[]) => {
      call.filters.push(`${f}:${JSON.stringify(args)}`);
      return chain;
    };
  }
  const settle = () => {
    calls.push(call);
    const r = respond(call);
    return { data: r.data ?? null, error: r.error ?? null };
  };
  chain.maybeSingle = () => Promise.resolve(settle());
  chain.then = (onOk: (v: unknown) => unknown, onErr?: (e: unknown) => unknown) =>
    Promise.resolve(settle()).then(onOk, onErr);
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => builder(table) }),
}));

const { SupabaseMarketingRepository } = await import("@/lib/marketing/adapters/supabase-marketing-repository");

function recipient(customerId: string, email: string): CampaignRecipient {
  return { customerId, email, fullName: "Client Test", tier: "GOLD", status: "PENDING" };
}

describe("SupabaseMarketingRepository", () => {
  beforeEach(() => {
    calls.length = 0;
    respond = () => ({ data: [], error: null });
  });

  it("throws when Supabase fails, instead of reporting success", async () => {
    respond = () => ({ error: { message: "connection refused" } });
    const repo = new SupabaseMarketingRepository();
    await expect(repo.getAll()).rejects.toThrow("getAll failed: connection refused");
    await expect(repo.getUnsubscribedEmails()).rejects.toThrow("getUnsubscribedEmails failed");
  });

  it("upserts recipients without deleting first, then removes only customers no longer targeted", async () => {
    respond = (call) =>
      call.table === "marketing_campaign_recipients" && call.op === "select"
        ? { data: [{ id: "row-a", customer_id: "a" }, { id: "row-old", customer_id: "old" }] }
        : { data: null };

    await new SupabaseMarketingRepository().saveRecipients("c1", [recipient("a", "a@x.fr"), recipient("b", "b@x.fr")]);

    const ops = calls.filter((c) => c.table === "marketing_campaign_recipients").map((c) => c.op);
    expect(ops).toEqual(["upsert", "select", "delete"]);

    const upsert = calls.find((c) => c.op === "upsert")!;
    expect(upsert.args[1]).toEqual({ onConflict: "campaign_id,customer_id" });
    expect((upsert.args[0] as unknown[]).length).toBe(2);

    const removal = calls.find((c) => c.op === "delete")!;
    expect(removal.filters).toContain('in:["id",["row-old"]]');
  });

  it("keeps existing recipients when the upsert fails", async () => {
    respond = (call) => (call.op === "upsert" ? { error: { message: "timeout" } } : { data: [] });

    await expect(
      new SupabaseMarketingRepository().saveRecipients("c1", [recipient("a", "a@x.fr")])
    ).rejects.toThrow("saveRecipients (upsert) failed");
    expect(calls.some((c) => c.op === "delete")).toBe(false);
  });

  it("treats an already-unsubscribed email as success", async () => {
    respond = () => ({ error: { message: "duplicate key", code: "23505" } });
    await expect(new SupabaseMarketingRepository().unsubscribe("Client@X.fr")).resolves.toBe(true);
    expect(calls[0].args[0]).toMatchObject({ email: "client@x.fr" });
  });

  it("reads opt-outs only from Supabase", async () => {
    respond = () => ({ data: [{ email: "A@x.fr " }, { email: "a@x.fr" }] });
    await expect(new SupabaseMarketingRepository().getUnsubscribedEmails()).resolves.toEqual(["a@x.fr"]);
    expect(calls.every((c) => c.table === "marketing_unsubscribes")).toBe(true);
  });
});
