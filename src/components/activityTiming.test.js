import test from "node:test";
import assert from "node:assert/strict";
import { getCreateActivityDefaults } from "./createActivityDefaults.js";
import {
  getActivityDateTimes,
  isActivityTimeRangeValid,
} from "./activityTiming.js";

const configuredDefaults = (durations) =>
  getCreateActivityDefaults({ _source: "custom_module", durations });

const minutesBetween = ({ start, end }) => (end - start) / 60_000;

test("new activities prefer one hour over the first configured duration", () => {
  for (const durations of [[0, 10, 30, 60, 120], [120, "60", 0, 30]]) {
    const defaults = configuredDefaults(durations);
    assert.equal(defaults.duration, 60);
    assert.equal(defaults.Duration_Min, 60);
  }

  const fallbackDefaults = getCreateActivityDefaults();
  assert.equal(fallbackDefaults.duration, 60);
  assert.equal(fallbackDefaults.Duration_Min, 60);
});

test("a configuration without one hour uses its first positive duration", () => {
  const defaults = configuredDefaults([0, 5, 30]);
  assert.equal(defaults.duration, 5);
  assert.equal(defaults.Duration_Min, 5);
});

test("empty or nonpositive duration configuration does not invent an option", () => {
  for (const durations of [[], [0], [-30, 0]]) {
    const defaults = configuredDefaults(durations);
    assert.equal(defaults.duration, "");
    assert.equal(defaults.Duration_Min, "");
  }
});

test("opening an activity and moving its start both retain a one-hour end", () => {
  const { Duration_Min } = configuredDefaults([0, 10, 30, 60, 120]);

  for (const value of ["2026-10-01T20:18:00+10:00", "2026-10-02T09:30:00+10:00"]) {
    const dates = getActivityDateTimes(value, Duration_Min);
    assert.equal(dates.start.getTime(), new Date(value).getTime());
    assert.equal(minutesBetween(dates), 60);
    assert.equal(isActivityTimeRangeValid(dates.start, dates.end), true);
  }
});

test("moving the start preserves a manually selected positive duration", () => {
  for (const duration of [90, "90", "1.5 hours"]) {
    const dates = getActivityDateTimes("2026-10-01T10:00:00Z", duration);
    assert.equal(dates.end.toISOString(), "2026-10-01T11:30:00.000Z");
  }
});

test("missing, invalid, and nonpositive duration cannot create equal times", () => {
  for (const duration of [undefined, "", null, "invalid", NaN, Infinity, 0, "0", -10]) {
    const dates = getActivityDateTimes("2026-10-01T10:00:00Z", duration);
    assert.equal(minutesBetween(dates), 60, `duration: ${String(duration)}`);
  }
});

test("the default hour rolls over midnight, month end, and year end", () => {
  const cases = [
    ["2026-10-01T23:30:00Z", "2026-10-02T00:30:00.000Z"],
    ["2026-10-31T23:30:00Z", "2026-11-01T00:30:00.000Z"],
    ["2026-12-31T23:30:00Z", "2027-01-01T00:30:00.000Z"],
  ];

  for (const [start, expectedEnd] of cases) {
    const dates = getActivityDateTimes(start);
    assert.equal(dates.end.toISOString(), expectedEnd);
    assert.equal(minutesBetween(dates), 60);
  }
});

test("time validation requires valid dates and a strictly later end", () => {
  const start = "2026-10-01T10:00:00Z";
  const end = "2026-10-01T11:00:00Z";

  assert.equal(isActivityTimeRangeValid(start, end), true);
  assert.equal(isActivityTimeRangeValid(new Date(start), new Date(end)), true);
  assert.equal(isActivityTimeRangeValid(start, start), false);
  assert.equal(isActivityTimeRangeValid(end, start), false);

  for (const invalid of ["", null, undefined, "invalid", new Date(NaN)]) {
    assert.equal(isActivityTimeRangeValid(invalid, end), false);
    assert.equal(isActivityTimeRangeValid(start, invalid), false);
  }
});
