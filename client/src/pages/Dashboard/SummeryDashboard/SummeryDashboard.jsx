import React, { useState, useEffect } from "react";

import { Row, Button } from "react-bootstrap";

import SummeryDashboardCard from "./SummeryDashboardCard";

import {
  fetchPlantInfo,
  postPlantToGetSectionInfo,
  postSectionToGetSubSectionInfo,
} from "../../../Integration/APIExports";

const SummeryDashboard = () => {
  const [plantInfo, setPlantInfo] = useState([]);
  const [sectionInfo, setSectionInfo] = useState([]);
  const [subSectionInfo, setSubSectionInfo] = useState([]);

  useEffect(() => {
    fetchPlantInfo().then((result) => {
      setPlantInfo(result?.plantLists);
      postPlantToGetSectionInfo(result?.plantLists).then((result1) => {
        setSectionInfo(result1?.SectionInfo);
        postSectionToGetSubSectionInfo(result1?.SectionInfo).then((result3) => {
          console.log(result3);
          setSubSectionInfo(result3.subSectionInfo);
        });
      });
    });
  }, []);
  // let cartTitle1 = ["PowerTrain"];

  console.log(sectionInfo);
  return (
    <div className="container-fluid">
      <Row className=" gy-4"></Row>
      <div>
        <div class=" card4 ">
          <Button>Back</Button>
        </div>
        <div class="shadow-sm cardCssForTitle card1 text-danger">
          <h4>Denso PM Planning System</h4>
        </div>
        {plantInfo?.map((item) => (
          <div>
            <div class="shadow-sm cardCssForSubtitle card1 text-danger">
              <h4>{item.plant_name}</h4>
            </div>
            <Row className=" gy-4">
              {sectionInfo.map((item1) =>
                item._id === item1.plant_names ? (
                  item1.dashboardLevel === "Yes" ? (
                    <SummeryDashboardCard
                      cartTitle={item1.section_name}
                      data={item1}
                    />
                  ) : (
                    ""
                  )
                ) : (
                  ""
                )
              )}

              {sectionInfo.map((item1) =>
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
              )}
            </Row>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummeryDashboard;
