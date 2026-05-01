import React, { useMemo, memo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import WithLoadingAndError from "../../Component/Common/WithLoadingAndError";

const DEFAULT_INITIAL_STATE = {
  isLoading: true,
  isError: false,
  data: {
    counters: {
      totalRequestSheet: 0,
      openRequestSheet: 0,
      closedRequestSheet: 0,
    },
  },
};

const SpareSummaryView = memo(({ counters }) => {
  const items = useMemo(
    () => [
      {
        title: "Total Requests",
        value: counters?.totalRequestSheet,
        backgroundColor: "#c7defb",
      },
      {
        title: "Open Requests",
        value: counters?.openRequestSheet,
        backgroundColor: "#feb4b4ba",
      },
      {
        title: "Closed Requests",
        value: counters?.closedRequestSheet,
        backgroundColor: "#c6efce",
      },
    ],
    [counters],
  );

  return (
    <Box className="cell p-2 rounded-2">
      <div className="d-flex gap-2">
        {items?.map((item, index) => (
          <Box key={index} className="col-auto">
            <Paper
              variant="outlined"
              sx={{
                backgroundColor: item.backgroundColor,
                p: "4px",
                px: "10px",
                borderRadius: "8px",
              }}
            >
              <Typography textAlign="center" fontWeight={500}>
                {item.title}
              </Typography>

              <Typography textAlign="center" fontWeight={600}>
                {item.value}
              </Typography>
            </Paper>
          </Box>
        ))}
      </div>
    </Box>
  );
});

const SpareSummery = memo(
  ({ flagForTogglingFilter, selectedValue, selectedYear }) => {
    const requestProps = useMemo(
      () => ({
        url: "/v1/spare/spareRequestSheet/summery",
        axiosConfig: {
          params: {
            flagForTogglingFilter,
            selectedValue,
            selectedYear,
          },
        },
        referenceArrayForUseEffect: [
          flagForTogglingFilter,
          selectedValue,
          selectedYear,
        ],
        initialState: DEFAULT_INITIAL_STATE,
      }),
      [flagForTogglingFilter, selectedValue, selectedYear],
    );

    return (
      <WithLoadingAndError
        requestProps={requestProps}
        PropComponent={SpareSummaryView}
      />
    );
  },
);

export default SpareSummery;
