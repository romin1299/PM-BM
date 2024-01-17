import React, { useReducer, useState, useEffect, useContext } from "react";
import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  reducer,
  initialState,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import { Controller, useForm } from "react-hook-form";
import { Row, Col, Form } from "react-bootstrap";
import ProblemList from "../Tabs/SubComponents/ProblemList";
import ActionList from "../Tabs/SubComponents/ActionList";
import Multiselect from "multiselect-react-dropdown";
import ReportTitleBar from "../Reports/Common/ReportTitleBar";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import axios from "axios";
import moment from "moment-timezone";
import RoutingContext from "../../context/routing/RoutingContext";
import { SuccessToast, WarningToast } from "../Component/ShowTostify";

const NoLossBDEntryForm = () => {
  const loggedUserDetails = useContext(RoutingContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    control,
    setValue,
  } = useForm({
    defaultValues: {
      doneByNoLossBD: loggedUserDetails?._id,
    },
  });
  const [problems, setProblems] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedSupportedTM, setSelectedSupportedTM] = useState([]);
  const [supportingTMList, setSupportingTMList] = useState([]);
  const [plantShiftsData, setPlantShiftsData] = useState([]);

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

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
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getListOfTheTLAndOperatorForNoLossBDEntryForm();
  }, []);

  const timezone = "Asia/Kolkata";
  const startedDate = moment().tz(timezone).month() + 1;

  let sheetIssuedTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const momentTime = moment(sheetIssuedTime, "HH:mm");

  useEffect(() => {
    const getCurrentShiftName = () => {
      for (let shiftInfo of plantShiftsData) {
        if (
          momentTime > moment(shiftInfo?.shiftStartTime, "HH:mm") &&
          momentTime < moment(shiftInfo?.shiftEndTime, "HH:mm")
        )
          return shiftInfo.shiftName;
      }

      return "";
    };

    setValue("shiftOfBM", getCurrentShiftName());
  }, [plantShiftsData]);

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
      } catch (error) {
        console.log("error:", error);
      }
    };

    fetchShiftData();
  }, []);

  const postNoLossBDFormData = async (noLossData) => {
    try {
      const res = await fetch(`/postNewNoLossBDData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noLossData,
          problemsOfBM: problems,
          actionAndCounterMeasureStep: actions,
          selectedSupportedTM,
          selectedSection: reduceState?.selectedSection,
          selectedSubSection: reduceState?.selectedSubSection,
          selectedCell: reduceState?.selectedCell,
          selectedLine: reduceState?.selectedLine,
          selectedMachine: reduceState?.selectedMachine,
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        SuccessToast(data?.message);
        reset();
        setProblems([]);
        setActions([]);
        setSelectedSupportedTM([]);
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  console.log(selectedSupportedTM);

  return (
    <>
      <ReportTitleBar title="No Loss BD Entry Form" />
      <form onSubmit={handleSubmit(postNoLossBDFormData)} className="cell">
        <Row className="border m-1 p-1">
          <small>
            <b>Select Cell/product, Line and Machine :</b>
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
          />
        </Row>
        <Row>
          <Row className="m-1">
            <Col className="border" lg={2}>
              <small>
                <b>No-Loss BD No: </b>
              </small>
              <input
                type="text"
                name=""
                id=""
                className="w-25"
                {...register("noLossBDNo", {})}
              />
              <br />
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
                </div>
                {errors?.["maintenanceType"] && (
                  <p className="text-error">
                    {errors?.["maintenanceType"]?.message}
                  </p>
                )}
              </Form>
            </Col>
            <Col className="border">
              <Col>
                <FormControl>
                  <small>
                    <b>SHIFT</b>
                  </small>

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
                          disabled={watch("shiftOfBM") !== shiftInfo.shiftName}
                        />
                      ))}
                    </RadioGroup>
                  )}
                </FormControl>
              </Col>
              <small className="mb-0 d-flex align-items-center justify-content-start">
                <b>Is Action Temporary?</b>&nbsp;&nbsp;&nbsp;
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
              <br />
              <Col className="d-flex align-items-center justify-content-start">
                <small className="mb-0 d-block">
                  <b>FROM Date & Time: </b>
                  <br />
                  <input
                    type="datetime-local"
                    {...register("workStartedDateOfBM", {})}
                  />
                </small>
                &ensp;
                <small className="mb-0 d-block">
                  <b>TO Date & Time: </b>
                  <br />
                  <input
                    type="datetime-local"
                    {...register("workEndedDateOfBM", {})}
                  />
                </small>
              </Col>
              <br />
              <small className="mb-0 d-block">
                <b>Total Time: </b>
                <br />
                <input type="number" {...register("breakDownTime", {})} />
              </small>
            </Col>
            <Col className="border">
              <Row className="mb-2">
                <Col>
                  <small>
                    <b>Category</b>
                    <br />
                    <select
                      name="categoriesOfNoLossDBData"
                      id="categoriesOfNoLossDBData"
                      {...register("categoriesOfNoLossDBData", {})}
                      value={watch("categoriesOfNoLossDBData")}
                    >
                      <option value="" disabled>
                        Please Select
                      </option>
                      <option value="Q">Q</option>
                      <option value="S">S</option>
                      <option value="D">D</option>
                    </select>
                  </small>
                </Col>
                <Col>
                  <small>
                    <b>Machine Status</b>&nbsp;&nbsp;&nbsp;
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
              </Row>
              <Row>
                <Col>
                  <small>
                    <b>Done By</b>
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
                    <b>Supporting TM</b>
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
                          // selectedValues={requestSheetDataOfBM?.supportingTM}
                        />
                      )}
                    />
                  </small>
                </Col>
              </Row>
            </Col>
          </Row>
          <Row>
            <Col>
              <ProblemList problems={problems} setProblems={setProblems} />
            </Col>
            <Col>
              <ActionList actions={actions} setActions={setActions} />
            </Col>
            <Col>
              <Row className="m-0">
                <Col lg={12} className="d-block align-items-center border">
                  <p className="mb-0">
                    <b>Cause</b>
                  </p>{" "}
                  <textarea
                    rows={2}
                    type="text"
                    id="causeOfNoLoss"
                    name="causeOfNoLoss"
                    className="m-1 widthwhy"
                    {...register("causeOfNoLoss", {
                      // required: "This field is required",
                    })}
                  />
                </Col>
                {/* <Col lg={12} className="d-block align-items-center border">
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
                </Col> */}
              </Row>
            </Col>
          </Row>
          <Row>
            <Col className="col-lg-6 col-md-6 m-1 p-0">
              <button
                type="submit"
                className="btn bg-primary"
                style={{ marginTop: "1rem" }}
              >
                Submit Data
              </button>
            </Col>
          </Row>
        </Row>
      </form>
    </>
  );
};

export default NoLossBDEntryForm;
