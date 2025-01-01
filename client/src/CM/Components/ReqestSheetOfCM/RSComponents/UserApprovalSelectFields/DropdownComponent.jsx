import React, { useEffect } from "react";

const DropdownComponent = ({
  setValue,
  watch,
  title,
  userDropdown,
  label,
  formKey,
  register,
  errors,
  requiredMSG = "Please select",
}) => {
  useEffect(() => {
    setValue(
      formKey,
      userDropdown?.find(
        (item) => item?.userRef === watch(`${formKey}.userRef`)
      )
    );
    return;
  }, [watch, formKey, userDropdown, watch(`${formKey}.userRef`)]);

  return (
    <>
      <small
        className="mb-0 pt-1 "
        style={{
          fontSize: "15px",
          width: "fit-content",
          whiteSpace: "nowrap",
        }}
      >
        <b>{title}</b>
      </small>
      &nbsp;&nbsp;
      <select
        size="small"
        label={label}
        value={watch(`${formKey}.userRef`)}
        {...register(`${formKey}.userRef`, {
          required: requiredMSG,
        })}
      >
        <option value="">{label} </option>
        {userDropdown.map((value) => (
          <option value={value?.userRef}>{value?.tm_name}</option>
        ))}
      </select>
      {errors?.[`${formKey}.userRef`] && (
        <p className="text-error">{errors?.[`${formKey}.userRef`]?.message}</p>
      )}
    </>
  );
};

export default DropdownComponent;
