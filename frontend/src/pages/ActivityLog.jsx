import React, { useState } from 'react';
import { 
  Search, 
  LogIn, 
  Wrench, 
  Lock, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck,
  Undo2,
  Trash2
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';

const ActivityLog = () => {
  const { activity } = useAssetManager();

  // Search & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Show activity logs history for each and every admin
  const filteredLogs = (activity || []).filter(log => {
    const searchString = `${log.activity || ''} ${log.details || ''} ${log.dateTime || log.date_time || ''} ${log.user || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="text-xs font-semibold text-slate-400">
        <span className="hover:text-slate-600 cursor-pointer">Dashboard</span>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-600 font-bold">Activity Log</span>
      </div>

      {/* Activity Logs panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-base font-bold text-slate-800">System Activity Logs</h3>
          
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search logs..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">Activity</th>
                <th className="pb-3 px-4">Details</th>
                <th className="pb-3 px-4">Operator</th>
                <th className="pb-3 px-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No matching activity logs found.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-4 pr-4 font-bold flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          log.activity === 'Login' ? 'bg-green-50 text-green-600' :
                          log.activity === 'Update Profile' ? 'bg-blue-50 text-blue-600' :
                          log.activity === 'Change Password' ? 'bg-purple-50 text-purple-600' :
                          log.activity === 'Assign Asset' ? 'bg-emerald-50 text-emerald-600' :
                          log.activity === 'Return Asset' ? 'bg-amber-50 text-amber-600' :
                          log.activity === 'Create Repair' ? 'bg-rose-50 text-rose-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {log.activity === 'Login' ? <LogIn className="h-3.5 w-3.5" /> :
                           log.activity === 'Update Profile' ? <Wrench className="h-3.5 w-3.5" /> :
                           log.activity === 'Change Password' ? <Lock className="h-3.5 w-3.5" /> :
                           log.activity === 'Assign Asset' ? <UserCheck className="h-3.5 w-3.5" /> :
                           log.activity === 'Return Asset' ? <Undo2 className="h-3.5 w-3.5" /> :
                           log.activity === 'Create Repair' ? <Wrench className="h-3.5 w-3.5" /> :
                           log.activity.includes('Delete') ? <Trash2 className="h-3.5 w-3.5" /> :
                           <PlusCircle className="h-3.5 w-3.5" />
                          }
                        </div>
                        <span>{log.activity}</span>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600 leading-relaxed">{log.details}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{log.user}</td>
                      <td className="py-4 px-4 text-slate-500 font-medium">{log.dateTime}</td>
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
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
                      className={`h-8 w-8 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        currentPage === p 
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
    </div>
  );
};

export default ActivityLog;
