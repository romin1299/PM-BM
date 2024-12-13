import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { Table, Row, Col, Form } from "react-bootstrap";
import { Box } from "@mui/material";
import moment from "moment-timezone";
import axios from "axios";

import Multiselect from "multiselect-react-dropdown";

import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { Button, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

import MachineStatusBox from "../SubComponents/MachineStatusBox";
import DropdownElem from "../../Component/DropdownElem";
import ProblemList from "../SubComponents/ProblemList";
import ActionList from "../SubComponents/ActionList";
import PartList from "../SubComponents/PartList";
import { BASE_URL } from "../../../ConditionsForDNINandDNHA/ConditionBasedDisplay";
import { SuccessToast, WarningToast } from "../../Component/ShowTostify";

const UpdateRequestSheetForAnyStatus = () => {
  const { machine_code, selectedYear, requestSheetID } = useParams();
  const navigate = useNavigate();

  let initialUserObj = {
    _id: "",
    tm_name: "",
  };

  const [AllData, setAllData] = useState({
    message: "",
    bmData: {
      count: 0,
      totalHours: 0,
    },
    shiftOfBM: [],
    machine: {},
    TLHOSS_and_TM_user_list: [initialUserObj],
    allUserGroup: [
      {
        _id: {
          tm_department: "",
          tm_grade: "",
          user_type: "",
        },
        users: [initialUserObj],
      },
    ],
    requestSheetDataOfBM: {},
  });

  // var curr = new Date();
  // var currentDate = curr.toISOString().substring(0, 10);

  const [problems, setProblems] = useState([]);
  const [actions, setActions] = useState([]);
  const [parts, setParts] = useState([]);

  const [validationFlag, setValidationFlag] = useState({
    problems_val_flag: false,
    actions_val_flag: false,
    parts_val_flag: false,
  });

  const handleOnchangeFlag = (key) => {
    setValidationFlag({ ...validationFlag, [key]: true });
  };

  const functionForUserDropdown = ({ tm_department, user_type }) =>
    AllData.allUserGroup?.find(
      (item) =>
        item?._id?.tm_department === tm_department &&
        item?._id?.user_type === user_type
    )?.users;

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    watch,
    reset,
    setValue,
    control,
    clearErrors,
  } = useForm({});

  const getDataForEditingTheRS = async () => {
    try {
      const res = await fetch(
        `/getDataForEditingTheRS/?machine_code=${machine_code}&&current_year=${selectedYear}&&_id=${requestSheetID}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (res.status === 201) {
        const data = await res.json();
        reset(data?.requestSheetDataOfBM);
        setProblems(
          data?.requestSheetDataOfBM?.maintenanceReportFilledByMTD?.problemsOfBM
        );
        setActions(
          data?.requestSheetDataOfBM?.maintenanceReportFilledByMTD
            ?.actionAndCounterMeasureStep
        );
        setParts(data?.requestSheetDataOfBM?.changedParts);
        // delete data["requestSheetDataOfBM"];
        setAllData(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (machine_code && requestSheetID) {
      getDataForEditingTheRS();
    }
  }, [machine_code, requestSheetID]);

  // const dirtyValues = (dirtyFields, allValues) => {
  //   if (dirtyFields === true || Array.isArray(dirtyFields)) {
  //     return allValues;
  //   }

  //   return Object.fromEntries(
  //     Object.keys(dirtyFields).map((key) => {
  //       return [key, dirtyValues(dirtyFields[key], allValues[key])];
  //     })
  //   );
  // };

  const objValueMappingFunction = (dirtyFields, key, allValues) => {
    return Object.fromEntries(
      Object.keys(dirtyFields[key])?.map((item) => [
        `${key}.${item}`,
        allValues[key][item],
      ])
    );
  };

  const dirtyValues = (dirtyFields, allValues) => {
    let newVal = {};
    Object.keys(dirtyFields).map((key) => {
      if (key === "supportingTM") {
        newVal[key] = allValues[key]?.map((item) => item?._id);
      } else if (typeof allValues[key] === "object") {
        newVal = {
          ...newVal,
          ...objValueMappingFunction(dirtyFields, key, allValues),
        };
      } else {
        newVal[key] = allValues[key];
      }
    });

    return newVal;
  };

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleUpdateRSForAnyStatus = async (data) => {
    if (
      !Object.values(validationFlag)?.includes(true) &&
      Object.keys(dirtyFields)?.length === 0
    ) {
      return WarningToast("Please fill some value in the form");
    }

    const formData = new FormData();

    formData.append("attachedDataSheets", data?.attachedDataSheets?.[0]);
    for (let i = 0; i < data?.attachedDrawings?.length; i++) {
      formData.append("attachedDrawings", data?.attachedDrawings[i]);
    }

    delete dirtyFields["attachedDataSheets"];
    delete dirtyFields["attachedDrawings"];

    let finalData = dirtyValues(dirtyFields, data);

    if (validationFlag?.problems_val_flag) {
      finalData["maintenanceReportFilledByMTD.problemsOfBM"] = problems;
    }

    if (validationFlag?.actions_val_flag) {
      finalData["maintenanceReportFilledByMTD.actionAndCounterMeasureStep"] =
        actions;
    }

    if (validationFlag?.parts_val_flag) {
      finalData["changedParts"] = parts;
    }

    finalData["breakDownBasicDataFilledByPRD.problemFaced"] =
      finalData?.select_problemFaced
        ? finalData?.select_problemFaced
        : finalData["breakDownBasicDataFilledByPRD.problemFaced"];

    formData.append("finalData", JSON.stringify(finalData));

    const res = await axios.patch(
      `/updateRequestSheetForAnyStatus/${AllData?.machine?._id}/?_id=${requestSheetID}`,
      formData
    );

    if (res.status === 201) {
      SuccessToast(res?.data?.message);
      handleBackNavigation();
    }
  };

  return (
    <div style={{ overflow: "scroll" }}>
      <form onSubmit={handleSubmit(handleUpdateRSForAnyStatus)}>
        <Table className="m-2 mt-3">
          <thead></thead>
          <tbody className="m-1 border p-3">
            <tr class="row " style={{ width: "100vw" }}>
              <td class="col-lg-12 col-md-12 col-sm-12 border-bottom-0">
                <Row>
                  <Col>
                    <button
                      className="btn bg-button m-2"
                      onClick={handleBackNavigation}
                      type="button"
                    >
                      Back
                    </button>
                    <button
                      className="btn bg-button"
                      onClick={(e) => {
                        e.preventDefault();
                        // navigate(
                        //   `/machine-history/${machine_code}/${selectedYear}/?machineId=${machineId}`
                        // );
                        window.open(
                          `/machine-history/${machine_code}/${selectedYear}/?machineId=${AllData?.machine?._id}`,
                          "_blank"
                        );
                      }}
                    >
                      Machine Details
                    </button>
                  </Col>
                  <Col>
                    <h4 className="d-flex align-items-center justify-content-center">
                      MAINTENANCE WORK REQUEST/REPORT
                    </h4>
                  </Col>
                  <Col>
                    <Box display="flex" justifyContent="end" gap={1}>
                      <MachineStatusBox
                        title="PM Status"
                        bodyText1={AllData?.machine?.PMStatus}
                        bodyText2={AllData?.machine?.PMdate}
                      />
                      <MachineStatusBox
                        title="BM"
                        bodyText1={
                          AllData?.bmData?.count &&
                          `${AllData?.bmData?.totalHours} Hrs./${AllData?.bmData?.count} Count`
                        }
                      />
                      <MachineStatusBox title="CM" />
                    </Box>
                  </Col>
                </Row>
              </td>
            </tr>
            <tr className="row m-2" style={{ width: "100vw" }}>
              <td className="mb-0 pb-0 border col-lg-1 col-md-2">
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
                      {...register("maintenanceType")}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="PM"
                      name="maintenanceType"
                      type="radio"
                      id={`inline-radio-2`}
                      value="PM"
                      {...register("maintenanceType")}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="CM"
                      type="radio"
                      name="maintenanceType"
                      id={`inline-radio-3`}
                      value="CM"
                      {...register("maintenanceType")}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="TPM"
                      type="radio"
                      name="maintenanceType"
                      id={`inline-radio-4`}
                      value="TPM"
                      {...register("maintenanceType")}
                    />
                  </div>
                </Form>
              </td>
              <td className="mb-0 pb-0 border col-lg-1 col-md-2">
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
                      {...register("priorityCode")}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="IMPORTANT"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-2`}
                      value="IMPORTANT"
                      {...register("priorityCode")}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="DATA NEEDED"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-3`}
                      value="DATA NEEDED"
                      {...register("priorityCode")}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="KAIZEN"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-4`}
                      value="KAIZEN"
                      {...register("priorityCode")}
                    />
                  </div>
                </Form>
              </td>
              <td className="mb-0 pb-0 border col-lg-8 col-md-4">
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
                        <b>REQUEST No.</b>
                        {watch("requestSheetNoOfBM")}
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
                              {watch("problemOccurredDateAndTimeOfBM")}
                              {/* <input
                                type="datetime-local"
                                {...register("problemOccurredDateAndTimeOfBM")}
                              /> */}
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

                              {watch("sheetIssuedDateAndTimeOfBM")}
                            </small>
                          </div>{" "}
                        </div>
                      </Row>
                    </Col>
                  </Row>
                </div>
              </td>

              <td className="mb-0 pb-0 pt-0 col-lg-2 col-md-4">
                <Row
                  className="pt-0 mb-0 border col-lg-12 col-md-12 col-sm-12"
                  style={{ marginLeft: "-8px" }}
                >
                  <Col className="pb-2 pt-1">
                    <small className="mb-0">
                      <b>DEPT./LINE</b>
                    </small>
                    <br />
                    <small>
                      {AllData?.machine?.cell?.cell_name}/
                      {AllData?.machine?.line?.line_name}
                    </small>
                  </Col>
                </Row>
                <Row className="pt-0 mb-0 " style={{ marginLeft: "-8px" }}>
                  <Col className="border pb-2">
                    <small className="fs-6 mb-0">
                      <b>TL [PRD]</b>
                    </small>
                    <br />
                    <small>{watch("requestSheetCreatedBy.tm_name")}</small>
                  </Col>
                </Row>
              </td>
            </tr>
            <tr class="row">
              <td className="border p-3 col-lg-8 col-md-7 col-sm-12">
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={4} md={6}>
                    <small className="mb-0">
                      <b>MACHINE NAME:</b>{" "}
                    </small>{" "}
                    &nbsp;&nbsp;
                    {AllData?.machine?.machine_name}
                  </Col>
                  <Col lg={4} md={6}>
                    <small className="mb-0">
                      <b>MACHINE NO.:</b>
                    </small>
                    &nbsp;&nbsp;
                    {AllData?.machine?.machine_code}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>PROBLEM FACED: </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <div className="d-flex align-items-center">
                      {AllData?.machine?.machine_problems_faced?.length > 0 && (
                        <select
                          {...register("select_problemFaced")}
                          onInput={() => {
                            clearErrors("error_problemFaced");
                          }}
                        >
                          <option selected disabled value="">
                            Please select
                          </option>

                          {AllData?.machine?.machine_problems_faced?.map(
                            (problem, index) => {
                              return <option key={index}>{problem}</option>;
                            }
                          )}
                          <option
                            key={
                              AllData?.machine?.machine_problems_faced?.length
                            }
                          >
                            Other
                          </option>
                        </select>
                      )}

                      {watch("select_problemFaced") === "Other" && (
                        <input
                          type="text"
                          id="prob"
                          className="m-1 mb-2"
                          style={{ width: "350px" }}
                          {...register(
                            "breakDownBasicDataFilledByPRD.problemFaced"
                          )}
                        />
                      )}
                    </div>
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>
                        PRD OBSERVATION FOR THIS PROBLEM BASED ON (5WHY-1HOW){" "}
                      </b>
                    </p>
                  </Col>
                  <Col lg={5}>
                    <input
                      type="text"
                      id="prdobv"
                      name="prdobv"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register(
                        "breakDownBasicDataFilledByPRD.PRD_ObservationForProblem_5Why_1How"
                      )}
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
                      type="text"
                      id="why"
                      name="why"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("breakDownBasicDataFilledByPRD.why_5M_1E")}
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
                      type="text"
                      id="where"
                      name="where"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register(
                        "breakDownBasicDataFilledByPRD.where_process"
                      )}
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
                      type="text"
                      id="when"
                      name="when"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register(
                        "breakDownBasicDataFilledByPRD.when_frequency"
                      )}
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
                      type="text"
                      id="who"
                      name="who"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("breakDownBasicDataFilledByPRD.who_person")}
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
                      type="text"
                      id="which"
                      name="which"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register(
                        "breakDownBasicDataFilledByPRD.which_defectLocation"
                      )}
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
                      type="text"
                      id="how"
                      name="how"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("breakDownBasicDataFilledByPRD.how_details")}
                    />
                  </Col>
                </Row>
              </td>

              <td className="border p-3 col-lg-4 col-md-4 col-sm-12">
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
                          aria-labelledby="demo-radio-buttons-group-label"
                          name="radio-buttons-group"
                        >
                          {AllData?.shiftOfBM.map((shiftInfo) => (
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
                            {...register("qualityRelated")}
                          />
                          <Form.Check
                            flex
                            label="No"
                            name="group1"
                            type={type}
                            id={`inline-${type}-2`}
                            value="No"
                            {...register("qualityRelated")}
                          />
                        </div>
                      ))}
                    </Form>
                  </Col>
                </Row>
                <Row className="pt-0 mb-0 m-0">
                  <Col lg={12} className="border pb-2 pt-1">
                    <small className="mb-0">
                      <b>BREAKDOWN ATTENDED BY</b>
                    </small>
                    <br />
                    {watch("assignUser.tm_name")
                      ? `${watch("assignUser.tm_name")}, `
                      : ""}
                    {watch("handOverUser.tm_name")
                      ? `${watch("handOverUser.tm_name")}, `
                      : ""}
                    {watch("supportingTM")
                      ?.map((obj) => obj?.tm_name)
                      ?.join(", ")}
                  </Col>
                </Row>
              </td>
            </tr>

            <tr className="row m-2 mb-0" style={{ width: "100vw" }}>
              <td class="col-lg-8 col-md-6 col-sm-12">
                <h4 className="mt-0 d-flex align-items-center justify-content-center">
                  MAINTENANCE REPORT ( To be filled by MTD)
                </h4>
              </td>
              <td className="mb-0 pb-0 pt-0 col-lg-4 col-md-6 col-sm-12">
                <Row className="pt-0 mb-0 ">
                  <Col
                    className="border border-top-0 col-md-4 pb-2 pt-1"
                    style={{ marginLeft: "3px" }}
                  >
                    <small className="mb-0">
                      <b>REQUEST RECEIVED MTD S.L</b>
                    </small>
                    <p>{watch("approvalOfMTD_SL.tm_name")}</p>
                  </Col>
                  <Col
                    className="pb-2 pt-1 col-md-3"
                    style={{ marginLeft: "3px" }}
                  >
                    <small className="fs-6 mb-0">
                      <b>MTD TL</b>
                    </small>
                    <br />
                    {AllData?.requestSheetDataOfBM?.approvalStatusOfMTD_TL !==
                      "Rejected" && watch("approvalOfMTD_TL_name")}

                    {/* <DropdownElem
                      name={"approvalOfMTD_TL"}
                      selectedMinor={watch(
                        "maintenanceReportFilledByMTD.minorBD"
                      )}
                      selectedMajor={watch(
                        "maintenanceReportFilledByMTD.majorBD"
                      )}
                      approvalList={
                        AllData?.machine?.section?.plant?.[0]
                          ?.approvalListOfMinorAndMajor
                      }
                      register={register}
                      errors={errors}
                      displayOrNot={true}
                      options={functionForUserDropdown({
                        tm_department: "MTD",
                        user_type: "TL/HOSS",
                      })}
                    /> */}
                  </Col>
                </Row>
              </td>
            </tr>

            <tr className="row m-0 mt-0">
              <td lg={12} md={12} sm={12}>
                <div className="mb-2">
                  <Row className="m-0">
                    <Col
                      className="border border-left-0"
                      lg={12}
                      md={12}
                      sm={12}
                    >
                      <Row className="d-flex align-items-center ">
                        <Col
                          lg={1}
                          md={2}
                          sm={6}
                          className="d-flex align-items-center border border-right-0 border-top-0 border-bottom"
                          style={{ height: "100px" }}
                        >
                          <small
                            style={{ fontSize: "12px" }}
                            className="text-center m-0 "
                          >
                            <b>WORK STARTED</b>
                          </small>
                        </Col>
                        <Col
                          className="border border-right-0 border-top-0 border-bottom"
                          lg={2}
                          md={3}
                          sm={6}
                          style={{ height: "100px" }}
                        >
                          <div className="d-flex align-items-center justify-content-center mt-3 mb-2">
                            <div className="text-center">
                              <small className="mb-0 d-block">
                                <b>DATE & TIME: </b>
                                <input
                                  type="datetime-local"
                                  style={{ width: "165px" }}
                                  {...register(
                                    "maintenanceReportFilledByMTD.workStartedDateOfBM"
                                  )}
                                />
                              </small>
                            </div>{" "}
                          </div>
                        </Col>
                        <Col
                          className="border border-right-0 border-top-0 border-bottom d-flex align-items-center"
                          lg={1}
                          md={2}
                          sm={6}
                          style={{ height: "100px" }}
                        >
                          <small
                            style={{ fontSize: "12px" }}
                            className="text-center m-0"
                          >
                            <b>WORK ENDED</b>
                          </small>
                        </Col>
                        <Col
                          className="border border-right-0 border-top-0 border-bottom-0"
                          lg={2}
                          md={3}
                          sm={6}
                          style={{ height: "100px" }}
                        >
                          <div className="d-flex align-items-center justify-content-center mt-3 mb-2">
                            <div className="text-center">
                              <small className="mb-0 d-block">
                                <b>DATE & TIME: </b>
                                <br />
                                {watch(
                                  "maintenanceReportFilledByMTD.workEndedDateOfBM"
                                )}
                                {/* <input
                                  type="datetime-local"
                                  style={{ width: "160px" }}
                                  defaultValue={currentDate}
                                  {...register(
                                    "maintenanceReportFilledByMTD.workEndedDateOfBM"
                                  )}
                                /> */}
                              </small>
                            </div>{" "}
                          </div>
                        </Col>
                        <Col lg={3} md={6} sm={12} style={{ height: "100px" }}>
                          <Row className="border border-top-0 border-left-0 border-right-0">
                            <small className="mb-0 mt-1">
                              <b>SECTION IN-CHARGE</b>
                            </small>
                            <br />
                          </Row>
                          <Row className="border border-top-0 border-left-0 border-right-0">
                            <Col
                              lg={6}
                              md={6}
                              className="d-block border border-bottom-0 border-top-0 border-left-0 border-bottom-0"
                            >
                              {(watch(
                                "maintenanceReportFilledByMTD.minorBD"
                              ) === "Yes" &&
                                AllData?.machine?.section?.plant?.[0]?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                                  "MTD_HOSS".replace("_", " ")
                                )) ||
                              (watch("maintenanceReportFilledByMTD.majorBD") ===
                                "Yes" &&
                                AllData?.machine?.section?.plant?.[0]?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                                  "MTD_HOSS"?.replace("_", " ")
                                )) ? (
                                <small>
                                  <b>MTD HOSS</b>
                                </small>
                              ) : (
                                ""
                              )}
                              <p>
                                {AllData?.requestSheetDataOfBM
                                  ?.approvalStatusOfMTD_HOSS === "Accepted" &&
                                  AllData?.requestSheetDataOfBM
                                    ?.requestSheetStatus !== "Rejected" &&
                                  watch("approvalOfMTD_HOSS.tm_name")}
                              </p>
                            </Col>
                            <Col
                              lg={6}
                              md={6}
                              className="d-block border-0 border-bottom-0"
                            >
                              {watch("maintenanceReportFilledByMTD.minorBD") ===
                                "Yes" &&
                                AllData?.machine?.section?.plant?.[0]?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                                  "MTD_HOS"?.replace("_", " ")
                                ) && <small>MTD HOS</small>}

                              {AllData?.requestSheetDataOfBM
                                ?.approvalStatusOfMTD_HOS === "Accepted" &&
                                AllData?.requestSheetDataOfBM
                                  ?.requestSheetStatus !== "Rejected" &&
                                watch("approvalOfMTD_HOS?.tm_name")}
                            </Col>
                          </Row>
                        </Col>
                        <Col
                          lg={2}
                          md={6}
                          sm={12}
                          className="border border-bottom-0 pb-2 "
                          style={{ height: "100px" }}
                        >
                          {watch("maintenanceReportFilledByMTD.breakDownTime") >
                          120 ? (
                            <>
                              <small className="mb-0">
                                <b>FEEDBACK</b>
                              </small>
                              <br />
                              <input
                                type="text"
                                className="widthwhy"
                                id="feedbackMTD_HOS"
                                {...register("feedbackMTD_HOS")}
                              />
                            </>
                          ) : (
                            ""
                          )}
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
              </td>
            </tr>

            <tr class="row m-2">
              <td class="col-lg-4 col-md-6 col-sm-12 border-bottom">
                <ProblemList
                  problems={problems}
                  setProblems={setProblems}
                  handleOnchangeFlag={handleOnchangeFlag}
                />
                {/* <input
                  {...register("problemValidation")}
                  class="visually-hidden"
                ></input> */}

                <Row className="m-0">
                  <Col
                    lg={3}
                    md={6}
                    sm={6}
                    className="border text-center pb-2 pt-2"
                  >
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>BREAKDOWN</b>
                    </small>
                    <p>
                      {watch("maintenanceReportFilledByMTD.breakDownTime") ||
                        null}
                    </p>
                  </Col>
                  <Col
                    lg={3}
                    md={6}
                    sm={6}
                    className="border text-center pb-2 pt-2"
                  >
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>ANALYSIS</b>
                    </small>
                    <input
                      type="number"
                      style={{ width: "100%" }}
                      id="analysisTime"
                      {...register("maintenanceReportFilledByMTD.analysisTime")}
                    />
                  </Col>
                  <Col
                    lg={3}
                    md={6}
                    sm={6}
                    className="border text-center pb-2 pt-2"
                  >
                    <p className="mb-0" style={{ fontSize: "12px" }}>
                      <b>SPARE WAITING</b>
                    </p>
                    <input
                      type="number"
                      className="mb-2"
                      style={{ width: "100%" }}
                      id="spareWaitingTime"
                      name="spareWaitingTime"
                      {...register(
                        "maintenanceReportFilledByMTD.spareWaitingTime"
                      )}
                    />
                  </Col>
                  <Col
                    lg={3}
                    md={6}
                    sm={6}
                    className="border text-center pb-2 pt-2"
                  >
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>REPLACEMENT</b>
                    </small>
                    <input
                      type="number"
                      className="mb-2"
                      style={{ width: "100%" }}
                      id="replacementTime"
                      name="replacementTime"
                      {...register(
                        "maintenanceReportFilledByMTD.replacementTime"
                      )}
                    />
                  </Col>
                </Row>
                <Row className="m-0">
                  <Col
                    lg={3}
                    md={6}
                    sm={6}
                    className="border text-center pb-2 pt-2"
                  >
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                    <b>MAINTENANCE</b> <br /> <b>(No Loss)</b>
                    </small>
                    <input
                      type="number"
                      className="mb-2"
                      style={{ width: "100%" }}
                      id="maintenanceTime"
                      name="maintenanceTime"
                      {...register(
                        "maintenanceReportFilledByMTD.maintenanceTime"
                      )}
                    />
                  </Col>
                  <Col
                    lg={3}
                    md={6}
                    sm={6}
                    className="border text-center pb-2 pt-2"
                  >
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>ADJUSTMENT</b>
                    </small>
                    <input
                      type="number"
                      style={{ width: "100%" }}
                      id="mainTime"
                      name="mainTime"
                      {...register(
                        "maintenanceReportFilledByMTD.adjustmentTime"
                      )}
                    />
                  </Col>
                  <Col
                    lg={3}
                    md={6}
                    sm={6}
                    className="border text-center pb-2 pt-2"
                  >
                    <p className="mb-0" style={{ fontSize: "12px" }}>
                      <b>QUALITY CHECK</b>
                    </p>
                    <input
                      type="number"
                      className="mb-2"
                      style={{ width: "100%" }}
                      id="qualityTime"
                      name="qualityTime"
                      {...register(
                        "maintenanceReportFilledByMTD.qualityCheckTime"
                      )}
                    />
                  </Col>
                  <Col
                    lg={3}
                    md={6}
                    sm={6}
                    className="border text-center pb-2 pt-2"
                  >
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>BREAK</b>
                    </small>
                    <input
                      type="number"
                      className="mb-2"
                      style={{ width: "100%" }}
                      id="breakTime"
                      name="breakTime"
                      {...register("maintenanceReportFilledByMTD.breakTime")}
                    />
                  </Col>
                </Row>
                {errors?.["totalTimeValidation"] && (
                  <p className="text-error">
                    {errors?.["totalTimeValidation"]?.message}
                  </p>
                )}
                <Row className="m-0">
                  <Col>
                    <Row>
                      <Col
                        lg={6}
                        md={6}
                        sm={6}
                        className="border d-flex align-items-center"
                      >
                        <p className="mb-0" style={{ fontSize: "12px" }}>
                          <b>MAJOR B/D </b>
                        </p>
                        &nbsp;&nbsp;&nbsp;
                        <Form className="d-flex align-items-center justify-content-center">
                          <div className="d-flex">
                            <Form.Check
                              flex
                              label="Yes"
                              name="majorBD"
                              type="radio"
                              value="Yes"
                              id="majorBD"
                              disabled
                              checked={
                                watch(
                                  "maintenanceReportFilledByMTD.breakDownTime"
                                ) > 120
                                  ? true
                                  : false
                              }
                            />
                            &nbsp;&nbsp;
                            <Form.Check
                              flex
                              label="No"
                              name="majorBD"
                              type="radio"
                              value="No"
                              id="majorBD"
                              disabled
                              checked={
                                watch(
                                  "maintenanceReportFilledByMTD.breakDownTime"
                                ) > 120
                                  ? false
                                  : true
                              }
                            />
                          </div>
                        </Form>
                      </Col>
                      <Col
                        lg={6}
                        md={6}
                        sm={6}
                        className="border d-flex align-items-center"
                      >
                        <Form className="align-items-center justify-content-center">
                          <div className="d-flex">
                            <Form.Check
                              flex
                              label="FIRST TIME"
                              name="firstTimeOrRepeat"
                              type="radio"
                              value="First Time"
                              id="firstTimeOrRepeat"
                              {...register(
                                "maintenanceReportFilledByMTD.firstTimeOrRepeat"
                              )}
                            />
                            &nbsp;&nbsp;
                            <Form.Check
                              flex
                              label="REPEAT"
                              name="firstTimeOrRepeat"
                              type="radio"
                              value="REPEAT"
                              id="firstTimeOrRepeat"
                              {...register(
                                "maintenanceReportFilledByMTD.firstTimeOrRepeat"
                              )}
                            />
                          </div>
                        </Form>
                      </Col>
                      <Col
                        lg={6}
                        md={6}
                        sm={6}
                        className="border d-flex align-items-center"
                      >
                        <p className="mb-0" style={{ fontSize: "12px" }}>
                          <b>MINOR B/D </b>
                        </p>
                        &nbsp;&nbsp;&nbsp;
                        <Form className="d-flex align-items-center justify-content-center">
                          <div className="d-flex">
                            <Form.Check
                              flex
                              label="Yes"
                              name="minorBD"
                              type="radio"
                              disabled
                              value="Yes"
                              id="minorBD"
                              checked={
                                watch(
                                  "maintenanceReportFilledByMTD.breakDownTime"
                                ) <= 120
                                  ? true
                                  : false
                              }
                            />
                            &nbsp;&nbsp;
                            {/* {console.log(selectedMinor === "Yes")} */}
                            <Form.Check
                              flex
                              label="No"
                              name="minorBD"
                              type="radio"
                              disabled
                              value="No"
                              id="minorBD"
                              checked={
                                watch(
                                  "maintenanceReportFilledByMTD.breakDownTime"
                                ) <= 120
                                  ? false
                                  : true
                              }
                            />
                          </div>
                        </Form>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </td>
              <td class="col-lg-3 col-md-6 col-sm-12 border-bottom">
                <Row className="m-0">
                  <Col className="border">
                    <small className="mb-0">
                      <b>WHY WHY ANALYSIS [ ROOT CAUSE ]</b>
                    </small>
                  </Col>
                </Row>

                <Row className="m-0">
                  <Col lg={12} className="d-block align-items-center border">
                    <p className="mb-0" style={{ fontSize: "12px" }}>
                      <b>WHY-1 </b>
                    </p>{" "}
                    <textarea
                      rows={2}
                      type="text"
                      id="Why1"
                      name="why1"
                      className="m-1 widthwhy"
                      {...register(
                        "maintenanceReportFilledByMTD.whyAnalysis.why1"
                      )}
                    />
                  </Col>
                  <Col lg={12} className="d-block align-items-center border">
                    <p className="mb-0" style={{ fontSize: "12px" }}>
                      <b>WHY-2 </b>
                    </p>{" "}
                    <textarea
                      rows={2}
                      type="text"
                      id="Why2"
                      name="why2"
                      className="m-1 widthwhy"
                      {...register(
                        "maintenanceReportFilledByMTD.whyAnalysis.why2"
                      )}
                    />
                  </Col>
                  <Col lg={12} className="d-block align-items-center border">
                    <p className="mb-0" style={{ fontSize: "12px" }}>
                      <b>WHY-3 </b>
                    </p>{" "}
                    <textarea
                      rows={2}
                      type="text"
                      id="Why3"
                      name="why3"
                      className="m-1 widthwhy"
                      {...register(
                        "maintenanceReportFilledByMTD.whyAnalysis.why3"
                      )}
                    />
                  </Col>
                  <Col lg={12} className="d-block align-items-center border">
                    <p className="mb-0" style={{ fontSize: "12px" }}>
                      <b>WHY-4 </b>
                    </p>{" "}
                    <textarea
                      rows={2}
                      type="text"
                      id="Why4"
                      name="why4"
                      className="m-1 widthwhy"
                      {...register(
                        "maintenanceReportFilledByMTD.whyAnalysis.why4"
                      )}
                    />
                  </Col>
                  <Col lg={12} className="d-block align-items-center border">
                    <p className="mb-0" style={{ fontSize: "12px" }}>
                      <b>WHY-5 </b>
                    </p>{" "}
                    <textarea
                      rows={2}
                      type="text"
                      id="Why5"
                      name="why5"
                      className="m-1 widthwhy"
                      {...register(
                        "maintenanceReportFilledByMTD.whyAnalysis.why5"
                      )}
                    />
                  </Col>
                </Row>
              </td>

              <td class="col-lg-4 col-md-12 col-sm-12  border-bottom">
                <Row className="m-0">
                  <Col className="border p-2">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>QUALITY CONFIRMED (IPP)</b>&nbsp;&nbsp;&nbsp;
                    </small>
                  </Col>
                  <Col className="border p-2 d-flex align-items-center">
                    <Form>
                      <div className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="qualityConfirmed"
                          type="radio"
                          value="Yes"
                          id="qualityConfirmed"
                          {...register("qualityConfirmed")}
                        />
                        &nbsp;&nbsp;
                        <Form.Check
                          flex
                          label="No"
                          name="qualityConfirmed"
                          type="radio"
                          value="No"
                          id="qualityConfirmed"
                          {...register("qualityConfirmed")}

                          // onChange={handleQuality}
                        />
                      </div>
                    </Form>
                  </Col>
                </Row>
                <Row className="m-0 border border-bottom-0">
                  <p className="text-center mb-0">**PART QUALITY CHECKED</p>
                </Row>
                <Row className="pt-0 mb-0 m-0" style={{ marginLeft: "-8px" }}>
                  <Col lg={6} md={6} className="border pb-2 pt-1">
                    <small className="mb-0">
                      <b>PRD</b>
                    </small>
                    {watch("partQualityCheckedByPRD") ? (
                      <p className="mb-0">
                        {watch("partQualityCheckedByPRD.tm_name")}
                      </p>
                    ) : (
                      <DropdownElem
                        name={"partQualityCheckedByPRD"}
                        options={functionForUserDropdown({
                          tm_department: "PRD",
                          user_type: "TL/HOSS",
                        })}
                        className={"d-inline"}
                        register={register}
                        errors={errors}
                      />
                    )}
                  </Col>
                  <Col lg={6} md={6} className="border pb-2 pt-1">
                    <small className="mb-0">
                      <b>MTD</b>
                    </small>
                    {watch("partQualityCheckedByMTD") ? (
                      <p className="mb-0">
                        {watch("partQualityCheckedByMTD.tm_name")}
                      </p>
                    ) : (
                      <DropdownElem
                        name={"partQualityCheckedByMTD"}
                        options={functionForUserDropdown({
                          tm_department: "MTD",
                          user_type: "TL/HOSS",
                        })}
                        className={"d-inline"}
                        register={register}
                        errors={errors}
                      />
                    )}
                  </Col>
                </Row>
                <Row className="m-0">
                  <Col className="border p-2">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>DATA SHEET ATTACHED</b>&nbsp;&nbsp;&nbsp;
                    </small>
                  </Col>
                  <Col className="border p-2 d-flex align-items-center">
                    <Form>
                      <div className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="dataSheetOfRequestSheet"
                          type="radio"
                          value="Yes"
                          id="dataSheetOfRequestSheet"
                          checked={
                            watch(
                              "maintenanceReportFilledByMTD.breakDownTime"
                            ) > 120
                              ? true
                              : watch("dataSheetOfRequestSheet") === "Yes"
                              ? true
                              : false
                          }
                          {...register("dataSheetOfRequestSheet")}
                        />
                        &nbsp;&nbsp;
                        <Form.Check
                          flex
                          label="No"
                          name="dataSheetOfRequestSheet"
                          type="radio"
                          value="No"
                          id="dataSheetOfRequestSheet"
                          disabled={
                            watch(
                              "maintenanceReportFilledByMTD.breakDownTime"
                            ) > 120 && true
                          }
                          {...register("dataSheetOfRequestSheet")}
                        />
                      </div>
                      {(watch("maintenanceReportFilledByMTD.breakDownTime") >
                        120 ||
                        watch("dataSheetOfRequestSheet") === "Yes") && (
                        <>
                          <Form.Group
                            controlId="formFileMultiple"
                            className="mb-3"
                          >
                            <Form.Control
                              type="file"
                              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                              onChange={(e) => {
                                console.log(e?.target?.files);
                                setValue("attachedDataSheets", e.target.files, {
                                  shouldDirty: true,
                                });
                              }}
                            />
                          </Form.Group>

                          {typeof watch("attachedDataSheets") === "string" && (
                            <>
                              <Typography mt={2} variant="body2">
                                {watch("attachedDataSheets")}
                              </Typography>
                              <Button
                                target="_blank"
                                // href={`http://localhost:7000/${watch("attachedDataSheets")}`}
                                href={`${process.env.REACT_APP_BASE_URL}${watch(
                                  "attachedDataSheets"
                                )}`}
                                disableElevation
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<DownloadIcon fontSize="small" />}
                              >
                                Download
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </Form>
                  </Col>
                </Row>
                <Row className="m-0">
                  <Col className="border p-2">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>DRAWING ATTACHED</b>
                    </small>
                  </Col>
                  <Col className="border p-2 d-flex align-items-center">
                    <Form>
                      <div className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="drawingOfRequestSheet"
                          type="radio"
                          value="Yes"
                          id="drawingOfRequestSheet"
                          // onChange={handledrawingOfRequestSheet}
                          {...register("drawingOfRequestSheet")}
                        />
                        &nbsp;&nbsp;
                        <Form.Check
                          flex
                          label="No"
                          name="drawingOfRequestSheet"
                          type="radio"
                          value="No"
                          id="drawingOfRequestSheet"
                          // onChange={handledrawingOfRequestSheet}
                          {...register("drawingOfRequestSheet")}
                        />
                      </div>

                      {watch("drawingOfRequestSheet") === "Yes" && (
                        <>
                          <Form.Group
                            controlId="formFileMultiple"
                            className="mb-3"
                          >
                            <Form.Control
                              type="file"
                              multiple
                              accept="image/png, image/gif, image/jpeg"
                              onChange={(e) => {
                                setValue("attachedDrawings", e.target.files, {
                                  shouldDirty: true,
                                });
                              }}
                            />
                          </Form.Group>

                          {watch("attachedDrawings")?.length > 0 &&
                            typeof watch("attachedDrawings")?.[0] ===
                              "string" && (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                {watch("attachedDrawings")?.map((image) => (
                                  <a
                                    target="_blank"
                                    // href={`http://localhost:7000/${image}`}
                                    href={`${process.env.REACT_APP_BASE_URL}${image}`}
                                    style={{
                                      width: "100%",
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}
                                  >
                                    <img
                                      // src={`http://localhost:7000/${image}`}
                                      src={`${process.env.REACT_APP_BASE_URL}${image}`}
                                      style={{
                                        maxWidth: "100px",
                                        maxHeight: "100px",
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        textAlign: "center",
                                      }}
                                    >
                                      {image}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            )}
                        </>
                      )}
                    </Form>
                  </Col>
                </Row>
              </td>
            </tr>

            <tr class="row m-2">
              <td class="col-lg-6 col-md-12 col-sm-12">
                <ActionList
                  actions={actions}
                  setActions={setActions}
                  handleOnchangeFlag={handleOnchangeFlag}
                />
              </td>
              <td class="col-lg-6 col-md-12 col-sm-12">
                <Row className="m-0">
                  <Col className="border col-lg-12 col-md-12 col-sm-12">
                    <small>
                      <b>PREVENTIVE / CORRECTIVE MAINTENANCE</b>
                    </small>
                    <br />
                    <textarea
                      rows={2}
                      type="text"
                      id="preventive_corrective_maintenance"
                      name="preventive_corrective_maintenance"
                      style={{ width: "80%" }}
                      {...register("preventive_corrective_maintenance")}
                    />
                  </Col>
                </Row>

                <Row className="m-0">
                  <Col className="border col-lg-12 col-md-12 col-sm-12">
                    <small>
                      {" "}
                      <b>YOKOTENKAI</b>
                    </small>

                    <br />
                    <textarea
                      rows={2}
                      type="text"
                      id="yokotenkai"
                      name="yokotenkai"
                      className="m-1"
                      style={{ width: "80%" }}
                      {...register("yokotenkai")}
                    />
                  </Col>
                </Row>
              </td>
            </tr>

            <tr className="row">
              <td className="col-lg-6 col-md-6">
                <Row className="m-0">
                  <Col className="border p-2">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>Is Action Temporary?</b>&nbsp;&nbsp;&nbsp;
                    </small>
                  </Col>
                  <Col className="border p-2 d-flex align-items-center">
                    <Form>
                      <div className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="actionTemporaryOrNot"
                          type="radio"
                          value="Yes"
                          id="actionTemporaryOrNot"
                          {...register("actionTemporaryOrNot")}
                        />{" "}
                        &nbsp;&nbsp;
                        <Form.Check
                          flex
                          label="No"
                          name="actionTemporaryOrNot"
                          type="radio"
                          value="No"
                          id="actionTemporaryOrNot"
                          {...register("actionTemporaryOrNot")}
                        />
                      </div>
                    </Form>
                  </Col>
                </Row>
                <Row className="m-0">
                  <Col className="border p-2">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>No. Of TM Attended.</b>&nbsp;&nbsp;&nbsp;
                    </small>
                  </Col>
                  <Col className="border p-2 d-flex align-items-center">
                    <Controller
                      name="supportingTM"
                      control={control}
                      render={({ field }) => (
                        <Multiselect
                          {...field}
                          displayValue="tm_name"
                          sel
                          className="col-9 "
                          options={AllData?.TLHOSS_and_TM_user_list} // Options to display in the dropdown
                          // selectedValues={departmentList} // Preselected value to persist in dropdown
                          onSelect={(selectedList) => {
                            setValue("supportingTM", selectedList, {
                              shouldDirty: true,
                            });
                          }} // Function will trigger on select event
                          onRemove={(selectedList) => {
                            setValue("supportingTM", selectedList, {
                              shouldDirty: true,
                            });
                          }} // Function will trigger on remove event
                          style={{
                            multiselectContainer: {
                              width: "15rem",
                            },
                          }}
                          selectedValues={watch("supportingTM")}
                        />
                      )}
                    />
                  </Col>
                </Row>
              </td>

              <td className="col-lg-6 col-md-6">
                {AllData?.machine?.plant?.[0]?.categories?.map(
                  (categoryObj, idxOfCategory) => (
                    <>
                      <Row className="m-0">
                        <Col lg={4} className="border p-2">
                          <p className="mb-0 d-flex align-items-center justify-content-start">
                            <b>{categoryObj?.name}</b>&nbsp;&nbsp;&nbsp;
                          </p>
                        </Col>

                        <Col
                          lg={6}
                          md={12}
                          className="border p-2 d-flex align-items-center"
                        >
                          <Form>
                            <div className="d-flex row p-2">
                              {categoryObj?.subCategories?.map(
                                (subCategoryObj, idxOfSubCategory) => (
                                  <Form.Check
                                    flex
                                    label={subCategoryObj?.name}
                                    type="radio"
                                    value={subCategoryObj?.name}
                                    name={`categoriesOfRequestSheet.${idxOfCategory}.subCategory`}
                                    className="col-auto"
                                    checked={
                                      watch(
                                        `categoriesOfRequestSheet.${idxOfCategory}.subCategory`
                                      ) === subCategoryObj?.name
                                    }
                                    onClick={(e) => {
                                      setValue(
                                        `categoriesOfRequestSheet.${idxOfCategory}`,
                                        {
                                          category: categoryObj?.name,
                                          subCategory: e.target.value,
                                        },
                                        { shouldDirty: true }
                                      );
                                    }}
                                  />
                                )
                              )}
                            </div>
                          </Form>
                        </Col>
                      </Row>
                    </>
                  )
                )}
              </td>
            </tr>

            <tr>
              <td colSpan={16}>
                <Row>
                  <Col className="col-lg-auto">
                    <Row className="ms-0 border">
                      <b
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          whiteSpace: "normal",
                          fontSize: "12px",
                        }}
                      >
                        CHANGED PARTS
                      </b>
                    </Row>
                  </Col>
                  <Col lg={11} md={11}>
                    <Row className="">
                      <PartList
                        parts={parts}
                        setParts={setParts}
                        handleOnchangeFlag={handleOnchangeFlag}
                      />
                    </Row>
                  </Col>
                </Row>
              </td>
            </tr>

            <tr>
              <td colSpan={16}>
                <Row className="m-0">
                  <Col lg={4} md={12} className="border">
                    <Row>
                      <small>
                        <b className="text-decoration-underline">NOTE:</b>
                      </small>
                    </Row>
                    <Row>
                      <p
                        className="text-justify mb-0"
                        style={{ fontSize: "12px" }}
                      >
                        * IN CASE OF MAJOR BREKDOWN, IT IS NECESSARY TO GET THE
                        SIGNATURE OF "GM-PRD" & "GM-MTD" IN "CHECKED BY" BOX.
                      </p>
                      <p
                        className="text-justify mb-0"
                        style={{ fontSize: "12px" }}
                      >
                        ** PART QUALITY RELATED TO MAINTENANCE WORK.
                      </p>
                    </Row>
                  </Col>

                  <Col lg={8} md={12} className="border">
                    <Row>
                      <Col lg={8} md={8} className="text-center border p-1">
                        <b>CHECKED BY</b>
                      </Col>
                    </Row>
                    <Row>
                      <Col lg={2} md={2} className="border p-1 text-center">
                        <small>
                          <b>* GM-MTD</b>
                        </small>
                      </Col>
                      <Col lg={2} md={2} className="border p-1 text-center">
                        <small>
                          <b>* GM-PRD</b>
                        </small>
                      </Col>
                      <Col lg={2} md={2} className="border p-1 text-center">
                        <small>
                          <b>SECTION INCHARGE (PRD)</b>
                        </small>
                      </Col>
                      <Col lg={2} md={2} className="border p-1 text-center">
                        <small>
                          <b>TEAM LEADER (PRD)</b>
                        </small>
                      </Col>
                    </Row>
                    <Row>
                      <Col lg={2} md={2} className="border">
                        <div className="p-1">
                          {AllData?.requestSheetDataOfBM
                            ?.approvalStatusOfMTD_HOD === "Accepted" &&
                            AllData?.requestSheetDataOfBM
                              ?.requestSheetStatus !== "Rejected" &&
                            watch("approvalOfMTD_HOD_name")}
                        </div>
                      </Col>
                      <Col lg={2} md={2} className="border">
                        <div className="p-1">
                          {AllData?.requestSheetDataOfBM
                            ?.approvalStatusOfPRD_HOD === "Accepted" &&
                            AllData?.requestSheetDataOfBM
                              ?.requestSheetStatus !== "Rejected" &&
                            watch("approvalOfPRD_HOD_name")}
                        </div>
                      </Col>
                      <Col lg={2} md={2} className="border">
                        <div className="p-1">
                          {AllData?.requestSheetDataOfBM
                            ?.approvalStatusOfPRD_HOS === "Accepted" &&
                            AllData?.requestSheetDataOfBM
                              ?.requestSheetStatus !== "Rejected" &&
                            watch("approvalOfPRD_HOS_name")}
                        </div>
                      </Col>
                      <Col lg={2} md={2} className="border">
                        <div className="p-1">
                          {AllData?.requestSheetDataOfBM
                            ?.approvalStatusOfPRD_TL === "Accepted" &&
                            AllData?.requestSheetDataOfBM
                              ?.requestSheetStatus !== "Rejected" &&
                            watch("approvalOfPRD_TL_name")}
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </td>
            </tr>
            <tr>
              <b>FO/MTD/01/04/04</b>
            </tr>
          </tbody>

          <Row>
            <Col>
              <button
                type="submit"
                className="btn bg-success"
                style={{ marginTop: "1rem" }}
              >
                Submit
              </button>
            </Col>
          </Row>
        </Table>
      </form>
    </div>
  );
};

export default UpdateRequestSheetForAnyStatus;
