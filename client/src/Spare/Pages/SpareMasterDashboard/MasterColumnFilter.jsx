import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Popover,
  Checkbox,
  FormControlLabel,
  TextField,
  IconButton,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

import { axiosGetOrDelete } from "../../Utils/axiosUtils";

/**
 * Excel-style column filter for the master dashboards.
 *
 * Each column header carries a funnel; it opens a list of the column's distinct
 * values with their row counts, a search box, "Select All" and "(Blanks)", and
 * Apply / Clear. The values come from the server per column — the catalogue
 * is 17k rows and paged, so the client never holds it — narrowed by the other
 * columns' filters the way Excel narrows its lists.
 */

const BLANK_KEY = "\u0000blank";
const keyOf = (value) => (value === null || value === "" ? BLANK_KEY : String(value));
const SEARCH_DEBOUNCE_MS = 300;

/** Column filters as page state, plus the request param the server reads. */
export const useMasterColumnFilters = () => {
  const [filters, setFilters] = useState({});

  const setColumnFilter = useCallback((column, values) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (values && values.length) next[column] = values;
      else delete next[column];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setFilters({}), []);

  const activeCount = Object.keys(filters).length;
  // Serialised once, so it is a stable dependency for the table's reload.
  const filtersParam = useMemo(
    () => (activeCount ? JSON.stringify(filters) : undefined),
    [filters, activeCount],
  );

  return { filters, setColumnFilter, clearAll, activeCount, filtersParam };
};

const MasterColumnFilter = memo(
  ({ column, label, valuesUrl, filtersParam, selectedValues, onApply }) => {
    const [anchor, setAnchor] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState({ values: [], truncated: false });
    // Keys of the ticked values while the popover is open; null is "all".
    const [ticked, setTicked] = useState(null);
    const requestRef = useRef(0);
    // Opening fetches at once; only typing goes through the debounce.
    const hasTypedRef = useRef(false);

    const isOpen = Boolean(anchor);
    const isActive = Boolean(selectedValues?.length);

    const load = useCallback(
      async (searchText) => {
        const requestId = ++requestRef.current;
        setLoading(true);
        const response = await axiosGetOrDelete({
          url: valuesUrl,
          axiosProps: {
            params: { column, search: searchText || undefined, filters: filtersParam },
          },
        });
        if (requestId !== requestRef.current) return;
        setLoading(false);
        if (response?.isError) return;
        setOptions({
          values: response.values ?? [],
          truncated: Boolean(response.truncated),
        });
      },
      [column, valuesUrl, filtersParam],
    );

    // Opening: current selection (or everything) ticked, values fetched.
    const handleOpen = useCallback(
      (event) => {
        setAnchor(event.currentTarget);
        setSearch("");
        hasTypedRef.current = false;
        setTicked(selectedValues?.length ? new Set(selectedValues.map(keyOf)) : null);
        load("");
      },
      [selectedValues, load],
    );

    const handleClose = useCallback(() => setAnchor(null), []);

    // Typing re-queries the server, debounced.
    useEffect(() => {
      if (!isOpen || !hasTypedRef.current) return undefined;
      const timer = setTimeout(() => load(search), SEARCH_DEBOUNCE_MS);
      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, isOpen]);

    const visibleKeys = useMemo(
      () => options.values.map((item) => keyOf(item.value)),
      [options.values],
    );
    const isTicked = (key) => (ticked === null ? true : ticked.has(key));
    const tickedVisible = visibleKeys.filter(isTicked).length;
    const allVisibleTicked = visibleKeys.length > 0 && tickedVisible === visibleKeys.length;
    const someVisibleTicked = tickedVisible > 0 && !allVisibleTicked;

    // "All" is made concrete — the values in view — before any single change.
    const materialise = (prev) => new Set(prev === null ? visibleKeys : prev);

    const toggle = (key) =>
      setTicked((prev) => {
        const next = materialise(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });

    const toggleAll = () =>
      setTicked((prev) => {
        const next = materialise(prev);
        if (allVisibleTicked) visibleKeys.forEach((key) => next.delete(key));
        else visibleKeys.forEach((key) => next.add(key));
        return next;
      });

    const handleApply = () => {
      const chosen = options.values
        .filter((item) => isTicked(keyOf(item.value)))
        .map((item) => (keyOf(item.value) === BLANK_KEY ? null : item.value));
      // Everything ticked with the full list in view is no filter at all.
      const everything =
        !search && !options.truncated && chosen.length === options.values.length;
      onApply(column, everything ? null : chosen);
      handleClose();
    };

    const handleClear = () => {
      onApply(column, null);
      handleClose();
    };

    return (
      <>
        <IconButton
          size="small"
          onClick={handleOpen}
          title={`Filter ${label}`}
          sx={{ p: "2px", color: isActive ? "#ffd54f" : "inherit" }}
        >
          {isActive ? (
            <FilterAltIcon sx={{ fontSize: 16 }} />
          ) : (
            <FilterAltOutlinedIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>

        <Popover
          open={isOpen}
          anchorEl={anchor}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Box sx={{ p: 1.5, width: 300 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {label}
            </Typography>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="Search values…"
              value={search}
              onChange={(event) => {
                hasTypedRef.current = true;
                setSearch(event.target.value);
              }}
            />

            <Box sx={{ mt: 1, borderBottom: "1px solid #e0e0e0" }}>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={allVisibleTicked}
                    indeterminate={someVisibleTicked}
                    onChange={toggleAll}
                  />
                }
                label={
                  <small>
                    {search ? "Select All Search Results" : "Select All"}{" "}
                    <span className="text-muted">({options.values.length})</span>
                  </small>
                }
              />
            </Box>

            <Box sx={{ maxHeight: 260, overflow: "auto", mt: 0.5 }}>
              {loading && options.values.length === 0 ? (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <CircularProgress size={18} />
                </Box>
              ) : options.values.length === 0 ? (
                <small className="text-muted d-block p-2">No values</small>
              ) : (
                options.values.map((item) => {
                  const key = keyOf(item.value);
                  return (
                    <FormControlLabel
                      key={key}
                      sx={{ m: 0, display: "flex" }}
                      control={
                        <Checkbox
                          size="small"
                          checked={isTicked(key)}
                          onChange={() => toggle(key)}
                        />
                      }
                      label={
                        <small>
                          {key === BLANK_KEY ? <i>(Blanks)</i> : String(item.value)}{" "}
                          <span className="text-muted">({item.count})</span>
                        </small>
                      }
                    />
                  );
                })
              )}
              {options.truncated && (
                <small className="text-muted d-block p-1">
                  Showing the first {options.values.length} values — search to narrow.
                </small>
              )}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
              <Button size="small" onClick={handleClear} disabled={!isActive}>
                Clear
              </Button>
              <Button size="small" variant="contained" onClick={handleApply}>
                Apply
              </Button>
            </Box>
          </Box>
        </Popover>
      </>
    );
  },
);

export default MasterColumnFilter;
