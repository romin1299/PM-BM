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
    allowedDepartments: ["MTD", "PRD"],
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
    title: "Customized Dashboard",
    icon: <ControlPointIcon className="text-white" />,
    route: "/bm/customizedDashboard",
    allowedRoles: ["TL/HOSS", "Plant-Admin", "operator"],
  },
  {
    title: "Reports",
    icon: <AccessTimeFilledIcon className="text-white" />,
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
    allowedRoles: ["Admin", "Plant-Admin", "operator", "TL/HOSS"],
  },
];
