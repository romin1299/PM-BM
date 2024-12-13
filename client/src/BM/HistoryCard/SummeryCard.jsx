import React, { useState, useEffect } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";

import BDHoursTrendChart from "./BDHoursTrendChart";
import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import { roundValue } from "../Utils/math/roundValue";

const CellInfoBoxOld = ({ title, value }) => (
  <Box
    className="row"
    sx={{
      borderBottom: "1px solid #8db5a2c2",
      ":last-of-type": { borderBottom: "none" },
    }}
  >
    <Box
      className="col col-sm-5"
      pt={"4px"}
      pb={"4px"}
      sx={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <Typography variant="body2" component="div">
        {title}
      </Typography>
    </Box>

    {/* <Col className="col-auto">
      <Divider orientation="vertical" sx={{ borderColor: "black" }} />
    </Col> */}

    <Box
      className="col col-sm-7"
      sx={{
        // backgroundColor: "#c6efce",
        display: "flex",
        alignItems: "center",
        minHeight: "24px",
      }}
    >
      <Typography
        variant="body1"
        component="div"
        // fontWeight={500}
        color="black"
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

const CellInfoBox = ({ title, value }) => (
  <Row className="gx-1">
    <Col className="col col-sm-5">
      <Paper
        variant="outlined"
        sx={{
          height: "100%",
          borderRadius: "2px",
          borderColor: "#3f51724d",
          bgcolor: "#90b6ff4d",
        }}
      >
        <Typography
          variant="body2"
          component="div"
          fontWeight={500}
          sx={{ p: "1px 8px" }}
        >
          {title}
        </Typography>
      </Paper>
    </Col>

    <Col className="col col-sm-7">
      <Paper
        variant="outlined"
        sx={{
          height: "100%",
          borderRadius: "2px",
          borderColor: "#3f51724d",
          bgcolor: "#90b6ff4d",
        }}
      >
        <Typography
          variant="body2"
          component="div"
          fontWeight={500}
          sx={{ p: "1px 8px" }}
        >
          {value}
        </Typography>
      </Paper>
    </Col>
  </Row>
);

const CellSummaryCard = ({ summeryCardData, item }) => {
  const infoItems = [
    { name: "BD Hour", key: "bdHours" },
    { name: "BD Count", key: "count" },
    { name: "MTTR", key: "mttr" },
    { name: "MTBF", key: "mtbf" },
  ];

  const machineData = summeryCardData.machineSummaryCardData.find(
    (item1) => item?._id === item1?._id?.cell
  );

  const pmStatus = summeryCardData?.cellWiseCount.find(
    (item1) => item1?._id === item?._id
  );

  const chartData = summeryCardData?.bdTrendData?.find(
    (item1) => item1?._id === item?._id
  );

  return (
    <Box className="cell p-2 m-0" sx={{ border: "1px solid #becdc1" }}>
      <Typography
        className="mb-2"
        variant="h5"
        textAlign="center"
        fontWeight={500}
      >
        {item?.cell_name}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          mb: 1,
        }}
      >
        {infoItems.map((info, index) => (
          <CellInfoBox
            title={info.name}
            value={roundValue(machineData?.[info?.key], 3)}
          />
        ))}
        <CellInfoBox
          title={"PM Status"}
          value={`${pmStatus?.completedCount || 0}/${
            pmStatus?.totalCount || 0
          }`}
        />
      </Box>

      {/* <Box variant="outlined" className="mb-2 p-1">
        <Typography textAlign="center" component="div" fontSize={14}>
          {pmStatus?.completedCount || 0}/{pmStatus?.totalCount || 0}
        </Typography>
      </Box> */}

      {chartData ? (
        <BDHoursTrendChart
          bdHourTrend={{
            lessThanOne: chartData?.lessThanOne,
            lessThanTwo: chartData?.lessThanTwo,
            greaterThanTwo: chartData?.greaterThanTwo,
          }}
          chartHeight={{ xs: "200px", md: "250px" }}
          labelsFontSize="10px"
          axisLabelsFontSize="12px"
        />
      ) : (
        <Box
          className="alert alert-secondary"
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: { xs: "200px", md: "250px" },
            m: 0,
            mt: 1,
          }}
        >
          <Typography variant="h5" component="h5" textAlign="center">
            No data to display
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const SummeryCardModal = ({
  selectedYear,
  selectedMonth,

  selectedValue,
  flagForTogglingFilter,

  modelProp,
}) => {
  const [summeryCardData, setSummeryCardData] = useState({
    cells: [
      {
        _id: "",
        cell_name: "",
      },
    ],
    bdTrendData: [
      {
        label: "",
        month: [],
        lessThanOne: [],
        lessThanTwo: [],
        greaterThanTwo: [],
      },
    ],
    machineSummaryCardData: [
      {
        _id: {
          cell: "",
          groupingObj: {
            groupId: "",
          },
        },
        count: 0,
        bdHours: 0,
        mttr: 0,
        mtbf: 0,
      },
    ],
    cellWiseCount: [
      {
        _id: "",
        totalCount: 0,
        completedCount: 0,
      },
    ],
  });

  const getSummaryCard = async () => {
    try {
      const res = await fetch(
        `/getSummaryCard/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const {
        message,
        cells,
        machineSummaryCardData,
        bdTrendData,
        cellWiseCount,
      } = await res.json();
      if (res.status === 201) {
        setSummeryCardData({
          cells,
          machineSummaryCardData,
          bdTrendData,
          cellWiseCount,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSummaryCard();
  }, []);

  console.log("modelProp:", modelProp);

  return (
    <Modal
      {...modelProp}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {/* {selectedValue} */} Summary
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="container pt-0 pb-0">
        {/* <Row className="flex-nowrap overflow-auto gx-3 pt-3 pb-3">
          {summeryCardData?.cells?.map((item) => (
            <Col xs={7} sm={7} lg={5} xl={3} xxl={3}>
              <CellSummaryCard summeryCardData={summeryCardData} item={item} />
            </Col>
          ))}
        </Row> */}

        <Row className="flex-nowrap overflow-auto gx-3 pt-3 pb-3">
          {summeryCardData?.cells?.map((item) => (
            <Col style={{ minWidth: "260px", maxWidth: "380px" }}>
              <CellSummaryCard summeryCardData={summeryCardData} item={item} />
            </Col>
          ))}
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button
          size="small"
          variant="contained"
          disableElevation
          className="bg-button"
          onClick={() => modelProp.onHide()}
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SummeryCardModal;
