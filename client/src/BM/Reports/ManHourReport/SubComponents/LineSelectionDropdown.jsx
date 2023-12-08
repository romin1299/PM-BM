import * as React from "react";
import { useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

import { useState, useEffect, useContext } from "react";

import RoutingContext from "../../../../context/routing/RoutingContext";
import { fetchFinancialYears } from "../../../../Integration/APIExports";

import { ACTION, getFiltrationValue } from "./CommonFiltrationComponent";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 130,
    },
  },
};

const products = [
  "Product 1",
  "Product 2",
  "Product 3",
  "Product 4",
  "Product 5",
];

function getStyles(name, personName, theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const Months = [
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

export default function LineSelectionDropdown({
  selectedSection,
  sections,
  selectedSubSection,
  subSections,
  selectedCell,
  cells,
  selectedLine,
  lines,
  selectedYear,
  selectedMonth,

  reducerDispatch,
  baseUrlForFiltering,
  monthFiltration,
}) {
  const context = useContext(RoutingContext);

  const theme = useTheme();

  const [financialYears, setFinancialYears] = useState([]);

  const getStyleForSelectedValue = async (item, selectedItem, purpose) => {
    return {
      fontWeight:
        (purpose === "for-array-value" ? item : item?._id) === selectedItem
          ? theme.typography.fontWeightMedium
          : theme.typography.fontWeightRegular,
    };
  };

  const fetchFYYearData = async () => {
    const { financialYears } = await fetchFinancialYears();
    setFinancialYears(financialYears);
  };

  useEffect(() => {
    fetchFYYearData();
  }, []);

  const getFiltrationValueBasedOnSection = async ({ section }) => {
    try {
      const { res, data } = await getFiltrationValue({
        url: `${baseUrlForFiltering}/sectionBased/${section}`,
      });

      const {
        message,

        flagForTogglingFilter,
        selectedValue,

        selectedSubSection,
        subSections,
        selectedCell,
        cells,
        selectedLine,
        lines,
      } = data;

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_DATA_BASED_ON_SECTION,

          flagForTogglingFilter,
          selectedValue,

          selectedSubSection,
          subSections,
          cells,
          selectedCell,
          selectedLine,
          lines,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getFiltrationValueBasedOnSubSection = async ({ subSection }) => {
    try {
      const { res, data } = await getFiltrationValue({
        url: `${baseUrlForFiltering}/subSectionBased/${subSection}`,
      });

      const { message, selectedCell, cells, selectedLine, lines } = data;

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_DATA_BASED_ON_SUBSECTION,

          selectedCell,
          cells,
          selectedLine,
          lines,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getFiltrationValueBasedOnCell = async ({ cell }) => {
    try {
      const { res, data } = await getFiltrationValue({
        url: `${baseUrlForFiltering}/cellBased/${cell}`,
      });
      const { message, lines } = data;

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_DATA_BASED_ON_CELL,

          lines,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    (async () => {
      const { res, data } = await getFiltrationValue({
        url: `${baseUrlForFiltering}/byDefault`,
      });

      const {
        message,

        flagForTogglingFilter,
        selectedValue,

        selectedSection,
        sections,
        selectedSubSection,
        subSections,
        selectedCell,
        cells,
        selectedLine,
        lines,
      } = data;

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_DATA,

          flagForTogglingFilter,
          selectedValue,

          selectedSection,
          sections,
          selectedSubSection,
          subSections,
          cells,
          selectedCell,
          selectedLine,
          lines,

          message,
        });
      }
    })();
  }, []);

  return (
    <FormControl
      size="small"
      sx={{ flexDirection: "row", gap: "12px", width: "100%" }}
    >
      {context?.tm_grade === "HOD" && sections?.length > 0 && (
        <Select
          displayEmpty
          value={selectedSection}
          onChange={(e) => {
            reducerDispatch({
              type: ACTION.HANDLE_SELECT_SECTION,
              flagForTogglingFilter: "based-on-section",
              selectedSection: e.target.value,
            });
            getFiltrationValueBasedOnSection({ section: e.target.value });
          }}
          input={<OutlinedInput />}
          // renderValue={(selected) => <strong>{selected}</strong>}
          sx={{
            width: 130,
            "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
          }}
          MenuProps={MenuProps}
          inputProps={{ "aria-label": "Without label" }}
        >
          {sections.map((item) => (
            <MenuItem
              key={item?._id}
              value={item?._id}
              style={getStyleForSelectedValue(item, selectedSection)}
            >
              {item?.section_name}
            </MenuItem>
          ))}
        </Select>
      )}

      {subSections?.length > 0 && (
        <Select
          displayEmpty
          value={selectedSubSection}
          onChange={(e) => {
            console.count("onchange .......");
            reducerDispatch({
              type: ACTION.HANDLE_SELECT_SUBSECTION,
              flagForTogglingFilter: "based-on-subSection",
              selectedSubSection: e.target.value,
            });
            getFiltrationValueBasedOnSubSection({
              subSection: e.target.value,
            });
          }}
          input={<OutlinedInput />}
          // renderValue={(selected) => <strong>{selected}</strong>}
          sx={{
            width: 130,
            "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
          }}
          MenuProps={MenuProps}
          inputProps={{ "aria-label": "Without label" }}
        >
          {selectedSubSection === "" && (
            <MenuItem disabled value="">
              <p>SubSections</p>
            </MenuItem>
          )}
          {subSections.map((item) => (
            <MenuItem
              key={item?._id}
              value={item?._id}
              style={getStyleForSelectedValue(item, selectedSubSection)}
            >
              {item?.subSection_name}
            </MenuItem>
          ))}
        </Select>
      )}

      {cells?.length > 0 && (
        <Select
          displayEmpty
          value={selectedCell}
          onChange={(e) => {
            reducerDispatch({
              type: ACTION.HANDLE_SELECT_CELL,
              flagForTogglingFilter: "based-on-cell",
              selectedCell: e.target.value,
            });
            getFiltrationValueBasedOnCell({ cell: e.target.value });
          }}
          input={<OutlinedInput />}
          sx={{
            width: 130,
            "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
          }}
          MenuProps={MenuProps}
          inputProps={{ "aria-label": "Without label" }}
        >
          {/* {selectedCell === "" && (
          <MenuItem disabled value="">
            <p>Cells</p>
          </MenuItem>
        )} */}
          {cells.map((item) => (
            <MenuItem
              key={item?._id}
              value={item?._id}
              style={getStyleForSelectedValue(item, selectedCell)}
            >
              {item?.cell_name}
            </MenuItem>
          ))}
        </Select>
      )}

      {lines?.length > 0 && (
        <Select
          displayEmpty
          value={selectedLine}
          onChange={(e) => {
            reducerDispatch({
              type: ACTION.HANDLE_SELECT_LINE,
              flagForTogglingFilter: "based-on-line",
              selectedLine: e.target.value,
            });
          }}
          input={<OutlinedInput />}
          sx={{
            width: 130,
            "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
          }}
          MenuProps={MenuProps}
          inputProps={{ "aria-label": "Without label" }}
        >
          {lines.map((item) => (
            <MenuItem
              key={item?._id}
              value={item?._id}
              style={getStyleForSelectedValue(item, selectedLine)}
            >
              {item?.line_name}
            </MenuItem>
          ))}
        </Select>
      )}

      <Select
        displayEmpty
        value={selectedYear}
        onChange={(e) => {
          reducerDispatch({
            type: ACTION.HANDLE_SELECT_YEAR,
            selectedYear: e.target.value,
          });
        }}
        input={<OutlinedInput />}
        sx={{
          width: 130,
          "& .MuiSelect-select": {
            paddingTop: "5px",
            paddingBottom: "5px",
          },
        }}
        renderValue={(value) => {
          if (value) {
            return value;
          }
          return "Year";
        }}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        {financialYears.map((item) => (
          <MenuItem
            key={item}
            value={item}
            style={getStyleForSelectedValue(
              item,
              selectedYear,
              "for-array-value"
            )}
          >
            {item}
          </MenuItem>
        ))}
      </Select>

      {monthFiltration && (
        <Select
          displayEmpty
          value={selectedMonth}
          onChange={(e) => {
            reducerDispatch({
              type: ACTION.HANDLE_SELECT_MONTH,
              selectedMonth: e.target.value,
            });
          }}
          input={<OutlinedInput />}
          sx={{
            width: 130,
            "& .MuiSelect-select": {
              paddingTop: "5px",
              paddingBottom: "5px",
            },
          }}
          renderValue={(value) => {
            if (value) {
              return value;
            }
            return "Month";
          }}
          MenuProps={MenuProps}
          inputProps={{ "aria-label": "Without label" }}
        >
          {Months.map((item) => (
            <MenuItem
              key={item}
              value={item}
              style={getStyleForSelectedValue(
                item,
                selectedMonth,
                "for-array-value"
              )}
            >
              {item}
            </MenuItem>
          ))}
        </Select>
      )}
    </FormControl>
  );
}
export const MonthDropdown = ({ selectedMonth, setSelectedMonth }) => {
  const theme = useTheme();

  const getStyleForSelectedValue = async (item, selectedItem) => {
    return {
      fontWeight:
        item === selectedItem
          ? theme.typography.fontWeightMedium
          : theme.typography.fontWeightRegular,
    };
  };

  return (
    <>
      <Select
        displayEmpty
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
        }}
        input={<OutlinedInput />}
        sx={{
          width: 130,
          "& .MuiSelect-select": {
            paddingTop: "5px",
            paddingBottom: "5px",
          },
        }}
        renderValue={(value) => {
          if (value) {
            return value;
          }
          return "Month";
        }}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        {Months.map((item) => (
          <MenuItem
            key={item}
            value={item}
            style={getStyleForSelectedValue(item, selectedMonth)}
          >
            {item}
          </MenuItem>
        ))}
      </Select>
    </>
  );
};
{
  /* <Select
displayEmpty
value={selectedSection}
onChange={handleChange}
input={<OutlinedInput />}
renderValue={(selected) => {
  if (selected.length === 0) {
    return <strong>Sections</strong>;
  }

  return selected.join(", ");
}}
sx={{
  width: 130,
  "& .MuiSelect-select": {
    paddingTop: "5px",
    paddingBottom: "5px",
  },
}}
MenuProps={MenuProps}
inputProps={{ "aria-label": "Without label" }}
>
<MenuItem disabled value="">
  <p>Sections</p>
</MenuItem>
{products.map((name) => (
  <MenuItem
    key={name}
    value={name}
    style={getStyles(name, personName, theme)}
  >
    {name}
  </MenuItem>
))}
</Select> */
}
