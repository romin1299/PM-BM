import React, { useEffect, useState } from "react";
import PartList from "../../../../BM/Tabs/SubComponents/PartList";
import ActionList from "../../../../BM/Tabs/SubComponents/ActionList";
import WorkDetails from "../../../../BM/Tabs/SubComponents/WorkDetails";
import { useForm } from "react-hook-form";
import { Col, Row } from "react-bootstrap";

const MiddlewareForTablesOfMTD = ({
  partsData,
  actionData,
  workData,
  isEditable,
  setValue,

  requestSheet_year,
  requestSheet_quarter,
}) => {
  const [parts, setParts] = useState([]);
  const [actions, setActions] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);

  const {
    register,
    clearErrors,
    formState: { errors },
  } = useForm({});

  useEffect(() => {
    setParts(partsData);
    setActions(actionData);
    setWorkDetails(workData);
  }, [partsData, actionData, workData]);

  return (
    <div className=" m-0 border p-2">
      <Row className="d-flex align-items-center">
        <Col>
          <h6>RequestSheet Year : {requestSheet_year}</h6>
          <h6>RequestSheet Quarter : {requestSheet_quarter}</h6>
        </Col>
      </Row>
      <Row className="d-flex align-items-center">
        <Col lg={6} sm={12}>
          <Row className="">
            <PartList
              setValue={setValue}
              parts={parts}
              setParts={setParts}
              isEditable={isEditable}
              clearErrors={clearErrors}
            />
            <input
              {...register("partList")}
              className="visually-hidden"
            ></input>
            {errors?.["partList"] && (
              <p className="text-error">{errors?.["partList"]?.message}</p>
            )}
          </Row>
        </Col>
        <Col lg={6} sm={12}>
          <Row className="">
            <ActionList
              setValue={setValue}
              actions={actions}
              setActions={setActions}
              clearErrors={clearErrors}
              isEditable={isEditable}
            />
            <input
              {...register("actionValidation")}
              className="visually-hidden"
            ></input>
            {errors?.["actionValidation"] && (
              <p className="text-error">
                {errors?.["actionValidation"]?.message}
              </p>
            )}
          </Row>
        </Col>
        <Col sm={12}>
          <Row className="">
            <WorkDetails
              setValue={setValue}
              workDetails={workDetails}
              setWorkDetails={setWorkDetails}
              clearErrors={clearErrors}
              isEditable={isEditable}
            />
            <input
              {...register("workDetailsValidation", {
                // required: "This field is required",
              })}
              className="visually-hidden"
            ></input>
            {errors?.["workDetailsValidation"] && (
              <p className="text-error">
                {errors?.["workDetailsValidation"]?.message}
              </p>
            )}
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default MiddlewareForTablesOfMTD;
