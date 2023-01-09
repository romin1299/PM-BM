import React, { useState, useEffect, useContext } from "react";
import RoutingContext from "../../context/routing/RoutingContext";
import "./MainDashboard.css";
import { Container, Row, Col } from "reactstrap";
import CheckSheet from "./CheckSheet";
import { useNavigate } from "react-router-dom";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import CheckSheetForImplementation from "../Operator/CheckSheetForImplementation";
import GettingMachineDataForCheckSheetImplementation from "../Operator/GettingMachineDataForCheckSheetImplementation";

import currentYear from "./DashboardComponent/currentYear";
import YearDropDown from "./DashboardComponent/YearDropDown";
import MonthDropDown from "./DashboardComponent/MonthDropDown";
import currentMonth from "./DashboardComponent/currentMonth";

import GraphsInMainDashboard from "./DashboardComponent/GraphsInMainDashboard";
import { light } from "@mui/material/styles/createPalette";
import LoadingAnimation from "../Reports/ReportComponents/LoadingAnimation";

const MainDashboard = () => {
  const [sections, setsections] = useState();
  const [subSection, setSubSection] = useState("");

  //for showing sub-section data based on it's selection
  const [selectedSubSectionId, setSelectedSubSectionId] = useState();

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

  const [refKey, setRefKey] = useState(0);
  const [refKey2, setRefKey2] = useState(0);

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
        console.log(data);
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
    if (context.user_type === "Operator") {
      postSectionToGetAllDataForMainDashboard(context.section_data);
    } else {
      postSectionToGetAllDataForMainDashboardForOtherUser(context.section_data);
    }
    setMachineWiseCheckSheetForImplementation("");
    document.querySelector(".operatorDashboard").style.pointerEvents = "auto";
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
      />
    );

    document.querySelector(".operatorDashboard").style.pointerEvents = "none";

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
  }, [refKey]);

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
  }, [sections, refKey2]);

  useEffect(() => {
    if (context.user_type === "Operator") {
      postSectionToGetAllDataForMainDashboard(context.section_data);
    } else {
      postSectionToGetAllDataForMainDashboardForOtherUser(context.section_data);
    }
  }, [context.section_data, selectedYear]);

  const setDeafaultDataForNoDashboard = (data) => {
    // console.log(allDataSectionWise)
    if (data.sectionInfo) {
      // console.log( context.subSection_data.length)

      if (data.sectionInfo[0].dashboardLevel === "No") {
        if (context.subSection_data.length === 1) {
          data.subSectionsData.map((id) => {
            // console.log(context.subSection_data[0]);
            let subSectionSplit = context.subSection_data[0].split("-");
            // console.log(subSectionSplit[0]);
            if (id.subSection_id === subSectionSplit[0]) {
              // console.log(id._id)
              setSelectedSubSectionIdForDefaultDashboard(id._id);
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
    toast.success("Financial year not started yet !", {
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

  const postSectionToGetAllDataForMainDashboardGraph = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllDataForMainDashboardGraph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
          selectedYear,
          selectedMonth,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data.machineData2[0][0].line_names.line_name);
        // console.log(data);
        setCurrentMonthGraphAndTableData(data);
        // setGraphData(data);
        // setTableData(data.lineDataWithCounter);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // setCurrentMonthGraphAndTableData("");
    postSectionToGetAllDataForMainDashboardGraph();
  }, [selectedYear, selectedMonth]);

  const [annualGraph, setAnnualGraph] = useState();

  const postSectionToGetAllDataForAnnualStatusReport = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllDataForAnnualStatusReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
          selectedYear,
          // month: selectedMonth,setsections
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data.machineData2[0][0].line_names.line_name);
        console.log(data);
        setAnnualGraph(data);
        // setTableData(data.lineDataWithCounter);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // setCurrentMonthGraphAndTableData("");
    postSectionToGetAllDataForAnnualStatusReport();
  }, [selectedYear]);
  return (
    <>
      {machineWiseCheckSheetForImplementation}
      <ToastContainer />

      <Container fluid className="operatorDashboard">
        <Row>
          {Object.keys(allDataSectionWise).length > 0 ? (
            <Col className="col-9">
              {/* <div className="row mb-4 d-flex align-items-center  m-2">
              <div className="col-3">
                <span style={{ fontWeight: "500", fontSize: "12px" }}>
                  Section: &nbsp;
                </span>{" "}
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  style={{ width: "50%" }}
                  id="standard-select-currency"
                  name="plant"
                  className="textField"
                  select
                  fullWidth // label="Select"
                  autoComplete="off"
                  value={sections === undefined ? "" : sections}
                  onChange={(e) => {
                    setsections(e.target.value);
                  }}
                  variant="standard"
                >
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
              </div>
              <div className="col-3">
                {allDataSectionWise ? (
                  allDataSectionWise.sectionInfo[0].dashboardLevel === "Yes" ? (
                    ""
                  ) : (
                    <div>
                      <span style={{ fontWeight: "500", fontSize: "12px" }}>
                        Sub Section: &nbsp;
                      </span>
                      <select
                        class="form-select form-select-sm"
                        aria-label=".form-select-sm example"
                        style={{ width: "50%" }}
                        name="plant"
                        className="textField"
                        select
                        fullWidth // label="Select"
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
                        }}
                        variant="standard"
                      >
                        <option selected disabled value="">
                          Please select
                        </option>
                        {allDataSectionWise
                          ? defaultSubSection?.map((option) => {
                              return (
                                <option className="optionStyle" value={option}>
                                  {option}
                                </option>
                              );
                            })
                          : subSectionList !== ""
                          ? subSectionList.subSectionArray.map((option) => {
                              return (
                                <option className="optionStyle" value={option}>
                                  {option}
                                </option>
                              );
                            })
                          : ""}
                      </select>
                    </div>
                  )
                ) : subSectionList.sectionInfo ? (
                  subSectionList.sectionInfo.dashboardLevel === "Yes" ? (
                    ""
                  ) : (
                    <div>
                      <span style={{ fontWeight: "500", fontSize: "12px" }}>
                        Sub Section: &nbsp;
                      </span>
                      <br />
                      <select
                        class="form-select form-select-sm"
                        aria-label=".form-select-sm example"
                        style={{ width: "150%" }}
                        name="plant"
                        className="textField"
                        select
                        fullWidth // label="Select"
                        autoComplete="off"
                        value={subSection === undefined ? "" : subSection}
                        onChange={(e) => {
                          getSelectedSubsection(e.target.value);
                          setSubSection(e.target.value);
                        }}
                        variant="standard"
                      >
                        
                        <option selected disabled value="">
                          Please select
                        </option>
                        {subSectionList !== ""
                          ? subSectionList.subSectionArray.map((option) => {
                              return (
                                <option className="optionStyle" value={option}>
                                  {option}
                                </option>
                              );
                            })
                          : ""}
                      </select>
                    </div>
                  )
                ) : (
                  ""
                )}
              </div>
              <div className="col-3"></div>
              <div className="col-3">
                {context.user_type === "Section-Admin" ? (
                  <button
                    className="btn"
                    onClick={addNewCheckSheetAfterChangeFinancialyear}
                  >
                    <AutorenewIcon /> &nbsp; Update{" "}
                    {`${new Date().getFullYear()}-${
                      new Date().getFullYear() + 1
                    }`}
                  </button>
                ) : (
                  ""
                )}
              </div>
            </div> */}
              <Row
                className="mx-2 mt-5 p-2 cell"
                // style={{ background: "#ffffff" }}
                // style={{ background: "#cee4ee", border: "1px solid" }}
              >
                <Col>
                  <span style={{ fontWeight: "500", fontSize: "12px" }}>
                    Section: &nbsp;
                  </span>{" "}
                  {/* <br /> */}
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    // style={{ width: "50%" }}
                    id="standard-select-currency"
                    name="plant"
                    className="textField"
                    select
                    // fullWidth // label="Select"
                    autoComplete="off"
                    value={sections === undefined ? "" : sections}
                    onChange={(e) => {
                      setsections(e.target.value);
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
                </Col>
                <Col>
                  {allDataSectionWise ? (
                    allDataSectionWise.sectionInfo[0].dashboardLevel ===
                    "Yes" ? (
                      ""
                    ) : (
                      <div>
                        <span style={{ fontWeight: "500", fontSize: "12px" }}>
                          Sub Section: &nbsp;
                        </span>
                        {/* <br /> */}
                        <select
                          class="form-select form-select-sm"
                          aria-label=".form-select-sm example"
                          // style={{ width: "50%" }}
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
                            ? subSectionList.subSectionArray.map((option) => {
                                return (
                                  <option
                                    className="optionStyle"
                                    value={option}
                                  >
                                    {option}
                                  </option>
                                );
                              })
                            : ""}
                        </select>
                      </div>
                    )
                  ) : subSectionList.sectionInfo ? (
                    subSectionList.sectionInfo.dashboardLevel === "Yes" ? (
                      ""
                    ) : (
                      <div>
                        <span style={{ fontWeight: "500", fontSize: "12px" }}>
                          Sub Section: &nbsp;
                        </span>
                        <br />
                        <select
                          class="form-select form-select-sm"
                          aria-label=".form-select-sm example"
                          // style={{ width: "150%" }}
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
                            ? subSectionList.subSectionArray.map((option) => {
                                return (
                                  <option
                                    className="optionStyle"
                                    value={option}
                                  >
                                    {option}
                                  </option>
                                );
                              })
                            : ""}
                        </select>
                      </div>
                    )
                  ) : (
                    ""
                  )}
                </Col>
                <Col>
                  {context.user_type === "Section-Admin" ? (
                    <button
                      className="btn"
                      onClick={addNewCheckSheetAfterChangeFinancialyear}
                    >
                      <AutorenewIcon /> &nbsp; Update{" "}
                      {`${new Date().getFullYear()}-${
                        new Date().getFullYear() + 1
                      }`}
                    </button>
                  ) : (
                    ""
                  )}
                </Col>
              </Row>

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
                <Col sm>
                  <div className="d-flex justify-content-end">
                    <button
                      onClick={navigateToSummeryDashboard}
                      className="btn"
                    >
                      Summary
                    </button>
                  </div>
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
                                                                        : "",
                                                                  }}
                                                                  className="machine"
                                                                  onClick={() =>
                                                                    pathToCheckSheet(
                                                                      machine.machine_code,
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
                                                                      : "",
                                                                }}
                                                                className="machine"
                                                                disabled
                                                                onClick={() =>
                                                                  pathToCheckSheet(
                                                                    machine.machine_code,
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
                                                                                        : "",
                                                                                  }}
                                                                                  className="machine"
                                                                                  onClick={() =>
                                                                                    pathToCheckSheet(
                                                                                      machine.machine_code,
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
                                                                                      : "",
                                                                                }}
                                                                                className="machine"
                                                                                disabled
                                                                                onClick={() =>
                                                                                  pathToCheckSheet(
                                                                                    machine.machine_code,
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
                  allDataSectionWise.sectionInfo[0].dashboardLevel === "Yes" ? (
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
                                                                        machine.machine_code,
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
                                                                      : "",
                                                                }}
                                                                className="machine"
                                                                onClick={() =>
                                                                  pathToCheckSheet(
                                                                    machine.machine_code,
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
                                                                      : "",
                                                                }}
                                                                className="machine"
                                                                disabled
                                                                onClick={() =>
                                                                  pathToCheckSheet(
                                                                    machine.machine_code,
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
                                                                    : "",
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
          <Col className="col-3">
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
    </>
  );
};

export default MainDashboard;
