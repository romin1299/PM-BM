import React from "react";
import { get, useFieldArray, useWatch } from "react-hook-form";

import densoLogo from "../../../static/images/denso_logo.png";
import DropdownComponent from "../../Components/ReqestSheetOfCM/RSComponents/UserApprovalSelectFields/DropdownComponent";
import "./MachineModificationSheet.scss";

/**
 * MODIFICATION WORK REQUEST / REPORT — the controlled form FO/MTD/17/01/05.
 *
 * One component for the whole sheet, used by both the raise page and the
 * view/update page, so the document a requester fills is the same document an
 * approver reads. The paper form is a 30-column grid (its columns B..AE) and
 * this is that grid: each band of the form is a row, and every merged cell is
 * a colspan, so the layout cannot drift from the printed original.
 *
 * Which bands accept input is the caller's decision — the requested department
 * fills the top, MTD the middle, both the closing band — so editability comes
 * in as a flag per band rather than being inferred here. The signature boxes
 * are their own flag, `approvers`: who approves is settled when the sheet is
 * raised and fixed from then on, so those boxes are pickable exactly once and
 * read as names for the rest of the sheet's life. `visibleUpTo` goes
 * further and ends the sheet early: the requester raising one fills it as far
 * as MTD's approval and never sees the report bands, which are not theirs to
 * fill and are not part of what they are submitting.
 */

const SHIFTS = ["A", "B", "C", "G"];

/**
 * The three starred declarations. A Yes obliges the requester to attach the
 * detail sheet the form's note asks for, so each carries its own attachments:
 * `stored` are the filenames already saved, `upload` the files being added now.
 */
const DECLARATIONS = [
  { field: "riskAssessment", label: "Risk Assessment done", labelSpan: 3, yesNo: 3 },
  { field: "safetyRelated", label: "Safety related", labelSpan: 2, yesNo: 3 },
  { field: "qualityRelated", label: "Quality related", labelSpan: 2, yesNo: 2 },
].map((d) => ({ ...d, colSpan: d.labelSpan + d.yesNo }));

/** The declarations a detail sheet can be attached to, for the caller. */
export const DETAIL_SHEET_FIELDS = DECLARATIONS.map(({ field }) => field);

/** Where the file input for a declaration lives on the form. */
export const uploadKeyFor = (field) => `detailSheetUploads.${field}`;
/** Where its saved filenames live on the sheet. */
export const attachmentsKeyFor = (field) =>
  `newMachineRequestFilledByPED.${field}Attachments`;

/** Files are served from the folder the upload wrote them to. */
const fileUrl = (filename) =>
  `${process.env.REACT_APP_BASE_URL ?? ""}/${filename}`;

/** The form's Yes / No pairs, printed one above the other beside their label. */
const YesNoCell = ({ register, name, value, disabled, colSpan }) => (
  <td colSpan={colSpan} className="mm-center">
    <label className="mm-yesno">
      <input type="radio" value={value} disabled={disabled} {...register(name)} />
      {value}
    </label>
  </td>
);

/**
 * The detail sheet a Yes declaration must carry: what is already attached,
 * and a picker for more. Required while the answer is Yes and nothing is
 * attached yet — the form says so, so the sheet cannot be submitted without it.
 */
const DetailSheetCell = ({
  declaration,
  control,
  register,
  disabled,
  error,
}) => {
  const answer = useWatch({
    control,
    name: `newMachineRequestFilledByPED.${declaration.field}`,
  });
  const stored =
    useWatch({ control, name: attachmentsKeyFor(declaration.field) }) ?? [];

  if (answer !== "Yes")
    return (
      <td colSpan={declaration.colSpan} className="mm-center mm-note">
        —
      </td>
    );

  return (
    <td colSpan={declaration.colSpan}>
      {stored.length > 0 && (
        <ol className="mm-files">
          {stored.map((filename) => (
            <li key={filename}>
              <a href={fileUrl(filename)} target="_blank" rel="noreferrer">
                {String(filename).replace(/^\d+_/, "")}
              </a>
            </li>
          ))}
        </ol>
      )}
      {!disabled && (
        <input
          type="file"
          multiple
          className="mm-file-input"
          {...register(uploadKeyFor(declaration.field), {
            validate: (files) =>
              stored.length > 0 ||
              (files && files.length > 0) ||
              `Attach the ${declaration.label.toLowerCase()} detail sheet`,
          })}
        />
      )}
      {error ? <div className="mm-error">{error.message}</div> : null}
    </td>
  );
};

/**
 * A signature box filled in by the sheet itself rather than chosen — "Prepared
 * by" is whoever raised it. Shown as the name it holds, so a preparer who is
 * not in the pickable list still reads correctly; a dropdown would have shown
 * them as blank and then cleared the field.
 */
const NamedCell = ({ colSpan, control, formKey }) => {
  const user = useWatch({ control, name: formKey });
  return (
    <td colSpan={colSpan} className="mm-center">
      {user?.tm_name ?? "—"}
    </td>
  );
};

/**
 * A signature box.
 *
 * While the sheet is being raised it is a dropdown of that department's
 * people, and naming someone is required — a sheet with a missing approver
 * would sit with nobody. Once raised it is the name alone: the chain is
 * settled, and a disabled dropdown would still misread anyone who is not in
 * the pickable list.
 */
const SignatureCell = ({
  colSpan,
  formKey,
  users,
  control,
  register,
  watch,
  setValue,
  errors,
  selectable,
  required = true,
}) => {
  if (!selectable)
    return <NamedCell colSpan={colSpan} control={control} formKey={formKey} />;

  const error = get(errors, `${formKey}.userRef`);

  return (
    <td colSpan={colSpan} className="mm-center">
      <DropdownComponent
        formKey={formKey}
        userDropdown={users}
        label="Select"
        register={register}
        watch={watch}
        setValue={setValue}
        isEditable
        requiredMSG={required ? "Select an approver" : false}
      />
      {error ? <div className="mm-error">{error.message}</div> : null}
    </td>
  );
};

const Band = ({ children, colSpan = 30 }) => (
  <tr>
    <td colSpan={colSpan} className="mm-band">
      {children}
    </td>
  </tr>
);

/**
 * "PARTS  FOR MODIFICATION". The form prints three rows; this grows and
 * shrinks with the work, which is why it is a field array rather than a fixed
 * three. A read-only sheet shows only the rows that were filled.
 */
const PartsRows = ({ control, register, disabled }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "filledByMTD_User.changedParts",
  });

  const rows = fields.length ? fields : [];

  return (
    <>
      <tr>
        <td
          /* Header, one row per part, and the trailing row: the add button
             while editable, or the placeholder when there is nothing to show. */
          rowSpan={
            1 + rows.length + (disabled ? (rows.length ? 0 : 1) : 1)
          }
          colSpan={3}
          className="mm-label mm-center mm-wrap"
        >
          PARTS FOR MODIFICATION
        </td>
        <td colSpan={6} className="mm-label mm-center">
          PART NO.
        </td>
        <td colSpan={7} className="mm-label mm-center">
          PART NAME
        </td>
        <td colSpan={4} className="mm-label mm-center">
          MAKER
        </td>
        <td colSpan={3} className="mm-label mm-center">
          QUANTITY
        </td>
        <td colSpan={4} className="mm-label mm-center">
          PRICE
        </td>
        <td colSpan={3} className="mm-label mm-center">
          COST CENTER
        </td>
      </tr>

      {rows.map((field, index) => (
        <tr key={field.id}>
          <td colSpan={6}>
            <input
              disabled={disabled}
              {...register(`filledByMTD_User.changedParts.${index}.partNo`)}
            />
          </td>
          <td colSpan={7}>
            <input
              disabled={disabled}
              {...register(`filledByMTD_User.changedParts.${index}.partName`)}
            />
          </td>
          <td colSpan={4}>
            <input
              disabled={disabled}
              {...register(`filledByMTD_User.changedParts.${index}.makerName`)}
            />
          </td>
          <td colSpan={3}>
            <input
              type="number"
              disabled={disabled}
              {...register(`filledByMTD_User.changedParts.${index}.quantity`, {
                valueAsNumber: true,
              })}
            />
          </td>
          <td colSpan={4}>
            <input
              type="number"
              disabled={disabled}
              {...register(`filledByMTD_User.changedParts.${index}.price`, {
                valueAsNumber: true,
              })}
            />
          </td>
          <td colSpan={3}>
            <div className="d-flex align-items-center">
              <input
                disabled={disabled}
                {...register(
                  `filledByMTD_User.changedParts.${index}.costCenter`,
                )}
              />
              {!disabled && (
                <button
                  type="button"
                  className="mm-row-action mm-no-print"
                  title="Remove this part"
                  onClick={() => remove(index)}
                >
                  ×
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}

      {!disabled && (
        <tr className="mm-no-print">
          <td colSpan={27}>
            <button type="button" className="mm-add" onClick={() => append({})}>
              + Add part
            </button>
          </td>
        </tr>
      )}

      {/* An empty read-only table would collapse to nothing at all. */}
      {disabled && !rows.length && (
        <tr>
          <td colSpan={27} className="mm-center">
            —
          </td>
        </tr>
      )}
    </>
  );
};

const MachineModificationSheet = ({
  register,
  control,
  watch,
  setValue,
  usersList = {},
  errors = {},
  /**
   * Which bands accept input. Each band belongs to the department that signs
   * it, and they are filled at different points in the sheet's life.
   */
  editable = {},
  /**
   * How much of the form to render: the whole thing, or only as far as MTD's
   * approval band, which is where the requester's part of it ends.
   */
  visibleUpTo = "full",
  requestSheetNo,
}) => {
  const {
    request: canEditRequest = false,
    /** Whether the approval chain is still being chosen — see SignatureCell. */
    approvers: canChooseApprovers = false,
    report: canEditReport = false,
    closing: canEditClosing = false,
  } = editable;

  const PED = "newMachineRequestFilledByPED";
  const MTD = "filledByMTD_User";

  const showReportOnwards = visibleUpTo === "full";

  const signature = (formKey, users, selectable = canChooseApprovers) => ({
    formKey,
    users,
    control,
    register,
    watch,
    setValue,
    errors,
    selectable,
  });

  return (
    <table className="mm-sheet">
      <colgroup>
        {Array.from({ length: 30 }, (_, index) => (
          <col key={index} style={{ width: `${100 / 30}%` }} />
        ))}
      </colgroup>
      <tbody>
        {/* ============ HEAD ============ */}
        <tr>
          <td colSpan={8} className="mm-logo">
            <img src={densoLogo} alt="DENSO" />
          </td>
          <td colSpan={22} className="mm-title">
            MODIFICATION WORK REQUEST / REPORT
            {requestSheetNo ? (
              <div className="mm-note">{requestSheetNo}</div>
            ) : null}
          </td>
        </tr>

        <tr>
          <td colSpan={3} className="mm-label">
            Scope:
          </td>
          <td colSpan={27}>
            <input disabled={!canEditRequest} {...register(`${PED}.scopeOfCM`)} />
          </td>
        </tr>

        {/* ============ 1. REQUESTED DEPARTMENT ============ */}
        <Band>To be Filled by Requested Department</Band>

        <tr>
          <td colSpan={8} className="mm-label mm-center">
            REQUEST ON
          </td>
          <td colSpan={8} className="mm-label mm-center">
            REQUIRED ON
          </td>
          <td colSpan={5} className="mm-label mm-center">
            Approved by HOD<span className="mm-required">*</span>
          </td>
          <td colSpan={5} className="mm-label mm-center">
            Checked by
          </td>
          <td colSpan={4} className="mm-label mm-center">
            Prepared by
          </td>
        </tr>
        <tr>
          {/* The form prints a date box and a time box; one datetime holds both. */}
          <td colSpan={8}>
            <input
              type="datetime-local"
              disabled={!canEditRequest}
              {...register(`${PED}.requestOn`)}
            />
          </td>
          <td colSpan={8}>
            <input
              type="datetime-local"
              disabled={!canEditRequest}
              {...register(`${PED}.requiredOn`)}
            />
          </td>
          <SignatureCell
            colSpan={5}
            {...signature(`${PED}.approvedByPED_HOD.0`, usersList?.PEDHODList)}
          />
          <SignatureCell
            colSpan={5}
            {...signature(`${PED}.checkedByPED_HOS.0`, usersList?.PEDHOSList)}
          />
          {/* Stamped with whoever is raising the sheet, not chosen. */}
          <NamedCell
            colSpan={4}
            control={control}
            formKey={`${PED}.preparedByPED_TL.0`}
          />
        </tr>

        <tr>
          <td colSpan={5} className="mm-label">
            Machine/Jig Name :
          </td>
          <td colSpan={10}>
            {/* Taken from the machine the sheet is raised against. */}
            <input readOnly disabled {...register(`${PED}.machineJigName`)} />
          </td>
          <td colSpan={5} className="mm-label">
            Machine/Jig No. :
          </td>
          <td colSpan={6}>
            <input readOnly disabled {...register(`${PED}.machineJigNo`)} />
          </td>
          <td colSpan={2} className="mm-label mm-center">
            DEPT / LINE
          </td>
          <td colSpan={2}>
            <input readOnly disabled {...register(`${PED}.deptLine`)} />
          </td>
        </tr>

        <tr>
          <td colSpan={26} className="mm-label">
            MODIFICATION WORK REQUEST (With Concept):
          </td>
          <td colSpan={4} className="mm-label mm-center">
            SHIFT
          </td>
        </tr>
        <tr>
          <td colSpan={26}>
            <textarea
              rows={7}
              disabled={!canEditRequest}
              {...register(`${PED}.modificationWorkRequest`)}
            />
          </td>
          <td colSpan={4} className="mm-center">
            <select disabled={!canEditRequest} {...register(`${PED}.shiftOfNewCM`)}>
              <option value="">—</option>
              {SHIFTS.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </td>
        </tr>

        <tr>
          <td colSpan={30} className="mm-label">
            Background:
          </td>
        </tr>
        <tr>
          <td colSpan={30}>
            <textarea
              rows={4}
              disabled={!canEditRequest}
              {...register(`${PED}.background`)}
            />
          </td>
        </tr>

        <tr>
          <td colSpan={4} className="mm-label">
            Current -
          </td>
          <td colSpan={26}>
            <textarea
              rows={3}
              disabled={!canEditRequest}
              {...register(`${PED}.currentSituation`)}
            />
          </td>
        </tr>
        <tr>
          <td colSpan={4} className="mm-label">
            Proposed -
          </td>
          <td colSpan={26}>
            <textarea
              rows={3}
              disabled={!canEditRequest}
              {...register(`${PED}.proposedSituation`)}
            />
          </td>
        </tr>

        <tr>
          <td colSpan={15} rowSpan={2} className="mm-label" style={{ verticalAlign: "top" }}>
            Purpose:
            <textarea
              rows={3}
              disabled={!canEditRequest}
              {...register(`${PED}.purposeOfCM`)}
            />
          </td>
          {DECLARATIONS.map((declaration) => (
            <React.Fragment key={declaration.field}>
              <td
                colSpan={declaration.labelSpan}
                rowSpan={2}
                className="mm-label mm-center mm-wrap"
              >
                <span className="mm-required">**</span>
                {declaration.label}
              </td>
              <YesNoCell
                register={register}
                name={`${PED}.${declaration.field}`}
                value="Yes"
                colSpan={declaration.yesNo}
                disabled={!canEditRequest}
              />
            </React.Fragment>
          ))}
        </tr>
        <tr>
          {DECLARATIONS.map((declaration) => (
            <YesNoCell
              key={declaration.field}
              register={register}
              name={`${PED}.${declaration.field}`}
              value="No"
              colSpan={declaration.yesNo}
              disabled={!canEditRequest}
            />
          ))}
        </tr>

        {/* "(**) : If Yes, Please attach detail sheet" — each under its own
            declaration, so it is plain which sheet belongs to which answer. */}
        <tr>
          <td colSpan={15} className="mm-label">
            Detail sheet (attach when Yes)
          </td>
          {DECLARATIONS.map((declaration) => (
            <DetailSheetCell
              key={declaration.field}
              declaration={declaration}
              control={control}
              register={register}
              disabled={!canEditRequest}
              error={errors?.detailSheetUploads?.[declaration.field]}
            />
          ))}
        </tr>

        {/* ============ 2. MTD APPROVAL ============ */}
        <tr>
          <td colSpan={16} rowSpan={2} className="mm-band">
            MODIFICATION WORK APPROVAL FROM MTD
          </td>
          <td colSpan={5} className="mm-label mm-center">
            MTD HOSS
          </td>
          <td colSpan={5} className="mm-label mm-center">
            MTD HOS
          </td>
          <td colSpan={4} className="mm-label mm-center">
            MTD HOD
          </td>
        </tr>
        <tr>
          <SignatureCell
            colSpan={5}
            {...signature(
              `${MTD}.modificationWork_ApprovedByMTD_HOSS.0`,
              usersList?.MTDTLList,
            )}
          />
          <SignatureCell
            colSpan={5}
            {...signature(
              `${MTD}.modificationWork_ApprovedByMTD_HOS.0`,
              usersList?.MTDHOSList,
            )}
          />
          <SignatureCell
            colSpan={4}
            {...signature(
              `${MTD}.modificationWork_ApprovedByMTD_HOD.0`,
              usersList?.MTDHODList,
            )}
          />
        </tr>

        {/* ============ 3. MTD REPORT ============ */}
        {showReportOnwards && (
          <>
        <Band>MODIFICATION WORK&nbsp; REPORT ( To be filled by MTD)</Band>

        <tr>
          <td colSpan={4} rowSpan={2} className="mm-label mm-center">
            WORK STARTED
          </td>
          <td colSpan={8} className="mm-label mm-center">
            DATE &amp; TIME
          </td>
          <td colSpan={4} rowSpan={2} className="mm-label mm-center">
            WORK ENDED
          </td>
          <td colSpan={10} className="mm-label mm-center">
            DATE &amp; TIME
          </td>
          <td colSpan={4} className="mm-label mm-center">
            Attended By
          </td>
        </tr>
        <tr>
          <td colSpan={8}>
            <input
              type="datetime-local"
              disabled={!canEditReport}
              {...register(`${MTD}.workStartedOn`)}
            />
          </td>
          <td colSpan={10}>
            <input
              type="datetime-local"
              disabled={!canEditReport}
              {...register(`${MTD}.workEndedOn`)}
            />
          </td>
          <SignatureCell
            colSpan={4}
            {...signature(`${MTD}.attendedBy`, usersList?.MTDTLList, canEditReport)}
          />
        </tr>

        <tr>
          <td colSpan={30} className="mm-label">
            MODIFICATION WORK DESCRIPTION:
          </td>
        </tr>
        <tr>
          <td colSpan={30}>
            <textarea
              rows={9}
              disabled={!canEditReport}
              {...register(`${MTD}.workDescription`)}
            />
          </td>
        </tr>

        <PartsRows
          control={control}
          register={register}
          disabled={!canEditReport}
        />

        {/* ============ 4. CLOSING ============ */}
        <tr>
          <td colSpan={30} className="mm-label">
            Requested dept. Confirmation After Completion:
          </td>
        </tr>
        <tr>
          <td colSpan={30}>
            <textarea
              rows={7}
              disabled={!canEditClosing}
              {...register("modificationConfirmationAfterCompletion")}
            />
          </td>
        </tr>

        <tr>
          <td colSpan={13} rowSpan={3} className="mm-label">
            SPECIAL COMMENTS:
            <textarea
              rows={4}
              disabled={!canEditClosing}
              {...register("SpecialComments")}
            />
          </td>
          <td colSpan={7} className="mm-band">
            Requested Dept.
          </td>
          <td colSpan={10} className="mm-band">
            MTD
          </td>
        </tr>
        <tr>
          <td colSpan={3} className="mm-label mm-center">
            Approved by
          </td>
          <td colSpan={4} className="mm-label mm-center">
            Checked by
          </td>
          <td colSpan={3} className="mm-label mm-center">
            Approved by
          </td>
          <td colSpan={4} className="mm-label mm-center">
            Checked by
          </td>
          <td colSpan={3} className="mm-label mm-center">
            Prepared by
          </td>
        </tr>
        <tr>
          <SignatureCell
            colSpan={3}
            {...signature(
              "approvedByPED_HOS.0",
              usersList?.PEDHOSList,
              canEditClosing,
            )}
          />
          <SignatureCell
            colSpan={4}
            {...signature(
              "checkedByPED_TL.0",
              usersList?.PEDTLList,
              canEditClosing,
            )}
          />
          <SignatureCell
            colSpan={3}
            {...signature(
              "approvedByMTD_HOD.0",
              usersList?.MTDHODList,
              canEditClosing,
            )}
          />
          <SignatureCell
            colSpan={4}
            {...signature(
              "approvedByMTD_HOS.0",
              usersList?.MTDHOSList,
              canEditClosing,
            )}
          />
          <SignatureCell
            colSpan={3}
            {...signature(
              "preparedAndCheckedByMTD_TL.0",
              usersList?.MTDTLList,
              canEditClosing,
            )}
          />
        </tr>
          </>
        )}

        {/* ============ FOOT ============ */}
        <tr>
          <td colSpan={30} className="mm-note">
            &lt; ROUTE &gt;&nbsp; Requested dept. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            Maintenance Head &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Requested
            dept.(Sheet Closing) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Maintenance
            dept.
          </td>
        </tr>
        <tr>
          <td colSpan={30} className="mm-note">
            &lt; NOTE &gt;&nbsp; (<span className="mm-required">*</span>) : HOD Approval Must
            &nbsp;&nbsp;&nbsp;; &nbsp;&nbsp;&nbsp; (
            <span className="mm-required">**</span>) : If Yes, Please attach detail sheet
          </td>
        </tr>
        <tr>
          <td colSpan={30} className="mm-note">
            FO/MTD/17/01/05
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default MachineModificationSheet;
