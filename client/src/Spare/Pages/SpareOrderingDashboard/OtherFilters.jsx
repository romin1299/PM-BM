import React, { memo } from "react";

import { Button, ButtonGroup } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import OutlinedInput from "@mui/material/OutlinedInput";

import SparePartSearchBar from "../../Component/SparePartSearchBar";

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

const pendingStageList = [
  {
    value: "All",
    label: "Filter",
  },
  {
    value: "rsHODApprovalTimeStamp",
    label: "Internal Approval",
  },
  {
    value: "rsPRSubmitByToolroomTimeStamp",
    label: "PR Generation",
  },
  {
    value: "rsPRAssignToAllBuyersTimeStamp",
    label: "PR Approval",
  },
  {
    value: "rsPOIssueToVendorTimeStamp",
    label: "PO Made",
  },
  {
    value: "rsPartReceiveTimeStamp",
    label: "Part Receipt",
  },
];

const departmentList = [
  {
    value: "All",
    label: "Department",
  },
  {
    value: "MTD",
    label: "MTD",
  },
  {
    value: "PRD",
    label: "PRD",
  },
];

const filterOptions = ["View", "Edit"];

const OtherFilters = memo(
  ({
    pendingStage,
    partRequestFor,
    mode,
    setMode,
    handleSelectOtherFilters,
    ...restFilters
  }) => {
    const theme = useTheme();

    const getStyleForSelectedValue = async (item, selectedItem) => {
      return {
        fontWeight:
          item?.value === selectedItem
            ? theme.typography.fontWeightMedium
            : theme.typography.fontWeightRegular,
      };
    };

    return (
      <div className="d-flex gap-2 justify-content-end">
        <FormControl size="small">
          <Select
            displayEmpty
            name="pendingStage"
            value={pendingStage}
            onChange={(e) =>
              handleSelectOtherFilters({ [e.target.name]: e.target.value })
            }
            input={<OutlinedInput />}
            sx={{
              width: 150,
              "& .MuiSelect-select": {
                paddingTop: "5px",
                paddingBottom: "5px",
              },
            }}
            MenuProps={MenuProps}
            inputProps={{ "aria-label": "Without label" }}
          >
            {pendingStageList.map((item) => (
              <MenuItem
                key={item?.value}
                value={item?.value}
                style={getStyleForSelectedValue(item, pendingStage)}
              >
                {item?.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <Select
            displayEmpty
            name="partRequestFor"
            value={partRequestFor}
            onChange={(e) =>
              handleSelectOtherFilters({ [e.target.name]: e.target.value })
            }
            input={<OutlinedInput />}
            sx={{
              width: 150,
              "& .MuiSelect-select": {
                paddingTop: "5px",
                paddingBottom: "5px",
              },
            }}
            MenuProps={MenuProps}
            inputProps={{ "aria-label": "Without label" }}
          >
            {departmentList.map((item) => (
              <MenuItem
                key={item?.value}
                value={item?.value}
                style={getStyleForSelectedValue(item, partRequestFor)}
              >
                {item?.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <div>
          <ButtonGroup
            size="small"
            disableElevation
            variant="outlined"
            aria-label="outlined button group"
          >
            {filterOptions?.map((item, index) => (
              <Button
                key={index}
                variant={mode === item ? "contained" : "outlined"}
                value={item}
                onClick={() => setMode(item)}
              >
                {item}
              </Button>
            ))}
          </ButtonGroup>
        </div>
        <SparePartSearchBar
          handleSelectOtherFilters={handleSelectOtherFilters}
        />
      </div>
    );
  },
);

export default OtherFilters;
