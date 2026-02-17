import React from "react";
import { tmGrade } from "../../../utils/users";

const TMGradeDropdown = ({ formik }) => {
  return (
    <div className="pwd-container">
      <span>TM Grade:</span>
      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <select
          class="form-select form-select-sm"
          aria-label=".form-select-sm example"
          style={{ width: "100%" }}
          id="standard-select-currency"
          name="tm_grade"
          className="textField"
          fullWidth
          select
          autoComplete="off"
          onChange={formik.handleChange}
          variant="standard"
        >
          <option selected disabled value="">
            Please select
          </option>
          {tmGrade?.map((option) => {
            return <option value={option.label}>{option.value}</option>;
          })}
        </select>
      </div>
    </div>
  );
};

export default TMGradeDropdown;
