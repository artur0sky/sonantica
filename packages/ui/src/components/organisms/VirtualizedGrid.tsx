/**
 * VirtualizedGrid Organism
 *
 * A reusable grid component for library collections (Artists, Albums, Playlists).
 * Supports standard grid layout, empty states, and is prepared for large collections.
 *
 * @package @sonantica/ui
 * @category Organisms
 */

import { ReactNode } from "react";
import { EmptyState } from "../molecules/EmptyState";
import { AlphabetNavigator } from "../atoms/AlphabetNavigator";

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

  /** Whether a filter is currently active (to show noResultsState instead of emptyState) */
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
 * VirtualizedGrid - Standardized grid for library items
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
  className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6",
}: VirtualizedGridProps<T>) {
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
        ) : (
          <div
            className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}
          >
            {items.map((item, index) => (
              <div key={keyExtractor(item)} id={`${idPrefix}-${index}`}>
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigator */}
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
