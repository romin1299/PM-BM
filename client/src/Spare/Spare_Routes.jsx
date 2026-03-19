import React, { useContext, lazy } from "react";

import RoutingContext from "../context/routing/RoutingContext";

import { filteredMenuItems } from "../Common/CommonRoutes/filteredMenuItems";
import { menuItems } from "./SpareSidebar/menuItems";
import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";

const SpareKPI = lazy(() => import("./Pages/SpareKPI/SpareKPI"));
const SpareSearchButton = lazy(() =>
  import("./Pages/SpareSearchButton/SpareSearchButton")
);
const SpareNewPartRequest = lazy(() =>
  import("./Pages/SpareNewPartRequest/SpareNewPartRequest")
);
const SpareApprovalDashboard = lazy(() =>
  import("./Pages/SpareApprovalDashboard/SpareApprovalDashboard")
);
const SpareApprovalLogs = lazy(() =>
  import("./Pages/SpareApprovalDashboard/SpareApprovalLogs")
);
const SpareOrderingDashboard = lazy(() =>
  import("./Pages/SpareOrderingDashboard/SpareOrderingDashboard")
);
const SpareReceivingDashboard = lazy(() =>
  import("./Pages/SpareReceivingDashboard/SpareReceivingDashboard")
);
const SpareRegistration = lazy(() =>
  import("./Pages/SpareRegistration/SpareRegistration")
);
const SparePartIssuance = lazy(() =>
  import("./Pages/SparePartIssuance/SparePartIssuance")
);
const SpareBudgetDashboard = lazy(() =>
  import("./Pages/SpareBudgetDashboard/SpareBudgetDashboard")
);
const SpareReports = lazy(() => import("./Pages/SpareReports/SpareReports"));
const SpareCustomized = lazy(() =>
  import("./Pages/SpareCustomized/SpareCustomized")
);

const Spare_Routes = () => {
  const context = useContext(RoutingContext);
  const routes = [
    {
      path: "/spare",
      element: <SpareKPI />,
    },
    {
      path: "/spare/spareSearchButton",
      element: <SpareSearchButton />,
    },
    {
      path: "/spare/spareNewPartRequest",
      element: <SpareNewPartRequest />,
    },
    {
      path: "/spare/spareApprovalDashboard",
      element: <SpareApprovalDashboard />,
    },
    {
      path: "/spare/spareApprovalLogs",
      element: <SpareApprovalLogs />,
    },
    {
      path: "/spare/spareOrderingDashboard",
      element: <SpareOrderingDashboard />,
    },
    {
      path: "/spare/spareReceivingDashboard",
      element: <SpareReceivingDashboard />,
    },
    {
      path: "/spare/spareRegistration",
      element: <SpareRegistration />,
    },
    {
      path: "/spare/sparePartIssuance",
      element: <SparePartIssuance />,
    },
    {
      path: "/spare/spareBudgetDashboard",
      element: <SpareBudgetDashboard />,
    },
    {
      path: "/spare/spareReports",
      element: <SpareReports />,
    },
    {
      path: "/spare/customizedDashboard",
      element: <SpareCustomized />,
    },
  ];

  const userRoutes = [
    {
      user_type: "Plant-Admin",
      routes,
    },
    {
      user_type: "Section-Admin",
      routes,
    },
    {
      user_type: "TL/HOSS",
      routes,
    },
    {
      user_type: "Operator",
      routes,
    },
  ];
  const filteredRoutes = userRoutes?.find(
    (userRoute) => userRoute?.user_type === context?.user_type
  );
  const filteredItems = filteredMenuItems(
    menuItems,
    context?.user_type,
    context?.tm_department
  );
  return (
    <CommonRoutesContainer
      routes={filteredRoutes?.routes}
      sideBarProp={{ userData: context, filteredItems }}
    />
  );
};

export default Spare_Routes;
