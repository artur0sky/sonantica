import React from "react";
import { ResponsiveLine } from "@nivo/line";
import { AnalyticsCard } from "../../atoms/AnalyticsAtoms";
import { getNivoTheme, ChartProps } from "./NivoTheme";

/**
 * Playback Timeline (Line/Area Chart)
 */
export const PlaybackLineChart: React.FC<ChartProps> = ({
  title,
  data,
  height = 300,
  className,
  loading,
}) => {
  const hasData =
    data && data.length > 0 && data[0].data && data[0].data.length > 0;

  return (
    <AnalyticsCard
      title={title}
      height={height}
      className={className}
      loading={loading}
    >
      {hasData ? (
        <ResponsiveLine
          data={data}
          theme={getNivoTheme()}
          margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: "auto",
            max: "auto",
            stacked: false,
            reverse: false,
          }}
          curve="monotoneX"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Time",
            legendOffset: 36,
            legendPosition: "middle",
          }}
          enableArea={true}
          areaOpacity={0.15}
          colors={["#6366f1", "#ec4899", "#06b6d4"]}
          pointSize={8}
          pointColor={{ from: "color", modifiers: [] }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          useMesh={true}
          enableSlices="x"
        />
      ) : (
        !loading && (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-2 opacity-50">
            <span className="text-sm font-medium">No playback history yet</span>
          </div>
        )
      )}
    </AnalyticsCard>
  );
};
