import React, { useState, useContext, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Checkbox,
  Select,
  ListItemText,
  MenuItem,
  InputLabel,
  FormControl,
} from "@material-ui/core";

import "./UserManagement.scss";

import RoutingContext from "../../../context/routing/RoutingContext";
import { axiosGetOrDelete, axiosPostOrPatch } from "../../Utils/axiosUtils";
import CustomTextField from "../../Component/FormComponent/CustomTextField";

const userTypes = (loggedUserType) =>
  loggedUserType === "Section-Admin"
    ? ["HOSS", "Supervisor", "Office Person"]
    : ["Supervisor", "Office Person"];

const ReadOnlyField = ({ label, value }) => (
  <div className="pwd-container">
    <span className="fieldTitle">{label}: </span>
    <TextField
      className="textField"
      value={value}
      autoComplete="off"
      type="text"
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  </div>
);

const SelectField = ({
  options = [],
  fieldName = "section_data",
  register,
  resetOtherValueOnChange = {},
}) => (
  <div style={{ width: "100%", marginTop: "0.5rem" }}>
    <select
      class="form-select form-select-sm"
      aria-label=".form-select-sm example"
      style={{ width: "100%" }}
      id="standard-select-currency"
      className="textField"
      fullWidth
      autoComplete="off"
      variant="standard"
      {...register(fieldName)}
      {...resetOtherValueOnChange}
    >
      <option selected disabled value="">
        Please select
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const CustomDropdown = ({
  label = "Section",
  fieldName = "section_data",
  register,
  url = "/postPlantToGetSectionListOfUserAssign",
  apiBody = {},
  apiResKeyForArray = "sectionArray",
  effectDep = [],
  resetOtherValueOnChange = {},
}) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        const data = await res.json();
        if (!cancelled) setOptions(data?.[apiResKeyForArray]);
      } catch (err) {
        console.error(err);
        return null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, effectDep);

  if (options?.length > 0)
    return (
      <div className="pwd-container">
        <span className="fieldTitle">{label}:</span>
        <SelectField
          fieldName={fieldName}
          options={options}
          register={register}
          resetOtherValueOnChange={resetOtherValueOnChange}
        />
      </div>
    );

  return null;
};

const MultiSelectField = ({
  label = "Sub Section",
  fieldName = "subSection_data",
  control,
  url = "/postSectionToGetSubSectionList",
  apiBody = {},
  apiResKeyForArray = "subSectionArray",
  effectDep = [],
  resetOtherValueOnChange = {},
}) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        const data = await res.json();
        if (!cancelled) setOptions(data?.[apiResKeyForArray] ?? []);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, effectDep);

  if (options?.length > 0)
    return (
      <div className="pwd-container">
        <span className="fieldTitle">{label}:</span>
        <div style={{ width: "100%" }}>
          <Controller
            name={fieldName}
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Please select</InputLabel>
                <Select
                  {...field}
                  multiple
                  label="Please select"
                  renderValue={(selected) => selected.join(", ")}
                  MenuProps={{
                    PaperProps: { style: { maxHeight: 30 * 4.5 + 8 } },
                  }}
                  {...resetOtherValueOnChange}
                >
                  {options.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox checked={field.value?.includes(name)} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </div>
      </div>
    );
  return null;
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
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: async () => {
      if (!isEdit) {
        let returnObj = {
          plant_data: context?.plant_data,
        };

        const handleSetHierarchy = () => {
          returnObj["section_data"] = context?.section_data;
          returnObj["subSection_data"] = context?.subSection_data;
          returnObj["cell_data"] = context?.cell_data;
        };

        if (context.user_type === "Plant-Admin") {
          returnObj["tm_grade"] = "HOS";
          returnObj["user_type"] = "Section-Admin";
        } else if (
          context.user_type === "Section-Admin" ||
          context.user_type === "HOSS" ||
          context.user_type === "Supervisor"
        ) {
          handleSetHierarchy();
          if (context.user_type === "Supervisor")
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
    let params = {};

    if (isEdit)
      params = {
        _id: selectedRow?._id,
      };

    const { isError, user } = await axiosPostOrPatch({
      url: "/v1/spare/toolRoom/user",
      apiType: isEdit ? "patch" : "post",
      axiosBody: formValue,
      axiosProps: {
        params,
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
                />
              </div>
            ) : (
              <ReadOnlyField label="User Type" value={watch("user_type")} />
            )}

            <ReadOnlyField label="Plant" value={watch("plant_data")} />

            {context.user_type === "Plant-Admin" && watch("plant_data") ? (
              <CustomDropdown
                register={register}
                apiBody={{ plants: watch("plant_data") }}
                effectDep={[watch("plant_data")]}
                resetOtherValueOnChange={{
                  onClick: () => {
                    setValue("subSection_data", [], {
                      shouldDirty: true,
                    });
                    setValue("cell_data", [], {
                      shouldDirty: true,
                    });
                  },
                }}
              />
            ) : (
              <ReadOnlyField label="Section" value={watch("section_data")} />
            )}

            {watch("section_data") && (
              <MultiSelectField
                watch={watch}
                setValue={setValue}
                control={control}
                apiBody={{ section: watch("section_data") }}
                effectDep={[watch("section_data")]}
                resetOtherValueOnChange={{
                  onClick: () => {
                    setValue("cell_data", [], {
                      shouldDirty: true,
                    });
                  },
                }}
              />
            )}

            {watch("subSection_data") && (
              <MultiSelectField
                label="Cell"
                fieldName="cell_data"
                url="/postSubSectionToGetCellListOfUserAssign"
                apiBody={{
                  subSection: watch("subSection_data"),
                }}
                apiResKeyForArray="cellArray"
                watch={watch}
                setValue={setValue}
                control={control}
                effectDep={[watch("subSection_data")]}
              />
            )}

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
              errors={errors}
            />
            <CustomTextField
              label="Contact No"
              fieldName="contact_no"
              register={register}
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
