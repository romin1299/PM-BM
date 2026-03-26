import {
  Box,
  FormControl,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { fetchFinancialYears } from "../../../Integration/APIExports";

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

const YearDropdown = ({ selectedYear, setSelectedYear }) => {
  const [financialYears, setFinancialYears] = useState([selectedYear]);

  const fetchFYYearData = async () => {
    const { financialYears } = await fetchFinancialYears();
    setFinancialYears(financialYears);
  };

  useEffect(() => {
    fetchFYYearData();
  }, []);

  useEffect(() => {
    // console.log("financialYears:", financialYears);
    setSelectedYear(financialYears[financialYears.length-1])
  }, [financialYears]);

  return (
    <Box
      className="col-auto"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <FormControl>
        <Select
          displayEmpty
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(e.target.value);
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
    </Box>
  );
};

export default YearDropdown;
