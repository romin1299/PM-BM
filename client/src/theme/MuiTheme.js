import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  components: {
    MuiTable: {
      styleOverrides: {
        root: {
          "& .MuiIconButton-root:not(:disabled)": {
            color: "#004b5b",
          },
          "& .MuiTableCell-head": {
            color: "#000000",
          },
        },
      },
    },
  },
});
