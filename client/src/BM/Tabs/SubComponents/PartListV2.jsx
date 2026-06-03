import React, { useCallback, useEffect, useRef, useState } from "react";
import { axiosGetOrDelete } from "../../../Spare/Utils/axiosUtils";

const columns = [
  { label: "Part Location", field: "location", type: "text" },
  { label: "Part No.", field: "partModel", type: "text" },
  { label: "Part Name", field: "partName", type: "text" },
  { label: "Maker", field: "manufacture", type: "text" },
  { label: "Quantity", field: "quantity", type: "number" },
  { label: "Cost", field: "cost", type: "number" },
];

const PartListV2 = ({ fields, append, remove, register, setValue }) => {
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

  return (
    <table
      style={{
        width: "100%",
        tableLayout: "fixed",
        borderCollapse: "collapse",
      }}
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
      </tr>

      {fields?.map((item, index) => (
        <tr key={item.id}>
          {columns.map(({ field, type }) => {
            const { onChange: registerOnChange, ...restRegister } = register(
              `changeParts.${index}.${field}`,
            );

            return (
              <td key={field} className="border p-1">
                <input
                  type={type}
                  style={{ width: "100%" }}
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
            <button
              type="button"
              className="bg-danger text-white border-0"
              onClick={() => remove(index)}
            >
              Cancel
            </button>
          </td>
        </tr>
      ))}

      <tr>
        <td colSpan={columns.length + 1} className="border p-1">
          <button
            type="button"
            className="bg-warning text-white border-0"
            onClick={() => append({})}
          >
            Add Part
          </button>
        </td>
      </tr>
    </table>
  );
};

export default PartListV2;
