// // import React, { useEffect, useState } from "react";
// // import { useNavigate, useLocation } from "react-router-dom";
// // import { Tabs, Tab } from "react-bootstrap";
// // import "bootstrap/dist/css/bootstrap.min.css";
// // import PMTabdashboard from "./BM/Tabs/PMTabdashboard";
// // import BM_Routes from "./BM/BM_Routes";
// // import { BsWrench, BsHammer } from 'react-icons/bs';

// // import "./App.css";

// // function App() {
// //   const navigate = useNavigate();
// //   const location = useLocation();
// //   const [activeKey, setActiveKey] = useState("");

// //   const handleTabSelect = (k) => {
// //     navigate(k);
// //   };

// //   useEffect(() => {
// //     // Extract the part of the path you want as the active key
// //     const pathParts = location.pathname.split("/");

// //     if (pathParts[1].trim().length === 0) {
// //       navigate("pm");
// //     } else {
// //       setActiveKey(pathParts[1]);
// //     }
// //   }, [location.pathname]);

// //   return (
// //     <div className="scrollable-tabs-container">
// //       <Tabs
// //         activeKey={activeKey}
// //         onSelect={handleTabSelect}
// //         id="uncontrolled-tab-example"
// //       >
// //         <Tab variant="pills" eventKey="pm" title={<><BsWrench /> &nbsp;&nbsp; Preventive Maintenance</>}>
// //           <div className="scrollable-content">

// //             <PMTabdashboard />
// //           </div>
// //         </Tab>

// //         <Tab eventKey="bm" title={<><BsHammer /> &nbsp;&nbsp; Breakdown Maintenance</>}>
// //           <div className="scrollable-content">
// //             <BM_Routes />
// //           </div>
// //         </Tab>

// //       </Tabs>
// //     </div>
// //   );
// // }

// // export default App;

// import React, { useEffect, useState, useContext, Suspense } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Tabs, Tab, Row, Col } from "react-bootstrap";
// import "bootstrap/dist/css/bootstrap.min.css";
// import PMTabdashboard from "./BM/Tabs/PMTabdashboard";
// import BM_Routes from "./BM/BM_Routes";
// // import { BsWrench, BsHammer } from "react-icons/bs";
// import { denso_logo } from "./modules/LoginModules";

// import MachineHistoryComponent from "./Common/Machine/MachineHistoryComponent";
// import MachineDocument from "./Common/Machine/MachineDocument";
// import AttachmentFormateTable from "./Common/Machine/AttachmentFormateTable";
// import HistoryFormateTable from "./Common/Machine/HistoryFormateTable";

// import MasterLogMainDashboard from "./Common/MasterLog/MasterLogMainDashboard";
// import Profile from "./pages/Profile";
// import ViewChecksheet from "./pages/Section/Checksheet/ViewChecksheet";

// import "./App.css";
// import RightNavbar from "./components/RightNavbar/RightNavbar";

// import KPI_Routes from "./KPI_Tab/KPI_Routes";
// import MainPageComponent from "./KPI_Tab/MainPage/MainPageComponent";
// // import {
// //   NAME_OF_THE_COMPANY,
// //   LIST_OF_COMPANY,
// // } from "./ConditionsForDNINandDNHA/ConditionBasedDisplay";
// import RoutingContext from "./context/routing/RoutingContext";
// // import RequestSheetMainDashboard from "./BM/RequestSheet/RequestSheetMainDashboard";
// import PM from "./static/Icons/PM_history_4.png";
// import BM from "./static/Icons/BM_History_1.png";
// import CM from "./static/Icons/CM.png";
// import MTD_KPI from "./static/Icons/MTD_KPI.png";
// import ACTIVITY_Cal from "./static/Icons/ACTIVITY_CAL.png";
// import CM_Routes from "./CM/CM_Routes";
// import ActivityRoutes from "./CM/Pages/ActivityCalendar/ActivityRoutes";
// import { clearLocalStorage } from "./BM/Component/GlobalDataDisplayOrHandle";

// import Spare_Routes from "./Spare/Spare_Routes";
// import SparePageLoading from "./Spare/Component/SparePageLoading";

// function App() {
//   //DENSO-HARYANA
//   // if (NAME_OF_THE_COMPANY === LIST_OF_COMPANY[0]) {
//   //   tabs.push({
//   //     name: "MTD KPI",
//   //     keyUrl: "kpi",
//   //     icon: <BsHammer />,
//   //     dashboardAndRoutes: <KPI_Routes commonRoutes={commonRoutes} />,
//   //   });
//   // }
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeKey, setActiveKey] = useState(localStorage.getItem("activeKey"));

//   const handleTabSelect = (k) => {
//     navigate(k);
//     localStorage.setItem("activeKey", k);
//     setActiveKey(k);
//     clearLocalStorage();
//   };

//   useEffect(() => {
//     // Extract the part of the path you want as the active key
//     const pathParts = location.pathname.split("/");

//     if (!pathParts[1]) {
//       localStorage.setItem("activeKey", tabs?.[0]?.keyUrl);
//       navigate(tabs?.[0]?.keyUrl);
//       setActiveKey(tabs?.[0]?.keyUrl);
//       return;
//     }

//     //if user directly search the page using url
//     if (
//       // pathParts?.includes(tabs?.[0]?.keyUrl) ||
//       // pathParts?.includes(tabs?.[1]?.keyUrl)
//       tabs?.filter((item) => item?.keyUrl === pathParts[1])?.length > 0
//     ) {
//       localStorage.setItem("activeKey", pathParts[1]);
//       setActiveKey(pathParts[1]);
//     }
//     //by default if activeKey is not there
//     else if (!localStorage.getItem("activeKey")) {
//       localStorage.setItem("activeKey", tabs?.[0]?.keyUrl);
//       navigate(tabs?.[0]?.keyUrl);
//       setActiveKey(tabs?.[0]?.keyUrl);

//       // localStorage.setItem("activeKey", tabs?.[2]?.keyUrl);
//       // navigate(tabs?.[2]?.keyUrl);
//       // setActiveKey(tabs?.[2]?.keyUrl);
//     }

//     // if (pathParts[1].trim().length === 0) {
//     //   navigate("pm");
//     // } else {
//     //   setActiveKey(pathParts[1]);
//     // }
//   }, [location.pathname]);

//   const loggedUser = useContext(RoutingContext);
//   let mainRouteForCompanyBased = [];
//   if (
//     // NAME_OF_THE_COMPANY === LIST_OF_COMPANY?.[0] &&
//     loggedUser?.tm_department === "MTD" ||
//     loggedUser?.user_type === "Operator"
//   ) {
//     // For DENSO-HARYANA
//     mainRouteForCompanyBased = [
//       {
//         path: "/kpi",
//         element: <MainPageComponent />,
//       },
//     ];
//   }
//   //  else {
//   //   mainRouteForCompanyBased = [
//   //     {
//   //       path: "/",
//   //       element: <RequestSheetMainDashboard />,
//   //     },
//   //   ];
//   // }

//   let commonRoutes = [
//     ...mainRouteForCompanyBased,
//     {
//       path: "/profile",
//       element: <Profile />,
//     },
//     {
//       path: "/viewCheckSheet",
//       element: <ViewChecksheet />,
//     },
//     {
//       path: "/master-log",
//       element: <MasterLogMainDashboard />,
//     },
//     {
//       path: "/machine-history",
//       element: <MachineHistoryComponent />,
//       children: [
//         {
//           path: ":machine_code/:selectedYear",
//           element: <MachineHistoryComponent />,
//         },
//         {
//           path: "machine-document/:machine_code",
//           element: <MachineDocument />,
//         },
//         {
//           path: "attachment-formate/:page/:machine_code",
//           element: <AttachmentFormateTable />,
//         },
//         {
//           path: "history-formate/:page/:machine_code",
//           element: <HistoryFormateTable />,
//         },
//       ],
//     },
//   ];

//   let displayKPIDashboard = [];
//   if (
//     // NAME_OF_THE_COMPANY === LIST_OF_COMPANY?.[0] &&
//     loggedUser?.tm_department === "MTD" ||
//     loggedUser?.user_type === "Operator"
//   ) {
//     displayKPIDashboard = [
//       {
//         name: "MTD KPI",
//         keyUrl: "kpi",
//         icon: MTD_KPI,
//         dashboardAndRoutes: (
//           <KPI_Routes commonRoutes={commonRoutes} loggedUser={loggedUser} />
//         ),
//       },
//     ];
//   }

//   let tabs = [
//     {
//       name: "PM",
//       keyUrl: "pm",
//       icon: PM,
//       dashboardAndRoutes: <PMTabdashboard commonRoutes={commonRoutes} />,
//     },
//     {
//       name: "BM",
//       keyUrl: "bm",
//       icon: BM,
//       dashboardAndRoutes: <BM_Routes commonRoutes={commonRoutes} />,
//     },
//     {
//       name: "CM",
//       keyUrl: "cm",
//       icon: CM,
//       dashboardAndRoutes: <CM_Routes commonRoutes={commonRoutes} />,
//     },
//     ...displayKPIDashboard,
//     {
//       name: "ACTIVITY CALENDAR",
//       keyUrl: "activityCal",
//       icon: ACTIVITY_Cal,
//       dashboardAndRoutes: (
//         <ActivityRoutes commonRoutes={commonRoutes} loggedUser={loggedUser} />
//       ),
//     },
//     {
//       name: "Spare",
//       keyUrl: "spare",
//       icon: ACTIVITY_Cal,
//       dashboardAndRoutes: (
//         <Suspense fallback={<SparePageLoading />}>
//           <Spare_Routes commonRoutes={commonRoutes} loggedUser={loggedUser} />
//         </Suspense>
//       ),
//     },
//     // {
//     //   name: "Spare",
//     //   keyUrl: "spare",
//     //   icon: ACTIVITY_Cal,
//     //   dashboardAndRoutes: (
//     //     <Spare_Routes commonRoutes={commonRoutes} loggedUser={loggedUser} />
//     //   ),
//     // },
//     // {
//     //   name: "MTD KPI",
//     //   keyUrl: "kpi",
//     //   icon: <BsHammer />,
//     //   dashboardAndRoutes: <KPI_Routes commonRoutes={commonRoutes} />,
//     // },
//   ];

//   return (
//     <div>
//       <Row>
//         <Col lg={2} md={2} sm={1}>
//           <img
//             src={denso_logo}
//             alt=""
//             className="bg-white"
//             height={50}
//             width={150}
//           />
//         </Col>
//         <Col
//           lg={8}
//           md={8}
//           sm={1}
//           className="d-flex align-items-center justify-content-center"
//         >
//           <h4>
//             <b>Integrated Maintenance Operation System</b>
//           </h4>
//         </Col>
//         <Col lg={2} md={2} sm={1} className="d-flex justify-content-end">
//           <RightNavbar />
//         </Col>
//       </Row>
//       <Row style={{ background: "#ddebf9" }}>
//         <Col
//           lg={11}
//           md={11}
//           sm={11}
//           className="scrollable-column pb-2"
//           style={{ paddingLeft: "0.5rem" }}
//         >
//           <Tabs
//             activeKey={activeKey}
//             onSelect={handleTabSelect}
//             id="uncontrolled-tab-example"
//           >
//             {/* <div
//               variant="pills"
//               style={{ background: "#ffffff !important" }}
//               title={
//                 <>
//                   <img src={denso_logo} alt="" className="bg-white" />
//                 </>
//               }
//             >
//             </div> */}

//             {tabs?.map((item) => (
//               <Tab
//                 variant="pills"
//                 eventKey={item?.keyUrl}
//                 title={
//                   <>
//                     <img
//                       src={item?.icon}
//                       alt=""
//                       srcset=""
//                       height={25}
//                       width={25}
//                     />{" "}
//                     &nbsp;&nbsp; <b>{item?.name}</b>
//                   </>
//                 }
//               ></Tab>
//             ))}
//             {/* <Tab
//               variant="pills"
//               eventKey="pm"
//               title={
//                 <>
//                   <BsWrench /> &nbsp;&nbsp; <b>PM</b>
//                 </>
//               }
//             ></Tab>
//             <Tab
//               eventKey="bm"
//               title={
//                 <>
//                   <BsHammer /> &nbsp;&nbsp; <b>BM</b>
//                 </>
//               }
//             >
//               Content of the second tab
//             </Tab> */}
//           </Tabs>
//         </Col>
//         {/* <Col lg={1} md={1} sm={1} className="d-flex justify-content-end">
//           <RightNavbar />
//         </Col> */}
//       </Row>
//       <Row>
//         {/* Content of both tabs */}
//         <div className="scrollable-content">
//           {tabs?.find((item) => item?.keyUrl === activeKey)?.dashboardAndRoutes}
//           {/* {activeKey === tabs?.[0]?.keyUrl && (
//             <PMTabdashboard commonRoutes={commonRoutes} />
//           )}
//           {activeKey === tabs?.[1]?.keyUrl && (
//             <BM_Routes commonRoutes={commonRoutes} />
//           )} */}

//           {/* <BM_Routes /> */}
//         </div>
//       </Row>
//     </div>
//   );
// }

// export default App;

import React, {
  useEffect,
  useState,
  useContext,
  Suspense,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, Tab, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import PMTabdashboard from "./BM/Tabs/PMTabdashboard";
import BM_Routes from "./BM/BM_Routes";
import CM_Routes from "./CM/CM_Routes";
import ActivityRoutes from "./CM/Pages/ActivityCalendar/ActivityRoutes";
import KPI_Routes from "./KPI_Tab/KPI_Routes";
import MainPageComponent from "./KPI_Tab/MainPage/MainPageComponent";

import Profile from "./pages/Profile";
import ViewChecksheet from "./pages/Section/Checksheet/ViewChecksheet";

import MachineHistoryComponent from "./Common/Machine/MachineHistoryComponent";
import MachineDocument from "./Common/Machine/MachineDocument";
import AttachmentFormateTable from "./Common/Machine/AttachmentFormateTable";
import HistoryFormateTable from "./Common/Machine/HistoryFormateTable";
import MasterLogMainDashboard from "./Common/MasterLog/MasterLogMainDashboard";

import RightNavbar from "./components/RightNavbar/RightNavbar";
import RoutingContext from "./context/routing/RoutingContext";

import { denso_logo } from "./modules/LoginModules";
import { clearLocalStorage } from "./BM/Component/GlobalDataDisplayOrHandle";

import PM from "./static/Icons/PM_history_4.png";
import BM from "./static/Icons/BM_History_1.png";
import CM from "./static/Icons/CM.png";
import MTD_KPI from "./static/Icons/MTD_KPI.png";
import ACTIVITY_Cal from "./static/Icons/ACTIVITY_CAL.png";

import Spare_Routes from "./Spare/Spare_Routes";
import SparePageLoading from "./Spare/Component/SparePageLoading";

const SubComponent = ({ tabs, loggedUser, commonRoutePaths }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeKey, setActiveKey] = useState(
    localStorage.getItem("activeKey") || "pm",
  );

  useEffect(() => {
    const pathParts = location.pathname.split("/");
    const mainPath = pathParts[1];

    const isToolRoomUser = loggedUser?.toolRoomPerson === "Yes";

    if (isToolRoomUser) {
      if (mainPath !== "spare") {
        navigate("/spare", { replace: true });
        return;
      }

      setActiveKey("spare");
      return;
    }

    if (!mainPath) {
      navigate(`/${activeKey}`, { replace: true });
      return;
    }

    const isValid = tabs.some((t) => t.keyUrl === mainPath);

    if (isValid) {
      setActiveKey(mainPath);
      localStorage.setItem("activeKey", mainPath);
    } else {
      if (!commonRoutePaths.includes(mainPath))
        navigate(`/${activeKey}`, { replace: true });
    }
  }, [
    location.pathname,
    tabs,
    activeKey,
    navigate,
    loggedUser,
    commonRoutePaths,
  ]);

  const handleTabSelect = (key) => {
    if (key === activeKey) return;
    setActiveKey(key);
    localStorage.setItem("activeKey", key);
    navigate(key);
    clearLocalStorage();
  };

  const activeComponent = useMemo(
    () => tabs.find((t) => t.keyUrl === activeKey)?.component,
    [tabs, activeKey],
  );

  return (
    <div>
      <Row>
        <Col lg={2}>
          <img src={denso_logo} alt="" height={50} width={150} />
        </Col>
        <Col
          lg={8}
          className="d-flex justify-content-center align-items-center"
        >
          <h4>
            <b>Integrated Maintenance Operation System</b>
          </h4>
        </Col>
        <Col lg={2} className="d-flex justify-content-end">
          <RightNavbar />
        </Col>
      </Row>

      <Row style={{ background: "#ddebf9" }}>
        <Col className="scrollable-column pb-2">
          <Tabs activeKey={activeKey} onSelect={handleTabSelect}>
            {tabs.map((tab) => (
              <Tab
                key={tab.keyUrl}
                eventKey={tab.keyUrl}
                title={
                  <>
                    <img src={tab.icon} alt="" height={25} width={25} />
                    &nbsp;&nbsp;<b>{tab.name}</b>
                  </>
                }
              />
            ))}
          </Tabs>
        </Col>
      </Row>

      <Row>
        <div className="scrollable-content">{activeComponent}</div>
      </Row>
    </div>
  );
};

function App() {
  const loggedUser = useContext(RoutingContext);
  const [isLoading, setIsLoading] = useState(true);

  const isKPIUser = useMemo(
    () =>
      loggedUser?.tm_department === "MTD" ||
      loggedUser?.user_type === "Operator",
    [loggedUser],
  );

  const commonRoutes = useMemo(
    () => [
      ...(isKPIUser ? [{ path: "/kpi", element: <MainPageComponent /> }] : []),
      { path: "/profile", element: <Profile /> },
      { path: "/viewCheckSheet", element: <ViewChecksheet /> },
      { path: "/master-log", element: <MasterLogMainDashboard /> },
      {
        path: "/machine-history",
        element: <MachineHistoryComponent />,
        children: [
          {
            path: ":machine_code/:selectedYear",
            element: <MachineHistoryComponent />,
          },
          {
            path: "machine-document/:machine_code",
            element: <MachineDocument />,
          },
          {
            path: "attachment-formate/:page/:machine_code",
            element: <AttachmentFormateTable />,
          },
          {
            path: "history-formate/:page/:machine_code",
            element: <HistoryFormateTable />,
          },
        ],
      },
    ],
    [isKPIUser],
  );

  const tabs = useMemo(() => {
    const spareTab = {
      name: "Spare",
      keyUrl: "spare",
      icon: ACTIVITY_Cal,
      component: (
        <Suspense fallback={<SparePageLoading />}>
          <Spare_Routes loggedUser={loggedUser} />
        </Suspense>
      ),
    };

    if (loggedUser?.toolRoomPerson === "Yes") {
      setIsLoading(false);
      return [spareTab];
    }

    const baseTabs = [
      {
        name: "PM",
        keyUrl: "pm",
        icon: PM,
        component: <PMTabdashboard commonRoutes={commonRoutes} />,
      },
      {
        name: "BM",
        keyUrl: "bm",
        icon: BM,
        component: <BM_Routes commonRoutes={commonRoutes} />,
      },
      {
        name: "CM",
        keyUrl: "cm",
        icon: CM,
        component: <CM_Routes commonRoutes={commonRoutes} />,
      },
    ];

    if (isKPIUser) {
      baseTabs.push({
        name: "MTD KPI",
        keyUrl: "kpi",
        icon: MTD_KPI,
        component: (
          <KPI_Routes commonRoutes={commonRoutes} loggedUser={loggedUser} />
        ),
      });
    }

    baseTabs.push(
      {
        name: "ACTIVITY CALENDAR",
        keyUrl: "activityCal",
        icon: ACTIVITY_Cal,
        component: (
          <ActivityRoutes commonRoutes={commonRoutes} loggedUser={loggedUser} />
        ),
      },
      spareTab,
    );

    setIsLoading(false);
    return baseTabs;
  }, [loggedUser, commonRoutes, isKPIUser]);

  const commonRoutePaths = useMemo(
    () => commonRoutes?.map((r) => r.path.replace(/^\//, "")) ?? [],
    [commonRoutes],
  );

  if (isLoading) return <h5>Loading....</h5>;
  return (
    <SubComponent
      tabs={tabs}
      loggedUser={loggedUser}
      commonRoutePaths={commonRoutePaths}
    />
  );
}

export default App;
