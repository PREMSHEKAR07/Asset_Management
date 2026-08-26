import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  Laptop, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  Trash2, 
  Plus, 
  Search, 
  Eye, 
  Pencil, 
  Trash, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Check,
  Download,
  Upload,
  FileSpreadsheet,
  X,
  TrendingUp,
  Calendar,
  History,
  Clock,
  UserCheck,
  RotateCcw,
  ShieldCheck,
  Layers,
  Activity,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import MetricCard from '../components/MetricCard';
import Avatar from '../components/Avatar';
import ExcelImportModal from '../components/ExcelImportModal';
import AssetIconBadge from '../components/AssetIcon';
import AdminPasswordModal from '../components/AdminPasswordModal';

const Assets = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const { 
    assets, 
    employees, 
    categories,
    addAsset, 
    updateAsset, 
    deleteAsset,
    bulkDeleteAssets,
    bulkImportAssets,
    getAssetHistory,
    showToast
  } = useAssetManager();

  const [assetHistoryData, setAssetHistoryData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('overview'); // 'overview' | 'timeline' | 'assignments' | 'repairs'

  const [passAuthModal, setPassAuthModal] = useState({ isOpen: false, title: '', actionLabel: '', onSuccess: null });

  // Search & Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [scopeFilter, setScopeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Assigned' | 'Available' | 'Under Repair' | 'Disposed'

  // Sync statusFilter from URL search params or location state
  useEffect(() => {
    const paramStatus = searchParams.get('status') || location.state?.statusFilter || location.state?.status;
    if (paramStatus && ['All', 'Assigned', 'Available', 'Under Repair', 'Disposed'].includes(paramStatus)) {
      setStatusFilter(paramStatus);
    }
  }, [searchParams, location.state]);

  const handleStatusSelect = (status) => {
    setStatusFilter(status);
    if (status === 'All') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('status');
      setSearchParams(newParams);
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('status', status);
      setSearchParams(newParams);
    }
  };
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showScopeGlass, setShowScopeGlass] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const typeDropdownRef = useRef(null);
  const scopeRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const formDropdownRef = useRef(null);

  // Outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (scopeRef.current && !scopeRef.current.contains(e.target)) {
        setShowScopeGlass(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setIsTypeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (formDropdownRef.current && !formDropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const categoryTypes = categories && categories.length > 0
    ? categories
    : [
        { name: 'Laptop', group: 'IT', scope: 'Employee' },
        { name: 'Monitor', group: 'IT', scope: 'Employee' },
        { name: 'Mouse', group: 'IT', scope: 'Employee' },
        { name: 'Keyboard', group: 'IT', scope: 'Employee' },
        { name: 'Headphones', group: 'IT', scope: 'Employee' },
        { name: 'Printer', group: 'IT', scope: 'Employee' },
        { name: 'Mobile Phone', group: 'IT', scope: 'Employee' },
        { name: 'Chairs', group: 'Non-IT', scope: 'Organization' },
        { name: 'Tables', group: 'Non-IT', scope: 'Organization' },
        { name: 'Whiteboards', group: 'Non-IT', scope: 'Organization' },
        { name: 'Storage Cabinets', group: 'Non-IT', scope: 'Organization' },
        { name: 'Furniture', group: 'Non-IT', scope: 'Organization' },
        { name: 'Office Supply', group: 'Non-IT', scope: 'Organization' }
      ];

  const itCategoryList = categoryTypes.filter(c => (c.group || 'IT') === 'IT');
  const nonItCategoryList = categoryTypes.filter(c => c.group === 'Non-IT');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formType, setFormType] = useState('Laptop');
  const [customType, setCustomType] = useState('');
  const [formBrand, setFormBrand] = useState('Dell');
  const [customBrand, setCustomBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formStatus, setFormStatus] = useState('Available');
  const [formAssigned, setFormAssigned] = useState('');
  const [formOwnership, setFormOwnership] = useState('Quadrant IT Services');
  const [formGroup, setFormGroup] = useState('IT');
  const [formChargerSerial, setFormChargerSerial] = useState('');
  const [formCondition, setFormCondition] = useState('Good');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formAssignedDate, setFormAssignedDate] = useState('');

  const formatDateToShort = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatDateToInput = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const day = String(parts[0]).padStart(2, '0');
      const monthIdx = months.indexOf(parts[1]);
      const year = parts[2];
      if (monthIdx !== -1) {
        const month = String(monthIdx + 1).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  };

  useEffect(() => {
    if (formType === 'Other') return;
    const matched = categoryTypes.find(c => c.name.toLowerCase() === formType.toLowerCase());
    if (matched && matched.group) {
      setFormGroup(matched.group);
    }
  }, [formType, categoryTypes]);

  // Statistics calculation
  const totalCount = assets.length;
  const assignedCount = assets.filter(a => a.status === 'Assigned').length;
  const availableCount = assets.filter(a => a.status === 'Available').length;
  const repairCount = assets.filter(a => a.status === 'Under Repair').length;
  const disposedCount = assets.filter(a => a.status === 'Disposed').length;

  // Filters setup (Dynamic Category & Asset Types)
  const assetTypes = ['All', ...new Set([
    ...categoryTypes.map(c => c.name),
    ...assets.map(a => a.type)
  ])].filter(t => t && t !== 'Desktop');

  const getCustomEntitiesFromStorage = () => {
    try {
      const saved = localStorage.getItem('qits_custom_entities');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const dynamicOwnerships = [
    "Quadrant IT Services",
    "DSV",
    "DHL",
    ...getCustomEntitiesFromStorage().map(e => {
      let cleaned = (e || '').trim();
      if (cleaned.toLowerCase().endsWith(' asset')) cleaned = cleaned.slice(0, -6).trim();
      if (cleaned.toLowerCase().endsWith(' assets')) cleaned = cleaned.slice(0, -7).trim();
      return cleaned;
    }),
    ...(categories || []).map(c => {
      if (!c.ownerEntity) return null;
      let e = c.ownerEntity.trim();
      if (e.toLowerCase().endsWith(' asset')) e = e.slice(0, -6).trim();
      if (e.toLowerCase().endsWith(' assets')) e = e.slice(0, -7).trim();
      return e;
    }),
    ...(assets || []).map(a => a.ownership)
  ].filter(Boolean);

  const ownershipOptions = Array.from(new Set(dynamicOwnerships));

  // Category ownership mapping and helpers
  const getCategoryEntity = (cat) => {
    if (cat.ownerEntity) return cat.ownerEntity;
    const lowerName = (cat.name || '').toLowerCase();
    if (lowerName.startsWith('dsv')) return 'DSV Asset';
    if (lowerName.startsWith('dhl')) return 'DHL Asset';
    return 'Quadrant IT Services Asset';
  };

  const matchOwner = (catOwnerRaw, assetOwnerRaw) => {
    if (!catOwnerRaw) return true;
    const catClean = catOwnerRaw.toLowerCase().replace(/(?:\s+assets?)$/i, '').trim();
    const assetClean = (assetOwnerRaw || 'Quadrant IT Services').toLowerCase().trim();
    if (catClean === assetClean) return true;
    if (catClean.includes('quadrant') && assetClean.includes('quadrant')) return true;
    return catClean.includes(assetClean) || assetClean.includes(catClean);
  };

  const getCategoriesForOwnership = (ownership) => {
    const matched = categoryTypes.filter(c => {
      const catOwner = getCategoryEntity(c);
      return matchOwner(catOwner, ownership);
    });
    const typeNames = matched.map(c => c.name);
    return Array.from(new Set([...typeNames, "Other"])).filter(Boolean);
  };

  const isLaptopAssetType = (type, custom = '') => {
    const target = (type === 'Other' ? custom : type) || '';
    return target.toLowerCase().includes('laptop');
  };

  const getAssetScope = (asset) => {
    const matchedCat = (categories || []).find(c => c.name.toLowerCase().trim() === asset.type.toLowerCase().trim());
    if (matchedCat && matchedCat.scope) return matchedCat.scope;
    const employeeCategories = ['laptop', 'mouse', 'keyboard', 'headphones', 'mobile', 'headset'];
    return employeeCategories.some(k => asset.type.toLowerCase().includes(k)) ? 'Employee' : 'Organization';
  };

  // Filter assets list
  const filteredAssets = assets.filter(asset => {
    if (asset.type === 'Desktop') return false; // Desktop removed completely

    const owner = employees.find(e => e.id === asset.assignedTo);
    const scope = getAssetScope(asset);
    
    // 1. Search term matching
    const searchParts = [
      asset.id,
      asset.type,
      asset.brand,
      asset.model,
      asset.serialNumber,
      asset.status,
      asset.ownership,
      asset.group,
      asset.condition,
      scope,
      owner ? `${owner.name} ${owner.email || ''}` : ''
    ].filter(Boolean).join(' ').toLowerCase();

    const matchesSearch = !searchTerm.trim() || searchParts.includes(searchTerm.trim().toLowerCase());

    // 2. Type filter matching
    const matchesType = typeFilter === 'All' 
      ? true 
      : asset.type.toLowerCase() === typeFilter.toLowerCase();

    // 3. Status filter matching
    const matchesStatus = statusFilter === 'All' 
      ? true 
      : statusFilter === 'Under Repair' 
        ? (asset.status === 'Under Repair' || asset.status === 'In Repair')
        : asset.status === statusFilter;

    // 4. Scope filter matching
    const matchesScope = scopeFilter === 'All' 
      ? true 
      : scopeFilter === 'Employee' 
        ? scope.toLowerCase() === 'employee' 
        : scopeFilter === 'Organization' 
          ? scope.toLowerCase() === 'organization' 
          : scopeFilter === 'Assigned' 
            ? asset.status === 'Assigned' 
            : scopeFilter === 'Not Assigned' 
              ? asset.status !== 'Assigned' 
              : true;

    // 5. Date range matching (checks assignedDate or purchaseDate)
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      const dateStringToUse = (asset.assignedDate && asset.assignedDate !== 'N/A') 
        ? asset.assignedDate 
        : (asset.purchaseDate && asset.purchaseDate !== 'N/A') 
          ? asset.purchaseDate 
          : null;

      if (!dateStringToUse) {
        matchesDate = false;
      } else {
        const inputDateStr = formatDateToInput(dateStringToUse);
        if (inputDateStr) {
          if (filterStartDate && inputDateStr < filterStartDate) matchesDate = false;
          if (filterEndDate && inputDateStr > filterEndDate) matchesDate = false;
        } else {
          matchesDate = false;
        }
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesScope && matchesDate;
  });

  // Multi-select helpers
  const isAllSelected = filteredAssets.length > 0 && filteredAssets.every(a => selectedIds.includes(a.id));
  
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map(a => a.id));
    }
  };

  const handleToggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (!selectedIds || selectedIds.length === 0) return;
    const idsToDelete = [...selectedIds];
    setIsBulkDeleteOpen(false);

    setPassAuthModal({
      isOpen: true,
      title: "Confirm Bulk Delete Assets",
      actionLabel: `Delete ${idsToDelete.length} Asset(s)`,
      onSuccess: async () => {
        setPassAuthModal({ isOpen: false, title: '', actionLabel: '', onSuccess: null });
        setSelectedIds([]);
        try {
          await bulkDeleteAssets(idsToDelete);
        } catch (e) {
          console.error("Bulk delete failed:", e);
        }
      }
    });
  };

  // Asset Database Fields Schema for Dynamic Excel Mapping
  const assetImportFields = [
    {
      key: 'id',
      label: 'Asset ID',
      required: true,
      description: 'Unique asset ID code (e.g. QITS0001, AST-101)',
      aliases: ['asset id', 'assetid', 'asset no', 'asset number', 'tag', 'asset tag', 'barcode', 'item id', 'id', 'asset_id', 'code', 'hardware id'],
      transform: (val) => String(val || '').trim().toUpperCase(),
      validate: (val) => (!val || !String(val).trim() ? 'Asset ID is required' : null)
    },
    {
      key: 'type',
      label: 'Asset Type / Category',
      required: false,
      defaultValue: 'Laptop',
      description: 'Hardware category (Laptop, Monitor, Mouse, Chair, etc.)',
      aliases: ['type', 'asset type', 'category', 'item type', 'device type', 'hardware type', 'asset category', 'kind'],
      transform: (val) => String(val || '').trim() || 'Laptop'
    },
    {
      key: 'brand',
      label: 'Brand / Manufacturer',
      required: false,
      defaultValue: 'Generic',
      description: 'Manufacturer name (e.g. Dell, HP, Lenovo, LG, Logitech)',
      aliases: ['brand', 'manufacturer', 'make', 'company', 'vendor', 'oem'],
      transform: (val) => String(val || '').trim() || 'Generic'
    },
    {
      key: 'model',
      label: 'Model Name / Number',
      required: false,
      defaultValue: 'Standard',
      description: 'Product model (e.g. Latitude 5440, UltraFine 27)',
      aliases: ['model', 'model name', 'model number', 'model no', 'product model', 'version'],
      transform: (val) => String(val || '').trim() || 'Standard'
    },
    {
      key: 'serialNumber',
      label: 'Serial Number',
      required: false,
      description: 'Hardware serial number or service tag',
      aliases: ['serial number', 'serialnumber', 'serial no', 'serial no.', 'serial', 'sn', 'service tag', 'tag number', 'serial_number'],
      transform: (val) => String(val || '').trim()
    },
    {
      key: 'status',
      label: 'Status',
      required: false,
      defaultValue: 'Available',
      description: 'Current status (Available, In Use, Under Maintenance)',
      aliases: ['status', 'asset status', 'state', 'condition status', 'availability'],
      transform: (val) => String(val || '').trim() || 'Available'
    },
    {
      key: 'ownership',
      label: 'Asset Ownership',
      required: false,
      defaultValue: 'Quadrant IT Services',
      description: 'Owner organization (Quadrant IT Services, DSV Asset, DHL Asset)',
      aliases: ['ownership', 'owner', 'asset ownership', 'owner entity', 'client', 'company name', 'owner_entity'],
      transform: (val) => String(val || '').trim() || 'Quadrant IT Services'
    },
    {
      key: 'condition',
      label: 'Physical Condition',
      required: false,
      defaultValue: 'Good',
      description: 'Physical condition (Good, Fair, Damaged)',
      aliases: ['condition', 'physical condition', 'quality', 'health'],
      transform: (val) => String(val || '').trim() || 'Good'
    }
  ];

  // Excel Bulk Import Handler for Assets (Supports pre-mapped converted payloads)
  const handleImportAssets = async (convertedOrRawRows) => {
    const failedRows = [];
    const localIds = new Set((assets || []).map(a => (a.id || '').toUpperCase().trim()));

    const validPayloads = [];

    for (let idx = 0; idx < convertedOrRawRows.length; idx++) {
      const row = convertedOrRawRows[idx];
      const rowId = row.id || row['Asset ID'] || row['Asset Id'] || row['AssetID'] || row.AssetId || row.ID || row.id || row.Id || row['asset_id'] || '';
      const type = row.type || row.Type || row['Asset Type'] || row['Asset type'] || 'Laptop';
      const brand = row.brand || row.Brand || 'Generic';
      const model = row.model || row.Model || 'Standard';
      const serialNumber = row.serialNumber || row.SerialNumber || row['Serial Number'] || row['Serial number'] || row.Serial || row.serial || '';
      const status = row.status || row.Status || 'Available';
      const ownership = row.ownership || row.Ownership || row['Asset Ownership'] || 'Quadrant IT Services';
      const condition = row.condition || row.Condition || 'Good';

      if (type === 'Desktop') continue;

      if (!rowId || !String(rowId).trim()) {
        failedRows.push({ row: idx + 2, reason: 'Missing Asset ID' });
        continue;
      }

      const cleanId = String(rowId).trim().toUpperCase();

      // Check duplicate Asset ID against existing list
      if (localIds.has(cleanId)) {
        failedRows.push({ row: idx + 2, reason: `Asset ID "${cleanId}" already exists.` });
        continue;
      }

      localIds.add(cleanId);

      const cleanSerial = String(serialNumber || '').trim() || `SN-${cleanId}`;

      const isNonIT = ['Chairs', 'Tables', 'Whiteboards', 'Storage Cabinets', 'Furniture', 'Office Supply'].includes(type);
      const group = isNonIT ? 'Non-IT' : 'IT';

      validPayloads.push({
        id: cleanId,
        type: String(type).trim() || 'Laptop',
        brand: String(brand).trim() || 'Generic',
        model: String(model).trim() || 'Standard',
        serialNumber: cleanSerial,
        status: status || 'Available',
        ownership: ownership || 'Quadrant IT Services',
        group: group,
        assignedTo: null,
        condition: condition || 'Good',
        chargerSerialNumber: type === 'Laptop' ? `CHG-SN-${String(85000000 + Math.floor(Math.random() * 1000000)).substring(0, 8)}` : 'N/A',
        purchaseDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        warrantyEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=80&h=80&fit=crop"
      });
    }

    let successCount = 0;
    if (validPayloads.length > 0) {
      try {
        const result = await bulkImportAssets(validPayloads);
        successCount = result.successCount || 0;
        if (result.failedRows && result.failedRows.length > 0) {
          failedRows.push(...result.failedRows);
        }
      } catch (err) {
        failedRows.push({ row: 0, reason: err.message || "Bulk import request failed" });
      }
    }

    if (successCount > 0) {
      showToast(`Successfully imported ${successCount} asset(s) from Excel!`);
    }

    return {
      totalRows: convertedOrRawRows.length,
      successCount,
      failedRows
    };
  };

  // CSV Exporter
  const handleExport = () => {
    const headers = "Asset ID,Asset Type,Brand,Model,Serial Number,Charger Serial Number,Condition,Status,Assigned To,Assigned Date,Purchase Date,Warranty End Date\n";
    const rows = filteredAssets.map(a => {
      const owner = employees.find(e => e.id === a.assignedTo);
      return `"${a.id}","${a.type}","${a.brand}","${a.model}","${a.serialNumber}","${a.chargerSerialNumber || 'N/A'}","${a.condition || 'Good'}","${a.status}","${owner ? owner.name : '-'}","${a.assignedDate || 'N/A'}","${a.purchaseDate}","${a.warrantyEndDate}"`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IT_Assets_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSuggestedId = (ownershipVal) => {
    const owner = (ownershipVal || '').trim().toLowerCase();
    let prefix = 'QITS';
    if (owner.includes('dsv')) {
      prefix = 'DSV';
    } else if (owner.includes('dhl')) {
      prefix = 'DHL';
    } else if (owner && !owner.includes('quadrant')) {
      const clean = owner.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (clean) prefix = clean;
    }
    let nextNum = assets.filter(a => a.id && a.id.toUpperCase().startsWith(prefix.toUpperCase())).length + 1;
    let newId = `${prefix}${String(nextNum).padStart(4, '0')}`;
    while (assets.some(a => a.id === newId)) {
      nextNum += 1;
      newId = `${prefix}${String(nextNum).padStart(4, '0')}`;
    }
    return newId;
  };

  // Form submit handlers
  const handleOpenAddModal = () => {
    const defaultOwnership = 'Quadrant IT Services';
    setFormId(generateSuggestedId(defaultOwnership));
    
    const availableCats = categoryTypes.filter(c => matchOwner(getCategoryEntity(c), defaultOwnership));
    const defaultType = availableCats.some(c => c.name === 'Laptop') ? 'Laptop' : (availableCats[0]?.name || 'Laptop');

    setFormType(defaultType);
    setCustomType('');
    setFormBrand('Dell');
    setCustomBrand('');
    setFormModel('');
    setFormSerial('');
    setFormStatus('Available');
    setFormAssigned('');
    setFormOwnership(defaultOwnership);
    const matched = availableCats.find(c => c.name === defaultType);
    setFormGroup(matched?.group || 'IT');
    setFormChargerSerial('');
    setFormCondition('Good');
    setFormPurchaseDate(new Date().toISOString().substring(0, 10));
    setFormAssignedDate('');
    setActiveDropdown(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const finalType = formType === 'Other' ? (customType.trim() || 'Other') : formType;
    const finalBrand = formBrand === 'Other' ? (customBrand.trim() || 'Other') : formBrand;
    
    const pDate = formPurchaseDate ? new Date(formPurchaseDate) : new Date();
    const pDateFormatted = formatDateToShort(formPurchaseDate) || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const wDate = new Date(pDate);
    wDate.setFullYear(pDate.getFullYear() + 3);
    const wDateFormatted = wDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const isLaptop = isLaptopAssetType(formType, customType);

    addAsset({
      id: formId.trim(),
      type: finalType,
      brand: finalBrand,
      model: formModel,
      serialNumber: formSerial,
      status: formStatus,
      ownership: formOwnership,
      group: formGroup,
      chargerSerialNumber: isLaptop ? (formChargerSerial.trim() || 'N/A') : 'N/A',
      condition: formCondition,
      assignedTo: formStatus === 'Assigned' && formAssigned ? formAssigned : null,
      purchaseDate: pDateFormatted,
      warrantyEndDate: wDateFormatted,
      assignedDate: formStatus === 'Assigned' 
        ? (formAssignedDate ? formatDateToShort(formAssignedDate) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
        : 'N/A'
    });
    setIsAddModalOpen(false);
    showToast('Asset added successfully');
  };

  const handleOpenEditModal = (asset, e) => {
    if (e) e.stopPropagation();
    setSelectedAsset(asset);
    
    const isStandardType = categoryTypes.some(c => c.name.toLowerCase() === asset.type.toLowerCase());
    setFormType(isStandardType ? asset.type : 'Other');
    setCustomType(isStandardType ? '' : asset.type);
    
    const standardBrands = ["Dell", "Logitech", "HP", "Apple", "Samsung", "Lenovo", "Sony", "Epson", "Herman Miller", "Steelcase", "Ikea", "Godrej", "Featherlite", "Generic"];
    const isStandardBrand = standardBrands.includes(asset.brand);
    setFormBrand(isStandardBrand ? asset.brand : 'Other');
    setCustomBrand(isStandardBrand ? '' : asset.brand);
    
    setFormModel(asset.model);
    setFormSerial(asset.serialNumber);
    setFormStatus(asset.status);
    setFormAssigned(asset.assignedTo || '');
    setFormOwnership(asset.ownership || 'Quadrant IT Services');
    setFormGroup(asset.group || 'IT');
    setFormChargerSerial(asset.chargerSerialNumber || '');
    setFormCondition(asset.condition || 'Good');
    setFormPurchaseDate(formatDateToInput(asset.purchaseDate));
    setFormAssignedDate(formatDateToInput(asset.assignedDate));
    setActiveDropdown(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const finalType = formType === 'Other' ? (customType.trim() || 'Other') : formType;
    const finalBrand = formBrand === 'Other' ? (customBrand.trim() || 'Other') : formBrand;
    
    const pDate = formPurchaseDate ? new Date(formPurchaseDate) : new Date();
    const pDateFormatted = formatDateToShort(formPurchaseDate) || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const wDate = new Date(pDate);
    wDate.setFullYear(pDate.getFullYear() + 3);
    const wDateFormatted = wDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const isLaptop = isLaptopAssetType(formType, customType);

    updateAsset({
      ...selectedAsset,
      type: finalType,
      brand: finalBrand,
      model: formModel,
      serialNumber: formSerial,
      status: formStatus,
      ownership: formOwnership,
      group: formGroup,
      chargerSerialNumber: isLaptop ? (formChargerSerial.trim() || 'N/A') : 'N/A',
      condition: formCondition,
      purchaseDate: pDateFormatted,
      warrantyEndDate: wDateFormatted,
      assignedTo: formStatus === 'Assigned' && formAssigned ? formAssigned : null,
      assignedDate: formStatus === 'Assigned' 
        ? (formAssignedDate ? formatDateToShort(formAssignedDate) : (selectedAsset.assignedDate && selectedAsset.assignedDate !== 'N/A' ? selectedAsset.assignedDate : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })))
        : 'N/A'
    });
    setIsEditModalOpen(false);
    showToast('Asset updated successfully');
  };

  const handleOpenViewModal = async (asset) => {
    setSelectedAsset(asset);
    setIsViewModalOpen(true);
    setIsLoadingHistory(true);
    setActiveHistoryTab('overview');
    try {
      const data = await getAssetHistory(asset.id);
      if (data) {
        setAssetHistoryData(data);
      } else {
        setAssetHistoryData(null);
      }
    } catch (err) {
      console.error("Error fetching asset history:", err);
      setAssetHistoryData(null);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleExportAssetHistoryCSV = (assetObj, historyObj) => {
    if (!assetObj) return;
    const timeline = historyObj?.timeline || [];
    const headers = ["Event #", "Action", "Date & Time", "Performed By", "Associated Employee", "Condition", "Remarks", "Details"];
    const rows = timeline.map((event, idx) => [
      idx + 1,
      `"${event.action || ''}"`,
      `"${event.date || ''}"`,
      `"${event.performedBy || 'System'}"`,
      `"${event.employeeName ? `${event.employeeName} (${event.employeeId || ''})` : '-'}"`,
      `"${event.condition || assetObj.condition || 'Good'}"`,
      `"${(event.remarks || '').replace(/"/g, '""')}"`,
      `"${(event.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Asset_${assetObj.id}_Complete_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported complete history for ${assetObj.id} to CSV!`);
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    const targetAssetId = deleteConfirmId;
    setDeleteConfirmId(null);

    setPassAuthModal({
      isOpen: true,
      title: "Confirm Delete Asset",
      actionLabel: `Delete Asset (${targetAssetId})`,
      onSuccess: () => {
        deleteAsset(targetAssetId);
        showToast('Asset deleted successfully');
        setPassAuthModal({ isOpen: false, title: '', actionLabel: '', onSuccess: null });
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-[11px]">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer">Dashboard</span>
          <span className="mx-2">&gt;</span>
          <span className="text-slate-600 font-bold">Assets Management</span>
        </div>
      </div>

      {/* 5 Compact Metric Cards as Interactive Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          icon={Laptop}
          title="Total Assets"
          value={totalCount}
          color="blue"
          onClick={() => handleStatusSelect('All')}
          isActive={statusFilter === 'All' && typeFilter === 'All' && scopeFilter === 'All' && !searchTerm && !filterStartDate && !filterEndDate}
        />
        <MetricCard
          icon={CheckCircle}
          title="Assigned Assets"
          value={assignedCount}
          color="green"
          onClick={() => handleStatusSelect('Assigned')}
          isActive={statusFilter === 'Assigned'}
        />
        <MetricCard
          icon={TrendingUp}
          title="Available Assets"
          value={availableCount}
          color="orange"
          onClick={() => handleStatusSelect('Available')}
          isActive={statusFilter === 'Available'}
        />
        <MetricCard
          icon={Wrench}
          title="Under Repair"
          value={repairCount}
          color="red"
          onClick={() => handleStatusSelect('Under Repair')}
          isActive={statusFilter === 'Under Repair'}
        />
        <MetricCard
          icon={Trash2}
          title="Disposed Assets"
          value={disposedCount}
          color="purple"
          onClick={() => handleStatusSelect('Disposed')}
          isActive={statusFilter === 'Disposed'}
        />
      </div>

      {/* Assets inventory panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Controls Toolbar */}
        <div className="space-y-3 border-b border-slate-100 pb-3 relative z-30">
          {/* Title Header */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
              {statusFilter !== 'All' 
                ? `${statusFilter} Assets` 
                : scopeFilter === 'Assigned' 
                  ? 'Assigned Assets' 
                  : scopeFilter === 'Not Assigned' 
                    ? 'Not Assigned Assets' 
                    : 'All Assets Inventory'}
            </h3>
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">
              {filteredAssets.length} Total
            </span>
            {(statusFilter !== 'All' || typeFilter !== 'All' || scopeFilter !== 'All' || searchTerm || filterStartDate || filterEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setTypeFilter('All');
                  setScopeFilter('All');
                  setSearchTerm('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200 cursor-pointer inline-flex items-center gap-1 transition-all"
                title="Click to reset filters and view all assets"
              >
                <span>Reset Filters</span>
                <X className="h-3 w-3 text-amber-600" />
              </button>
            )}
          </div>

          {/* Under Title: Single Horizontal Bar with Search, Dropdowns, Date Range & Circular Action Buttons */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Search */}
              <div className="relative flex-1 min-w-[140px] max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
              
              {/* Custom Status Filter Dropdown */}
              <div className="relative shrink-0" ref={statusDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                    setIsTypeDropdownOpen(false);
                    setShowScopeGlass(false);
                  }}
                  className="flex items-center justify-between gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold cursor-pointer transition-all min-w-[115px]"
                >
                  <span className="truncate">{statusFilter === 'All' ? 'All Statuses' : statusFilter}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isStatusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-44 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1 z-50 animate-scale-in text-xs font-semibold text-slate-700">
                    {['All', 'Available', 'Assigned', 'Under Repair', 'Disposed'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          handleStatusSelect(st);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${statusFilter === st ? 'bg-blue-50/50 text-blue-600 font-bold' : ''}`}
                      >
                        <span>{st === 'All' ? 'All Statuses' : st}</span>
                        {statusFilter === st && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Custom Type Filter Dropdown */}
              <div className="relative shrink-0" ref={typeDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsTypeDropdownOpen(!isTypeDropdownOpen);
                    setIsStatusDropdownOpen(false);
                    setShowScopeGlass(false);
                  }}
                  className="flex items-center justify-between gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold cursor-pointer transition-all min-w-[105px]"
                >
                  <span className="truncate">{typeFilter === 'All' ? 'All Types' : typeFilter}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTypeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-52 max-h-60 overflow-y-auto bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1 z-50 animate-scale-in text-xs font-semibold text-slate-700">
                    {assetTypes.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTypeFilter(t);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${typeFilter === t ? 'bg-blue-50/50 text-blue-600 font-bold' : ''}`}
                      >
                        <span className="truncate">{t === 'All' ? 'All Types' : t}</span>
                        {typeFilter === t && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Scope Filter Dropdown */}
              <div className="relative shrink-0" ref={scopeRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowScopeGlass(!showScopeGlass);
                    setIsStatusDropdownOpen(false);
                    setIsTypeDropdownOpen(false);
                  }}
                  className="flex items-center justify-between gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold cursor-pointer transition-all min-w-[105px]"
                >
                  <span className="truncate">{scopeFilter === 'All' ? 'All Scopes' : scopeFilter}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${showScopeGlass ? 'rotate-180' : ''}`} />
                </button>
                {showScopeGlass && (
                  <div className="absolute top-full left-0 mt-1.5 w-44 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1 z-50 animate-scale-in text-xs font-semibold text-slate-700">
                    {['All', 'Employee', 'Organization', 'Assigned', 'Not Assigned'].map(sc => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => {
                          setScopeFilter(sc);
                          setShowScopeGlass(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${scopeFilter === sc ? 'bg-blue-50/50 text-blue-600 font-bold' : ''}`}
                      >
                        <span>{sc === 'All' ? 'All Scopes' : sc}</span>
                        {scopeFilter === sc && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range Block */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  title="Start Date"
                  className="bg-transparent border-0 outline-none text-xs font-semibold text-slate-600 focus:ring-0 p-0 cursor-pointer w-[100px]"
                />
                <span className="text-xs font-bold text-slate-400 uppercase px-0.5">TO</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  title="End Date"
                  className="bg-transparent border-0 outline-none text-xs font-semibold text-slate-600 focus:ring-0 p-0 cursor-pointer w-[100px]"
                />
                {(filterStartDate || filterEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0 cursor-pointer ml-0.5"
                    title="Clear dates"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Circular Action Buttons (Import, Export, Add) */}
            <div className="flex items-center gap-2 shrink-0 pl-1">
              {/* Excel Import Trigger */}
              <div className="relative group">
                <button 
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  title="Import Assets from Excel / CSV"
                  className="h-8 w-8 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold z-30 shadow-md">
                  Import Assets
                </div>
              </div>

              {/* Excel Export Trigger */}
              <div className="relative group">
                <button 
                  type="button"
                  onClick={handleExport}
                  title="Export Assets to CSV"
                  className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Upload className="h-4 w-4 text-slate-600" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold z-30 shadow-md">
                  Export Assets
                </div>
              </div>

              {/* Add Asset Trigger */}
              <div className="relative group">
                <button 
                  type="button"
                  onClick={handleOpenAddModal}
                  title="Add New Asset"
                  className="h-8 w-8 rounded-full bg-[#1E3A8A] hover:bg-blue-900 text-white flex items-center justify-center transition-all shadow-md shadow-blue-900/10 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold z-30 shadow-md">
                  Add Asset
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar (Appears when items selected) */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-red-800 text-xs">{selectedIds.length} asset(s) selected</span>
            </div>
            <button
              type="button"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        )}

        {/* Endless 60vh Scrollable Inventory Table Container with Fixed Sticky Header */}
        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200/80 shadow-xs relative z-10">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-xs border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Asset ID</th>
                <th className="py-2.5 px-3">Asset Type / Model</th>
                <th className="py-2.5 px-3">Serial Number / Barcode</th>
                
                {/* Conditional Columns based on View */}
                {scopeFilter === 'Assigned' ? (
                  <>
                    <th className="py-2.5 px-3">Assigned To</th>
                    <th className="py-2.5 px-3">Assigned Date</th>
                  </>
                ) : scopeFilter === 'Not Assigned' ? (
                  <>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Purchase Date</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assigned To</th>
                  </>
                )}
                <th className="py-2.5 px-3 text-right pr-4">Quick Actions</th>
                {/* Select All Checkbox */}
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 bg-white">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    No matching assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const owner = employees.find(e => e.id === asset.assignedTo);
                  const isSelected = selectedIds.includes(asset.id);

                  return (
                    <tr 
                      key={asset.id} 
                      onClick={() => handleOpenViewModal(asset)}
                      className={`group hover:bg-slate-50/80 transition-all font-medium cursor-pointer ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Asset ID */}
                      <td className="py-2.5 px-3 font-extrabold text-blue-600">
                        <div className="flex items-center gap-2">
                          <AssetIconBadge type={asset.type} className="h-6 w-6 rounded-md" iconSize="h-3.5 w-3.5" />
                          <span>{asset.id}</span>
                        </div>
                      </td>

                      {/* Asset Type / Model */}
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{asset.brand} {asset.model}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{asset.type}</p>
                        </div>
                      </td>

                      {/* Serial Number */}
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{asset.serialNumber}</td>

                      {/* View Specific Columns */}
                      {scopeFilter === 'Assigned' ? (
                        <>
                          <td className="py-2.5 px-3">
                            {owner ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar name={owner.name} avatar={owner.avatar} className="h-5 w-5 rounded-full" textSize="text-[7px]" />
                                <span className="font-semibold text-slate-700 truncate">{owner.name}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[10px] font-semibold">{asset.purchaseDate || '10 May 2024'}</td>
                        </>
                      ) : scopeFilter === 'Not Assigned' ? (
                        <>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold whitespace-nowrap inline-block text-center border ${
                              asset.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/60' :
                              asset.status === 'Under Repair' ? 'bg-rose-50 text-rose-600 border-rose-100/60' :
                              'bg-slate-900 text-slate-50 border-slate-900'
                            }`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[10px]">{asset.purchaseDate}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold whitespace-nowrap inline-block text-center border ${
                              asset.status === 'Assigned' ? 'bg-blue-50 text-[#1E3A8A] border-blue-200/60' :
                              asset.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/60' :
                              asset.status === 'Under Repair' ? 'bg-rose-50 text-rose-600 border-rose-100/60' :
                              'bg-slate-900 text-slate-50 border-slate-900'
                            }`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {owner ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar name={owner.name} avatar={owner.avatar} className="h-5 w-5 rounded-full" textSize="text-[7px]" />
                                <span className="font-semibold text-slate-700 truncate">{owner.name}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Hover Actions (No heavy actions column) */}
                      <td className="py-2.5 px-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(asset)}
                            className="p-1 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="View Asset Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(asset, e)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                            title="Edit Asset"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(asset.id); }}
                            className="p-1 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            title="Delete Asset"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(asset.id, e)}
                          className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800">Add New Asset</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form ref={formDropdownRef} onSubmit={handleAddSubmit} className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                {/* Ownership Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Ownership *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'ownership' ? null : 'ownership')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formOwnership}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'ownership' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'ownership' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs font-semibold text-slate-700 max-h-48 overflow-y-auto">
                      {ownershipOptions.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormOwnership(opt);
                            setFormId(generateSuggestedId(opt));
                            
                            const availableCats = categoryTypes.filter(c => matchOwner(getCategoryEntity(c), opt));
                            const isCurrentTypeAvailable = availableCats.some(c => c.name.toLowerCase() === formType.toLowerCase());
                            if (!isCurrentTypeAvailable) {
                              if (availableCats.length > 0) {
                                const firstCat = availableCats[0];
                                setFormType(firstCat.name);
                                if (firstCat.group) setFormGroup(firstCat.group);
                              } else {
                                setFormType('Other');
                              }
                            }
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formOwnership === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt}</span>
                          {formOwnership === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Asset ID Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset ID *</label>
                  <input 
                    type="text" 
                    required 
                    value={formId} 
                    onChange={e => setFormId(e.target.value)} 
                    placeholder="e.g. QITS0266"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Asset Type Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Type *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formType === 'Other' ? 'Other (Custom Type)' : formType}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'type' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'type' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 max-h-48 overflow-y-auto text-xs font-semibold text-slate-700">
                      {getCategoriesForOwnership(formOwnership).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormType(opt);
                            const matched = categoryTypes.find(c => c.name.toLowerCase() === opt.toLowerCase());
                            if (matched && matched.group) {
                              setFormGroup(matched.group);
                            }
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formType === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt === 'Other' ? 'Other (Custom Type)' : opt}</span>
                          {formType === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {formType === 'Other' && (
                    <input 
                      type="text" 
                      required 
                      value={customType} 
                      onChange={e => setCustomType(e.target.value)} 
                      placeholder="Enter custom asset type..."
                      className="w-full mt-2 p-2 border border-blue-200 bg-blue-50/30 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-blue-900 animate-fade-in"
                    />
                  )}
                </div>

                {/* Brand Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Brand *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'brand' ? null : 'brand')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formBrand === 'Other' ? 'Other (Custom Brand)' : formBrand}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'brand' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'brand' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 max-h-48 overflow-y-auto text-xs font-semibold text-slate-700">
                      {["Dell", "Logitech", "HP", "Apple", "Samsung", "Lenovo", "Sony", "Epson", "Herman Miller", "Steelcase", "Ikea", "Godrej", "Featherlite", "Generic", "Other"].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormBrand(opt);
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formBrand === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt === 'Other' ? 'Other (Custom Brand)' : opt}</span>
                          {formBrand === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {formBrand === 'Other' && (
                    <input 
                      type="text" 
                      required 
                      value={customBrand} 
                      onChange={e => setCustomBrand(e.target.value)} 
                      placeholder="Enter custom brand name..."
                      className="w-full mt-2 p-2 border border-blue-200 bg-blue-50/30 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-blue-900 animate-fade-in"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Model Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formModel} 
                    onChange={e => setFormModel(e.target.value)} 
                    placeholder="e.g. Latitude 5440"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Serial Number / Barcode *</label>
                  <input 
                    type="text" 
                    required 
                    value={formSerial} 
                    onChange={e => setFormSerial(e.target.value)} 
                    placeholder="e.g. ABC12345"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Asset Class Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Class *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'group' ? null : 'group')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formGroup === 'IT' ? 'IT Asset' : 'Non-IT Asset'}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'group' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'group' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs font-semibold text-slate-700">
                      {[
                        { label: 'IT Asset', value: 'IT' },
                        { label: 'Non-IT Asset', value: 'Non-IT' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFormGroup(opt.value);
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formGroup === opt.value ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt.label}</span>
                          {formGroup === opt.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Charger Serial (for all types of laptops) */}
              {isLaptopAssetType(formType, customType) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Charger Serial Number *</label>
                    <input 
                      type="text" 
                      required 
                      value={formChargerSerial} 
                      onChange={e => setFormChargerSerial(e.target.value)} 
                      placeholder="e.g. CHG12345"
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Condition & Purchase Date */}
              <div className="grid grid-cols-2 gap-4">
                {/* Condition Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Condition *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'condition' ? null : 'condition')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formCondition}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'condition' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'condition' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs font-semibold text-slate-700">
                      {["Good", "Working", "Poor"].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormCondition(opt);
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formCondition === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt}</span>
                          {formCondition === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Purchase Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Purchase Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={formPurchaseDate} 
                    onChange={e => setFormPurchaseDate(e.target.value)} 
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-2 gap-4">
                {/* Initial Status Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Initial Status</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formStatus}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'status' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs font-semibold text-slate-700">
                      {["Available", "Assigned", "Under Repair", "Disposed"].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormStatus(opt);
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formStatus === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt}</span>
                          {formStatus === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assign To Employee & Date Section */}
              {formStatus === 'Assigned' && (
                <div className="grid grid-cols-2 gap-4 animate-scale-in">
                  {/* Assign to Employee Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Assign To Employee *</label>
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'assigned' ? null : 'assigned')}
                      className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                    >
                      <span>
                        {formAssigned 
                          ? `${employees.find(emp => emp.id === formAssigned)?.name || formAssigned} (${formAssigned})`
                          : 'Select Employee'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'assigned' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {activeDropdown === 'assigned' && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 max-h-48 overflow-y-auto text-xs font-semibold text-slate-700">
                        {employees.map(emp => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setFormAssigned(emp.id);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                              formAssigned === emp.id ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                            }`}
                          >
                            <span>{emp.name} ({emp.id})</span>
                            {formAssigned === emp.id && <Check className="h-3.5 w-3.5 text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Date Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Assigned Date</label>
                    <input 
                      type="date" 
                      value={formAssignedDate} 
                      onChange={e => setFormAssignedDate(e.target.value)} 
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10">
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Edit Asset Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800">Edit Asset {selectedAsset?.id}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form ref={formDropdownRef} onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Asset Type Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Type *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formType === 'Other' ? 'Other (Custom Type)' : formType}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'type' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'type' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 max-h-48 overflow-y-auto text-xs font-semibold text-slate-700">
                      {getCategoriesForOwnership(formOwnership).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormType(opt);
                            const matched = categoryTypes.find(c => c.name.toLowerCase() === opt.toLowerCase());
                            if (matched && matched.group) {
                              setFormGroup(matched.group);
                            }
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formType === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt === 'Other' ? 'Other (Custom Type)' : opt}</span>
                          {formType === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {formType === 'Other' && (
                    <input 
                      type="text" 
                      required 
                      value={customType} 
                      onChange={e => setCustomType(e.target.value)} 
                      placeholder="Enter custom asset type..."
                      className="w-full mt-2 p-2 border border-blue-200 bg-blue-50/30 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-blue-900 animate-fade-in"
                    />
                  )}
                </div>

                {/* Brand Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Brand *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'brand' ? null : 'brand')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formBrand === 'Other' ? 'Other (Custom Brand)' : formBrand}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'brand' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'brand' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 max-h-48 overflow-y-auto text-xs font-semibold text-slate-700">
                      {["Dell", "Logitech", "HP", "Apple", "Samsung", "Lenovo", "Sony", "Epson", "Herman Miller", "Steelcase", "Ikea", "Godrej", "Featherlite", "Generic", "Other"].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormBrand(opt);
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formBrand === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt === 'Other' ? 'Other (Custom Brand)' : opt}</span>
                          {formBrand === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {formBrand === 'Other' && (
                    <input 
                      type="text" 
                      required 
                      value={customBrand} 
                      onChange={e => setCustomBrand(e.target.value)} 
                      placeholder="Enter custom brand name..."
                      className="w-full mt-2 p-2 border border-blue-200 bg-blue-50/30 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-blue-900 animate-fade-in"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Model Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formModel} 
                    onChange={e => setFormModel(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Serial Number / Barcode *</label>
                  <input 
                    type="text" 
                    required 
                    value={formSerial} 
                    onChange={e => setFormSerial(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Ownership Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Ownership *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'ownership' ? null : 'ownership')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formOwnership}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'ownership' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'ownership' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs font-semibold text-slate-700 max-h-48 overflow-y-auto">
                      {ownershipOptions.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormOwnership(opt);
                            const availableCats = categoryTypes.filter(c => matchOwner(getCategoryEntity(c), opt));
                            const isCurrentTypeAvailable = availableCats.some(c => c.name.toLowerCase() === formType.toLowerCase());
                            if (!isCurrentTypeAvailable) {
                              if (availableCats.length > 0) {
                                const firstCat = availableCats[0];
                                setFormType(firstCat.name);
                                if (firstCat.group) setFormGroup(firstCat.group);
                              } else {
                                setFormType('Other');
                              }
                            }
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formOwnership === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt}</span>
                          {formOwnership === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Asset Class Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Class *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'group' ? null : 'group')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formGroup === 'IT' ? 'IT Asset' : 'Non-IT Asset'}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'group' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'group' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs font-semibold text-slate-700">
                      {[
                        { label: 'IT Asset', value: 'IT' },
                        { label: 'Non-IT Asset', value: 'Non-IT' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFormGroup(opt.value);
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formGroup === opt.value ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt.label}</span>
                          {formGroup === opt.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Charger Serial (for all types of laptops) */}
              {isLaptopAssetType(formType, customType) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Charger Serial Number *</label>
                    <input 
                      type="text" 
                      required 
                      value={formChargerSerial} 
                      onChange={e => setFormChargerSerial(e.target.value)} 
                      placeholder="e.g. CHG12345"
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Condition & Purchase Date */}
              <div className="grid grid-cols-2 gap-4">
                {/* Condition Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Condition *</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'condition' ? null : 'condition')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formCondition}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'condition' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'condition' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs font-semibold text-slate-700">
                      {["Good", "Working", "Poor"].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormCondition(opt);
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formCondition === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt}</span>
                          {formCondition === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Purchase Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Purchase Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={formPurchaseDate} 
                    onChange={e => setFormPurchaseDate(e.target.value)} 
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-2 gap-4">
                {/* Initial Status Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                    className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                  >
                    <span>{formStatus}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === 'status' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs font-semibold text-slate-700">
                      {["Available", "Assigned", "Under Repair", "Disposed"].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormStatus(opt);
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            formStatus === opt ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                          }`}
                        >
                          <span>{opt}</span>
                          {formStatus === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assign To Employee & Date Section */}
              {formStatus === 'Assigned' && (
                <div className="grid grid-cols-2 gap-4 animate-scale-in">
                  {/* Assign to Employee Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Assign To Employee *</label>
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'assigned' ? null : 'assigned')}
                      className="w-full flex items-center justify-between p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                    >
                      <span>
                        {formAssigned 
                          ? `${employees.find(emp => emp.id === formAssigned)?.name || formAssigned} (${formAssigned})`
                          : 'Select Employee'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown === 'assigned' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {activeDropdown === 'assigned' && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 max-h-48 overflow-y-auto text-xs font-semibold text-slate-700">
                        {employees.map(emp => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setFormAssigned(emp.id);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                              formAssigned === emp.id ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                            }`}
                          >
                            <span>{emp.name} ({emp.id})</span>
                            {formAssigned === emp.id && <Check className="h-3.5 w-3.5 text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Date Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Assigned Date</label>
                    <input 
                      type="date" 
                      value={formAssignedDate} 
                      onChange={e => setFormAssignedDate(e.target.value)} 
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD View Asset & Complete History Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 z-10 flex flex-col max-h-[92vh] animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <AssetIconBadge type={selectedAsset?.type} className="h-12 w-12 rounded-2xl shrink-0" iconSize="h-6 w-6" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-slate-800 text-base sm:text-lg tracking-tight">
                      {selectedAsset?.brand} {selectedAsset?.model}
                    </h3>
                    <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                      {selectedAsset?.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold flex-wrap">
                    <span>SN: <strong className="font-mono text-slate-600">{selectedAsset?.serialNumber}</strong></span>
                    <span>&bull;</span>
                    <span>Class: <strong className="text-slate-600">{selectedAsset?.group || 'IT'}</strong></span>
                    <span>&bull;</span>
                    <span>Owner: <strong className="text-slate-600">{selectedAsset?.ownership || 'Quadrant IT Services'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Export History CSV button */}
                <button
                  type="button"
                  onClick={() => handleExportAssetHistoryCSV(selectedAsset, assetHistoryData)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                  title="Download complete history as CSV"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Export History</span>
                </button>
                <button 
                  onClick={() => setIsViewModalOpen(false)} 
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Status Strip & Quick Highlights */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-3 my-3 shrink-0 flex-wrap gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  selectedAsset?.status === 'Assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  selectedAsset?.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  selectedAsset?.status === 'Under Repair' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-slate-900 text-slate-50 border-slate-900'
                }`}>
                  {selectedAsset?.status}
                </span>
                {selectedAsset?.status === 'Assigned' && (selectedAsset?.assignedTo || assetHistoryData?.currentAssignedEmployee) && (
                  <span className="text-slate-600 font-bold text-[10px]">
                    (Assigned to <strong className="text-blue-700">{assetHistoryData?.currentAssignedEmployee?.name || employees.find(e => e.id === selectedAsset.assignedTo)?.name || selectedAsset.assignedTo}</strong>)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Condition:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  (selectedAsset?.condition || 'Good') === 'Good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  (selectedAsset?.condition || 'Good') === 'Working' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {selectedAsset?.condition || 'Good'}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center border-b border-slate-200 text-xs font-bold shrink-0 mb-3 gap-2 sm:gap-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveHistoryTab('overview')}
                className={`pb-2.5 px-2 transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeHistoryTab === 'overview'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Asset Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHistoryTab('timeline')}
                className={`pb-2.5 px-2 transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeHistoryTab === 'timeline'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Complete History & Timeline</span>
                <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-black">
                  {assetHistoryData?.timeline?.length || 1}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHistoryTab('assignments')}
                className={`pb-2.5 px-2 transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeHistoryTab === 'assignments'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Assignment History</span>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full font-black">
                  {assetHistoryData?.assignments?.length || (selectedAsset?.assignedTo ? 1 : 0)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHistoryTab('repairs')}
                className={`pb-2.5 px-2 transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeHistoryTab === 'repairs'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Repairs & Tickets</span>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full font-black">
                  {assetHistoryData?.repairs?.length || 0}
                </span>
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-auto pr-1 text-[11px] space-y-4">
              {isLoadingHistory ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <p className="font-semibold text-xs text-slate-500">Loading complete asset history...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW */}
                  {activeHistoryTab === 'overview' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Specifications Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset ID</span>
                          <span className="font-extrabold text-blue-600 mt-0.5">{selectedAsset?.id}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Type</span>
                          <span className="font-bold text-slate-800 mt-0.5">{selectedAsset?.type}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand & Model</span>
                          <span className="font-bold text-slate-800 mt-0.5 truncate">{selectedAsset?.brand} {selectedAsset?.model}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serial Number</span>
                          <span className="font-mono font-bold text-slate-700 mt-0.5 truncate">{selectedAsset?.serialNumber}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Charger Serial</span>
                          <span className="font-mono font-bold text-slate-700 mt-0.5 truncate">{selectedAsset?.chargerSerialNumber || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ownership</span>
                          <span className="font-bold text-slate-800 mt-0.5">{selectedAsset?.ownership || 'Quadrant IT Services'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchase Date</span>
                          <span className="font-bold text-slate-800 mt-0.5">{selectedAsset?.purchaseDate || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warranty End Date</span>
                          <span className="font-bold text-slate-800 mt-0.5">{selectedAsset?.warrantyEndDate || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warranty Status</span>
                          <span className="mt-0.5">
                            {(() => {
                              if (!selectedAsset?.warrantyEndDate || selectedAsset?.warrantyEndDate === 'N/A') {
                                return <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold border bg-slate-100 text-slate-500 border-slate-200">N/A</span>;
                              }
                              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                              const parts = selectedAsset.warrantyEndDate.split(' ');
                              let warrantyDate = null;
                              if (parts.length === 3) {
                                const day = parseInt(parts[0]);
                                const monthIdx = months.indexOf(parts[1]);
                                const year = parseInt(parts[2]);
                                if (monthIdx !== -1 && !isNaN(day) && !isNaN(year)) {
                                  warrantyDate = new Date(year, monthIdx, day);
                                }
                              } else {
                                const parsed = new Date(selectedAsset.warrantyEndDate);
                                if (!isNaN(parsed.getTime())) warrantyDate = parsed;
                              }
                              const isWarrantyActive = warrantyDate ? warrantyDate > new Date() : true;
                              return (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                  isWarrantyActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                                }`}>
                                  {isWarrantyActive ? 'Active' : 'Expired'}
                                </span>
                              );
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Current Assignment Card if Assigned */}
                      {selectedAsset?.status === 'Assigned' && (
                        <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={assetHistoryData?.currentAssignedEmployee?.name || employees.find(e => e.id === selectedAsset.assignedTo)?.name || selectedAsset.assignedTo}
                              avatar={assetHistoryData?.currentAssignedEmployee?.avatar || employees.find(e => e.id === selectedAsset.assignedTo)?.avatar}
                              className="h-10 w-10 rounded-xl"
                              textSize="text-xs"
                            />
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs">
                                {assetHistoryData?.currentAssignedEmployee?.name || employees.find(e => e.id === selectedAsset.assignedTo)?.name || selectedAsset.assignedTo}
                              </p>
                              <p className="text-[10px] text-slate-500 font-semibold">
                                {assetHistoryData?.currentAssignedEmployee?.designation || 'Specialist'} &bull; {assetHistoryData?.currentAssignedEmployee?.department || 'IT'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                Employee ID: <strong className="text-blue-600">{selectedAsset.assignedTo}</strong> &bull; Assigned: {selectedAsset.assignedDate || '12 May 2024'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-xl shadow-xs">
                            Active Custodian
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: COMPLETE LIFECYCLE TIMELINE */}
                  {activeHistoryTab === 'timeline' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Chronological History & Lifecycle Events ({assetHistoryData?.timeline?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleExportAssetHistoryCSV(selectedAsset, assetHistoryData)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          <span>Export CSV</span>
                        </button>
                      </div>

                      {/* Visual Timeline Track */}
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {(!assetHistoryData?.timeline || assetHistoryData.timeline.length === 0) ? (
                          <div className="text-center py-8 text-slate-400">
                            No event history recorded yet for this asset.
                          </div>
                        ) : (
                          assetHistoryData.timeline.map((event, idx) => {
                            const isCreation = event.action?.toLowerCase().includes('register') || event.action?.toLowerCase().includes('purchase') || event.action?.toLowerCase().includes('created');
                            const isAssign = event.action?.toLowerCase().includes('assign');
                            const isReturn = event.action?.toLowerCase().includes('return');
                            const isRepair = event.action?.toLowerCase().includes('repair') || event.action?.toLowerCase().includes('maintenance');
                            const isUpdate = event.action?.toLowerCase().includes('update');

                            let nodeColor = 'bg-blue-600 text-white';
                            let badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                            let IconNode = Activity;

                            if (isCreation) {
                              nodeColor = 'bg-indigo-600 text-white';
                              badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                              IconNode = Sparkles;
                            } else if (isAssign) {
                              nodeColor = 'bg-emerald-600 text-white';
                              badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                              IconNode = UserCheck;
                            } else if (isReturn) {
                              nodeColor = 'bg-amber-500 text-white';
                              badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                              IconNode = RotateCcw;
                            } else if (isRepair) {
                              nodeColor = 'bg-rose-500 text-white';
                              badgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                              IconNode = Wrench;
                            } else if (isUpdate) {
                              nodeColor = 'bg-slate-600 text-white';
                              badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                              IconNode = FileText;
                            }

                            return (
                              <div key={idx} className="relative group">
                                {/* Bullet Node */}
                                <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center shadow-xs ${nodeColor}`}>
                                  <IconNode className="h-3 w-3" />
                                </div>

                                <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 transition-all shadow-2xs space-y-1.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeColor}`}>
                                        {event.action}
                                      </span>
                                      {event.employeeName && (
                                        <span className="font-bold text-slate-800">
                                          &bull; {event.employeeName} {event.employeeId ? `(${event.employeeId})` : ''}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{event.date}</span>
                                    </span>
                                  </div>

                                  {event.details && (
                                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                                      {event.details}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                    <span>Performed By: <strong className="text-slate-600">{event.performedBy || 'System Admin'}</strong></span>
                                    {event.condition && (
                                      <span>Condition: <strong className="text-slate-600">{event.condition}</strong></span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ASSIGNMENT HISTORY */}
                  {activeHistoryTab === 'assignments' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Assignment & Return Record History ({assetHistoryData?.assignments?.length || (selectedAsset?.assignedTo ? 1 : 0)})
                        </span>
                      </div>

                      {(!assetHistoryData?.assignments || assetHistoryData.assignments.length === 0) ? (
                        <div className="py-12 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-slate-100">
                          This asset has not been assigned to any employee yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-2.5 px-3">Employee</th>
                                <th className="py-2.5 px-3">Department</th>
                                <th className="py-2.5 px-3">Assigned Date</th>
                                <th className="py-2.5 px-3">Returned Date</th>
                                <th className="py-2.5 px-3">Condition</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                              {assetHistoryData.assignments.map((asg, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-slate-800">
                                    <div className="flex items-center gap-2">
                                      <Avatar name={asg.employeeName} avatar={asg.employeeAvatar || employees.find(e => e.id === asg.employeeId)?.avatar} className="h-6 w-6 rounded-full" textSize="text-[8px]" />
                                      <div>
                                        <p className="font-extrabold text-slate-800 leading-tight">{asg.employeeName}</p>
                                        <p className="text-[10px] text-blue-600 font-bold">{asg.employeeId}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 font-medium">{asg.employeeDepartment || 'IT'}</td>
                                  <td className="py-2.5 px-3 text-slate-600 font-semibold">{asg.assignedDate || '12 May 2024'}</td>
                                  <td className="py-2.5 px-3 text-slate-500 font-medium">{asg.returnedDate || 'Currently Active'}</td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      {asg.condition || 'Good'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                      asg.status === 'Active'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                      {asg.status || 'Active'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: REPAIRS & TICKETS */}
                  {activeHistoryTab === 'repairs' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Maintenance & Support Tickets ({assetHistoryData?.repairs?.length || 0})
                        </span>
                      </div>

                      {(!assetHistoryData?.repairs || assetHistoryData.repairs.length === 0) ? (
                        <div className="py-12 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-slate-100">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                          <p>No repair or maintenance tickets have been reported for this asset.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {assetHistoryData.repairs.map((rep) => (
                            <div key={rep.id} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                                    {rep.id}
                                  </span>
                                  <span className="font-extrabold text-slate-800 text-xs">{rep.issue}</span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                  rep.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  rep.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {rep.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 font-medium">{rep.description}</p>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 flex-wrap gap-2">
                                <span>Reported By: <strong className="text-slate-700">{rep.employeeName || rep.reportedBy}</strong> &bull; {rep.requestDate}</span>
                                <span>Priority: <strong className="text-slate-700">{rep.priority}</strong> &bull; Handler: <strong className="text-slate-700">{rep.assignedTo || 'IT Support Team'}</strong></span>
                              </div>

                              {rep.updates && rep.updates.length > 0 && (
                                <div className="bg-white rounded-xl p-2.5 border border-slate-100 space-y-1.5 mt-2 text-[10px]">
                                  <span className="font-bold text-slate-400 uppercase tracking-wider block">Technician Updates:</span>
                                  {rep.updates.map((u, uIdx) => (
                                    <div key={uIdx} className="flex items-start gap-2 text-slate-600">
                                      <span className="text-blue-600 font-bold shrink-0">{u.date}:</span>
                                      <span>{u.message}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-medium">
                Asset ID: <strong className="text-slate-700">{selectedAsset?.id}</strong> &bull; Last Synchronized
              </span>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/10 text-xs transition-all cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deletion */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-6 z-10 text-center space-y-4 animate-scale-in">
            <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Delete Asset</h3>
              <p className="text-xs text-slate-500 mt-2">Are you sure you want to delete asset {deleteConfirmId}? This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-3 pt-2 text-xs">
              <button 
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-500 transition-all cursor-pointer"
              >
                Go Back
              </button>
              <button 
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsBulkDeleteOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-6 z-10 text-center space-y-4 animate-scale-in">
            <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Bulk Delete Assets</h3>
              <p className="text-xs text-slate-500 mt-2">Are you sure you want to delete <strong>{selectedIds.length}</strong> selected assets? This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-3 pt-2 text-xs">
              <button 
                type="button"
                onClick={() => setIsBulkDeleteOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-500 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleBulkDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                Confirm Delete ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Assets from Excel"
        onImportData={handleImportAssets}
        fields={assetImportFields}
        existingRecords={assets}
        sampleColumns={["Asset ID", "Type", "Brand", "Model", "SerialNumber", "Status", "Ownership"]}
        sampleData={[
          { "Asset ID": "QITS0001", Type: "Laptop", Brand: "Dell", Model: "Latitude 5440", SerialNumber: "QITS-SN-9901", Status: "Available", Ownership: "Quadrant IT Services" },
          { "Asset ID": "QITS0002", Type: "Monitor", Brand: "LG", Model: "27 Inch 4K", SerialNumber: "QITS-SN-8802", Status: "Available", Ownership: "Quadrant IT Services" },
          { "Asset ID": "QITS0003", Type: "Mouse", Brand: "Logitech", Model: "MX Master 3S", SerialNumber: "QITS-SN-7703", Status: "Available", Ownership: "Quadrant IT Services" }
        ]}
        templateFileName="Assets_Import_Template.xlsx"
      />

      {/* Admin Security Password Verification Modal */}
      <AdminPasswordModal
        isOpen={passAuthModal.isOpen}
        title={passAuthModal.title}
        actionLabel={passAuthModal.actionLabel}
        onClose={() => setPassAuthModal({ isOpen: false, title: '', actionLabel: '', onSuccess: null })}
        onSuccess={passAuthModal.onSuccess || (() => {})}
      />
    </div>
  );
};

export default Assets;
