import { Button, ButtonGroup } from "@mui/material";
import React from "react";

const FilterSwitchButtons = ({ filter, setFilter, currentTabViewName }) => {
  const handleSelect = (event) => {
    // console.log("event.target.value:", event.target.value);
    setFilter(event.target.value);
  };

  const filterOptions = [
    {
      key: "hourly",
      name: "Hourly",
    },
    {
      key: currentTabViewName === "Plant" ? "section" : "cell",
      name: currentTabViewName === "Plant" ? "Section" : "Cell",
    },
  ];

  React.useEffect(() => {
    setFilter(filterOptions[0]?.key);
  }, []);

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
          variant={filter === item.key ? "contained" : "outlined"}
          value={item.key}
          onClick={handleSelect}
        >
          {item.name}
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default FilterSwitchButtons;
