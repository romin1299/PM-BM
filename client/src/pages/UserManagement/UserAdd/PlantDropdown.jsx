import React from "react";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

const PlantDropdown = ({ formik }) => {
  const [{ isLoading, data }] = useSafeGetRequest({
    url: "/v2/fetchPlantList",
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        plants: [],
      },
    },
  });

  if (isLoading) return <h5>Loading....</h5>;

  return (
    <div className="pwd-container">
      <span>Plant:</span>
      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <select
          class="form-select form-select-sm"
          aria-label=".form-select-sm example"
          style={{ width: "100%" }}
          id="standard-select-currency"
          name="plant._id"
          className="textField"
          fullWidth
          select
          autoComplete="off"
          onChange={(e) => {
            formik.handleChange(e);
            // postPlantToGetSectionListOfUserAssign(e.target.value);
            formik.setFieldValue("section_data", undefined);
            formik.setFieldValue("subSection_data", undefined);
            formik.setFieldValue("cell_data", undefined);
          }}
          variant="standard"
        >
          <option selected disabled value="">
            Please select
          </option>
          {data?.plants?.map((option) => {
            return <option value={option?._id}>{option?.plant_name}</option>;
          })}
        </select>
      </div>
    </div>
  );
};

export default PlantDropdown;
