import React, { useMemo, memo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import WithLoadingAndError from "../../Component/Common/WithLoadingAndError";

const DEFAULT_INITIAL_STATE = {
  isLoading: true,
  isError: false,
  data: {
    counters: {
      total: 0,
      closed: 0,
      pending: 0,
    },
  },
};

const SpareSummaryView = memo(({ counters, titles }) => {
  const items = useMemo(
    () => [
      {
        title: titles[0],
        value: counters?.total,
        backgroundColor: "#c7defb",
      },
      {
        title: titles[1],
        // title: "Open / Pending Parts",
        value: counters?.pending,
        backgroundColor: "#feb4b4ba",
      },
      {
        title: titles[2],
        value: counters?.closed,
        backgroundColor: "#c6efce",
      },
    ],
    [counters, titles],
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
    url = "/v1/spare/spareRequestSheet/summery",
    titles = ["Total Parts", "Open Parts", "Closed Parts"],
  }) => {
    const requestProps = useMemo(
      () => ({
        url,
        axiosConfig: {
          params: apiReferencePropsBasedOnFilters?.params,
        },
        referenceArrayForUseEffect:
          apiReferencePropsBasedOnFilters?.referenceArrayForUseEffect,
        initialState: DEFAULT_INITIAL_STATE,
      }),
      [url, apiReferencePropsBasedOnFilters],
    );

    return (
      <WithLoadingAndError
        requestProps={requestProps}
        PropComponent={SpareSummaryView}
        otherProps={{ titles }}
      />
    );
  },
);

export default SpareSummery;
