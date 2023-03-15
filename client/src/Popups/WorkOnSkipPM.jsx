import React, { useEffect, useState } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { Select } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import axios from "axios";
import { Multiselect } from "multiselect-react-dropdown";
import { useContext } from "react";
import RoutingContext from "../context/routing/RoutingContext";

function WorkOnSkipPM({ close, selectedRow, functionToSetRefKey, machineId }) {
  const [workedData, setWorkedData] = useState([]);
  const [userPhoto, setUserPhoto] = useState([]);

  // console.log("+++++++++++++++++++++++++", selectedRow);

  const [supportingTMList, setSupportingTMList] = useState([]);
  const [selectedSupportedTM, setSelectedSupportedTM] = useState([]);
  const context = useContext(RoutingContext);

  const navigate = useNavigate();

  const abnormalityStatusDropdown = [
    {
      label: "Open",
      value: "Open",
    },
    {
      label: "Close",
      value: "Close",
    },
  ];

  const sparePartsDropdown = [
    {
      label: "Yes",
      value: "Yes",
    },
    {
      label: "No",
      value: "No",
    },
  ];

  const pmStatusDropdown = [
    {
      label: "Completed",
      value: "Completed",
    },
    {
      label: "Pending",
      value: "Pending",
    },
  ];
  const validationSchema = yup.object({
    workedOnPM: yup.string().required("Please select one"),
    reasonForDelayWhenSkip: yup
      .string()
      .required("Please enter reason for delay"),
    abnormalityRemarks: yup.string().when({
      is: () =>
        formik.values.workedOnPM === "Rectify" ||
        formik.values.workedOnPM === "No",
      then: yup.string().required("Please enter abnormality remarks"),
    }),
    partName: yup.string().when({
      is: () => formik.values.spareParts === "Yes",
      then: yup.string().required("Please enter part name"),
    }),
    partNo: yup.string().when({
      is: () => formik.values.spareParts === "Yes",
      then: yup.string().required("Please enter part no"),
    }),
    cost: yup.string().when({
      is: () => formik.values.spareParts === "Yes",
      then: yup.string().required("Please enter cost"),
    }),
    pmTime: yup.string().required("Please enter time"),
  });

  //get the date and time
  const timeStamp = () => {
    let date = new Date();
    let getTime = date
      .toLocaleTimeString("en-IN", {
        hour12: true,
      })
      .replace(/(.*)\D\d+/, "$1");
    const year = date.getFullYear(); // 2019
    const month = date.getMonth() + 1;
    const day = date.getDate(); // 23

    return `${day}/${month}/${year} - ${getTime}`;
  };
  let x = [
    {
      xyz: 1,
    },
    {
      abc: 2,
    },
  ];
  // console.log(selectedSupportedTM);
  const formik = useFormik({
    initialValues: {
      workedOnPM: "",
      remarksOfImplementation: "",
      reasonForDelayWhenSkip: "",
      // Abnormality Details
      abnormalityRemarks: "",
      abnormalityStatus: "",
      targetDate: "",

      //Spare Details
      spareParts: "",
      partName: "",
      partNo: "",
      cost: "",
      pmStatus: "",
      pmTime: "",

      //var for uploading photo
      photoUpload: "",
    },
    validationSchema: validationSchema,

    onSubmit: async (values) => {
      let currentDateAndTime = timeStamp();
      let formData = new FormData();
      formData.append("photoUpload", userPhoto);
      formData.append("workedOnPM", values.workedOnPM);
      formData.append("reasonForDelayWhenSkip", values.reasonForDelayWhenSkip);
      formData.append(
        "remarksOfImplementation",
        values.remarksOfImplementation
      );
      formData.append("machineId", selectedRow.machine_code);
      formData.append("tableRowId", selectedRow.tableRowId);
      formData.append("yearOfCheckSheet", selectedRow.yearOfCheckSheet);
      formData.append("schedule_month", selectedRow.schedule_month);
      formData.append("pmTime", values.pmTime);
      formData.append(
        "selectedSupportedTM",
        JSON.stringify(selectedSupportedTM)
      );
      formData.append("PMworkedTMName", context.tm_name.split(" ")[0]);
      formData.append("PMworkedTMNo", context.tm_no);
      // formData.append("monthForCompareSystemMonth", monthForCompareSystemMonth);
      // formData.append("previousMonth", previousMonth);
      // Abnormality Details
      formData.append("abnormalityRemarks", values.abnormalityRemarks);
      formData.append(
        "abnormalityStatus",
        values.workedOnPM === "No" ? "Open" : "Closed"
      );
      formData.append("targetDate", values.targetDate);
      //Spare Details
      formData.append("spareParts", values.spareParts);
      formData.append("partName", values.partName);
      formData.append("partNo", values.partNo);
      formData.append("cost", values.cost);
      formData.append("completionDateOfInspection", currentDateAndTime);
      // console.log(formData);

      axios
        .post("/postSkipWorkedData", formData)
        .then((res) => {
          if (res.status === 400 || res.status === 422) {
            window.alert("Invalid !");
          } else {
            console.log("Submitted sucessfully...");
            // disabledButtonAfterPM(tableRowId, true);
            close();
            functionToSetRefKey();
            postNewPendingLogHistory();
            // window.location.reload();
            // navigate("/machineWiseCheckSheetForImplemetation");
          }
        })
        .catch((err) => {
          window.alert("Only .png, .jpg and .jpeg format allowed!");
          console.log(err);
        });
    },
  });

  const postNewPendingLogHistory = async () => {
    const res = await fetch("/submitLogHistory", {
      method: "Post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        yearOfCheckSheet: selectedRow.yearOfCheckSheet,
        values: formik?.values,

        inceptionValueForLogHistory: selectedRow?.inspection_parent_name,
        completionDateOfInspection: timeStamp(),
        schedule_month: selectedRow?.schedule_month,
        // refKeyForScheduleMonthInLogHistory,
        // machineAllData,
        machineId,
      }),
    });
    const data = res.json();
    // console.log(data);
    if (res.status === 400 || res.status === 422 || !data) {
      window.alert("Invalid credentials !");
    } else {
      console.log("Log Added Successfully...");
    }
  };

  // console.log(formik.values.reasonForDelayWhenSkip);

  //fetch supported operator list
  const getListForApproval = async () => {
    try {
      const res = await fetch("/getListForApproval", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();

      setSupportingTMList(data.supportingOperatorList);
      // setTableData(finalData);
    } catch (error) {
      console.log(error);
    }
  };

  const clearState = () => {
    formik.values.remarksOfImplementation = "";
    formik.values.abnormalityRemarks = "";
    formik.values.spareParts = "";
    formik.values.partName = "";
    formik.values.partNo = "";
    formik.values.cost = "";
    formik.values.reasonForDelayWhenSkip = "";
  };

  useEffect(() => {
    getListForApproval();
  }, []);

  return (
    <>
      <div id="main_div_reg5">
        <span onClick={close} className="close">
          &times;
        </span>
        {/* <button onClick={postNewPendingLogHistory}>ABCD</button> */}
        <div>
          <form
            onSubmit={formik.handleSubmit}
            style={{ textAlign: "left" }}
            encType="multipart/form-data"
          >
            {/* <div className="row">
              <div className="col-4">
                <h2>{machineId}</h2>
              </div>
              <div className="col-4">
                <h3>{tableRowId}</h3>
              </div>
              <div className="col-4">
                <h3>{monthForCompareSystemMonth}</h3>
              </div>
              <br />
            </div> */}
            <div className="row flex justify-content-center">
              <div className="mb-2 d-flex col-4 justify-content-center">
                <input
                  type="radio"
                  name="workedOnPM"
                  value="Yes"
                  onChange={(e) => {
                    formik.handleChange(e);
                    clearState();
                  }}
                  // onClick={(e) => showTextBox(rData[0].value, e)}
                />{" "}
                &nbsp; &#x2713; OK{" "}
              </div>
              <div className="mb-2 d-flex col-4 justify-content-center">
                <input
                  type="radio"
                  name="workedOnPM"
                  value="Rectify"
                  onChange={(e) => {
                    formik.handleChange(e);
                    clearState();
                  }}
                  // onClick={(e) => showTextBox(rData[0].value, e)}
                />{" "}
                &nbsp; &#x2713; Rectify{" "}
              </div>

              <div className="col-4 mb-2 d-flex justify-content-center">
                <input
                  type="radio"
                  name="workedOnPM"
                  value="No"
                  onChange={(e) => {
                    formik.handleChange(e);
                    clearState();
                  }}
                  // onClick={(e) => hideTextBox(rData[0].value, e)}
                />{" "}
                &nbsp; &#x2715; NG ( Not Good ) <br />{" "}
              </div>

              <p
                style={{
                  color: "#F44336",
                  fontWeight: "normal",
                  fontSize: "0.90rem",
                  textAlign: "center",
                }}
              >
                {formik.touched.workedOnPM && formik.errors.workedOnPM}
              </p>
            </div>

            {formik.values.workedOnPM === "Yes" ? (
              <div>
                <div className="row">
                  <div className="col-6">
                    <div className="mb-3">
                      <span>Remarks: </span>
                      <input
                        type="text"
                        maxLength={5}
                        // id={rData[0].value}
                        name="remarksOfImplementation"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <span>Reason for delay: </span>
                      <TextField
                        type="text"
                        // id={rData[0].value}
                        value={formik.values.reasonForDelayWhenSkip}
                        autoComplete="off"
                        name="reasonForDelayWhenSkip"
                        onChange={formik.handleChange}
                        error={
                          formik.touched.reasonForDelayWhenSkip &&
                          Boolean(formik.errors.reasonForDelayWhenSkip)
                        }
                        helperText={
                          formik.touched.reasonForDelayWhenSkip &&
                          formik.errors.reasonForDelayWhenSkip
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <span>Photo Upload: </span>
                  <input
                    type="file"
                    className="col-6"
                    name="photoUpload"
                    // onChange={(e) => {
                    //   formik.handleChange(e.target.files[0]);
                    // }}
                    onChange={(e) => setUserPhoto(e.target.files[0])}
                  />
                </div>

                <div className="row">
                  <div className="col-6">
                    <div className="mb-3">
                      <span>PM Time(min): </span>
                      <TextField
                        type="text"
                        className="col-8"
                        name="pmTime"
                        autoComplete="off"
                        value={formik.values.pmTime}
                        onChange={formik.handleChange}
                        error={
                          formik.touched.pmTime && Boolean(formik.errors.pmTime)
                        }
                        helperText={
                          formik.touched.pmTime && formik.errors.pmTime
                        }
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <span>Supporting TM: </span>

                      <Multiselect
                        displayValue="tm_name"
                        options={supportingTMList} // Options to display in the dropdown
                        // selectedValues={departmentList} // Preselected value to persist in dropdown
                        onSelect={async (selectedList) => {
                          await setSelectedSupportedTM(selectedList);
                        }} // Function will trigger on select event
                        onRemove={async (selectedList) => {
                          await setSelectedSupportedTM(selectedList);
                        }} // Function will trigger on remove event
                        style={{
                          optionContainer: {
                            maxHeight: "8rem",
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : formik.values.workedOnPM === "No" ||
              formik.values.workedOnPM === "Rectify" ? (
              <div>
                <div className="row">
                  <div className="col-6">
                    <div className="mb-3">
                      <span>Remarks: </span>
                      <input
                        type="text"
                        maxLength={5}
                        // id={rData[0].value}
                        name="remarksOfImplementation"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <span>Reason for delay: </span>
                      <TextField
                        type="text"
                        // id={rData[0].value}
                        name="reasonForDelayWhenSkip"
                        onChange={formik.handleChange}
                        error={
                          formik.touched.reasonForDelayWhenSkip &&
                          Boolean(formik.errors.reasonForDelayWhenSkip)
                        }
                        helperText={
                          formik.touched.reasonForDelayWhenSkip &&
                          formik.errors.reasonForDelayWhenSkip
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <h4 className="mb-3 d-flex justify-content-center">
                      Abnormality Details
                    </h4>
                  </div>
                  <div className="col-6">
                    <h4 className="mb-3 d-flex justify-content-center">
                      Spare Details
                    </h4>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6 ">
                    <div className="mb-2 row ">
                      <span className="col-6">Sr.No: </span>
                      <input
                        type="text"
                        className="col-6"
                        value={selectedRow?.tableData?.id + 1}
                        // onChange={formik.handleChange}
                      />
                    </div>

                    <div className="mb-2 row">
                      <span className="col-6">Abnormality Remarks: </span>
                      <TextField
                        // type="text"
                        id="outlined-basic"
                        className="col-6"
                        name="abnormalityRemarks"
                        variant="outlined"
                        onChange={formik.handleChange}
                        value={formik.values.abnormalityRemarks}
                        autoComplete="off"
                        error={
                          formik.touched.abnormalityRemarks &&
                          Boolean(formik.errors.abnormalityRemarks)
                        }
                        helperText={
                          formik.touched.abnormalityRemarks &&
                          formik.errors.abnormalityRemarks
                        }
                      />
                    </div>

                    {formik.values.workedOnPM === "No" ? (
                      <div>
                        <div className="mb-2 row">
                          <span className="col-6">Abnormality Status: </span>
                          <input
                            type="text"
                            className="col-6"
                            name="abnormalityStatus"
                            // onChange={formik.handleChange}
                            value={"Open"}
                          />
                        </div>
                        <div className="mb-2 row">
                          <span className="col-6">Target Date: </span>
                          <input
                            type="date"
                            className="col-6"
                            name="targetDate"
                            value={formik.values.targetDate}
                            onChange={formik.handleChange}
                          />
                        </div>

                        <div className="mb-2 row">
                          <span className="col-6">Photo Upload: </span>
                          <input
                            type="file"
                            className="col-6"
                            name="photoUpload"
                            // onChange={(e) => {
                            //   formik.handleChange(e.target.files[0]);
                            // }}
                            onChange={(e) => setUserPhoto(e.target.files[0])}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-2 row">
                          <span className="col-6">Abnormality Status: </span>
                          <input
                            type="text"
                            className="col-6"
                            name="abnormalityStatus"
                            // onChange={formik.handleChange}
                            value={"Closed"}
                          />
                        </div>
                        <div className="mb-2 row">
                          <span className="col-6">Photo Upload: </span>
                          <input
                            type="file"
                            className="col-6"
                            name="photoUpload"
                            // onChange={(e) => {
                            //   formik.handleChange(e.target.files[0]);
                            // }}
                            onChange={(e) => setUserPhoto(e.target.files[0])}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-6">
                    <div className="mb-2 row">
                      <span className="col-6">Spare Part: </span>
                      <select
                        className="col-6"
                        select
                        autoComplete="off"
                        name="spareParts"
                        onChange={formik.handleChange}
                        variant="standard"
                        value={formik.values.spareParts}
                      >
                        <option selected disabled value="">
                          Please select
                        </option>
                        {sparePartsDropdown.map((option) => {
                          return (
                            <option value={option.value}>{option.label}</option>
                          );
                        })}
                      </select>
                    </div>
                    {formik.values.spareParts === "Yes" ? (
                      <div>
                        <div className="mb-2 row">
                          <span className="col-6">Part Name: </span>
                          <TextField
                            type="text"
                            className="col-6"
                            name="partName"
                            value={formik.values.partName}
                            onChange={formik.handleChange}
                            autoComplete="off"
                            id="outlined-basic"
                            // variant="outlined"
                            error={
                              formik.touched.partName &&
                              Boolean(formik.errors.partName)
                            }
                            helperText={
                              formik.touched.partName && formik.errors.partName
                            }
                          />
                        </div>

                        <div className="mb-2 row">
                          <span className="col-6">Part No: </span>
                          <TextField
                            type="text"
                            className="col-6"
                            name="partNo"
                            onChange={formik.handleChange}
                            autoComplete="off"
                            id="outlined-basic"
                            // variant="outlined"
                            value={formik.values.partNo}
                            error={
                              formik.touched.partNo &&
                              Boolean(formik.errors.partNo)
                            }
                            helperText={
                              formik.touched.partNo && formik.errors.partNo
                            }
                          />
                        </div>

                        <div className="mb-2 row">
                          <span className="col-6">Cost(INR): </span>
                          <TextField
                            type="text"
                            className="col-6"
                            name="cost"
                            onChange={formik.handleChange}
                            autoComplete="off"
                            id="outlined-basic"
                            // variant="outlined"
                            value={formik.values.cost}
                            error={
                              formik.touched.cost && Boolean(formik.errors.cost)
                            }
                            helperText={
                              formik.touched.cost && formik.errors.cost
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <div className="mb-3">
                      <span>PM Time(min): </span>
                      <TextField
                        type="text"
                        className="col-8"
                        name="pmTime"
                        autoComplete="off"
                        value={formik.values.pmTime}
                        onChange={formik.handleChange}
                        error={
                          formik.touched.pmTime && Boolean(formik.errors.pmTime)
                        }
                        helperText={
                          formik.touched.pmTime && formik.errors.pmTime
                        }
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <span>Supporting TM: </span>

                      <Multiselect
                        displayValue="tm_name"
                        options={supportingTMList} // Options to display in the dropdown
                        // selectedValues={departmentList} // Preselected value to persist in dropdown
                        onSelect={async (selectedList) => {
                          await setSelectedSupportedTM(selectedList);
                        }} // Function will trigger on select event
                        onRemove={async (selectedList) => {
                          await setSelectedSupportedTM(selectedList);
                        }} // Function will trigger on remove event
                        style={{
                          optionContainer: {
                            maxHeight: "8rem",
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              ""
            )}
            <div className="row pt-2">
              <button type="submit" className="btn-primary1">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default WorkOnSkipPM;
