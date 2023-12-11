import * as React from "react";
import { useEffect, useContext } from "react";
import { useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

import RoutingContext from "../../../context/routing/RoutingContext";
import {
  ACTION,
  getFiltrationValue,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import { Box } from "@mui/material";

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

function getStyles(name, personName, theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

export default function SectionCellSelectionDropdown({
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
}) {
  const context = useContext(RoutingContext);
  const theme = useTheme();

  const getStyleForSelectedValue = async (item, selectedItem, purpose) => {
    return {
      fontWeight:
        (purpose === "for-array-value" ? item : item?._id) === selectedItem
          ? theme.typography.fontWeightMedium
          : theme.typography.fontWeightRegular,
    };
  };

  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

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

      const { message, cells, selectedLine, lines } = data;

      console.log("section based data:", data);
      console.log("selectedSubSection:", selectedLine);

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_DATA_BASED_ON_SUBSECTION,

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
          message,
        });
      }

      // console.log(data);
    })();
  }, []);

  const commonProps = {
    displayEmpty: true,
    input: <OutlinedInput />,
    inputProps: { "aria-label": "Without label" },
    MenuProps,
    sx: {
      width: 130,
      "& .MuiSelect-select": {
        paddingTop: "5px",
        paddingBottom: "5px",
      },
    },
  };

  return (
    <Box sx={{ display: "flex", gap: "12px" }}>
      {context?.tm_grade === "HOD" && sections?.length > 0 && (
        <FormControl size="small">
          <Select
            {...commonProps}
            value={selectedSection}
            onChange={(e) => {
              reducerDispatch({
                type: ACTION.HANDLE_SELECT_SECTION,
                flagForTogglingFilter: "based-on-section",
                selectedSection: e.target.value,
              });
              getFiltrationValueBasedOnSection({ section: e.target.value });
            }}
            // renderValue={(selected) => <strong>{selected}</strong>}
          >
            {/* {selectedSections === "" && <></>} */}
            <MenuItem disabled value="">
              <em>Sections</em>
            </MenuItem>

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
        </FormControl>
      )}

      {subSections?.length > 0 && (
        <FormControl size="small">
          <Select
            {...commonProps}
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
          >
            {/* {selectedSubSection === "" && <></>} */}
            <MenuItem disabled value="">
              <em>SubSections</em>
            </MenuItem>

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
        </FormControl>
      )}

      {cells?.length > 0 && (
        <FormControl size="small">
          <Select
            {...commonProps}
            value={selectedCell}
            onChange={(e) => {
              reducerDispatch({
                type: ACTION.HANDLE_SELECT_CELL,
                flagForTogglingFilter: "based-on-cell",
                selectedCell: e.target.value,
              });
            }}
          >
            {/* {selectedCell === "" && <></>} */}
            <MenuItem disabled value="">
              <em>Cells</em>
            </MenuItem>
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
        </FormControl>
      )}
    </Box>
  );
}
