import React, { useState, useEffect, useContext } from "react";
import { Controller, useForm } from "react-hook-form";
import { Row, Col, Form, Container } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import moment from "moment-timezone";
import RoutingContext from "../../../../context/routing/RoutingContext";
import {
  SuccessToast,
  WarningToast,
} from "../../../../BM/Component/ShowTostify";
import {
  FREQUENCY_OF_CM,
  CATEGORIES_OF_CM,
} from "../../../GlobalDataAccess/GlobalData";
import Multiselect from "multiselect-react-dropdown";
import ShiftInputField from "../RSComponents/ShiftInputField";

const GeneratedExistingMachineRequestSheetByMTD = () => {
  const navigate = useNavigate();
  const context = useContext(RoutingContext);

  const { machine_code, selectedYear } = useParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    trigger,
    control,
    clearErrors,
  } = useForm({
    defaultValues: {
      cmBasicDataFilledByMTD_TL: {
        personForLTPM: "M",
        plannedDateAndTimeOfCM: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
      },
      sheetIssuedDateAndTimeOfCM: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
      maintenanceType: "CM",
      targetDateOfCM: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
    },
  });

  const [machineAndSupportingTMData, setMachineAndSupportingTMData] = useState({
    selectedMachineData: {},
    assignTMList: [],
  });

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
        setMachineAndSupportingTMData({
          selectedMachineData: machine,
          assignTMList: TLHOSS_and_TM_user_list,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, [machine_code]);

  const newRequestSheetRegistrationOfCM = async (requestSheetDataOfCM) => {
    try {
      const formData = new FormData();
      // delete requestSheetDataOfCM["cmBasicDataFilledByMTD_TL.targetDateOfCM"];
      const { ...otherFields } = requestSheetDataOfCM;

      for (
        let i = 0;
        i <
        requestSheetDataOfCM?.cmBasicDataFilledByMTD_TL?.attachedFilesByMTDUser
          ?.length;
        i++
      ) {
        formData.append(
          "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser",
          requestSheetDataOfCM?.cmBasicDataFilledByMTD_TL
            ?.attachedFilesByMTDUser?.[i]
        );
      }

      formData.append("otherData", JSON.stringify(otherFields));

      const res = await fetch(
        `/newRequestSheetRegistrationOfCM/?machineRef=${machineAndSupportingTMData?.selectedMachineData?._id}`,
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

  const handleBack = () => {
    navigate("/cm", { replace: true });
  };

  return (
    <>
      <div className="p-2">
        <div id="request-sheet-target" className="border border-dark">
          <form onSubmit={handleSubmit(newRequestSheetRegistrationOfCM)}>
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
                          <button
                            className="btn bg-button"
                            onClick={handleBack}
                          >
                            Back
                          </button>
                        </Col>

                        <Col className="d-flex align-items-center justify-content-center text-center">
                          <h4 className="m-0">
                            CM REQUEST SHEET (EXISTING MACHINE)
                          </h4>
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
                            <b>REQUEST SHEET ( To be filled by MTD TL/HoSS)</b>
                          </p>
                        </Col>
                      </Row>
                      <Row className="m-0">
                        <Col className="border">
                          <small className="text-left p-1 mb-2">
                            <b>REQUEST No.</b>{" "}
                            {machineAndSupportingTMData?.selectedMachineData
                              ?.line_names?.cell_names?.subSection_names
                              ?.section_names?.dashboardLevel === "Yes"
                              ? machineAndSupportingTMData?.selectedMachineData?.line_names?.cell_names?.subSection_names?.section_names?.section_name
                                  ?.trim()
                                  ?.substring(0, 2)
                                  ?.toUpperCase()
                              : machineAndSupportingTMData?.selectedMachineData?.line_names?.cell_names?.subSection_names?.subSection_name
                                  ?.trim()
                                  ?.substring(0, 2)
                                  ?.toUpperCase()}
                            -
                            {machineAndSupportingTMData?.selectedMachineData?.line_names?.line_name?.trim()}
                            -CM-
                            {moment().tz("Asia/Kolkata").month() + 1}-
                            {machineAndSupportingTMData?.selectedMachineData
                              ?.line_names?.requestSheetNoOfCM + 1 || 1}
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
                                    {...register(
                                      "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM",
                                      {
                                        required:
                                          "RequestSheet date is required",
                                        onChange: (event) =>
                                          setValue(
                                            "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM",
                                            event.target.value
                                          ),
                                      }
                                    )}
                                  />
                                  {errors?.[
                                    "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM"
                                  ] && (
                                    <p className="text-error">
                                      {
                                        errors?.[
                                          "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM"
                                        ]?.message
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
                                    {...register("sheetIssuedDateAndTimeOfCM")}
                                    disabled
                                  />
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
                            {
                              machineAndSupportingTMData?.selectedMachineData
                                ?.line_names?.cell_names?.cell_name
                            }
                            /
                            {
                              machineAndSupportingTMData?.selectedMachineData
                                ?.line_names?.line_name
                            }
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
                        {
                          machineAndSupportingTMData?.selectedMachineData
                            .machine_name
                        }
                      </Col>
                      <Col lg={4} md={6}>
                        <small className="mb-0">
                          <b>MACHINE NO.:</b>
                        </small>
                        &nbsp;&nbsp;
                        {
                          machineAndSupportingTMData?.selectedMachineData
                            .machine_code
                        }
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
                            {...register(
                              "cmBasicDataFilledByMTD_TL.activityOfCM",
                              {
                                required: "Please enter activity",
                              }
                            )}
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
                          <b>Category:</b>
                        </p>
                      </Col>
                      <Col lg={7}>
                        <div className="d-flex justify-content-between">
                          {CATEGORIES_OF_CM.map((value, idx) => (
                            <React.Fragment key={idx}>
                              <Form.Check
                                // flex
                                idx={idx}
                                label={value}
                                type="radio"
                                value={value}
                                name={`categories`}
                                className="col-auto"
                                {...register(
                                  "cmBasicDataFilledByMTD_TL.categories",
                                  {
                                    required: "Category is required",
                                  }
                                )}
                              />
                            </React.Fragment>
                          ))}
                        </div>
                        {errors?.cmBasicDataFilledByMTD_TL?.categories && (
                          <p className="text-error">
                            {
                              errors?.cmBasicDataFilledByMTD_TL?.categories
                                ?.message
                            }
                          </p>
                        )}
                        {watch("cmBasicDataFilledByMTD_TL.categories") ===
                          "Others" && (
                          <input
                            type="text"
                            size={20}
                            className="m-1 mb-2"
                            {...register(
                              "cmBasicDataFilledByMTD_TL.other_categories",
                              {
                                required: "Other category is required",
                              }
                            )}
                          />
                        )}
                        {errors?.cmBasicDataFilledByMTD_TL
                          ?.other_categories && (
                          <p className="text-error">
                            {
                              errors?.cmBasicDataFilledByMTD_TL
                                ?.other_categories?.message
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

                            {watch(
                              "cmBasicDataFilledByMTD_TL.frequencyType"
                            ) === value?.frequencyType &&
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
                                        <label
                                          htmlFor={`frequencyValue_${idx1}`}
                                        >
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

                    {watch("cmBasicDataFilledByMTD_TL.categories") ===
                      "LTPM" && (
                      <>
                        <Row className="m-0 border d-flex align-items-center">
                          <Col lg={5}>
                            <p
                              className="mb-0 pt-1"
                              style={{ fontSize: "12px" }}
                            >
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
                                {...register(
                                  "cmBasicDataFilledByMTD_TL.inspectionItem",
                                  {
                                    required: "This field is required !",
                                  }
                                )}
                              />
                            </div>
                            {errors?.cmBasicDataFilledByMTD_TL
                              ?.inspectionItem && (
                              <p className="text-error">
                                {
                                  errors?.cmBasicDataFilledByMTD_TL
                                    ?.inspectionItem?.message
                                }
                              </p>
                            )}
                          </Col>
                        </Row>
                        <Row className="m-0 border d-flex align-items-center">
                          <Col lg={5}>
                            <p
                              className="mb-0 pt-1"
                              style={{ fontSize: "12px" }}
                            >
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
                                {...register(
                                  "cmBasicDataFilledByMTD_TL.actionForLTPM",
                                  {
                                    required: "This field is required !",
                                  }
                                )}
                              />
                            </div>
                            {errors?.cmBasicDataFilledByMTD_TL
                              ?.actionForLTPM && (
                              <p className="text-error">
                                {
                                  errors?.cmBasicDataFilledByMTD_TL
                                    ?.actionForLTPM?.message
                                }
                              </p>
                            )}
                          </Col>
                        </Row>
                        <Row className="m-0 border d-flex align-items-center">
                          <Col lg={5}>
                            <p
                              className="mb-0 pt-1"
                              style={{ fontSize: "12px" }}
                            >
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
                                disabled={true}
                                {...register(
                                  "cmBasicDataFilledByMTD_TL.personForLTPM"
                                )}
                              />
                            </div>
                            {errors?.cmBasicDataFilledByMTD_TL
                              ?.personForLTPM && (
                              <p className="text-error">
                                {
                                  errors?.cmBasicDataFilledByMTD_TL
                                    ?.personForLTPM?.message
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
                            name="targetDateOfCM"
                            {...register("targetDateOfCM", {
                              required: "Please select target date",
                            })}
                            onInput={() => {
                              clearErrors("targetDateOfCM");
                            }}
                          />
                        </div>
                        {errors?.targetDateOfCM && (
                          <p className="text-error">
                            {errors?.targetDateOfCM?.message}
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
                              {...register(
                                "cmBasicDataFilledByMTD_TL.partSuggestionByMTDTL",

                                {
                                  required:
                                    watch("partRequiredByMTDTL") === "Yes"
                                      ? "Please enter part name"
                                      : false,
                                }
                              )}
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
                  </td>

                  <td className="border p-2 col-lg-4 col-md-4 col-sm-12">
                    <ShiftInputField
                      dateAndTime={watch(
                        "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM"
                      )}
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
                                options={
                                  machineAndSupportingTMData?.assignTMList
                                } // Options to display in the dropdown
                                onSelect={async (selectedList) => {
                                  setValue("assignUserForCM", selectedList);
                                  trigger("assignUserForCM");
                                }} // Function will trigger on select event
                                onRemove={async (selectedList) => {
                                  setValue("assignUserForCM", selectedList);
                                  trigger("assignUserForCM");
                                }} // Function will trigger on remove event
                                style={{
                                  multiselectContainer: {
                                    width: "14rem",
                                  },
                                }}
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
                          <Form.Group
                            controlId="formFileMultiple"
                            className="mb-3"
                          >
                            <Form.Control
                              type="file"
                              multiple
                              onChange={(e) => {
                                setValue(
                                  "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser",
                                  e.target.files,
                                  {
                                    shouldDirty: true,
                                  }
                                );
                                clearErrors(
                                  "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser"
                                );
                              }}
                            />
                          </Form.Group>
                        </Col>
                      )}
                    </Row>
                  </td>
                </tr>

                <tr>
                  <td>
                    <button type="submit" className="btn bg-success">
                      Submit Request-Sheet
                    </button>
                  </td>
                </tr>
              </tbody>
            </Table>
          </form>
        </div>
      </div>
    </>
  );
};

export default GeneratedExistingMachineRequestSheetByMTD;
