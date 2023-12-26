import React, { useState, useEffect } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";

import BDHoursTrendChart from "./BDHoursTrendChart";

const MachineHistoryCard = ({
  selectedYear,
  selectedMonth,
  selectedRow,
  modelProp,
}) => {
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
      <Modal.Body>
        <Container>
          <Row>
            <Col>
              <b>BD Time</b>
            </Col>
            <Col>{historyCardData?.bdTime}</Col>
          </Row>
          <Row>
            <Col>
              <b>BD Count</b>
            </Col>
            <Col>{historyCardData?.bdCount}</Col>
          </Row>
          <Row>
            <Col>
              <b>MTTR</b>
            </Col>
            <Col>{historyCardData?.mttrData}</Col>
          </Row>
          <Row>
            <Col>
              <b>MTBF</b>
            </Col>
            <Col>{historyCardData?.mtbf}</Col>
          </Row>
          <Row>
            <Col>
              <b>PM Status</b>
            </Col>
            <Col>{historyCardData?.PM_Status}</Col>
          </Row>
          <Row>
            <Col>
              <b>BD Hr Trend</b>
            </Col>
            <BDHoursTrendChart bdHourTrend={historyCardData?.bdHourTrend} />
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <button>History</button>
      </Modal.Footer>
    </Modal>
  );
};

export default MachineHistoryCard;
