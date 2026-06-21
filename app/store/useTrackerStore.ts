// app/store/useTrackerStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TrackerCategory, TrackerRow, DailyLog } from '@/types/tracker';

interface TrackerState {
  categories: TrackerCategory[];
  rows: TrackerRow[];
  logs: DailyLog;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  addItem: (categoryId: string, name: string, type: 'boolean' | 'number', targetValue: any) => void;
  deleteItem: (id: string) => void;
  updateCell: (date: string, rowId: string, value: any) => void;
  importFullData: (newData: any) => void; // Upgraded to handle migration safely
}

export const useTrackerStore = create<TrackerState>()(
    persist(
        (set) => ({
          categories: [
            { id: 'cat_essentials', name: 'Essentials' },
            { id: 'cat_health', name: 'Health Monitoring' },
            { id: 'cat_learning', name: 'Learning' },
          ],
          rows: [
            { id: 'read_book', name: 'Read a Book', categoryId: 'cat_essentials', type: 'boolean', targetValue: true },
            { id: 'focused_work', name: 'Focused Work', categoryId: 'cat_essentials', type: 'number', unit: 'hr', targetValue: 4 },
            { id: 'weight', name: 'Weight', categoryId: 'cat_health', type: 'number', unit: 'kg', targetValue: null },
            { id: 'calories', name: 'Calories', categoryId: 'cat_health', type: 'number', unit: 'kcal', targetValue: null },
            { id: 'sleep_score', name: 'Sleep Score', categoryId: 'cat_health', type: 'number', targetValue: 80 },
            { id: 'wake_up', name: 'Wake-Up', categoryId: 'cat_health', type: 'number', targetValue: null },
            { id: 'anki', name: 'Anki Flashcards', categoryId: 'cat_learning', type: 'boolean', targetValue: true },
          ],
          logs: {},

          addCategory: (name) => set((state) => ({
            categories: [...state.categories, { id: `cat_${Date.now()}`, name }]
          })),

          deleteCategory: (id) => set((state) => ({
            categories: state.categories.filter((c) => c.id !== id),
            rows: state.rows.filter((r) => r.categoryId !== id)
          })),

          addItem: (categoryId, name, type, targetValue) => set((state) => ({
            rows: [...state.rows, {
              id: `item_${Date.now()}`,
              name,
              categoryId,
              type,
              targetValue: targetValue ? Number(targetValue) : null
            }]
          })),

          deleteItem: (id) => set((state) => ({
            rows: state.rows.filter((r) => r.id !== id)
          })),

          updateCell: (date, rowId, value) => set((state) => {
            const currentDay = state.logs[date] || {};
            let status: any = 'none';
            if (value === true) status = 'completed';
            else if (value === 'partial') status = 'partial';
            else if (value === 'skipped') status = 'skipped';

            return {
              logs: {
                ...state.logs,
                [date]: { ...currentDay, [rowId]: { value, status } }
              }
            };
          }),

          // 🚀 Smart Migration Layer for Older Backup Formats
          importFullData: (newData) => set((state) => {
            let importedCategories = newData.categories || [];

            // 1. Ensure the new 'cat_health' category exists safely
            if (!importedCategories.some((c: any) => c.id === 'cat_health')) {
              importedCategories.push({ id: 'cat_health', name: 'Health Monitoring' });
            }

            // 2. Migrate row items to match our clean single-canvas structural layout
            const migratedRows = (newData.rows || []).map((row: any) => {
              // If it's a legacy default row, map it explicitly to our clean structural categories
              if (!row.categoryId) {
                if (row.category === 'health' || ['weight', 'calories', 'sleep_score', 'wake_up'].includes(row.id)) {
                  return { ...row, categoryId: 'cat_health' };
                }
                return { ...row, categoryId: 'cat_essentials' };
              }
              return row;
            });

            return {
              categories: importedCategories,
              rows: migratedRows,
              logs: newData.logs || {}
            };
          })
        }),
        {
          name: 'rabbit-tracker-storage',
          storage: createJSONStorage(() => localStorage),
        }
    )
);