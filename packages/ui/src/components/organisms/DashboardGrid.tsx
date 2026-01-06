import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../utils';

interface DashboardItem {
  id: string;
  component: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  colSpan?: number;
}

/**
 * Individual Sortable Wrapper for Dashboard Widgets
 */
const SortableDashboardItem = ({ id, children, colSpan = 1 }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 md:col-span-3',
    4: 'col-span-1 md:col-span-2 lg:col-span-4',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-shadow",
        colSpanClasses[colSpan as keyof typeof colSpanClasses] || 'col-span-1',
        isDragging && "opacity-50 grayscale scale-95"
      )}
    >
      <div className="relative group h-full">
        {/* Drag Handle - Only visible on hover */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-grab active:cursor-grabbing p-1 bg-white/10 rounded-md backdrop-blur-md border border-white/10"
        >
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="opacity-50">
            <path d="M1 1H11M1 4H11M1 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        {children}
      </div>
    </div>
  );
};

interface DashboardGridProps {
  items: DashboardItem[];
  onReorder?: (items: DashboardItem[]) => void;
  className?: string;
}

/**
 * Premium Dashboard Grid with Drag & Drop capabilities.
 * Supports variable width columns and responsive layouts.
 */
export const DashboardGrid = ({ items: initialItems, onReorder, className }: DashboardGridProps) => {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags when clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onReorder?.(newItems);
    }
    
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-1",
        className
      )}>
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          {items.map((item) => (
            <SortableDashboardItem key={item.id} id={item.id} colSpan={item.colSpan}>
              {item.component}
            </SortableDashboardItem>
          ))}
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.4',
            },
          },
        }),
      }}>
        {activeId ? (
          <div className="scale-105 rotate-1 shadow-2xl opacity-90 cursor-grabbing rounded-2xl overflow-hidden pointer-events-none">
            {items.find(i => i.id === activeId)?.component}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
