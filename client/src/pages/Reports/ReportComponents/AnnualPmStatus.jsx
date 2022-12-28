import React, { useState, useEffect, useContext } from "react";
import Plot from "react-plotly.js";
import { Row, Col, Container } from "react-bootstrap";
import RoutingContext from "../../../context/routing/RoutingContext";
import ClipLoader from "react-spinners/ClipLoader";

import currentYear from "../../Dashboard/DashboardComponent/currentYear";
import YearDropDown from "../../Dashboard/DashboardComponent/YearDropDown";

import LoadingAnimation from "./LoadingAnimation";
import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";

const AnnualPmStatus = () => {
  // console.log(tableData);
  const context = useContext(RoutingContext);

  const [graphData, setGraphData] = useState({});
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [csvData, setCsvData] = useState([]);

  const label = [
    "",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];
  const postSectionToGetAllDataForAnnualStatusReport = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllDataForAnnualStatusReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
          selectedYear,
          // month: selectedMonth,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data.machineData2[0][0].line_names.line_name);
        // console.log(data);
        setGraphData(data);
        let downloadData = [];
        downloadData.push(
          // keyOfCsvData,
          label,
          ["Total current schedule"].concat(data.annual_total_current_schedule),
          ["Total previous pending"].concat(data.annual_previous_pending),
          ["Total completed"].concat(data.annual_completed)
        );
        setCsvData(downloadData);

        // setTableData(data.lineDataWithCounter);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForAnnualStatusReport();
  }, [selectedYear]);

  // const y1 = [23, 45, 67, 30, 40, 50, 60, 70, 80, 90, 20, 30];
  // const y2 = [3, 6, 7, 1, 2, 3, 4, 5, 6, 2, 2, 3];
  // const y3 = [40, 60, 57, 88, 99, 65, 76, 87, 98, 43, 20, 30];
  const x1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const x2 = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5];

  const showValueInXAxis = {
    position: [
      1.25, 2.25, 3.25, 4.25, 5.25, 6.25, 7.25, 8.25, 9.25, 10.25, 11.25, 12.25,
    ],
    label: [
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
    ],
  };

  var trace1 = {
    x: x1,
    y: graphData?.annual_total_current_schedule,
    // y: y1,
    type: "bar",
    name: "Current Month Schedule",
    marker: {
      color: "#43919B",
    },
    hoverinfo: "y+name",
  };
  var trace2 = {
    x: x1,
    y: graphData?.annual_previous_pending,
    type: "bar",
    name: "Last Month Carry Forward",
    marker: {
      color: "red",
    },
    hoverinfo: "y+name",
  };
  var trace3 = {
    x: x2,
    y: graphData?.annual_completed,
    type: "bar",
    name: "Completed",
    marker: {
      color: "green",
    },
    hoverinfo: "y+name",
  };

  const layout = {
    title: {
      text: "",
      font: {
        size: 15,
      },
      xref: "paper",
      x: 0.0,
    },

    barmode: "stack",

    xaxis: {
      tickmode: "array", // If "array", the placement of the ticks is set via `tickvals` and the tick text is `ticktext`.
      tickvals: showValueInXAxis.position,
      ticktext: showValueInXAxis.label,

      title: {
        text: "Month",
        font: {
          // family: 'Courier New, monospace',
          size: 14,
          color: "#000",
        },
      },
    },

    yaxis: {
      title: {
        text: `No. of Machine(${selectedYear})`,
        font: {
          // family: 'Courier New, monospace',
          size: 14,
          color: "#000",
        },
      },
    },
    legend: { x: 0.3, y: "4", orientation: "h" },
  };

  //get the date and time
  const timeStamp = () => {
    let date = new Date();
    let getTime = date
      .toLocaleTimeString("en-IN", {
        hour12: true,
      })
      .replace(/(.*)\D\d+/, "$1");
    const year = date.getFullYear(); // 2019
    const month = date.getMonth() + 1;
    const day = date.getDate(); // 23

    return `${day}/${month}/${year} - ${getTime}`;
  };

  const pdfDownloadForAnnualPMStatus = () => {
    const doc = new jsPDF();
    doc.text(`${selectedYear}. PM Status(Machine)`, 15, 10);

    autoTable(doc, {
      head: [csvData[0]],
      body: [csvData[1], csvData[2], csvData[3]],
    });
    // doc.autoTable(columns, csvData);
    doc.save(`${selectedYear}_Annual_PM_Status${timeStamp()}`);
  };

  useEffect(() => {
    setGraphData("");
  }, [selectedYear]);
  return (
    <>
      <div>
        <Container>
          <Container fluid>
            <Row className="p-2">
              <Col sm={12} lg={3}>
                <YearDropDown
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              </Col>
              <Col></Col>
              <Col
                sm={12}
                lg={1}
                className="d-flex justify-content-around align-items-center"
              >
                <CSVLink
                  data={csvData}
                  filename={`${selectedYear}_PM_Status(Machine)${timeStamp()}`}
                  className="downloadCSV"
                  target="_blank"
                >
                  CSV
                </CSVLink>
                &nbsp;
                <button
                  className="downloadPDF"
                  onClick={pdfDownloadForAnnualPMStatus}
                >
                  PDF
                </button>
              </Col>
            </Row>
          </Container>
          <Row className="pt-2">
            {graphData?.annual_total_current_schedule?.length > 0 ? (
              <Col>
                <Plot
                  data={[trace1, trace2, trace3]}
                  layout={
                    layout

                    //   {
                    //   barmode: "stack",
                    //   // yaxis: { tickformat: "%" },
                    //   // xaxis: {
                    //   //   domain: [0, 0.15],
                    //   //   anchor: "x1",
                    //   //   title: "Apples",
                    //   // },
                    //   // xaxis2: {
                    //   //   domain: [0.16, 0.3],
                    //   //   anchor: "x2",
                    //   //   title: "Pears",
                    //   // },
                    //   xaxis3: {
                    //     domain: [0.31, 0.45],
                    //     anchor: "x3",
                    //     title: "Cherries",
                    //   },
                    //   // xaxis4: {
                    //   //   domain: [0.46, 0.6],
                    //   //   anchor: "x4",
                    //   //   title: "ABCD",
                    //   // },
                    // }}
                    // config={{
                    //   responsive: true,
                    // }
                  }
                  style={{ width: "100%", height: "100%" }}
                />
              </Col>
            ) : (
              <Col className="d-flex justify-content-around align-items-center pt-5">
                <LoadingAnimation />
              </Col>
            )}
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AnnualPmStatus;

/* ********************************************************************************** */

// import React from "react";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Bar } from "react-chartjs-2";

// import { Row, Col, Container } from "react-bootstrap";

// const AnnualPmStatus = () => {
//   ChartJS.register(
//     CategoryScale,
//     LinearScale,
//     BarElement,
//     Title,
//     Tooltip,
//     Legend
//   );

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "top",
//       },
//       title: {
//         display: true,
//         text: "Chart.js Bar Chart",
//       },
//     },
//   };

//   const labels = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//   ];
//   const data = {
//     labels,
//     datasets: [
//       {
//         label: "PM schedule",
//         data: [100, 20, 30, 90, 10, 20, 40, 30, 25, 45, 66, 87],
//         backgroundColor: "rgba(255, 99, 132, 0.5)",
//       },
//       {
//         label: "Completed",
//         data: [150, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140],
//         backgroundColor: "rgba(53, 162, 235, 0.5)",
//       },
//       {
//         label: "Pending",
//         data: [130, 140, 45, 68, 79, 43, 54, 78, 90, 16, 24, 39],
//         backgroundColor: "rgba(235, 171, 53, 0.5)",
//       },
//     ],
//   };

//   return (
//     <>
//       <div>
//         <Container>
//           <Row className="pt-2">
//             <Col
//             //  style={{ backgroundColor: "white" }}
//             >
//               <Bar options={options} data={data} />
//             </Col>
//           </Row>
//         </Container>
//       </div>
//     </>
//   );
//   // <Bar options={options} data={data} />;
// };

// export default AnnualPmStatus;

/* ************************************************************************************************** */

// import React from "react";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Bar } from "react-chartjs-2";
// // import { Row, Col, Container } from "react-bootstrap";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend.afterBuildTicks
// );

// const labels = ["January", "February", "March", "April", "May", "June", "July"];

// export const options = {
//   responsive: true,
//   plugins: {
//     legend: {
//       position: "bottom",
//     },

//     title: {
//       display: true,
//       text: "Chart.js Bar Chart",
//     },
//   },
//   //   scales: {
//   //     yAxes: [
//   //       {
//   //         display: true,
//   //         scaleLabel: {
//   //           display: true,
//   //           labelString: "Value",
//   //         },
//   //       },
//   //     ],
//   //   },
// };

// export const data = {
//   labels,
//   datasets: [
//     {
//       label: "Dataset 1",
//       data: [100, 20, 30, 90, 10, 20, 40, 30, 25, 45, 66, 87],
//       backgroundColor: "rgba(255, 99, 132, 0.5)",
//     },
//     {
//       label: "Dataset 2",
//       data: [150, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140],
//       backgroundColor: "rgba(53, 162, 235, 0.5)",
//     },
//     {
//       label: "Dataset 2",
//       data: [130, 140, 45, 68, 79, 43, 54, 78, 90, 16, 24, 39],
//       backgroundColor: "rgba(235, 171, 53, 0.5)",
//     },
//   ],
// };
// const AnnualPmStatus = () => {
//   return (
//     <>
//       <Bar options={options} data={data} />
//       {/* <div>
//         <Container>
//           <Row className="pt-2">
//             <Col
//             //  style={{ backgroundColor: "white" }}
//             >
//             </Col>
//           </Row>
//         </Container>
//       </div> */}
//     </>
//   );
// };

// export default AnnualPmStatus;

// import React from "react";
// import Plot from "react-plotly.js";

// const AnnualPmStatus = () => {
//   let data1 = {
//     type: "bar",
//     x: ["PM schedule", "Completed", "Pending"],
//     y: [80, 20, 45],
//   };
//   let data2 = {
//     type: "bar",
//     x: ["PM schedule", "Completed", "Pending"],
//     y: [10, 30, 20],
//   };
//   let data3 = {
//     type: "bar",
//     x: ["PM schedule", "Completed", "Pending"],
//     y: [100, 25, 60],
//   };
//   //   let data4 = {
//   //     type: "bar",
//   //     x: ["PM schedule", "Completed", "Pending"],
//   //     y: [15, 67, 93],
//   //   };

//   //   let data5 = {
//   //     type: "bar",
//   //     x: ["PM schedule", "Completed", "Pending"],
//   //     y: [84, 38, 55],
//   //   };
//   return (
//     <>
//       <div>
//         <Plot
//           data={[data1, data2, data3]}
//           layout={{ barmode: "group" }}
//           config={{
//             responsive: true,
//           }}
//           style={{ width: "100%", height: "50%" }}
//         />
//       </div>
//     </>
//   );
// };

// export default AnnualPmStatus;
