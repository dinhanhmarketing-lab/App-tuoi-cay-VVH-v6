import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, Users, Settings, ChevronLeft, ChevronRight, 
  Trash2, Plus, Leaf, Droplets, GripHorizontal, 
  Upload, CheckCircle2, X, Globe, History, TrendingUp,
  ChevronDown, Trophy, Medal, Award, Crown, Star
} from 'lucide-react';

// --- UTILS ---
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

const isToday = (date) => {
  const t = new Date();
  return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
};

const getBadgeInfo = (count) => {
  if (count <= 3) return { label: "Người tưới cho có", color: "text-slate-400", bg: "bg-slate-100" };
  if (count <= 5) return { label: "Người tập tưới", color: "text-blue-500", bg: "bg-blue-50" };
  if (count <= 10) return { label: "Người tưới có tâm", color: "text-emerald-500", bg: "bg-emerald-50" };
  if (count <= 20) return { label: "Người tưới ra hoa", color: "text-pink-500", bg: "bg-pink-50" };
  return { label: "Người tưới cả thế giới", color: "text-amber-500", bg: "bg-amber-50" };
};

export default function App() {
  const [step, setStep] = useState('setup');
  const [calendarTitle, setCalendarTitle] = useState('');
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberTeam, setNewMemberTeam] = useState('');
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const [epochDate, setEpochDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [wateringDaysOverride, setWateringDaysOverride] = useState({});
  const [swaps, setSwaps] = useState({});
  const [completed, setCompleted] = useState({});

  // State cho Popup Lịch sử
  const [selectedMember, setSelectedMember] = useState(null);

  // Lấy danh sách các Team duy nhất đã tồn tại
  const existingTeams = useMemo(() => {
    const teams = members.map(m => m.team);
    return [...new Set(teams)].filter(t => t);
  }, [members]);

  // --- IMPORT EXCEL (CSV) ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const newMembers = [];
      
      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('tên') || line.toLowerCase().includes('name'))) return;
        const [name, team] = line.split(',').map(s => s?.trim());
        if (name && team) {
          newMembers.push({
            id: Date.now().toString() + Math.random().toString(),
            name,
            team
          });
        }
      });

      if (newMembers.length > 0) {
        setMembers(prev => [...prev, ...newMembers]);
      } else {
        alert("Không tìm thấy dữ liệu hợp lệ. Vui lòng dùng file CSV định dạng: Tên,Team");
      }
    };
    reader.readAsText(file);
  };

  // --- SETUP HANDLERS ---
  const handleAddMember = (e) => {
    e.preventDefault();
    if (newMemberName.trim() && newMemberTeam.trim()) {
      setMembers([...members, {
        id: Date.now().toString() + Math.random().toString(),
        name: newMemberName.trim(),
        team: newMemberTeam.trim()
      }]);
      setNewMemberName('');
      setNewMemberTeam('');
      setShowTeamDropdown(false);
    }
  };

  const startDashboard = () => {
    if (members.length === 0) return alert("Vui lòng thêm thành viên!");
    const now = new Date();
    setEpochDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setStep('dashboard');
  };

  // --- LOGIC LỊCH ---
  const isWateringDay = (d) => {
    const dateStr = formatDate(d);
    if (wateringDaysOverride[dateStr] !== undefined) return wateringDaysOverride[dateStr];
    const day = d.getDay();
    return day >= 1 && day <= 5;
  };

  const getWorkDaysCount = (start, end) => {
    let count = 0;
    let current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const target = new Date(end);
    target.setHours(0, 0, 0, 0);

    if (current <= target) {
      while (current < target) {
        if (isWateringDay(current)) count++;
        current.setDate(current.getDate() + 1);
      }
    } else {
      while (current > target) {
        current.setDate(current.getDate() - 1);
        if (isWateringDay(current)) count--;
      }
    }
    return count;
  };

  const getFinalAssignee = (date) => {
    if (!isWateringDay(date)) return null;
    const dateStr = formatDate(date);
    if (swaps[dateStr] !== undefined) {
      return members.find(m => m.id === swaps[dateStr]) || null;
    }
    if (!epochDate || members.length === 0) return null;
    const offset = getWorkDaysCount(epochDate, date);
    const index = ((offset % members.length) + members.length) % members.length;
    return members[index];
  };

  const calendarData = useMemo(() => {
    if (step !== 'dashboard') return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDay = firstDay.getDay() - 1; 
    if (startDay === -1) startDay = 6;

    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push({ type: 'empty', id: `e-${i}` });
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      cells.push({ type: 'day', date: d, dateStr: formatDate(d), dayOfMonth: i });
    }
    while (cells.length % 7 !== 0) cells.push({ type: 'empty', id: `e-end-${cells.length}` });
    return cells;
  }, [currentDate, step, wateringDaysOverride, members, swaps, epochDate]);

  // Thống kê bảng xếp hạng
  const leaderboardData = useMemo(() => {
    const stats = members.map(member => {
      const count = Object.keys(completed).filter(dateStr => {
        if (!completed[dateStr]) return false;
        const assignee = getFinalAssignee(new Date(dateStr));
        return assignee && assignee.id === member.id;
      }).length;
      return { ...member, count };
    });
    return stats.sort((a, b) => b.count - a.count);
  }, [members, completed, swaps]);

  // --- DRAG & DROP ---
  const handleDrop = (e, targetStr) => {
    e.preventDefault();
    const sourceStr = e.dataTransfer.getData('text');
    if (!sourceStr || sourceStr === targetStr) return;

    const sourceAssignee = getFinalAssignee(new Date(sourceStr));
    const targetAssignee = getFinalAssignee(new Date(targetStr));

    setSwaps(prev => ({
      ...prev,
      [sourceStr]: targetAssignee ? targetAssignee.id : null,
      [targetStr]: sourceAssignee ? sourceAssignee.id : null
    }));

    if (!isWateringDay(new Date(targetStr))) {
      setWateringDaysOverride(prev => ({ ...prev, [targetStr]: true }));
    }
  };

  // --- RENDER COMPONENTS ---

  const LeaderboardModal = () => {
    if (!showLeaderboard) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 p-8 text-white relative">
            <button onClick={() => setShowLeaderboard(false)} className="absolute top-6 right-6 hover:bg-white/20 p-2 rounded-full transition-colors">
              <X size={24} />
            </button>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white/20 p-4 rounded-full mb-2">
                <Trophy size={48} className="text-white drop-shadow-lg" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-widest">Bảng Xếp Hạng</h2>
              <p className="text-amber-100 font-bold opacity-90 italic">Tôn vinh những anh hùng vì môi trường</p>
            </div>
          </div>

          <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50">
            <div className="space-y-4">
              {leaderboardData.map((m, idx) => {
                const badge = getBadgeInfo(m.count);
                const isTop3 = idx < 3;
                let rankLabel = "";
                let rankIcon = null;

                if (idx === 0) { rankLabel = "Quán quân"; rankIcon = <Crown size={24} className="text-amber-500" />; }
                else if (idx === 1) { rankLabel = "Á quân"; rankIcon = <Medal size={24} className="text-slate-400" />; }
                else if (idx === 2) { rankLabel = "Quý quân"; rankIcon = <Medal size={24} className="text-orange-500" />; }

                return (
                  <div 
                    key={m.id} 
                    className={`flex items-center gap-4 p-5 rounded-3xl border transition-all hover:scale-[1.02] 
                      ${idx === 0 ? 'bg-amber-50 border-amber-200 shadow-amber-100 shadow-lg' : 'bg-white border-slate-100'}
                    `}
                  >
                    <div className="w-10 h-10 flex items-center justify-center font-black text-xl text-slate-400 shrink-0">
                      {isTop3 ? rankIcon : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-lg">{m.name}</span>
                        {rankLabel && (
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border 
                            ${idx === 0 ? 'bg-amber-100 border-amber-300 text-amber-700' : 
                              idx === 1 ? 'bg-slate-100 border-slate-300 text-slate-600' : 
                              'bg-orange-100 border-orange-300 text-orange-700'}
                          `}>
                            {rankLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{m.team}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-800 leading-none">{m.count}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Lần tưới</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-6 bg-white border-t border-slate-100 text-center">
             <button 
               onClick={() => setShowLeaderboard(false)}
               className="bg-slate-800 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all"
             >
               Đóng bảng
             </button>
          </div>
        </div>
      </div>
    );
  };

  const HistoryModal = () => {
    if (!selectedMember) return null;
    
    const history = Object.keys(completed).filter(dateStr => {
      if (!completed[dateStr]) return false;
      const assignee = getFinalAssignee(new Date(dateStr));
      return assignee && assignee.id === selectedMember.id;
    }).sort().reverse();

    const badge = getBadgeInfo(history.length);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white relative">
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 hover:bg-white/20 p-1 rounded-full transition-colors">
              <X size={24} />
            </button>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Users size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{selectedMember.name}</h3>
                <p className="text-emerald-100 opacity-90">{selectedMember.team}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col items-center mb-6 bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <div className={`${badge.bg} ${badge.color} p-3 rounded-2xl mb-3`}>
                  <Award size={32} />
                </div>
                <h4 className={`text-xl font-black uppercase tracking-wide ${badge.color}`}>
                  {badge.label}
                </h4>
                <div className="mt-4 flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tổng cộng</p>
                    <p className="text-2xl font-black text-slate-800">{history.length}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Xếp hạng</p>
                    <p className="text-2xl font-black text-slate-800">#{leaderboardData.findIndex(m => m.id === selectedMember.id) + 1}</p>
                  </div>
                </div>
            </div>

            <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
              <History size={16} /> Lịch sử tưới cây
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {history.length > 0 ? history.map(d => (
                <div key={d} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-medium text-slate-700">{d}</span>
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
              )) : (
                <p className="text-center text-slate-400 py-8 italic text-sm">Chưa có dữ liệu tưới cây.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Leaf size={120} />
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="bg-emerald-500 p-4 rounded-3xl text-white shadow-lg shadow-emerald-200 mb-4">
              <Leaf size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-800">Thiết Lập Team</h1>
            <p className="text-slate-500 mt-1">Cùng nhau xây dựng môi trường làm việc xanh</p>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label className="text-xs font-black uppercase text-slate-400 ml-1 mb-2 block">Tên Dự Án Lịch</label>
                <input
                  type="text"
                  value={calendarTitle}
                  onChange={(e) => setCalendarTitle(e.target.value)}
                  placeholder="Ví dụ: Văn phòng Xanh 2024"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none transition-all font-bold"
                />
              </div>

              <div className="col-span-full border-t border-slate-100 pt-4 flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Danh sách nhân sự</label>
                <label className="flex items-center gap-2 text-emerald-600 text-sm font-bold cursor-pointer hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                  <Upload size={16} />
                  Import CSV (Tên,Team)
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <form onSubmit={handleAddMember} className="col-span-full flex flex-wrap md:flex-nowrap gap-2 items-start">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Tên..."
                  className="flex-[2] w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none"
                />
                
                <div className="flex-[1.5] w-full relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={newMemberTeam}
                      onChange={(e) => {
                        setNewMemberTeam(e.target.value);
                        setShowTeamDropdown(true);
                      }}
                      onFocus={() => setShowTeamDropdown(true)}
                      placeholder="Team..."
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none pr-10"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500"
                    >
                      <ChevronDown size={20} className={`transition-transform ${showTeamDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {showTeamDropdown && existingTeams.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-40 overflow-y-auto custom-scrollbar">
                      {existingTeams
                        .filter(t => t.toLowerCase().includes(newMemberTeam.toLowerCase()))
                        .map((teamName, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewMemberTeam(teamName);
                              setShowTeamDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm font-bold text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                          >
                            {teamName}
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>

                <button type="submit" className="bg-slate-800 text-white p-4 rounded-2xl hover:bg-black transition-colors shrink-0">
                  <Plus />
                </button>
              </form>
            </div>

            <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 p-4 max-h-48 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
              {members.length === 0 && <p className="col-span-full text-center text-slate-400 py-4 italic">Chưa có ai trong danh sách.</p>}
              {members.map(m => (
                <div key={m.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between group">
                  <div className="flex flex-col truncate">
                    <span className="font-bold text-sm truncate">{m.name}</span>
                    <span className="text-[10px] text-emerald-600 font-black uppercase">{m.team}</span>
                  </div>
                  <button onClick={() => setMembers(members.filter(x => x.id !== m.id))} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={startDashboard}
              className="w-full bg-emerald-500 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 hover:-translate-y-1 active:translate-y-0 transition-all uppercase tracking-widest"
            >
              Bắt đầu chăm sóc cây
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 p-6 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-500 p-4 rounded-3xl text-white shadow-lg shadow-emerald-100">
              <Globe size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 leading-none">{calendarTitle || "Lịch Tưới Cây"}</h1>
              <p className="text-emerald-600 font-bold text-sm mt-2 flex items-center gap-2">
                <TrendingUp size={16} /> Đồng hành cùng {members.length} người yêu môi trường
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="bg-amber-100 px-6 py-3 rounded-2xl font-bold text-amber-600 hover:bg-amber-200 transition-all flex items-center gap-2 border border-amber-200"
            >
              <Trophy size={20} /> Bảng xếp hạng
            </button>
            <button onClick={() => setStep('setup')} className="bg-slate-100 px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-2 border border-transparent hover:border-emerald-100">
              <Settings size={20} /> Thiết lập lại
            </button>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-50/50 p-8 flex flex-col md:flex-row items-center justify-between border-b border-slate-100 gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200 transition-all">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-black min-w-[200px] text-center">
                Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
              </h2>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200 transition-all">
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-xl border border-slate-200">
                 <div className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm"></div> Quên tưới
               </div>
               <div className="flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-xl border border-slate-200">
                 <div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded-sm"></div> Đã xong
               </div>
            </div>
          </div>

          <div className="p-4 md:p-8 overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="grid grid-cols-7 gap-4 mb-6">
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map(d => (
                  <div key={d} className="text-center text-xs font-black uppercase text-slate-400 tracking-widest">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-4">
                {calendarData.map(cell => {
                  if (cell.type === 'empty') return <div key={cell.id} className="aspect-square rounded-3xl bg-slate-50/50 border-2 border-dashed border-slate-100"></div>;
                  
                  const isWorkDay = isWateringDay(cell.date);
                  const assignee = getFinalAssignee(cell.date);
                  const isDone = completed[cell.dateStr];
                  const past = isPastDate(cell.date);
                  const today = isToday(cell.date);
                  
                  const showAlert = isWorkDay && past && !isDone;

                  return (
                    <div
                      key={cell.dateStr}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, cell.dateStr)}
                      className={`relative aspect-square rounded-[2rem] border-2 p-4 flex flex-col transition-all group
                        ${today ? 'border-emerald-400 bg-emerald-50/30 ring-8 ring-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200'}
                        ${showAlert ? 'bg-red-50 border-red-200' : ''}
                        ${!isWorkDay ? 'opacity-40 grayscale' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xl font-black ${today ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {cell.dayOfMonth}
                        </span>
                        <button 
                          onClick={() => setWateringDaysOverride(prev => ({ ...prev, [cell.dateStr]: !isWorkDay }))}
                          className={`p-2 rounded-xl transition-all ${isWorkDay ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                        >
                          <Droplets size={16} fill={isWorkDay ? "currentColor" : "none"} />
                        </button>
                      </div>

                      {isWorkDay && assignee ? (
                        <div className="mt-auto relative">
                          {isDone && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce pointer-events-none whitespace-nowrap">
                              <span className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-full font-bold shadow-lg mb-1 flex items-center gap-1">
                                <Globe size={10} /> Cảm ơn bạn!
                              </span>
                              <div className="text-2xl">🌱</div>
                            </div>
                          )}

                          <div 
                            draggable onDragStart={e => e.dataTransfer.setData('text', cell.dateStr)}
                            className={`p-3 rounded-2xl border shadow-sm transition-all cursor-grab active:cursor-grabbing
                              ${isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-emerald-300'}
                              ${showAlert ? 'border-red-300 shadow-red-100' : ''}
                            `}
                          >
                            <div onClick={() => setSelectedMember(assignee)} className="cursor-pointer hover:underline decoration-emerald-500 decoration-2">
                              <p className="text-xs font-black text-slate-800 truncate">{assignee.name}</p>
                              <p className="text-[10px] text-emerald-600 font-bold uppercase truncate">{assignee.team}</p>
                            </div>
                            <div className="h-px bg-slate-200 my-2"></div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" checked={!!isDone} 
                                onChange={() => setCompleted(p => ({ ...p, [cell.dateStr]: !p[cell.dateStr] }))}
                                className="w-4 h-4 accent-emerald-500 rounded-md"
                              />
                              <span className={`text-[10px] font-black uppercase ${isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {isDone ? 'Đã Xanh' : 'Chưa Tưới'}
                              </span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto text-center py-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">
                          Ngày nghỉ
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-emerald-900 text-white flex flex-col md:flex-row items-center justify-center gap-4 text-center">
             <Globe className="text-emerald-400 animate-spin-slow" />
             <p className="text-lg font-bold italic">
               "Cảm ơn bạn đã góp nước để hành tinh này xanh hơn"
             </p>
          </div>
        </div>
      </div>

      <LeaderboardModal />
      <HistoryModal />

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}