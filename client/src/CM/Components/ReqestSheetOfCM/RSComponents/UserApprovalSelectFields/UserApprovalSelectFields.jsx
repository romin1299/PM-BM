import React, { useEffect, useState } from "react";
import { Row, Col, Form } from "react-bootstrap";
import axios from "axios";
import DropdownComponent from "./DropdownComponent";

/**
 * The requesting department's closing approvals, asked for only on a CM raised
 * from an approved New-Machine modification request. Each is a plain approval
 * dropdown like the MTD ones above it.
 */
const PED_REFLECTION_APPROVALS = [
  {
    key: "PED_TL",
    title: "Checked by PED TL/HOSS:",
    label: "Select PED TL/HOSS",
    shortLabel: "PED TL/HOSS",
    listKey: "PEDTLList",
  },
  {
    key: "PED_HOS",
    title: "Approved by PED HOS:",
    label: "Select PED HOS",
    shortLabel: "PED HOS",
    listKey: "PEDHOSList",
  },
];

const UserApprovalSelectFields = ({
  watch,
  setValue,
  register,
  errors,
  isEditable,
  isRequired,
  isPEDReflection = false,
}) => {
  const [dropdownUsers, setDropdownUsers] = useState({});

  /**
   * PED's approvers are held apart from the rest, not merged into one bag.
   *
   * The endpoint answers every call with all eight lists, filling only the ones
   * asked for and leaving the rest empty. Merged into shared state, whichever
   * response arrived second overwrote the other's lists with those empties —
   * and since the MTD call asks for every MTD and PRD TL/HOSS in the plant
   * while PED's asks for a handful, the MTD reply was the one that landed last
   * and left both PED dropdowns with nothing to offer.
   */
  const [pedDropdownUsers, setPedDropdownUsers] = useState({});

  const getApprovalListOfCM = async () => {
    try {
      const response = await axios.get(
        `/getApprovalUserList/?departmentFilterForTL=MTD-PRD`
      );
      setDropdownUsers(response?.data?.userList);
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * PED's approvers need their own call, and a plant-wide one: they are not the
   * MTD requester's colleagues, so narrowed to the requester's own section the
   * list comes back empty. Kept separate so the MTD and PRD lists above stay
   * scoped exactly as they were.
   */
  const getPEDApprovalListOfCM = async () => {
    try {
      const response = await axios.get(
        `/getApprovalUserList/?departmentFilterForTL=PED&departmentFilterForHOS=PED&scope=plant`
      );
      setPedDropdownUsers(response?.data?.userList ?? {});
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (isEditable) getApprovalListOfCM();
  }, [isEditable]);

  useEffect(() => {
    if (isEditable && isPEDReflection) getPEDApprovalListOfCM();
  }, [isEditable, isPEDReflection]);

  return (
    <>
      <div className="p-2 ">
        <b>Approval flow:</b> MTD TL -&gt; MTD HOSS -&gt; MTD HOS -&gt; PRD TL
        {isPEDReflection &&
          PED_REFLECTION_APPROVALS.map(({ shortLabel }) => (
            <React.Fragment key={shortLabel}> -&gt; {shortLabel}</React.Fragment>
          ))}
      </div>
      <div className="border">
        <Row className="m-0 d-flex border align-items-start p-2">
          <Col>
            {isEditable ? (
              dropdownUsers?.MTDTLList && (
                <DropdownComponent
                  requiredMSG={isRequired ? "Please select" : false}
                  isEditable={isEditable}
                  setValue={setValue}
                  title="Select MTD TL:"
                  userDropdown={dropdownUsers?.MTDTLList}
                  label="Select MTD TL"
                  formKey="approvalObj_MTD_TL.approvalOfMTD_TL"
                  register={register}
                  watch={watch}
                />
              )
            ) : (
              <>
                <b>MTD TL:</b>&nbsp;
                {(watch("approvalObj_MTD_TL.approvalOfMTD_TL.tm_name") || "") +
                  " - " +
                  (watch(
                    "approvalObj_MTD_TL.approvalOfMTD_TL.approvalStatus"
                  ) || "")}
              </>
            )}
            {errors?.approvalObj_MTD_TL?.approvalOfMTD_TL?.[`userRef`] && (
              <p className="text-error">
                {
                  errors?.approvalObj_MTD_TL?.approvalOfMTD_TL?.[`userRef`]
                    ?.message
                }
              </p>
            )}
          </Col>
          <Col>
            {isEditable ? (
              dropdownUsers?.MTDTLList && (
                <DropdownComponent
                  requiredMSG={isRequired ? "Please select" : false}
                  isEditable={isEditable}
                  setValue={setValue}
                  title="Select MTD HOSS:"
                  userDropdown={dropdownUsers?.MTDTLList}
                  label="Select MTD HOSS"
                  formKey="approvalObj_MTD_HOSS.approvalOfMTD_HOSS"
                  register={register}
                  watch={watch}
                />
              )
            ) : (
              <>
                <b>MTD HOSS:</b>&nbsp;
                {(watch("approvalObj_MTD_HOSS.approvalOfMTD_HOSS.tm_name") ||
                  "") +
                  " - " +
                  (watch(
                    "approvalObj_MTD_HOSS.approvalOfMTD_HOSS.approvalStatus"
                  ) || "")}
              </>
            )}
            {errors?.approvalObj_MTD_HOSS?.approvalOfMTD_HOSS?.[`userRef`] && (
              <p className="text-error">
                {
                  errors?.approvalObj_MTD_HOSS?.approvalOfMTD_HOSS?.[`userRef`]
                    ?.message
                }
              </p>
            )}
          </Col>
          <Col>
            {isEditable ? (
              dropdownUsers?.MTDHOSList && (
                <DropdownComponent
                  requiredMSG={isRequired ? "Please select" : false}
                  isEditable={isEditable}
                  setValue={setValue}
                  title="Select MTD HOS:"
                  userDropdown={dropdownUsers?.MTDHOSList}
                  label="Select MTD HOS"
                  formKey="approvalObj_MTD_HOS.approvalOfMTD_HOS"
                  register={register}
                  watch={watch}
                />
              )
            ) : (
              <>
                <b>MTD HOS:</b>&nbsp;
                {(watch("approvalObj_MTD_HOS.approvalOfMTD_HOS.tm_name") ||
                  "") +
                  " - " +
                  (watch(
                    "approvalObj_MTD_HOS.approvalOfMTD_HOS.approvalStatus"
                  ) || "")}
              </>
            )}
            {errors?.approvalObj_MTD_HOS?.approvalOfMTD_HOS?.[`userRef`] && (
              <p className="text-error">
                {
                  errors?.approvalObj_MTD_HOS?.approvalOfMTD_HOS?.[`userRef`]
                    ?.message
                }
              </p>
            )}
          </Col>
          <Col style={{ paddingRight: "0px" }}>
            <div lg={3} md={12} className="m-0  border center p-2">
              <small
                className="mb-0 d-flex align-items-center justify-content-start"
                style={{
                  width: "fit-content",
                }}
              >
                <b>PRD TL Approval</b>&nbsp;&nbsp;&nbsp;
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
                      {...register("isPermissionOfPRDTL", {
                        required: isRequired ? "This field is required" : false,
                      })}
                    />
                    <Form.Check
                      flex
                      label="No"
                      name="group1"
                      type={type}
                      disabled={!isEditable}
                      id={`inline-${type}-2`}
                      value="No"
                      {...register("isPermissionOfPRDTL", {
                        required: isRequired ? "This field is required" : false,
                      })}
                    />
                  </div>
                ))}
              </Form>
              {errors?.isPermissionOfPRDTL && (
                <p className="text-error">
                  {errors?.isPermissionOfPRDTL?.message}
                </p>
              )}
            </div>
            <div lg={8} sm={12}>
              {watch("isPermissionOfPRDTL") === "Yes" && (
                <>
                  <Col lg={12} className="mt-2 d-flex">
                    {isEditable ? (
                      dropdownUsers?.PRDTLList && (
                        <DropdownComponent
                          requiredMSG={
                            watch("isPermissionOfPRDTL") === "Yes" || isRequired
                              ? "Please select"
                              : false
                          }
                          isEditable={isEditable}
                          setValue={setValue}
                          title="Select PRD TL:"
                          userDropdown={dropdownUsers?.PRDTLList}
                          label="Select PRD TL"
                          formKey="approvalObj_PRD_TL.approvalOfPRD_TL"
                          register={register}
                          watch={watch}
                        />
                      )
                    ) : (
                      <>
                        <b>PRD TL: </b>&nbsp;
                        {(watch(
                          "approvalObj_PRD_TL.approvalOfPRD_TL.tm_name"
                        ) || "") +
                          " - " +
                          (watch(
                            "approvalObj_PRD_TL.approvalOfPRD_TL.approvalStatus"
                          ) || "")}
                      </>
                    )}
                  </Col>
                  {errors?.approvalObj_PRD_TL?.approvalOfPRD_TL?.[
                    `userRef`
                  ] && (
                    <p className="text-error">
                      {
                        errors?.approvalObj_PRD_TL?.approvalOfPRD_TL?.[
                          `userRef`
                        ]?.message
                      }
                    </p>
                  )}
                </>
              )}
            </div>
          </Col>
        </Row>

        {/*
          Only a PED-reflection CM carries these: the department that asked for
          the modification checks and approves the work before the sheet closes.
        */}
        {isPEDReflection && (
          <Row className="m-0 d-flex border align-items-start p-2">
            {PED_REFLECTION_APPROVALS.map(
              ({ key, title, label, shortLabel, listKey }) => {
                const formKey = `approvalObj_${key}.approvalOf${key}`;
                const fieldError =
                  errors?.[`approvalObj_${key}`]?.[`approvalOf${key}`]?.userRef;

                return (
                  <Col key={key}>
                    {isEditable ? (
                      pedDropdownUsers?.[listKey] && (
                        <DropdownComponent
                          requiredMSG={isRequired ? "Please select" : false}
                          isEditable={isEditable}
                          setValue={setValue}
                          title={title}
                          userDropdown={pedDropdownUsers?.[listKey]}
                          label={label}
                          formKey={formKey}
                          register={register}
                          watch={watch}
                        />
                      )
                    ) : (
                      <>
                        <b>{shortLabel}:</b>&nbsp;
                        {(watch(`${formKey}.tm_name`) || "") +
                          " - " +
                          (watch(`${formKey}.approvalStatus`) || "")}
                      </>
                    )}
                    {fieldError && (
                      <p className="text-error">{fieldError?.message}</p>
                    )}
                  </Col>
                );
              }
            )}
          </Row>
        )}
      </div>
    </>
  );
};

export default UserApprovalSelectFields;
