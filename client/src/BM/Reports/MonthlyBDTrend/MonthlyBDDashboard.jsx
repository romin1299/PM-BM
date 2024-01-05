import React, { useState, useReducer } from "react";
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
import YearDropdown from "./YearDropdown";
import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu.jsx";
import {
  EXPORT_REPORT,
  exportPPTX,
} from "../../Utils/ExportPPTX/exportPPTX.js";

import axios from "axios";

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
  const [filter, setFilter] = React.useState("hourly");
  const [selectedYear, setSelectedYear] = React.useState("");
  const currentTabViewName = currentTabView === 0 ? "Plant" : "Section";

  let initialState = {
    message: "",
    flagForTogglingFilter: "",
    selectedValue: "",

    selectedSection: "",
    sections: [],
    selectedSubSection: "",
    subSections: [],
  };
  const [filterState, setFilterState] = useState(initialState);

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

  const urlOptions = {
    ...filterState,
    filter,
    selectedYear,
  };

  const baseUrlForFiltering = "/getFiltrationValue/monthly-breakdown-filter";

  const fetchValues = async ({ url }) => {
    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      if (res.status === 201) {
        setFilterState({
          ...filterState,
          ...res.data,
        });
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    fetchValues({
      url: `${baseUrlForFiltering}/byDefault`,
    });
  }, []);

  const handleChange = (event, newValue) => {
    setCurrentTabView(newValue);
    if (newValue === 0) {
      return fetchValues({
        url: `${baseUrlForFiltering}/byDefault`,
      });
    }

    fetchValues({
      url: `${baseUrlForFiltering}/plant-section-toggle`,
    });
  };

  const handleChangeSection = (selectedSection) => {
    if (
      filterState?.sections.find((item) => item?._id === selectedSection)
        ?.dashboardLevel === "No"
    ) {
      fetchValues({
        url: `${baseUrlForFiltering}/sectionBased/${selectedSection}`,
      });
    } else {
      setFilterState({
        ...filterState,
        selectedSection,
        flagForTogglingFilter: "based-on-section",
        selectedValue: selectedSection,
        selectedSubSection: "",
        subSections: [],
      });
    }
  };

  const handleChangeSubSection = (selectedSubSection) =>
    setFilterState({
      ...filterState,
      selectedSubSection,
      flagForTogglingFilter: "based-on-subSection",
      selectedValue: selectedSubSection,
    });

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
          sx={{ display: "flex", alignItems: "center", gap: 2 }}
        >
          {filterState.sections?.length > 0 && (
            <SectionsDropdown
              sectionId={filterState?.selectedSection}
              setSectionId={handleChangeSection}
              dropdownArray={filterState.sections}
              name="Sections"
              objKey="section_name"
            />
          )}

          {filterState.subSections?.length > 0 && (
            <SectionsDropdown
              sectionId={filterState?.selectedSubSection}
              setSectionId={handleChangeSubSection}
              dropdownArray={filterState.subSections}
              name="Sub Sections"
              objKey="subSection_name"
            />
          )}
          <YearDropdown
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />

          <FilterSwitchButtons
            filter={filter}
            setFilter={setFilter}
            currentTabViewName={currentTabViewName}
          />

          <DownloadMenu
            handleDownloadPPTX={() => {
              exportPPTX(EXPORT_REPORT.MONTHLY_BD, urlOptions);
            }}
          />
        </Box>

        <CustomTabPanel value={currentTabView} index={0}></CustomTabPanel>

        <CustomTabPanel value={currentTabView} index={1}></CustomTabPanel>
      </Box>

      <Row className="mt-3 gx-3">
        <Col md={12} lg={9}>
          <MonthlyBDTrendChart
            filterState={filterState}
            filter={filter}
            setFilter={setFilter}
            currentTabViewName={currentTabViewName}
            sectionId={filterState?.selectedValue}
            selectedYear={selectedYear}
          />
        </Col>
        <Col md={12} lg={3}>
          <YearlyTrendChart
            filterState={filterState}
            filter={filter}
            setFilter={setFilter}
            currentTabViewName={currentTabViewName}
            sectionId={filterState?.selectedValue}
            selectedYear={selectedYear}
          />
        </Col>
      </Row>

      <MajorBDCount
        filterState={filterState}
        filter={filter}
        setFilter={setFilter}
        currentTabViewName={currentTabViewName}
        sectionId={filterState?.selectedValue}
        selectedYear={selectedYear}
      />
    </Container>
  );
};

export default MonthlyBDTDashboard;
