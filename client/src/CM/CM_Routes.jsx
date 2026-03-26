import React, { useContext } from "react";
import RoutingContext from "../context/routing/RoutingContext";
import { menuItems } from "./CMSidebar/menuItems";
import { filteredMenuItems } from "../Common/CommonRoutes/filteredMenuItems";
import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";
import GenerateRequestSheetMainDashboard from "../BM/RequestSheet/GenerateRequestSheetMainDashboard";

import ActivityStatusDashboardOfCM from "./Pages/ActivityStatusDashboadOfCM/ActivityStatusDashboardOfCM";
import AllRequestSheetReportDataOfCM from "./Pages/AllRequestSheetReportDataOfCM/AllRequestSheetReportDataOfCM";
import GeneratedExistingMachineRequestSheetByMTD from "./Components/ReqestSheetOfCM/ExistingMachineRequestSheet/GeneratedExistingMachineRequestSheetByMTD";

import DashboardOfLTPM from "./Components/ReqestSheetOfCM/LTPM_RequestSheet/DashboardOfLTPM";
import CMApprovalDashboardOfRequestSheet from "./Pages/CMApprovalDashboardOfReqSheet/CMApprovalDashboardOfRequestSheet";
import ApprovalLogs from "./Pages/ApprovalLogs/ApprovalLogs";
import FullCalenderForActivity from "./Pages/ActivityCalendar/FullCalenderForActivity";

const CM_Routes = ({ commonRoutes }) => {
  let reportRoutes = [];
  reportRoutes = commonRoutes;
  const context = useContext(RoutingContext);

  const userRoutes = [
    {
      user_type: "Plant-Admin",
      routes: [
        // {
        //   path: "/cm",
        //   element: <ActivityStatusDashboardOfCM />,
        // },
        {
          path: "/cm",
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
        {
          path: "/cm/activity-calendar",
          element: <FullCalenderForActivity/>
        },
      ],
    },
    {
      user_type: "Section-Admin",
      routes: [
        // {
        //   path: "/cm",
        //   element: <ActivityStatusDashboardOfCM />,
        // },
        {
          path: "/cm",
          element: <AllRequestSheetReportDataOfCM />,
        },
        {
          path: "/cm/approval",
          element: <CMApprovalDashboardOfRequestSheet />,
        },
        {
          path: "/cm/activity-calendar",
          element: <FullCalenderForActivity/>

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
      user_type: "TL/HOSS",
      routes: [
        // {
        //   path: "/cm",
        //   element: <ActivityStatusDashboardOfCM />,
        // },
        {
          path: "/cm",
          element: <AllRequestSheetReportDataOfCM />,
        },
        {
          path: "/cm/generateCMRequestSheetMainDashboard",
          element: <GenerateRequestSheetMainDashboard />,
        },
        {
          path: "/cm/request-sheet/:machine_code/:selectedYear",
          element: <GeneratedExistingMachineRequestSheetByMTD />,
        },
        {
          path: "/cm/approval",
          element: <CMApprovalDashboardOfRequestSheet />,
        },
        {
          path: "/cm/activity-calendar",
          element: <FullCalenderForActivity/>
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
        // {
        //   path: "/cm",
        //   element: <ActivityStatusDashboardOfCM />,
        // },
        {
          path: "/cm",
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
        {
          path: "/cm/activity-calendar",
          element: <FullCalenderForActivity/>

        },
      ],
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

export default CM_Routes;
