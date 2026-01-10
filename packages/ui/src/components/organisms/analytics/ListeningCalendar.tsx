import React from "react";
import { ResponsiveCalendar } from "@nivo/calendar";
import { AnalyticsCard } from "../../atoms/AnalyticsAtoms";
import { getNivoTheme, ChartProps } from "./NivoTheme";

/**
 * Consistency Calendar
 */
export const ListeningCalendar: React.FC<
  ChartProps & { from: string; to: string }
> = ({ title, data, from, to, height = 200, className, loading }) => {
  const hasData = data && data.length > 0;

  return (
    <AnalyticsCard
      title={title}
      height={height}
      className={className}
      loading={loading}
    >
      {hasData ? (
        <ResponsiveCalendar
          data={data}
          from={from}
          to={to}
          theme={getNivoTheme()}
          emptyColor="rgba(255, 255, 255, 0.05)"
          colors={["#1e1b4b", "#312e81", "#4338ca", "#6366f1", "#818cf8"]}
          margin={{ top: 20, right: 0, bottom: 20, left: 30 }}
          yearSpacing={40}
          monthBorderColor="rgba(255, 255, 255, 0.1)"
          dayBorderWidth={2}
          dayBorderColor="#0a0a0a"
          legends={[
            {
              anchor: "bottom-right",
              direction: "row",
              translateY: 36,
              itemCount: 4,
              itemWidth: 34,
              itemHeight: 36,
              itemDirection: "top-to-bottom",
            },
          ]}
        />
      ) : (
        !loading && (
          <div className="w-full h-full flex items-center justify-center text-text-muted opacity-50 text-xs">
            No library activity recorded this year
          </div>
        )
      )}
    </AnalyticsCard>
  );
};
