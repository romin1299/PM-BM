// import React, { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Tabs, Tab } from "react-bootstrap";
// import "bootstrap/dist/css/bootstrap.min.css";
// import PMTabdashboard from "./BM/Tabs/PMTabdashboard";
// import BM_Routes from "./BM/BM_Routes";
// import { BsWrench, BsHammer } from 'react-icons/bs';

// import "./App.css";

// function App() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeKey, setActiveKey] = useState("");

//   const handleTabSelect = (k) => {
//     navigate(k);
//   };

//   useEffect(() => {
//     // Extract the part of the path you want as the active key
//     const pathParts = location.pathname.split("/");

//     if (pathParts[1].trim().length === 0) {
//       navigate("pm");
//     } else {
//       setActiveKey(pathParts[1]);
//     }
//   }, [location.pathname]);

//   return (
//     <div className="scrollable-tabs-container">
//       <Tabs
//         activeKey={activeKey}
//         onSelect={handleTabSelect}
//         id="uncontrolled-tab-example"
//       >
//         <Tab variant="pills" eventKey="pm" title={<><BsWrench /> &nbsp;&nbsp; Preventive Maintenance</>}>
//           <div className="scrollable-content">

//             <PMTabdashboard />
//           </div>
//         </Tab>

//         <Tab eventKey="bm" title={<><BsHammer /> &nbsp;&nbsp; Breakdown Maintenance</>}>
//           <div className="scrollable-content">
//             <BM_Routes />
//           </div>
//         </Tab>

//       </Tabs>
//     </div>
//   );
// }

// export default App;

import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, Tab, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import PMTabdashboard from "./BM/Tabs/PMTabdashboard";
import BM_Routes from "./BM/BM_Routes";
import { BsWrench, BsHammer } from "react-icons/bs";
import { denso_logo } from "./modules/LoginModules";

import MachineHistoryComponent from "./Common/Machine/MachineHistoryComponent";
import MachineDocument from "./Common/Machine/MachineDocument";
import AttachmentFormateTable from "./Common/Machine/AttachmentFormateTable";
import HistoryFormateTable from "./Common/Machine/HistoryFormateTable";

import MasterLogMainDashboard from "./Common/MasterLog/MasterLogMainDashboard";
import Profile from "./pages/Profile";
import ViewChecksheet from "./pages/Section/Checksheet/ViewChecksheet";

import "./App.css";
import RightNavbar from "./components/RightNavbar/RightNavbar";

import KPI_Routes from "./KPI_Tab/KPI_Routes";
import MainPageComponent from "./KPI_Tab/MainPage/MainPageComponent";
import OperatorDashboard from "./pages/Operator/OperatorDashboard";
import {
  NAME_OF_THE_COMPANY,
  LIST_OF_COMPANY,
} from "./ConditionsForDNINandDNHA/ConditionBasedDisplay";
import RoutingContext from "./context/routing/RoutingContext";
import RequestSheetMainDashboard from "./BM/RequestSheet/RequestSheetMainDashboard";
import PM from "./static/Icons/PM_history_4.png";
import BM from "./static/Icons/BM_History_1.png";
import CM from "./static/Icons/CM.png";
import MTD_KPI from "./static/Icons/MTD_KPI.png";
import CM_Routes from "./CM/CM_Routes";

function App() {
  //DENSO-HARYANA
  // if (NAME_OF_THE_COMPANY === LIST_OF_COMPANY[0]) {
  //   tabs.push({
  //     name: "MTD KPI",
  //     keyUrl: "kpi",
  //     icon: <BsHammer />,
  //     dashboardAndRoutes: <KPI_Routes commonRoutes={commonRoutes} />,
  //   });
  // }
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState(localStorage.getItem("activeKey"));

  const handleTabSelect = (k) => {
    navigate(k);
    localStorage.setItem("activeKey", k);
    setActiveKey(k);
  };

  useEffect(() => {
    // Extract the part of the path you want as the active key
    const pathParts = location.pathname.split("/");

    if (!pathParts[1]) {
      localStorage.setItem("activeKey", tabs?.[0]?.keyUrl);
      navigate(tabs?.[0]?.keyUrl);
      setActiveKey(tabs?.[0]?.keyUrl);
      return;
    }

    //if user directly search the page using url
    if (
      // pathParts?.includes(tabs?.[0]?.keyUrl) ||
      // pathParts?.includes(tabs?.[1]?.keyUrl)
      tabs?.filter((item) => item?.keyUrl === pathParts[1])?.length > 0
    ) {
      localStorage.setItem("activeKey", pathParts[1]);
      setActiveKey(pathParts[1]);
    }
    //by default if activeKey is not there
    else if (!localStorage.getItem("activeKey")) {
      localStorage.setItem("activeKey", tabs?.[0]?.keyUrl);
      navigate(tabs?.[0]?.keyUrl);
      setActiveKey(tabs?.[0]?.keyUrl);

      // localStorage.setItem("activeKey", tabs?.[2]?.keyUrl);
      // navigate(tabs?.[2]?.keyUrl);
      // setActiveKey(tabs?.[2]?.keyUrl);
    }

    // if (pathParts[1].trim().length === 0) {
    //   navigate("pm");
    // } else {
    //   setActiveKey(pathParts[1]);
    // }
  }, [location.pathname]);

  const loggedUser = useContext(RoutingContext);
  let mainRouteForCompanyBased = [];
  if (
    // NAME_OF_THE_COMPANY === LIST_OF_COMPANY?.[0] &&
    loggedUser?.tm_department === "MTD" ||
    loggedUser?.user_type === "Operator"
  ) {
    // For DENSO-HARYANA
    mainRouteForCompanyBased = [
      {
        path: "/kpi",
        element: <MainPageComponent />,
      },
    ];
  }
  //  else {
  //   mainRouteForCompanyBased = [
  //     {
  //       path: "/",
  //       element: <RequestSheetMainDashboard />,
  //     },
  //   ];
  // }

  let commonRoutes = [
    ...mainRouteForCompanyBased,
    {
      path: "/profile",
      element: <Profile />,
    },
    {
      path: "/viewCheckSheet",
      element: <ViewChecksheet />,
    },
    {
      path: "/master-log",
      element: <MasterLogMainDashboard />,
    },
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
  ];

  let displayKPIDashboard = [];
  if (
    // NAME_OF_THE_COMPANY === LIST_OF_COMPANY?.[0] &&
    loggedUser?.tm_department === "MTD" ||
    loggedUser?.user_type === "Operator"
  ) {
    displayKPIDashboard = [
      {
        name: "MTD KPI",
        keyUrl: "kpi",
        icon: MTD_KPI,
        dashboardAndRoutes: (
          <KPI_Routes commonRoutes={commonRoutes} loggedUser={loggedUser} />
        ),
      },
    ];
  }

  let tabs = [
    {
      name: "PM",
      keyUrl: "pm",
      icon: PM,
      dashboardAndRoutes: <PMTabdashboard commonRoutes={commonRoutes} />,
    },
    {
      name: "BM",
      keyUrl: "bm",
      icon: BM,
      dashboardAndRoutes: <BM_Routes commonRoutes={commonRoutes} />,
    },
    {
      name: "CM",
      keyUrl: "cm",
      icon: CM,
      dashboardAndRoutes: <CM_Routes commonRoutes={commonRoutes} />,
    },
    ...displayKPIDashboard,
    // {
    //   name: "MTD KPI",
    //   keyUrl: "kpi",
    //   icon: <BsHammer />,
    //   dashboardAndRoutes: <KPI_Routes commonRoutes={commonRoutes} />,
    // },
  ];

  return (
    <div>
      <Row>
        <Col lg={2} md={2} sm={1}>
          <img
            src={denso_logo}
            alt=""
            className="bg-white"
            height={50}
            width={150}
          />
        </Col>
        <Col
          lg={8}
          md={8}
          sm={1}
          className="d-flex align-items-center justify-content-center"
        >
          <h4>
            <b>Integrated Maintenance Operation System</b>
          </h4>
        </Col>
        <Col lg={2} md={2} sm={1} className="d-flex justify-content-end">
          <RightNavbar />
        </Col>
      </Row>
      <Row style={{ background: "#ddebf9" }}>
        <Col
          lg={11}
          md={11}
          sm={11}
          className="scrollable-column pb-2"
          style={{ paddingLeft: "0.5rem" }}
        >
          <Tabs
            activeKey={activeKey}
            onSelect={handleTabSelect}
            id="uncontrolled-tab-example"
          >
            {/* <div
              variant="pills"
              style={{ background: "#ffffff !important" }}
              title={
                <>
                  <img src={denso_logo} alt="" className="bg-white" />
                </>
              }
            >
            </div> */}

            {tabs?.map((item) => (
              <Tab
                variant="pills"
                eventKey={item?.keyUrl}
                title={
                  <>
                    <img
                      src={item?.icon}
                      alt=""
                      srcset=""
                      height={25}
                      width={25}
                    />{" "}
                    &nbsp;&nbsp; <b>{item?.name}</b>
                  </>
                }
              ></Tab>
            ))}
            {/* <Tab
              variant="pills"
              eventKey="pm"
              title={
                <>
                  <BsWrench /> &nbsp;&nbsp; <b>PM</b>
                </>
              }
            ></Tab>
            <Tab
              eventKey="bm"
              title={
                <>
                  <BsHammer /> &nbsp;&nbsp; <b>BM</b>
                </>
              }
            >
              Content of the second tab
            </Tab> */}
          </Tabs>
        </Col>
        {/* <Col lg={1} md={1} sm={1} className="d-flex justify-content-end">
          <RightNavbar />
        </Col> */}
      </Row>
      <Row>
        {/* Content of both tabs */}
        <div className="scrollable-content">
          {tabs?.find((item) => item?.keyUrl === activeKey)?.dashboardAndRoutes}
          {/* {activeKey === tabs?.[0]?.keyUrl && (
            <PMTabdashboard commonRoutes={commonRoutes} />
          )}
          {activeKey === tabs?.[1]?.keyUrl && (
            <BM_Routes commonRoutes={commonRoutes} />
          )} */}

          {/* <BM_Routes /> */}
        </div>
      </Row>
    </div>
  );
}

export default App;
