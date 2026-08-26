import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  AlertTriangle,
  UserCheck,
  Check,
  BookOpen
} from 'lucide-react';

import { useAssetManager } from '../hooks/useAssetManager';
import MetricCard from '../components/MetricCard';
import AssetIconBadge from '../components/AssetIcon';

const Repairs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    repairs,
    softwareTickets,
    assets,
    employees,
    currentUser,
    addRepair,
    addRepairUpdate,
    addSoftwareTicket,
    addSoftwareTicketUpdate,
    acceptRepair,
    rejectRepair,
    acceptSoftwareTicket,
    rejectSoftwareTicket,
    showToast
  } = useAssetManager();

  const allTickets = [...(repairs || []), ...(softwareTickets || [])];

  // Selected Repair request state
  const [selectedRepairId, setSelectedRepairId] = useState(null);

  // Search, Pagination, Tab filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // All | My Requests | In Progress | Awaiting Parts | Completed | Cancelled
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('All'); // All | Hardware | Software
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchTerm(q);
    }
    const statusParam = searchParams.get('status') || searchParams.get('tab');
    if (statusParam && ['All', 'My Requests', 'In Progress', 'Awaiting Parts', 'Completed', 'Cancelled'].includes(statusParam)) {
      setActiveTab(statusParam);
    }
    const catParam = searchParams.get('category');
    if (catParam && ['All', 'Hardware', 'Software'].includes(catParam)) {
      setTicketCategoryFilter(catParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (tabName === 'All') {
      newParams.delete('status');
      newParams.delete('tab');
    } else {
      newParams.set('status', tabName);
    }
    setSearchParams(newParams);
  };

  const handleCategorySelect = (category) => {
    setTicketCategoryFilter(category);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Form states
  const [formAssetId, setFormAssetId] = useState('');
  const [formReporterId, setFormReporterId] = useState('');
  const [formIssue, setFormIssue] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formAssignedTo, setFormAssignedTo] = useState('IT Support Team');
  const [formEstDate, setFormEstDate] = useState('2026-07-13');

  // Add Update Form states
  const [updateStatus, setUpdateStatus] = useState('In Progress');
  const [updateMessage, setUpdateMessage] = useState('');

  // Admin identity
  const currentAdminName = currentUser?.name ? `${currentUser.name} (Admin)` : 'Rakesh Reddy (Admin)';

  const getDisplayStatus = (rep) => {
    if (rep.status === 'Cancelled') return 'Cancelled';
    return rep.acceptedBy ? rep.status : 'Pending';
  };

  const isSoftwareTicket = (t) => Boolean(
    t && (
      (softwareTickets || []).some(st => st.id === t.id) ||
      t.id?.startsWith('SW') ||
      t.id?.startsWith('SFT') ||
      t.id?.startsWith('INC') ||
      t.workingMode ||
      t.working_mode
    )
  );

  // Tickets awaiting admin acceptance (decreases when accepted, increases when raised)
  const pendingTicketsToAccept = allTickets.filter(t => !t.acceptedBy && t.status !== 'Completed' && t.status !== 'Cancelled');
  const pendingAllCount = pendingTicketsToAccept.length;
  const pendingHardwareCount = pendingTicketsToAccept.filter(t => !isSoftwareTicket(t)).length;
  const pendingSoftwareCount = pendingTicketsToAccept.filter(t => isSoftwareTicket(t)).length;

  // 1. Calculate dynamic statistics scoped to active category (All, Hardware, Software)
  const categoryScopedTickets = allTickets.filter(t => {
    const isSoftware = isSoftwareTicket(t);
    if (ticketCategoryFilter === 'Hardware' && isSoftware) return false;
    if (ticketCategoryFilter === 'Software' && !isSoftware) return false;
    return true;
  });

  const totalRepairsCount = categoryScopedTickets.length;
  const myAcceptedCount = categoryScopedTickets.filter(r =>
    r.acceptedBy && (
      r.acceptedBy.toLowerCase().includes((currentUser?.name || 'Rakesh').toLowerCase()) ||
      r.assignedTo?.toLowerCase().includes((currentUser?.name || 'Rakesh').toLowerCase())
    )
  ).length;
  const inProgressCount = categoryScopedTickets.filter(r => getDisplayStatus(r) === 'In Progress').length;
  const awaitingCount = categoryScopedTickets.filter(r => getDisplayStatus(r) === 'Awaiting Parts').length;
  const completedCount = categoryScopedTickets.filter(r => getDisplayStatus(r) === 'Completed').length;
  const cancelledCount = categoryScopedTickets.filter(r => getDisplayStatus(r) === 'Cancelled').length;

  const parseTicketTime = (ticket) => {
    if (ticket.createdAt) {
      const t = new Date(ticket.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (ticket.requestDate) {
      const cleanDate = ticket.requestDate.replace(',', '');
      const t = new Date(cleanDate).getTime();
      if (!isNaN(t)) return t;
    }
    const num = parseInt(ticket.id?.replace(/\D/g, '') || '0', 10);
    return num;
  };

  const isUnaccepted = (r) => !r.acceptedBy && r.status !== 'Completed' && r.status !== 'Cancelled';

  const getAssetInfo = (assetId) => {
    if (!assetId) return { id: 'N/A', type: 'Other', model: 'Standard Asset', brand: 'Generic' };
    const asset = (assets || []).find(a => a.id === assetId);
    if (asset) return asset;
    return { id: assetId, type: 'Other', model: assetId, brand: 'Generic' };
  };

  const getReporterInfo = (reportedBy, rep = null) => {
    const rawId = reportedBy || rep?.reportedBy || rep?.reported_by;
    if (rawId) {
      const reporter = (employees || []).find(e =>
        String(e.id || '').trim().toLowerCase() === String(rawId).trim().toLowerCase() ||
        String(e.name || '').trim().toLowerCase() === String(rawId).trim().toLowerCase() ||
        String(e.username || '').trim().toLowerCase() === String(rawId).trim().toLowerCase() ||
        String(e.email || '').trim().toLowerCase() === String(rawId).trim().toLowerCase()
      );
      if (reporter) return reporter;
      return { id: rawId, name: rawId };
    }

    // Check if the repair has an asset with an assigned employee in the database
    if (rep?.assetId) {
      const asset = (assets || []).find(a => a.id === rep.assetId);
      const assignedTo = asset?.assignedTo || asset?.assigned_to;
      if (assignedTo) {
        const reporter = (employees || []).find(e =>
          String(e.id || '').trim().toLowerCase() === String(assignedTo).trim().toLowerCase() ||
          String(e.name || '').trim().toLowerCase() === String(assignedTo).trim().toLowerCase()
        );
        if (reporter) return reporter;
        return { id: assignedTo, name: assignedTo };
      }
    }

    return { id: 'N/A', name: 'Unknown Reporter' };
  };

  // 2. Filter repairs list based on search and tabs, prioritizing unaccepted tickets on top
  const filteredRepairs = allTickets
    .filter(rep => {
      const isSoftware = isSoftwareTicket(rep);
      if (ticketCategoryFilter === 'Hardware' && isSoftware) return false;
      if (ticketCategoryFilter === 'Software' && !isSoftware) return false;

      const asset = assets.find(a => a.id === rep.assetId);
      const reporter = getReporterInfo(rep.reportedBy || rep.reported_by, rep);
      const searchString = `${rep.id} ${rep.assetId || ''} ${asset ? asset.brand : ''} ${asset ? asset.model : ''} ${rep.issue} ${rep.workingMode || ''} ${reporter ? reporter.name : ''} ${rep.acceptedBy || ''} ${getDisplayStatus(rep)}`.toLowerCase();

      const matchesSearch = searchString.includes(searchTerm.toLowerCase());
      let matchesTab = true;
      if (activeTab === 'My Requests') {
        matchesTab = Boolean(rep.acceptedBy && (
          rep.acceptedBy.toLowerCase().includes((currentUser?.name || 'Rakesh').toLowerCase()) ||
          rep.assignedTo?.toLowerCase().includes((currentUser?.name || 'Rakesh').toLowerCase())
        ));
      } else if (activeTab !== 'All') {
        matchesTab = getDisplayStatus(rep) === activeTab;
      }

      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      const unaccA = isUnaccepted(a);
      const unaccB = isUnaccepted(b);

      // Active unaccepted tickets are at the top until accepted by admin
      if (unaccA && !unaccB) return -1;
      if (!unaccA && unaccB) return 1;

      // When accepted, tickets go down and sort according to dates and timing (newest first)
      const timeA = parseTicketTime(a);
      const timeB = parseTicketTime(b);
      if (timeA !== timeB) return timeB - timeA;

      return (b.id || '').localeCompare(a.id || '');
    });


  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);
  const paginatedRepairs = filteredRepairs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 3. Find selected repair details
  const selectedRepair = allTickets.find(r => r.id === selectedRepairId) || null;
  const selectedAsset = selectedRepair ? getAssetInfo(selectedRepair.assetId) : null;
  const selectedReporter = selectedRepair ? getReporterInfo(selectedRepair.reportedBy || selectedRepair.reported_by, selectedRepair) : null;

  // 4. Submit Handlers
  const handleOpenAddModal = () => {
    // Select first asset in under repair list or any asset
    const repairableAssets = assets.filter(a => a.status === 'Available' || a.status === 'Under Repair');
    setFormAssetId(repairableAssets[0]?.id || '');
    setFormReporterId(employees[0]?.id || '');
    setFormIssue('');
    setFormDescription('');
    setFormPriority('Medium');
    setFormAssignedTo('IT Support Team');
    setFormEstDate('2026-07-13');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formAssetId) {
      showToast("Please select a device.", "error");
      return;
    }
    addRepair({
      assetId: formAssetId,
      reportedBy: formReporterId,
      issue: formIssue,
      description: formDescription,
      priority: formPriority,
      assignedTo: formAssignedTo,
      estimatedCompletion: formEstDate
    });
    setIsAddModalOpen(false);
    showToast("New repair request created successfully!");
  };

  const handleOpenUpdateModal = () => {
    if (!selectedRepair) return;
    setUpdateStatus(selectedRepair.status);
    setUpdateMessage('');
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (isSoftwareTicket(selectedRepair)) {
      addSoftwareTicketUpdate(selectedRepair.id, updateStatus, updateMessage);
    } else {
      addRepairUpdate(selectedRepair.id, updateStatus, updateMessage);
    }
    setIsUpdateModalOpen(false);
    showToast(`Successfully added status update to ${selectedRepair.id}!`);
  };

  const handleCancelRequest = () => {
    if (!selectedRepair) return;
    setIsCancelConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    if (isSoftwareTicket(selectedRepair)) {
      addSoftwareTicketUpdate(selectedRepair.id, 'Cancelled', 'Software ticket cancelled by administrator.');
    } else {
      addRepairUpdate(selectedRepair.id, 'Cancelled', 'Repair request cancelled by administrator.');
    }
    showToast(`Cancelled request ${selectedRepair.id}`);
    setIsCancelConfirmOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Category Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-xs font-semibold text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer">Dashboard</span>
          <span className="mx-2">&gt;</span>
          <span className="text-slate-600 font-bold">Repairs & Tickets</span>
        </div>

        {/* Primary Hardware vs Software Toggle Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner">
          <button
            onClick={() => handleCategorySelect('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              ticketCategoryFilter === 'All'
                ? 'bg-[#1E3A8A] text-white shadow-md'
                : 'text-slate-600 hover:text-blue-900'
            }`}
          >
            <span>All Tickets</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${ticketCategoryFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {pendingAllCount}
            </span>
          </button>
          <button
            onClick={() => handleCategorySelect('Hardware')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              ticketCategoryFilter === 'Hardware'
                ? 'bg-[#1E3A8A] text-white shadow-md'
                : 'text-slate-600 hover:text-blue-900'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Hardware Repairs</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${ticketCategoryFilter === 'Hardware' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {pendingHardwareCount}
            </span>
          </button>
          <button
            onClick={() => handleCategorySelect('Software')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              ticketCategoryFilter === 'Software'
                ? 'bg-[#1E3A8A] text-white shadow-md'
                : 'text-slate-600 hover:text-blue-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Software Tickets</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${ticketCategoryFilter === 'Software' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {pendingSoftwareCount}
            </span>
          </button>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard 
          icon={ticketCategoryFilter === 'Software' ? BookOpen : Wrench} 
          title={ticketCategoryFilter === 'Software' ? "Total Tickets" : "Total Repairs"} 
          value={totalRepairsCount} 
          color="blue" 
          isActive={activeTab === 'All'}
          onClick={() => handleTabChange('All')} 
        />
        <MetricCard 
          icon={UserCheck} 
          title="My Requests" 
          value={myAcceptedCount} 
          color="teal" 
          subtext={`Accepted by ${currentUser?.name || 'Rakesh'}`} 
          isActive={activeTab === 'My Requests'}
          onClick={() => handleTabChange('My Requests')} 
        />
        <MetricCard 
          icon={Clock} 
          title="In Progress" 
          value={inProgressCount} 
          color="green" 
          isActive={activeTab === 'In Progress'}
          onClick={() => handleTabChange('In Progress')} 
        />
        <MetricCard 
          icon={AlertCircle} 
          title="Awaiting Parts" 
          value={awaitingCount} 
          color="orange" 
          isActive={activeTab === 'Awaiting Parts'}
          onClick={() => handleTabChange('Awaiting Parts')} 
        />
        <MetricCard 
          icon={CheckCircle} 
          title="Completed" 
          value={completedCount} 
          color="purple" 
          isActive={activeTab === 'Completed'}
          onClick={() => handleTabChange('Completed')} 
        />
        <MetricCard 
          icon={XCircle} 
          title="Cancelled" 
          value={cancelledCount} 
          color="red" 
          isActive={activeTab === 'Cancelled'}
          onClick={() => handleTabChange('Cancelled')} 
        />
      </div>

      {/* Main Master-Detail panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns (Span 2 or 3 depending on detail card selection): Repair Requests list */}
        <div className={`${selectedRepairId ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 transition-all duration-300`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-base font-bold text-slate-800">Support Requests</h3>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Search repairs..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          </div>


          {/* Filter tabs */}
          <div className="flex gap-4 border-b border-slate-100 text-xs font-semibold overflow-x-auto pb-1">
            {['All', 'My Requests', 'In Progress', 'Awaiting Parts', 'Completed', 'Cancelled'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`pb-2.5 px-1 border-b-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === tab ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab} {tab === 'My Requests' ? `(${myAcceptedCount})` : ''}
              </button>
            ))}
          </div>

          {/* Requests Master Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-2">Request ID</th>
                  <th className="pb-3 px-2">Asset Details</th>
                  <th className="pb-3 px-2">Reported By</th>
                  <th className="pb-3 px-2">Issue</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Accepted By</th>
                  <th className="pb-3 px-2">Request Date</th>
                  <th className="pb-3 pl-2 text-right">Accept / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No matching repair requests found.
                    </td>
                  </tr>
                ) : (
                  paginatedRepairs.map((rep) => {
                    const asset = getAssetInfo(rep.assetId);
                    const reporter = getReporterInfo(rep.reportedBy || rep.reported_by, rep);
                    const isSelected = selectedRepairId === rep.id;

                    return (
                      <tr
                        key={rep.id}
                        onClick={() => setSelectedRepairId(rep.id)}
                        className={`cursor-pointer transition-all ${isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                          }`}
                      >
                        <td className="py-3.5 pr-2 font-bold text-blue-600">{rep.id}</td>
                        <td className="py-3.5 px-2 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <AssetIconBadge type={asset?.type} className="h-6 w-6 rounded-md shrink-0" iconSize="h-3.5 w-3.5" />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate max-w-[125px] font-bold text-slate-800 leading-tight">{asset?.model || 'Standard Asset'}</span>
                              <span className="text-[10px] text-slate-400 font-medium truncate">{asset?.id || rep.assetId} &bull; {asset?.type || 'Other'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="flex flex-col leading-tight min-w-0">
                            <span className="font-semibold text-slate-700 truncate max-w-[110px]">{reporter?.name || 'Unknown Reporter'}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{reporter?.id || rep.reportedBy || rep.reported_by || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-slate-600 truncate max-w-[100px]">{rep.issue}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase whitespace-nowrap inline-block text-center min-w-[85px] ${getDisplayStatus(rep) === 'In Progress' ? 'bg-emerald-50 text-emerald-600' :
                              getDisplayStatus(rep) === 'Awaiting Parts' ? 'bg-amber-50 text-amber-600' :
                                getDisplayStatus(rep) === 'Completed' ? 'bg-blue-50 text-blue-600' :
                                  getDisplayStatus(rep) === 'Pending' ? 'bg-slate-100 text-slate-600' :
                                  'bg-slate-100 text-slate-600'
                            }`}>
                            {getDisplayStatus(rep)}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 font-semibold">
                          {rep.acceptedBy ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap" title={rep.acceptedBy}>
                              <UserCheck className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                              <span>{rep.acceptedBy.replace(' (Admin)', '')}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-slate-500">
                          {(() => {
                            const parts = rep.requestDate.split(' ');
                            if (parts.length >= 3) {
                              const datePart = `${parts[0]} ${parts[1]} ${parts[2]}`;
                              const timePart = parts.slice(3).join(' ');
                              return (
                                <div className="flex flex-col text-[10px] leading-tight whitespace-nowrap">
                                  <span className="font-semibold text-slate-700">{datePart}</span>
                                  {timePart && <span className="text-slate-400 font-medium text-[9px] mt-0.5">{timePart}</span>}
                                </div>
                              );
                            }
                            return <span className="whitespace-nowrap">{rep.requestDate}</span>;
                          })()}
                        </td>
                        <td className="py-3.5 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {!rep.acceptedBy && rep.status !== 'Completed' && rep.status !== 'Cancelled' ? (
                              <>
                                <button
                                  onClick={() => {
                                    if (isSoftwareTicket(rep)) {
                                      acceptSoftwareTicket(rep.id, currentAdminName);
                                    } else {
                                      acceptRepair(rep.id, currentAdminName);
                                    }
                                    showToast(`Accepted ticket ${rep.id}! Assigned to ${currentAdminName}.`);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                  title="Accept Ticket"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (isSoftwareTicket(rep)) {
                                      rejectSoftwareTicket(rep.id, currentAdminName);
                                    } else {
                                      rejectRepair(rep.id, currentAdminName);
                                    }
                                    showToast(`Rejected ticket ${rep.id}.`, 'error');
                                  }}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                                  title="Reject Ticket"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setSelectedRepairId(rep.id)}
                                className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-blue-600'}`}
                                title="Select / View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRepairs.length)} of {filteredRepairs.length} entries
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

        {/* Right Column: Selected Repair Details pane */}
        {selectedRepairId && selectedRepair && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 self-start animate-fade-in">
            <div className="space-y-6">
              {/* Asset header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <AssetIconBadge type={selectedAsset?.type} className="h-10 w-10 rounded-xl" iconSize="h-5 w-5" />
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{selectedAsset ? `${selectedAsset.brand} ${selectedAsset.model}` : selectedRepair.assetId}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedRepair.assetId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${getDisplayStatus(selectedRepair) === 'In Progress' ? 'bg-emerald-50 text-emerald-600' :
                      getDisplayStatus(selectedRepair) === 'Awaiting Parts' ? 'bg-amber-50 text-amber-600' :
                        getDisplayStatus(selectedRepair) === 'Completed' ? 'bg-blue-50 text-blue-600' :
                          getDisplayStatus(selectedRepair) === 'Pending' ? 'bg-slate-100 text-slate-600' :
                          'bg-slate-100 text-slate-600'
                    }`}>
                    {getDisplayStatus(selectedRepair)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedRepairId(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Close details"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <div className="text-xs space-y-3.5">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Request ID</span>
                  <span className="font-bold text-slate-700">{selectedRepair.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Reported By</span>
                  <span className="font-bold text-slate-700">{selectedReporter ? selectedReporter.name : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Request Date</span>
                  <span className="font-bold text-slate-700 text-slate-500">{selectedRepair.requestDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Issue</span>
                  <span className="font-bold text-slate-700">{selectedRepair.issue}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="font-semibold text-slate-400">Description</span>
                  <p className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed">
                    {selectedRepair.description}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Priority</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${selectedRepair.priority === 'High' ? 'bg-red-50 text-red-600' :
                      selectedRepair.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {selectedRepair.priority}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Accepted By</span>
                  {selectedRepair.acceptedBy ? (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px] flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" />
                      {selectedRepair.acceptedBy}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (isSoftwareTicket(selectedRepair)) {
                          acceptSoftwareTicket(selectedRepair.id, currentAdminName);
                        } else {
                          acceptRepair(selectedRepair.id, currentAdminName);
                        }
                        showToast(`Accepted ticket ${selectedRepair.id}! Assigned to ${currentAdminName}.`);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      + Accept Ticket
                    </button>

                  )}
                </div>
                {selectedRepair.acceptedBy && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Accepted Date</span>
                    <span className="font-bold text-slate-700">
                      {selectedRepair.acceptedDate || selectedRepair.updates.find(u => u.message.toLowerCase().includes('accepted'))?.date || 'N/A'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Assigned To</span>
                  <span className="font-bold text-slate-700">{selectedRepair.assignedTo || 'IT Support Team'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Est. Completion</span>
                  <span className="font-bold text-slate-700">{selectedRepair.estimatedCompletion}</span>
                </div>
              </div>

              {/* Updates timeline */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update History</h4>

                <div className="relative border-l border-slate-200 pl-4 space-y-5 ml-1.5 text-xs text-slate-600">
                  {selectedRepair.updates.map((upd, uIdx) => (
                    <div key={uIdx} className="relative">
                      {/* Timeline node */}
                      <span className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center shadow-sm" />
                      <p className="text-[10px] font-bold text-slate-400">{upd.date}</p>
                      <p className="mt-0.5 font-semibold text-slate-700">{upd.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRepair.status !== 'Completed' && selectedRepair.status !== 'Cancelled' && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleCancelRequest}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-red-200 hover:bg-red-500/5 text-red-500 font-bold text-xs transition-all"
                  >
                    Cancel Request
                  </button>
                  <button
                    onClick={handleOpenUpdateModal}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Add Update</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CRUD: New Repair Request Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800">New Repair Request</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Select Asset *</label>
                  <select
                    value={formAssetId}
                    onChange={e => setFormAssetId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.id} - {a.brand} {a.model} ({a.status})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Reported By *</label>
                  <select
                    value={formReporterId}
                    onChange={e => setFormReporterId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">Issue Title *</label>
                <input
                  type="text"
                  required
                  value={formIssue}
                  onChange={e => setFormIssue(e.target.value)}
                  placeholder="e.g. Screen flickering or RAM failure"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">Detailed Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Describe the failure symptoms..."
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Assigned Support</label>
                  <select
                    value={formAssignedTo}
                    onChange={e => setFormAssignedTo(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="IT Support Team">IT Support Team</option>
                    <option value="Hardware Support Team">Hardware Support Team</option>
                    <option value="External Vendor">External Vendor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Estimated Date</label>
                  <input
                    type="date"
                    value={formEstDate}
                    onChange={e => setFormEstDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10">
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Add Update / Progress logs */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsUpdateModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800">Add Repair Update</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">Update Status</label>
                <select
                  value={updateStatus}
                  onChange={e => setUpdateStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Parts">Awaiting Parts</option>
                  <option value="Completed">Completed (Marks Asset Available)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">Progress Details / Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={updateMessage}
                  onChange={e => setUpdateMessage(e.target.value)}
                  placeholder="Describe update details (e.g. replaced battery contacts, scroll wheel parts ordered)..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10">
                  Submit Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repairs;
