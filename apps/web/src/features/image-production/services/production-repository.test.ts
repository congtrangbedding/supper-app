import { describe, expect, it } from "vitest";
import { byId, config, inputFor, makeRepo, MemoryStorage, seed } from "../test-utils";
import { applyPreset } from "./flow-model";
import { getPreset } from "./presets";
import { FLOW_STORAGE_KEY, FlowLockedError, FlowNotFoundError, FlowValidationError } from "./production-repository";
import { MAX_FLOWS, MAX_RUNS_PER_FLOW } from "../types/production";

const products = seed();
const cooling = byId(products, "sample-cooling");
const bamboo = byId(products, "sample-bamboo");

describe("createFlows", () => {
  it("creates one flow per target with nine slots, snapshots and no binary data", async () => {
    const { repo, storage } = makeRepo();
    const { created } = await repo.createFlows([inputFor(cooling, 0), inputFor(cooling, 1)], config());
    expect(created).toHaveLength(2);
    expect(new Set(created.map(f => f.id)).size).toBe(2);
    for (const flow of created) {
      expect(flow.config.slots).toHaveLength(9);
      expect(flow.status).toBe("READY");
      expect(flow.runs).toEqual([]);
      expect(flow.snapshot.productName).toBe(cooling.name);
    }
    expect(created[0]!.snapshot.variantSku).toBe(cooling.variants[0]!.sku);
    const raw = storage.getItem(FLOW_STORAGE_KEY)!;
    expect(raw).not.toMatch(/blob:|data:image/);
    expect(raw).not.toContain(cooling.description || "§§"); // product data is not copied
  });
  it("does not create the same product/variant twice unless confirmed", async () => {
    const { repo } = makeRepo();
    await repo.createFlows([inputFor(cooling, 0)], config());
    const again = await repo.createFlows([inputFor(cooling, 0), inputFor(bamboo)], config());
    expect(again.created).toHaveLength(1);
    expect(again.duplicates).toHaveLength(1);
    expect((await repo.listFlows()).flows).toHaveLength(2);
    const forced = await repo.createFlows(again.duplicates, config(), { allowDuplicates: true });
    expect(forced.created).toHaveLength(1);
    expect((await repo.listFlows()).flows).toHaveLength(3);
  });
  it("ignores the same target repeated inside one submit", async () => {
    const { repo } = makeRepo();
    const result = await repo.createFlows([inputFor(cooling, 0), inputFor(cooling, 0)], config(), { allowDuplicates: true });
    expect(result.created).toHaveLength(1);
  });
  it("creates nothing for an empty selection and rejects invalid configs", async () => {
    const { repo } = makeRepo();
    expect((await repo.createFlows([], config())).created).toEqual([]);
    await expect(repo.createFlows([inputFor(cooling)], { ...config(), slots: [] })).rejects.toBeInstanceOf(FlowValidationError);
    expect((await repo.listFlows()).flows).toEqual([]);
  });
  it("stops at the flow limit instead of growing without bound", async () => {
    const { repo } = makeRepo();
    const many = Array.from({ length: MAX_FLOWS + 5 }, (_, i) => ({ productId: "p" + i, snapshot: inputFor(cooling).snapshot }));
    const result = await repo.createFlows(many, config());
    expect(result.created).toHaveLength(MAX_FLOWS);
    expect(result.overLimit).toHaveLength(5);
    await expect(repo.duplicateFlow(result.created[0]!.id)).rejects.toThrow(/giới hạn/);
  });
});

describe("update, duplicate, delete", () => {
  it("updates configuration, bumps updatedAt and is independent of preset edits", async () => {
    const { repo } = makeRepo();
    const { created } = await repo.createFlows([inputFor(cooling, 0)], config());
    const flow = created[0]!;
    const next = await repo.updateFlow(flow.id, { config: { outputRatios: "BOTH", creativeInstructions: "tông sáng" } });
    expect(next.config.outputRatios).toBe("BOTH");
    expect(next.config.slots).toEqual(flow.config.slots);
    expect(next.updatedAt > flow.updatedAt).toBe(true);
    expect((await repo.getFlowById(flow.id))!.config.creativeInstructions).toBe("tông sáng");
  });
  it("rejects invalid updates and unknown ids", async () => {
    const { repo } = makeRepo();
    const flow = (await repo.createFlows([inputFor(cooling, 0)], config())).created[0]!;
    await expect(repo.updateFlow(flow.id, { config: { outputRatios: "PORTRAIT", templateSetId: "promotional" } })).rejects.toBeInstanceOf(FlowValidationError);
    await expect(repo.updateFlow("nope", {})).rejects.toBeInstanceOf(FlowNotFoundError);
    expect((await repo.getFlowById("nope"))).toBeNull();
  });
  it("returns a finished flow to READY when its configuration changes, but locks running flows", async () => {
    const { repo } = makeRepo();
    const flow = (await repo.createFlows([inputFor(cooling, 0)], config())).created[0]!;
    await repo.updateFlow(flow.id, { status: "DEMO_COMPLETED" });
    expect((await repo.updateFlow(flow.id, { config: { outputRatios: "BOTH" } })).status).toBe("READY");
    await repo.updateFlow(flow.id, { status: "SIMULATING" });
    await expect(repo.updateFlow(flow.id, { config: { outputRatios: "SQUARE" } })).rejects.toBeInstanceOf(FlowLockedError);
  });
  it("duplicates with a new id, fresh history and an independent copy of the slots", async () => {
    const { repo } = makeRepo();
    const flow = (await repo.createFlows([inputFor(cooling, 0)], config())).created[0]!;
    await repo.updateFlow(flow.id, { status: "DEMO_COMPLETED", run: { id: "r", startedAt: "a", endedAt: "b", outcome: "completed", note: "" } });
    const copy = await repo.duplicateFlow(flow.id);
    expect(copy.id).not.toBe(flow.id);
    expect(copy.productId).toBe(flow.productId);
    expect(copy.status).toBe("READY");
    expect(copy.runs).toEqual([]);
    expect(copy.config.slots).not.toBe(flow.config.slots);
    await expect(repo.duplicateFlow("nope")).rejects.toBeInstanceOf(FlowNotFoundError);
  });
  it("deletes one or many flows", async () => {
    const { repo } = makeRepo();
    const created = (await repo.createFlows([inputFor(cooling, 0), inputFor(cooling, 1), inputFor(bamboo)], config())).created;
    await repo.deleteFlow(created[0]!.id);
    await expect(repo.deleteFlow(created[0]!.id)).rejects.toBeInstanceOf(FlowNotFoundError);
    await repo.deleteFlows([created[1]!.id, "ghost"]);
    expect((await repo.listFlows()).flows.map(f => f.id)).toEqual([created[2]!.id]);
  });
  it("caps run history", async () => {
    const { repo } = makeRepo();
    const flow = (await repo.createFlows([inputFor(cooling, 0)], config())).created[0]!;
    for (let i = 0; i < MAX_RUNS_PER_FLOW + 5; i++) await repo.updateFlow(flow.id, { run: { id: "r" + i, startedAt: "a", endedAt: "b", outcome: "completed", note: "" } });
    const runs = (await repo.getFlowById(flow.id))!.runs;
    expect(runs).toHaveLength(MAX_RUNS_PER_FLOW);
    expect(runs.at(-1)!.id).toBe("r" + (MAX_RUNS_PER_FLOW + 4));
  });
});

describe("bulk operations and reset", () => {
  it("changes template set and ratios for many flows and reports skipped ones", async () => {
    const { repo } = makeRepo();
    const flows = (await repo.createFlows([inputFor(cooling, 0), inputFor(cooling, 1), inputFor(bamboo)], config())).created;
    await repo.updateFlow(flows[2]!.id, { status: "SIMULATING" });
    const preset = applyPreset(config(), getPreset("lifestyle-bedroom")!);
    const result = await repo.bulkUpdateFlows(
      flows.map(f => f.id),
      { config: { templateSetId: preset.templateSetId, templateSetName: preset.templateSetName, slots: preset.slots, outputRatios: "PORTRAIT" } }
    );
    expect(result.updated).toHaveLength(2);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]!.reason).toMatch(/đang mô phỏng/i);
    expect((await repo.getFlowById(flows[0]!.id))!.config.templateSetId).toBe("lifestyle-bedroom");
  });
  it("skips flows whose ratio the new template set does not support", async () => {
    const { repo } = makeRepo();
    const flow = (await repo.createFlows([inputFor(cooling, 0)], { ...config(), outputRatios: "PORTRAIT" })).created[0]!;
    const promo = applyPreset(config(), getPreset("promotional")!);
    const result = await repo.bulkUpdateFlows([flow.id], { config: { templateSetId: promo.templateSetId, templateSetName: promo.templateSetName, slots: promo.slots } });
    expect(result.updated).toEqual([]);
    expect(result.skipped[0]!.reason).toMatch(/không hỗ trợ/);
  });
  it("changes ratios in bulk", async () => {
    const { repo } = makeRepo();
    const flows = (await repo.createFlows([inputFor(cooling, 0), inputFor(bamboo)], config())).created;
    const result = await repo.bulkUpdateFlows(flows.map(f => f.id), { config: { outputRatios: "BOTH" } });
    expect(result.updated.map(f => f.config.outputRatios)).toEqual(["BOTH", "BOTH"]);
  });
  it("resets demo state without deleting flows", async () => {
    const { repo } = makeRepo();
    const flow = (await repo.createFlows([inputFor(cooling, 0)], config())).created[0]!;
    await repo.updateFlow(flow.id, { status: "DEMO_FAILED", attempts: 2, run: { id: "r", startedAt: "a", endedAt: "b", outcome: "failed", note: "" } });
    const [after] = await repo.resetDemoFlows();
    expect(after).toMatchObject({ id: flow.id, status: "READY", attempts: 0, runs: [] });
  });
});

describe("persistence and recovery", () => {
  it("survives a reload (new repository on the same storage)", async () => {
    const storage = new MemoryStorage();
    const first = makeRepo(storage);
    const created = (await first.repo.createFlows([inputFor(cooling, 0)], config())).created[0]!;
    const second = makeRepo(storage);
    expect((await second.repo.listFlows()).flows).toEqual([created]);
  });
  it("recovers from corrupted JSON with a notice", async () => {
    const storage = new MemoryStorage();
    storage.setItem(FLOW_STORAGE_KEY, "{not json");
    const { repo } = makeRepo(storage);
    const result = await repo.listFlows();
    expect(result.flows).toEqual([]);
    expect(result.notice).toMatch(/bị hỏng/);
    expect((await repo.listFlows()).notice).toBeUndefined(); // reset persisted
  });
  it("recovers from a wrong version", async () => {
    const storage = new MemoryStorage();
    storage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ version: 99, flows: [] }));
    expect((await makeRepo(storage).repo.listFlows()).notice).toBeDefined();
  });
  it("keeps valid flows and drops invalid records", async () => {
    const storage = new MemoryStorage();
    const { repo } = makeRepo(storage);
    const good = (await repo.createFlows([inputFor(cooling, 0)], config())).created[0]!;
    storage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ version: 1, flows: [good, { id: "bad" }, { ...good, id: "bad2", status: "RENDERED" }] }));
    const result = await repo.listFlows();
    expect(result.flows.map(f => f.id)).toEqual([good.id]);
    expect(result.notice).toMatch(/2 flow/);
  });
  it("does not throw when storage is blocked", async () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => undefined, removeItem: () => undefined };
    const { repo } = makeRepo(blocked as unknown as MemoryStorage);
    expect((await repo.listFlows()).notice).toMatch(/chặn/);
  });
  it("marks flows left SIMULATING as interrupted failures", async () => {
    const { repo } = makeRepo();
    const flow = (await repo.createFlows([inputFor(cooling, 0)], config())).created[0]!;
    await repo.updateFlow(flow.id, { status: "SIMULATING" });
    const [after] = await repo.recoverInterrupted();
    expect(after!.status).toBe("DEMO_FAILED");
    expect(after!.runs.at(-1)!.outcome).toBe("interrupted");
  });
});
