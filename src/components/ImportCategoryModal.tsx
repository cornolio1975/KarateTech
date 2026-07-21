'use client';

import React, { useState } from 'react';
import { useTournament } from '@/context/TournamentContext';
import { db, basePath } from '@/db/dbClient';
import { Upload, X, Check, RefreshCw, AlertCircle, FileText, ArrowRight } from 'lucide-react';

interface ImportCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedCategoryRow {
  name: string;
  gender: 'Male' | 'Female' | 'Mixed';
  min_age: number;
  max_age: number;
  min_weight: number;
  max_weight: number;
  capacity: number;
  format: 'knockout' | 'round_robin' | 'wkf_repechage';
  isDuplicate?: boolean;
}

export default function ImportCategoryModal({ isOpen, onClose }: ImportCategoryModalProps) {
  const { triggerRefresh } = useTournament();
  const [dragActive, setDragActive] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [previewRows, setPreviewRows] = useState<ParsedCategoryRow[]>([]);
  const [importReport, setImportReport] = useState<{
    importedCount: number;
    duplicatesCount: number;
    errors: string[];
  } | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const downloadCSVTemplate = () => {
    const link = document.createElement("a");
    link.setAttribute("href", `${basePath}/senshi_category_template.csv`);
    link.setAttribute("download", "senshi_category_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseCSV(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseCSV(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePasteParse = () => {
    if (!csvContent.trim()) return;
    parseCSV(csvContent);
  };

  const splitCSVLine = (line: string, separator: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const parseCSV = async (text: string) => {
    try {
      const existingCategories = await db.categories.list();
      const existingNames = new Set(existingCategories.map(c => c.name.toLowerCase().trim()));

      const lines = text.split('\n');
      const rows: ParsedCategoryRow[] = [];
      
      let startIdx = 0;
      if (lines.length > 0) {
        const firstLineLower = lines[0].toLowerCase();
        if (firstLineLower.includes('category') || firstLineLower.includes('gender') || firstLineLower.includes('age') || firstLineLower.includes('weight')) {
          startIdx = 1;
        }
      }

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const separator = line.includes('\t') ? '\t' : ',';
        const cols = splitCSVLine(line, separator);
        if (cols.length < 1) continue;

        const name = cols[0]?.trim();
        if (!name) continue;

        const rawGender = cols[1]?.trim().toLowerCase();
        const gender: 'Male' | 'Female' | 'Mixed' = 
          (rawGender === 'f' || rawGender === 'female') ? 'Female' :
          (rawGender === 'mixed' || rawGender === 'm/f') ? 'Mixed' : 'Male';

        const min_age = parseInt(cols[2]?.trim(), 10) || 0;
        const max_age = parseInt(cols[3]?.trim(), 10) || 99;
        const min_weight = parseFloat(cols[4]?.trim()) || 0;
        const max_weight = parseFloat(cols[5]?.trim()) || 999;
        const capacity = parseInt(cols[6]?.trim(), 10) || 32;

        const rawFormat = cols[7]?.trim().toLowerCase();
        const format: 'knockout' | 'round_robin' | 'wkf_repechage' = 
          rawFormat === 'round_robin' ? 'round_robin' :
          rawFormat === 'wkf_repechage' ? 'wkf_repechage' : 'knockout';

        const isDuplicate = existingNames.has(name.toLowerCase());

        rows.push({
          name,
          gender,
          min_age,
          max_age,
          min_weight,
          max_weight,
          capacity,
          format,
          isDuplicate
        });
      }

      if (rows.length === 0) {
        alert("No valid category rows parsed. Please check your CSV format.");
        return;
      }

      setPreviewRows(rows);
      setStep(2);
    } catch (e: any) {
      alert("Error parsing CSV: " + e.message);
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    let importedCount = 0;
    let duplicatesCount = 0;
    const errors: string[] = [];

    try {
      const existingCategories = await db.categories.list();
      const existingNames = new Set(existingCategories.map(c => c.name.toLowerCase().trim()));

      for (const row of previewRows) {
        if (existingNames.has(row.name.toLowerCase().trim())) {
          duplicatesCount++;
          continue;
        }

        try {
          await db.categories.add({
            name: row.name,
            gender: row.gender,
            min_age: row.min_age,
            max_age: row.max_age,
            min_weight: row.min_weight,
            max_weight: row.max_weight,
            capacity: row.capacity,
            format: row.format,
            status: 'Open'
          });

          existingNames.add(row.name.toLowerCase().trim());
          importedCount++;
        } catch (err: any) {
          errors.push(`Failed to import "${row.name}": ${err.message}`);
        }
      }

      setImportReport({
        importedCount,
        duplicatesCount,
        errors
      });
      setStep(3);
      triggerRefresh();
    } catch (err: any) {
      alert("Import process failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setCsvContent('');
    setPreviewRows([]);
    setImportReport(null);
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Import Weight Categories</h3>
              <p className="text-xs text-muted-foreground">Upload or paste CSV to batch create competition divisions</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 text-xs font-semibold">
            <span className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              1. Upload CSV
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2. Preview & Map ({previewRows.length})
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              3. Status Report
            </span>
          </div>

          {/* Step 1: Upload / Paste */}
          {step === 1 && (
            <div className="space-y-4">
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <input 
                  type="file" 
                  id="category-csv-upload" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <label htmlFor="category-csv-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="p-3 bg-secondary rounded-full mb-3 text-muted-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold mb-1">Click to select CSV or drag & drop</p>
                  <p className="text-xs text-muted-foreground mb-3">Format: Name, Gender, MinAge, MaxAge, MinWt, MaxWt, Capacity, Format</p>
                  <span className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-xs font-bold transition-colors">
                    Browse File
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px bg-border flex-1" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Or Paste Raw Text</span>
                <div className="h-px bg-border flex-1" />
              </div>

              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Paste CSV content here... (e.g. Senior Male Kumite -60kg (18+),Male,18,99,0,60,32,knockout)"
                className="w-full h-28 p-3 text-xs bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={downloadCSVTemplate}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Download Sample CSV Template
                </button>
                <button
                  disabled={!csvContent.trim()}
                  onClick={handlePasteParse}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Parse Pasted Data
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-muted/40 border border-border rounded-xl p-3 text-xs flex items-center justify-between">
                <span>Total parsed rows: <strong>{previewRows.length}</strong></span>
                <span>Existing duplicates: <strong className="text-amber-500">{previewRows.filter(r => r.isDuplicate).length}</strong></span>
              </div>

              <div className="border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted text-muted-foreground font-semibold sticky top-0">
                    <tr>
                      <th className="p-2.5 border-b border-border">Status</th>
                      <th className="p-2.5 border-b border-border">Category Name</th>
                      <th className="p-2.5 border-b border-border">Gender</th>
                      <th className="p-2.5 border-b border-border">Age Range</th>
                      <th className="p-2.5 border-b border-border">Weight Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className={row.isDuplicate ? 'bg-amber-500/10' : 'hover:bg-muted/20'}>
                        <td className="p-2.5 font-medium">
                          {row.isDuplicate ? (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] rounded font-bold">Skip (Exists)</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] rounded font-bold">New</span>
                          )}
                        </td>
                        <td className="p-2.5 font-semibold">{row.name}</td>
                        <td className="p-2.5 text-muted-foreground">{row.gender}</td>
                        <td className="p-2.5 text-muted-foreground">{row.min_age} - {row.max_age} yrs</td>
                        <td className="p-2.5 text-muted-foreground">{row.min_weight} - {row.max_weight} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  disabled={isProcessing}
                  onClick={handleImport}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  {isProcessing && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Import {previewRows.filter(r => !r.isDuplicate).length} New Categories</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Report */}
          {step === 3 && importReport && (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-2">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold">Import Completed Successfully</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Batch processing finished for category bracket import.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs font-semibold pt-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <span className="block text-xl font-black">{importReport.importedCount}</span>
                  <span>New Categories Added</span>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                  <span className="block text-xl font-black">{importReport.duplicatesCount}</span>
                  <span>Duplicates Skipped</span>
                </div>
              </div>

              {importReport.errors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 text-left space-y-1">
                  <span className="font-bold flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Errors:</span>
                  {importReport.errors.map((err, i) => <p key={i}>{err}</p>)}
                </div>
              )}

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={resetState}
                  className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-xs font-bold cursor-pointer"
                >
                  Import More
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
