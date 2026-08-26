import React, { createContext, useContext, useState, useEffect } from 'react';

const AssetContext = createContext(null);

export const useAssetManager = () => {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssetManager must be used within an AssetProvider');
  }
  return context;
};
const defaultApiHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const API_URL = (import.meta.env.VITE_API_URL || `http://${defaultApiHost}:8001`).replace(/\/$/, "");

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn(
    "[QITS Config Warning]: VITE_API_URL environment variable is not defined in Vercel. " +
    "Requests are defaulting to http://localhost:8000 which causes 'Failed to fetch' errors in production. " +
    "Please add VITE_API_URL=https://<your-render-backend>.onrender.com in Vercel Environment Variables and trigger a fresh deployment."
  );
}

export const AssetProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [softwareTickets, setSoftwareTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [subscriptionGroups, setSubscriptionGroups] = useState([]);
  const [departments, setDepartments] = useState(["IT", "HR", "Marketing", "Sales", "Finance", "Engineering", "Information Technology"]);
  const [toast, setToast] = useState(null);

  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('it_jwt_token');
    return (saved && saved !== 'undefined' && saved !== 'null') ? saved : null;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('it_current_user');
    return (saved && saved !== 'undefined' && saved !== 'null') ? JSON.parse(saved) : null;
  });

  const defaultGuidelines = {
    title: "Quadrant IT Services - Asset Policy & Usage Guidelines 2026",
    version: "v2.4",
    uploadedDate: "20 Jul 2026",
    size: "2.4 MB",
    fileName: "Quadrant_IT_Asset_Policy_2026.pdf",
    summary: "Official company policy guidelines governing hardware usage, security protocols, return policies, and maintenance procedures.",
    content: "1. All assigned hardware assets remain the property of Quadrant IT Services.\n2. Employees are responsible for physical care and security of assigned laptops, monitors, and peripherals.\n3. Any hardware fault or damage must be reported immediately via the Raise Ticket portal.\n4. Assets must be returned intact upon offboarding or department transfer.",
    downloadUrl: "#"
  };

  const [guidelines, setGuidelines] = useState(defaultGuidelines);
  const [announcements, setAnnouncements] = useState([]);

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  // Toast automatic dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // General HTTP Request Client
  const apiFetch = async (endpoint, method = "GET", body = null) => {
    let activeToken = token || localStorage.getItem('it_jwt_token');
    if (activeToken === "undefined" || activeToken === "null") {
      activeToken = null;
    }

    const headers = {
      "Content-Type": "application/json",
    };
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const config = {
      method,
      headers,
    };
    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, config);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "API request failed" }));
        const message = typeof errData.detail === 'object' ? JSON.stringify(errData.detail) : errData.detail;
        if (res.status === 401 && !endpoint.includes("/api/auth/login")) {
          localStorage.removeItem("it_jwt_token");
          localStorage.removeItem("it_current_user");
          setToken(null);
          setCurrentUser(null);
        }
        throw new Error(message || "Request failed");
      }
      if (res.status === 204) return null;
      return await res.json().catch(() => null);
    } catch (err) {
      console.error(`API Error on ${method} ${endpoint}:`, err);
      throw err;
    }
  };

  const isWithin7Days = (dateOrStr) => {
    if (!dateOrStr) return true;
    try {
      let d = new Date(dateOrStr);
      if (isNaN(d.getTime())) {
        const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        const parts = String(dateOrStr).trim().split(/\s+/);
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const mon = months[parts[1].toLowerCase().slice(0, 3)];
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && mon !== undefined && !isNaN(year)) {
            d = new Date(year, mon, day);
          }
        }
      }
      if (isNaN(d.getTime())) return true;
      const now = new Date();
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    } catch (e) {
      return true;
    }
  };

  // Load all database collections
  const loadAllData = async () => {
    try {
      const [
        empList,
        assetList,
        repairList,
        swList,
        licenseList,
        groupList,
        catList,
        annList,
        guideData,
        notifList,
        actList,
        deptList
      ] = await Promise.all([
        apiFetch("/api/employees"),
        apiFetch("/api/assets"),
        apiFetch("/api/repairs"),
        apiFetch("/api/software-tickets").catch(() => []),
        apiFetch("/api/licenses"),
        apiFetch("/api/subscription-groups").catch(() => []),
        apiFetch("/api/categories"),
        apiFetch("/api/announcements"),
        apiFetch("/api/guidelines"),
        apiFetch("/api/notifications"),
        apiFetch("/api/activity"),
        apiFetch("/api/departments").catch(() => [])
      ]);

      setEmployees(empList || []);
      setAssets(assetList || []);
      setRepairs(repairList || []);
      setSoftwareTickets(swList || []);
      setLicenses(licenseList || []);
      setSubscriptionGroups(groupList || []);
      setCategories(catList || []);
      if (Array.isArray(deptList) && deptList.length > 0) {
        setDepartments(deptList);
      }
      setAnnouncements((annList || []).filter(a => isWithin7Days(a.createdAt || a.created_at || a.date)));
      setGuidelines(guideData || defaultGuidelines);
      setNotifications((notifList || []).filter(n => isWithin7Days(n.createdAt || n.created_at)));
      setActivity((actList || []).filter(a => isWithin7Days(a.createdAt || a.created_at || a.dateTime || a.date_time)));
    } catch (err) {
      console.error("Failed to load full-stack data:", err);
    }
  };

  // Sync data on token changes
  useEffect(() => {
    if (token) {
      loadAllData();
    } else {
      setEmployees([]);
      setAssets([]);
      setRepairs([]);
      setSoftwareTickets([]);
      setLicenses([]);
      setSubscriptionGroups([]);
      setCategories([]);
      setAnnouncements([]);
      setGuidelines(defaultGuidelines);
      setNotifications([]);
      setActivity([]);
    }
  }, [token]);

  // Live polling for notifications and ticket changes (every 4 seconds) + on tab focus
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const fetchLatestNotifications = async () => {
      try {
        const [notifList, repairList, swList] = await Promise.all([
          apiFetch("/api/notifications"),
          apiFetch("/api/repairs").catch(() => null),
          apiFetch("/api/software-tickets").catch(() => null)
        ]);

        if (isMounted) {
          if (Array.isArray(notifList)) setNotifications(notifList.filter(n => isWithin7Days(n.createdAt || n.created_at)));
          if (Array.isArray(repairList)) setRepairs(repairList);
          if (Array.isArray(swList)) setSoftwareTickets(swList);
        }
      } catch (err) {
        // Silently catch background poll error
      }
    };

    const intervalId = setInterval(fetchLatestNotifications, 4000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestNotifications();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [token]);

  // Auth Operations
  const loginUser = async (username, password, role) => {
    try {
      const res = await apiFetch("/api/auth/login", "POST", { username, password, role });
      const activeJwtToken = res.access_token || res.accessToken;
      localStorage.setItem("it_jwt_token", activeJwtToken);
      localStorage.setItem("it_current_user", JSON.stringify(res.user));
      setToken(activeJwtToken);
      setCurrentUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`, "success");
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("it_jwt_token");
    localStorage.removeItem("it_current_user");
    setToken(null);
    setCurrentUser(null);
    showToast("Signed out successfully", "info");
  };

  const verifyAdminPassword = async (inputPassword) => {
    if (!inputPassword || !inputPassword.trim()) return false;
    try {
      const res = await apiFetch("/api/auth/verify-password", "POST", { password: inputPassword.trim() });
      return !!(res && res.valid);
    } catch (err) {
      console.error("Password verification failed:", err);
      return false;
    }
  };

  // Custom Frontend Activity logging
  const logActivity = async (activityName, details, customUser = null) => {
    try {
      await apiFetch("/api/activity", "POST", { activity: activityName, details });
      // Reload activities list
      const actList = await apiFetch("/api/activity");
      setActivity((actList || []).filter(a => isWithin7Days(a.createdAt || a.created_at || a.dateTime || a.date_time)));
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  // Assets CRUD
  const addAsset = async (asset) => {
    try {
      let generatedId = asset.id;
      if (!generatedId) {
        const owner = (asset.ownership || '').trim().toLowerCase();
        let prefix = 'QITS';
        if (owner.includes('dsv')) prefix = 'DSV';
        else if (owner.includes('dhl')) prefix = 'DHL';
        else if (owner && !owner.includes('quadrant')) {
          const clean = owner.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          if (clean) prefix = clean;
        }

        let maxNum = 0;
        (assets || []).forEach(a => {
          if (a.id && a.id.startsWith(prefix)) {
            const num = parseInt(a.id.replace(prefix, ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });
        generatedId = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
      }

      const payload = {
        ...asset,
        id: generatedId,
        ownership: asset.ownership || "Quadrant IT Services",
        assignedTo: asset.assignedTo || null,
        status: asset.status || "Available",
        chargerSerialNumber: asset.chargerSerialNumber || (asset.type === 'Laptop' ? `CHG-SN-${String(85000000 + Math.floor(Math.random() * 1000000)).substring(0, 8)}` : 'N/A'),
        condition: asset.condition || 'Good',
        assignedDate: asset.status === 'Assigned' ? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        image: asset.image || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=80&h=80&fit=crop"
      };

      const res = await apiFetch("/api/assets", "POST", payload);
      await loadAllData();
      return res;
    } catch (err) {
      showToast(err.message, "error");
      throw err;
    }
  };

  const updateAsset = async (updatedAsset) => {
    try {
      await apiFetch(`/api/assets/${updatedAsset.id}`, "PUT", updatedAsset);
      await loadAllData();
      showToast("Asset updated successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteAsset = async (id) => {
    try {
      await apiFetch(`/api/assets/${id}`, "DELETE");
      await loadAllData();
      showToast("Asset deleted successfully", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const bulkDeleteAssets = async (ids) => {
    try {
      if (!ids || ids.length === 0) return;
      await apiFetch(`/api/assets/bulk-delete`, "POST", { asset_ids: ids });
      await loadAllData();
      showToast(`Successfully deleted ${ids.length} asset(s)!`, "info");
    } catch (err) {
      showToast(err.message || "Failed to delete assets", "error");
      throw err;
    }
  };

  const bulkImportAssets = async (assetPayloadList) => {
    try {
      const res = await apiFetch("/api/assets/bulk-import", "POST", assetPayloadList);
      const [assetList, actList] = await Promise.all([
        apiFetch("/api/assets").catch(() => []),
        apiFetch("/api/activity").catch(() => [])
      ]);
      if (assetList) setAssets(assetList);
      if (actList) setActivity(actList);
      return res;
    } catch (err) {
      showToast(err.message || "Failed to bulk import assets", "error");
      throw err;
    }
  };

  const getAssetHistory = async (assetId) => {
    try {
      return await apiFetch(`/api/assets/${assetId}/history`);
    } catch (err) {
      console.error(`Failed to fetch history for asset ${assetId}:`, err);
      return null;
    }
  };

  // Employees CRUD
  const addEmployee = async (emp) => {
    try {
      let generatedId = emp.id;
      if (!generatedId) {
        let maxNum = 0;
        (employees || []).forEach(e => {
          if (e.id && e.id.toUpperCase().startsWith('QEMP')) {
            const num = parseInt(e.id.toUpperCase().replace('QEMP', ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });
        generatedId = `QEMP${String(maxNum + 1).padStart(3, '0')}`;
      }

      const payload = {
        ...emp,
        id: generatedId,
        status: emp.status || "Active",
        avatar: emp.avatar || null
      };

      const res = await apiFetch("/api/employees", "POST", payload);
      await loadAllData();
      return res;
    } catch (err) {
      showToast(err.message, "error");
      throw err;
    }
  };

  const updateEmployee = async (arg1, arg2) => {
    try {
      let empId, payload;
      if (typeof arg1 === 'object' && arg1 !== null) {
        empId = arg1.id;
        payload = arg1;
      } else {
        empId = arg1;
        payload = arg2 || {};
      }

      if (!empId) {
        throw new Error("Employee ID is missing.");
      }

      const res = await apiFetch(`/api/employees/${empId}`, "PUT", payload);
      await loadAllData();

      // Update local profile session if it's the current user
      if (currentUser && currentUser.id === empId) {
        const merged = { ...currentUser, ...res };
        setCurrentUser(merged);
        localStorage.setItem('it_current_user', JSON.stringify(merged));
      }
      showToast("Profile updated successfully", "success");
      return true;
    } catch (err) {
      showToast(err.message, "error");
      return false;
    }
  };

  const deleteEmployee = async (target) => {
    try {
      const targetId = typeof target === 'object' ? target.id : target;
      await apiFetch(`/api/employees/${targetId}`, "DELETE");
      await loadAllData();
      showToast("Employee record deleted successfully", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const bulkDeleteEmployees = async (ids) => {
    try {
      if (!ids || ids.length === 0) return;
      await apiFetch(`/api/employees/bulk-delete`, "POST", { employee_ids: ids });
      await loadAllData();
      showToast(`Successfully deleted ${ids.length} employee(s)!`, "info");
    } catch (err) {
      showToast(err.message || "Failed to delete employees", "error");
      throw err;
    }
  };

  const bulkImportEmployees = async (employeePayloadList) => {
    try {
      const res = await apiFetch("/api/employees/bulk-import", "POST", employeePayloadList);
      await loadAllData();
      return res;
    } catch (err) {
      showToast(err.message || "Failed to bulk import employees", "error");
      throw err;
    }
  };

  // Assignments & Returns
  const assignAssets = async (employeeId, assetIds, assignDate, remarks) => {
    try {
      await apiFetch("/api/assets/assign", "POST", {
        employee_id: employeeId,
        asset_ids: assetIds,
        assign_date: assignDate,
        remarks: remarks
      });
      await loadAllData();
      showToast(`Assigned ${assetIds.length} asset(s) successfully`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const returnAssets = async (employeeId, assetIds, returnDate, returnCondition, remarks) => {
    try {
      await apiFetch("/api/assets/return", "POST", {
        employee_id: employeeId,
        asset_ids: assetIds,
        return_date: returnDate,
        condition: returnCondition,
        remarks: remarks
      });
      await loadAllData();
      showToast(`Processed return of ${assetIds.length} asset(s) successfully`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const acceptAssetAssignment = async (assetId) => {
    try {
      await apiFetch(`/api/assets/${assetId}/accept`, "POST");
      await loadAllData();
      showToast("Asset accepted! Confirmation email sent to IT Admins.", "success");
      return true;
    } catch (err) {
      showToast(err.message || "Failed to accept asset", "error");
      return false;
    }
  };

  const rejectAssetAssignment = async (assetId, reason = "") => {
    try {
      await apiFetch(`/api/assets/${assetId}/reject`, "POST", { reason });
      await loadAllData();
      showToast("Asset rejected. IT Admins have been notified.", "info");
      return true;
    } catch (err) {
      showToast(err.message || "Failed to reject asset", "error");
      return false;
    }
  };

  // Repairs Operations
  const addRepair = async (repair) => {
    try {
      await apiFetch("/api/repairs", "POST", {
        asset_id: repair.assetId,
        reported_by: repair.reportedBy,
        issue: repair.issue,
        description: repair.description,
        priority: repair.priority,
        assigned_to: repair.assignedTo,
        estimated_completion: repair.estimatedCompletion
      });
      await loadAllData();
      showToast("Repair ticket successfully raised!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const addRepairUpdate = async (repairId, status, message) => {
    try {
      await apiFetch(`/api/repairs/${repairId}/updates`, "POST", { status, message });
      await loadAllData();
      showToast("Status update added successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const acceptRepair = async (repairId, adminName) => {
    try {
      await apiFetch(`/api/repairs/${repairId}/accept`, "POST");
      await loadAllData();
      showToast("Accepted support ticket", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const rejectRepair = async (repairId, adminName) => {
    try {
      await apiFetch(`/api/repairs/${repairId}/reject`, "POST");
      await loadAllData();
      showToast("Cancelled support ticket", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Software Ticket Operations
  const addSoftwareTicket = async (ticket) => {
    try {
      await apiFetch("/api/software-tickets", "POST", {
        reported_by: ticket.reportedBy,
        issue: ticket.issue,
        description: ticket.description,
        working_mode: ticket.workingMode || "Onsite",
        priority: ticket.priority || "Medium",
        assigned_to: ticket.assignedTo || "IT Support Team"
      });
      await loadAllData();
      showToast("Software ticket successfully raised!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const addSoftwareTicketUpdate = async (ticketId, status, message) => {
    try {
      await apiFetch(`/api/software-tickets/${ticketId}/updates`, "POST", { status, message });
      await loadAllData();
      showToast("Software ticket update added successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const acceptSoftwareTicket = async (ticketId, adminName) => {
    try {
      await apiFetch(`/api/software-tickets/${ticketId}/accept`, "POST");
      await loadAllData();
      showToast("Accepted software ticket", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const rejectSoftwareTicket = async (ticketId, adminName) => {
    try {
      await apiFetch(`/api/software-tickets/${ticketId}/reject`, "POST");
      await loadAllData();
      showToast("Cancelled software ticket", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Announcements Operations
  const addAnnouncement = async (newAnn) => {
    try {
      await apiFetch("/api/announcements", "POST", newAnn);
      await loadAllData();
      showToast("Announcement posted successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await apiFetch(`/api/announcements/${id}`, "DELETE");
      await loadAllData();
      showToast("Announcement deleted", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Categories Operations
  const addCategory = async (categoryData) => {
    try {
      const maxNum = (categories || []).reduce((max, c) => {
        if (c.id && c.id.startsWith('CAT')) {
          const num = parseInt(c.id.replace('CAT', ''), 10);
          return !isNaN(num) && num > max ? num : max;
        }
        return max;
      }, 0);
      const nextNum = maxNum + 1;
      const payload = {
        ...categoryData,
        id: categoryData.id || `CAT${String(nextNum).padStart(3, '0')}`
      };
      await apiFetch("/api/categories", "POST", payload);
      await loadAllData();
      showToast("Category added successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };


  const updateCategory = async (id, updatedData) => {
    try {
      await apiFetch(`/api/categories/${id}`, "PUT", updatedData);
      await loadAllData();
      showToast("Category updated successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteCategory = async (id) => {
    try {
      await apiFetch(`/api/categories/${id}`, "DELETE");
      await loadAllData();
      showToast("Category deleted successfully", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Guidelines Operations
  const updateGuidelines = async (newGuidelines) => {
    try {
      await apiFetch("/api/guidelines", "PUT", newGuidelines);
      await loadAllData();
      showToast("IT Asset Guidelines updated successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Subscription Groups Operations (Backend Persistence)
  const addSubscriptionGroup = async (groupData) => {
    try {
      const payload = {
        name: groupData.name.trim(),
        vendor: (groupData.vendor || groupData.name || '').trim(),
        description: (groupData.description || '').trim()
      };
      if (groupData.id) payload.id = groupData.id;
      const res = await apiFetch("/api/subscription-groups", "POST", payload);
      await loadAllData();
      showToast(`Subscription Group "${payload.name}" created successfully!`, "success");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to create subscription group", "error");
      throw err;
    }
  };

  const updateSubscriptionGroup = async (id, updatedData) => {
    try {
      const payload = {};
      if (updatedData.name !== undefined) payload.name = updatedData.name.trim();
      if (updatedData.vendor !== undefined) payload.vendor = updatedData.vendor.trim();
      if (updatedData.description !== undefined) payload.description = updatedData.description.trim();

      const res = await apiFetch(`/api/subscription-groups/${id}`, "PUT", payload);
      await loadAllData();
      showToast("Subscription Group updated successfully!", "success");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to update subscription group", "error");
      throw err;
    }
  };

  const deleteSubscriptionGroup = async (id) => {
    try {
      await apiFetch(`/api/subscription-groups/${id}`, "DELETE");
      await loadAllData();
      showToast("Subscription Group removed successfully", "info");
    } catch (err) {
      showToast(err.message || "Failed to delete subscription group", "error");
      throw err;
    }
  };

  // Software Subscriptions (Licenses & Plans) Operations (Backend Persistence)
  const addLicense = async (licenseData) => {
    try {
      const payload = {
        name: licenseData.name.trim(),
        status: licenseData.status || "Available",
        groupId: licenseData.groupId || licenseData.group_id || null,
        groupName: licenseData.groupName || licenseData.group_name || null,
        vendor: (licenseData.vendor || "Subscription").trim(),
        licenseKey: (licenseData.licenseKey || licenseData.license_key || "N/A").trim(),
        seats: Number(licenseData.seats) || 1,
        cost: licenseData.cost ? String(licenseData.cost).trim() : "N/A",
        startDate: licenseData.startDate || licenseData.start_date || new Date().toISOString().split('T')[0],
        endDate: licenseData.endDate || licenseData.end_date,
        alertDaysBefore: Number(licenseData.alertDaysBefore || licenseData.alert_days_before || 30),
        adminEmail: licenseData.adminEmail || licenseData.admin_email || "qitsassetadmin@quadrantitservices.com",
        description: (licenseData.description || "Software subscription plan.").trim()
      };

      if (licenseData.id) payload.id = licenseData.id;

      // Map employee assignment IDs
      if (licenseData.assignedEmployeeIds && Array.isArray(licenseData.assignedEmployeeIds)) {
        payload.assignedEmployeeIds = licenseData.assignedEmployeeIds;
      } else if (licenseData.assigned_employee_ids && Array.isArray(licenseData.assigned_employee_ids)) {
        payload.assignedEmployeeIds = licenseData.assigned_employee_ids;
      } else if (licenseData.assignedEmployees && Array.isArray(licenseData.assignedEmployees)) {
        payload.assignedEmployeeIds = licenseData.assignedEmployees.map(e => e.employeeId || e.id).filter(Boolean);
      }

      const res = await apiFetch("/api/licenses", "POST", payload);
      await loadAllData();
      showToast(`Subscription "${payload.name}" added successfully!`, "success");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to add license subscription", "error");
      throw err;
    }
  };

  const updateLicense = async (id, updatedData) => {
    try {
      const payload = {};
      if (updatedData.name !== undefined) payload.name = updatedData.name.trim();
      if (updatedData.status !== undefined) payload.status = updatedData.status;
      if (updatedData.groupId !== undefined) payload.groupId = updatedData.groupId;
      else if (updatedData.group_id !== undefined) payload.groupId = updatedData.group_id;
      if (updatedData.groupName !== undefined) payload.groupName = updatedData.groupName;
      else if (updatedData.group_name !== undefined) payload.groupName = updatedData.group_name;
      if (updatedData.vendor !== undefined) payload.vendor = updatedData.vendor.trim();
      if (updatedData.licenseKey !== undefined) payload.licenseKey = updatedData.licenseKey.trim();
      else if (updatedData.license_key !== undefined) payload.licenseKey = updatedData.license_key.trim();
      if (updatedData.seats !== undefined) payload.seats = Number(updatedData.seats);
      if (updatedData.cost !== undefined) payload.cost = String(updatedData.cost).trim();
      if (updatedData.startDate !== undefined) payload.startDate = updatedData.startDate;
      else if (updatedData.start_date !== undefined) payload.startDate = updatedData.start_date;
      if (updatedData.endDate !== undefined) payload.endDate = updatedData.endDate;
      else if (updatedData.end_date !== undefined) payload.endDate = updatedData.end_date;
      if (updatedData.alertDaysBefore !== undefined) payload.alertDaysBefore = Number(updatedData.alertDaysBefore);
      else if (updatedData.alert_days_before !== undefined) payload.alertDaysBefore = Number(updatedData.alert_days_before);
      if (updatedData.adminEmail !== undefined) payload.adminEmail = updatedData.adminEmail;
      else if (updatedData.admin_email !== undefined) payload.adminEmail = updatedData.admin_email;
      if (updatedData.description !== undefined) payload.description = updatedData.description.trim();

      // Map employee assignments sync
      if (updatedData.assignedEmployeeIds !== undefined) {
        payload.assignedEmployeeIds = updatedData.assignedEmployeeIds;
      } else if (updatedData.assigned_employee_ids !== undefined) {
        payload.assignedEmployeeIds = updatedData.assigned_employee_ids;
      } else if (updatedData.assignedEmployees !== undefined) {
        payload.assignedEmployeeIds = updatedData.assignedEmployees.map(e => e.employeeId || e.id).filter(Boolean);
      }

      const res = await apiFetch(`/api/licenses/${id}`, "PUT", payload);
      await loadAllData();
      showToast("License updated successfully!", "success");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to update license", "error");
      throw err;
    }
  };

  const deleteLicense = async (id) => {
    try {
      await apiFetch(`/api/licenses/${id}`, "DELETE");
      await loadAllData();
      showToast("License subscription removed", "info");
    } catch (err) {
      showToast(err.message || "Failed to delete license", "error");
      throw err;
    }
  };

  const renewLicense = async (id, renewalData) => {
    try {
      const payload = {
        endDate: renewalData.endDate || renewalData.end_date,
        startDate: renewalData.startDate || renewalData.start_date || undefined,
        alertDaysBefore: renewalData.alertDaysBefore !== undefined ? Number(renewalData.alertDaysBefore) : (renewalData.alert_days_before !== undefined ? Number(renewalData.alert_days_before) : undefined),
        cost: renewalData.cost !== undefined ? String(renewalData.cost).trim() : undefined,
        seats: renewalData.seats !== undefined ? Number(renewalData.seats) : undefined,
        vendor: renewalData.vendor !== undefined ? renewalData.vendor.trim() : undefined
      };
      const res = await apiFetch(`/api/licenses/${id}/renew`, "POST", payload);
      await loadAllData();
      showToast("License renewed successfully!", "success");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to renew license", "error");
      throw err;
    }
  };

  // Deactivate License (Lifecycle action)
  const cancelLicense = async (id, reason = "") => {
    try {
      const res = await apiFetch(`/api/licenses/${id}/cancel`, "POST", { reason: reason || "Deactivated by administrator" });
      await loadAllData();
      showToast("License marked as Deactivated", "info");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to deactivate license", "error");
      throw err;
    }
  };

  // Reactivate License
  const reactivateLicense = async (id, dateUpdates = null) => {
    try {
      const payload = { status: "Available", ...(dateUpdates || {}) };
      const res = await apiFetch(`/api/licenses/${id}`, "PUT", payload);
      await loadAllData();
      showToast("License successfully reactivated!", "success");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to reactivate license", "error");
      throw err;
    }
  };

  const assignEmployeesToLicense = async (licenseId, employeeIds) => {
    try {
      const res = await apiFetch(`/api/licenses/${licenseId}/assign`, "POST", { employee_ids: employeeIds });
      await loadAllData();
      showToast("Employees successfully assigned to license!", "success");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to assign employees", "error");
      throw err;
    }
  };

  const unassignEmployeeFromLicense = async (licenseId, employeeId) => {
    try {
      const res = await apiFetch(`/api/licenses/${licenseId}/unassign/${employeeId}`, "DELETE");
      await loadAllData();
      showToast("Employee unassigned from license", "info");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to unassign employee", "error");
      throw err;
    }
  };

  const bulkImportLicenses = async (licensePayloadList) => {
    try {
      const res = await apiFetch("/api/licenses/bulk-import", "POST", licensePayloadList);
      await loadAllData();
      showToast(res.message || "Subscriptions imported successfully", "success");
      return res;
    } catch (err) {
      showToast(err.message || "Failed to import subscriptions", "error");
      throw err;
    }
  };

  const triggerEmailAlert = async (id) => {
    try {
      const res = await apiFetch(`/api/licenses/${id}/alert`, "POST");
      await loadAllData();
      showToast(res?.message || "Expiry alert email sent successfully to all admins", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Notifications Operations
  const markNotificationAsRead = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, "PUT");
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await apiFetch("/api/notifications/read-all", "PUT");
      await loadAllData();
      showToast("All notifications marked as read", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await apiFetch("/api/auth/change-password", "POST", {
        current_password: currentPassword,
        new_password: newPassword
      });
      showToast("Password updated successfully!", "success");
      return true;
    } catch (err) {
      showToast(err.message, "error");
      return false;
    }
  };

  const requestPasswordResetOtp = async (identifier) => {
    try {
      const res = await apiFetch("/api/auth/forgot-password/request-otp", "POST", { identifier });
      return { success: true, maskedEmail: res.masked_email || res.maskedEmail, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const resetPasswordWithOtp = async (identifier, otp, newPassword) => {
    try {
      const res = await apiFetch("/api/auth/forgot-password/reset", "POST", {
        identifier,
        otp,
        new_password: newPassword
      });
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const requestSignUpOtp = async (email) => {
    try {
      const res = await apiFetch("/api/auth/signup/request-otp", "POST", {
        email: email
      });
      return { success: true, maskedEmail: res.maskedEmail, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const verifySignUpOtp = async (email, otp) => {
    try {
      const res = await apiFetch("/api/auth/signup/verify-otp", "POST", {
        email,
        otp
      });
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const signUpEmployee = async (formData) => {
    try {
      const res = await apiFetch("/api/auth/signup", "POST", formData);
      const activeJwtToken = res.access_token || res.accessToken;
      localStorage.setItem("it_jwt_token", activeJwtToken);
      localStorage.setItem("it_current_user", JSON.stringify(res.user));
      setToken(activeJwtToken);
      setCurrentUser(res.user);
      showToast(`Welcome to Quadrant IT Services, ${res.user.name}!`, "success");
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const getSignUpDepartments = async () => {
    try {
      const res = await apiFetch("/api/departments");
      if (Array.isArray(res) && res.length > 0) {
        setDepartments(res);
        return res;
      }
      return departments;
    } catch (err) {
      return departments;
    }
  };

  const addDepartment = async (name) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return departments;
    try {
      const updatedList = await apiFetch("/api/departments", "POST", { name: cleanName });
      if (Array.isArray(updatedList) && updatedList.length > 0) {
        setDepartments(updatedList);
        showToast(`Department "${cleanName}" added successfully!`, 'success');
        return updatedList;
      }
    } catch (err) {
      console.error("Failed to add department to server:", err);
      setDepartments(prev => {
        if (!prev.some(d => d.toLowerCase() === cleanName.toLowerCase())) {
          return [...prev, cleanName];
        }
        return prev;
      });
      showToast(`Department "${cleanName}" added successfully!`, 'success');
    }
  };
  const deleteDepartment = async (name) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return;
    try {
      const updatedList = await apiFetch(`/api/departments/${encodeURIComponent(cleanName)}`, "DELETE");
      if (Array.isArray(updatedList)) {
        setDepartments(updatedList);
      } else {
        setDepartments(prev => prev.filter(d => d.toLowerCase() !== cleanName.toLowerCase()));
      }
      showToast(`Department "${cleanName}" deleted successfully!`, 'success');
      const empList = await apiFetch("/api/employees").catch(() => null);
      if (Array.isArray(empList)) setEmployees(empList);
    } catch (err) {
      console.error("Failed to delete department:", err);
      setDepartments(prev => prev.filter(d => d.toLowerCase() !== cleanName.toLowerCase()));
      showToast(`Department "${cleanName}" deleted`, 'success');
    }
  };

  return (
    <AssetContext.Provider value={{
      employees,
      assets,
      departments,
      addDepartment,
      deleteDepartment,
      repairs,
      notifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      activity,
      currentUser,
      loginUser,
      logoutUser,
      verifyAdminPassword,
      changePassword,
      requestPasswordResetOtp,
      resetPasswordWithOtp,
      requestSignUpOtp,
      verifySignUpOtp,
      signUpEmployee,
      getSignUpDepartments,
      addAsset,
      updateAsset,
      deleteAsset,
      bulkDeleteAssets,
      bulkImportAssets,
      getAssetHistory,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      bulkDeleteEmployees,
      bulkImportEmployees,
      assignAssets,
      returnAssets,
      acceptAssetAssignment,
      rejectAssetAssignment,
      addRepair,
      addRepairUpdate,
      acceptRepair,
      rejectRepair,
      softwareTickets,
      addSoftwareTicket,
      addSoftwareTicketUpdate,
      acceptSoftwareTicket,
      rejectSoftwareTicket,
      logActivity,
      toast,
      showToast,
      hideToast,
      guidelines,
      updateGuidelines,
      announcements,
      addAnnouncement,
      deleteAnnouncement,
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      licenses,
      subscriptionGroups,
      addSubscriptionGroup,
      updateSubscriptionGroup,
      deleteSubscriptionGroup,
      assignEmployeesToLicense,
      unassignEmployeeFromLicense,
      addLicense,
      updateLicense,
      renewLicense,
      cancelLicense,
      reactivateLicense,
      deleteLicense,
      bulkImportLicenses,
      loadAllData,
      triggerEmailAlert
    }}>
      {children}
    </AssetContext.Provider>
  );
};
