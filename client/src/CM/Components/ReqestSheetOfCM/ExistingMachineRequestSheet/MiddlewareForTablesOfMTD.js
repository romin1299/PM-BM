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
  allDataOFTableFilledByOperator,
  setAllDataOFTableFilledByOperator,
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

  useEffect(() => {
    if (parts || actions || workDetails)
      setAllDataOFTableFilledByOperator({
        parts,
        actions,
        workDetails,
      });
  }, [parts, actions, workDetails, setAllDataOFTableFilledByOperator]);

  return (
    <>
      <Col lg={6} sm={12}>
        <Row className="">
          <PartList
            parts={parts}
            setParts={setParts}
            isEditable={isEditable}
            clearErrors={clearErrors}
          />
          <input {...register("partList")} className="visually-hidden"></input>
          {errors?.["partList"] && (
            <p className="text-error">{errors?.["partList"]?.message}</p>
          )}
        </Row>
      </Col>
      <Col lg={6} sm={12}>
        <Row className="">
          <ActionList
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
    </>
  );
};

export default MiddlewareForTablesOfMTD;
