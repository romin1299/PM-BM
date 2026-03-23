import React, { useState, useEffect } from "react";
import { Col } from "react-bootstrap";
import { Box, Paper, Typography } from "@mui/material";
import Loading from "../../../components/Loading/Loading";

const sectionBodyBoxStyle = {
  // display: "flex",
  justifyContent: "center",
  alignItems: "center",
  // gap: "10px",

  mt: "2px",
  // minHeight: "80px",
};

const StatusBox = ({ title, value }) => (
  <Col>
    <Typography
      variant="body2"
      component="div"
      textAlign="center"
      // width={120}
      fontWeight={500}
      mb={"2px"}
      // sx={{ md: { width: "120px" }, sm: { width: "100%" } }}
    >
      {title}
    </Typography>

    <Paper
      variant="outlined"
      sx={{
        backgroundColor: "#c6efce", //alternative color #deebf7
        height: "48px",
        // md: { width: "120px" },
        // sm: { width: "100%" },
      }}
    >
      <Typography
        variant="h5"
        component="h5"
        textAlign="center"
        fontWeight={500}
        p={1}
      >
        {value || 0}
      </Typography>
    </Paper>
  </Col>
);

const BdHoursComponent = ({
  selectedValue,
  selectedYear,
  flagForTogglingFilter,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [BDHoursStatus, setBDHoursStatus] = useState({
    annualBDTarget: 0,
    BDActual: 0,
  });

  const getBdHoursStatus = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/getBdHoursStatus/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, BDHoursStatus } = await res.json();

      if (res?.status === 201) {
        setBDHoursStatus(BDHoursStatus);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue) {
      getBdHoursStatus();
    }
  }, [selectedValue, selectedYear]);

  return (
    <>
      <Col md={12} lg={6}>
        <Box className="cell p-3 mb-0">
          {loading ? (
            <Loading height={100} />
          ) : (
            <>
              <Typography variant="h6" textAlign="center" fontWeight={600}>
                BD Hours Status
              </Typography>
              <Box className="row gx-3" sx={sectionBodyBoxStyle}>
                <StatusBox
                  title="Annual BD Target"
                  value={BDHoursStatus?.annualBDTarget}
                />
                <StatusBox title="BD Actual" value={BDHoursStatus?.BDActual} />
              </Box>
            </>
          )}
        </Box>
      </Col>
    </>
  );
};

const BdCountComponent = ({
  selectedValue,
  selectedYear,
  flagForTogglingFilter,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [BDCountStatus, setBDCountStatus] = useState({
    annualMBDCount: 0,
    MBDActualAndMinorBdCount: {
      minorCount: 0,
      majorCount: 0,
    },
  });

  const getBdCountStatus = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/getBdCountStatus/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, BDCountStatus } = await res.json();

      if (res?.status === 201) {
        setBDCountStatus(BDCountStatus);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue && flagForTogglingFilter !== "based-on-line") {
      getBdCountStatus();
    }
  }, [selectedValue, selectedYear]);

  return (
    <>
      <Col md={12} lg={6}>
        <Box className="cell p-3 mb-0">
          {loading ? (
            <Loading height={100} />
          ) : (
            <>
              <Typography variant="h6" textAlign="center" fontWeight={600}>
                BD Counts Status
              </Typography>
              <Box className="row gx-3" sx={sectionBodyBoxStyle}>
                <StatusBox
                  title="Annual MBD Target"
                  value={BDCountStatus?.annualMBDCount}
                />
                <StatusBox
                  title="MBD Actual"
                  value={BDCountStatus?.MBDActualAndMinorBdCount?.majorCount}
                />
                <StatusBox
                  title="Minor BD Count"
                  value={BDCountStatus?.MBDActualAndMinorBdCount?.minorCount}
                />
              </Box>
            </>
          )}
        </Box>
      </Col>
    </>
  );
};
const BDHoursAndCountStatus = (prop) => {
  return (
    <>
      <BdCountComponent {...prop} />
      <BdHoursComponent {...prop} />
    </>
  );
};

export default BDHoursAndCountStatus;
