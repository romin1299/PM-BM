import { memo, useCallback, useState } from "react";

import SearchableScrollDropdown from "../../Component/SearchableScrollDropdown";
import { axiosGetOrDelete } from "../../Utils/axiosUtils";

/**
 * Raising a new request-sheet from a rejected one.
 *
 * A rejection closes a sheet rather than handing it back, so answering one
 * meant keying every part in again. Picking a rejected sheet here fills the
 * form with what that requester wrote — the request type, the parts and their
 * drawings — leaving it all editable before it is sent for approval.
 *
 * The filter bar lands on the place the original sheet was raised for, which
 * the requester can change before submitting; the machine it ends on is what
 * the new sheet is stamped with and what its number is derived from.
 */

const listUrl = "/v1/spare/spareRequestSheet/rejected";
const copyUrl = "/v1/spare/spareRequestSheet/rejected/copy";

const optionLabel = (option) => {
  if (!option?._id) return "";

  const place = [option?.machine?.machine_name, option?.line?.line_name]
    .filter(Boolean)
    .join(" / ");

  const parts = option?.partCount
    ? `${option.partCount} part${option.partCount > 1 ? "s" : ""}`
    : "";

  return [option?.requestSheetNo, place, parts].filter(Boolean).join(" — ");
};

const CopyFromRejectedSheet = memo(({ onCopy, hasEnteredParts }) => {
  const [selected, setSelected] = useState(null);
  const [isCopying, setIsCopying] = useState(false);

  const handleSelect = useCallback(
    async (option) => {
      setSelected(option);
      if (!option?._id) return;

      // Copying replaces the parts already on the form, so anything typed is
      // confirmed before it goes.
      if (
        hasEnteredParts &&
        !window.confirm(
          "Copying replaces the parts already entered on this sheet. Continue?",
        )
      ) {
        setSelected(null);
        return;
      }

      setIsCopying(true);
      const { isError, sheet, hierarchy } = await axiosGetOrDelete({
        url: copyUrl,
        axiosProps: { params: { _id: option._id } },
      });
      setIsCopying(false);

      if (isError) return setSelected(null);

      onCopy(sheet, hierarchy);
    },
    [onCopy, hasEnteredParts],
  );

  return (
    <div className="d-flex align-items-center gap-2 w-100">
      <small className="text-nowrap">Copy from rejected sheet:</small>
      <SearchableScrollDropdown
        url={listUrl}
        label={isCopying ? "Copying..." : "Search a rejected sheet"}
        value={selected}
        onChange={handleSelect}
        optionLabel={optionLabel}
        sx={{ width: 420, maxWidth: "100%" }}
      />
    </div>
  );
});

export default CopyFromRejectedSheet;
