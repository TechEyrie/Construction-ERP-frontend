import assert from "node:assert/strict";
import { filterNavForRole, switchProjectPath, PROJECT_NAV_ITEMS } from "../src/config/navigation.ts";

const contractor = filterNavForRole("Contractor");
assert.ok(!contractor.some((i) => i.id === "payments"));
assert.ok(!contractor.some((i) => i.id === "funding"));
assert.ok(contractor.some((i) => i.id === "progress"));

const finance = filterNavForRole("Finance");
assert.ok(finance.some((i) => i.id === "payments"));
assert.ok(finance.some((i) => i.id === "funding"));
assert.ok(finance.some((i) => i.id === "progress"));
assert.ok(!finance.some((i) => i.id === "tenders"));
assert.ok(finance.some((i) => i.id === "reports"));
assert.ok(!finance.some((i) => i.id === "settings"));

const owner = filterNavForRole("Owner");
assert.equal(owner.length, PROJECT_NAV_ITEMS.length);
assert.ok(!owner.some((i) => i.id === "settings"));
assert.ok(owner.some((i) => i.id === "reports"));

assert.equal(
  switchProjectPath("/projects/PRJ_A/boq", "PRJ_A", "PRJ_B"),
  "/projects/PRJ_B/boq"
);
assert.equal(
  switchProjectPath("/projects/aaa/unauthorized", "aaa", "bbb"),
  "/projects/bbb"
);

console.log("test-navigation: OK");
