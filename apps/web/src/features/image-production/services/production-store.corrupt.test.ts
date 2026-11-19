import { describe, expect, it } from "vitest";
import { makeRepo, MemoryStorage } from "../test-utils";
import { FLOW_STORAGE_KEY } from "./production-repository";
import { createProductionStore } from "./production-store";

describe("production store recovery", () => {
  it("keeps the corrupted-data notice when the first load also runs interrupted-run recovery", async () => {
    const storage = new MemoryStorage();
    storage.setItem(FLOW_STORAGE_KEY, "{broken");
    const { repo } = makeRepo(storage);
    const store = createProductionStore(() => repo);
    store.subscribe(() => undefined);
    await new Promise(resolve => setTimeout(resolve, 0));
    const state = store.getSnapshot();
    expect(state.status).toBe("ready");
    expect(state.flows).toEqual([]);
    expect(state.notice).toMatch(/bị hỏng/);
  });
});
