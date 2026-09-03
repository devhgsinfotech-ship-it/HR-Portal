import React, { Suspense, lazy } from "react";
import { LoadingSpinner } from "../core/common/LoadingSpinner";

// Error Boundary Component for Lazy Loaded Components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Lazy component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary-fallback">
            <h3>Something went wrong loading this component.</h3>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Enhanced lazy component creator with error boundary and preloading
const createLazyComponent = (
  importFunc: () => Promise<{ default: React.ComponentType<object> }>,
  fallback?: React.ReactNode,
  preload?: boolean
) => {
  const LazyComponent = lazy(importFunc);

  // Preload the component if requested
  if (preload) {
    importFunc();
  }

  return (props: object) => (
    <LazyErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Preload function for critical components
export const preloadComponent = (
  importFunc: () => Promise<{ default: React.ComponentType<object> }>
) => {
  return () => {
    importFunc();
  };
};

// Auth Components - Lazy Loaded (Critical - Preload enabled)
export const Login = createLazyComponent(
  () => import("../feature-module/auth/login/login"),
  <LoadingSpinner text="Loading login..." />,
  true
);
export const Login2 = createLazyComponent(
  () => import("../feature-module/auth/login/login-2"),
  <LoadingSpinner text="Loading login..." />
);
export const Login3 = createLazyComponent(
  () => import("../feature-module/auth/login/login-3"),
  <LoadingSpinner text="Loading login..." />
);
export const Register = createLazyComponent(
  () => import("../feature-module/auth/register/register"),
  <LoadingSpinner text="Loading registration..." />
);
export const Register2 = createLazyComponent(
  () => import("../feature-module/auth/register/register-2"),
  <LoadingSpinner text="Loading registration..." />
);
export const Register3 = createLazyComponent(
  () => import("../feature-module/auth/register/register-3"),
  <LoadingSpinner text="Loading registration..." />
);
export const TwoStepVerification = createLazyComponent(
  () =>
    import("../feature-module/auth/twoStepVerification/twoStepVerification"),
  <LoadingSpinner text="Loading verification..." />
);
export const TwoStepVerification2 = createLazyComponent(
  () =>
    import("../feature-module/auth/twoStepVerification/twoStepVerification-2"),
  <LoadingSpinner text="Loading verification..." />
);
export const TwoStepVerification3 = createLazyComponent(
  () =>
    import("../feature-module/auth/twoStepVerification/twoStepVerification-3"),
  <LoadingSpinner text="Loading verification..." />
);
export const EmailVerification = createLazyComponent(
  () => import("../feature-module/auth/emailVerification/emailVerification"),
  <LoadingSpinner text="Loading email verification..." />
);
export const EmailVerification2 = createLazyComponent(
  () => import("../feature-module/auth/emailVerification/emailVerification-2"),
  <LoadingSpinner text="Loading email verification..." />
);
export const EmailVerification3 = createLazyComponent(
  () => import("../feature-module/auth/emailVerification/emailVerification-3"),
  <LoadingSpinner text="Loading email verification..." />
);
export const ResetPassword = createLazyComponent(
  () => import("../feature-module/auth/resetPassword/resetPassword"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ResetPassword2 = createLazyComponent(
  () => import("../feature-module/auth/resetPassword/resetPassword-2"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ResetPassword3 = createLazyComponent(
  () => import("../feature-module/auth/resetPassword/resetPassword-3"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ForgotPassword = createLazyComponent(
  () => import("../feature-module/auth/forgotPassword/forgotPassword"),
  <LoadingSpinner text="Loading forgot password..." />
);
export const ForgotPassword2 = createLazyComponent(
  () => import("../feature-module/auth/forgotPassword/forgotPassword-2"),
  <LoadingSpinner text="Loading forgot password..." />
);
export const ForgotPassword3 = createLazyComponent(
  () => import("../feature-module/auth/forgotPassword/forgotPassword-3"),
  <LoadingSpinner text="Loading forgot password..." />
);
export const ResetPasswordSuccess = createLazyComponent(
  () =>
    import("../feature-module/auth/resetPasswordSuccess/resetPasswordSuccess"),
  <LoadingSpinner text="Loading success page..." />
);
export const ResetPasswordSuccess2 = createLazyComponent(
  () =>
    import(
      "../feature-module/auth/resetPasswordSuccess/resetPasswordSuccess-2"
    ),
  <LoadingSpinner text="Loading success page..." />
);
export const ResetPasswordSuccess3 = createLazyComponent(
  () =>
    import(
      "../feature-module/auth/resetPasswordSuccess/resetPasswordSuccess-3"
    ),
  <LoadingSpinner text="Loading success page..." />
);
export const LockScreen = createLazyComponent(
  () => import("../feature-module/auth/lockScreen"),
  <LoadingSpinner text="Loading lock screen..." />
);

// Error Pages - Lazy Loaded
export const Error404 = createLazyComponent(
  () => import("../feature-module/pages/error/error-404"),
  <LoadingSpinner text="Loading error page..." />
);
export const Error500 = createLazyComponent(
  () => import("../feature-module/pages/error/error-500"),
  <LoadingSpinner text="Loading error page..." />
);
export const UnderMaintenance = createLazyComponent(
  () => import("../feature-module/pages/underMaintenance"),
  <LoadingSpinner text="Loading maintenance page..." />
);
export const UnderConstruction = createLazyComponent(
  () => import("../feature-module/pages/underConstruction"),
  <LoadingSpinner text="Loading construction page..." />
);

// Dashboard Components - Lazy Loaded (Critical - Preload enabled)
export const AdminDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/adminDashboard"),
  <LoadingSpinner text="Loading dashboard..." />,
  true
);
export const EmployeeDashboard = createLazyComponent(
  () =>
    import("../feature-module/mainMenu/employeeDashboard/employee-dashboard"),
  <LoadingSpinner text="Loading employee dashboard..." />
);
export const EmployeeMe = createLazyComponent(() => import("../feature-module/mainMenu/employeeDashboard/employeeMe"), <LoadingSpinner text="Loading..." />);
export const EmployeeInbox = createLazyComponent(() => import("../feature-module/mainMenu/employeeDashboard/employeeInbox"), <LoadingSpinner text="Loading..." />);
export const EmployeeMyTeam = createLazyComponent(() => import("../feature-module/mainMenu/employeeDashboard/employeeMyTeam"), <LoadingSpinner text="Loading..." />);
export const EmployeeMyFinances = createLazyComponent(() => import("../feature-module/mainMenu/employeeDashboard/employeeMyFinances"), <LoadingSpinner text="Loading..." />);
export const EmployeeOrg = createLazyComponent(() => import("../feature-module/mainMenu/employeeDashboard/employeeOrg"), <LoadingSpinner text="Loading..." />);
export const EmployeeEngage = createLazyComponent(() => import("../feature-module/mainMenu/employeeDashboard/employeeEngage"), <LoadingSpinner text="Loading..." />);
export const EmployeeHelpdesk = createLazyComponent(() => import("../feature-module/mainMenu/employeeDashboard/employeeHelpdesk"), <LoadingSpinner text="Loading..." />);
export const EmployeePerformance = createLazyComponent(() => import("../feature-module/mainMenu/employeeDashboard/employeePerformance"), <LoadingSpinner text="Loading..." />);
export const LeadsDasboard = createLazyComponent(
  () => import("../feature-module/mainMenu/leadsDashboard"),
  <LoadingSpinner text="Loading leads dashboard..." />
);
export const DealsDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/dealsDashboard"),
  <LoadingSpinner text="Loading deals dashboard..." />
);
export const SuperAdminDashboard = createLazyComponent(
  () => import("../feature-module/super-admin/dashboard"),
  <LoadingSpinner text="Loading super admin dashboard..." />
);
export const LayoutDemo = createLazyComponent(
  () => import("../feature-module/mainMenu/layout-dashoard"),
  <LoadingSpinner text="Loading layout demo..." />
);

// Application Components - Lazy Loaded
export const Chat = createLazyComponent(
  () => import("../feature-module/application/chat"),
  <LoadingSpinner text="Loading chat..." />
);
export const VoiceCall = createLazyComponent(
  () => import("../feature-module/application/call/voiceCall"),
  <LoadingSpinner text="Loading voice call..." />
);
export const Videocallss = createLazyComponent(
  () => import("../feature-module/application/call/videocalls"),
  <LoadingSpinner text="Loading video call..." />
);
export const OutgoingCall = createLazyComponent(
  () => import("../feature-module/application/call/outgingcalls"),
  <LoadingSpinner text="Loading outgoing call..." />
);
export const IncomingCall = createLazyComponent(
  () => import("../feature-module/application/call/incomingcall"),
  <LoadingSpinner text="Loading incoming call..." />
);
export const CallHistory = createLazyComponent(
  () => import("../feature-module/application/call/callHistory"),
  <LoadingSpinner text="Loading call history..." />
);
export const Calendars = createLazyComponent(
  () => import("../feature-module/mainMenu/apps/calendar"),
  <LoadingSpinner text="Loading calendar..." />
);
export const Email = createLazyComponent(
  () => import("../feature-module/application/email"),
  <LoadingSpinner text="Loading email..." />
);
export const EmailReply = createLazyComponent(
  () => import("../feature-module/application/emailReply"),
  <LoadingSpinner text="Loading email reply..." />
);
export const Todo = createLazyComponent(
  () => import("../feature-module/application/todo/todo"),
  <LoadingSpinner text="Loading todo..." />
);
export const TodoList = createLazyComponent(
  () => import("../feature-module/application/todo/todolist"),
  <LoadingSpinner text="Loading todo list..." />
);
export const Notes = createLazyComponent(
  () => import("../feature-module/application/notes"),
  <LoadingSpinner text="Loading notes..." />
);
export const SocialFeed = createLazyComponent(
  () => import("../feature-module/application/socialfeed"),
  <LoadingSpinner text="Loading social feed..." />
);
export const FileManager = createLazyComponent(
  () => import("../feature-module/application/fileManager"),
  <LoadingSpinner text="Loading file manager..." />
);
export const KanbanView = createLazyComponent(
  () => import("../feature-module/application/kanbanView"),
  <LoadingSpinner text="Loading kanban view..." />
);

// CRM Components - Lazy Loaded
export const ContactList = createLazyComponent(
  () => import("../feature-module/crm/contacts/contactList"),
  <LoadingSpinner text="Loading contacts..." />
);
export const ContactGrid = createLazyComponent(
  () => import("../feature-module/crm/contacts/contactGrid"),
  <LoadingSpinner text="Loading contact grid..." />
);
export const ContactDetails = createLazyComponent(
  () => import("../feature-module/crm/contacts/contactDetails"),
  <LoadingSpinner text="Loading contact details..." />
);
export const CompaniesGrid = createLazyComponent(
  () => import("../feature-module/crm/companies/companiesGrid"),
  <LoadingSpinner text="Loading companies grid..." />
);
export const CompaniesList = createLazyComponent(
  () => import("../feature-module/crm/companies/companiesList"),
  <LoadingSpinner text="Loading companies list..." />
);
export const CompaniesDetails = createLazyComponent(
  () => import("../feature-module/crm/companies/companiesDetails"),
  <LoadingSpinner text="Loading company details..." />
);
export const LeadsGrid = createLazyComponent(
  () => import("../feature-module/crm/leads/leadsGrid"),
  <LoadingSpinner text="Loading leads grid..." />
);
export const LeadsList = createLazyComponent(
  () => import("../feature-module/crm/leads/leadsList"),
  <LoadingSpinner text="Loading leads list..." />
);
export const LeadsDetails = createLazyComponent(
  () => import("../feature-module/crm/leads/leadsDetails"),
  <LoadingSpinner text="Loading lead details..." />
);
export const DealsGrid = createLazyComponent(
  () => import("../feature-module/crm/deals/dealsGrid")
);
export const DealsDetails = createLazyComponent(
  () => import("../feature-module/crm/deals/dealsDetails")
);
export const DealsList = createLazyComponent(
  () => import("../feature-module/crm/deals/dealsList")
);
export const Pipeline = createLazyComponent(
  () => import("../feature-module/crm/pipeline/pipeline")
);
export const Analytics = createLazyComponent(
  () => import("../feature-module/crm/analytics/analytics")
);

// HRM Components - Lazy Loaded
export const EmployeeList = createLazyComponent(
  () => import("../feature-module/hrm/employees/employeesList")
);
export const EmployeesGrid = createLazyComponent(
  () => import("../feature-module/hrm/employees/employeesGrid")
);
export const Department = createLazyComponent(
  () => import("../feature-module/hrm/employees/deparment")
);
export const Designations = createLazyComponent(
  () => import("../feature-module/hrm/employees/designations")
);
export const Policy = createLazyComponent(
  () => import("../feature-module/hrm/employees/policy")
);
export const EmployeeDetails = createLazyComponent(
  () => import("../feature-module/hrm/employees/employeedetails")
);
export const LeaveAdmin = createLazyComponent(
  () => import("../feature-module/hrm/attendance/leaves/leaveAdmin")
);
export const LeaveEmployee = createLazyComponent(
  () => import("../feature-module/hrm/attendance/leaves/leaveEmployee")
);
export const LeaveSettings = createLazyComponent(
  () => import("../feature-module/hrm/attendance/leaves/leavesettings")
);
export const AttendanceAdmin = createLazyComponent(
  () => import("../feature-module/hrm/attendance/attendanceadmin")
);
export const AttendanceEmployee = createLazyComponent(
  () => import("../feature-module/hrm/attendance/attendance_employee")
);
export const TimeSheet = createLazyComponent(
  () => import("../feature-module/hrm/attendance/timesheet")
);
export const ScheduleTiming = createLazyComponent(
  () => import("../feature-module/hrm/attendance/scheduletiming")
);
export const OverTime = createLazyComponent(
  () => import("../feature-module/hrm/attendance/overtime")
);
export const Holidays = createLazyComponent(
  () => import("../feature-module/hrm/holidays")
);
export const Termination = createLazyComponent(
  () => import("../feature-module/hrm/termination")
);
export const Resignation = createLazyComponent(
  () => import("../feature-module/hrm/resignation")
);
export const Promotion = createLazyComponent(
  () => import("../feature-module/hrm/promotion")
);

// Project Components - Lazy Loaded
export const ClienttGrid = createLazyComponent(
  () => import("../feature-module/projects/clinet/clienttgrid")
);
export const ClientList = createLazyComponent(
  () => import("../feature-module/projects/clinet/clientlist")
);
export const ClientDetails = createLazyComponent(
  () => import("../feature-module/projects/clinet/clientdetails")
);
export const Project = createLazyComponent(
  () => import("../feature-module/projects/project/project")
);
export const ProjectDetails = createLazyComponent(
  () => import("../feature-module/projects/project/projectdetails")
);
export const ProjectList = createLazyComponent(
  () => import("../feature-module/projects/project/projectlist")
);
export const Task = createLazyComponent(
  () => import("../feature-module/projects/task/task")
);
export const TaskDetails = createLazyComponent(
  () => import("../feature-module/projects/task/taskdetails")
);
export const TaskBoard = createLazyComponent(
  () => import("../feature-module/projects/task/task-board")
);

// Finance Components - Lazy Loaded
export const Invoices = createLazyComponent(
  () => import("../feature-module/finance-accounts/sales/invoices")
);
export const AddInvoice = createLazyComponent(
  () => import("../feature-module/finance-accounts/sales/add_invoices")
);
export const InvoiceDetails = createLazyComponent(
  () => import("../feature-module/sales/invoiceDetails")
);
export const Payments = createLazyComponent(
  () => import("../feature-module/finance-accounts/sales/payment")
);
export const Expenses = createLazyComponent(
  () => import("../feature-module/finance-accounts/sales/expenses")
);
export const ProvidentFund = createLazyComponent(
  () => import("../feature-module/finance-accounts/sales/provident_fund")
);
export const Taxes = createLazyComponent(
  () => import("../feature-module/finance-accounts/sales/taxes")
);
export const Estimates = createLazyComponent(
  () => import("../feature-module/finance-accounts/sales/estimates")
);
export const EmployeeSalary = createLazyComponent(
  () => import("../feature-module/finance-accounts/payrool/employee_salary")
);
export const PaySlip = createLazyComponent(
  () => import("../feature-module/finance-accounts/payrool/payslip")
);
export const PayRoll = createLazyComponent(
  () => import("../feature-module/finance-accounts/payrool/payroll")
);
export const PayRollOvertime = createLazyComponent(
  () => import("../feature-module/finance-accounts/payrool/payrollOvertime")
);
export const PayRollDeduction = createLazyComponent(
  () => import("../feature-module/finance-accounts/payrool/payrollDedution")
);

// Performance Components - Lazy Loaded
export const PerformanceIndicator = createLazyComponent(
  () => import("../feature-module/performance/performanceIndicator")
);
export const PerformanceReview = createLazyComponent(
  () => import("../feature-module/performance/performanceReview")
);
export const PerformanceAppraisal = createLazyComponent(
  () => import("../feature-module/performance/performanceAppraisal")
);
export const GoalTracking = createLazyComponent(
  () => import("../feature-module/performance/goalTracking")
);
export const GoalType = createLazyComponent(
  () => import("../feature-module/performance/goalType")
);

// Training Components - Lazy Loaded
export const TrainingList = createLazyComponent(
  () => import("../feature-module/training/trainingList")
);
export const Trainers = createLazyComponent(
  () => import("../feature-module/training/trainers")
);
export const TrainingType = createLazyComponent(
  () => import("../feature-module/training/trainingType")
);

// Settings Components - Lazy Loaded
export const Profilesettings = createLazyComponent(
  () => import("../feature-module/settings/generalSettings/profile-settings")
);
export const Securitysettings = createLazyComponent(
  () => import("../feature-module/settings/generalSettings/security-settings")
);
export const Notificationssettings = createLazyComponent(
  () =>
    import("../feature-module/settings/generalSettings/notifications-settings")
);
export const ConnectedApps = createLazyComponent(
  () => import("../feature-module/settings/generalSettings/connected-apps")
);
export const Bussinesssettings = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/bussiness-settings")
);
export const Seosettings = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/seo-settings")
);
export const CompanySettings = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/companySettings")
);
export const Localizationsettings = createLazyComponent(
  () =>
    import("../feature-module/settings/websiteSettings/localization-settings")
);
export const Prefixes = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/prefixes")
);
export const Preference = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/preferences")
);
export const Authenticationsettings = createLazyComponent(
  () =>
    import("../feature-module/settings/websiteSettings/authentication-settings")
);
export const Aisettings = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/ai-settings")
);
export const Salarysettings = createLazyComponent(
  () => import("../feature-module/settings/appSettings/salary-settings")
);
export const Approvalsettings = createLazyComponent(
  () => import("../feature-module/settings/appSettings/approval-settings")
);
export const Appearance = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/appearance")
);
export const Languageweb = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/language-web")
);
export const Addlanguage = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/add-language")
);
export const InvoiceSettings = createLazyComponent(
  () => import("../feature-module/settings/appSettings/invoiceSettings")
);
export const CustomFields = createLazyComponent(
  () => import("../feature-module/settings/appSettings/customFields")
);
export const LeaveType = createLazyComponent(
  () => import("../feature-module/settings/appSettings/leave-type")
);
export const EmailSettings = createLazyComponent(
  () => import("../feature-module/settings/systemSettings/emailSettings")
);
export const Emailtemplates = createLazyComponent(
  () => import("../feature-module/settings/systemSettings/email-templates")
);
export const SmsSettings = createLazyComponent(
  () => import("../feature-module/settings/systemSettings/smsSettings")
);
export const SmsTemplate = createLazyComponent(
  () => import("../feature-module/settings/systemSettings/sms-template")
);
export const OtpSettings = createLazyComponent(
  () => import("../feature-module/settings/systemSettings/otp-settings")
);
export const GdprCookies = createLazyComponent(
  () => import("../feature-module/settings/systemSettings/gdprCookies")
);
export const Maintenancemode = createLazyComponent(
  () => import("../feature-module/settings/systemSettings/maintenance-mode")
);
export const PaymentGateways = createLazyComponent(
  () => import("../feature-module/settings/financialSettings/paymentGateways")
);
export const TaxRates = createLazyComponent(
  () => import("../feature-module/settings/financialSettings/taxRates")
);
export const Currencies = createLazyComponent(
  () => import("../feature-module/settings/financialSettings/currencies")
);
export const Backup = createLazyComponent(
  () => import("../feature-module/settings/otherSettings/backup")
);
export const Clearcache = createLazyComponent(
  () => import("../feature-module/settings/otherSettings/clearCache")
);
export const Customcss = createLazyComponent(
  () => import("../feature-module/settings/otherSettings/custom-css")
);
export const Customjs = createLazyComponent(
  () => import("../feature-module/settings/otherSettings/custom-js")
);
export const Cronjob = createLazyComponent(
  () => import("../feature-module/settings/otherSettings/cronjob")
);
export const Cronjobschedule = createLazyComponent(
  () => import("../feature-module/settings/otherSettings/cronjobSchedule")
);
export const Storage = createLazyComponent(
  () => import("../feature-module/settings/otherSettings/storage")
);

// User Management Components - Lazy Loaded
export const RolesPermissions = createLazyComponent(
  () => import("../feature-module/userManagement/rolesPermissions")
);
export const PermissionPage = createLazyComponent(
  () =>
    import("../feature-module/administration/user-management/permissionpage")
);
export const Manageusers = createLazyComponent(
  () => import("../feature-module/userManagement/manageusers")
);
export const Permission = createLazyComponent(
  () => import("../feature-module/userManagement/permission")
);

// Reports Components - Lazy Loaded
export const ExpensesReport = createLazyComponent(
  () => import("../feature-module/administration/reports/expensereport")
);
export const InvoiceReport = createLazyComponent(
  () => import("../feature-module/administration/reports/invoicereport")
);
export const PaymentReport = createLazyComponent(
  () => import("../feature-module/administration/reports/paymentreport")
);
export const ProjectReport = createLazyComponent(
  () => import("../feature-module/administration/reports/projectreport")
);
export const TaskReport = createLazyComponent(
  () => import("../feature-module/administration/reports/taskreport")
);
export const UserReports = createLazyComponent(
  () => import("../feature-module/administration/reports/userreports")
);
export const EmployeeReports = createLazyComponent(
  () => import("../feature-module/administration/reports/employeereports")
);
export const PayslipReport = createLazyComponent(
  () => import("../feature-module/administration/reports/payslipreport")
);
export const AttendanceReport = createLazyComponent(
  () => import("../feature-module/administration/reports/attendencereport")
);
export const LeaveReport = createLazyComponent(
  () => import("../feature-module/administration/reports/leavereport")
);
export const DailyReport = createLazyComponent(
  () => import("../feature-module/administration/reports/dailyreport")
);

// Content Components - Lazy Loaded
export const Blogs = createLazyComponent(
  () => import("../feature-module/content/blog/blogs")
);
export const BlogCategories = createLazyComponent(
  () => import("../feature-module/content/blog/blogCategories")
);
export const BlogComments = createLazyComponent(
  () => import("../feature-module/content/blog/blogComments")
);
export const BlogTags = createLazyComponent(
  () => import("../feature-module/content/blog/blogTags")
);

// Pages Components - Lazy Loaded
export const Profile = createLazyComponent(
  () => import("../feature-module/pages/profile")
);
export const Gallery = createLazyComponent(
  () => import("../feature-module/pages/gallery")
);
export const SearchResult = createLazyComponent(
  () => import("../feature-module/pages/search-result")
);
export const TimeLines = createLazyComponent(
  () => import("../feature-module/pages/timeline")
);
export const Pricing = createLazyComponent(
  () => import("../feature-module/pages/pricing")
);
export const ApiKeys = createLazyComponent(
  () => import("../feature-module/pages/api-keys")
);
export const PrivacyPolicy = createLazyComponent(
  () => import("../feature-module/pages/privacy-policy")
);
export const TermsCondition = createLazyComponent(
  () => import("../feature-module/pages/terms-condition")
);

// Administration Components - Lazy Loaded
export const Assets = createLazyComponent(
  () => import("../feature-module/administration/asset")
);
export const AssetsCategory = createLazyComponent(
  () => import("../feature-module/administration/asset-category")
);
export const Knowledgebase = createLazyComponent(
  () => import("../feature-module/administration/help-support/knowledgebase")
);
export const Users = createLazyComponent(
  () => import("../feature-module/administration/user-management/users")
);
export const RolesPermission = createLazyComponent(
  () =>
    import("../feature-module/administration/user-management/rolePermission")
);
export const Activity = createLazyComponent(
  () => import("../feature-module/administration/help-support/activity")
);

// Recruitment Components - Lazy Loaded
export const JobGrid = createLazyComponent(
  () => import("../feature-module/recruitment/jobs/jobgrid")
);
export const JobList = createLazyComponent(
  () => import("../feature-module/recruitment/joblist/joblist")
);
export const CandidateGrid = createLazyComponent(
  () => import("../feature-module/recruitment/candidates/candidategrid")
);
export const CandidatesList = createLazyComponent(
  () => import("../feature-module/recruitment/candidates/candidatelist")
);
export const CandidateKanban = createLazyComponent(
  () => import("../feature-module/recruitment/candidates/candidatekanban")
);
export const RefferalList = createLazyComponent(
  () => import("../feature-module/recruitment/refferal/refferallist")
);

// Super Admin Components - Lazy Loaded
export const Companies = createLazyComponent(
  () => import("../feature-module/super-admin/companies")
);
export const Subscription = createLazyComponent(
  () => import("../feature-module/super-admin/subscription")
);
export const Packages = createLazyComponent(
  () => import("../feature-module/super-admin/packages/packagelist")
);
export const PackagesGrid = createLazyComponent(
  () => import("../feature-module/super-admin/packages/packagegrid")
);
export const Domain = createLazyComponent(
  () => import("../feature-module/super-admin/domin")
);
export const PurchaseTransaction = createLazyComponent(
  () => import("../feature-module/super-admin/purchase-transaction")
);

// Tickets Components - Lazy Loaded
export const Tickets = createLazyComponent(
  () => import("../feature-module/tickets/tickets")
);
export const TicketGrid = createLazyComponent(
  () => import("../feature-module/tickets/tickets-grid")
);
export const TicketDetails = createLazyComponent(
  () => import("../feature-module/tickets/ticket-details")
);

// Additional Components - Lazy Loaded
export const Countries = createLazyComponent(
  () => import("../feature-module/content/location/countries"),
  <LoadingSpinner text="Loading countries..." />
);
export const StarterPage = createLazyComponent(
  () => import("../feature-module/pages/starter"),
  <LoadingSpinner text="Loading starter page..." />
);
export const Membershipplan = createLazyComponent(
  () => import("../feature-module/membership/membershipplan"),
  <LoadingSpinner text="Loading membership plan..." />
);
export const MembershipAddon = createLazyComponent(
  () => import("../feature-module/membership/membershipaddon"),
  <LoadingSpinner text="Loading membership addon..." />
);
export const MembershipTransaction = createLazyComponent(
  () => import("../feature-module/membership/membershiptrasaction"),
  <LoadingSpinner text="Loading membership transaction..." />
);
export const DataTable = createLazyComponent(
  () => import("../feature-module/tables/dataTable"),
  <LoadingSpinner text="Loading data table..." />
);
export const BasicTable = createLazyComponent(
  () => import("../feature-module/tables/basicTable"),
  <LoadingSpinner text="Loading basic table..." />
);
export const DeleteRequest = createLazyComponent(
  () => import("../feature-module/userManagement/deleteRequest"),
  <LoadingSpinner text="Loading delete request..." />
);
export const Cities = createLazyComponent(
  () => import("../feature-module/content/location/cities"),
  <LoadingSpinner text="Loading cities..." />
);

// UI Interface Components - Lazy Loaded
export const Accordion = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/accordion"),
  <LoadingSpinner text="Loading accordion..." />
);
export const Avatar = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/avatar"),
  <LoadingSpinner text="Loading avatar..." />
);
export const Badges = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/badges"),
  <LoadingSpinner text="Loading badges..." />
);

export const Breadcrumb = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/breadcrumb"),
  <LoadingSpinner text="Loading breadcrumb..." />
);
export const Buttons = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/buttons"),
  <LoadingSpinner text="Loading buttons..." />
);
export const ButtonsGroup = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/buttonsgroup"),
  <LoadingSpinner text="Loading button group..." />
);
export const Cards = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/cards"),
  <LoadingSpinner text="Loading cards..." />
);
export const Carousel = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/carousel"),
  <LoadingSpinner text="Loading carousel..." />
);


export const Grid = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/grid"),
  <LoadingSpinner text="Loading grid..." />
);
export const Images = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/images"),
  <LoadingSpinner text="Loading images..." />
);
export const Lightboxes = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/lightbox"),
  <LoadingSpinner text="Loading lightbox..." />
);
export const BanIpAddress = createLazyComponent(
  () => import("../feature-module/settings/otherSettings/banIpaddress"),
  <LoadingSpinner text="Loading IP ban settings..." />
);
export const RangeSlides = createLazyComponent(
  () => import("../feature-module/uiInterface/advanced-ui/rangeslider"),
  <LoadingSpinner text="Loading range slider..." />
);


export const Modals = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/modals"),
  <LoadingSpinner text="Loading modals..." />
);
export const NavTabs = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/navtabs"),
  <LoadingSpinner text="Loading navigation tabs..." />
);
export const Popovers = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/popover"),
  <LoadingSpinner text="Loading popovers..." />
);
export const Swiperjs = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/swiperjs"),
  <LoadingSpinner text="Loading swiper..." />
);
export const Toasts = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/toasts"),
  <LoadingSpinner text="Loading toasts..." />
);
export const Sortable = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/ui-sortable"),
  <LoadingSpinner text="Loading sortable..." />
);
export const BootstrapIcons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/bootstrapicons"),
  <LoadingSpinner text="Loading bootstrap icons..." />
);
export const FlagIcons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/flagicon"),
  <LoadingSpinner text="Loading flag icons..." />
);
export const RemixIcons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/remixIcons"),
  <LoadingSpinner text="Loading remix icons..." />
);
export const Leaflet = createLazyComponent(
  () => import("../feature-module/uiInterface/map/leaflet"),
  <LoadingSpinner text="Loading map..." />
);
export const Page = createLazyComponent(
  () => import("../feature-module/content/page"),
  <LoadingSpinner text="Loading page..." />
);
export const Faq = createLazyComponent(
  () => import("../feature-module/content/faq"),
  <LoadingSpinner text="Loading FAQ..." />
);
export const States = createLazyComponent(
  () => import("../feature-module/content/location/states"),
  <LoadingSpinner text="Loading states..." />
);
export const Testimonials = createLazyComponent(
  () => import("../feature-module/content/testimonials"),
  <LoadingSpinner text="Loading testimonials..." />
);
export const ClipBoard = createLazyComponent(
  () => import("../feature-module/uiInterface/advanced-ui/clipboard"),
  <LoadingSpinner text="Loading clipboard..." />
);
export const Counter = createLazyComponent(
  () => import("../feature-module/uiInterface/advanced-ui/counter"),
  <LoadingSpinner text="Loading counter..." />
);
export const DragAndDrop = createLazyComponent(
  () => import("../feature-module/uiInterface/advanced-ui/dragdrop"),
  <LoadingSpinner text="Loading drag and drop..." />
);
export const Rating = createLazyComponent(
  () => import("../feature-module/uiInterface/advanced-ui/rating"),
  <LoadingSpinner text="Loading rating..." />
);
export const TextEditor = createLazyComponent(
  () => import("../feature-module/uiInterface/advanced-ui/texteditor"),
  <LoadingSpinner text="Loading text editor..." />
);
export const Timeline = createLazyComponent(
  () => import("../feature-module/uiInterface/advanced-ui/timeline"),
  <LoadingSpinner text="Loading timeline..." />
);
export const Scrollbar = createLazyComponent(
  () => import("../feature-module/uiInterface/advanced-ui/uiscrollbar"),
  <LoadingSpinner text="Loading scrollbar..." />
);
export const Apexchart = createLazyComponent(
  () => import("../feature-module/uiInterface/charts/apexcharts"),
  <LoadingSpinner text="Loading apex charts..." />
);
export const PrimeReactChart = createLazyComponent(
  () => import("../feature-module/uiInterface/charts/prime-react-chart"),
  <LoadingSpinner text="Loading prime react charts..." />
);
export const ChartJSExample = createLazyComponent(
  () => import("../feature-module/uiInterface/charts/chartjs"),
  <LoadingSpinner text="Loading chart.js..." />
);
export const FontawesomeIcons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/fontawesome"),
  <LoadingSpinner text="Loading fontawesome icons..." />
);
export const MaterialIcons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/materialicon"),
  <LoadingSpinner text="Loading material icons..." />
);
export const PE7Icons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/pe7icons"),
  <LoadingSpinner text="Loading PE7 icons..." />
);
export const ThemifyIcons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/themify"),
  <LoadingSpinner text="Loading themify icons..." />
);
export const TypiconIcons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/typicons"),
  <LoadingSpinner text="Loading typicon icons..." />
);
export const BasicInputs = createLazyComponent(
  () => import("../feature-module/uiInterface/forms/formelements/basic-inputs"),
  <LoadingSpinner text="Loading basic inputs..." />
);
export const WeatherIcons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/weathericons"),
  <LoadingSpinner text="Loading weather icons..." />
);
export const CheckboxRadios = createLazyComponent(
  () =>
    import("../feature-module/uiInterface/forms/formelements/checkbox-radios"),
  <LoadingSpinner text="Loading checkbox and radios..." />
);
export const InputGroup = createLazyComponent(
  () => import("../feature-module/uiInterface/forms/formelements/input-group"),
  <LoadingSpinner text="Loading input group..." />
);
export const GridGutters = createLazyComponent(
  () => import("../feature-module/uiInterface/forms/formelements/grid-gutters"),
  <LoadingSpinner text="Loading grid gutters..." />
);
export const FormSelect = createLazyComponent(
  () => import("../feature-module/uiInterface/forms/formelements/form-select"),
  <LoadingSpinner text="Loading form select..." />
);
export const FormMask = createLazyComponent(
  () => import("../feature-module/uiInterface/forms/formelements/form-mask"),
  <LoadingSpinner text="Loading form mask..." />
);
export const FileUpload = createLazyComponent(
  () => import("../feature-module/uiInterface/forms/formelements/fileupload"),
  <LoadingSpinner text="Loading file upload..." />
);
export const FormHorizontal = createLazyComponent(
  () =>
    import(
      "../feature-module/uiInterface/forms/formelements/layouts/form-horizontal"
    ),
  <LoadingSpinner text="Loading horizontal form..." />
);
export const FormVertical = createLazyComponent(
  () =>
    import(
      "../feature-module/uiInterface/forms/formelements/layouts/form-vertical"
    ),
  <LoadingSpinner text="Loading vertical form..." />
);
export const FloatingLabel = createLazyComponent(
  () =>
    import(
      "../feature-module/uiInterface/forms/formelements/layouts/floating-label"
    ),
  <LoadingSpinner text="Loading floating label..." />
);
export const FormValidation = createLazyComponent(
  () =>
    import(
      "../feature-module/uiInterface/forms/formelements/layouts/form-validation"
    ),
  <LoadingSpinner text="Loading form validation..." />
);
export const FormSelect2 = createLazyComponent(
  () =>
    import(
      "../feature-module/uiInterface/forms/formelements/layouts/form-select2"
    ),
  <LoadingSpinner text="Loading form select2..." />
);
export const FormWizard = createLazyComponent(
  () => import("../feature-module/uiInterface/forms/formelements/form-wizard"),
  <LoadingSpinner text="Loading form wizard..." />
);
export const FormPikers = createLazyComponent(
  () => import("../feature-module/uiInterface/forms/formelements/formpickers"),
  <LoadingSpinner text="Loading form pickers..." />
);
export const DataTables = createLazyComponent(
  () => import("../feature-module/uiInterface/table/data-tables"),
  <LoadingSpinner text="Loading data tables..." />
);
export const TablesBasic = createLazyComponent(
  () => import("../feature-module/uiInterface/table/tables-basic"),
  <LoadingSpinner text="Loading basic tables..." />
);
export const IonicIcons = createLazyComponent(
  () => import("../feature-module/uiInterface/icons/ionicicons"),
  <LoadingSpinner text="Loading ionic icons..." />
);
export const Placeholder = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/placeholder"),
  <LoadingSpinner text="Loading placeholder..." />
);
export const AlertUi = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/alert-ui"),
  <LoadingSpinner text="Loading alerts..." />
);
export const Tooltips = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/tooltips"),
  <LoadingSpinner text="Loading tooltips..." />
);
export const Ribbon = createLazyComponent(
  () => import("../feature-module/uiInterface/advanced-ui/ribbon"),
  <LoadingSpinner text="Loading ribbon..." />
);

// Accounting Components - Lazy Loaded
export const Categories = createLazyComponent(
  () => import("../feature-module/accounting/categories"),
  <LoadingSpinner text="Loading categories..." />
);
export const Budgets = createLazyComponent(
  () => import("../feature-module/accounting/budgets"),
  <LoadingSpinner text="Loading budgets..." />
);
export const BudgetExpenses = createLazyComponent(
  () => import("../feature-module/accounting/budget-expenses"),
  <LoadingSpinner text="Loading budget expenses..." />
);
export const BudgetRevenues = createLazyComponent(
  () => import("../feature-module/accounting/budget-revenues"),
  <LoadingSpinner text="Loading budget revenues..." />
);

export const Agents = createLazyComponent(
  () => import("../feature-module/super-admin/agents/agents"),
  <LoadingSpinner text="Loading Agents..." />
);
export const SlaPolicies = createLazyComponent(
  () => import("../feature-module/super-admin/sla-policies/slaPolicies"),
  <LoadingSpinner text="Loading SLA Policies..." />
);
export const TicketReports = createLazyComponent(
  () => import("../feature-module/super-admin/ticket-reports/ticketReports"),
  <LoadingSpinner text="Loading Ticket Reports..." />
);
export const ProbationManagement = createLazyComponent(
  () => import("../feature-module/hrm/probation-management/probationManagement"),
  <LoadingSpinner text="Loading Probation Management..." />
);
export const NoticePeriodTracker = createLazyComponent(
  () => import("../feature-module/hrm/notice-period-tracker/noticePeriodTracker"),
  <LoadingSpinner text="Loading Notice Period Tracker..." />
);
export const HrDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/hr-dashboard/hrDashboard"),
  <LoadingSpinner text="Loading Hr Dashboard..." />
);
export const PayrollDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/payroll-dashboard/payrollDashboard"),
  <LoadingSpinner text="Loading Payroll Dashboard..." />
);
export const RecruitmentDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/recruitment-dashboard/recruitmentDashboard"),
  <LoadingSpinner text="Loading Recruitment Dashboard..." />
);
export const AttendanceDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/attendance-dashboard/attendanceDashboard"),
  <LoadingSpinner text="Loading Attendance Dashboard..." />
);
export const FinanceDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/finance-dashboard/financeDashboard"),
  <LoadingSpinner text="Loading Finance Dashboard..." />
);
export const ItAdminDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/it-admin-dashboard/itAdminDashboard"),
  <LoadingSpinner text="Loading It Admin Dashboard..." />
);
export const AssetDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/asset-dashboard/assetDashboard"),
  <LoadingSpinner text="Loading Asset Dashboard..." />
);
export const HelpDeskDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/help-desk-dashboard/helpDeskDashboard"),
  <LoadingSpinner text="Loading Help Desk Dashboard..." />
);
export const TenantUsageMetrics = createLazyComponent(
  () => import("../feature-module/super-admin/tenant-usage-metrics/tenantUsageMetrics"),
  <LoadingSpinner text="Loading Tenant Usage Metrics..." />
);
export const TenantSupportTickets = createLazyComponent(
  () => import("../feature-module/super-admin/tenant-support-tickets/tenantSupportTickets"),
  <LoadingSpinner text="Loading Tenant Support Tickets..." />
);
export const TenentTicketDetails = createLazyComponent(
  () => import("../feature-module/super-admin/tenant-support-tickets/tenentTicketDetails"),
  <LoadingSpinner text="Loading Tenent Ticket Details..." />
);
export const ShiftSwapRequests = createLazyComponent(
  () => import("../feature-module/hrm/shift-swap-requests/shiftSwapRequests"),
  <LoadingSpinner text="Loading Shift Swap Requests..." />
);
export const WorkFromHome = createLazyComponent(
  () => import("../feature-module/hrm/work-from-home/workFromHome"),
  <LoadingSpinner text="Loading Work From Home..." />
);
export const HolidayCalendars = createLazyComponent(
  () => import("../feature-module/hrm/holiday-calendar/holidayCalendar"),
  <LoadingSpinner text="Loading Holiday Calendars..." />
);
export const CertificationTracking = createLazyComponent(
  () => import("../feature-module/training/certification-tracking/certificationTracking"),
  <LoadingSpinner text="Loading Certification Tracking..." />
);
export const ResumeParsing = createLazyComponent(
  () => import("../feature-module/recruitment/resume-parsing/resumeParsing"),
  <LoadingSpinner text="Loading Resume Parsing..." />
);
export const CampusHiring = createLazyComponent(
  () => import("../feature-module/campus-hiring/campusHiring"),
  <LoadingSpinner text="Loading Campus Hiring..." />
);
export const Language = createLazyComponent(
  () => import("../feature-module/settings/websiteSettings/language"),
  <LoadingSpinner text="Loading Language..." />
);
export const EscalationRules = createLazyComponent(
  () => import("../feature-module/escalation-rules/escalationRules"),
  <LoadingSpinner text="Loading Escalation Rules..." />
);
export const TicketAutomation = createLazyComponent(
  () => import("../feature-module/ticket-automation/ticketAutomation"),
  <LoadingSpinner text="Loading Ticket Automation..." />
);
export const LearningAnalytics = createLazyComponent(
  () => import("../feature-module/hrm/learning-analytics/learningAnalytics"),
  <LoadingSpinner text="Loading Learning Analytics..." />
);
export const Invoice = createLazyComponent(
  () => import("../feature-module/invoice/invoice"),
  <LoadingSpinner text="Loading Invoice..." />
);
export const ComingSoon = createLazyComponent(
  () => import("../feature-module/pages/comingSoon"),
  <LoadingSpinner text="Loading ComingSoon..." />
);
export const Offcanvas = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/offcanvas"),
  <LoadingSpinner text="Loading ComingSoon..." />
);
export const Pagination = createLazyComponent(
  () => import("../feature-module/uiInterface/base-ui/pagination"),
  <LoadingSpinner text="Loading ComingSoon..." />
);
