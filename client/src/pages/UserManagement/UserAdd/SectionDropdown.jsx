import React from "react";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

const SectionDropdown = ({ formik = {}, plant_names = "" }) => {
  const [{ isLoading, data }] = useSafeGetRequest({
    url: "/v2/postPlantToGetSectionListOfUserAssign",
    axiosConfig: {
      params: {
        plant_names,
      },
    },
    referenceArrayForUseEffect: [plant_names],
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        sections: [],
      },
    },
  });

  if (isLoading) return <h5>Loading....</h5>;

  return (
    <div className="pwd-container">
      <span>Section:</span>
      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <select
          class="form-select form-select-sm"
          aria-label=".form-select-sm example"
          style={{ width: "100%" }}
          id="standard-select-currency"
          name="section._id"
          className="textField"
          fullWidth
          select // label="Select"
          autoComplete="off"
          onChange={(e) => {
            formik.handleChange(e);
            formik.setFieldValue("subSection_data", undefined);
            formik.setFieldValue("cell_data", undefined);
          }}
          variant="standard"
        >
          <option selected disabled value="">
            Please select
          </option>
          {data?.sections?.map((option) => {
            return <option value={option?._id}>{option?.section_name}</option>;
          })}
        </select>
        <div></div>
      </div>
    </div>
  );
};

export default SectionDropdown;
