import React, { useContext } from "react";
import Modal from "react-bootstrap/Modal";
import { useForm, get } from "react-hook-form";
import { TextField } from "@material-ui/core";

import "./UserManagement.scss";

import RoutingContext from "../../../context/routing/RoutingContext";
import { axiosGetOrDelete, axiosPostOrPatch } from "../../Utils/axiosUtils";
import CustomTextField from "../../Component/FormComponent/CustomTextField";

/**
 * A tool-room user belongs to the plant, so this form asks for no section,
 * sub-section or cell. The server ignores them if they are sent.
 */

/** Who may add whom - the same hierarchy the server enforces. */
const userTypes = (loggedUserType) =>
  loggedUserType === "Section-Admin"
    ? ["HOSS", "Supervisor", "Office Person"]
    : ["Supervisor", "Office Person"];

/** Same rules as the server, so a bad value is caught before it is sent. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_PATTERN = /^[0-9+()\-\s]{7,20}$/;

const ReadOnlyField = ({ label, value }) => (
  <div className="pwd-container">
    <span className="fieldTitle">{label}: </span>
    <TextField
      className="textField"
      value={value ?? ""}
      autoComplete="off"
      type="text"
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  </div>
);

const SelectField = ({
  options = [],
  fieldName,
  register,
  registerProp = {},
  errors = {},
}) => {
  const error = get(errors, fieldName);

  return (
    <div style={{ width: "100%", marginTop: "0.5rem" }}>
      <select
        className="form-select form-select-sm textField"
        style={{ width: "100%" }}
        autoComplete="off"
        defaultValue=""
        {...register(fieldName, registerProp)}
      >
        <option disabled value="">
          Please select
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-error mb-1">{error?.message}</p>}
    </div>
  );
};

const UserAddOrEdit = ({
  show = false,
  isEdit = false,
  selectedRow = {},
  handleModalState = () => {},
  handleUpdateTableData = () => {},
}) => {
  const context = useContext(RoutingContext);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: async () => {
      if (!isEdit) {
        const returnObj = { plant_data: context?.plant_data };

        // Fixed by who is adding: a Plant-Admin adds Section-Admins, a
        // Supervisor adds Office Persons. A Section-Admin or HOSS chooses.
        if (context.user_type === "Plant-Admin") {
          returnObj["tm_grade"] = "HOS";
          returnObj["user_type"] = "Section-Admin";
        } else if (context.user_type === "Supervisor") {
          returnObj["user_type"] = "Office Person";
        }

        return returnObj;
      }

      const { isError, user } = await axiosGetOrDelete({
        url: "/v1/spare/toolRoom/user",
        axiosProps: {
          params: {
            _id: selectedRow?._id,
          },
        },
      });
      if (!isError) return user;
      return {};
    },
  });

  const handleSubmitUser = async (formValue) => {
    // Only what the server accepts. The edit form is filled from the stored
    // user, whose plant and grade are not the form's to change.
    const {
      tm_no,
      tm_name,
      user_type,
      joining_date,
      email,
      contact_no,
      address,
    } = formValue;

    const { isError, user } = await axiosPostOrPatch({
      url: "/v1/spare/toolRoom/user",
      apiType: isEdit ? "patch" : "post",
      axiosBody: {
        tm_no,
        tm_name,
        user_type,
        joining_date,
        email,
        contact_no,
        address,
      },
      axiosProps: {
        params: isEdit ? { _id: selectedRow?._id } : {},
      },
    });

    if (!isError) {
      handleUpdateTableData({ user, action: isEdit ? "EDIT" : "ADD" });
      handleModalState();
      reset();
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleModalState}
        backdrop="static"
        keyboard={false}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <form onSubmit={handleSubmit(handleSubmitUser)}>
          <Modal.Header closeButton>
            <Modal.Title>{isEdit ? "Edit" : "Add"} User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <CustomTextField
              register={register}
              registerProp={{
                required: "Please enter TM name",
                validate: (value) =>
                  !!value?.trim() || "Please enter TM name",
              }}
              errors={errors}
            />
            <CustomTextField
              label="TM Number"
              fieldName="tm_no"
              inputProps={{
                type: "number",
              }}
              register={register}
              registerProp={{
                required: !isEdit && "Please enter TM number",
                validate: (value) =>
                  !value ||
                  (Number.isInteger(Number(value)) && Number(value) > 0) ||
                  "TM number must be a positive whole number",
              }}
              errors={errors}
            />

            {watch("tm_grade") && (
              <ReadOnlyField label="TM Grade" value={watch("tm_grade")} />
            )}

            {["Section-Admin", "HOSS"]?.includes(context.user_type) ? (
              <div className="pwd-container">
                <span className="fieldTitle">User Type:</span>
                <SelectField
                  fieldName="user_type"
                  options={userTypes(context?.user_type)}
                  register={register}
                  registerProp={{ required: "Please select user type" }}
                  errors={errors}
                />
              </div>
            ) : (
              <ReadOnlyField label="User Type" value={watch("user_type")} />
            )}

            <ReadOnlyField label="Plant" value={watch("plant_data")} />

            <CustomTextField
              label="Joining Date"
              fieldName="joining_date"
              inputProps={{
                type: "date",
              }}
              register={register}
              registerProp={{
                required: !isEdit && "Please select joining date",
              }}
              errors={errors}
            />
            <CustomTextField
              label="Email"
              fieldName="email"
              register={register}
              registerProp={{
                validate: (value) =>
                  !value?.trim() ||
                  EMAIL_PATTERN.test(value.trim()) ||
                  "Please enter a valid email address",
              }}
              errors={errors}
            />
            <CustomTextField
              label="Contact No"
              fieldName="contact_no"
              register={register}
              registerProp={{
                validate: (value) =>
                  !value?.trim() ||
                  CONTACT_PATTERN.test(value.trim()) ||
                  "Please enter a valid contact number",
              }}
              errors={errors}
            />
            <CustomTextField
              label="Address"
              fieldName="address"
              register={register}
              errors={errors}
            />
          </Modal.Body>
          <Modal.Footer>
            <button type="submit" className="btn-success">
              Submit
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
};

export default UserAddOrEdit;
