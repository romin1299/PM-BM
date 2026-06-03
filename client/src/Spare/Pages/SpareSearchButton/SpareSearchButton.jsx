import React, { useState, memo } from "react";
import { Form } from "react-bootstrap";
import { useForm } from "react-hook-form";

import { partFor } from "../../Utils/dropdownUtils";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";

const TaskStatusMappingComponent = memo(
  ({
    otherData,
    navigate,
    handleDelete,
    removeRow,
    mode,
    handleModal,
    updateRow,
  }) => (
    <>
      <td className="td-padding ">{otherData?.plantName}</td>
      <td className="td-padding ">{otherData?.location}</td>
      <td className="td-padding ">{otherData?.uniqueID}</td>
      <td className="td-padding ">{otherData?.partName}</td>
      <td className="td-padding ">{otherData?.partModel}</td>
      <td className="td-padding ">{otherData?.stockQty}</td>
    </>
  ),
);

const SpareSearchButton = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = useForm({
    defaultValues: {
      whichParts: false,
      location: "",
      partName: "",
      partModel: "",
      "machine.machine_code": "",
    },
  });

  const [apiReferencePropsBasedOnFilters, setApiReferencePropsBasedOnFilters] =
    useState({
      params: null,
      referenceArrayForUseEffect: [],
    });

  const dirtyValues = (allValues) => {
    let newVal = {};
    Object.keys(dirtyFields).map((key) => (newVal[key] = allValues[key]));
    return newVal;
  };

  console.log(dirtyFields);

  const handleSearchParts = async (formValue) => {
    if (Object.keys(dirtyFields).length === 0) return;
    formValue = dirtyValues(formValue);
    setApiReferencePropsBasedOnFilters({
      params: formValue,
      referenceArrayForUseEffect: [JSON.stringify(formValue)],
    });
  };
  const handleClear = () => {
    reset();
    setApiReferencePropsBasedOnFilters({
      params: null,
      referenceArrayForUseEffect: [],
    });
  };

  return (
    <div>
      <h4 style={{ padding: "1rem 0 0 1rem" }}>Spare Part Search Button</h4>
      <form onSubmit={handleSubmit(handleSearchParts)}>
        <table className="m-1">
          <tr className="size-14">
            <td className="border p-1">
              <small>Master List</small>
            </td>
            <td className="border">
              <div className="d-flex p-1">
                {partFor?.map((item) => (
                  <>
                    &nbsp;
                    <Form.Check
                      style={{ fontSize: "14px" }}
                      type="radio"
                      {...item}
                      {...register("whichParts")}
                    />
                  </>
                ))}
              </div>
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1">
              <small>Location</small>
            </td>
            <td className="border p-1">
              <input type="text" {...register("location")} />
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1">
              <small>Part name</small>
            </td>
            <td className="border p-1">
              <input type="text" {...register("partName")} />
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1">
              <small>Part model</small>
            </td>
            <td className="border p-1">
              <input type="text" {...register("partModel")} />
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1">
              <small>M/C no</small>
            </td>
            <td className="border p-1">
              <input type="text" {...register("machine_code")} />
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1"></td>
            <td className="border p-1 d-flex flex-wrap gap-1">
              <button type="submit" className="btn bg-success">
                Search
              </button>
              <button
                type="button"
                className="btn bg-warning"
                onClick={handleClear}
              >
                Clear
              </button>
            </td>
          </tr>
        </table>
      </form>

      {apiReferencePropsBasedOnFilters?.params && (
        <SpareSheetCustomTable
          apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
          url="/v1/spare/spareSearch"
          tableHeaders={[
            "Plant",
            "Location",
            "Unique ID",
            "Part name",
            "Part model",
            "Stock Qty",
          ]}
          OtherComp={TaskStatusMappingComponent}
        />
      )}
    </div>
  );
};

export default SpareSearchButton;
