import React, { useState } from "react";
import { Box, Button, InputAdornment, TextField } from "@mui/material";

const TopLimit = ({ handleSetParentLimit }) => {
  const [limit, setLimit] = useState(10);

  return (
    <div className="col-auto">
      <Box
        component="form"
        sx={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <TextField
          type="number"
          id="outlined-basic"
          variant="outlined"
          sx={{
            width: "6rem",
            pl: 0,
            "& .MuiOutlinedInput-root": { pl: 0 },
            "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
          }}
          InputProps={{
            sx: { fontSize: 14 },
            startAdornment: (
              <InputAdornment position="start">TOP</InputAdornment>
            ),
          }}
          size="small"
          onChange={(e) => {
            setLimit(e.target.value);
          }}
          value={limit}
        />
        <Button
          // size="small"
          disableElevation
          className="bg-button"
          variant="contained"
          sx={{
            minWidth: "30px",
            height: "32px",
            paddingInline: "10px",
          }}
          onClick={() => {
            handleSetParentLimit(limit);
          }}
        >
          Go
        </Button>
      </Box>
    </div>
  );
};

export default TopLimit;
