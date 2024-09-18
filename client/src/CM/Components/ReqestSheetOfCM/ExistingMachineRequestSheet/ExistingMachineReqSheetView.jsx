import moment from "moment";
import React, { useContext } from "react";
import { Col, Container, Form, Row, Table } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import RoutingContext from "../../../../context/routing/RoutingContext";
import PartList from "../../../../BM/Tabs/SubComponents/PartList";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
} from "@mui/material";
import Multiselect from "multiselect-react-dropdown";

const ExistingMachineReqSheetView = ({ cmSelectedSheetForView }) => {
  console.log(cmSelectedSheetForView);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    setError,
    trigger,
    control,
    clearErrors,
  } = useForm({
    defaultValues: {
      problemOccurredDateAndTimeOfCM: moment(new Date()).format(
        "YYYY-MM-DDTHH:mm"
      ),
      sheetIssuedDateAndTimeOfCM: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
      maintenanceType: "CM",
      "cmBasicDataFilledByMTD_TL.targetDateOfCM": moment(new Date()).format(
        "YYYY-MM-DDTHH:mm"
      ),
    },
  });
  const parts = [
    {
      cost: 12,
      makerName: "sdvfbgn",
      partName: "dsvbn",
      partNo: "2",
      quantity: 1,
    },
  ];
  const context = useContext(RoutingContext);
  return (
    <div>
      <Table className="m-0">
        <tbody className="m-1 border p-3">
          <tr class="">
            {/* <td width={100}>
                <img
                  src={denso_logo}
                  width="120"
                  height="30"
                  className="d-inline-block align-top"
                  alt="React Bootstrap logo"
                />
                
              </td> */}

            <td className="">
              <Container fluid>
                <Row>
                  <Col
                    id="rs-top-btns"
                    data-html2canvas-ignore="true"
                    className="col-auto d-flex gap-2 align-items-center"
                  >
                    {/* <button
                        className="btn bg-button"
                        onClick={(e) => {
                          e.preventDefault();
                          // navigate(
                          //   `/machine-history/${machine_code}/${selectedYear}/?machineId=${machineId}`
                          // );
                          window.open(
                            `/machine-history/${machine_code}/${selectedYear}/?machineId=${selectedMachineData?._id}`,
                            "_blank"
                          );
                        }}
                      >
                        Machine Details
                      </button> */}
                  </Col>

                  <Col className="d-flex align-items-center justify-content-center text-center">
                    <h4 className="m-0">CM REQUEST SHEET (EXISTING MACHINE)</h4>
                  </Col>

                  {/* <Col className="col-auto">
                      <Box
                        display="flex"
                        justifyContent="end"
                        gap={1}
                        // sx={{ position: "absolute", top: "10px", right: "20px" }}
                      >
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
                    </Col> */}
                </Row>
              </Container>
            </td>
          </tr>

          <tr className="row m-2">
            <td className="mb-0 pb-0 border col-6 col-md-2">
              <small>
                <b>MAINT. TYPE</b>
              </small>
              <br />
              <small>{cmSelectedSheetForView?.maintenanceType}</small>
            </td>

            <td className="mb-0 pb-0 border col-6 col-md-2">
              <small>
                {" "}
                <b>PRIORITY CODE</b>
              </small>
              <br />
              <small>{cmSelectedSheetForView?.priorityCode}</small>
            </td>

            <td className="mb-0 pb-0 border col-12 col-md-6">
              <div className="mb-2 border">
                <Row className="m-0">
                  <Col className="border">
                    <p className="text-center p-1">
                      <b>REQUEST SHEET ( To be filled by MTD TL/HoSS)</b>
                    </p>
                  </Col>
                </Row>
                <Row className="m-0">
                  <Col className="border">
                    <small className="text-left p-1 mb-2">
                      <b>REQUEST No. : </b>
                      {cmSelectedSheetForView?.requestSheetNoOfCM}
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
                              disabled
                              value={moment(
                                cmSelectedSheetForView?.problemOccurredDateAndTimeOfCM
                              ).format("DD-MM-YYYY HH:mm")}
                              // min={moment(new Date() - 1)
                              //   .subtract(1, "days")
                              //   .format("YYYY-MM-DDTHH:mm")}
                            />
                          </p>
                        </div>{" "}
                        {/* &nbsp;&nbsp;&nbsp;&nbsp;
                            <div className="text-center">
                              <p className="mb-0">
                                <b>TIME: </b>
                                <br />
                                <input
                                  type="time"
                                  {...register("requestSheettime", {
                                    required: "RequestSheet time is required",
                                  })}
                                />
                                {errors?.["requestSheettime"] && (
                                  <p className="text-error">
                                    {errors?.["requestSheettime"]?.message}
                                  </p>
                                )}
                              </p>
                            </div> */}
                      </div>
                    </Row>
                  </Col>
                  <Col className="border">
                    <Row>
                      <small className="border-right-0 text-center m-0">
                        <b>SHEET ISSUED</b>
                      </small>
                      <div className="d-flex align-items-center justify-content-center mt-1 mb-1 border-top">
                        <div className="text-center">
                          <p className="mb-0">
                            <b>DATE & TIME: </b>
                            <br />
                            <input
                              disabled
                              value={moment(
                                cmSelectedSheetForView?.sheetIssuedDateAndTimeOfCM
                              ).format("DD-MM-YYYY HH:mm")}
                              // min={moment(new Date() - 1)
                              //   .subtract(1, "days")
                              //   .format("YYYY-MM-DDTHH:mm")}
                            />
                          </p>
                        </div>{" "}
                        {/* &nbsp;&nbsp;&nbsp;&nbsp;
                            <div className="text-center">
                              <p className="mb-0">
                                <b>TIME: </b>
                                <br />
                                <input
                                  type="time"
                                  {...register("requestSheettime", {
                                    required: "RequestSheet time is required",
                                  })}
                                />
                                {errors?.["requestSheettime"] && (
                                  <p className="text-error">
                                    {errors?.["requestSheettime"]?.message}
                                  </p>
                                )}
                              </p>
                            </div> */}
                      </div>
                    </Row>
                  </Col>
                </Row>
              </div>
            </td>

            <td className="border mb-0 col-12 col-md-2">
              {/* <Row className="pt-0 pb-0" style={{ marginLeft: "-8px" }}>
                  <Col className="border border-left-0">
                    <p className="mb-0">
                      <b>Sr. No.</b>
                    </p>
                    <p className="fs-6 fw-normal">
                      <input
                        style={{ width: "100%" }}
                        {...register("serialNo", {
                          required: "Serial No. is required",
                        })}
                      />
                      {errors?.["serialNo"] && (
                        <p className="text-error">{errors?.["serialNo"]?.message}</p>
                      )}
                    </p>
                  </Col>
                </Row> */}
              <div className="border">
                <Row className="m-0">
                  <Col className="border pb-2 pt-1">
                    <small className="mb-0">
                      <b>DEPT./LINE</b>
                    </small>
                    <br />
                    <small>{`${cmSelectedSheetForView?.cell?.cell_name}/${cmSelectedSheetForView?.lines?.line_name}`}</small>
                  </Col>
                </Row>

                <Row className="m-0">
                  <Col className="border pb-2">
                    <small className="fs-6 mb-0">
                      <b>TL/HoSS [MTD]</b>
                    </small>
                    <br />
                    <small>{context?.tm_name}</small>
                    {/* <input
                      style={{ width: "100%" }}
                      {...register("TLName", {
                        required: "Team Leader Name is required",
                      })}
                    />
                    {errors?.["TLName"] && <p className="text-error">{errors?.["TLName"]?.message}</p>} */}
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
                    <b>MACHINE NAME: </b> &nbsp;&nbsp;
                    {cmSelectedSheetForView?.machine?.machine_name}
                  </small>{" "}
                  &nbsp;&nbsp;
                </Col>
                <Col lg={4} md={6}>
                  <small className="mb-0">
                    <b>MACHINE NO.:</b>&nbsp;&nbsp;
                    {cmSelectedSheetForView?.machine?.machine_code}
                  </small>
                  &nbsp;&nbsp;
                </Col>
              </Row>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={3}>
                  <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                    <b>Activity: </b>
                  </p>
                </Col>

                <Col lg={9}>
                  <div className="d-block align-items-center">
                    {" "}
                    <input
                      type="text"
                      id="cmBasicDataFilledByMTD_TL.activityOfCM"
                      className="m-1 mb-2"
                      disabled
                      value={
                        cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
                          ?.activityOfCM
                      }
                      style={{ width: "350px" }}
                    />
                  </div>
                </Col>
              </Row>

              <Row className="m-0 border d-flex align-items-center">
                <Col lg={3}>
                  <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                    <b>Frequency: </b> &nbsp;&nbsp;
                  </p>
                </Col>
                <Col lg={9}>
                  <div className="d-block align-items-center">
                    {" "}
                    <input
                      type="text"
                      id="cmBasicDataFilledByMTD_TL.activityOfCM"
                      className="m-1 mb-2"
                      disabled
                      value={
                        cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
                          ?.frequencyType
                      }
                      style={{ width: "350px" }}
                    />
                  </div>
                </Col>
              </Row>

              <Row className="m-0 border d-flex align-items-center">
                <Col lg={3}>
                  <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                    <b>Category:</b>
                  </p>
                </Col>
                <Col lg={9}>
                  <div className="d-block align-items-center">
                    {" "}
                    <input
                      type="text"
                      id="cmBasicDataFilledByMTD_TL.activityOfCM"
                      className="m-1 mb-2"
                      disabled
                      value={
                        cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
                          ?.categories
                      }
                      style={{ width: "350px" }}
                    />
                  </div>
                </Col>
              </Row>

              <Row className="m-0 border d-flex align-items-center">
                <Col lg={3}>
                  <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                    <b>Target Date: </b>
                  </p>
                </Col>

                <Col lg={9}>
                  <div>
                    {" "}
                    <input
                      id="targetDateOfCM"
                      className="m-1 mb-2"
                      name="cmBasicDataFilledByMTD_TL.targetDateOfCM"
                      disabled
                      style={{
                        fontSize: "15px",
                      }}
                      value={moment(
                        cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
                          ?.targetDateOfCM
                      ).format("DD-MM-YYYY HH:mm")}
                      // style={{ width: "350px" }}
                    />
                  </div>
                </Col>
              </Row>

              <Col lg={11} md={11}>
                <Row className="">
                  {/* <PartList parts={parts} setParts={setParts} /> */}
                </Row>
              </Col>
            </td>

            <td className="border p-2 col-lg-4 col-md-4 col-sm-12">
              <Row className="m-0">
                <Col className="border p-2">
                  <FormControl>
                    <FormLabel id="demo-radio-buttons-group-label">
                      <small>
                        <b>SHIFT: </b> &nbsp;&nbsp;
                        {cmSelectedSheetForView?.shiftOfCM}
                      </small>
                    </FormLabel>
                  </FormControl>
                </Col>
              </Row>

              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>QUALITY RELATED</b>&nbsp;&nbsp;&nbsp;
                    {cmSelectedSheetForView?.qualityRelated}
                  </small>
                </Col>
              </Row>
              <Row className="pt-0 mb-0 m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>ASSIGN TO:</b>&nbsp;&nbsp;
                    {cmSelectedSheetForView?.assigned_users?.map((item) => {
                      console.log("dfsgh",item.tm_name);
                      return `${item.tm_name},`;
                    })}
                  </small>
                </Col>
                <Col className="border p-2"></Col>
                {watch("priorityCode") === "KAIZEN" && (
                  <Col lg={12} className="border pb-2 pt-1">
                    <small className="mb-0">
                      <b>ATTACHED FILES</b>
                    </small>
                    <br />
                    <Form.Group controlId="formFileMultiple" className="mb-3">
                      <Form.Control
                        type="file"
                        multiple
                        // accept="image/png, image/gif, image/jpeg"
                        onChange={(e) => {
                          setValue("attachedFilesByMTDUser", e.target.files, {
                            shouldDirty: true,
                          });
                          clearErrors("attachedFilesByMTDUser");
                        }}
                      />
                      {/* {errors?.["attachedImagesOrVideoByPRDUser"] && (
                          <p className="text-error">{"This field is required"}</p>
                        )} */}
                    </Form.Group>
                    {/* {selectedAttendee} */}
                  </Col>
                )}
              </Row>
            </td>
          </tr>
          {cmSelectedSheetForView?.changedParts?.length > 0 && (
            <tr className="row m-2">
              <td colSpan="12">
                <h5 className="mt-4 mb-3">New Part List</h5>
                <Table bordered>
                  <thead>
                    <tr>
                      <th>Cost</th>
                      <th>Maker Name</th>
                      <th>Part Name</th>
                      <th>Part No</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmSelectedSheetForView?.changedParts?.map(
                      (part, index) => (
                        <tr key={index}>
                          <td>{part.cost}</td>
                          <td>{part.makerName}</td>
                          <td>{part.partName}</td>
                          <td>{part.partNo}</td>
                          <td>{part.quantity}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </Table>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default ExistingMachineReqSheetView;
