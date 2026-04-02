import { 
  collection, query, where, getDocs, orderBy, limit, 
  addDoc, serverTimestamp, Timestamp 
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
      /check (my )?(leave|leaves)/i,
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
      /public holiday/i, /when is the next holiday/i,
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
      /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
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
    content: `👋 Hello ${roleLabel}! I'm your HR Assistant. How can I help you today?\n\nYou can ask me about:\n• Leave balance & applications\n• Attendance reports\n• Salary slips\n• Raise helpdesk tickets\n• And more!`,
  };
}

function helpMessage(role: UserRole): ChatbotMessage {
  let commands = `Here's what I can help you with:\n\n**📋 Leave**\n• "How many leaves do I have?"\n• "Apply for leave"\n\n**📊 Attendance**\n• "Show my attendance this month"\n• "Mark my attendance"\n\n**💰 Salary**\n• "Download my salary slip"\n\n**🎫 Helpdesk**\n• "Raise a ticket"\n\n**📅 Holidays**\n• "Upcoming holidays"`;

  if (role === 'hr' || role === 'hod' || role === 'super-admin') {
    commands += `\n\n**👥 Admin Commands**\n• "Who is absent today?"\n• "How many employees?"\n• "Team attendance"`;
  }
  return { role: 'assistant', content: commands };
}

async function getLeaveBalance(userId: string, organizationId: string | null): Promise<ChatbotMessage> {
  const year = new Date().getFullYear();
  
  // Get leave requests for current year
  const leavesQuery = query(
    collection(db, 'leave_requests'),
    where('userId', '==', userId),
    where('status', '==', 'approved')
  );
  const snap = await getDocs(leavesQuery);
  
  const leavesByType: Record<string, number> = {};
  snap.docs.forEach(doc => {
    const data = doc.data();
    const createdYear = data.createdAt?.toDate?.()?.getFullYear() || year;
    if (createdYear === year) {
      const type = data.leaveType || 'General';
      const days = data.totalDays || 1;
      leavesByType[type] = (leavesByType[type] || 0) + days;
    }
  });

  const totalUsed = Object.values(leavesByType).reduce((a, b) => a + b, 0);
  const defaultAllowance = 24;
  const remaining = defaultAllowance - totalUsed;

  let content = `📊 **Your Leave Balance (${year})**\n\n`;
  content += `Total Allowance: **${defaultAllowance} days**\n`;
  content += `Used: **${totalUsed} days**\n`;
  content += `Remaining: **${remaining} days**\n\n`;

  if (Object.keys(leavesByType).length > 0) {
    content += `**Breakdown:**\n`;
    for (const [type, days] of Object.entries(leavesByType)) {
      content += `• ${type}: ${days} day(s)\n`;
    }
  }

  if (remaining <= 3) {
    content += `\n⚠️ You have only ${remaining} leave(s) left. Plan accordingly!`;
  }

  return { role: 'assistant', content };
}

async function getAttendanceSummary(userId: string, organizationId: string | null): Promise<ChatbotMessage> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const attendanceQuery = query(
    collection(db, 'attendance'),
    where('userId', '==', userId),
    where('date', '>=', startOfMonth.toISOString().split('T')[0])
  );
  
  const snap = await getDocs(attendanceQuery);
  const records = snap.docs.map(d => d.data());
  
  const present = records.filter(r => r.status === 'present' || r.punchIn).length;
  const late = records.filter(r => r.isLate).length;
  const workingDays = getWorkingDaysInMonth(now);

  const monthName = now.toLocaleString('default', { month: 'long' });

  let content = `📊 **Attendance Summary - ${monthName} ${now.getFullYear()}**\n\n`;
  content += `Working Days: **${workingDays}**\n`;
  content += `Present: **${present} days**\n`;
  content += `Late: **${late} days**\n`;
  content += `Absent: **${workingDays - present} days**\n`;
  content += `Attendance Rate: **${workingDays > 0 ? Math.round((present / workingDays) * 100) : 0}%**`;

  return {
    role: 'assistant',
    content,
    action: { type: 'navigate', data: {}, label: 'View Full Report', route: '/attendance' },
  };
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

  const today = new Date().toISOString().split('T')[0];
  
  const attendanceQuery = query(
    collection(db, 'attendance'),
    where('organizationId', '==', organizationId),
    where('date', '==', today)
  );
  const snap = await getDocs(attendanceQuery);
  
  const empQuery = query(
    collection(db, 'employees'),
    where('organizationId', '==', organizationId)
  );
  const empSnap = await getDocs(empQuery);
  
  const totalEmployees = empSnap.size;
  const presentToday = snap.size;
  const absentToday = totalEmployees - presentToday;

  let content = `👥 **Team Attendance Today**\n\n`;
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

  let empQuery;
  if (userRole === 'super-admin') {
    empQuery = query(collection(db, 'employees'));
  } else {
    empQuery = query(
      collection(db, 'employees'),
      where('organizationId', '==', organizationId)
    );
  }
  
  const snap = await getDocs(empQuery);
  
  return {
    role: 'assistant',
    content: `👥 Total employees${userRole === 'super-admin' ? ' (all orgs)' : ''}: **${snap.size}**`,
    action: { type: 'navigate', data: {}, label: '📋 View Employees', route: '/employees' },
  };
}

async function getUpcomingHolidays(organizationId: string | null): Promise<ChatbotMessage> {
  const today = new Date().toISOString().split('T')[0];
  
  let holidayQuery;
  if (organizationId) {
    holidayQuery = query(
      collection(db, 'holidays'),
      where('organizationId', '==', organizationId),
      where('date', '>=', today),
      orderBy('date', 'asc'),
      limit(5)
    );
  } else {
    holidayQuery = query(
      collection(db, 'holidays'),
      where('date', '>=', today),
      orderBy('date', 'asc'),
      limit(5)
    );
  }

  try {
    const snap = await getDocs(holidayQuery);
    
    if (snap.empty) {
      return { role: 'assistant', content: "📅 No upcoming holidays found. Check with your HR for the holiday calendar." };
    }

    let content = `📅 **Upcoming Holidays**\n\n`;
    snap.docs.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.date).toLocaleDateString('en-IN', { 
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
      });
      content += `• **${data.name}** — ${date}\n`;
    });

    return { role: 'assistant', content };
  } catch {
    return { role: 'assistant', content: "📅 I couldn't fetch the holiday list right now. Please check the Holidays section." };
  }
}

function fallbackResponse(): ChatbotMessage {
  return {
    role: 'assistant',
    content: "I'm not sure I understand that. Here are some things you can ask me:\n\n• \"How many leaves do I have?\"\n• \"Show my attendance\"\n• \"Apply for leave\"\n• \"Download salary slip\"\n• \"Raise a ticket\"\n• \"Upcoming holidays\"\n\nOr type **help** to see all commands.",
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
    const q = query(
      collection(db, 'chatbot_messages'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxMessages)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role as 'user' | 'assistant',
          content: data.content,
          action: data.action || null,
          timestamp: data.createdAt,
        };
      })
      .reverse();
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
  ];
  
  if (userRole === 'hr' || userRole === 'hod') {
    return [...common, "Who is absent today?", "How many employees?"];
  }
  if (userRole === 'super-admin') {
    return [...common, "Total employees", "Team attendance"];
  }
  return [...common, "Apply for leave", "Raise a ticket"];
}
