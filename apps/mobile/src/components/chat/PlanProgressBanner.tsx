import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { ThemedText } from "@/components/themed-text";
import { Icon } from "@/components/ui/icon";
import { Colors, Spacing } from "@/constants/theme";
import { hapticSelection } from "@/lib/haptics";

import {
  activePlanProgressStep,
  type TimelinePlanProgress,
  type TimelinePlanProgressStepStatus,
  type TimelineSubagent,
  type TimelineSubagentStatus,
  type TimelineSubagentSummary,
} from "./plan-progress";

export function PlanProgressBanner({
  progress,
  subagents,
}: {
  progress?: TimelinePlanProgress;
  subagents?: TimelineSubagentSummary;
}) {
  const [isExpanded, setExpanded] = useState(false);

  if (!progress) {
    return null;
  }

  const completedStepCount = progress.steps.filter((step) => step.status === "completed").length;
  const stepCount = progress.steps.length;
  const activeStep = activePlanProgressStep(progress);
  const subagentCount = subagents?.agents.length ?? 0;
  const subagentText = subagents ? subagentStatusText(subagents.agents) : undefined;
  const subagentAccessibilityText = subagentText
    ? `, ${subagentCount} subagents, ${subagentText}`
    : "";

  return (
    <Animated.View entering={FadeIn.duration(160)} style={styles.bannerHost}>
      <Pressable
        accessibilityLabel={`Plan progress: ${completedStepCount} of ${stepCount} steps completed${subagentAccessibilityText}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityValue={{ max: stepCount, min: 0, now: completedStepCount }}
        onPress={() => {
          hapticSelection();
          setExpanded((current) => !current);
        }}
        style={() => [styles.banner]}
      >
        <View style={styles.summaryContent}>
          <ThemedText type="code" style={styles.label}>
            Plan
          </ThemedText>
          <View style={styles.summaryRow}>
            {activeStep ? <PlanProgressMarker status={activeStep.status} /> : null}
            <ThemedText type="small" numberOfLines={1} style={styles.summaryText}>
              {activeStep ? activeStep.text : "Updating plan"}
            </ThemedText>
            <View style={styles.trailingGroup}>
              {subagents ? (
                <Animated.View entering={FadeIn.duration(120)} style={styles.compactSubagents}>
                  <SubagentStatusGlyphs agents={subagents.agents} />
                  <ThemedText type="code" style={styles.subagentCountText}>
                    ×{subagentCount}
                  </ThemedText>
                </Animated.View>
              ) : null}
              <ThemedText type="code" style={styles.countText}>
                {completedStepCount}/{stepCount}
              </ThemedText>
              <Icon
                name={isExpanded ? "expand" : "chevronRight"}
                size={16}
                tintColor={Colors.dark.textSecondary}
              />
            </View>
          </View>
        </View>
      </Pressable>

      {isExpanded ? (
        <Animated.View entering={FadeIn.duration(120)} style={styles.expandedPanel}>
          {progress.steps.map((step) => (
            <View
              key={step.id}
              accessible
              accessibilityLabel={`${planProgressStatusLabel(step.status)}: ${step.text}`}
              style={styles.stepRow}
            >
              <View style={styles.stepMarkerSlot}>
                <PlanProgressMarker status={step.status} />
              </View>
              <ThemedText
                numberOfLines={2}
                type="small"
                style={[styles.stepText, step.status === "pending" && styles.stepTextPending]}
              >
                {step.text}
              </ThemedText>
            </View>
          ))}
          {subagents ? (
            <Animated.View
              accessible
              accessibilityLabel={`${subagentCount} subagents, ${subagentText}`}
              entering={FadeIn.duration(120)}
              style={styles.subagentSection}
            >
              <View style={styles.subagentSectionHeader}>
                <Icon name="branch" size={12} tintColor={Colors.dark.textSecondary} />
                <ThemedText type="code" style={styles.subagentLabel}>
                  Subagents
                </ThemedText>
              </View>
              <View style={styles.subagentSummaryRow}>
                <SubagentGlyphs agents={subagents.agents} limit={4} />
                <ThemedText type="code" numberOfLines={1} style={styles.subagentStatusText}>
                  {subagentText}
                </ThemedText>
              </View>
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function SubagentGlyphs({ agents, limit }: { agents: readonly TimelineSubagent[]; limit: number }) {
  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.subagentGlyphs}
    >
      {agents.slice(0, limit).map((agent, index) => (
        <Animated.View
          entering={FadeIn.delay(index * 35).duration(120)}
          key={agent.id}
          style={styles.subagentGlyph}
        >
          <Icon
            name={subagentIconName(agent.status)}
            size={11}
            strokeWidth={2.2}
            tintColor={subagentColor(agent.status, index)}
          />
        </Animated.View>
      ))}
    </View>
  );
}

function SubagentStatusGlyphs({ agents }: { agents: readonly TimelineSubagent[] }) {
  const counts = subagentStatusCounts(agents);
  const statuses = (["running", "completed", "interrupted", "failed"] as const).filter(
    (status) => counts[status] > 0,
  );

  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.subagentGlyphs}
    >
      {statuses.map((status, index) => (
        <Animated.View
          entering={FadeIn.delay(index * 35).duration(120)}
          key={status}
          style={styles.aggregateSubagentGlyph}
        >
          <Icon
            name={subagentIconName(status)}
            size={11}
            strokeWidth={2.2}
            tintColor={subagentColor(status, index)}
          />
          {counts[status] > 1 ? (
            <ThemedText type="code" style={styles.aggregateSubagentCount}>
              {counts[status]}
            </ThemedText>
          ) : null}
        </Animated.View>
      ))}
    </View>
  );
}

function subagentIconName(status: TimelineSubagentStatus) {
  switch (status) {
    case "running":
      return "running";
    case "completed":
      return "goal";
    case "interrupted":
      return "stop";
    case "failed":
      return "warning";
  }
}

function subagentColor(status: TimelineSubagentStatus, index: number) {
  if (status === "completed") {
    return "#8FD19E";
  }
  if (status === "failed") {
    return "#D84F4F";
  }
  if (status === "interrupted") {
    return Colors.dark.textSecondary;
  }

  const activeColors = [
    Colors.dark.powerBlue,
    Colors.dark.powerViolet,
    Colors.dark.powerMagenta,
  ] as const;
  return activeColors[index % activeColors.length];
}

function subagentStatusText(agents: readonly TimelineSubagent[]) {
  const counts = subagentStatusCounts(agents);
  const segments = [
    counts.running > 0 ? `${counts.running} active` : undefined,
    counts.completed > 0 ? `${counts.completed} done` : undefined,
    counts.interrupted > 0 ? `${counts.interrupted} stopped` : undefined,
    counts.failed > 0 ? `${counts.failed} failed` : undefined,
  ];

  return segments.filter((segment): segment is string => Boolean(segment)).join(" · ");
}

function subagentStatusCounts(agents: readonly TimelineSubagent[]) {
  const counts: Record<TimelineSubagentStatus, number> = {
    completed: 0,
    failed: 0,
    interrupted: 0,
    running: 0,
  };
  for (const agent of agents) {
    counts[agent.status] += 1;
  }
  return counts;
}

function planProgressStatusLabel(status: TimelinePlanProgressStepStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "inProgress":
      return "In progress";
    case "pending":
      return "Pending";
  }
}

function PlanProgressMarker({ status }: { status: TimelinePlanProgressStepStatus }) {
  const rotation = useSharedValue(0);
  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    if (status !== "inProgress") {
      rotation.value = 0;
      return;
    }
    rotation.value = withRepeat(withTiming(360, { duration: 900 }), -1, false);
  }, [rotation, status]);

  if (status === "completed") {
    return (
      <View style={[styles.marker, styles.markerCompleted]}>
        <Icon name="check" size={8} tintColor="#151515" strokeWidth={3} />
      </View>
    );
  }

  if (status === "inProgress") {
    return (
      <View style={[styles.marker, styles.markerActive]}>
        <Animated.View style={spinnerStyle}>
          <Icon name="running" size={9} tintColor="#151515" strokeWidth={2.8} />
        </Animated.View>
      </View>
    );
  }

  return <View style={[styles.marker, styles.markerPending]} />;
}

const styles = StyleSheet.create({
  aggregateSubagentCount: {
    color: Colors.dark.textSecondary,
    fontSize: 8,
    lineHeight: 11,
  },
  aggregateSubagentGlyph: {
    alignItems: "center",
    flexDirection: "row",
    gap: 1,
    minWidth: 12,
  },
  banner: {
    backgroundColor: "rgba(42, 42, 42, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bannerHost: {
    elevation: 20,
    left: Spacing.four,
    position: "absolute",
    right: Spacing.four,
    top: 58,
    zIndex: 20,
  },
  bannerPressed: {
    opacity: 0.78,
  },
  countText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
  },
  compactSubagents: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.half,
    marginRight: Spacing.half,
  },
  expandedPanel: {
    backgroundColor: "rgba(42, 42, 42, 0.96)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    elevation: 20,
    gap: Spacing.one,
    left: 0,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    position: "absolute",
    right: 0,
    top: "100%",
    zIndex: 20,
  },
  label: {
    color: "#9B8BD4",
    fontSize: 12,
    lineHeight: 16,
  },
  marker: {
    alignItems: "center",
    borderRadius: 7,
    height: 14,
    justifyContent: "center",
    width: 14,
  },
  markerActive: {
    backgroundColor: "#9B8BD4",
  },
  markerCompleted: {
    backgroundColor: "#8FD19E",
  },
  markerPending: {
    borderColor: "rgba(176, 180, 186, 0.42)",
    borderWidth: 1,
  },
  stepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 7,
    minHeight: 22,
  },
  stepMarkerSlot: {
    paddingTop: 2,
  },
  stepText: {
    color: Colors.dark.text,
    flex: 1,
    lineHeight: 18,
  },
  stepTextPending: {
    color: Colors.dark.textSecondary,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  summaryContent: {
    gap: 2,
  },
  summaryText: {
    color: Colors.dark.text,
    flex: 1,
    lineHeight: 20,
    minWidth: 0,
  },
  trailingGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one,
  },
  subagentCountText: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
  },
  subagentGlyph: {
    alignItems: "center",
    height: 14,
    justifyContent: "center",
    width: 14,
  },
  subagentGlyphs: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.half,
  },
  subagentLabel: {
    color: Colors.dark.textSecondaryStrong,
    fontSize: 11,
    lineHeight: 15,
  },
  subagentSection: {
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    borderTopWidth: 1,
    gap: Spacing.one,
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
  },
  subagentSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one,
  },
  subagentStatusText: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 10,
  },
  subagentSummaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
    minHeight: 16,
    paddingLeft: Spacing.three,
  },
});
