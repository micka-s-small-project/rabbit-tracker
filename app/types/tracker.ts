// app/types/tracker.ts

export type MetricType = 'boolean' | 'number' | 'time';

export interface TrackerItem {
  id: string;
  name: string;
  type: MetricType;
  unit?: string;
  targetValue: string | number | boolean | null;
}

export interface TrackerCategory {
  id: string;
  name: string;
}

export interface TrackerRow extends TrackerItem {
  categoryId: string;
}

export interface TrackerCell {
  value: string | number | boolean | null;
  status: 'completed' | 'partial' | 'skipped' | 'none';
}

export interface DailyLog {
  [date: string]: { // Formatted as YYYY-MM-DD
    [rowId: string]: TrackerCell;
  };
}