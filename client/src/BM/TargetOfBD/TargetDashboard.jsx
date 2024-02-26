import React, { useReducer, useEffect } from "react";
import { Box, Button } from "@mui/material";
import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import BMTitlebar from "../Component/BMTitlebar";
import { Col, Container, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { SuccessToast, WarningToast } from "../Component/ShowTostify";
import "./TargetDashboard.scss";
import ReportTitleBar from "../Reports/Common/ReportTitleBar";

const TargetDashboard = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/cell-level-filtration";

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    watch,
    reset,
    setValue,
    setFocus,
  } = useForm({
    defaultValues: {},
  });

  const monthKeyArray = [
    { key: "Apr" },
    { key: "May" },
    { key: "June" },
    { key: "July" },
    { key: "Aug" },
    { key: "Sep" },
    { key: "Oct" },
    { key: "Nov" },
    { key: "Dec" },
    { key: "Jan" },
    { key: "Feb" },
    { key: "Mar" },
  ];

  // let columns = !reduceState?.selectedLine
  //   ? [
  //       {
  //         key: "monthlyMBDCountTarget",
  //         name: "Major BD Hours",
  //         type: "number",
  //       },
  //     ]
  //   : [
  //       {
  //         key: "monthlyProductionHrs",
  //         name: "Production Hours",
  //         type: "number",
  //       },
  //       { key: "monthlyBDHrsTarget", name: "BD Hours", type: "number" },
  //       { key: "monthlyMTTRTarget", name: "MTTR", type: "number" },
  //       { key: "monthlyMTBFTarget", name: "MTBF", type: "number" },
  //       { key: "monthlyBDPercentageTarget", name: "BD %", type: "number" },
  //     ];

  let columns;

  if (reduceState?.selectedLine) {
    columns = [
      { key: "monthlyProductionHrs", name: "Production Hours", type: "number" },
      { key: "monthlyBDHrsTarget", name: "BD Hours", type: "number" },
      { key: "monthlyMTTRTarget", name: "MTTR", type: "number" },
      { key: "monthlyMTBFTarget", name: "MTBF", type: "number" },
      { key: "monthlyBDPercentageTarget", name: "BD %", type: "number" },
    ];
  } else {
    columns = [
      { key: "monthlyMBDCountTarget", name: "Major BD Hours", type: "number" },
    ];
  }

  const setTargetOfBD = async (targetValue) => {
    try {
      const res = await fetch(
        `/setTargetOfTheBDCharts/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetValue,
          }),
        }
      );

      const data = await res.json();

      if (res.status === 201) {
        SuccessToast(data?.message);
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getTargetDetails = async () => {
    try {
      const res = await fetch(
        `/getTargetDetails/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.status === 404) {
        WarningToast(data?.message);
        console.log("error", data?.message);
      } else {
        monthKeyArray?.map((monthName) => {
          setValue(
            `monthlyMBDCountTarget.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyMBDCountTarget?.[
              monthName?.key
            ] || 0
          );
          setValue(
            `monthlyProductionHrs.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyProductionHrs?.[
              monthName?.key
            ] || 0
          );
          setValue(
            `monthlyBDHrsTarget.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyBDHrsTarget?.[
              monthName?.key
            ] || 0
          );
          setValue(
            `monthlyMTTRTarget.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyMTTRTarget?.[
              monthName?.key
            ] || 0
          );
          setValue(
            `monthlyMTBFTarget.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyMTBFTarget?.[
              monthName?.key
            ] || 0
          );
          setValue(
            `monthlyBDPercentageTarget.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyBDPercentageTarget?.[
              monthName?.key
            ] || 0
          );
        });
        // setApproverHeaderList(data?.mergedApprovalListArray);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (reduceState?.selectedValue) {
      getTargetDetails();
      setFocus("monthlyProductionHrs.Apr");
    }
  }, [
    reduceState?.selectedYear,
    reduceState?.selectedCell,
    reduceState?.selectedLine,
  ]);

  return (
    <Container fluid>
      <ReportTitleBar
        title="Set Target (MBD Count, PRD Hrs., BD Hrs.)"
        Toolbar={
          <ChartsToolbar
            baseUrlForFiltering={baseUrlForFiltering}
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
            yearFiltration
            sectionFiltration
            subSectionFiltration
            cellFiltration
            lineFiltration
            resetButtonFiltration
          />
        }
      />

      <Row className="mt-3">
        <Col>
          <div className="cell p-3">
            <form
              onSubmit={handleSubmit(setTargetOfBD)}
              // style={{
              //   width: "100%",
              //   overflowX: "scroll",
              // }}
            >
              <div
                style={{
                  width: "100%",
                  overflowX: "auto",
                  border: "1px solid lightgray",
                  borderRadius: "4px",
                }}
              >
                <table className="target-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ maxWidth: "100px" }}></th>
                      {monthKeyArray.map((month, index) => (
                        <th key={index} style={{ maxWidth: "100px" }}>
                          {month.key}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {columns?.map((col, colIndex) => (
                      <tr key={colIndex}>
                        <td className="month-td">{col.name}</td>
                        {monthKeyArray.map((month, monthIndex) => (
                          <td
                            key={monthIndex}
                            style={{ padding: "0px", width: "100px" }}
                          >
                            <input
                              type="number"
                              step=".01"
                              className="target-table-input"
                              style={{ width: "100%", minWidth: "50px" }}
                              id={`${month?.key}`}
                              defaultValue={0}
                              name={`${month?.key}`}
                              {...register(`${col.key}.${month?.key}`, {
                                // required: "This field is required",
                              })}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* <button type="submit" className="btn btn-warning mt-3">
                Submit Target
              </button> */}

              <Button
                // size="small"
                type="submit"
                variant="contained"
                disableElevation
                className="bg-button mt-3"
              >
                Submit Target
              </Button>
            </form>
          </div>
        </Col>
      </Row>

      {/* <div className="cell p-4">
        <form onSubmit={handleSubmit(setTargetOfBD)}>
          <Row lg={4} md={4} sm={12}>
            {monthKeyArray?.map((monthName) => (
              <Col>
                <div className="cell">
                  <h5 className="m-1">{monthName?.key}</h5>
                  <hr className="m-0" />
                  {!reduceState?.selectedLine && (
                    <>
                      <Row className="m-1 p-1">
                        <Col>
                          <small>MBD Target Counts:</small>
                          &nbsp;
                        </Col>
                        <Col>
                          <input
                            type="number"
                            className="mb-2"
                            style={{ width: "80%" }}
                            id={`${monthName?.key}`}
                            name={`${monthName?.key}`}
                            defaultValue={0}
                            {...register(
                              `monthlyMBDCountTarget.${monthName?.key}`
                            )}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                  {reduceState?.selectedLine && (
                    <>
                      <Row lg={2} md={2} className="m-1 p-1">
                        <Col lg={8} md={6}>
                          <small>Production Hrs. Target Value:</small>
                        </Col>
                        <Col lg={4} md={4}>
                          <input
                            type="number"
                            className="mb-2"
                            style={{ width: "80%" }}
                            id={`${monthName?.key}`}
                            defaultValue={0}
                            name={`${monthName?.key}`}
                            {...register(
                              `monthlyProductionHrs.${monthName?.key}`,
                              {
                                // required: "This field is required",
                              }
                            )}
                          />
                        </Col>
                        <Col lg={8} md={6}>
                          <small>BD Hrs. Target Value:</small>
                        </Col>
                        <Col lg={4} md={4}>
                          <input
                            type="number"
                            className="mb-2"
                            style={{ width: "80%" }}
                            id={`${monthName?.key}`}
                            defaultValue={0}
                            name={`${monthName?.key}`}
                            {...register(
                              `monthlyBDHrsTarget.${monthName?.key}`,
                              {
                                // required: "This field is required",
                              }
                            )}
                          />
                        </Col>
                        <Col lg={8} md={6}>
                          <small>MTTR Target Value:</small>
                        </Col>
                        <Col lg={4} md={4}>
                          <input
                            type="number"
                            className="mb-2"
                            style={{ width: "80%" }}
                            id={`${monthName?.key}`}
                            defaultValue={0}
                            name={`${monthName?.key}`}
                            {...register(
                              `monthlyMTTRTarget.${monthName?.key}`,
                              {
                                // required: "This field is required",
                              }
                            )}
                          />
                        </Col>
                        <Col lg={8} md={6}>
                          <small>MTBF Target Value:</small>
                        </Col>
                        <Col lg={4} md={4}>
                          <input
                            type="number"
                            className="mb-2"
                            style={{ width: "80%" }}
                            id={`${monthName?.key}`}
                            defaultValue={0}
                            name={`${monthName?.key}`}
                            {...register(
                              `monthlyMTBFTarget.${monthName?.key}`,
                              {
                                // required: "This field is required",
                              }
                            )}
                          />
                        </Col>
                        <Col lg={8} md={6}>
                          <small>BD % Target Value:</small>
                        </Col>
                        <Col lg={4} md={4}>
                          <input
                            type="number"
                            className="mb-2"
                            style={{ width: "80%" }}
                            id={`${monthName?.key}`}
                            defaultValue={0}
                            name={`${monthName?.key}`}
                            {...register(
                              `monthlyBDPercentageTarget.${monthName?.key}`,
                              {
                                // required: "This field is required",
                              }
                            )}
                          />
                        </Col>
                      </Row>
                    </>
                  )}
                </div>
              </Col>
            ))}
            <Col>
              <button type="submit" className="btn btn-warning">
                Submit Target
              </button>
            </Col>
          </Row>
        </form>
      </div> */}
    </Container>
  );
};

export default TargetDashboard;
