import React, { useState, useRef, useMemo } from 'react';
import { 
  X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, 
  RefreshCw, ArrowRight, ArrowLeft, Check, AlertCircle, Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

/**
 * Intelligent string similarity / alias matcher for auto-mapping
 */
const findBestColumnMatch = (field, excelColumns) => {
  const fieldKeyClean = (field.key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const fieldLabelClean = (field.label || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = (field.aliases || []).map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));

  for (const col of excelColumns) {
    const colClean = String(col).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!colClean) continue;

    // Exact key/label match
    if (colClean === fieldKeyClean || colClean === fieldLabelClean) {
      return col;
    }

    // Direct alias match
    for (const alias of aliases) {
      if (colClean === alias) {
        return col;
      }
    }
  }

  // Secondary prefix/contains check for strong match
  for (const col of excelColumns) {
    const colClean = String(col).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!colClean) continue;

    for (const alias of aliases) {
      if (alias.length >= 3 && (colClean.includes(alias) || alias.includes(colClean))) {
        return col;
      }
    }
  }

  return "";
};

const ExcelImportModal = ({
  isOpen,
  onClose,
  title = "Import Data from Excel",
  onImportData,
  fields = [],
  existingRecords = [],
  sampleColumns = ["Type", "Brand", "Model", "SerialNumber", "Status", "Scope"],
  sampleData = [
    { Type: "Laptop", Brand: "Dell", Model: "Latitude 5430", SerialNumber: "DELL-LT-9901", Status: "Available", Scope: "Employee" },
    { Type: "Monitor", Brand: "LG", Model: "UltraFine 27", SerialNumber: "LG-MN-8802", Status: "Available", Scope: "Organization" }
  ],
  templateFileName = "Import_Template.xlsx"
}) => {
  const fileInputRef = useRef(null);

  // Modal Step: 'upload' | 'mapping' | 'preview' | 'results'
  const [currentStep, setCurrentStep] = useState('upload');

  // File & Sheet state
  const [selectedFile, setSelectedFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [excelColumns, setExcelColumns] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [sampleValuesMap, setSampleValuesMap] = useState({});

  // Column Mapping state: { [fieldKey]: selectedExcelColumnName }
  const [columnMapping, setColumnMapping] = useState({});
  const [mappingError, setMappingError] = useState('');

  // Processing & Import state
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Fallback default fields if none passed
  const activeFields = useMemo(() => {
    if (fields && fields.length > 0) return fields;
    return sampleColumns.map(col => ({
      key: col.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: col,
      required: col.toLowerCase().includes('id') || col.toLowerCase().includes('name') || col.toLowerCase().includes('type'),
      aliases: [col.toLowerCase(), col.toLowerCase().replace(/\s+/g, '')]
    }));
  }, [fields, sampleColumns]);

  // Compute Converted & Validated Rows for Preview
  const { previewRows, totalValidCount, totalErrorCount, rowValidationErrors, convertedPayloads } = useMemo(() => {
    if (!rawRows || rawRows.length === 0 || !activeFields || activeFields.length === 0) {
      return { previewRows: [], totalValidCount: 0, totalErrorCount: 0, rowValidationErrors: [], convertedPayloads: [] };
    }

    const converted = [];
    const errors = [];
    const seenIds = new Set((existingRecords || []).map(r => (r.id || '').toString().toUpperCase().trim()).filter(Boolean));
    const seenEmails = new Set((existingRecords || []).map(r => (r.email || '').toString().toLowerCase().trim()).filter(Boolean));

    const inMemoryIds = new Set();
    const inMemoryEmails = new Set();

    rawRows.forEach((row, rowIdx) => {
      const item = {};
      const rowErrors = [];

      activeFields.forEach(field => {
        const mappedCol = columnMapping[field.key];
        let val = (mappedCol && mappedCol !== "__DO_NOT_IMPORT__") ? row[mappedCol] : undefined;

        // Apply default value if empty
        if ((val === undefined || val === null || String(val).trim() === "") && field.defaultValue !== undefined) {
          val = field.defaultValue;
        }

        // Apply field transform (e.g. uppercase ID, lowercase email)
        if (field.transform && val !== undefined && val !== null) {
          val = field.transform(val);
        } else if (val !== undefined && val !== null) {
          val = String(val).trim();
        }

        item[field.key] = val;

        // Validation rule check
        if (field.required && (!val || String(val).trim() === "")) {
          rowErrors.push(`${field.label} is required`);
        } else if (field.validate && val !== undefined && val !== null && String(val).trim() !== "") {
          const err = field.validate(val, row, rowIdx, existingRecords);
          if (err) rowErrors.push(err);
        }
      });

      // In-file duplicate ID check
      const rowId = item.id ? String(item.id).toUpperCase().trim() : '';
      if (rowId) {
        if (seenIds.has(rowId) || inMemoryIds.has(rowId)) {
          rowErrors.push(`Duplicate ID '${rowId}'`);
        } else {
          inMemoryIds.add(rowId);
        }
      }

      // In-file duplicate Email check
      const rowEmail = item.email ? String(item.email).toLowerCase().trim() : '';
      if (rowEmail) {
        if (seenEmails.has(rowEmail) || inMemoryEmails.has(rowEmail)) {
          rowErrors.push(`Duplicate Email '${rowEmail}'`);
        } else {
          inMemoryEmails.add(rowEmail);
        }
      }

      const isValid = rowErrors.length === 0;
      if (!isValid) {
        errors.push({ row: rowIdx + 2, reason: rowErrors.join('; ') });
      }

      converted.push({
        _rowNum: rowIdx + 2,
        _isValid: isValid,
        _errors: rowErrors,
        ...item
      });
    });

    const validRows = converted.filter(r => r._isValid);

    return {
      previewRows: converted.slice(0, 20),
      totalValidCount: validRows.length,
      totalErrorCount: errors.length,
      rowValidationErrors: errors,
      convertedPayloads: validRows.map(({ _rowNum, _isValid, _errors, ...data }) => data)
    };
  }, [rawRows, activeFields, columnMapping, existingRecords]);

  // Get list of already mapped columns to prevent duplicate selection
  const mappedExcelColumnsSet = useMemo(() => {
    const set = new Set();
    Object.values(columnMapping).forEach(val => {
      if (val && val !== "__DO_NOT_IMPORT__") {
        set.add(val);
      }
    });
    return set;
  }, [columnMapping]);

  if (!isOpen) return null;

  const handleReset = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    setExcelColumns([]);
    setRawRows([]);
    setSampleValuesMap({});
    setColumnMapping({});
    setMappingError('');
    setIsProcessing(false);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // 1. Process Loaded Worksheet
  const processWorksheet = (wb, sheetName) => {
    try {
      const ws = wb.Sheets[sheetName];
      if (!ws) throw new Error("Selected worksheet not found.");

      // Parse with raw: false to preserve string formatting (e.g. leading zeros and dates)
      const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });

      if (!jsonData || jsonData.length === 0) {
        alert("The selected worksheet is empty or has no data rows.");
        return;
      }

      // Extract all unique detected columns from the sheet
      const detectedColumns = [];
      const columnSet = new Set();
      jsonData.forEach(row => {
        Object.keys(row).forEach(k => {
          const cleanK = String(k).trim();
          if (cleanK && !columnSet.has(cleanK)) {
            columnSet.add(cleanK);
            detectedColumns.push(cleanK);
          }
        });
      });

      if (detectedColumns.length === 0) {
        alert("No readable column headers found in this file.");
        return;
      }

      // Build sample values preview map (3 distinct non-empty sample strings per column)
      const samples = {};
      detectedColumns.forEach(col => {
        const distinct = [];
        for (let i = 0; i < jsonData.length; i++) {
          const val = jsonData[i][col];
          if (val !== undefined && val !== null && String(val).trim() !== "") {
            const strVal = String(val).trim();
            if (!distinct.includes(strVal)) {
              distinct.push(strVal);
            }
          }
          if (distinct.length >= 3) break;
        }
        samples[col] = distinct;
      });

      // Compute intelligent auto-mapping
      const initialMapping = {};
      const usedColumns = new Set();

      activeFields.forEach(field => {
        const bestMatch = findBestColumnMatch(field, detectedColumns);
        if (bestMatch && !usedColumns.has(bestMatch)) {
          initialMapping[field.key] = bestMatch;
          usedColumns.add(bestMatch);
        } else {
          initialMapping[field.key] = field.required ? "" : "__DO_NOT_IMPORT__";
        }
      });

      setExcelColumns(detectedColumns);
      setRawRows(jsonData);
      setSampleValuesMap(samples);
      setColumnMapping(initialMapping);
      setMappingError('');
      setCurrentStep('mapping');
    } catch (err) {
      console.error("Error reading worksheet:", err);
      alert(`Unable to read spreadsheet: ${err.message || 'Corrupted file.'}`);
    }
  };

  // Handle File Selection
  const handleFileSelected = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      alert("Please select a valid Excel (.xlsx, .xls) or CSV file.");
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames || []);

        const firstSheet = wb.SheetNames[0] || 'Sheet1';
        setSelectedSheet(firstSheet);
        processWorksheet(wb, firstSheet);
      } catch (err) {
        console.error("File read error:", err);
        alert(`Failed to parse file: ${err.message || 'Invalid spreadsheet file.'}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSheetChange = (sheetName) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      processWorksheet(workbook, sheetName);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(sampleData, { header: sampleColumns });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, templateFileName);
  };

  // Mapping Change Handler
  const handleMappingChange = (fieldKey, value) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    setMappingError('');
  };

  // Validate Mapping & Move to Preview
  const handleContinueToPreview = () => {
    // Check if any required field is unmapped
    const unmappedRequired = activeFields.filter(
      f => f.required && (!columnMapping[f.key] || columnMapping[f.key] === "__DO_NOT_IMPORT__")
    );

    if (unmappedRequired.length > 0) {
      setMappingError(`Please map all required database fields: ${unmappedRequired.map(f => f.label).join(', ')}`);
      return;
    }

    setMappingError('');
    setCurrentStep('preview');
  };

  // Final Import Confirmation Execution
  const handleExecuteImport = async () => {
    if (!convertedPayloads || convertedPayloads.length === 0) {
      alert("No valid rows available to import.");
      return;
    }

    setIsProcessing(true);
    try {
      const summary = await onImportData(convertedPayloads);
      setImportSummary(summary || {
        totalRows: rawRows.length,
        successCount: convertedPayloads.length,
        failedRows: rowValidationErrors
      });
      setCurrentStep('results');
    } catch (err) {
      console.error("Import error:", err);
      setImportSummary({
        totalRows: rawRows.length,
        successCount: 0,
        failedRows: [{ row: 0, reason: err.message || "Bulk import failed." }]
      });
      setCurrentStep('results');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl p-6 z-10 space-y-5 animate-scale-in max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base leading-tight">{title}</h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                {currentStep === 'upload' && "Step 1: Upload File & Select Worksheet"}
                {currentStep === 'mapping' && "Step 2: Map Database Fields to Spreadsheet Columns"}
                {currentStep === 'preview' && "Step 3: Preview Converted Data & Validate"}
                {currentStep === 'results' && "Step 4: Import Results Summary"}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] font-bold text-slate-500 shrink-0">
          <div className={`flex items-center gap-1.5 ${currentStep === 'upload' ? 'text-blue-600' : selectedFile ? 'text-emerald-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              currentStep === 'upload' ? 'bg-blue-600 text-white' : selectedFile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}>1</span>
            <span>Upload</span>
          </div>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${currentStep === 'mapping' ? 'text-blue-600' : (currentStep === 'preview' || currentStep === 'results') ? 'text-emerald-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              currentStep === 'mapping' ? 'bg-blue-600 text-white' : (currentStep === 'preview' || currentStep === 'results') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}>2</span>
            <span>Map Columns</span>
          </div>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${currentStep === 'preview' ? 'text-blue-600' : currentStep === 'results' ? 'text-emerald-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              currentStep === 'preview' ? 'bg-blue-600 text-white' : currentStep === 'results' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}>3</span>
            <span>Preview</span>
          </div>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${currentStep === 'results' ? 'text-blue-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              currentStep === 'results' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>4</span>
            <span>Import</span>
          </div>
        </div>

        {/* ================= STEP 1: UPLOAD & SHEET SELECTOR ================= */}
        {currentStep === 'upload' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Template Download Hint */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
              <span className="text-slate-600 font-medium text-[11px]">Optional: Download standard template format</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 font-bold rounded-xl text-[11px] shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Sample Template</span>
              </button>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : selectedFile 
                  ? 'border-emerald-400 bg-emerald-50/20' 
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                onChange={(e) => e.target.files && handleFileSelected(e.target.files[0])}
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-10 w-10 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to replace file</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-9 w-9 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Click to select file or drag & drop</p>
                  <p className="text-[10px] text-slate-400">Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)</p>
                  <p className="text-[10px] text-blue-600 font-semibold pt-1">You will be able to map custom column names in the next step</p>
                </div>
              )}
            </div>

            {/* Multi-sheet selection if workbook has >1 sheets */}
            {sheetNames.length > 1 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  <span>Select Worksheet to Import:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sheetNames.map(sheet => (
                    <button
                      key={sheet}
                      type="button"
                      onClick={() => handleSheetChange(sheet)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSheet === sheet
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sheet}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel Button */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: COLUMN MAPPING ================= */}
        {currentStep === 'mapping' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* File Info Bar */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div>
                <span className="font-bold text-slate-700">{selectedFile?.name}</span>
                {selectedSheet && <span className="text-[10px] text-slate-400 ml-1">({selectedSheet})</span>}
                <span className="text-[10px] text-slate-500 font-semibold block">
                  {rawRows.length} rows &bull; {excelColumns.length} columns detected
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg">
                Auto-Matched Available
              </span>
            </div>

            {/* Validation Error Banner */}
            {mappingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{mappingError}</span>
              </div>
            )}

            {/* Mapping Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
              <div className="grid grid-cols-12 bg-slate-50 p-2.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <div className="col-span-5">Database Field</div>
                <div className="col-span-7">Spreadsheet Column</div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[38vh] overflow-y-auto">
                {activeFields.map(field => {
                  const currentMapped = columnMapping[field.key] || "";
                  const samples = sampleValuesMap[currentMapped] || [];
                  const isUnmappedRequired = field.required && (!currentMapped || currentMapped === "__DO_NOT_IMPORT__");

                  return (
                    <div 
                      key={field.key} 
                      className={`grid grid-cols-12 items-center p-3 transition-colors ${
                        isUnmappedRequired ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Left: DB Field Info */}
                      <div className="col-span-5 pr-2">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-800 text-xs">{field.label}</span>
                          {field.required ? (
                            <span className="text-rose-500 font-black text-xs" title="Required Field">*</span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold">(Optional)</span>
                          )}
                        </div>
                        {field.description && (
                          <p className="text-[10px] text-slate-400 truncate">{field.description}</p>
                        )}
                      </div>

                      {/* Right: Dropdown Selector & Sample Values */}
                      <div className="col-span-7 space-y-1">
                        <select
                          value={currentMapped}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border bg-white cursor-pointer transition-all ${
                            isUnmappedRequired 
                              ? 'border-amber-400 bg-amber-50/20 text-slate-800' 
                              : currentMapped && currentMapped !== "__DO_NOT_IMPORT__"
                              ? 'border-blue-300 text-slate-800 font-bold'
                              : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          <option value="">-- Select Excel Column --</option>
                          {!field.required && (
                            <option value="__DO_NOT_IMPORT__" className="text-slate-400">
                              ✕ Do not import (Leave default)
                            </option>
                          )}
                          {excelColumns.map(col => {
                            const isUsedElsewhere = mappedExcelColumnsSet.has(col) && currentMapped !== col;
                            return (
                              <option 
                                key={col} 
                                value={col} 
                                disabled={isUsedElsewhere}
                                className={isUsedElsewhere ? 'text-slate-300' : 'text-slate-800'}
                              >
                                {col} {isUsedElsewhere ? '(Already mapped)' : ''}
                              </option>
                            );
                          })}
                        </select>

                        {/* Sample Values Display */}
                        {currentMapped && currentMapped !== "__DO_NOT_IMPORT__" && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate pl-1">
                            <span className="font-semibold text-slate-400 shrink-0">Sample:</span>
                            {samples.length > 0 ? (
                              <span className="text-blue-600 font-medium truncate">
                                {samples.map(s => `"${s}"`).join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No non-empty sample values</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unmapped Ignored Columns Note */}
            <p className="text-[10px] text-slate-400">
              * Database fields marked with an asterisk are required. Extra columns from your spreadsheet that are not mapped will be safely ignored.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep('upload')}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 text-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleContinueToPreview}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Continue to Preview</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PREVIEW & VALIDATION ================= */}
        {currentStep === 'preview' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Stats Summary Bar */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Rows</span>
                <span className="font-extrabold text-slate-800 text-sm">{rawRows.length}</span>
              </div>
              <div className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-200/60">
                <span className="block text-[10px] font-bold text-emerald-600 uppercase">Ready to Import</span>
                <span className="font-extrabold text-emerald-700 text-sm">{totalValidCount}</span>
              </div>
              <div className={`p-2.5 rounded-2xl border ${totalErrorCount > 0 ? 'bg-rose-50/60 border-rose-200/60' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`block text-[10px] font-bold uppercase ${totalErrorCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  Rows with Errors
                </span>
                <span className={`font-extrabold text-sm ${totalErrorCount > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {totalErrorCount}
                </span>
              </div>
            </div>

            {/* Validation Notice if errors detected */}
            {totalErrorCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{totalErrorCount} row(s) contain validation errors and will be skipped:</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1 bg-white p-2 rounded-xl border border-amber-200/60 text-[10px]">
                  {rowValidationErrors.slice(0, 10).map((err, i) => (
                    <div key={i} className="text-rose-600 font-medium flex items-start gap-1">
                      <span>• Row {err.row}: {err.reason}</span>
                    </div>
                  ))}
                  {rowValidationErrors.length > 10 && (
                    <div className="text-slate-400 font-semibold">
                      ...and {rowValidationErrors.length - 10} more error rows.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Mapped Data Preview (First {previewRows.length} rows)</span>
                <span className="text-[10px] text-slate-400 font-medium">Converted into database structure</span>
              </div>

              <div className="overflow-x-auto max-h-[34vh] overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                      <th className="p-2">Row</th>
                      <th className="p-2">Status</th>
                      {activeFields.filter(f => columnMapping[f.key] && columnMapping[f.key] !== "__DO_NOT_IMPORT__").map(f => (
                        <th key={f.key} className="p-2">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className={row._isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/30'}>
                        <td className="p-2 text-slate-400 font-mono">{row._rowNum}</td>
                        <td className="p-2">
                          {row._isValid ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                              <Check className="h-2.5 w-2.5" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md" title={row._errors.join('; ')}>
                              <AlertTriangle className="h-2.5 w-2.5" /> Error
                            </span>
                          )}
                        </td>
                        {activeFields.filter(f => columnMapping[f.key] && columnMapping[f.key] !== "__DO_NOT_IMPORT__").map(f => (
                          <td key={f.key} className="p-2 font-medium text-slate-700 max-w-[140px] truncate">
                            {row[f.key] || <span className="text-slate-300 italic">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep('mapping')}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 text-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Mapping</span>
              </button>

              <button
                type="button"
                disabled={totalValidCount === 0 || isProcessing}
                onClick={handleExecuteImport}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Import {totalValidCount} Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: IMPORT RESULTS ================= */}
        {currentStep === 'results' && importSummary && (
          <div className="space-y-4 text-xs animate-fade-in overflow-y-auto pr-1 flex-1">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-extrabold text-slate-800 text-sm">Import Results Summary</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  importSummary.failedRows.length === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {importSummary.failedRows.length === 0 ? 'Success' : 'Completed with Skipped Rows'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Processed</span>
                  <span className="font-extrabold text-slate-800 text-sm">{importSummary.totalRows}</span>
                </div>
                <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/50">
                  <span className="block text-[10px] font-bold text-emerald-600 uppercase">Imported</span>
                  <span className="font-extrabold text-emerald-700 text-sm">{importSummary.successCount}</span>
                </div>
                <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100/50">
                  <span className="block text-[10px] font-bold text-rose-600 uppercase">Failed / Skipped</span>
                  <span className="font-extrabold text-rose-700 text-sm">{importSummary.failedRows.length}</span>
                </div>
              </div>

              {/* Error Details */}
              {importSummary.failedRows.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Skipped Row Details:</p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-200/70 rounded-xl p-2 bg-white">
                    {importSummary.failedRows.map((err, i) => (
                      <div key={i} className="text-[10px] text-rose-600 font-medium flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                        <span>{err.row > 0 ? `Row ${err.row}: ` : ''}{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition-all cursor-pointer text-xs"
              >
                Import Another File
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer text-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExcelImportModal;
