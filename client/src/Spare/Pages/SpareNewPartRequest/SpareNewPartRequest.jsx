import React, {
  useReducer,
  useContext,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Row, Col, Form, Container, Table } from "react-bootstrap";
import RoutingContext from "../../../context/routing/RoutingContext";

import { denso_logo } from "../../../modules/LoginModules";
import {
  reducer,
  initialState,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  buildPartAttachments,
  mergeAttachmentsIntoParts,
  collectNewFiles,
} from "../../Utils/attachmentUtils";
import PartList from "../../Component/PartList";
import {
  // partFor,
  newPartRequestForRadioOptions,
  partQtyOptions,
  partRequestDepartmentList,
  SPARE_SHEET_REQUESTER_EDITABLE_STATUSES,
  SPARE_SHEET_REJECTED_STATUS,
  SPARE_APPROVAL_LOG_FIELD_KEYS,
} from "../../Utils/dropdownUtils";
import { axiosPostOrPatch, axiosGetOrDelete } from "../../Utils/axiosUtils";
import NGBudgetApprovalSelection from "./NGBudgetApprovalSelection";
import NewSpareRequestSheetNo from "./NewSpareRequestSheetNo";
import RSDynamicApprovalSelection from "./RSDynamicApprovalSelection";
import AcceptOrRejectDynamicApproval from "./AcceptOrRejectDynamicApproval";
import SpareSheetRejectionRemark from "./SpareSheetRejectionRemark";
import useGetSectionWiseBudget from "../../SpareCustomHooks/useGetSectionWiseBudget";

const url = "/v1/spare/spareRequestSheet";

const SpareNewPartRequest = () => {
  const loggedUser = useContext(RoutingContext);
  const [searchParams] = useSearchParams();

  const isViewMode = useMemo(
    () => searchParams.get("action") === "view",
    [searchParams],
  );

  const navigate = useNavigate();

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  const {
    register,
    watch,
    setValue,
    getValues,
    control,
    handleSubmit,
    formState: { isLoading, errors, dirtyFields },
    reset,
  } = useForm({
    defaultValues: async () => {
      if (!searchParams.get("_id"))
        return {
          approvalOfMTD_TL: { user: { _id: null } },
          approvalOfMTD_HOSS: { user: { _id: null } },
          approvalOfPRD_TL: { user: { _id: null } },
          approvalOfPRD_HOSS: { user: { _id: null } },
          approvalOfMTD_HOS: { user: { _id: null } },
          approvalOfPRD_HOS: { user: { _id: null } },
          approvalOfMTD_HOD: { user: { _id: null } },
          approvalOfPRD_HOD: { user: { _id: null } },
          approvalOfTOOL_ROOM: { user: { _id: null } },
        };
      const { isError, spare } = await axiosGetOrDelete({
        url,
        axiosProps: {
          params: {
            _id: searchParams.get("_id"),
          },
        },
      });
      // partAttachments mirrors changeParts so the attachment editor has state
      // of its own, outside the useFieldArray that owns changeParts.
      if (!isError)
        return {
          ...spare,
          partAttachments: buildPartAttachments(spare?.changeParts),
        };
      return {};
    },
  });

  const sectionBudget = useGetSectionWiseBudget({
    flagForTogglingFilter: reduceState?.flagForTogglingFilter,
    selectedValue: reduceState?.selectedValue,
    existingSheetCell: watch("cell._id"),
  });

  const changeParts = useWatch({
    control,
    name: "changeParts",
  });

  const pendingApprovalBy = useWatch({ control, name: "pendingApprovalBy" });
  const requestSheetStatus = useWatch({ control, name: "requestSheetStatus" });

  const isApprover =
    Boolean(pendingApprovalBy) &&
    String(pendingApprovalBy) === String(loggedUser?._id ?? "");

  /**
   * Once a sheet is sent for approval it stops belonging to the person who
   * raised it. It is theirs while it is "Generated" or "Rejected" — a new sheet,
   * or one an approver has handed back. In every other status it is either with
   * an approver, who alone may change it, or finished and no longer editable at
   * all.
   */
  const isReadOnly = useMemo(() => {
    if (isViewMode) return true;
    if (!searchParams.get("_id")) return false;
    if (isApprover) return false;

    return !SPARE_SHEET_REQUESTER_EDITABLE_STATUSES.includes(
      requestSheetStatus,
    );
  }, [isViewMode, searchParams, isApprover, requestSheetStatus]);

  const approvalLogs = useWatch({
    control,
    name: SPARE_APPROVAL_LOG_FIELD_KEYS,
  });

  /**
   * A rejection clears the approval slots so the requester re-picks the chain,
   * which leaves the append-only logs as the record of who sent the sheet back.
   * Only the newest entry per slot is considered: re-submitting pushes a fresh
   * "Pending" entry to every slot, so an earlier rejection stops being last and
   * correctly stops showing.
   */
  const rejection = useMemo(() => {
    if (requestSheetStatus !== SPARE_SHEET_REJECTED_STATUS) return undefined;

    return approvalLogs
      ?.map((log) => log?.[log?.length - 1])
      ?.find((entry) => entry?.approvalStatus === "Rejected");
  }, [requestSheetStatus, approvalLogs]);

  const budget = useMemo(() => {
    if (!changeParts?.length)
      return {
        budgetStatus: "",
        requiredBudget: 0,
      };

    const requiredBudget = changeParts.reduce((acc, curr) => {
      const qty = Number.isFinite(Number(curr?.quantityRequired))
        ? Number(curr?.quantityRequired)
        : 0;
      const price = Number.isFinite(Number(curr?.approxUnitPrice))
        ? Number(curr?.approxUnitPrice)
        : 0;
      return acc + qty * price;
    }, 0);

    return {
      budgetStatus:
        sectionBudget?.sectionWiseCurrentMonthBudget - requiredBudget >= 0
          ? "OK"
          : "NG",
      requiredBudget,
    };
  }, [sectionBudget, changeParts]);

  const dirtyValues = (allValues) => {
    let newVal = {};
    Object.keys(dirtyFields).map((key) => {
      if (key === "changeParts")
        return (newVal[key] = allValues[key]?.map((item) => {
          const { drawingAttach, additionalAttachments, ...others } = item;
          return others;
        }));
      else return (newVal[key] = allValues[key]);
    });
    return newVal;
  };

  const handleNavigation = () => {
    if (searchParams.get("_id")) return navigate(-1);
    // return navigate("/spare/requests");
    return navigate("/spare/spareOrderingDashboard");
  };

  /**
   * Filenames the requester removed from previously-uploaded attachments.
   *
   * A ref rather than state: nothing renders from it, and it only needs to be
   * read once at submit, so keeping it out of state avoids re-rendering every
   * part row each time a file is removed.
   */
  const removedAttachmentFilesRef = useRef([]);

  const handleRemoveUploadedAttachment = useCallback((filename) => {
    if (filename) removedAttachmentFilesRef.current.push(filename);
  }, []);

  const handleNewPartRequest = async (formValue) => {
    if (searchParams.get("_id") && Object.keys(dirtyFields).length === 0)
      return;

    const formData = new FormData();
    let params = {};

    if (!searchParams.get("_id")) {
      params = {
        selectedMachine: reduceState?.selectedMachine,
      };

      let uploadFileIndexes = [],
        uploadAdditionalFileIndexes = [];

      /**
       * One entry per file, not per part: the server walks the uploaded files and
       * this list side by side to know which part each belongs to, so a part
       * contributing three drawings has to appear three times.
       */
      collectNewFiles(formValue.partAttachments, "drawingAttach").forEach(
        ({ index, file }) => {
          formData.append(`drawingAttach`, file);
          uploadFileIndexes.push(index);
        },
      );

      collectNewFiles(
        formValue.partAttachments,
        "additionalAttachments",
      ).forEach(({ index, file }) => {
        formData.append(`additionalAttachments`, file);
        uploadAdditionalFileIndexes.push(index);
      });

      formData.append("uploadFileIndexes", JSON.stringify(uploadFileIndexes));
      formData.append(
        "uploadAdditionalFileIndexes",
        JSON.stringify(uploadAdditionalFileIndexes),
      );

      formValue.changeParts = mergeAttachmentsIntoParts(
        formValue.changeParts,
        formValue.partAttachments,
      );
      delete formValue.partAttachments;
    }

    if (searchParams.get("_id")) {
      /**
       * Attachments are tracked outside changeParts, so a part whose only change
       * is an added or removed file leaves changeParts untouched in dirtyFields.
       * Both signals therefore have to be considered, or the edit would be sent
       * without the attachment work the requester just did.
       */
      const attachmentsChanged =
        Boolean(dirtyFields?.partAttachments) ||
        removedAttachmentFilesRef.current.length > 0;

      if (dirtyFields?.changeParts || attachmentsChanged) {
        let uploadFileIndexes = [],
          uploadAdditionalFileIndexes = [];

        collectNewFiles(formValue?.partAttachments, "drawingAttach").forEach(
          ({ index, file }) => {
            formData.append(`drawingAttach`, file);
            uploadFileIndexes.push(index);
          },
        );

        collectNewFiles(
          formValue?.partAttachments,
          "additionalAttachments",
        ).forEach(({ index, file }) => {
          formData.append(`additionalAttachments`, file);
          uploadAdditionalFileIndexes.push(index);
        });

        formData.append("uploadFileIndexes", JSON.stringify(uploadFileIndexes));
        formData.append(
          "uploadAdditionalFileIndexes",
          JSON.stringify(uploadAdditionalFileIndexes),
        );

        /**
         * Files the requester removed. The pruned arrays travel with changeParts
         * and detach them from the part; this list is what lets the server also
         * delete them from disk instead of leaving them orphaned.
         */
        formData.append(
          "removedAttachmentFiles",
          JSON.stringify(removedAttachmentFilesRef.current),
        );
      }

      const partAttachments = formValue?.partAttachments;

      formValue = dirtyValues(formValue);
      delete formValue.partAttachments;

      if (attachmentsChanged || formValue?.changeParts)
        /**
         * getValues rather than the dirty subset: changing only an attachment
         * leaves changeParts out of dirtyValues, and sending the parts without
         * their attachment arrays is exactly what made the server replace every
         * stored file with an empty list.
         */
        formValue.changeParts = mergeAttachmentsIntoParts(
          formValue.changeParts ?? getValues("changeParts"),
          partAttachments,
        );
    }

    if (!searchParams.get("_id") || formValue?.changeParts)
      formValue["budget"] = budget;

    if (formValue?.ifBudgetIsNG?.documentByRequestGenerator)
      formData.append(
        `documentByRequestGenerator`,
        formValue?.ifBudgetIsNG?.documentByRequestGenerator?.[0],
      );

    formData.append("data", JSON.stringify(formValue));

    if (searchParams.get("_id")) params = { _id: searchParams.get("_id") };

    // const { isError, spare } = await axiosPostOrPatch({
    const { isError } = await axiosPostOrPatch({
      url,
      apiType: searchParams.get("_id") ? "patch" : "post",
      axiosBody: formData,
      axiosProps: {
        params,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    });

    // if (!isError) reset(spare);
    if (!isError) {
      return handleNavigation();
    }
  };

  if (isLoading) return <h4>Loading....</h4>;

  return (
    <div className="p-2 ">
      <Form
        className="border border-dark"
        onSubmit={handleSubmit(handleNewPartRequest)}
        style={{ fontSize: "16px !important" }}
      >
        <Table>
          <Container fluid>
            <Row className="border">
              <Col className="d-flex flex-column col-3">
                {/* <div className="d-flex">
                {partFor?.map((item) => (
                  <>
                    &nbsp;
                    <Form.Check
                      style={{ fontSize: "14px" }}
                      type="checkbox"
                      {...item}
                      {...register("whichParts", {
                        required: searchParams.get("_id")
                          ? false
                          : "Please select part use for",
                      })}
                    />
                  </>
                ))}
              </div>
              {errors?.["whichParts"] && (
                <p className="text-error mb-1">
                  {errors?.["whichParts"]?.message}
                </p>
              )} */}

                {searchParams.get("_id") && (
                  <div>
                    <button
                      className="btn bg-button"
                      type="button"
                      onClick={handleNavigation}
                    >
                      Back
                    </button>
                  </div>
                )}
              </Col>
              <Col className="d-flex align-items-center justify-content-center text-center col-6">
                <h4 className="m-0">Spare Part Request(Order / Stock-in)</h4>
              </Col>
              <Col className="d-flex align-items-center justify-content-end text-center col-3">
                <img
                  src={denso_logo}
                  alt=""
                  className="bg-white"
                  height={50}
                  width={150}
                />
              </Col>
            </Row>

            {/* Everything the sheet is made of sits in one disabled fieldset,
                which natively disables every descendant control — inputs,
                selects, radios, file pickers and the add/remove row buttons — so
                read-only stays a single decision instead of a flag repeated on
                each field. The header row above is deliberately outside it, so
                Back stays usable on a read-only sheet. Links and text are never
                affected, keeping the sheet and its approval status viewable. */}
            <fieldset disabled={isReadOnly} className="border-0 p-0 m-0">
              <Row className="border">
                <Col>
                  {searchParams.get("_id") ? (
                    <>
                      {watch("cell.cell_name")} |&nbsp;{watch("line.line_name")}{" "}
                      | &nbsp; {watch("machine.machine_name")}
                    </>
                  ) : (
                    <ChartsToolbar
                      baseUrlForFiltering="/getFiltrationValue/all-filtration"
                      reduceState={reduceState}
                      reducerDispatch={reducerDispatch}
                      sectionFiltration
                      subSectionFiltration
                      cellFiltration
                      lineFiltration
                      machineFiltration
                    />
                  )}
                </Col>
              </Row>
              <Row>
                {searchParams.get("_id") ? (
                  <Col className="border d-flex align-items-center col-auto pt-0 pb-0">
                    {watch("requestSheetNo")}
                  </Col>
                ) : (
                  reduceState?.selectedLine && (
                    <Col className="border d-flex align-items-center col-auto pt-0 pb-0">
                      <NewSpareRequestSheetNo
                        selectedLine={reduceState?.selectedLine}
                        watch={watch}
                        setValue={setValue}
                      />
                    </Col>
                  )
                )}
                <Col className="border d-flex flex-column col-auto pt-0 pb-0">
                  <div className="d-flex align-items-center">
                    {newPartRequestForRadioOptions?.map((item) => (
                      <Form.Check
                        key={item?.value}
                        flex
                        style={{ fontSize: "14px" }}
                        className="m-1"
                        type="radio"
                        id={`inline-radio-1`}
                        {...item}
                        {...register("newPartFor", {
                          required: searchParams.get("_id")
                            ? false
                            : "Please select",
                        })}
                      />
                    ))}
                  </div>
                  {errors?.["newPartFor"] && (
                    <p className="text-error mb-1">
                      {errors?.["newPartFor"]?.message}
                    </p>
                  )}
                </Col>
                <Col className="border col-auto pt-0 pb-0">
                  <div className="d-flex align-items-center">
                    {partQtyOptions?.map((item) => (
                      <Form.Check
                        key={item?.value}
                        flex
                        style={{ fontSize: "14px" }}
                        type="radio"
                        className="m-1"
                        id={`inline-radio-1`}
                        {...item}
                        {...register("partQty", {
                          required: searchParams.get("_id")
                            ? false
                            : "Please select",
                        })}
                        // onClick={(e) => {
                        //   e.target.value === partQtyOptions?.[0]?.value &&
                        //     watch("changeParts")?.length > 1 &&
                        //     setValue("changeParts", [watch("changeParts")?.[0]], {
                        //       shouldDirty: true,
                        //     });
                        // }}
                      />
                    ))}
                  </div>
                  {errors?.["partQty"] && (
                    <p className="text-error">{errors?.["partQty"]?.message}</p>
                  )}
                </Col>
                <Col className="border col-auto pt-0 pb-0">
                  <div className="d-flex align-items-center">
                    <small>Part request for: </small>

                    {searchParams.get("_id") ? (
                      <>&nbsp;{watch("partRequestFor")}</>
                    ) : (
                      partRequestDepartmentList?.map((item) => (
                        <Form.Check
                          key={item?.value}
                          flex
                          style={{ fontSize: "14px" }}
                          type="radio"
                          className="m-1"
                          id={`inline-radio-1`}
                          {...item}
                          {...register("partRequestFor", {
                            required: searchParams.get("_id")
                              ? false
                              : "Please select",
                          })}
                        />
                      ))
                    )}
                  </div>
                  {errors?.["partRequestFor"] && (
                    <p className="text-error">
                      {errors?.["partRequestFor"]?.message}
                    </p>
                  )}
                </Col>
              </Row>
              {watch("partQty") && (
                <Row>
                  <PartList
                    register={register}
                    control={control}
                    setValue={setValue}
                    onRemoveUploaded={handleRemoveUploadedAttachment}
                    isReadOnly={isReadOnly}
                    changeParts={changeParts}
                    sectionBudget={sectionBudget?.sectionWiseCurrentMonthBudget}
                    {...budget}
                  />
                </Row>
              )}

              {(watch("requestSheetCreatedBy.tm_name") ||
                budget?.budgetStatus === "NG") && (
                <Row className="border d-flex align-items-center">
                  {watch("requestSheetCreatedBy.tm_name") && (
                    <Col className="d-flex align-items-center col-auto border gap-2">
                      <small>Created by: </small>
                      <small>
                        {watch("requestSheetCreatedBy.tm_name")} &nbsp;
                        {budget?.budgetStatus === "NG" && (
                          <>
                            {watch("ifBudgetIsNG.remarkByRequestGenerator") && (
                              <>
                                |&nbsp;
                                {watch("ifBudgetIsNG.remarkByRequestGenerator")}
                                &nbsp;
                              </>
                            )}
                            {watch(
                              "ifBudgetIsNG.documentByRequestGenerator.originalname",
                            ) && (
                              <>
                                |&nbsp;
                                <a
                                  target="_blank"
                                  rel="noreferrer"
                                  href={`${
                                    process.env.REACT_APP_BASE_URL
                                  }/v1/spare/${watch(
                                    "ifBudgetIsNG.documentByRequestGenerator.filename",
                                  )}`}
                                >
                                  {watch(
                                    "ifBudgetIsNG.documentByRequestGenerator.originalname",
                                  )}
                                </a>
                              </>
                            )}
                          </>
                        )}
                      </small>
                    </Col>
                  )}
                  {budget?.budgetStatus === "NG" &&
                    watch("mtdHODApprovalIfBudgetIsNG.user.tm_name") && (
                      <Col className="d-flex align-items-center col-auto border gap-2">
                        <small>NG budget approval: </small>
                        <small>
                          {watch("mtdHODApprovalIfBudgetIsNG.user.tm_name")} |{" "}
                          {watch("mtdHODApprovalIfBudgetIsNG.approvalStatus")}
                        </small>
                      </Col>
                    )}
                </Row>
              )}

              <SpareSheetRejectionRemark rejection={rejection} />

              {budget?.budgetStatus === "NG" &&
                (watch("mtdHODApprovalIfBudgetIsNG.user._id") ===
                  loggedUser?._id &&
                watch("mtdHODApprovalIfBudgetIsNG.approvalStatus") === "Pending"
                  ? ""
                  : // <HODNGBudgetApproval
                    //   register={register}
                    //   errors={errors}
                    //   watch={watch}
                    // />
                    !watch("mtdHODApprovalIfBudgetIsNG.user.tm_name") && (
                      <NGBudgetApprovalSelection
                        register={register}
                        errors={errors}
                      />
                    ))}

              {watch("pendingApprovalBy") === loggedUser?._id && (
                <AcceptOrRejectDynamicApproval
                  register={register}
                  errors={errors}
                  watch={watch}
                />
              )}

              {((budget?.budgetStatus === "OK" &&
                budget?.requiredBudget >= 0 &&
                sectionBudget?.sectionWiseCurrentMonthBudget >= 0) ||
                (budget?.budgetStatus === "NG" &&
                  watch("mtdHODApprovalIfBudgetIsNG.approvalStatus") ===
                    "Accepted")) &&
                !watch("isSpareSheetSendForApproval") &&
                watch("partRequestFor") && (
                  <RSDynamicApprovalSelection
                    register={register}
                    errors={errors}
                    partRequestFor={watch("partRequestFor")}
                  />
                )}

              {isReadOnly && !isViewMode && (
                <Row className="border d-flex align-items-center">
                  <Col className="d-flex align-items-center col-auto">
                    <small>
                      This request-sheet is {requestSheetStatus} and
                      {pendingApprovalBy
                        ? " can only be changed by the approver it is waiting on."
                        : " has completed its approval, so it can no longer be edited."}
                    </small>
                  </Col>
                </Row>
              )}

              {!isReadOnly && (
                <Row className="border d-flex align-items-center ">
                  <Col className="d-flex align-items-center gap-2">
                    {Object.keys(dirtyFields).length > 0 &&
                      searchParams.get("_id") && (
                        <button
                          type="button"
                          className="btn bg-warning"
                          onClick={() => reset()}
                        >
                          Cancel
                        </button>
                      )}

                    <button type="submit" className="btn bg-success">
                      Submit
                    </button>
                  </Col>
                </Row>
              )}
            </fieldset>
          </Container>
        </Table>
      </Form>
    </div>
  );
};

export default SpareNewPartRequest;
