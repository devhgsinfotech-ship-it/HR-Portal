import { useState, useEffect, useRef } from "react";
import apiClient from "../../../core/utils/apiClient";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { DatePicker } from "antd";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import EmployeeDashboardModal from "./employeeDashboardModal";
import CommonFooter from "@/core/common/commonFooter/footer";
import CommonTextEditor from "@/core/common/textEditor";
import { APP_CONFIG } from "../../../environment";

const EmployeeDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getFormattedDate = () => {
    const d = currentTime;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getFormattedTimeParts = () => {
    const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const parts = timeString.split(':');
    if (parts.length < 3) return { hhmm: '00:00', ssAmPm: ':00 AM' };
    const hh = parts[0];
    const mm = parts[1];
    const ssWithAmPm = parts[2];
    return { hhmm: `${hh}:${mm}`, ssAmPm: `:${ssWithAmPm}` };
  };

  const { hhmm, ssAmPm } = getFormattedTimeParts();
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [onLeaveToday, setOnLeaveToday] = useState<any[]>([]);
  const [nextHoliday, setNextHoliday] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const apiUrl = APP_CONFIG.getBackendUrl();

  const [activeTab, setActiveTab] = useState<'birthdays' | 'anniversaries' | 'joinees'>('anniversaries');
  const [newPostText, setNewPostText] = useState('');
  const [postCommentsInputs, setPostCommentsInputs] = useState<Record<string, string>>({});
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any>({ birthdays: { today: [], upcoming: [] }, anniversaries: [], joinees: [] });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [editingImageRemoved, setEditingImageRemoved] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const formatPostTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch (e) {
      return 'Just now';
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && !selectedFile) return;
    try {
      const formData = new FormData();
      formData.append('content', newPostText);
      if (selectedFile) {
        formData.append('postImage', selectedFile);
      }

      await apiClient.post('/employees/dashboard/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewPostText('');
      setSelectedFile(null);

      const postsRes = await apiClient.get('/employees/dashboard/posts');
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to publish post:', error);
    }
  };

  const handleToggleLike = async (postId: number) => {
    try {
      await apiClient.post(`/employees/dashboard/posts/${postId}/like`);
      const postsRes = await apiClient.get('/employees/dashboard/posts');
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleAddComment = async (postId: number, text: string) => {
    if (!text.trim()) return;
    try {
      await apiClient.post(`/employees/dashboard/posts/${postId}/comment`, { content: text });

      setPostCommentsInputs(prev => ({
        ...prev,
        [postId]: ''
      }));

      const postsRes = await apiClient.get('/employees/dashboard/posts');
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleSaveEdit = async (postId: number) => {
    if (!editingPostText.trim()) return;
    try {
      const formData = new FormData();
      formData.append('content', editingPostText);
      formData.append('imageRemoved', editingImageRemoved ? 'true' : 'false');
      if (editingFile) {
        formData.append('postImage', editingFile);
      }

      await apiClient.put(`/employees/dashboard/posts/${postId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setEditingPostId(null);
      setEditingPostText('');
      setEditingFile(null);
      setEditingImageRemoved(false);

      const postsRes = await apiClient.get('/employees/dashboard/posts');
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to save post edit:', error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await apiClient.delete(`/employees/dashboard/posts/${postId}`);
      const postsRes = await apiClient.get('/employees/dashboard/posts');
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleSaveCommentEdit = async (commentId: number) => {
    if (!editingCommentText.trim()) return;
    try {
      await apiClient.put(`/employees/dashboard/comments/${commentId}`, { content: editingCommentText });
      setEditingCommentId(null);
      setEditingCommentText('');
      const postsRes = await apiClient.get('/employees/dashboard/posts');
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to save comment edit:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await apiClient.delete(`/employees/dashboard/comments/${commentId}`);
      const postsRes = await apiClient.get('/employees/dashboard/posts');
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleToggleCommentLike = async (commentId: number) => {
    try {
      await apiClient.post(`/employees/dashboard/comments/${commentId}/like`);
      const postsRes = await apiClient.get('/employees/dashboard/posts');
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
    }
  };

  const handleAddReply = async (postId: number, parentId: number) => {
    if (!replyText.trim()) return;
    try {
      await apiClient.post(`/employees/dashboard/posts/${postId}/comment`, { content: replyText, parentId });
      setReplyingToCommentId(null);
      setReplyText('');
      const postsRes = await apiClient.get('/employees/dashboard/posts');
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [empRes, statusRes, logsRes, balancesRes, requestsRes, eventsRes, postsRes, onLeaveRes, holidayRes, announceRes] = await Promise.all([
        apiClient.get('/employees/me').catch(() => ({ data: null })),
        apiClient.get('/attendance/today').catch(() => ({ data: null })),
        apiClient.get('/attendance/logs?mine=true').catch(() => ({ data: [] })),
        apiClient.get('/leaves/balances').catch(() => ({ data: [] })),
        apiClient.get('/leaves/requests').catch(() => ({ data: [] })),
        apiClient.get('/employees/dashboard/events').catch(() => ({ data: { birthdays: { today: [], upcoming: [] }, anniversaries: [], joinees: [] } })),
        apiClient.get('/employees/dashboard/posts').catch(() => ({ data: [] })),
        apiClient.get('/employees/dashboard/on-leave-today').catch(() => ({ data: [] })),
        apiClient.get('/employees/dashboard/next-holiday').catch(() => ({ data: null })),
        apiClient.get('/announcements').catch(() => ({ data: [] }))
      ]);
      setEmployeeData(empRes.data);
      setAttendanceStatus(statusRes.data);
      setAttendanceLogs(logsRes.data || []);
      setLeaveBalances(balancesRes.data || []);
      setLeaveRequests(requestsRes.data || []);
      setEvents(eventsRes.data || { birthdays: { today: [], upcoming: [] }, anniversaries: [], joinees: [] });
      setPosts(postsRes.data || []);
      setOnLeaveToday(onLeaveRes.data || []);
      setNextHoliday(holidayRes.data || null);
      setAnnouncements(announceRes.data || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePunch = async () => {
    try {
      if (attendanceStatus?.isCheckedIn) {
        await apiClient.post('/attendance/check-out');
      } else {
        await apiClient.post('/attendance/check-in');
      }
      fetchData(); // refresh data
    } catch (error) {
      console.error("Failed to punch in/out:", error);
    }
  };


  const LEAVE_COLORS = ['#00A3FF', '#28C76F', '#FF9F43', '#00BCD4', '#9B59B6', '#E74C3C', '#F39C12', '#1ABC9C'];

  const renderLeaveBalanceRing = (balance: any, colorIndex: number) => {
    const color = LEAVE_COLORS[colorIndex % LEAVE_COLORS.length];
    const total = Number(balance.totalDays) || 1;
    const used = Number(balance.usedDays) || 0;
    const remaining = Math.max(0, total - used);
    const usedPercent = Math.min(100, (used / total) * 100);

    const size = 72;
    const radius = 28;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (usedPercent / 100) * circumference;
    const cx = size / 2;
    const cy = size / 2;

    return (
      <div className="d-flex flex-column align-items-center">
        <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: `${size}px`, height: `${size}px` }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background grey track */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#EAEEF2" strokeWidth={strokeWidth} />
            {/* Consumed arc (colored) */}
            {used > 0 && (
              <circle
                cx={cx} cy={cy} r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.5s ease' }}
              />
            )}
          </svg>
          {/* Remaining days in center */}
          <div className="position-absolute text-center" style={{ lineHeight: 1 }}>
            <span className="fw-bold" style={{ fontSize: '14px', color: '#1a1a2e' }}>{remaining}</span>
          </div>
        </div>
        {/* Leave type label */}
        <div className="text-center mt-1">
          <span className="d-block fw-bold text-uppercase" style={{ fontSize: '8px', letterSpacing: '0.04em', color: '#8a8fb5' }}>
            {balance.leaveTypeName}
          </span>
        </div>
      </div>
    );
  };


  const renderTimeProgressRing = (valueStr: string, valueMs: number, targetMs: number, label: string, color: string) => {
    const radius = 24;
    const strokeWidth = 3.5;
    const circumference = 2 * Math.PI * radius;
    const percent = targetMs > 0 ? Math.min(100, (valueMs / targetMs) * 100) : 0;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-2">
        <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#EAEEF2"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dashoffset 0.35s',
              }}
            />
          </svg>
          <span className="position-absolute fw-bold text-gray-9" style={{ fontSize: '10px' }}>
            {valueStr.replace(/\s+/g, '')}
          </span>
        </div>
        <span className="d-block text-gray-5 mt-2 fw-semibold text-uppercase text-center" style={{ letterSpacing: '0.03em', fontSize: '9px' }}>
          {label}
        </span>
      </div>
    );
  };


  const getModalContainer = () => {
    const modalElement = document.getElementById('modal-datepicker');
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };
  // Today's Time Calculations

  // Today's Time Calculations
  let totalHoursStr = "00h 00m";
  let productiveHoursStr = "00h 00m";
  let breakHoursStr = "00m 00s";
  let overtimeStr = "00h 00m";

  let totalMs = 0;
  let breakMs = 0;
  let prodMs = 0;
  let overMs = 0;

  if (attendanceStatus?.record) {
    const record = attendanceStatus.record;

    // Total Hours (Elapsed since checkIn)
    const checkInTime = new Date(record.checkIn).getTime();
    const endTime = record.checkOut ? new Date(record.checkOut).getTime() : Date.now();
    totalMs = Math.max(0, endTime - checkInTime);

    const totalH = Math.floor(totalMs / 3600000);
    const totalM = Math.floor((totalMs % 3600000) / 60000);
    totalHoursStr = `${totalH.toString().padStart(2, '0')}h ${totalM.toString().padStart(2, '0')}m`;

    // Break Hours
    if (record.breakIn) {
      const bIn = new Date(record.breakIn).getTime();
      const bOut = record.breakOut ? new Date(record.breakOut).getTime() : Date.now();
      breakMs = Math.max(0, bOut - bIn);
    }
    const breakM = Math.floor(breakMs / 60000);
    const breakS = Math.floor((breakMs % 60000) / 1000);
    breakHoursStr = `${breakM.toString().padStart(2, '0')}m ${breakS.toString().padStart(2, '0')}s`;

    // Productive Hours (Total - Break)
    prodMs = Math.max(0, totalMs - breakMs);
    const prodH = Math.floor(prodMs / 3600000);
    const prodM = Math.floor((prodMs % 3600000) / 60000);
    productiveHoursStr = `${prodH.toString().padStart(2, '0')}h ${prodM.toString().padStart(2, '0')}m`;

    // Overtime (> 8 hours productive)
    const minFullDayMs = 8 * 3600000;
    if (prodMs > minFullDayMs) {
      overMs = prodMs - minFullDayMs;
      const overH = Math.floor(overMs / 3600000);
      const overM = Math.floor((overMs % 3600000) / 60000);
      overtimeStr = `${overH.toString().padStart(2, '0')}h ${overM.toString().padStart(2, '0')}m`;
    }
  }

  const getWeeklyHours = () => {
    if (!attendanceLogs || !Array.isArray(attendanceLogs)) return 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const todayStr = now.toISOString().split('T')[0];

    const weekLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      const logDateStr = logDate.toISOString().split('T')[0];
      return logDate >= startOfWeek && logDateStr !== todayStr;
    });

    const pastSum = weekLogs.reduce((acc, log) => acc + Number(log.workingHours || 0), 0);
    const todayLive = prodMs / 3600000;
    return parseFloat((pastSum + todayLive).toFixed(2));
  };

  const getMonthlyHours = () => {
    if (!attendanceLogs || !Array.isArray(attendanceLogs)) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = now.toISOString().split('T')[0];

    const monthLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      const logDateStr = logDate.toISOString().split('T')[0];
      return logDate >= startOfMonth && logDateStr !== todayStr;
    });

    const pastSum = monthLogs.reduce((acc, log) => acc + Number(log.workingHours || 0), 0);
    const todayLive = prodMs / 3600000;
    return parseFloat((pastSum + todayLive).toFixed(2));
  };

  const getMonthlyOvertime = () => {
    if (!attendanceLogs || !Array.isArray(attendanceLogs)) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = now.toISOString().split('T')[0];

    const monthLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      const logDateStr = logDate.toISOString().split('T')[0];
      return logDate >= startOfMonth && logDateStr !== todayStr;
    });

    const pastSum = monthLogs.reduce((acc, log) => {
      const workingHoursNum = Number(log.workingHours || 0);
      const ot = workingHoursNum > 8 ? workingHoursNum - 8 : 0;
      return acc + ot;
    }, 0);

    const todayLiveOt = overMs / 3600000;
    return parseFloat((pastSum + todayLiveOt).toFixed(2));
  };

  const getTodayPercentage = () => {
    const todayVal = parseFloat((totalMs / 3600000).toFixed(2));
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayLog = attendanceLogs.find(log => {
      const logDateStr = new Date(log.date || log.checkIn).toISOString().split('T')[0];
      return logDateStr === yesterdayStr;
    });

    const yesterdayVal = yesterdayLog ? Number(yesterdayLog.workingHours || 0) : 8.0;
    const diff = todayVal - yesterdayVal;
    const percent = yesterdayVal > 0 ? Math.abs(Math.round((diff / yesterdayVal) * 100)) : 5;
    return { percent: percent || 5, isUp: diff >= 0 };
  };

  const getWeeklyPercentage = () => {
    const thisWeekVal = getWeeklyHours();
    const now = new Date();
    const startOfLastWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
    startOfLastWeek.setDate(diff);
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);

    const lastWeekLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      return logDate >= startOfLastWeek && logDate < endOfLastWeek;
    });

    const lastWeekVal = lastWeekLogs.reduce((acc, log) => acc + Number(log.workingHours || 0), 0);
    const diffVal = thisWeekVal - lastWeekVal;
    const percent = lastWeekVal > 0 ? Math.abs(Math.round((diffVal / lastWeekVal) * 100)) : 7;
    return { percent: percent || 7, isUp: diffVal >= 0 };
  };

  const getMonthlyPercentage = () => {
    const thisMonthVal = getMonthlyHours();
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      return logDate >= startOfLastMonth && logDate < endOfLastMonth;
    });

    const lastMonthVal = lastMonthLogs.reduce((acc, log) => acc + Number(log.workingHours || 0), 0);
    const diffVal = thisMonthVal - lastMonthVal;
    const percent = lastMonthVal > 0 ? Math.abs(Math.round((diffVal / lastMonthVal) * 100)) : 8;
    return { percent: percent || 8, isUp: diffVal >= 0 };
  };

  const getOvertimePercentage = () => {
    const thisMonthOt = getMonthlyOvertime();
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      return logDate >= startOfLastMonth && logDate < endOfLastMonth;
    });

    const lastMonthOt = lastMonthLogs.reduce((acc, log) => {
      const workingHoursNum = Number(log.workingHours || 0);
      const ot = workingHoursNum > 8 ? workingHoursNum - 8 : 0;
      return acc + ot;
    }, 0);

    const diffVal = thisMonthOt - lastMonthOt;
    const percent = lastMonthOt > 0 ? Math.abs(Math.round((diffVal / lastMonthOt) * 100)) : 6;
    return { percent: percent || 6, isUp: diffVal >= 0 };
  };

  const todayPercent = getTodayPercentage();
  const weekPercent = getWeeklyPercentage();
  const monthPercent = getMonthlyPercentage();
  const overPercent = getOvertimePercentage();


  return (
    <>
      <style>{`
        .quill-style-editor .ql-toolbar.ql-snow {
          border: 1px solid #E2E8F0 !important;
          border-top-left-radius: 12px !important;
          border-top-right-radius: 12px !important;
          border-bottom: 1px solid #E2E8F0 !important;
          background-color: #FFFFFF !important;
          padding: 8px 16px !important;
        }
        .quill-style-editor .ql-container.ql-snow {
          border: 1px solid #E2E8F0 !important;
          border-top: none !important;
          border-bottom-left-radius: 12px !important;
          border-bottom-right-radius: 12px !important;
          background-color: #F8FAFC !important;
          font-family: inherit !important;
        }
        .quill-style-editor .ql-editor {
          min-height: 100px !important;
          font-size: 14px !important;
          color: #475569 !important;
        }
        .quill-style-editor .ql-editor.ql-blank::before {
          color: #94A3B8 !important;
          font-style: normal !important;
          left: 15px !important;
        }
        .quill-style-editor .ql-snow .ql-stroke {
          stroke: #64748B !important;
        }
        .quill-style-editor .ql-snow .ql-fill {
          fill: #64748B !important;
        }
        .quill-style-editor .ql-snow .ql-picker {
          color: #64748B !important;
        }
        
        /* Custom Event Tabs Style Override to match HGS Teal/Navy */
        .nav-tabs-solid .nav-link.active {
          background-color: #E0F7FA !important;
          color: #162E5B !important;
          font-weight: 600 !important;
        }
        .nav-tabs-solid .nav-link.active span.badge {
          background-color: #162E5B !important;
          color: #FFFFFF !important;
        }

        /* Welcome Banner Animations */
        @keyframes welcomeSlideIn {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes welcomeShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes welcomePulseRing {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 188, 212, 0.5); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 12px rgba(0, 188, 212, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 188, 212, 0); }
        }
        @keyframes welcomeFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-8px) rotate(3deg); }
          66%       { transform: translateY(4px) rotate(-2deg); }
        }
        @keyframes welcomeFloat2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(6px) rotate(-3deg); }
          66%       { transform: translateY(-10px) rotate(2deg); }
        }
        .welcome-banner {
          animation: welcomeSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .welcome-shimmer-text {
          background: linear-gradient(90deg, #FFFFFF 0%, #00BCD4 30%, #FFFFFF 50%, #FFFFFF 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: welcomeShimmer 3s linear infinite;
        }
        .welcome-pulse-icon {
          animation: welcomePulseRing 2.2s ease-in-out infinite;
        }
        .welcome-float-1 { animation: welcomeFloat  6s ease-in-out infinite; }
        .welcome-float-2 { animation: welcomeFloat2 8s ease-in-out infinite; }
        .welcome-float-3 { animation: welcomeFloat  5s ease-in-out infinite 1s; }
      `}</style>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Employee Dashboard</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Dashboard</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Employee Dashboard
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="d-inline-flex align-items-center bg-white border rounded-3 px-3 text-gray-9 fs-14 fw-medium" style={{ height: '40px', borderColor: '#E2E8F0' }}>
                <i className="ti ti-calendar me-2 text-gray-5 fs-16" />
                <span>{currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</span>
              </div>
              <div className="ms-2 mt-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Dynamic Approved Leave Alerts — only show today/future approved leaves */}
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcomingApproved = leaveRequests.filter((r: any) => {
              if (r.status !== 'APPROVED') return false;
              const end = new Date(r.endDate);
              end.setHours(0, 0, 0, 0);
              return end >= today;
            });
            if (upcomingApproved.length === 0) return null;
            return (
              <>
                {upcomingApproved.map((r: any) => {
                  const start = new Date(r.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const end = new Date(r.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const dateLabel = start === end ? start : `${start} – ${end}`;
                  const typeName = r.leaveType?.name || 'Leave';
                  return (
                    <div key={r.id} className="alert alert-dismissible fade show mb-3 d-flex align-items-center justify-content-between gap-2" style={{ backgroundColor: '#E8F5E9', borderLeft: '4px solid #28C76F', borderRadius: '8px', padding: '10px 16px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ color: '#28C76F', fontSize: '16px' }}>
                          <i className="ti ti-circle-check-filled" />
                        </span>
                        <span className="fw-medium" style={{ fontSize: '13px', color: '#1B5E20' }}>
                          Your <strong>{typeName}</strong> request from <strong>{dateLabel}</strong> ({r.totalDays} {Number(r.totalDays) === 1 ? 'day' : 'days'}) has been <strong>Approved</strong> ✓
                        </span>
                      </div>
                      <button type="button" className="btn-close fs-13" data-bs-dismiss="alert" aria-label="Close">
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  );
                })}
              </>
            );
          })()}

          {/* ── Animated Welcome Banner ── */}
          <div className="welcome-banner w-100 mb-4 position-relative overflow-hidden rounded-4" style={{
            background: 'linear-gradient(135deg, #0D1F3C 0%, #162E5B 40%, #1A4A7A 70%, #006064 100%)',
            minHeight: '80px',
            boxShadow: '0 8px 32px rgba(22,46,91,0.35)'
          }}>
            {/* Shimmer sweep overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, transparent 40%, rgba(0,188,212,0.12) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'welcomeShimmer 4s linear infinite',
              pointerEvents: 'none'
            }} />

            {/* Floating decorative blobs */}
            <div className="welcome-float-1" style={{
              position: 'absolute', top: '-20px', right: '120px',
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(0,188,212,0.15)', pointerEvents: 'none'
            }} />
            <div className="welcome-float-2" style={{
              position: 'absolute', bottom: '-15px', right: '60px',
              width: '55px', height: '55px', borderRadius: '50%',
              background: 'rgba(0,163,255,0.12)', pointerEvents: 'none'
            }} />
            <div className="welcome-float-3" style={{
              position: 'absolute', top: '10px', right: '25px',
              width: '35px', height: '35px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', pointerEvents: 'none'
            }} />

            {/* Content */}
            <div className="d-flex align-items-center gap-4 px-4" style={{ minHeight: '80px' }}>
              {/* Pulsing avatar icon */}
              <div className="welcome-pulse-icon d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{
                width: '52px', height: '52px',
                background: 'linear-gradient(135deg, #00BCD4, #0097A7)',
                boxShadow: '0 4px 16px rgba(0,188,212,0.4)'
              }}>
                <i className="ti ti-sun" style={{ fontSize: '22px', color: '#fff' }} />
              </div>

              {/* Text */}
              <div className="flex-fill">
                <p className="mb-0" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'} 👋
                </p>
                <h3 className="welcome-shimmer-text mb-0 fw-bold" style={{ fontSize: '22px', lineHeight: 1.3 }}>
                  Welcome back, {employeeData?.firstName || 'Employee'}!
                </h3>
                <p className="mb-0 mt-1" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  {employeeData?.designation?.name || ''}{employeeData?.designation?.name && employeeData?.department?.name ? ' · ' : ''}{employeeData?.department?.name || ''} — Have a productive day!
                </p>
              </div>

              {/* Right decorative date chip */}
              <div className="d-none d-md-flex flex-column align-items-center flex-shrink-0 me-2" style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px', padding: '10px 20px', textAlign: 'center'
              }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {new Date().getDate()}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.06em' }}>
                  {new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          {/* ── /Welcome Banner ── */}

          <div className="row">
            <div className="col-xxl-4 col-xl-12 d-flex flex-column row-gap-3">
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4 text-center">
                  <div className="position-relative d-inline-block mb-3">
                    <span className="avatar avatar-xxl avatar-rounded border border-2 border-white shadow-sm overflow-hidden" style={{ width: '90px', height: '90px', display: 'inline-block' }}>
                      {employeeData?.profilePhotoUrl ? (
                        <img
                          src={employeeData.profilePhotoUrl.startsWith('http') ? employeeData.profilePhotoUrl : `${apiUrl}${employeeData.profilePhotoUrl}`}
                          alt="Img"
                          className="img-fluid rounded-circle"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ImageWithBasePath src="assets/img/users/user-01.jpg" alt="Img" className="img-fluid rounded-circle" />
                      )}
                    </span>
                    <span className="position-absolute bg-success d-inline-flex align-items-center justify-content-center rounded-circle border border-white border-2" style={{ right: '0px', bottom: '5px', width: '22px', height: '22px' }}>
                      <i className="ti ti-discount-check-filled text-white" style={{ fontSize: '12px' }} />
                    </span>
                  </div>

                  <h5 className="text-gray-9 fw-bold mb-1 fs-18">
                    {employeeData?.firstName ? `${employeeData.firstName} ${employeeData.lastName}` : "Loading..."}
                  </h5>
                  <p className="text-gray-5 fs-13 mb-0 fw-medium">
                    {employeeData?.designation?.name || "N/A"} • {employeeData?.department?.name || "N/A"}
                  </p>

                  <hr className="my-3 border-light-subtle" />

                  <div className="text-start">
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1">
                      <span className="text-gray-5 fs-13">Phone Number</span>
                      <span className="text-gray-9 fw-medium fs-13">{employeeData?.phone || "N/A"}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1">
                      <span className="text-gray-5 fs-13">Email Address</span>
                      <span className="text-gray-9 fw-medium fs-13 text-truncate ms-2" style={{ maxWidth: '180px' }} title={employeeData?.user?.email}>{employeeData?.user?.email || "N/A"}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1">
                      <span className="text-gray-5 fs-13">Reporting Manager</span>
                      <span className="text-gray-9 fw-medium fs-13">{employeeData?.reportingManager ? `${employeeData.reportingManager.firstName} ${employeeData.reportingManager.lastName}` : "N/A"}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-gray-5 fs-13">Joined on</span>
                      <span className="text-gray-9 fw-medium fs-13">
                        {employeeData?.dateOfJoining ? new Date(employeeData.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Next Holiday — dynamic from DB */}
              <div className="card bg-warning">
                <div className="card-body d-flex align-items-center justify-content-between p-3">
                  <div>
                    <h5 className="mb-1">Next Holiday</h5>
                    {nextHoliday ? (
                      <p className="text-gray-9 mb-0">
                        {nextHoliday.title},{' '}
                        {new Date(nextHoliday.holidayDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    ) : (
                      <p className="text-gray-9 mb-0" style={{ opacity: 0.75 }}>No upcoming holidays</p>
                    )}
                  </div>
                  <Link to={all_routes.holidays} className="btn btn-white btn-md px-3">
                    View All
                  </Link>
                </div>
              </div>

              {/* On Leave Today — dynamic from DB */}
              <div className="card">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-medium text-gray-9 mb-0">On Leave Today</h6>
                    <span className="badge rounded-pill" style={{ backgroundColor: onLeaveToday.length > 0 ? '#FFF3E0' : '#E8F5E9', color: onLeaveToday.length > 0 ? '#E65100' : '#2E7D32', fontSize: '11px', fontWeight: 600 }}>
                      {onLeaveToday.length} {onLeaveToday.length === 1 ? 'employee' : 'employees'}
                    </span>
                  </div>
                  {onLeaveToday.length === 0 ? (
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h4 className="fs-15 text-gray-9 mb-1">Everyone is working today!</h4>
                        <p className="fs-13 text-gray-5 mb-0">No one is on leave today.</p>
                      </div>
                      <div style={{ width: '60px', height: '60px', opacity: 0.5 }}>
                        <svg width="100%" height="100%" viewBox="0 0 60 60" fill="none">
                          <circle cx="30" cy="30" r="28" fill="#E8F5E9" />
                          <path d="M20 30 L27 37 L40 23" stroke="#28C76F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                      {onLeaveToday.map((emp: any) => (
                        <div key={emp.id} className="d-flex align-items-center gap-2 p-2 rounded-2" style={{ backgroundColor: '#FFF8F0' }}>
                          <div className="avatar avatar-sm rounded-circle flex-shrink-0 overflow-hidden" style={{ width: '34px', height: '34px', backgroundColor: '#FFE0B2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {emp.profilePhotoUrl ? (
                              <img
                                src={emp.profilePhotoUrl.startsWith('http') ? emp.profilePhotoUrl : `${apiUrl}${emp.profilePhotoUrl}`}
                                alt={emp.employeeName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              />
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#E65100' }}>
                                {emp.employeeName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-fill min-w-0">
                            <p className="mb-0 fw-semibold text-truncate" style={{ fontSize: '12px', color: '#1a1a2e' }}>{emp.employeeName}</p>
                            <p className="mb-0 text-truncate" style={{ fontSize: '10px', color: '#8a8fb5' }}>{emp.designation || emp.department || 'Employee'}</p>
                          </div>
                          <span className="badge flex-shrink-0" style={{ backgroundColor: '#FFE0B2', color: '#BF360C', fontSize: '9px', fontWeight: 600 }}>
                            {emp.leaveType}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card border-0" style={{ backgroundColor: '#162E5B', borderRadius: '8px' }}>
                <div className="card-body p-3 text-white">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <span className="text-white fs-14 fw-medium">Time Today - {getFormattedDate()}</span>
                    <Link to={all_routes.attendanceemployee} className="text-white text-decoration-underline fs-14 fw-medium">View All</Link>
                  </div>
                  <span className="d-block text-white-50 fs-11 fw-bold tracking-wide mb-1" style={{ letterSpacing: '0.05em' }}>CURRENT TIME</span>
                  <div className="d-flex align-items-end justify-content-between">
                    <div className="d-flex align-items-baseline text-white">
                      <h1 className="display-4 text-white mb-0 fw-normal" style={{ fontSize: '2.5rem', lineHeight: '1' }}>{hhmm}</h1>
                      <span className="fs-14 ms-1" style={{ opacity: 0.85 }}>{ssAmPm}</span>
                    </div>
                    <button onClick={handlePunch} className="btn px-4 py-2 border-0 fw-medium fs-14 rounded-3 text-white" style={{ backgroundColor: attendanceStatus?.isCheckedIn ? '#FF655A' : '#03C95A', transition: 'all 0.2s' }}>
                      {attendanceStatus?.isCheckedIn ? "Clock-out" : "Clock-in"}
                    </button>
                  </div>
                </div>
              </div>


              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <h6 className="fw-medium text-gray-9 mb-4">Time Progress</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      {renderTimeProgressRing(totalHoursStr, totalMs, 9 * 3600000, "Total Working", "#8F9BBA")}
                    </div>
                    <div className="col-6">
                      {renderTimeProgressRing(productiveHoursStr, prodMs, 8 * 3600000, "Productive", "#28C76F")}
                    </div>
                    <div className="col-6">
                      {renderTimeProgressRing(breakHoursStr, breakMs, 1 * 3600000, "Break Hours", "#FF9F43")}
                    </div>
                    <div className="col-6">
                      {renderTimeProgressRing(overtimeStr, overMs, 4 * 3600000, "Overtime", "#3A9BF2")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-medium text-gray-9 mb-0">Leave Balances</h6>
                    <div className="text-end">
                      <Link to={all_routes.leaveemployee} className="d-block fs-9 fw-semibold mb-1" style={{ color: '#FE502E' }}>Request Leave</Link>
                      <Link to={all_routes.leaveemployee} className="d-block fs-8 fw-semibold" style={{ color: '#162E5B' }}>View All Balances</Link>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="d-flex align-items-center gap-3 mb-3 px-1">
                    <div className="d-flex align-items-center gap-1">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00A3FF', display: 'inline-block' }} />
                      <span style={{ fontSize: '10px', color: '#8a8fb5' }}>Consumed</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EAEEF2', border: '1px solid #ccc', display: 'inline-block' }} />
                      <span style={{ fontSize: '10px', color: '#8a8fb5' }}>Remaining</span>
                    </div>
                  </div>

                  {/* Dynamic rings from API */}
                  {leaveBalances.length === 0 ? (
                    <p className="text-muted text-center fs-13 py-3">No leave balances found</p>
                  ) : (
                    <div className="row text-center g-3">
                      {leaveBalances.map((bal: any, idx: number) => (
                        <div key={bal.leaveTypeId} className={`col-${leaveBalances.length <= 2 ? 6 : leaveBalances.length <= 3 ? 4 : 3} px-1`}>
                          {renderLeaveBalanceRing(bal, idx)}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>

            </div>
            <div className="col-xxl-8 col-xl-12">
              <div className="row flex-fill d-none m-0">
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-primary mb-2">
                          <i className="ti ti-clock-stop" />
                        </span>
                        <h2 className="mb-2">
                          {(totalMs / 3600000).toFixed(2)} / <span className="fs-20 text-gray-5"> 9</span>
                        </h2>
                        <p className="fw-medium text-truncate">Total Hours Today</p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13">
                          <span className={`avatar avatar-xs rounded-circle bg-${todayPercent.isUp ? 'success' : 'danger'} flex-shrink-0 me-2`}>
                            <i className={`ti ti-arrow-${todayPercent.isUp ? 'up' : 'down'} fs-12`} />
                          </span>
                          <span>{todayPercent.percent}% This Week</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-dark mb-2">
                          <i className="ti ti-clock-up" />
                        </span>
                        <h2 className="mb-2">
                          {getWeeklyHours()} / <span className="fs-20 text-gray-5"> 40</span>
                        </h2>
                        <p className="fw-medium text-truncate">Total Hours Week</p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13">
                          <span className={`avatar avatar-xs rounded-circle bg-${weekPercent.isUp ? 'success' : 'danger'} flex-shrink-0 me-2`}>
                            <i className={`ti ti-arrow-${weekPercent.isUp ? 'up' : 'down'} fs-12`} />
                          </span>
                          <span>{weekPercent.percent}% Last Week</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-info mb-2">
                          <i className="ti ti-calendar-up" />
                        </span>
                        <h2 className="mb-2">
                          {getMonthlyHours()} / <span className="fs-20 text-gray-5"> 98</span>
                        </h2>
                        <p className="fw-medium text-truncate">Total Hours Month</p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13 text-truncate">
                          <span className={`avatar avatar-xs rounded-circle bg-${monthPercent.isUp ? 'success' : 'danger'} flex-shrink-0 me-2`}>
                            <i className={`ti ti-arrow-${monthPercent.isUp ? 'up' : 'down'} fs-12`} />
                          </span>
                          <span>{monthPercent.percent}% Last Month</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-pink mb-2">
                          <i className="ti ti-calendar-star" />
                        </span>
                        <h2 className="mb-2">
                          {getMonthlyOvertime()} / <span className="fs-20 text-gray-5"> 28</span>
                        </h2>
                        <p className="fw-medium text-truncate">
                          Overtime this Month
                        </p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13 text-truncate">
                          <span className={`avatar avatar-xs rounded-circle bg-${overPercent.isUp ? 'success' : 'danger'} flex-shrink-0 me-2`}>
                            <i className={`ti ti-arrow-${overPercent.isUp ? 'up' : 'down'} fs-12`} />
                          </span>
                          <span>{overPercent.percent}% Last Month</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="row">
                <div className="col-xl-9 col-lg-8 col-md-12">
                  {/* ORGANIZATION & OPERATIONS SUBHEADER TAGS */}
                  <div className="d-flex align-items-center gap-2 mb-4 mt-4">
                    <span className="badge bg-outline-secondary rounded-pill px-3 py-2 text-gray-9 fw-medium" style={{ border: '1px solid #E2E8F0', color: '#1E293B', backgroundColor: '#F8FAFC' }}>Organization</span>
                    <span className="badge bg-outline-secondary rounded-pill px-3 py-2 text-gray-5 fw-medium" style={{ border: '1px solid #E2E8F0', color: '#64748B', backgroundColor: '#F8FAFC' }}>{employeeData?.department?.name || 'Operations'} • {employeeData?.designation?.name || 'Employee'}</span>
                  </div>

                  {/* CREATE POST CARD */}
                  <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '32px', height: '32px', color: '#00BCD4', backgroundColor: '#E0F7FA' }}>
                          <i className="ti ti-edit fs-16" />
                        </span>
                        <h6 className="fw-semibold text-gray-9 mb-0">Create Post</h6>
                      </div>

                      {/* Rich Text Editor */}
                      <div className="mb-3">
                        <CommonTextEditor
                          value={newPostText}
                          onChange={setNewPostText}
                          placeholder="What do you want to share with your peers?"
                          minHeight="120px"
                        />
                      </div>

                      {/* Publish Actions */}
                      <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-2">
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`btn btn-sm d-flex align-items-center gap-1 px-3 ${selectedFile ? 'btn-success text-white' : 'btn-light text-gray-6'}`}
                            style={{ borderRadius: '6px' }}
                          >
                            <i className="ti ti-paperclip fs-14" />
                            <span>{selectedFile ? 'Attached' : 'Attach'}</span>
                          </button>
                          {selectedFile && (
                            <span className="fs-12 text-gray-5 d-flex align-items-center gap-1">
                              {selectedFile.name.length > 15 ? `${selectedFile.name.substring(0, 12)}...` : selectedFile.name}
                              <button type="button" onClick={() => setSelectedFile(null)} className="btn p-0 border-0 text-danger fs-14 line-height-1" style={{ outline: 'none' }}>×</button>
                            </span>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            style={{ display: 'none' }}
                            accept="image/*"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCreatePost}
                          className="btn text-white px-4"
                          style={{ backgroundColor: '#162E5B', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}
                        >
                          Publish
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ANNOUNCEMENTS CARD */}
                  <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#F4F7FB' }}>
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-3">
                          <span className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '40px', height: '40px', color: '#00BCD4', backgroundColor: '#E0F7FA' }}>
                            <i className="ti ti-megaphone-filled fs-20" />
                          </span>
                          <div>
                            <h6 className="fw-semibold text-gray-9 mb-0 fs-14">Announcements</h6>
                            <p className="text-gray-5 fs-12 mb-0">
                              {announcements.length > 0 ? `${announcements.length} active ${announcements.length === 1 ? 'announcement' : 'announcements'}` : 'No new announcements today'}
                            </p>
                          </div>
                        </div>
                        <Link to={all_routes.announcements} className="btn btn-icon rounded-circle d-inline-flex align-items-center justify-content-center text-white" style={{ width: '32px', height: '32px', backgroundColor: '#162E5B' }} title="Manage Announcements">
                          <i className="ti ti-plus fs-16" />
                        </Link>
                      </div>

                      {/* Announcement Items List */}
                      {announcements.length > 0 && (
                        <div className="mt-3 d-flex flex-column gap-2" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                          {announcements.map((a: any) => (
                            <div key={a.id} className="p-3 bg-white rounded-3 border border-light-subtle shadow-xs">
                              <div className="d-flex align-items-center justify-content-between mb-1">
                                <span className="fw-bold text-gray-9 fs-13">{a.title}</span>
                                <span className="text-gray-4 fs-11 ms-2 flex-shrink-0">
                                  {formatPostTime(a.publishedAt || a.createdAt)}
                                </span>
                              </div>
                              <p className="text-gray-6 fs-12 mb-2" style={{ whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                                {a.content}
                              </p>
                              {a.imageUrl && (
                                <div className="mb-2">
                                  <img
                                    src={a.imageUrl.startsWith('http') ? a.imageUrl : `${apiUrl}${a.imageUrl}`}
                                    alt="Attachment"
                                    className="rounded-2"
                                    style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              )}
                              {a.createdBy && (
                                <div className="d-flex align-items-center gap-1 text-gray-5 fs-11">
                                  <i className="ti ti-user fs-12" />
                                  <span>{a.createdBy.firstName} {a.createdBy.lastName}</span>
                                  {a.createdBy.designation?.name && <span>· {a.createdBy.designation.name}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EVENTS TABS CARD (Birthdays, Work Anniversary, New Joinees) */}
                  <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-3">
                      {/* Tabs Header */}
                      <ul className="nav nav-tabs nav-tabs-solid border-0 mb-3 gap-2">
                        <li className="nav-item">
                          <button
                            type="button"
                            onClick={() => setActiveTab('birthdays')}
                            className={`nav-link border-0 rounded-pill px-3 py-2 fs-13 d-flex align-items-center gap-2 fw-medium ${activeTab === 'birthdays' ? 'active text-danger bg-danger-transparent' : 'text-gray-6 bg-light'}`}
                            style={{ transition: 'all 0.2s' }}
                          >
                            <span className="d-inline-block rounded-circle bg-danger" style={{ width: '8px', height: '8px' }} />
                            Birthdays <span className="badge bg-danger text-white rounded-pill ms-1 fs-10" style={{ padding: '2px 6px' }}>{events.birthdays?.today?.length || 0}</span>
                          </button>
                        </li>
                        <li className="nav-item">
                          <button
                            type="button"
                            onClick={() => setActiveTab('anniversaries')}
                            className={`nav-link border-0 rounded-pill px-3 py-2 fs-13 d-flex align-items-center gap-2 fw-medium ${activeTab === 'anniversaries' ? 'active text-warning bg-warning-transparent' : 'text-gray-6 bg-light'}`}
                            style={{ transition: 'all 0.2s' }}
                          >
                            <span className="d-inline-block rounded-circle bg-warning" style={{ width: '8px', height: '8px' }} />
                            Work Anniversary <span className="badge bg-warning text-dark rounded-pill ms-1 fs-10" style={{ padding: '2px 6px' }}>{events.anniversaries.length}</span>
                          </button>
                        </li>
                        <li className="nav-item">
                          <button
                            type="button"
                            onClick={() => setActiveTab('joinees')}
                            className={`nav-link border-0 rounded-pill px-3 py-2 fs-13 d-flex align-items-center gap-2 fw-medium ${activeTab === 'joinees' ? 'active text-info bg-info-transparent' : 'text-gray-6 bg-light'}`}
                            style={{ transition: 'all 0.2s' }}
                          >
                            <span className="d-inline-block rounded-circle bg-info" style={{ width: '8px', height: '8px' }} />
                            New Joinees <span className="badge bg-info text-white rounded-pill ms-1 fs-10" style={{ padding: '2px 6px' }}>{events.joinees.length}</span>
                          </button>
                        </li>
                      </ul>

                      {/* Tabs Content */}
                      <div className="tab-content">
                        {activeTab === 'birthdays' && (
                          <div className="p-2">
                            {/* Birthdays Today Section */}
                            <div className="mb-4">
                              <h6 className="text-gray-9 fw-semibold fs-13 mb-3">Birthdays today</h6>
                              <div className="d-flex align-items-center flex-wrap gap-4">
                                {events.birthdays?.today?.length > 0 ? (
                                  events.birthdays.today.map((b: any) => (
                                    <div key={b.id} className="text-center d-flex flex-column align-items-center" style={{ width: '70px' }}>
                                      <span className="avatar avatar-lg rounded-circle border border-2 border-danger overflow-hidden mb-2" style={{ width: '56px', height: '56px' }}>
                                        {b.profilePhotoUrl ? (
                                          <img src={b.profilePhotoUrl.startsWith('http') ? b.profilePhotoUrl : `${apiUrl}${b.profilePhotoUrl}`} alt="Img" className="img-fluid rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          <ImageWithBasePath src="assets/img/users/user-02.jpg" alt="Img" className="img-fluid rounded-circle" />
                                        )}
                                      </span>
                                      <span className="d-block text-gray-9 fs-12 fw-medium text-truncate w-100" title={b.name} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                        {b.name.split(' ')[0]}
                                      </span>
                                      <button type="button" className="btn btn-link p-0 border-0 text-decoration-none fs-12 fw-semibold" style={{ color: '#00BCD4', outline: 'none' }}>
                                        Wish
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-5 fs-12 mb-0 ps-1">No birthdays today</p>
                                )}
                              </div>
                            </div>

                            {/* Upcoming Birthdays Section */}
                            <div>
                              <h6 className="text-gray-9 fw-semibold fs-13 mb-3">Upcoming Birthdays</h6>
                              <div className="d-flex align-items-center flex-wrap gap-4">
                                {events.birthdays?.upcoming?.length > 0 ? (
                                  events.birthdays.upcoming.map((b: any) => (
                                    <div key={b.id} className="text-center d-flex flex-column align-items-center" style={{ width: '75px' }}>
                                      <span className="avatar avatar-lg rounded-circle border border-1 border-light overflow-hidden mb-2" style={{ width: '56px', height: '56px' }}>
                                        {b.profilePhotoUrl ? (
                                          <img src={b.profilePhotoUrl.startsWith('http') ? b.profilePhotoUrl : `${apiUrl}${b.profilePhotoUrl}`} alt="Img" className="img-fluid rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          <ImageWithBasePath src="assets/img/users/user-02.jpg" alt="Img" className="img-fluid rounded-circle" />
                                        )}
                                      </span>
                                      <span className="d-block text-gray-9 fs-12 fw-medium text-truncate w-100" title={b.name} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                        {b.name.split(' ')[0]}
                                      </span>
                                      <span className="d-block text-gray-4 fs-10 text-nowrap mt-1">
                                        {b.dateStr}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-5 fs-12 mb-0 ps-1">No upcoming birthdays</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {activeTab === 'anniversaries' && (
                          <div className="p-2">
                            <div className="d-flex align-items-center flex-wrap gap-4">
                              {events.anniversaries?.length > 0 ? (
                                events.anniversaries.map((a: any) => (
                                  <div key={a.id} className="text-center d-flex flex-column align-items-center" style={{ width: '75px' }}>
                                    <span className="avatar avatar-lg rounded-circle border border-2 border-warning overflow-hidden mb-2" style={{ width: '56px', height: '56px' }}>
                                      {a.profilePhotoUrl ? (
                                        <img src={a.profilePhotoUrl.startsWith('http') ? a.profilePhotoUrl : `${apiUrl}${a.profilePhotoUrl}`} alt="Img" className="img-fluid rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        <ImageWithBasePath src="assets/img/users/user-02.jpg" alt="Img" className="img-fluid rounded-circle" />
                                      )}
                                    </span>
                                    <span className="d-block text-gray-9 fs-12 fw-medium text-truncate w-100" title={a.name} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                      {a.name.split(' ')[0]}
                                    </span>
                                    <span className="d-block text-gray-4 fs-10 text-nowrap mt-1">
                                      {a.years}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-5 fs-12 mb-0 ps-1">No work anniversaries today</p>
                              )}
                            </div>
                          </div>
                        )}
                        {activeTab === 'joinees' && (
                          <div className="p-2">
                            <div className="d-flex align-items-center flex-wrap gap-4">
                              {events.joinees?.length > 0 ? (
                                events.joinees.map((j: any) => (
                                  <div key={j.id} className="text-center d-flex flex-column align-items-center" style={{ width: '75px' }}>
                                    <span className="avatar avatar-lg rounded-circle border border-2 border-info overflow-hidden mb-2" style={{ width: '56px', height: '56px' }}>
                                      {j.profilePhotoUrl ? (
                                        <img src={j.profilePhotoUrl.startsWith('http') ? j.profilePhotoUrl : `${apiUrl}${j.profilePhotoUrl}`} alt="Img" className="img-fluid rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        <ImageWithBasePath src="assets/img/users/user-02.jpg" alt="Img" className="img-fluid rounded-circle" />
                                      )}
                                    </span>
                                    <span className="d-block text-gray-9 fs-12 fw-medium text-truncate w-100" title={j.name} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                      {j.name.split(' ')[0]}
                                    </span>
                                    <span className="d-block text-gray-4 fs-10 text-nowrap mt-1">
                                      {new Date(j.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-5 fs-12 mb-0 ps-1">No new joinees recently</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* POSTS FEED */}
                  <div className="posts-feed-container">
                    {posts.map(post => (
                      <div key={post.id} className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                        <div className="card-body p-4">
                          {/* Post Header */}
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="avatar avatar-md avatar-rounded border border-white shadow-sm overflow-hidden" style={{ width: '40px', height: '40px' }}>
                                {post.profilePhotoUrl ? (
                                  <img src={post.profilePhotoUrl.startsWith('http') ? post.profilePhotoUrl : `${apiUrl}${post.profilePhotoUrl}`} alt="Img" className="img-fluid rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <ImageWithBasePath src="assets/img/users/user-01.jpg" alt="Img" className="img-fluid rounded-circle" />
                                )}
                              </span>
                              <div>
                                <h6 className="fw-bold text-gray-9 mb-0 fs-14">{post.author}</h6>
                                <p className="text-gray-5 fs-12 mb-0">{formatPostTime(post.timestamp)} • <span className="fw-medium text-gray-4">{post.designation}</span></p>
                              </div>
                            </div>
                            {employeeData && (post.employeeId === employeeData.id || employeeData.user?.role === 'HR' || employeeData.user?.role === 'SUPER_ADMIN') && (
                              <div className="dropdown">
                                <Link to="#" className="text-gray-4" data-bs-toggle="dropdown">
                                  <i className="ti ti-dots-vertical fs-18" />
                                </Link>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center gap-2"
                                      onClick={() => {
                                        setEditingPostId(post.id);
                                        setEditingPostText(post.content);
                                        setEditingFile(null);
                                        setEditingImageRemoved(false);
                                      }}
                                    >
                                      <i className="ti ti-edit fs-14" /> Edit
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item text-danger d-flex align-items-center gap-2"
                                      onClick={() => handleDeletePost(post.id)}
                                    >
                                      <i className="ti ti-trash fs-14" /> Delete
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Post Content */}
                          {editingPostId === post.id ? (
                            <div className="mb-3">
                              <div className="mb-2">
                                <CommonTextEditor
                                  value={editingPostText}
                                  onChange={setEditingPostText}
                                  placeholder="What do you want to share with your peers?"
                                  minHeight="100px"
                                />
                              </div>

                              {/* Existing Image Preview (if present and not removed) */}
                              {post.image && !editingImageRemoved && (
                                <div className="mb-3 position-relative d-inline-block rounded overflow-hidden border border-light" style={{ maxHeight: '150px' }}>
                                  <img
                                    src={post.image.startsWith('http') ? post.image : `${apiUrl}${post.image}`}
                                    alt="Current Attachment"
                                    className="img-fluid"
                                    style={{ maxHeight: '150px', objectFit: 'contain' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditingImageRemoved(true)}
                                    className="btn btn-danger btn-xs position-absolute top-0 end-0 m-1 text-white px-2 py-1 d-flex align-items-center justify-content-center"
                                    style={{ borderRadius: '4px', fontSize: '10px', minWidth: 'auto', height: 'auto', lineHeight: '1' }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}

                              {/* Actions Row */}
                              <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-2">
                                <div className="d-flex align-items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => editFileInputRef.current?.click()}
                                    className={`btn btn-sm d-flex align-items-center gap-1 px-3 ${editingFile ? 'btn-success text-white' : 'btn-light text-gray-6'}`}
                                    style={{ borderRadius: '6px' }}
                                  >
                                    <i className="ti ti-paperclip fs-14" />
                                    <span>{editingFile ? 'New Image Attached' : 'Attach/Change Image'}</span>
                                  </button>
                                  {editingFile && (
                                    <span className="fs-12 text-gray-5 d-flex align-items-center gap-1">
                                      {editingFile.name.length > 15 ? `${editingFile.name.substring(0, 12)}...` : editingFile.name}
                                      <button type="button" onClick={() => setEditingFile(null)} className="btn p-0 border-0 text-danger fs-14 line-height-1" style={{ outline: 'none' }}>×</button>
                                    </span>
                                  )}
                                  <input
                                    type="file"
                                    ref={editFileInputRef}
                                    onChange={(e) => {
                                      setEditingFile(e.target.files?.[0] || null);
                                      setEditingImageRemoved(true);
                                    }}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                  />
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <button type="button" className="btn btn-light btn-sm px-3" onClick={() => setEditingPostId(null)} style={{ borderRadius: '6px' }}>Cancel</button>
                                  <button type="button" className="btn btn-primary btn-sm px-3 text-white" onClick={() => handleSaveEdit(post.id)} style={{ borderRadius: '6px', backgroundColor: '#162E5B', border: 'none', fontWeight: 600 }}>Save</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-9 fs-14 mb-3" dangerouslySetInnerHTML={{ __html: post.content }} />
                          )}

                          {/* Post Image Attachment */}
                          {post.image && (
                            <div className="post-image-attachment mb-3 rounded-3 overflow-hidden border border-light" style={{ maxHeight: '400px' }}>
                              <img src={post.image.startsWith('http') ? post.image : `${apiUrl}${post.image}`} alt="Post Attachment" className="img-fluid w-100" style={{ objectFit: 'cover' }} />
                            </div>
                          )}

                          {/* Likes count reaction panel */}
                          {post.likes > 0 && (
                            <div className="d-flex align-items-center gap-1 mb-2 pb-2 border-bottom border-light">
                              <span className="fs-12">👍</span>
                              <span className="fs-12 text-gray-6">{post.likes}</span>
                            </div>
                          )}

                          {/* Post Actions (Like, Comment) */}
                          <div className="d-flex align-items-center gap-4 py-2 border-top border-bottom border-light mb-3">
                            <button
                              type="button"
                              onClick={() => handleToggleLike(post.id)}
                              className={`btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1 fs-13 ${post.liked ? 'text-primary fw-semibold' : 'text-gray-5'}`}
                            >
                              <i className={`ti ti-thumb-up${post.liked ? '-filled' : ''} fs-16`} />
                              <span>Like</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1 text-gray-5 fs-13"
                            >
                              <i className="ti ti-message-2 fs-16" />
                              <span>Comment</span>
                            </button>
                          </div>

                          {/* Comments Feed List */}
                          {post.comments.length > 0 && (
                            <div className="comments-list mb-3 p-3 rounded" style={{ backgroundColor: '#F8FAFC' }}>
                              {post.comments.map((comment: any) => (
                                <div key={comment.id} className="comment-item mb-3 pb-3 border-bottom border-light last-border-0">
                                  <div className="d-flex align-items-center justify-content-between mb-1">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="avatar avatar-xs avatar-rounded overflow-hidden" style={{ width: '20px', height: '20px' }}>
                                        {comment.profilePhotoUrl ? (
                                          <img src={comment.profilePhotoUrl.startsWith('http') ? comment.profilePhotoUrl : `${apiUrl}${comment.profilePhotoUrl}`} alt="Img" className="img-fluid rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          <ImageWithBasePath src="assets/img/users/user-01.jpg" alt="Img" className="img-fluid rounded-circle" />
                                        )}
                                      </span>
                                      <span className="fw-semibold text-gray-9 fs-12">{comment.author}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="text-gray-4 fs-11">{formatPostTime(comment.timestamp)}</span>
                                      {employeeData && (comment.employeeId === employeeData.id || employeeData.user?.role === 'HR' || employeeData.user?.role === 'SUPER_ADMIN') && (
                                        <div className="dropdown">
                                          <Link to="#" className="text-gray-4 p-0 fs-10" data-bs-toggle="dropdown" style={{ outline: 'none' }}>
                                            <i className="ti ti-dots-vertical" />
                                          </Link>
                                          <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: '80px', padding: '4px 0' }}>
                                            {comment.employeeId === employeeData.id && (
                                              <li>
                                                <button
                                                  type="button"
                                                  className="dropdown-item py-1 px-2 d-flex align-items-center gap-1 fs-11"
                                                  onClick={() => {
                                                    setEditingCommentId(comment.id);
                                                    setEditingCommentText(comment.content);
                                                  }}
                                                >
                                                  <i className="ti ti-edit" /> Edit
                                                </button>
                                              </li>
                                            )}
                                            <li>
                                              <button
                                                type="button"
                                                className="dropdown-item text-danger py-1 px-2 d-flex align-items-center gap-1 fs-11"
                                                onClick={() => handleDeleteComment(comment.id)}
                                              >
                                                <i className="ti ti-trash" /> Delete
                                              </button>
                                            </li>
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {editingCommentId === comment.id ? (
                                    <div className="d-flex align-items-center gap-2 mt-1" style={{ paddingLeft: '28px' }}>
                                      <input
                                        type="text"
                                        className="form-control form-control-sm bg-white border border-light flex-grow-1"
                                        value={editingCommentText}
                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveCommentEdit(comment.id);
                                          }
                                        }}
                                        style={{ borderRadius: '12px', fontSize: '12px' }}
                                      />
                                      <button type="button" className="btn btn-sm btn-link p-0 text-gray-5 fs-11 text-decoration-none" onClick={() => setEditingCommentId(null)}>Cancel</button>
                                      <button type="button" className="btn btn-sm btn-link p-0 text-primary fs-11 text-decoration-none" onClick={() => handleSaveCommentEdit(comment.id)}>Save</button>
                                    </div>
                                  ) : (
                                    <p className="text-gray-7 fs-12 mb-0" style={{ paddingLeft: '28px' }}>{comment.content}</p>
                                  )}

                                  {/* Comment Actions (Like, Reply) */}
                                  <div className="d-flex align-items-center gap-3 mt-1 pb-1" style={{ paddingLeft: '28px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCommentLike(comment.id)}
                                      className={`btn btn-link p-0 text-decoration-none fs-11 d-flex align-items-center gap-1 border-0 ${comment.liked ? 'fw-semibold' : 'text-gray-5'}`} style={{ outline: 'none', color: comment.liked ? '#00BCD4' : '#64748B' }}
                                    >
                                      <i className={`ti ti-thumb-up${comment.liked ? '-filled' : ''} fs-12`} />
                                      <span>{comment.likesCount > 0 ? `${comment.likesCount} Like${comment.likesCount > 1 ? 's' : ''}` : 'Like'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingToCommentId(comment.id);
                                        setReplyText('');
                                      }}
                                      className="btn btn-link p-0 text-decoration-none text-gray-5 fs-11 d-flex align-items-center gap-1 border-0"
                                      style={{ outline: 'none' }}
                                    >
                                      <i className="ti ti-message-2 fs-12" />
                                      <span>Reply</span>
                                    </button>
                                  </div>

                                  {/* Nested Replies Rendering */}
                                  {comment.replies && comment.replies.length > 0 && (
                                    <div className="replies-list ms-4 ps-3 border-start border-light mb-2">
                                      {comment.replies.map((reply: any) => (
                                        <div key={reply.id} className="reply-item mt-2 pb-1 border-bottom border-light last-border-0">
                                          <div className="d-flex align-items-center justify-content-between mb-1">
                                            <div className="d-flex align-items-center gap-2">
                                              <span className="avatar avatar-xs avatar-rounded overflow-hidden" style={{ width: '18px', height: '18px' }}>
                                                {reply.profilePhotoUrl ? (
                                                  <img src={reply.profilePhotoUrl.startsWith('http') ? reply.profilePhotoUrl : `${apiUrl}${reply.profilePhotoUrl}`} alt="Img" className="img-fluid rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                  <ImageWithBasePath src="assets/img/users/user-01.jpg" alt="Img" className="img-fluid rounded-circle" />
                                                )}
                                              </span>
                                              <span className="fw-semibold text-gray-9 fs-11">{reply.author}</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                              <span className="text-gray-4 fs-10">{formatPostTime(reply.timestamp)}</span>
                                              {employeeData && (reply.employeeId === employeeData.id || employeeData.user?.role === 'HR' || employeeData.user?.role === 'SUPER_ADMIN') && (
                                                <div className="dropdown">
                                                  <Link to="#" className="text-gray-4 p-0 fs-10" data-bs-toggle="dropdown" style={{ outline: 'none' }}>
                                                    <i className="ti ti-dots-vertical" />
                                                  </Link>
                                                  <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: '80px', padding: '4px 0' }}>
                                                    {reply.employeeId === employeeData.id && (
                                                      <li>
                                                        <button
                                                          type="button"
                                                          className="dropdown-item py-1 px-2 d-flex align-items-center gap-1 fs-10"
                                                          onClick={() => {
                                                            setEditingCommentId(reply.id);
                                                            setEditingCommentText(reply.content);
                                                          }}
                                                        >
                                                          <i className="ti ti-edit" /> Edit
                                                        </button>
                                                      </li>
                                                    )}
                                                    <li>
                                                      <button
                                                        type="button"
                                                        className="dropdown-item text-danger py-1 px-2 d-flex align-items-center gap-1 fs-10"
                                                        onClick={() => handleDeleteComment(reply.id)}
                                                      >
                                                        <i className="ti ti-trash" /> Delete
                                                      </button>
                                                    </li>
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          {editingCommentId === reply.id ? (
                                            <div className="d-flex align-items-center gap-2 mt-1" style={{ paddingLeft: '26px' }}>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm bg-white border border-light flex-grow-1"
                                                value={editingCommentText}
                                                onChange={(e) => setEditingCommentText(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    handleSaveCommentEdit(reply.id);
                                                  }
                                                }}
                                                style={{ borderRadius: '12px', fontSize: '11px' }}
                                              />
                                              <button type="button" className="btn btn-sm btn-link p-0 text-gray-5 fs-10 text-decoration-none" onClick={() => setEditingCommentId(null)}>Cancel</button>
                                              <button type="button" className="btn btn-sm btn-link p-0 text-primary fs-10 text-decoration-none" onClick={() => handleSaveCommentEdit(reply.id)}>Save</button>
                                            </div>
                                          ) : (
                                            <p className="text-gray-7 fs-11 mb-1" style={{ paddingLeft: '26px' }}>{reply.content}</p>
                                          )}

                                          {/* Reply Action: Like */}
                                          <div className="d-flex align-items-center gap-2" style={{ paddingLeft: '26px' }}>
                                            <button
                                              type="button"
                                              onClick={() => handleToggleCommentLike(reply.id)}
                                              className={`btn btn-link p-0 text-decoration-none fs-10 d-flex align-items-center gap-1 border-0 ${reply.liked ? 'fw-semibold' : 'text-gray-5'}`} style={{ outline: 'none', color: reply.liked ? '#00BCD4' : '#64748B' }}
                                            >
                                              <i className={`ti ti-thumb-up${reply.liked ? '-filled' : ''} fs-10`} />
                                              <span>{reply.likesCount > 0 ? `${reply.likesCount} Like${reply.likesCount > 1 ? 's' : ''}` : 'Like'}</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Replying Input Form */}
                                  {replyingToCommentId === comment.id && (
                                    <div className="d-flex align-items-center gap-2 mt-2 ps-4 ms-2">
                                      <span className="avatar avatar-xs avatar-rounded overflow-hidden" style={{ width: '20px', height: '20px' }}>
                                        {employeeData?.profilePhotoUrl ? (
                                          <img src={employeeData.profilePhotoUrl.startsWith('http') ? employeeData.profilePhotoUrl : `${apiUrl}${employeeData.profilePhotoUrl}`} alt="Img" className="img-fluid rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          <ImageWithBasePath src="assets/img/users/user-01.jpg" alt="Img" className="img-fluid rounded-circle" />
                                        )}
                                      </span>
                                      <div className="position-relative flex-grow-1">
                                        <input
                                          type="text"
                                          className="form-control form-control-sm bg-white border border-light pe-5"
                                          placeholder="Reply to this comment..."
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleAddReply(post.id, comment.id);
                                            }
                                          }}
                                          style={{ borderRadius: '20px', fontSize: '11px', paddingRight: '35px' }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleAddReply(post.id, comment.id)}
                                          className="btn btn-link position-absolute top-50 end-0 translate-middle-y p-0 me-2 d-flex align-items-center justify-content-center border-0"
                                          style={{ width: '20px', height: '20px', outline: 'none', color: '#00BCD4' }}
                                        >
                                          <i className="ti ti-send fs-12" />
                                        </button>
                                      </div>
                                      <button type="button" className="btn btn-sm btn-link p-0 text-gray-5 fs-11 text-decoration-none border-0" onClick={() => setReplyingToCommentId(null)} style={{ outline: 'none' }}>Cancel</button>
                                    </div>
                                  )}

                                </div>
                              ))}
                            </div>
                          )}

                          {/* Write a comment... input box */}
                          <div className="d-flex align-items-center gap-2">
                            <span className="avatar avatar-sm avatar-rounded overflow-hidden" style={{ width: '28px', height: '28px' }}>
                              {employeeData?.profilePhotoUrl ? (
                                <img src={employeeData.profilePhotoUrl.startsWith('http') ? employeeData.profilePhotoUrl : `${apiUrl}${employeeData.profilePhotoUrl}`} alt="Img" className="img-fluid rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <ImageWithBasePath src="assets/img/users/user-01.jpg" alt="Img" className="img-fluid rounded-circle" />
                              )}
                            </span>
                            <div className="position-relative flex-grow-1">
                              <input
                                type="text"
                                className="form-control form-control-sm bg-light border-0 pe-5"
                                placeholder="Write a comment..."
                                value={postCommentsInputs[post.id] || ''}
                                onChange={(e) => setPostCommentsInputs(prev => ({
                                  ...prev,
                                  [post.id]: e.target.value
                                }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddComment(post.id, postCommentsInputs[post.id] || '');
                                  }
                                }}
                                style={{ borderRadius: '20px', fontSize: '13px', paddingRight: '35px' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddComment(post.id, postCommentsInputs[post.id] || '')}
                                className="btn btn-link position-absolute top-50 end-0 translate-middle-y p-0 me-2 d-flex align-items-center justify-content-center border-0"
                                style={{ width: '24px', height: '24px', outline: 'none', color: '#00BCD4' }}
                              >
                                <i className="ti ti-send fs-14" />
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
      {/* /Page Wrapper */}
      <EmployeeDashboardModal />
    </>
  );
};

export default EmployeeDashboard;



