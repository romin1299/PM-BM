import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

const SpareSummery = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
}) => {
  const [{ isLoading, isError, data }] = useSafeGetRequest({
    url: "/v1/spare/spareKPI/spareSheetsSummery",
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
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        counters: {
          totalRequestSheet: 0,
          openRequestSheet: 0,
          closedRequestSheet: 0,
        },
      },
    },
  });

  if (isLoading) return <h5>Loading...</h5>;

  return (
    <Box className="cell p-2 rounded-2">
      <div className="d-flex gap-2">
        {[
          {
            title: "Total Requests",
            value: data?.counters?.totalRequestSheet,
            backgroundColor: "#c7defb",
          },
          {
            title: "Open Requests",
            value: data?.counters?.openRequestSheet,
            backgroundColor: "#feb4b4ba",
          },
          {
            title: "Closed Requests",
            value: data?.counters?.closedRequestSheet,
            backgroundColor: "#c6efce",
          },
        ].map((item) => (
          <Box className="col-auto">
            <Paper
              variant="outlined"
              sx={{
                backgroundColor: item.backgroundColor,
                p: "4px",
                px: "10px",
                borderRadius: "8px",
              }}
            >
              <Typography
                variant="body2"
                component="div"
                textAlign="center"
                fontWeight={500}
              >
                {item.title}
              </Typography>

              <Typography
                variant="h5"
                component="h5"
                textAlign="center"
                fontWeight={600}
              >
                {item.value}
              </Typography>
            </Paper>
          </Box>
        ))}
      </div>
    </Box>
  );
};

export default SpareSummery;
