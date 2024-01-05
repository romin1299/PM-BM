import React, { useReducer, useEffect } from "react";
import { Box } from "@mui/material";
import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import BMTitlebar from "../Component/BMTitlebar";
import { Col, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { SuccessToast, WarningToast } from "../Component/ShowTostify";

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
  } = useForm({
    defaultValues: {},
  });

  const monthKeyArray = [
    {
      key: "Apr",
    },
    {
      key: "May",
    },
    {
      key: "June",
    },
    {
      key: "July",
    },
    {
      key: "Aug",
    },
    {
      key: "Sep",
    },
    {
      key: "Oct",
    },
    {
      key: "Nov",
    },
    {
      key: "Dec",
    },
    {
      key: "Jan",
    },
    {
      key: "Feb",
    },
    {
      key: "Mar",
    },
  ];

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
            data?.targetData?.allTargetData?.monthlyMBDCountTarget?.[monthName?.key] || 0
          );
          setValue(
            `monthlyProductionHrs.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyProductionHrs?.[monthName?.key] || 0
          );
          setValue(
            `monthlyBDHrsTarget.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyBDHrsTarget?.[monthName?.key] || 0
          );
          setValue(
            `monthlyMTTRTarget.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyMTTRTarget?.[monthName?.key] || 0
          );
          setValue(
            `monthlyMTBFTarget.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyMTBFTarget?.[monthName?.key] || 0
          );
          setValue(
            `monthlyBDPercentageTarget.${monthName?.key}`,
            data?.targetData?.allTargetData?.monthlyBDPercentageTarget?.[monthName?.key] || 0
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
    }
  }, [
    reduceState?.selectedYear,
    reduceState?.selectedCell,
    reduceState?.selectedLine,
  ]);

  return (
    <>
      <BMTitlebar
        title="Set Target (MBD Count, PRD Hrs., BD Hrs.)"
        Toolbar={
          <ChartsToolbar
            baseUrlForFiltering={baseUrlForFiltering}
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
          />
        }
      />

      <div className="cell p-4">
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
                              `monthlyMBDCountTarget.${monthName?.key}`,
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
      </div>
    </>
  );
};

export default TargetDashboard;
