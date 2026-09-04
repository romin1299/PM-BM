import React, { useMemo } from "react";
import WithLoadingAndError from "../../Component/Common/WithLoadingAndError";
import { Box, Typography, Paper, Stack, Divider } from "@mui/material";

const DEFAULT_INITIAL_STATE = {
  isLoading: true,
  isError: false,
  data: {
    counters: [],
  },
};

const MapComponent = ({ counters }) => {
  return counters?.map(({ title, value }, index) => (
    <React.Fragment key={index}>
      <Box
        sx={{
          flex: "1 1 0",
          minWidth: 120,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#c7defb",
            py: "8px",
            px: "12px",
            borderRadius: "10px",
            textAlign: "center",
            height: "100%",
            boxSizing: "border-box",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
            },
          }}
        >
          <Typography
            noWrap
            sx={{
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#2c4a63",
              letterSpacing: "0.2px",
              textTransform: "uppercase",
            }}
          >
            {title}
          </Typography>

          <Typography
            noWrap
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#0d2b40",
              mt: "2px",
            }}
          >
            {value?._id
              ? `${value?.availableQty} Parts | ${value?.costInINR} Mil`
              : value}
          </Typography>
        </Paper>
      </Box>
    </React.Fragment>
  ));
};

export const LoadSummeryData = ({
  url = "/v1/spare/kpi/summery/inventory",
  selectedYear,
  selectedMonth,
  withHoldingRation = "No",
  machineCost = 1,
}) => {
  const requestProps = useMemo(
    () => ({
      url,
      axiosConfig: {
        params: { selectedYear, selectedMonth, withHoldingRation },
      },
      referenceArrayForUseEffect: [selectedYear, selectedMonth],
      initialState: DEFAULT_INITIAL_STATE,
    }),
    [url, selectedYear, selectedMonth, withHoldingRation],
  );

  return (
    <WithLoadingAndError
      requestProps={requestProps}
      PropComponent={MapComponent}
    />
  );
};

const KPIRow1 = (props) => {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      divider={
        <Divider orientation="vertical" flexItem sx={{ opacity: 0.4 }} />
      }
      sx={{
        mt: 3,
        p: 1,
        overflowX: "auto",
        alignItems: "stretch",
        "&::-webkit-scrollbar": {
          height: "6px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#b0c4d4",
          borderRadius: "10px",
        },
      }}
    >
      <LoadSummeryData {...props} withHoldingRation="Yes" />
      <LoadSummeryData {...props} url="/v1/spare/kpi/summery/requestSheet" />
    </Stack>
  );
};

export default KPIRow1;
