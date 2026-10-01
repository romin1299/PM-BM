import React, { useContext, useEffect, useState } from "react";
import { Button, Container, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";

import RoutingContext from "../../../context/routing/RoutingContext";
import MachineModificationSheet, {
  DETAIL_SHEET_FIELDS,
  attachmentsKeyFor,
} from "./MachineModificationSheet";
import NewMachineApprovalTrack, {
  isCurrentApprover,
} from "./newMachineApprovalStages";
import NewMachineApproveReject, {
  DECISION_FIELD,
  DECISION_REMARKS_FIELD,
  submitApprovalDecision,
} from "./NewMachineApproveReject";

/**
 * A raised MODIFICATION WORK REQUEST / REPORT, opened from the report and
 * approval dashboards.
 *
 * The same sheet the requester filled, with the bands that are still open to
 * the person reading it: the request band closes once the sheet has left the
 * requesting department, while MTD's approvers can still be named.
 *
 * The sheet ends at MTD's approval band here as it does on the raise page —
 * the report bands below it belong to a stage that is not yet in the
 * application, and showing empty boxes for work nobody can record only invites
 * them to be filled in the wrong place. They come back with that stage.
 */

/** Statuses in which the requesting department may still edit its own band. */
const REQUEST_OPEN_STATUSES = ["Generated", "Rejected"];

/**
 * Only what the reader actually changed, in the shape the sheet stores it.
 *
 * The sheet is filled by three departments in turn, so an update that posted
 * the whole form would write back every field the form happened to be holding
 * — including a stage's signatures as they looked when the page was opened.
 * Sending the changed fields alone keeps an edit to what was edited.
 *
 * An array that was touched at all is sent whole: a parts row taken out has to
 * replace the array, not merge into it.
 */
const changedOnly = (values, dirty) => {
  if (dirty === true) return values;
  if (Array.isArray(dirty)) return values;

  if (dirty && typeof dirty === "object") {
    const picked = {};
    Object.keys(dirty).forEach((key) => {
      const value = changedOnly(values?.[key], dirty[key]);
      if (value !== undefined) picked[key] = value;
    });
    return Object.keys(picked).length ? picked : undefined;
  }

  return undefined;
};

const NewMachineRequestForViewAndUpdate = ({
  handlePopupStatus,
  newMachineCmReqSheetView,
  selectedRowRequestSheetId,
  isEditable,
  isOtherFieldsEditableOrNot,
}) => {
  const loggedUser = useContext(RoutingContext);
  const [usersList, setUsersList] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  /** The sheet as stored, for the approval track and the decision panel. */
  const [sheet, setSheet] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isLoading, errors, dirtyFields },
  } = useForm({
    defaultValues: async () => {
      if (!selectedRowRequestSheetId) return {};
      try {
        const response = await axios.get(
          `/newMachineCM-requestSheets/${selectedRowRequestSheetId}`,
        );
        const requestSheet = response.data?.requestSheet ?? {};
        setSheet(requestSheet);
        return requestSheet;
      } catch (error) {
        console.error("Failed to fetch request sheet", error);
        return {};
      }
    },
  });

  useEffect(() => {
    axios
      // Plant-wide; see the raise page.
      .get(`/getApprovalUserList/?scope=plant`)
      .then((response) => setUsersList(response?.data?.userList ?? {}))
      .catch((error) => console.error("Fetch approval users failed", error));
  }, []);

  const status = watch("statusOfNewRequestOfCM");

  const isApprover = isCurrentApprover(sheet, loggedUser?._id);

  /**
   * Who may change what.
   *
   * The approver the sheet is waiting on may correct anything on it while they
   * decide — reading it is the point at which mistakes are caught, and sending
   * it back over a typo helps nobody. The requester keeps their band while the
   * sheet is still theirs: before it enters the chain, or after it comes back
   * rejected.
   *
   * Who approves is the exception. That is settled when the sheet is raised;
   * re-pointing it at someone else afterwards would move it out from under
   * whoever is holding it, so those boxes stay names for everyone.
   */
  const canEditSheet =
    isApprover ||
    (Boolean(isEditable) &&
      isOtherFieldsEditableOrNot !== "No" &&
      REQUEST_OPEN_STATUSES.includes(status));

  const editable = { request: canEditSheet, approvers: false };

  /**
   * One submit for the whole modal: whatever was edited is saved, and if this
   * reader is the approver the sheet is waiting on, their decision is recorded
   * straight after. Two buttons let the sheet be saved without the decision,
   * or decided on without the edits.
   */
  const onSubmit = async (payload) => {
    setIsSaving(true);
    try {
      const {
        detailSheetUploads = {},
        [DECISION_FIELD]: decision,
        [DECISION_REMARKS_FIELD]: remarks,
        ...sheetValues
      } = payload;

      const changes = changedOnly(sheetValues, dirtyFields) ?? {};
      const uploads = DETAIL_SHEET_FIELDS.filter(
        (field) => (detailSheetUploads[field] ?? []).length > 0,
      );

      if (canEditSheet && (Object.keys(changes).length || uploads.length)) {
        const formData = new FormData();

        // Detail sheets ride alongside the payload; see the raise page. The
        // filenames already stored go with them, because the server appends
        // the new ones to whatever the payload holds for that field.
        uploads.forEach((field) => {
          [...detailSheetUploads[field]].forEach((file) =>
            formData.append(attachmentsKeyFor(field), file),
          );
          const key = attachmentsKeyFor(field).split(".").pop();
          changes.newMachineRequestFilledByPED = {
            ...(changes.newMachineRequestFilledByPED ?? {}),
            [key]: watch(attachmentsKeyFor(field)) ?? [],
          };
        });

        formData.append("payload", JSON.stringify(changes));

        await axios.post(
          `/newMachineCM-requestSheets/?machineRef=${watch("machineId") ?? ""}` +
            `&_id=${watch("_id")}` +
            `&isOtherFieldsEditableOrNot=${isOtherFieldsEditableOrNot}` +
            `&statusOfNewRequestOfCM=${status}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      }

      // The decision goes last: it moves the sheet on, and the edits above
      // belong to the stage it is leaving.
      if (isApprover) await submitApprovalDecision({ sheet, decision, remarks });

      handlePopupStatus();
    } catch (error) {
      console.error("Submit failed", error);
      alert(
        error?.response?.data?.message ?? "Failed to submit request sheet.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      show={newMachineCmReqSheetView}
      fullscreen
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header className="d-flex justify-content-between">
        <Modal.Title id="contained-modal-title-vcenter">
          MODIFICATION WORK REQUEST / REPORT
          {status ? <small className="ms-2 text-muted">{status}</small> : null}
        </Modal.Title>
        <Button variant="secondary" onClick={handlePopupStatus}>
          Close
        </Button>
      </Modal.Header>

      <Modal.Body>
        {isLoading ? (
          <h5 className="p-3">Loading....</h5>
        ) : (
          <Container fluid className="p-2">
            <form onSubmit={handleSubmit(onSubmit)}>
              <MachineModificationSheet
                register={register}
                control={control}
                watch={watch}
                setValue={setValue}
                usersList={usersList}
                errors={errors}
                editable={editable}
                visibleUpTo="mtdApproval"
                requestSheetNo={watch("requestSheetNoOfNewMachineCM")}
              />

              {/* Where the sheet stands, stage by stage. */}
              <NewMachineApprovalTrack sheet={sheet ?? {}} />

              {/* The decision itself, for whoever the sheet is waiting on. */}
              {isApprover && (
                <NewMachineApproveReject
                  sheet={sheet}
                  register={register}
                  watch={watch}
                  errors={errors}
                />
              )}

              {/* One button: it saves the sheet and records the decision. */}
              {(canEditSheet || isApprover) && (
                <div className="d-flex justify-content-end gap-2 mt-3 mm-no-print">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? "Submitting…" : "Submit"}
                  </button>
                </div>
              )}
            </form>
          </Container>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default NewMachineRequestForViewAndUpdate;
