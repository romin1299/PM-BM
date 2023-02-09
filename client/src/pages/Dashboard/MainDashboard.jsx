import React, { useState, useEffect, useContext } from "react";
import RoutingContext from "../../context/routing/RoutingContext";
import "./MainDashboard.css";
import { Container, Row, Col } from "reactstrap";
import CheckSheet from "./CheckSheet";
import { useNavigate } from "react-router-dom";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "react-bootstrap";
import CheckSheetForImplementation from "../Operator/CheckSheetForImplementation";
import GettingMachineDataForCheckSheetImplementation from "../Operator/GettingMachineDataForCheckSheetImplementation";
import RectangleIcon from "@mui/icons-material/Rectangle";

import currentYear from "./DashboardComponent/currentYear";
import YearDropDown from "./DashboardComponent/YearDropDown";
import YearDropDownForMainDashboard from "./DashboardComponent/YearDropDownForMainDashboard";
import MonthDropDown from "./DashboardComponent/MonthDropDown";
import MonthDropDownForMainDashboard from "./DashboardComponent/MonthDropDownForMainDashboard";
import currentMonth from "./DashboardComponent/currentMonth";

import GraphsInMainDashboard from "./DashboardComponent/GraphsInMainDashboard";
import { light } from "@mui/material/styles/createPalette";
import LoadingAnimation from "../Reports/ReportComponents/LoadingAnimation";
import { FormControlUnstyled } from "@mui/base";

import Footer from "../../components/Footer/Footer";

const MainDashboard = () => {
  const [sections, setsections] = useState();
  const [subSection, setSubSection] = useState("");
  // console.log("$$$$$$$$$$$$$$$$$$$", subSection);

  //for showing sub-section data based on it's selection
  const [selectedSubSectionId, setSelectedSubSectionId] = useState();

  const [refKey, setRefKey] = useState(0);

  const [
    selectedSubSectionIdForDefaultDashboard,
    setSelectedSubSectionIdForDefaultDashboard,
  ] = useState();

  //display default sub-section list when dashboard level NO
  const [defaultSubSection, setDefaultSubSection] = useState([]);

  const [sectionList, setSectionList] = useState("");
  const [subSectionList, setSubSectionList] = useState("");

  const [allDataSectionWise, setallDataSectionWise] = useState("");

  const [
    machineWiseCheckSheetForImplementation,
    setMachineWiseCheckSheetForImplementation,
  ] = useState("");

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const context = useContext(RoutingContext);
  const navigate = useNavigate();

  const postPlantToGetSectionList = async (selectedPlant) => {
    setsections(undefined);
    try {
      const res = await fetch("/postPlantToGetSectionList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plants: context.plant_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data);

        setSectionList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const postSectionToGetSubSectionList = async (selectedSection) => {
    setSubSection(undefined);
    // setallDataSectionWise("");
    setSelectedSubSectionId();

    try {
      const res = await fetch("/postSectionToGetSubSectionList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        console.log("Data post.............", data);

        setSubSectionList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //for operator user
  const postSectionToGetAllDataForMainDashboard = async (selectedSection) => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllDataForMainDashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
          selectedYear,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post");
        // console.log(data);
        setallDataSectionWise(data);
        setDefaultSubSection(data.defaultSubSectionArray);
        setDeafaultDataForNoDashboard(data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  //for other user
  const postSectionToGetAllDataForMainDashboardForOtherUser = async (
    selectedSection
  ) => {
    // setSubSection(undefined);
    try {
      const res = await fetch(
        "/postSectionToGetAllDataForMainDashboardForOtherUser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: selectedSection,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post");
        // console.log("======================>168", data);
        setallDataSectionWise(data);
        setDefaultSubSection(data.defaultSubSectionArray);
        setDeafaultDataForNoDashboard(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // console.log(subSection);

  const getSelectedSubsection = (selectedData) => {
    if (subSectionList) {
      subSectionList.subSectionsInfo.map((id) => {
        // console.log(selectedData)
        let subSectionSplit = selectedData.split("-");
        // console.log(subSectionSplit[0]);
        if (id.subSection_id === subSectionSplit[0]) {
          // console.log(id._id)
          setSelectedSubSectionId(id._id);
        }
      });
    } else {
      allDataSectionWise.subSectionsData.map((id) => {
        // console.log(selectedData)
        let subSectionSplit = selectedData.split("-");
        // console.log(subSectionSplit[0]);
        if (id.subSection_id === subSectionSplit[0]) {
          // console.log(id._id)
          setSelectedSubSectionId(id._id);
        }
      });
    }
  };

  const closeCheckSheet = () => {
    postSectionToGetAllDataForMainDashboard(context.section_data);

    // if (context.user_type === "Operator") {
    // } else {
    //   postSectionToGetAllDataForMainDashboardForOtherUser(context.section_data);
    // }
    setMachineWiseCheckSheetForImplementation("");
    // document.querySelector(".operatorDashboard").style.pointerEvents = "auto";
  };

  const pathToCheckSheet = (machine, lineName) => {
    // context.user_type === "Operator"
    //   ? navigate("/machineWiseCheckSheetForImplemetation", {
    //       state: { machineData: machine, lineName: lineName },
    //     })
    //   : navigate("/machineWiseCheckSheet", {
    //       state: { machineData: machine, lineName: lineName },
    //     });

    setMachineWiseCheckSheetForImplementation(
      <GettingMachineDataForCheckSheetImplementation
        machineData={machine}
        lineName={lineName}
        closeCheckSheet={closeCheckSheet}
        loggedUserType={context.user_type}
        selectedYear={selectedYear}
        showCheckSheet={true}
        setMachineWiseCheckSheetForImplementation={
          setMachineWiseCheckSheetForImplementation
        }
      />
    );

    // document.querySelector(".operatorDashboard").style.pointerEvents = "none";

    // const postMachineIdToGetAllDetailsOfMachine = async () => {
    //   try {
    //     const res = await fetch("/postMachineIdToGetAllDetailsOfMachine", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         machineID: machine._id,
    //       }),
    //     });
    //     const data = await res.json();

    //     if (res.status === 400 || res.status === 422 || !data) {
    //       console.log("Invalid");
    //     } else {
    //       console.log(data.machineData.checkSheet);

    //       context.user_type === "Operator"
    //         ? setMachineWiseCheckSheetForImplementation(
    //             <CheckSheetForImplementation
    //               machineData={data.machineData}
    //               lineName={lineName}
    //               closeCheckSheet={closeCheckSheet}
    //             />
    //           )
    //         : setMachineWiseCheckSheetForImplementation(
    //             <CheckSheet
    //               machineData={data.machineData}
    //               lineName={lineName}
    //               closeCheckSheet={closeCheckSheet}
    //             />
    //           );

    //       document.querySelector(".operatorDashboard").style.pointerEvents =
    //         "none";
    //     }
    //   } catch (error) {
    //     console.log(error);
    //   }
    // };

    // postMachineIdToGetAllDetailsOfMachine();
    // useEffect(() => {
    // }, []);
  };

  // console.log(subSectionList);
  // console.log(subSection);

  // console.log(selectedSubSectionId);
  let subSectionArray = [];

  const defaultSubsectionListArray = () => {
    for (let i = 0; i < allDataSectionWise.subSectionsData?.length; i++) {
      subSectionArray.push(
        `${allDataSectionWise.subSectionsData[i].subSection_id}-${allDataSectionWise.subSectionsData[i].subSection_name}`
      );
    }
    setDefaultSubSection(subSectionArray);
  };

  useEffect(() => {
    // if () {
    // }

    postPlantToGetSectionList();
  }, []);

  useEffect(() => {
    if (sections) {
      if (context.user_type === "Operator") {
        postSectionToGetAllDataForMainDashboard(sections);
      } else {
        postSectionToGetAllDataForMainDashboardForOtherUser(sections);
      }
    }
  }, [sections, selectedYear]);

  useEffect(() => {
    if (sections) {
      postSectionToGetSubSectionList(sections);
    }
  }, [sections]);

  useEffect(() => {
    if (context.user_type === "Operator") {
      postSectionToGetAllDataForMainDashboard(context.section_data);
    } else {
      postSectionToGetAllDataForMainDashboardForOtherUser(context.section_data);
    }
  }, [context.section_data, selectedYear]);

  const setDeafaultDataForNoDashboard = (data) => {
    // console.log("!!!!!!!!!!!!!!!!!!!!!!!!! 328", data);
    if (data.sectionInfo) {
      // console.log( context.subSection_data.length)

      if (data.sectionInfo[0].dashboardLevel === "No") {
        if (context.subSection_data.length >= 1) {
          data.subSectionsData.map((id) => {
            // console.log(context.subSection_data[0]);
            let subSectionSplit = context.subSection_data[0].split("-");
            // console.log(subSectionSplit[0]);
            if (id.subSection_id === subSectionSplit[0]) {
              console.log("***************** 339", id._id);
              setSelectedSubSectionIdForDefaultDashboard(id._id);
              // postSectionToGetAllDataForMainDashboardGraph(id._id, "No");
            }
          });
        }
      }
    }
  };

  // console.log(allDataSectionWise);

  const monthKeyArray = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  // let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];
  // let monthForCompareSystemMonth = monthKeyArray[selectedMonth];
  // console.log(selectedMonth, monthKeyArray[new Date().getMonth()]);

  //for year not started yet
  const notifyForNotstartedYear = () => {
    toast.error("Financial year not started yet !", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  };

  //copied successfully checksheet data from previous year
  const notifyForCopiedChecksheetDataDone = () => {
    toast.success("Machine data for new year successfully stored !", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  };

  const addNewCheckSheetAfterChangeFinancialyear = async () => {
    try {
      const res = await fetch(
        "/postSectionForAddNewCheckSheetAfterChangeFinancialYear",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: context.section_data,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else if (res.status === 409) {
        notifyForNotstartedYear();
      } else {
        notifyForCopiedChecksheetDataDone();
        // console.log("Data post");
        // console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const navigateToSummeryDashboard = () => {
    navigate("/summeryDashboard");
  };

  useEffect(() => {
    setSelectedMonth(currentMonth);
  }, [selectedYear]);

  const [currentMonthGraphAndTableData, setCurrentMonthGraphAndTableData] =
    useState();

  const postSectionToGetAllDataForMainDashboardGraph = async (
    sectionOrSubSection,
    dashboardLevel
  ) => {
    // console.log(
    //   "######################################",
    //   selectedMonth,
    //   sectionOrSubSection,
    //   dashboardLevel
    // );
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllDataForMainDashboardGraph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionOrSubSection,
          selectedYear,
          dashboardLevel,
          selectedMonth,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data.machineData2[0][0].line_names.line_name);
        // console.log("457 ++++++++++++++++", data);

        setCurrentMonthGraphAndTableData(data);
        // setGraphData(data);
        // setTableData(data.lineDataWithCounter);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postSectionToGetSectionInfo = async (sectionName) => {
    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@   493");
    try {
      const res = await fetch("/postSectionToGetSectionInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: sectionName,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        if (data?.sectionInfo?.dashboardLevel === "Yes") {
          // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
          postSectionToGetAllDataForMainDashboardGraph(
            data?.sectionInfo?._id,
            data?.sectionInfo?.dashboardLevel
          );

          postSectionToGetAllDataForAnnualStatusReport(
            data?.sectionInfo?._id,
            data?.sectionInfo?.dashboardLevel
          );
        } else {
          // console.log("!!!!!!!!!!!!!!!!!!!", selectedSubSectionId);
          if (refKey === 0) {
            // console.log(
            //   "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
            //   selectedSubSectionIdForDefaultDashboard
            // );
            // console.log(
            //   "========>",
            //   selectedSubSectionId,
            //   selectedSubSectionIdForDefaultDashboard
            // );
            // console.log("----->", context);
            await postSectionToGetAllDataForMainDashboardGraph(
              selectedSubSectionIdForDefaultDashboard,
              data?.sectionInfo?.dashboardLevel
            );
            await postSectionToGetAllDataForAnnualStatusReport(
              selectedSubSectionIdForDefaultDashboard,
              data?.sectionInfo?.dashboardLevel
            );
            if (selectedSubSectionId) {
              setRefKey((refKey) => refKey + 1);
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    postSectionToGetAllDataForMainDashboardGraph(selectedSubSectionId, "No");
    postSectionToGetAllDataForAnnualStatusReport(selectedSubSectionId, "No");
  }, [selectedSubSectionId, selectedYear, selectedMonth]);

  // useEffect(() => {
  //   postSectionToGetAllDataForMainDashboardGraph(
  //     selectedSubSectionId
  //       ? selectedSubSectionId
  //       : selectedSubSectionIdForDefaultDashboard,
  //     "No"
  //   );
  //   postSectionToGetAllDataForAnnualStatusReport(
  //     selectedSubSectionId
  //       ? selectedSubSectionId
  //       : selectedSubSectionIdForDefaultDashboard,
  //     "No"
  //   );
  // }, [selectedSubSectionIdForDefaultDashboard, selectedMonth]);

  // console.log("========>", selectedSubSectionIdForDefaultDashboard);

  useEffect(() => {
    postSectionToGetSectionInfo(sections || context.section_data);
  }, [
    selectedYear,
    selectedMonth,
    sections,
    selectedSubSectionIdForDefaultDashboard,
  ]);

  // useEffect(() => {
  //   // setCurrentMonthGraphAndTableData("");
  //   // console.log("@@@@@@@@@@@@@@@@@", sections, context.section_data);
  //   postSectionToGetAllDataForMainDashboardGraph();
  // }, [selectedYear, selectedMonth, sections]);

  const [annualGraph, setAnnualGraph] = useState();

  const postSectionToGetAllDataForAnnualStatusReport = async (
    sectionOrSubSection,
    dashboardLevel
  ) => {
    // setSubSection(undefined);
    try {
      const res = await fetch(
        "/postSectionToGetAllDataForAnnualStatusReport/MainDashboardReport",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sectionOrSubSection,
            dashboardLevel,
            selectedYear,
            // month: selectedMonth,setsections
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data.machineData2[0][0].line_names.line_name);
        // console.log(data);
        setAnnualGraph(data);
        // setTableData(data.lineDataWithCounter);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {
  //   // setCurrentMonthGraphAndTableData("");
  //   postSectionToGetAllDataForAnnualStatusReport();
  // }, [selectedYear, sections]);

  const funForDummyApi = async () => {
    try {
      const res = await fetch("/dummyApi", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        return res.status(422).send("Data not recieved !!!");
      } else {
        return data;
      }
    } catch (error) {
      console.log("No data found ( Unauthorized ) !!!");
    }
  };

  // console.log(selectedSubSectionIdForDefaultDashboard);

  return (
    <>
      {machineWiseCheckSheetForImplementation}

      <ToastContainer />

      {/* <button onClick={funForDummyApi}>dummy</button> */}
      <Container fluid className="operatorDashboard">
        <Row className="mt-3">
          <Col xs={12} sm={12} md={12} lg={9}>
            {Object.keys(allDataSectionWise).length > 0 ? (
              <Col>

                <div class="container-fluid px-2">
                  <div class="row cell gx-0">
                    <Col lg={3} md={12} sm={12} className="mt-3">
                      <Row className="mb-2">
                        <span>
                          <b> &nbsp;Section: &nbsp;</b>
                          <select
                          class="form-select form-select-sm"
                          aria-label=".form-select-sm example"
                          // style={{ width: "25%" }}
                          id="standard-select-currency"
                          name="plant"
                          className="textField w-50"
                          select
                          // fullWidth // label="Select"
                          autoComplete="off"
                          value={sections === undefined ? "" : sections}
                          onChange={(e) => {
                            setsections(e.target.value);
                            setAnnualGraph();
                            setCurrentMonthGraphAndTableData();
                          }}
                          variant="standard"
                        >
                          {/* {plant.map((option) => {
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  );
                })} */}
                          <option
                            selected
                            disabled
                            value=""
                            style={{ backgroundColor: "skyblue" }}
                          >
                            {context.section_data}
                          </option>

                          {sectionList !== ""
                            ? sectionList.sectionArray.map((option) => {
                              return <option value={option}>{option}</option>;
                            })
                            : ""}
                        </select>
                        </span>
                        

                      </Row>

                      <Row>
                        {allDataSectionWise ? (
                          allDataSectionWise.sectionInfo[0].dashboardLevel ===
                            "Yes" ? (
                            ""
                          ) : (
                            <div className="mb-3">
                              {/* <div>
                            </div> */}
                              <span

                              >
                                <b>Sub Section: &nbsp;</b>
                              </span>
                              {/* <br /> */}
                              <select
                                class="form-select form-select-sm"
                                aria-label=".form-select-sm example"
                                style={{ width: "50%" }}
                                // id="standard-select-currency"
                                name="plant"
                                className="textField"
                                select
                                // fullWidth // label="Select"
                                autoComplete="off"
                                value={
                                  subSection === undefined
                                    ? ""
                                    : subSection === ""
                                      ? context.subSection_data[0]
                                      : subSection
                                }
                                onChange={(e) => {
                                  getSelectedSubsection(e.target.value);
                                  setSubSection(e.target.value);

                                  // console.log(
                                  //   "=============>759",
                                  //   e.target.value
                                  // );
                                }}
                                variant="standard"
                              >
                                {/* {plant.map((option) => {
                return (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                );
              })} */}
                                <option selected disabled value="">
                                  Please select
                                </option>
                                {allDataSectionWise
                                  ? defaultSubSection?.map((option) => {
                                    return (
                                      <option
                                        className="optionStyle"
                                        value={option}
                                      >
                                        {option}
                                      </option>
                                    );
                                  })
                                  : subSectionList !== ""
                                    ? subSectionList.subSectionArray.map(
                                      (option) => {
                                        return (
                                          <option
                                            className="optionStyle"
                                            value={option}
                                          >
                                            {option}
                                          </option>
                                        );
                                      }
                                    )
                                    : ""}
                              </select>
                            </div>
                          )
                        ) : subSectionList.sectionInfo ? (
                          subSectionList.sectionInfo.dashboardLevel === "Yes" ? (
                            ""
                          ) : (
                            <div sm={6} lg={4}>
                              {/* <div>
                            </div> */}
                              <span
                                style={{ fontWeight: "500", fontSize: "12px" }}
                              >
                                Sub Section: &nbsp;
                              </span>
                              <br />
                              <select
                                class="form-select form-select-sm"
                                aria-label=".form-select-sm example"
                                style={{ width: "100%" }}
                                // id="standard-select-currency"
                                name="plant"
                                className="textField"
                                select
                                // fullWidth // label="Select"
                                autoComplete="off"
                                value={subSection === undefined ? "" : subSection}
                                onChange={(e) => {
                                  getSelectedSubsection(e.target.value);
                                  setSubSection(e.target.value);
                                }}
                                variant="standard"
                              >
                                {/* {plant.map((option) => {
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  );
                })} */}
                                <option selected disabled value="">
                                  Please select
                                </option>
                                {subSectionList !== ""
                                  ? subSectionList.subSectionArray.map(
                                    (option) => {
                                      return (
                                        <option
                                          className="optionStyle"
                                          value={option}
                                        >
                                          {option}
                                        </option>
                                      );
                                    }
                                  )
                                  : ""}
                              </select>
                            </div>
                          )
                        ) : (
                          ""
                        )}

                      </Row>

                    </Col>
                    <Col lg={3} md={12} sm={12} className="mt-3">


                      {context.user_type === "Section-Admin" ? (
                        <Col
                          sm={6}
                          lg={12}
                          className="d-flex align-items-center justify-content-center"
                        >
                          <button
                            className="btn text-dark"
                            style={{ background: "#D1ECF1" }}
                            onClick={addNewCheckSheetAfterChangeFinancialyear}
                          >
                            <AutorenewIcon style={{ fontSize: "small" }} />{" "}
                            &nbsp;{" "}
                            <b>
                              Update{" "}
                              {`${new Date().getFullYear()}-${new Date().getFullYear() + 1
                                }`}
                            </b>
                          </button>
                        </Col>
                      ) : (
                        ""
                      )}
                    </Col>
                    <Col lg={6} md={12} sm={12} className="mt-3">
                      <Row>
                        <Col sm>
                          <YearDropDownForMainDashboard
                            selectedYear={selectedYear}
                            setSelectedYear={setSelectedYear}
                          />
                        </Col>
                        <Col sm>
                          <MonthDropDownForMainDashboard
                            selectedMonth={selectedMonth}
                            setSelectedMonth={setSelectedMonth}
                          />
                        </Col>
                      </Row>


                    </Col>

                  </div>
                </div>

                


                <Row
                  className="d-flex align-content-center justify cell m-2 pb-3 g-3"
                  style={{ background: "#E0E0E0" }}
                >
                  <Col
                    className=" col-lg-2 col-md-6 col-sm-6 "
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    <RectangleIcon
                      className="bg-white"
                      style={{ color: "#ffffff" }}
                    />{" "}
                    &nbsp;Schedule
                  </Col>
                  <Col
                    className="col-lg-2 col-md-6 col-sm-6 "
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    <RectangleIcon
                      style={{ background: "#ffff59", color: "#ffff59" }}
                    />{" "}
                    &nbsp;Ongoing
                  </Col>
                  <Col
                    className=" col-lg-2 col-md-6 col-sm-6 "
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    <RectangleIcon
                      style={{ background: "#5fe15f", color: "5fe15f" }}
                    />{" "}
                    &nbsp;Completed
                  </Col>
                  <Col
                    className=" col-lg-2 col-md-6 col-sm-6 "
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    <RectangleIcon
                      style={{ background: "#ababab", color: "#ababab" }}
                    />{" "}
                    &nbsp;Not Schedule
                  </Col>

                  <Col
                    className=" col-lg-2 col-md-6 col-sm-6 "
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    <RectangleIcon
                      style={{ background: "#ffc356", color: "#ffc356" }}
                    />{" "}
                    &nbsp;Done with delay
                  </Col>
                  <Col
                    className=" col-lg-2 col-md-6 col-sm-6 "
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    <RectangleIcon
                      style={{ background: "#ff8888", color: "#ff8888" }}
                    />{" "}
                    &nbsp;No completion / PM Skip
                  </Col>
                </Row>

                {/* <div>{checkSheetState}</div> */}
                {/* dashboardCard section */}

                <div className="dashboardCard mx-2 mt-4">
                  {/* {allDataSectionWise !== ""
            ? console.log(allDataSectionWise.subSectionsData)
            : ""} */}

                  {subSectionList.sectionInfo ? (
                    subSectionList.sectionInfo.dashboardLevel === "No" ? (
                      context.subSection_data.includes(subSection) ? (
                        selectedSubSectionId ? (
                          <div className="cards">
                            <Container fluid>
                              <Row>
                                {allDataSectionWise.cellData.map((cell) => {
                                  return selectedSubSectionId ===
                                    cell.subSection_names ? (
                                    <>
                                      <div className="cell">
                                        <p>{cell.cell_name}</p>

                                        <div>
                                          <Row
                                            style={{
                                              display: "flex",
                                              justifyContent: "flex-start",
                                              // margin: "0.5rem",
                                            }}
                                          >
                                            {allDataSectionWise.lineData.map(
                                              (line) => {
                                                return cell._id ===
                                                  line.cell_names ? (
                                                  <>
                                                    <Col
                                                      xs={12}
                                                      md={6}
                                                      lg={3}
                                                    // key={subSection}
                                                    >
                                                      <div className="line">
                                                        <div className="line_name">
                                                          <p>
                                                            {line.line_name}
                                                          </p>
                                                        </div>
                                                        <div className="machineCard">
                                                          {allDataSectionWise.machineData.map(
                                                            (machine) => {
                                                              return line._id ===
                                                                machine.line_names ? (
                                                                <>
                                                                  <button
                                                                    style={{
                                                                      background:
                                                                        machine
                                                                          .checkSheet_data
                                                                          ?.PMStatus
                                                                          ? machine
                                                                            .checkSheet_data
                                                                            ?.PMStatus[
                                                                            selectedMonth
                                                                          ] ===
                                                                            "Current Plan"
                                                                            ? "white"
                                                                            : machine
                                                                              .checkSheet_data
                                                                              ?.PMStatus[
                                                                              selectedMonth
                                                                            ] ===
                                                                              "Ongoing"
                                                                              ? "#ffff59"
                                                                              : machine
                                                                                .checkSheet_data
                                                                                ?.PMStatus[
                                                                                selectedMonth
                                                                              ] ===
                                                                                "Completed"
                                                                                ? "#5fe15f"
                                                                                : machine
                                                                                  .checkSheet_data
                                                                                  ?.PMStatus[
                                                                                  selectedMonth
                                                                                ] ===
                                                                                  "Done with delay"
                                                                                  ? "#ffc356"
                                                                                  : machine
                                                                                    .checkSheet_data
                                                                                    ?.PMStatus[
                                                                                    selectedMonth
                                                                                  ] ===
                                                                                    "PM Skip" ||
                                                                                    machine
                                                                                      .checkSheet_data
                                                                                      ?.PMStatus[
                                                                                    selectedMonth
                                                                                    ] ===
                                                                                    "No Completion"
                                                                                    ? "#ff8888"
                                                                                    : "#ababab"
                                                                          : "#ababab",
                                                                    }}
                                                                    className="machine"
                                                                    onClick={() =>
                                                                      pathToCheckSheet(
                                                                        machine,
                                                                        line.line_name
                                                                      )
                                                                    }
                                                                  >
                                                                    {
                                                                      machine.machine_nickname
                                                                    }
                                                                  </button>
                                                                </>
                                                              ) : (
                                                                ""
                                                              );
                                                            }
                                                          )}
                                                        </div>
                                                      </div>
                                                    </Col>
                                                  </>
                                                ) : (
                                                  ""
                                                );
                                              }
                                            )}
                                          </Row>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    ""
                                  );
                                })}
                              </Row>
                            </Container>
                          </div>
                        ) : (
                          ""
                        )
                      ) : selectedSubSectionId ? (
                        <div className="cards">
                          <Container fluid>
                            <Row>
                              {allDataSectionWise.cellData.map((cell) => {
                                return selectedSubSectionId ===
                                  cell.subSection_names ? (
                                  <>
                                    <div className="cell">
                                      <p>{cell.cell_name}</p>

                                      <div>
                                        <Row
                                          style={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            // margin: "0.5rem",
                                          }}
                                        >
                                          {allDataSectionWise.lineData.map(
                                            (line) => {
                                              return cell._id ===
                                                line.cell_names ? (
                                                <>
                                                  <Col
                                                    xs={12}
                                                    md={6}
                                                    lg={3}
                                                  // key={subSection}
                                                  >
                                                    <div className="line">
                                                      <div className="line_name">
                                                        <p>{line.line_name}</p>
                                                      </div>
                                                      <div className="machineCard">
                                                        {allDataSectionWise.machineData.map(
                                                          (machine) => {
                                                            return line._id ===
                                                              machine.line_names ? (
                                                              <>
                                                                <button
                                                                  style={{
                                                                    background:
                                                                      machine
                                                                        .checkSheet_data
                                                                        ?.PMStatus
                                                                        ? machine
                                                                          .checkSheet_data
                                                                          ?.PMStatus[
                                                                          selectedMonth
                                                                        ] ===
                                                                          "Current Plan"
                                                                          ? "white"
                                                                          : machine
                                                                            .checkSheet_data
                                                                            ?.PMStatus[
                                                                            selectedMonth
                                                                          ] ===
                                                                            "Ongoing"
                                                                            ? "#ffff59"
                                                                            : machine
                                                                              .checkSheet_data
                                                                              ?.PMStatus[
                                                                              selectedMonth
                                                                            ] ===
                                                                              "Completed"
                                                                              ? "#5fe15f"
                                                                              : machine
                                                                                .checkSheet_data
                                                                                ?.PMStatus[
                                                                                selectedMonth
                                                                              ] ===
                                                                                "Done with delay"
                                                                                ? "#ffc356"
                                                                                : machine
                                                                                  .checkSheet_data
                                                                                  ?.PMStatus[
                                                                                  selectedMonth
                                                                                ] ===
                                                                                  "PM Skip" ||
                                                                                  machine
                                                                                    .checkSheet_data
                                                                                    ?.PMStatus[
                                                                                  selectedMonth
                                                                                  ] ===
                                                                                  "No Completion"
                                                                                  ? "#ff8888"
                                                                                  : "#ababab"
                                                                        : "#ababab",
                                                                  }}
                                                                  className="machine"
                                                                  disabled
                                                                  onClick={() =>
                                                                    pathToCheckSheet(
                                                                      machine,
                                                                      line.line_name
                                                                    )
                                                                  }
                                                                >
                                                                  {
                                                                    machine.machine_nickname
                                                                  }
                                                                </button>
                                                              </>
                                                            ) : (
                                                              ""
                                                            );
                                                          }
                                                        )}
                                                      </div>
                                                    </div>
                                                  </Col>
                                                </>
                                              ) : (
                                                ""
                                              );
                                            }
                                          )}
                                        </Row>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  ""
                                );
                              })}
                            </Row>
                          </Container>
                        </div>
                      ) : (
                        ""
                      )
                    ) : (
                      <div className="cards">
                        <Container fluid>
                          <Row>
                            {context.section_data === sections
                              ? allDataSectionWise !== ""
                                ? allDataSectionWise.subSectionsData.map(
                                  (subSection) => {
                                    return (
                                      <>
                                        <Col
                                          xs={12}
                                          md={12}
                                          lg={12} className="gx-0"
                                          key={subSection}
                                        >
                                          <div className="subSection">
                                            <div className="subSectionText">
                                              {subSection.subSection_name}
                                            </div>

                                            {allDataSectionWise.cellData.map(
                                              (cell) => {
                                                return subSection._id ===
                                                  cell.subSection_names ? (
                                                  <>
                                                    <div className="cell">
                                                      <p>{cell.cell_name}</p>

                                                      <div>
                                                        <Row
                                                          style={{
                                                            display: "flex",
                                                            justifyContent:
                                                              "flex-start",
                                                            // margin: "0.5rem",
                                                          }}
                                                        >
                                                          {allDataSectionWise.lineData.map(
                                                            (line) => {
                                                              return cell._id ===
                                                                line.cell_names ? (
                                                                <>
                                                                  <Col
                                                                    xs={12}
                                                                    md={6}
                                                                    lg={3}
                                                                  // key={subSection}
                                                                  >
                                                                    <div className="line">
                                                                      <div className="line_name">
                                                                        <p>
                                                                          {
                                                                            line.line_name
                                                                          }
                                                                        </p>
                                                                      </div>
                                                                      <div className="machineCard">
                                                                        {allDataSectionWise.machineData.map(
                                                                          (
                                                                            machine
                                                                          ) => {
                                                                            return line._id ===
                                                                              machine.line_names ? (
                                                                              <>
                                                                                <button
                                                                                  style={{
                                                                                    background:
                                                                                      machine
                                                                                        .checkSheet_data
                                                                                        ?.PMStatus
                                                                                        ? machine
                                                                                          .checkSheet_data
                                                                                          ?.PMStatus[
                                                                                          selectedMonth
                                                                                        ] ===
                                                                                          "Current Plan"
                                                                                          ? "white"
                                                                                          : machine
                                                                                            .checkSheet_data
                                                                                            ?.PMStatus[
                                                                                            selectedMonth
                                                                                          ] ===
                                                                                            "Ongoing"
                                                                                            ? "#ffff59"
                                                                                            : machine
                                                                                              .checkSheet_data
                                                                                              ?.PMStatus[
                                                                                              selectedMonth
                                                                                            ] ===
                                                                                              "Completed"
                                                                                              ? "#5fe15f"
                                                                                              : machine
                                                                                                .checkSheet_data
                                                                                                ?.PMStatus[
                                                                                                selectedMonth
                                                                                              ] ===
                                                                                                "Done with delay"
                                                                                                ? "#ffc356"
                                                                                                : machine
                                                                                                  .checkSheet_data
                                                                                                  ?.PMStatus[
                                                                                                  selectedMonth
                                                                                                ] ===
                                                                                                  "PM Skip" ||
                                                                                                  machine
                                                                                                    .checkSheet_data
                                                                                                    ?.PMStatus[
                                                                                                  selectedMonth
                                                                                                  ] ===
                                                                                                  "No Completion"
                                                                                                  ? "#ff8888"
                                                                                                  : "#ababab"
                                                                                        : "#ababab",
                                                                                  }}
                                                                                  className="machine"
                                                                                  onClick={() =>
                                                                                    pathToCheckSheet(
                                                                                      machine,
                                                                                      line.line_name
                                                                                    )
                                                                                  }
                                                                                >
                                                                                  {
                                                                                    machine.machine_nickname
                                                                                  }
                                                                                </button>
                                                                              </>
                                                                            ) : (
                                                                              ""
                                                                            );
                                                                          }
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  </Col>
                                                                </>
                                                              ) : (
                                                                ""
                                                              );
                                                            }
                                                          )}
                                                        </Row>
                                                      </div>
                                                    </div>
                                                  </>
                                                ) : (
                                                  ""
                                                );
                                              }
                                            )}
                                          </div>
                                        </Col>
                                      </>
                                    );
                                  }
                                )
                                : ""
                              : allDataSectionWise !== ""
                                ? allDataSectionWise.subSectionsData.map(
                                  (subSection) => {
                                    return (
                                      <>
                                        <Col
                                          xs={12}
                                          md={12}
                                          lg={12}
                                          key={subSection}
                                        >
                                          <div className="subSection">
                                            <div className="subSectionText">
                                              {subSection.subSection_name}
                                            </div>

                                            {allDataSectionWise.cellData.map(
                                              (cell) => {
                                                return subSection._id ===
                                                  cell.subSection_names ? (
                                                  <>
                                                    <div className="cell">
                                                      <p>{cell.cell_name}</p>

                                                      <div>
                                                        <Row
                                                          style={{
                                                            display: "flex",
                                                            justifyContent:
                                                              "flex-start",
                                                            // margin: "0.5rem",
                                                          }}
                                                        >
                                                          {allDataSectionWise.lineData.map(
                                                            (line) => {
                                                              return cell._id ===
                                                                line.cell_names ? (
                                                                <>
                                                                  <Col
                                                                    xs={12}
                                                                    md={6}
                                                                    lg={3}
                                                                  // key={subSection}
                                                                  >
                                                                    <div className="line">
                                                                      <div className="line_name">
                                                                        <p>
                                                                          {
                                                                            line.line_name
                                                                          }
                                                                        </p>
                                                                      </div>
                                                                      <div className="machineCard">
                                                                        {allDataSectionWise.machineData.map(
                                                                          (
                                                                            machine
                                                                          ) => {
                                                                            return line._id ===
                                                                              machine.line_names ? (
                                                                              <>
                                                                                <button
                                                                                  style={{
                                                                                    background:
                                                                                      machine
                                                                                        .checkSheet_data
                                                                                        ?.PMStatus
                                                                                        ? machine
                                                                                          .checkSheet_data
                                                                                          ?.PMStatus[
                                                                                          selectedMonth
                                                                                        ] ===
                                                                                          "Current Plan"
                                                                                          ? "white"
                                                                                          : machine
                                                                                            .checkSheet_data
                                                                                            ?.PMStatus[
                                                                                            selectedMonth
                                                                                          ] ===
                                                                                            "Ongoing"
                                                                                            ? "#ffff59"
                                                                                            : machine
                                                                                              .checkSheet_data
                                                                                              ?.PMStatus[
                                                                                              selectedMonth
                                                                                            ] ===
                                                                                              "Completed"
                                                                                              ? "#5fe15f"
                                                                                              : machine
                                                                                                .checkSheet_data
                                                                                                ?.PMStatus[
                                                                                                selectedMonth
                                                                                              ] ===
                                                                                                "Done with delay"
                                                                                                ? "#ffc356"
                                                                                                : machine
                                                                                                  .checkSheet_data
                                                                                                  ?.PMStatus[
                                                                                                  selectedMonth
                                                                                                ] ===
                                                                                                  "PM Skip" ||
                                                                                                  machine
                                                                                                    .checkSheet_data
                                                                                                    ?.PMStatus[
                                                                                                  selectedMonth
                                                                                                  ] ===
                                                                                                  "No Completion"
                                                                                                  ? "#ff8888"
                                                                                                  : "#ababab"
                                                                                        : "#ababab",
                                                                                  }}
                                                                                  className="machine"
                                                                                  disabled
                                                                                  onClick={() =>
                                                                                    pathToCheckSheet(
                                                                                      machine,
                                                                                      line.line_name
                                                                                    )
                                                                                  }
                                                                                >
                                                                                  {
                                                                                    machine.machine_nickname
                                                                                  }
                                                                                </button>
                                                                              </>
                                                                            ) : (
                                                                              ""
                                                                            );
                                                                          }
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  </Col>
                                                                </>
                                                              ) : (
                                                                ""
                                                              );
                                                            }
                                                          )}
                                                        </Row>
                                                      </div>
                                                    </div>
                                                  </>
                                                ) : (
                                                  ""
                                                );
                                              }
                                            )}
                                          </div>
                                        </Col>
                                      </>
                                    );
                                  }
                                )
                                : ""}
                          </Row>
                        </Container>
                      </div>
                    )
                  ) : allDataSectionWise ? (
                    allDataSectionWise.sectionInfo[0].dashboardLevel ===
                      "Yes" ? (
                      allDataSectionWise !== "" ? (
                        allDataSectionWise.subSectionsData.map((subSection) => {
                          return (
                            <>
                              <Col xs={12} md={12} lg={12} key={subSection}>
                                <div className="subSection">
                                  <div className="subSectionText">
                                    {subSection.subSection_name}
                                  </div>

                                  {allDataSectionWise.cellData.map((cell) => {
                                    return subSection._id ===
                                      cell.subSection_names ? (
                                      <>
                                        <div className="cell">
                                          <p>{cell.cell_name}</p>

                                          <div>
                                            <Row
                                              style={{
                                                display: "flex",
                                                justifyContent: "flex-start",
                                                // margin: "0.5rem",
                                              }}
                                            >
                                              {allDataSectionWise.lineData.map(
                                                (line) => {
                                                  return cell._id ===
                                                    line.cell_names ? (
                                                    <>
                                                      <Col
                                                        xs={12}
                                                        md={6}
                                                        lg={3}
                                                      // key={subSection}
                                                      >
                                                        <div className="line">
                                                          <div className="line_name">
                                                            <p>
                                                              {line.line_name}
                                                            </p>
                                                          </div>
                                                          <div className="machineCard">
                                                            {allDataSectionWise.machineData.map(
                                                              (machine) => {
                                                                return line._id ===
                                                                  machine.line_names ? (
                                                                  <>
                                                                    {/* <Button variant="primary" onClick={handleShow}>Generate QR</Button> */}
                                                                    <button
                                                                      style={{
                                                                        // border:
                                                                        //   "1px solid black",
                                                                        background:
                                                                          machine
                                                                            .checkSheet_data
                                                                            ?.PMStatus
                                                                            ? machine
                                                                              .checkSheet_data
                                                                              ?.PMStatus[
                                                                              selectedMonth
                                                                            ] ===
                                                                              "Current Plan"
                                                                              ? "white"
                                                                              : machine
                                                                                .checkSheet_data
                                                                                ?.PMStatus[
                                                                                selectedMonth
                                                                              ] ===
                                                                                "Ongoing"
                                                                                ? "#ffff59"
                                                                                : machine
                                                                                  .checkSheet_data
                                                                                  ?.PMStatus[
                                                                                  selectedMonth
                                                                                ] ===
                                                                                  "Completed"
                                                                                  ? "#5fe15f"
                                                                                  : machine
                                                                                    .checkSheet_data
                                                                                    ?.PMStatus[
                                                                                    selectedMonth
                                                                                  ] ===
                                                                                    "Done with delay"
                                                                                    ? "#ffc356"
                                                                                    : machine
                                                                                      .checkSheet_data
                                                                                      ?.PMStatus[
                                                                                      selectedMonth
                                                                                    ] ===
                                                                                      "PM Skip" ||
                                                                                      machine
                                                                                        .checkSheet_data
                                                                                        ?.PMStatus[
                                                                                      selectedMonth
                                                                                      ] ===
                                                                                      "No Completion"
                                                                                      ? "#ff8888"
                                                                                      : "#ababab"
                                                                            : "#ababab",
                                                                      }}
                                                                      className="machine"
                                                                      onClick={() => {
                                                                        pathToCheckSheet(
                                                                          machine,
                                                                          line.line_name
                                                                        );
                                                                      }}
                                                                    >
                                                                      {
                                                                        machine.machine_nickname
                                                                      }
                                                                    </button>
                                                                  </>
                                                                ) : (
                                                                  ""
                                                                );
                                                              }
                                                            )}
                                                          </div>
                                                        </div>
                                                      </Col>
                                                    </>
                                                  ) : (
                                                    ""
                                                  );
                                                }
                                              )}
                                            </Row>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      ""
                                    );
                                  })}
                                </div>
                              </Col>
                            </>
                          );
                        })
                      ) : (
                        ""
                      )
                    ) : selectedSubSectionId ? (
                      context.subSection_data.includes(subSection) ? (
                        <div className="cards">
                          <Container fluid>
                            <Row>
                              {allDataSectionWise.cellData.map((cell) => {
                                return selectedSubSectionId ===
                                  cell.subSection_names ? (
                                  <>
                                    <div className="cell">
                                      <p>{cell.cell_name}</p>

                                      <div>
                                        <Row
                                          style={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            // margin: "0.5rem",
                                          }}
                                        >
                                          {allDataSectionWise.lineData.map(
                                            (line) => {
                                              return cell._id ===
                                                line.cell_names ? (
                                                <>
                                                  <Col
                                                    xs={12}
                                                    md={6}
                                                    lg={3}
                                                  // key={subSection}
                                                  >
                                                    <div className="line">
                                                      <div className="line_name">
                                                        <p>{line.line_name}</p>
                                                      </div>
                                                      <div className="machineCard">
                                                        {allDataSectionWise.machineData.map(
                                                          (machine) => {
                                                            return line._id ===
                                                              machine.line_names ? (
                                                              <>
                                                                <button
                                                                  style={{
                                                                    background:
                                                                      machine
                                                                        .checkSheet_data
                                                                        ?.PMStatus
                                                                        ? machine
                                                                          .checkSheet_data
                                                                          ?.PMStatus[
                                                                          selectedMonth
                                                                        ] ===
                                                                          "Current Plan"
                                                                          ? "white"
                                                                          : machine
                                                                            .checkSheet_data
                                                                            ?.PMStatus[
                                                                            selectedMonth
                                                                          ] ===
                                                                            "Ongoing"
                                                                            ? "#ffff59"
                                                                            : machine
                                                                              .checkSheet_data
                                                                              ?.PMStatus[
                                                                              selectedMonth
                                                                            ] ===
                                                                              "Completed"
                                                                              ? "#5fe15f"
                                                                              : machine
                                                                                .checkSheet_data
                                                                                ?.PMStatus[
                                                                                selectedMonth
                                                                              ] ===
                                                                                "Done with delay"
                                                                                ? "#ffc356"
                                                                                : machine
                                                                                  .checkSheet_data
                                                                                  ?.PMStatus[
                                                                                  selectedMonth
                                                                                ] ===
                                                                                  "PM Skip" ||
                                                                                  machine
                                                                                    .checkSheet_data
                                                                                    ?.PMStatus[
                                                                                  selectedMonth
                                                                                  ] ===
                                                                                  "No Completion"
                                                                                  ? "#ff8888"
                                                                                  : "#ababab"
                                                                        : "#ababab",
                                                                  }}
                                                                  className="machine"
                                                                  onClick={() =>
                                                                    pathToCheckSheet(
                                                                      machine,
                                                                      line.line_name
                                                                    )
                                                                  }
                                                                >
                                                                  {
                                                                    machine.machine_nickname
                                                                  }
                                                                </button>
                                                              </>
                                                            ) : (
                                                              ""
                                                            );
                                                          }
                                                        )}
                                                      </div>
                                                    </div>
                                                  </Col>
                                                </>
                                              ) : (
                                                ""
                                              );
                                            }
                                          )}
                                        </Row>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  ""
                                );
                              })}
                            </Row>
                          </Container>
                        </div>
                      ) : (
                        <div className="cards">
                          <Container fluid>
                            <Row>
                              {allDataSectionWise.cellData.map((cell) => {
                                return selectedSubSectionId ===
                                  cell.subSection_names ? (
                                  <>
                                    <div className="cell">
                                      <p>{cell.cell_name}</p>

                                      <div>
                                        <Row
                                          style={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            // margin: "0.5rem",
                                          }}
                                        >
                                          {allDataSectionWise.lineData.map(
                                            (line) => {
                                              return cell._id ===
                                                line.cell_names ? (
                                                <>
                                                  <Col
                                                    xs={12}
                                                    md={6}
                                                    lg={3}
                                                  // key={subSection}
                                                  >
                                                    <div className="line">
                                                      <div className="line_name">
                                                        <p>{line.line_name}</p>
                                                      </div>
                                                      <div className="machineCard">
                                                        {allDataSectionWise.machineData.map(
                                                          (machine) => {
                                                            return line._id ===
                                                              machine.line_names ? (
                                                              <>
                                                                <button
                                                                  style={{
                                                                    background:
                                                                      machine
                                                                        .checkSheet_data
                                                                        ?.PMStatus
                                                                        ? machine
                                                                          .checkSheet_data
                                                                          ?.PMStatus[
                                                                          selectedMonth
                                                                        ] ===
                                                                          "Current Plan"
                                                                          ? "white"
                                                                          : machine
                                                                            .checkSheet_data
                                                                            ?.PMStatus[
                                                                            selectedMonth
                                                                          ] ===
                                                                            "Ongoing"
                                                                            ? "#ffff59"
                                                                            : machine
                                                                              .checkSheet_data
                                                                              ?.PMStatus[
                                                                              selectedMonth
                                                                            ] ===
                                                                              "Completed"
                                                                              ? "#5fe15f"
                                                                              : machine
                                                                                .checkSheet_data
                                                                                ?.PMStatus[
                                                                                selectedMonth
                                                                              ] ===
                                                                                "Done with delay"
                                                                                ? "#ffc356"
                                                                                : machine
                                                                                  .checkSheet_data
                                                                                  ?.PMStatus[
                                                                                  selectedMonth
                                                                                ] ===
                                                                                  "PM Skip" ||
                                                                                  machine
                                                                                    .checkSheet_data
                                                                                    ?.PMStatus[
                                                                                  selectedMonth
                                                                                  ] ===
                                                                                  "No Completion"
                                                                                  ? "#ff8888"
                                                                                  : "#ababab"
                                                                        : "#ababab",
                                                                  }}
                                                                  className="machine"
                                                                  disabled
                                                                  onClick={() =>
                                                                    pathToCheckSheet(
                                                                      machine,
                                                                      line.line_name
                                                                    )
                                                                  }
                                                                >
                                                                  {
                                                                    machine.machine_nickname
                                                                  }
                                                                </button>
                                                              </>
                                                            ) : (
                                                              ""
                                                            );
                                                          }
                                                        )}
                                                      </div>
                                                    </div>
                                                  </Col>
                                                </>
                                              ) : (
                                                ""
                                              );
                                            }
                                          )}
                                        </Row>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  ""
                                );
                              })}
                            </Row>
                          </Container>
                        </div>
                      )
                    ) : selectedSubSectionIdForDefaultDashboard ? (
                      <div className="cards">
                        <Container fluid>
                          <Row>
                            {allDataSectionWise.cellData.map((cell) => {
                              return selectedSubSectionIdForDefaultDashboard ===
                                cell.subSection_names ? (
                                <>
                                  <div className="cell">
                                    <p>{cell.cell_name}</p>

                                    <div>
                                      <Row
                                        style={{
                                          display: "flex",
                                          justifyContent: "flex-start",
                                          // margin: "0.5rem",
                                        }}
                                      >
                                        {allDataSectionWise.lineData.map(
                                          (line) => {
                                            return cell._id ===
                                              line.cell_names ? (
                                              <>
                                                <Col
                                                  xs={12}
                                                  md={6}
                                                  lg={3}
                                                // key={subSection}
                                                >
                                                  <div className="line">
                                                    <div className="line_name">
                                                      <p>{line.line_name}</p>
                                                    </div>
                                                    <div className="machineCard">
                                                      {allDataSectionWise.machineData.map(
                                                        (machine) => {
                                                          return line._id ===
                                                            machine.line_names ? (
                                                            <>
                                                              <button
                                                                style={{
                                                                  background:
                                                                    machine
                                                                      .checkSheet_data
                                                                      ?.PMStatus
                                                                      ? machine
                                                                        .checkSheet_data
                                                                        ?.PMStatus[
                                                                        selectedMonth
                                                                      ] ===
                                                                        "Current Plan"
                                                                        ? "white"
                                                                        : machine
                                                                          .checkSheet_data
                                                                          ?.PMStatus[
                                                                          selectedMonth
                                                                        ] ===
                                                                          "Ongoing"
                                                                          ? "#ffff59"
                                                                          : machine
                                                                            .checkSheet_data
                                                                            ?.PMStatus[
                                                                            selectedMonth
                                                                          ] ===
                                                                          "Completed"
                                                                        ? "#5fe15f"
                                                                        : machine
                                                                            .checkSheet_data
                                                                            ?.PMStatus[
                                                                            selectedMonth
                                                                          ] ===
                                                                          "Done with delay"
                                                                        ? "#ffc356"
                                                                        : machine
                                                                            .checkSheet_data
                                                                            ?.PMStatus[
                                                                            selectedMonth
                                                                          ] ===
                                                                            "PM Skip" ||
                                                                          machine
                                                                            .checkSheet_data
                                                                            ?.PMStatus[
                                                                            selectedMonth
                                                                          ] ===
                                                                            "No Completion"
                                                                        ? "#ff8888"
                                                                        : "#ababab"
                                                                      : "#ababab",
                                                                }}
                                                                className="machine"
                                                                onClick={() =>
                                                                  pathToCheckSheet(
                                                                    machine,
                                                                    line.line_name
                                                                  )
                                                                }
                                                              >
                                                                {
                                                                  machine.machine_nickname
                                                                }
                                                              </button>
                                                            </>
                                                          ) : (
                                                            ""
                                                          );
                                                        }
                                                      )}
                                                    </div>
                                                  </div>
                                                </Col>
                                              </>
                                            ) : (
                                              ""
                                            );
                                          }
                                        )}
                                      </Row>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                ""
                              );
                            })}
                          </Row>
                        </Container>
                      </div>
                    ) : (
                      ""
                    )
                  ) : (
                    ""
                  )}
                </div>
              </Col>
            ) : (
              <div
                className="container-fluid d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
              >
                <LoadingAnimation />
              </div>
            )}
          </Col>

          <Col xs={12} sm={12} md={12} lg={3}>
            <GraphsInMainDashboard
              sections={sections}
              subSection={subSection}
              allDataSectionWise={allDataSectionWise}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              currentMonthGraphAndTableData={currentMonthGraphAndTableData}
              annualGraph={annualGraph}
            />
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default MainDashboard;
