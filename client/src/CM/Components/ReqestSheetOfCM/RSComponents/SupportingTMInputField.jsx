import React, { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import Multiselect from "multiselect-react-dropdown";
import { useNavigate } from "react-router-dom";

const SupportingTMInputField = ({
  control,
  setValue,
  trigger,
  errors,
  watch,
}) => {
  const navigate = useNavigate();

  const [supportingTMList, setSupportingTMList] = useState([
    {
      _id: "",
      user_type: "",
      tm_grade: "",
      tm_department: "",
      tm_name: "",
    },
  ]);

  const getSupportingTMDetails = async () => {
    try {
      const res = await fetch(`/getSupportingTMDetailsForRequestSheetOfCM`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
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
      name="current_commonDataFilledByAssignUser.assignUserForCM"
      control={control}
      // rules={{
      //   required: "Please select the assign user",
      // }}
      render={({ field }) => (
        <>
          <Multiselect
            {...field}
            displayValue="tm_name"
            selectedValues={
              watch("current_commonDataFilledByAssignUser.assignUserForCM") ||
              []
            }
            options={supportingTMList} // Options to display in the dropdown
            onSelect={async (selectedList) => {
              setValue(
                "current_commonDataFilledByAssignUser.assignUserForCM",
                selectedList,
                { shouldDirty: true }
              );
              trigger("current_commonDataFilledByAssignUser.assignUserForCM");
            }} // Function will trigger on select event
            onRemove={async (selectedList) => {
              setValue(
                "current_commonDataFilledByAssignUser.assignUserForCM",
                selectedList,
                { shouldDirty: true }
              );
              trigger("current_commonDataFilledByAssignUser.assignUserForCM");
            }} // Function will trigger on remove event
            style={{
              multiselectContainer: {
                width: "14rem",
              },
            }}
          />
          {errors?.current_commonDataFilledByAssignUser?.assignUserForCM && (
            <p className="text-error">
              {
                errors?.current_commonDataFilledByAssignUser.assignUserForCM
                  ?.message
              }
            </p>
          )}
        </>
      )}
    />
  );
};

export default SupportingTMInputField;
