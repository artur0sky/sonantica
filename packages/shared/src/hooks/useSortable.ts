import { useState, useMemo } from "react";

export type SortOrder = "asc" | "desc";

export interface SortOption {
  value: string;
  label: string;
}

interface UseSortableOptions<T> {
  initialField: string;
  initialOrder?: SortOrder;
  getValue?: (item: T, field: string) => any;
}

export function useSortable<T>(items: T[], options: UseSortableOptions<T>) {
  const [sortField, setSortField] = useState(options.initialField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(options.initialOrder || "asc");

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (options.getValue) {
        aVal = options.getValue(a, sortField);
        bVal = options.getValue(b, sortField);
      } else {
        // Default property access
        aVal = (a as any)[sortField];
        bVal = (b as any)[sortField];
      }

      // Handle strings (case-insensitive)
      if (typeof aVal === "string" && typeof bVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [items, sortField, sortOrder, options]);

  const toggleOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return {
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    toggleOrder,
    sortedItems,
  };
}
