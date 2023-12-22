import React, { useState, useEffect } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";

import BDHoursTrendChart from "./BDHoursTrendChart";

const SummeryCard = ({
  selectedYear,
  selectedMonth,

  selectedValue,
  flagForTogglingFilter,

  modelProp,
}) => {
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
      const { message, machineHistoryCardData, bdTrendData } = await res.json();
      if (res.status === 201) {
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSummaryCard();
  }, []);

  console.log(modelProp);

  return (
    <Modal
      {...modelProp}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {selectedValue}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            <Col>
              <b>BD Time</b>
            </Col>
            <Col>{"Time"}</Col>
          </Row>
          <Row>
            <Col>
              <b>BD Count</b>
            </Col>
            <Col>{"Count"}</Col>
          </Row>
          <Row>
            <Col>
              <b>MTTR</b>
            </Col>
            <Col>{"MTTR"}</Col>
          </Row>
          <Row>
            <Col>
              <b>MTBF</b>
            </Col>
            <Col>{"MTBF"}</Col>
          </Row>
          <Row>
            <Col>
              <b>BD Hr Trend</b>
            </Col>
            <BDHoursTrendChart
              bdHourTrend={{
                lessThanOne: [],
                lessThanTwo: [],
                greaterThanTwo: [],
              }}
            />
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <button>History</button>
      </Modal.Footer>
    </Modal>
  );
};

export default SummeryCard;
