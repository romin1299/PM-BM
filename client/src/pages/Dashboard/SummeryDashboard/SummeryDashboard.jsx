import React, { useState, useEffect } from "react";

import { Row, Button, Col } from "react-bootstrap";

import SummeryDashboardCard from "./SummeryDashboardCard";
import NotFound from "../../Reports/ReportComponents/NotFound";
import { Navigate, useNavigate } from "react-router-dom";

import {
  fetchPlantInfo,
  postPlantToGetSectionInfo,
  postSectionToGetSubSectionInfo,
} from "../../../Integration/APIExports";

import currentYear from "../DashboardComponent/currentYear";
import YearDropDown from "../DashboardComponent/YearDropDown";
import MonthDropDown from "../DashboardComponent/MonthDropDown";
import currentMonth from "../DashboardComponent/currentMonth";
import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";
import Footer from "../../../components/Footer/Footer";

const SummeryDashboard = () => {
  const [plantInfo, setPlantInfo] = useState([]);
  const [sectionInfo, setSectionInfo] = useState([]);
  const [subSectionInfo, setSubSectionInfo] = useState([]);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);



  const navigate = useNavigate();


  useEffect(() => {
    fetchPlantInfo().then((result) => {
      setPlantInfo(result?.plantLists);
      postPlantToGetSectionInfo(
        result?.plantLists,
        selectedYear,
        selectedMonth
      ).then((result1) => {
        setSectionInfo(result1?.monthlyChartDataOfSummery);
        // console.log(result1);
        // postSectionToGetSubSectionInfo(result1?.SectionInfo).then((result3) => {
        //   console.log(result3);
        //   setSubSectionInfo(result3.subSectionInfo);
        // });
      });
    });
  }, [selectedYear, selectedMonth]);
  // let cartTitle1 = ["PowerTrain"];
  // console.log(plantInfo)
  // console.log(sectionInfo);
  const backAtMainDashboard = () => {
    navigate('/')
  }

  return (
    <div className="container-fluid">
      <Row className=" gy-4"></Row>
      <div>
        {/* <div class=" card4 ">
          <Button onClick={backAtMainDashboard}>Back</Button>
        </div> */}

        <div class="shadow-sm cardCssForTitle card1 text-danger">
          <h4>Denso PM Planning System</h4>
        </div>
        <Row
          className="mx-2 mt-4 p-2 cell"
        // style={{ background: "#cee4ee", border: "1px solid" }}
        >
          <Col sm>
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
          <Col sm>
            <MonthDropDown
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </Col>
          
        </Row>
        {plantInfo?.map((item) => (
          <div>
            <div class="shadow-sm cardCssForSubtitle card1 text-danger d-flex align-items-center">
              <h4 style={{ marginBottom: "0rem", color: "rgb(220, 53, 69)" }}>{item.plant_name}</h4>
            </div>
            <Row className=" gy-4">
              {sectionInfo?.length > 0 ? (
                sectionInfo.map((item1) =>
                  item._id === item1.plant_name ? (
                    <SummeryDashboardCard
                      cartTitle={item1.section_name}
                      data={item1}
                    />
                  ) : (
                    ""
                  )
                )
              ) : (
                <Col className="col-lg-3 col-md-12 col-sm-12 p-5 d-flex justify-content-center d-flex align-items-center">
                  <LoadingAnimation />
                </Col>
              )}

              {/* {sectionInfo.map((item1) =>
                item._id === item1.plant_names
                  ? item1.dashboardLevel === "No"
                    ? subSectionInfo.map((item2) =>
                        item2.section_names === item1._id ? (
                          <SummeryDashboardCard
                            cartTitle={item2.subSection_name}
                            data={item2}
                          />
                        ) : (
                          ""
                        )
                      )
                    : ""
                  : ""
              )} */}
            </Row>
          </div>
        ))}
      </div>
      <br/><br/>
      <Footer />
    </div>
  );
};

export default SummeryDashboard;
