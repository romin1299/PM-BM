import React from "react";
import { Tabs, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import PMTabdashboard from "./BM/Tabs/PMTabdashboard";
// import BMTabDashboard from './Tabs/BMTabDashboard'
import RequestSheet from "./BM/Tabs/RequestSheet/MainRequestSheet";

// ... (import other components as needed)

function Dashboard1() {
  return (
    <div className="scrollable-tabs-container">
      <Tabs
        defaultActiveKey={2}
        id="uncontrolled-tab-example"
        className="overflow-hidden"
      >
        <Tab eventKey={1} title="Preventive Maintenance">
          <div className="scrollable-content">
            <PMTabdashboard />
          </div>
        </Tab>

        <Tab eventKey={2} title="Breakdown Maintenance">
          <div className="scrollable-content">
            <RequestSheet />
          </div>
        </Tab>

        {/* Add more tabs as needed */}
      </Tabs>
    </div>
  );
}

export default Dashboard1;
