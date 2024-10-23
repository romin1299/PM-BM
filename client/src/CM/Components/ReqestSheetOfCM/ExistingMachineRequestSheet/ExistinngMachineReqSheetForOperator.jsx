import React, { useContext, useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { Row, Col, Container, Form } from "react-bootstrap";
import axios from "axios";
import RoutingContext from "../../../../context/routing/RoutingContext";
import PartList from "../../../../BM/Tabs/SubComponents/PartList";
import ActionList from "../../../../BM/Tabs/SubComponents/ActionList";
import WorkDetails from "../../../../BM/Tabs/SubComponents/WorkDetails";
import {
  SuccessToast,
  WarningToast,
} from "../../../../BM/Component/ShowTostify";

const ExistinngMachineReqSheetForOperator = ({
  cmSelectedSheetForView,
  setCmReqSheetView,
  isEditable = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    control,
    clearErrors,
    formState: { errors, dirtyFields },
  } = useForm({
    defaultValues: {
      isPermissionOfMTDTL: cmSelectedSheetForView?.isPermissionOfMTDTL,
    },
  });
  const showMTDHOSS = watch("options") === "Yes";

  const [MTDHOSList, setMTDHOSList] = useState([]);
  const [MTDTLList, setMTDTLList] = useState([]);
  const [PRDTLList, setPRDTLList] = useState([]);
  const [parts, setParts] = useState([]);
  const [actions, setActions] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const context = useContext(RoutingContext);

  const getApprovalListOfCM = async () => {
    try {
      const response = await axios.get(
        `/getMachineDetailsOnScanningRequest/?machine_code=${cmSelectedSheetForView?.machineNo}&current_year=${cmSelectedSheetForView?.preAggregationTimeStampOfRequestSheet?.requestSheet_year}`
      );
      setMTDHOSList(response?.data?.requestSheetApprovalList?.mtdHOS);
      setMTDTLList(response?.data?.requestSheetApprovalList?.mtdTL);
      setPRDTLList(response?.data?.requestSheetApprovalList?.prdTL);
      reset(cmSelectedSheetForView);
      setValue(
        "isPermissionOfMTDTL",
        cmSelectedSheetForView?.approvalOfMTD_TL ? "Yes" : "No"
      );
      setValue(
        "isPermissionOfPRDTL",
        cmSelectedSheetForView?.approvalOfPRD_TL ? "Yes" : "No"
      );
      setValue("prdTL", cmSelectedSheetForView?.approvalOfPRD_TL);

      setValue("mtdTL", cmSelectedSheetForView?.approvalOfMTD_TL);
      setValue("mtdHOS", cmSelectedSheetForView?.approvalOfMTD_HOS);
    } catch (error) {
      console.log(error);
    }
  };
  console.log(cmSelectedSheetForView);  
  useEffect(() => {
    getApprovalListOfCM();
    setParts(cmSelectedSheetForView?.changedParts);
    setActions(cmSelectedSheetForView?.actionAndCounterMeasureStep);
    setWorkDetails(cmSelectedSheetForView?.workDetails);
  }, []);

  const handleCustomErrors = () => {
    console.log("object", watch("mtdHOS"));
    if (watch("mtdHOS") === undefined) {
      setError(
        "mtdHOS",
        {
          message: "This field is required !",
        },
        {
          shouldFocus: true,
        }
      );
    }
    if (
      watch("isPermissionOfMTDTL") === "Yes" &&
      watch("mtdTL") === undefined
    ) {
      setError(
        "mtdTL",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
      flagCountForHandlingError++;
    }
    if (
      watch("isPermissionOfPRDTL") === "Yes" &&
      watch("prdTL") === undefined
    ) {
      setError(
        "prdTL",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
      flagCountForHandlingError++;
    }
    // console.log("fhgtghth", watch("attachedFileByAssignedUser").length === 0);
    if (watch("attachedFileByAssignedUser").length === 0) {
      setError(
        "attachedFileByAssignedUser",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
      flagCountForHandlingError++;
    }
    // if (watch("mtdHOS") === "") {
    //   setError(
    //     "mtdHOS",
    //     {
    //       message: "This field is required !",
    //     },
    //     { shouldFocus: true }
    //   );
    //   flagCountForHandlingError++;
    // }
    if (
      cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
        ?.partSuggestionByMTDTL &&
      parts.length === 0
    ) {
      setError(
        "partList",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
      flagCountForHandlingError++;
    }
    if (actions?.length === 0) {
      setError(
        "actionValidation",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
      flagCountForHandlingError++;
      // console.log(flagCountForHandlingError);
    }
    if (workDetails?.length === 0) {
      setError(
        "workDetailsValidation",
        {
          message: "This field is required !",
        },
        { shouldFocus: true }
      );
      flagCountForHandlingError++;
    }
    // console.log("flag ", flagCountForHandlingError);
    return flagCountForHandlingError;
  };
  const upadteReqSheet = async (requestSheetDataOfCM) => {
    console.log("This is reqsheet", requestSheetDataOfCM);
    // let checkWhetherAnyErrorOccurredOrNot = await handleCustomErrors();
    // if (checkWhetherAnyErrorOccurredOrNot > 0) {
    //   return;
    // }
    requestSheetDataOfCM.changedParts = parts;
    requestSheetDataOfCM.workDetails = workDetails;
    requestSheetDataOfCM.actionAndCounterMeasureStep = actions;
    if (context?.user_type === "Operator") {
      requestSheetDataOfCM.requestSheetStatusOfCM = "Fill Sheet";
    }
    try {
      const formData = new FormData();
      const { ...otherFields } = requestSheetDataOfCM;
      for (
        let i = 0;
        i < requestSheetDataOfCM?.attachedFileByAssignedUser?.length;
        i++
      ) {
        formData.append(
          "attachedFileByAssignedUser",
          requestSheetDataOfCM?.attachedFileByAssignedUser[i]
        );
      }
      let assignApprovalListOfHOS = {};
      let assignApprovalListOfTL = {};
      let assignApprovalListOfPRDTL = {};
      if (requestSheetDataOfCM?.mtdHOS) {
        assignApprovalListOfHOS = ApprovalAssignFOrHOS(
          requestSheetDataOfCM.mtdHOS
        );
        // console.log("Approval list for HOS:", assignApprovalListOfHOS);
      }

      if (requestSheetDataOfCM?.mtdTL) {
        assignApprovalListOfTL = ApprovalAssignFOrTL(
          requestSheetDataOfCM.mtdTL
        );
        // console.log("Approval list for TL:", assignApprovalListOfTL);
      }

      if (requestSheetDataOfCM?.prdTL) {
        assignApprovalListOfPRDTL = ApprovalAssignFOrPRDTL(
          requestSheetDataOfCM.prdTL
        );
        // console.log("Approval list for PRD TL:", assignApprovalListOfPRDTL);
      }
      formData.append(
        "otherData",
        JSON.stringify({
          ...otherFields,
          assignApprovalListOfTL,
          assignApprovalListOfHOS,
          assignApprovalListOfPRDTL,
        })
      );

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      };
      const response = await axios.patch(
        `/updateCmReqSheet/${cmSelectedSheetForView?._id}`,
        formData,
        config
      );
      if (response.status === 200) {
        setCmReqSheetView(false);
        SuccessToast("Request-sheet updated successfully");
      }
    } catch (error) {
      console.log(error);
      WarningToast("Request Sheet Updation Failed..!!");
    }
  };
  let flagCountForHandlingError = 0;

  const ApprovalAssignFOrTL = (mtdTL) => {
    if (mtdTL && MTDTLList) {
      const foundItem = MTDTLList.find((item) => item._id === mtdTL);
      if (foundItem) {
        return {
          id: foundItem._id,
          name: foundItem.tm_name,
          email: foundItem.email,
        };
      }
    }
    return null;
  };

  const ApprovalAssignFOrHOS = (mtdHOS) => {
    if (mtdHOS && MTDHOSList) {
      const foundItem = MTDHOSList.find((item) => item._id === mtdHOS);
      if (foundItem) {
        return {
          id: foundItem._id,
          name: foundItem.tm_name,
          email: foundItem.email,
        };
      }
    }
    return null;
  };
  const ApprovalAssignFOrPRDTL = (prdTL) => {
    if (prdTL && PRDTLList) {
      const foundItem = PRDTLList.find((item) => item._id === prdTL);
      if (foundItem) {
        return {
          id: foundItem._id,
          name: foundItem.tm_name,
          email: foundItem.email,
        };
      }
    }
    return null;
  };

  const onSubmit = async (requestSheetDataOfCM) => {
    let checkWhetherAnyErrorOccurredOrNot = await handleCustomErrors();
    if (checkWhetherAnyErrorOccurredOrNot > 0) {
      return;
    }
    requestSheetDataOfCM.changedParts = parts;
    requestSheetDataOfCM.workDetails = workDetails;
    requestSheetDataOfCM.actionAndCounterMeasureStep = actions;
    try {
      const formData = new FormData();
      const { ...otherFields } = requestSheetDataOfCM;
      for (
        let i = 0;
        i < requestSheetDataOfCM?.attachedFileByAssignedUser?.length;
        i++
      ) {
        formData.append(
          "attachedFileByAssignedUser",
          requestSheetDataOfCM?.attachedFileByAssignedUser[i]
        );
      }
      // console.log(otherFields)
      let assignApprovalListOfHOS = {};
      let assignApprovalListOfTL = {};
      let assignApprovalListOfPRDTL = {};
      if (requestSheetDataOfCM?.mtdHOS) {
        assignApprovalListOfHOS = ApprovalAssignFOrHOS(
          requestSheetDataOfCM.mtdHOS
        );
        // console.log("Approval list for HOS:", assignApprovalListOfHOS);
      }

      if (requestSheetDataOfCM?.mtdTL) {
        assignApprovalListOfTL = ApprovalAssignFOrTL(
          requestSheetDataOfCM.mtdTL
        );
        // console.log("Approval list for TL:", assignApprovalListOfTL);
      }

      if (requestSheetDataOfCM?.prdTL) {
        assignApprovalListOfPRDTL = ApprovalAssignFOrPRDTL(
          requestSheetDataOfCM.prdTL
        );
        // console.log("Approval list for PRD TL:", assignApprovalListOfPRDTL);
      }
      formData.append(
        "otherData",
        JSON.stringify({
          ...otherFields,
          assignApprovalListOfTL,
          assignApprovalListOfHOS,
          assignApprovalListOfPRDTL,
          // assignApprovalListOfTL: {
          //   id: MTDTLList?.[requestSheetDataOfCM?.mtdTL]?._id,
          //   name: MTDTLList?.[requestSheetDataOfCM?.mtdTL]?.tm_name,
          //   email: MTDTLList?.[requestSheetDataOfCM?.mtdTL]?.email,
          // },
          // assignApprovalListOfHOS: {
          //   id: MTDHOSList?.[requestSheetDataOfCM?.mtdHOS]?._id,
          //   name: MTDHOSList?.[requestSheetDataOfCM?.mtdHOS]?.tm_name,
          //   email: MTDHOSList?.[requestSheetDataOfCM?.mtdHOS]?.email,
          // },
        })
      );

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await axios.patch(
        `/sendApprovalForRequestSheetOfCM/${cmSelectedSheetForView?._id}/${cmSelectedSheetForView?.machineNo}`,
        formData,
        config
      );
      if (response.status === 201) {
        SuccessToast("Approval Send Successfully");
        setCmReqSheetView(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(upadteReqSheet)}>
        <Row className="m-0 border d-flex align-items-center p-2">
          <Col lg={6} sm={12}>
            <Row className="">
              <PartList
                parts={parts}
                setParts={setParts}
                isEditable={isEditable}
                clearErrors={clearErrors}
              />
              <input
                {...register("partList")}
                className="visually-hidden"
              ></input>
              {errors?.["partList"] && (
                <p className="text-error">{errors?.["partList"]?.message}</p>
              )}
            </Row>
          </Col>
          <Col lg={6} sm={12}>
            <Row className="">
              <ActionList
                actions={actions}
                setActions={setActions}
                clearErrors={clearErrors}
                isEditable={isEditable}
              />
              <input
                {...register("actionValidation")}
                className="visually-hidden"
              ></input>
              {errors?.["actionValidation"] && (
                <p className="text-error">
                  {errors?.["actionValidation"]?.message}
                </p>
              )}
            </Row>
          </Col>
          <Col sm={12} className="mt-3">
            <Row className="">
              <WorkDetails
                workDetails={workDetails}
                setWorkDetails={setWorkDetails}
                clearErrors={clearErrors}
                assigned_users={cmSelectedSheetForView?.assigned_users}
                isEditable={isEditable}
              />
              <input
                {...register("workDetailsValidation", {
                  // required: "This field is required",
                })}
                className="visually-hidden"
              ></input>
              {errors?.["workDetailsValidation"] && (
                <p className="text-error">
                  {errors?.["workDetailsValidation"]?.message}
                </p>
              )}
            </Row>
          </Col>
          <Col lg={5}>
            <small className="mb-0 pt-1">
              <b>Dummy 1: </b>
            </small>
          </Col>
          <Col lg={7}>
            <div className="d-block align-items-center">
              {" "}
              <input
                type="file"
                id="id"
                className="m-1 mb-2"
                disabled={!isEditable}
                style={{ width: "350px" }}
                {...register("attachedFileByAssignedUser")}
              />
            </div>
            {errors?.["attachedFileByAssignedUser"] && (
              <p className="text-error">
                {errors?.["attachedFileByAssignedUser"]?.message}
              </p>
            )}
          </Col>
        </Row>
        {context?.user_type === "Operator" && (
          <Row className="m-0 d-flex border align-items-start p-2">
            <Col lg={6} style={{ paddingRight: "0px" }}>
              <Row className="row m-0 border">
                <Col lg={4} className="m-0  border center p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>MTD TL/HOSS Permission</b>&nbsp;&nbsp;&nbsp;
                  </small>
                  <Form>
                    {["radio"].map((type) => (
                      <div key={`inline-${type}`} className="d-flex gap-4">
                        <Form.Check
                          flex
                          label="Yes"
                          name="group1"
                          type={type}
                          disabled={!isEditable}
                          id={`inline-${type}-1`}
                          value="Yes"
                          {...register("isPermissionOfMTDTL", {
                            required: "This field is required",
                          })}
                        />
                        <Form.Check
                          flex
                          label="No"
                          name="group1"
                          disabled={!isEditable}
                          type={type}
                          id={`inline-${type}-2`}
                          value="No"
                          {...register("isPermissionOfMTDTL", {
                            required: "This field is required",
                          })}
                        />
                      </div>
                    ))}
                  </Form>
                  {errors?.isPermissionOfMTDTL && (
                    <p className="text-error">
                      {errors?.isPermissionOfMTDTL?.message}
                    </p>
                  )}
                  <br />
                </Col>
                <Col lg={8}>
                  {watch("isPermissionOfMTDTL") === "Yes" && (
                    <>
                      <Col className="pt-2 d-flex">
                        <small
                          className="mb-0 pt-1 "
                          style={{
                            fontSize: "15px",
                            width: "fit-content",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <b>Select MTD TL/HOSS: </b>
                        </small>
                        &nbsp;&nbsp;
                        <Controller
                          control={control}
                          name="mtdTL"
                          // rules={{
                          //   required: "This field is required",
                          // }}
                          render={({ field: { onChange, onBlur, value } }) => (
                            <select
                              // className="form-control"
                              // {...register("mtdHOS")}
                              size="small"
                              label="Select MTD TL/HOSS"
                              value={value}
                              disabled={!isEditable}
                              onChange={(e) => {
                                onChange(e);
                                clearErrors("mtdHOS");
                              }}
                              onBlur={onBlur}
                            >
                              <option value="">Select MTD TL/HOSS</option>
                              {MTDTLList.map((value) => (
                                <option value={value._id}>
                                  {value?.tm_name}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        {errors?.["mtdTL"] && (
                          <p className="text-error m-0 p-0">
                            {errors?.["mtdTL"]?.message}
                          </p>
                        )}
                      </Col>
                      <br />
                    </>
                  )}
                  <Col className="pt-2 d-flex mb-2">
                    <small
                      className="mb-0 pt-1"
                      style={{
                        fontSize: "15px",
                        width: "fit-content",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <b>Select MTD HOS: </b>
                    </small>
                    &nbsp;&nbsp;
                    <Controller
                      control={control}
                      name="mtdHOS"
                      // disabled={true}
                      // rules={{
                      //   required: "This field is required",
                      // }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <select
                          // className="form-control"
                          // {...register("mtdHOS")}
                          disabled={!isEditable}
                          size="small"
                          label="Select MTD HOS"
                          value={value}
                          onChange={(e) => {
                            onChange(e);
                            clearErrors("mtdHOS");
                          }}
                          onBlur={onBlur}
                        >
                          <option value="">Select MTD HOS</option>
                          {MTDHOSList.map((value) => (
                            <option value={value._id}>{value?.tm_name}</option>
                          ))}
                        </select>
                      )}
                    />
                    &nbsp;&nbsp;
                  </Col>
                  {errors?.["mtdHOS"] && (
                    <p className="text-error">{errors?.["mtdHOS"]?.message}</p>
                  )}
                </Col>
              </Row>
            </Col>
            <Col lg={6} style={{ paddingRight: "0px" }}>
              <Row className="row m-0 border">
                <Col lg={3} md={12} className="m-0  border center p-2">
                  <small
                    className="mb-0 d-flex align-items-center justify-content-start"
                    style={{
                      width: "fit-content",
                    }}
                  >
                    <b>PRD TL Permission</b>&nbsp;&nbsp;&nbsp;
                  </small>
                  <Form>
                    {["radio"].map((type) => (
                      <div key={`inline-${type}`} className="d-flex gap-4">
                        <Form.Check
                          flex
                          label="Yes"
                          name="group1"
                          type={type}
                          disabled={!isEditable}
                          id={`inline-${type}-1`}
                          value="Yes"
                          {...register("isPermissionOfPRDTL", {
                            required: "This field is required",
                          })}
                        />
                        <Form.Check
                          flex
                          label="No"
                          name="group1"
                          type={type}
                          disabled={!isEditable}
                          id={`inline-${type}-2`}
                          value="No"
                          {...register("isPermissionOfPRDTL", {
                            required: "This field is required",
                          })}
                        />
                      </div>
                    ))}
                  </Form>
                  {errors?.isPermissionOfPRDTL && (
                    <p className="text-error">
                      {errors?.isPermissionOfPRDTL?.message}
                    </p>
                  )}
                  <br />
                </Col>
                <Col lg={8} sm={12}>
                  {watch("isPermissionOfPRDTL") === "Yes" && (
                    <>
                      <Col lg={12} className="mt-2 d-flex">
                        <small
                          className="mb-0 pt-1 "
                          style={{
                            fontSize: "15px",
                            width: "fit-content",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <b>Select PRD TL: </b>
                        </small>
                        &nbsp;&nbsp;
                        <Controller
                          control={control}
                          name="prdTL"
                          render={({ field: { onChange, onBlur, value } }) => (
                            <select
                              size="small"
                              label="Select PRD TL"
                              value={value}
                              disabled={!isEditable}
                              onChange={onChange}
                              onBlur={onBlur}
                            >
                              <option value="">Select PRD TL </option>
                              {PRDTLList.map((value) => (
                                <option value={value._id}>
                                  {value?.tm_name}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </Col>
                    </>
                  )}
                  {errors?.["prdTL"] && (
                    <p className="text-error">{errors?.["prdTL"]?.message}</p>
                  )}
                </Col>
              </Row>
            </Col>
            {/* <Col className="m-0 d-flex border align-items-center p-2">
            <Col lg={3}>
              <small className="mb-0 d-flex align-items-center justify-content-start">
                <b>PRD TL Permission</b>&nbsp;&nbsp;&nbsp;
              </small>
            </Col>
            <Col lg={3}>
              <Form>
                {["radio"].map((type) => (
                  <div key={`inline-${type}`} className="d-flex gap-4">
                    <Form.Check
                      flex
                      label="Yes"
                      name="group1"
                      type={type}
                      disabled={!isEditable}
                      id={`inline-${type}-1`}
                      value="Yes"
                      {...register("isPermissionOfPRDTL", {
                        required: "This field is required",
                      })}
                    />
                    <Form.Check
                      flex
                      label="No"
                      name="group1"
                      type={type}
                      disabled={!isEditable}
                      id={`inline-${type}-2`}
                      value="No"
                      {...register("isPermissionOfPRDTL", {
                        required: "This field is required",
                      })}
                    />
                  </div>
                ))}
                {errors?.isPermissionOfPRDTL && (
                  <p className="text-error">
                    {errors?.isPermissionOfPRDTL?.message}
                  </p>
                )}
              </Form>
            </Col>
            {console.log("this is tlv ", watch("prdTL"))}
            {watch("isPermissionOfPRDTL") === "Yes" && (
              <>
                <Col lg={5} className="mt-2">
                  <p className="mb-0 pt-1 " style={{ fontSize: "15px" }}>
                    <b>Select PRD TL: </b>
                  </p>
                </Col>
                <Col md={3} className="mt-2">
                  <Controller
                    control={control}
                    name="prdTL"
                    rules={{
                      required: true,
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <select
                        size="small"
                        label="Select PRD TL"
                        value={value}
                        disabled={!isEditable}
                        onChange={onChange}
                        onBlur={onBlur}
                      >
                        <option value="">Select PRD TL </option>
                        {PRDTLList.map((value) => (
                          <option value={value._id}>{value?.tm_name}</option>
                        ))}
                      </select>
                    )}
                  />
                  {errors?.["prdTL"] && (
                    <p className="text-error">{errors?.["prdTL"]?.message}</p>
                  )}
                </Col>
              </>
            )}
          </Col> */}
          </Row>
        )}
        {isEditable &&
          context?.user_type === "Operator" &&
          (cmSelectedSheetForView?.requestSheetStatusOfCM === "Generated" ||
            cmSelectedSheetForView?.requestSheetStatusOfCM === "Fill Sheet" ||
            cmSelectedSheetForView?.requestSheetStatusOfCM === "Rejected") && (
            // <Row className="m-0 border  d-flex align-items-center justify-content-center">
            //   <Col lg={12} className="d-flex justify-content-center">
            //     <Button type="submit" variant="contained" color="primary">
            //       Send For Approval
            //     </Button>
            //   </Col>
            // </Row>
            <Row className="m-0 border p-2 d-flex justify-content-between">
              <Col lg={6} md={6} sm={12}>
                <button
                  type="submit"
                  className="btn bg-success"
                  style={{ marginTop: "1rem" }}
                  onClick={handleSubmit(upadteReqSheet)}
                >
                  Save Changes
                </button>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <button
                  type="submit"
                  className="btn bg-warning"
                  style={{ marginTop: "1rem" }}
                  onClick={handleSubmit(onSubmit)}
                >
                  Send For Approval
                </button>
                {/* <Button type="submit" variant="contained" color="primary">
                  Send For Approval
                </Button> */}
              </Col>
            </Row>
          )}
        {isEditable &&
          ((context?.user_type === "TL/HOSS" &&
            cmSelectedSheetForView?.requestSheetStatusOfCM ===
              "Under MTD TL/HOSS Approval") ||
            (context?.user_type === "Section-Admin" &&
              cmSelectedSheetForView?.requestSheetStatusOfCM ===
                "Under MTD HOS Approval") ||
            (context?.tm_department === "PRD" &&
              cmSelectedSheetForView?.requestSheetStatusOfCM ===
                "Under PRD TL Approval")) && (
            // <Row className="m-0 border  d-flex align-items-center justify-content-center">
            //   <Col lg={12} className="d-flex justify-content-center">
            //     <Button type="submit" variant="contained" color="primary">
            //       Send For Approval
            //     </Button>
            //   </Col>
            // </Row>
            <Row className="m-0 border p-2 d-flex justify-content-between">
              <Col lg={6} md={6} sm={12}>
                <button
                  type="submit"
                  className="btn bg-success"
                  style={{ marginTop: "1rem" }}
                  onClick={handleSubmit(upadteReqSheet)}
                >
                  Save Changes
                </button>
              </Col>
            </Row>
          )}
      </form>
    </>
  );
};

export default ExistinngMachineReqSheetForOperator;
