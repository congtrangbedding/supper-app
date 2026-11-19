import { describe, expect, it } from "vitest";
import { byId, config, fakeScheduler, inputFor, makeRepo, seed } from "../test-utils";
import { createProductionStore } from "./production-store";
import { createSimulationRunner, FAIL_AT_STEP, shouldFailDemo } from "./simulation";

const products = seed();
const cooling = byId(products, "sample-cooling");
const bamboo = byId(products, "sample-bamboo");
const rattan = byId(products, "sample-rattan"); // not ready

const never = () => false;

async function setup(fails: (id: string, attempt: number) => boolean = never, storage?: Parameters<typeof makeRepo>[0]) {
  const { repo, storage: mem } = makeRepo(storage);
  const clock = fakeScheduler();
  const store = createProductionStore(() => repo, { scheduler: clock.scheduler, fails, now: () => new Date("2026-01-01T00:00:00Z") });
  store.subscribe(() => undefined);
  await store.refresh();
  return { store, repo, clock, storage: mem };
}
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const statusOf = (store: Awaited<ReturnType<typeof setup>>["store"], id: string) => store.getSnapshot().flows.find(f => f.id === id)!.status;

describe("simulation runner", () => {
  it("is deterministic and only fails the first attempt", () => {
    expect(shouldFailDemo("abc", 1)).toBe(shouldFailDemo("abc", 1));
    expect(shouldFailDemo("anything", 2)).toBe(false);
    const sample = Array.from({ length: 200 }, (_, i) => shouldFailDemo("flow-" + i, 1)).filter(Boolean).length;
    expect(sample).toBeGreaterThan(10);
    expect(sample).toBeLessThan(100);
  });
  it("reports progress per slot, finishes once, and ignores a second start", () => {
    const clock = fakeScheduler();
    const log: string[] = [];
    const runner = createSimulationRunner({ scheduler: clock.scheduler, fails: never, onProgress: (_, s, t) => log.push(s + "/" + t), onFinish: (_, o) => log.push(o) });
    expect(runner.start("a", 1)).toBe(true);
    expect(runner.start("a", 1)).toBe(false);
    clock.tick(9);
    expect(log).toEqual(["1/9", "2/9", "3/9", "4/9", "5/9", "6/9", "7/9", "8/9", "9/9", "completed"]);
    expect(clock.active).toBe(0);
    clock.tick(3);
    expect(log).toHaveLength(10); // no stale updates
  });
  it("fails at the fixed step and cancel stops further updates", () => {
    const clock = fakeScheduler();
    const log: string[] = [];
    const runner = createSimulationRunner({ scheduler: clock.scheduler, fails: id => id === "bad", onProgress: (id, s) => log.push(id + s), onFinish: (id, o) => log.push(id + o) });
    runner.start("bad", 1);
    runner.start("ok", 2);
    clock.tick(FAIL_AT_STEP);
    expect(log).toContain("badfailed");
    expect(runner.cancel("ok")).toBe(true);
    expect(runner.cancel("ok")).toBe(false);
    const before = log.length;
    clock.tick(5);
    expect(log).toHaveLength(before);
  });
  it("stopAll clears timers without reporting", () => {
    const clock = fakeScheduler();
    let finished = 0;
    const runner = createSimulationRunner({ scheduler: clock.scheduler, fails: never, onProgress: () => undefined, onFinish: () => finished++ });
    runner.start("a", 1);
    runner.start("b", 1);
    expect(runner.stopAll().sort()).toEqual(["a", "b"]);
    expect(clock.active).toBe(0);
    expect(finished).toBe(0);
  });
});

describe("production store", () => {
  it("runs a flow to DEMO_COMPLETED and records history without creating assets", async () => {
    const { store, clock } = await setup();
    const [flow] = (await store.createFlows([inputFor(cooling, 0)], config())).created;
    const result = await store.start([flow!.id], products);
    expect(result.started).toEqual([flow!.id]);
    expect(statusOf(store, flow!.id)).toBe("SIMULATING");
    clock.tick(4);
    expect(store.getSnapshot().progress[flow!.id]).toBe(4);
    clock.tick(5);
    await flush();
    expect(statusOf(store, flow!.id)).toBe("DEMO_COMPLETED");
    expect(store.getSnapshot().progress[flow!.id]).toBeUndefined();
    const saved = store.getSnapshot().flows[0]!;
    expect(saved.runs).toHaveLength(1);
    expect(saved.runs[0]!.outcome).toBe("completed");
    expect(JSON.stringify(saved)).not.toMatch(/\.(png|jpg|webp)|blob:/);
  });
  it("cancels, then can start again", async () => {
    const { store, clock } = await setup();
    const id = (await store.createFlows([inputFor(cooling, 0)], config())).created[0]!.id;
    await store.start([id], products);
    clock.tick(2);
    expect(store.cancel(id)).toBe(true);
    await flush();
    expect(statusOf(store, id)).toBe("CANCELLED");
    expect(clock.active).toBe(0);
    expect((await store.start([id], products)).started).toEqual([id]);
  });
  it("fails on the first attempt, retries successfully and counts attempts", async () => {
    const { store, clock } = await setup((_, attempt) => attempt === 1);
    const id = (await store.createFlows([inputFor(cooling, 0)], config())).created[0]!.id;
    await store.start([id], products);
    clock.tick(FAIL_AT_STEP);
    await flush();
    expect(statusOf(store, id)).toBe("DEMO_FAILED");
    await store.start([id], products); // retry
    clock.tick(9);
    await flush();
    expect(statusOf(store, id)).toBe("DEMO_COMPLETED");
    expect(store.getSnapshot().flows[0]!.attempts).toBe(2);
    expect(store.getSnapshot().flows[0]!.runs.map(r => r.outcome)).toEqual(["failed", "completed"]);
  });
  it("requires a reset before re-running a completed flow", async () => {
    const { store, clock } = await setup();
    const id = (await store.createFlows([inputFor(cooling, 0)], config())).created[0]!.id;
    await store.start([id], products);
    clock.tick(9);
    await flush();
    const again = await store.start([id], products);
    expect(again.started).toEqual([]);
    expect(again.skipped[0]!.reason).toMatch(/đặt lại/);
    await store.reset([id]);
    expect(statusOf(store, id)).toBe("READY");
  });
  it("processes several flows at once and skips products that are not ready or were deleted", async () => {
    const { store, clock } = await setup();
    const created = (await store.createFlows([inputFor(cooling, 0), inputFor(cooling, 1), inputFor(bamboo), inputFor(rattan, 0)], config())).created;
    const ids = created.map(f => f.id);
    const result = await store.start(ids, products);
    expect(result.started).toHaveLength(3);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]!.reason).toMatch(/ảnh/);
    expect(clock.active).toBe(3);
    clock.tick(9);
    await flush();
    expect(ids.filter(id => statusOf(store, id) === "DEMO_COMPLETED")).toHaveLength(3);
    // deleted product
    const orphan = (await store.createFlows([inputFor(bamboo)], config(), { allowDuplicates: true })).created[0]!;
    const res = await store.start([orphan.id], products.filter(p => p.id !== bamboo.id));
    expect(res.started).toEqual([]);
    expect(res.skipped[0]!.reason).toMatch(/đã bị xóa/);
  });
  it("does not start the same flow twice", async () => {
    const { store, clock } = await setup();
    const id = (await store.createFlows([inputFor(cooling, 0)], config())).created[0]!.id;
    await store.start([id], products);
    const second = await store.start([id], products);
    expect(second.started).toEqual([]);
    expect(clock.active).toBe(1);
  });
  it("deleting a running flow stops its timer", async () => {
    const { store, clock } = await setup();
    const id = (await store.createFlows([inputFor(cooling, 0)], config())).created[0]!.id;
    await store.start([id], products);
    await store.remove([id]);
    await flush();
    expect(clock.active).toBe(0);
    expect(store.getSnapshot().flows).toEqual([]);
    clock.tick(5);
    expect(store.getSnapshot().flows).toEqual([]);
  });
  it("leaving the page interrupts simulations and leaves no timers", async () => {
    const { store, clock } = await setup();
    const ids = (await store.createFlows([inputFor(cooling, 0), inputFor(bamboo)], config())).created.map(f => f.id);
    await store.start(ids, products);
    await store.interruptSimulations();
    expect(clock.active).toBe(0);
    for (const id of ids) {
      expect(statusOf(store, id)).toBe("DEMO_FAILED");
      expect(store.getSnapshot().flows.find(f => f.id === id)!.runs[0]!.outcome).toBe("interrupted");
    }
    expect(store.getSnapshot().progress).toEqual({});
  });
  it("reload during simulation: the next store marks the flow interrupted instead of resuming", async () => {
    const first = await setup();
    const id = (await first.store.createFlows([inputFor(cooling, 0)], config())).created[0]!.id;
    await first.store.start([id], products);
    first.clock.tick(3);
    // simulate a reload: brand-new store and timers on the same storage
    const clock2 = fakeScheduler();
    const { repo } = makeRepo(first.storage);
    const reloaded = createProductionStore(() => repo, { scheduler: clock2.scheduler });
    reloaded.subscribe(() => undefined);
    await flush();
    expect(statusOf(reloaded, id)).toBe("DEMO_FAILED");
    expect(clock2.active).toBe(0);
    expect(reloaded.getSnapshot().progress).toEqual({});
    expect((await reloaded.start([id], products)).started).toEqual([id]); // can retry
  });
  it("resetAll stops timers and returns every flow to READY", async () => {
    const { store, clock } = await setup();
    const ids = (await store.createFlows([inputFor(cooling, 0), inputFor(bamboo)], config())).created.map(f => f.id);
    await store.start([ids[0]!], products);
    await store.resetAll();
    expect(clock.active).toBe(0);
    expect(ids.map(id => statusOf(store, id))).toEqual(["READY", "READY"]);
  });
  it("bulk update through the store refreshes state", async () => {
    const { store } = await setup();
    const ids = (await store.createFlows([inputFor(cooling, 0), inputFor(bamboo)], config())).created.map(f => f.id);
    const result = await store.bulkUpdate(ids, { config: { outputRatios: "BOTH" } });
    expect(result.updated).toHaveLength(2);
    expect(store.getSnapshot().flows.every(f => f.config.outputRatios === "BOTH")).toBe(true);
  });
});
