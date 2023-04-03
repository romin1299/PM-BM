import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Container } from "react-bootstrap";

//file imports
import TotalMonthWiseGraph from "./Graph/TotalMonthWiseGraph";
import TotalTimeManHourMonthWise from "./Graph/TotalTimeManHourMonthWise";
import TotalTimeTMWise from "./Graph/TotalTimeTMWise";

import RoutingContext from "../../../context/routing/RoutingContext";
import Footer from "../../../components/Footer/Footer";

const PmTimeMonitoringReport = () => {
  const context = useContext(RoutingContext);

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
