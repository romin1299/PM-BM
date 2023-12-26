import React, { useState, useEffect } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";

import BDHoursTrendChart from "./BDHoursTrendChart";

const BarChartComponentMapping = ({ data }) => {
  return (
    <BDHoursTrendChart
      bdHourTrend={{
        lessThanOne: data?.lessThanOne,
        lessThanTwo: data?.lessThanTwo,
        greaterThanTwo: data?.greaterThanTwo,
      }}
    />
  );
};
const SummeryCard = ({
  selectedYear,
  selectedMonth,

  selectedValue,
  flagForTogglingFilter,

  modelProp,
}) => {
  const [summeryCardData, setSummeryCardData] = useState({
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
      const { message, machineSummaryCardData, bdTrendData } = await res.json();
      if (res.status === 201) {
        setSummeryCardData({ machineSummaryCardData, bdTrendData });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSummaryCard();
  }, []);

  return (
    <Modal
      {...modelProp}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      {/* <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {selectedValue}
        </Modal.Title>
      </Modal.Header> */}
      <Modal.Body>
        <Container>
          <Row>
            <Col xxl={2}>
              <Row>
                <Col>
                  <b>Cell</b>
                </Col>
              </Row>
              <Row>
                <Col>
                  <b>BD Time</b>
                </Col>
              </Row>
              <Row>
                <Col>
                  <b>BD Count</b>
                </Col>
              </Row>
              <Row>
                <Col>
                  <b>MTTR</b>
                </Col>
              </Row>
              <Row>
                <Col>
                  <b>MTBF</b>
                </Col>
              </Row>
              {/* <Row>
                <Col>
                  <b>BD Hr Trend</b>
                </Col>
              </Row> */}
            </Col>
            {summeryCardData?.machineSummaryCardData?.map((item) => (
              <Col xxl={3}>
                <Row>
                  <Col>
                    <b>{item?._id?.cell}</b>
                  </Col>
                </Row>
                <Row>
                  <Col>{item?.bdHours}</Col>
                </Row>
                <Row>
                  <Col>{item?.count}</Col>
                </Row>
                <Row>
                  <Col>{item?.mttr}</Col>
                </Row>
                <Row>
                  <Col>{item?.mtbf || 0}</Col>
                </Row>
                <Row>
                  <BarChartComponentMapping
                    data={summeryCardData?.bdTrendData?.find(
                      (item1) => item1?.label === item?._id?.cell
                    )}
                  />
                </Row>
              </Col>
            ))}
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn bg-button" onClick={modelProp?.onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default SummeryCard;
