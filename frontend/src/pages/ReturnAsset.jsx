import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Check,
  Eye,
  Download,
  FileSpreadsheet,
  Info,
  X
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import Avatar from '../components/Avatar';

const ReturnAsset = () => {
  const {
    employees,
    assets,
    returnAssets,
    activity,
    currentUser,
    showToast
  } = useAssetManager();

  const formatDateWithYear = (dateStr) => {
    if (!dateStr) return '21 Jul 2026';
    const parts = dateStr.split(',').map(s => s.trim());
    if (/\b\d{4}\b/.test(parts[0])) {
      return parts[0];
    }
    if (parts.length >= 2 && /\b\d{4}\b/.test(parts[1])) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return parts[0];
  };

  // State for showing full return history
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Selected Employee & Assets states
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Auto-select initial employee who has assigned assets
  useEffect(() => {
    if (!selectedEmpId && employees.length > 0) {
      const empWithAssets = employees.find(e => assets.some(a => (a.assignedTo === e.id || a.assignedTo === e.name) && a.status === 'Assigned'));
      if (empWithAssets) {
        setSelectedEmpId(empWithAssets.id);
      } else if (employees[0]) {
        setSelectedEmpId(employees[0].id);
      }
    }
  }, [employees, assets, selectedEmpId]);

  // Employee Combobox Dropdown state
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const empDropdownRef = useRef(null);

  // Sync displayed search text when selectedEmpId changes or dropdown closes
  useEffect(() => {
    const initialEmp = employees.find(e => e.id === selectedEmpId);
    if (initialEmp && !isTyping) {
      setEmpSearchQuery(`${initialEmp.id} - ${initialEmp.name}`);
    }
  }, [selectedEmpId, isTyping, employees]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target)) {
        setIsEmpDropdownOpen(false);
        setIsTyping(false);
        const cur = employees.find(e => e.id === selectedEmpId);
        if (cur) setEmpSearchQuery(`${cur.id} - ${cur.name}`);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedEmpId, employees]);

  const filteredEmployees = employees.filter(emp => {
    if (!isTyping || !empSearchQuery.trim()) return true;
    const q = empSearchQuery.toLowerCase().trim();
    const fullText = `${emp.id} ${emp.name} ${emp.department} ${emp.email}`.toLowerCase();
    return fullText.includes(q);
  });

  // 1. Get employee details
  const currentEmp = employees.find(e => e.id === selectedEmpId);

  // Form details states
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [returnedBy, setReturnedBy] = useState(currentEmp ? currentEmp.name : '');
  const [reason, setReason] = useState('Employee Resignation');
  const [condition, setCondition] = useState('Good');
  const [remarks, setRemarks] = useState('');

  // ReturnedBy Combobox state
  const [isReturnedByDropdownOpen, setIsReturnedByDropdownOpen] = useState(false);
  const [returnedBySearchQuery, setReturnedBySearchQuery] = useState(returnedBy);
  const [isReturnedByTyping, setIsReturnedByTyping] = useState(false);
  const returnedByDropdownRef = useRef(null);

  useEffect(() => {
    if (!isReturnedByTyping) {
      setReturnedBySearchQuery(returnedBy);
    }
  }, [returnedBy, isReturnedByTyping]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (returnedByDropdownRef.current && !returnedByDropdownRef.current.contains(event.target)) {
        setIsReturnedByDropdownOpen(false);
        setIsReturnedByTyping(false);
        setReturnedBySearchQuery(returnedBy);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [returnedBy]);

  const filteredReturnedByEmployees = employees.filter(emp => {
    if (!isReturnedByTyping || !returnedBySearchQuery.trim()) return true;
    const q = returnedBySearchQuery.toLowerCase().trim();
    return `${emp.id} ${emp.name} ${emp.department} ${emp.email}`.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (currentEmp) {
      setReturnedBy(currentEmp.name);
      setReturnedBySearchQuery(currentEmp.name);
    }
  }, [selectedEmpId, currentEmp]);

  // 2. Find assets currently assigned to this employee
  const assignedAssets = assets.filter(asset => {
    if (asset.status !== 'Assigned') return false;
    if (!selectedEmpId && !currentEmp) return false;
    return asset.assignedTo === selectedEmpId || (currentEmp && (asset.assignedTo === currentEmp.name || asset.assignedTo === currentEmp.email));
  });

  // 3. Toggle assets checked for return
  const handleToggleAsset = (id) => {
    setSelectedAssetIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 4. Wizard actions
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!selectedEmpId) {
      showToast("Please select an employee.", "error");
      return;
    }
    if (selectedAssetIds.length === 0) {
      showToast("Please select at least one assigned asset to return.", "error");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    returnAssets(selectedEmpId, selectedAssetIds, returnDate, condition, remarks);

    setIsConfirmOpen(false);
    showToast(`Successfully processed return of ${selectedAssetIds.length} assets from ${currentEmp?.name || 'Employee'}!`);
    setSelectedAssetIds([]);
    setRemarks('');
  };

  const activeAdminName = currentUser?.name || 'Rakesh Reddy';

  // Map real return activity logs into history items (grouped by timestamp + employee)
  const realReturnLogs = (() => {
    const returnLogsRaw = (activity || []).filter(a => a.activity === 'Return Asset');
    const groups = {};

    returnLogsRaw.forEach(log => {
      // Find employee info from details
      const empIdMatch = log.details.match(/Q?EMP\d+/i) || log.details.match(/\(([^)]+)\)/);
      const empId = empIdMatch ? (Array.isArray(empIdMatch) ? empIdMatch[0] : empIdMatch) : '';
      const emp = employees.find(e => e.id.toLowerCase() === empId.toLowerCase() || log.details.toLowerCase().includes(e.name.toLowerCase()));

      const empName = emp ? emp.name : (log.details.match(/from\s+([^(!,]+)/i)?.[1]?.trim() || 'Employee');
      const empActualId = emp ? emp.id : (empId || 'EMP011');

      // Grouping key: dateTime + empActualId
      const key = `${log.dateTime}_${empActualId}`;

      // Extract asset ID
      const assetIdMatch = log.details.match(/asset\s+(\S+)/i);
      const assetId = assetIdMatch ? assetIdMatch[1] : '';

      const condMatch = log.details.match(/Condition:\s*(\w+)/i);
      const condition = condMatch ? condMatch[1] : 'Good';

      if (!groups[key]) {
        groups[key] = {
          dateTime: log.dateTime,
          employeeName: empName,
          employeeId: empActualId,
          user: log.user,
          condition: condition,
          assetIds: [assetId],
          details: log.details
        };
      } else {
        // Prevent duplicate asset IDs in the list if double logged
        if (assetId && !groups[key].assetIds.includes(assetId)) {
          groups[key].assetIds.push(assetId);
        }
      }
    });

    return Object.values(groups).map((group, index) => {
      const count = group.assetIds.length;
      const assetCountStr = `${count} Asset${count > 1 ? 's' : ''}`;
      const assetList = group.assetIds.filter(Boolean).join(', ');

      return {
        id: `RET${String(100 - index).padStart(4, '0')}`,
        employeeName: group.employeeName,
        employeeId: group.employeeId,
        assetsCount: assetCountStr,
        returnDate: formatDateWithYear(group.dateTime),
        returnedTo: group.user || activeAdminName,
        reason: group.details.toLowerCase().includes('resig') ? 'Employee Resignation' : 'Standard Return',
        condition: group.condition,
        details: `Returned ${count} asset(s) (${assetList}) from ${group.employeeName}.`
      };
    });
  })();

  // Default initial return history items for rich display
  const defaultReturnHistory = [
    {
      id: 'RET0004',
      employeeName: 'Rahul Sharma',
      employeeId: 'EMP002',
      assetsCount: '1 Asset',
      returnDate: 'Jul 21, 2026',
      returnedTo: activeAdminName,
      reason: 'Employee Resignation',
      condition: 'Good',
      details: 'Returned 1 asset (Latitude 5440) due to resignation.'
    },
    {
      id: 'RET0003',
      employeeName: 'Rahul Sharma',
      employeeId: 'EMP002',
      assetsCount: '1 Asset',
      returnDate: '09 Jul 2026',
      returnedTo: activeAdminName,
      reason: 'Employee Resignation',
      condition: 'Good',
      details: 'Returned 1 asset (Dell Monitor 27")'
    },
    {
      id: 'RET0002',
      employeeName: 'Priya Verma',
      employeeId: 'EMP003',
      assetsCount: '2 Assets',
      returnDate: '01 Jul 2026',
      returnedTo: activeAdminName,
      reason: 'Role Change',
      condition: 'Good',
      details: 'Returned 2 assets (Logitech Keyboard & Mouse)'
    },
    {
      id: 'RET0001',
      employeeName: 'Amit Patel',
      employeeId: 'EMP004',
      assetsCount: '1 Asset',
      returnDate: '25 Jun 2026',
      returnedTo: activeAdminName,
      reason: 'Hardware Upgrade',
      condition: 'Fair',
      details: 'Returned 1 old Laptop for replacement'
    }
  ];

  const allReturnHistory = [...realReturnLogs, ...defaultReturnHistory.filter(def => !realReturnLogs.some(r => r.id === def.id))];
  const displayedHistory = showAllHistory ? allReturnHistory : allReturnHistory.slice(0, 5);

  const handleExportReturnHistory = () => {
    const headers = ['Return ID', 'Employee', 'Employee ID', 'Assets Returned', 'Return Date', 'Reason', 'Condition', 'Details'];
    const rows = allReturnHistory.map(item => [
      item.id,
      `"${item.employeeName}"`,
      item.employeeId,
      `"${item.assetsCount}"`,
      `"${item.returnDate}"`,
      `"${item.reason}"`,
      `"${item.condition}"`,
      `"${item.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Returned_Assets_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Returned assets history exported to CSV!");
  };



  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="text-xs font-semibold text-slate-400">
        <span className="hover:text-slate-600 cursor-pointer">Dashboard</span>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-600 font-bold">Return Assets</span>
      </div>

      {/* Progress tracker wizard header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto text-xs font-bold">
          <div className="flex items-center gap-2 text-[#1E3A8A]">
            <span className="h-6 w-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">1</span>
            <span>Select Employee</span>
          </div>
          <div className="h-0.5 bg-blue-100 flex-1 hidden sm:block mx-4" />
          <div className="flex items-center gap-2 text-[#1E3A8A]">
            <span className="h-6 w-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">2</span>
            <span>Select Assets</span>
          </div>
          <div className="h-0.5 bg-blue-100 flex-1 hidden sm:block mx-4" />
          <div className="flex items-center gap-2 text-[#1E3A8A]">
            <span className="h-6 w-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">3</span>
            <span>Return Details</span>
          </div>
          <div className="h-0.5 bg-blue-100 flex-1 hidden sm:block mx-4" />
          <div className="flex items-center gap-2 text-[#1E3A8A]">
            <span className="h-6 w-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">4</span>
            <span>Review & Confirm</span>
          </div>
        </div>
      </div>

      {/* Main Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Select Employee & Assigned Assets */}
        <div className="space-y-8">
          {/* 1. Select Employee card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-500">1</span>
              <span>Select Employee</span>
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500">Select Employee *</label>

              {/* Searchable Combobox Dropdown */}
              <div className="relative" ref={empDropdownRef}>
                <div
                  onClick={() => setIsEmpDropdownOpen(prev => !prev)}
                  className="w-full p-2.5 border border-slate-200/90 rounded-xl text-xs bg-slate-50/80 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={empSearchQuery}
                      onFocus={(e) => {
                        e.target.select();
                        setIsEmpDropdownOpen(true);
                      }}
                      onChange={(e) => {
                        setEmpSearchQuery(e.target.value);
                        setIsTyping(true);
                        setIsEmpDropdownOpen(true);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEmpDropdownOpen(true);
                      }}
                      placeholder="Type name or ID to filter..."
                      className="w-full bg-transparent focus:outline-none font-semibold text-slate-700 text-xs placeholder:text-slate-400 placeholder:font-normal cursor-pointer focus:cursor-text"
                    />
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isEmpDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isEmpDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-medium">
                        No employee matching "{empSearchQuery}"
                      </div>
                    ) : (
                      filteredEmployees.map(emp => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmpId(emp.id);
                            setSelectedAssetIds([]);
                            setEmpSearchQuery(`${emp.id} - ${emp.name}`);
                            setIsTyping(false);
                            setIsEmpDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${selectedEmpId === emp.id
                              ? 'bg-blue-50 text-blue-600 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={emp.name} avatar={emp.avatar} className="h-6 w-6 rounded-full" textSize="text-[8px]" />
                            <div className="truncate">
                              <span className="font-extrabold text-blue-600 mr-1.5">{emp.id}</span>
                              <span>{emp.name}</span>
                              <span className="text-[10px] text-slate-400 ml-2">({emp.department})</span>
                            </div>
                          </div>
                          {selectedEmpId === emp.id && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed employee card */}
            {currentEmp && (
              <div className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-3">
                {/* Header with Avatar and Basic Info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={currentEmp.name}
                      avatar={currentEmp.avatar}
                      className="h-12 w-12 rounded-xl border border-slate-200/80 shadow-2xs shrink-0"
                      textSize="text-base"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">
                        {currentEmp.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                        {currentEmp.designation || 'Specialist'}
                      </p>
                    </div>
                  </div>
                  {currentEmp.department && (
                    <span className="shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                      {currentEmp.department}
                    </span>
                  )}
                </div>

                {/* Structured Details Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-200/70 text-xs">
                  <div className="bg-white border border-slate-200/70 rounded-xl p-2.5 space-y-0.5">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block">
                      Employee ID
                    </span>
                    <span className="font-bold text-slate-700 text-xs block truncate">
                      {currentEmp.id}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/70 rounded-xl p-2.5 space-y-0.5">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block">
                      Department
                    </span>
                    <span className="font-bold text-slate-700 text-xs block truncate" title={currentEmp.department}>
                      {currentEmp.department || 'IT'}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/70 rounded-xl p-2.5 space-y-0.5">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block">
                      Email
                    </span>
                    <span className="font-bold text-slate-700 text-xs block truncate" title={currentEmp.email}>
                      {currentEmp.email}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/70 rounded-xl p-2.5 space-y-0.5">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block">
                      Date of Joining
                    </span>
                    <span className="font-bold text-slate-700 text-xs block truncate">
                      {currentEmp.joiningDate || currentEmp.dateOfJoining || '24 Aug 2026'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Assigned Assets selection */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-500">2</span>
              <span>Assigned Assets</span>
            </h3>

            {/* Asset checklist table */}
            <div className="w-full">
              <table className="w-full text-left border-collapse text-xs table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5 px-1.5 w-[16%]">Asset ID</th>
                    <th className="pb-2.5 px-1.5 w-[20%]">Asset Type</th>
                    <th className="pb-2.5 px-1.5 w-[28%]">Model</th>
                    <th className="pb-2.5 px-1.5 w-[20%]">Assigned Date</th>
                    <th className="pb-2.5 px-1.5 w-[16%] text-center">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {assignedAssets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                        No assets currently assigned to this employee.
                      </td>
                    </tr>
                  ) : (
                    assignedAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => handleToggleAsset(asset.id)}>
                        <td className="py-2.5 px-1.5 font-extrabold text-blue-600 truncate">{asset.id}</td>
                        <td className="py-2.5 px-1.5 font-bold text-slate-800 truncate">{asset.type}</td>
                        <td className="py-2.5 px-1.5 text-slate-600 truncate">{asset.brand} {asset.model}</td>
                        <td className="py-2.5 px-1.5 text-slate-500 text-[10px] font-medium truncate">{asset.purchaseDate || '10 May 2024'}</td>
                        <td className="py-2.5 px-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedAssetIds.includes(asset.id)}
                            onChange={() => handleToggleAsset(asset.id)}
                            className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Count summaries */}
            <div className="flex justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-400">
              <span>Total Assigned Assets: {assignedAssets.length}</span>
              <span className="text-blue-600">Selected for Return: {selectedAssetIds.length}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Return Details form & Instructions */}
        <div className="space-y-8">
          {/* 3. Return details card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-500">3</span>
              <span>Return Details</span>
            </h3>

            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Return Date *</label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Returned By *</label>
                  <div className="relative" ref={returnedByDropdownRef}>
                    <div
                      onClick={() => setIsReturnedByDropdownOpen(prev => !prev)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <input
                        type="text"
                        value={returnedBySearchQuery}
                        onFocus={(e) => {
                          e.target.select();
                          setIsReturnedByDropdownOpen(true);
                        }}
                        onChange={(e) => {
                          setReturnedBySearchQuery(e.target.value);
                          setIsReturnedByTyping(true);
                          setIsReturnedByDropdownOpen(true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsReturnedByDropdownOpen(true);
                        }}
                        placeholder="Type name or ID..."
                        className="w-full bg-transparent focus:outline-none font-semibold text-slate-700 text-xs placeholder:text-slate-400 placeholder:font-normal cursor-pointer focus:cursor-text"
                      />
                      <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isReturnedByDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isReturnedByDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto">
                        {filteredReturnedByEmployees.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400 font-medium">
                            No employee matching "{returnedBySearchQuery}"
                          </div>
                        ) : (
                          filteredReturnedByEmployees.map(emp => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setReturnedBy(emp.name);
                                setReturnedBySearchQuery(emp.name);
                                setIsReturnedByTyping(false);
                                setIsReturnedByDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${returnedBy === emp.name
                                  ? 'bg-blue-50 text-blue-600 font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar name={emp.name} avatar={emp.avatar} className="h-5 w-5 rounded-full" textSize="text-[7px]" />
                                <div className="truncate">
                                  <span className="font-extrabold text-blue-600 mr-1.5">{emp.id}</span>
                                  <span>{emp.name}</span>
                                  <span className="text-[10px] text-slate-400 ml-1.5">({emp.department})</span>
                                </div>
                              </div>
                              {returnedBy === emp.name && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Return *</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700 bg-slate-50/50"
                  >
                    {["Employee Resignation", "Upgraded Device", "Department Transfer", "Relieving", "Damaged/Defective"].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Condition of Assets *</label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700 bg-slate-50/50"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Under Repair">Under Repair / Defective</option>
                    <option value="Damaged">Damaged (Disposed)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks (Optional)</label>
                <textarea
                  rows={1}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Enter any remarks..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                />
              </div>

              {/* Green Instructions card */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 text-xs text-emerald-900">
                <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold">Instructions</p>
                  <ul className="list-disc pl-4 space-y-1 text-[10px] font-semibold text-emerald-800">
                    <li>Please ensure all selected assets are physically received before confirming return.</li>
                    <li>Asset status will be updated to 'Available' (or 'Under Repair') after confirmation.</li>
                  </ul>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Next: Review & Confirm</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Section: Returned Assets History */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Returned Assets History</h3>
          <button
            type="button"
            onClick={handleExportReturnHistory}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">Return ID</th>
                <th className="pb-3 px-4">Employee</th>
                <th className="pb-3 px-4">Assets Returned</th>
                <th className="pb-3 px-4">Return Date</th>
                <th className="pb-3 px-4">Reason</th>
                <th className="pb-3 px-4">Condition</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedHistory.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="py-4 pr-4 font-bold text-blue-600">{item.id}</td>
                  <td className="py-4 px-4 font-bold">
                    <div className="flex items-center gap-2">
                      <Avatar name={item.employeeName} avatar={item.employeeAvatar || employees.find(e => e.id === item.employeeId)?.avatar} className="h-6 w-6 rounded-full" textSize="text-[8px]" />
                      <span>{item.employeeName} ({item.employeeId})</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-bold text-blue-600">{item.assetsCount}</td>
                  <td className="py-4 px-4 text-slate-500">{item.returnDate}</td>
                  <td className="py-4 px-4 text-slate-500">{item.reason}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.condition === 'Good' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button
                      onClick={() => showToast(`Details: ${item.details}`, "info")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-all cursor-pointer"
          >
            {showAllHistory ? "Show less" : `View all returned assets (${allReturnHistory.length})`}
          </button>
        </div>
      </div>

      {/* Review & Confirm overlay modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsConfirmOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 z-10 flex flex-col items-center">
            <button onClick={() => setIsConfirmOpen(false)} className="absolute top-5 right-5 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-full mb-4">
              <AlertCircle className="h-10 w-10 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-base text-center">Confirm Asset Return</h3>
            <p className="text-xs text-slate-500 text-center mt-2 px-2 leading-relaxed">
              Are you sure you want to process the return of <strong className="text-slate-800">{selectedAssetIds.length} assets</strong> from <strong className="text-slate-800">{currentEmp?.name}</strong>?
            </p>

            <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs space-y-2 mt-4 text-slate-600 font-semibold">
              <div className="flex justify-between">
                <span>Employee Name:</span>
                <span className="font-bold text-slate-800">{currentEmp?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Return Date:</span>
                <span className="font-bold text-slate-800">{returnDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Reported Condition:</span>
                <span className="font-bold text-slate-800">{condition}</span>
              </div>
              <div className="flex justify-between">
                <span>Return Reason:</span>
                <span className="font-bold text-slate-800">{reason}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 transition-all"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnAsset;
