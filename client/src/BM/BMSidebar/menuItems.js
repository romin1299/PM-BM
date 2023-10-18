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
        title: "Plant Dashboard",
        route: "/bm/summeryDashboard",
        allowedRoles: ["TL/HOSS"],
      },
    ],
    allowedDepartments: ["MTD"],
  },
  // {
  //   title: "Check Sheet",
  //   icon: <SummarizeIcon className="text-white" />,
  //   route: "/bm/check-sheet",
  //   allowedRoles: ["TL/HOSS", "Plant-Admin"],
  // },
  {
    title: "Creation",
    icon: <FaThList className="text-white" />,
    subItems: [
      {
        title: "Creation Dashboard",
        route: "/bm/creationDashboard",
        allowedRoles: ["HOD", "TL/HOSS"],
      },
      {
        title: "User Assign",
        route: "/bm/userAssign",
        allowedRoles: ["HOD", "TL/HOSS"],
      },
      {
        title: "CheckSheet Dashboard",
        route: "/bm/checkSheetDashboard",
        allowedRoles: ["HOD", "TL/HOSS"],
      },
    ],
    allowedDepartments: ["MTD"],
  },
  {
    title: "Approval",
    icon: <AddTaskIcon className="text-white" />,
    subItems: [
      {
        title: "Preparation Approval",
        route: "/bm/preparationApproval",
        allowedRoles: ["TL/HOSS"],
      },
      {
        title: "Implementation Approval",
        route: "/bm/implementationApproval",
        allowedRoles: ["TL/HOSS"],
      },
    ],
    allowedDepartments: ["MTD"],
  },
  {
    title: "Approval Log",
    icon: <StorageIcon className="text-white" />,
    subItems: [
      {
        title: "Preparation / Planning",
        route: "/bm/SheetApproval",
        allowedRoles: ["TL/HOSS"],
      },
      {
        title: "BM Plan vs Actual Approval",
        route: "/bm/SheetApprovalOfImplementationPhase",
        allowedRoles: ["TL/HOSS"],
      },
    ],
    allowedDepartments: ["MTD"],
  },
  {
    title: "BM Log",
    icon: <LibraryBooksIcon className="text-white" />,
    subItems: [
      {
        title: "BM Log",
        route: "/bm/logHistory",
        allowedRoles: ["TL/HOSS"],
      },
      {
        title: "Pending BM Log History",
        route: "/bm/pendingBMLogHistory",
        allowedRoles: ["TL/HOSS"],
      },
    ],
  },
  {
    title: "BM Report",
    icon: <AssessmentIcon className="text-white" />,
    subItems: [
      {
        title: "Monthly Report (Machine)",
        route: "/bm/machineWiseBmMonthlyReport",
        allowedRoles: ["TL/HOSS"],
      },
      {
        title: "Monthly Report (Line)",
        route: "/bm/lineWiseBmMonthlyReport",
        allowedRoles: ["TL/HOSS"],
      },
      {
        title: "Annual BM Schedule",
        route: "/bm/annualBMSchedule",
        allowedRoles: ["TL/HOSS"],
      },
      {
        title: "Annual BM BM vs Actual",
        route: "/bm/annualBmStatus",
        allowedRoles: ["TL/HOSS"],
      },
      {
        title: "BM Time Monitoring",
        route: "/bmTimeMonitoringReport",
        allowedRoles: ["TL/HOSS"],
      },
    ],
  },
  {
    title: "Back-end Data",
    icon: <CloudDownloadIcon className="text-white" />,
    route: "/bm/backupDataOfCheckSheet",
    allowedRoles: ["TL/HOSS"],
  },
  {
    title: "Open Abnormality Tracking",
    icon: <PendingActionsIcon className="text-white" />,
    route: "/bm/openAbnormalityTrack",
    allowedRoles: ["TL/HOSS"],
  },
  {
    title: "Spare Entry",
    icon: <AddToPhotosIcon className="text-white" />,
    route: "/bm/operatorDataEntry",
    allowedRoles: ["TL/HOSS"],
  },
  {
    title: "Spare Log",
    icon: <BackupTableIcon className="text-white" />,
    route: "/bm/sparePartUsageHistory",
    allowedRoles: ["TL/HOSS"],
  },
  {
    title: "Spare Report",
    icon: <SummarizeIcon className="text-white" />,
    route: "/bm/spareReportDashboard",
    allowedRoles: ["TL/HOSS"],
  },
  {
    title: "Request-sheet dashboard",
    icon: <SummarizeIcon className="text-white" />,
    route: "/bm/requestListDashboard",
    allowedRoles: ["TL/HOSS"],
  },
];
