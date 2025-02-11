import React, { useState, useEffect, useContext } from "react";
import { Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import RoutingContext from "../../../../context/routing/RoutingContext";
import { FormControl, FormLabel, Button } from "@mui/material";
import {
  CATEGORIES_OF_CM,
  FREQUENCY_OF_CM,
} from "../../../GlobalDataAccess/GlobalData";
import axios from "axios";

import { SuccessToast } from "../../../../BM/Component/ShowTostify";

import SendForApprovalRadioButtons from "../RSComponents/SendForApprovalRadioButtons";
import MiddlewareForTablesOfMTD from "./MiddlewareForTablesOfMTD";
import UserApprovalSelectFields from "../RSComponents/UserApprovalSelectFields/UserApprovalSelectFields";
import ApproveOrRejectComponent from "../RSComponents/ApproveOrRejectComponent";
// import SupportingTMInputField from "../RSComponents/SupportingTMInputField";

const ExistingMachineReqSheetView = ({
  handlePopupStatus,
  selectedYear,
  selectedRowRequestSheetId,
  isEditable = false,
  cmReqSheetView,
  selectedQuarter = "",
}) => {
  const {
    watch,
    register,

    handleSubmit,
    formState: { errors, dirtyFields },

    clearErrors,
    setValue,
    setError,
  } = useForm({
    defaultValues: async () => {
      try {
        const response = await axios.get(
          `/getReqSheetDataByID/${selectedRowRequestSheetId}?selectedYear=${selectedYear}&&selectedQuarter=${selectedQuarter}`
        );
        if (response.status === 201) {
          const { requestSheet } = response.data;
          requestSheet["wantToSendForApproval"] = "No";
          return requestSheet;
        }
      } catch (error) {
        console.log(error);
      }
    },
  });

  const handleDirtyFields = (requestSheetDataOfCM) => {
    let newVal = {};

    const objValueMappingFunction = (dirtyFields, key, allValues) => {
      return Object.fromEntries(
        Object.keys(dirtyFields[key])
          .filter((item) => dirtyFields[key][item])
          .map((item) =>
            typeof allValues[key][item] === "object"
              ? [key, { ...allValues[key] }]
              : [[`${key}.${item}`], allValues[key][item]]
          )
      );
    };

    Object.keys(dirtyFields)?.map((key) => {
      if (
        [
          "changedParts",
          "actionAndCounterMeasureStep",
          "workDetails",
        ]?.includes(key)
      ) {
        newVal[key] = requestSheetDataOfCM[key];
      } else if (typeof requestSheetDataOfCM[key] === "object") {
        newVal = {
          ...newVal,
          ...objValueMappingFunction(dirtyFields, key, requestSheetDataOfCM),
        };
      } else {
        newVal[key] = requestSheetDataOfCM[key];
      }
    });

    return newVal;
  };

  const generateError = (field, key, message) =>
    (!field || field?.length === 0) &&
    setError(key, {
      type: "required",
      message,
    });

  const handleCustomError = ({
    changedParts,
    actionAndCounterMeasureStep,
    workDetails,
  }) => {
    generateError(changedParts, "changedParts", "Part list is required");
    generateError(
      actionAndCounterMeasureStep,
      "actionAndCounterMeasureStep",
      "Action and counter measure step is required"
    );
    generateError(workDetails, "workDetails", "Work details is required");
  };

  const updateRequestOfCM = async (requestSheetDataOfCM) => {
    try {
      if (requestSheetDataOfCM?.wantToSendForApproval === "Yes") {
        handleCustomError(requestSheetDataOfCM);
        if (Object.keys(errors)?.length > 0) {
          return;
        }
      }

      const formData = new FormData();
      const { ...otherFields } = handleDirtyFields(requestSheetDataOfCM);

      if (otherFields?.wantToSendForApproval === "Yes") {
        otherFields["requestSheetStatusOfCM"] = "Under MTD HOS Approval";
        if (requestSheetDataOfCM?.isPermissionOfMTDTL === "Yes") {
          otherFields["requestSheetStatusOfCM"] = "Under MTD TL/HOSS Approval";
        }
      }

      otherFields.approvalObj_MTD_HOS =
        requestSheetDataOfCM?.approvalObj_MTD_HOS;

      if (otherFields?.isPermissionOfMTDTL) {
        otherFields.approvalObj_MTD_TL =
          requestSheetDataOfCM?.approvalObj_MTD_TL;
      }

      if (otherFields?.isPermissionOfPRDTL) {
        otherFields.approvalObj_PRD_TL =
          requestSheetDataOfCM?.approvalObj_PRD_TL;
      }

      for (
        let i = 0;
        i <
        requestSheetDataOfCM?.cmBasicDataFilledByMTD_TL?.attachedFilesByMTDUser
          ?.length;
        i++
      ) {
        formData.append(
          "attachedFilesByAssignedUser",
          requestSheetDataOfCM?.cmBasicDataFilledByMTD_TL
            ?.attachedFilesByMTDUser[i]
        );
      }

      formData.append("otherData", JSON.stringify(otherFields));

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await axios.patch(
        `/sendApprovalForRequestSheetOfCM/${watch("_id")}`,
        formData,
        config
      );
      if (response.status === 201) {
        handlePopupStatus();
        SuccessToast("Request-sheet updated successfully");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const context = useContext(RoutingContext);

  return (
    <Modal
      show={cmReqSheetView}
      fullscreen
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header>
        <Modal.Title id="contained-modal-title-vcenter">
          CM Request-Sheet
        </Modal.Title>
        <Button
          variant="secondary"
          onClick={handlePopupStatus}
          sx={{
            backgroundColor: "#B02A37",
            color: "#F2F2F2",
            "&:hover": {
              backgroundColor: "#B02A37",
              cursor: "pointer",
            },
          }}
        >
          Close
        </Button>
      </Modal.Header>
      <Modal.Body>
        <div>
          <form onSubmit={handleSubmit(updateRequestOfCM)}>
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
                        ></Col>

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
                    <br />
                    <small>{watch("maintenanceType")}</small>
                  </td>

                  <td className="mb-0 pb-0 border col-6 col-md-2">
                    <small>
                      {" "}
                      <b>PRIORITY CODE</b>
                    </small>
                    <br />
                    <small>{watch("priorityCode")}</small>
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
                            {watch("requestSheetNoOfCM")}
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
                                    {...register(
                                      "current_commonDataFilledByAssignUser.plannedDateAndTimeOfCM",
                                      {
                                        required:
                                          "RequestSheet date is required",
                                      }
                                    )}
                                  />
                                </p>
                              </div>{" "}
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
                                    {...register("sheetIssuedDateAndTimeOfCM")}
                                    disabled
                                  />
                                </p>
                              </div>
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
                          <small>{`${watch("cell")}/${watch("line")}`}</small>
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
                          <b>MACHINE NAME: </b> &nbsp;&nbsp;
                          {watch("machineName")}
                        </small>{" "}
                        &nbsp;&nbsp;
                      </Col>
                      <Col lg={4} md={6}>
                        <small className="mb-0">
                          <b>MACHINE NO.:</b>&nbsp;&nbsp;
                          {watch("machineNo")}
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
                      <Col lg={3}>
                        <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                          <b>Frequency: </b> &nbsp;&nbsp;
                        </p>
                      </Col>
                      <Col lg={9}>
                        {FREQUENCY_OF_CM?.map((value, idx) => (
                          <React.Fragment key={idx}>
                            <Form.Check
                              label={value?.frequencyType}
                              type="radio"
                              value={value?.frequencyType}
                              disabled={!isEditable}
                              name="cmBasicDataFilledByMTD_TL.frequencyType"
                              className="m-1 mb-2"
                              {...register(
                                "cmBasicDataFilledByMTD_TL.frequencyType",
                                {
                                  required: "Please select frequency type",
                                }
                              )}
                            />

                            <div key={idx}>
                              {/* Render frequency values only if the frequencyType is Scheduled */}
                              {watch(
                                "cmBasicDataFilledByMTD_TL.frequencyType"
                              ) === value?.frequencyType &&
                                value?.frequencyType === "Scheduled" && (
                                  <Col className="d-flex justify-content-center align-items-center">
                                    {value?.frequencyValue?.length > 0 &&
                                      value?.frequencyValue?.map(
                                        (type, idx1) => (
                                          <Col key={idx1}>
                                            <Form.Check
                                              label={type}
                                              value={type}
                                              type="radio"
                                              disabled={!isEditable}
                                              className="m-1 mb-2"
                                              {...register(
                                                "cmBasicDataFilledByMTD_TL.frequencyValue",
                                                {
                                                  required:
                                                    "Please select frequency type",
                                                }
                                              )}
                                            />
                                          </Col>
                                        )
                                      )}

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
                          </React.Fragment>
                        ))}

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
                      </Col>
                    </Row>

                    <Row className="m-0 border d-flex align-items-center">
                      <Col lg={3}>
                        <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                          <b>Category:</b>
                        </p>
                      </Col>
                      <Col lg={9}>
                        <div className="d-flex justify-content-between ">
                          {CATEGORIES_OF_CM.map((value, idx) => (
                            <React.Fragment key={idx}>
                              <Form.Check
                                idx={idx}
                                label={value}
                                type="radio"
                                value={value}
                                disabled={!isEditable}
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
                          <>
                            <input
                              type="text"
                              size={20}
                              className="m-1 mb-2"
                              disabled={!isEditable}
                              {...register(
                                "cmBasicDataFilledByMTD_TL.other_categories",
                                {
                                  required: "Other category is required",
                                }
                              )}
                            />
                            {errors?.cmBasicDataFilledByMTD_TL
                              ?.other_categories && (
                              <p className="text-error">
                                {
                                  errors?.cmBasicDataFilledByMTD_TL
                                    ?.other_categories?.message
                                }
                              </p>
                            )}
                          </>
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
                                disabled={!isEditable}
                                {...register(
                                  "cmBasicDataFilledByMTD_TL.inspectionItem",
                                  {
                                    required:
                                      watch(
                                        "cmBasicDataFilledByMTD_TL.inspectionItem"
                                      ) === ""
                                        ? "This field is required !"
                                        : false,
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
                                disabled={!isEditable}
                                {...register(
                                  "cmBasicDataFilledByMTD_TL.actionForLTPM",
                                  {
                                    required:
                                      watch(
                                        "cmBasicDataFilledByMTD_TL.actionForLTPM"
                                      ) === ""
                                        ? "This field is required !"
                                        : false,
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
                            {...register(
                              "cmBasicDataFilledByMTD_TL.targetDateOfCM",
                              {
                                required: "Please select target date",
                              }
                            )}
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
                    <Row className="m-0 border d-flex align-items-center">
                      <Col lg={3}>
                        <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                          <b>Part Suggestion: </b>
                        </p>
                      </Col>

                      <Col lg={9}>
                        <div>
                          {" "}
                          <input
                            id="partSuggestionByMTDTL"
                            type="text"
                            className="m-1 mb-2"
                            name="partSuggestionByMTDTL"
                            disabled={!isEditable}
                            style={{
                              fontSize: "15px",
                            }}
                            {...register(
                              "cmBasicDataFilledByMTD_TL.partSuggestionByMTDTL"
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
                  </td>

                  <td className="border p-2 col-lg-4 col-md-4 col-sm-12">
                    <Row className="m-0">
                      <Col className="border p-2">
                        <FormControl>
                          <FormLabel id="demo-radio-buttons-group-label">
                            <small>
                              <b>SHIFT: </b> &nbsp;&nbsp;
                              {watch("shiftOfCM")}
                            </small>
                          </FormLabel>
                        </FormControl>
                      </Col>
                    </Row>

                    <Row className="m-0">
                      <Col className="border p-2">
                        <small className="mb-0 d-flex align-items-center justify-content-start">
                          <b>QUALITY RELATED</b>&nbsp;&nbsp;&nbsp;
                          {watch("qualityRelated")}
                        </small>
                      </Col>
                    </Row>
                    <Row className="pt-0 mb-0 m-0">
                      <Col className="border p-2">
                        <small className="mb-0 d-flex align-items-center justify-content-start">
                          <b>ASSIGN TO:</b>&nbsp;&nbsp;
                        </small>
                        {watch(
                          "current_commonDataFilledByAssignUser.assignUserForCM"
                        )
                          ?.map((item) => {
                            return `${item.tm_name}`;
                          })
                          .join(", ")}
                        {/* {isEditable === false ? (
                          
                        ) : (
                          <SupportingTMInputField
                            control={control}
                            setValue={setValue}
                            trigger={trigger}
                            errors={errors}
                            watch={watch}
                            selectedYear={selectedYear}
                          />
                        )} */}
                      </Col>
                      <Col className="border p-2"></Col>
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
                              {...register(
                                "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser"
                              )}
                              // onChange={(e) => {
                              //   setValue(
                              //     "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser",
                              //     e.target.files,
                              //     {
                              //       shouldDirty: true,
                              //     }
                              //   );
                              //   clearErrors(
                              //     "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser"
                              //   );
                              // }}
                            />
                          </Form.Group>
                        </Col>
                      )}
                    </Row>
                  </td>
                </tr>
              </tbody>
            </Table>

            <TableMappingComponent
              setValue={setValue}
              watch={watch}
              isEditable={isEditable}
              errors={errors}
              clearErrors={clearErrors}
            />

            <UserApprovalSelectFields
              setValue={setValue}
              watch={watch}
              register={register}
              errors={errors}
              isEditable={
                ["Generated", "Fill Sheet", "Rejected"]?.includes(
                  watch(
                    "current_commonDataFilledByAssignUser.requestSheetStatusOfCM"
                  )
                ) && isEditable
              }
              isRequired={watch("wantToSendForApproval") === "Yes"}
            />

            {["Generated", "Fill Sheet", "Rejected"]?.includes(
              watch(
                "current_commonDataFilledByAssignUser.requestSheetStatusOfCM"
              )
            ) &&
              isEditable && <SendForApprovalRadioButtons register={register} />}

            {isEditable && (
              <Row className="m-0 border p-2 d-flex justify-content-between">
                <Col lg={6} md={6} sm={12}>
                  <button
                    type="submit"
                    className="btn bg-success"
                    style={{ marginTop: "1rem" }}
                  >
                    Submit
                  </button>
                </Col>
              </Row>
            )}

            {isEditable &&
              watch(
                "current_commonDataFilledByAssignUser.getDataForApprovalDashboard.Id"
              ) === context?._id && (
                <ApproveOrRejectComponent
                  handlePopupStatus={handlePopupStatus}
                  watch={watch}
                  register={register}
                  errors={errors}
                  isEditable={isEditable}
                />
              )}
          </form>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ExistingMachineReqSheetView;

const TableMappingComponent = ({
  watch,
  setValue,
  isEditable,
  errors,
  clearErrors,
}) => {
  const [supportingTMList, setSupportingTMList] = useState([]);

  const getMachineDetails = async () => {
    try {
      const res = await fetch(`/getSupportingTMDetailsForRequestSheetOfCM`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (res.status === 201) {
        const { TLHOSS_and_TM_user_list } = await res.json();
        setSupportingTMList(TLHOSS_and_TM_user_list);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, []);

  return (
    <>
      {watch("upto_currentYear_current_commonDataFilledByAssignUser")?.map(
        (year) =>
          year.quarterlyDataOfTheCM?.map((quarter) => (
            <MiddlewareForTablesOfMTD
              clearErrors={clearErrors}
              errors={errors}
              supportingTMList={supportingTMList}
              setValue={setValue}
              requestSheet_year={
                year?.preAggregationTimeStampOfRequestSheet?.requestSheet_year
              }
              isEditable={
                isEditable &&
                watch("currentFYYearAndQuarter.year") ===
                  year?.preAggregationTimeStampOfRequestSheet
                    ?.requestSheet_year &&
                watch("currentFYYearAndQuarter.quarter") ===
                  quarter?.requestSheet_quarter
              }
              requestSheet_quarter={quarter?.requestSheet_quarter}
              plannedDateAndTimeOfCM={quarter?.plannedDateAndTimeOfCM}
              partsData={quarter?.changedParts}
              workData={quarter?.workDetails}
              actionData={quarter?.actionAndCounterMeasureStep}
              totalTimeBasedOnWork={quarter?.totalTimeBasedOnWork}
            />
          ))
      )}
    </>
  );
};
