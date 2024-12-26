import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import RoutingContext from "../../../../context/routing/RoutingContext";
import { FormControl, FormLabel, Button } from "@mui/material";
import {
  CATEGORIES_OF_CM,
  FREQUENCY_OF_CM,
} from "../../../GlobalDataAccess/GlobalData";
import axios from "axios";
import ExistinngMachineReqSheetForOperator from "./ExistinngMachineReqSheetForOperator";
import { SuccessToast } from "../../../../BM/Component/ShowTostify";
import SupportingTMInputField from "../RSComponents/SupportingTMInputField";

const ExistingMachineReqSheetView = ({
  selectedYear,
  selectedRowRequestSheetId,
  setCmReqSheetView,
  // isEditable = false,
  CmReqSheetView,
}) => {
  let isEditable = true;
  const [cmSelectedSheetForView, setCmSelectedSheetForView] = useState();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    control,
    clearErrors,
    reset,
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
    },
  });
  const [customCategory, setCustomCategory] = useState("");
  const [parts, setParts] = useState([]);

  const getModalOpenForReqSheet = async () => {
    try {
      const response = await axios.get(
        `/getReqSheetDataByID/${selectedRowRequestSheetId}?selectedYear=${selectedYear}`
      );
      if (response.status === 201) {
        setCmSelectedSheetForView(response.data.requestSheet);
        reset(response.data.requestSheet);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getModalOpenForReqSheet();
  }, [selectedRowRequestSheetId, selectedYear]);

  useEffect(() => {
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
  const selectedCategory = watch("cmBasicDataFilledByMTD_TL.categories");

  const updateRequestOfCM = async (requestSheetDataOfCM) => {
    try {
      requestSheetDataOfCM.changedParts = parts;
      const formData = new FormData();
      const { ...otherFields } = requestSheetDataOfCM;
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
        `/updateCmReqSheet/${cmSelectedSheetForView?._id}`,
        formData,
        config
      );
      if (response.status === 201) {
        setCmReqSheetView(false);
        SuccessToast("Request-sheet updated successfully");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const context = useContext(RoutingContext);
  return (
    <Modal
      show={CmReqSheetView}
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
          onClick={() => setCmReqSheetView(false)}
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
                          {cmSelectedSheetForView?.machineName}
                        </small>{" "}
                        &nbsp;&nbsp;
                      </Col>
                      <Col lg={4} md={6}>
                        <small className="mb-0">
                          <b>MACHINE NO.:</b>&nbsp;&nbsp;
                          {cmSelectedSheetForView?.machineNo}
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
                        {isEditable === false ? (
                          <div className="d-block align-items-center">
                            {" "}
                            <input
                              type="text"
                              id="cmBasicDataFilledByMTD_TL.activityOfCM"
                              className="m-1 mb-2"
                              disabled={!isEditable}
                              value={
                                cmSelectedSheetForView
                                  ?.cmBasicDataFilledByMTD_TL?.frequencyType
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
                              {watch(
                                "cmBasicDataFilledByMTD_TL.frequencyType"
                              ) === value?.frequencyType &&
                                value?.frequencyType === "Scheduled" && (
                                  <Col className="d-flex justify-content-center align-items-center">
                                    {value?.frequencyValue?.length > 0 &&
                                      value?.frequencyValue?.map(
                                        (type, idx1) => (
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
                                cmSelectedSheetForView
                                  ?.cmBasicDataFilledByMTD_TL?.categories
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
                                        watch("actionTemporaryOrNot") ===
                                          "Yes" &&
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
                            {
                              errors?.cmBasicDataFilledByMTD_TL?.categories
                                ?.message
                            }
                          </p>
                        )}
                        <Row>
                          <Col lg={3}>
                            {(selectedCategory === "Others" ||
                              customCategory) && (
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
                            value={
                              cmSelectedSheetForView?.partSuggestionByMTDTL
                            }
                            {...register(
                              "cmBasicDataFilledByMTD_TL.partSuggestionByMTDTL",
                              {
                                required: "Please enter part suggestion",
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
                          cmSelectedSheetForView?.assigned_users?.map(
                            (item) => {
                              return `${item.tm_name},`;
                            }
                          )
                        ) : (
                          // <Controller
                          //   name="assignUserForCM"
                          //   control={control}
                          //   rules={{
                          //     required: "Please select the assign user",
                          //   }}
                          //   render={({ field }) => (
                          //     <>
                          //       <Multiselect
                          //         {...field}
                          //         displayValue="tm_name"
                          //         selectedValues={
                          //           cmSelectedSheetForView?.assigned_users
                          //         }
                          //         options={supportingTMList} // Options to display in the dropdown
                          //         onSelect={async (selectedList) => {
                          //           setValue("assignUserForCM", selectedList);
                          //           trigger("assignUserForCM");
                          //         }} // Function will trigger on select event
                          //         onRemove={async (selectedList) => {
                          //           setValue("assignUserForCM", selectedList);
                          //           trigger("assignUserForCM");
                          //         }} // Function will trigger on remove event
                          //         style={{
                          //           multiselectContainer: {
                          //             width: "14rem",
                          //           },
                          //         }}
                          //       />
                          //       {errors.assignUserForCM && (
                          //         <p className="text-error">
                          //           {errors?.assignUserForCM?.message}
                          //         </p>
                          //       )}
                          //     </>
                          //   )}
                          // />

                          <SupportingTMInputField
                            control={control}
                            setValue={setValue}
                            trigger={trigger}
                            errors={errors}
                            assigned_users={
                              cmSelectedSheetForView?.assigned_users
                            }
                            selectedYear={selectedYear}
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

                {isEditable &&
                  (context?.user_type === "MTD_TL" ||
                    context?.user_type === "Section-Admin") && (
                    <tr>
                      <td>
                        <button type="submit" className="btn bg-success">
                          Update Request-Sheet
                        </button>
                      </td>
                    </tr>
                  )}
              </tbody>
            </Table>
          </form>

          {(context?.user_type === "Operator" ||
            cmSelectedSheetForView?.assigned_users?.length > 0) &&
            (cmSelectedSheetForView?.requestSheetStatusOfCM !== "Generated" ||
              isEditable === true) && (
              <ExistinngMachineReqSheetForOperator
                isEditable={isEditable}
                cmSelectedSheetForView={cmSelectedSheetForView}
                setCmReqSheetView={setCmReqSheetView}
              />
            )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ExistingMachineReqSheetView;
