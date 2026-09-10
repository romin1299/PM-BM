import React, { useEffect, useReducer, useContext, useState } from "react";

import { Container, Row, Col } from "reactstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import currentYear from "../../pages/Dashboard/DashboardComponent/currentYear";
import LoadingAnimation from "../../pages/Reports/ReportComponents/LoadingAnimation";
import RoutingContext from "../../context/routing/RoutingContext";
import MainRequestSheetForView from "../Tabs/RequestSheetForView/MainRequestSheetForView";

const MapComponent = ({
  propsArray,
  handleNavigationToRequestSheet,
  handleRequestSheetShowAndCloseState,
  reducerDispatch,
  ACTION,
  context,
  searchParams,
  setSearchParams,
}) => {
  const requestSheetStatusNotIncludeForCurrent = [
    "Generated",
    "Work Order Open",
    "Work Order Pending",
    "Work Order Closed",
    "Completed",
  ];

  const newParams = new URLSearchParams(searchParams);

  const getStatusClass = (
    currentStatusOfBD,
    requestSheetStatus,
    assignUser,
    work_order_status
  ) => {
    // First check currentStatusOfBD values

    //Under BD
    if (
      (currentStatusOfBD === "Repair Under Progress" ||
        assignUser === "" ||
        assignUser === undefined) &&
      (requestSheetStatus === "Generated" || work_order_status === "Pending") &&
      currentStatusOfBD !== undefined
    )
      return "status-red border border-warning border-3";
    //Waiting
    else if (currentStatusOfBD === "Waiting For Spare") return "status-yellow";
    //Running
    else if (
      currentStatusOfBD === "Machine Running" ||
      requestSheetStatus === "Completed"
    )
      return "status-green";
    // Then check requestSheetStatus values
    //Under Monitoring
    else if (
      !requestSheetStatusNotIncludeForCurrent?.includes(requestSheetStatus) &&
      requestSheetStatus !== undefined
    )
      return "status-blue";

    // return "status-default";
  };

  return (
    <>
      {propsArray?.map((cell, index) => (
        <div className="cell m-2" key={index}>
          <p>{cell?.cell_name}</p>
          <Row className="d-flex justify-content-start">
            {cell?.lines?.map((line, index) => (
              <Col
                xs={12}
                key={index}
                md={cell?.lines?.length === 1 ? 12 : 6}
                lg={
                  cell?.lines?.length === 1
                    ? 12
                    : cell?.lines?.length === 2
                    ? 6
                    : 3
                }
              >
                <div className="line">
                  <div className="line_name">
                    <p>{line?.line_name}</p>
                  </div>

                  <div className="machineCard">
                    {line?.machines?.map((machine, index) => (
                      <button
                        key={index}
                        className={`machine ${
                          context?.tm_department === "MTD" &&
                          localStorage.getItem("activeKey") === "bm"
                            ? getStatusClass(
                                machine?.requestSheet?.[0]?.currentStatusOfBD,
                                machine?.requestSheet?.[0]?.requestSheetStatus,
                                machine?.requestSheet?.[0]?.assignUser,
                                machine?.requestSheet?.[0]?.work_order_status
                              )
                            : ""
                        }`}
                        onClick={() => {
                          /**
                           * An MTD user in BM opens the sheet in a modal on this
                           * page, so there is nothing to navigate to. Doing both
                           * pushed the CM request-sheet route into history behind
                           * the modal, which is why closing the sheet and pressing
                           * Back landed on a new CM sheet instead of returning to
                           * BM. Every other user really does leave this page.
                           */
                          const opensInModal =
                            context?.tm_department === "MTD" &&
                            localStorage.getItem("activeKey") === "bm";

                          if (!opensInModal)
                            handleNavigationToRequestSheet({
                              machine_code: machine?.machine_code,
                            });

                          reducerDispatch({
                            type: ACTION.SET_BD_DATA,
                            machineCode: machine?.machine_code,
                            requestSheetId: machine?.requestSheet?.[0]?._id,
                          });

                          if (opensInModal) {
                            handleRequestSheetShowAndCloseState();
                            newParams.set("machineCode", machine?.machine_code);
                            setSearchParams(newParams);
                          }
                        }}
                      >
                        {machine?.machine_nickname}
                      </button>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </>
  );
};

const GenerateRequestSheetMainDashboard = () => {
  const context = useContext(RoutingContext);
  const [requestSheetModalOpenClose, setRequestSheetModalOpenClose] =
    useState(false);
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const initialState = {
    dashboardLevel: "",
    allDataBasedOnDashboardLevel: {},
    subSectionArr: [],

    message: "",
    isLoading: true,
    isError: false,

    selectedSubSection: "",
    machineCode: "",
    requestSheetId: "",
  };

  const ACTION = {
    GET: "get-main-dashboard-request-sheet-data",
    LOADING: "handle-loading-state",
    SET_BD_DATA: "set-request-sheet-id-for-current-BD-status",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          allDataBasedOnDashboardLevel: action?.allDataBasedOnDashboardLevel,
          selectedSubSection: action?.selectedSubSection,
          dashboardLevel: action?.dashboardLevel,
          subSectionArr: action?.subSectionArr,
        };

      case ACTION?.LOADING:
        return {
          ...state,
          isLoading: true,
          isError: false,
        };

      case ACTION?.SET_BD_DATA:
        return {
          ...state,
          machineCode: action?.machine_code,
          requestSheetId: action?.requestSheetId,
        };
      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getAllDataForGenerateNewRequestSheetDashboardBasedOnDashboardLevel =
    async (url) => {
      try {
        reducerDispatch({
          type: ACTION.LOADING,
        });
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();

        reducerDispatch({
          type: ACTION.GET,
          ...data,
        });
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    getAllDataForGenerateNewRequestSheetDashboardBasedOnDashboardLevel(
      `/getAllDataForGenerateNewRequestSheetDashboardBasedOnDashboardLevel`
    );
  }, []);

  /**
   * Returns to the module's own dashboard rather than stepping back through
   * history. navigate(-1) depended on how the user reached this page, so after
   * opening and closing a sheet it could land anywhere — including the other
   * module's screens.
   */
  const handleBack = () =>
    navigate(localStorage.getItem("activeKey") === "bm" ? "/bm" : "/cm");

  const handleNavigationToRequestSheet = ({ machine_code }) => {
    const urlForSelectMachineForOpenRequestSheet =
      localStorage.getItem("activeKey") === "bm" &&
      context?.tm_department === "PRD"
        ? "/bm/request-sheet/manual"
        : context?.tm_department === "PED"
        ? "/cm/new-machine-request-sheet"
        : "/cm/request-sheet";
    navigate(
      `${urlForSelectMachineForOpenRequestSheet}/${machine_code}/${currentYear}`
    );
  };
  const handleRequestSheetShowAndCloseState = () => {
    if (context?.tm_department === "MTD") {
      setRequestSheetModalOpenClose(
        (requestSheetModalOpenClose) => !requestSheetModalOpenClose
      );
    }
  };

  if (reduceState?.dashboardLevel === "Yes") {
    return (
      <>
        <Container fluid className="px-2 p-2">
          <Row>
            <Col>
              <button className="btn bg-button" onClick={handleBack}>
                Back
              </button>
            </Col>
          </Row>
          <Row>
            {reduceState?.isLoading ? (
              <div className="justify-content-center d-flex align-items-center">
                <LoadingAnimation />
              </div>
            ) : (
              <>
                <Col className="cell p-2 m-1 d-flex justify-content-between align-items-center">
                  <div className="me-4">
                    <b>
                      {reduceState?.allDataBasedOnDashboardLevel?.section_name}
                    </b>
                  </div>

                  {context?.tm_department === "MTD" &&
                    localStorage.getItem("activeKey") === "bm" && (
                      <div className="d-flex flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-1">
                          <div className="color-box red"></div> Under BD
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <div className="color-box yellow"></div> Waiting
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <div className="color-box blue"></div> Under
                          Monitoring
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <div className="color-box green"></div> Running
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <div className="color-box red border border-warning border-3"></div>{" "}
                          Not Assigned
                        </div>
                        {/* <div className="d-flex align-items-center gap-1">
                        <div className="color-box status-default"></div> Not
                        Generated
                      </div> */}
                      </div>
                    )}
                </Col>

                <Col xs={12} md={12} lg={12} className="gx-0">
                  {reduceState?.allDataBasedOnDashboardLevel?.subSections?.map(
                    (subSection, index) => (
                      <div className="subSection" key={index}>
                        <div className="subSectionText">
                          {subSection?.subSection_name}
                        </div>
                        <MapComponent
                          propsArray={subSection?.cells}
                          handleNavigationToRequestSheet={
                            handleNavigationToRequestSheet
                          }
                          handleRequestSheetShowAndCloseState={
                            handleRequestSheetShowAndCloseState
                          }
                          reducerDispatch={reducerDispatch}
                          ACTION={ACTION}
                          context={context}
                          searchParams={searchParams}
                          setSearchParams={setSearchParams}
                        />
                      </div>
                    )
                  )}
                </Col>
              </>
            )}
          </Row>
        </Container>

        {requestSheetModalOpenClose && (
          <MainRequestSheetForView
            selectedYear={searchParams?.get("selectedYear")}
            machine_code={searchParams.get("machineCode")}
            requestSheetID={reduceState?.requestSheetId}
            modelProp={{
              show: requestSheetModalOpenClose,
              onHide: () => handleRequestSheetShowAndCloseState(),
            }}
            flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            selectedValue={reduceState?.selectedValue}
            searchParams={searchParams}
            setSearchParams={setSearchParams}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Container fluid className="px-2 p-2">
        <Row>
          <Col>
            <button className="btn bg-button" onClick={handleBack}>
              Back
            </button>
          </Col>
        </Row>
        {reduceState?.subSectionArr?.length > 0 && (
          <Row>
            <div className="m-3">
              <span>
                <b>&nbsp;Sub Section: &nbsp;</b>
              </span>
              <select
                class="form-select form-select-sm"
                aria-label=".form-select-sm example"
                style={{ width: "25%" }}
                name="plant"
                className="textField"
                select
                autoComplete="off"
                value={reduceState?.selectedSubSection}
                onChange={(e) => {
                  getAllDataForGenerateNewRequestSheetDashboardBasedOnDashboardLevel(
                    `/getAllDataBasedOnSelectedSubSection/${e.target.value}/${reduceState?.dashboardLevel}`
                  );
                }}
                variant="standard"
              >
                <option selected disabled value="">
                  Please select
                </option>
                {reduceState?.subSectionArr?.map((option, index) => {
                  return (
                    <option className="optionStyle" value={option} key={index}>
                      {option}
                    </option>
                  );
                })}
              </select>
            </div>
          </Row>
        )}

        {reduceState?.isLoading ? (
          <div className="justify-content-center d-flex align-items-center">
            <LoadingAnimation />
          </div>
        ) : (
          <Row>
            <Col>
              <MapComponent
                propsArray={reduceState?.allDataBasedOnDashboardLevel?.cells}
                handleNavigationToRequestSheet={handleNavigationToRequestSheet}
                handleRequestSheetShowAndCloseState={
                  handleRequestSheetShowAndCloseState
                }
                reducerDispatch={reducerDispatch}
                ACTION={ACTION}
                context={context}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
              />
            </Col>
          </Row>
        )}
      </Container>

      {requestSheetModalOpenClose && (
        <MainRequestSheetForView
          selectedYear={reduceState?.selectedYear}
          machine_code={reduceState?.machineCode}
          requestSheetID={reduceState?.requestSheetId}
          modelProp={{
            show: requestSheetModalOpenClose,
            onHide: () => handleRequestSheetShowAndCloseState(),
          }}
          flagForTogglingFilter={reduceState?.flagForTogglingFilter}
          selectedValue={reduceState?.selectedValue}
        />
      )}
    </>
  );
};

export default GenerateRequestSheetMainDashboard;
