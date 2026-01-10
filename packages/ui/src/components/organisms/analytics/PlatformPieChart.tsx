import React from "react";
import { ResponsivePie } from "@nivo/pie";
import { AnalyticsCard } from "../../atoms/AnalyticsAtoms";
import { getNivoTheme, ChartProps } from "./NivoTheme";

/**
 * Generic Pie Chart (Platform, Formats, etc)
 */
export const PlatformPieChart: React.FC<ChartProps> = ({
  title,
  data,
  height = 300,
  className,
  loading,
  innerRadius = 0.6,
  padAngle = 2,
  cornerRadius = 8,
  colors = { scheme: "category10" },
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
        <ResponsivePie
          data={data}
          theme={getNivoTheme()}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          innerRadius={innerRadius}
          padAngle={padAngle}
          cornerRadius={cornerRadius}
          activeOuterRadiusOffset={8}
          colors={colors}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="rgba(255, 255, 255, 0.5)"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: "color" }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
        />
      ) : (
        !loading && (
          <div className="w-full h-full flex items-center justify-center text-text-muted opacity-50 text-xs text-center p-4">
            No data available
          </div>
        )
      )}
    </AnalyticsCard>
  );
};
