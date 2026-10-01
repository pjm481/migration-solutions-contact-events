import { getDurationOptionsFromConfig } from "../services/picklistConfigService.js";

export const getCreateActivityDefaults = (picklistConfig) => {
  const durations = getDurationOptionsFromConfig(picklistConfig).filter(
    (duration) => duration > 0
  );
  const duration =
    durations.find((duration) => duration === 60) ?? durations[0] ?? "";

  return {
    Type_of_Activity: "",
    Event_Title: "New Activity",
    Regarding: "",
    duration,
    Duration_Min: duration,
  };
};

export const getActivityTypeSelection = (selectedType) => ({
  Type_of_Activity: selectedType,
  Regarding: "",
});
