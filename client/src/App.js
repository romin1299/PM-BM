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

import React, { useEffect, useState } from "react";
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

const commonRoutes = [
  //For DENSO-INDIA
  {
    path: "/",
    element: <OperatorDashboard />,
  },
  //For DENSO-HARYANA
  // {
  //   path: "/",
  //   element: <MainPageComponent />,
  // },
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
        path: ":machine_code",
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

const tabs = [
  {
    name: "PM",
    keyUrl: "pm",
    icon: <BsWrench />,
    dashboardAndRoutes: <PMTabdashboard commonRoutes={commonRoutes} />,
  },
  {
    name: "BM",
    keyUrl: "bm",
    icon: <BsHammer />,
    dashboardAndRoutes: <BM_Routes commonRoutes={commonRoutes} />,
  },
  {
    name: "MTD KPI",
    keyUrl: "kpi",
    icon: <BsHammer />,
    dashboardAndRoutes: <KPI_Routes commonRoutes={commonRoutes} />,
  },
];

function App() {
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

  return (
    <div>
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
            <div
              variant="pills"
              style={{ background: "#ffffff !important" }}
              title={
                <>
                  <img src={denso_logo} alt="" className="bg-white" />
                </>
              }
            >
              {/* Content of the first tab */}
            </div>

            {tabs?.map((item) => (
              <Tab
                variant="pills"
                eventKey={item?.keyUrl}
                title={
                  <>
                    {item?.icon} &nbsp;&nbsp; <b>{item?.name}</b>
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
        <Col lg={1} md={1} sm={1} className="d-flex justify-content-end">
          <RightNavbar />
        </Col>
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
