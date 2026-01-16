/**
 * VirtualizedGrid Organism
 *
 * A high-performance grid component with virtualization for large collections (e.g., Albums, Artists).
 * Integrates @tanstack/react-virtual to only render what's visible.
 *
 * @package @sonantica/ui
 * @category Organisms
 */

import { ReactNode, useRef, useMemo, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { EmptyState } from "../molecules/EmptyState";
import { AlphabetNavigator } from "../atoms/AlphabetNavigator";
import { cn } from "../../utils";

export interface VirtualizedGridProps<T> {
  /** Items to display in the grid */
  items: T[];

  /** Function to render each item */
  renderItem: (item: T, index: number) => ReactNode;

  /** Key extractor for items */
  keyExtractor: (item: T) => string;

  /** ID prefix for items (used for scrolling/navigation) */
  idPrefix?: string;

  /** Empty state configuration */
  emptyState: {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
  };

  /** No results state (when filtering) */
  noResultsState?: {
    icon: ReactNode;
    title: string;
    description: string;
  };

  /** Whether a filter is currently active */
  isFiltered?: boolean;

  /** Alphabet navigator configuration */
  alphabetNav?: {
    enabled: boolean;
    onLetterClick: (index: number, letter: string) => void;
    forceScrollOnly?: boolean;
    getLetterItem?: (item: T) => { name: string };
  };

  /** Additional className for the grid container */
  className?: string;

  /** Scrollable container ID (default: "main-content") */
  scrollElementId?: string;

  /** Estimated row height (default: 280) */
  estimateRowHeight?: number;
}

/**
 * VirtualizedGrid - Standardized grid for library items with real virtualization
 */
export function VirtualizedGrid<T>({
  items,
  renderItem,
  keyExtractor,
  idPrefix = "item",
  emptyState,
  noResultsState,
  isFiltered = false,
  alphabetNav,
  className,
  scrollElementId = "main-content",
  estimateRowHeight = 280,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(0);

  // Use a ResizeObserver to detect how many columns we have
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      // Mirror Tailwind breakpoints
      if (width >= 1280) setColumns(5); // xl
      else if (width >= 1024) setColumns(4); // lg
      else if (width >= 768) setColumns(3); // md
      else setColumns(2); // default
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Compute rows
  const rowCount = useMemo(() => {
    if (columns === 0) return 0;
    return Math.ceil(items.length / columns);
  }, [items.length, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () =>
      document.getElementById(scrollElementId) as HTMLDivElement,
    estimateSize: () => estimateRowHeight,
    overscan: 3,
  });

  const showNoResults = isFiltered && items.length === 0 && noResultsState;
  const showEmpty = !isFiltered && items.length === 0;

  if (showNoResults) {
    return (
      <EmptyState
        variant="minimal"
        icon={noResultsState.icon}
        title={noResultsState.title}
        description={noResultsState.description}
      />
    );
  }

  if (showEmpty) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  return (
    <div className="relative">
      <div
        ref={parentRef}
        className="animate-in fade-in duration-300 min-h-[50vh]"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columns;
            const rowItems = items.slice(startIndex, startIndex + columns);

            return (
              <div
                key={virtualRow.key}
                className={cn(
                  "absolute top-0 left-0 w-full grid gap-6",
                  "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
                  className
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {rowItems.map((item, colIndex) => {
                  const itemIndex = startIndex + colIndex;
                  return (
                    <div
                      key={keyExtractor(item)}
                      id={`${idPrefix}-${itemIndex}`}
                    >
                      {renderItem(item, itemIndex)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Alphabet Navigator */}
      {alphabetNav?.enabled && items.length > 50 && (
        <AlphabetNavigator
          items={
            alphabetNav.getLetterItem
              ? items.map(alphabetNav.getLetterItem)
              : (items as any)
          }
          onLetterClick={(index) => {
            const rowIndex = Math.floor(index / columns);
            rowVirtualizer.scrollToIndex(rowIndex, { align: "start" });
          }}
          forceScrollOnly={alphabetNav.forceScrollOnly}
          mode="local"
        />
      )}
    </div>
  );
}
