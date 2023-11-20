import * as React from "react";
import { useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

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

const products = ["Product 1", "Product 2", "Product 3", "Product 4", "Product 5"];

function getStyles(name, personName, theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

export default function LineSelectionDropdown() {
  const theme = useTheme();
  const [personName, setPersonName] = React.useState([]);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setPersonName(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  return (
    <FormControl
      size="small"
      sx={{ flexDirection: "row", gap: "12px", width: "100%" }}
    >
      <Select
        displayEmpty
        value={personName}
        onChange={handleChange}
        input={<OutlinedInput />}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <strong>Products</strong>;
          }

          return selected.join(", ");
        }}
        sx={{
          width: 130,
          "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
        }}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        <MenuItem disabled value="">
          <p>Products</p>
        </MenuItem>
        {products.map((name) => (
          <MenuItem
            key={name}
            value={name}
            style={getStyles(name, personName, theme)}
          >
            {name}
          </MenuItem>
        ))}
      </Select>

      <Select
        displayEmpty
        value={personName}
        onChange={handleChange}
        input={<OutlinedInput />}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <strong>Sections</strong>;
          }

          return selected.join(", ");
        }}
        sx={{
          width: 130,
          "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
        }}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        <MenuItem disabled value="">
          <p>Sections</p>
        </MenuItem>
        {products.map((name) => (
          <MenuItem
            key={name}
            value={name}
            style={getStyles(name, personName, theme)}
          >
            {name}
          </MenuItem>
        ))}
      </Select>

      <Select
        displayEmpty
        value={personName}
        onChange={handleChange}
        input={<OutlinedInput />}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <strong>Line</strong>;
          }

          return selected.join(", ");
        }}
        sx={{
          width: 130,
          "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
        }}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        <MenuItem disabled value="">
          <p>Line</p>
        </MenuItem>
        {products.map((name) => (
          <MenuItem
            key={name}
            value={name}
            style={getStyles(name, personName, theme)}
          >
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
