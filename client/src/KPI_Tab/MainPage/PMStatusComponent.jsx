import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { MonthDropdown } from "../../BM/Reports/ManHourReport/SubComponents/LineSelectionDropdown";
import currentMonth from "../../pages/Dashboard/DashboardComponent/currentMonth";

const DoughnutChartComponent = ({ chartData }) => {
  ChartJS.register(ArcElement, Tooltip, Legend);
  const data = {
    labels: ["Completed", "Ongoing", "Pending"],
    datasets: [
      {
        data: chartData?.data,
        backgroundColor: [
          "rgba(118, 235, 64, 0.2)",
          "rgb(253, 193, 132)",
          "rgba(255, 255, 255, 0.2)",
          "rgba(201, 203, 207, 0.2)",
        ],
        borderColor: [
          "#adec71",
          "rgb(243, 167, 92)",
          "rgb(211, 223, 223)",
          "rgb(201, 203, 207)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // const plugins = [
  //   // {
  //   //   beforeDraw: function (chart) {
  //   //     var width = chart.width,
  //   //       height = chart.height,
  //   //       ctx = chart.ctx;
  //   //     ctx.restore();

  //   //     var fontSize = (height / 160).toFixed(2);
  //   //     ctx.font = fontSize + "em sans-serif";
  //   //     ctx.textBaseline = "top";
  //   //     let text = chartData?.percentage,
  //   //       textX = Math.round((width - ctx.measureText(text).width) / 2),
  //   //       textY = height / 2 - 12;
  //   //     ctx.fillText(text, textX, textY);
  //   //     ctx.save();
  //   //   },
  //   // },
  //   {
  //     beforeDatasetsDraw: function (chart) {
  //       let { width, height, ctx, data } = chart;
  //       ctx.save();

  //       console.log(data);

  //       var fontSize = (height / 160).toFixed(2);
  //       ctx.font = fontSize + "em sans-serif";
  //       ctx.textBaseline = "top";
  //       let text = chartData?.percentage,
  //         textX = Math.round((width - ctx.measureText(text).width) / 2),
  //         textY = height / 2 - 12;
  //       ctx.fillText(text, textX, textY);
  //       ctx.restore();
  //     },
  //   },
  // ];

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        position: "bottom",
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <Doughnut
      data={data}
      options={options}
      // plugins={plugins}
      width={200}
      height={200}
    />
  );
};
const PMStatusComponent = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [pm_status_data, setPm_status_data] = useState({
    PMRatio: {
      targetRatio: "",
      actualRatio: "",
    },
    chartData: {
      percentage: "",
      data: [],
    },
    tableData: [
      {
        name: "",
        bgColor: "",
        value: "",
      },
    ],
  });

  const styleObjAndClassNameForSpanValue = {
    className: "border d-flex justify-content-center align-items-center",
    style: { fontSize: "13px", fontWeight: "bold" },
  };

  const getPMStatusData = async () => {
    try {
      const res = await fetch(
        `/common/kpi/getPMStatusData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, statusData } = await res.json();

      if (res?.status === 201) {
        setPm_status_data(statusData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getPMStatusData();
  }, [selectedValue, selectedYear, selectedMonth]);
  return (
    <>
      <Container fluid className="cell">
        <Row>
          <Col className="d-flex justify-content-center align-items-center">
            <h6 className="text-danger">Plant PM Status</h6>
          </Col>
          <Col className="col-4 d-flex gap-2">
            <MonthDropdown
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <span className="d-block  " style={{ fontSize: "13px" }}>
              PM Ratio Target
            </span>
            <span {...styleObjAndClassNameForSpanValue}>
              {pm_status_data?.PMRatio?.targetRatio}
            </span>
          </Col>
          <Col>
            <span className="d-block  " style={{ fontSize: "13px" }}>
              PM Ratio Actual
            </span>
            <span {...styleObjAndClassNameForSpanValue}>
              {pm_status_data?.PMRatio?.actualRatio}
            </span>
          </Col>
        </Row>
        <Row className="p-1 d-flex justify-content-center align-items-center">
          <Col
            lg={8}
            className="d-flex justify-content-center align-items-center"
          >
            <div class="container1">
              <DoughnutChartComponent chartData={pm_status_data?.chartData} />
              <div class="centered">
                <h5 className="text-dark">
                  {pm_status_data?.chartData?.percentage}
                </h5>
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <Table bordered hover size="sm">
              <tbody>
                {pm_status_data?.tableData.map((item) => (
                  <tr className={item.bgColor}>
                    <td style={{ fontSize: "12px", fontWeight: "bold" }}>
                      {item.name}
                    </td>
                    <td style={{ fontSize: "12px", fontWeight: "bold" }}>
                      {item.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default PMStatusComponent;
