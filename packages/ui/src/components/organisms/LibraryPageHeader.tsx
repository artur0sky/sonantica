/**
 * LibraryPageHeader Organism
 *
 * Unified header component for library pages (Artists, Albums, Playlists, Tracks).
 * Provides consistent layout with title, subtitle, sorting, and multi-select controls.
 *
 * @package @sonantica/ui
 * @category Organisms
 */

import { ReactNode } from "react";
import { PageHeader } from "../molecules/PageHeader";
import { SortControl } from "../molecules/SortControl";
import { Button } from "../atoms/Button";
import { IconCheckbox } from "@tabler/icons-react";

export interface SortOption {
  value: string;
  label: string;
}

export interface LibraryPageHeaderProps {
  /** Page title (e.g., "Artists", "Albums") */
  title: string;

  /** Optional subtitle (e.g., "120 artists in library") */
  subtitle?: string;

  /** Sort options for the dropdown */
  sortOptions?: SortOption[];

  /** Current sort field value */
  sortValue?: string;

  /** Current sort direction */
  sortDirection?: "asc" | "desc";

  /** Callback when sort field changes */
  onSortChange?: (field: string) => void;

  /** Callback when sort direction changes */
  onSortDirectionChange?: (direction: "asc" | "desc") => void;

  /** Enable multi-select mode */
  enableMultiSelect?: boolean;

  /** Whether multi-select is currently active */
  isSelectionMode?: boolean;

  /** Callback to enter selection mode */
  onEnterSelectionMode?: () => void;

  /** Callback to exit selection mode */
  onExitSelectionMode?: () => void;

  /** Enable "Select All" button */
  enableSelectAll?: boolean;

  /** Whether all items are selected */
  allSelected?: boolean;

  /** Callback to select all items */
  onSelectAll?: () => void;

  /** Callback to deselect all items */
  onDeselectAll?: () => void;

  /** Custom actions to render in the header */
  customActions?: ReactNode;

  /** Additional className for the header container */
  className?: string;
}

/**
 * LibraryPageHeader - Unified header for library pages
 *
 * Provides a consistent header layout with:
 * - Title and subtitle
 * - Sort controls (field + direction)
 * - Multi-select toggle
 * - Select All/Deselect All button
 * - Custom action buttons
 *
 * @example
 * ```tsx
 * <LibraryPageHeader
 *   title="Artists"
 *   subtitle="120 artists in library"
 *   sortOptions={[
 *     { value: "name", label: "Name" },
 *     { value: "trackCount", label: "Track Count" }
 *   ]}
 *   sortValue={sortField}
 *   sortDirection={sortOrder}
 *   onSortChange={setSortField}
 *   onSortDirectionChange={setSortOrder}
 *   enableMultiSelect
 *   isSelectionMode={isSelectionMode}
 *   onEnterSelectionMode={enterSelectionMode}
 *   onExitSelectionMode={exitSelectionMode}
 *   enableSelectAll
 *   allSelected={selectedIds.size === items.length}
 *   onSelectAll={() => selectAll(items.map(i => i.id))}
 *   onDeselectAll={clearSelection}
 * />
 * ```
 */
export function LibraryPageHeader({
  title,
  subtitle,
  sortOptions,
  sortValue,
  sortDirection = "asc",
  onSortChange,
  onSortDirectionChange,
  enableMultiSelect = false,
  isSelectionMode = false,
  onEnterSelectionMode,
  onExitSelectionMode,
  enableSelectAll = false,
  allSelected = false,
  onSelectAll,
  onDeselectAll,
  customActions,
  className,
}: LibraryPageHeaderProps) {
  const hasActions =
    sortOptions ||
    enableMultiSelect ||
    (isSelectionMode && enableSelectAll) ||
    customActions;

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      className={className}
      actions={
        hasActions ? (
          <div className="flex items-center gap-2">
            {/* Sort Controls */}
            {sortOptions && sortOptions.length > 0 && (
              <SortControl
                value={sortValue || sortOptions[0].value}
                options={sortOptions}
                onValueChange={(val) => onSortChange?.(val)}
                direction={sortDirection}
                onDirectionChange={(dir) => onSortDirectionChange?.(dir)}
              />
            )}

            {/* Multi-Select Toggle */}
            {enableMultiSelect && (
              <Button
                onClick={() =>
                  isSelectionMode
                    ? onExitSelectionMode?.()
                    : onEnterSelectionMode?.()
                }
                variant={isSelectionMode ? "primary" : "ghost"}
                size="sm"
                className="flex items-center gap-2"
                title="Multi-Select"
              >
                <IconCheckbox size={18} />
                {isSelectionMode && (
                  <span className="hidden sm:inline">Done</span>
                )}
              </Button>
            )}

            {/* Select All/Deselect All (only in selection mode) */}
            {isSelectionMode && enableSelectAll && (
              <Button
                onClick={() =>
                  allSelected ? onDeselectAll?.() : onSelectAll?.()
                }
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
            )}

            {/* Custom Actions */}
            {customActions}
          </div>
        ) : undefined
      }
    />
  );
}
