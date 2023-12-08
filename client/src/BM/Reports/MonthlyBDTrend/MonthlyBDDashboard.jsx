import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box } from "@mui/material";
import MonthlyBDTrendChart from "./MonthlyBDTrendChart";
import YearlyTrendChart from "./YearlyTrendChart";
import MajorBDCount from "./MajorBDCount";

import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import SectionsDropdown from "./SectionsDropdown";
import FilterSwitchButtons from "./FilterSwitchButtons";

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const MonthlyBDTDashboard = () => {
  const [currentTabView, setCurrentTabView] = React.useState(0);
  const [sectionId, setSectionId] = React.useState("");
  const [filter, setFilter] = React.useState("hourly");
  const currentTabViewName = currentTabView === 0 ? "Plant" : "Section";

  // const context = useContext(RoutingContext);
  // console.log("context:", context);

  const handleChange = (event, newValue) => {
    setCurrentTabView(newValue);
  };

  return (
    <Container fluid>
      <Box className="cell p-3 mt-3">
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Box
            sx={{
              position: "absolute",
              right: "1rem",
              top: currentTabView === 1 ? "11px" : "20px",
              zIndex: "1",
              display: "flex",
              alignItems: "center",
            }}
          >
            {currentTabView === 1 && (
              <SectionsDropdown
                sectionId={sectionId}
                setSectionId={setSectionId}
              />
            )}
            <FilterSwitchButtons
              filter={filter}
              setFilter={setFilter}
              currentTabViewName={currentTabViewName}
            />
          </Box>
          <Tabs
            value={currentTabView}
            onChange={handleChange}
            aria-label="tabs-switch"
          >
            <Tab label="Plant" {...a11yProps(0)} />
            <Tab label="Section" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <CustomTabPanel value={currentTabView} index={0}></CustomTabPanel>

        <CustomTabPanel value={currentTabView} index={1}>
          {/* <Row>
            <Col>
              <SectionsDropdown
                sectionId={sectionId}
                setSectionId={setSectionId}
              />
            </Col>
          </Row> */}
        </CustomTabPanel>

        {/* <Row>
          <Col>
            <FilterSwitchButtons
              filter={filter}
              setFilter={setFilter}
              currentTabViewName={currentTabViewName}
            />
          </Col>
        </Row> */}

        <Row className="mt-3">
          <Col md={12} lg={9}>
            <MonthlyBDTrendChart
              filter={filter}
              setFilter={setFilter}
              currentTabViewName={currentTabViewName}
              sectionId={sectionId}
            />
          </Col>
          <Col md={12} lg={3}>
            <YearlyTrendChart
              filter={filter}
              setFilter={setFilter}
              currentTabViewName={currentTabViewName}
              sectionId={sectionId}
            />
          </Col>
        </Row>
        <MajorBDCount
          filter={filter}
          setFilter={setFilter}
          currentTabViewName={currentTabViewName}
          sectionId={sectionId}
        />
      </Box>
    </Container>
  );
};

export default MonthlyBDTDashboard;
