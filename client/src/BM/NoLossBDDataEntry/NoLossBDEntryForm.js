import React, { useReducer, useState, useEffect, useContext } from "react";
import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  reducer,
  initialState,
  getFiltrationValue,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
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
import { Button } from "@mui/material";

const NoLossBDEntryForm = () => {
  const loggedUserDetails = useContext(RoutingContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    clearErrors,
    setError,
    control,
    setValue,
  } = useForm({
    defaultValues: {
      doneByNoLossBD: loggedUserDetails?._id,
      DateOfNoLossBD: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
    },
  });
  const [problems, setProblems] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedSupportedTM, setSelectedSupportedTM] = useState([]);
  const [supportingTMList, setSupportingTMList] = useState([]);
  const [plantShiftsData, setPlantShiftsData] = useState([]);
  const [plantCategories, setPlantCategories] = useState([]);

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const [inc, setInc] = useState(1);

  const getListOfTheTLAndOperatorForNoLossBDEntryForm = async () => {
    try {
      const res = await fetch(
        `/getListOfTheTLAndOperatorForNoLossBDEntryForm`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.status === 404) {
        console.log("error", data?.message);
      } else {
        setSupportingTMList(data?.TLHOSS_and_TM_user_list);
        setInc(data?.getNoLossNo);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getFiltrationValueByDefault = async () => {
    const { res, data } = await getFiltrationValue({
      url: `${baseUrlForFiltering}/byDefault`,
    });

    const {
      message,

      flagForTogglingFilter,
      selectedValue,

      selectedSection,
      sections,
      selectedSubSection,
      subSections,
      selectedCell,
      cells,
      selectedLine,
      lines,
      selectedMachine,
      machines,
      selectedRSStatus,
    } = data;

    if (res?.status === 201) {
      reducerDispatch({
        type: "get-data",

        flagForTogglingFilter,
        selectedValue,

        selectedSection,
        sections,
        selectedSubSection,
        subSections,
        cells,
        selectedCell,
        selectedLine,
        lines,
        selectedMachine,
        machines,
        message,
        selectedRSStatus,
      });
    }
  };
  
  useEffect(() => {
    getListOfTheTLAndOperatorForNoLossBDEntryForm();
  }, []);

  // console.log("this is reduce", reduceState);

  const timezone = "Asia/Kolkata";
  const currentMonth = moment().format("MMM");
  const currentYear = moment().tz(timezone).year();

  let sheetIssuedTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const momentTime = moment(sheetIssuedTime, "HH:mm");

  // useEffect(() => {
  //   const getCurrentShiftName = () => {
  //     for (let shiftInfo of plantShiftsData) {
  //       if (
  //         momentTime > moment(shiftInfo?.shiftStartTime, "HH:mm") &&
  //         momentTime < moment(shiftInfo?.shiftEndTime, "HH:mm")
  //       )
  //         return shiftInfo.shiftName;
  //     }

  //     return "";
  //   };

  //   setValue("shiftOfBM", getCurrentShiftName());
  // }, [plantShiftsData]);

  useEffect(() => {
    const fetchShiftData = async () => {
      const url = "/getAllShifts";

      try {
        const res = await axios.get(url, {
          withCredentials: true,
          credentials: "include",
        });

        // console.log("fetch shifts res:", res);
        setPlantShiftsData(res?.data?.getShifts);
        setPlantCategories(res?.data?.categories);
      } catch (error) {
        console.log("error:", error);
      }
    };

    fetchShiftData();
  }, []);

  const postNoLossBDFormData = async (noLossData) => {
    try {
      if (
        !reduceState?.selectedCell ||
        !reduceState?.selectedLine ||
        !reduceState?.selectedMachine
      ) {
        return setError(
          "selectedValue",
          {
            message: "Cell / Line/ Machine selection is required !",
          },
          { shouldFocus: true }
        );
      }

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
      noLossData.selectedSection = reduceState?.selectedSection;
      noLossData.selectedSubSection = reduceState?.selectedSubSection;
      noLossData.selectedCell = reduceState?.selectedCell;
      noLossData.selectedLine = reduceState?.selectedLine;
      noLossData.selectedMachine = reduceState?.selectedMachine;
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
        // const result = initialState();
        // console.log("this is result", result);

        SuccessToast(data?.message);
        reset({
          doneByNoLossBD: loggedUserDetails?._id,
          actionTemporaryOrNot: "",
          maintenanceType: "",
          shiftOfBM: "",
          machineStatus: "",
          workStartedDateOfBM: "",
          workEndedDateOfBM: "",
          causeOfNoLoss: "",
          counterMeasureStep: "",
          attachedFilesForOtherLoss: "",
        });
        setProblems([]);
        setActions([]);
        setSelectedSupportedTM([]);
        setInc((inc) => inc + 1);
        getFiltrationValueByDefault();
        for (const categoryObj of plantCategories) {
          setValue(`categories.${categoryObj?.name}`, "");
        }
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (reduceState?.selectedMachine !== "") {
      clearErrors("selectedValue");
    }
  }, [reduceState?.selectedMachine]);

  return (
    <Container fluid>
      <ReportTitleBar title="Other Loss BD Entry Form" />

      <form
        onSubmit={handleSubmit(postNoLossBDFormData)}
        className="cell p-3 mt-3"
      >
        <Row className="mb-3">
          <Col className="col-auto">
            <small>
              <b>SELECT CELL/PRODUCT, LINE AND MACHINE :</b>
            </small>
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
              sectionFiltration
              subSectionFiltration
              cellFiltration
              lineFiltration
              machineFiltration
              // isWithLocalStorageForFiltration={"Yes"}
            />
          </Col>
          {errors?.selectedValue && (
            <p className="text-error">{errors?.selectedValue?.message}</p>
          )}
        </Row>

        <Row className="gx-0">
          <Col className="border p-2" sm={12} md={6} xl={3}>
            <small>
              <b>NO-LOSS BD NO: </b>
            </small>
            <br />
            {/* <input
              type="text"
              name=""
              id=""
              className="w-100"
              style={{ maxWidth: "300px" }}
              {...register("noLossBDNo", {})}
            /> */}
            {currentYear}-{currentMonth}-{inc + 1 || 1}
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
                  label="CM Entry"
                  name="maintenanceType"
                  type="radio"
                  id={`inline-radio-1`}
                  value="CM Entry"
                  {...register("maintenanceType", {
                    required: "Please select maintenance type",
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
                    required: "Please select maintenance type",
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
                    required: "Please select maintenance type",
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
                    required: "Please select maintenance type",
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
                    required: "Please select maintenance type",
                  })}
                />
                <Form.Check
                  flex
                  style={{ fontSize: "12px" }}
                  label="TPM"
                  type="radio"
                  name="maintenanceType"
                  id={`inline-radio-6`}
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
                      // value={shiftInfo.shiftName}
                      // name={`shiftOfBM`}
                      {...register(`shiftOfBM`, {
                        required: "This field is required",
                      })}

                      // {...register(`shiftOfBM.${shiftInfo.shiftName}`)}
                      // onChange={(e) => {
                      //   setValue(`shiftOfBM`, e.target.value, {
                      //     shouldDirty: true,
                      //   });
                      // }}
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
                        required: "This field is required",
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
                        required: "This field is required",
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
                      required: "This field is required",
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
                      required: "This field is required",
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
                      moment(watch("workStartedDateOfBM")).tz("Asia/Kolkata"),
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
                                  //   required: "This field is required",
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
                        {errors?.[`categories`]?.[`${categoryObj?.name}`] && (
                          <p className="text-error">
                            {
                              errors?.[`categories`]?.[`${categoryObj?.name}`]
                                ?.message
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
                        selectedValues={selectedSupportedTM}
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
                      setValue("attachedFilesForOtherLoss", e.target.files, {
                        shouldDirty: true,
                      });
                    }}
                  />
                  {/* {errors?.["attachedImagesOrVideoByPRDUser"] && (
                        <p className="text-error">{"This field is required"}</p>
                      )} */}
                </Form.Group>
                {/* {selectedAttendee} */}
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

            {/* <Row>
              <Col lg={12} className="d-block align-items-center border p-2">
                <p>
                  <b>Cause</b>
                </p>
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
                  {...register("why2", {
                    // required: "This field is required",
                  })}
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
                  {...register("why3", {
                    // required: "This field is required",
                  })}
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
                  {...register("why4", {
                    // required: "This field is required",
                  })}
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
                  {...register("why5", {
                    // required: "This field is required",
                  })}
                />
              </Col>
            </Row> */}
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
    </Container>
  );
};

export default NoLossBDEntryForm;
