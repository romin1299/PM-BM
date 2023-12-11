import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useForm } from "react-hook-form";
import { Container, Row, Col } from "reactstrap";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import Tooltip from "@mui/material/Tooltip";

export const DynamicFiltersMenu = ({
  getBDhoursVsCountReportData,
  selectedValue,
  selectedYear,
  selectedMonth,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

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

  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (selectedFilter) => {
    setAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const resetFilters = () => {
    setAnchorEl(null); // Close the menu after resetting
  };

  return (
    <div>
      <Tooltip title="Time Filters">
        <Button
          id="filter-button"
          aria-label="more"
          aria-haspopup="true"
          aria-controls={open ? "filter-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          sx={{ minWidth: "auto" }}
          onClick={handleMenuClick}
        >
          <FilterAltIcon
          // style={{ color: "white" }}
          />
        </Button>
      </Tooltip>
      <Menu
        id="filter-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        // anchorOrigin={{
        //   vertical: "top",
        //   horizontal: "right",
        // }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Container fluid>
          <AddHourlyFilter />

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
        </Container>
      </Menu>
    </div>
  );
};

const AddHourlyFilter = ({
  show,
  handleClose,
  FilterArray,
  setFilterArray,
}) => {
  const [filter, setFilter] = useState(FilterArray);

  useEffect(() => {
    setFilter(FilterArray);
  }, [FilterArray]);

  const handleAddNewInputField = () => {
    setFilter({
      ...filter,
      lessThanValue: [...filter?.lessThanValue, ""],
    });
  };

  const handleInputChangeForLessThanValue = (e, index) => {
    let newFilter = [...filter?.lessThanValue];
    newFilter[index] = e.target.value ? e.target.value * 1 : e.target.value;
    setFilter({
      ...filter,
      lessThanValue: newFilter,
    });
  };

  const handleChangeForGreaterThanValue = (e) => {
    setFilter({
      ...filter,
      greaterThan: e.target.value * 1,
    });
  };

  const handleSubmitData = async () => {
    try {
      const res = await fetch(
        `/hourlyFilterProductionOrLineWiseReport/${FilterArray?._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filter),
        }
      );

      const { responseFilter } = await res.json();

      if (res.status === 201) {
        setFilterArray(responseFilter);
        handleClose();
      } else {
        console.log("error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          <b>{"<"} value</b> &nbsp;
          <button className="btn bg-button" onClick={handleAddNewInputField}>
            Add
          </button>
        </Col>
      </Row>
      <Row className="p-2">
        {filter?.lessThanValue?.map((item, index) => {
          return (
            <Col className="p-1" key={index}>
              <input
                type="number"
                value={item}
                onChange={(e) => handleInputChangeForLessThanValue(e, index)}
              />
            </Col>
          );
        })}
      </Row>
      <Row>
        <b>+ value</b>
      </Row>

      <Row className="p-2">
        <Col className="p-1">
          <input
            type="number"
            value={filter?.greaterThan}
            onChange={handleChangeForGreaterThanValue}
          />
        </Col>
      </Row>

      <Row className="p-2">
        <Button variant="primary" onClick={handleSubmitData}>
          Save Changes
        </Button>
      </Row>
    </Container>
  );
};

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
      <Row>
        {/* <Row className="p-1"> */}
        <Col lg={1}>{title}:</Col>
        <Col>
          <form onSubmit={handleSubmit(handleSubmitHourFilter)}>
            <Row>
              {FilterArray?.lessThanValue?.map((item, index) => {
                return (
                  <Col key={index}>
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

              <Col>
                <input
                  type="checkbox"
                  name="graterThenHoursFilter"
                  value={FilterArray?.greaterThan}
                  {...register("graterThenHoursFilter")}
                />
                &nbsp;
                <label>{`${FilterArray?.greaterThan}+`}</label> <br />
              </Col>
              <Col>
                <button type="submit" className="btn bg-button btn-sm">
                  submit
                </button>
              </Col>
            </Row>
          </form>
        </Col>
      </Row>
    </>
  );
};
