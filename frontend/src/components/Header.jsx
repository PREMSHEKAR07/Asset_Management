import React, { useState, useRef, useEffect } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, Check, Monitor, Laptop, Users, FolderTree, Key, Wrench, X, ChevronRight } from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import Avatar from './Avatar';
import QuadrantLogo from './QuadrantLogo';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { assets, employees, categories, licenses, repairs, notifications, markNotificationAsRead, markAllNotificationsAsRead, currentUser, loginUser, showToast } = useAssetManager();
  const [showNotifications, setShowNotifications] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Outside click listener for notification dropdown & search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        if (showNotifications) {
          markAllNotificationsAsRead();
        }
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, markAllNotificationsAsRead]);

  // Global search filtering across all entities
  const cleanQuery = searchQuery.trim().toLowerCase();

  const matchedAssets = cleanQuery ? (assets || []).filter(a => {
    const owner = (employees || []).find(e => e.id === a.assignedTo);
    const searchStr = `${a.id} ${a.type} ${a.brand} ${a.model} ${a.serialNumber} ${a.status} ${a.ownership || ''} ${owner ? owner.name : ''}`.toLowerCase();
    return searchStr.includes(cleanQuery);
  }).slice(0, 4) : [];

  const matchedEmployees = cleanQuery ? (employees || []).filter(e => {
    const searchStr = `${e.id} ${e.name} ${e.email} ${e.department} ${e.designation} ${e.status || ''}`.toLowerCase();
    return searchStr.includes(cleanQuery);
  }).slice(0, 4) : [];

  const matchedCategories = cleanQuery ? (categories || []).filter(c => {
    const searchStr = `${c.name} ${c.group || ''} ${c.scope || ''} ${c.description || ''}`.toLowerCase();
    return searchStr.includes(cleanQuery);
  }).slice(0, 3) : [];

  const matchedLicenses = cleanQuery ? (licenses || []).filter(l => {
    const searchStr = `${l.name || l.softwareName || ''} ${l.key || l.licenseKey || ''} ${l.vendor || ''} ${l.category || ''}`.toLowerCase();
    return searchStr.includes(cleanQuery);
  }).slice(0, 3) : [];

  const matchedRepairs = cleanQuery ? (repairs || []).filter(r => {
    const searchStr = `${r.id} ${r.issue} ${r.status} ${r.assetId || ''}`.toLowerCase();
    return searchStr.includes(cleanQuery);
  }).slice(0, 3) : [];

  const totalMatchCount = matchedAssets.length + matchedEmployees.length + matchedCategories.length + matchedLicenses.length + matchedRepairs.length;

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    if (matchedAssets.length > 0) {
      navigate(`/assets?search=${encodeURIComponent(searchQuery.trim())}`);
    } else if (matchedEmployees.length > 0) {
      navigate(`/employees?search=${encodeURIComponent(searchQuery.trim())}`);
    } else if (matchedLicenses.length > 0) {
      navigate(`/licenses?search=${encodeURIComponent(searchQuery.trim())}`);
    } else if (matchedRepairs.length > 0) {
      navigate(`/repairs?search=${encodeURIComponent(searchQuery.trim())}`);
    } else if (matchedCategories.length > 0) {
      navigate('/categories');
    } else {
      navigate(`/assets?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Map route paths to human-friendly titles matching the mockup headers
  const getPageTitle = () => {
    if (currentUser && currentUser.role === 'Employee' && location.pathname === '/employee') {
      return (
        <span className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Welcome back,</span>
          <span className="text-slate-800 font-extrabold">{currentUser.name}</span>
          <span className="inline-block animate-bounce text-slate-800">👋</span>
        </span>
      );
    }
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/employees': return 'Employees';
      case '/assets': return 'Assets';
      case '/categories': return 'Categories';
      case '/assign-assets': return 'Assign Assets';
      case '/return-assets': return 'Return Assets';
      case '/repairs': return 'Repairs';
      case '/reports': return 'Reports';
      case '/settings': return 'Settings';
      case '/activity-log': return 'Activity Log';
      case '/employee': return 'Dashboard';
      case '/employee/settings': return 'Settings';
      default: return 'Quadrant IT Services';
    }
  };

  const isNotificationUnread = (notif) => {
    if (!notif) return false;
    if (notif.read === true || notif.read === 1 || notif.read === '1' || notif.read === 'true') {
      return false;
    }
    return true;
  };

  const unreadCount = (notifications || []).filter(isNotificationUnread).length;
  const isEmployee = currentUser?.role === 'Employee';

  return (
    <header className="bg-white border-b border-[#E6DED8] h-14 px-5 flex items-center justify-between sticky top-0 z-50 shadow-xs relative select-none">
      {/* Brand & Left Title */}
      <div className="flex items-center">
        {isEmployee ? (
          /* Branding Block */
          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => navigate('/employee')}>
            <div className="shrink-0 overflow-hidden rounded-xl bg-white border border-[#E6DED8] p-0.5">
              <QuadrantLogo className="h-7 w-7 object-cover" />
            </div>
            <div className="text-left">
              <h1 className="font-extrabold text-xs text-[#1F2937] leading-tight">Quadrant</h1>
              <p className="text-[9px] text-[#6B7280] font-semibold uppercase tracking-wider">IT Services</p>
            </div>
          </div>
        ) : (
          <>
            {/* Page Title & Hamburger */}
            <button className="text-slate-500 hover:text-slate-800 lg:hidden mr-2 cursor-pointer">
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-extrabold text-[#1F2937] tracking-tight">{getPageTitle()}</h2>
          </>
        )}
      </div>



      {/* Operations Panel */}
      <div className="flex items-center gap-6">
        {/* Search Input (Only for Admins) */}
        {!isEmployee && (
          <div className="relative w-80 lg:w-96 hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setIsSearchOpen(true);
                  }}
                  placeholder="Search assets, employees, licenses, repairs..."
                  className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Global Search Results Dropdown Panel */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[460px] overflow-y-auto animate-scale-in">
                {totalMatchCount === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                    No results matching "<span className="text-slate-700 font-bold">{searchQuery}</span>"
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {/* Assets Group */}
                    {matchedAssets.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="px-3 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          <span className="flex items-center gap-1.5"><Laptop className="h-3 w-3 text-blue-500" /> Assets</span>
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded">{matchedAssets.length}</span>
                        </div>
                        {matchedAssets.map((asset) => (
                          <div
                            key={asset.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/assets?search=${encodeURIComponent(asset.id)}`);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                {asset.id} - {asset.brand} {asset.model}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {asset.type} • {asset.serialNumber}
                              </p>
                            </div>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                              asset.status === 'Assigned' ? 'bg-emerald-50 text-emerald-600' :
                              asset.status === 'Available' ? 'bg-blue-50 text-blue-600' :
                              asset.status === 'Under Repair' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {asset.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Employees Group */}
                    {matchedEmployees.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="px-3 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          <span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-emerald-500" /> Employees</span>
                          <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded">{matchedEmployees.length}</span>
                        </div>
                        {matchedEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/employees?search=${encodeURIComponent(emp.name)}`);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
                                {emp.name} ({emp.id})
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {emp.department} • {emp.designation}
                              </p>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              {emp.role || 'Employee'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Categories Group */}
                    {matchedCategories.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="px-3 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          <span className="flex items-center gap-1.5"><FolderTree className="h-3 w-3 text-violet-500" /> Categories</span>
                          <span className="bg-violet-50 text-violet-600 px-1.5 py-0.2 rounded">{matchedCategories.length}</span>
                        </div>
                        {matchedCategories.map((cat) => (
                          <div
                            key={cat.id || cat.name}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate('/categories');
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-violet-600 transition-colors truncate">
                                {cat.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {cat.group || 'IT'} Category • {cat.scope || 'Employee'}
                              </p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Licenses Group */}
                    {matchedLicenses.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="px-3 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          <span className="flex items-center gap-1.5"><Key className="h-3 w-3 text-amber-500" /> Licenses</span>
                          <span className="bg-amber-50 text-amber-600 px-1.5 py-0.2 rounded">{matchedLicenses.length}</span>
                        </div>
                        {matchedLicenses.map((lic) => (
                          <div
                            key={lic.id || lic.name}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/licenses?search=${encodeURIComponent(lic.name || lic.softwareName || '')}`);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors truncate">
                                {lic.name || lic.softwareName}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {lic.vendor || 'Vendor'} • {lic.category || 'Software'}
                              </p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Repairs Group */}
                    {matchedRepairs.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="px-3 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          <span className="flex items-center gap-1.5"><Wrench className="h-3 w-3 text-rose-500" /> Repair Tickets</span>
                          <span className="bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded">{matchedRepairs.length}</span>
                        </div>
                        {matchedRepairs.map((rep) => (
                          <div
                            key={rep.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/repairs?search=${encodeURIComponent(rep.id)}`);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors truncate">
                                {rep.id} - {rep.issue}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                Asset: {rep.assetId || 'N/A'}
                              </p>
                            </div>
                            <span className="text-[9px] font-extrabold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full shrink-0">
                              {rep.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Action */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-all cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>View full results in Assets list</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              const willShow = !showNotifications;
              setShowNotifications(willShow);
              if (!willShow) {
                markAllNotificationsAsRead();
              }
            }}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all relative border border-slate-100 cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} New
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-4 transition-all hover:bg-slate-50 flex items-start gap-3 cursor-pointer ${isNotificationUnread(notif) ? 'bg-blue-50/30 font-medium' : ''}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${notif.type === 'success' ? 'bg-green-500' :
                          notif.type === 'warning' ? 'bg-amber-500' :
                            notif.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    markAllNotificationsAsRead();
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-all cursor-pointer"
                >
                  Close panel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        {currentUser && (
          <div className="flex items-center gap-4 border-l border-slate-200 pl-6 animate-fade-in relative">
            {!isEmployee ? (
              <div
                onClick={() => navigate('/settings')}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                title="Settings"
              >
                <Avatar name={currentUser.name} avatar={currentUser.avatar} className="h-9 w-9 rounded-xl ring-2 ring-blue-500/20" />
              </div>
            ) : (
              <div
                onClick={() => navigate('/employee/settings')}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                title="View & Edit Profile"
              >
                <Avatar name={currentUser.name} avatar={currentUser.avatar} className="h-10 w-10 rounded-xl ring-2 ring-slate-100" />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
