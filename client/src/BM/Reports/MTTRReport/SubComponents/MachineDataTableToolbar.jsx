import { Box, Button, ButtonGroup, Paper } from "@mui/material";
import React from "react";
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

const sections = ["Oliver", "Van", "April", "Ralph", "Omar"];
const products = ["Oliver", "Van", "April", "Ralph", "Omar"];
const lines = ["Oliver", "Van", "April", "Ralph", "Omar"];
const machines = ["Oliver", "Van", "April", "Ralph", "Omar"];

function getStyles(name, personName, theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const MachineDataTableToolbar = () => {
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
    <Paper
      variant="outlined"
      className="col-auto"
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <FormControl size="small">
        <Select
          displayEmpty
          value={personName}
          onChange={handleChange}
          input={<OutlinedInput />}
          renderValue={(selected) => {
            if (selected.length === 0) {
              return <em>Sections</em>;
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
            <em>Sections</em>
          </MenuItem>
          {sections.map((name) => (
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

      <FormControl size="small">
        <Select
          displayEmpty
          value={personName}
          onChange={handleChange}
          input={<OutlinedInput />}
          renderValue={(selected) => {
            if (selected.length === 0) {
              return <em>Products</em>;
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
            <em>Products</em>
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

      <FormControl size="small">
        <Select
          displayEmpty
          value={personName}
          onChange={handleChange}
          input={<OutlinedInput />}
          renderValue={(selected) => {
            if (selected.length === 0) {
              return <em>Line</em>;
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
            <em>Line</em>
          </MenuItem>
          {lines.map((name) => (
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

      <FormControl size="small">
        <Select
          displayEmpty
          value={personName}
          onChange={handleChange}
          input={<OutlinedInput />}
          renderValue={(selected) => {
            if (selected.length === 0) {
              return <em>Machine</em>;
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
            <em>Machine</em>
          </MenuItem>
          {machines.map((name) => (
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

      <ButtonGroup
        size="small"
        disableElevation
        variant="outlined"
        aria-label="outlined button group"
      >
        <Button>Year</Button>
        <Button variant="contained">Month</Button>
      </ButtonGroup>
    </Paper>
  );
};

export default MachineDataTableToolbar;
