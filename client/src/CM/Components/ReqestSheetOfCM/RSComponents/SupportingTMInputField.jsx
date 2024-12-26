import React, { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import Multiselect from "multiselect-react-dropdown";
import { useNavigate } from "react-router-dom";

const SupportingTMInputField = ({
  control,
  setValue,
  trigger,
  errors,
  assigned_users,
  selectedYear,
}) => {
  const navigate = useNavigate();

  const [supportingTMList, setSupportingTMList] = useState([]);

  const getSupportingTMDetails = async () => {
    try {
      const res = await fetch(
        `/getSupportingTMDetailsForRequestSheetOfCM/?current_year=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (res.status === 404) {
        navigate("/", { replace: true });
      } else {
        const { TLHOSS_and_TM_user_list } = await res.json();
        setSupportingTMList(TLHOSS_and_TM_user_list);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSupportingTMDetails();
  }, []);

  return (
    <Controller
      name="assignUserForCM"
      control={control}
      rules={{
        required: "Please select the assign user",
      }}
      render={({ field }) => (
        <>
          <Multiselect
            {...field}
            displayValue="tm_name"
            selectedValues={assigned_users}
            options={supportingTMList} // Options to display in the dropdown
            onSelect={async (selectedList) => {
              setValue("assignUserForCM", selectedList);
              trigger("assignUserForCM");
            }} // Function will trigger on select event
            onRemove={async (selectedList) => {
              setValue("assignUserForCM", selectedList);
              trigger("assignUserForCM");
            }} // Function will trigger on remove event
            style={{
              multiselectContainer: {
                width: "14rem",
              },
            }}
          />
          {errors.assignUserForCM && (
            <p className="text-error">{errors?.assignUserForCM?.message}</p>
          )}
        </>
      )}
    />
  );
};

export default SupportingTMInputField;
