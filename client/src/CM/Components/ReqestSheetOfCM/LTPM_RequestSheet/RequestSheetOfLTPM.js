import axios from "axios";
import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import moment from "moment";
import DataNotFound from "../../../../BM/Reports/Common/DataNotFound";
import Loading from "../../../../components/Loading/Loading";
import PaginationForLTPM from "../../../../components/Pagination/PaginationForLTPM";
// import currentYear from "../../../../pages/Dashboard/DashboardComponent/currentYear";

const RequestSheetOfLTPM = ({ selectedLine, reduceState }) => {
  const [dataOfLTPM, setDataOfLTPM] = useState([]);
  const currentYear = 2025

  const [loading, setLoading] = useState(true);

  const getDataOfLTPM = async () => {
    setLoading(true);
    try {
      const url = `/LTPM/getDatOfLTPM/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}`;

      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      setDataOfLTPM(res?.data?.resultOfLTPM);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  // let yearsOfLTPM = [
  //   new Date().getFullYear(),
  //   new Date().getFullYear() + 1,
  //   new Date().getFullYear() + 2,
  //   new Date().getFullYear() + 3,
  //   new Date().getFullYear() + 4,
  // ];

  // const currentYear = new Date().getFullYear();
  const yearsOfLTPM = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const [visibleYears, setVisibleYears] = useState(yearsOfLTPM.slice(0, 4));

  let columns = [
    {
      header: "SN",
      sort: "true",
    },
    {
      header: "Machine No.",
      sort: "true",
    },
    {
      header: "Machine Name",
      sort: "true",
    },
    {
      header: "Inspection item",
      sort: "true",
    },
    // {
    //   header: "Inspection point",
    //   sort: "true",
    // },
    // {
    //   header: "Judgement criteria",
    //   sort: "true",
    // },
    {
      header: "Action",
      sort: "true",
    },
    {
      header: "Cycle",
      sort: "true",
    },
    {
      header: "Person in charge",
      sort: "true",
    },
    // {
    //   header: "PM Time (min)",
    //   sort: "true",
    // },
    {
      header: "",
      sort: "true",
    },
    {
      header: "Q1",
      sort: "true",
    },
    {
      header: "Q2",
      sort: "true",
    },
    {
      header: "Q3",
      sort: "true",
    },
    {
      header: "Q4",
      sort: "true",
    },
    {
      header: "Q1",
      sort: "true",
    },
    {
      header: "Q2",
      sort: "true",
    },
    {
      header: "Q3",
      sort: "true",
    },
    {
      header: "Q4",
      sort: "true",
    },
    {
      header: "Q1",
      sort: "true",
    },
    {
      header: "Q2",
      sort: "true",
    },
    {
      header: "Q3",
      sort: "true",
    },
    {
      header: "Q4 ",
      sort: "true",
    },
  ];

  useEffect(() => {
    getDataOfLTPM();
  }, [
    reduceState?.selectedValue,
    reduceState.selectedYear,
    reduceState.selectedMonth,
  ]);

  function getFinancialQuarter(date) {
    const financialYearStartMonth = 4; // April is the 4th month
    const month = moment(date).month() + 1; // moment().month() is zero-based, so adding 1
    return Math.ceil((((month - financialYearStartMonth + 12) % 12) + 1) / 3);
  }

  // Example usage with current date
  const currentFinancialQuarter = getFinancialQuarter(moment());
  console.log(visibleYears);

  // yearsOfLTPM?.reduce((acc, curr) => {
  //   console.log(yearsOfLTPM[acc]);
  //   return acc + 1;
  // }, 1);

  return (
    <>
      <div>
        {loading ? (
          <Loading />
        ) : dataOfLTPM?.length <= 0 ? (
          <DataNotFound />
        ) : (
          <>
            <div>
              <Container fluid>
                <Row>
                  <Col lg={6} md={6} sm={12} />
                  <Col lg={6} md={6} sm={12}>
                    <table className="ar-table tableCol1 ">
                      <thead>
                        <tr>
                          <th
                            className="ar-table-thead-header1 text-center"
                            // colSpan={2}
                            //  rowSpan={5}
                          >
                            PLAN ACCEPTANCE
                            <br />
                            (By PRD Section-in-charge)
                          </th>
                          <th
                            className="ar-table-thead-header1 text-center"
                            // colSpan={2}
                            //  rowSpan={5}
                          >
                            PLAN PREPARED
                            <br />
                            (By MTD Section-in-charge)
                          </th>
                        </tr>
                        <tr>
                          <th className="approvalName"></th>
                          <th className="approvalName"></th>
                        </tr>
                      </thead>
                    </table>
                  </Col>
                </Row>
              </Container>
            </div>
            <div>
              <Container fluid>
                <Row>
                  <Col className="table-scrolling">
                    <table className="ar-table tableCol">
                      <thead>
                        <tr>
                          <th
                            className="ar-table-thead-header1 headerPD"
                            // colSpan={2}
                            rowSpan={3}
                          >
                            <p>
                              Section Name :{" "}
                              {dataOfLTPM?.[0]?.section_data?.section_name}
                            </p>
                            <br />
                            <p>
                              Line Name : {dataOfLTPM?.[0]?.lines?.line_name}
                            </p>
                          </th>
                          <th
                            className="ar-table-thead-header1 headerPD  align-items-center"
                            colSpan={2}
                            style={{ textAlign: "center" }}
                            // rowSpan={2}
                          >
                            Approved by
                            <br />
                            (MTD HOS)
                          </th>
                          <th
                            className="ar-table-thead-header1 headerPD"
                            colSpan={2}
                            style={{ textAlign: "center" }}
                            // rowSpan={2}
                          >
                            Checked by
                            <br />
                            (MTD TL)
                          </th>
                          <th
                            className="ar-table-thead-header1 headerPD"
                            colSpan={2}
                            style={{ textAlign: "center" }}
                            // rowSpan={3}
                          >
                            Prepared by
                            <br />
                            (MTD TL)
                          </th>
                          {/* <th
                            className="ar-table-thead-header1 headerPD"
                            colSpan={2}
                            style={{ textAlign: "center" }}
                            // rowSpan={3}
                          >
                          </th> */}
                          <th className="ar-table-thead-header1">
                            Checked & Verify by
                            <br />
                            (MTD TL)
                          </th>
                          <td className="ar-table-col1"></td>
                        </tr>
                        <tr>
                          <th
                            className="approvalName"
                            colSpan={2}
                            rowSpan={5}
                          ></th>
                          <th
                            className="approvalName"
                            colSpan={2}
                            rowSpan={5}
                          ></th>
                          <th
                            className="approvalName"
                            colSpan={2}
                            rowSpan={5}
                          ></th>
                          {/* <th
                            className="approvalName"
                            colSpan={2}
                            rowSpan={5}
                          ></th> */}
                          <th className="ar-table-thead-header1">
                            Approved by
                            <br />
                            (MTD HOS)
                          </th>
                          <td className="ar-table-col1"></td>
                        </tr>
                      </thead>

                      <PaginationForLTPM
                        setVisibleYears={setVisibleYears}
                        yearsOfLTPM={yearsOfLTPM}
                        visibleYears={visibleYears}
                      />
                      <thead>
                        <tr>
                          <th colSpan={8}></th>
                          {visibleYears.map((year, idx) => (
                            <th className="ar-table-col1" colSpan={4} key={idx}>
                              {year}-{year + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <thead className="mt-5">
                        <tr>
                          {columns?.map((tColumn) => (
                            <th
                              className={
                                tColumn.header === ""
                                  ? "ar-table-thead-header3"
                                  : "ar-table-thead-header"
                              }
                            >
                              {tColumn.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dataOfLTPM?.map((item, index) => (
                          <React.Fragment key={index}>
                            <tr className="ar-table-row">
                              <td
                                className="ar-table-col"
                                rowSpan={item?.data?.length + 1}
                              >
                                {++index}
                              </td>
                              <td
                                rowSpan={item?.data?.length + 1}
                                className="ar-table-col"
                              >
                                {item?.machines.machine_code}
                              </td>
                              <td
                                rowSpan={item?.data?.length + 1}
                                className="ar-table-col"
                              >
                                {item?.machines.machine_name}
                              </td>
                            </tr>

                            {item?.data?.map((item1, index) => (
                              <tr key={index}>
                                <td className="ar-table-col">
                                  {item1?.inspectionItem}
                                </td>
                                <td className="ar-table-col">
                                  {item1?.actionForLTPM}
                                </td>
                                <td className="ar-table-col">
                                  {item1?.frequencyValue}
                                </td>
                                <td className="ar-table-col">
                                  {item1?.personForLTPM}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </Col>
                </Row>
              </Container>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default RequestSheetOfLTPM;
