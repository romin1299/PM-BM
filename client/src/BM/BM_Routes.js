import { useState, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import Container from "../components/Container/Container";
import RightNavbar from "../components/RightNavbar/RightNavbar";
import NavContext from "../context/NavContext";
import AdminDashboard from "../pages/Admin/AdminDashboard";

import RoutingContext from "../context/routing/RoutingContext";
import Profile from "../pages/Profile";

import AdminCreationDashboard from "../pages/Admin/AdminCreationDashboard";
import OperatorDashboard from "../pages/Operator/OperatorDashboard";
import BMSidebar from "./BMSidebar/BMSidebar";
import RequestSheet from "./Tabs/RequestSheet/MainRequestSheet";
import RequestSheetMainDashboard from "./RequestSheet/RequestSheetMainDashboard";
import GenerateRequestSheetMainDashboard from "./RequestSheet/GenerateRequestSheetMainDashboard";
import RequestSheetMonitoring from "./RequestSheetMonitoring/RequestSheetMonitoring";
import RequestSheetUpdate from "./Tabs/RequestSheetForUpdate/MainRequestSheetForUpdate";
import RequestSheetView from "./Tabs/RequestSheetForView/MainRequestSheetForView";
import ProductionLineWiseReport from "./Reports/ProductionLineWiseReport/ProductionLineWiseReport";

import MainCustomized from "./Customized/MainCustomized";
import ManHourDashboard from "./Reports/ManHourReport/ManHourDashboard";
import MonthlyBDTDashboard from "./Reports/MonthlyBDTrend/MonthlyBDDashboard";
import DailyBTDashboard from "./Reports/DailyBreakdownTrend/DailyBDDashboard";
import MTTRReportDashboard from "./Reports/MTTRReport/MTTRReportDashboard";
import MTBFReportDashboard from "./Reports/MTBFReport/MTBFReportDashboard";
import MTTRDashboard from "./Reports/MTTRReport/MTTRDashboard";
import MTBFDashboard from "./Reports/MTBFReport/MTBFDashboard";
import TopMachineBD from "./Reports/TopMachineBreakdown/TopMachineBD";
import MachineAgeReport from "./Reports/MachineAge/MachineAgeReport";

import ApprovalDashboardOfRequestSheet from "./ApprovalDashboards/ApprovalDashboardOfRequestSheet";
import LineContributionBD from "./Reports/LineContributionBreakdown/LineContributionMain";
import TMMTR from "./Reports/TMMTTRSkill/TMMTRDashboard";

import ApprovalLogs from "./ApprovalLogs/ApprovalLogs";
import BMTitlebar from "./Component/BMTitlebar";
import TargetDashboard from "./TargetOfBD/TargetDashboard";
import MachineSummaryComponent from "../Common/Machine/MachineHistoryComponent";

import NoLossBDEntryForm from "./NoLossBDDataEntry/NoLossBDEntryForm";

function BM_Routes({ commonRoutes }) {
  const reportRoutes = [
    ...commonRoutes,
    {
      path: "/bm/report/productionLineWiseReport",
      element: <ProductionLineWiseReport />,
    },
    { path: "/bm/report/man-hour", element: <ManHourDashboard /> },
    {
      path: "/bm/report/daily-breakdown-trend",
      element: <DailyBTDashboard />,
    },
    {
      path: "/bm/report/monthly-breakdown-trend",
      element: <MonthlyBDTDashboard />,
    },
    // {
    //   path: "/bm/report/mttr-report",
    //   element: <MTTRReportDashboard />,
    // },
    // {
    //   path: "/bm/report/mtbf-report",
    //   element: <MTBFReportDashboard />,
    // },
    {
      path: "/bm/report/line-contribution-breakdown-trend",
      element: <LineContributionBD />,
    },
    {
      path: "/bm/report/tm-mtr",
      element: <TMMTR />,
    },
    {
      path: "/bm/report/mttr",
      element: <MTTRReportDashboard />,
    },
    {
      path: "/bm/report/mtbf",
      element: <MTBFReportDashboard />,
    },
    {
      path: "/bm/report/top-machine-breakdown",
      element: <TopMachineBD />,
    },
    {
      path: "/bm/report/machine-age",
      element: <MachineAgeReport />,
    },
  ];

  // Define an array of routes for each user type
  const userRoutes = [
    {
      user_type: "Admin",
      routes: [
        {
          path: "/bm",
          element: (
            <div className="container-fluid">
              <BMTitlebar title="Plant Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/summeryDashboard",
          element: (
            <div className="container-fluid">
              <BMTitlebar title="Summary Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/admin-creation-dashboard",
          element: <AdminCreationDashboard />,
        },
        {
          path: "/bm/adminDashboard",
          element: <AdminDashboard />,
        },
        {
          path: "/bm/customizedDashboard",
          element: <MainCustomized />,
        },
        // {
        //   path: "/bm/profile",
        //   element: <Profile />,
        // },
      ],
    },
    {
      user_type: "Plant-Admin",
      routes: [
        {
          path: "/bm",
          element: (
            <div className="container-fluid">
              <BMTitlebar title="Plant Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/summeryDashboard",
          element: (
            <div className="container-fluid">
              <BMTitlebar title="Summary Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/operator-dashboard",
          element: <OperatorDashboard />,
        },
        {
          path: "/bm/approval",
          element: <ApprovalDashboardOfRequestSheet />,
        },
        {
          path: "/bm/requestSheetMonitoring",
          element: <RequestSheetMonitoring />,
        },
        {
          path: "/bm/requestListDashboard",
          element: <RequestSheetMainDashboard />,
        },
        {
          path: "/bm/update/request-sheet/:machine_code/:requestSheetID/:selectedYear",
          element: <RequestSheetUpdate />,
        },
        {
          path: "/bm/view/request-sheet/:machine_code/:requestSheetID/:selectedYear",
          element: <RequestSheetView />,
        },
        {
          path: "/bm/approvalLogs",
          element: <ApprovalLogs />,
        },
        {
          path: "/bm/customizedDashboard",
          element: <MainCustomized />,
        },
        {
          path: "/bm/targetDashboard",
          element: <TargetDashboard />,
        },
        // {
        //   path: "/bm/profile",
        //   element: <Profile />,
        // },

        ...reportRoutes,
      ],
    },
    {
      user_type: "Section-Admin",
      routes: [
        {
          path: "/bm",
          element: (
            <div className="container-fluid">
              <BMTitlebar title="Plant Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/summeryDashboard",
          element: (
            <div className="container-fluid">
              <BMTitlebar title="Summary Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/operator-dashboard",
          element: <OperatorDashboard />,
        },
        {
          path: "/bm/requestSheetMonitoring",
          element: <RequestSheetMonitoring />,
        },
        {
          path: "/bm/requestListDashboard",
          element: <RequestSheetMainDashboard />,
        },
        {
          path: "/bm/approval",
          element: <ApprovalDashboardOfRequestSheet />,
        },
        {
          path: "/bm/update/request-sheet/:machine_code/:requestSheetID/:selectedYear",
          element: <RequestSheetUpdate />,
        },
        {
          path: "/bm/view/request-sheet/:machine_code/:requestSheetID/:selectedYear",
          element: <RequestSheetView />,
        },
        {
          path: "/bm/approvalLogs",
          element: <ApprovalLogs />,
        },
        {
          path: "/bm/customizedDashboard",
          element: <MainCustomized />,
        },
        {
          path: "/bm/targetDashboard",
          element: <TargetDashboard />,
        },
        // {
        //   path: "/bm/profile",
        //   element: <Profile />,
        // },

        ...reportRoutes,
      ],
    },
    {
      user_type: "TL/HOSS",
      routes: [
        {
          path: "/bm",
          element: (
            <div className="container-fluid">
              {/* <BMTabDashboard /> */}
              <BMTitlebar title="Plant Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/summeryDashboard",
          element: (
            <div className="container-fluid">
              <BMTitlebar title="Summary Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/requestSheetMonitoring",
          element: <RequestSheetMonitoring />,
        },
        {
          path: "/bm/requestListDashboard",
          element: <RequestSheetMainDashboard />,
        },
        {
          path: "/bm/generateRequestSheetMainDashboard",
          element: <GenerateRequestSheetMainDashboard />,
        },
        {
          path: "/bm/request-sheet/:generateType/:machine_code",
          element: <RequestSheet />,
        },
        {
          path: "/bm/update/request-sheet/:machine_code/:requestSheetID/:selectedYear",
          element: <RequestSheetUpdate />,
        },
        {
          path: "/bm/view/request-sheet/:machine_code/:requestSheetID/:selectedYear",
          element: <RequestSheetView />,
        },
        {
          path: "/bm/approval",
          element: <ApprovalDashboardOfRequestSheet />,
        },
        {
          path: "/bm/approvalLogs",
          element: <ApprovalLogs />,
        },
        {
          path: "/bm/noLossDataOfBD",
          element: <NoLossBDEntryForm />,
        },
        // {
        //   path: "/bm/profile",
        //   element: <Profile />,
        // },

        ...reportRoutes,
      ],
    },
    {
      user_type: "Operator",
      routes: [
        {
          path: "/bm",
          element: (
            <div className="container-fluid">
              <BMTitlebar title="Plant Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/summeryDashboard",
          element: (
            <div className="container-fluid">
              <BMTitlebar title="Summary Dashboard" />
            </div>
          ),
        },
        {
          path: "/bm/requestSheetMonitoring",
          element: <RequestSheetMonitoring />,
        },
        {
          path: "/bm/requestListDashboard",
          element: <RequestSheetMainDashboard />,
        },
        {
          path: "/bm/generateRequestSheetMainDashboard",
          element: <GenerateRequestSheetMainDashboard />,
        },
        {
          path: "/bm/request-sheet/:generateType/:machine_code",
          element: <RequestSheet />,
        },
        {
          path: "/bm/update/request-sheet/:machine_code/:requestSheetID/:selectedYear",
          element: <RequestSheetUpdate />,
        },
        {
          path: "/bm/view/request-sheet/:machine_code/:requestSheetID/:selectedYear",
          element: <RequestSheetView />,
        },
        // {
        //   path: "/bm/profile",
        //   element: <Profile />,
        // },
        {
          path: "/bm/approvalLogs",
          element: <ApprovalLogs />,
        },

        ...reportRoutes,
      ],
    },
  ];

  const [nav, setNav] = useState(false);
  const value = { nav, setNav };

  const context = useContext(RoutingContext);
  // console.log("context:", context);

  const filteredRoutes = userRoutes?.find(
    (userRoute) => userRoute?.user_type === context?.user_type
  );

  return (
    <div className="App">
      {/* <NavContext.Provider value={value}> */}
      <BMSidebar userData={context} />

      {/* Render main container based on the user's routes */}
      <Container
        // stickyNav={<RightNavbar />}
        content={
          <Routes>
            {filteredRoutes?.routes?.map((route) =>
              route?.subRoutes ? (
                route?.subRoutes?.map((subRoute) => (
                  <Route key={route.path} path={route.path}>
                    <Route
                      key={subRoute.path}
                      path={subRoute.path}
                      element={subRoute.element}
                    />
                  </Route>
                ))
              ) : (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              )
            )}
          </Routes>
        }
      />
      {/* </NavContext.Provider> */}
    </div>
  );
}

export default BM_Routes;
