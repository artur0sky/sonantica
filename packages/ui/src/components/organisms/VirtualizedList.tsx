/**
 * VirtualizedList Organism
 *
 * A high-performance list component with virtualization for large collections (e.g., Tracks).
 * Integrates @tanstack/react-virtual for smooth scrolling and minimal DOM nodes.
 *
 * @package @sonantica/ui
 * @category Organisms
 */

import { ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { EmptyState } from "../molecules/EmptyState";
import { AlphabetNavigator } from "../atoms/AlphabetNavigator";

export interface VirtualizedListProps<T> {
  /** Items to display in the list */
  items: T[];

  /** Function to render each item */
  renderItem: (item: T, index: number) => ReactNode;

  /** Key extractor for items */
  keyExtractor: (item: T) => string;

  /** Estimated height of a single item for virtualization */
  estimateSize?: number;

  /** Number of items to render outside the viewport */
  overscan?: number;

  /** Scrollable container ID (default: "main-content") */
  scrollElementId?: string;

  /** Threshold to enable virtualization (default: 100) */
  virtualThreshold?: number;

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

  /** Support for alphabet navigation */
  alphabetNav?: {
    enabled: boolean;
    onLetterClick: (index: number, letter: string) => void;
    forceScrollOnly?: boolean;
    getLetterItem?: (item: T) => { name: string };
  };

  /** Additional className for the list container */
  className?: string;

  /** Show items count info at the bottom */
  showInfo?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * VirtualizedList - High-performance list for large datasets
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  keyExtractor,
  estimateSize = 76,
  overscan = 10,
  scrollElementId = "main-content",
  virtualThreshold = 100,
  emptyState,
  noResultsState,
  isFiltered = false,
  alphabetNav,
  className = "space-y-1",
  showInfo = true,
}: VirtualizedListProps<T>) {
  const useVirtual = items.length > virtualThreshold;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () =>
      document.getElementById(scrollElementId) as HTMLDivElement,
    estimateSize: () => estimateSize,
    overscan: overscan,
    enabled: useVirtual,
  });

  const showNoResults = isFiltered && items.length === 0 && noResultsState;
  const showEmpty = !isFiltered && items.length === 0;

  return (
    <div className="relative">
      <div className="animate-in fade-in duration-300">
        {showNoResults ? (
          <EmptyState
            key="no-results"
            variant="minimal"
            icon={noResultsState.icon}
            title={noResultsState.title}
            description={noResultsState.description}
          />
        ) : showEmpty ? (
          <EmptyState
            key="empty"
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
            action={emptyState.action}
          />
        ) : useVirtual ? (
          <div key="virtual-list">
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
                contain: "strict",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = items[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {renderItem(item, virtualItem.index)}
                  </div>
                );
              })}
            </div>
            {showInfo && (
              <div className="py-4 text-center text-xs text-text-muted/30">
                Showing {items.length} items (Virtualized)
              </div>
            )}
          </div>
        ) : (
          <div
            className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}
          >
            {items.map((item, index) => (
              <div key={keyExtractor(item)} id={`item-${index}`}>
                {renderItem(item, index)}
              </div>
            ))}
            {showInfo && items.length > 0 && (
              <div className="py-4 text-center text-xs text-text-muted/30">
                Showing {items.length} items
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alphabet Navigator */}
      {alphabetNav?.enabled && items.length > 50 && (
        <AlphabetNavigator
          items={
            alphabetNav.getLetterItem
              ? items.map(alphabetNav.getLetterItem)
              : (items as any)
          }
          onLetterClick={alphabetNav.onLetterClick}
          forceScrollOnly={alphabetNav.forceScrollOnly}
          mode="local"
        />
      )}
    </div>
  );
}
