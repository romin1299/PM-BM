export const clearLocalStorage = () => {
  const listOfLocalStorageItems = [
    "selectedValue",
    "flagForTogglingFilter",
    "selectedValueForLineAnTMLoadGraph",
    "togglingFilterFlagForLineAnTMLoadGraph",
    "selectedSection",
    "sections",
    "selectedSubSection",
    "subSections",
    "selectedCell",
    "cells",
    "selectedLine",
    "lines",
    "selectedMachine",
    "machines",
  ];

  listOfLocalStorageItems.forEach((key) => localStorage.removeItem(key));
};
