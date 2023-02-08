import React, { useState } from "react";
import { Row, Col } from "reactstrap";

const MonthDropDown = ({ selectedMonth, setSelectedMonth }) => {
  const monthKeyArray = [
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];

  return (
    <>
    <span><b>Month:&nbsp; &nbsp;</b></span>
        <select
            class="form-select form-select-sm"
            aria-label=".form-select-sm example"
            style={{ width: "50%" }}
            id="standard-select-currency"
            name="selectedPlant"
            className="textField"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            // fullWidth
            select // label="Select"
            autoComplete="off"
            variant="standard"
          >
            <option selected disabled value="">
              Please select
            </option>
            {monthKeyArray?.map((option) => {
              return <option value={option}>{option}</option>;
            })}
          </select>
    </>
  );
};

export default MonthDropDown;
