import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Monitor,
  ClipboardCopy,
  RotateCcw,
  Wrench,
  BarChart3,
  Settings,
  History,
  Headphones,
  FolderKey,
  Key,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import QuadrantLogo from './QuadrantLogo';

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { currentUser, logoutUser } = useAssetManager();
  const navigate = useNavigate();

  const adminMenuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Assets', path: '/assets', icon: Monitor },
    { name: 'Categories', path: '/categories', icon: FolderKey },
    { name: 'Licenses', path: '/licenses', icon: Key },
    { name: 'Assign Assets', path: '/assign-assets', icon: ClipboardCopy },
    { name: 'Return Assets', path: '/return-assets', icon: RotateCcw },
    { name: 'Repairs', path: '/repairs', icon: Wrench },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Activity Log', path: '/activity-log', icon: History }
  ];

  const employeeMenuItems = [
    { name: 'Dashboard', path: '/employee', icon: LayoutDashboard },
    { name: 'Settings', path: '/employee/settings', icon: Settings }
  ];

  // Pick menu based on active role
  const isEmployee = currentUser?.role === 'Employee';
  const menuItems = isEmployee ? employeeMenuItems : adminMenuItems;

  const handleLogoutClick = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-[220px]'
        } bg-white border-r border-[#E6DED8] text-[#6B7280] flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out select-none z-30`}
    >
      {/* Brand Header */}
      <div
        className={`px-4 py-3.5 flex items-center justify-between border-b border-[#E6DED8] ${isCollapsed ? 'flex-col gap-3 justify-center px-2 py-3' : ''
          }`}
      >
        <div
          onClick={() => navigate(isEmployee ? '/employee' : '/')}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
          title="Go to Home / Dashboard"
        >
          <div className="shrink-0 overflow-hidden rounded-xl bg-white border border-[#E6DED8] p-0.5">
            <QuadrantLogo className="h-8 w-8 object-cover" />
          </div>
          {!isCollapsed && (
            <div className="text-left animate-fade-in min-w-0">
              <h1 className="font-extrabold text-[#1F2937] text-sm leading-tight tracking-wide truncate">Quadrant</h1>
              <p className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider truncate">
                IT Services
              </p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg bg-white hover:bg-[#EEF4FF] text-[#64748B] hover:text-[#1E3A8A] border border-[#E6DED8] transition-all cursor-pointer shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/' || item.path === '/employee'}
            title={isCollapsed ? item.name : ''}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-[12px] font-semibold transition-all ${isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
              } ${isActive
                ? 'bg-[#1E3A8A] text-white shadow-xs font-bold'
                : 'text-[#6B7280] hover:bg-[#EEF4FF] hover:text-[#1E3A8A]'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="animate-fade-in whitespace-nowrap truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer Operations */}
      <div className="p-3 space-y-3 border-t border-[#E6DED8]">
        {/* Support Help Center Card */}
        {!isCollapsed && (
          <div className="p-3 bg-white rounded-xl flex gap-2.5 border border-[#E6DED8] animate-fade-in">
            <Headphones className="h-4 w-4 text-[#64748B] shrink-0 mt-0.5" />
            <div className="text-left min-w-0">
              <h4 className="text-[11px] font-bold text-[#1F2937] truncate">Need Help?</h4>
              <p className="text-[9px] text-[#6B7280] truncate">Contact Support</p>
              <a
                href="mailto:support@itasset.com"
                className="text-[9px] text-[#1E3A8A] hover:underline block mt-0.5 truncate"
              >
                support@itasset.com
              </a>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogoutClick}
          title={isCollapsed ? "Logout" : ""}
          className={`w-full flex items-center text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded-xl text-[12px] font-semibold transition-all cursor-pointer ${isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
            }`}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
