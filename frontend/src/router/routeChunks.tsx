import { lazy } from "react";

// Auth Module Chunk
export const AuthChunk = {
  Login: lazy(() => import("../feature-module/auth/login/login")),
  Login2: lazy(() => import("../feature-module/auth/login/login-2")),
  Login3: lazy(() => import("../feature-module/auth/login/login-3")),
  Register: lazy(() => import("../feature-module/auth/register/register")),
  Register2: lazy(() => import("../feature-module/auth/register/register-2")),
  Register3: lazy(() => import("../feature-module/auth/register/register-3")),
  TwoStepVerification: lazy(
    () =>
      import("../feature-module/auth/twoStepVerification/twoStepVerification")
  ),
  TwoStepVerification2: lazy(
    () =>
      import("../feature-module/auth/twoStepVerification/twoStepVerification-2")
  ),
  TwoStepVerification3: lazy(
    () =>
      import("../feature-module/auth/twoStepVerification/twoStepVerification-3")
  ),
  EmailVerification: lazy(
    () => import("../feature-module/auth/emailVerification/emailVerification")
  ),
  EmailVerification2: lazy(
    () => import("../feature-module/auth/emailVerification/emailVerification-2")
  ),
  EmailVerification3: lazy(
    () => import("../feature-module/auth/emailVerification/emailVerification-3")
  ),
  ResetPassword: lazy(
    () => import("../feature-module/auth/resetPassword/resetPassword")
  ),
  ResetPassword2: lazy(
    () => import("../feature-module/auth/resetPassword/resetPassword-2")
  ),
  ResetPassword3: lazy(
    () => import("../feature-module/auth/resetPassword/resetPassword-3")
  ),
  ForgotPassword: lazy(
    () => import("../feature-module/auth/forgotPassword/forgotPassword")
  ),
  ForgotPassword2: lazy(
    () => import("../feature-module/auth/forgotPassword/forgotPassword-2")
  ),
  ForgotPassword3: lazy(
    () => import("../feature-module/auth/forgotPassword/forgotPassword-3")
  ),
  ResetPasswordSuccess: lazy(
    () =>
      import("../feature-module/auth/resetPasswordSuccess/resetPasswordSuccess")
  ),
  ResetPasswordSuccess2: lazy(
    () =>
      import(
        "../feature-module/auth/resetPasswordSuccess/resetPasswordSuccess-2"
      )
  ),
  ResetPasswordSuccess3: lazy(
    () =>
      import(
        "../feature-module/auth/resetPasswordSuccess/resetPasswordSuccess-3"
      )
  ),
  LockScreen: lazy(() => import("../feature-module/auth/lockScreen")),
};

// Dashboard Module Chunk
export const DashboardChunk = {
  AdminDashboard: lazy(
    () => import("../feature-module/mainMenu/adminDashboard")
  ),
  EmployeeDashboard: lazy(
    () =>
      import("../feature-module/mainMenu/employeeDashboard/employee-dashboard")
  ),
  LeadsDasboard: lazy(
    () => import("../feature-module/mainMenu/leadsDashboard")
  ),
  DealsDashboard: lazy(
    () => import("../feature-module/mainMenu/dealsDashboard")
  ),
  SuperAdminDashboard: lazy(
    () => import("../feature-module/super-admin/dashboard")
  ),
  LayoutDemo: lazy(() => import("../feature-module/mainMenu/layout-dashoard")),
};

// CRM Module Chunk
export const CRMChunk = {
  ContactList: lazy(() => import("../feature-module/crm/contacts/contactList")),
  ContactGrid: lazy(() => import("../feature-module/crm/contacts/contactGrid")),
  ContactDetails: lazy(
    () => import("../feature-module/crm/contacts/contactDetails")
  ),
  CompaniesGrid: lazy(
    () => import("../feature-module/crm/companies/companiesGrid")
  ),
  CompaniesList: lazy(
    () => import("../feature-module/crm/companies/companiesList")
  ),
  CompaniesDetails: lazy(
    () => import("../feature-module/crm/companies/companiesDetails")
  ),
  LeadsGrid: lazy(() => import("../feature-module/crm/leads/leadsGrid")),
  LeadsList: lazy(() => import("../feature-module/crm/leads/leadsList")),
  LeadsDetails: lazy(() => import("../feature-module/crm/leads/leadsDetails")),
  DealsGrid: lazy(() => import("../feature-module/crm/deals/dealsGrid")),
  DealsDetails: lazy(() => import("../feature-module/crm/deals/dealsDetails")),
  DealsList: lazy(() => import("../feature-module/crm/deals/dealsList")),
  Pipeline: lazy(() => import("../feature-module/crm/pipeline/pipeline")),
  Analytics: lazy(() => import("../feature-module/crm/analytics/analytics")),
};

// HRM Module Chunk
export const HRMChunk = {
  EmployeeList: lazy(
    () => import("../feature-module/hrm/employees/employeesList")
  ),
  EmployeesGrid: lazy(
    () => import("../feature-module/hrm/employees/employeesGrid")
  ),
  Department: lazy(() => import("../feature-module/hrm/employees/deparment")),
  Designations: lazy(
    () => import("../feature-module/hrm/employees/designations")
  ),
  Policy: lazy(() => import("../feature-module/hrm/employees/policy")),
  EmployeeDetails: lazy(
    () => import("../feature-module/hrm/employees/employeedetails")
  ),
  LeaveAdmin: lazy(
    () => import("../feature-module/hrm/attendance/leaves/leaveAdmin")
  ),
  LeaveEmployee: lazy(
    () => import("../feature-module/hrm/attendance/leaves/leaveEmployee")
  ),
  LeaveSettings: lazy(
    () => import("../feature-module/hrm/attendance/leaves/leavesettings")
  ),
  AttendanceAdmin: lazy(
    () => import("../feature-module/hrm/attendance/attendanceadmin")
  ),
  AttendanceEmployee: lazy(
    () => import("../feature-module/hrm/attendance/attendance_employee")
  ),
  TimeSheet: lazy(() => import("../feature-module/hrm/attendance/timesheet")),
  ScheduleTiming: lazy(
    () => import("../feature-module/hrm/attendance/scheduletiming")
  ),
  OverTime: lazy(() => import("../feature-module/hrm/attendance/overtime")),
  Holidays: lazy(() => import("../feature-module/hrm/holidays")),
  Termination: lazy(() => import("../feature-module/hrm/termination")),
  Resignation: lazy(() => import("../feature-module/hrm/resignation")),
  Promotion: lazy(() => import("../feature-module/hrm/promotion")),
};

// Project Module Chunk
export const ProjectChunk = {
  ClienttGrid: lazy(
    () => import("../feature-module/projects/clinet/clienttgrid")
  ),
  ClientList: lazy(
    () => import("../feature-module/projects/clinet/clientlist")
  ),
  ClientDetails: lazy(
    () => import("../feature-module/projects/clinet/clientdetails")
  ),
  Project: lazy(() => import("../feature-module/projects/project/project")),
  ProjectDetails: lazy(
    () => import("../feature-module/projects/project/projectdetails")
  ),
  ProjectList: lazy(
    () => import("../feature-module/projects/project/projectlist")
  ),
  Task: lazy(() => import("../feature-module/projects/task/task")),
  TaskDetails: lazy(
    () => import("../feature-module/projects/task/taskdetails")
  ),
  TaskBoard: lazy(() => import("../feature-module/projects/task/task-board")),
};

// Finance Module Chunk
export const FinanceChunk = {
  Invoices: lazy(
    () => import("../feature-module/finance-accounts/sales/invoices")
  ),
  AddInvoice: lazy(
    () => import("../feature-module/finance-accounts/sales/add_invoices")
  ),
  InvoiceDetails: lazy(() => import("../feature-module/sales/invoiceDetails")),
  Payments: lazy(
    () => import("../feature-module/finance-accounts/sales/payment")
  ),
  Expenses: lazy(
    () => import("../feature-module/finance-accounts/sales/expenses")
  ),
  ProvidentFund: lazy(
    () => import("../feature-module/finance-accounts/sales/provident_fund")
  ),
  Taxes: lazy(() => import("../feature-module/finance-accounts/sales/taxes")),
  Estimates: lazy(
    () => import("../feature-module/finance-accounts/sales/estimates")
  ),
  EmployeeSalary: lazy(
    () => import("../feature-module/finance-accounts/payrool/employee_salary")
  ),
  PaySlip: lazy(
    () => import("../feature-module/finance-accounts/payrool/payslip")
  ),
  PayRoll: lazy(
    () => import("../feature-module/finance-accounts/payrool/payroll")
  ),
  PayRollOvertime: lazy(
    () => import("../feature-module/finance-accounts/payrool/payrollOvertime")
  ),
  PayRollDeduction: lazy(
    () => import("../feature-module/finance-accounts/payrool/payrollDedution")
  ),
};

// Application Module Chunk
export const ApplicationChunk = {
  Chat: lazy(() => import("../feature-module/application/chat")),
  VoiceCall: lazy(() => import("../feature-module/application/call/voiceCall")),
  Videocallss: lazy(
    () => import("../feature-module/application/call/videocalls")
  ),
  OutgoingCall: lazy(
    () => import("../feature-module/application/call/outgingcalls")
  ),
  IncomingCall: lazy(
    () => import("../feature-module/application/call/incomingcall")
  ),
  CallHistory: lazy(
    () => import("../feature-module/application/call/callHistory")
  ),
  Calendars: lazy(() => import("../feature-module/mainMenu/apps/calendar")),
  Email: lazy(() => import("../feature-module/application/email")),
  EmailReply: lazy(() => import("../feature-module/application/emailReply")),
  Todo: lazy(() => import("../feature-module/application/todo/todo")),
  TodoList: lazy(() => import("../feature-module/application/todo/todolist")),
  Notes: lazy(() => import("../feature-module/application/notes")),
  SocialFeed: lazy(() => import("../feature-module/application/socialfeed")),
  FileManager: lazy(() => import("../feature-module/application/fileManager")),
  KanbanView: lazy(() => import("../feature-module/application/kanbanView")),
};

// Settings Module Chunk
export const SettingsChunk = {
  Profilesettings: lazy(
    () => import("../feature-module/settings/generalSettings/profile-settings")
  ),
  Securitysettings: lazy(
    () => import("../feature-module/settings/generalSettings/security-settings")
  ),
  Notificationssettings: lazy(
    () =>
      import(
        "../feature-module/settings/generalSettings/notifications-settings"
      )
  ),
  ConnectedApps: lazy(
    () => import("../feature-module/settings/generalSettings/connected-apps")
  ),
  Bussinesssettings: lazy(
    () =>
      import("../feature-module/settings/websiteSettings/bussiness-settings")
  ),
  Seosettings: lazy(
    () => import("../feature-module/settings/websiteSettings/seo-settings")
  ),
  CompanySettings: lazy(
    () => import("../feature-module/settings/websiteSettings/companySettings")
  ),
  Localizationsettings: lazy(
    () =>
      import("../feature-module/settings/websiteSettings/localization-settings")
  ),
  Prefixes: lazy(
    () => import("../feature-module/settings/websiteSettings/prefixes")
  ),
  Preference: lazy(
    () => import("../feature-module/settings/websiteSettings/preferences")
  ),
  Authenticationsettings: lazy(
    () =>
      import(
        "../feature-module/settings/websiteSettings/authentication-settings"
      )
  ),
  Aisettings: lazy(
    () => import("../feature-module/settings/websiteSettings/ai-settings")
  ),
  Salarysettings: lazy(
    () => import("../feature-module/settings/appSettings/salary-settings")
  ),
  Approvalsettings: lazy(
    () => import("../feature-module/settings/appSettings/approval-settings")
  ),
  Appearance: lazy(
    () => import("../feature-module/settings/websiteSettings/appearance")
  ),
  Languageweb: lazy(
    () => import("../feature-module/settings/websiteSettings/language-web")
  ),
  Addlanguage: lazy(
    () => import("../feature-module/settings/websiteSettings/add-language")
  ),
  InvoiceSettings: lazy(
    () => import("../feature-module/settings/appSettings/invoiceSettings")
  ),
  CustomFields: lazy(
    () => import("../feature-module/settings/appSettings/customFields")
  ),
  LeaveType: lazy(
    () => import("../feature-module/settings/appSettings/leave-type")
  ),
  EmailSettings: lazy(
    () => import("../feature-module/settings/systemSettings/emailSettings")
  ),
  Emailtemplates: lazy(
    () => import("../feature-module/settings/systemSettings/email-templates")
  ),
  SmsSettings: lazy(
    () => import("../feature-module/settings/systemSettings/smsSettings")
  ),
  SmsTemplate: lazy(
    () => import("../feature-module/settings/systemSettings/sms-template")
  ),
  OtpSettings: lazy(
    () => import("../feature-module/settings/systemSettings/otp-settings")
  ),
  GdprCookies: lazy(
    () => import("../feature-module/settings/systemSettings/gdprCookies")
  ),
  Maintenancemode: lazy(
    () => import("../feature-module/settings/systemSettings/maintenance-mode")
  ),
  PaymentGateways: lazy(
    () => import("../feature-module/settings/financialSettings/paymentGateways")
  ),
  TaxRates: lazy(
    () => import("../feature-module/settings/financialSettings/taxRates")
  ),
  Currencies: lazy(
    () => import("../feature-module/settings/financialSettings/currencies")
  ),
  Backup: lazy(() => import("../feature-module/settings/otherSettings/backup")),
  Clearcache: lazy(
    () => import("../feature-module/settings/otherSettings/clearCache")
  ),
  Customcss: lazy(
    () => import("../feature-module/settings/otherSettings/custom-css")
  ),
  Customjs: lazy(
    () => import("../feature-module/settings/otherSettings/custom-js")
  ),
  Cronjob: lazy(
    () => import("../feature-module/settings/otherSettings/cronjob")
  ),
  Cronjobschedule: lazy(
    () => import("../feature-module/settings/otherSettings/cronjobSchedule")
  ),
  Storage: lazy(
    () => import("../feature-module/settings/otherSettings/storage")
  ),
};

// Error Pages Chunk
export const ErrorChunk = {
  Error404: lazy(() => import("../feature-module/pages/error/error-404")),
  Error500: lazy(() => import("../feature-module/pages/error/error-500")),
  UnderMaintenance: lazy(
    () => import("../feature-module/pages/underMaintenance")
  ),
  UnderConstruction: lazy(
    () => import("../feature-module/pages/underConstruction")
  ),
};

// Performance Module Chunk
export const PerformanceChunk = {
  PerformanceIndicator: lazy(
    () => import("../feature-module/performance/performanceIndicator")
  ),
  PerformanceReview: lazy(
    () => import("../feature-module/performance/performanceReview")
  ),
  PerformanceAppraisal: lazy(
    () => import("../feature-module/performance/performanceAppraisal")
  ),
  GoalTracking: lazy(
    () => import("../feature-module/performance/goalTracking")
  ),
  GoalType: lazy(() => import("../feature-module/performance/goalType")),
};

// Training Module Chunk
export const TrainingChunk = {
  TrainingList: lazy(() => import("../feature-module/training/trainingList")),
  Trainers: lazy(() => import("../feature-module/training/trainers")),
  TrainingType: lazy(() => import("../feature-module/training/trainingType")),
};

// User Management Module Chunk
export const UserManagementChunk = {
  RolesPermissions: lazy(
    () => import("../feature-module/userManagement/rolesPermissions")
  ),
  PermissionPage: lazy(
    () =>
      import("../feature-module/administration/user-management/permissionpage")
  ),
  Manageusers: lazy(
    () => import("../feature-module/userManagement/manageusers")
  ),
  Permission: lazy(() => import("../feature-module/userManagement/permission")),
};

// Reports Module Chunk
export const ReportsChunk = {
  ExpensesReport: lazy(
    () => import("../feature-module/administration/reports/expensereport")
  ),
  InvoiceReport: lazy(
    () => import("../feature-module/administration/reports/invoicereport")
  ),
  PaymentReport: lazy(
    () => import("../feature-module/administration/reports/paymentreport")
  ),
  ProjectReport: lazy(
    () => import("../feature-module/administration/reports/projectreport")
  ),
  TaskReport: lazy(
    () => import("../feature-module/administration/reports/taskreport")
  ),
  UserReports: lazy(
    () => import("../feature-module/administration/reports/userreports")
  ),
  EmployeeReports: lazy(
    () => import("../feature-module/administration/reports/employeereports")
  ),
  PayslipReport: lazy(
    () => import("../feature-module/administration/reports/payslipreport")
  ),
  AttendanceReport: lazy(
    () => import("../feature-module/administration/reports/attendencereport")
  ),
  LeaveReport: lazy(
    () => import("../feature-module/administration/reports/leavereport")
  ),
  DailyReport: lazy(
    () => import("../feature-module/administration/reports/dailyreport")
  ),
};

// Content Module Chunk
export const ContentChunk = {
  Blogs: lazy(() => import("../feature-module/content/blog/blogs")),
  BlogCategories: lazy(
    () => import("../feature-module/content/blog/blogCategories")
  ),
  BlogComments: lazy(
    () => import("../feature-module/content/blog/blogComments")
  ),
  BlogTags: lazy(() => import("../feature-module/content/blog/blogTags")),
};

// Pages Module Chunk
export const PagesChunk = {
  Profile: lazy(() => import("../feature-module/pages/profile")),
  Gallery: lazy(() => import("../feature-module/pages/gallery")),
  SearchResult: lazy(() => import("../feature-module/pages/search-result")),
  TimeLines: lazy(() => import("../feature-module/pages/timeline")),
  Pricing: lazy(() => import("../feature-module/pages/pricing")),
  ApiKeys: lazy(() => import("../feature-module/pages/api-keys")),
  PrivacyPolicy: lazy(() => import("../feature-module/pages/privacy-policy")),
  TermsCondition: lazy(() => import("../feature-module/pages/terms-condition")),
};

// Administration Module Chunk
export const AdministrationChunk = {
  Assets: lazy(() => import("../feature-module/administration/asset")),
  AssetsCategory: lazy(
    () => import("../feature-module/administration/asset-category")
  ),
  Knowledgebase: lazy(
    () => import("../feature-module/administration/help-support/knowledgebase")
  ),
  Users: lazy(
    () => import("../feature-module/administration/user-management/users")
  ),
  RolesPermission: lazy(
    () =>
      import("../feature-module/administration/user-management/rolePermission")
  ),
  Activity: lazy(
    () => import("../feature-module/administration/help-support/activity")
  ),
};

// Recruitment Module Chunk
export const RecruitmentChunk = {
  JobGrid: lazy(() => import("../feature-module/recruitment/jobs/jobgrid")),
  JobList: lazy(() => import("../feature-module/recruitment/joblist/joblist")),
  CandidateGrid: lazy(
    () => import("../feature-module/recruitment/candidates/candidategrid")
  ),
  CandidatesList: lazy(
    () => import("../feature-module/recruitment/candidates/candidatelist")
  ),
  CandidateKanban: lazy(
    () => import("../feature-module/recruitment/candidates/candidatekanban")
  ),
  RefferalList: lazy(
    () => import("../feature-module/recruitment/refferal/refferallist")
  ),
};

// Super Admin Module Chunk
export const SuperAdminChunk = {
  Companies: lazy(() => import("../feature-module/super-admin/companies")),
  Subscription: lazy(
    () => import("../feature-module/super-admin/subscription")
  ),
  Packages: lazy(
    () => import("../feature-module/super-admin/packages/packagelist")
  ),
  PackagesGrid: lazy(
    () => import("../feature-module/super-admin/packages/packagegrid")
  ),
  Domain: lazy(() => import("../feature-module/super-admin/domin")),
  PurchaseTransaction: lazy(
    () => import("../feature-module/super-admin/purchase-transaction")
  ),
};

// Tickets Module Chunk
export const TicketsChunk = {
  Tickets: lazy(() => import("../feature-module/tickets/tickets")),
  TicketGrid: lazy(() => import("../feature-module/tickets/tickets-grid")),
  TicketDetails: lazy(() => import("../feature-module/tickets/ticket-details")),
};

// Coming Soon Module Chunk
// export const ComingSoonChunk = {
//   ComingSoon: lazy(() => import("../feature-module/pages/coming-soon")),
// };
