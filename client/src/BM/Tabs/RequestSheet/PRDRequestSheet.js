import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { Row, Col, Form, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";

import moment from "moment-timezone";
import { ToastContainer } from "react-toastify";
import { useParams } from "react-router-dom";
import { SuccessToast, WarningToast } from "../../Component/ShowTostify";
import RoutingContext from "../../../context/routing/RoutingContext";
import { Box } from "@mui/material";
import MachineStatusBox from "../SubComponents/MachineStatusBox";
import ShiftInputField from "../../../CM/Components/ReqestSheetOfCM/RSComponents/ShiftInputField";

function MyTable({ selectedMachineDetails, machineStatus }) {
  const navigate = useNavigate();
  const { machine_code, selectedYear } = useParams();
  const context = useContext(RoutingContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      problemOccurredDateAndTimeOfBM: moment(new Date()).format(
        "YYYY-MM-DDTHH:mm"
      ),
      sheetIssuedDateAndTimeOfBM: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
    },
  });

  const newRequestSheetRegistration = async (requestSheetData) => {
    try {
      if (errors?.["problemFaced"]) {
        return;
      }

      const formData = new FormData();
      const { ...otherFields } = requestSheetData;

      otherFields.problemFaced =
        (requestSheetData?.select_problemFaced &&
        requestSheetData?.select_problemFaced === "Other"
          ? requestSheetData?.problemFaced
          : requestSheetData?.select_problemFaced) ||
        requestSheetData?.problemFaced;

      for (
        let i = 0;
        i < requestSheetData?.attachedImagesOrVideoByPRDUser?.length;
        i++
      ) {
        formData.append(
          "attachedImagesOrVideoByPRDUser",
          requestSheetData?.attachedImagesOrVideoByPRDUser[i]
        );
      }

      formData.append("otherData", JSON.stringify(otherFields));

      const res = await fetch(
        `/newRequestSheetRegistration/?machineRef=${machine_code}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.status === 201) {
        SuccessToast(data?.message);
        reset();
        navigate("/bm", { replace: true });
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleBack = () => {
    navigate("/bm", { replace: true });
  };

  const isEnable = selectedMachineDetails?.machine_problems_faced?.length > 0;
  return (
    <>
      {/* <ToastContainer /> */}
      <form onSubmit={handleSubmit(newRequestSheetRegistration)}>
        <Table className="m-0">
          <tbody className="m-1 border p-3">
            <tr class="">
              <td className="">
                <Container fluid>
                  <Row>
                    <Col
                      id="rs-top-btns"
                      data-html2canvas-ignore="true"
                      className="col-auto d-flex gap-2 align-items-center"
                    >
                      <button className="btn bg-button" onClick={handleBack}>
                        Back
                      </button>
                      <button
                        className="btn bg-button"
                        onClick={(e) => {
                          e.preventDefault();

                          window.open(
                            `/machine-history/${machine_code}/${selectedYear}/?machineId=${selectedMachineDetails?._id}`,
                            "_blank"
                          );
                        }}
                      >
                        Machine Details
                      </button>
                    </Col>

                    <Col className="d-flex align-items-center justify-content-center text-center">
                      <h4 className="m-0">MAINTENANCE WORK REQUEST/REPORT</h4>
                    </Col>

                    <Col className="col-auto">
                      <Box display="flex" justifyContent="end" gap={1}>
                        <MachineStatusBox
                          title="PM Status"
                          bodyText1={machineStatus?.pmStatusData?.PMStatus}
                          bodyText2={machineStatus?.pmStatusData?.PMdate}
                        />
                        <MachineStatusBox
                          title="BM"
                          bodyText1={
                            machineStatus?.bmStatusData?.totalHours &&
                            `${(machineStatus?.bmStatusData?.totalHours).toFixed(
                              1
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
                <Form style={{ fontSize: "16px !important" }}>
                  <div key={`inline-radio`}>
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="BM"
                      name="maintenanceType"
                      type="radio"
                      id={`inline-radio-1`}
                      value="BM"
                      {...register("maintenanceType", {
                        required: "Please select maintenance type",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="PM"
                      name="maintenanceType"
                      type="radio"
                      id={`inline-radio-2`}
                      value="PM"
                      {...register("maintenanceType", {
                        required: "Please select maintenance type",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="CM"
                      type="radio"
                      name="maintenanceType"
                      id={`inline-radio-3`}
                      value="CM"
                      {...register("maintenanceType", {
                        required: "Please select maintenance type",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="TPM"
                      type="radio"
                      name="maintenanceType"
                      id={`inline-radio-4`}
                      value="TPM"
                      {...register("maintenanceType", {
                        required: "Please select maintenance type",
                      })}
                    />
                  </div>
                  {errors?.["maintenanceType"] && (
                    <p className="text-error">
                      {errors?.["maintenanceType"]?.message}
                    </p>
                  )}
                </Form>
              </td>

              <td className="mb-0 pb-0 border col-6 col-md-2">
                <small>
                  {" "}
                  <b>PRIORITY CODE</b>
                </small>
                <Form>
                  <div key={`inline-radio`}>
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="EMERGENCY"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-1`}
                      value="EMERGENCY"
                      {...register("priorityCode", {
                        required: "Please select priority code",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="IMPORTANT"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-2`}
                      value="IMPORTANT"
                      {...register("priorityCode", {
                        required: "Please select priority code",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="DATA NEEDED"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-3`}
                      value="DATA NEEDED"
                      {...register("priorityCode", {
                        required: "Please select priority code",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="KAIZEN"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-4`}
                      value="KAIZEN"
                      {...register("priorityCode", {
                        required: "Please select priority code",
                      })}
                    />
                  </div>
                  {errors?.["priorityCode"] && (
                    <p className="text-error">
                      {errors?.["priorityCode"]?.message}
                    </p>
                  )}
                </Form>
              </td>

              <td className="mb-0 pb-0 border col-12 col-md-6">
                <div className="mb-2 border">
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
                        <b>REQUEST No.</b>{" "}
                        {selectedMachineDetails?.line_names?.cell_names
                          ?.subSection_names?.section_names?.dashboardLevel ===
                        "Yes"
                          ? selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.section_name
                              ?.trim()
                              ?.substring(0, 2)
                              ?.toUpperCase()
                          : selectedMachineDetails?.line_names?.cell_names?.subSection_names?.subSection_name
                              ?.trim()
                              ?.substring(0, 2)
                              ?.toUpperCase()}
                        -{selectedMachineDetails?.line_names?.line_name?.trim()}
                        -{moment().tz("Asia/Kolkata").month() + 1}-
                        {selectedMachineDetails?.line_names?.requestSheetNos +
                          1 || 1}
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
                            <p className="mb-0">
                              <b>DATE & TIME: </b>
                              <br />
                              <input
                                type="datetime-local"
                                {...register("problemOccurredDateAndTimeOfBM", {
                                  required: "RequestSheet date is required",
                                  onChange: (event) =>
                                    setValue(
                                      "problemOccurredDateAndTimeOfBM",
                                      event.target.value
                                    ),
                                })}
                              />
                              {errors?.["problemOccurredDateAndTimeOfBM"] && (
                                <p className="text-error">
                                  {
                                    errors?.["problemOccurredDateAndTimeOfBM"]
                                      ?.message
                                  }
                                </p>
                              )}
                            </p>
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
                              <input
                                type="datetime-local"
                                {...register("sheetIssuedDateAndTimeOfBM")}
                                disabled
                              />
                            </small>
                          </div>{" "}
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
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
                        {
                          selectedMachineDetails?.line_names?.cell_names
                            ?.cell_name
                        }
                        /{selectedMachineDetails?.line_names?.line_name}
                      </small>
                    </Col>
                  </Row>

                  <Row className="m-0">
                    <Col className="border pb-2">
                      <small className="fs-6 mb-0">
                        <b>TL [PRD]</b>
                      </small>
                      <br />
                      <small>{context?.tm_name}</small>
                    </Col>
                  </Row>
                </div>
              </td>
            </tr>

            <tr class="row m-2">
              <td className="border p-2 col-lg-8 col-md-7 col-sm-12">
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={4} md={6}>
                    <small className="mb-0">
                      <b>MACHINE NAME:</b>{" "}
                    </small>{" "}
                    &nbsp;&nbsp;
                    {selectedMachineDetails.machine_name}
                  </Col>
                  <Col lg={4} md={6}>
                    <small className="mb-0">
                      <b>MACHINE NO.:</b>
                    </small>
                    &nbsp;&nbsp;
                    {selectedMachineDetails.machine_code}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>PROBLEM FACED: </b>
                    </p>
                  </Col>

                  <Col lg={7}>
                    <div className="d-block align-items-center">
                      {" "}
                      {isEnable && (
                        <>
                          <select
                            className="mb-1 w-50"
                            {...register("select_problemFaced")}
                            onInput={() => {
                              clearErrors("error_problemFaced");
                            }}
                          >
                            <option selected disabled value="">
                              Please select
                            </option>
                            {selectedMachineDetails?.machine_problems_faced?.map(
                              (problem, index) => {
                                return <option key={index}>{problem}</option>;
                              }
                            )}
                            <option
                              key={
                                selectedMachineDetails?.machine_problems_faced
                                  ?.length
                              }
                            >
                              Other
                            </option>
                          </select>
                        </>
                      )}
                      {(!isEnable ||
                        watch("select_problemFaced") === "Other") && (
                        <input
                          type="text"
                          id="prob"
                          className="m-1 mb-2"
                          style={{ width: "350px" }}
                          {...register("problemFaced")}
                          onInput={() => {
                            clearErrors("error_problemFaced");
                          }}
                        />
                      )}
                    </div>
                    {errors?.["error_problemFaced"] && (
                      <p className="text-error">
                        {errors?.["error_problemFaced"]?.message}
                      </p>
                    )}
                  </Col>
                </Row>

                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>
                        PRD OBSERVATION FOR THIS PROBLEM BASED ON (5WHY-1HOW){" "}
                      </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
                      type="text"
                      id="prdobv"
                      name="prdobv"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("PRD_ObservationForProblem_5Why_1How", {
                        required: "Please fill this field",
                      })}
                    />
                    {errors?.["PRD_ObservationForProblem_5Why_1How"] && (
                      <p className="text-error">
                        {
                          errors?.["PRD_ObservationForProblem_5Why_1How"]
                            ?.message
                        }
                      </p>
                    )}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHY (5M+1E): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
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
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHERE (Process): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
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
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHEN (Frequency): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
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
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHO (Person): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
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
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHICH (Defect Location): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
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
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>HOW (Detail/ Observation): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
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

              <td className="border p-2 col-lg-4 col-md-4 col-sm-12">
                <ShiftInputField
                  dateAndTime={watch("problemOccurredDateAndTimeOfBM")}
                  shiftOfBM={watch("shiftOfBM")}
                  setValue={setValue}
                />

                <Row className="m-0">
                  <Col className="border p-2">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>QUALITY RELATED</b>&nbsp;&nbsp;&nbsp;
                    </small>
                  </Col>
                  <Col className="border p-2 d-flex align-items-center">
                    <Form>
                      {["radio"].map((type) => (
                        <div key={`inline-${type}`} className="d-block">
                          <Form.Check
                            flex
                            label="Yes"
                            name="group1"
                            type={type}
                            id={`inline-${type}-1`}
                            value="Yes"
                            {...register("qualityRelated", {
                              required: "Please select quality related",
                            })}
                          />
                          <Form.Check
                            flex
                            label="No"
                            name="group1"
                            type={type}
                            id={`inline-${type}-2`}
                            value="No"
                            {...register("qualityRelated", {
                              required: "Please select quality related",
                            })}
                          />
                        </div>
                      ))}
                      {errors?.["qualityRelated"] && (
                        <p className="text-error">
                          {errors?.["qualityRelated"]?.message}
                        </p>
                      )}
                    </Form>
                  </Col>
                </Row>
                <Row className="pt-0 mb-0 m-0">
                  <Col lg={12} className="border pb-2 pt-1">
                    <small className="mb-0">
                      <b>BREAKDOWN ATTENDED BY</b>
                    </small>
                    <br />
                  </Col>
                  <Col lg={12} className="border pb-2 pt-1">
                    <small className="mb-0">
                      <b>ATTACHED VIDEO OR IMAGES</b>
                    </small>
                    <br />
                    <Form.Group controlId="formFileMultiple" className="mb-3">
                      <Form.Control
                        type="file"
                        multiple
                        onChange={(e) => {
                          setValue(
                            "attachedImagesOrVideoByPRDUser",
                            e.target.files,
                            {
                              shouldDirty: true,
                            }
                          );
                          clearErrors("attachedImagesOrVideoByPRDUser");
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </td>
            </tr>

            <tr>
              <td>
                <button
                  type="submit"
                  className="btn bg-success"
                  onClick={() => {
                    if (
                      !watch("problemFaced") &&
                      !watch("select_problemFaced")
                    ) {
                      return setError("error_problemFaced", {
                        type: "custom",
                        message: "Please fill or select this field",
                      });
                    }
                  }}
                >
                  Submit Request-Sheet
                </button>
              </td>
            </tr>
          </tbody>
        </Table>
      </form>
    </>
  );
}

export default MyTable;
