import React, { useContext } from "react";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import SummarizeIcon from "@mui/icons-material/Summarize";

import MainPageComponent from "./MainPage/MainPageComponent";
import SpareReportMainDashboard from "../pages/Reports/SpareReport/SpareReportMainDashboard";
import RoutingContext from "../context/routing/RoutingContext";

import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";
import { DashboardIcon } from "../components/NavbarComponent/ImportModules";

import ProductionLineWiseReport from "../BM/Reports/ProductionLineWiseReport/ProductionLineWiseReport";
import ManHourDashboard from "../BM/Reports/ManHourReport/ManHourDashboard";
import DailyBTDashboard from "../BM/Reports/DailyBreakdownTrend/DailyBDDashboard";
import MonthlyBDTDashboard from "../BM/Reports/MonthlyBDTrend/MonthlyBDDashboard";
import LineContributionBD from "../BM/Reports/LineContributionBreakdown/LineContributionMain";
import TMMTRMain from "../BM/Reports/TMMTTRSkill/TMMTRDashboard";
import MTTRReportDashboard from "../BM/Reports/MTTRReport/MTTRReportDashboard";
import MTBFReportDashboard from "../BM/Reports/MTBFReport/MTBFReportDashboard";
import TopMachineBD from "../BM/Reports/TopMachineBreakdown/TopMachineBD";
import MachineAgeReport from "../BM/Reports/MachineAge/MachineAgeReport";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import TargetDashboard from "../BM/TargetOfBD/TargetDashboard";
import MainRequestSheetForView from "../BM/Tabs/RequestSheetForView/MainRequestSheetForView";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { BASE_URL } from "../ConditionsForDNINandDNHA/ConditionBasedDisplay";
const KPI_Routes = ({ commonRoutes, loggedUser }) => {
  const userData = useContext(RoutingContext);
  const reportAccess = ["Plant-Admin", "Section-Admin", "TL/HOSS", "Operator"];

  let targetDashboardRouteDisplay = [];

  if (
    loggedUser?.tm_department === "MTD" ||
    loggedUser?.user_type === "Operator"
  ) {
    targetDashboardRouteDisplay = [
      {
        path: "/kpi/targetDashboard",
        element: <TargetDashboard />,
      },
    ];
  }

  let routes = commonRoutes?.concat([
    {
      path: "/kpi",
      element: <MainPageComponent />,
    },
    // {
    //   path: "/kpi/view/request-sheet/:machine_code/:requestSheetID/:selectedYear",
    //   element: <MainRequestSheetForView />,
    // },
    {
      path: "/kpi/report/daily-breakdown-trend",
      element: <DailyBTDashboard />,
    },
    ...targetDashboardRouteDisplay,
    {
      path: "/kpi/spareReportDashboard",
      element: <SpareReportMainDashboard />,
    },
    {
      path: "/kpi/report/productionLineWiseReport",
      element: <ProductionLineWiseReport />,
    },
    { path: "/kpi/report/man-hour", element: <ManHourDashboard /> },
    {
      path: "/kpi/report/daily-breakdown-trend",
      element: <DailyBTDashboard />,
    },
    {
      path: "/kpi/report/monthly-breakdown-trend",
      element: <MonthlyBDTDashboard />,
    },
    {
      path: "/kpi/report/line-contribution-breakdown-trend",
      element: <LineContributionBD />,
    },
    {
      path: "/kpi/report/tm-mtr",
      element: <TMMTRMain />,
    },
    {
      path: "/kpi/report/mttr",
      element: <MTTRReportDashboard />,
    },
    {
      path: "/kpi/report/mtbf",
      element: <MTBFReportDashboard />,
    },
    {
      path: "/kpi/report/top-machine-breakdown",
      element: <TopMachineBD />,
    },
    {
      path: "/kpi/report/machine-age",
      element: <MachineAgeReport />,
    },
  ]);

  let targetDashboardDisplay = [];

  if (loggedUser?.tm_department === "MTD") {
    targetDashboardDisplay = [
      {
        title: "Target Dashboard",
        icon: <CrisisAlertIcon className="text-white" />,
        route: "/kpi/targetDashboard",
      },
    ];
  }

  const filteredItems = [
    {
      title: "MTD KPI",
      icon: <DashboardIcon className="text-white" />,
      route: "/kpi",
    },
    // {
    //   title: "Daily BD Report",
    //   icon: <AnalyticsIcon className="text-white" />,
    //   route: "/kpi/report/daily-breakdown-trend",
    // },

    // ------- Reports Dashboards -------
    {
      title: "Reports",
      icon: <AnalyticsIcon className="text-white" />,
      allowedRoles: reportAccess,
      subItems: [
        {
          title: "Production Line Wise",
          route: "/kpi/report/productionLineWiseReport",
        },
        {
          title: "Man Hour",
          route: "/kpi/report/man-hour",
        },
        {
          title: "Daily BD",
          route: "/kpi/report/daily-breakdown-trend",
        },
        {
          title: "Monthly BD",
          route: "/kpi/report/monthly-breakdown-trend",
        },
        {
          title: "Line Contibution BD",
          route: "/kpi/report/line-contribution-breakdown-trend",
        },
        {
          title: "MTTR",
          route: "/kpi/report/mttr",
        },
        {
          title: "MTBF",
          route: "/kpi/report/mtbf",
        },
        {
          title: "TM MTTR Skill",
          route: "/kpi/report/tm-mtr",
        },
        {
          title: "Top Machine Breakdown",
          route: "/kpi/report/top-machine-breakdown",
        },
        {
          title: "Machine Age",
          route: "/kpi/report/machine-age",
        },
      ],
    },
    ...targetDashboardDisplay,
    {
      title: "Spare Report",
      icon: <SummarizeIcon className="text-white" />,
      route: "/kpi/spareReportDashboard",
    },
    {
      icon: <MenuBookIcon className="text-white" />,
      title: "User Manual",
      route: `${BASE_URL}/Denso BM User Manual_OSL14May2024.pdf`,
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
