import React, { useMemo, useContext } from "react";
import WithLoadingAndError from "../../Component/Common/WithLoadingAndError";
import { Box, Typography, Paper } from "@mui/material";
import { Row } from "react-bootstrap";
import RoutingContext from "../../../context/routing/RoutingContext";
import MachineCost from "./MachineCost";

import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

const DEFAULT_INITIAL_STATE = {
  isLoading: true,
  isError: false,
  data: {
    counters: [],
  },
};

const SummeryBox = ({ title, value }) => (
  <Box className="col-auto">
    <Paper
      variant="outlined"
      sx={{
        backgroundColor: "#c7defb",
        p: "4px",
        px: "10px",
        borderRadius: "8px",
      }}
    >
      <Typography textAlign="center" fontWeight={500}>
        {title}
      </Typography>

      <Typography textAlign="center" fontWeight={600}>
        {value}
      </Typography>
    </Paper>
  </Box>
);

const MapComponent = ({ counters, withHoldingRation, machineCost }) => {
  return (
    <>
      {counters?.map((item, index) => (
        <SummeryBox {...item} key={index} />
      ))}
      {withHoldingRation && (
        <SummeryBox
          title="Holding ratio"
          //   value={machineCost}
          value={counters?.[0]?.value / machineCost || 0}
        />
      )}
    </>
  );
};

const LoadSummeryData = ({
  url = "/v1/spare/inventory/summery",
  selectedYear,
  selectedMonth,
  withHoldingRation = false,
  machineCost = 1,
}) => {
  const requestProps = useMemo(
    () => ({
      url,
      axiosConfig: {
        params: { selectedYear, selectedMonth },
      },
      referenceArrayForUseEffect: [selectedYear, selectedMonth],
      initialState: DEFAULT_INITIAL_STATE,
    }),
    [url, selectedYear, selectedMonth],
  );

  return (
    <WithLoadingAndError
      requestProps={requestProps}
      PropComponent={MapComponent}
      otherProps={{
        withHoldingRation,
        machineCost,
      }}
    />
  );
};

const KPISummery = (props) => {
  const context = useContext(RoutingContext);

  const [{ isLoading, data }, setResponseData] = useSafeGetRequest({
    url: "/v1/spare/kpi/machineCost",
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        machineCost: null,
      },
    },
  });

  return (
    <Row className="cell p-2 rounded-2 mt-3 gap-2 g-0">
      <LoadSummeryData
        {...props}
        withHoldingRation={true}
        machineCost={data?.machineCost}
      />
      <LoadSummeryData {...props} url="/v1/spare/spareRequestSheet/summery" />
      {context?.toolRoomPerson === "Yes" &&
        (isLoading ? (
          <h5>Loading...</h5>
        ) : (
          <MachineCost
            machineCost={data?.machineCost}
            setResponseData={setResponseData}
          />
        ))}
    </Row>
  );
};

export default KPISummery;
