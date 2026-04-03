import { 
  collection, query, where, getDocs, orderBy, limit, 
  addDoc, serverTimestamp, Timestamp, doc, getDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '@/contexts/AuthContext';

export interface ChatbotMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Timestamp;
  action?: ChatAction | null;
}

export interface ChatAction {
  type: string;
  data: Record<string, any>;
  label: string;
  route?: string;
}

interface IntentResult {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
}

// ========== INTENT DETECTION (Rule-based) ==========

const INTENT_PATTERNS: { intent: string; patterns: RegExp[]; }[] = [
  {
    intent: 'check_leave_balance',
    patterns: [
      /how many (leaves?|days off|holidays)/i,
      /leave balance/i, /leaves? (left|remaining|available)/i,
      /check (my )?(leave|leaves)/i, /my leaves?/i,
    ],
  },
  {
    intent: 'apply_leave',
    patterns: [
      /apply (for )?(a )?(leave|day off|sick leave|casual leave)/i,
      /want (to take|a) (leave|day off)/i,
      /request (a )?(leave|time off)/i,
    ],
  },
  {
    intent: 'check_attendance',
    patterns: [
      /my attendance/i, /attendance (this|last|for) (month|week)/i,
      /show (my )?attendance/i, /attendance report/i,
      /how many days (have i|did i) (work|attend)/i,
    ],
  },
  {
    intent: 'salary_slip',
    patterns: [
      /salary slip/i, /pay ?slip/i, /download (my )?(salary|pay)/i,
      /salary (for|of) (this|last)/i, /my salary/i,
    ],
  },
  {
    intent: 'raise_ticket',
    patterns: [
      /raise (a )?(ticket|helpdesk|complaint|issue)/i,
      /create (a )?(ticket|helpdesk)/i,
      /report (a |an )?(issue|problem)/i,
      /need help with/i,
    ],
  },
  {
    intent: 'mark_attendance',
    patterns: [
      /mark (my )?attendance/i, /punch in/i, /check in/i,
      /clock in/i, /log (my )?attendance/i,
    ],
  },
  {
    intent: 'team_attendance',
    patterns: [
      /team attendance/i, /who (is |has )?(absent|present|on leave)/i,
      /low attendance/i, /attendance (of|for) (team|department|employees)/i,
    ],
  },
  {
    intent: 'employee_count',
    patterns: [
      /how many employees/i, /total (employees|staff|headcount)/i,
      /employee count/i, /number of employees/i,
    ],
  },
  {
    intent: 'upcoming_holidays',
    patterns: [
      /upcoming holiday/i, /next holiday/i, /holiday list/i,
      /public holiday/i, /when is the next holiday/i, /holidays/i,
    ],
  },
  {
    intent: 'pending_leaves',
    patterns: [
      /pending (leave|leaves|requests?)/i,
      /leave (requests?|applications?) (pending|waiting)/i,
      /my pending/i,
    ],
  },
  {
    intent: 'profile_info',
    patterns: [
      /my (profile|details|info|information)/i,
      /employee (id|code|number)/i,
      /my (name|department|designation)/i,
      /who am i/i,
    ],
  },
  {
    intent: 'today_status',
    patterns: [
      /today('s)? (status|attendance|punch)/i,
      /did i (punch|clock|check) in/i,
      /am i (present|marked|checked in)/i,
    ],
  },
  {
    intent: 'leave_history',
    patterns: [
      /leave history/i, /past leaves/i, /previous leaves/i,
      /leaves? (taken|used|this year)/i,
    ],
  },
  {
    intent: 'open_tickets',
    patterns: [
      /my tickets?/i, /open tickets?/i, /pending tickets?/i,
      /ticket status/i, /helpdesk (status|tickets?)/i,
    ],
  },
  {
    intent: 'working_hours',
    patterns: [
      /working hours/i, /work hours/i, /how (long|many hours)/i,
      /total hours (worked|today|this)/i, /shift (time|timing|hours)/i,
    ],
  },
  {
    intent: 'help',
    patterns: [
      /^help$/i, /what can you do/i, /what are your capabilities/i,
      /show me commands/i, /available commands/i,
    ],
  },
  {
    intent: 'greet',
    patterns: [
      /^(hi|hello|hey|good morning|good afternoon|good evening|namaste)/i,
    ],
  },
  {
    intent: 'thanks',
    patterns: [
      /^(thanks?|thank you|thx|ty|appreciate)/i,
    ],
  },
];

export function detectIntent(message: string): IntentResult {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return { intent, entities: {}, confidence: 0.9 };
      }
    }
  }
  return { intent: 'unknown', entities: {}, confidence: 0 };
}

// ========== ACTION HANDLERS ==========

export async function handleIntent(
  intent: string,
  userId: string,
  userRole: UserRole,
  organizationId: string | null
): Promise<ChatbotMessage> {
  try {
    switch (intent) {
      case 'greet':
        return greeting(userRole);
      case 'thanks':
        return thanksResponse();
      case 'help':
        return helpMessage(userRole);
      case 'check_leave_balance':
        return await getLeaveBalance(userId, organizationId);
      case 'check_attendance':
        return await getAttendanceSummary(userId, organizationId);
      case 'apply_leave':
        return applyLeaveAction();
      case 'salary_slip':
        return salarySlipAction();
      case 'raise_ticket':
        return raiseTicketAction();
      case 'mark_attendance':
        return markAttendanceAction();
      case 'team_attendance':
        return await getTeamAttendance(userRole, organizationId);
      case 'employee_count':
        return await getEmployeeCount(userRole, organizationId);
      case 'upcoming_holidays':
        return await getUpcomingHolidays(organizationId);
      case 'pending_leaves':
        return await getPendingLeaves(userId, organizationId);
      case 'profile_info':
        return await getProfileInfo(userId);
      case 'today_status':
        return await getTodayStatus(userId);
      case 'leave_history':
        return await getLeaveHistory(userId);
      case 'open_tickets':
        return await getOpenTickets(userId);
      case 'working_hours':
        return await getWorkingHours(userId);
      default:
        return fallbackResponse();
    }
  } catch (error) {
    console.error('Error handling intent:', error);
    return {
      role: 'assistant',
      content: "I'm having trouble fetching that information right now. Please try again later.",
    };
  }
}

function greeting(role: UserRole): ChatbotMessage {
  const roleLabel = role === 'hr' ? 'HR Admin' : role === 'hod' ? 'HOD' : role === 'super-admin' ? 'Super Admin' : 'there';
  return {
    role: 'assistant',
    content: `👋 Hello ${roleLabel}! I'm your HR Assistant. How can I help you today?\n\nYou can ask me about:\n• Leave balance & applications\n• Attendance reports\n• Salary slips\n• Raise helpdesk tickets\n• Profile info\n• And more!\n\nType **help** to see all commands.`,
  };
}

function thanksResponse(): ChatbotMessage {
  return {
    role: 'assistant',
    content: "You're welcome! 😊 Let me know if you need anything else.",
  };
}

function helpMessage(role: UserRole): ChatbotMessage {
  let commands = `Here's what I can help you with:\n\n**📋 Leave**\n• "How many leaves do I have?"\n• "Apply for leave"\n• "Pending leave requests"\n• "Leave history"\n\n**📊 Attendance**\n• "Show my attendance this month"\n• "Mark my attendance"\n• "Did I punch in today?"\n• "Working hours"\n\n**💰 Salary**\n• "Download my salary slip"\n\n**🎫 Helpdesk**\n• "Raise a ticket"\n• "My open tickets"\n\n**📅 Holidays**\n• "Upcoming holidays"\n\n**👤 Profile**\n• "My profile info"`;

  if (role === 'hr' || role === 'hod' || role === 'super-admin') {
    commands += `\n\n**👥 Admin Commands**\n• "Who is absent today?"\n• "How many employees?"\n• "Team attendance"`;
  }
  return { role: 'assistant', content: commands };
}

// ========== LEAVE BALANCE (only Privilege Leave) ==========

async function getLeaveBalance(userId: string, organizationId: string | null): Promise<ChatbotMessage> {
  const year = new Date().getFullYear();

  // 1. Read the leave_balances document
  let plBalance: number | null = null;
  try {
    const balanceDoc = await getDoc(doc(db, 'leave_balances', userId));
    if (balanceDoc.exists()) {
      const data = balanceDoc.data();
      plBalance = data.PL !== undefined ? Number(data.PL) : null;
    }
  } catch (e) {
    console.error('Error reading leave_balances:', e);
  }

  // 2. Count used PL from the 'leaves' collection
  let plUsed = 0;
  try {
    const leavesQuery = query(
      collection(db, 'leaves'),
      where('employeeId', '==', userId),
      where('status', '==', 'APPROVED')
    );
    const snap = await getDocs(leavesQuery);
    snap.docs.forEach(d => {
      const data = d.data();
      const createdYear = data.createdAt ? new Date(data.createdAt).getFullYear() : year;
      if (createdYear === year && data.leaveType === 'PL') {
        plUsed += data.duration || 1;
      }
    });
  } catch (e) {
    console.error('Error reading leaves:', e);
  }

  let content = `📊 **Your Privilege Leave Balance (${year})**\n\n`;

  if (plBalance !== null) {
    content += `Available: **${plBalance} days**\n`;
    if (plUsed > 0) content += `Used this year: **${plUsed} days**\n`;

    if (plBalance <= 5) {
      content += `\n⚠️ Your leave balance is running low. Plan accordingly!`;
    }
  } else {
    content += `Used PL this year: **${plUsed} days**\n`;
    content += `\n💡 Contact HR to set up your leave balance.`;
  }

  return {
    role: 'assistant',
    content,
    action: { type: 'navigate', data: {}, label: '📋 View Leave Details', route: '/leave' },
  };
}

// ========== ATTENDANCE SUMMARY ==========

async function getAttendanceSummary(userId: string, organizationId: string | null): Promise<ChatbotMessage> {
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Fetch all attendance for this user, then filter client-side to avoid index issues
  let records: any[] = [];
  try {
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', userId)
    );
    const snap = await getDocs(q);
    records = snap.docs.map(d => d.data());
  } catch (e: any) {
    // Fallback: try with userId field
    try {
      const q = query(
        collection(db, 'attendance'),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      records = snap.docs.map(d => d.data());
    } catch (e2) {
      console.error('Error fetching attendance:', e2);
    }
  }

  // Filter to current month
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRecords = records.filter(r => {
    const date = r.date || '';
    return date.startsWith(yearMonth);
  });

  const present = monthRecords.filter(r => r.status === 'present' || r.punchIn).length;
  const late = monthRecords.filter(r => r.isLate).length;
  const workingDays = getWorkingDaysInMonth(now);

  let content = `📊 **Attendance Summary - ${monthName} ${now.getFullYear()}**\n\n`;
  content += `Working Days (till today): **${workingDays}**\n`;
  content += `Present: **${present} days** ✅\n`;
  if (late > 0) content += `Late: **${late} days** ⏰\n`;
  content += `Absent/Missing: **${workingDays - present} days** ❌\n`;
  content += `Attendance Rate: **${workingDays > 0 ? Math.round((present / workingDays) * 100) : 0}%**`;

  if (present > 0 && workingDays - present === 0) {
    content += `\n\n🌟 Perfect attendance this month! Keep it up!`;
  }

  return {
    role: 'assistant',
    content,
    action: { type: 'navigate', data: {}, label: '📊 View Full Report', route: '/attendance' },
  };
}

// ========== TODAY STATUS ==========

async function getTodayStatus(userId: string): Promise<ChatbotMessage> {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let todayRecord: any = null;
  try {
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', userId),
      where('date', '==', today)
    );
    const snap = await getDocs(q);
    if (!snap.empty) todayRecord = snap.docs[0].data();
  } catch {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('userId', '==', userId),
        where('date', '==', today)
      );
      const snap = await getDocs(q);
      if (!snap.empty) todayRecord = snap.docs[0].data();
    } catch { /* ignore */ }
  }

  if (!todayRecord) {
    return {
      role: 'assistant',
      content: `📍 You haven't punched in yet today (${today}).\n\nWould you like to mark your attendance?`,
      action: { type: 'navigate', data: {}, label: '📍 Punch In Now', route: '/attendance' },
    };
  }

  let content = `📍 **Today's Status (${today})**\n\n`;
  content += `Status: **${todayRecord.status === 'present' ? 'Present ✅' : todayRecord.status || 'Marked'}**\n`;
  if (todayRecord.punchIn) content += `Punch In: **${todayRecord.punchIn}**\n`;
  if (todayRecord.punchOut) content += `Punch Out: **${todayRecord.punchOut}**\n`;
  if (todayRecord.isLate) content += `⏰ Late arrival\n`;
  if (todayRecord.workHours) content += `Hours: **${todayRecord.workHours}**`;

  return { role: 'assistant', content };
}

// ========== WORKING HOURS ==========

async function getWorkingHours(userId: string): Promise<ChatbotMessage> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let records: any[] = [];
  try {
    const q = query(collection(db, 'attendance'), where('employeeId', '==', userId));
    const snap = await getDocs(q);
    records = snap.docs.map(d => d.data()).filter(r => (r.date || '').startsWith(yearMonth));
  } catch {
    try {
      const q = query(collection(db, 'attendance'), where('userId', '==', userId));
      const snap = await getDocs(q);
      records = snap.docs.map(d => d.data()).filter(r => (r.date || '').startsWith(yearMonth));
    } catch { /* ignore */ }
  }

  let totalMinutes = 0;
  let daysWithHours = 0;
  records.forEach(r => {
    if (r.punchIn && r.punchOut) {
      const inTime = new Date(`${r.date}T${r.punchIn}`);
      const outTime = new Date(`${r.date}T${r.punchOut}`);
      if (!isNaN(inTime.getTime()) && !isNaN(outTime.getTime())) {
        totalMinutes += (outTime.getTime() - inTime.getTime()) / 60000;
        daysWithHours++;
      }
    }
  });

  const totalHours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  const avgHours = daysWithHours > 0 ? (totalMinutes / daysWithHours / 60).toFixed(1) : '0';
  const monthName = now.toLocaleString('default', { month: 'long' });

  let content = `⏱️ **Working Hours - ${monthName}**\n\n`;
  content += `Total: **${totalHours}h ${mins}m**\n`;
  content += `Days Tracked: **${daysWithHours}**\n`;
  content += `Average/Day: **${avgHours} hours**`;

  return { role: 'assistant', content };
}

// ========== PROFILE INFO ==========

async function getProfileInfo(userId: string): Promise<ChatbotMessage> {
  try {
    const empQuery = query(collection(db, 'employees'), where('userId', '==', userId));
    const snap = await getDocs(empQuery);
    if (snap.empty) {
      return { role: 'assistant', content: "I couldn't find your employee profile. Please contact HR." };
    }
    const data = snap.docs[0].data();

    let content = `👤 **Your Profile**\n\n`;
    content += `Name: **${data.name || 'N/A'}**\n`;
    if (data.employeeCode) content += `Employee Code: **${data.employeeCode}**\n`;
    if (data.department) content += `Department: **${data.department}**\n`;
    if (data.designation) content += `Designation: **${data.designation}**\n`;
    if (data.email) content += `Email: **${data.email}**\n`;
    if (data.phone) content += `Phone: **${data.phone}**\n`;
    if (data.joiningDate) content += `Joining Date: **${data.joiningDate}**\n`;

    return {
      role: 'assistant',
      content,
      action: { type: 'navigate', data: {}, label: '👤 View Full Profile', route: '/profile' },
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { role: 'assistant', content: "I couldn't fetch your profile right now. Please try again." };
  }
}

// ========== PENDING LEAVES ==========

async function getPendingLeaves(userId: string, organizationId: string | null): Promise<ChatbotMessage> {
  try {
    const q = query(
      collection(db, 'leaves'),
      where('employeeId', '==', userId),
      where('status', '==', 'PENDING')
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return { role: 'assistant', content: "✅ You have no pending leave requests." };
    }

    let content = `⏳ **Pending Leave Requests (${snap.size})**\n\n`;
    snap.docs.forEach(d => {
      const data = d.data();
      content += `• **${data.leaveType || 'Leave'}** — ${data.startDate} to ${data.endDate} (${data.duration || '?'} days)\n`;
    });
    content += `\nThese are awaiting HR/HOD approval.`;

    return {
      role: 'assistant',
      content,
      action: { type: 'navigate', data: {}, label: '📋 View Leave Requests', route: '/leave' },
    };
  } catch (error) {
    console.error('Error fetching pending leaves:', error);
    return { role: 'assistant', content: "I couldn't fetch pending leaves right now." };
  }
}

// ========== LEAVE HISTORY ==========

async function getLeaveHistory(userId: string): Promise<ChatbotMessage> {
  try {
    const q = query(
      collection(db, 'leaves'),
      where('employeeId', '==', userId)
    );
    const snap = await getDocs(q);
    const leaves = snap.docs.map(d => d.data());

    const year = new Date().getFullYear();
    const thisYear = leaves.filter(l => {
      const created = l.createdAt ? new Date(l.createdAt).getFullYear() : year;
      return created === year;
    });

    const approved = thisYear.filter(l => l.status === 'APPROVED').length;
    const rejected = thisYear.filter(l => l.status === 'REJECTED').length;
    const pending = thisYear.filter(l => l.status === 'PENDING').length;
    const totalDays = thisYear
      .filter(l => l.status === 'APPROVED')
      .reduce((sum, l) => sum + (l.duration || 0), 0);

    let content = `📋 **Leave History (${year})**\n\n`;
    content += `Total Requests: **${thisYear.length}**\n`;
    content += `Approved: **${approved}** ✅\n`;
    content += `Rejected: **${rejected}** ❌\n`;
    content += `Pending: **${pending}** ⏳\n`;
    content += `Days Used: **${totalDays}**`;

    return {
      role: 'assistant',
      content,
      action: { type: 'navigate', data: {}, label: '📋 View All Leaves', route: '/leave' },
    };
  } catch (error) {
    console.error('Error fetching leave history:', error);
    return { role: 'assistant', content: "I couldn't fetch leave history right now." };
  }
}

// ========== OPEN TICKETS ==========

async function getOpenTickets(userId: string): Promise<ChatbotMessage> {
  try {
    const q = query(
      collection(db, 'helpdesk_tickets'),
      where('createdBy', '==', userId)
    );
    const snap = await getDocs(q);
    const tickets = snap.docs.map(d => d.data());
    const open = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved');

    if (open.length === 0) {
      return { role: 'assistant', content: "🎫 You have no open helpdesk tickets." };
    }

    let content = `🎫 **Open Tickets (${open.length})**\n\n`;
    open.slice(0, 5).forEach(t => {
      content += `• **${t.subject || t.title || 'Ticket'}** — Status: ${t.status || 'Open'}\n`;
    });
    if (open.length > 5) content += `\n...and ${open.length - 5} more`;

    return {
      role: 'assistant',
      content,
      action: { type: 'navigate', data: {}, label: '🎫 Go to Helpdesk', route: '/helpdesk' },
    };
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return { role: 'assistant', content: "I couldn't fetch your tickets right now." };
  }
}

function applyLeaveAction(): ChatbotMessage {
  return {
    role: 'assistant',
    content: "Sure! I'll take you to the leave application page. Click the button below to apply for leave.",
    action: { type: 'navigate', data: {}, label: '📝 Apply for Leave', route: '/leave' },
  };
}

function salarySlipAction(): ChatbotMessage {
  return {
    role: 'assistant',
    content: "I'll redirect you to the salary section where you can view and download your salary slips.",
    action: { type: 'navigate', data: {}, label: '💰 View Salary Slips', route: '/salary' },
  };
}

function raiseTicketAction(): ChatbotMessage {
  return {
    role: 'assistant',
    content: "Let me take you to the helpdesk to raise a ticket. You can describe your issue there.",
    action: { type: 'navigate', data: {}, label: '🎫 Go to Helpdesk', route: '/helpdesk' },
  };
}

function markAttendanceAction(): ChatbotMessage {
  return {
    role: 'assistant',
    content: "I'll take you to the attendance page where you can punch in/out.",
    action: { type: 'navigate', data: {}, label: '📍 Mark Attendance', route: '/attendance' },
  };
}

async function getTeamAttendance(userRole: UserRole, organizationId: string | null): Promise<ChatbotMessage> {
  if (userRole === 'staff' || userRole === 'intern') {
    return { role: 'assistant', content: "Sorry, you don't have permission to view team attendance. This is available for HR and HOD roles." };
  }

  if (!organizationId) {
    return { role: 'assistant', content: "I couldn't determine your organization. Please contact your admin." };
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [attendanceSnap, empSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'attendance'),
      where('organizationId', '==', organizationId),
      where('date', '==', todayStr)
    )),
    getDocs(query(
      collection(db, 'employees'),
      where('organizationId', '==', organizationId)
    ))
  ]);

  const totalEmployees = empSnap.size;
  const presentToday = attendanceSnap.size;
  const absentToday = totalEmployees - presentToday;

  let content = `👥 **Team Attendance Today (${todayStr})**\n\n`;
  content += `Total Employees: **${totalEmployees}**\n`;
  content += `Present: **${presentToday}** ✅\n`;
  content += `Absent: **${absentToday}** ❌\n`;
  content += `Attendance Rate: **${totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0}%**`;

  return { role: 'assistant', content };
}

async function getEmployeeCount(userRole: UserRole, organizationId: string | null): Promise<ChatbotMessage> {
  if (userRole === 'staff' || userRole === 'intern') {
    return { role: 'assistant', content: "Sorry, you don't have permission to view employee counts." };
  }

  if (!organizationId && userRole !== 'super-admin') {
    return { role: 'assistant', content: "I couldn't determine your organization." };
  }

  const empQuery = userRole === 'super-admin'
    ? query(collection(db, 'employees'))
    : query(collection(db, 'employees'), where('organizationId', '==', organizationId));

  const snap = await getDocs(empQuery);

  return {
    role: 'assistant',
    content: `👥 Total employees${userRole === 'super-admin' ? ' (all orgs)' : ''}: **${snap.size}**`,
    action: { type: 'navigate', data: {}, label: '📋 View Employees', route: '/employees' },
  };
}

// ========== HOLIDAYS (no orderBy to avoid index requirement) ==========

async function getUpcomingHolidays(organizationId: string | null): Promise<ChatbotMessage> {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  try {
    // Simple query without orderBy to avoid composite index requirement
    const holidayQuery = organizationId
      ? query(collection(db, 'holidays'), where('organizationId', '==', organizationId))
      : query(collection(db, 'holidays'));

    const snap = await getDocs(holidayQuery);

    // Filter and sort client-side
    const upcoming = snap.docs
      .map(d => d.data() as Record<string, any>)
      .filter(h => h.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    if (upcoming.length === 0) {
      return {
        role: 'assistant',
        content: "📅 No upcoming holidays found. Check with your HR for the holiday calendar.",
        action: { type: 'navigate', data: {}, label: '📅 View Holidays', route: '/holidays' },
      };
    }

    let content = `📅 **Upcoming Holidays**\n\n`;
    upcoming.forEach(h => {
      const date = new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      });
      content += `• **${h.name}** — ${date}\n`;
    });

    return { role: 'assistant', content };
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return {
      role: 'assistant',
      content: "📅 I couldn't fetch the holiday list right now. Please check the Holidays section.",
      action: { type: 'navigate', data: {}, label: '📅 View Holidays', route: '/holidays' },
    };
  }
}

function fallbackResponse(): ChatbotMessage {
  return {
    role: 'assistant',
    content: "I'm not sure I understand that. Here are some things you can ask me:\n\n• \"How many leaves do I have?\"\n• \"Show my attendance\"\n• \"Apply for leave\"\n• \"Download salary slip\"\n• \"Raise a ticket\"\n• \"Upcoming holidays\"\n• \"My profile info\"\n• \"Did I punch in today?\"\n• \"Pending leave requests\"\n• \"My open tickets\"\n\nOr type **help** to see all commands.",
  };
}

// ========== CHAT HISTORY ==========

export async function saveChatMessage(
  userId: string,
  organizationId: string | null,
  message: ChatbotMessage
) {
  try {
    await addDoc(collection(db, 'chatbot_messages'), {
      userId,
      organizationId: organizationId || null,
      role: message.role,
      content: message.content,
      action: message.action || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
}

export async function loadChatHistory(
  userId: string,
  maxMessages = 50
): Promise<ChatbotMessage[]> {
  try {
    // Simple query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'chatbot_messages'),
      where('userId', '==', userId),
      limit(maxMessages)
    );
    const snap = await getDocs(q);
    const messages = snap.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role as 'user' | 'assistant',
          content: data.content,
          action: data.action || null,
          timestamp: data.createdAt,
          _createdAt: data.createdAt?.toDate?.()?.getTime() || 0,
        };
      })
      .sort((a: any, b: any) => a._createdAt - b._createdAt)
      .slice(-maxMessages);
    
    return messages.map(({ _createdAt, ...rest }: any) => rest);
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
}

// ========== HELPERS ==========

function getWorkingDaysInMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();
  let count = 0;
  for (let d = 1; d <= today; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

// ========== SMART SUGGESTIONS ==========

export function getSmartSuggestions(userRole: UserRole): string[] {
  const common = [
    "How many leaves do I have?",
    "Show my attendance",
    "Upcoming holidays",
    "Did I punch in today?",
    "My profile info",
  ];

  if (userRole === 'hr' || userRole === 'hod') {
    return [...common, "Who is absent today?", "How many employees?"];
  }
  if (userRole === 'super-admin') {
    return [...common, "Total employees", "Team attendance"];
  }
  return [...common, "Apply for leave", "Raise a ticket"];
}
