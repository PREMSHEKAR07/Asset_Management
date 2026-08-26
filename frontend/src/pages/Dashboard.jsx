import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TrendingUp,
  X
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useAssetManager } from '../hooks/useAssetManager';
import MetricCard from '../components/MetricCard';
import Avatar from '../components/Avatar';
import AssetIconBadge from '../components/AssetIcon';
import AdminPasswordModal from '../components/AdminPasswordModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    assets,
    employees,
    repairs,
    categories,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    addAsset,
    updateAsset,
    deleteAsset,
    showToast
  } = useAssetManager();

  const [passAuthModal, setPassAuthModal] = useState({ isOpen: false, title: '', actionLabel: '', onSuccess: null });

  // Search, Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const itemsPerPage = 5;

  // Announcement Modal states
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState('General');
  const [annPriority, setAnnPriority] = useState('Medium');

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!annTitle.trim()) {
      showToast('Announcement title is required.', 'error');
      return;
    }
    if (!annMessage.trim()) {
      showToast('Announcement message is required.', 'error');
      return;
    }
    addAnnouncement({
      title: annTitle.trim(),
      message: annMessage.trim(),
      type: annType,
      priority: annPriority
    });
    setAnnTitle('');
    setAnnMessage('');
    setIsAnnModalOpen(false);
    showToast(`Successfully broadcasted announcement "${annTitle.trim()}" to all employee dashboards!`);
  };
  const categoryTypes = categories && categories.length > 0
    ? categories
    : [
      { name: 'Laptop', group: 'IT' },
      { name: 'Monitor', group: 'IT' },
      { name: 'Mouse', group: 'IT' },
      { name: 'Keyboard', group: 'IT' },
      { name: 'Headphones', group: 'IT' },
      { name: 'Printer', group: 'IT' },
      { name: 'Chairs', group: 'Non-IT' },
      { name: 'Tables', group: 'Non-IT' },
      { name: 'Whiteboards', group: 'Non-IT' },
      { name: 'Storage Cabinets', group: 'Non-IT' }
    ];

  const itCategoryList = categoryTypes.filter(c => (c.group || 'IT') === 'IT');
  const nonItCategoryList = categoryTypes.filter(c => c.group === 'Non-IT');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Form states
  const [formType, setFormType] = useState('Laptop');
  const [formBrand, setFormBrand] = useState('Dell');
  const [formModel, setFormModel] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formStatus, setFormStatus] = useState('Available');
  const [formAssigned, setFormAssigned] = useState('');

  // 1. Calculate dynamic statistics
  const totalCount = assets.length;
  const assignedCount = assets.filter(a => a.status === 'Assigned').length;
  const availableCount = assets.filter(a => a.status === 'Available').length;
  const repairCount = assets.filter(a => a.status === 'Under Repair').length;
  const disposedCount = assets.filter(a => a.status === 'Disposed').length;

  // 2. Prepare Recharts Donut data
  const chartData = [
    { name: 'Assigned', value: assignedCount, color: '#1E3A8A' },
    { name: 'Available', value: availableCount, color: '#10b981' },
    { name: 'Under Repair', value: repairCount, color: '#f59e0b' },
    { name: 'Disposed', value: disposedCount, color: '#ef4444' }
  ];

  // 3. Filtered assigned assets for Recent Asset Assignments table (sorted by most recent assignment on top)
  const assignedAssets = assets
    .filter(a => a.status === 'Assigned' && a.assignedTo)
    .sort((a, b) => {
      const timeA = a.assignedAt ? new Date(a.assignedAt).getTime() : new Date(a.assignedDate || a.purchaseDate || '2020-01-01').getTime();
      const timeB = b.assignedAt ? new Date(b.assignedAt).getTime() : new Date(b.assignedDate || b.purchaseDate || '2020-01-01').getTime();
      return timeB - timeA;
    });

  const filteredAssets = assignedAssets.filter(asset => {
    const owner = employees.find(e => e.id === asset.assignedTo);
    const searchString = `${asset.id} ${asset.type} ${asset.brand} ${asset.model} ${asset.serialNumber} ${owner ? owner.name : ''} ${owner ? owner.department : ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 4. Modal Handlers
  const handleOpenAddModal = () => {
    setFormType('Laptop');
    setFormBrand('Dell');
    setFormModel('');
    setFormSerial('');
    setFormStatus('Available');
    setFormAssigned('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newAsset = {
      type: formType,
      brand: formBrand,
      model: formModel,
      serialNumber: formSerial,
      status: formStatus,
      assignedTo: formStatus === 'Assigned' && formAssigned ? formAssigned : null,
      purchaseDate: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      warrantyEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    addAsset(newAsset);
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (asset) => {
    setSelectedAsset(asset);
    setFormType(asset.type);
    setFormBrand(asset.brand);
    setFormModel(asset.model);
    setFormSerial(asset.serialNumber);
    setFormStatus(asset.status);
    setFormAssigned(asset.assignedTo || '');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateAsset({
      ...selectedAsset,
      type: formType,
      brand: formBrand,
      model: formModel,
      serialNumber: formSerial,
      status: formStatus,
      assignedTo: formStatus === 'Assigned' && formAssigned ? formAssigned : null
    });
    setIsEditModalOpen(false);
  };

  const handleOpenViewModal = (asset) => {
    setSelectedAsset(asset);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <MetricCard icon={Laptop} title="Total Assets" value={totalCount} color="blue" linkTo="/assets?status=All" showLink />
        <MetricCard icon={CheckCircle} title="Assigned Assets" value={assignedCount} color="green" linkTo="/assets?status=Assigned" showLink />
        <MetricCard icon={TrendingUp} title="Available Assets" value={availableCount} color="orange" linkTo="/assets?status=Available" showLink />
        <MetricCard icon={Wrench} title="Under Repair" value={repairCount} color="red" linkTo="/assets?status=Under Repair" showLink />
        <MetricCard icon={Trash2} title="Disposed Assets" value={disposedCount} color="purple" linkTo="/assets?status=Disposed" showLink />
      </div>

      {/* Charts & Status Section: Only 2 Cards (Assets Overview & Announcements) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Assets Overview (Recharts Donut Chart) */}
        <div
          onClick={() => navigate('/categories')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between cursor-pointer transition-all min-h-[340px]"
          title="Click to view Categories & Quantities"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">Assets Overview</h3>
            <span className="text-[10px] font-extrabold text-[#1E3A8A] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/60">View Categories &rarr;</span>
          </div>
          <div className="relative h-56 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute text-center">
              <span className="text-2xl font-extrabold text-slate-800">{totalCount}</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            {chartData.map((item, idx) => (
              <div 
                key={idx} 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/assets?status=${encodeURIComponent(item.name)}`);
                }}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-100 cursor-pointer transition-all"
                title={`View ${item.name} assets`}
              >
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] font-semibold text-slate-600 truncate">{item.name}</span>
                <span className="text-[11px] font-bold text-slate-800 ml-auto">
                  {Math.round((item.value / (totalCount || 1)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Announcements List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 min-h-[340px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Announcements</h3>
              <span className="px-2 py-0.5 text-[9px] font-extrabold text-blue-700 bg-blue-50 rounded-full border border-blue-100">
                {announcements?.length || 0}
              </span>
            </div>
            <button
              onClick={() => setIsAnnModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Post New</span>
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px] pr-1">
            {(!announcements || announcements.length === 0) ? (
              <p className="text-xs text-slate-400 font-semibold py-8 text-center">No announcements posted yet.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-1 relative group hover:bg-slate-100/60 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold text-slate-800 truncate pr-2">{ann.title}</h4>
                    <button
                      onClick={() => {
                        deleteAnnouncement(ann.id);
                        showToast(`Deleted announcement "${ann.title}"`, 'info');
                      }}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0 cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{ann.message}</p>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold pt-1.5 border-t border-slate-200/40">
                    <span>{ann.date}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${ann.priority === 'High' || ann.priority === 'Urgent' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                      {ann.type || 'General'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Asset Assignments */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Asset Assignments</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Active hardware assignments & employee allocations</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search assigned assets..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">Asset ID</th>
                <th className="pb-3 px-4">Device & Model</th>
                <th className="pb-3 px-4">Serial Number</th>
                <th className="pb-3 px-4">Assigned To</th>
                <th className="pb-3 px-4">Assign Date</th>
                <th className="pb-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                    No active asset assignments found.
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => {
                  const owner = employees.find(e => e.id === asset.assignedTo);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-3.5 pr-4 font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => handleOpenViewModal(asset)}>
                        {asset.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <AssetIconBadge type={asset.type} className="h-8 w-8 rounded-lg shrink-0" iconSize="h-4 w-4" />
                          <div>
                            <p className="font-extrabold text-slate-800">{asset.brand} {asset.model}</p>
                            <span className="text-[9px] font-bold text-blue-600 uppercase">{asset.type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{asset.serialNumber}</td>
                      <td className="py-3.5 px-4">
                        {owner ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={owner.name} avatar={owner.avatar} className="h-6 w-6 rounded-full shrink-0" textSize="text-[8px]" />
                            <div>
                              <p className="font-bold text-slate-800 leading-none">{owner.name}</p>
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{owner.department}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{asset.assignedDate || asset.purchaseDate || 'Jul 21, 2026'}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide inline-block text-center min-w-[85px] bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                          Assigned
                        </span>
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAssets.length)} of {filteredAssets.length} entries
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

      {/* CRUD Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800">Add New Asset</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Type *</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <optgroup label="IT Assets">
                      {itCategoryList.map(cat => (
                        <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </optgroup>
                    {nonItCategoryList.length > 0 && (
                      <optgroup label="Non-IT Assets">
                        {nonItCategoryList.map(cat => (
                          <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Brand *</label>
                  <select
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {["Dell", "Logitech", "HP", "Apple", "Samsung", "Lenovo", "Sony", "Epson", "Herman Miller", "Steelcase", "Ikea", "Godrej", "Featherlite", "Generic"].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
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
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>
                {formStatus === 'Assigned' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Assign To Employee *</label>
                    <select
                      required
                      value={formAssigned}
                      onChange={e => setFormAssigned(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
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
          <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800">Edit Asset {selectedAsset?.id}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Asset Type *</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <optgroup label="IT Assets">
                      {itCategoryList.map(cat => (
                        <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </optgroup>
                    {nonItCategoryList.length > 0 && (
                      <optgroup label="Non-IT Assets">
                        {nonItCategoryList.map(cat => (
                          <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Brand *</label>
                  <select
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {["Dell", "Logitech", "HP", "Apple", "Samsung", "Lenovo", "Sony", "Epson", "Herman Miller", "Steelcase", "Ikea", "Godrej", "Featherlite", "Generic"].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
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
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>
                {formStatus === 'Assigned' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Assign To Employee *</label>
                    <select
                      required
                      value={formAssigned}
                      onChange={e => setFormAssigned(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                      ))}
                    </select>
                  </div>
                )}
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

      {/* CRUD View Asset Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 z-10 flex flex-col items-center">
            <button onClick={() => setIsViewModalOpen(false)} className="absolute top-5 right-5 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
            <AssetIconBadge type={selectedAsset?.type} className="h-24 w-24 rounded-3xl mt-4" iconSize="h-12 w-12" />
            <h3 className="font-extrabold text-slate-800 text-lg mt-4">{selectedAsset?.brand} {selectedAsset?.model}</h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold mt-1 tracking-wide uppercase">{selectedAsset?.type}</span>

            <div className="w-full mt-6 grid grid-cols-2 gap-x-5 gap-y-3 text-[11px] text-slate-700 overflow-y-auto max-h-[45vh] pr-1">
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Asset ID</span>
                <span className="font-extrabold text-slate-800 mt-0.5">{selectedAsset?.id}</span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Asset Type</span>
                <span className="font-bold text-slate-800 mt-0.5">{selectedAsset?.type}</span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Asset Name</span>
                <span className="font-bold text-slate-800 mt-0.5 truncate" title={selectedAsset?.model}>{selectedAsset?.model}</span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Brand</span>
                <span className="font-bold text-slate-800 mt-0.5">{selectedAsset?.brand}</span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Serial Number</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 truncate" title={selectedAsset?.serialNumber}>{selectedAsset?.serialNumber}</span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Charger Serial</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 truncate" title={selectedAsset?.chargerSerialNumber}>{selectedAsset?.chargerSerialNumber || 'N/A'}</span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Status</span>
                <span className="mt-0.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                    selectedAsset?.status === 'Assigned' ? 'bg-blue-50 text-[#1E3A8A] border-blue-200/60' :
                    selectedAsset?.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/60' :
                    selectedAsset?.status === 'Under Repair' ? 'bg-rose-50 text-rose-600 border-rose-100/60' :
                    'bg-slate-900 text-slate-50 border-slate-900'
                  }`}>{selectedAsset?.status}</span>
                </span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Assigned To</span>
                <span className="font-bold text-slate-800 mt-0.5 truncate" title={selectedAsset?.assignedTo ? `${employees.find(e => e.id === selectedAsset.assignedTo)?.name} (${selectedAsset.assignedTo})` : 'None'}>
                  {selectedAsset?.assignedTo 
                    ? `${employees.find(e => e.id === selectedAsset.assignedTo)?.name}`
                    : 'None'
                  }
                </span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Condition</span>
                <span className="mt-0.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                    (selectedAsset?.condition || 'Good') === 'Good' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/60' :
                    (selectedAsset?.condition || 'Good') === 'Working' ? 'bg-blue-50 text-blue-600 border-blue-100/60' :
                    'bg-rose-50 text-rose-600 border-rose-100/60'
                  }`}>{selectedAsset?.condition || 'Good'}</span>
                </span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Purchase Date</span>
                <span className="font-bold text-slate-800 mt-0.5">{selectedAsset?.purchaseDate}</span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Warranty Status</span>
                <span className="mt-0.5">
                  {(() => {
                    if (!selectedAsset || !selectedAsset.warrantyEndDate || selectedAsset.warrantyEndDate === 'N/A') {
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
                      if (!isNaN(parsed.getTime())) {
                        warrantyDate = parsed;
                      }
                    }
                    const isWarrantyActive = warrantyDate ? warrantyDate > new Date() : true;
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        isWarrantyActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100/60' : 'bg-rose-50 text-rose-600 border-rose-100/60'
                      }`}>{isWarrantyActive ? 'Active' : 'Expired'}</span>
                    );
                  })()}
                </span>
              </div>
              <div className="flex flex-col border-b border-slate-100/70 pb-1">
                <span className="font-semibold text-slate-400 text-[10px]">Assigned Date</span>
                <span className="font-bold text-slate-800 mt-0.5">{selectedAsset?.assignedDate || 'N/A'}</span>
              </div>
            </div>

            <button
              onClick={() => setIsViewModalOpen(false)}
              className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-xs transition-all"
            >
              Close Details
            </button>
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
                onClick={() => {
                  const targetId = deleteConfirmId;
                  setDeleteConfirmId(null);
                  setPassAuthModal({
                    isOpen: true,
                    title: "Confirm Delete Asset",
                    actionLabel: `Delete Asset (${targetId})`,
                    onSuccess: () => {
                      deleteAsset(targetId);
                      showToast(`Successfully deleted asset ${targetId}!`);
                      setPassAuthModal({ isOpen: false, title: '', actionLabel: '', onSuccess: null });
                    }
                  });
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Post New Announcement */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAnnModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 z-10 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">Post Announcement for Employees</h3>
              <button
                onClick={() => setIsAnnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Maintenance Schedule / Asset Audit Notice..."
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Category Type</label>
                  <select
                    value={annType}
                    onChange={(e) => setAnnType(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="General">General Notice</option>
                    <option value="Security">Security Alert</option>
                    <option value="Policy">Policy Update</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Priority Level</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Announcement Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed message to broadcast to all employee portals..."
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Broadcast Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
