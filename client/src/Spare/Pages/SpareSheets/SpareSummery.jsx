import React, { useMemo, memo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import WithLoadingAndError from "../../Component/Common/WithLoadingAndError";

const DEFAULT_INITIAL_STATE = {
  isLoading: true,
  isError: false,
  data: {
    counters: {
      totalParts: 0,
      completedProcessParts: 0,
      pendingParts: 0,
    },
  },
};

const SpareSummaryView = memo(({ counters }) => {
  const items = useMemo(
    () => [
      {
        title: "Total Parts",
        value: counters?.totalParts,
        backgroundColor: "#c7defb",
      },
      {
        title: "Open Parts",
        // title: "Open / Pending Parts",
        value: counters?.pendingParts,
        backgroundColor: "#feb4b4ba",
      },
      {
        title: "Closed Parts",
        value: counters?.completedProcessParts,
        backgroundColor: "#c6efce",
      },
    ],
    [counters],
  );

  return (
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
  );
});

const SpareSummery = memo(
  ({
    apiReferencePropsBasedOnFilters = {
      params: {},
      referenceArrayForUseEffect: [],
    },
  }) => {
    const requestProps = useMemo(
      () => ({
        url: "/v1/spare/spareRequestSheet/summery",
        axiosConfig: {
          params: apiReferencePropsBasedOnFilters?.params,
        },
        referenceArrayForUseEffect:
          apiReferencePropsBasedOnFilters?.referenceArrayForUseEffect,
        initialState: DEFAULT_INITIAL_STATE,
      }),
      [apiReferencePropsBasedOnFilters],
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
