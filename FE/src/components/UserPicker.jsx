import React, { useState, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import api from '../services/api';

/**
 * UserPicker component for multi-select staff
 * Props: selectedUserIds (array), onUsersChange (callback)
 */
export const UserPicker = ({ selectedUserIds = [], onUsersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUserCache, setSelectedUserCache] = useState({});  // Cache for display

  // Load departments on mount
  useEffect(() => {
    const loadDepts = async () => {
      try {
        const response = await api.get('/users/picker/departments');
        if (response.data.success) {
          setDepartments(response.data.data || []);
        }
      } catch {
        // Handle error silently
      }
    };
    loadDepts();
  }, []);

  // Load user data for existing selected IDs
  useEffect(() => {
    const loadSelectedUserData = async () => {
      if (!Array.isArray(selectedUserIds) || selectedUserIds.length === 0) {
        return;
      }

      // Only load IDs that are not already in cache
      const missingIds = selectedUserIds.filter(id => !selectedUserCache[id]);
      if (missingIds.length === 0) {
        return;
      }

      try {
        const response = await api.get('/users/picker/by-ids', {
          params: { userIds: JSON.stringify(missingIds) }
        });
        if (response.data.success) {
          const userData = response.data.data || [];
          setSelectedUserCache(prev => {
            const updated = { ...prev };
            userData.forEach(user => {
              updated[user.user_id] = user;
            });
            return updated;
          });
        }
      } catch {
        // Handle error silently
      }
    };

    loadSelectedUserData();
  }, [selectedUserIds, selectedUserCache]);

  // Load users when search or department changes
  useEffect(() => {
    const loadUsers = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        const params = {};
        if (selectedDept) params.department_id = selectedDept;
        if (searchText) params.search = searchText;
        
        const response = await api.get('/users/picker/users', { params });
        if (response.data.success) {
          setUsers(response.data.data || []);
        }
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(loadUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [isOpen, selectedDept, searchText]);

  // Sync selected user IDs from props
  useEffect(() => {
    if (Array.isArray(selectedUserIds)) {
      setSelectedUsers(selectedUserIds);
    }
  }, [selectedUserIds, selectedUserCache]);

  // Handle user selection toggle
  const handleUserToggle = (userId, userObj = null) => {
    const newSelected = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    
    // Update cache when selecting
    if (!selectedUsers.includes(userId) && userObj) {
      setSelectedUserCache(prev => ({
        ...prev,
        [userId]: userObj
      }));
    }
    
    // Remove from cache when deselecting
    if (selectedUsers.includes(userId) && !newSelected.includes(userId)) {
      setSelectedUserCache(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }
    
    setSelectedUsers(newSelected);
    onUsersChange(newSelected);
  };

  // Get selected user details for display (from cache first, then from current users list)
  const displayUsers = selectedUsers.map(userId => 
    selectedUserCache[userId] || users.find(u => u.user_id === userId)
  ).filter(Boolean);

  return (
    <div className="relative w-full">
      {/* Selected Users Display */}
      <div className="min-h-10 p-2 border border-gray-300 rounded-md bg-white flex flex-wrap gap-1 items-start">
        {displayUsers.length > 0 ? (
          displayUsers.map(user => (
            <div
              key={user.user_id}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
            >
              <span>{user.full_name}</span>
              <button
                type="button"
                onClick={() => handleUserToggle(user.user_id)}
                className="hover:text-blue-900 font-bold"
              >
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <span className="text-gray-400 text-sm">Chọn nhân viên...</span>
        )}
      </div>

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-2 top-3 text-gray-400 hover:text-gray-600"
      >
        <ChevronDown size={18} />
      </button>

      {/* Dropdown Panel - Using absolute positioning */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Department Filter */}
          <div className="p-3 border-b">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Phòng ban
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSearchText('');
              }}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map(dept => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Users List - Scrollable */}
          <div className="overflow-y-auto max-h-48">
            {loading ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                Đang tải...
              </div>
            ) : users.length > 0 ? (
              users.map(user => (
                <label
                  key={user.user_id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.user_id)}
                    onChange={() => handleUserToggle(user.user_id, user)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                  </div>
                  {user.department_code === 'KHTH' && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-1.5 rounded-full whitespace-nowrap">
                      KHTH
                    </span>
                  )}
                </label>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                Không tìm thấy nhân viên
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="p-2 border-t bg-gray-50">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
