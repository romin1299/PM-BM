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

const MonthlyBDTDashboard = () => {
  const [currentTabView, setCurrentTabView] = React.useState(0);
  const [sectionId, setSectionId] = React.useState("");
  const [filter, setFilter] = React.useState("hourly");
  const currentTabViewName = currentTabView === 0 ? "Plant" : "Section";

  // const context = useContext(RoutingContext);
  // console.log("context:", context);

  function a11yProps(index) {
    const active = index === currentTabView;
    return {
      sx: {
        bgcolor: active ? "primary.main" : "",
        color: active ? "white" : "",
        borderRadius: "5px",
      },
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  const handleChange = (event, newValue) => {
    setCurrentTabView(newValue);
  };

  return (
    <Container fluid style={{ paddingBottom: "3rem" }}>
      <Box className="row cell p-3 pt-2 pb-2 mt-3 g-0">
        <Box
          className="col"
          sx={{ display: "flex", alignItems: "center" }}
          // sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tabs
            value={currentTabView}
            onChange={handleChange}
            indicatorColor="transparent"
            textColor="inherit"
            aria-label="tabs-switch"
            sx={{
              "& .MuiTab-root": { minHeight: "auto" },
              "& .MuiTabs-scroller": {
                display: "flex",
                alignItems: "center",
                minHeight: "50px",
              },
            }}
            TabIndicatorProps={{
              style: { display: "none" },
            }}
          >
            <Tab label="Plant" {...a11yProps(0)} />
            <Tab label="Section" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <Box
          className="col-auto"
          sx={{ display: "flex", alignItems: "center" }}
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

        <CustomTabPanel value={currentTabView} index={0}></CustomTabPanel>

        <CustomTabPanel value={currentTabView} index={1}></CustomTabPanel>
      </Box>

      <Row className="mt-3 gx-3">
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
    </Container>
  );
};

export default MonthlyBDTDashboard;
