import {
  Box,
  FormControl,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { fetchFinancialYears } from "../../../Integration/APIExports";
import { MONTH_LABELS } from "../../Utils/ChartUtils/chartEnums";
import { ACTION } from "../ManHourReport/SubComponents/CommonFiltrationComponent";

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

const YearMonthDropdown = ({
  selectedYear,
  selectedMonth,
  reducerDispatch,
}) => {
  const [financialYears, setFinancialYears] = useState([selectedYear]);

  const fetchFYYearData = async () => {
    const { financialYears } = await fetchFinancialYears();
    setFinancialYears(financialYears);
  };

  useEffect(() => {
    fetchFYYearData();
    // reducerDispatch({
    //   type: ACTION.HANDLE_SELECT_YEAR,
    //   selectedYear: "",
    // });
  }, []);

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <FormControl>
        <Select
          displayEmpty
          value={selectedYear}
          onChange={(e) => {
            reducerDispatch({
              type: ACTION.HANDLE_SELECT_YEAR,
              selectedYear: e.target.value,
            });
          }}
          input={<OutlinedInput />}
          sx={{
            width: 130,
            "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
          }}
          renderValue={(value) => {
            if (value) return value;
            return "Year";
          }}
          MenuProps={MenuProps}
          inputProps={{ "aria-label": "Without label" }}
        >
          {/* <MenuItem sx={{ color: "gray" }} value="">
            <em>reset</em>
          </MenuItem> */}

          {financialYears.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <Select
          displayEmpty
          value={selectedMonth}
          onChange={(e) => {
            reducerDispatch({
              type: ACTION.HANDLE_SELECT_MONTH,
              selectedMonth: e.target.value,
            });
          }}
          input={<OutlinedInput />}
          sx={{
            width: 130,
            "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
          }}
          renderValue={(value) => {
            if (value) return value;
            return "Month";
          }}
          MenuProps={MenuProps}
          inputProps={{ "aria-label": "Without label" }}
        >
          <MenuItem sx={{ color: "gray" }} value="">
            <em>reset</em>
          </MenuItem>

          {MONTH_LABELS.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default YearMonthDropdown;
