import {
  Box,
  FormControl,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { fetchFinancialYears } from "../../../Integration/APIExports";
import { MONTH_LABELS } from "../../Utils/ChartUtils/chartEnums";

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

const YearMonthDropdown = ({ selectedFilters, setSelectedFilters }) => {
  const [financialYears, setFinancialYears] = useState([]);

  const fetchFYYearData = async () => {
    const { financialYears } = await fetchFinancialYears();
    setFinancialYears(financialYears);
  };

  useEffect(() => {
    fetchFYYearData();
  }, []);

  function handleYearSelect(event) {
    setSelectedFilters((prev) => ({ ...prev, year: event.target.value }));
  }
  function handleMonthSelect(event) {
    setSelectedFilters((prev) => ({ ...prev, month: event.target.value }));
  }

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <FormControl>
        <Select
          displayEmpty
          value={selectedFilters?.year}
          onChange={handleYearSelect}
          input={<OutlinedInput />}
          sx={{
            width: 130,
            "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
          }}
          renderValue={(value) => {
            if (value) return value;
            return "Year";
          }}
          inputProps={{ "aria-label": "Without label" }}
          MenuProps={MenuProps}
        >
          {financialYears.map((item) => (
            <MenuItem key={item} value={item} style={{}}>
              {item}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <Select
          displayEmpty
          value={selectedFilters.month}
          onChange={handleMonthSelect}
          input={<OutlinedInput />}
          sx={{
            width: 130,
            "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
          }}
          renderValue={(value) => {
            if (value) return value;
            return "Month";
          }}
          inputProps={{ "aria-label": "Without label" }}
          MenuProps={MenuProps}
        >
          {MONTH_LABELS.map((item) => (
            <MenuItem key={item} value={item} style={{}}>
              {item}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default YearMonthDropdown;
