import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import PMTabdashboard from "./Tabs/PMTabdashboard";
import BM_Routes from "./BM/BM_Routes";

function Dashboard1() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState("");

  const handleTabSelect = (k) => {
    navigate(k);
  };

  useEffect(() => {
    // Extract the part of the path you want as the active key
    const pathParts = location.pathname.split("/");
    setActiveKey(pathParts[1]);
  }, [location.pathname]);

  return (
    <div className="scrollable-tabs-container">
      <Tabs
        activeKey={activeKey}
        onSelect={handleTabSelect}
        id="uncontrolled-tab-example"
      >
        <Tab eventKey="pm" title="Preventive Maintenance">
          <PMTabdashboard />
        </Tab>

        <Tab eventKey="bm" title="Breakdown Maintenance">
          <BM_Routes />
        </Tab>

        {/* Add more tabs as needed */}
      </Tabs>
    </div>
  );
}

export default Dashboard1;
