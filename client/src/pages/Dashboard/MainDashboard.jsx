import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import RoutingContext from "../../context/routing/RoutingContext";
import "./MainDashboard.scss";
import { Container, Row, Col } from "reactstrap";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GettingMachineDataForCheckSheetImplementation from "../Operator/GettingMachineDataForCheckSheetImplementation";
import RectangleIcon from "@mui/icons-material/Rectangle";

import currentYear from "./DashboardComponent/currentYear";
import YearDropDownForMainDashboard from "./DashboardComponent/YearDropDownForMainDashboard";
import MonthDropDownForMainDashboard from "./DashboardComponent/MonthDropDownForMainDashboard";
import currentMonth from "./DashboardComponent/currentMonth";

import GraphsInMainDashboard from "./DashboardComponent/GraphsInMainDashboard";
import CellGrid, {
  SubSectionGrid,
  buildHierarchyIndex,
} from "./DashboardComponent/MachineHierarchyGrid";
import LoadingAnimation from "../Reports/ReportComponents/LoadingAnimation";

import Footer from "../../components/Footer/Footer";

const MainDashboard = () => {
  const [sections, setsections] = useState();
  const [subSection, setSubSection] = useState("");

  const [stateForLoadingAnimation, setStateForLoadingAnimation] = useState();

  const [refFinancialYear, setRefFinancialYear] = useState({});
  const [refKeyForFinancialYear, setRefKeyForFinancialYear] = useState(0);

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
    setallDataSectionWise("");

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
  /**
   * The sub-section select carries "<subSection_id>-<subSection_name>"; the
   * grid needs the mongo _id. Reads the list the dropdown was built from,
   * whichever of the two responses supplied it.
   */
  const getSelectedSubsection = (selectedData) => {
    const subSectionId = selectedData.split("-")[0];
    const list = subSectionList
      ? subSectionList.subSectionsInfo
      : allDataSectionWise.subSectionsData;

    const match = list?.find((item) => item.subSection_id === subSectionId);
    if (match) setSelectedSubSectionId(match._id);
  };

  const closeCheckSheet = () => {
    postSectionToGetAllDataForMainDashboard(context.section_data);
    postSectionToGetSectionInfo(sections || context.section_data);
    setMachineWiseCheckSheetForImplementation("");
  };

  const pathToCheckSheet = (machine, lineName) => {
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

  };

  /**
   * cell -> lines and line -> machines, grouped once per payload instead of on
   * every render. The grid components below read these instead of scanning the
   * flat arrays, and because the grouping keeps each array's original order the
   * cells, lines and machines still appear exactly where they did before.
   */
  const hierarchyIndex = useMemo(
    () => buildHierarchyIndex(allDataSectionWise),
    [allDataSectionWise]
  );

  /**
   * A click handler that never changes identity, so the memoised grid is not
   * rebuilt every render. The ref always points at the current
   * pathToCheckSheet, which closes over selectedYear and the section, so the
   * sheet that opens is the same one as before.
   */
  const pathToCheckSheetRef = useRef(pathToCheckSheet);
  pathToCheckSheetRef.current = pathToCheckSheet;
  const onMachineClick = useCallback(
    (machine, lineName) => pathToCheckSheetRef.current(machine, lineName),
    []
  );

  /**
   * Who may open a check sheet from the grid.
   *
   * A user can act on the sub-sections they are assigned to, and on their own
   * section; anywhere else the buttons look the same but are disabled. Both
   * tests were repeated across the branches below, each branch carrying its own
   * near-identical copy of the grid, so they are named once here instead.
   */
  const userOwnsSelectedSubSection =
    context.subSection_data.includes(subSection);
  const viewingOwnSection = context.section_data === sections;

  useEffect(() => {
    postPlantToGetSectionList();
  }, []);

  useEffect(() => {
    postSectionToGetAllDataForMainDashboard(sections || context?.section_data);
  }, [sections, selectedYear, refKeyForFinancialYear]);

  useEffect(() => {
    if (sections) {
      postSectionToGetSubSectionList(sections);
    }
  }, [sections]);

  // useEffect(() => {
  //   postSectionToGetAllDataForMainDashboard(context.section_data);

  //   // if (context.user_type === "Operator") {
  //   //   postSectionToGetAllDataForMainDashboard(context.section_data);
  //   // } else {
  //   //   postSectionToGetAllDataForMainDashboardForOtherUser(context.section_data);
  //   // }
  // }, [context.section_data, selectedYear]);

  /**
   * On a section whose dashboardLevel is "No" the grid has to start on some
   * sub-section, and that is the first one the signed-in user is assigned to.
   */
  const setDeafaultDataForNoDashboard = (data) => {
    if (data.sectionInfo?.[0]?.dashboardLevel !== "No") return;
    if (!context.subSection_data?.length) return;

    const subSectionId = context.subSection_data[0].split("-")[0];
    const match = data.subSectionsData?.find(
      (item) => item.subSection_id === subSectionId
    );
    if (match) setSelectedSubSectionIdForDefaultDashboard(match._id);
  };

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
      setStateForLoadingAnimation(<LoadingAnimation />);
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
        // getFinancialYears();
        setRefKeyForFinancialYear(
          (refKeyForFinancialYear) => refKeyForFinancialYear + 1
        );

        // console.log("Data post");
        // console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
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
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postSectionToGetSectionInfo = async (sectionName) => {
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
            /**
             * Only ask once there is a sub-section to ask about. This effect
             * also runs before the dashboard payload has arrived, when
             * selectedSubSectionIdForDefaultDashboard is still undefined, and
             * the server matches no cells for an undefined id - so the reply is
             * a set of empty totals that would overwrite whatever the charts
             * had just been given.
             */
            if (selectedSubSectionIdForDefaultDashboard) {
              await postSectionToGetAllDataForMainDashboardGraph(
                selectedSubSectionIdForDefaultDashboard,
                data?.sectionInfo?.dashboardLevel
              );
              await postSectionToGetAllDataForAnnualStatusReport(
                selectedSubSectionIdForDefaultDashboard,
                data?.sectionInfo?.dashboardLevel
              );
            }
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
    /**
     * Same reason as above: with no sub-section selected these two requests
     * scope to nothing and return empty totals. They used to fire on every
     * mount and on every month and year change - including on sections whose
     * dashboardLevel is "Yes", where the charts are driven by
     * postSectionToGetSectionInfo instead - and whichever reply landed last
     * won, so the charts could be blanked by the empty one.
     *
     * Clearing the charts when the section changes still happens where it
     * always did, in the section select's onChange.
     */
    if (!selectedSubSectionId) return;

    postSectionToGetAllDataForMainDashboardGraph(selectedSubSectionId, "No");
    postSectionToGetAllDataForAnnualStatusReport(selectedSubSectionId, "No");
  }, [selectedSubSectionId, selectedYear, selectedMonth]);

  useEffect(() => {
    postSectionToGetSectionInfo(sections || context.section_data);
  }, [
    selectedYear,
    selectedMonth,
    sections,
    selectedSubSectionIdForDefaultDashboard,
  ]);

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
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getFinancialYears = async () => {
    try {
      const res = await fetch("/getFinancialYears", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await res.json();

      // console.log("___________", currentYear, data?.getFinancialYearsArray);

      setRefFinancialYear(data?.getFinancialYearsArray);
      setStateForLoadingAnimation();

      if (res.status === 400 || res.status === 422 || !data) {
        return res.status(422).send("Data not received !!!");
      }
    } catch (error) {
      console.log("No data found ( Unauthorized ) !!!");
    }
  };

  useEffect(() => {
    if (context.user_type === "Plant-Admin" && new Date().getMonth() === 3) {
      getFinancialYears();
    }
  }, [refKeyForFinancialYear]);

  return (
    <>
      {machineWiseCheckSheetForImplementation}

      {/* <button onClick={funForDummyApi}>dummy</button> */}
      <Container fluid className="operatorDashboard">
        <Row>
          <Col xs={12} sm={12} md={12} xl={9} className="mt-4 left-component-main-dashboard">
            {Object.keys(allDataSectionWise).length > 0 ? (
              <Col>
                <div class="container-fluid px-2">
                  <div class="row cell gx-0">
                    <Col lg={3} md={12} sm={12} className="mt-1">
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
                                  return (
                                    <option value={option}>{option}</option>
                                  );
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
                              <span>
                                <b>&nbsp;Sub Section: &nbsp;</b>
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
                          subSectionList.sectionInfo.dashboardLevel ===
                          "Yes" ? (
                            ""
                          ) : (
                            <div sm={6} lg={4}>
                              {/* <div>
                            </div> */}
                              <span
                                style={{ fontWeight: "500", fontSize: "12px" }}
                              >
                                &nbsp; Sub Section: &nbsp;
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
                                value={
                                  subSection === undefined ? "" : subSection
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
                    <Col lg={3} md={12} sm={12} className="mt-1">
                      {context.user_type === "Plant-Admin" &&
                      new Date().getMonth() === 3 ? (
                        refFinancialYear?.financialYears?.includes(
                          `${new Date().getFullYear()}-${
                            new Date().getFullYear() + 1
                          }`
                        ) ? (
                          ""
                        ) : stateForLoadingAnimation ? (
                          <div className="d-flex align-items-center justify-content-center">
                            {stateForLoadingAnimation}
                          </div>
                        ) : (
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
                                {`${new Date().getFullYear()}-${
                                  new Date().getFullYear() + 1
                                }`}
                              </b>
                            </button>
                          </Col>
                        )
                      ) : (
                        ""
                      )}
                    </Col>
                    <Col lg={6} md={12} sm={12} className="mt-1">
                      <Row>
                        <Col sm>
                          <YearDropDownForMainDashboard
                            selectedYear={selectedYear}
                            setSelectedYear={setSelectedYear}
                            refKeyForFinancialYear={refKeyForFinancialYear}
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

                <div
                  className=" row cell mx-2 gy-3 mt-0 pt-0"
                  style={{ background: "#E0E0E0" }}
                >
                  &nbsp;&nbsp;
                  <Col lg={7} md={12} className="mt-0">
                    <h6>Current Month</h6>
                    <div className="cell grid-view">
                      <div
                        style={{
                          fontSize: "14px",
                        }}
                      >
                        <RectangleIcon
                          className="bg-white"
                          style={{ color: "#ffffff", fontSize: "14px" }}
                        />{" "}
                        &nbsp;Schedule
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                        }}
                      >
                        <RectangleIcon
                          style={{
                            background: "#ffff59",
                            color: "#ffff59",
                            fontSize: "14px",
                          }}
                        />{" "}
                        &nbsp;Ongoing
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                        }}
                      >
                        <RectangleIcon
                          style={{
                            background: "#5fe15f",
                            color: "5fe15f",
                            fontSize: "14px",
                          }}
                        />{" "}
                        &nbsp;Completed
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                        }}
                      >
                        <RectangleIcon
                          style={{
                            background: "#ababab",
                            color: "#ababab",
                            fontSize: "14px",
                          }}
                        />{" "}
                        &nbsp;Not Schedule
                      </div>

                      {/* <div
                        style={{
                          fontSize: "14px",
                        }}
                      >
                        <RectangleIcon
                          style={{
                            background: "#A0DEFF",
                            color: "#A0DEFF",
                            fontSize: "14px",
                          }}
                        />{" "}
                        &nbsp;Not Approved
                      </div> */}
                    </div>
                  </Col>
                  &nbsp;&nbsp;
                  <Col lg={4} md={12} sm={12} className="mt-0">
                    <h6>Previous Month</h6>
                    <Row className="cell">
                      <Col
                        style={{
                          fontSize: "14px",
                        }}
                      >
                        <RectangleIcon
                          style={{
                            background: "#ffc356",
                            color: "#ffc356",
                            fontSize: "14px",
                          }}
                        />{" "}
                        &nbsp;Done with delay
                      </Col>
                      <Col
                        style={{
                          fontSize: "14px",
                        }}
                      >
                        <RectangleIcon
                          style={{
                            background: "#ff8888",
                            color: "#ff8888",
                            fontSize: "14px",
                          }}
                        />{" "}
                        &nbsp;PM Skip
                      </Col>
                    </Row>
                  </Col>
                </div>

                {/* <div>{checkSheetState}</div> */}
                {/* dashboardCard section */}

                <div className="dashboardCard mx-2">
                  {/* {allDataSectionWise !== ""
            ? console.log(allDataSectionWise.subSectionsData)
            : ""} */}

                  {subSectionList.sectionInfo ? (
                    subSectionList.sectionInfo.dashboardLevel === "No" ? (
                      selectedSubSectionId ? (
                        <div className="cards">
                          <Container fluid>
                            <Row>
                              <CellGrid
                                subSectionId={selectedSubSectionId}
                                index={hierarchyIndex}
                                selectedMonth={selectedMonth}
                                disabled={!userOwnsSelectedSubSection}
                                onMachineClick={onMachineClick}
                              />
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
                            {allDataSectionWise !== "" ? (
                              <SubSectionGrid
                                subSections={allDataSectionWise.subSectionsData}
                                index={hierarchyIndex}
                                selectedMonth={selectedMonth}
                                disabled={!viewingOwnSection}
                                onMachineClick={onMachineClick}
                                colClassName={
                                  viewingOwnSection ? "gx-0" : undefined
                                }
                              />
                            ) : (
                              ""
                            )}
                          </Row>
                        </Container>
                      </div>
                    )
                  ) : allDataSectionWise ? (
                    allDataSectionWise.sectionInfo[0].dashboardLevel ===
                    "Yes" ? (
                      <SubSectionGrid
                        subSections={allDataSectionWise.subSectionsData}
                        index={hierarchyIndex}
                        selectedMonth={selectedMonth}
                        onMachineClick={onMachineClick}
                      />
                    ) : selectedSubSectionId ? (
                      <div className="cards">
                        <Container fluid>
                          <Row>
                            <CellGrid
                              subSectionId={selectedSubSectionId}
                              index={hierarchyIndex}
                              selectedMonth={selectedMonth}
                              disabled={!userOwnsSelectedSubSection}
                              onMachineClick={onMachineClick}
                            />
                          </Row>
                        </Container>
                      </div>
                    ) : selectedSubSectionIdForDefaultDashboard ? (
                      <div className="cards">
                        <Container fluid>
                          <Row>
                            <CellGrid
                              subSectionId={selectedSubSectionIdForDefaultDashboard}
                              index={hierarchyIndex}
                              selectedMonth={selectedMonth}
                              onMachineClick={onMachineClick}
                            />
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

          <Col
            xs={12}
            sm={12}
            md={12}
            xl={3}
            className="right-component-main-dashboard marginLeft"
            style={{ marginRight: "12px" }}
          >
            {/* <br />
            <br /> */}
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
