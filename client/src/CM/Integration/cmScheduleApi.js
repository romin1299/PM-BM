import { axiosPostOrPatch } from "../../Utils/axiosUtils";

/**
 * Move the Target Date of one planned CM occurrence.
 *
 * The server re-derives every later pending occurrence from the new date plus
 * the sheet's existing frequency, so the caller only sends the new date.
 *
 * Uses the shared axios helper, so the success/failure toast is raised by
 * Utils/tryCatch from the response's showToast flag rather than by the caller.
 *
 * @param {string} requestSheetId  CM request-sheet _id
 * @param {string} occurrenceId    current_commonDataFilledByAssignUser._id
 * @param {string} targetDateOfCM  new date as "YYYY-MM-DDTHH:mm"
 * @returns {Promise<object>} response body, or { isError: true } on failure
 */
export const updateCMTargetDate = async ({
  requestSheetId,
  occurrenceId,
  targetDateOfCM,
}) =>
  await axiosPostOrPatch({
    apiType: "patch",
    url: "/cm/requestSheet/targetDate",
    axiosBody: { data: { targetDateOfCM } },
    axiosProps: {
      params: { requestSheet_id: requestSheetId, occurrenceId },
    },
  });

export default updateCMTargetDate;
