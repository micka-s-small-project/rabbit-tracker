// app/store/useTrackerStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TrackerCategory, TrackerRow, DailyLog } from '../types/tracker';

interface TrackerState {
  categories: TrackerCategory[];
  rows: TrackerRow[];
  logs: DailyLog;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  addItem: (categoryId: string, name: string, type: 'boolean' | 'number', targetValue: any) => void;
  deleteItem: (id: string) => void;
  updateCell: (date: string, rowId: string, value: any) => void;
  importFullData: (newData: any) => void;
}

export const useTrackerStore = create<TrackerState>()(
    persist(
        (set) => ({
          categories: [],
          rows: [],
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

          importFullData: (newData) => set(() => {
            const importedCategories = newData.categories || [];
            const migratedRows = (newData.rows || []).map((row: any) => {
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
          // 💡 이름을 v1으로 바꾸어 기존에 로컬스토리지에 쌓여있던 지저분한 dummy 데이터를 한 번 리셋해줍니다.
          name: 'rabbit-tracker-v1',
          storage: createJSONStorage(() => localStorage),
        }
    )
);