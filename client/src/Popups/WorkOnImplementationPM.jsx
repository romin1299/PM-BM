import React, { useEffect, useState } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { Select } from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import axios from "axios";
import { Col, Row } from "react-bootstrap";

function WorkOnImplementationPM({
  close,
  disabledButtonAfterPM,
  tableRowId,
  tableRowIdForSrNo,
  yearOfCheckSheet,
  machineId,
  monthForCompareSystemMonth,
  previousMonth,
  functionToSetRefKey,
  inceptionValueForLogHistory,
  machineAllData,
  refKeyForScheduleMonthInLogHistory,
  remarksCompulsoryOrNot,
}) {
  const [workedData, setWorkedData] = useState([]);
  const [userPhoto, setUserPhoto] = useState([]);

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
    spareParts: yup.string().when({
      is: () =>
        formik.values.workedOnPM === "Rectify" ||
        formik.values.workedOnPM === "No",
      then: yup.string().required("Please select spare part option"),
    }),
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

  const formik = useFormik({
    initialValues: {
      workedOnPM: "",
      remarksOfImplementation: "",

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
      let completionDateOfInspection = timeStamp();

      let formData = new FormData();
      formData.append("photoUpload", userPhoto);
      formData.append("workedOnPM", values.workedOnPM);
      formData.append(
        "remarksOfImplementation",
        values.remarksOfImplementation
      );
      formData.append("machineId", machineId);
      formData.append("tableRowId", tableRowId);
      formData.append("yearOfCheckSheet", yearOfCheckSheet);
      formData.append("monthForCompareSystemMonth", monthForCompareSystemMonth);
      formData.append("previousMonth", previousMonth);
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
      formData.append("completionDateOfInspection", completionDateOfInspection);
      // console.log(formData);

      axios
        .post("/postImplementationWorkedData", formData)
        .then((res) => {
          if (res.status === 400 || res.status === 422) {
            window.alert("Invalid !");
          } else {
            console.log("Submitted Successfully...");
            postNewLogHistory();
            // disabledButtonAfterPM(tableRowId, true);
            close();
            functionToSetRefKey();
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

  const postNewLogHistory = async () => {
    const res = await fetch("/submitLogHistory", {
      method: "Post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        yearOfCheckSheet,
        values: formik?.values,

        inceptionValueForLogHistory,
        completionDateOfInspection: timeStamp(),
        refKeyForScheduleMonthInLogHistory,
        machineAllData,
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

  const clearState = () => {
    formik.values.remarksOfImplementation = "";
    formik.values.abnormalityRemarks = "";
    formik.values.spareParts = "";
    formik.values.partName = "";
    formik.values.partNo = "";
    formik.values.cost = "";
  };

  return (
    <>
      <div id="main_div_reg5">
        <span onClick={close} className="close">
          &times;
        </span>

        {/* <button onClick={postNewLogHistory}>functionCall</button> */}
        <div>
          <h4 style={{ textAlign: "left", color: "#dc3545" }}>
            Work on Implementation
          </h4>
          <br />
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
            <Row className="row flex justify-content-center">
              <Col sm={12} md={6} lg={4} className="mb-2 d-flex col-4">
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
              </Col>
              <Col sm={12} md={6} lg={4} className="mb-2 d-flex col-4">
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
              </Col>

              <Col sm={12} md={6} lg={4} className="col-4 mb-2 d-flex">
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
              </Col>

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
            </Row>

            {formik.values.workedOnPM === "Yes" ? (
              <div>
                {remarksCompulsoryOrNot === "Yes" && (
                  <div className="mb-3">
                    <span>Input Only Value: </span>
                    <input
                      type="text"
                      // maxLength={5}
                      // id={rData[0].value}
                      name="remarksOfImplementation"
                      onChange={formik.handleChange}
                    />
                  </div>
                )}
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
              </div>
            ) : formik.values.workedOnPM === "No" ||
              formik.values.workedOnPM === "Rectify" ? (
              <div>
                <div className="mb-3">
                  <span>Remarks: </span>
                  <input
                    type="text"
                    // maxLength={5}
                    // id={rData[0].value}
                    name="remarksOfImplementation"
                    onChange={formik.handleChange}
                    autoComplete="off"
                  />
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
                        value={tableRowIdForSrNo}
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
                      <div>
                        <p
                          style={{
                            color: "#F44336",
                            fontWeight: "normal",
                            fontSize: "0.80rem",
                            float: "left",
                            paddingTop: "0.5rem",
                          }}
                        >
                          {formik.touched.spareParts &&
                            formik.errors.spareParts}
                        </p>
                      </div>
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
              </div>
            ) : (
              ""
            )}
            <div className="row pt-2 d-flex justify-content-center align-items-center">
              <button type="submit" className="btn-primary1 w-25">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default WorkOnImplementationPM;
