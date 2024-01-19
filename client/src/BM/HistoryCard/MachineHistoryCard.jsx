import React, { useState, useEffect } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";

import BDHoursTrendChart from "./BDHoursTrendChart";
import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import { roundValue } from "../Utils/math/roundValue";

import MachineHistoryMasterLog from "../../Common/MasterLog/MachineHistoryMasterLog";

const MachineHistoryCard = ({
  selectedYear,
  selectedMonth,
  selectedRow,
  modelProp,
}) => {
  const [masterLogModal, setMasterLogModal] = useState(false);

  const handleMasterLogModal = () => {
    setMasterLogModal((masterLogModal) => !masterLogModal);
  };

  const [historyCardData, setHistoryCardData] = useState({
    bdTime: 0,
    bdCount: 0,
    mttrData: 0,
    mtbf: 0,
    PM_Status: "",
    bdHourTrend: {
      lessThanOne: [],
      lessThanTwo: [],
      greaterThanTwo: [],
    },
  });

  const getHistoryCard = async () => {
    try {
      const res = await fetch(
        `/getHistoryCard/${selectedRow?.machines?.[0]?._id}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { message, PM_Status, machineHistoryCardData, bdTrendData } =
        await res.json();
      if (res.status === 201) {
        setHistoryCardData({
          bdTime: machineHistoryCardData?.bdHours,
          bdCount: machineHistoryCardData?.count,
          mttrData: machineHistoryCardData?.mttr,
          mtbf: machineHistoryCardData?.mtbf,
          bdHourTrend: bdTrendData,
          PM_Status,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getHistoryCard();
  }, []);

  const infoItems = [
    { name: "BD Time", key: "bdTime" },
    { name: "BD Count", key: "bdCount" },
    { name: "MTTR", key: "mttrData" },
    { name: "MTBF", key: "mtbf" },
    { name: "PM Status", key: "PM_Status" },
  ];

  const MachineStatusBox = ({ title, value }) => (
    <Container>
      <Paper
        className="row"
        variant="outlined"
        sx={{
          minHeight: "32px",
          borderColor: "#40694842",
        }}
      >
        <Box
          className="col col-sm-5"
          sx={{
            display: "flex",
            alignItems: "center",
            mt: "2px",
          }}
        >
          <Typography variant="body2" component="div" fontWeight={500}>
            {title}
          </Typography>
        </Box>
        <Box
          className="col col-sm-7"
          sx={{
            backgroundColor: "#c6efce",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1"
            component="span"
            fontWeight={500}
            color="black"
          >
            {value}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );

  return (
    <Modal
      {...modelProp}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {selectedRow?.machines?.[0]?.machine_code}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="container">
        <Row className="gx-2">
          {infoItems.map((info, index) => (
            <Col lg={4} sm={6} xs={6} className="mb-2">
              <MachineStatusBox
                title={info.name}
                value={roundValue(historyCardData?.[info?.key], 3)}
              />
            </Col>
          ))}
        </Row>

        <BDHoursTrendChart bdHourTrend={historyCardData?.bdHourTrend} />

        {masterLogModal && (
          <MachineHistoryMasterLog
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedRow={selectedRow}
            modelProp={{
              show: masterLogModal,
              onHide: () => handleMasterLogModal(),
            }}
          />
        )}
      </Modal.Body>
      <Modal.Footer className="gap-2">
        <Button
          size="small"
          variant="contained"
          disableElevation
          className="bg-button"
        >
          Document
        </Button>
        <Button
          size="small"
          variant="contained"
          disableElevation
          className="bg-button"
          onClick={handleMasterLogModal}
        >
          History
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MachineHistoryCard;
