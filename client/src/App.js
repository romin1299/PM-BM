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

import "./App.css";
import RightNavbar from "./components/RightNavbar/RightNavbar";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState("");

  const handleTabSelect = (k) => {
    navigate(k);
  };

  useEffect(() => {
    // Extract the part of the path you want as the active key
    const pathParts = location.pathname.split("/");

    if (pathParts[1].trim().length === 0) {
      navigate("pm");
    } else {
      setActiveKey(pathParts[1]);
    }
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
            <Tab
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
              {/* Content of the second tab */}
            </Tab>
          </Tabs>
        </Col>
        <Col lg={1} md={1} sm={1} className="d-flex justify-content-end">
          <RightNavbar />
        </Col>
      </Row>
      <Row>
        {/* Content of both tabs */}
        <div className="scrollable-content">
          {activeKey === "pm" && <PMTabdashboard />}
          {activeKey === "bm" && <BM_Routes />}
        </div>
      </Row>
    </div>
  );
}

export default App;
