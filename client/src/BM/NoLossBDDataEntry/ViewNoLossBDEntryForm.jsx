import React, { useReducer, useState, useEffect, useContext } from "react";
import { Controller, useForm } from "react-hook-form";
import { Row, Col, Form, Container } from "react-bootstrap";
import ProblemList from "../Tabs/SubComponents/ProblemList";
import ActionList from "../Tabs/SubComponents/ActionList";
import Multiselect from "multiselect-react-dropdown";
import ReportTitleBar from "../Reports/Common/ReportTitleBar";
import axios from "axios";
import moment from "moment-timezone";
import RoutingContext from "../../context/routing/RoutingContext";
import { SuccessToast, WarningToast } from "../Component/ShowTostify";
import { Modal, Button } from "react-bootstrap";
import DeleteIcon from "@mui/icons-material/Delete";
import { Tooltip, IconButton } from "@mui/material";
import { BASE_URL } from "../../ConditionsForDNINandDNHA/ConditionBasedDisplay";

const ViewNoLossBDEntryForm = ({
  modelProp,
  selectedYear,
  machine_code,
  noLossBDRequestSheetID,
  plantShiftsData,
  plantCategories,
  supportingTMList,
  removeDataFromMaster,
  modelPropForDelete,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    watch,
    reset,
    control,
    setValue,
  } = useForm({
    defaultValues: {},
  });
  const [problems, setProblems] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedSupportedTM, setSelectedSupportedTM] = useState([]);
  const [dataOfNoLossBD, setDataOfNoLossBD] = useState();
  const getNoLossBDEntryData = async (req, res, next) => {
    try {
      const res = await fetch(
        `/getNoLossBDEntryData/?_id=${noLossBDRequestSheetID}`,
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
        setDataOfNoLossBD(data?.noLossBDRequestSheetData);
        reset(data?.noLossBDRequestSheetData);
        setProblems(data?.noLossBDRequestSheetData?.problemsOfBM);
        setActions(data?.noLossBDRequestSheetData?.actionAndCounterMeasureStep);
        data?.noLossBDRequestSheetData?.categoriesOfRequestSheet?.map((obj) => {
          setValue(`categories.${obj?.category}`, obj?.subCategory);
        });
        setSelectedSupportedTM(data?.noLossBDRequestSheetData?.supportingTM);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postNoLossBDFormData = async (noLossData) => {
    try {
      const formData = new FormData();
      noLossData.problemsOfBM = problems;
      noLossData.actionAndCounterMeasureStep = actions;
      noLossData.selectedSupportedTM = selectedSupportedTM;
      noLossData.breakDownTime =
        moment(watch("workEndedDateOfBM"))
          .tz("Asia/Kolkata")
          .diff(
            moment(watch("workStartedDateOfBM")).tz("Asia/Kolkata"),
            "minutes"
          ) || 0;

      for (let i = 0; i < noLossData?.attachedFilesForOtherLoss?.length; i++) {
        formData.append(
          "attachedFilesForOtherLoss",
          noLossData?.attachedFilesForOtherLoss[i]
        );
      }

      formData.append("otherData", JSON.stringify({ ...noLossData }));
      const res = await fetch(`/postNewNoLossBDData`, {
        method: "POST",
        // headers: {
        //   "Content-Type": "application/json",
        // },
        body: formData,
      });

      const data = await res.json();

      if (res.status === 201) {
        SuccessToast(data?.message);
        modelProp?.onHide();
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteNoLossRequestSheet = async (selectedRow) => {
    try {
      const res = await fetch(
        `/deleteNoLossRequestSheet/?_id=${noLossBDRequestSheetID}`,
        {
          method: "DELETE",
        }
      );
      const { deletedNoLossRequestSheet, message } = await res.json();

      if (res.status === 201) {
        SuccessToast(message);
        modelProp?.onHide();
        removeDataFromMaster(deletedNoLossRequestSheet?._id);
      } else {
        console.log("error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getNoLossBDEntryData();
  }, []);

  return (
    <>
      <Modal
        {...modelProp}
        fullscreen
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header className="d-flex justify-content-between">
          <Modal.Title id="contained-modal-title-vcenter">
            Other Loss BD Entry Form
          </Modal.Title>
          <Button
            variant="secondary"
            onClick={modelProp?.onHide}
            className="btn-danger"
          >
            Close
          </Button>
        </Modal.Header>
        <Modal.Body>
          <form
            onSubmit={handleSubmit(postNoLossBDFormData)}
            className="cell p-3 mt-3"
          >
            <Row className="mb-3">
              <Col className="col-auto">
                <small>
                  <b> CELL/PRODUCT, LINE AND MACHINE :</b>
                </small>
                <small>
                  {dataOfNoLossBD?.subSection &&
                    dataOfNoLossBD?.subSection?.[0]?.subSection_name}
                  {", "}
                  {dataOfNoLossBD?.cell?.[0]?.cell_name}
                  {", "}
                  {dataOfNoLossBD?.line?.[0]?.line_name}
                  {", "}
                  {dataOfNoLossBD?.machine?.[0]?.machine_name}
                  {", "}
                  {dataOfNoLossBD?.machine?.[0]?.machine_code}
                </small>
              </Col>
              <Col className="d-flex justify-content-end">
                <Tooltip title="Delete Other Loss Request-sheet">
                  <button className="btn btn-warning" onClick={modelPropForDelete?.onHide}>Delete</button>
                  {/* <DeleteIcon
                    className="text-danger"
                    role="button"
                    onClick={modelPropForDelete?.onHide}
                  /> */}
                </Tooltip>
              </Col>
            </Row>

            <Row className="gx-0">
              <Col className="border p-2" sm={12} md={6} xl={3}>
                <small>
                  <b>NO-LOSS BD NO: </b>
                </small>
                <br />
                <input
                  type="text"
                  name=""
                  id=""
                  className="w-100"
                  disabled
                  style={{ maxWidth: "150px" }}
                  {...register("noLossBDNo", {})}
                />

                <br />
                {/* <small className="mb-0 d-block">
              <b>DATE & TIME: </b>
              <br />
              <input
                type="datetime-local"
                {...register("DateOfNoLossBD", {})}
              />
            </small>
            <br /> */}
                <small>
                  <b>MAINT. TYPE</b>
                </small>
                <Form style={{ fontSize: "16px !important" }}>
                  <div key={`inline-radio`}>
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="CM"
                      name="maintenanceType"
                      type="radio"
                      id={`inline-radio-1`}
                      value="CM"
                      {...register("maintenanceType", {
                        // required: "Please select maintenance type",
                      })}
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "BM"}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="BD with No Loss"
                      name="maintenanceType"
                      type="radio"
                      id={`inline-radio-2`}
                      value="BD with No Loss"
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "PM"}
                      {...register("maintenanceType", {
                        // required: "Please select maintenance type",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="Documentation"
                      type="radio"
                      name="maintenanceType"
                      id={`inline-radio-3`}
                      value="Documentation"
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "CM"}
                      {...register("maintenanceType", {
                        // required: "Please select maintenance type",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="PRD Support"
                      type="radio"
                      name="maintenanceType"
                      id={`inline-radio-4`}
                      value="PRD Support"
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "TPM"}
                      {...register("maintenanceType", {
                        // required: "Please select maintenance type",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="PED Support"
                      type="radio"
                      name="maintenanceType"
                      id={`inline-radio-5`}
                      value="PED Support"
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "TPM"}
                      {...register("maintenanceType", {
                        // required: "Please select maintenance type",
                      })}
                    />
                  </div>
                  {errors?.["maintenanceType"] && (
                    <p className="text-error">
                      {errors?.["maintenanceType"]?.message}
                    </p>
                  )}
                </Form>
              </Col>

              <Col
                className="border p-2 d-flex flex-column gap-3"
                sm={12}
                md={6}
                xl={3}
              >
                <Row className="gx-3 gy-2">
                  <Col className="col-auto d-flex align-items-center">
                    <Form>
                      <small>
                        <b>SHIFT</b>
                      </small>
                      {plantShiftsData?.map((shiftInfo) => (
                        <Form.Check
                          flex
                          label={shiftInfo.shiftName}
                          type="radio"
                          value={shiftInfo.shiftName}
                          name={"shiftOfBM"}
                          {...register("shiftOfBM")}
                          onChange={(e) => {
                            setValue("shiftOfBM", e.target.value, {
                              shouldDirty: true,
                            });
                          }}
                        />
                      ))}
                      {errors?.["shiftOfBM"] && (
                        <p className="text-error">
                          {errors?.["shiftOfBM"]?.message}
                        </p>
                      )}
                    </Form>
                  </Col>

                  <Col className="col-auto">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>IS ACTION TEMPORARY?</b>&nbsp;&nbsp;&nbsp;
                    </small>
                    <Form>
                      <div className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="actionTemporaryOrNot"
                          type="radio"
                          value="Yes"
                          id="actionTemporaryOrNot"
                          // onChange={handleactionTemporaryOrNot}
                          {...register("actionTemporaryOrNot", {
                            // required: "This field is required",
                          })}
                        />{" "}
                        &nbsp;&nbsp;
                        <Form.Check
                          flex
                          label="No"
                          name="actionTemporaryOrNot"
                          type="radio"
                          value="No"
                          id="actionTemporaryOrNot"
                          // onChange={handleactionTemporaryOrNot}
                          {...register("actionTemporaryOrNot", {
                            // required: "This field is required",
                          })}
                        />
                      </div>
                      {errors?.["actionTemporaryOrNot"] && (
                        <p className="text-error">
                          {errors?.["actionTemporaryOrNot"]?.message}
                        </p>
                      )}
                    </Form>
                  </Col>
                </Row>

                <Row className="g-2">
                  <Col className="col-auto">
                    <small className="mb-0 d-block">
                      <b>FROM Date & Time: </b>
                      <br />
                      <input
                        type="datetime-local"
                        {...register("workStartedDateOfBM", {
                          // required: "This field is required",
                        })}
                      />
                    </small>
                    {errors?.["workStartedDateOfBM"] && (
                      <p className="text-error">
                        {errors?.["workStartedDateOfBM"]?.message}
                      </p>
                    )}
                  </Col>
                  <Col className="col-auto">
                    <small className="mb-0 d-block">
                      <b>TO Date & Time: </b>
                      <br />
                      <input
                        type="datetime-local"
                        {...register("workEndedDateOfBM", {
                          // required: "This field is required",
                        })}
                      />
                    </small>
                    {errors?.["workEndedDateOfBM"] && (
                      <p className="text-error">
                        {errors?.["workEndedDateOfBM"]?.message}
                      </p>
                    )}
                  </Col>
                </Row>

                <Row>
                  <small className="mb-0 d-block">
                    <b>TOTAL TIME: </b>
                    <br />
                    <p>
                      {moment(watch("workEndedDateOfBM"))
                        .tz("Asia/Kolkata")
                        .diff(
                          moment(watch("workStartedDateOfBM")).tz(
                            "Asia/Kolkata"
                          ),
                          "minutes"
                        ) || 0}
                    </p>
                  </small>
                </Row>
              </Col>

              <Col className="border p-2" sm={12} md={6} xl={3}>
                <td className="col-lg-6 col-md-6">
                  {plantCategories?.map((categoryObj, idxOfCategory) => (
                    <>
                      <Row className="m-0">
                        <Col lg={4} className=" p-2">
                          <p className="mb-0 d-flex align-items-center justify-content-start">
                            <b>{categoryObj?.name}</b>&nbsp;&nbsp;&nbsp;
                          </p>
                        </Col>

                        <Col
                          lg={6}
                          md={12}
                          className=" p-2 d-flex align-items-center"
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
                                    name={`categories`}
                                    className="col-auto"
                                    // onChange={handleactionTemporaryOrNot}
                                    {...register(
                                      `categories.${categoryObj?.name}`
                                      // {
                                      // required: "This field is required",
                                      // }
                                    )}
                                    onChange={(e) => {
                                      setValue(
                                        `categories.${categoryObj?.name}`,
                                        e.target.value,
                                        { shouldDirty: true }
                                      );
                                    }}
                                  />
                                )
                              )}
                            </div>
                            {errors?.[`categories`]?.[
                              `${categoryObj?.name}`
                            ] && (
                              <p className="text-error">
                                {
                                  errors?.[`categories`]?.[
                                    `${categoryObj?.name}`
                                  ]?.message
                                }
                              </p>
                            )}
                          </Form>
                        </Col>
                      </Row>
                    </>
                  ))}
                </td>
              </Col>

              <Col className="border p-2" sm={12} md={6} xl={3}>
                <Row className="mb-2">
                  <Col>
                    <small>
                      <b>MACHINE STATUS</b>&nbsp;&nbsp;&nbsp;
                      <Form>
                        <div className="d-flex">
                          <Form.Check
                            flex
                            label="OK"
                            name="machineStatus"
                            type="radio"
                            value="OK"
                            id="machineStatus"
                            {...register("machineStatus", {})}
                          />{" "}
                          &nbsp;&nbsp;
                          <Form.Check
                            flex
                            label="NG"
                            name="machineStatus"
                            type="radio"
                            value="NG"
                            id="machineStatus"
                            {...register("machineStatus", {})}
                          />
                        </div>
                      </Form>
                    </small>
                  </Col>
                  <Col>
                    <small>
                      <b>DONE BY</b>
                      <br />
                      <select
                        name="doneByNoLossBD"
                        id="doneByNoLossBD"
                        {...register("doneByNoLossBD", {})}
                        value={watch("doneByNoLossBD")}
                      >
                        <option value="" disabled>
                          Please Select
                        </option>
                        {supportingTMList?.map((obj) => (
                          <option value={obj?._id}>{obj?.tm_name}</option>
                        ))}
                      </select>
                    </small>
                  </Col>
                  <Col>
                    <small>
                      <b>SUPPORTING TM</b>
                      <Controller
                        name="supportingTM"
                        control={control}
                        render={({ field }) => (
                          <Multiselect
                            {...field}
                            displayValue="tm_name"
                            className="col-9 "
                            options={supportingTMList} // Options to display in the dropdown
                            // selectedValues={departmentList} // Preselected value to persist in dropdown
                            onSelect={async (selectedList) => {
                              await setSelectedSupportedTM(selectedList);
                            }} // Function will trigger on select event
                            onRemove={async (selectedList) => {
                              await setSelectedSupportedTM(selectedList);
                            }} // Function will trigger on remove event
                            style={{
                              multiselectContainer: {
                                width: "15rem",
                              },
                            }}
                            selectedValues={dataOfNoLossBD?.supportingTM}
                          />
                        )}
                      />
                    </small>
                  </Col>
                  <Col lg={12}>
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
                          setValue(
                            "attachedFilesForOtherLoss",
                            e.target.files,
                            {
                              shouldDirty: true,
                            }
                          );
                        }}
                      />
                      {/* {errors?.["attachedImagesOrVideoByPRDUser"] && (
                        <p className="text-error">{"This field is required"}</p>
                      )} */}
                    </Form.Group>
                    {/* {selectedAttendee} */}
                  </Col>
                  <Col lg={12}>
                    {dataOfNoLossBD?.attachedFilesForOtherLoss?.map(
                      (filesOfNoLoss, idx) => (
                        <a
                          target="_blank"
                          // href={`http://localhost:7000/${image}`}
                          href={`${process.env.REACT_APP_BASE_URL}/${filesOfNoLoss}`}
                          style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {filesOfNoLoss}
                        </a>
                      )
                    )}
                  </Col>
                </Row>
              </Col>
            </Row>

            <Row className="mt-0 g-3">
              <Col sm={12} md={12} lg={6} xxl={4}>
                <ProblemList problems={problems} setProblems={setProblems} />
              </Col>
              <Col sm={12} md={12} lg={6} xxl={4}>
                <ActionList actions={actions} setActions={setActions} />
              </Col>
              <Col sm={12} md={12} lg={6} xxl={4}>
                <div className="d-block align-items-center border p-2">
                  <p>
                    <b>CAUSE</b>
                  </p>
                  <div style={{ paddingInline: "6px" }}>
                    <textarea
                      rows={2}
                      type="text"
                      id="causeOfNoLoss"
                      name="causeOfNoLoss"
                      className="mt-2 w-100"
                      {...register("causeOfNoLoss", {
                        // required: "This field is required",
                      })}
                    />
                  </div>
                  <br />
                  <p>
                    <b>COUNTER MEASURE STEP</b>
                  </p>
                  <div style={{ paddingInline: "6px" }}>
                    <textarea
                      rows={2}
                      type="text"
                      id="counterMeasureStep"
                      name="counterMeasureStep"
                      className="mt-2 w-100"
                      {...register("counterMeasureStep", {
                        // required: "This field is required",
                      })}
                    />
                  </div>
                </div>
              </Col>
            </Row>

            <Button
              type="submit"
              className="btn bg-primary"
              style={{ marginTop: "1rem" }}
            >
              Submit Data
            </Button>
          </form>

          <Modal {...modelPropForDelete} centered>
            <Modal.Header closeButton>
              <Modal.Title>Delete No Loss BD</Modal.Title>
            </Modal.Header>
            <Modal.Body>Are you want to delete the No Loss BD ?</Modal.Body>
            <Modal.Footer>
              <Button onClick={deleteNoLossRequestSheet} className="btn-danger">
                Yes
              </Button>
              <Button variant="primary" onClick={modelPropForDelete?.onHide}>
                No
              </Button>
            </Modal.Footer>
          </Modal>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ViewNoLossBDEntryForm;
