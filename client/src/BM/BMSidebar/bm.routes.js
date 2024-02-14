const allusers = [
  "Admin",
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",
  "Operator",
];

export const bmRoutes = [
  // --------- Dashboard Routes ---------
  {
    title: "Plant Dashboard",
    path: "/bm", //all users
    element: (
      <div className="container-fluid">
        {/* <BMTabDashboard /> */}
        <BMTitlebar title="Plant Dashboard" />
      </div>
    ),
    allowedRoles: allusers,
  },
  {
    title: "Summary",
    path: "/bm/summeryDashboard", //all users --- to be discussed
    element: (
      <div className="container-fluid">
        <BMTitlebar title="Summary Dashboard" />
      </div>
    ),
    allowedRoles: allusers,
  },
  {
    title: "Summary",
    path: "/bm/summeryDashboard", // Admin only --- to be discussed
    element: <SummeryDashboard />,
    allowedRoles: ["Admin"],
  },
  {
    title: "Admin Creation",
    path: "/bm/admin-creation-dashboard", // admin only
    element: <AdminCreationDashboard />,
    allowedRoles: ["Admin"],
  },
  {
    title: "Admin Dashboard",
    path: "/bm/adminDashboard", // admin only
    element: <AdminDashboard />,
    allowedRoles: ["Admin"],
  },
  {
    title: "Operator Dashboard",
    path: "/bm/operator-dashboard", // Plant-Admin, Section-Admin
    element: <OperatorDashboard />,
    allowedRoles: ["Plant-Admin", "Section-Admin"],
  },

  // --------- Request Sheet Routes ---------
  {
    path: "/bm/requestSheetMonitoring", // PRD/MTD: TL/Hoss and operator
    element: <RequestSheetMonitoring />,
    allowedRoles: ["TL/Hoss", "Operator"],
  },
  {
    title: "Request Sheets",
    path: "/bm", // PRD/MTD: TL/Hoss and operator
    element: <RequestSheetMainDashboard />,
    allowedRoles: ["TL/Hoss", "Operator"],
  },
  {
    path: "/bm/generateRequestSheetMainDashboard", // PRD/MTD: TL/Hoss and operator
    element: <GenerateRequestSheetMainDashboard />,
    allowedRoles: ["TL/Hoss", "Operator"],
  },
  {
    path: "/bm/request-sheet/:generateType/:machine_code", // PRD/MTD: TL/Hoss and operator
    element: <RequestSheet />,
    allowedRoles: ["TL/Hoss", "Operator"],
  },
  {
    path: "/bm/update/request-sheet/:machine_code/:requestSheetNoOfBM", // PRD/MTD: TL/Hoss and operator
    element: <RequestSheetUpdate />,
    allowedRoles: ["TL/Hoss", "Operator"],
  },

  // --------- Approval Routes ---------
  {
    title: "Approval Dashboard",
    path: "/bm/approval", // All except operators and Admins
    element: <ApprovalDashboardOfRequestSheet />,
    allowedRoles: ["Plant-Admin", "Section-Admin", "TL/HOSS"],
  },
  {
    title: "Approval Logs",
    path: "/bm/approvalLogs", // All except operators and Admins
    element: <ApprovalLogs />,
    allowedRoles: ["Plant-Admin", "Section-Admin", "TL/HOSS"],
  },

  // --------- Reports Routes ---------
  // all users, except admin
  {
    title: "Production Line Wise",
    path: "/bm/report/productionLineWiseReport",
    element: <ProductionLineWiseReport />,
  },
  {
    title: "Man Hour Report",
    path: "/bm/report/man-hour",
    element: <ManHourDashboard />,
  },
  {
    title: "Daily BD Report",
    path: "/bm/report/daily-breakdown-trend",
    element: <DailyBTDashboard />,
  },
  {
    title: "Monthly BD Report",
    path: "/bm/report/monthly-breakdown-trend",
    element: <MonthlyBDTDashboard />,
  },
  {
    title: "Line Contibution BD Report",
    path: "/bm/report/line-contribution-breakdown-trend",
    element: <LineContributionBD />,
  },
  {
    title: "MTTR Report Old",
    path: "/bm/report/mttr-report-old",
    element: <MTTRReportDashboard />,
  },
  {
    title: "MTBF Report Old",
    path: "/bm/report/mtbf-report-old",
    element: <MTBFReportDashboard />,
  },
  {
    title: "MTTR Report",
    path: "/bm/report/mttr",
    element: <MTTRReportDashboard />,
  },
  {
    title: "MTBF Report",
    path: "/bm/report/mtbf",
    element: <MTBFReportDashboard />,
  },
  {
    title: "TM MTTR Skill",
    path: "/bm/report/tm-mttr-skill",
    element: <TMMTR />,
  },

  // --------- Other Routes ---------
  {
    title: "User Assign",
    path: "/bm/userAssign", // Admin and HOD only
    element: <h1>Users</h1>,
    allowedRoles: ["Admin", "Plant-Admin", "Section-Admin", "TL/HOSS"],
  },
  {
    title: "Customization",
    path: "/bm/customizedDashboard", // Admin and HOD only
    element: <MainCustomized />,
    allowedRoles: ["Admin", "Plant-Admin", "Section-Admin", "TL/HOSS"],
  },
  {
    title: "Profile",
    path: "/bm/profile", // All users
    element: <Profile />,
  },
];
