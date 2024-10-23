import React, { useState, useContext, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Row, Col, Form, Container } from "react-bootstrap";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Table } from "react-bootstrap";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import moment from "moment-timezone";
import { Box } from "@mui/material";
import axios from "axios";
import RoutingContext from "../../../../context/routing/RoutingContext";
import {
  SuccessToast,
  WarningToast,
} from "../../../../BM/Component/ShowTostify";
import {
  FREQUENCY_OF_CM,
  CATEGORIES_OF_CM,
} from "../../../GlobalDataAccess/GlobalData";
import PartList from "../../../../BM/Tabs/SubComponents/PartList";
import Multiselect from "multiselect-react-dropdown";
import ExistinngMachineReqSheetForOperator from "./ExistinngMachineReqSheetForOperator";

const GeneratedExistingMachineRequestSheetByMTD = ({
  selectedMachineData,
  assignTMList,
}) => {
  const navigate = useNavigate();
  const context = useContext(RoutingContext);
  const [parts, setParts] = useState([]);

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
      plannedDateAndTimeOfCM: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
      sheetIssuedDateAndTimeOfCM: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
      maintenanceType: "CM",
      "cmBasicDataFilledByMTD_TL.targetDateOfCM": moment(new Date()).format(
        "YYYY-MM-DDTHH:mm"
      ),
    },
  });

  const [plantShiftsData, setPlantShiftsData] = useState([]);

  const [selectedShift, setSelectedShift] = useState("");
  // const [selectedMaintenanceType, setSelectedMaintenanceType] = useState("");
  // const [selectedPriorityCode, setSelectedPriorityCode] = useState("");
  // const [selectedQuality, setSelectedQuality] = useState("");
  // const [selectedMachineData, setMachineDetails] = useState("");

  // const handleSelectShift = (key, event) => {
  //   setSelectedShift({ key, value: event.target.value });
  // };

  // const handleMaintenanceType = (event) => {
  //   setSelectedMaintenanceType(event.target.value);
  // };
  // const handlePriorityCode = (event) => {
  //   setSelectedPriorityCode(event.target.value);
  // };
  // const handleQuality = (event) => {
  //   setSelectedQuality(event.target.value);
  // };
  let flagCountForHandlingError = 0;
  const handleCustomError = () => {
    console.log(
      watch("cmBasicDataFilledByMTD_TL.categories"),
      "and ",
      watch("cmBasicDataFilledByMTD_TL.inspectionItem")
    );
    if (
      watch("cmBasicDataFilledByMTD_TL.categories") === "LTPM" &&
      watch("cmBasicDataFilledByMTD_TL.inspectionItem") === ""
    ) {
      setError(
        "cmBasicDataFilledByMTD_TL.inspectionItem",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
      flagCountForHandlingError++;
    }
    if (
      watch("cmBasicDataFilledByMTD_TL.categories") === "LTPM" &&
      watch("cmBasicDataFilledByMTD_TL.actionForLTPM") === ""
    ) {
      setError(
        "cmBasicDataFilledByMTD_TL.actionForLTPM",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
    }
    if (
      watch("cmBasicDataFilledByMTD_TL.categories") === "LTPM" &&
      watch("cmBasicDataFilledByMTD_TL.personForLTPM") === ""
    ) {
      setError(
        "cmBasicDataFilledByMTD_TL.personForLTPM",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
      flagCountForHandlingError++;
    }
    if (
      watch("partRequiredByMTDTL") === "Yes" &&
      watch("cmBasicDataFilledByMTD_TL.partSuggestionByMTDTL") === ""
    ) {
      setError(
        "cmBasicDataFilledByMTD_TL.partSuggestionByMTDTL",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
      flagCountForHandlingError++;
    }
    return flagCountForHandlingError;
  };

  const newRequestSheetRegistrationOfCM = async (requestSheetDataOfCM) => {
    // const machineRef = "63b67ccea716e21c95cd471a";
    // requestSheetDataOfCM.maintenanceType = selectedMaintenanceType;
    // requestSheetDataOfCM.priorityCode = selectedPriorityCode;
    // requestSheetDataOfCM.qualityRelated = selectedQuality;
    // requestSheetDataOfCM.shiftOfBM = selectedShift;
    // requestSheetDataOfCM.changedParts = parts;
    const customErrorCount = await handleCustomError();
    console.log("cnt", customErrorCount);
    if (customErrorCount > 0) {
      return;
    }

    try {
      const formData = new FormData();
      const { ...otherFields } = requestSheetDataOfCM;

      for (
        let i = 0;
        i < requestSheetDataOfCM?.attachedFilesByMTDUser?.length;
        i++
      ) {
        formData.append(
          "attachedFilesByMTDUser",
          requestSheetDataOfCM?.attachedFilesByMTDUser[i]
        );
      }

      formData.append("otherData", JSON.stringify(otherFields));

      const res = await fetch(
        `/newRequestSheetRegistrationOfCM/?machineRef=${selectedMachineData?._id}`,
        {
          method: "POST",
          // headers: {
          //   "Content-Type": "application/json",
          // },
          body: formData,
        }
      );

      const data = await res.json();

      if (res.status === 201) {
        SuccessToast(data?.message);
        reset();
        navigate("/cm", { replace: true });
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const timezone = "Asia/Kolkata";
  const startedDate = moment().tz(timezone).month() + 1;

  const plannedDateAndTimeOfCM = watch("plannedDateAndTimeOfCM");
  const [date, time] = plannedDateAndTimeOfCM.split("T");
  const momentTime = moment(time, "HH:mm");

  useEffect(() => {
    const getCurrentShiftName = () => {
      for (let shiftInfo of plantShiftsData) {
        const startTime = moment(shiftInfo.shiftStartTime, "HH:mm");
        const endTime = moment(shiftInfo.shiftEndTime, "HH:mm");

        // if (
        //   momentTime > moment(shiftInfo?.shiftStartTime, "HH:mm") &&
        //   momentTime < moment(shiftInfo?.shiftEndTime, "HH:mm")
        // )

        if (endTime.isBefore(startTime)) {
          if (
            momentTime.isSameOrAfter(startTime) ||
            momentTime.isSameOrBefore(endTime)
          ) {
            return shiftInfo.shiftName;
          }
        } else {
          if (momentTime.isBetween(startTime, endTime)) {
            return shiftInfo.shiftName;
          }
        }
      }

      return "";
    };

    setValue("shiftOfBM", getCurrentShiftName());
    setSelectedShift(getCurrentShiftName());
  }, [plannedDateAndTimeOfCM, plantShiftsData]);

  React.useEffect(() => {
    const fetchShiftData = async () => {
      const url = "/getAllShifts";

      try {
        const res = await axios.get(url, {
          withCredentials: true,
          credentials: "include",
        });

        // console.log("fetch shifts res:", res);
        setPlantShiftsData(res?.data?.getShifts);
      } catch (error) {
        console.log("error:", error);
      }
    };

    fetchShiftData();
  }, []);

  const handleBack = () => {
    navigate("/cm", { replace: true });
  };

  return (
    <>
      <form onSubmit={handleSubmit(newRequestSheetRegistrationOfCM)}>
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
                      <button className="btn bg-button" onClick={handleBack}>
                        Back
                      </button>
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
                      <h4 className="m-0">
                        CM REQUEST SHEET (EXISTING MACHINE)
                      </h4>
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
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "BM"}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="PM"
                      name="maintenanceType"
                      type="radio"
                      id={`inline-radio-2`}
                      value="PM"
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "PM"}
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
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "CM"}
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
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "TPM"}
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
                      // onChange={handlePriorityCode}
                      // checked={selectedPriorityCode === "EMERGENCY"}
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
                      // onChange={handlePriorityCode}
                      // checked={selectedPriorityCode === "IMPORTANT"}
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
                      // onChange={handlePriorityCode}
                      // checked={selectedPriorityCode === "DATA NEEDED"}
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
                      // onChange={handlePriorityCode}
                      // checked={selectedPriorityCode === "KAIZEN"}
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
                        <b>REQUEST SHEET ( To be filled by MTD TL/HoSS)</b>
                      </p>
                    </Col>
                  </Row>
                  <Row className="m-0">
                    <Col className="border">
                      <small className="text-left p-1 mb-2">
                        <b>REQUEST No.</b>{" "}
                        {selectedMachineData?.line_names?.cell_names
                          ?.subSection_names?.section_names?.dashboardLevel ===
                        "Yes"
                          ? selectedMachineData?.line_names?.cell_names?.subSection_names?.section_names?.section_name
                              ?.trim()
                              ?.substring(0, 2)
                              ?.toUpperCase()
                          : selectedMachineData?.line_names?.cell_names?.subSection_names?.subSection_name
                              ?.trim()
                              ?.substring(0, 2)
                              ?.toUpperCase()}
                        -{selectedMachineData?.line_names?.line_name?.trim()}
                        -CM-
                        {startedDate}-
                        {selectedMachineData?.line_names?.requestSheetNoOfCM +
                          1 || 1}
                      </small>
                    </Col>
                  </Row>
                  <Row className="m-0">
                    <Col className="border">
                      <Row>
                        <small className="border-right-0 text-center m-0">
                          <b>PLANNED DATE</b>
                        </small>
                        <div className="d-flex align-items-center justify-content-center mt-1 mb-1 border-top">
                          <div className="text-center">
                            <p className="mb-0">
                              <b>DATE & TIME: </b>
                              <br />
                              <input
                                type="datetime-local"
                                // min={moment(new Date() - 1)
                                //   .subtract(1, "days")
                                //   .format("YYYY-MM-DDTHH:mm")}
                                {...register("plannedDateAndTimeOfCM", {
                                  required: "RequestSheet date is required",
                                  onChange: (event) =>
                                    setValue(
                                      "plannedDateAndTimeOfCM",
                                      event.target.value
                                    ),
                                })}
                              />
                              {errors?.["plannedDateAndTimeOfCM"] && (
                                <p className="text-error">
                                  {errors?.["plannedDateAndTimeOfCM"]?.message}
                                </p>
                              )}
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
                                {...register(
                                  "sheetIssuedDateAndTimeOfCM"
                                  //  {
                                  //   required: "Sheet Issued date is required",
                                  // }
                                )}
                                disabled
                              />
                              {/* {errors?.["sheetIssuedDateAndTimeOfCM"] && (
                                <p className="text-error">{errors?.["sheetIssuedDateAndTimeOfCM"]?.message}</p>
                              )} */}
                            </small>
                          </div>{" "}
                          {/* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; */}
                          {/* <div className="text-center">
                              <p className="mb-0">
                                <b>TIME: </b>
                                <br />
                                <input
                                  type="time"
                                  {...register(
                                    "sheetIssuedTime"
                                    //  {
                                    //   required: "Sheet Issued time is required",
                                    // }
                                  )}
                                  disabled
                                />
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
                      <small>
                        {selectedMachineData?.line_names?.cell_names?.cell_name}
                        /{selectedMachineData?.line_names?.line_name}
                      </small>
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
                      <b>MACHINE NAME:</b>{" "}
                    </small>{" "}
                    &nbsp;&nbsp;
                    {selectedMachineData.machine_name}
                  </Col>
                  <Col lg={4} md={6}>
                    <small className="mb-0">
                      <b>MACHINE NO.:</b>
                    </small>
                    &nbsp;&nbsp;
                    {selectedMachineData.machine_code}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>Activity: </b>
                    </p>
                  </Col>

                  <Col lg={7}>
                    <div className="d-block align-items-center">
                      {" "}
                      <input
                        type="text"
                        id="cmBasicDataFilledByMTD_TL.activityOfCM"
                        className="m-1 mb-2"
                        style={{ width: "350px" }}
                        {...register("cmBasicDataFilledByMTD_TL.activityOfCM", {
                          required: "Please enter activity",
                        })}
                      />
                    </div>
                    {errors?.cmBasicDataFilledByMTD_TL?.activityOfCM && (
                      <p className="text-error">
                        {
                          errors?.cmBasicDataFilledByMTD_TL?.activityOfCM
                            ?.message
                        }
                      </p>
                    )}
                  </Col>
                </Row>

                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>Frequency: </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    {FREQUENCY_OF_CM?.map((value, idx) => (
                      <div key={idx}>
                        <Col>
                          <input
                            type="radio"
                            id={`frequencyType_${idx}`}
                            name="cmBasicDataFilledByMTD_TL.frequencyType"
                            className="m-1 mb-2"
                            value={value?.frequencyType}
                            {...register(
                              "cmBasicDataFilledByMTD_TL.frequencyType",
                              {
                                required: "Please select frequency type",
                              }
                            )}
                          />
                          <label htmlFor={`frequencyType_${idx}`}>
                            {value?.frequencyType}
                          </label>
                        </Col>

                        {/* Render frequency values only if the frequencyType is Scheduled */}
                        {watch("cmBasicDataFilledByMTD_TL.frequencyType") ===
                          value?.frequencyType &&
                          value?.frequencyType === "Scheduled" && (
                            <Col className="d-flex justify-content-center align-items-center">
                              {value?.frequencyValue?.length > 0 &&
                                value?.frequencyValue?.map((type, idx1) => (
                                  <Col key={idx1}>
                                    <input
                                      type="radio"
                                      id={`frequencyValue_${idx1}`}
                                      name="cmBasicDataFilledByMTD_TL.frequencyValue"
                                      className="m-1 mb-2"
                                      value={type}
                                      {...register(
                                        "cmBasicDataFilledByMTD_TL.frequencyValue",
                                        {
                                          required: {
                                            value:
                                              watch(
                                                "cmBasicDataFilledByMTD_TL.frequencyType"
                                              ) === "Scheduled",
                                            message:
                                              "Please select frequency value",
                                          },
                                        }
                                      )}
                                    />
                                    <label htmlFor={`frequencyValue_${idx1}`}>
                                      {type}
                                    </label>
                                  </Col>
                                ))}

                              {/* Error for frequency value (only for Scheduled) */}
                              {errors?.cmBasicDataFilledByMTD_TL
                                ?.frequencyValue && (
                                <p className="text-error">
                                  {
                                    errors?.cmBasicDataFilledByMTD_TL
                                      ?.frequencyValue?.message
                                  }
                                </p>
                              )}
                            </Col>
                          )}
                      </div>
                    ))}

                    {/* Error for frequency type */}
                    {errors?.cmBasicDataFilledByMTD_TL?.frequencyType && (
                      <p className="text-error">
                        {
                          errors?.cmBasicDataFilledByMTD_TL?.frequencyType
                            ?.message
                        }
                      </p>
                    )}
                  </Col>
                </Row>

                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>Category:</b>
                    </p>
                  </Col>
                  <Col lg={7} className="d-flex justify-content-center">
                    {CATEGORIES_OF_CM?.map((value, idx) => (
                      <>
                        <Col>
                          <input
                            type="radio"
                            id="categories"
                            name="cmBasicDataFilledByMTD_TL.categories"
                            className="m-1 mb-2"
                            value={value}
                            // style={{ width: "350px" }}
                            {...register(
                              "cmBasicDataFilledByMTD_TL.categories",
                              {
                                required: "Please select category",
                              }
                            )}
                          />
                          <label>{value}</label>
                        </Col>
                      </>
                    ))}
                    {errors?.cmBasicDataFilledByMTD_TL?.categories && (
                      <p className="text-error">
                        {errors?.cmBasicDataFilledByMTD_TL?.categories?.message}
                      </p>
                    )}
                  </Col>
                </Row>
                {watch("cmBasicDataFilledByMTD_TL.categories") === "LTPM" && (
                  <>
                    <Row className="m-0 border d-flex align-items-center">
                      <Col lg={5}>
                        <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                          <b>Inspection Item: </b>
                        </p>
                      </Col>

                      <Col lg={7}>
                        <div className="d-block align-items-center">
                          {" "}
                          <input
                            type="text"
                            id="inspectionItem"
                            className="m-1 mb-2"
                            name="inspectionItem"
                            // style={{ width: "350px" }}
                            {...register(
                              "cmBasicDataFilledByMTD_TL.inspectionItem"
                            )}
                            onInput={() => {
                              clearErrors(
                                "cmBasicDataFilledByMTD_TL.inspectionItem"
                              );
                            }}
                          />
                        </div>
                        {errors?.cmBasicDataFilledByMTD_TL?.inspectionItem && (
                          <p className="text-error">
                            {
                              errors?.cmBasicDataFilledByMTD_TL?.inspectionItem
                                ?.message
                            }
                          </p>
                        )}
                      </Col>
                    </Row>
                    <Row className="m-0 border d-flex align-items-center">
                      <Col lg={5}>
                        <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                          <b>Action: </b>
                        </p>
                      </Col>

                      <Col lg={7}>
                        <div className="d-block align-items-center">
                          {" "}
                          <input
                            type="text"
                            id="actionForLTPM"
                            className="m-1 mb-2"
                            name="actionForLTPM"
                            // style={{ width: "350px" }}
                            {...register(
                              "cmBasicDataFilledByMTD_TL.actionForLTPM"
                            )}
                            onInput={() => {
                              clearErrors(
                                "cmBasicDataFilledByMTD_TL.actionForLTPM"
                              );
                            }}
                          />
                        </div>
                        {errors?.cmBasicDataFilledByMTD_TL?.actionForLTPM && (
                          <p className="text-error">
                            {
                              errors?.cmBasicDataFilledByMTD_TL?.actionForLTPM
                                ?.message
                            }
                          </p>
                        )}
                      </Col>
                    </Row>
                    <Row className="m-0 border d-flex align-items-center">
                      <Col lg={5}>
                        <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                          <b>Person: </b>
                        </p>
                      </Col>

                      <Col lg={7}>
                        <div className="d-block align-items-center">
                          {" "}
                          <input
                            type="text"
                            id="personForLTPM"
                            className="m-1 mb-2"
                            name="personForLTPM"
                            // style={{ width: "350px" }}
                            {...register(
                              "cmBasicDataFilledByMTD_TL.personForLTPM"
                            )}
                            onInput={() => {
                              clearErrors(
                                "cmBasicDataFilledByMTD_TL.personForLTPM"
                              );
                            }}
                          />
                        </div>
                        {errors?.cmBasicDataFilledByMTD_TL?.personForLTPM && (
                          <p className="text-error">
                            {
                              errors?.cmBasicDataFilledByMTD_TL?.personForLTPM
                                ?.message
                            }
                          </p>
                        )}
                      </Col>
                    </Row>
                  </>
                )}

                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>Target Date: </b>
                    </p>
                  </Col>

                  <Col lg={7}>
                    <div className="d-block align-items-center">
                      {" "}
                      <input
                        type="datetime-local"
                        id="targetDateOfCM"
                        className="m-1 mb-2"
                        name="cmBasicDataFilledByMTD_TL.targetDateOfCM"
                        // style={{ width: "350px" }}
                        {...register(
                          "cmBasicDataFilledByMTD_TL.targetDateOfCM",
                          {
                            required: "Please select target date",
                          }
                        )}
                        onInput={() => {
                          clearErrors(
                            "cmBasicDataFilledByMTD_TL.targetDateOfCM"
                          );
                        }}
                      />
                    </div>
                    {errors?.cmBasicDataFilledByMTD_TL?.targetDateOfCM && (
                      <p className="text-error">
                        {
                          errors?.cmBasicDataFilledByMTD_TL?.targetDateOfCM
                            ?.message
                        }
                      </p>
                    )}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center justify-content-start">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>Part Required: </b>
                    </p>
                  </Col>

                  <Col lg={7} className="d-flex align-items-center">
                    <Col>
                      {" "}
                      <input
                        type="radio"
                        id="partRequiredByMTDTL"
                        value="Yes"
                        className="m-1 mb-2"
                        name="partRequiredByMTDTL"
                        // style={{ width: "350px" }}
                        {...register("partRequiredByMTDTL", {
                          required: "This field is required !",
                        })}
                        onInput={() => {
                          clearErrors("partRequiredByMTDTL");
                        }}
                      />
                      <label>Yes</label>
                    </Col>
                    <Col>
                      {" "}
                      <input
                        type="radio"
                        id="partRequiredByMTDTL"
                        value="No"
                        className="m-1 mb-2"
                        name="partRequiredByMTDTL"
                        // style={{ width: "350px" }}
                        {...register("partRequiredByMTDTL", {
                          required: "This field is required !",
                        })}
                        onInput={() => {
                          clearErrors("partRequiredByMTDTL");
                        }}
                      />
                      <label>No</label>
                    </Col>
                    {errors?.partRequiredByMTDTL && (
                      <p className="text-error">
                        {errors?.partRequiredByMTDTL?.message}
                      </p>
                    )}
                  </Col>
                </Row>
                {watch("partRequiredByMTDTL") === "Yes" && (
                  <Row className="m-0 border d-flex align-items-center">
                    <Col lg={5}>
                      <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                        <b>Part Suggestion: </b>
                      </p>
                    </Col>

                    <Col lg={7}>
                      <div className="d-block align-items-center">
                        {" "}
                        <input
                          type="text"
                          id="partSuggestionByMTDTL"
                          className="m-1 mb-2"
                          name="partSuggestionByMTDTL"
                          // style={{ width: "350px" }}
                          {...register(
                            "cmBasicDataFilledByMTD_TL.partSuggestionByMTDTL",
                            {
                              required: "Please enter part name",
                            }
                          )}
                          onInput={() => {
                            clearErrors(
                              "cmBasicDataFilledByMTD_TL.partSuggestionByMTDTL"
                            );
                          }}
                        />
                      </div>
                      {errors?.cmBasicDataFilledByMTD_TL
                        ?.partSuggestionByMTDTL && (
                        <p className="text-error">
                          {
                            errors?.cmBasicDataFilledByMTD_TL
                              ?.partSuggestionByMTDTL?.message
                          }
                        </p>
                      )}
                    </Col>
                  </Row>
                )}

                {/* <Col lg={11} md={11}>
                  <Row className="">
                    <PartList parts={parts} setParts={setParts} />
                  </Row>
                </Col> */}
              </td>

              <td className="border p-2 col-lg-4 col-md-4 col-sm-12">
                <Row className="m-0">
                  <Col className="border p-2">
                    <FormControl>
                      <FormLabel id="demo-radio-buttons-group-label">
                        <small>
                          <b>SHIFT</b>
                        </small>  
                      </FormLabel>

                      {watch("shiftOfBM") && (
                        <RadioGroup
                          row
                          value={watch("shiftOfBM")}
                          // value={"B"}
                          aria-labelledby="demo-radio-buttons-group-label"
                          name="radio-buttons-group"
                        >
                          {plantShiftsData?.map((shiftInfo) => (
                            <FormControlLabel
                              value={shiftInfo.shiftName}
                              control={<Radio color="default" size="small" />}
                              label={shiftInfo.shiftName}
                              disabled={
                                watch("shiftOfBM") !== shiftInfo.shiftName
                              }
                            />
                          ))}
                        </RadioGroup>
                      )}
                    </FormControl>
                  </Col>
                </Row>

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
                  <Col className="border p-2">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>ASSIGN TO:</b>
                    </small>
                  </Col>
                  <Col className="border p-2">
                    <Controller
                      name="assignUserForCM"
                      control={control}
                      rules={{ required: "Please select the assign user" }}
                      render={({ field }) => (
                        <>
                          <Multiselect
                            {...field}
                            displayValue="tm_name"
                            // className="col-5"
                            options={assignTMList} // Options to display in the dropdown
                            // selectedValues={departmentList} // Preselected value to persist in dropdown
                            onSelect={async (selectedList) => {
                              // await setSelectedAssignTM(selectedList);
                              setValue("assignUserForCM", selectedList);
                              trigger("assignUserForCM");
                            }} // Function will trigger on select event
                            onRemove={async (selectedList) => {
                              // await setSelectedAssignTM(selectedList);
                              setValue("assignUserForCM", selectedList);
                              trigger("assignUserForCM");
                            }} // Function will trigger on remove event
                            style={{
                              multiselectContainer: {
                                width: "14rem",
                              },
                            }}
                            // selectedValues={requestSheetDataOfBM?.supportingTM}
                          />
                          {errors.assignUserForCM && (
                            <p className="text-error">
                              {errors?.assignUserForCM?.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </Col>
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

            <tr>
              <td>
                <button
                  type="submit"
                  className="btn bg-success"
                  // onClick={() => {
                  //   if (
                  //     !watch("problemFaced") &&
                  //     !watch("select_problemFaced")
                  //   ) {
                  //     return setError("error_problemFaced", {
                  //       type: "custom",
                  //       message: "Please fill or select this field",
                  //     });
                  //   }
                  // }}
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
};

export default GeneratedExistingMachineRequestSheetByMTD;
