import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Calendar,
  UserCheck,
  Plus,
  Minus,
  Eye,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  FileText,
  Laptop,
  Monitor,
  Mouse,
  Keyboard,
  Headphones,
  Printer,
  Cpu,
  Link2,
  ArrowLeft,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import Avatar from '../components/Avatar';
import AssetIconBadge from '../components/AssetIcon';

const AssignAsset = () => {
  const {
    employees,
    assets,
    categories,
    assignAssets,
    activity,
    currentUser,
    showToast
  } = useAssetManager();

  // Selected state
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewLogModal, setViewLogModal] = useState({ isOpen: false, log: null });

  useEffect(() => {
    if (!selectedEmpId && (employees || []).length > 0) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  // Employee Combobox Dropdown state
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const empDropdownRef = useRef(null);

  // Sync displayed search text when selectedEmpId changes or dropdown closes
  useEffect(() => {
    const initialEmp = (employees || []).find(e => e.id === selectedEmpId);
    if (initialEmp && !isTyping) {
      setEmpSearchQuery(`${initialEmp.id} - ${initialEmp.name}`);
    }
  }, [selectedEmpId, isTyping, employees]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target)) {
        setIsEmpDropdownOpen(false);
        setIsTyping(false);
        const cur = (employees || []).find(e => e.id === selectedEmpId);
        if (cur) setEmpSearchQuery(`${cur.id} - ${cur.name}`);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedEmpId, employees]);

  const activeEmployees = (employees || []).filter(e => e.status === 'Active');

  const filteredEmployees = activeEmployees.filter(emp => {
    if (!isTyping || !empSearchQuery.trim()) return true;
    const q = empSearchQuery.toLowerCase().trim();
    const fullText = `${emp.id} ${emp.name} ${emp.department} ${emp.email}`.toLowerCase();
    return fullText.includes(q);
  });

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // search | qr
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Form details state
  const [assignDate, setAssignDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // 1. Get selected employee details
  const currentEmp = (employees || []).find(e => e.id === selectedEmpId);

  // 2. Filter available assets for selection list
  const availableAssets = (assets || []).filter(asset => {
    const isAvailable = asset.status === 'Available';
    const isNotBasket = !selectedAssetIds.includes(asset.id);
    const searchString = `${asset.id} ${asset.type} ${asset.brand} ${asset.model} ${asset.serialNumber}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    return isAvailable && isNotBasket && matchesSearch;
  });

  // 3. Get basket assets
  const basketAssets = (assets || []).filter(asset => selectedAssetIds.includes(asset.id));

  // 4. Toggle asset selection
  const handleAddAsset = (id) => {
    setSelectedAssetIds(prev => [...prev, id]);
  };

  const handleRemoveAsset = (id) => {
    setSelectedAssetIds(prev => prev.filter(item => item !== id));
  };

  // 5. Submit assignment
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmpId) {
      showToast("Please select an employee.", "error");
      return;
    }
    if (selectedAssetIds.length === 0) {
      showToast("Please select at least one asset to assign.", "error");
      return;
    }

    assignAssets(selectedEmpId, selectedAssetIds, assignDate, remarks);

    // Success feedback and Reset
    showToast(`Successfully assigned ${selectedAssetIds.length} assets to ${currentEmp?.name || 'Employee'}!`);
    setSelectedAssetIds([]);
    setRemarks('');
    setSelectedCategory(null);
  };

  const handleReset = () => {
    setSelectedAssetIds([]);
    setRemarks('');
    setAssignDate(new Date().toISOString().split('T')[0]);
    setSelectedCategory(null);
  };

  // Filter recent assignments list for the history log table (reversed to show latest first)
  const recentAssignmentsLogs = [...activity]
    .reverse()
    .filter(act => act.activity === "Assign Asset")
    .filter(act => {
      if (!act.dateTime) return true;
      try {
        const logDate = new Date(act.dateTime);
        if (isNaN(logDate.getTime())) return true;

        if (filterStartDate) {
          const [yr, mo, dy] = filterStartDate.split('-').map(Number);
          const start = new Date(yr, mo - 1, dy, 0, 0, 0, 0);
          if (logDate < start) return false;
        }

        if (filterEndDate) {
          const [yr, mo, dy] = filterEndDate.split('-').map(Number);
          const end = new Date(yr, mo - 1, dy, 23, 59, 59, 999);
          if (logDate > end) return false;
        }
      } catch (e) {
        console.error("Error parsing date:", e);
      }
      return true;
    });

  const formatDateWithYear = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split(',').map(s => s.trim());
    if (/\b\d{4}\b/.test(parts[0])) {
      return parts[0];
    }
    if (parts.length >= 2 && /\b\d{4}\b/.test(parts[1])) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return parts[0];
  };

  const handleExportCSV = () => {
    if (recentAssignmentsLogs.length === 0) {
      showToast("No data available to export.", "warning");
      return;
    }

    const headers = ["Employee Name", "Employee ID", "Asset", "Assigned By", "Assignment Date", "Details"];
    const rows = recentAssignmentsLogs.map(log => {
      const empIdMatch = log.details.match(/\(([^)]+)\)$/) || log.details.match(/\(([^)]+)\)/);
      const empId = empIdMatch ? empIdMatch[1] : '';
      const emp = employees.find(e => e.id === empId);

      const nameMatch = log.details.match(/to\s+([^(]+)/);
      const extractedName = nameMatch ? nameMatch[1].trim() : 'Employee';
      const displayName = emp ? emp.name : extractedName;

      const assetIdMatch = log.details.match(/asset\s+(\S+)/i);
      const assetId = assetIdMatch ? assetIdMatch[1] : '';
      const assetObj = assets.find(a => a.id === assetId);
      const assetLabel = assetObj ? `${assetObj.brand} ${assetObj.model} (${assetId})` : (assetId || 'Asset');

      const dateStr = formatDateWithYear(log.dateTime);
      const cleanDetails = log.details.replace(/"/g, '""');

      return [
        displayName,
        empId || 'EMP002',
        assetLabel,
        `${log.user} (Admin)`,
        dateStr,
        cleanDetails
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Recent_Assignments_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Successfully exported assignments to CSV!");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="text-xs font-semibold text-slate-400">
        <span className="hover:text-slate-600 cursor-pointer">Dashboard</span>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-600 font-bold">Assign Assets</span>
      </div>

      {/* Main Form Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Select Employee & Select Assets */}
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
                      onFocus={() => {
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

            {/* Employee Info Box (Blue) */}
            {currentEmp && (
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-3 text-xs">
                <Avatar name={currentEmp.name} avatar={currentEmp.avatar} className="h-14 w-14 rounded-xl border border-blue-200" textSize="text-lg" />
                <div className="space-y-1 text-blue-900 min-w-0">
                  <p className="font-extrabold">{currentEmp.name}</p>
                  <p className="text-[10px] font-semibold text-blue-700">{currentEmp.designation} &bull; {currentEmp.department}</p>
                  <p className="text-[10px] text-blue-800 truncate">Email: {currentEmp.email}</p>
                  <p className="text-[10px] text-blue-800">Phone: {currentEmp.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Select Assets card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-500">2</span>
              <span>Select Assets</span>
            </h3>

            {/* Selection tabs */}
            <div className="flex border-b border-slate-100 text-xs">
              <button
                onClick={() => { setActiveTab('search'); setSelectedCategory(null); }}
                className={`pb-2.5 px-1 font-bold border-b-2 transition-all ${activeTab === 'search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                  }`}
              >
                Search Assets
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${activeTab === 'qr' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                  }`}
              >
                Scan QR / Barcode
              </button>
            </div>

            {/* Search Input bar */}
            {activeTab === 'search' ? (
              selectedCategory === null ? (
                /* Category Picker Grid */
                (() => {
                  const getCategoryIcon = (catName) => {
                    const name = catName.toLowerCase();
                    if (name.includes('laptop')) return Laptop;
                    if (name.includes('monitor')) return Monitor;
                    if (name.includes('mouse')) return Mouse;
                    if (name.includes('keyboard')) return Keyboard;
                    if (name.includes('headphones') || name.includes('headset') || name.includes('audio')) return Headphones;
                    if (name.includes('printer')) return Printer;
                    if (name.includes('cpu') || name.includes('scanner')) return Cpu;
                    return Link2;
                  };

                  const groupedCategories = (categories || []).reduce((acc, cat) => {
                    const groupName = cat.ownerEntity || 'Quadrant IT Services Asset';
                    if (!acc[groupName]) acc[groupName] = [];
                    acc[groupName].push(cat);
                    return acc;
                  }, {});

                  return (
                    <div className="space-y-6 max-h-72 overflow-y-auto pr-1">
                      {Object.entries(groupedCategories).map(([groupName, cats]) => (
                        <div key={groupName} className="space-y-2">
                          <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                            {groupName}s
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {cats.map((cat) => {
                              const IconComponent = getCategoryIcon(cat.name);
                              const availableCount = assets.filter(
                                a => a.status === 'Available' && a.type.toLowerCase().trim() === cat.name.toLowerCase().trim() && !selectedAssetIds.includes(a.id)
                              ).length;

                              return (
                                <div
                                  key={cat.id}
                                  onClick={() => setSelectedCategory(cat.name)}
                                  className="p-3 border border-slate-100 hover:border-blue-500 rounded-2xl flex items-center gap-3 cursor-pointer hover:shadow-md hover:shadow-blue-500/5 transition-all group bg-slate-50/50 hover:bg-white"
                                >
                                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-all truncate">{cat.name}</h4>
                                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{availableCount} Available</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                /* Category View List */
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:text-blue-800 transition-all uppercase tracking-wider bg-blue-50/50 py-1.5 px-3 rounded-lg border border-blue-100"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Categories</span>
                  </button>

                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-50">
                    <span>Available {selectedCategory}s</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-extrabold">
                      {assets.filter(a => a.status === 'Available' && a.type.toLowerCase().trim() === selectedCategory.toLowerCase().trim() && !selectedAssetIds.includes(a.id)).length} items
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={`Search ${selectedCategory}s...`}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                      <Filter className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Available Assets grid table for selected category */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
                    {assets.filter(asset => {
                      const isAvailable = asset.status === 'Available';
                      const isNotBasket = !selectedAssetIds.includes(asset.id);
                      const isSameType = asset.type.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
                      const searchString = `${asset.id} ${asset.brand} ${asset.model} ${asset.serialNumber}`.toLowerCase();
                      const matchesSearch = searchString.includes(searchTerm.toLowerCase());
                      return isAvailable && isNotBasket && isSameType && matchesSearch;
                    }).length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">
                        No available {selectedCategory}s matching query.
                      </p>
                    ) : (
                      assets.filter(asset => {
                        const isAvailable = asset.status === 'Available';
                        const isNotBasket = !selectedAssetIds.includes(asset.id);
                        const isSelectedCat = asset.type.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
                        const searchString = `${asset.id} ${asset.brand} ${asset.model} ${asset.serialNumber}`.toLowerCase();
                        const matchesSearch = searchString.includes(searchTerm.toLowerCase());
                        return isAvailable && isNotBasket && isSelectedCat && matchesSearch;
                      }).map((asset) => (
                        <div key={asset.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/40 rounded-xl px-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              onChange={() => handleAddAsset(asset.id)}
                              checked={false}
                              className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 shrink-0"
                            />
                            <AssetIconBadge type={asset.type} className="h-7 w-7 rounded-lg shrink-0" iconSize="h-3.5 w-3.5" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800">{asset.id} &bull; {asset.brand} {asset.model}</p>
                              <p className="text-[10px] text-slate-400 truncate">{asset.type} &bull; SN: {asset.serialNumber}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddAsset(asset.id)}
                            className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Scan Simulation Ready</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Use the "Scan QR / Barcode" button in the sidebar to scan mock codes.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Assets Basket & Assignment details */}
        <div className="space-y-8">
          {/* 3. Selected Assets Basket */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-500">3</span>
                <span>Selected Assets ({selectedAssetIds.length})</span>
              </span>
              {selectedAssetIds.length > 0 && (
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>{selectedAssetIds.length} assets selected</span>
                </span>
              )}
            </h3>

            {/* Selected Assets List table */}
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-100">
              {basketAssets.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No assets selected yet. Pick items from the selection panel.
                </p>
              ) : (
                basketAssets.map((asset) => (
                  <div key={asset.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <AssetIconBadge type={asset.type} className="h-8 w-8 rounded-lg shrink-0" iconSize="h-4 w-4" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">{asset.id} &bull; {asset.brand} {asset.model}</p>
                        <p className="text-[10px] text-slate-400 truncate">{asset.type} &bull; SN: {asset.serialNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. Assignment details form card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-500">4</span>
              <span>Assignment Details</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment Date *</label>
                  <input
                    type="date"
                    required
                    value={assignDate}
                    onChange={e => setAssignDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned By</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.name || "Admin"}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-500 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks (Optional)</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Enter remarks..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center gap-1.5"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Assign Assets</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AssignAsset;
