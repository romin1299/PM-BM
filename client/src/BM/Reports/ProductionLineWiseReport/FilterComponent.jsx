import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Container, Row, Col } from "reactstrap";

import AddHourlyFilter from "./AddHourlyFilter";
import { Box, Button, InputAdornment, TextField } from "@mui/material";

const FilterFormComponent = ({
  getBDhoursVsCountReportData,
  FilterArray,
  purpose,
  title,
  selectedValue,
  selectedYear,
  selectedMonth,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    // formState: { errors },
  } = useForm({});

  useEffect(() => {
    reset();
  }, [selectedValue, selectedYear, selectedMonth]);

  const handleSubmitHourFilter = (data) => {
    if (data?.hoursFilter?.length > 0 || data?.graterThenHoursFilter) {
      getBDhoursVsCountReportData({
        purpose,
        data,
      });
    } else {
      getBDhoursVsCountReportData({
        purpose: "by-default",
        data: {},
      });
    }
  };

  return (
    <>
      <Row className="gx-2 mt-2">
        {/* <Row className="p-1"> */}
        <Col
          className="col-auto d-flex align-items-center"
          style={{ width: "60px" }}
        >
          {title}:
        </Col>
        <Col>
          <form onSubmit={handleSubmit(handleSubmitHourFilter)}>
            <Row className="gx-0">
              {FilterArray?.lessThanValue?.map((item, index) => {
                return (
                  <Col key={index} className="d-flex align-items-center">
                    <input
                      type="checkbox"
                      name="hoursFilter"
                      value={item}
                      {...register("hoursFilter")}
                    />
                    &nbsp;
                    <label>{`<${item}`}</label> <br />
                  </Col>
                );
              })}

              <Col className="d-flex align-items-center">
                <input
                  type="checkbox"
                  name="graterThenHoursFilter"
                  value={FilterArray?.greaterThan}
                  {...register("graterThenHoursFilter")}
                />
                &nbsp;
                <label>{`${FilterArray?.greaterThan}+`}</label> <br />
              </Col>
              <Col className="col-auto">
                <Button
                  type="submit"
                  size="small"
                  variant="contained"
                  disableElevation
                  className="bg-button"
                  sx={{ pt: "2px", pb: "1px", minWidth: "auto" }}
                >
                  go
                </Button>
              </Col>
            </Row>
          </form>
        </Col>
      </Row>
    </>
  );
};
const FilterComponent = ({
  getBDhoursVsCountReportData,
  selectedValue,
  selectedYear,
  selectedMonth,
  documentLimitInTheGraph,
  setDocumentLimitInTheGraph,
}) => {
  const [handleAddOptionsModal, setHandleAddOptionsModal] = useState(false);
  const [FilterArray, setFilterArray] = useState({
    lessThanValue: [],
    greaterThan: 0,
    _id: "",
  });

  const handleOpenOrCloseModal = () => {
    setHandleAddOptionsModal((handleAddOptionsModal) => !handleAddOptionsModal);
  };

  const getFilterData = async () => {
    try {
      const res = await fetch(`/getProductOrLineReportHourlyFilter`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const { filterInfo } = await res.json();
      setFilterArray(filterInfo);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getFilterData();
  }, []);

  return (
    <Container fluid>
      <Row>
        <Col>
          <button
            className="btn bg-button btn-sm"
            onClick={handleOpenOrCloseModal}
          >
            Breakdown hours filtering
          </button>
        </Col>
        <Col className="col-auto">
          <Box
            component="form"
            sx={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            {/* <p style={{ fontSize: "1rem" }}>Top:</p> */}
            <TextField
              type="number"
              id="outlined-basic"
              // sx={{ width: "80px" }}
              variant="outlined"
              sx={{
                // width: "12ch",
                width: "6rem",
                pl: 0,
                "& .MuiOutlinedInput-root": { pl: 0 },
                "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
              }}
              InputProps={{
                sx: { fontSize: 14 },
                startAdornment: (
                  <InputAdornment position="start">TOP</InputAdornment>
                ),
              }}
              size="small"
              onChange={(e) => {
                setDocumentLimitInTheGraph(e.target.value);
              }}
              value={documentLimitInTheGraph}
            />
            <Button
              // size="small"
              disableElevation
              className="bg-button"
              variant="contained"
              sx={{
                minWidth: "30px",
                height: "32px",
                paddingInline: "10px",
              }}
              onClick={getBDhoursVsCountReportData}
            >
              Go
            </Button>
          </Box>
        </Col>
      </Row>

      {FilterArray?.lessThanValue?.length > 0 &&
        FilterArray?.greaterThan > 0 && (
          <>
            <FilterFormComponent
              purpose="hours-filter"
              title="Filter"
              getBDhoursVsCountReportData={getBDhoursVsCountReportData}
              FilterArray={FilterArray}
              selectedValue={selectedValue}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />

            <FilterFormComponent
              purpose="count-filter"
              title="Count"
              getBDhoursVsCountReportData={getBDhoursVsCountReportData}
              FilterArray={FilterArray}
              selectedValue={selectedValue}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          </>
        )}

      <AddHourlyFilter
        show={handleAddOptionsModal}
        handleClose={handleOpenOrCloseModal}
        FilterArray={FilterArray}
        setFilterArray={setFilterArray}
      />
    </Container>
  );
};

export default FilterComponent;
