import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";

import {
  MonthlySpareConsumptionTrend,
  Top20MachineSparePartConsumption,
  LineWiseSpareConsumptionTrend,
  SpareConsumptionTrendType,
} from "./SpareReportComponent/FileExports";

import RoutingContext from "../../../context/routing/RoutingContext";
import Footer from "../../../components/Footer/Footer";

const SpareReportMainDashboard = () => {
  const context = useContext(RoutingContext);

  const [lineData, setLineData] = useState([]);

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

  // const postSectionToGetAllDataForMainDashboard = async () => {
  //   // setSubSection(undefined);
  //   try {
  //     const res = await fetch("/postSectionToGetLineData", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         section: context.section_data,
  //       }),
  //     });
  //     const data = await res.json();

  //     if (res.status === 400 || res.status === 422 || !data) {
  //       console.log("Invalid");
  //     } else {
  //       // console.log(data);
  //       setLineData(data?.lineData);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // useEffect(() => {
  //   postSectionToGetAllDataForMainDashboard();
  // }, []);

  return (
    <>
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
          <Col className="col-lg-6 col-md-12">
            <MonthlySpareConsumptionTrend
              // lineData={lineData}
              context={context}
              selectedSectionOrSubSection={
                sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
              }
            />
          </Col>
          <Col className="col-lg-6 col-md-12">
            <Top20MachineSparePartConsumption
              context={context}
              selectedSectionOrSubSection={
                sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
              }
            />
          </Col>
        </Row>

        <Row>
          <Col className="col-lg-7 col-md-12">
            <LineWiseSpareConsumptionTrend
              // lineData={lineData}
              context={context}
              selectedSectionOrSubSection={
                sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
              }
            />
          </Col>
          <Col
            // className="d-flex justify-content-center align-items-center"
            className="col-lg-5 col-md-12"
          >
            <SpareConsumptionTrendType
              context={context}
              selectedSectionOrSubSection={
                sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
              }
            />
          </Col>
        </Row>
      </Container>
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
};

export default SpareReportMainDashboard;
