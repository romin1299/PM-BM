import { Button, ButtonGroup } from "@mui/material";
import React from "react";

const FilterSwitchButtons = ({ filter, setFilter, filterState }) => {
  let filterMaker = {
    plant: "section",
    section: "cell",
    subSection: "cell",
    cell: "line",
    line: "machine",
  };

  let [, , currFilterState] = filterState?.flagForTogglingFilter?.split("-");
  const filterOptions = ["hourly", filterMaker?.[currFilterState] || ""];

  // console.log("currFilterState:", currFilterState);
  React.useEffect(() => {
    if (currFilterState === "plant") setFilter(filterOptions[0]);
    else setFilter(filterMaker?.[currFilterState]);
  }, [currFilterState]);

  const handleSelect = (event) => {
    // console.log("event.target.value:", event.target.value);
    setFilter(event.target.value);
  };

  return (
    <ButtonGroup
      size="small"
      disableElevation
      variant="outlined"
      aria-label="outlined button group"
    >
      {filterOptions?.map((item, index) => (
        <Button
          key={index}
          variant={filter === item ? "contained" : "outlined"}
          value={item}
          onClick={handleSelect}
        >
          {item}
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default FilterSwitchButtons;
