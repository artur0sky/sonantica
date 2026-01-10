import React from "react";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { AnalyticsCard } from "../../atoms/AnalyticsAtoms";
import { getNivoTheme, ChartProps } from "./NivoTheme";

/**
 * Activity Heatmap (Hour vs Day)
 */
export const ActivityHeatmap: React.FC<ChartProps> = ({
  title,
  data,
  height = 350,
  className,
  loading,
}) => {
  const hasData =
    data &&
    data.length > 0 &&
    data.some((d: any) => d.data && d.data.length > 0);

  return (
    <AnalyticsCard
      title={title}
      height={height}
      className={className}
      loading={loading}
    >
      {hasData ? (
        <ResponsiveHeatMap
          data={data}
          theme={getNivoTheme()}
          margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
          valueFormat=">-.0s"
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -90,
            legend: "",
            legendOffset: 46,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Day",
            legendPosition: "middle",
            legendOffset: -40,
          }}
          colors={{
            type: "sequential",
            scheme: "purples",
          }}
          emptyColor="#111111"
          borderRadius={4}
          labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
        />
      ) : (
        !loading && (
          <div className="w-full h-full flex items-center justify-center text-text-muted opacity-50 text-sm">
            Need more listening history for heatmap
          </div>
        )
      )}
    </AnalyticsCard>
  );
};
