import { normalizeDurationValue } from "../services/picklistConfigService.js";

export const getActivityDateTimes = (start, duration = 60) => {
  const minutes = Number(normalizeDurationValue(duration));
  const durationMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
  const startDate = new Date(start);

  return {
    start: startDate,
    end: new Date(startDate.getTime() + durationMinutes * 60_000),
  };
};

export const isActivityTimeRangeValid = (start, end) => {
  if (!start || !end) return false;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return (
    Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime
  );
};
