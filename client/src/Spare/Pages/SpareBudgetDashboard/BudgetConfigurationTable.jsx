import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { axiosPostOrPatch } from "../../Utils/axiosUtils";
import fyMonths from "../../../Utils/fy";
import colorsBasedOnOkNGStatus from "../../../Utils/colorsBasedOnOkNGStatus";

const url = "/v1/spare/budget";
const sectionOnlyFields = new Set(["BPDActual", "remarks"]);

/** Running total of the monthly plan, Apr through Mar. */
const cumulativeOf = (plan = []) => {
  let total = 0;
  return Array.from({ length: 12 }, (_, i) => {
    const value = Number(plan[i]);
    total += Number.isFinite(value) ? value : 0;
    return total;
  });
};

const editableFields = [
  {
    key: "plan",
    label: "Monthly Plan",
    disabled: false,
    type: "number",
  },
  {
    key: "actual",
    label: "Monthly Actual",
    disabled: true,
    type: "number",
  },
  {
    key: "BPDActual",
    label: "BPD Actual",
    disabled: false,
    type: "number",
  },
  {
    key: "cumulativePlan",
    label: "Cum Plan",
    // Derived from the monthly plan, never typed.
    disabled: true,
    type: "number",
  },
  {
    key: "cumulativeActual",
    label: "Cum Actual",
    disabled: true,
    type: "number",
  },
  {
    key: "monthlyStatus",
    label: "Monthly status",
    isStatusField: true,
    disabled: true,
    type: "text",
  },
  {
    key: "cumulativeStatus",
    label: "Cum Status",
    isStatusField: true,
    disabled: true,
    type: "text",
  },
  {
    key: "remarks",
    label: "Remarks",
    disabled: false,
    type: "text",
  },
];

const BudgetConfigurationTable = ({
  budget = {},
  params = {},
  handleUpdateState = null,
}) => {
  const {
    register,
    reset,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { isLoading, dirtyFields },
  } = useForm({
    defaultValues: async () => {
      if (params?._id) return budget;
      return {
        plan: Array(12).fill(0),
        actual: Array(12).fill(0),
        BPDActual: Array(12).fill(0),
        cumulativePlan: Array(12).fill(0),
        cumulativeActual: Array(12).fill(0),
        remarks: Array(12).fill(""),
      };
    },
  });

  /**
   * The form is initialised once, from whatever budget it mounted with; when
   * the selection changes and a different budget arrives, re-seed it. Keyed on
   * the budget's identity so a re-render with the same budget leaves edits
   * alone.
   */
  useEffect(() => {
    if (budget?._id) reset(budget);
  }, [budget?._id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Cum Plan is the running total of Monthly Plan, so it follows every edit to
   * the plan. Marked dirty so an update sends it along with the plan.
   */
  const plan = useWatch({ control, name: "plan" });

  useEffect(() => {
    if (!Array.isArray(plan)) return;
    const cumulative = cumulativeOf(plan);
    cumulative.forEach((value, i) =>
      setValue(`cumulativePlan.${i}`, value, { shouldDirty: true }),
    );
  }, [plan, setValue]);

  const dirtyValues = (allValues) => {
    let newVal = {};
    Object.keys(dirtyFields).map((key) => (newVal[key] = allValues[key]));
    return newVal;
  };

  const handleSubmitBudget = async (formValue) => {
    if (params?._id) {
      if (Object.keys(dirtyFields).length === 0) return;
      formValue = dirtyValues(formValue);
    }

    const { isError, budget } = await axiosPostOrPatch({
      url,
      apiType: params?._id ? "patch" : "post",
      axiosProps: { params },
      axiosBody: formValue,
    });

    if (!isError) {
      reset(budget);
      handleUpdateState();
    }
  };

  if (isLoading) return <h4>Loading...</h4>;

  return (
    <form className="m-2" onSubmit={handleSubmit(handleSubmitBudget)}>
      <div className="spare-scroll-table">
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
          className="mtd-parts-section budget-table"
        >
          <thead>
            <tr>
              <td
                key="Months"
                className="border p-1"
                style={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                Months
              </td>
              {fyMonths.map((label) => (
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
            </tr>
          </thead>

          <tbody>
            {editableFields.map(
              (f) =>
                (!params?.selectedValue
                  ? !sectionOnlyFields.has(f.key)
                  : f.key === "remarks"
                    ? params?.flagForTogglingFilter === "based-on-cell"
                    : true) && (
                  <tr key={f.key}>
                    <td
                      key={f.label}
                      className="border p-1"
                      style={{
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                    >
                      {f.label}
                    </td>
                    {fyMonths.map((_, i) => {
                      let style = { width: "100%" };
                      let title;
                      if (f.isStatusField) {
                        style.color = "white";
                        style.background = colorsBasedOnOkNGStatus(
                          watch(`${f.key}.${i}`),
                        );
                      }
                      // A month closed with its BPD figure no longer takes
                      // issuances; its actual is that figure.
                      if (f.key === "actual" && watch(`closedMonths.${i}`)) {
                        style.background = "#e3f2e6";
                        title = "Closed: month-end BPD figure is the actual";
                      }
                      return (
                        <td key={i} className="border p-1">
                          <input
                            type={f.type}
                            style={style}
                            title={title}
                            disabled={f.disabled}
                            {...register(`${f.key}.${i}`, {
                              valueAsNumber: f.type === "number",
                            })}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ),
            )}
          </tbody>
        </table>
      </div>
      {(!params?.flagForTogglingFilter ||
        params?.flagForTogglingFilter === "based-on-cell") && (
        <button
          type="submit"
          className="btn bg-success mt-1"
          style={{ fontSize: "12px" }}
        >
          Submit
        </button>
      )}
    </form>
  );
};

export default BudgetConfigurationTable;
