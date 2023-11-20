import { Checkbox, FormControlLabel } from "@mui/material";

export const CountFilters = ({ filterOptions, handleCheckboxChange }) => {
  return (
    <>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={filterOptions.lessThan60}
            onChange={() => handleCheckboxChange("lessThan60")}
          />
        }
        label="< 60"
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={filterOptions.lessThan120}
            onChange={() => handleCheckboxChange("lessThan120")}
          />
        }
        label="< 120"
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={filterOptions.greaterThan120}
            onChange={() => handleCheckboxChange("greaterThan120")}
          />
        }
        label="> 120"
      />
    </>
  );
};
