import React, { useState, useEffect, useContext, useReducer } from "react";
import { Row, Col, Container } from "react-bootstrap";

//file imports
import TotalMonthWiseGraph from "./Graph/TotalMonthWiseGraph";
import TotalTimeManHourMonthWise from "./Graph/TotalTimeManHourMonthWise";
import TotalTimeTMWise from "./Graph/TotalTimeTMWise";

import RoutingContext from "../../../context/routing/RoutingContext";
import Footer from "../../../components/Footer/Footer";
import ReportTitleBar from "../../../BM/Reports/Common/ReportTitleBar";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  reducer,
  initialState,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import PmMachineWiseTimeMonitoring from "./Graph/PmTimeMonitoringCharts/PmMachineWiseTimeMonitoring";
import PMTimeMonitoringLastYearWiseComparison from "./Graph/PmTimeMonitoringCharts/PMTimeMonitoringLastYearWiseComparison";
import { Box } from "@mui/system";

const PmTimeMonitoringReport = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  const context = useContext(RoutingContext);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const [sectionOrSubSectionDropdownList, setSectionOrSubSectionDropdownList] =
    useState([]);

  const [selectedSectionOrSubSection, setSelectedSectionOrSubSection] =
    useState(0);

  const postPlantToGetSectionDataBasedOnDashboardLevel = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch(
        "/postPlantToGetSectionDataBasedOnDashboardLevel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plant: context.plant_data,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log("-------------$$$$$$$$$$$$-->", data);
        setSectionOrSubSectionDropdownList(data?.sectionDataArray);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (context?.user_type === "Plant-Admin") {
      postPlantToGetSectionDataBasedOnDashboardLevel();
    }
  }, []);

  return (
    <>
      <div>
        <Container fluid>
          <Row>
            {context?.user_type === "Plant-Admin" &&
            context?.tm_grade === "HOD" ? (
              <Row className="p-2 mt-3">
                <Col sm={12} lg={3}>
                  <span>
                    <b>Section:&nbsp; &nbsp;</b>
                  </span>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    style={{ width: "63%" }}
                    id="standard-select-currency"
                    name="selectedSectionOrSubSection"
                    className="textField"
                    value={selectedSectionOrSubSection}
                    onChange={(e) => {
                      setSelectedSectionOrSubSection(e.target.value);
                    }}
                    // fullWidth
                    select // label="Select"
                    autoComplete="off"
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {sectionOrSubSectionDropdownList?.map((option, index) => {
                      return (
                        <option value={index}>{option?.section_name}</option>
                      );
                    })}
                  </select>
                </Col>
                <Col sm={12} lg={3}>
                  <button
                    class="btn-primary1 w-50"
                    onClick={() => window.location.reload()}
                  >
                    Reset
                  </button>
                </Col>
              </Row>
            ) : (
              ""
            )}
          </Row>
          <Row>
            <Col sm={12} md={12} lg={6} className=" mt-3">
              <TotalMonthWiseGraph
                context={context}
                selectedSectionOrSubSection={
                  sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
                }
              />
            </Col>
            <Col sm={12} md={12} lg={6} className=" mt-3">
              <TotalTimeManHourMonthWise
                context={context}
                selectedSectionOrSubSection={
                  sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
                }
              />
            </Col>
          </Row>
          <Row>
            <Col sm={12} md={12} lg={6} className=" mt-3">
              <TotalTimeTMWise
                context={context}
                selectedSectionOrSubSection={
                  sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
                }
              />
            </Col>
            {/* <Col></Col> */}
          </Row>
          <Row>
            <ReportTitleBar
              title="PM Time Monitoring"
              Toolbar={
                <>
                  <ChartsToolbar
                    baseUrlForFiltering={baseUrlForFiltering}
                    reduceState={reduceState}
                    reducerDispatch={reducerDispatch}
                    yearFiltration
                    monthFiltration
                    sectionFiltration
                    subSectionFiltration
                    cellFiltration
                    lineFiltration
                    machineFiltration
                    resetButtonFiltration
                  />
                </>
              }
            />
            <Col sm={12} md={12} lg={8} className=" mt-3">
              <Box mt={2}>
                <PmMachineWiseTimeMonitoring
                  userDetails={context}
                  filterValues={reduceState}
                  selectedValue={reduceState?.selectedValue}
                  flagForTogglingFilter={reduceState?.flagForTogglingFilter}
                  selectedYear={reduceState?.selectedYear}
                  selectedMonth={reduceState?.selectedMonth}
                />
              </Box>
            </Col>
            <Col sm={12} md={12} lg={4} className=" mt-3">
              <Box mt={2}>
                <PMTimeMonitoringLastYearWiseComparison
                  userDetails={context}
                  filterValues={reduceState}
                  selectedValue={reduceState?.selectedValue}
                  flagForTogglingFilter={reduceState?.flagForTogglingFilter}
                  selectedYear={reduceState?.selectedYear}
                  selectedMonth={reduceState?.selectedMonth}
                />
              </Box>
            </Col>
          </Row>
        </Container>
        <br />
        <br />
        <br />
        <Footer />
      </div>
    </>
  );
};

export default PmTimeMonitoringReport;
