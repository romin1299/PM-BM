import React, { useContext } from "react";
import MainPageComponent from "./MainPage/MainPageComponent";
import RoutingContext from "../context/routing/RoutingContext";

import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";
import { DashboardIcon } from "../components/NavbarComponent/ImportModules";

const KPI_Routes = ({ commonRoutes }) => {
  const userData = useContext(RoutingContext);

  let routes = commonRoutes;

  routes.push({
    path: "/kpi",
    element: <MainPageComponent />,
  });

  const filteredItems = [
    {
      title: "MTD KPI",
      icon: <DashboardIcon className="text-white" />,
      route: "/kpi",
    },
  ];
  return (
    <CommonRoutesContainer
      routes={routes}
      sideBarProp={{ userData, filteredItems }}
    />
  );
};

export default KPI_Routes;
