import React from "react";

import { Row, Col, Container } from "react-bootstrap";

import * as yup from "yup";
import { useFormik } from "formik";

import { TextareaAutosize } from "@mui/base";

const PopupForAnnualPmScheduleReport = ({
  month,
  close,
  selectedYear,
  lineInfo,
  allUserDropdownList,
  funForRefreshingDataAfterApproval,
}) => {
  const validationSchema = yup.object({
    delay: yup.string().required("Please select"),
    selectedHOS: yup.string().required("Please select HOS name"),

    selectedHOD: yup.string().when(["delay"], {
      is: () => formik.values.delay === "Yes",
      then: yup.string().required("Please select"),
    }),

    remarks: yup.string().when(["delay"], {
      is: () => formik.values.delay === "Yes",
      then: yup.string().required("Please enter remarks"),
    }),
  });

  const formik = useFormik({
    initialValues: {
      delay: "",
      checkedByTL: "",
      selectedHOS: "",
      selectedHOD: "",
      remarks: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      console.log(values);

      const res = await fetch(
        "/submitMonthlyApprovalRequestForAnnualPmSchedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            values,
            selectedYear,
            lineInfo,
            month,

            assignHOS: allUserDropdownList?.allUser?.[values?.selectedHOS]?._id,
            assignHOD: allUserDropdownList?.HODList?.[values?.selectedHOD]?._id,
          }),
        }
      );

      const data = res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Error");
      } else {
        console.log("Updated SuccessFully");
        funForRefreshingDataAfterApproval();
        close();
      }
    },
  });

  // console.log(allUserDropdownList);
  return (
    <>
      <div id="main_div_reg4">
        <span onClick={close} className="close">
          &times;
        </span>
        <br />

        <Container>
          <form onSubmit={formik?.handleSubmit}>
            <Row>
              <Col>
                <h4>{month}</h4>
              </Col>
            </Row>

            <Row>
              <Col className="pwd-container">
                <span>Delay:</span>
                <div>
                  <div>
                    <input
                      type="radio"
                      name="delay"
                      id="outlined-number"
                      value="Yes"
                      //   onChange={(e) => formik.handleChange(e)}
                      onChange={formik.handleChange}
                    />
                    <span
                      style={{
                        paddingLeft: "0.5rem",
                        fontWeight: "550",
                        color: "black",
                      }}
                    >
                      Yes
                    </span>

                    <input
                      type="radio"
                      name="delay"
                      id="outlined-number"
                      value="No"
                      onChange={(e) => {
                        formik.setFieldValue("selectedHOD", "");
                        formik.setFieldValue("remarks", "");

                        formik.handleChange(e);
                      }}
                    />
                    <span
                      style={{
                        paddingLeft: "0.5rem",
                        fontWeight: "550",
                        color: "black",
                      }}
                    >
                      No
                    </span>

                    {formik.touched.delay && formik.errors.delay ? (
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
                          {formik.touched.delay && formik.errors.delay}
                        </p>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            <Row>
              <Col className="pwd-container">
                <span>HOS: </span>
                <div style={{ width: "100%" }}>
                  <select
                    // class="form-select form-select-sm"
                    // aria-label=".form-select-sm example"
                    style={{ border: "2px solid gray", borderRadius: "5px" }}
                    // id="standard-select-currency"
                    id="outlined-number"
                    name="selectedHOS"
                    className="textField mt-1"
                    // fullWidth
                    select // label="Select"
                    autoComplete="off"
                    value={formik.values.selectedHOS}
                    onChange={formik.handleChange}
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {allUserDropdownList?.allUser?.map((option, index) =>
                      option?.user_type === "Section-Admin" &&
                      option?.tm_grade === "HOS" &&
                      option?.tm_department === "MTD" ? (
                        <option value={index}>{option?.tm_name}</option>
                      ) : (
                        ""
                      )
                    )}
                  </select>
                  <br />
                  {formik.touched.selectedHOS && formik.errors.selectedHOS ? (
                    <div>
                      <p
                        style={{
                          color: "#F44336",
                          fontWeight: "normal",
                          fontSize: "0.80rem",
                          float: "left",
                          paddingTop: "0.5rem",
                          paddingLeft: "1rem",
                        }}
                      >
                        {formik.touched.selectedHOS &&
                          formik.errors.selectedHOS}
                      </p>
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              </Col>
            </Row>

            {formik?.values?.delay === "Yes" ? (
              <>
                <Row>
                  <Col className="pwd-container">
                    <span>HOD: </span>
                    <div style={{ width: "100%" }}>
                      <select
                        // class="form-select form-select-sm"
                        // aria-label=".form-select-sm example"
                        style={{
                          border: "2px solid gray",
                          borderRadius: "5px",
                        }}
                        // id="standard-select-currency"
                        id="outlined-number"
                        name="selectedHOD"
                        className="textField mt-1"
                        fullWidth
                        select // label="Select"
                        autoComplete="off"
                        value={formik.values.selectedHOD}
                        onChange={formik.handleChange}
                        variant="standard"
                      >
                        <option selected disabled value="">
                          Please select
                        </option>
                        {allUserDropdownList?.HODList?.map((option, index) =>
                          option?.user_type === "Plant-Admin" &&
                          option?.tm_grade === "HOD" &&
                          option?.tm_department === "MTD" ? (
                            <option value={index}>{option?.tm_name}</option>
                          ) : (
                            ""
                          )
                        )}
                      </select>
                      {formik.touched.selectedHOD &&
                      formik.errors.selectedHOD ? (
                        <div>
                          <p
                            style={{
                              color: "#F44336",
                              fontWeight: "normal",
                              fontSize: "0.80rem",
                              float: "left",
                              paddingTop: "0.5rem",
                              paddingLeft: "1rem",
                            }}
                          >
                            {formik.touched.selectedHOD &&
                              formik.errors.selectedHOD}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col className="pwd-container">
                    <span>Remarks:</span>
                    <div style={{ width: "100%" }}>
                      <TextareaAutosize
                        id="outlined-number"
                        name="remarks"
                        className="textField"
                        value={formik.values.remarks}
                        onChange={formik.handleChange}
                        autoComplete="off"
                        // label="Number"
                        type="text"
                        fullWidth
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                      <div>
                        <p
                          style={{
                            color: "#F44336",
                            fontWeight: "normal",
                            fontSize: "0.80rem",
                            float: "left",
                            paddingTop: "0.5rem",
                            paddingLeft: "1rem",
                          }}
                        >
                          {formik.touched.remarks && formik.errors.remarks}
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </>
            ) : (
              ""
            )}

            <Row xs="auto">
              <Col>
                <button type="submit" className="btn-primary1">
                  Check and Send For Approval
                </button>
              </Col>
            </Row>
          </form>
        </Container>
      </div>
    </>
  );
};

export default PopupForAnnualPmScheduleReport;
