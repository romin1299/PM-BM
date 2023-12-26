import React, { useState, useEffect } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";

import BDHoursTrendChart from "./BDHoursTrendChart";

const AllFieldComponent = ({ cellName, data }) => {
  return (
    <>
      <Row>
        <Col>
          <b>{cellName}</b>
        </Col>
      </Row>
      <Row>
        <Col>{data?.bdHours || 0}</Col>
      </Row>
      <Row>
        <Col>{data?.count || 0}</Col>
      </Row>
      <Row>
        <Col>{data?.mttr || 0}</Col>
      </Row>
      <Row>
        <Col>{data?.mtbf || 0}</Col>
      </Row>
    </>
  );
};

const CountComponent = ({ data }) => {
  return (
    <>
      {data?.completedCount || 0}/{data?.totalCount || 0}
    </>
  );
};

const BarChartComponentMapping = ({ data }) => {
  if (!data) {
    return <h3>No data to display</h3>;
  }
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
              <Col>
                <b>PM Status</b>
              </Col>
              {/* <Row>
                <Col>
                  <b>BD Hr Trend</b>
                </Col>
              </Row> */}
            </Col>
            {summeryCardData?.cells?.map((item) => (
              <Col xxl={3}>
                <AllFieldComponent
                  cellName={item?.cell_name}
                  data={summeryCardData.machineSummaryCardData.find(
                    (item1) => item?._id === item1?._id?.cell
                  )}
                />

                <Row>
                  <Col>
                    <CountComponent
                      data={summeryCardData?.cellWiseCount.find(
                        (item1) => item1?._id === item?._id
                      )}
                    />
                  </Col>
                </Row>
                <Row>
                  <BarChartComponentMapping
                    data={summeryCardData?.bdTrendData?.find(
                      (item1) => item1?._id === item?._id
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
