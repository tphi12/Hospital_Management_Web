import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Calendar, Printer, Edit, Save, Plus, Trash2, X, Upload } from "lucide-react";
import { ROLES } from "../../lib/roles";
import { getEffectiveRoleCodes } from "../../lib/roleUtils";
import { useAuth } from "../../hooks/useAuth";
import scheduleService from "../../services/scheduleService";
import api from "../../services/api";
import { UserPicker } from "../../components/UserPicker";

dayjs.extend(isoWeek);

const WeeklySchedule = ({
  scheduleId,
  week = 32,
  year = 2025,
  startDate = "04/08/2025",
  endDate = "10/08/2025"
}) => {
  const { user } = useAuth();
  
  // Sử dụng roleUtils để xác định effective roles (bao gồm KHTH dù)
  const effectiveRoleCodes = useMemo(
    () => getEffectiveRoleCodes(user),
    [user]
  );

  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(scheduleId || null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [userLookup, setUserLookup] = useState({});  // Map of userId -> user data for displaying names

  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const [formData, setFormData] = useState({
    work_date: "",
    time_period: "Sáng",
    content: "",
    location: "",
    participantIds: []
  });

  const fileInputRef = useRef(null);

  const canEdit =
    effectiveRoleCodes.has(ROLES.ADMIN) ||
    effectiveRoleCodes.has(ROLES.KHTH);

  const activeScheduleId = selectedScheduleId || scheduleId || null;
  const selectedSchedule = schedules.find(
    (s) => Number(s.schedule_id) === Number(activeScheduleId)
  );

  const displayWeek = selectedSchedule?.week ?? week;
  const displayYear = selectedSchedule?.year ?? year;

  useEffect(() => {
    fetchWeeklySchedules();
  }, []);

  useEffect(() => {
    if (!activeScheduleId) {
      setItems([]);
      return;
    }
    fetchWeeklyWorkItems(activeScheduleId);
  }, [activeScheduleId]);

  const fetchWeeklySchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await scheduleService.getAllSchedules({
        schedule_type: "weekly_work"
      });

      if (!response.success) {
        setError(response.message || "Lỗi lấy danh sách lịch công tác");
        return;
      }

      const list = Array.isArray(response.data) ? response.data : [];
      setSchedules(list);

      if (list.length === 0) {
        setSelectedScheduleId(null);
        setItems([]);
        return;
      }

      const hasCurrent = list.some(
        (s) => Number(s.schedule_id) === Number(selectedScheduleId || scheduleId)
      );

      if (!hasCurrent) {
        setSelectedScheduleId(list[0].schedule_id);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi kết nối API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyWorkItems = async (targetScheduleId = activeScheduleId) => {
    try {
      if (!targetScheduleId) {
        return;
      }

      setLoading(true);
      setError(null);
      const response = await scheduleService.getWeeklyWorkItems(targetScheduleId);

      if (response.success) {
        const loadedItems = response.data || [];
        setItems(loadedItems);

        // Extract all unique participant IDs from items
        const participantIds = new Set();
        loadedItems.forEach(item => {
          if (Array.isArray(item.participantIds)) {
            item.participantIds.forEach(id => participantIds.add(id));
          }
        });

        // Fetch user data for all participants
        if (participantIds.size > 0) {
          try {
            const response = await api.get('/users/picker/by-ids', {
              params: { userIds: JSON.stringify(Array.from(participantIds)) }
            });
            if (response.data.success) {
              const lookup = {};
              response.data.data.forEach(user => {
                lookup[user.user_id] = user;
              });
              setUserLookup(lookup);
            }
          } catch (err) {
            // Don't fail the main operation if user fetch fails
          }
        }
      } else {
        setError(response.message || "Lỗi lấy danh sách công tác");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi kết nối API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentWeek = dayjs().isoWeek();
      const currentYear = dayjs().year();

      const existingSchedule = schedules.find(
        (s) =>
          Number(s.week) === Number(currentWeek) &&
          Number(s.year) === Number(currentYear) &&
          s.schedule_type === "weekly_work"
      );

      if (existingSchedule) {
        setSelectedScheduleId(existingSchedule.schedule_id);
        setError('Lịch công tác tuần này đã tồn tại');
        setLoading(false);
        return;
      }

      const response = await scheduleService.createSchedule({
        schedule_type: "weekly_work",
        week: currentWeek,
        year: currentYear,
        description: `Lịch công tác tuần ${currentWeek} năm ${currentYear}`
      });

      if (!response || !response.success) {
        setError(response?.message || "Lỗi tạo lịch mới");
        setLoading(false);
        return;
      }

      const newScheduleId = response?.data?.scheduleId || response?.data?.schedule_id;
      
      await fetchWeeklySchedules();
      if (newScheduleId) {
        setSelectedScheduleId(newScheduleId);
      }
      setLoading(false);
    } catch (err) {
      let errorMsg = "Lỗi tạo lịch mới";
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      console.error('handleCreateSchedule error:', err);
      setError(errorMsg);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      work_date: "",
      time_period: "Sáng",
      content: "",
      location: "",
      participantIds: []
    });
    setEditingItemId(null);
    setShowForm(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!formData.work_date || !formData.content) {
      setError("Vui lòng nhập ngày và nội dung công tác");
      return;
    }

    if (!activeScheduleId || Number.isNaN(parseInt(activeScheduleId, 10))) {
      setError("Lỗi: Không tìm thấy ID lịch hợp lệ. Vui lòng chọn lịch trước khi thêm công tác.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await scheduleService.addWeeklyWorkItem(activeScheduleId, {
        work_date: formData.work_date,
        time_period: formData.time_period,
        content: formData.content,
        location: formData.location || null,
        participantIds: formData.participantIds.length > 0 ? formData.participantIds : null
      });

      if (response.success) {
        resetForm();
        await fetchWeeklyWorkItems(activeScheduleId);
      } else {
        setError(response.message || "Lỗi thêm công tác");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi kết nối API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = async (itemId) => {
    if (!activeScheduleId || Number.isNaN(parseInt(activeScheduleId, 10))) {
      setError("Lỗi: Không tìm thấy ID lịch hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await scheduleService.getWeeklyWorkItemById(activeScheduleId, itemId);
      if (response.success) {
        const item = response.data;
        const participantIds = Array.isArray(item.participantIds) 
          ? item.participantIds 
          : [];
        
        setFormData({
          work_date: item.work_date,
          time_period: item.time_period || "Sáng",
          content: item.content,
          location: item.location || "",
          participantIds: participantIds
        });
        setEditingItemId(itemId);
        setShowForm(true);
      } else {
        setError(response.message || "Lỗi lấy thông tin công tác");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi kết nối API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();

    if (!formData.work_date || !formData.content) {
      setError("Vui lòng nhập ngày và nội dung công tác");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await scheduleService.updateWeeklyWorkItem(
        activeScheduleId,
        editingItemId,
        {
          work_date: formData.work_date,
          time_period: formData.time_period,
          content: formData.content,
          location: formData.location || null,
          participantIds: formData.participantIds.length > 0 ? formData.participantIds : null
        }
      );

      if (response.success) {
        resetForm();
        await fetchWeeklyWorkItems(activeScheduleId);
      } else {
        setError(response.message || "Lỗi cập nhật công tác");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi kết nối API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa công tác này?")) {
      return;
    }

    if (!activeScheduleId || Number.isNaN(parseInt(activeScheduleId, 10))) {
      setError("Lỗi: Không tìm thấy ID lịch hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await scheduleService.deleteWeeklyWorkItem(activeScheduleId, itemId);
      if (response.success) {
        await fetchWeeklyWorkItems(activeScheduleId);
      } else {
        setError(response.message || "Lỗi xóa công tác");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi kết nối API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    if (!activeScheduleId) {
      setError("Vui lòng chọn lịch công tác trước khi import file.");
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!activeScheduleId) {
      setError("Vui lòng chọn lịch công tác trước khi import file.");
      event.target.value = "";
      return;
    }

    try {
      setImportLoading(true);
      setError(null);
      setImportResult(null);

      const response = await scheduleService.importWeeklyWorkItems(activeScheduleId, file);

      if (response.success) {
        setImportResult(response.data || null);
        await fetchWeeklyWorkItems(activeScheduleId);
      } else {
        setError(response.message || "Import thất bại");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi kết nối API";
      setError(msg);
    } finally {
      setImportLoading(false);
      event.target.value = "";
    }
  };

  const itemsByDateAndPeriod = useMemo(() => {
    const grouped = {};
    items.forEach((item) => {
      const date = item.work_date;
      const period = item.time_period || "Sáng";
      const key = `${date}`;
      
      if (!grouped[key]) {
        grouped[key] = { Sáng: [], Chiều: [] };
      }
      grouped[key][period].push(item);
    });
    return grouped;
  }, [items]);

  // Helper: Lấy thứ từ ngày
  const getDayOfWeek = (dateString) => {
    try {
      const date = dayjs(dateString);
      const days = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      return days[date.day()];
    } catch {
      return "";
    }
  };

  // Helper: Lấy ngày dạng DD/MM  
  const getDateDisplay = (dateString) => {
    try {
      const date = dayjs(dateString);
      return date.format("DD/MM");
    } catch {
      return dateString;
    }
  };

  // Helper: Chuyển participant IDs/data thành tên - limited display
  const getParticipantNames = (participantsData) => {
    if (!participantsData) {
      return "";
    }

    let ids = [];
    
    // Try to parse if it's a string
    if (typeof participantsData === 'string') {
      try {
        if (participantsData.startsWith('[')) {
          ids = JSON.parse(participantsData);
        } else {
          // Old format: plain text - limit length
          return participantsData.length > 50 ? participantsData.substring(0, 50) + '...' : participantsData;
        }
      } catch (e) {
        // If parsing fails, it's plain text - limit length
        return participantsData.length > 50 ? participantsData.substring(0, 50) + '...' : participantsData;
      }
    } else if (Array.isArray(participantsData)) {
      ids = participantsData;
    } else {
      return String(participantsData);
    }

    // Convert IDs to names using lookup - show max 3 names
    const names = ids
      .slice(0, 3)
      .map(id => userLookup[id]?.full_name)
      .filter(Boolean);

    const displayText = names.join(", ");
    // Limit to 40 characters with ellipsis
    return displayText.length > 40 ? displayText.substring(0, 40) + '...' : displayText;
  };

  return (
    <div className="animate-fade-in bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-area-weekly, #printable-area-weekly * {
              visibility: visible;
            }
            #printable-area-weekly {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
              padding: 20px;
            }
            .no-print {
              display: none !important;
            }
            table { border-collapse: collapse !important; width: 100%; }
            th, td { border: 1px solid #000 !important; color: #000 !important; }
            .shadow-sm { box-shadow: none !important; border: none !important; }
          }
        `}
      </style>

      <div id="printable-area-weekly">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Chọn lịch công tác tuần</label>
              <select
                value={activeScheduleId || ""}
                onChange={(e) => setSelectedScheduleId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
                disabled={loading || importLoading}
              >
                <option value="">-- Chọn lịch --</option>
                {schedules.map((schedule) => (
                  <option key={schedule.schedule_id} value={schedule.schedule_id}>
                    {`Tuần ${schedule.week}/${schedule.year} - ${schedule.status || "draft"}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-start lg:justify-end">
              <button
                onClick={fetchWeeklySchedules}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                disabled={loading || importLoading}
                type="button"
              >
                Làm mới
              </button>
              <button
                onClick={handleCreateSchedule}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                disabled={loading || importLoading}
                type="button"
              >
                Tạo lịch mới
              </button>
            </div>
          </div>

          <div className="text-center md:text-left w-full">
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Công Tác Tuần</h1>
            <p className="text-slate-500 font-medium mt-1">
              Tuần {displayWeek} - Năm {displayYear} {selectedSchedule ? `(Mã lịch: ${selectedSchedule.schedule_id})` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              !showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                  disabled={loading || importLoading || !activeScheduleId}
                  type="button"
                >
                  <Plus size={18} /> Thêm công tác
                </button>
              ) : (
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                  disabled={loading || importLoading}
                  type="button"
                >
                  <X size={18} /> Hủy
                </button>
              )
            )}

            {canEdit && (
              <>
                <button
                  onClick={handleImportClick}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium transition-colors"
                  disabled={loading || importLoading || !activeScheduleId}
                  type="button"
                >
                  <Upload size={18} /> {importLoading ? "Đang import..." : "Import Excel/CSV"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportFile}
                />
              </>
            )}

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              type="button"
            >
              <Printer size={18} /> In PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}

        {importResult && (
          <div className="mx-4 mt-4 p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
            <p className="font-semibold">Kết quả import</p>
            <p>
              Tổng dòng: {importResult.totalRows} | Thành công: {importResult.successCount} | Lỗi: {importResult.failedCount}
            </p>
            {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm text-amber-800 max-h-40 overflow-y-auto">
                {importResult.errors.slice(0, 20).map((item, index) => (
                  <li key={`${item.row}-${item.field}-${index}`}>
                    Dòng {item.row}: {item.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loading && (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-2 text-slate-600">Đang xử lý...</p>
          </div>
        )}

        {!activeScheduleId && !loading && (
          <div className="p-8 text-center text-slate-600">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="mb-4">Chưa có lịch công tác tuần</p>
            {canEdit && (
              <p className="text-sm text-slate-500">
                 Nhấn nút <strong>"Tạo lịch mới"</strong> ở trên để bắt đầu tạo lịch công tác tuần hiện tại
              </p>
            )}
          </div>
        )}

        {showForm && !loading && canEdit && activeScheduleId && (
          <div className="m-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-slate-900 mb-4">
              {editingItemId ? "Chỉnh sửa công tác" : "Thêm công tác mới"}
            </h3>
            <form onSubmit={editingItemId ? handleUpdateItem : handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày công tác *</label>
                  <input
                    type="date"
                    value={formData.work_date}
                    onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giờ công tác *</label>
                  <select
                    value={formData.time_period}
                    onChange={(e) => setFormData({ ...formData, time_period: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="Sáng">Sáng</option>
                    <option value="Chiều">Chiều</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="VD: Phòng họp ABC"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung công tác *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                  rows="4"
                  placeholder="Mô tả chi tiết công tác..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Người tham dự</label>
                <UserPicker 
                  selectedUserIds={formData.participantIds}
                  onUsersChange={(ids) => setFormData({ ...formData, participantIds: ids })}
                />
              </div>*
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition-colors"
                  disabled={loading}
                >
                  <Save size={18} /> {editingItemId ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        )}

        {!loading && !showForm && activeScheduleId && (
          <div className="overflow-x-auto p-4" id="printable-content">
            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có công tác nào được ghi. {canEdit && "Hãy thêm công tác mới hoặc import từ file."}</p>
              </div>
            ) : (
              <table className="w-full border-collapse border border-slate-400 text-sm print:text-xs">
                <thead>
                  <tr className="bg-slate-100 print:bg-gray-200">
                    <th className="border border-slate-400 px-3 py-2 text-center font-bold w-20 print:w-16">
                      THỨ<br />NGÀY
                    </th>
                    <th className="border border-slate-400 px-3 py-2 text-center font-bold">SÁNG</th>
                    <th className="border border-slate-400 px-3 py-2 text-center font-bold">CHIỀU</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(itemsByDateAndPeriod)
                    .sort()
                    .map((date) => (
                      <tr key={date} className="hover:bg-slate-50 print:hover:bg-white">
                        <td className="border border-slate-400 px-3 py-2 text-center font-bold align-top bg-slate-50 print:bg-white">
                          <div className="text-xs">{getDayOfWeek(date)}</div>
                          <div className="font-bold text-sm">{getDateDisplay(date)}</div>
                        </td>
                        {/* SÁNG column */}
                        <td className="border border-slate-400 px-3 py-2 align-top min-h-24">
                          <div className="space-y-2">
                            {itemsByDateAndPeriod[date]['Sáng'].map((item) => (
                              <div
                                key={item.weekly_work_item_id}
                                className="p-2 bg-white border border-slate-200 rounded group hover:border-blue-300 text-xs"
                              >
                                <p className="text-slate-700 font-medium whitespace-normal break-words">
                                  {item.content}
                                </p>
                                {item.location && (
                                  <p className="text-xs text-slate-500 mt-1">📍 {item.location}</p>
                                )}
                                {item.participantIds && item.participantIds.length > 0 && (
                                  <p className="text-xs text-slate-500 mt-1 break-words line-clamp-2">👥 {getParticipantNames(item.participantIds)}</p>
                                )}
                                {canEdit && (
                                  <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEditStart(item.weekly_work_item_id)}
                                      className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Chỉnh sửa"
                                      type="button"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.weekly_work_item_id)}
                                      className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                                      title="Xóa"
                                      type="button"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        
                        {/* CHIỀU column */}
                        <td className="border border-slate-400 px-3 py-2 align-top min-h-24">
                          <div className="space-y-2">
                            {itemsByDateAndPeriod[date]['Chiều'].map((item) => (
                              <div
                                key={item.weekly_work_item_id}
                                className="p-2 bg-white border border-slate-200 rounded group hover:border-amber-300 text-xs"
                              >
                                <p className="text-slate-700 font-medium whitespace-normal break-words">
                                  {item.content}
                                </p>
                                {item.location && (
                                  <p className="text-xs text-slate-500 mt-1">📍 {item.location}</p>
                                )}
                                {item.participantIds && item.participantIds.length > 0 && (
                                  <p className="text-xs text-slate-500 mt-1 break-words line-clamp-2">👥 {getParticipantNames(item.participantIds)}</p>
                                )}
                                {canEdit && (
                                  <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEditStart(item.weekly_work_item_id)}
                                      className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Chỉnh sửa"
                                      type="button"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.weekly_work_item_id)}
                                      className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                                      title="Xóa"
                                      type="button"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="p-8 bg-white mt-4">
          <div className="flex justify-end gap-16">
            <div className="text-center">
              <p className="font-bold text-slate-900 uppercase mb-16">Giám Đốc</p>
              <p className="font-bold text-slate-900">Thái Khắc Huy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
