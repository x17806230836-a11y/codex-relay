import type {
  CodexModel,
  KnownReasoningEffort,
  ReasoningEffort,
  RuntimePreferences,
} from "codex-relay/api-schema";

export type ModelPickerOption<Value extends string = string> = {
  label: string;
  subtitle?: string;
  value: Value;
};

export type PowerSelection = {
  id: string;
  model: string;
  modelLabel: string;
  powerSettingIndex: number;
  reasoningEffort: ReasoningEffort;
};

export type SpeedDisplayOption = Omit<ModelPickerOption, "value"> & {
  subtitle: string;
  value: string | undefined;
};

export function modelPickerSheetPresentation(showAdvanced: boolean, hasCompactPower = false) {
  return showAdvanced
    ? {
        enableDynamicSizing: true,
        expandedSnapPercent: 94,
        initialSnapIndex: 0,
        scrollable: true,
        showBackButton: hasCompactPower,
      }
    : {
        enableDynamicSizing: true,
        expandedSnapPercent: undefined,
        initialSnapIndex: 0,
        scrollable: false,
        showBackButton: false,
      };
}

type PowerSelectionCandidate = Omit<PowerSelection, "powerSettingIndex">;

const genericReasoningEfforts: ReasoningEffort[] = [
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];
const reasoningTitles = new Map<KnownReasoningEffort, string>([
  ["minimal", "Minimal"],
  ["low", "Light"],
  ["medium", "Medium"],
  ["high", "High"],
  ["xhigh", "Extra High"],
  ["max", "Custom"],
  ["ultra", "Ultra"],
]);
const reasoningSubtitles = new Map<KnownReasoningEffort, string>([
  ["minimal", "Minimal reasoning for the fastest replies"],
  ["low", "Fast replies with light reasoning"],
  ["medium", "Balanced reasoning for everyday work"],
  ["high", "Deeper reasoning for complex work"],
  ["xhigh", "Extra reasoning for difficult problems"],
  ["max", "Maximum reasoning depth for the hardest problems"],
  ["ultra", "Maximum reasoning with automatic task delegation"],
]);

const primaryPowerSelections: PowerSelectionCandidate[] = [
  powerSelection("gpt-5.6-terra", "5.6 Terra", "low"),
  powerSelection("gpt-5.6-sol", "5.6 Sol", "low"),
  powerSelection("gpt-5.6-sol", "5.6 Sol", "medium"),
  powerSelection("gpt-5.6-sol", "5.6 Sol", "high"),
  powerSelection("gpt-5.6-sol", "5.6 Sol", "xhigh"),
  powerSelection("gpt-5.6-sol", "5.6 Sol", "ultra"),
];

const terraPowerSelections: PowerSelectionCandidate[] = [
  powerSelection("gpt-5.6-terra", "5.6 Terra", "low"),
  powerSelection("gpt-5.6-terra", "5.6 Terra", "medium"),
  powerSelection("gpt-5.6-terra", "5.6 Terra", "high"),
  powerSelection("gpt-5.6-terra", "5.6 Terra", "xhigh"),
];

export function powerSelectionsForModels(models: CodexModel[]) {
  const primary = supportedPowerSelections(primaryPowerSelections, models);
  if (primary.length >= 4) {
    return primary;
  }

  const terra = supportedPowerSelections(terraPowerSelections, models);
  return terra.length >= 4 ? terra : [];
}

export function selectedPowerSelection(
  selections: PowerSelection[],
  model: string | undefined,
  reasoningEffort: ReasoningEffort | undefined,
) {
  return selections.find(
    (selection) => selection.model === model && selection.reasoningEffort === reasoningEffort,
  );
}

export function defaultPowerSelection(selections: PowerSelection[]) {
  return selections.find((selection) => selection.reasoningEffort === "medium") ?? selections[0];
}

export function powerSelectionLabel(selection: PowerSelection) {
  return `${selection.modelLabel} ${powerReasoningTitle(selection.reasoningEffort)}`;
}

export function modelButtonLabel(
  model: CodexModel | undefined,
  reasoningEffort: ReasoningEffort | undefined,
  fallbackModelLabel?: string,
) {
  const modelLabel = model?.displayName ?? fallbackModelLabel ?? "No models";
  return modelLabel !== "No models" && reasoningEffort
    ? `${modelLabel} ${reasoningTitle(reasoningEffort)}`
    : modelLabel;
}

export function modelForSelection(models: CodexModel[], selectedModel: string | undefined) {
  if (selectedModel) {
    return models.find((model) => model.model === selectedModel);
  }
  return models.find((model) => model.isDefault) ?? models[0];
}

export function normalizeRuntimePreferencesForModels(
  models: CodexModel[],
  preferences: RuntimePreferences,
) {
  const model = modelForSelection(models, preferences.model);
  if (!model) {
    return preferences;
  }
  return {
    ...preferences,
    model: model.model,
    reasoningEffort:
      preferences.reasoningEffort ?? reasoningEffortForModel(model, preferences.reasoningEffort),
  };
}

export function fastServiceTierForModel(model: CodexModel | undefined) {
  return model?.serviceTiers.find((tier) => {
    const label = `${tier.id} ${tier.name}`.toLowerCase();
    return label.includes("fast") || label.includes("priority");
  });
}

export function reasoningEffortForModel(
  model: CodexModel | undefined,
  selectedReasoningEffort: ReasoningEffort | undefined,
) {
  const supported = model?.supportedReasoningEfforts ?? [];
  if (supported.length === 0) {
    return undefined;
  }
  if (selectedReasoningEffort && supported.includes(selectedReasoningEffort)) {
    return selectedReasoningEffort;
  }
  if (model?.defaultReasoningEffort && supported.includes(model.defaultReasoningEffort)) {
    return model.defaultReasoningEffort;
  }
  return supported.includes("medium") ? "medium" : supported[0];
}

export function reasoningDisplayOptions(
  model: CodexModel | undefined,
  useGenericFallback = false,
): ModelPickerOption<ReasoningEffort>[] {
  const efforts =
    model?.supportedReasoningEfforts ?? (useGenericFallback ? genericReasoningEfforts : []);
  return efforts
    .filter((effort) => effort !== "max")
    .map((effort) => ({
      label: reasoningTitle(effort),
      subtitle:
        effort === "ultra"
          ? "Consumes usage limits faster"
          : (model?.reasoningEffortOptions.find((option) => option.reasoningEffort === effort)
              ?.description ?? reasoningSubtitle(effort)),
      value: effort,
    }));
}

export function speedDisplayOptions(
  model: CodexModel | undefined,
  selectedServiceTier?: string,
): SpeedDisplayOption[] {
  const fastServiceTier = fastServiceTierForModel(model);
  const options: SpeedDisplayOption[] = [
    {
      label: "Standard",
      subtitle: "Standard speed and usage",
      value: undefined,
    },
  ];
  if (fastServiceTier) {
    options.push({
      label: "Fast",
      subtitle: "1.5x speed, more usage",
      value: fastServiceTier.id,
    });
  }
  if (selectedServiceTier && !options.some((option) => option.value === selectedServiceTier)) {
    options.push({
      label: "Custom",
      subtitle: `Service tier: ${selectedServiceTier}`,
      value: selectedServiceTier,
    });
  }
  return options;
}

export function shortModelLabel(model: CodexModel | undefined, fallback?: string) {
  return (model?.displayName ?? fallback ?? "Default")
    .replace(/^GPT-/u, "")
    .replace(/-(?=[A-Z])/gu, " ");
}

export function reasoningTitle(effort: ReasoningEffort) {
  return (
    reasoningTitles.get(effort as KnownReasoningEffort) ??
    effort
      .split(/[-_\s]+/u)
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ")
  );
}

function powerReasoningTitle(effort: ReasoningEffort) {
  switch (effort) {
    case "medium":
      return "Standard";
    case "high":
      return "Extended";
    default:
      return reasoningTitle(effort);
  }
}

function reasoningSubtitle(effort: ReasoningEffort) {
  return (
    reasoningSubtitles.get(effort as KnownReasoningEffort) ??
    `Use ${reasoningTitle(effort)} reasoning`
  );
}

function powerSelection(
  model: string,
  modelLabel: string,
  reasoningEffort: ReasoningEffort,
): PowerSelectionCandidate {
  return {
    id: `${model}:${reasoningEffort}`,
    model,
    modelLabel,
    reasoningEffort,
  };
}

function supportedPowerSelections(candidates: PowerSelectionCandidate[], models: CodexModel[]) {
  return candidates.flatMap((candidate, powerSettingIndex) => {
    const model = models.find((item) => item.model === candidate.model);
    return model?.supportedReasoningEfforts.includes(candidate.reasoningEffort)
      ? [{ ...candidate, powerSettingIndex }]
      : [];
  });
}
