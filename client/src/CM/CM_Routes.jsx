import React, { useContext } from "react";
import AdminCreationDashboard from "../pages/Admin/AdminCreationDashboard";
import RoutingContext from "../context/routing/RoutingContext";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import MainCustomized from "../BM/Customized/MainCustomized";
import { menuItems } from "./CMSidebar/menuItems";
import { filteredMenuItems } from "../Common/CommonRoutes/filteredMenuItems";
import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";
// import BMTitlebar from "../BM/Component/BMTitlebar";
import Profile from "../pages/Profile";
import GenerateRequestSheetMainDashboard from "../BM/RequestSheet/GenerateRequestSheetMainDashboard";

import ActivityStatusDashboardOfCM from "./Pages/ActivityStatusDashboadOfCM/ActivityStatusDashboardOfCM";
import AllRequestSheetReportDataOfCM from "./Pages/AllRequestSheetReportDataOfCM/AllRequestSheetReportDataOfCM";
import ApprovalDashboard from "./Pages/ApprovalDashboardOfCM/ApprovalDashboard";
import RequestSheetStatusMonitoringOfCM from "./Pages/RequestSheetStatusMonitoringOfCM/RequestSheetStatusMonitoringOfCM";
import ExistingMachineRequestSheet from "./Components/ReqestSheetOfCM/ExistingMachineRequestSheet/ExistingMachineRequestSheet";
import RequestSheetOfLTPM from "./Components/ReqestSheetOfCM/LTPM_RequestSheet/RequestSheetOfLTPM";
import DashboardOfLTPM from "./Components/ReqestSheetOfCM/LTPM_RequestSheet/DashboardOfLTPM";
import CMApprovalDashboardOfRequestSheet from "./Pages/CMApprovalDashboardOfReqSheet/CMApprovalDashboardOfRequestSheet";
import ApprovalLogs from "./Pages/ApprovalLogs/ApprovalLogs";
import ActivityCalendar from "./Pages/ActivityCalendar/ActivityCalendar";

const CM_Routes = ({ commonRoutes }) => {
  let reportRoutes = [];
  reportRoutes = commonRoutes;
  const context = useContext(RoutingContext);

  const userRoutes = [
    // {
    //   user_type: "Admin",
    //   routes: [
    //     {
    //       path: "/cm",
    //       element: (
    //         <div className="container-fluid">
    //           <BMTitlebar title="Plant Dashboard" />
    //         </div>
    //       ),
    //     },
    //     // {
    //     //   path: "/bm/summeryDashboard",
    //     //   element: (
    //     //     <div className="container-fluid">
    //     //       <BMTitlebar title="Summary Dashboard" />
    //     //     </div>
    //     //   ),
    //     // },
    //     {
    //       path: "/cm/admin-creation-dashboard",
    //       element: <AdminCreationDashboard />,
    //     },
    //     {
    //       path: "/cm/adminDashboard",
    //       element: <AdminDashboard />,
    //     },
    //     {
    //       path: "/cm/customizedDashboard",
    //       element: <MainCustomized />,
    //     },
    //     {
    //       path: "/cm/profile",
    //       element: <Profile />,
    //     },
    //     // ...reportRoutes
    //   ],
    // },
    {
      user_type: "Plant-Admin",
      routes: [
        {
          path: "/cm",
          element: <ActivityStatusDashboardOfCM />,
        },
        {
          path: "/cm/allRequestSheetReportDataOfCM",
          element: <AllRequestSheetReportDataOfCM />,
        },
        {
          path: "/cm/approvalLogs",
          element: <ApprovalLogs />,
        },
        {
          path: "/cm/dashboard/ltpm",
          element: <DashboardOfLTPM />,
        },
      ],
    },
    {
      user_type: "Section-Admin",
      routes: [
        {
          path: "/cm",
          element: <ActivityStatusDashboardOfCM />,
        },
        {
          path: "/cm/allRequestSheetReportDataOfCM",
          element: <AllRequestSheetReportDataOfCM />,
        },
        {
          path: "/cm/approval",
          element: <CMApprovalDashboardOfRequestSheet />,
        },
        {
          path: "/cm/approvalLogs",
          element: <ApprovalLogs />,
        },
      ],
    },
    {
      user_type: "TL/HOSS",
      routes: [
        {
          path: "/cm",
          element: <ActivityStatusDashboardOfCM />,
        },
        {
          path: "/cm/allRequestSheetReportDataOfCM",
          element: <AllRequestSheetReportDataOfCM />,
        },
        {
          path: "/cm/generateCMRequestSheetMainDashboard",
          element: <GenerateRequestSheetMainDashboard />,
        },
        {
          path: "/cm/request-sheet/:machine_code/:selectedYear",
          element: <ExistingMachineRequestSheet />,
        },
        {
          path: "/cm/approval",
          element: <CMApprovalDashboardOfRequestSheet />,
        },
        {
          path: "/cm/activity-calendar",
          element: <ActivityCalendar />,
        },
        {
          path: "/cm/dashboard/ltpm",
          element: <DashboardOfLTPM />,
        },
        {
          path: "/cm/approvalLogs",
          element: <ApprovalLogs />,
        },
        ...reportRoutes,
      ],
    },
    {
      user_type: "Operator",
      routes: [
        {
          path: "/cm",
          element: <ActivityStatusDashboardOfCM />,
        },
        {
          path: "/cm/allRequestSheetReportDataOfCM",
          element: <AllRequestSheetReportDataOfCM />,
        },
        {
          path: "/cm/approvalLogs",
          element: <ApprovalLogs />,
        },
      ],
    },
  ];
  // console.log("this is user",context?.user_type)
  const filteredRoutes = userRoutes?.find(
    (userRoute) => userRoute?.user_type === context?.user_type
  );
  const filteredItems = filteredMenuItems(
    menuItems,
    context?.user_type,
    context?.tm_department
  );
  // console.log("this is cmrfgr",filteredRoutes)
  return (
    <CommonRoutesContainer
      routes={filteredRoutes?.routes}
      sideBarProp={{ userData: context, filteredItems }}
    />
  );
};

export default CM_Routes;
