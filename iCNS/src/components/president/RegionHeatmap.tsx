import { useMemo, useState } from "react";
import type { RegionData } from "@/types/analytics";
import { Progress } from "@/components/ui/progress";

type Props = {
  data: RegionData[];
};

const colorForScore = (score: number) => {
  // 0 -> vert, 100 -> rouge
  const r = Math.round((score / 100) * 255);
  const g = Math.round((1 - score / 100) * 170 + 30);
  return `rgb(${r}, ${g}, 80)`;
};

export default function RegionHeatmap({ data }: Props) {
  const [selected, setSelected] = useState<RegionData | null>(null);
  const total = useMemo(() => data.reduce((a, r) => a + r.count, 0), [data]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((r) => (
          <button
            key={r.province}
            onClick={() => setSelected(r)}
            className="p-4 rounded-xl bg-card shadow-neo-sm hover:shadow-neo-md transition-all duration-300 text-left"
            style={{ border: `1px solid ${colorForScore(r.score)}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm text-foreground">{r.province}</p>
              <span className="text-xs text-muted-foreground">{r.count} cas</span>
            </div>
            <div className="p-1 rounded-lg bg-background shadow-neo-inset">
              <Progress value={r.score} className="h-2" />
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="p-4 rounded-xl bg-background shadow-neo-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{selected.province}</p>
              <p className="text-sm text-muted-foreground">
                {selected.count} signalements — score {selected.score}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        Total national: {total} signalements
      </div>
    </div>
  );
}


