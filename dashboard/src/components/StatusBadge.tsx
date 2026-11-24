import { stageLabels, type Stage } from "@/lib/data";

const tone: Record<Stage, string> = {
  [-1]: "bg-bad-bg text-bad-fg",
  0: "bg-warn-bg text-warn-fg",
  1: "bg-info-bg text-info-fg",
  2: "bg-sand text-[#6b4a2e]",
  3: "bg-[#ede4f3] text-[#5b3a75]",
  4: "bg-teal-bg text-teal-fg",
  5: "bg-teal-bg text-teal-fg",
  6: "bg-ok-bg text-ok-fg",
};

export function StatusBadge({ stage }: { stage: Stage }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-[5px] text-xs font-bold ${tone[stage]}`}>{stageLabels[stage]}</span>;
}
