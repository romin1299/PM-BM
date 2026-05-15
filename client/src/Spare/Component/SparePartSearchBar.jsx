import React, { memo, useState, useEffect } from "react";
import { TextField } from "@mui/material";

import useDebounce from "../../CustomHooks/useDebounce";

const SparePartSearchBar = memo(({ handleSelectOtherFilters }) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    handleSelectOtherFilters({
      search: debouncedQuery,
    });
  }, [debouncedQuery, handleSelectOtherFilters]);

  return (
    <TextField
      size="small"
      placeholder="Search..."
      name="query"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      sx={{
        width: 200,
        "& .MuiInputBase-input": {
          paddingTop: "5px",
          paddingBottom: "5px",
        },
      }}
    />
  );
});

export default SparePartSearchBar;
