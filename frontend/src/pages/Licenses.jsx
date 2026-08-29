import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Key,
  Plus,
  Search,
  AlertTriangle,
  X,
  Calendar,
  Edit2,
  Trash2,
  RotateCcw,
  Ban,
  Users,
  Folder,
  FolderPlus,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import AdminPasswordModal from '../components/AdminPasswordModal';

const Licenses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    licenses,
    subscriptionGroups,
    employees,
    addLicense,
    updateLicense,
    renewLicense,
    cancelLicense,
    deleteLicense,
    addSubscriptionGroup,
    updateSubscriptionGroup,
    deleteSubscriptionGroup,
    triggerEmailAlert,
    showToast
  } = useAssetManager();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All | Available | Expiring Soon | Expired | Deactivated
  const [selectedGroupId, setSelectedGroupId] = useState(null); // null = overview, or group ID

  // Admin Security Password Verification Modal State
  const [passAuthModal, setPassAuthModal] = useState({
    isOpen: false,
    title: '',
    actionLabel: '',
    onSuccess: null
  });

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchTerm(q);
    }
    const statusParam = searchParams.get('status');
    if (statusParam && ['All', 'Available', 'Expiring Soon', 'Expired', 'Deactivated', 'Cancelled'].includes(statusParam)) {
      setStatusFilter(statusParam === 'Cancelled' ? 'Deactivated' : statusParam);
    }
    const groupParam = searchParams.get('group');
    if (groupParam) {
      setSelectedGroupId(groupParam);
    }
  }, [searchParams]);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status === 'All') {
      newParams.delete('status');
    } else {
      newParams.set('status', status);
    }
    setSearchParams(newParams);
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    const newParams = new URLSearchParams(searchParams);
    if (groupId) {
      newParams.set('group', groupId);
    } else {
      newParams.delete('group');
    }
    setSearchParams(newParams);
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  const [licToRenew, setLicToRenew] = useState(null);
  const [licToDeactivate, setLicToDeactivate] = useState(null);
  const [licToDelete, setLicToDelete] = useState(null);
  const [selectedLicense, setSelectedLicense] = useState(null);

  // Submitting loading states
  const [isSubmittingLicense, setIsSubmittingLicense] = useState(false);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [isSubmittingRenew, setIsSubmittingRenew] = useState(false);
  const [isSubmittingDeactivate, setIsSubmittingDeactivate] = useState(false);

  // Form states (Add / Edit License)
  const [formGroupId, setFormGroupId] = useState('');
  const [formName, setFormName] = useState('');
  const [formVendor, setFormVendor] = useState('Subscription');
  const [formCost, setFormCost] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formAlertDays, setFormAlertDays] = useState(30);
  const [formDescription, setFormDescription] = useState('');
  const [formReactivateChecked, setFormReactivateChecked] = useState(false);

  // Employee Assignment inside Form (for Group plans only)
  const [formAssignMode, setFormAssignMode] = useState('none'); // 'none' | 'select'
  const [formAssignedEmployeeIds, setFormAssignedEmployeeIds] = useState([]);
  const [modalEmployeeSearch, setModalEmployeeSearch] = useState('');

  // Form states (Create Group)
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormVendor, setGroupFormVendor] = useState('');
  const [groupFormDescription, setGroupFormDescription] = useState('');

  // Form states (Edit Group)
  const [editGroupFormName, setEditGroupFormName] = useState('');
  const [editGroupFormVendor, setEditGroupFormVendor] = useState('');
  const [editGroupFormDescription, setEditGroupFormDescription] = useState('');

  // Form states (Renew)
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewAlertDays, setRenewAlertDays] = useState(30);
  const [renewCost, setRenewCost] = useState('');

  // Form state (Deactivate)
  const [deactivateReason, setDeactivateReason] = useState('');

  // Date Parsing Helper
  const parseToInputDate = (str) => {
    if (!str) return '';
    const d = new Date(str);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  // Date Formatting Helper
  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Open Add Modal
  const handleOpenAddModal = (presetGroupId = null) => {
    const activeGid = presetGroupId || selectedGroupId || '';
    setFormGroupId(activeGid);
    if (activeGid) {
      const g = (subscriptionGroups || []).find(grp => grp.id === activeGid);
      if (g) setFormVendor(g.name || 'Subscription');
      else setFormVendor('Subscription');
    } else {
      setFormVendor('');
    }
    setFormName('');
    setFormCost('');
    setFormDescription('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    
    // Default expiry 1 year from today
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormEndDate(nextYear.toISOString().split('T')[0]);
    setFormAlertDays(30);

    // Reset employee assignment fields
    setFormAssignMode('none');
    setFormAssignedEmployeeIds([]);
    setModalEmployeeSearch('');

    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (lic) => {
    setSelectedLicense(lic);
    const gid = lic.groupId || lic.group_id || '';
    setFormGroupId(gid);
    setFormName(lic.name || '');
    setFormVendor(lic.vendor || '');
    setFormCost(lic.cost && lic.cost !== 'N/A' ? lic.cost : '');
    setFormDescription(lic.description || '');
    setFormStartDate(parseToInputDate(lic.startDate || lic.start_date));
    setFormEndDate(parseToInputDate(lic.endDate || lic.end_date));
    setFormAlertDays(lic.alertDaysBefore || lic.alert_days_before || 30);
    setFormReactivateChecked(false);

    // Populate employee assignments if this belongs to a group
    const assigned = (lic.assignedEmployees || lic.assigned_employees || []).map(a => a.employeeId || a.id);
    if (gid && assigned.length > 0) {
      setFormAssignMode('select');
      setFormAssignedEmployeeIds(assigned);
    } else {
      setFormAssignMode('none');
      setFormAssignedEmployeeIds([]);
    }
    setModalEmployeeSearch('');

    setMenuState(null);
    setIsEditModalOpen(true);
  };

  // Open Renew Modal
  const handleOpenRenewModal = (lic) => {
    setLicToRenew(lic);
    setMenuState(null);
    const oldEnd = new Date(lic.endDate || lic.end_date);
    let newStart = new Date();
    if (!isNaN(oldEnd.getTime()) && oldEnd > new Date()) {
      newStart = new Date(oldEnd);
      newStart.setDate(newStart.getDate() + 1);
    }
    
    const newEnd = new Date(newStart);
    newEnd.setFullYear(newEnd.getFullYear() + 1);

    setRenewStartDate(newStart.toISOString().split('T')[0]);
    setRenewEndDate(newEnd.toISOString().split('T')[0]);
    setRenewAlertDays(lic.alertDaysBefore || lic.alert_days_before || 30);
    setRenewCost(lic.cost && lic.cost !== 'N/A' ? lic.cost : '');
  };

  // Open Deactivate Modal
  const handleOpenDeactivateModal = (lic) => {
    setLicToDeactivate(lic);
    setMenuState(null);
    setDeactivateReason('');
  };

  // Open Create Group Modal
  const handleOpenCreateGroupModal = () => {
    setGroupFormName('');
    setGroupFormVendor('');
    setGroupFormDescription('');
    setIsCreateGroupModalOpen(true);
  };

  // Open Edit Group Modal
  const handleOpenEditGroupModal = () => {
    if (!activeGroup) return;
    setEditGroupFormName(activeGroup.name || '');
    setEditGroupFormVendor(activeGroup.vendor || '');
    setEditGroupFormDescription(activeGroup.description || '');
    setIsEditGroupModalOpen(true);
  };

  // Handle Add Form Submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formEndDate) {
      showToast('Plan/License Name and Expiry Date are required!', 'error');
      return;
    }

    const selectedGroup = (subscriptionGroups || []).find(g => g.id === formGroupId);
    const assignedIds = (formGroupId && formAssignMode === 'select') ? formAssignedEmployeeIds : [];

    setIsSubmittingLicense(true);
    try {
      await addLicense({
        name: formName.trim(),
        groupId: formGroupId || null,
        groupName: selectedGroup ? selectedGroup.name : null,
        endDate: formatDateString(formEndDate),
        startDate: formStartDate ? formatDateString(formStartDate) : formatDateString(new Date()),
        alertDaysBefore: Number(formAlertDays),
        status: "Available",
        vendor: formVendor ? formVendor.trim() : (selectedGroup ? selectedGroup.name : "Subscription"),
        cost: formCost ? String(formCost).trim() : "N/A",
        adminEmail: "qitsassetadmin@quadrantitservices.com",
        description: formDescription ? formDescription.trim() : "Software subscription.",
        assignedEmployeeIds: assignedIds
      });
      setIsAddModalOpen(false);
    } catch (err) {
      // Error handled in useAssetManager
    } finally {
      setIsSubmittingLicense(false);
    }
  };

  // Handle Edit Form Submission (includes reactivation & employee assignment)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formEndDate) {
      showToast('License Name and Expiry Date are required!', 'error');
      return;
    }

    const selectedGroup = (subscriptionGroups || []).find(g => g.id === formGroupId);
    const wasDeactivated = selectedLicense.isDeactivated;

    const updatePayload = {
      name: formName.trim(),
      groupId: formGroupId || null,
      groupName: selectedGroup ? selectedGroup.name : null,
      vendor: formVendor ? formVendor.trim() : "Subscription",
      cost: formCost ? String(formCost).trim() : "N/A",
      description: formDescription ? formDescription.trim() : "",
      startDate: formStartDate ? formatDateString(formStartDate) : selectedLicense.startDate,
      endDate: formatDateString(formEndDate),
      alertDaysBefore: Number(formAlertDays)
    };

    // Reactivation handling
    if (wasDeactivated && formReactivateChecked) {
      updatePayload.status = "Available";
    }

    // Employee Assignment handling for Group Plans
    if (formGroupId) {
      if (formAssignMode === 'select') {
        updatePayload.assignedEmployeeIds = formAssignedEmployeeIds;
      } else {
        updatePayload.assignedEmployeeIds = [];
      }
    } else {
      updatePayload.assignedEmployeeIds = [];
    }

    setIsSubmittingLicense(true);
    try {
      await updateLicense(selectedLicense.id, updatePayload);
      setIsEditModalOpen(false);
    } catch (err) {
      // Error handled in useAssetManager
    } finally {
      setIsSubmittingLicense(false);
    }
  };

  // Handle Create Group Submission
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupFormName.trim()) {
      showToast('Group Name is required!', 'error');
      return;
    }

    setIsSubmittingGroup(true);
    try {
      await addSubscriptionGroup({
        name: groupFormName.trim(),
        vendor: groupFormVendor.trim() || groupFormName.trim(),
        description: groupFormDescription.trim()
      });
      setIsCreateGroupModalOpen(false);
    } catch (err) {
      // Error handled in useAssetManager
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Handle Edit Group Submission
  const handleEditGroupSubmit = async (e) => {
    e.preventDefault();
    if (!editGroupFormName.trim()) {
      showToast('Group Name is required!', 'error');
      return;
    }

    setIsSubmittingGroup(true);
    try {
      await updateSubscriptionGroup(activeGroup.id, {
        name: editGroupFormName.trim(),
        vendor: editGroupFormVendor.trim(),
        description: editGroupFormDescription.trim()
      });
      setIsEditGroupModalOpen(false);
    } catch (err) {
      // Error handled in useAssetManager
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Handle Renew Form Submission
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewEndDate) {
      showToast('New Expiry Date is required for renewal!', 'error');
      return;
    }

    setIsSubmittingRenew(true);
    try {
      await renewLicense(licToRenew.id, {
        startDate: renewStartDate ? formatDateString(renewStartDate) : undefined,
        endDate: formatDateString(renewEndDate),
        alertDaysBefore: Number(renewAlertDays),
        cost: renewCost ? String(renewCost).trim() : undefined
      });
      setLicToRenew(null);
    } catch (err) {
      // Error handled in useAssetManager
    } finally {
      setIsSubmittingRenew(false);
    }
  };

  // Handle Deactivate Submission
  const handleDeactivateSubmit = async () => {
    if (!licToDeactivate) return;
    const id = licToDeactivate.id;
    const reason = deactivateReason.trim();
    setIsSubmittingDeactivate(true);
    try {
      await cancelLicense(id, reason || "Deactivated by administrator");
      setLicToDeactivate(null);
    } catch (err) {
      // Error handled in useAssetManager
    } finally {
      setIsSubmittingDeactivate(false);
    }
  };

  // Process and normalize Licenses
  const processedLicenses = useMemo(() => {
    return (licenses || []).map(lic => {
      const start = lic.startDate || lic.start_date ? new Date(lic.startDate || lic.start_date) : new Date();
      const end = new Date(lic.endDate || lic.end_date);
      const now = new Date();
      
      const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      const elapsedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      
      const elapsedPercent = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
      
      let calculatedStatus = "Available";
      const rawStatus = (lic.status || "").toLowerCase().trim();

      if (rawStatus === "deactivated" || rawStatus === "cancelled" || rawStatus === "inactive") {
        calculatedStatus = "Deactivated";
      } else if (remainingDays <= 0) {
        calculatedStatus = "Expired";
      } else if (remainingDays <= (lic.alertDaysBefore || lic.alert_days_before || 30)) {
        calculatedStatus = "Expiring Soon";
      }

      const assignedList = lic.assignedEmployees || lic.assigned_employees || [];
      const assignedCount = assignedList.length;

      return {
        ...lic,
        groupId: lic.groupId || lic.group_id || null,
        groupName: lic.groupName || lic.group_name || null,
        startDate: lic.startDate || lic.start_date,
        endDate: lic.endDate || lic.end_date,
        alertDaysBefore: lic.alertDaysBefore || lic.alert_days_before || 30,
        licenseKey: lic.licenseKey || lic.license_key || 'N/A',
        assignedEmployees: assignedList,
        assignedCount,
        status: calculatedStatus,
        isDeactivated: calculatedStatus === "Deactivated",
        isExpired: calculatedStatus === "Expired",
        isExpiringSoon: calculatedStatus === "Expiring Soon",
        isNormalAvailable: calculatedStatus === "Available",
        isUsableAvailable: calculatedStatus === "Available" || calculatedStatus === "Expiring Soon",
        remainingDays,
        elapsedPercent
      };
    });
  }, [licenses]);

  // Next Expiry Helper for Subscription Groups
  const getGroupNextExpiry = (plans) => {
    if (!plans || plans.length === 0) return null;
    
    // Active, non-deactivated plans with end date >= today (remainingDays >= 0)
    const upcomingPlans = plans
      .filter(p => !p.isDeactivated && p.remainingDays >= 0)
      .sort((a, b) => a.remainingDays - b.remainingDays);

    if (upcomingPlans.length === 0) return null;

    const nextPlan = upcomingPlans[0];
    const days = nextPlan.remainingDays;
    let relativeText = '';
    if (days === 0) {
      relativeText = 'Expires today';
    } else if (days === 1) {
      relativeText = 'in 1 day';
    } else {
      relativeText = `in ${days} days`;
    }

    return {
      dateStr: nextPlan.endDate,
      remainingDays: days,
      relativeText,
      isExpiringSoon: nextPlan.isExpiringSoon,
      planName: nextPlan.name
    };
  };

  // Status Counts for Tabs
  const totalCount = processedLicenses.length;
  const availableCount = processedLicenses.filter(l => l.isUsableAvailable).length;
  const expiringSoonCount = processedLicenses.filter(l => l.isExpiringSoon).length;
  const expiredCount = processedLicenses.filter(l => l.isExpired).length;
  const deactivatedCount = processedLicenses.filter(l => l.isDeactivated).length;

  // Processed Subscription Groups with Next Expiry
  const processedGroups = useMemo(() => {
    return (subscriptionGroups || []).map(group => {
      const groupPlans = processedLicenses.filter(lic => lic.groupId === group.id);
      const plansCount = groupPlans.length;
      
      const uniqueEmployeeIds = new Set();
      groupPlans.forEach(p => {
        (p.assignedEmployees || []).forEach(emp => {
          if (emp.employeeId || emp.id) {
            uniqueEmployeeIds.add(emp.employeeId || emp.id);
          }
        });
      });
      const uniqueEmployeesCount = uniqueEmployeeIds.size;

      const expiringSoonPlansCount = groupPlans.filter(p => p.isExpiringSoon).length;
      const expiredPlansCount = groupPlans.filter(p => p.isExpired).length;
      const availablePlansCount = groupPlans.filter(p => p.isUsableAvailable).length;
      const deactivatedPlansCount = groupPlans.filter(p => p.isDeactivated).length;

      const nextExpiry = getGroupNextExpiry(groupPlans);

      return {
        ...group,
        plans: groupPlans,
        plansCount,
        uniqueEmployeesCount,
        expiringSoonPlansCount,
        expiredPlansCount,
        availablePlansCount,
        deactivatedPlansCount,
        hasExpiringSoon: expiringSoonPlansCount > 0,
        hasExpired: expiredPlansCount > 0,
        nextExpiry
      };
    });
  }, [subscriptionGroups, processedLicenses]);

  // Selected Active Group Object
  const activeGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return processedGroups.find(g => g.id === selectedGroupId) || null;
  }, [selectedGroupId, processedGroups]);

  // Filter Licenses Helper
  const filterLicenseList = (licList) => {
    return licList.filter(lic => {
      const matchesSearch = (lic.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lic.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lic.groupName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'Available') {
        matchesStatus = lic.isUsableAvailable;
      } else if (statusFilter === 'Expiring Soon') {
        matchesStatus = lic.isExpiringSoon;
      } else if (statusFilter === 'Expired') {
        matchesStatus = lic.isExpired;
      } else if (statusFilter === 'Deactivated') {
        matchesStatus = lic.isDeactivated;
      } else if (statusFilter === 'All') {
        matchesStatus = true;
      }

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (statusFilter === 'Available') {
        if (a.isExpiringSoon && !b.isExpiringSoon) return -1;
        if (!a.isExpiringSoon && b.isExpiringSoon) return 1;
        return a.remainingDays - b.remainingDays;
      }
      if (statusFilter === 'Expiring Soon') {
        return a.remainingDays - b.remainingDays;
      }
      if (statusFilter === 'Expired') {
        return b.remainingDays - a.remainingDays;
      }
      if (statusFilter === 'Deactivated') {
        return (b.id || '').localeCompare(a.id || '');
      }
      const priority = (l) => {
        if (l.isExpiringSoon) return 1;
        if (l.isNormalAvailable) return 2;
        if (l.isExpired) return 3;
        return 4;
      };
      if (priority(a) !== priority(b)) return priority(a) - priority(b);
      return a.remainingDays - b.remainingDays;
    });
  };

  // Standalone licenses (no group assigned)
  const standaloneLicenses = useMemo(() => {
    return processedLicenses.filter(lic => !lic.groupId);
  }, [processedLicenses]);

  const filteredStandaloneLicenses = useMemo(() => {
    return filterLicenseList(standaloneLicenses);
  }, [standaloneLicenses, searchTerm, statusFilter]);

  // Group plans inside active group
  const activeGroupFilteredPlans = useMemo(() => {
    if (!activeGroup) return [];
    return filterLicenseList(activeGroup.plans || []);
  }, [activeGroup, searchTerm, statusFilter]);

  // Filtered Groups for Main Overview
  const filteredGroups = useMemo(() => {
    return processedGroups.filter(grp => {
      const matchesSearch = (grp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grp.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grp.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        grp.plans.some(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === 'Available') {
        matchesStatus = grp.availablePlansCount > 0 || grp.plansCount === 0;
      } else if (statusFilter === 'Expiring Soon') {
        matchesStatus = grp.expiringSoonPlansCount > 0;
      } else if (statusFilter === 'Expired') {
        matchesStatus = grp.expiredPlansCount > 0;
      } else if (statusFilter === 'Deactivated') {
        matchesStatus = grp.deactivatedPlansCount > 0;
      }

      return matchesSearch && matchesStatus;
    });
  }, [processedGroups, searchTerm, statusFilter]);

  // Filtered employee list for modal search
  const filteredEmployeesForModal = useMemo(() => {
    const q = modalEmployeeSearch.toLowerCase();
    return (employees || []).filter(emp => {
      return (emp.name || '').toLowerCase().includes(q) ||
        (emp.email || '').toLowerCase().includes(q) ||
        (emp.department || '').toLowerCase().includes(q);
    });
  }, [employees, modalEmployeeSearch]);

  // Status Badges Helper
  const getStatusBadge = (status) => {
    if (status === "Deactivated") return "bg-slate-100 text-slate-700 border-slate-300";
    if (status === "Expired") return "bg-rose-50 text-rose-800 border-rose-200";
    if (status === "Expiring Soon") return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  };

  return (
    <div className="space-y-6">
      {/* ================= VIEW 1: GROUP DRILLDOWN VIEW ================= */}
      {activeGroup ? (
        <div className="space-y-6 animate-fade-in">
          {/* Back Navigation Bar: ← Back to Licenses */}
          <div>
            <button
              type="button"
              onClick={() => handleSelectGroup(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E6DED8] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs group"
              title="Back to Licenses"
              aria-label="Back to Licenses"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-slate-500 group-hover:text-slate-800" />
              <span>Back to Licenses</span>
            </button>
          </div>

          {/* Group Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E6DED8]">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">{activeGroup.name}</h1>
                {activeGroup.vendor && (
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    {activeGroup.vendor}
                  </span>
                )}
              </div>
              {activeGroup.description && (
                <p className="text-xs text-gray-500 max-w-2xl">{activeGroup.description}</p>
              )}
              {/* Summary Line */}
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600 pt-1">
                <span>{activeGroup.plansCount} {activeGroup.plansCount === 1 ? 'Plan' : 'Plans'}</span>
                <span>•</span>
                <span>{activeGroup.uniqueEmployeesCount} {activeGroup.uniqueEmployeesCount === 1 ? 'Employee' : 'Employees'}</span>
                {activeGroup.expiringSoonPlansCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-600 font-extrabold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{activeGroup.expiringSoonPlansCount} Expiring Soon</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Header Actions: Icon-only for Edit, Delete, and Add (with Tooltips & aria-labels) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenEditGroupModal}
                title="Edit Group"
                aria-label="Edit Group"
                className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-[#E6DED8] hover:border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setGroupToDelete(activeGroup)}
                title="Delete Group"
                aria-label="Delete Group"
                className="p-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-[#E6DED8] hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal(activeGroup.id)}
                title="Add Plan"
                aria-label="Add Plan"
                className="p-2 bg-[#0B2545] hover:bg-[#134074] text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters & Control Bar */}
          <div className="bg-white border border-[#E6DED8] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center select-none">
            <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder={`Search plans in ${activeGroup.name}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E6DED8] rounded-xl text-xs focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="flex flex-wrap border border-[#E6DED8] rounded-xl p-0.5 bg-gray-50/50 w-full sm:w-auto justify-center gap-1">
              {['All', 'Available', 'Expiring Soon', 'Expired', 'Deactivated'].map(tab => {
                const count = tab === 'All' ? activeGroup.plansCount : tab === 'Available' ? activeGroup.availablePlansCount : tab === 'Expiring Soon' ? activeGroup.expiringSoonPlansCount : tab === 'Expired' ? activeGroup.expiredPlansCount : activeGroup.deactivatedPlansCount;
                return (
                  <button
                    key={tab}
                    onClick={() => handleStatusFilterChange(tab)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === tab
                        ? 'bg-white text-[#3B82F6] shadow-sm font-bold'
                        : 'text-[#6B7280] hover:text-[#3B82F6]'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      statusFilter === tab ? 'bg-blue-50 text-blue-700' : 'bg-gray-200/70 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subscription Plans Table in Group */}
          <div className="bg-white border border-[#E6DED8] rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-[#1F2937]">Subscription Plans</h2>

            {activeGroupFilteredPlans.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E6DED8] rounded-xl text-xs text-slate-400">
                No subscription plans found in this group.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E6DED8] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Plan Name</th>
                      <th className="pb-3 px-3 text-center">Employees</th>
                      <th className="pb-3 px-3">End Date</th>
                      <th className="pb-3 px-3 text-center">Status</th>
                      <th className="pb-3 pl-3 text-right w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeGroupFilteredPlans.map(lic => {
                      return (
                        <tr
                          key={lic.id}
                          onClick={() => handleOpenEditModal(lic)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer font-medium"
                        >
                          {/* Plan Name & Description */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl shrink-0">
                                <Key className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">
                                  {lic.name}
                                </span>
                                {lic.description && (
                                  <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                                    {lic.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Employees Assigned */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-50 text-blue-700">
                              <Users className="h-3 w-3 text-blue-500" />
                              <span>{lic.assignedCount}</span>
                            </div>
                          </td>

                          {/* End Date */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{lic.endDate}</span>
                            </span>
                            <span className={`text-[10px] font-bold block mt-0.5 ${
                              lic.status === 'Deactivated'
                                ? 'text-slate-400'
                                : lic.status === 'Expired'
                                ? 'text-red-600'
                                : lic.status === 'Expiring Soon'
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}>
                              {lic.status === 'Deactivated'
                                ? 'Deactivated'
                                : lic.status === 'Expired'
                                ? 'Expired'
                                : `${lic.remainingDays} days left`}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusBadge(lic.status)}`}>
                              {lic.status}
                            </span>
                          </td>

                          {/* Actions: Renew, Edit (Icon-only with tooltips) */}
                          <td className="py-3 pl-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {lic.status !== 'Deactivated' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRenewModal(lic);
                                  }}
                                  title="Renew Plan"
                                  aria-label="Renew Plan"
                                  className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(lic);
                                }}
                                title="Edit Plan"
                                aria-label="Edit Plan"
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= VIEW 2: MAIN OVERVIEW (GROUPS + STANDALONE) ================= */
        <div className="space-y-6 animate-fade-in">
          {/* Page Header - Primary Creation Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
            <div>
              <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Software Subscriptions & Licenses</h1>
              <p className="text-sm text-[#6B7280] mt-0.5">Track corporate software lifecycle, renewals and notifications.</p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleOpenCreateGroupModal}
                className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-[#E6DED8] hover:border-slate-300 font-bold text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 text-[#0B2545]" />
                <span>Create Group</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddModal(null)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white font-bold rounded-xl shadow-xs transition-all duration-200 cursor-pointer text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Create License</span>
              </button>
            </div>
          </div>

          {/* Search & Status Filter Tabs */}
          <div className="bg-white border border-[#E6DED8] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center select-none">
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search licenses, groups or vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E6DED8] rounded-xl text-xs focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
              />
            </div>

            <div className="flex flex-wrap border border-[#E6DED8] rounded-xl p-0.5 bg-gray-50/50 w-full sm:w-auto justify-center gap-1">
              {['All', 'Available', 'Expiring Soon', 'Expired', 'Deactivated'].map(tab => {
                const count = tab === 'All' ? totalCount : tab === 'Available' ? availableCount : tab === 'Expiring Soon' ? expiringSoonCount : tab === 'Expired' ? expiredCount : deactivatedCount;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleStatusFilterChange(tab)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === tab
                        ? 'bg-white text-[#3B82F6] shadow-sm font-bold'
                        : 'text-[#6B7280] hover:text-[#3B82F6]'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      statusFilter === tab ? 'bg-blue-50 text-blue-700' : 'bg-gray-200/70 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* --- SECTION 1: SUBSCRIPTION GROUPS TABLE --- */}
          <div className="bg-white border border-[#E6DED8] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 select-none">
              <div className="p-1.5 bg-blue-50 text-blue-800 rounded-lg">
                <Folder className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#1F2937] tracking-tight">Subscription Groups</h2>
                <p className="text-xs text-[#6B7280]">Parent containers grouping different subscription plans (e.g. OpenAI, Microsoft, Adobe)</p>
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E6DED8] rounded-xl text-xs text-slate-400 select-none">
                No subscription groups found matching your filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E6DED8] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Group</th>
                      <th className="pb-3 px-3 text-center">Plans</th>
                      <th className="pb-3 px-3 text-center">Employees</th>
                      <th className="pb-3 px-3">Next Expiry</th>
                      <th className="pb-3 px-3 text-center">Status</th>
                      <th className="pb-3 pl-3 text-right w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredGroups.map(group => {
                      return (
                        <tr
                          key={group.id}
                          onClick={() => handleSelectGroup(group.id)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group font-medium"
                        >
                          {/* Group Name & Vendor */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl shrink-0 group-hover:bg-blue-100 transition-colors">
                                <Layers className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors block text-xs">
                                  {group.name}
                                </span>
                                {group.vendor && (
                                  <span className="text-[10px] text-slate-400 font-semibold block">
                                    {group.vendor}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Plans Count */}
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-700">
                              {group.plansCount}
                            </span>
                          </td>

                          {/* Employees Count */}
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-50 text-blue-700">
                              {group.uniqueEmployeesCount}
                            </span>
                          </td>

                          {/* Next Expiry */}
                          <td className="py-3 px-3">
                            {group.nextExpiry ? (
                              <div>
                                <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  <span>{group.nextExpiry.dateStr}</span>
                                </span>
                                <span className={`text-[10px] font-bold block mt-0.5 ${
                                  group.nextExpiry.isExpiringSoon ? 'text-amber-600' : 'text-slate-400'
                                }`}>
                                  {group.nextExpiry.relativeText}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                              group.hasExpiringSoon
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {group.hasExpiringSoon ? 'Expiring Soon' : 'Active'}
                            </span>
                          </td>

                          {/* Actions: Edit icon */}
                          <td className="py-3 pl-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGroupId(group.id);
                                  setEditGroupFormName(group.name || '');
                                  setEditGroupFormVendor(group.vendor || '');
                                  setEditGroupFormDescription(group.description || '');
                                  setIsEditGroupModalOpen(true);
                                }}
                                title="Edit Group"
                                aria-label="Edit Group"
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* --- SECTION 2: STANDALONE LICENSES TABLE --- */}
          <div className="bg-white border border-[#E6DED8] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 select-none">
              <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#1F2937] tracking-tight">Standalone Subscriptions & Licenses</h2>
                <p className="text-xs text-[#6B7280]">Individual software licenses operating independently without subscription groups</p>
              </div>
            </div>

            {filteredStandaloneLicenses.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E6DED8] rounded-xl text-xs text-slate-400 select-none">
                No standalone subscriptions found matching your filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E6DED8] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">License</th>
                      <th className="pb-3 px-3">Vendor</th>
                      <th className="pb-3 px-3">End Date</th>
                      <th className="pb-3 px-3 text-center">Status</th>
                      <th className="pb-3 pl-3 text-right w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredStandaloneLicenses.map(lic => {
                      return (
                        <tr
                          key={lic.id}
                          onClick={() => handleOpenEditModal(lic)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer font-medium"
                        >
                          {/* License Name & Description */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
                                <Key className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">
                                  {lic.name}
                                </span>
                                {lic.description && (
                                  <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                                    {lic.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Vendor */}
                          <td className="py-3 px-3 text-slate-600 font-semibold">
                            {lic.vendor || "Standalone"}
                          </td>

                          {/* End Date */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{lic.endDate}</span>
                            </span>
                            <span className={`text-[10px] font-bold block mt-0.5 ${
                              lic.status === 'Deactivated'
                                ? 'text-slate-400'
                                : lic.status === 'Expired'
                                ? 'text-red-600'
                                : lic.status === 'Expiring Soon'
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}>
                              {lic.status === 'Deactivated'
                                ? 'Deactivated'
                                : lic.status === 'Expired'
                                ? 'Expired'
                                : `${lic.remainingDays} days left`}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusBadge(lic.status)}`}>
                              {lic.status}
                            </span>
                          </td>

                          {/* Actions: Renew, Edit */}
                          <td className="py-3 pl-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {lic.status !== 'Deactivated' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRenewModal(lic);
                                  }}
                                  title="Renew License"
                                  aria-label="Renew License"
                                  className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(lic);
                                }}
                                title="Edit License"
                                aria-label="Edit License"
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE SUBSCRIPTION GROUP ================= */}
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-white border border-[#E6DED8] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-[#E6DED8] flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#EEF2F6] rounded-lg">
                  <FolderPlus className="h-5 w-5 text-[#0B2545]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900">Create Subscription Group</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Group container for plans (e.g. OpenAI, Microsoft)</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateGroupModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI, Microsoft, Adobe, Atlassian"
                    value={groupFormName}
                    onChange={(e) => setGroupFormName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor / Category</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Tools, Productivity Suite, Cloud Services"
                    value={groupFormVendor}
                    onChange={(e) => setGroupFormVendor(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. AI subscriptions and software plans used across employees"
                    value={groupFormDescription}
                    onChange={(e) => setGroupFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6DED8] flex justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  className="px-4 py-2 border border-[#E6DED8] text-[#4B5563] font-semibold rounded-xl text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGroup}
                  className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {isSubmittingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT SUBSCRIPTION GROUP ================= */}
      {isEditGroupModalOpen && activeGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-white border border-[#E6DED8] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-[#E6DED8] flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#EEF2F6] rounded-lg">
                  <Edit2 className="h-5 w-5 text-[#0B2545]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900">Edit Subscription Group</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Update group name, vendor, or description</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditGroupModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditGroupSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI, Microsoft, Adobe"
                    value={editGroupFormName}
                    onChange={(e) => setEditGroupFormName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor / Category</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Tools, Productivity Suite, Cloud Services"
                    value={editGroupFormVendor}
                    onChange={(e) => setEditGroupFormVendor(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. AI subscriptions and software plans used across employees"
                    value={editGroupFormDescription}
                    onChange={(e) => setEditGroupFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6DED8] flex justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsEditGroupModalOpen(false)}
                  className="px-4 py-2 border border-[#E6DED8] text-[#4B5563] font-semibold rounded-xl text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGroup}
                  className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {isSubmittingGroup ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE SUBSCRIPTION GROUP CONFIRMATION ================= */}
      {groupToDelete && (() => {
        const hasPlans = Boolean((groupToDelete.plansCount && groupToDelete.plansCount > 0) || (groupToDelete.plans && groupToDelete.plans.length > 0));
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-5 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${hasPlans ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                  {hasPlans ? <AlertTriangle className="h-6 w-6" /> : <Trash2 className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {hasPlans ? 'Cannot Delete Group' : 'Delete Subscription Group?'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{groupToDelete.name}</p>
                </div>
              </div>

              {hasPlans ? (
                <div className="space-y-3">
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl leading-relaxed font-medium">
                    Cannot delete this group while it contains subscription plans ({groupToDelete.plansCount || groupToDelete.plans.length} active plan(s)). Please remove, move, or reassign all plans first before removing this group.
                  </p>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setGroupToDelete(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Are you sure you want to delete <strong className="text-slate-800">"{groupToDelete.name}"</strong>? Admin password verification is required.
                  </p>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setGroupToDelete(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetGroup = groupToDelete;
                        setGroupToDelete(null);
                        setPassAuthModal({
                          isOpen: true,
                          title: `Admin Verification: Delete Group "${targetGroup.name}"`,
                          actionLabel: "Delete Group",
                          onSuccess: async () => {
                            setPassAuthModal({ isOpen: false, title: '', actionLabel: '', onSuccess: null });
                            if (selectedGroupId === targetGroup.id) {
                              handleSelectGroup(null);
                            }
                            await deleteSubscriptionGroup(targetGroup.id);
                          }
                        });
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                    >
                      Continue & Verify Password
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: ADD LICENSE (Standalone or Group Plan with Optional Assignment) ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-white border border-[#E6DED8] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E6DED8] flex justify-between items-center bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#EEF2F6] rounded-lg">
                  <Key className="h-5 w-5 text-[#0B2545]" />
                </div>
                <h3 className="font-extrabold text-gray-900">
                  {formGroupId ? 'Add Plan to Group' : 'Create Standalone License'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div className="space-y-3">
                {/* Subscription Group Selection (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Subscription Group (Optional)
                  </label>
                  <select
                    value={formGroupId}
                    onChange={(e) => {
                      const newGid = e.target.value;
                      setFormGroupId(newGid);
                      if (newGid) {
                        const g = (subscriptionGroups || []).find(grp => grp.id === newGid);
                        if (g) setFormVendor(g.name || 'Subscription');
                      }
                    }}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] bg-white cursor-pointer"
                  >
                    <option value="">None / Standalone License</option>
                    {(subscriptionGroups || []).map(grp => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Software / Plan Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {formGroupId ? 'Plan Name *' : 'License Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={formGroupId ? "e.g. ChatGPT Plus, Business Tier" : "e.g. Adobe Acrobat Pro, JetBrains Suite"}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                {/* Category / Vendor */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category / Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Productivity, Developer Tools, Design"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                {/* Alert Warning Trigger (Notify Before) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notify Before *</label>
                  <select
                    value={formAlertDays}
                    onChange={(e) => setFormAlertDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] bg-white cursor-pointer"
                  >
                    <option value={7}>7 Days before expiry</option>
                    <option value={14}>14 Days before expiry</option>
                    <option value={30}>30 Days before expiry</option>
                    <option value={60}>60 Days before expiry</option>
                  </select>
                </div>

                {/* Optional Employee Assignment ONLY for Plans in Subscription Groups */}
                {formGroupId && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Assign Employees <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                      </label>
                      {formAssignMode === 'select' && (
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {formAssignedEmployeeIds.length} Selected
                        </span>
                      )}
                    </div>

                    {/* Mode Toggle: No Assignment vs Select Employees */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormAssignMode('none');
                          setFormAssignedEmployeeIds([]);
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          formAssignMode === 'none'
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        No Assignment
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormAssignMode('select')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          formAssignMode === 'select'
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Select Employees
                      </button>
                    </div>

                    {/* Search & Select Employees */}
                    {formAssignMode === 'select' && (
                      <div className="space-y-2 pt-1">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search employees..."
                            value={modalEmployeeSearch}
                            onChange={(e) => setModalEmployeeSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
                          {filteredEmployeesForModal.length === 0 ? (
                            <div className="py-4 text-center text-xs text-gray-400">No employees found</div>
                          ) : (
                            filteredEmployeesForModal.map(emp => {
                              const isSelected = formAssignedEmployeeIds.includes(emp.id);
                              return (
                                <div
                                  key={emp.id}
                                  onClick={() => {
                                    setFormAssignedEmployeeIds(prev => 
                                      prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                                    );
                                  }}
                                  className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                                    isSelected ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div>
                                      <div className="text-xs font-bold text-gray-800">{emp.name}</div>
                                      <div className="text-[10px] text-gray-400">{emp.department || 'Employee'} • {emp.email}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Description / Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Standard software license notes"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6DED8] flex justify-end gap-3 select-none shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#E6DED8] text-[#4B5563] font-semibold rounded-xl text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLicense}
                  className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {isSubmittingLicense ? 'Saving...' : (formGroupId ? 'Add Plan' : 'Create License')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT LICENSE (Includes Reactivate & Employee Assignment in Edit) ================= */}
      {isEditModalOpen && selectedLicense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-white border border-[#E6DED8] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E6DED8] flex justify-between items-center bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FDF2F8] rounded-lg">
                  <Edit2 className="h-5 w-5 text-[#0B2545]" />
                </div>
                <h3 className="font-extrabold text-gray-900">
                  {selectedLicense.groupId ? 'Edit Subscription Plan' : 'Edit Standalone License'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
              {/* REACTIVATION CONTROL: Visible ONLY when status is DEACTIVATED */}
              {selectedLicense.isDeactivated && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Ban className="h-4 w-4 text-amber-600" />
                      <span>Current Status: Deactivated</span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                      Inactive
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700/90 leading-tight">
                    Check the box below to reactivate this license. You may also update the start and expiry dates before saving.
                  </p>
                  <label className="flex items-center gap-2 pt-1 font-bold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formReactivateChecked}
                      onChange={(e) => setFormReactivateChecked(e.target.checked)}
                      className="h-4 w-4 rounded border-amber-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className={formReactivateChecked ? "text-emerald-700 font-extrabold" : "text-slate-700"}>
                      Reactivate License & make Available upon Save
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-3">
                {/* Subscription Group Selection (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Subscription Group (Optional)
                  </label>
                  <select
                    value={formGroupId}
                    onChange={(e) => {
                      const newGid = e.target.value;
                      setFormGroupId(newGid);
                      if (newGid) {
                        const g = (subscriptionGroups || []).find(grp => grp.id === newGid);
                        if (g) setFormVendor(g.name || 'Subscription');
                      }
                    }}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] bg-white cursor-pointer"
                  >
                    <option value="">None / Standalone License</option>
                    {(subscriptionGroups || []).map(grp => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Software / Plan Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {formGroupId ? 'Plan Name *' : 'License Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                {/* Category / Vendor */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category / Vendor</label>
                  <input
                    type="text"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                {/* Cost */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cost / Billing (Optional)</label>
                  <input
                    type="text"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                {/* Notification Target Config */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alert Notification Threshold *</label>
                  <select
                    value={formAlertDays}
                    onChange={(e) => setFormAlertDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] bg-white cursor-pointer"
                  >
                    <option value={7}>7 Days before expiry</option>
                    <option value={14}>14 Days before expiry</option>
                    <option value={30}>30 Days before expiry</option>
                    <option value={60}>60 Days before expiry</option>
                  </select>
                </div>

                {/* Employee Assignment in Edit Plan (ONLY for Group Plans) */}
                {formGroupId && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Assigned Employees <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                      </label>
                      {formAssignMode === 'select' && (
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {formAssignedEmployeeIds.length} Assigned
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormAssignMode('none');
                          setFormAssignedEmployeeIds([]);
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          formAssignMode === 'none'
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        No Assignment
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormAssignMode('select')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          formAssignMode === 'select'
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Select Employees
                      </button>
                    </div>

                    {formAssignMode === 'select' && (
                      <div className="space-y-2 pt-1">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search employees..."
                            value={modalEmployeeSearch}
                            onChange={(e) => setModalEmployeeSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
                          {filteredEmployeesForModal.length === 0 ? (
                            <div className="py-4 text-center text-xs text-gray-400">No employees found</div>
                          ) : (
                            filteredEmployeesForModal.map(emp => {
                              const isSelected = formAssignedEmployeeIds.includes(emp.id);
                              return (
                                <div
                                  key={emp.id}
                                  onClick={() => {
                                    setFormAssignedEmployeeIds(prev => 
                                      prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                                    );
                                  }}
                                  className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                                    isSelected ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div>
                                      <div className="text-xs font-bold text-gray-800">{emp.name}</div>
                                      <div className="text-[10px] text-gray-400">{emp.department || 'Employee'} • {emp.email}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Description / Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description / Notes</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6DED8] flex justify-between items-center select-none shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const lic = selectedLicense;
                    setIsEditModalOpen(false);
                    setLicToDelete(lic);
                  }}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete {selectedLicense.groupId ? 'Plan' : 'License'}</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-[#E6DED8] text-[#4B5563] font-semibold rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLicense}
                    className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {isSubmittingLicense ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RENEW SUBSCRIPTION ================= */}
      {licToRenew && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in">
          <div className="bg-white border border-[#E6DED8] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-[#E6DED8] flex justify-between items-center bg-emerald-50/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 leading-tight">Renew Software License</h3>
                  <p className="text-[11px] text-emerald-700 font-semibold">{licToRenew.name}</p>
                </div>
              </div>
              <button
                onClick={() => setLicToRenew(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Current Expiry Date:</span>
                  <span className="font-bold text-gray-800">{licToRenew.endDate}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Current State:</span>
                  <span className="font-bold text-amber-700">{licToRenew.status}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Start Date</label>
                    <input
                      type="date"
                      value={renewStartDate}
                      onChange={(e) => setRenewStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={renewEndDate}
                      onChange={(e) => setRenewEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notify Before *</label>
                  <select
                    value={renewAlertDays}
                    onChange={(e) => setRenewAlertDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white cursor-pointer"
                  >
                    <option value={7}>7 Days before expiry</option>
                    <option value={14}>14 Days before expiry</option>
                    <option value={30}>30 Days before expiry</option>
                    <option value={60}>60 Days before expiry</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6DED8] flex justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setLicToRenew(null)}
                  className="px-4 py-2 border border-[#E6DED8] text-[#4B5563] font-semibold rounded-xl text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRenew}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-sm transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{isSubmittingRenew ? 'Renewing...' : 'Confirm Renewal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DEACTIVATE SUBSCRIPTION ================= */}
      {licToDeactivate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Ban className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Deactivate Software Subscription?</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Disables active usage while retaining assignments and history</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to deactivate <span className="font-bold text-slate-800">"{licToDeactivate.name}"</span>?
              It will be marked as <strong className="text-slate-700">Deactivated</strong>, removed from the Available list, and can be reactivated inside Edit at any time.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Reason for Deactivation (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Temporary contract pause, department migration"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#E6DED8] rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLicToDeactivate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isSubmittingDeactivate}
                onClick={handleDeactivateSubmit}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                {isSubmittingDeactivate ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE LICENSE CONFIRMATION ================= */}
      {licToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Delete Subscription</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Admin password verification is required</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to delete <span className="font-bold text-slate-800">"{licToDelete.name}"</span>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLicToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetLic = licToDelete;
                  setLicToDelete(null);
                  setPassAuthModal({
                    isOpen: true,
                    title: `Admin Verification: Delete License "${targetLic.name}"`,
                    actionLabel: "Delete License",
                    onSuccess: async () => {
                      setPassAuthModal({ isOpen: false, title: '', actionLabel: '', onSuccess: null });
                      await deleteLicense(targetLic.id);
                    }
                  });
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Continue & Verify Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN SECURITY PASSWORD VERIFICATION MODAL ================= */}
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

export default Licenses;
