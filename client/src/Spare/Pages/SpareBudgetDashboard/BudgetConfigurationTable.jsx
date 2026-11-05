import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { axiosPostOrPatch } from "../../Utils/axiosUtils";
import fyMonths, { currentFyMonthIndex } from "../../../Utils/fy";
import colorsBasedOnOkNGStatus from "../../../Utils/colorsBasedOnOkNGStatus";

const url = "/v1/spare/budget";

/**
 * Fields the plant-wide table leaves out.
 *
 * BPD Actual is shown there: it is the month-end figure the plan is judged
 * against, and at plant level it is the sum of the cells' BPD actuals, so it
 * reads as the plant's own result. Remarks stay per-cell — a note has no
 * plant-level meaning to add up.
 */
const hiddenForPlantWide = new Set(["remarks"]);

/**
 * The plan is set ahead of time, so it is the one row shown (and editable) for
 * months that have not started. Everything else is a result or a note on a month
 * that has happened, and stays blank until then.
 */
const SHOWN_FOR_FUTURE_MONTHS = new Set(["plan"]);

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
  /**
   * The top panel: the whole plant's budget, summed from every cell's budget on
   * the server. It has no document of its own, so nothing here is editable.
   */
  isPlantWide = false,
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
      if (isPlantWide && Object.keys(budget ?? {}).length) return budget;
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
   * the selection changes, or a save brings a new figure in, re-seed it.
   *
   * A cell's budget is identified by its document id. The plant view has no
   * id — it is an aggregate — so its identity is the object the request
   * returned, and a refetch after a cell edit re-seeds it that way.
   */
  useEffect(() => {
    if (budget?._id || (isPlantWide && Object.keys(budget ?? {}).length))
      reset(budget);
  }, [budget, isPlantWide, reset]);

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
    // The plant figure is derived, so there is nothing to save for it.
    if (isPlantWide) return;

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

  const currentMonthIndex = currentFyMonthIndex();

  if (isLoading) return <h4>Loading...</h4>;

  return (
    <form className="m-2" onSubmit={handleSubmit(handleSubmitBudget)}>
      {isPlantWide && (
        <small className="text-muted d-block mb-1">
          Read-only: the plant budget is the sum of every cell&apos;s budget.
          Select a section below to change a cell.
        </small>
      )}
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
                  ? !hiddenForPlantWide.has(f.key)
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
                      if (
                        i > currentMonthIndex &&
                        !SHOWN_FOR_FUTURE_MONTHS.has(f.key)
                      )
                        return <td key={i} className="border p-1" />;

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
                            disabled={f.disabled || isPlantWide}
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
      {!isPlantWide &&
        (!params?.flagForTogglingFilter ||
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
