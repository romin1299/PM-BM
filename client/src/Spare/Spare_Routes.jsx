// import React, { useContext, lazy } from "react";

// import RoutingContext from "../context/routing/RoutingContext";

// import { filteredMenuItems } from "../Common/CommonRoutes/filteredMenuItems";
// import { menuItems } from "./SpareSidebar/menuItems";
// import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";

// const SpareKPI = lazy(() => import("./Pages/SpareKPI/SpareKPI"));
// const SpareSearchButton = lazy(() =>
//   import("./Pages/SpareSearchButton/SpareSearchButton")
// );
// const SpareNewPartRequest = lazy(() =>
//   import("./Pages/SpareNewPartRequest/SpareNewPartRequest")
// );
// const SpareApprovalDashboard = lazy(() =>
//   import("./Pages/SpareApprovalDashboard/SpareApprovalDashboard")
// );
// const SpareApprovalLogs = lazy(() =>
//   import("./Pages/SpareApprovalDashboard/SpareApprovalLogs")
// );
// const SpareOrderingDashboard = lazy(() =>
//   import("./Pages/SpareOrderingDashboard/SpareOrderingDashboard")
// );
// const SpareReceivingDashboard = lazy(() =>
//   import("./Pages/SpareReceivingDashboard/SpareReceivingDashboard")
// );
// const SpareMasterRegistration = lazy(() =>
//   import("./Pages/SpareMasterRegistration/SpareMasterRegistration")
// );
// const SparePartIssuance = lazy(() =>
//   import("./Pages/SparePartIssuance/SparePartIssuance")
// );
// const SpareBudgetDashboard = lazy(() =>
//   import("./Pages/SpareBudgetDashboard/SpareBudgetDashboard")
// );
// const SpareReports = lazy(() => import("./Pages/SpareReports/SpareReports"));
// const SpareCustomized = lazy(() =>
//   import("./Pages/SpareCustomized/SpareCustomized")
// );

// const Spare_Routes = () => {
//   const context = useContext(RoutingContext);
//   const routes = [
//     {
//       path: "/spare",
//       element: <SpareKPI />,
//     },
//     {
//       path: "/spare/spareSearchButton",
//       element: <SpareSearchButton />,
//     },
//     {
//       path: "/spare/spareNewPartRequest",
//       element: <SpareNewPartRequest />,
//     },
//     {
//       path: "/spare/spareApprovalDashboard",
//       element: <SpareApprovalDashboard />,
//     },
//     {
//       path: "/spare/spareApprovalLogs",
//       element: <SpareApprovalLogs />,
//     },
//     {
//       path: "/spare/spareOrderingDashboard",
//       element: <SpareOrderingDashboard />,
//     },
//     {
//       path: "/spare/spareReceivingDashboard",
//       element: <SpareReceivingDashboard />,
//     },
//     {
//       path: "/spare/SpareMasterRegistration",
//       element: <SpareMasterRegistration />,
//     },
//     {
//       path: "/spare/sparePartIssuance",
//       element: <SparePartIssuance />,
//     },
//     {
//       path: "/spare/spareBudgetDashboard",
//       element: <SpareBudgetDashboard />,
//     },
//     {
//       path: "/spare/spareReports",
//       element: <SpareReports />,
//     },
//     {
//       path: "/spare/customizedDashboard",
//       element: <SpareCustomized />,
//     },
//   ];

//   const userRoutes = [
//     {
//       user_type: "Plant-Admin",
//       routes,
//     },
//     {
//       user_type: "Section-Admin",
//       routes,
//     },
//     {
//       user_type: "TL/HOSS",
//       routes,
//     },
//     {
//       user_type: "Operator",
//       routes,
//     },
//   ];
//   const filteredRoutes = userRoutes?.find(
//     (userRoute) => userRoute?.user_type === context?.user_type
//   );
//   const filteredItems = filteredMenuItems(
//     menuItems,
//     context?.user_type,
//     context?.tm_department
//   );
//   return (
//     <CommonRoutesContainer
//       routes={filteredRoutes?.routes}
//       sideBarProp={{ userData: context, filteredItems }}
//     />
//   );
// };

// export default Spare_Routes;

import { useContext, lazy, useMemo } from "react";

import RoutingContext from "../context/routing/RoutingContext";
import { filteredMenuItems } from "../Common/CommonRoutes/filteredMenuItems";
import { menuItems } from "./SpareSidebar/menuItems";
import CommonRoutesContainer from "../Common/CommonRoutes/CommonRoutesContainer";

const SpareKPI = lazy(() => import("./Pages/SpareKPI/SpareKPI"));
const SpareSheets = lazy(() => import("./Pages/SpareSheets/SpareSheets"));
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
const SpareReceivingDashboard = lazy(
  () => import("./Pages/SpareReceivingDashboard/SpareReceivingDashboard"),
);
const SpareMasterRegistration = lazy(
  () => import("./Pages/SpareMasterRegistration/SpareMasterRegistration"),
);
const SparePartIssuance = lazy(
  () => import("./Pages/SparePartIssuance/SparePartIssuance"),
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

const allusers = [
  //From PM
  "Admin",
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",
  //From spare toolRoom
  "HOSS",
  "Supervisor",
  "Office Person",
];

const routes = [
  { path: "/spare", element: <SpareKPI />, allowedRoles: allusers },
  { path: "/spare/requests", element: <SpareSheets />, allowedRoles: allusers },
  {
    path: "/spare/spareUserManagement",
    element: <SpareUserManagement />,
    allowedRoles: ["Plant-Admin", "Section-Admin", "HOSS", "Supervisor"],
    hasToolRoomFilter: true,
  },
  {
    path: "/spare/spareSearchButton",
    element: <SpareSearchButton />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/spareNewPartRequest",
    element: <SpareNewPartRequest />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/spareApprovalDashboard",
    element: <SpareApprovalDashboard />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/spareApprovalLogs",
    element: <SpareApprovalLogs />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/spareOrderingDashboard",
    element: <SpareOrderingDashboard />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/spareReceivingDashboard",
    element: <SpareReceivingDashboard />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/spareMasterRegistration",
    element: <SpareMasterRegistration />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/sparePartIssuance",
    element: <SparePartIssuance />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/spareBudgetDashboard",
    element: <SpareBudgetDashboard />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/spareReports",
    element: <SpareReports />,
    allowedRoles: allusers,
  },
  {
    path: "/spare/customizedDashboard",
    element: <SpareCustomized />,
    allowedRoles: ["Plant-Admin", "Section-Admin"],
  },
];

const ALLOWED_USER_TYPES = new Set([
  //From PM
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",

  //From spare toolRoom
  "HOSS",
  "Supervisor",
  "Office Person",
]);

const Spare_Routes = () => {
  const context = useContext(RoutingContext);

  const filteredRoutes = useMemo(
    () =>
      ALLOWED_USER_TYPES.has(context?.user_type)
        ? routes?.filter(
            (item) =>
              item?.allowedRoles?.includes(context?.user_type) &&
              (item?.hasToolRoomFilter
                ? context?.toolRoomPerson === "Yes"
                : true),
          )
        : undefined,
    [context?.user_type, context?.toolRoomPerson],
  );

  const sideBarProp = useMemo(
    () => ({
      userData: context,
      filteredItems: filteredMenuItems(
        menuItems,
        context?.user_type,
        context?.tm_department,
        context?.toolRoomPerson === "Yes",
      ),
    }),
    [context],
  );

  return (
    <CommonRoutesContainer routes={filteredRoutes} sideBarProp={sideBarProp} />
  );
};

export default Spare_Routes;
