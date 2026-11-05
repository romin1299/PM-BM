import { useCallback, useMemo } from "react";

import MasterColumnFilter, {
  useMasterColumnFilters,
} from "../../Pages/SpareMasterDashboard/MasterColumnFilter";

/**
 * Excel-style column filters for a Spare table, the same widget the master
 * dashboards use: one funnel per filterable header, fed by a per-column values
 * endpoint, and a serialised `filters` request param the server applies.
 *
 * `columns` is the table's header/key list; a header with no `key` (e.g. the
 * action column) gets no funnel.
 */
export const useTableColumnFilters = ({ valuesUrl, columns = [] }) => {
  const { filters, setColumnFilter, clearAll, activeCount, filtersParam } =
    useMasterColumnFilters();

  const columnByHeader = useMemo(
    () => Object.fromEntries(columns.map((column) => [column.header, column])),
    [columns],
  );

  const renderHeader = useCallback(
    (header) => {
      const column = columnByHeader[header];
      if (!column?.key) return header;

      return (
        <span className="d-inline-flex align-items-center gap-1">
          {header}
          <MasterColumnFilter
            column={column.key}
            label={header}
            valuesUrl={valuesUrl}
            filtersParam={filtersParam}
            selectedValues={filters[column.key]}
            onApply={setColumnFilter}
            extraParams={column.extraParams}
          />
        </span>
      );
    },
    [columnByHeader, filters, filtersParam, setColumnFilter, valuesUrl],
  );

  return { renderHeader, filtersParam, activeCount, clearAll };
};

export default useTableColumnFilters;
