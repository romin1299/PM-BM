import React, { useEffect, useReducer } from "react";

import { Container, Row, Col } from "reactstrap";
import { useNavigate } from "react-router-dom";
import currentYear from "../../pages/Dashboard/DashboardComponent/currentYear";

const MapComponent = ({ propsArray, handleNavigationToRequestSheet }) => {
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
                        className="machine"
                        onClick={() =>
                          handleNavigationToRequestSheet({
                            machine_code: machine?.machine_code,
                          })
                        }
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
  const navigate = useNavigate();

  const initialState = {
    dashboardLevel: "",
    allDataBasedOnDashboardLevel: {},
    subSectionArr: [],

    message: "",
    isLoading: true,
    isError: false,

    selectedSubSection: "",
  };

  const ACTION = {
    GET: "get-main-dashboard-request-sheet-data",
    SUB_SECTION_EVENT: "handle-sub-section-dropdown-change",
    LOADING: "handle-loading-state",
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
      case ACTION?.SUB_SECTION_EVENT:
        return {
          ...state,
          isLoading: false,
          selectedSubSection: action?.selectedSubSection,
          message: action?.message,
        };

      case ACTION?.LOADING:
        return {
          ...state,
          isLoading: true,
          isError: false,
        };
      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getAllDataForGenerateNewRequestSheetDashboardBasedOnDashboardLevel =
    async ({ url }) => {
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

        const {
          allDataBasedOnDashboardLevel,
          subSectionArr,
          selectedSubSection,
          dashboardLevel,
          message,
        } = await res.json();

        reducerDispatch({
          type: ACTION.GET,
          message,
          allDataBasedOnDashboardLevel,
          selectedSubSection,
          dashboardLevel,
          subSectionArr,
        });
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    let url = `/getAllDataForGenerateNewRequestSheetDashboardBasedOnDashboardLevel`;
    if (reduceState?.selectedSubSection) {
      url = `/getAllDataBasedOnSelectedSubSection/${reduceState?.selectedSubSection}/${reduceState?.dashboardLevel}`;
    }
    getAllDataForGenerateNewRequestSheetDashboardBasedOnDashboardLevel({
      url,
    });
  }, [reduceState?.selectedSubSection]);

  const handleBack = () => {
    localStorage.getItem("activeKey") === "bm"
      ? navigate("/bm")
      : navigate("/cm");
  };

  const handleNavigationToRequestSheet = ({ machine_code }) => {
    const urlForSelectMachineForOpenRequestSheet =
      localStorage.getItem("activeKey") === "bm"
        ? "/bm/request-sheet/manual"
        : "/cm/request-sheet";
    navigate(
      `${urlForSelectMachineForOpenRequestSheet}/${machine_code}/${currentYear}`
    );
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
              <h3>Loading...</h3>
            ) : (
              <Col xs={12} md={12} lg={12} className="gx-0">
                <div className="p-3">
                  {reduceState?.allDataBasedOnDashboardLevel?.section_name}
                </div>
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
                      />
                    </div>
                  )
                )}
              </Col>
            )}
          </Row>
        </Container>
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
                  reducerDispatch({
                    type: ACTION.SUB_SECTION_EVENT,
                    selectedSubSection: e.target.value,
                  });
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
          <h3>Loading...</h3>
        ) : (
          <Row>
            <Col>
              <MapComponent
                propsArray={reduceState?.allDataBasedOnDashboardLevel?.cells}
                handleNavigationToRequestSheet={handleNavigationToRequestSheet}
              />
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
};

export default GenerateRequestSheetMainDashboard;
