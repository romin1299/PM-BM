import React, {useState, useEffect} from "react";
import { Container, Row, Col } from "react-bootstrap";
import currentYear from "../../../Dashboard/DashboardComponent/currentYear";
import YearDropDown from "../../../Dashboard/DashboardComponent/YearDropDown";
import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";
import LoadingAnimation from "../../ReportComponents/LoadingAnimation";
import NotFound from "../../ReportComponents/NotFound";

const Top20MachineSparePartConsumption = ({context}) => {
  const tableColumn = ["Sr No.","Line Name", "Machine Name", "Code", "Cost"];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [csvData, setCsvData] = useState([]);
  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );
  const [selectedLine, setSelectedLine] = useState("");
  const [graphData, setGraphData] = useState([]);

  const postSectionToGetAllDataForSparePartsReport = async () => {
    setSelectedLine("");
    try {
      const res = await fetch("/postSectionToGetAllDataForSparePartsReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
          selectedYear,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data);
        setGraphData(data);
        // let downloadData = [];
        // downloadData.push(
        //   // keyOfCsvData,
        //   label,
        //   ["Total cost of PM"].concat(data?.totalMonthlyPMSpareConsumption),
        //   ["Total cost of BM"].concat(data?.totalMonthlyBMSpareConsumption),
        //   ["Total cost of Corrective"].concat(data?.totalMonthlyCorrectiveSpareConsumption),
        //   ["Total cost of Predictive"].concat(data?.totalMonthlyPridictiveSpareConsumption),
        //   ["Total cost of Kaizen"].concat(data?.totalMonthlyKaizenSpareConsumption),
        //   ["Total"].concat(
        //     data?.totalMonthlyPMSpareConsumption?.map((key, idx) => {
        //       return key + data?.totalMonthlyBMSpareConsumption[idx] +
        //        data?.totalMonthlyCorrectiveSpareConsumption[idx] + 
        //        data?.totalMonthlyPridictiveSpareConsumption[idx] + 
        //        data?.totalMonthlyKaizenSpareConsumption[idx]
        //   })
        //   )

        // );
        // setCsvData(downloadData);
      }
    } catch (error) {
      console.log(error);
    }
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
      postSectionToGetAllDataForSparePartsReport();
    }, [selectedYear]);
  
    useEffect(() => {
      setLoadingAnimationState(<LoadingAnimation />);
    }, [selectedYear]);
  return (
    <div className="p-3 ">
      <Container>
        <Row className="pt-2 cell">
          <Row>
            <Col
            // className="cell"
            // style={{ backgroundColor: "white" }}
            >
              <h4>Top 20 Machine (Spare Part Consumption)</h4>
            </Col>
          </Row>
          <Row>
            <Col sm={12} lg={5}>
              <YearDropDown
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            </Col>
          </Row>
          <Row className="p-2">
            <Col className="d-flex ">
              <Col className="d-flex justify-content-end">
                <CSVLink
                  data={csvData}
                  filename={`${selectedYear}_Line_Wise_Spare_Consumption_Trend_${timeStamp()}`}
                  className="downloadCSV text-decoration-none"
                  target="_blank"
                >
                  CSV
                </CSVLink>
                &nbsp;
                <button
                  className="downloadPDF"
                  // onClick={pdfDownloadForLineWiseSpareConsumption}
                >
                  PDF
                </button>
              </Col>
            </Col>
          </Row>
        </Row>
      </Container>
      <Container className="cell">
        
        <Row className="m-2">
          <table>
            <tr>
              {tableColumn?.map((item) => (
                <td className="td-padding">{item}</td>
              ))}
            </tr>
            <tr>
              {tableColumn?.map((item) => (
                <td className="td-padding"></td>
              ))}
            </tr>
          </table>
        </Row>
      </Container>
    </div>
  );
};

export default Top20MachineSparePartConsumption;
