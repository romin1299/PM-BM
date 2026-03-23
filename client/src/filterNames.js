const findFilters = (filter, filterValues, selectedValue) => {
  try {
    let sectionName, subSectionName, cellName, lineName;
   
    switch (filter) {
      case "based-on-section":
        const section = filterValues?.sections?.find(
          (section) => section._id === selectedValue
        );
        sectionName = section?.section_name;
        break;

      case "based-on-subSection":
        const subSection = filterValues?.subSections?.find(
          (subSection) => subSection._id === selectedValue
        );
        subSectionName = subSection?.subSection_name;
        const sectionId = subSection?.section_names;
        const sectionForSubSection = filterValues?.sections?.find(
          (section) => section._id === sectionId
        );
        sectionName = sectionForSubSection?.section_name;
        break;

      case "based-on-cell":
        const cell = filterValues?.cells?.find(
          (cell) => cell._id === selectedValue
        );
        cellName = cell?.cell_name;
        const subSectionIdForCell = cell?.subSection_names;
        const subSectionForCell = filterValues?.subSections?.find(
          (subSection) => subSection._id === subSectionIdForCell
        );
        subSectionName = subSectionForCell?.subSection_name;
        const sectionIdForCell = cell?.section_names;
        const sectionForCell = filterValues?.sections?.find(
          (section) => section._id === sectionIdForCell
        );
        sectionName = sectionForCell?.section_name;

        break;

      case "based-on-line":
        const line = filterValues?.lines?.find(
          (line) => line._id === selectedValue
        );
        lineName = line?.line_name;
        const cellIdForLine = line?.cell_names;
        const cellForLine = filterValues?.cells?.find(
          (cell) => cell._id === cellIdForLine
        );
        cellName = cellForLine?.cell_name;
        const subSectionIdForLine = cellForLine?.subSection_names;
        const subSectionForLine = filterValues?.subSections?.find(
          (subSection) => subSection._id === subSectionIdForLine
        );
        subSectionName = subSectionForLine?.subSection_name;
        const sectionIdForLine = cellForLine?.section_names;
        const sectionForLine = filterValues?.sections?.find(
          (section) => section._id === sectionIdForLine
        );
        sectionName = sectionForLine?.section_name;
        break;

      default:
        break;
    }

    let filteredValuesWithHOD = [sectionName, subSectionName, cellName, lineName].filter(
      (item) => item !== undefined
    );

    let filteredValues = [subSectionName, cellName, lineName].filter(
      (item) => item !== undefined
    );
    return { filteredValuesWithHOD, filteredValues };
    // return { sectionName, subSectionName, cellName, lineName };
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export default findFilters;
