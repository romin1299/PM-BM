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
  errors,
  clearErrors,

  requestSheet_year,
  requestSheet_quarter,
  supportingTMList,
}) => {
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
            <PartListMiddleware
              setValue={setValue}
              isEditable={isEditable}
              clearErrors={clearErrors}
              errors={errors}
              partsData={partsData}
            />
          </Row>
        </Col>
        <Col lg={6} sm={12}>
          <Row className="">
            <ActionListMiddleware
              setValue={setValue}
              isEditable={isEditable}
              clearErrors={clearErrors}
              errors={errors}
              actionData={actionData}
            />
          </Row>
        </Col>
        <Col sm={12}>
          <Row className="">
            <WorkDetailsMiddleware
              setValue={setValue}
              isEditable={isEditable}
              clearErrors={clearErrors}
              errors={errors}
              supportingTMList={supportingTMList}
              workData={workData}
            />
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default MiddlewareForTablesOfMTD;

const PartListMiddleware = ({
  setValue,
  isEditable,
  clearErrors,
  errors,
  partsData,
}) => {
  const [parts, setParts] = useState([]);

  useEffect(() => {
    setParts(partsData);
  }, [partsData]);

  return (
    <>
      <PartList
        setValue={setValue}
        parts={parts}
        setParts={setParts}
        isEditable={isEditable}
        clearErrors={clearErrors}
      />
      {isEditable && errors?.["changedParts"] && (
        <p className="text-error">{errors?.["changedParts"]?.message}</p>
      )}
    </>
  );
};
const ActionListMiddleware = ({
  setValue,
  isEditable,
  clearErrors,
  errors,
  actionData,
}) => {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    setActions(actionData);
  }, [actionData]);

  return (
    <>
      <ActionList
        setValue={setValue}
        actions={actions}
        setActions={setActions}
        clearErrors={clearErrors}
        isEditable={isEditable}
      />

      {isEditable && errors?.["actionAndCounterMeasureStep"] && (
        <p className="text-error">
          {errors?.["actionAndCounterMeasureStep"]?.message}
        </p>
      )}
    </>
  );
};
const WorkDetailsMiddleware = ({
  setValue,
  isEditable,
  clearErrors,
  errors,
  supportingTMList,
  workData,
}) => {
  const [workDetails, setWorkDetails] = useState([]);

  useEffect(() => {
    setWorkDetails(workData);
  }, [workData]);

  return (
    <>
      <WorkDetails
        supportingTMList={supportingTMList}
        setValue={setValue}
        workDetails={workDetails}
        setWorkDetails={setWorkDetails}
        clearErrors={clearErrors}
        isEditable={isEditable}
      />
      {isEditable && errors?.["workDetails"] && (
        <p className="text-error">{errors?.["workDetails"]?.message}</p>
      )}
    </>
  );
};
