import React from "react";
import SparePartSearchBar from "../../Component/SparePartSearchBar";

const OtherFiltersIssuance = ({ handleSelectOtherFilters }) => {
  return (
    <>
      <div>
        <input
          type="date"
          onChange={(e) => handleSelectOtherFilters({ from: e.target.value })}
        />
        &nbsp;
        <input
          type="date"
          onChange={(e) => handleSelectOtherFilters({ to: e.target.value })}
        />
      </div>
      <SparePartSearchBar handleSelectOtherFilters={handleSelectOtherFilters} />
    </>
  );
};

export default OtherFiltersIssuance;
