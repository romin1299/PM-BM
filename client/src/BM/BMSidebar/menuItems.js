import {
  React,
  NavLink,
  denso_logo,
  DashboardIcon,
  NoteAddIcon,
  AddTaskIcon,
  FactCheckIcon,
} from "../../components/NavbarComponent/ImportModules";
import { FaThList } from "react-icons/fa";

import SummarizeIcon from "@mui/icons-material/Summarize";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import AssessmentIcon from "@mui/icons-material/Assessment";
import StorageIcon from "@mui/icons-material/Storage";
import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import AnalyticsIcon from '@mui/icons-material/Analytics';

export const menuItems = [
  {
    title: "Dashboard",
    icon: <DashboardIcon className="text-white" />,
    subItems: [
      {
        title: "Section Dashboard",
        route: "/bm",
        allowedRoles: ["TL/HOSS", "Plant-Admin"],
      },
      {
        title: "Admin",
        route: "/bm/requestListDashboard",
        allowedRoles: ["Admin"],
      },
      {
        title: "Request Sheets",
        route: "/bm/requestListDashboard",
        allowedRoles: ["Admin", "TL/HOSS", "Plant-Admin", "Operator"],
      },
      {
        title: "Summary",
        route: "/bm/summeryDashboard",
        allowedRoles: ["Admin", "TL/HOSS", "Plant-Admin", "Operator"],
      },
    ],
    allowedDepartments: ["MTD", "PRD"],
  },
  {
    title: "Approval",
    icon: <AddTaskIcon className="text-white" />,
    route: "/bm/requestListDashboard",
    allowedRoles: ["TL/HOSS", "Plant-Admin", "Operator"],
  },
  {
    title: "Customized Dashboard",
    icon: <ControlPointIcon className="text-white" />,
    route: "/bm/customizedDashboard",
    allowedRoles: ["TL/HOSS", "Plant-Admin", "Operator"],
  },
  {
    title: "Approval Dashboard",
    icon: <FactCheckIcon className="text-white" />,
    route: "/bm/approval",
    allowedRoles: ["TL/HOSS", "Plant-Admin","Section-Admin"],
  },
  {
    title: "Approval Logs",
    icon: <AssignmentTurnedInIcon className="text-white" />,
    route: "/bm/approvalLogs",
    allowedRoles: ["TL/HOSS", "Plant-Admin","Section-Admin", "Operator"],
  },
  {
    title: "Reports",
    icon: <AnalyticsIcon className="text-white" />,
    allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
    subItems: [
      {
        title: "Production Line Wise",
        route: "/bm/report/productionLineWiseReport",
        allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
      },
      {
        title: "Man Hour Report",
        route: "/bm/report/man-hour",
        allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
      },
      {
        title: "Daily BD Report",
        route: "/bm/report/daily-breakdown-trend",
        allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
      },
      {
        title: "Monthly BD Report",
        route: "/bm/report/monthly-breakdown-trend",
        allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
      },
      {
        title: "Line Contibution BD Report",
        route: "/bm/report/line-contribution-breakdown-trend",
        allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
      },
      {
        title: "MTTR Report",
        route: "/bm/report/mttr",
        allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
      },
      {
        title: "MTBF Report",
        route: "/bm/report/mtbf",
        allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
      },
      {
        title: "TM MTTR Skill",
        route: "/bm/report/tm-mtr",
        allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
      },
    ],
  },
  {
    title: "Profile",
    icon: <AccountCircleIcon className="text-white" />,
    route: "/bm/profile",
    allowedRoles: ["Admin", "Plant-Admin", "Operator", "TL/HOSS"],
  },
  // {
  //   title: "Creation",
  //   icon: <FaThList className="text-white" />,
  //   subItems: [
  //     {
  //       title: "Creation Dashboard",
  //       route: "/bm/creationDashboard",
  //       allowedRoles: ["Admin", "Plant-Admin", "Operator", "TL/HOSS"],
  //     },
  //     {
  //       title: "User Assign",
  //       route: "/bm/userAssign",
  //       allowedRoles: ["Admin", "Plant-Admin", "Operator", "TL/HOSS"],
  //     },
  //     {
  //       title: "CheckSheet Dashboard",
  //       route: "/bm/checkSheetDashboard",
  //       allowedRoles: ["Admin", "Plant-Admin", "Operator", "TL/HOSS"],
  //     },
  //   ],
  //   allowedDepartments: ["MTD"],
  // },
  // {
  //   title: "Approval",
  //   icon: <AddTaskIcon className="text-white" />,
  //   subItems: [
  //     {
  //       title: "Preparation Approval",
  //       route: "/bm/preparationApproval",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //     {
  //       title: "Implementation Approval",
  //       route: "/bm/implementationApproval",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //   ],
  //   allowedDepartments: ["MTD"],
  // },
  // {
  //   title: "Approval Log",
  //   icon: <StorageIcon className="text-white" />,
  //   subItems: [
  //     {
  //       title: "Preparation / Planning",
  //       route: "/bm/SheetApproval",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //     {
  //       title: "BM Plan vs Actual Approval",
  //       route: "/bm/SheetApprovalOfImplementationPhase",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //   ],
  //   allowedDepartments: ["MTD"],
  // },
  // {
  //   title: "BM Log",
  //   icon: <LibraryBooksIcon className="text-white" />,
  //   subItems: [
  //     {
  //       title: "BM Log",
  //       route: "/bm/logHistory",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //     {
  //       title: "Pending BM Log History",
  //       route: "/bm/pendingBMLogHistory",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //   ],
  // },
  // {
  //   title: "BM Report",
  //   icon: <AssessmentIcon className="text-white" />,
  //   subItems: [
  //     {
  //       title: "Monthly Report (Machine)",
  //       route: "/bm/machineWiseBmMonthlyReport",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //     {
  //       title: "Monthly Report (Line)",
  //       route: "/bm/lineWiseBmMonthlyReport",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //     {
  //       title: "Annual BM Schedule",
  //       route: "/bm/annualBMSchedule",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //     {
  //       title: "Annual BM BM vs Actual",
  //       route: "/bm/annualBmStatus",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //     {
  //       title: "BM Time Monitoring",
  //       route: "/bmTimeMonitoringReport",
  //       allowedRoles: ["TL/HOSS"],
  //     },
  //   ],
  // },
  // {
  //   title: "Back-end Data",
  //   icon: <CloudDownloadIcon className="text-white" />,
  //   route: "/bm/backupDataOfCheckSheet",
  //   allowedRoles: ["TL/HOSS"],
  // },
  // {
  //   title: "Open Abnormality Tracking",
  //   icon: <PendingActionsIcon className="text-white" />,
  //   route: "/bm/openAbnormalityTrack",
  //   allowedRoles: ["TL/HOSS"],
  // },
  // {
  //   title: "Spare Entry",
  //   icon: <AddToPhotosIcon className="text-white" />,
  //   route: "/bm/OperatorDataEntry",
  //   allowedRoles: ["TL/HOSS"],
  // },
  // {
  //   title: "Spare Log",
  //   icon: <BackupTableIcon className="text-white" />,
  //   route: "/bm/sparePartUsageHistory",
  //   allowedRoles: ["TL/HOSS"],
  // },
  // {
  //   title: "Spare Report",
  //   icon: <SummarizeIcon className="text-white" />,
  //   route: "/bm/spareReportDashboard",
  //   allowedRoles: ["TL/HOSS"],
  // },
  // {
  //   title: "Request-sheet dashboard",
  //   icon: <SummarizeIcon className="text-white" />,
  //   route: "/bm/requestListDashboard",
  //   allowedRoles: ["TL/HOSS"],
  // },
];
