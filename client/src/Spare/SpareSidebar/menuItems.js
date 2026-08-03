import AnalyticsIcon from "@mui/icons-material/Analytics";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DescriptionIcon from "@mui/icons-material/Description";
import AddCardIcon from "@mui/icons-material/AddCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
// import AssessmentIcon from "@mui/icons-material/Assessment";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import PageviewIcon from "@mui/icons-material/Pageview";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const allusers = [
  //From PM
  "Admin",
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",
  //From spare toolRoom
  "HOSS",
  "Supervisor",
  "Office Person",
];

export const menuItems = [
  {
    title: "KPI Dashboard",
    icon: (
      <AnalyticsIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare",
    allowedRoles: allusers,
  },
  {
    title: "Spare Requests",
    icon: (
      <DashboardIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/requests",
    allowedRoles: allusers,
  },
  {
    title: "User Management",
    icon: (
      <PersonAddIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareUserManagement",
    allowedRoles: ["Plant-Admin", "Section-Admin", "HOSS", "Supervisor"],
    hasToolRoomFilter: true,
  },
  {
    title: "Search Button",
    icon: (
      <PageviewIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareSearchButton",
    allowedRoles: allusers,
  },
  {
    title: "New Part Request",
    icon: (
      <DescriptionIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareNewPartRequest",
    allowedRoles: allusers,
  },
  {
    title: "Approval Dashboard",
    icon: (
      <FactCheckIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareApprovalDashboard",
    allowedRoles: allusers,
  },
  {
    title: "Approval Logs",
    icon: (
      <AssignmentTurnedInIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareApprovalLogs",
    allowedRoles: allusers,
  },
  {
    title: "Ordering Dashboard",
    icon: (
      <ShoppingCartIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareOrderingDashboard",
    allowedRoles: allusers,
  },
  {
    title: "Issuance",
    icon: (
      <AddCardIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/sparePartIssuance",
    allowedRoles: allusers,
  },
  {
    title: "Budget Dashboard",
    icon: (
      <AccountBalanceWalletIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareBudgetDashboard",
    allowedRoles: allusers,
  },
  // {
  //   title: "Spare Reports",
  //   icon: (
  //     <AssessmentIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
  //   ),
  //   route: "/spare/spareReports",
  //   allowedRoles: allusers,
  // },
  {
    title: "Customized Dashboard",
    icon: (
      <ControlPointIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/customizedDashboard",
    allowedRoles: ["Plant-Admin", "Section-Admin"],
  },
  {
    title: "Customized Fields",
    icon: (
      <ControlPointIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/customizedDashboard/dynamicFieldsConfiguration",
    allowedRoles: [
      "Plant-Admin",
      "Section-Admin",
      //From spare toolRoom
      "HOSS",
      "Supervisor",
      "Office Person",
    ],
  },
];
