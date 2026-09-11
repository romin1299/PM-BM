import { useForm, useFieldArray } from "react-hook-form";
import { Box } from "@mui/system";
import { Row } from "react-bootstrap";

import ChartTitleBar from "../../../BM/Reports/Common/ChartTitleBar";
import { axiosPostOrPatch, axiosGetOrDelete } from "../../Utils/axiosUtils";

const DynamicCRUDTable = ({
  title,
  url,
  columns,
  dynamicTableKey,
  toolRoomPerson = "No",
}) => {
  const {
    register,
    handleSubmit,
    control,
    // formState: { errors },
    reset,
  } = useForm({
    defaultValues: async () => {
      const response = await axiosGetOrDelete({
        url,
      });
      if (!response?.isError) {
        delete response["isError"];
        return response;
      }
      return {
        [dynamicTableKey]: [
          {
            currencyUnit: "INR",
            currencyRate: 1,
          },
        ],
      };
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: dynamicTableKey,
  });

  const handleSubmitDynamicApproval = async (formValue) => {
    const response = await axiosPostOrPatch({
      url,
      apiType: "patch",
      axiosBody: formValue,
    });

    if (!response?.isError)
      reset({ [dynamicTableKey]: response?.[dynamicTableKey] });
  };

  return (
    <form
      onSubmit={handleSubmit(handleSubmitDynamicApproval)}
      className="cell p-3 m-3"
    >
      <ChartTitleBar title={title} />

      <Row>
        <div className="spare-scroll-table">
          <table
            style={{
              width: "100%",
              // tableLayout: "fixed",
              borderCollapse: "collapse",
            }}
            className="mtd-parts-section"
          >
            <thead>
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
            </thead>

            <tbody>
              {fields?.map((item, index) => (
                <tr key={item.id}>
                  {columns.map(({ field, type }) => (
                    <td key={field} className="border p-1">
                      <input
                        type={type}
                        step={type === "number" ? "0.0001" : undefined}
                        style={{
                          width: "100%",
                          fontSize: "12px",
                          textAlign: "center",
                          backgroundColor: index === 0 ? "#f5f5f5" : "white",
                        }}
                        readOnly={index === 0}
                        {...register(`${dynamicTableKey}.${index}.${field}`, {
                          valueAsNumber: type === "number",
                        })}
                      />
                    </td>
                  ))}
                  <td className="border p-1" style={{ textAlign: "center" }}>
                    {index !== 0 && (
                      <button
                        type="button"
                        className={
                          toolRoomPerson === "Yes"
                            ? "bg-danger text-white border-0"
                            : ""
                        }
                        disabled={toolRoomPerson !== "Yes"}
                        onClick={() => remove(index)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              <tr>
                <td colSpan={columns.length + 1} className="border p-1">
                  <button
                    type="button"
                    className={
                      toolRoomPerson === "Yes"
                        ? "bg-warning text-white border-0"
                        : ""
                    }
                    disabled={toolRoomPerson !== "Yes"}
                    onClick={() => append({ currencyUnit: "", currencyRate: 0.0 })}
                  >
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Row>

      {toolRoomPerson === "Yes" && (
        <Box className="m-2" sx={{ display: "flex", justifyContent: "start" }}>
          <button type="submit" className="btn bg-succ ">
            Submit
          </button>
        </Box>
      )}
    </form>
  );
};

DynamicCRUDTable.defaultProps = {
  title: "Dynamic Currency Conversion",
  url: "/v1/spare/customization/dynamicCurrencyConversion",
  dynamicTableKey: "spareCurrenciesWithUnit",
  columns: [
    { label: "Currency unit", field: "currencyUnit", type: "text" },
    { label: "Currency rate", field: "currencyRate", type: "number" },
  ],
};

export default DynamicCRUDTable;
