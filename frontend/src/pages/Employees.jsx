import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  FolderKey,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Upload,
  FileSpreadsheet,
  Download,
  X,
  PlusCircle,
  Briefcase,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Tag,
  User,
  Laptop,
  ShieldCheck,
  Building,
  Copy
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import MetricCard from '../components/MetricCard';
import Avatar from '../components/Avatar';
import ExcelImportModal from '../components/ExcelImportModal';
import AssetIconBadge from '../components/AssetIcon';
import AdminPasswordModal from '../components/AdminPasswordModal';

const Employees = () => {
  const [searchParams] = useSearchParams();
  const {
    employees,
    assets,
    departments,
    addDepartment,
    deleteDepartment,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    bulkDeleteEmployees,
    bulkImportEmployees,
    showToast
  } = useAssetManager();

  const [passAuthModal, setPassAuthModal] = useState({ isOpen: false, title: '', actionLabel: '', onSuccess: null });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Search, Pagination, Filter state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [searchParams]);
  const [deleteConfirmEmp, setDeleteConfirmEmp] = useState(null);
  const [deptFilter, setDeptFilter] = useState('All');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Inactive'
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target)) {
        setIsDeptDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const itemsPerPage = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [employeePopup, setEmployeePopup] = useState({ isOpen: false, type: 'Active' });
  const [popupSearchTerm, setPopupSearchTerm] = useState('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('IT');
  const [customDept, setCustomDept] = useState('');
  const [formDesig, setFormDesig] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formRole, setFormRole] = useState('Employee');
  const [formLocation, setFormLocation] = useState('');

  const standardDepartments = ["IT", "HR", "Marketing", "Sales", "Finance"];

  // Statistics calculation
  const totalEmployeesCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const inactiveCount = employees.filter(e => e.status === 'Inactive').length;

  // Find unique departments list dynamically from backend departments + employees list
  const uniqueDepts = Array.from(new Set([
    ...standardDepartments,
    ...(departments || []),
    ...employees.map(e => e.department).filter(Boolean)
  ]));
  const departmentsList = ['All', ...uniqueDepts];
  const departmentsCount = uniqueDepts.length;

  const handleAddNewDepartment = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newDeptInput.trim();
    if (!trimmed) {
      showToast('Please enter a department name', 'error');
      return;
    }
    setIsAddingDept(true);
    try {
      await addDepartment(trimmed);
      setNewDeptInput('');
    } catch (err) {
      console.error("Error adding department:", err);
    } finally {
      setIsAddingDept(false);
    }
  };

  const [deptToDelete, setDeptToDelete] = useState(null);

  const handleDeleteDepartment = (e, deptName) => {
    e.stopPropagation();
    setDeptToDelete(deptName);
  };

  const confirmDeleteDepartment = async () => {
    if (!deptToDelete) return;
    const target = deptToDelete;
    setDeptToDelete(null);
    await deleteDepartment(target);
    if (deptFilter.toLowerCase() === target.toLowerCase()) {
      setDeptFilter('All');
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const assigned = (emp.status || '').toLowerCase() === 'inactive' ? [] : assets.filter(a => a.assignedTo === emp.id);
    const searchString = `${emp.id} ${emp.name} ${emp.department} ${emp.designation} ${emp.email} ${emp.phone} ${emp.status} ${assigned.length} assets`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All'
      ? true
      : (emp.department || '').trim().toLowerCase() === deptFilter.trim().toLowerCase();
    const matchesStatus = statusFilter === 'All'
      ? true
      : (emp.status || '').trim().toLowerCase() === statusFilter.trim().toLowerCase();
    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Form handlers
  const handleOpenAddModal = () => {
    setFormId('');
    setFormName('');
    setFormDept('IT');
    setCustomDept('');
    setFormDesig('');
    setFormEmail('');
    setFormPhone('');
    setFormLocation('');
    setFormStatus('Active');
    setFormRole('Employee');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const targetId = formId.trim().toUpperCase();

    // Validation: Check email domain constraint
    const trimmedEmail = (formEmail || '').trim().toLowerCase();
    if (!trimmedEmail.endsWith('@quadrantitservices.com')) {
      showToast('Email address must end with @quadrantitservices.com', 'error');
      return;
    }

    // Validation: Check if employee ID already exists
    if (targetId) {
      const idExists = employees.some(emp => emp.id.toLowerCase() === targetId.toLowerCase());
      if (idExists) {
        showToast(`Employee ID "${targetId}" already exists!`, 'error');
        return;
      }
    }

    const finalDept = formDept === 'Other' ? (customDept.trim() || 'Other') : formDept;
    try {
      await addEmployee({
        id: targetId || undefined,
        name: formName,
        department: finalDept,
        designation: formDesig,
        email: formEmail,
        phone: formPhone,
        location: formLocation.trim() || undefined,
        status: formStatus,
        role: formRole
      });
      showToast('Employee added successfully', 'success');
      setIsAddModalOpen(false);
    } catch (err) {
      // Toast handled by addEmployee
    }
  };

  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormName(emp.name);
    const empDept = emp.department || '';
    const isKnownDept = uniqueDepts.some(d => d.toLowerCase() === empDept.toLowerCase());
    const matchedDept = isKnownDept ? (uniqueDepts.find(d => d.toLowerCase() === empDept.toLowerCase()) || empDept) : 'Other';
    setFormDept(isKnownDept ? matchedDept : 'Other');
    setCustomDept(isKnownDept ? '' : empDept);
    setFormDesig(emp.designation);
    setFormEmail(emp.email);
    setFormPhone(emp.phone);
    setFormLocation(emp.location || '');
    setFormStatus(emp.status);
    setFormRole(emp.role || 'Employee');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const trimmedEmail = (formEmail || '').trim().toLowerCase();
    if (trimmedEmail && !trimmedEmail.endsWith('@quadrantitservices.com')) {
      showToast('Email address must end with @quadrantitservices.com', 'error');
      return;
    }

    const finalDept = formDept === 'Other' ? (customDept.trim() || 'Other') : formDept;
    updateEmployee({
      ...selectedEmployee,
      name: formName,
      department: finalDept,
      designation: formDesig,
      email: formEmail,
      phone: formPhone,
      location: formLocation.trim() || undefined,
      status: formStatus,
      role: formRole
    });
    setIsEditModalOpen(false);
  };

  const handleOpenViewModal = (emp) => {
    setSelectedEmployee(emp);
    setCopiedEmail(false);
    setIsViewModalOpen(true);
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email)
        .then(() => {
          setCopiedEmail(true);
          showToast('Email copied to clipboard', 'success');
          setTimeout(() => setCopiedEmail(false), 2000);
        })
        .catch(() => {
          fallbackCopyText(email);
        });
    } else {
      fallbackCopyText(email);
    }
  };

  const fallbackCopyText = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedEmail(true);
      showToast('Email copied to clipboard', 'success');
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      showToast('Failed to copy email', 'error');
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmEmp) return;
    const targetEmp = deleteConfirmEmp;
    setDeleteConfirmEmp(null);

    setPassAuthModal({
      isOpen: true,
      title: "Confirm Delete Employee",
      actionLabel: `Delete Employee (${targetEmp.name})`,
      onSuccess: async () => {
        setPassAuthModal({ isOpen: false, title: '', actionLabel: '', onSuccess: null });
        try {
          await deleteEmployee(targetEmp.id);
        } catch (err) {
          console.error("Delete employee failed:", err);
        }
      }
    });
  };

  // Multi-select helpers
  const isAllSelected = filteredEmployees.length > 0 && filteredEmployees.every(e => selectedIds.includes(e.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(e => e.id));
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
      title: "Confirm Bulk Delete Employees",
      actionLabel: `Delete ${idsToDelete.length} Employee(s)`,
      onSuccess: async () => {
        setPassAuthModal({ isOpen: false, title: '', actionLabel: '', onSuccess: null });
        setSelectedIds([]);
        try {
          await bulkDeleteEmployees(idsToDelete);
        } catch (e) {
          console.error("Bulk delete failed:", e);
        }
      }
    });
  };

  // Employee Database Fields Schema for Dynamic Excel Mapping
  const employeeImportFields = [
    {
      key: 'id',
      label: 'Employee ID',
      required: true,
      description: 'Unique employee ID code (e.g. QEMP001, EMP102)',
      aliases: ['employee id', 'emp id', 'employee no', 'emp no', 'employee_id', 'empid', 'id', 'staff id', 'staff number', 'worker id', 'badge id'],
      transform: (val) => String(val || '').trim().toUpperCase(),
      validate: (val) => (!val || !String(val).trim() ? 'Employee ID is required' : null)
    },
    {
      key: 'name',
      label: 'Full Name',
      required: true,
      description: 'Employee full name (e.g. John Doe, Rakesh Kore)',
      aliases: ['name', 'full name', 'employee name', 'worker name', 'staff name', 'first name', 'fullname'],
      transform: (val) => String(val || '').trim(),
      validate: (val) => (!val || !String(val).trim() ? 'Full Name is required' : null)
    },
    {
      key: 'email',
      label: 'Email Address',
      required: true,
      description: 'Corporate email address (e.g. user@company.com)',
      aliases: ['email', 'email address', 'mail', 'mail id', 'user email', 'work email', 'corporate email', 'emailid'],
      transform: (val) => String(val || '').trim().toLowerCase(),
      validate: (val) => {
        if (!val || !String(val).trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim())) return 'Invalid email format';
        return null;
      }
    },
    {
      key: 'department',
      label: 'Department',
      required: false,
      defaultValue: 'IT Operations',
      description: 'Department / business division',
      aliases: ['department', 'division', 'dept', 'business unit', 'team', 'group', 'org unit'],
      transform: (val) => String(val || '').trim() || 'IT Operations'
    },
    {
      key: 'designation',
      label: 'Designation / Role',
      required: false,
      defaultValue: 'Specialist',
      description: 'Job role or operational title',
      aliases: ['designation', 'role', 'job title', 'position', 'title', 'job designation'],
      transform: (val) => String(val || '').trim() || 'Specialist'
    },
    {
      key: 'phone',
      label: 'Phone Number',
      required: false,
      defaultValue: '+91 98765 43210',
      description: 'Mobile contact telephone number',
      aliases: ['phone', 'phone number', 'mobile', 'mobile number', 'contact', 'contact number', 'telephone', 'cell'],
      transform: (val) => String(val || '').trim() || '+91 98765 43210'
    },
    {
      key: 'status',
      label: 'Status',
      required: false,
      defaultValue: 'Active',
      description: 'Employment status (Active or Inactive)',
      aliases: ['status', 'employment status', 'state', 'condition'],
      transform: (val) => String(val || '').trim() || 'Active'
    },
    {
      key: 'location',
      label: 'Office Location',
      required: false,
      defaultValue: 'Hyderabad, India',
      description: 'Office branch location or city',
      aliases: ['location', 'office location', 'city', 'branch', 'work location', 'site'],
      transform: (val) => String(val || '').trim() || 'Hyderabad, India'
    }
  ];

  // Excel Bulk Import Handler for Employees (Supports pre-mapped converted payloads)
  const handleImportEmployees = async (convertedOrRawRows) => {
    const failedRows = [];
    const localEmails = new Set((employees || []).map(e => (e.email || '').toLowerCase().trim()));
    const localIds = new Set((employees || []).map(e => (e.id || '').toUpperCase().trim()));

    const validPayloads = [];

    for (let idx = 0; idx < convertedOrRawRows.length; idx++) {
      const row = convertedOrRawRows[idx];
      const rowId = row.id || row['Employee ID'] || row['Employee Id'] || row['EmployeeID'] || row.EmployeeId || row.ID || row.id || row['Emp ID'] || '';
      const name = row.name || row.Name || row['Employee Name'] || row['Employee name'] || '';
      const email = row.email || row.Email || row['Email Address'] || row['Mail'] || '';
      const department = row.department || row.Department || 'IT Operations';
      const designation = row.designation || row.Designation || 'Specialist';
      const phone = row.phone || row.Phone || row['Phone Number'] || row.Mobile || '+91 98765 43210';
      const status = row.status || row.Status || 'Active';
      const location = row.location || row.Location || 'Hyderabad, India';

      if (!rowId || !String(rowId).trim()) {
        failedRows.push({ row: idx + 2, reason: 'Missing Employee ID' });
        continue;
      }

      const cleanId = String(rowId).trim().toUpperCase();

      // Check duplicate Employee ID against existing list
      if (localIds.has(cleanId)) {
        failedRows.push({ row: idx + 2, reason: `Employee ID "${cleanId}" already exists.` });
        continue;
      }

      const cleanName = String(name || '').trim();
      if (!cleanName) {
        failedRows.push({ row: idx + 2, reason: `Missing Employee Name for ID "${cleanId}"` });
        continue;
      }

      const cleanEmail = email ? String(email).trim().toLowerCase() : `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${cleanId.toLowerCase()}@company.com`;

      // Check duplicate email against existing list
      if (localEmails.has(cleanEmail)) {
        failedRows.push({ row: idx + 2, reason: `Email "${cleanEmail}" is already in use.` });
        continue;
      }

      localIds.add(cleanId);
      localEmails.add(cleanEmail);

      validPayloads.push({
        id: cleanId,
        name: cleanName,
        email: cleanEmail,
        department: String(department).trim() || 'IT Operations',
        designation: String(designation).trim() || 'Specialist',
        phone: String(phone).trim() || '+91 98765 43210',
        status: String(status).trim() || 'Active',
        location: String(location).trim() || 'Hyderabad, India'
      });
    }

    let successCount = 0;
    if (validPayloads.length > 0) {
      try {
        const result = await bulkImportEmployees(validPayloads);
        successCount = result.successCount || 0;
        if (result.failedRows && result.failedRows.length > 0) {
          failedRows.push(...result.failedRows);
        }
      } catch (err) {
        failedRows.push({ row: 0, reason: err.message || "Bulk import request failed" });
      }
    }

    if (successCount > 0) {
      showToast(`Successfully imported ${successCount} employees from Excel!`);
    }

    return {
      totalRows: convertedOrRawRows.length,
      successCount,
      failedRows
    };
  };

  const handleExportEmployees = () => {
    const headers = "Employee ID,Name,Department,Designation,Email,Phone,Status\n";
    const rows = employees.map(emp => {
      return `"${emp.id}","${emp.name}","${emp.department}","${emp.designation}","${emp.email}","${emp.phone}","${emp.status}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Employees_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Employees list exported successfully');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer">Dashboard</span>
          <span className="mx-2">&gt;</span>
          <span className="text-slate-600 font-bold">Employees</span>
        </div>
      </div>

      {/* Metric Cards as Interactive Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          title="Total Employees"
          value={totalEmployeesCount}
          color="blue"
          onClick={() => {
            setStatusFilter('All');
            setDeptFilter('All');
            setSearchTerm('');
            setCurrentPage(1);
          }}
          isActive={statusFilter === 'All' && deptFilter === 'All' && !searchTerm}
        />
        <MetricCard
          icon={UserCheck}
          title="Active Employees"
          value={activeCount}
          color="green"
          onClick={() => {
            setStatusFilter('Active');
            setDeptFilter('All');
            setSearchTerm('');
            setCurrentPage(1);
          }}
          isActive={statusFilter === 'Active' && deptFilter === 'All'}
        />
        <MetricCard
          icon={UserX}
          title="Inactive Employees"
          value={inactiveCount}
          color="orange"
          onClick={() => {
            setStatusFilter('Inactive');
            setDeptFilter('All');
            setSearchTerm('');
            setCurrentPage(1);
          }}
          isActive={statusFilter === 'Inactive' && deptFilter === 'All'}
        />
        <MetricCard
          icon={FolderKey}
          title="Departments"
          value={departmentsCount}
          color="purple"
          onClick={() => {
            setIsDeptModalOpen(true);
          }}
          isActive={deptFilter !== 'All' || isDeptModalOpen}
        />
      </div>

      {/* Employees Main Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-bold text-slate-800">Employee List</h3>
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 whitespace-nowrap shrink-0 inline-flex items-center">
              {filteredEmployees.length} Total
            </span>
            {(statusFilter !== 'All' || deptFilter !== 'All' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setDeptFilter('All');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200 cursor-pointer inline-flex items-center gap-1 transition-all"
                title="Click to reset filters and view all employees"
              >
                <span>Filter: {statusFilter !== 'All' ? statusFilter : ''} {deptFilter !== 'All' ? deptFilter : ''} {searchTerm ? `"${searchTerm}"` : ''}</span>
                <X className="h-3 w-3 text-amber-600" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64 min-w-[200px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search employees..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Custom Department Filter Dropdown */}
            <div className="relative" ref={deptDropdownRef}>
              <button
                type="button"
                onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                className="flex items-center justify-between gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold cursor-pointer transition-all min-w-[130px]"
              >
                <span>{deptFilter === 'All' ? 'All Departments' : deptFilter}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDeptDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1 z-30 animate-scale-in text-xs font-semibold text-slate-700">
                  {departmentsList.map(dept => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => {
                        setDeptFilter(dept);
                        setCurrentPage(1);
                        setIsDeptDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${deptFilter === dept ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                        }`}
                    >
                      <span>{dept === 'All' ? 'All Departments' : dept}</span>
                      {deptFilter === dept && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Status Filter Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center justify-between gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold cursor-pointer transition-all min-w-[130px]"
              >
                <span>{statusFilter === 'All' ? 'All Statuses' : statusFilter === 'Active' ? 'Active Only' : 'Inactive Only'}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1 z-30 animate-scale-in text-xs font-semibold text-slate-700">
                  {['All', 'Active', 'Inactive'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setCurrentPage(1);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${statusFilter === status ? 'bg-blue-50/50 text-blue-600 font-bold' : ''
                        }`}
                    >
                      <span>{status === 'All' ? 'All Statuses' : status === 'Active' ? 'Active Only' : 'Inactive Only'}</span>
                      {statusFilter === status && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Excel Import Trigger */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="h-8 w-8 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
              >
                <Download className="h-4 w-4 text-emerald-600" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold z-30 shadow-md">
                Import Employees
              </div>
            </div>

            {/* Excel Export Trigger */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleExportEmployees}
                className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
              >
                <Upload className="h-4 w-4 text-slate-600" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold z-30 shadow-md">
                Export Employees
              </div>
            </div>

            {/* Add Employee Trigger */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/10 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold z-30 shadow-md">
                Add Employee
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar (Appears when items selected) */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-red-800 text-xs">{selectedIds.length} employee(s) selected</span>
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

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-2">Employee ID</th>
                <th className="pb-3 px-3">Name</th>
                <th className="pb-3 px-3">Department</th>
                <th className="pb-3 px-3">Designation</th>
                <th className="pb-3 px-3">Email</th>
                <th className="pb-3 px-3">Phone</th>
                <th className="pb-3 px-3 text-center">Assets</th>
                <th className="pb-3 px-3 text-center">Status</th>
                <th className="pb-3 pl-3 text-right">Actions</th>
                {/* Select All Checkbox */}
                <th className="pb-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700 bg-white">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No matching employees found.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => {
                  const assignedAssets = emp.status === 'Inactive' ? [] : assets.filter(a => a.assignedTo === emp.id);
                  const isSelected = selectedIds.includes(emp.id);
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => handleOpenViewModal(emp)}
                      className={`hover:bg-slate-50/50 transition-all cursor-pointer font-medium ${isSelected ? 'bg-blue-50/30' : ''
                        }`}
                    >
                      <td className="py-2.5 pr-2 font-bold text-slate-500">
                        {emp.id}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <Avatar name={emp.name} avatar={emp.avatar} className="h-7 w-7 rounded-xl ring-2 ring-slate-100 shrink-0" />
                          <span className="truncate max-w-[120px]" title={emp.name}>{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[100px]" title={emp.department}>{emp.department}</td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[120px]" title={emp.designation}>{emp.designation}</td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[140px]" title={emp.email}>{emp.email}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-semibold whitespace-nowrap">{emp.phone}</td>
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <span
                          onClick={(e) => { e.stopPropagation(); handleOpenViewModal(emp); }}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-blue-600 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-all"
                        >
                          {assignedAssets.length}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenViewModal(emp); }}
                            className="p-1 hover:bg-slate-100 rounded-lg text-blue-600 transition-all cursor-pointer"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(emp); }}
                            className="p-1 hover:bg-slate-100 rounded-lg text-blue-600 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmEmp({ id: emp.id, name: emp.name });
                            }}
                            className="p-1 hover:bg-red-50 rounded-lg text-red-500 transition-all cursor-pointer"
                            title="Delete"
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
                          onChange={(e) => handleToggleSelect(emp.id, e)}
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

        {/* Active/Inactive Employees Pop-up Modal */}
        {employeePopup.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in relative">

              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${employeePopup.type === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                    {employeePopup.type === 'Active' ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {employeePopup.type === 'Active' ? 'Active Employees' : 'Inactive Employees'}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      {employeePopup.type === 'Active'
                        ? 'Current staff members registered in the organization'
                        : 'Former employees who went out of the organization (no active assets)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64 min-w-[200px]">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by ID or Name..."
                      value={popupSearchTerm}
                      onChange={(e) => setPopupSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>
                  <button
                    onClick={() => setEmployeePopup({ isOpen: false, type: 'Active' })}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content Table */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-slate-50/50">
                  <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-100 whitespace-nowrap">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Employee ID</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Designation</th>
                        <th className="py-3 px-4">Contact Info</th>
                        {employeePopup.type === 'Active' && <th className="py-3 px-4 text-center">Assigned Assets</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees
                        .filter(emp => emp.status === employeePopup.type)
                        .filter(emp => {
                          if (!popupSearchTerm) return true;
                          const term = popupSearchTerm.toLowerCase();
                          return (
                            emp.name.toLowerCase().includes(term) ||
                            emp.id.toLowerCase().includes(term)
                          );
                        })
                        .map(emp => {
                          const assignedAssets = assets.filter(a => a.assignedTo === emp.id);
                          return (
                            <tr key={emp.id} className="hover:bg-white transition-all whitespace-nowrap">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar name={emp.name} avatar={emp.avatar} className="h-8 w-8 rounded-lg shrink-0" />
                                  <span className="font-bold text-slate-800">{emp.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-mono font-semibold">{emp.id}</td>
                              <td className="py-3 px-4 font-semibold text-slate-600">{emp.department}</td>
                              <td className="py-3 px-4 text-slate-500 font-semibold">{emp.designation}</td>
                              <td className="py-3 px-4">
                                <div className="text-[10px] space-y-0.5">
                                  <p className="text-slate-600 font-semibold">{emp.email}</p>
                                  <p className="text-slate-400 font-semibold">{emp.phone}</p>
                                </div>
                              </td>
                              {employeePopup.type === 'Active' && (
                                <td className="py-3 px-4 text-center">
                                  {assignedAssets.length > 0 ? (
                                    <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px]">
                                      {assignedAssets.length} {assignedAssets.length === 1 ? 'Asset' : 'Assets'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-semibold text-[10px]">None</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setEmployeePopup({ isOpen: false, type: 'Active' })}
                  className="py-2 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Departments Overview Modal */}
        {isDeptModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in relative">

              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <FolderKey className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Departments Overview
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Click any department to populate and filter the employee list
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDeptModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Department Grid */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Add New Department Form */}
                <form onSubmit={handleAddNewDepartment} className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <PlusCircle className="h-4 w-4 text-blue-500" />
                    </span>
                    <input
                      type="text"
                      value={newDeptInput}
                      onChange={e => setNewDeptInput(e.target.value)}
                      placeholder="Enter new department name (e.g. Operations, Legal)..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingDept}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>{isAddingDept ? 'Adding...' : 'Add Department'}</span>
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {uniqueDepts.map(dept => {
                    const deptEmpCount = employees.filter(e => (e.department || '').trim().toLowerCase() === dept.trim().toLowerCase()).length;
                    const deptActiveCount = employees.filter(e => (e.department || '').trim().toLowerCase() === dept.trim().toLowerCase() && (e.status || '').trim().toLowerCase() === 'active').length;
                    const deptInactiveCount = employees.filter(e => (e.department || '').trim().toLowerCase() === dept.trim().toLowerCase() && (e.status || '').trim().toLowerCase() === 'inactive').length;
                    const isSelected = deptFilter.trim().toLowerCase() === dept.trim().toLowerCase();

                    return (
                      <div
                        key={dept}
                        onClick={() => {
                          setDeptFilter(dept);
                          setCurrentPage(1);
                          setIsDeptModalOpen(false);
                        }}
                        className={`p-4 rounded-2xl border ${isSelected
                            ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                          } transition-all cursor-pointer flex flex-col justify-between group relative`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-extrabold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">{dept}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              {deptEmpCount} {deptEmpCount === 1 ? 'Employee' : 'Employees'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDepartment(e, dept)}
                              title={`Delete ${dept} department`}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 border border-rose-200/60 transition-all cursor-pointer shadow-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium pt-2 border-t border-slate-100/80 gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeptFilter(dept);
                                setStatusFilter('Active');
                                setCurrentPage(1);
                                setIsDeptModalOpen(false);
                              }}
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors cursor-pointer border ${isSelected && statusFilter === 'Active'
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/60'
                                }`}
                              title={`Filter Active employees in ${dept}`}
                            >
                              Active: {deptActiveCount}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeptFilter(dept);
                                setStatusFilter('Inactive');
                                setCurrentPage(1);
                                setIsDeptModalOpen(false);
                              }}
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors cursor-pointer border ${isSelected && statusFilter === 'Inactive'
                                  ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/60'
                                }`}
                              title={`Filter Inactive employees in ${dept}`}
                            >
                              Inactive: {deptInactiveCount}
                            </button>
                          </div>
                          <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs whitespace-nowrap">
                            Filter &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setDeptFilter('All');
                    setCurrentPage(1);
                    setIsDeptModalOpen(false);
                  }}
                  className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Reset Filter (Show All Departments)
                </button>
                <button
                  onClick={() => setIsDeptModalOpen(false)}
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {(() => {
                const pages = [];
                const maxVisible = 5;
                if (totalPages <= maxVisible) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  let start = Math.max(2, currentPage - 1);
                  let end = Math.min(totalPages - 1, currentPage + 1);
                  if (currentPage <= 2) {
                    end = 4;
                  } else if (currentPage >= totalPages - 1) {
                    start = totalPages - 3;
                  }
                  if (start > 2) pages.push('...');
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (end < totalPages - 1) pages.push('...');
                  pages.push(totalPages);
                }
                return pages.map((p, idx) => (
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-slate-400 font-bold">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`h-8 w-8 rounded-xl border text-xs font-bold transition-all cursor-pointer ${currentPage === p
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      {p}
                    </button>
                  )
                ));
              })()}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-40 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800">Add New Employee</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={e => setFormId(e.target.value)}
                    placeholder="e.g. EMP008"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Department *</label>
                  <select
                    value={formDept}
                    onChange={e => setFormDept(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {[...uniqueDepts, "Other"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {formDept === 'Other' && (
                    <input
                      type="text"
                      required
                      value={customDept}
                      onChange={e => setCustomDept(e.target.value)}
                      placeholder="Enter custom department name..."
                      className="w-full mt-2 p-2 border border-blue-200 bg-blue-50/30 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-blue-900 animate-fade-in"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Role *</label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={formDesig}
                    onChange={e => setFormDesig(e.target.value)}
                    placeholder="e.g. Network Engineer"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. rahul@quadrantitservices.com"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="e.g. +91 91234 56789"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Work Location *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="e.g. Hyderabad, India"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10">
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Edit Employee Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800">Edit Employee {selectedEmployee?.id}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Employee ID</label>
                  <input
                    type="text"
                    disabled
                    value={selectedEmployee?.id || ''}
                    className="w-full p-2 border border-slate-100 bg-slate-50/80 rounded-xl text-xs text-slate-400 font-semibold cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Department *</label>
                  <select
                    value={formDept}
                    onChange={e => setFormDept(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {[...uniqueDepts, "Other"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {formDept === 'Other' && (
                    <input
                      type="text"
                      required
                      value={customDept}
                      onChange={e => setCustomDept(e.target.value)}
                      placeholder="Enter custom department name..."
                      className="w-full mt-2 p-2 border border-blue-200 bg-blue-50/30 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-blue-900 animate-fade-in"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Role *</label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={formDesig}
                    onChange={e => setFormDesig(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Work Location *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="e.g. Hyderabad, India"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

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

      {/* CRUD View Employee Details Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-6 z-10 flex flex-col max-h-[90vh] animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header: Avatar, Name, Designation & Department, Badges */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-4 shrink-0 pr-8">
              <Avatar name={selectedEmployee?.name} avatar={selectedEmployee?.avatar} className="h-16 w-16 rounded-2xl border border-slate-100 shadow-xs" textSize="text-base" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight truncate">
                    {selectedEmployee?.name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${(selectedEmployee?.status || 'Active') === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                    {selectedEmployee?.status || 'Active'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                    {selectedEmployee?.role || 'Employee'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{selectedEmployee?.designation || 'Staff'} &bull; {selectedEmployee?.department || 'IT'}</span>
                </p>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
              {/* Comprehensive Employee Information Grid */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Employee Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <Tag className="h-3.5 w-3.5 text-slate-400" />
                      Employee ID
                    </span>
                    <span className="font-bold font-mono text-slate-800">{selectedEmployee?.id}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Username
                    </span>
                    <span className="font-bold text-slate-800">{selectedEmployee?.username || selectedEmployee?.email?.split('@')[0] || selectedEmployee?.id}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100 gap-2">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px] shrink-0">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      Email
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0 justify-end">
                      <span className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[190px] select-all cursor-text text-right" title={selectedEmployee?.email}>
                        {selectedEmployee?.email || 'N/A'}
                      </span>
                      {selectedEmployee?.email && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyEmail(selectedEmployee.email);
                          }}
                          className="p-1 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-blue-600 transition-all cursor-pointer shrink-0"
                          title="Copy Email"
                        >
                          {copiedEmail ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      Phone
                    </span>
                    <span className="font-bold text-slate-800">{selectedEmployee?.phone || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      Department
                    </span>
                    <span className="font-bold text-slate-800">{selectedEmployee?.department || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      Designation
                    </span>
                    <span className="font-bold text-slate-800">{selectedEmployee?.designation || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Joining Date
                    </span>
                    <span className="font-bold text-slate-800">{selectedEmployee?.joiningDate || selectedEmployee?.joining_date || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      Location
                    </span>
                    <span className="font-bold text-slate-800">{selectedEmployee?.location || 'Hyderabad, India'}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Equipment Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Laptop className="h-3.5 w-3.5" />
                    <span>Assigned Equipment</span>
                  </h4>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-extrabold border border-blue-100">
                    {assets.filter(a => a.assignedTo === selectedEmployee?.id).length} Assigned
                  </span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {assets.filter(a => a.assignedTo === selectedEmployee?.id).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-5 bg-slate-50 rounded-2xl border border-slate-100 font-medium">
                      No active assets currently assigned to this employee.
                    </p>
                  ) : (
                    assets.filter(a => a.assignedTo === selectedEmployee?.id).map(asset => (
                      <div key={asset.id} className="p-3 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50/70 transition-all bg-white shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <AssetIconBadge type={asset.type} className="h-8 w-8 rounded-xl shrink-0" iconSize="h-4 w-4" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{asset.brand} {asset.model}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-blue-600">{asset.id}</span>
                              <span>&bull;</span>
                              <span>SN: {asset.serialNumber}</span>
                              {asset.assignedDate && asset.assignedDate !== 'N/A' && (
                                <>
                                  <span>&bull;</span>
                                  <span>Assigned: {asset.assignedDate}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {asset.condition && (
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${asset.condition === 'Good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                asset.condition === 'Working' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                              {asset.condition}
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md uppercase border border-slate-200">
                            {asset.type}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-xs transition-all cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deletion */}
      {deleteConfirmEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirmEmp(null)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-6 z-10 text-center space-y-4 animate-scale-in">
            <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Delete Employee Record</h3>
              <p className="text-xs text-slate-500 mt-2">Are you sure you want to delete the employee record for {deleteConfirmEmp.name}? This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmEmp(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-500 transition-all cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsBulkDeleteOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-6 z-10 text-center space-y-4 animate-scale-in">
            <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Bulk Delete Employees</h3>
              <p className="text-xs text-slate-500 mt-2">Are you sure you want to delete <strong>{selectedIds.length}</strong> selected employees? This action cannot be undone.</p>
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

      {/* Admin Security Password Verification Modal */}
      <AdminPasswordModal
        isOpen={passAuthModal.isOpen}
        title={passAuthModal.title}
        actionLabel={passAuthModal.actionLabel}
        onClose={() => setPassAuthModal({ isOpen: false, title: '', actionLabel: '', onSuccess: null })}
        onSuccess={passAuthModal.onSuccess || (() => { })}
      />

      {/* Excel Import Modal for Employees */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Employees from Excel"
        onImportData={handleImportEmployees}
        fields={employeeImportFields}
        existingRecords={employees}
        sampleColumns={["Employee ID", "Name", "Department", "Designation", "Email", "Phone"]}
        sampleData={[
          { "Employee ID": "QEMP001", Name: "rakesh kore", Department: "IT Operations", Designation: "Senior Systems Engineer", Email: "rakesh@quadrantitservices.com", Phone: "+91 98765 11223" },
          { "Employee ID": "QEMP002", Name: "meghana kamidi", Department: "Human Resources", Designation: "HR Lead", Email: "meghana@quadrantitservices.com", Phone: "+91 98765 44556" }
        ]}
        templateFileName="Employees_Import_Template.xlsx"
      />

      {/* Delete Department Confirmation Modal */}
      {deptToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Delete Department</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to delete the <span className="font-bold text-slate-800">"{deptToDelete}"</span> department?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDepartment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Delete Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
