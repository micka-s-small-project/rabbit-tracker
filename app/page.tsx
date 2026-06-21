// app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTrackerStore } from './store/useTrackerStore';

// Generate exact formatted calendar dates for any selected year and month combo
const getDatesForYearMonth = (yearStr: string, monthStr: string) => {
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const numDays = new Date(year, monthIdx + 1, 0).getDate();

  const dates = [];
  for (let day = 1; day <= numDays; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    dates.push(`${year}-${monthStr}-${dayStr}`);
  }
  return dates;
};

const MONTHS = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' }, { value: '04', label: 'Apr' },
  { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' }, { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
];

// Dynamically extract logged years and pad with future windows seamlessly
const getSmartYearList = (logs: any) => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 2;
  const endYear = currentYear + 10;

  const yearSet = new Set<string>();
  for (let y = startYear; y <= endYear; y++) {
    yearSet.add(String(y));
  }

  if (logs) {
    Object.keys(logs).forEach((dateStr) => {
      const loggedYear = dateStr.split('-')[0];
      if (loggedYear && loggedYear.length === 4) {
        yearSet.add(loggedYear);
      }
    });
  }

  return Array.from(yearSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
};

export default function Home() {
  const { categories, rows, logs, updateCell, addCategory, deleteCategory, addItem, deleteItem, importFullData } = useTrackerStore();
  const [mounted, setMounted] = useState(false);

  // FIXED: Calling the smart year list utility passing reactive logs
  const dynamicYearList = getSmartYearList(logs);

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const dynamicDates = selectedYear && selectedMonth ? getDatesForYearMonth(selectedYear, selectedMonth) : [];

  const [newCatName, setNewCatName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'boolean' | 'number'>('boolean');

  useEffect(() => {
    setMounted(true);

    const today = new Date();
    const currentYearStr = String(today.getFullYear());
    const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');

    setSelectedYear(currentYearStr);
    setSelectedMonth(currentMonthStr);

    if (categories.length > 0 && !selectedCatId) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories, selectedCatId]);

  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ categories, rows, logs }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `rabbit-tracker-export-${selectedYear}-${selectedMonth}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.categories && parsed.rows && parsed.logs) {
          importFullData(parsed);
          alert('Data loaded and updated successfully!');
        } else {
          alert('Invalid file structure configuration layout.');
        }
      } catch (err) {
        alert('Could not decode the data profile metadata.');
      }
    };
    reader.readAsText(file);
  };

  if (!mounted || !selectedYear || !selectedMonth) return <div className="p-8 text-white bg-slate-950 h-screen">Loading rabbit-tracker...</div>;

  return (
      <main className="p-4 min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center w-full">
        <div className="w-full max-w-[100vw] xl:px-4">

          {/* Header section */}
          <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-extrabold text-emerald-400 tracking-tight">🐇 rabbit-tracker</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">🔒 Auto-saving continuously to your browser space.</p>
            </div>

            {/* Top Toolbar Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Clean Ko-fi Support Action Link */}
              <a
                  href="https://ko-fi.com/yellTa" // TODO: Change to your finalized Ko-fi URL route slot
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#29abe2] hover:bg-[#218dbb] text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition-all"
              >
                ☕ Buy me a coffee
              </a>

              <label className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all">
                📂 Load File
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>

              <button
                  onClick={handleExportBackup}
                  className="text-slate-500 hover:text-slate-400 text-[11px] px-2 py-1.5"
              >
                Export Backup
              </button>
            </div>
          </header>

          {/* Dashboard setup control parameters */}
          <section className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 text-[11px]">
            {/* Add Category */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-slate-400">＋ Add Category</h3>
              <div className="flex gap-2">
                <input
                    type="text" placeholder="e.g., Essentials, Health, Workspace" value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 flex-1 focus:outline-none focus:border-emerald-500 text-slate-200"
                />
                <button
                    onClick={() => { if(newCatName) { addCategory(newCatName); setNewCatName(''); } }}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1 rounded font-semibold text-emerald-400"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Add Item to Category elements */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-slate-400">＋ Add Item to Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex gap-1">
                  <select
                      value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-slate-200 focus:outline-none flex-1 truncate"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {selectedCatId && (
                      <button
                          onClick={() => {
                            const targetCat = categories.find(c => c.id === selectedCatId);
                            if(confirm(`Delete category "${targetCat?.name}" permanently?`)) {
                              deleteCategory(selectedCatId);
                              setSelectedCatId('');
                            }
                          }}
                          className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 px-1.5 rounded font-bold"
                      >
                        ✕
                      </button>
                  )}
                </div>

                <input
                    type="text" placeholder="Item Name" value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                />

                <div className="flex gap-1">
                  <select
                      value={newItemType} onChange={(e) => setNewItemType(e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-slate-200 flex-1 focus:outline-none"
                  >
                    <option value="boolean">Check (OX)</option>
                    <option value="number">Metric (Num)</option>
                  </select>
                  <button
                      onClick={() => { if(newItemName && selectedCatId) { addItem(selectedCatId, newItemName, newItemType, null); setNewItemName(''); } }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2 py-1 rounded"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 📅 Navigation Bar */}
          <div className="mb-3 flex flex-col gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            {/* Year controller */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-12">Year :</span>
              <div className="flex flex-wrap gap-1">
                {dynamicYearList.map((y) => (
                    <button
                        key={y}
                        onClick={() => setSelectedYear(y)}
                        className={`px-2.5 py-0.5 rounded text-xs font-extrabold transition-all ${
                            selectedYear === y
                                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                      {y}
                    </button>
                ))}
              </div>
            </div>

            {/* Month selectors */}
            <div className="flex items-center gap-2 border-t border-slate-800/50 pt-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-12">Month :</span>
              <div className="flex flex-wrap gap-0.5">
                {MONTHS.map((m) => (
                    <button
                        key={m.value}
                        onClick={() => setSelectedMonth(m.value)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                            selectedMonth === m.value
                                ? 'text-slate-950 bg-emerald-400 font-black'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                    >
                      {m.label}
                    </button>
                ))}
              </div>
            </div>
          </div>

          {/* 📊 High-Density Matrix Responsive Dashboard Canvas */}
          <div className="border border-slate-800 rounded-xl shadow-2xl bg-slate-900 w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="p-2 font-semibold text-slate-400 text-[10px] w-[160px] bg-slate-900 border-r border-slate-800">Category & Item</th>
                {dynamicDates.map((date) => (
                    <th key={date} className="p-0 border-r border-slate-800/40 text-center">
                      <div className="text-slate-400 text-[9px] font-mono py-1">{date.slice(8)}</div>
                    </th>
                ))}
              </tr>
              </thead>

              <tbody>
              {categories.map((category) => {
                const filteredRows = rows.filter(r => r.categoryId === category.id);
                if (filteredRows.length === 0) return null;

                return (
                    <React.Fragment key={category.id}>
                      {/* Category Divider */}
                      <tr className="bg-slate-850/60 border-b border-slate-800/80">
                        <td className="px-2 py-1 font-bold text-[10px] text-emerald-400/90 bg-slate-850 border-r border-slate-800 flex justify-between items-center">
                          <span className="truncate">📁 {category.name}</span>
                          <button
                              onClick={() => { if(confirm(`Delete category "${category.name}"?`)) deleteCategory(category.id); }}
                              className="text-[9px] text-rose-400/50 hover:text-rose-400 font-normal ml-1"
                          >
                            del
                          </button>
                        </td>
                        <td colSpan={dynamicDates.length} className="bg-slate-850/10"></td>
                      </tr>

                      {/* Custom Metric Rows */}
                      {filteredRows.map((row) => (
                          <tr key={row.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                            <td className="p-1.5 text-[11px] font-medium text-slate-300 border-r border-slate-800 pl-3 bg-slate-900/30 flex justify-between items-center group">
                              <span className="truncate max-w-[120px]">{row.name}</span>
                              <button
                                  onClick={() => deleteItem(row.id)}
                                  className="text-[9px] text-slate-500 hover:text-rose-400 hidden group-hover:block ml-1"
                              >
                                ✕
                              </button>
                            </td>

                            {dynamicDates.map((date) => {
                              const cellData = logs[date]?.[row.id];
                              const val = cellData?.value as any;

                              // Numeric Data Cells
                              if (row.type === 'number') {
                                return (
                                    <td key={date} className="p-[1px] border-r border-slate-800/30 text-center">
                                      <input
                                          type="number" value={val ?? ''}
                                          onChange={(e) => updateCell(date, row.id, e.target.value === '' ? null : Number(e.target.value))}
                                          placeholder="-"
                                          className="w-full h-6 text-center bg-transparent focus:bg-slate-950 rounded text-[10px] text-slate-200 font-mono focus:outline-none placeholder-slate-800"
                                      />
                                    </td>
                                );
                              }

                              // Cycle Progress Buttons
                              let cellBg = 'bg-slate-950/40 text-slate-800 hover:bg-slate-800/50';
                              let cellText = '·';
                              if (val === true) { cellBg = 'bg-emerald-500 text-slate-950 font-black'; cellText = '✓'; }
                              else if (val === 'partial') { cellBg = 'bg-amber-500/20 text-amber-400 border border-amber-500/20'; cellText = '▲'; }
                              else if (val === 'skipped') { cellBg = 'bg-slate-800 text-slate-600'; cellText = '—'; }

                              return (
                                  <td key={date} className="p-[1px] border-r border-slate-800/40 text-center">
                                    <button
                                        onClick={() => {
                                          let nextVal: any = null;
                                          if (val === null || val === undefined) nextVal = 'partial';
                                          else if (val === 'partial') nextVal = true;
                                          else if (val === true) nextVal = 'skipped';
                                          else if (val === 'skipped') nextVal = null;
                                          updateCell(date, row.id, nextVal);
                                        }}
                                        className={`w-full h-6 rounded-[3px] text-[9px] flex items-center justify-center transition-all ${cellBg}`}
                                    >
                                      {cellText}
                                    </button>
                                  </td>
                              );
                            })}
                          </tr>
                      ))}
                    </React.Fragment>
                );
              })}
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <footer className="mt-12 pt-6 border-t border-slate-900 w-full flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <span className="font-bold text-slate-400">🐇 rabbit-tracker © {new Date().getFullYear()}</span>
              <p className="max-w-md leading-relaxed text-slate-600">
                A serverless, open-source habit matrix built for digital detox. 100% of your metrics are contained locally inside your browser storage environment.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-medium">
              <button
                  onClick={() => alert("Terms of Service:\n\n1. Ownership: rabbit-tracker is a local utility tool. You own 100% of your data.\n2. Liability: Data is stored entirely in your local browser sandbox. We are not responsible for any local data corruption or accidental browser cache clearing. Please export backups regularly.")}
                  className="hover:text-slate-300 transition-colors hover:underline"
              >
                Terms of Service
              </button>

              <span className="text-slate-800">•</span>

              <button
                  onClick={() => alert("Privacy Policy:\n\n1. Zero Server collection: We do not operate databases, user accounts, or cloud analytics pipelines.\n2. Cookie Usage: LocalStorage is strictly utilized to sync your configurations and metric grid entries dynamically without network dispatches.")}
                  className="hover:text-slate-300 transition-colors hover:underline"
              >
                Privacy Policy
              </button>

              <span className="text-slate-800">•</span>

              <a
                  href="mailto:edsolarrcnt5@gmail.com?subject=[rabbit-tracker]%20Feedback"
                  className="hover:text-emerald-400 text-slate-400 font-semibold transition-colors flex items-center gap-1 hover:underline"
              >
                ✉️ Contact Developer
              </a>
            </div>
          </footer>

        </div>
      </main>
  );
}