import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Container, Row, Col } from "reactstrap";

import AddHourlyFilter from "./AddHourlyFilter";

const FilterFormComponent = ({
  getBDhoursVsCountReportData,
  FilterArray,
  purpose,
  title,
}) => {
  const {
    register,
    handleSubmit,
    // formState: { errors },
  } = useForm({});

  const handleSubmitHourFilter = (data) => {
    getBDhoursVsCountReportData({
      purpose,
      data,
    });
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
const FilterComponent = ({ getBDhoursVsCountReportData }) => {
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
            Add more options
          </button>
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
            />

            <FilterFormComponent
              purpose="count-filter"
              title="Count"
              getBDhoursVsCountReportData={getBDhoursVsCountReportData}
              FilterArray={FilterArray}
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
