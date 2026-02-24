import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { axiosGetOrDelete } from "../../Utils/axiosUtils";

const MTDHODApproval = ({ register = () => {}, errors = () => {} }) => {
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    (async () => {
      const { isError, users } = await axiosGetOrDelete({
        url: "/v1/spare/user",
        axiosProps: {
          params: {
            tm_department: "MTD",
            tm_grade: "HOD",
          },
        },
      });
      if (!isError) setUserList(users);
    })();
  }, []);
  return (
    <Col className="d-flex flex-column col-auto">
      <div className="d-flex align-items-center justify-content-between">
        <small>MTD HOD</small>
        <select
          style={{ fontSize: "14px" }}
          className={"d-inline"}
          {...register("mtdHODApprovalIfBudgetIsNG.user._id", {
            required: "Please select MTD HOD",
          })}
        >
          <option selected disabled value="">
            Please select
          </option>
          {userList?.map((obj) => (
            <option value={obj?._id}>{obj?.tm_name}</option>
          ))}
        </select>
      </div>
      {errors?.mtdHODApprovalIfBudgetIsNG?.user?._id && (
        <p className="text-error mb-1">
          {errors?.mtdHODApprovalIfBudgetIsNG?.user?._id?.message}
        </p>
      )}
    </Col>
  );
};

const NGBudgetComponent = ({ register = () => {}, errors = () => {} }) => {
  return (
    <>
      <Row className="border">
        <MTDHODApproval register={register} errors={errors} />
        <Col className="d-flex flex-column col-auto">
          <div className="d-flex align-items-center justify-content-between">
            <small>Remarks</small>
            <input
              type="text"
              className="w-75"
              {...register(`remarkByRequestGeneratorIfBudgetIsNG`, {
                required: "Please enter the remarks",
              })}
            />
          </div>
          {errors?.["remarkByRequestGeneratorIfBudgetIsNG"] && (
            <p className="text-error mb-1">
              {errors?.["remarkByRequestGeneratorIfBudgetIsNG"]?.message}
            </p>
          )}
        </Col>

        <Col className="d-flex align-items-center justify-content-between">
          <button type="submit" className="btn bg-success">
            Send for HOD approval
          </button>
        </Col>
      </Row>
    </>
  );
};

export default NGBudgetComponent;
