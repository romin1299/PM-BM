import React, { useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import moment from "moment";

import RoutingContext from "../../../context/routing/RoutingContext";

import MachineModificationSheet, {
  DETAIL_SHEET_FIELDS,
  attachmentsKeyFor,
} from "./MachineModificationSheet";

/**
 * Raising a MODIFICATION WORK REQUEST / REPORT (FO/MTD/17/01/05).
 *
 * The requester fills the form as far as MTD's approval band — the people who
 * will approve the work — and no further: the report bands below belong to MTD
 * and are not part of what is being submitted, so they are not shown.
 *
 * The page is only the form's surroundings — load, submit, navigate. The sheet
 * itself is one component shared with the view/update page, so both show the
 * same document.
 */

const now = () => moment().format("YYYY-MM-DDTHH:mm");

const NewMachineRequestSheetByPED = () => {
  const navigate = useNavigate();
  const loggedUser = useContext(RoutingContext);
  const params = useParams();
  const machine_code = params?.machine_code;
  const selectedYear = params?.selectedYear;

  const [usersList, setUsersList] = useState({});
  const [machineDetails, setMachineDetails] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      newMachineRequestFilledByPED: {
        scopeOfCM: "",
        requestOn: now(),
        requiredOn: now(),
        modificationWorkRequest: "",
        background: "",
        currentSituation: "",
        proposedSituation: "",
        purposeOfCM: "",
        shiftOfNewCM: "",
        riskAssessment: "No",
        safetyRelated: "No",
        qualityRelated: "No",
      },
    },
  });

  /**
   * The machine and the approver lists are independent: each is stored as its
   * own request lands, so one failing does not leave the other unset.
   */
  useEffect(() => {
    const load = async () => {
      const [machine, userList] = await Promise.allSettled([
        axios.get(
          `/getMachineDetailsOnScanningRequest/?machine_code=${machine_code}&&current_year=${selectedYear}`,
        ),
        // Plant-wide: the MTD approvers named here serve the whole plant, not
        // the requester's section.
        axios.get(`/getApprovalUserList/?scope=plant`),
      ]);

      if (machine.status === "fulfilled")
        setMachineDetails(machine.value?.data?.machine);
      else console.error("Fetch machine details failed", machine.reason);

      if (userList.status === "fulfilled")
        setUsersList(userList.value?.data?.userList ?? {});
      else console.error("Fetch approval users failed", userList.reason);
    };
    load();
  }, [machine_code, selectedYear]);

  /** "Prepared by" is whoever is raising the sheet. */
  useEffect(() => {
    if (!loggedUser?._id) return;
    setValue("newMachineRequestFilledByPED.preparedByPED_TL.0", {
      userRef: loggedUser._id,
      user_type: loggedUser.user_type,
      tm_no: loggedUser.tm_no,
      tm_name: loggedUser.tm_name,
      email: loggedUser.email,
    });
  }, [loggedUser, setValue]);

  /**
   * The machine as the form names it, copied onto the sheet once it is known.
   * Stored with the sheet rather than read back through the reference, so a
   * machine later renamed or moved does not rewrite sheets already signed.
   */
  useEffect(() => {
    if (!machineDetails) return;

    const line = machineDetails?.line_names;
    const cell = line?.cell_names;

    setValue(
      "newMachineRequestFilledByPED.machineJigName",
      machineDetails?.machine_name ?? "",
    );
    setValue(
      "newMachineRequestFilledByPED.machineJigNo",
      machineDetails?.machine_code ?? "",
    );
    setValue(
      "newMachineRequestFilledByPED.deptLine",
      [cell?.cell_name, line?.line_name].filter(Boolean).join(" / "),
    );
  }, [machineDetails, setValue]);

  const onSubmit = async (payload) => {
    if (!machineDetails?._id) return alert("Machine details are still loading.");

    setIsSaving(true);
    try {
      const formData = new FormData();

      /**
       * The detail sheets ride alongside the payload rather than inside it:
       * the server files them away by the name of the field they arrive under,
       * which is the path they are stored at on the sheet.
       */
      const { detailSheetUploads = {}, ...sheet } = payload;
      DETAIL_SHEET_FIELDS.forEach((field) => {
        [...(detailSheetUploads[field] ?? [])].forEach((file) =>
          formData.append(attachmentsKeyFor(field), file),
        );
      });

      formData.append("payload", JSON.stringify(sheet));

      const response = await axios.post(
        `/newMachineCM-requestSheets/?machineRef=${machineDetails._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response?.data) navigate(-1);
    } catch (error) {
      console.error("Submit failed", error);
      alert("Failed to submit request sheet.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container fluid className="p-3">
      <form onSubmit={handleSubmit(onSubmit)}>
        <MachineModificationSheet
          register={register}
          control={control}
          watch={watch}
          setValue={setValue}
          usersList={usersList}
          errors={errors}
          /**
           * The requester fills their own band and names MTD's approvers;
           * MTD's report bands are neither shown nor theirs to fill.
           */
          editable={{ request: true, approvers: true }}
          // Their part of the form ends at MTD's approval band.
          visibleUpTo="mtdApproval"
        />

        <div className="d-flex justify-content-end gap-2 mt-3 mm-no-print">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </form>
    </Container>
  );
};

export default NewMachineRequestSheetByPED;
