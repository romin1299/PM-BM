import React, { useMemo, useCallback, memo } from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";
import { Button } from "@mui/material";
import currentMonth from "../../../pages/Dashboard/DashboardComponent/currentMonth";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 130,
    },
  },
};

const SELECT_SX = {
  width: 130,
  "& .MuiSelect-select": {
    paddingTop: "5px",
    paddingBottom: "5px",
  },
};

const Months = [
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

const getStyleForSelectedValue = async (item, selectedItem, purpose) => {
  return {
    fontWeight: item === selectedItem ? 500 : 400,
  };
};

export const getDefaultFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() < 3 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
};

export const initialState = (isDefaultSelectedMonth = false) => ({
  selectedYear: getDefaultFinancialYear(),
  selectedMonth: isDefaultSelectedMonth ? currentMonth : "",
});

const renderYearValue = (value) => value || "Year";
const renderMonthValue = (value) => value || "Month";

const YearFilter = memo(({ selectedYear, handleChange }) => {
  const [{ isLoading, data }] = useSafeGetRequest({
    url: "/getFinancialYearsDropdownValue",
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        getFinancialYearsArray: {
          financialYears: [],
        },
      },
    },
  });

  const menuItems = useMemo(
    () =>
      data?.getFinancialYearsArray?.financialYears?.map((item) => ({
        item,
        style: getStyleForSelectedValue(item, selectedYear, "for-array-value"),
      })) ?? [],
    [data, selectedYear],
  );

  const handleSelectChange = useCallback(
    (e) => handleChange({ selectedYear: e.target.value }),
    [handleChange],
  );

  if (isLoading) return <h5>Loading...</h5>;

  return (
    <FormControl size="small">
      <Select
        displayEmpty
        value={selectedYear}
        onChange={handleSelectChange}
        input={<OutlinedInput />}
        sx={SELECT_SX}
        renderValue={renderYearValue}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        {menuItems?.map(({ item, style }) => (
          <MenuItem key={item} value={item} style={style}>
            {item}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

export const MonthFilter = memo(({ selectedMonth, handleChange }) => {
  const handleSelectChange = useCallback(
    (e) => handleChange({ selectedMonth: e.target.value }),
    [handleChange],
  );

  const menuItems = useMemo(
    () =>
      Months.map((item) => ({
        item,
        style: getStyleForSelectedValue(item, selectedMonth),
      })),
    [selectedMonth],
  );

  return (
    <FormControl size="small">
      <Select
        displayEmpty
        value={selectedMonth}
        onChange={handleSelectChange}
        input={<OutlinedInput />}
        sx={SELECT_SX}
        renderValue={renderMonthValue}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        {menuItems.map(({ item, style }) => (
          <MenuItem key={item} value={item} style={style}>
            {item}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

const ResetFilter = memo(({ handleChange }) => {
  const handleReset = useCallback(
    (e) => handleChange({ reset: true }),
    [handleChange],
  );

  return (
    <Button
      variant="contained"
      size="small"
      disableElevation
      className="bg-button"
      onClick={handleReset}
    >
      Reset
    </Button>
  );
});

const YearAndMonthFilter = ({
  yearFiltration,
  monthFiltration,
  resetButtonFiltration,

  selectedYear = "",
  selectedMonth = "",
  setYearAndMonth,
}) => {
  const handleChange = useCallback(
    (next) => {
      setYearAndMonth((prev) =>
        next?.reset ? initialState() : { ...prev, ...next },
      );
    },
    [setYearAndMonth],
  );

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      {yearFiltration && (
        <YearFilter selectedYear={selectedYear} handleChange={handleChange} />
      )}

      {monthFiltration && (
        <MonthFilter
          selectedMonth={selectedMonth}
          handleChange={handleChange}
        />
      )}

      {resetButtonFiltration && <ResetFilter handleChange={handleChange} />}
    </div>
  );
};

export default YearAndMonthFilter;
