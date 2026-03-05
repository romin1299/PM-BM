import {
  AccountCircleIcon,
  EventNoteIcon,
  FactCheckIcon,
} from "../../components/NavbarComponent/ImportModules";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalMallIcon from "@mui/icons-material/LocalMall";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import DescriptionIcon from "@mui/icons-material/Description";
import AddCardIcon from "@mui/icons-material/AddCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ControlPointIcon from "@mui/icons-material/ControlPoint";

const allusers = [
  "Admin",
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",
  "Operator",
];

const reportAccess = ["Plant-Admin", "Section-Admin", "TL/HOSS", "Operator"];

export const menuItems = [
  {
    title: "Spare Part KPI Dashboard",
    icon: (
      <FactCheckIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare",
    allowedRoles: allusers,
  },
  {
    title: "Spare Part Search Button",
    icon: (
      <AccountCircleIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
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
    title: "Ordering Dashboard",
    icon: (
      <ShoppingCartIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareOrderingDashboard",
    allowedRoles: allusers,
  },
  {
    title: "Receiving Dashboard",
    icon: (
      <LocalMallIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareReceivingDashboard",
    allowedRoles: allusers,
  },
  {
    title: "Spare Registration",
    icon: (
      <AppRegistrationIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareRegistration",
    allowedRoles: allusers,
  },
  {
    title: "Spare Part Issuance",
    icon: (
      <AddCardIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/sparePartIssuance",
    allowedRoles: allusers,
  },
  {
    title: "Spare Budget Dashboard",
    icon: (
      <AccountBalanceWalletIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareBudgetDashboard",
    allowedRoles: allusers,
  },
  {
    title: "Spare Reports",
    icon: (
      <AssessmentIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareReports",
    allowedRoles: allusers,
  },
  {
    title: "Customized Dashboard",
    icon: (
      <ControlPointIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/customizedDashboard",
    allowedRoles: ["Plant-Admin", "Section-Admin"],
  },
];
