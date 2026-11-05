import { useContext, lazy, useMemo } from "react";

import RoutingContext from "../context/routing/RoutingContext";
import { filteredMenuItems } from "../Common/CommonRoutes/filteredMenuItems";
import { menuItems } from "./SpareSidebar/menuItems";
import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";
import {
  SPARE_APPROVER_ROLES,
  SPARE_CONFIGURATION_ROLES,
  SPARE_MODULE_ROLES,
  SPARE_ROLES_WITH_OPERATOR,
  SPARE_USER_MANAGEMENT_ROLES,
} from "./Utils/spareRoles";

// Loaded with the module's routes so every Spare page shares it, and only they.
import "./Component/SpareScrollTable.scss";
import { isToolRoomUser } from "../Utils/userScope";

const SpareKPI = lazy(() => import("./Pages/SpareKPI/SpareKPI"));
const SpareInventoryReport = lazy(
  () => import("./Pages/SpareInventoryReport/SpareInventoryReport"),
);
const SpareStockLevelWiseAnalysis = lazy(
  () =>
    import("./Pages/SpareStockLevelWiseAnalysis/SpareStockLevelWiseAnalysis"),
);
const SpareMTDRAndMPlanVsActualBudgetReport = lazy(
  () =>
    import("./Pages/SpareMTDRAndMPlanVsActualBudgetReport/SpareMTDRAndMPlanVsActualBudgetReport"),
);
const SpareEachCellWiseInventoryBifurcation = lazy(
  () =>
    import("./Pages/SpareEachCellWiseInventoryBifurcation/SpareEachCellWiseInventoryBifurcation"),
);
const SpareMTDToolRoomKPI = lazy(
  () => import("./Pages/SpareMTDToolRoomKPI/SpareMTDToolRoomKPI"),
);
const SpareSearchButton = lazy(
  () => import("./Pages/SpareSearchButton/SpareSearchButton"),
);
const SpareNewPartRequest = lazy(
  () => import("./Pages/SpareNewPartRequest/SpareNewPartRequest"),
);
const SpareApprovalDashboard = lazy(
  () => import("./Pages/SpareApprovalDashboard/SpareApprovalDashboard"),
);
const SpareApprovalLogs = lazy(
  () => import("./Pages/SpareApprovalDashboard/SpareApprovalLogs"),
);
const SpareOrderingDashboard = lazy(
  () => import("./Pages/SpareOrderingDashboard/SpareOrderingDashboard"),
);
const SpareMasterRegistration = lazy(
  () => import("./Pages/SpareMasterRegistration/SpareMasterRegistration"),
);
const SpareMasterDashboard = lazy(
  () => import("./Pages/SpareMasterDashboard/SpareMasterDashboard"),
);
const SpareUploadedMasterDashboard = lazy(
  () => import("./Pages/SpareMasterDashboard/SpareUploadedMasterDashboard"),
);
const SparePartIssuance = lazy(
  () => import("./Pages/SparePartIssuance/SparePartIssuance"),
);
const SpareChangeRequestDashboard = lazy(
  () =>
    import("./Pages/SpareChangeRequestDashboard/SpareChangeRequestDashboard"),
);
const SpareDeleteRequestDashboard = lazy(
  () =>
    import("./Pages/SpareDeleteRequestDashboard/SpareDeleteRequestDashboard"),
);
const SpareBudgetDashboard = lazy(
  () => import("./Pages/SpareBudgetDashboard/SpareBudgetDashboard"),
);
const SpareReports = lazy(() => import("./Pages/SpareReports/SpareReports"));
const SpareCustomized = lazy(
  () => import("./Pages/SpareCustomized/SpareCustomized"),
);
const SpareUserManagement = lazy(
  () => import("./Pages/SpareUserManagement/SpareUserManagement"),
);
const DynamicFieldsConfiguration = lazy(
  () => import("./Pages/SpareCustomized/DynamicFieldsConfiguration"),
);
const SpareTargetDashboard = lazy(
  () => import("./Pages/SpareTargetDashboard/SpareTargetDashboard"),
);

const routes = [
  {
    path: "/spare",
    element: <SpareKPI />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/inventoryReport",
    element: <SpareInventoryReport />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/stockLevelWiseAnalysisReport",
    element: <SpareStockLevelWiseAnalysis />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/mtdRAndMPlanVsActualBudgetReport",
    element: <SpareMTDRAndMPlanVsActualBudgetReport />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/eachCellWiseInventoryBifurcation",
    element: <SpareEachCellWiseInventoryBifurcation />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/mtdToolRoomKPI",
    element: <SpareMTDToolRoomKPI />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/spareUserManagement",
    element: <SpareUserManagement />,
    allowedRoles: SPARE_USER_MANAGEMENT_ROLES,
    hasToolRoomFilter: true,
  },
  {
    path: "/spare/spareSearchButton",
    element: <SpareSearchButton />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/spareNewPartRequest",
    element: <SpareNewPartRequest />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/spareApprovalDashboard",
    element: <SpareApprovalDashboard />,
    allowedRoles: SPARE_APPROVER_ROLES,
  },
  {
    path: "/spare/spareApprovalLogs",
    element: <SpareApprovalLogs />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/spareOrderingDashboard",
    element: <SpareOrderingDashboard />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/spareMasterRegistration",
    element: <SpareMasterRegistration />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/spareMasterDashboard",
    element: <SpareMasterDashboard />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/recyclePartsMaster",
    element: <SpareUploadedMasterDashboard masterType="recycle" />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/repairedPartsMaster",
    element: <SpareUploadedMasterDashboard masterType="repaired" />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/sparePartIssuance",
    element: <SparePartIssuance />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/changeRequestDashboard",
    element: <SpareChangeRequestDashboard />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/deleteRequestDashboard",
    element: <SpareDeleteRequestDashboard />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/spareBudgetDashboard",
    element: <SpareBudgetDashboard />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/spareReports",
    element: <SpareReports />,
    allowedRoles: SPARE_ROLES_WITH_OPERATOR,
  },
  {
    path: "/spare/customizedDashboard",
    element: <SpareCustomized />,
    allowedRoles: SPARE_CONFIGURATION_ROLES,
  },
  {
    path: "/spare/customizedDashboard/dynamicFieldsConfiguration",
    element: <DynamicFieldsConfiguration />,
    hasToolRoomFilter: true,
    allowedRoles: SPARE_CONFIGURATION_ROLES,
  },
  {
    path: "/spare/targetDashboard",
    element: <SpareTargetDashboard />,
    hasToolRoomFilter: true,
    allowedRoles: SPARE_CONFIGURATION_ROLES,
  },
];

const Spare_Routes = () => {
  const context = useContext(RoutingContext);

  /**
   * Dedicated tool-room staff and PM users who also work in the tool room both
   * get the tool-room-only screens. See Utils/userScope.js.
   */
  const isToolRoom = isToolRoomUser(context);

  const filteredRoutes = useMemo(
    () =>
      SPARE_MODULE_ROLES.has(context?.user_type)
        ? routes?.filter(
            (item) =>
              item?.allowedRoles?.includes(context?.user_type) &&
              (item?.hasToolRoomFilter ? isToolRoom : true),
          )
        : undefined,
    [context?.user_type, isToolRoom],
  );

  const sideBarProp = useMemo(
    () => ({
      userData: context,
      filteredItems: filteredMenuItems(
        menuItems,
        context?.user_type,
        context?.tm_department,
        isToolRoom,
      ),
    }),
    [context, isToolRoom],
  );

  return (
    <CommonRoutesContainer routes={filteredRoutes} sideBarProp={sideBarProp} />
  );
};

export default Spare_Routes;
