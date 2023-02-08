import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "reactstrap";
import { fetchFinancialYears } from "../../../Integration/APIExports";

const YearDropDownForMainDashboard = ({ selectedYear, setSelectedYear }) => {
  const [financialYear, setFinancialYear] = useState();

  let current_year =
    new Date().getMonth() <= 3
      ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
      : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  useEffect(() => {
    // fetchFinancialYears()
    fetchFinancialYears().then((result) =>
      setFinancialYear(result.financialYears)
    );
  }, []);

  return (
    <Row className="p-1 ">
      <span>
        <b>Year: &nbsp;</b>
        <select
          class="form-select form-select-sm"
          aria-label=".form-select-sm example"
          style={{ width: "70%" }}
          id="standard-select-currency"
          name="selectedPlant"
          value={selectedYear ? selectedYear : current_year}
          className="textField"
          onChange={(e) => {
            setSelectedYear(e.target.value);
          }}
          // fullWidth
          select // label="Select"
          autoComplete="off"
          variant="standard"
        >
          <option selected disabled value="">
            Please select
          </option>
          {financialYear?.map((option) => {
            return <option value={option}>{option}</option>;
          })}
        </select>
      </span>
    </Row>
  );
};

export default YearDropDownForMainDashboard;
