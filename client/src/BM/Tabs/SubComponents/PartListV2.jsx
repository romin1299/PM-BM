import React, { useCallback, useEffect, useRef, useState } from "react";
import { axiosGetOrDelete } from "../../../Spare/Utils/axiosUtils";
import { Form } from "react-bootstrap";

const tempOrPermRadioOptions = [
  {
    label: "Temporary",
    value: "Temporary",
  },
  {
    label: "Permanent",
    value: "Permanent",
  },
];

const columns = [
  { label: "Part Location", field: "location", type: "text" },
  { label: "Part No.", field: "partModel", type: "text" },
  { label: "Part Name", field: "partName", type: "text" },
  { label: "Maker", field: "maker", type: "text" },
  {
    label: "Quantity available",
    field: "budgetDetails.overAllAvailableQty",
    type: "number",
    disabled: true,
  },
  {
    label: "Unit cost",
    field: "unitCost",
    type: "number",
    disabled: true,
  },
  {
    label: "Qty required",
    field: "quantityRequired",
    type: "number",
  },
  // {
  //   label: "Temporary / Permanent",
  //   field: "temporaryOrPermanent",
  //   type: "text",
  // },
  // {
  //   label: "Return TargetDate",
  //   field: "returnTargetDateIfTemporary",
  //   type: "date",
  // },
  // { label: "Closing Status", field: "closingStatusIfTemporary", type: "text" },
];

const otherColumns = [
  { label: "Temporary / Permanent" },
  { label: "Return TargetDate" },
  { label: "Closing Status" },
];

const DateTimeField = ({ register, index, setValue }) => {
  const { onChange: registerOnChange, ...restRegister } = register(
    `changeParts.${index}.returnTargetDateIfTemporary.inString`,
  );
  return (
    <input
      type="datetime-local"
      style={{ width: "100%", fontSize: "12px" }}
      {...restRegister}
      onChange={(e) => {
        registerOnChange(e);
        setValue("isDateChanged", true, {
          shouldDirty: true,
        });
      }}
    />
  );
};

const PartListV2 = ({
  fields,
  append,
  remove,
  register,
  setValue,
  canEdit = true,
}) => {
  const debounceRef = useRef({});
  const [loadingRows, setLoadingRows] = useState({});

  useEffect(() => {
    return () => {
      Object.values(debounceRef.current).forEach(clearTimeout);
    };
  }, []);

  const fetchAndFillRow = useCallback(
    async (location, index) => {
      if (!location?.trim()) return;

      setLoadingRows((prev) => ({ ...prev, [index]: true }));

      const { isError, master } = await axiosGetOrDelete({
        url: "/v1/spare/spareSearch/location",
        axiosProps: { params: { location: location.trim() } },
      });

      setLoadingRows((prev) => {
        const s = { ...prev };
        delete s[index];
        return s;
      });

      if (debounceRef.current[index]) {
        clearTimeout(debounceRef.current[index]);
        delete debounceRef.current[index];
      }

      if (isError || !master) return;

      setValue(`changeParts.${index}`, master, {
        shouldDirty: true,
      });
    },
    [setValue],
  );

  const handleLocationChange = useCallback(
    (e, index, registerOnChange) => {
      registerOnChange(e);

      const value = e.target.value;

      if (debounceRef.current[index]) clearTimeout(debounceRef.current[index]);

      debounceRef.current[index] = setTimeout(() => {
        fetchAndFillRow(value, index);
      }, 600);
    },
    [fetchAndFillRow],
  );

  const handleTempOrPermChange = useCallback(
    (e, index, registerOnChange) => {
      registerOnChange(e);
      const value = e.target.value;
      setValue(
        `changeParts.${index}.closingStatusIfTemporary`,
        value === "Temporary" ? "Open" : "Close",
        { shouldDirty: true },
      );
    },
    [setValue],
  );

  return (
    <table
      style={{
        width: "100%",
        // tableLayout: "fixed",
        borderCollapse: "collapse",
      }}
      className="mtd-parts-section"
    >
      <tr>
        {columns.map(({ label }) => (
          <td
            key={label}
            className="border p-1"
            style={{
              fontWeight: "bold",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            {label}
          </td>
        ))}
        {otherColumns.map(({ label }) => (
          <td
            key={label}
            className="border p-1"
            style={{
              fontWeight: "bold",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            {label}
          </td>
        ))}
        {canEdit && (
          <td
            className="border p-1"
            style={{
              fontWeight: "bold",
              fontSize: "12px",
              textAlign: "center",
              width: "70px",
            }}
          >
            Action
          </td>
        )}
      </tr>

      {fields?.map((item, index) => (
        <tr key={item.id}>
          {columns.map(({ field, type, disabled = false }) => {
            const { onChange: registerOnChange, ...restRegister } = register(
              `changeParts.${index}.${field}`,
            );

            return (
              <td key={field} className="border p-1">
                <input
                  type={type}
                  disabled={disabled}
                  style={{ width: "100%", fontSize: "12px" }}
                  {...restRegister}
                  onChange={(e) =>
                    field === "location"
                      ? handleLocationChange(e, index, registerOnChange)
                      : registerOnChange(e)
                  }
                />
                {field === "location" && loadingRows[index] && (
                  <small style={{ color: "gray" }}>Loading...</small>
                )}
              </td>
            );
          })}
          <td className="border p-1" style={{ textAlign: "center" }}>
            {tempOrPermRadioOptions?.map((opt) => {
              const { onChange: registerOnChange, ...restRegister } = register(
                `changeParts.${index}.temporaryOrPermanent`,
              );
              return (
                <Form.Check
                  key={opt?.value}
                  style={{ fontSize: "12px" }}
                  className="m-1"
                  type="radio"
                  id={`temp-perm-${index}-${opt.value}`}
                  {...opt}
                  {...restRegister}
                  onChange={(e) =>
                    handleTempOrPermChange(e, index, registerOnChange)
                  }
                />
              );
            })}
          </td>
          <td className="border p-1 size">
            <DateTimeField
              register={register}
              index={index}
              setValue={setValue}
            />
          </td>
          <td className="border p-1">
            <input
              type="text"
              disabled
              style={{ width: "100%", fontSize: "12px" }}
              {...register(`changeParts.${index}.closingStatusIfTemporary`)}
            />
          </td>
          {canEdit && (
            <td className="border p-1" style={{ textAlign: "center" }}>
              <button
                type="button"
                className="bg-danger text-white border-0"
                onClick={() => remove(index)}
              >
                Cancel
              </button>
            </td>
          )}
        </tr>
      ))}

      {canEdit && (
        <tr>
          <td colSpan={columns.length + 1} className="border p-1">
            <button
              type="button"
              className="bg-warning text-white border-0"
              onClick={() => append({})}
            >
              Add
            </button>
          </td>
        </tr>
      )}
    </table>
  );
};

export default PartListV2;
