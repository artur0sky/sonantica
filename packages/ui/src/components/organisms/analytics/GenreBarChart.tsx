import React from "react";
import { ResponsiveBar } from "@nivo/bar";
import { AnalyticsCard } from "../../atoms/AnalyticsAtoms";
import { getNivoTheme, ChartProps } from "./NivoTheme";

/**
 * Genre Distribution (Bar Chart)
 */
export const GenreBarChart: React.FC<ChartProps> = ({
  title,
  data,
  height = 300,
  className,
  loading,
}) => {
  const hasData = data && data.length > 0;

  return (
    <AnalyticsCard
      title={title}
      height={height}
      className={className}
      loading={loading}
    >
      {hasData ? (
        <ResponsiveBar
          data={data}
          keys={["count"]}
          indexBy="genre"
          theme={getNivoTheme()}
          margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
          padding={0.4}
          layout="horizontal"
          colors={{ scheme: "nivo" }}
          borderRadius={6}
          borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Genres",
            legendOffset: -50,
            legendPosition: "middle",
          }}
          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          role="application"
        />
      ) : (
        !loading && (
          <div className="w-full h-full flex items-center justify-center text-text-muted opacity-50 text-xs">
            No genre data collected yet
          </div>
        )
      )}
    </AnalyticsCard>
  );
};
