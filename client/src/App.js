import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import PMTabdashboard from "./BM/Tabs/PMTabdashboard";
import BM_Routes from "./BM/BM_Routes";

import "./App.css";

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
    <div className="scrollable-tabs-container">
      <Tabs
        activeKey={activeKey}
        onSelect={handleTabSelect}
        id="uncontrolled-tab-example"
      >
        <Tab eventKey="pm" title="Preventive Maintenance">
          <div className="scrollable-content">
            <PMTabdashboard />
          </div>
        </Tab>

        <Tab eventKey="bm" title="Breakdown Maintenance">
          <div className="scrollable-content">
            <BM_Routes />
          </div>
        </Tab>

        

       
      </Tabs>
    </div>
  );
}

export default App;
