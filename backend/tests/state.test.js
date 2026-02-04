const assert = require("assert");

const { tickState } = require("../state");

const stateRow = {
  state_json: {
    energy: 0,
    energyMax: 10,
  },
  last_tick_ts: Date.now() - 10000,
};

const now = Date.now();
const updated = tickState(stateRow, now);

assert.ok(updated.state_json.energy > 0, "Energy should regenerate");
assert.ok(updated.state_json.energy <= updated.state_json.energyMax, "Energy should not exceed max");

console.log("state.test.js passed");
