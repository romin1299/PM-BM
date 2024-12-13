import React, { useState, useEffect } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";

import BDHoursTrendChart from "./BDHoursTrendChart";
import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import { roundValue } from "../Utils/math/roundValue";

// import MachineHistoryMasterLog from "../../Common/MasterLog/MachineHistoryMasterLog";
import { useNavigate } from "react-router-dom";

const MachineHistoryCard = ({
  selectedYear,
  selectedMonth,
  selectedRow,
  modelProp,
}) => {
  // const [masterLogModal, setMasterLogModal] = useState(false);
  const navigate = useNavigate();

  // const handleMasterLogModal = () => {
  //   setMasterLogModal((masterLogModal) => !masterLogModal);
  // };
  const handleMasterLogNavigation = () => {
    navigate(
      `/master-log/?machine=${selectedRow?.machines?.[0]?._id}&selectedYear=${selectedYear}&selectedMonth=${selectedMonth}`
    );
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

  const MachineStatusBox2 = ({ title, value }) => (
    <Row className="gx-2">
      <Col className="col col-sm-5">
        <Paper
          variant="outlined"
          sx={{
            height: "100%",
            borderRadius: "3px",
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
            borderRadius: "3px",
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

  return (
    <Modal
      {...modelProp}
      size="md"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {selectedRow?.machines?.[0]?.machine_nickname}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="container">
        {/* <Row className="gx-2">
          {infoItems.map((info, index) => (
            <Col lg={4} sm={6} xs={6} className="mb-2">
              <MachineStatusBox
                title={info.name}
                value={roundValue(historyCardData?.[info?.key], 3)}
              />
            </Col>
          ))}
        </Row> */}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            mb: 1,
          }}
        >
          {infoItems.map((info, index) => (
            <MachineStatusBox2
              title={info.name}
              value={roundValue(historyCardData?.[info?.key], 3)}
            />
          ))}
        </Box>

        <BDHoursTrendChart bdHourTrend={historyCardData?.bdHourTrend} />

        {/* {masterLogModal && (
          <MachineHistoryMasterLog
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedRow={selectedRow}
            modelProp={{
              show: masterLogModal,
              onHide: () => handleMasterLogModal(),
            }}
          />
        )} */}
      </Modal.Body>
      <Modal.Footer className="gap-2">
        <Button
          size="small"
          variant="contained"
          disableElevation
          className="bg-button"
          onClick={() => {
            const { _id, machine_code } = selectedRow?.machines?.[0];

            navigate(
              `/machine-history/machine-document/${machine_code}/?machineId=${_id}`
            );
          }}
        >
          Document
        </Button>
        <Button
          size="small"
          variant="contained"
          disableElevation
          className="bg-button"
          onClick={handleMasterLogNavigation}
        >
          History
        </Button>
        {/* <Button
          size="small"
          variant="contained"
          disableElevation
          className="bg-button"
          onClick={handleMasterLogModal}
        >
          History
        </Button> */}
      </Modal.Footer>
    </Modal>
  );
};

export default MachineHistoryCard;
