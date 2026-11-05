import PieChartIcon from "@mui/icons-material/PieChart";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DescriptionIcon from "@mui/icons-material/Description";
import AddCardIcon from "@mui/icons-material/AddCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import PageviewIcon from "@mui/icons-material/Pageview";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DynamicFeedIcon from "@mui/icons-material/DynamicFeed";
import ModeStandbyIcon from "@mui/icons-material/ModeStandby";
import StorageIcon from "@mui/icons-material/Storage";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import {
  SPARE_APPROVER_ROLES,
  SPARE_CONFIGURATION_ROLES,
  SPARE_ROLES_WITH_OPERATOR,
  SPARE_USER_MANAGEMENT_ROLES,
} from "../Utils/spareRoles";

export const menuItems = [
  {
    title: "KPI Dashboard",
    icon: (
      <PieChartIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    subItems: [
      {
        title: "KPI Dashboard",
        route: "/spare",
        allowedRoles: SPARE_ROLES_WITH_OPERATOR,
      },
      {
        title: "Inventory Dashboard",
        route: "/spare/inventoryReport",
        allowedRoles: SPARE_ROLES_WITH_OPERATOR,
      },
      {
        title: "Stock Level Wise Analysis",
        route: "/spare/stockLevelWiseAnalysisReport",
        allowedRoles: SPARE_ROLES_WITH_OPERATOR,
      },
      {
        title: "MTD R & M Plan Vs Actual",
        route: "/spare/mtdRAndMPlanVsActualBudgetReport",
        allowedRoles: SPARE_ROLES_WITH_OPERATOR,
      },
      {
        title: "Each Cell-wise Inventory Bifurcation",
        route: "/spare/eachCellWiseInventoryBifurcation",
        allowedRoles: SPARE_ROLES_WITH_OPERATOR,
      },
      {
        title: "MTD Toolroom KPI",
        route: "/spare/mtdToolRoomKPI",
        allowedRoles: SPARE_ROLES_WITH_OPERATOR,
      },
    ],
  },
  {
    title: "User Management",
    icon: (
      <PersonAddIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareUserManagement",
    allowedRoles: SPARE_USER_MANAGEMENT_ROLES,
    hasToolRoomFilter: true,
  },
  {
    title: "Search Button",
    icon: (
      <PageviewIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareSearchButton",
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    title: "New Part Request",
    icon: (
      <DescriptionIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareNewPartRequest",
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    title: "Approval Dashboard",
    icon: (
      <FactCheckIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareApprovalDashboard",
    allowedRoles: SPARE_APPROVER_ROLES,
  },
    {
    title: "Ordering Dashboard",
    icon: (
      <ShoppingCartIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareOrderingDashboard",
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    // The three master catalogues are one group, the way the KPI dashboards are:
    // same record shape and same table, one per collection.
    title: "Master Dashboard",
    icon: (
      <StorageIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    subItems: [
      {
        title: "Master Dashboard",
        route: "/spare/spareMasterDashboard",
        allowedRoles: SPARE_ROLES_WITH_OPERATOR,
      },
      {
        title: "Recycle Parts Master",
        route: "/spare/recyclePartsMaster",
        allowedRoles: SPARE_ROLES_WITH_OPERATOR,
      },
      {
        title: "Repaired Parts Master",
        route: "/spare/repairedPartsMaster",
        allowedRoles: SPARE_ROLES_WITH_OPERATOR,
      },
    ],
  },
  {
    title: "Approval Logs",
    icon: (
      <AssignmentTurnedInIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareApprovalLogs",
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    title: "Issuance",
    icon: (
      <AddCardIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/sparePartIssuance",
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    title: "Change Request",
    icon: (
      <PublishedWithChangesIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/changeRequestDashboard",
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    title: "Delete Request",
    icon: (
      <DeleteOutlineIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/deleteRequestDashboard",
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    title: "Budget Dashboard",
    icon: (
      <AccountBalanceWalletIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareBudgetDashboard",
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    // Every downloadable KPI chart in one table, each with its own filter dialog.
    title: "Spare Reports",
    icon: (
      <AssessmentIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/spareReports",
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    title: "Approval / Lead time / currency Configuration",
    icon: (
      <ControlPointIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/customizedDashboard",
    allowedRoles: SPARE_CONFIGURATION_ROLES,
  },
  {
    title: "Customized Fields",
    icon: (
      <DynamicFeedIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/customizedDashboard/dynamicFieldsConfiguration",
    allowedRoles: SPARE_CONFIGURATION_ROLES,
    hasToolRoomFilter: true,
  },
  {
    title: "Target Dashboard",
    icon: (
      <ModeStandbyIcon className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/spare/targetDashboard",
    allowedRoles: SPARE_CONFIGURATION_ROLES,
    hasToolRoomFilter: true,
  },
];
