import React, { useState, useMemo } from "react";
import { Container } from "react-bootstrap";
import SpareTitlebar from "../../Component/SpareTitlebar";

import YearAndMonthFilter, {
  initialState,
} from "../../Component/Common/YearAndMonthFilter";

const AllKPIAndReportWrapper = ({
  title = "Spare KPI",
  PropComp,
  isDefaultSelectedMonth = false,
  otherParentProps = {},
}) => {
  const [yearAndMonth, setYearAndMonth] = useState(
    initialState(isDefaultSelectedMonth),
  );

  const filterProps = useMemo(() => {
    if (otherParentProps?.componentFor === "eachCellWiseBifurcation") return {};
    return {
      monthFiltration: true,
      resetButtonFiltration: true,
    };
  }, [otherParentProps]);

  return (
    <Container fluid>
      <SpareTitlebar
        title={title}
        Toolbar={
          <YearAndMonthFilter
            {...yearAndMonth}
            setYearAndMonth={setYearAndMonth}
            yearFiltration
            {...filterProps}
          />
        }
      />
      <PropComp yearAndMonth={yearAndMonth} {...otherParentProps} />
    </Container>
  );
};

export default AllKPIAndReportWrapper;
