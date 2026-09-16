import React, { useEffect } from "react";

const DropdownComponent = ({
  setValue,
  watch,
  title,
  userDropdown,
  label,
  formKey,
  register,
  isEditable,
  requiredMSG = "Please select",
}) => {
  const selectedUserRef = watch(`${formKey}.userRef`);

  /**
   * Mirrors the chosen user's full record onto the form key, so the sheet
   * carries the name alongside the id.
   *
   * Nothing is written while the list is still loading: doing so wrote
   * undefined over whatever the form already held, which erased a pre-filled
   * approver on a sheet opened before the user list arrived.
   */
  useEffect(() => {
    if (!userDropdown) return;

    setValue(
      formKey,
      userDropdown.find((item) => item?.userRef === selectedUserRef)
    );
  }, [setValue, formKey, userDropdown, selectedUserRef]);

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
        disabled={!isEditable}
        value={watch(`${formKey}.userRef`)}
        {...register(`${formKey}.userRef`, {
          required: requiredMSG,
        })}
      >
        <option value="">{label} </option>
        {/* The list arrives after first render, so it is absent for a moment. */}
        {(userDropdown ?? []).map((value) => (
          <option key={value?.userRef} value={value?.userRef}>
            {value?.tm_name}
          </option>
        ))}
      </select>
    </>
  );
};

export default DropdownComponent;
