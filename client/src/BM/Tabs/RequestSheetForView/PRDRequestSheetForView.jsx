import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Row, Col, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import { Box, Button, Tooltip } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import moment from "moment-timezone";
import { ToastContainer } from "react-toastify";
import RoutingContext from "../../../context/routing/RoutingContext";
import { useLocation } from "react-router-dom";
import MachineStatusBox from "../SubComponents/MachineStatusBox";

import { denso_logo } from "../../../modules/LoginModules";
import { exportPDF } from "../../Utils/exportPDF/exportPDF";
import ProblemModeHistory from "../../../Common/Machine/ProblemModeHistory";
import ShiftInputField from "../../../CM/Components/ReqestSheetOfCM/RSComponents/ShiftInputField";
import SafetyFormV2 from "../../../CM/Components/ReqestSheetOfCM/SafetyFormV2";

function MyTable({
  requestSheetDataOfBM,
  machineId,
  machineStatus,
  machine_code,
  selectedYear,
  previousAndNextRequestSheetOfTheBM,
  currentCount,
}) {
  const [problemModeCardModal, setProblemModeCardModal] = useState(false);
  const [safetyFormModalOpen, setSafetyFormModalOpen] = useState(false);

  const { register, watch, setValue } = useForm({
    defaultValues: {
      ...requestSheetDataOfBM,
    },
  });

  const loggedUserDetails = useContext(RoutingContext);

  useEffect(() => {
    if (requestSheetDataOfBM?._id) {
      setValue(
        "problemOccurredDateAndTimeOfBM",
        moment(requestSheetDataOfBM?.problemOccurredDateAndTimeOfBM)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DDTHH:mm"),
      );
      setValue("maintenanceType", requestSheetDataOfBM?.maintenanceType);
      setValue("priorityCode", requestSheetDataOfBM?.priorityCode);
      setValue(
        "problemFaced",
        requestSheetDataOfBM?.breakDownBasicDataFilledByPRD?.problemFaced,
      );
      setValue(
        "PRD_ObservationForProblem_5Why_1How",
        requestSheetDataOfBM?.breakDownBasicDataFilledByPRD
          ?.PRD_ObservationForProblem_5Why_1How,
      );
      setValue(
        "why_5M_1E",
        requestSheetDataOfBM?.breakDownBasicDataFilledByPRD?.why_5M_1E,
      );
      setValue(
        "where_process",
        requestSheetDataOfBM?.breakDownBasicDataFilledByPRD?.where_process,
      );
      setValue(
        "when_frequency",
        requestSheetDataOfBM?.breakDownBasicDataFilledByPRD?.when_frequency,
      );
      setValue(
        "who_person",
        requestSheetDataOfBM?.breakDownBasicDataFilledByPRD?.who_person,
      );
      setValue(
        "which_defectLocation",
        requestSheetDataOfBM?.breakDownBasicDataFilledByPRD
          ?.which_defectLocation,
      );
      setValue(
        "how_details",
        requestSheetDataOfBM?.breakDownBasicDataFilledByPRD?.how_details,
      );
      setValue("shiftOfBM", requestSheetDataOfBM?.shiftOfBM);
      setValue("qualityRelated", requestSheetDataOfBM?.qualityRelated);
      setValue(
        "breakDownAttendedBy",
        requestSheetDataOfBM?.breakDownAttendedBy,
      );
    }
  }, [requestSheetDataOfBM?._id, setValue]);

  const handleProblemModeHistoryCardState = () => {
    setProblemModeCardModal((problemModeCardModal) => !problemModeCardModal);
  };

  return (
    <>
      {/* <ToastContainer /> */}
      {problemModeCardModal && (
        <ProblemModeHistory
          machineId={machineId}
          machineCode={requestSheetDataOfBM?.machineRef?.machine_code}
          problemMode={
            requestSheetDataOfBM?.breakDownBasicDataFilledByPRD?.problemFaced
          }
          modelProp={{
            show: problemModeCardModal,
            onHide: () => handleProblemModeHistoryCardState(),
          }}
        />
      )}
      {requestSheetDataOfBM?._id && safetyFormModalOpen && (
        <SafetyFormV2
          moduleType="bm"
          machineParentHierarchy={{
            line: requestSheetDataOfBM?.lineRef?.line_name,
            machineNo: requestSheetDataOfBM?.machineRef?.machine_code,
            machineName: requestSheetDataOfBM?.machineRef?.machine_name,
          }}
          params={{
            requestSheetRef: requestSheetDataOfBM?._id,
          }}
          otherFormSubmitParams={{
            selectedYear,
          }}
          modelProp={{
            show: safetyFormModalOpen,
            onHide: () => setSafetyFormModalOpen(false),
          }}
        />
      )}
      <form>
        <Table>
          <tbody className="m-1 border p-3">
            <tr className="">
              <td className="">
                <Container fluid>
                  <Row>
                    <Col
                      id="rs-denso-logo"
                      className="col-auto"
                      style={{ display: "none" }}
                    >
                      <div
                        variant="pills"
                        className="px-2 ps-4"
                        style={{
                          background: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <img
                          src={denso_logo}
                          alt=""
                          className="bg-white"
                          style={{ width: "100px", background: "#ffffff" }}
                        />
                      </div>
                    </Col>

                    <Col
                      id="rs-top-btns"
                      data-html2canvas-ignore="true"
                      className="col-auto d-flex gap-2 align-items-center"
                    >
                      <button
                        className="btn bg-button"
                        onClick={(e) => {
                          e.preventDefault();
                          // navigate(
                          //   `/machine-history/${machine_code}/${selectedYear}/?machineId=${machineId}`
                          // );
                          window.open(
                            `/machine-history/${machine_code}/${selectedYear}/?machineId=${machineId}`,
                            "_blank",
                          );
                        }}
                      >
                        Machine Details
                      </button>
                      <Tooltip
                        title="Download Request Sheet"
                        disableInteractive
                      >
                        <Button
                          variant="contained"
                          disableElevation
                          className="bg-button px-2"
                          style={{ minWidth: "42px" }}
                          onClick={() => {
                            exportPDF(
                              "request-sheet-target",
                              requestSheetDataOfBM?.requestSheetNoOfBM,
                              (document) => {
                                document.getElementById(
                                  "rs-denso-logo",
                                ).style.display = "block";
                              },
                            );
                          }}
                        >
                          <DownloadIcon />
                        </Button>
                      </Tooltip>
                      <Button
                        className="btn bg-warning"
                        onClick={() => {
                          handleProblemModeHistoryCardState();
                        }}
                      >
                        Problem History
                      </Button>
                      <button
                        // variant="contained"
                        // color="error"
                        className="btn btn-danger"
                        onClick={(e) => {
                          e.preventDefault();
                          setSafetyFormModalOpen(true);
                        }}
                      >
                        <HealthAndSafetyIcon /> &nbsp;Safety Form
                      </button>
                      <button
                        className="btn bg-button"
                        type="button"
                        onClick={() =>
                          previousAndNextRequestSheetOfTheBM("previous")
                        }
                        disabled={currentCount >= "total" - 1}
                      >
                        &lt;
                      </button>
                      &nbsp;
                      <button
                        className="btn bg-button"
                        type="button"
                        onClick={() =>
                          previousAndNextRequestSheetOfTheBM("next")
                        }
                        disabled={currentCount <= 0}
                      >
                        &gt;
                      </button>
                    </Col>

                    <Col className="d-flex align-items-center justify-content-center text-center">
                      <h4 className="m-0">MAINTENANCE WORK REQUEST/REPORT</h4>
                    </Col>

                    <Col className="col-sm col-lg-auto">
                      <Box display="flex" justifyContent="end" gap={1}>
                        <MachineStatusBox
                          title="PM Status"
                          bodyText1={machineStatus?.pmStatusData?.PMStatus}
                          bodyText2={machineStatus?.pmStatusData?.PMdate}
                        />
                        <MachineStatusBox
                          title="BM"
                          bodyText1={
                            machineStatus?.bmStatusData?.count &&
                            `${(machineStatus?.bmStatusData?.totalHours).toFixed(
                              1,
                            )} Hrs./${machineStatus?.bmStatusData?.count} Count`
                          }
                        />
                        <MachineStatusBox title="CM" />
                      </Box>
                    </Col>
                  </Row>
                </Container>
              </td>
            </tr>

            <tr className="row m-2">
              <td className="mb-0 pb-0 border col-6 col-md-2">
                <small>
                  <b>MAINT. TYPE</b>
                </small>
                <div className="value">
                  {requestSheetDataOfBM?.maintenanceType}
                </div>
              </td>

              <td className="mb-0 pb-0 border col-6 col-md-2">
                <small>
                  <b>PRIORITY CODE</b>
                </small>
                <div className="value">
                  {requestSheetDataOfBM?.priorityCode}
                </div>
              </td>

              <td className="mb-0 border col-12 col-md-6">
                <div className="border">
                  <Row className="m-0">
                    <Col className="border">
                      <p className="text-center p-1">
                        <b>REQUEST SHEET ( To be filled by PRD)</b>
                      </p>
                    </Col>
                  </Row>
                  <Row className="m-0">
                    <Col className="border">
                      <small className="text-left p-1 mb-2">
                        <b>REQUEST No.</b>
                        {requestSheetDataOfBM?.requestSheetNoOfBM}
                      </small>
                    </Col>
                  </Row>
                  <Row className="m-0">
                    <Col className="border">
                      <Row>
                        <small className="border-right-0 text-center m-0">
                          <b>PROBLEM OCCURRED</b>
                        </small>
                        <div className="d-flex align-items-center justify-content-center mt-1 mb-1 border-top">
                          <div className="text-center">
                            <small className="mb-0">
                              <b>DATE & TIME: </b>
                              <br />
                              <input
                                type="datetime-local"
                                {...register("problemOccurredDateAndTimeOfBM")}
                                disabled={
                                  (requestSheetDataOfBM?.assignUser?._id !==
                                    loggedUserDetails?._id ||
                                    requestSheetDataOfBM?.handOverUser?._id ===
                                      loggedUserDetails?._id) &&
                                  requestSheetDataOfBM?.approvalOfMTD_TL
                                    ?._id !== loggedUserDetails?._id
                                }
                              />
                            </small>
                          </div>{" "}
                        </div>
                      </Row>
                    </Col>
                    <Col className="border">
                      <Row>
                        <small className="border-left-0 text-center m-0">
                          <b>SHEET ISSUED</b>
                        </small>
                        <div className="d-flex align-items-center justify-content-center mt-1 mb-1 border-top">
                          <div className="text-center">
                            <small className="mb-0">
                              <b>DATE & TIME: </b>
                              <br />

                              {moment(
                                requestSheetDataOfBM?.sheetIssuedDateAndTimeOfBM,
                              )
                                .tz("Asia/Kolkata")
                                .format("DD-MM-YYYY THH:mm")}
                            </small>
                          </div>{" "}
                        </div>
                      </Row>
                    </Col>
                  </Row>
                </div>
              </td>

              <td className="border mb-0 col-12 col-md-2">
                <div className="border">
                  <Row className="m-0">
                    <Col className="border pb-2 pt-1">
                      <small className="mb-0">
                        <b>DEPT./LINE</b>
                      </small>
                      <br />
                      <small>
                        {requestSheetDataOfBM?.cellRef?.cell_name}/
                        {requestSheetDataOfBM?.lineRef?.line_name}
                      </small>
                    </Col>
                  </Row>
                  <Row className="m-0">
                    <Col className="border pt-2 pb-2">
                      <small className="fs-6 mb-0">
                        <b>TL [PRD]</b>
                      </small>
                      <br />
                      <small>
                        {requestSheetDataOfBM?.requestSheetCreatedBy?.tm_name}
                      </small>
                    </Col>
                  </Row>
                </div>
              </td>
            </tr>

            <tr className="row m-2">
              <td className="border p-3 col-lg-8 col-md-7 col-sm-12">
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={4} md={6}>
                    <small className="mb-0">
                      <b>MACHINE NAME:</b>{" "}
                    </small>{" "}
                    &nbsp;&nbsp;
                    {requestSheetDataOfBM?.machineRef?.machine_name}
                  </Col>
                  <Col lg={4} md={6}>
                    <small className="mb-0">
                      <b>MACHINE NO.:</b>
                    </small>
                    &nbsp;&nbsp;
                    {requestSheetDataOfBM?.machineRef?.machine_code}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>PROBLEM FACED: </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <input
                      disabled={true}
                      type="text"
                      id="prob"
                      name="problemFaced"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("problemFaced", {
                        required: "Please fill this field",
                      })}
                    />
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>
                        PRD OBSERVATION FOR THIS PROBLEM BASED ON
                        (5WHY-1HOW){" "}
                      </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <input
                      disabled={true}
                      type="text"
                      id="prdobv"
                      name="prdobv"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("PRD_ObservationForProblem_5Why_1How", {
                        required: "Please fill this field",
                      })}
                    />
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHY (5M+1E): </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <input
                      disabled={true}
                      type="text"
                      id="why"
                      name="why"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("why_5M_1E")}
                    />
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHERE (Process): </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <input
                      disabled={true}
                      type="text"
                      id="where"
                      name="where"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("where_process")}
                    />
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHEN (Frequency): </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <input
                      disabled={true}
                      type="text"
                      id="when"
                      name="when"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("when_frequency")}
                    />
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHO (Person): </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <input
                      disabled={true}
                      type="text"
                      id="who"
                      name="who"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("who_person")}
                    />
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHICH (Defect Location): </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <input
                      disabled={true}
                      type="text"
                      id="which"
                      name="which"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("which_defectLocation")}
                    />
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>HOW (Detail/ Observation): </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <input
                      disabled={true}
                      type="text"
                      id="how"
                      name="how"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("how_details")}
                    />
                  </Col>
                </Row>
              </td>

              <td className="border p-3 col-lg-4 col-md-4 col-sm-12">
                <ShiftInputField
                  shiftOfBM={watch("shiftOfBM")}
                  setValue={setValue}
                />

                <Row className="m-0">
                  <Col className="border p-2">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>QUALITY RELATED</b>&nbsp;&nbsp;&nbsp;
                    </small>
                    <div>{requestSheetDataOfBM?.qualityRelated}</div>
                  </Col>
                </Row>
                <Row className="pt-0 mb-0 m-0">
                  <Col lg={12} className="border pb-2 pt-1">
                    <small className="mb-0">
                      <b>BREAKDOWN ATTENDED BY</b>
                    </small>
                    <br />
                    {requestSheetDataOfBM?.assignUser?.tm_name}{" "}
                    {requestSheetDataOfBM?.handOverUser?.tm_name
                      ? `, ${requestSheetDataOfBM?.handOverUser?.tm_name}`
                      : ""}
                    {requestSheetDataOfBM?.supportingTM?.length > 0 &&
                      `, ${requestSheetDataOfBM?.supportingTM
                        ?.map((obj) => obj?.tm_name)
                        ?.join(", ")}`}
                  </Col>
                  <Col lg={12} className="border pb-2 pt-1">
                    {requestSheetDataOfBM?.attachedImagesOrVideoByPRDUser?.map(
                      (imageOrVideo, idx) => (
                        <a
                          target="_blank"
                          // href={`http://localhost:7000/${image}`}
                          href={`${process.env.REACT_APP_BASE_URL}/${imageOrVideo}`}
                          style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {imageOrVideo}
                        </a>
                      ),
                    )}
                  </Col>
                </Row>
              </td>
            </tr>
          </tbody>
        </Table>
      </form>
    </>
  );
}

export default MyTable;
