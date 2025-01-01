import React, { useEffect, useState } from "react";
import { Row, Col, Form } from "react-bootstrap";
import axios from "axios";
import DropdownComponent from "./DropdownComponent";

const UserApprovalSelectFields = ({
  watch,
  setValue,
  register,
  errors,
  isEditable,
}) => {
  const [dropdownUsers, setDropdownUsers] = useState({});

  const getApprovalListOfCM = async () => {
    try {
      const response = await axios.get(`/getApprovalUserList`);
      setDropdownUsers(response?.data?.userList);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getApprovalListOfCM();
  }, []);

  return (
    <Row className="m-0 d-flex border align-items-start p-2">
      <Col lg={6} style={{ paddingRight: "0px" }}>
        <Row className="row m-0 border">
          <Col lg={4} className="m-0  border center p-2">
            <small className="mb-0 d-flex align-items-center justify-content-start">
              <b>MTD TL/HOSS Permission</b>&nbsp;&nbsp;&nbsp;
            </small>
            <Form>
              {["radio"].map((type) => (
                <div key={`inline-${type}`} className="d-flex gap-4">
                  <Form.Check
                    flex
                    label="Yes"
                    name="group1"
                    type={type}
                    disabled={!isEditable}
                    id={`inline-${type}-1`}
                    value="Yes"
                    {...register(
                      "current_commonDataFilledByAssignUser.isPermissionOfMTDTL",
                      {
                        required: "This field is required",
                      }
                    )}
                  />
                  <Form.Check
                    flex
                    label="No"
                    name="group1"
                    disabled={!isEditable}
                    type={type}
                    id={`inline-${type}-2`}
                    value="No"
                    {...register(
                      "current_commonDataFilledByAssignUser.isPermissionOfMTDTL",
                      {
                        required: "This field is required",
                      }
                    )}
                  />
                </div>
              ))}
            </Form>
            {errors?.current_commonDataFilledByAssignUser
              ?.isPermissionOfMTDTL && (
              <p className="text-error">
                {
                  errors?.current_commonDataFilledByAssignUser
                    ?.isPermissionOfMTDTL?.message
                }
              </p>
            )}
            <br />
          </Col>
          <Col lg={8}>
            {watch(
              "current_commonDataFilledByAssignUser.isPermissionOfMTDTL"
            ) === "Yes" && (
              <>
                <Col className="pt-2 d-flex">
                  {dropdownUsers?.MTDTLList && (
                    <DropdownComponent
                      setValue={setValue}
                      title="Select MTD TL/HOSS:"
                      userDropdown={dropdownUsers?.MTDTLList}
                      label="Select MTD TL/HOSS"
                      formKey="approvalObj_MTD_TL.approvalOfMTD_TL"
                      register={register}
                      watch={watch}
                      errors={errors}
                    />
                  )}
                </Col>
                <br />
              </>
            )}
            <Col className="pt-2 d-flex mb-2">
              {dropdownUsers?.MTDHOSList && (
                <DropdownComponent
                  setValue={setValue}
                  title="Select MTD HOS:"
                  userDropdown={dropdownUsers?.MTDHOSList}
                  label="Select MTD HOS"
                  formKey="approvalObj_MTD_HOS.approvalOfMTD_HOS"
                  register={register}
                  watch={watch}
                  errors={errors}
                />
              )}
            </Col>
          </Col>
        </Row>
      </Col>
      <Col lg={6} style={{ paddingRight: "0px" }}>
        <Row className="row m-0 border">
          <Col lg={3} md={12} className="m-0  border center p-2">
            <small
              className="mb-0 d-flex align-items-center justify-content-start"
              style={{
                width: "fit-content",
              }}
            >
              <b>PRD TL Permission</b>&nbsp;&nbsp;&nbsp;
            </small>
            <Form>
              {["radio"].map((type) => (
                <div key={`inline-${type}`} className="d-flex gap-4">
                  <Form.Check
                    flex
                    label="Yes"
                    name="group1"
                    type={type}
                    disabled={!isEditable}
                    id={`inline-${type}-1`}
                    value="Yes"
                    {...register(
                      "current_commonDataFilledByAssignUser.isPermissionOfPRDTL",
                      {
                        required: "This field is required",
                      }
                    )}
                  />
                  <Form.Check
                    flex
                    label="No"
                    name="group1"
                    type={type}
                    disabled={!isEditable}
                    id={`inline-${type}-2`}
                    value="No"
                    {...register(
                      "current_commonDataFilledByAssignUser.isPermissionOfPRDTL",
                      {
                        required: "This field is required",
                      }
                    )}
                  />
                </div>
              ))}
            </Form>
            {errors?.current_commonDataFilledByAssignUser
              ?.isPermissionOfPRDTL && (
              <p className="text-error">
                {
                  errors?.current_commonDataFilledByAssignUser
                    ?.isPermissionOfPRDTL?.message
                }
              </p>
            )}
            <br />
          </Col>
          <Col lg={8} sm={12}>
            {watch(
              "current_commonDataFilledByAssignUser.isPermissionOfPRDTL"
            ) === "Yes" && (
              <>
                <Col lg={12} className="mt-2 d-flex">
                  {dropdownUsers?.PRDTLList && (
                    <DropdownComponent
                      setValue={setValue}
                      title="Select PRD TL:"
                      userDropdown={dropdownUsers?.PRDTLList}
                      label="Select PRD TL"
                      formKey="approvalObj_PRD_TL.approvalOfPRD_TL"
                      register={register}
                      watch={watch}
                      errors={errors}
                    />
                  )}
                </Col>
              </>
            )}
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default UserApprovalSelectFields;
