import React, { useContext } from "react";
import RoutingContext from "../context/routing/RoutingContext";

import { filteredMenuItems } from "../Common/CommonRoutes/filteredMenuItems";
import { menuItems } from "./SpareSidebar/menuItems";
import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";
import SpareKPI from "./Pages/SpareKPI/SpareKPI";
import SpareSearchButton from "./Pages/SpareSearchButton/SpareSearchButton";
import SpareNewPartRequest from "./Pages/SpareNewPartRequest/SpareNewPartRequest";
import SpareApprovalDashboard from "./Pages/SpareApprovalDashboard/SpareApprovalDashboard";
import SpareOrderingDashboard from "./Pages/SpareOrderingDashboard/SpareOrderingDashboard";
import SpareReceivingDashboard from "./Pages/SpareReceivingDashboard/SpareReceivingDashboard";
import SpareRegistration from "./Pages/SpareRegistration/SpareRegistration";
import SparePartIssuance from "./Pages/SparePartIssuance/SparePartIssuance";
import SpareBudgetDashboard from "./Pages/SpareBudgetDashboard/SpareBudgetDashboard";
import SpareReports from "./Pages/SpareReports/SpareReports";

const Spare_Routes = ({ commonRoutes = [] }) => {
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
