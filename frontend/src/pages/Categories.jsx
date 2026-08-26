import React, { useState } from 'react';
import {
  FolderKey,
  Laptop,
  Monitor,
  Mouse,
  Keyboard,
  Headphones,
  Printer,
  Cpu,
  Plus,
  Search,
  Pencil,
  Trash,
  AlertTriangle,
  X,
  Box,
  HardDrive,
  Shield,
  Grid,
  Package,
  Server,
  Layers,
  CheckCircle2,
  Briefcase,
  User,
  Building
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import MetricCard from '../components/MetricCard';
import AssetIconBadge from '../components/AssetIcon';
import Avatar from '../components/Avatar';

// Icon Map Helper with guaranteed valid Lucide components
const iconMap = {
  Laptop: Laptop,
  Monitor: Monitor,
  Mouse: Mouse,
  Keyboard: Keyboard,
  Headphones: Headphones,
  Printer: Printer,
  Cpu: Cpu,
  Briefcase: Briefcase,
  Grid: Grid,
  Box: Box,
  FolderKey: FolderKey,
  HardDrive: HardDrive,
  Shield: Shield,
  Package: Package,
  Server: Server
};

const iconOptions = [
  'Laptop', 'Monitor', 'Mouse', 'Keyboard', 'Headphones',
  'Printer', 'Cpu', 'Briefcase', 'Grid', 'Box', 'FolderKey',
  'HardDrive', 'Shield', 'Package', 'Server'
];

const Categories = () => {
  const {
    categories,
    assets,
    employees,
    addCategory,
    updateCategory,
    deleteCategory,
    showToast
  } = useAssetManager();

  // Primary Tier Entity Filter
  const [selectedEntity, setSelectedEntity] = useState('Quadrant IT Services Asset');
  const [customEntities, setCustomEntities] = useState(() => {
    try {
      const saved = localStorage.getItem('qits_custom_entities');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('qits_custom_entities', JSON.stringify(customEntities));
    } catch (e) {}
  }, [customEntities]);

  const [deletedBaseEntities, setDeletedBaseEntities] = useState([]);
  const [isAddEntityModalOpen, setIsAddEntityModalOpen] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [deletingParentEntity, setDeletingParentEntity] = useState(null);

  // Secondary Tier Hierarchy Filter:
  // For Quadrant: 'All' | 'Employee IT' | 'Organization IT' | 'Non-IT'
  // For others: 'All' | 'IT' | 'Non-IT'
  const [selectedSubTab, setSelectedSubTab] = useState('All');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [selectedCategoryModal, setSelectedCategoryModal] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('All');

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('Laptop');
  const [formGroup, setFormGroup] = useState('IT');
  const [formScope, setFormScope] = useState('Employee');
  const [formOwnerEntity, setFormOwnerEntity] = useState('Quadrant IT Services Asset');

  // Safe categories list
  const safeCategories = categories || [];

  // Helper to map category name or ownerEntity to entity
  const getCategoryEntity = (cat) => {
    if (cat.ownerEntity) return cat.ownerEntity;
    const lowerName = cat.name.toLowerCase();
    if (lowerName.startsWith('dsv')) return 'DSV Asset';
    if (lowerName.startsWith('dhl')) return 'DHL Asset';
    return 'Quadrant IT Services Asset';
  };

  const baseEntities = ['Quadrant IT Services Asset', 'DSV Asset', 'DHL Asset'];
  const allEntities = Array.from(new Set([
    ...baseEntities,
    ...customEntities,
    ...safeCategories.map(c => c.ownerEntity).filter(Boolean),
    ...(assets || []).map(a => {
      if (!a.ownership) return null;
      let o = a.ownership.trim();
      if (!o.toLowerCase().endsWith('asset') && !o.toLowerCase().endsWith('assets')) {
        o = `${o} Asset`;
      }
      return o;
    }).filter(Boolean)
  ])).filter(e => !deletedBaseEntities.includes(e));

  // Dynamic owner matching helper
  const matchOwner = (catOwnerRaw, assetOwnerRaw) => {
    if (!catOwnerRaw) return true;
    const catClean = catOwnerRaw.toLowerCase().replace(/(?:\s+assets?)$/i, '').trim();
    const assetClean = (assetOwnerRaw || 'Quadrant IT Services').toLowerCase().trim();
    if (catClean === assetClean) return true;
    if (catClean.includes('quadrant') && assetClean.includes('quadrant')) return true;
    return catClean.includes(assetClean) || assetClean.includes(catClean);
  };

  // Quadrant Categories
  const quadrantCats = safeCategories.filter(c => getCategoryEntity(c) === 'Quadrant IT Services Asset');
  const quadrantEmployeeIt = quadrantCats.filter(c => (c.group || 'IT') === 'IT' && (c.scope || 'Employee') === 'Employee');
  const quadrantOrgIt = quadrantCats.filter(c => (c.group || 'IT') === 'IT' && c.scope === 'Organization');
  const quadrantNonIt = quadrantCats.filter(c => c.group === 'Non-IT');

  // DSV Categories
  const dsvCats = safeCategories.filter(c => getCategoryEntity(c) === 'DSV Asset');
  const dsvIt = dsvCats.filter(c => (c.group || 'IT') === 'IT');
  const dsvNonIt = dsvCats.filter(c => c.group === 'Non-IT');

  // DHL Categories
  const dhlCats = safeCategories.filter(c => getCategoryEntity(c) === 'DHL Asset');

  const handleEntityChange = (entity) => {
    setSelectedEntity(entity);
    setSelectedSubTab('All');
  };

  // Filtered categories by search and hierarchy tabs
  const filteredCategories = safeCategories.filter(cat => {
    const catEntity = getCategoryEntity(cat);
    if (catEntity !== selectedEntity) return false;

    let matchesSubTab = true;
    if (selectedEntity === 'Quadrant IT Services Asset') {
      if (selectedSubTab === 'Employee IT') {
        matchesSubTab = (cat.group || 'IT') === 'IT' && (cat.scope || 'Employee') === 'Employee';
      } else if (selectedSubTab === 'Organization IT') {
        matchesSubTab = (cat.group || 'IT') === 'IT' && cat.scope === 'Organization';
      } else if (selectedSubTab === 'Non-IT') {
        matchesSubTab = cat.group === 'Non-IT';
      }
    } else {
      if (selectedSubTab === 'IT') {
        matchesSubTab = (cat.group || 'IT') === 'IT';
      } else if (selectedSubTab === 'Non-IT') {
        matchesSubTab = cat.group === 'Non-IT';
      }
    }

    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSubTab && matchesSearch;
  });

  // Helper to count assets per category name and ownership
  const getCategoryAssetCounts = (category) => {
    const safeAssets = assets || [];
    const matched = safeAssets.filter(a => {
      const nameMatch = a.type.toLowerCase().trim() === category.name.toLowerCase().trim() ||
                        category.name.toLowerCase().trim().includes(a.type.toLowerCase().trim()) ||
                        a.type.toLowerCase().trim().includes(category.name.toLowerCase().trim());
      
      const ownerMatch = matchOwner(category.ownerEntity, a.ownership);

      return nameMatch && ownerMatch;
    });
    const assigned = matched.filter(a => a.status === 'Assigned').length;
    const available = matched.filter(a => a.status === 'Available').length;
    const repair = matched.filter(a => a.status === 'Under Repair').length;
    return {
      total: matched.length,
      assigned,
      available,
      repair
    };
  };

  const handleDeleteEntity = (entity) => {
    setDeletingParentEntity(entity);
  };

  // Handlers
  const handleOpenAddModal = () => {
    setFormName('');
    setFormDescription('');
    setFormIcon(selectedSubTab === 'Non-IT' ? 'Briefcase' : 'Laptop');
    setFormGroup(selectedSubTab === 'Non-IT' ? 'Non-IT' : 'IT');
    setFormScope(selectedSubTab === 'Organization IT' ? 'Organization' : 'Employee');
    setFormOwnerEntity(selectedEntity);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }
    addCategory({
      name: formName.trim(),
      description: formDescription.trim() || `${formGroup} asset category`,
      iconName: formIcon,
      group: formGroup,
      scope: formGroup === 'IT' ? formScope : 'Organization',
      ownerEntity: formOwnerEntity
    });
    setIsAddModalOpen(false);
    showToast(`Successfully added category "${formName.trim()}" to ${formOwnerEntity.replace(' Asset', ' Assets')}!`);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormIcon(cat.iconName || 'Laptop');
    setFormGroup(cat.group || 'IT');
    setFormScope(cat.scope || 'Employee');
    setFormOwnerEntity(cat.ownerEntity || getCategoryEntity(cat));
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }
    updateCategory(editingCategory.id, {
      name: formName.trim(),
      description: formDescription.trim(),
      iconName: formIcon,
      group: formGroup,
      scope: formGroup === 'IT' ? formScope : 'Organization',
      ownerEntity: formOwnerEntity
    });
    setEditingCategory(null);
    showToast(`Successfully updated category "${formName.trim()}"!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingCategoryId) return;
    const target = safeCategories.find(c => c.id === deletingCategoryId);
    deleteCategory(deletingCategoryId);
    setDeletingCategoryId(null);
    showToast(`Successfully deleted category "${target?.name || ''}"!`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="text-xs font-semibold text-slate-400">
        <span className="hover:text-slate-600 cursor-pointer">Dashboard</span>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-600 font-bold">Categories</span>
      </div>

      {/* Category Hierarchy Header */}
      <div className="space-y-4">
        {/* Tier 1: Primary Entity Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3 overflow-x-auto">
          {allEntities.map(entity => {
            const entityCats = safeCategories.filter(c => getCategoryEntity(c) === entity);
            const isActive = selectedEntity === entity;
            
            // Format labels nicely
            let label = entity;
            if (entity === 'Quadrant IT Services Asset') label = 'Quadrant IT Services Assets';
            else if (entity === 'DSV Asset') label = 'DSV Assets';
            else if (entity === 'DHL Asset') label = 'DHL Assets';
            else if (entity.endsWith(' Asset')) label = entity.replace(' Asset', ' Assets');
            else label = `${entity} Assets`;

            return (
              <div key={entity} className="relative group/tab flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleEntityChange(entity)}
                  className={`flex items-center gap-2.5 pl-5 pr-8 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-500/10 scale-[1.01]'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {entityCats.length}
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEntity(entity);
                  }}
                  className={`absolute right-2 p-1 rounded-full hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer ${
                    isActive ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-400'
                  }`}
                  title={`Delete parent category "${label}"`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {/* Plus symbol to add new parent category/client */}
          <button
            type="button"
            onClick={() => setIsAddEntityModalOpen(true)}
            className="flex items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 text-slate-500 hover:text-[#1E3A8A] hover:border-[#1E3A8A] hover:bg-slate-50/50 shadow-xs transition-all cursor-pointer shrink-0"
            title="Add New Parent Category / Client Entity"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tier 2 & Tier 3 Sub-Hierarchy Tabs Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 w-fit shrink-0 flex-wrap">
            {selectedEntity === 'Quadrant IT Services Asset' ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab('All')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSubTab === 'All'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  All ({quadrantCats.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSubTab('Employee IT')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSubTab === 'Employee IT'
                    ? 'bg-[#1E3A8A] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Employee IT Assets</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSubTab === 'Employee IT' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {quadrantEmployeeIt.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSubTab('Organization IT')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSubTab === 'Organization IT'
                    ? 'bg-[#1E3A8A] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Building className="h-3.5 w-3.5" />
                  <span>Org IT Assets</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSubTab === 'Organization IT' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {quadrantOrgIt.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSubTab('Non-IT')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSubTab === 'Non-IT'
                    ? 'bg-[#1E3A8A] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Non-IT Assets</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSubTab === 'Non-IT' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {quadrantNonIt.length}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab('All')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSubTab === 'All'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  All ({safeCategories.filter(c => getCategoryEntity(c) === selectedEntity).length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSubTab('IT')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSubTab === 'IT'
                    ? 'bg-[#1E3A8A] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Laptop className="h-3.5 w-3.5" />
                  <span>IT Assets</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSubTab === 'IT' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {safeCategories.filter(c => getCategoryEntity(c) === selectedEntity && (c.group || 'IT') === 'IT').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSubTab('Non-IT')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSubTab === 'Non-IT'
                    ? 'bg-[#1E3A8A] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Non-IT Assets</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSubTab === 'Non-IT' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {safeCategories.filter(c => getCategoryEntity(c) === selectedEntity && c.group === 'Non-IT').length}
                  </span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search category name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
              />
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full py-12 bg-white rounded-3xl border border-slate-200 text-center">
            <FolderKey className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Categories Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or tab selection.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const IconComponent = (cat.iconName && iconMap[cat.iconName]) ? iconMap[cat.iconName] : FolderKey;
            const counts = getCategoryAssetCounts(cat);
            const isNonIT = cat.group === 'Non-IT';

            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryModal(cat);
                  setModalSearchTerm('');
                  setModalStatusFilter('All');
                }}
                className="bg-white border border-slate-200 hover:border-[#1E3A8A] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Top Bar with Icon & Actions */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="p-3.5 border border-[#e2deda] bg-[#f4f1ee] text-[#1E3A8A] rounded-2xl shrink-0 group-hover:scale-105 transition-all">
                      <IconComponent className="h-6 w-6" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${isNonIT
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        : cat.scope === 'Organization'
                          ? 'bg-purple-50 text-purple-700 border-purple-200/60'
                          : 'bg-blue-50 text-[#1E3A8A] border-blue-200/60'
                        }`}>
                        {isNonIT ? 'Non-IT Asset' : cat.scope === 'Organization' ? 'Organization IT Asset' : 'Employee IT Asset'}
                      </span>

                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(cat); }}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#1E3A8A] rounded-xl transition-all cursor-pointer"
                          title="Edit Category Name & Icon"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingCategoryId(cat.id); }}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Title, Quantity & Description */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-extrabold text-slate-800 text-base truncate">{cat.name}</h3>
                    <span className="px-2.5 py-1 bg-white text-slate-700 font-extrabold text-[11px] rounded-full border border-slate-200 shrink-0 shadow-3xs">
                      Qty: {counts.total} items
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2 min-h-[2.5rem]">
                    {cat.description || `${cat.group || 'IT'} hardware asset category.`}
                  </p>
                </div>

                {/* Counts Footer — only for IT cards, hidden by default, reveals on hover */}
                {!isNonIT && (
                  <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-24 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                    <div className="mt-4 pt-4 border-t border-slate-200/70">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/60 shadow-3xs">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                          <span className="font-extrabold text-slate-800 text-sm">{counts.total}</span>
                        </div>
                        <div className="bg-blue-50/60 p-2.5 rounded-2xl border border-blue-100/50">
                          <span className="block text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider">Assigned</span>
                          <span className="font-extrabold text-[#1E3A8A] text-sm">{counts.assigned}</span>
                        </div>
                        <div className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-100/50">
                          <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Available</span>
                          <span className="font-extrabold text-emerald-700 text-sm">{counts.available}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Category */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 z-10 space-y-4 animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base">Add New Category</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="text-xs flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1 min-h-0">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Asset Group Type *</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormGroup('IT')}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${formGroup === 'IT'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      IT Asset (Laptop, Mouse, etc.)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormGroup('Non-IT')}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${formGroup === 'Non-IT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      Non-IT (Chairs, Tables, etc.)
                    </button>
                  </div>
                </div>

                {formGroup === 'IT' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">IT Asset Scope *</label>
                    <select
                      value={formScope}
                      onChange={(e) => setFormScope(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    >
                      <option value="Employee">Employee IT Asset (Assigned to workers e.g. Laptop, Mouse)</option>
                      <option value="Organization">Organization IT Asset (Office infrastructure e.g. Printer, Server, CPU)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Owner Entity / Client *</label>
                  <select
                    value={formOwnerEntity}
                    onChange={(e) => setFormOwnerEntity(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    {allEntities.map(ent => {
                      let lbl = ent;
                      if (ent === 'Quadrant IT Services Asset') lbl = 'Quadrant IT Services Assets';
                      else if (ent === 'DSV Asset') lbl = 'DSV Assets';
                      else if (ent === 'DHL Asset') lbl = 'DHL Assets';
                      else if (ent.endsWith(' Asset')) lbl = ent.replace(' Asset', ' Assets');
                      else lbl = `${ent} Assets`;
                      
                      return (
                        <option key={ent} value={ent}>{lbl}</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder={formGroup === 'IT' ? "e.g. Tablets, Docking Stations..." : "e.g. Ergonomic Chairs, Conference Tables..."}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief summary of items in this category..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-2">Select Icon</label>
                  <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
                    {iconOptions.map((iconKey) => {
                      const IconComp = iconMap[iconKey] || FolderKey;
                      const isSelected = formIcon === iconKey;
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setFormIcon(iconKey)}
                          className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white text-slate-600 hover:bg-slate-200'
                            }`}
                          title={iconKey}
                        >
                          <IconComp className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1E3A8A] hover:bg-opacity-95 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Category */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingCategory(null)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 z-10 space-y-4 animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base">Edit Category ({editingCategory.id})</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="text-xs flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1 min-h-0">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Asset Group Type *</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormGroup('IT')}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${formGroup === 'IT'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      IT Asset
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormGroup('Non-IT')}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${formGroup === 'Non-IT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      Non-IT Asset
                    </button>
                  </div>
                </div>

                {formGroup === 'IT' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">IT Asset Scope *</label>
                    <select
                      value={formScope}
                      onChange={(e) => setFormScope(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    >
                      <option value="Employee">Employee IT Asset (Assigned to workers e.g. Laptop, Mouse)</option>
                      <option value="Organization">Organization IT Asset (Office infrastructure e.g. Printer, Server, CPU)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Owner Entity / Client *</label>
                  <select
                    value={formOwnerEntity}
                    onChange={(e) => setFormOwnerEntity(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    {allEntities.map(ent => {
                      let lbl = ent;
                      if (ent === 'Quadrant IT Services Asset') lbl = 'Quadrant IT Services Assets';
                      else if (ent === 'DSV Asset') lbl = 'DSV Assets';
                      else if (ent === 'DHL Asset') lbl = 'DHL Assets';
                      else if (ent.endsWith(' Asset')) lbl = ent.replace(' Asset', ' Assets');
                      else lbl = `${ent} Assets`;
                      
                      return (
                        <option key={ent} value={ent}>{lbl}</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-2">Select Icon</label>
                  <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
                    {iconOptions.map((iconKey) => {
                      const IconComp = iconMap[iconKey] || FolderKey;
                      const isSelected = formIcon === iconKey;
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setFormIcon(iconKey)}
                          className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white text-slate-600 hover:bg-slate-200'
                            }`}
                          title={iconKey}
                        >
                          <IconComp className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1E3A8A] hover:bg-opacity-95 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Custom Confirmation for Deletion */}
      {deletingCategoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeletingCategoryId(null)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-6 z-10 text-center space-y-4 animate-scale-in">
            <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Delete Category</h3>
              <p className="text-xs text-slate-500 mt-2">
                Are you sure you want to delete this category card? This action will remove the category tile from your management portal.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingCategoryId(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-500 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Assets Drill-down Modal (Assigned in RED, Available in GREEN) */}
      {selectedCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedCategoryModal(null)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden p-6 z-10 space-y-5 animate-scale-in max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <AssetIconBadge type={selectedCategoryModal.name} className="h-10 w-10 rounded-2xl" iconSize="h-5 w-5" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg leading-tight">
                    {selectedCategoryModal.name} Inventory
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Detailed view of all {selectedCategoryModal.name.toLowerCase()} assets
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategoryModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            {(() => {
              const catAssets = (assets || []).filter(a => {
                const nameMatch = a.type.toLowerCase().trim() === selectedCategoryModal.name.toLowerCase().trim() ||
                                  selectedCategoryModal.name.toLowerCase().trim().includes(a.type.toLowerCase().trim()) ||
                                  a.type.toLowerCase().trim().includes(selectedCategoryModal.name.toLowerCase().trim());
                
                const ownerMatch = matchOwner(selectedCategoryModal.ownerEntity, a.ownership);

                return nameMatch && ownerMatch;
              });
              const assignedCount = catAssets.filter(a => a.status === 'Assigned').length;
              const availableCount = catAssets.filter(a => a.status === 'Available').length;
              const repairCount = catAssets.filter(a => a.status === 'Under Repair').length;

              const modalFiltered = catAssets.filter(a => {
                const owner = employees.find(e => e.id === a.assignedTo);
                const searchStr = `${a.id} ${a.brand} ${a.model} ${a.serialNumber} ${a.status} ${owner ? owner.name : ''}`.toLowerCase();
                const matchesSearch = searchStr.includes(modalSearchTerm.toLowerCase());
                const matchesStatus = modalStatusFilter === 'All' ? true : a.status === modalStatusFilter;
                return matchesSearch && matchesStatus;
              });

              return (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                    {/* Status Filter Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setModalStatusFilter('All')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${modalStatusFilter === 'All'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        All ({catAssets.length})
                      </button>

                      {/* ASSIGNED in RED */}
                      <button
                        onClick={() => setModalStatusFilter('Assigned')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${modalStatusFilter === 'Assigned'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                      >
                        Assigned ({assignedCount})
                      </button>

                      {/* AVAILABLE in GREEN */}
                      <button
                        onClick={() => setModalStatusFilter('Available')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${modalStatusFilter === 'Available'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                      >
                        Available ({availableCount})
                      </button>

                      {repairCount > 0 && (
                        <button
                          onClick={() => setModalStatusFilter('Under Repair')}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${modalStatusFilter === 'Under Repair'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                          Under Repair ({repairCount})
                        </button>
                      )}
                    </div>

                    {/* Search inside Modal */}
                    <div className="relative w-full sm:w-60">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-3.5 w-3.5" />
                      </span>
                      <input
                        type="text"
                        value={modalSearchTerm}
                        onChange={e => setModalSearchTerm(e.target.value)}
                        placeholder={`Search ${selectedCategoryModal.name.toLowerCase()}s...`}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Modal Table Container */}
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl flex-1">
                    <div className="min-w-[800px] h-full overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Asset ID</th>
                            <th className="py-3 px-4">Brand & Model</th>
                            <th className="py-3 px-4">Serial Number</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Assigned To</th>
                            <th className="py-3 px-4">Purchase Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                          {modalFiltered.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-10 text-center text-slate-400 font-semibold">
                                No matching {selectedCategoryModal.name.toLowerCase()} assets found.
                              </td>
                            </tr>
                          ) : (
                            modalFiltered.map(asset => {
                              const owner = employees.find(e => e.id === asset.assignedTo);
                              const isAssigned = asset.status === 'Assigned';
                              const isAvailable = asset.status === 'Available';

                              return (
                                <tr
                                  key={asset.id}
                                  className={`transition-all ${isAssigned
                                    ? 'bg-blue-50/10 hover:bg-blue-50/25'
                                    : isAvailable
                                      ? 'bg-emerald-50/20 hover:bg-emerald-50/45'
                                      : asset.status === 'Under Repair'
                                        ? 'bg-rose-50/20 hover:bg-rose-50/40'
                                        : 'hover:bg-slate-50'
                                    }`}
                                >
                                  <td className="py-3 px-4 font-extrabold text-blue-600">
                                    <div className="flex items-center gap-2">
                                      <AssetIconBadge type={asset.type} className="h-6 w-6 rounded-md" iconSize="h-3.5 w-3.5" />
                                      <span>{asset.id}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-bold text-slate-800">{asset.brand} {asset.model}</td>
                                  <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{asset.serialNumber}</td>

                                  {/* Status badge: ASSIGNED in RED, AVAILABLE in GREEN */}
                                  <td className="py-3 px-4">
                                    {isAssigned ? (
                                      <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase bg-blue-50 text-[#1E3A8A] border border-blue-200/60 shadow-2xs inline-block">
                                        Assigned
                                      </span>
                                    ) : isAvailable ? (
                                      <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-2xs inline-block">
                                        Available
                                      </span>
                                    ) : asset.status === 'Under Repair' ? (
                                      <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase bg-rose-50 text-rose-600 border border-rose-200/60 shadow-2xs inline-block">
                                        Under Repair
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase bg-slate-900 text-slate-50 border border-slate-950 inline-block">
                                        {asset.status}
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3 px-4">
                                    {owner ? (
                                      <div className="flex items-center gap-1.5">
                                        <Avatar name={owner.name} avatar={owner.avatar} className="h-5 w-5 rounded-full" textSize="text-[7px]" />
                                        <span className="font-semibold text-slate-800">{owner.name}</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 font-medium italic">Unassigned</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-slate-500 font-semibold text-[11px]">{asset.purchaseDate || '10 May 2024'}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* Modal: Add Parent Client Entity */}
      {isAddEntityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddEntityModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-6 z-10 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">Add New Parent Category</h3>
              <button
                onClick={() => setIsAddEntityModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                let name = newEntityName.trim();
                // strip trailing "assets" or "asset" case-insensitively if present
                name = name.replace(/(?:\s+assets?)$/i, '');
                const formatted = name + ' Asset';
                if (!customEntities.includes(formatted) && !baseEntities.includes(formatted)) {
                  setCustomEntities([...customEntities, formatted]);
                  setSelectedEntity(formatted);
                  setSelectedSubTab('All');
                  showToast(`Successfully added parent category "${name} Assets"!`);
                } else {
                  setSelectedEntity(formatted);
                }
                setNewEntityName('');
                setIsAddEntityModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Parent Category / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DHL, TCS, Wipro..."
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEntityModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white font-bold rounded-xl hover:bg-opacity-95 shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                >
                  Add Parent Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Delete Parent Category Confirmation */}
      {deletingParentEntity && (() => {
        const entity = deletingParentEntity;
        const label = entity === 'Quadrant IT Services Asset' 
          ? 'Quadrant IT Services Assets' 
          : entity === 'DSV Asset'
            ? 'DSV Assets'
            : entity === 'DHL Asset'
              ? 'DHL Assets'
              : entity.endsWith(' Asset') ? entity.replace(' Asset', ' Assets') : `${entity} Assets`;
              
        const count = safeCategories.filter(c => getCategoryEntity(c) === entity).length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeletingParentEntity(null)} />
            <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-3xl shadow-2xl p-6 z-10 space-y-4 animate-scale-in text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-base">Delete Parent Category</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Are you sure you want to delete <span className="font-extrabold text-slate-700">"{label}"</span>?
                </p>
                {count > 0 && (
                  <p className="text-[10px] text-red-500 font-extrabold bg-red-50/50 p-2 rounded-xl border border-red-100/60 mt-2">
                    Warning: This will also delete all {count} category folders under it!
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingParentEntity(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Delete all categories belonging to this entity
                    const toDelete = safeCategories.filter(c => getCategoryEntity(c) === entity);
                    toDelete.forEach(c => {
                      deleteCategory(c.id);
                    });

                    // Remove from custom entities and base entities
                    setCustomEntities(prev => prev.filter(e => e !== entity));
                    if (baseEntities.includes(entity)) {
                      setDeletedBaseEntities(prev => [...prev, entity]);
                    }

                    // If the active entity is the one being deleted, switch to the first remaining one
                    const remainingEntities = allEntities.filter(e => e !== entity);
                    if (selectedEntity === entity && remainingEntities.length > 0) {
                      setSelectedEntity(remainingEntities[0]);
                      setSelectedSubTab('All');
                    }

                    setDeletingParentEntity(null);
                    showToast(`Successfully deleted parent category "${label}"!`);
                  }}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md shadow-red-500/10 transition-all cursor-pointer text-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Categories;
