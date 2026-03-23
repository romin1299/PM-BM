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
import AnalyticsIcon from "@mui/icons-material/Analytics";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import { FaWpforms } from "react-icons/fa6";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import {
  NAME_OF_THE_COMPANY,
  LIST_OF_COMPANY,
  BASE_URL,
} from "../../ConditionsForDNINandDNHA/ConditionBasedDisplay";

const allusers = [
  "Admin",
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",
  "Operator",
];
// console.log(process.env.REACT_APP_BASE_URL_FOR)
const reportAccess = ["Plant-Admin", "Section-Admin", "TL/HOSS", "Operator"];

// let menuItemsForDensoIndia = [];

// if (NAME_OF_THE_COMPANY !== LIST_OF_COMPANY?.[0]) {
//   menuItemsForDensoIndia = [
//     {
//       title: "Reports",
//       icon: <AnalyticsIcon className="text-white" />,
//       allowedRoles: reportAccess,
//       subItems: [
//         {
//           title: "Production Line Wise",
//           route: "/bm/report/productionLineWiseReport",
//         },
//         {
//           title: "Man Hour",
//           route: "/bm/report/man-hour",
//         },
//         {
//           title: "Daily BD",
//           route: "/bm/report/daily-breakdown-trend",
//         },
//         {
//           title: "Monthly BD",
//           route: "/bm/report/monthly-breakdown-trend",
//         },
//         {
//           title: "Line Contibution BD",
//           route: "/bm/report/line-contribution-breakdown-trend",
//         },
//         {
//           title: "MTTR",
//           route: "/bm/report/mttr",
//         },
//         {
//           title: "MTBF",
//           route: "/bm/report/mtbf",
//         },
//         {
//           title: "TM MTTR Skill",
//           route: "/bm/report/tm-mtr",
//         },
//         {
//           title: "Top Machine Breakdown",
//           route: "/bm/report/top-machine-breakdown",
//         },
//         {
//           title: "Machine Age",
//           route: "/bm/report/machine-age",
//         },
//       ],
//     },
//   ];
// }

export const menuItems = [
    {
    title: "Plant Breakdown Status",
    icon: <FactCheckIcon className="text-white" />,
    route: "/bm/allRequestSheetOfBM",
    allowedRoles: ["Plant-Admin", "Section-Admin", "TL/HOSS"],
  },
  {
    title: "Dashboard",
    icon: <DashboardIcon className="text-white" />,
    subItems: [
      // {
      //   title: "Plant Dashboard",
      //   route: "/bm",
      //   allowedRoles: allusers,
      // },
      // {
      //   title: "Summary",
      //   route: "/bm/summeryDashboard",
      //   allowedRoles: allusers,
      // },
      {
        title: "Request Sheet Progress Monitoring",
        route: "/bm",
        allowedRoles: reportAccess,
      },
      {
        title: "Request Sheet Status Monitoring",
        route: "/bm/requestSheetMonitoring",
        allowedRoles: reportAccess,
      },

      // Only Admin
      // {
      //   title: "Admin Dashboard",
      //   route: "/bm/adminDashboard", // admin only
      //   allowedRoles: ["Admin"],
      // },
      // {
      //   title: "Admin Creation",
      //   route: "/bm/admin-creation-dashboard", // admin only
      //   allowedRoles: ["Admin"],
      // },

      // {
      //   title: "Operator Dashboard",
      //   route: "/bm/operator-dashboard", // Plant-Admin, Section-Admin
      //   allowedRoles: ["Plant-Admin", "Section-Admin"],
      // },
    ],
    // allowedDepartments: ["MTD", "PRD"],
  },
  // {
  //   title: "Request Sheets",
  //   icon: <AddTaskIcon className="text-white" />,
  //   route: "/bm",
  //   allowedRoles: reportAccess,
  // },

  {
    title: "Approval Dashboard",
    icon: <FactCheckIcon className="text-white" />,
    route: "/bm/approval",
    allowedRoles: ["Plant-Admin", "Section-Admin", "TL/HOSS"],
  },
  {
    title: "Approval Logs",
    icon: <AssignmentTurnedInIcon className="text-white" />,
    route: "/bm/approvalLogs",
    allowedRoles: reportAccess,
  },
  {
    title: "Customized Dashboard",
    icon: <ControlPointIcon className="text-white" />,
    route: "/bm/customizedDashboard",
    allowedRoles: ["Plant-Admin", "Section-Admin"],
  },

  // {
  //   title: "Target Dashboard",
  //   icon: <CrisisAlertIcon className="text-white" />,
  //   route: "/bm/targetDashboard",
  //   allowedRoles: ["Plant-Admin", "Section-Admin", "TL/HOSS"],
  //   allowedDepartments: ["MTD"],
  // },

  //For DENSO-INDIA
  // ...menuItemsForDensoIndia,

  {
    title: "Other Loss",
    icon: <FaWpforms fontSize={22} className="text-white" />,
    route: "/bm/noLossDataOfBD",
    allowedRoles: allusers,
    allowedDepartments: ["MTD"],
  },
  {
    title: "Master Log",
    icon: <LibraryBooksIcon className="text-white" />,
    route: "/master-log",
    allowedRoles: allusers,
  },
  {
    icon: <MenuBookIcon className="text-white" />,
    title: "User Manual",
    route: `${process.env.REACT_APP_BASE_URL}/Denso BM User Manual_OSL14May2024.pdf`,
    allowedRoles: allusers,
  },
  {
    icon: <AccountCircleIcon className="text-white" />,
    title: "Profile",
    route: "/profile",
    allowedRoles: allusers,
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
  //   route: "/bm",
  //   allowedRoles: ["TL/HOSS"],
  // },
];
