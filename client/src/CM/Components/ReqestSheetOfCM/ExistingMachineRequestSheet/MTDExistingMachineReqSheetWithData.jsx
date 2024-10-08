import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { Col, Container, Form, Row, Table } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import RoutingContext from "../../../../context/routing/RoutingContext";
import PartList from "../../../../BM/Tabs/SubComponents/PartList";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
} from "@mui/material";
import Multiselect from "multiselect-react-dropdown";
import {
  CATEGORIES_OF_CM,
  FREQUENCY_OF_CM,
} from "../../../GlobalDataAccess/GlobalData";
import axios from "axios";
import ExistinngMachineReqSheetForOperator from "./ExistinngMachineReqSheetForOperator";
import { SuccessToast } from "../../../../BM/Component/ShowTostify";

const MTDExistingMachineReqSheetWithData = ({
  cmSelectedSheetForView,
  setCmReqSheetView,
  isEditable = false,
}) => {
  // console.log("from mtd comp", cmSelectedSheetForView);
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
      plannedDateAndTimeOfCM: moment(
        cmSelectedSheetForView?.plannedDateAndTimeOfCM
      )
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DDTHH:mm"),
      sheetIssuedDateAndTimeOfCM: moment(
        cmSelectedSheetForView?.sheetIssuedDateAndTimeOfCM
      )
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DDTHH:mm"),
      maintenanceType: "CM",
      cmBasicDataFilledByMTD_TL:
        cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL,

      assignUserForCM: cmSelectedSheetForView?.assigned_users,
      // "cmBasicDataFilledByMTD_TL.frequencyType":
      //   cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL?.frequencyType,
      // "cmBasicDataFilledByMTD_TL.categories":
      //   cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL?.categories,
      // "cmBasicDataFilledByMTD_TL.targetDateOfCM": moment(new Date()).format(
      //   "YYYY-MM-DDTHH:mm"
      // ),
    },
  });
  const [supportingTMList, setSupportingTMList] = useState([]);
  const [customCategory, setCustomCategory] = useState("");
  const [parts, setParts] = useState([]);

  const { machine_code, selectedYear } = useParams();
  const getMachineDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineDetailsForRequestSheetOfCM/?machine_code=${machine_code}&&current_year=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (res.status === 404) {
        navigate("/", { replace: true });
      } else {
        const { machine, TLHOSS_and_TM_user_list } = await res.json();
        setSupportingTMList(TLHOSS_and_TM_user_list);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getMachineDetails();
    setParts(cmSelectedSheetForView?.changedParts);
  }, []);
  const handleCategoryChange = (value) => {
    setValue("cmBasicDataFilledByMTD_TL.categories", value, {
      shouldDirty: true,
    });
    clearErrors("cmBasicDataFilledByMTD_TL.categories");
    if (value !== "Others") {
      setCustomCategory("");
    }
  };

  const handleCustomCategoryChange = (e) => {
    const value = e.target.value;
    setCustomCategory(value);
    if (value) {
      setValue("cmBasicDataFilledByMTD_TL.categories", value, {
        shouldDirty: true,
      });
    } else {
      setValue("cmBasicDataFilledByMTD_TL.categories", "Others", {
        shouldDirty: true,
      });
    }
    clearErrors("cmBasicDataFilledByMTD_TL.categories");
  };
  const handleCustomErrors = () => {
    let flagCountForHandlingError = 0;
    if (!watch("approvalOfRequestSheet")) {
      setError("approvalOfRequestSheet", {
        message: "Please select approval value (Yes/No)",
      });
      flagCountForHandlingError++;
      // console.log(flagCountForHandlingError);
    }

    if (
      watch("approvalOfRequestSheet") === "No" &&
      !watch("rejectedRemarksOfRequestSheet")
    ) {
      setError("rejectedRemarksOfRequestSheet", {
        message: "Please fill rejected remarks",
      });
      flagCountForHandlingError++;
      // console.log(flagCountForHandlingError);
    }
    return flagCountForHandlingError;
  };
  const approveRequestSheetFromHigherAuthority = async (
    requestSheetDataOfCM
  ) => {
    try {
      let checkWhetherAnyErrorOccurredOrNot = await handleCustomErrors();
      if (checkWhetherAnyErrorOccurredOrNot > 0) {
        console.log("error");
        return;
      } else {
        const response = await axios.patch(
          `/approvalOfMTDTL/${cmSelectedSheetForView?._id}`,
          {
            approvalOfRequestSheet: watch("approvalOfRequestSheet"),
            rejectedRemarksOfRequestSheet: watch(
              "rejectedRemarksOfRequestSheet"
            ),
            cmSelectedSheetForView,
          }
        );
        if (response.status === 200) {
          // console.log(response.data);
          SuccessToast(response.data.message);
          setCmReqSheetView(false);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const selectedCategory = watch("cmBasicDataFilledByMTD_TL.categories");

  const updateRequestOfCM = async (requestSheetDataOfCM) => {
    requestSheetDataOfCM.changedParts = parts;

    try {
      // console.log(requestSheetDataOfCM);
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
      // console.log(otherFields)

      formData.append("otherData", JSON.stringify(otherFields));

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await axios.patch(
        `/updateCmReqSheet/${cmSelectedSheetForView?._id}`,
        formData,
        config
      );
      if (response.status === 200) {
        SuccessToast("Request-sheet updated successfully");
        setCmReqSheetView(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const context = useContext(RoutingContext);
  return (
    <div>
      <form onSubmit={handleSubmit(updateRequestOfCM)}>
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
                          <b>PLANNED DATE</b>
                        </small>
                        <div className="d-flex align-items-center justify-content-center mt-1 mb-1 border-top">
                          <div className="text-center">
                            <p className="mb-0">
                              <b>DATE & TIME: </b>
                              <br />
                              <input
                                type="datetime-local"
                                disabled={!isEditable}
                                {...register("plannedDateAndTimeOfCM", {
                                  required: "RequestSheet date is required",
                                  onChange: (event) =>
                                    setValue(
                                      "plannedDateAndTimeOfCM",
                                      event.target.value
                                    ),
                                })}
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
                                type="datetime-local"
                                {...register(
                                  "sheetIssuedDateAndTimeOfCM"
                                  //  {
                                  //   required: "Sheet Issued date is required",
                                  // }
                                )}
                                disabled
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
                      <small>{`${cmSelectedSheetForView?.cell}/${cmSelectedSheetForView?.line}`}</small>
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
                        disabled={!isEditable}
                        // value={
                        //   cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
                        //     ?.activityOfCM
                        // }
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
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>Frequency: </b> &nbsp;&nbsp;
                    </p>
                  </Col>
                  <Col lg={9}>
                    {isEditable === false ? (
                      <div className="d-block align-items-center">
                        {" "}
                        <input
                          type="text"
                          id="cmBasicDataFilledByMTD_TL.activityOfCM"
                          className="m-1 mb-2"
                          disabled={!isEditable}
                          value={
                            cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
                              ?.frequencyType
                          }
                          style={{ width: "350px" }}
                        />
                      </div>
                    ) : (
                      FREQUENCY_OF_CM?.map((value, idx) => (
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
                      ))
                    )}

                    {/* ==============This should be set from default values of react hook forms=========================== */}

                    {/* Error for frequency type */}
                    {errors?.cmBasicDataFilledByMTD_TL?.frequencyType && (
                      <p className="text-error">
                        {
                          errors?.cmBasicDataFilledByMTD_TL?.frequencyType
                            ?.message
                        }
                      </p>
                    )}
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
                  <Col lg={3}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>Category:</b>
                    </p>
                  </Col>
                  <Col lg={9}>
                    {isEditable === false ? (
                      <div className="d-block align-items-center">
                        {" "}
                        <input
                          type="text"
                          id="cmBasicDataFilledByMTD_TL.activityOfCM"
                          className="m-1 mb-2"
                          disabled={!isEditable}
                          value={
                            cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
                              ?.categories
                          }
                          style={{ width: "350px" }}
                        />
                      </div>
                    ) : (
                      CATEGORIES_OF_CM.map((value, idx) => (
                        <React.Fragment key={idx}>
                          <Form.Check
                            flex
                            label={value}
                            type="radio"
                            value={value}
                            name={`categories`}
                            className="col-auto"
                            checked={
                              selectedCategory === value ||
                              (value === "Others" && customCategory)
                            }
                            {...register(
                              "cmBasicDataFilledByMTD_TL.categories",
                              {
                                validate: (value) => {
                                  if (
                                    watch("actionTemporaryOrNot") === "Yes" &&
                                    value === ""
                                  ) {
                                    return "Category is required";
                                  }
                                },
                              }
                            )}
                            onChange={() => handleCategoryChange(value)}
                          />
                        </React.Fragment>
                      ))
                    )}
                    {errors?.cmBasicDataFilledByMTD_TL?.categories && (
                      <p className="text-error">
                        {errors?.cmBasicDataFilledByMTD_TL?.categories?.message}
                      </p>
                    )}
                    <Row>
                      <Col lg={3}>
                        {(selectedCategory === "Others" || customCategory) && (
                          <Row className="m-0">
                            <Col
                              lg={12}
                              className="d-flex justify-content-start"
                            >
                              <input
                                type="text"
                                size={20}
                                placeholder="Add Category"
                                value={customCategory}
                                onChange={handleCustomCategoryChange}
                              />
                            </Col>
                          </Row>
                        )}
                      </Col>
                    </Row>
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
                        type="datetime-local"
                        className="m-1 mb-2"
                        name="cmBasicDataFilledByMTD_TL.targetDateOfCM"
                        disabled={!isEditable}
                        style={{
                          fontSize: "15px",
                        }}
                        value={moment(
                          cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
                            ?.targetDateOfCM
                        )
                          .tz("Asia/Kolkata")
                          .format("YYYY-MM-DDTHH:mm")}
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
                        // style={{ width: "350px" }}
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
                    </small>
                    {isEditable === false ? (
                      cmSelectedSheetForView?.assigned_users?.map((item) => {
                        return `${item.tm_name},`;
                      })
                    ) : (
                      <Controller
                        name="assignUserForCM"
                        control={control}
                        rules={{ required: "Please select the assign user" }}
                        render={({ field }) => (
                          <>
                            <Multiselect
                              {...field}
                              displayValue="tm_name"
                              selectedValues={
                                cmSelectedSheetForView?.assigned_users
                              }
                              // className="col-5"
                              options={supportingTMList} // Options to display in the dropdown
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
                    )}
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
            {isEditable && <PartList parts={parts} setParts={setParts} />}
            {cmSelectedSheetForView?.changedParts?.length > 0 &&
              !isEditable && (
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

            {isEditable && (
              <tr>
                <td>
                  <button
                    type="submit"
                    className="btn bg-success"
                    onClick={() => {
                      updateRequestOfCM(cmSelectedSheetForView);
                    }}
                  >
                    Update Request-Sheet
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </form>
      <Box className="border">
        {isEditable && (
          <ExistinngMachineReqSheetForOperator
            cmSelectedSheetForView={cmSelectedSheetForView}
          />
        )}
        <>
          {isEditable && (
            <Row className="m-1 d-flex justify-content-start">
              {context?.tm_department === "MTD" && (
                <Col className="col-lg-6 col-md-6 m-1 p-0">
                  <button
                    type="submit"
                    className="btn bg-succ"
                    style={{ marginTop: "1rem" }}
                    //   onClick={handleSubmit(newRequestSheetRegistration)}
                  >
                    Save Changes
                  </button>
                </Col>
              )}

              <Col className="col-lg-5 col-md-4 m-1 p-2 bg-lightyellow rounded">
                Kindly approve request-sheet.{" "}
                <div className="d-flex">
                  <Form.Check
                    flex
                    label="Yes"
                    name="approvalOfRequestSheet"
                    type="radio"
                    value="Yes"
                    id="approvalOfRequestSheet"
                    {...register("approvalOfRequestSheet", {
                      // required: "This field is required",
                    })}
                    // onChange={handleQuality}
                  />{" "}
                  &nbsp;
                  <Form.Check
                    flex
                    label="No"
                    name="approvalOfRequestSheet"
                    type="radio"
                    value="No"
                    id="approvalOfRequestSheet"
                    {...register("approvalOfRequestSheet", {
                      // required: "This field is required",
                    })}
                    // onChange={handleQuality}
                  />
                </div>
                {errors?.["approvalOfRequestSheet"] && (
                  <p className="text-error">
                    {errors?.["approvalOfRequestSheet"]?.message}
                  </p>
                )}
                {watch("approvalOfRequestSheet") === "No" ? (
                  <>
                    <input
                      type="text"
                      name="rejectedRemarksOfRequestSheet"
                      placeholder="Enter rejected remarks"
                      className="p-1 m-1"
                      {...register("rejectedRemarksOfRequestSheet", {
                        // required: "Please fill this field",
                      })}
                    />
                    {errors?.["rejectedRemarksOfRequestSheet"] && (
                      <p className="text-error">
                        {errors?.["rejectedRemarksOfRequestSheet"]?.message}
                      </p>
                    )}
                  </>
                ) : (
                  ""
                )}
                &nbsp;
                <button
                  type="submit"
                  className="btn bg-warning"
                  onClick={() => {
                    approveRequestSheetFromHigherAuthority();
                    // handleSubmit(approveRequestSheetFromHigherAuthority);
                    getMachineDetails();
                  }}
                >
                  Submit
                </button>
              </Col>
            </Row>
          )}
        </>
      </Box>
    </div>
  );
};

export default MTDExistingMachineReqSheetWithData;
