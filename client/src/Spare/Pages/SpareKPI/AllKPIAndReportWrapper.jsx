import React, { useState, useMemo } from "react";
import { Container } from "react-bootstrap";
import SpareTitlebar from "../../Component/SpareTitlebar";

import YearAndMonthFilter, {
  initialState,
} from "../../Component/Common/YearAndMonthFilter";

const NO_YEAR_AND_MONTH = {};
const NO_FILTER = { selectedYear: "", selectedMonth: "" };

const AllKPIAndReportWrapper = ({
  title = "Spare KPI",
  PropComp,
  isDefaultSelectedMonth = false,
  otherParentProps = {},
  // For pages whose figures are not tied to a year or month: no filter is
  // drawn and the page is handed no year or month to filter by.
  hideYearAndMonthFilter = false,
  // Opens with no year or month chosen, so the page loads everything and only
  // narrows once the reader picks a filter. Reset returns to that too.
  noDefaultFilter = false,
}) => {
  /**
   * The state the page opens on, and the one Reset returns to.
   *
   * Reset used to fall back to initialState() with no argument, dropping the
   * default month a page like MTD R & M Plan Vs Actual asks for: the page
   * opened on the current month, but Reset emptied it. One memoised value
   * serves both, so Reset always means "back to how this page opened".
   */
  const initialFilter = useMemo(
    () => (noDefaultFilter ? NO_FILTER : initialState(isDefaultSelectedMonth)),
    [noDefaultFilter, isDefaultSelectedMonth],
  );

  const [yearAndMonth, setYearAndMonth] = useState(initialFilter);

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
          hideYearAndMonthFilter ? undefined : (
            <YearAndMonthFilter
              {...yearAndMonth}
              setYearAndMonth={setYearAndMonth}
              resetTo={initialFilter}
              yearFiltration
              {...filterProps}
            />
          )
        }
      />
      <PropComp
        yearAndMonth={hideYearAndMonthFilter ? NO_YEAR_AND_MONTH : yearAndMonth}
        {...otherParentProps}
      />
    </Container>
  );
};

export default AllKPIAndReportWrapper;
