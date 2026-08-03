import React, { useState, useCallback, useRef } from "react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { debounce } from "lodash";
import { axiosGetOrDelete } from "../Utils/axiosUtils";

const url = `/v1/spare/customization/customizeField`;

const SearchableScrollDropdown = ({
  label = "Search",
  onChange,
  value,
  extraParams = {},
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState("");

  const cursorRef = useRef(null);
  const listboxRef = useRef(null);

  const fetchOptions = useCallback(
    async (search, cursor = null, append = false) => {
      setIsLoading(true);

      const {
        isError,
        tableData,
        nextCursor,
        hasMore: more,
      } = await axiosGetOrDelete({
        url,
        axiosProps: {
          params: { search, cursor, ...extraParams },
        },
      });

      if (!isError) {
        setOptions((prev) => (append ? [...prev, ...tableData] : tableData));
        setHasMore(more);
        cursorRef.current = more ? nextCursor : null;
      }
      setIsLoading(false);
    },
    [extraParams],
  );

  // Debounced search — resets pagination on new search term
  const debouncedSearch = useRef(
    debounce((search) => {
      cursorRef.current = null;
      fetchOptions(search, null, false);
    }, 400),
  ).current;

  const handleInputChange = (event, newValue, reason) => {
    setSearchText(newValue);
    debouncedSearch(newValue);
  };

  const handleOpen = () => {
    setOpen(true);
    if (options.length === 0) fetchOptions(searchText, null, false);
  };

  // Trigger load-more when scrolled near bottom of dropdown list
  const handleScroll = (event) => {
    const listboxNode = event.currentTarget;
    const scrolledToBottom =
      listboxNode.scrollHeight - listboxNode.scrollTop <=
      listboxNode.clientHeight + 50;

    if (scrolledToBottom && hasMore && !isLoading) {
      fetchOptions(searchText, cursorRef.current, true);
    }
  };

  // return (
  //   <Autocomplete
  //     disablePortal
  //     open={open}
  //     onOpen={handleOpen}
  //     onClose={() => setOpen(false)}
  //     options={options}
  //     sx={{ width: 300 }}
  //     getOptionLabel={(option) => option?.[extraParams?.requestedFor] ?? ""}
  //     renderInput={(params) => <TextField {...params} label="Movie" />}
  //   />
  // );

  return (
    <Autocomplete
      open={open}
      onOpen={handleOpen}
      onClose={() => setOpen(false)}
      options={options}
      getOptionLabel={(option) => option?.[extraParams?.requestedFor] ?? ""}
      isOptionEqualToValue={(option, val) =>
        option?.[extraParams?.requestedFor] === val
      }
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      onInputChange={handleInputChange}
      loading={isLoading}
      ListboxProps={{
        onScroll: handleScroll,
        ref: listboxRef,
        style: { maxHeight: 250 },
      }}
      size="small"
      sx={{ width: "75%" }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading && <CircularProgress color="inherit" size={14} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default SearchableScrollDropdown;
