import React, { useContext } from "react";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import SummarizeIcon from "@mui/icons-material/Summarize";

import MainPageComponent from "./MainPage/MainPageComponent";
import DailyBTDashboard from "../BM/Reports/DailyBreakdownTrend/DailyBDDashboard";
import SpareReportMainDashboard from "../pages/Reports/SpareReport/SpareReportMainDashboard";
import RoutingContext from "../context/routing/RoutingContext";

import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";
import { DashboardIcon } from "../components/NavbarComponent/ImportModules";

const KPI_Routes = ({ commonRoutes }) => {
  const userData = useContext(RoutingContext);

  let routes = commonRoutes?.concat([
    {
      path: "/kpi",
      element: <MainPageComponent />,
    },
    {
      path: "/kpi/report/daily-breakdown-trend",
      element: <DailyBTDashboard />,
    },
    {
      path: "/kpi/spareReportDashboard",
      element: <SpareReportMainDashboard />,
    },
  ]);

  const filteredItems = [
    {
      title: "MTD KPI",
      icon: <DashboardIcon className="text-white" />,
      route: "/kpi",
    },
    {
      title: "Daily BD Report",
      icon: <AnalyticsIcon className="text-white" />,
      route: "/kpi/report/daily-breakdown-trend",
    },
    {
      title: "Spare Report",
      icon: <SummarizeIcon className="text-white" />,
      route: "/kpi/spareReportDashboard",
    },
  ];

  console.log(routes);

  return (
    <CommonRoutesContainer
      routes={routes}
      sideBarProp={{ userData, filteredItems }}
    />
  );
};

export default KPI_Routes;
