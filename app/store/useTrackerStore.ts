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
          // 📁 유저가 처음 진입했을 때 보게 될 기본 카테고리
          categories: [
            { id: 'cat_essentials', name: 'Essentials' }
          ],

          // 📊 바둑판을 채워줄 기본 샘플 문항 (OX 체크 2개 + 숫자 입력 1개)
          rows: [
            { id: 'item_workout', name: 'Workout', categoryId: 'cat_essentials', type: 'boolean', targetValue: null },
            { id: 'item_read_book', name: 'Read a Book', categoryId: 'cat_essentials', type: 'boolean', targetValue: null },
            { id: 'item_sleep_hr', name: 'Sleep Duration', categoryId: 'cat_essentials', type: 'number', targetValue: null }
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
          // 스토리지 네임을 변경하여 유저들에게 깨끗한 기본 템플릿이 바로 로드되도록 트리거합니다.
          name: 'rabbit-tracker-v2',
          storage: createJSONStorage(() => localStorage),
        }
    )
);