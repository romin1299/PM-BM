import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import Tooltip from "@mui/material/Tooltip";

export const FilterMenu = ({ DropdownValue, handleResetData }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(DropdownValue);

  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (selectedFilter) => {
    setSelectedFilter(selectedFilter);
    setAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const filterOptions = ["hour", "today", "week", "month", "year"];

  useEffect(() => {
    setSelectedFilter(DropdownValue);
  }, [DropdownValue]);

  const resetFilters = () => {
    setSelectedFilter("");
    // Call the handleResetData function when resetting the filter
    handleResetData();
    setAnchorEl(null); // Close the menu after resetting
  };

  return (
    <div>
      <Tooltip title="Time Filters">
        <Button
          id="filter-button"
          aria-label="more"
          aria-haspopup="true"
          aria-controls={open ? "filter-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          sx={{ minWidth: "auto" }}
          onClick={handleMenuClick}
        >
          <FilterAltIcon
          // style={{ color: "white" }}
          />
        </Button>
      </Tooltip>
      <Menu
        id="filter-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => resetFilters()}>
          <em>Reset</em>
        </MenuItem>

        {filterOptions.map((option) => (
          <MenuItem
            key={option}
            selected={option === selectedFilter}
            onClick={() => handleMenuItemClick(option)}
            className="chart-menu"
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};
