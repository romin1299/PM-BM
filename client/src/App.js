import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import PMTabdashboard from './Tabs/PMTabdashboard';
import BMTabDashboard from './Tabs/BMTabDashboard'
// ... (import other components as needed)

function Dashboard1() {
  return (
    <div className="scrollable-tabs-container">
      <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
        <Tab eventKey={1} title="Preventive Maintenance">
        <PMTabdashboard />
        </Tab>
        <Tab eventKey={2} title="Breakdown Maintenance">
          <BMTabDashboard />
        </Tab>
        
        {/* Add more tabs as needed */}
      </Tabs>
    </div>
  );
}

export default Dashboard1;
