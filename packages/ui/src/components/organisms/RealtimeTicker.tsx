import React, { useMemo } from "react";
import { ResponsiveLine } from "@nivo/line";
import { motion, AnimatePresence } from "framer-motion";
import { AnalyticsCard } from "../atoms/AnalyticsAtoms";

interface RealtimeTickerProps {
  data: {
    timeline: { timestamp: number; plays: number; events: number }[];
    active: number;
    trending: any[];
  } | null;
  loading?: boolean;
}

export const RealtimeTicker: React.FC<RealtimeTickerProps> = ({
  data,
  loading,
}) => {
  const chartData = useMemo(() => {
    if (!data?.timeline) return [];

    return [
      {
        id: "Live Plays",
        color: "#6366f1",
        data: data.timeline.map((p) => ({
          x: new Date(p.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          y: p.plays,
        })),
      },
    ];
  }, [data]);

  return (
    <AnalyticsCard
      title={
        <div className="flex items-center gap-3">
          <span>Live Flux</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-red-500">
              Live
            </span>
          </div>
        </div>
      }
      height={350}
      loading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 h-full gap-6">
        <div className="lg:col-span-3 h-full min-h-[200px]">
          {chartData.length > 0 ? (
            <ResponsiveLine
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              xScale={{ type: "point" }}
              yScale={{ type: "linear", min: 0, max: "auto" }}
              curve="step" // Stock market style
              axisTop={null}
              axisRight={null}
              enableArea={true}
              areaOpacity={0.1}
              enableGridX={false}
              colors={["#6366f1"]}
              lineWidth={3}
              pointSize={0}
              useMesh={true}
              theme={{
                text: {
                  fill: "rgba(255, 255, 255, 0.4)",
                  fontSize: 10,
                },
                grid: { line: { stroke: "rgba(255, 255, 255, 0.05)" } },
                axis: { ticks: { line: { stroke: "transparent" } } },
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted/40 text-sm italic">
              Awaiting data stream...
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center border-l border-border/10 pl-6 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">
              Active Now
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={data?.active || 0}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-4xl font-black tracking-tighter text-accent"
              >
                {data?.active || 0}
              </motion.div>
            </AnimatePresence>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-3">
              Recent Heat
            </div>
            <div className="space-y-2">
              {data?.trending?.slice(0, 3).map((item, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="text-[11px] font-bold text-text truncate max-w-[120px]">
                    {item.title || `Track ${item.trackId.slice(0, 8)}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 bg-surface-lighter rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(100, (item.score / 10) * 100)}%`,
                        }}
                        className="h-full bg-accent/50"
                      />
                    </div>
                    <span className="text-[9px] text-text-muted font-mono">
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}
              {(!data?.trending || data.trending.length === 0) && (
                <div className="text-[10px] text-text-muted/60 italic">
                  Silent night...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsCard>
  );
};
