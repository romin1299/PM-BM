import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import currentYear from "../../../Dashboard/DashboardComponent/currentYear";
import YearDropDown from "../../../Dashboard/DashboardComponent/YearDropDown";
import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";
import LoadingAnimation from "../../ReportComponents/LoadingAnimation";
import NotFound from "../../ReportComponents/NotFound";

const Top20MachineSparePartConsumption = ({
  context,
  selectedSectionOrSubSection,
}) => {
  const tableColumn = ["Sr No.", "Line Name", "Machine Name", "Code", "Cost"];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );
  const [tableData, setTableData] = useState([]);
  const label = [
    { label: "Sr.No", key: "srNo" },
    { label: "Line Name", key: "line_names.line_name" },
    { label: "Machine Name", key: "machine_name" },
    { label: "Machine Code", key: "machine_code" },
    { label: "Cost", key: "cost" },
  ];

  const postSectionToGetAllDataForTop20MachineSparePartsReport = async (
    sectionData
  ) => {
    try {
      const res = await fetch(
        "/postSectionToGetAllDataForTop20MachineSparePartsReport",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: sectionData,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setTableData(data?.top20MachineSparePartConsumption);
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const pdfDownloadForTop20MachinePartsConsumption = () => {
    const doc = new jsPDF();
    let rows = [];
    tableData?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.line_names.line_name,
        item.machine_name,
        item.machine_code,
        item.cost,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`${selectedYear}. Monthly Spare Consumption Trend`, 15, 10);

    autoTable(doc, {
      head: [label?.map((value) => value.label)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(
      `${selectedYear}_top20_Machine_SparePart_Consumption_Trend_${timeStamp()}`
    );
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
  useEffect(() => {
    postSectionToGetAllDataForTop20MachineSparePartsReport(
      selectedSectionOrSubSection || context?.section_data
    );
  }, [selectedYear, selectedSectionOrSubSection]);

  useEffect(() => {
    setLoadingAnimationState(<LoadingAnimation />);
  }, [selectedYear]);

  let srNo = 0;
  return (
    <div className="pt-3 ">
      <Container fluid>
        <h4 className="mb-3">Top 20 Machine (Spare Part Consumption)</h4>
        <Row className="pt-2 cell gy-2">
          <Col sm={12} lg={6} md={12}>
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
          <Col sm={12} lg={6} md={12} className="d-flex justify-content-end">
            <CSVLink
              headers={label}
              data={tableData}
              filename={`${selectedYear}_top20_Machine_SparePart_Consumption_Trend_${timeStamp()}`}
              className="downloadCSV text-decoration-none"
              target="_blank"
            >
              CSV
            </CSVLink>
            &nbsp;
            <button
              className="downloadPDF"
              onClick={pdfDownloadForTop20MachinePartsConsumption}
            >
              PDF
            </button>
          </Col>

          <Row className="mt-3 ">
            {tableData?.length > 0 ? (
              <Row className="m-2">
                <table>
                  <tr>
                    {tableColumn?.map((item) => (
                      <td className="td-padding">{item}</td>
                    ))}
                  </tr>

                  {tableData?.map((item) => (
                    <tr>
                      <td className="td-padding">{++srNo}</td>
                      <td className="td-padding">
                        {item?.line_names?.line_name}
                      </td>
                      <td className="td-padding">{item?.machine_name}</td>
                      <td className="td-padding">{item?.machine_code}</td>
                      <td className="td-padding">{item?.cost}</td>
                    </tr>
                  ))}
                </table>
              </Row>
            ) : (
              <Col
                className="d-flex justify-content-center align-items-center"
                style={{ marginBottom: "2rem" }}
              >
                {loadingAnimationState}
              </Col>
            )}
          </Row>
        </Row>
      </Container>
    </div>
  );
};

export default Top20MachineSparePartConsumption;
