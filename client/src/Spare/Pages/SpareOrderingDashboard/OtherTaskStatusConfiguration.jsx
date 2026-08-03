import React, { memo, useMemo, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { useForm, useWatch, get } from "react-hook-form";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

import CustomTextField from "../../Component/FormComponent/CustomTextField";
import { axiosGetOrDelete, axiosPostOrPatch } from "../../Utils/axiosUtils";

const partFields = new Set([
  "rsPartReceive",
  "rsPartInspection",
  "rsMRNIssued",
  "rsMRNApproved",
]);

const url = "/v1/spare/spareRequestSheet/manualApprovalStatus";

const columns = [
  {
    label: "Required Qty",
    fieldName: "changePart.quantityRequired",
    inputProps: { type: "number", disabled: true },
    registerProp: {
      required: false,
    },
  },
  {
    label: "Stock Qty",
    fieldName: "costDetails.quantity",
    inputProps: { type: "number", disabled: false },
    registerProp: {
      required: "Stock Qty is required",
    },
  },
  {
    label: "Currency unit",
    fieldName: "costDetails.currencyUnit",
    inputProps: { type: "text", disabled: false },
    isDropdown: true,
    registerProp: {
      required: "Currency unit is required",
    },
  },
  {
    label: "Unit Cost",
    fieldName: "costDetails.cost",
    inputProps: { type: "number", disabled: false },
    registerProp: {
      required: "Unit cost is required",
    },
  },
  {
    label: "Cost in INR",
    fieldName: "costDetails.costInINR",
    inputProps: {
      type: "number",
      disabled: true,
    },
    registerProp: {
      required: false,
    },
  },
  {
    label: "Issued qty",
    fieldName: "costDetails.issuedQty",
    inputProps: {
      type: "number",
      disabled: true,
    },
    registerProp: {
      required: false,
    },
  },
  {
    label: "Available Qty",
    fieldName: "costDetails.availableQty",
    inputProps: { type: "number", disabled: true },
    registerProp: {
      required: false,
    },
  },
  {
    label: "Over all cost in INR",
    fieldName: "costDetails.overAllCost",
    inputProps: { type: "number", disabled: true },
    registerProp: {
      required: false,
    },
  },
];

const CommonTimeStampWithRemarksComponent = memo(
  ({
    show,
    popupRef,
    axiosParams,
    selectedRows = new Map(),
    updateRow,
    handleModal,
    children,
    OtherComponent = null,
  }) => {
    const {
      register,
      setValue,
      watch,
      control,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm({
      defaultValues: async () => {
        const { isError, spare } = await axiosGetOrDelete({
          url,
          axiosProps: {
            params: axiosParams,
          },
        });
        if (!isError) return spare;
        return {};
      },
    });

    const handleSubmitForm = async (formValue) => {
      const axiosBody = { formValue };

      if (
        !axiosParams?.batchId &&
        !partFields.has(popupRef?.key) &&
        selectedRows.size > 0
      ) {
        let partIdsToUpdate = [];

        for (const [id, value] of selectedRows) {
          if (
            value?.cellId === axiosParams?.cellId &&
            value?.maker === axiosParams?.maker
          )
            partIdsToUpdate.push(id);
        }

        axiosBody["partIdsToUpdate"] = partIdsToUpdate;
      }

      const { isError, spareParts } = await axiosPostOrPatch({
        url,
        apiType: "patch",
        axiosBody,
        axiosProps: {
          params: axiosParams,
        },
      });

      if (!isError) {
        updateRow(spareParts);
        handleModal();
        reset();
      }
    };

    return (
      <Modal show={show} onHide={handleModal} animation={false} centered>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <Modal.Header closeButton>
            <Modal.Title>{popupRef?.popupTitle}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {OtherComponent && (
              <OtherComponent
                popupRef={popupRef}
                register={register}
                setValue={setValue}
                control={control}
                errors={errors}
                disableFieldAfterOneTimeConfiguration={watch(
                  "disableFieldAfterOneTimeConfiguration",
                )}
              />
            )}
            <CustomTextField
              label={`${popupRef?.popupTitle} timestamp`}
              fieldName={`${popupRef?.key}TimeStamp.inString`}
              inputProps={{
                type: "datetime-local",
              }}
              register={register}
              errors={errors}
            />
            <CustomTextField
              label={`${popupRef?.popupTitle} remarks`}
              fieldName={`${popupRef?.key}Remarks`}
              register={register}
              errors={errors}
            />
          </Modal.Body>
          <Modal.Footer>
            <button variant="primary" type="submit" className="btn bg-success">
              Submit
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  },
);

const CurrencyDropdown = ({
  currencyMap,
  label = "",
  fieldName = "",
  register,
  registerProp = {
    required: false,
  },
  errors = {},
}) => {
  const error = get(errors, fieldName);
  return (
    <>
      <div className={`pwd-container `}>
        <span className="fieldTitle">{label}: </span>
        <div className="d-flex align-self-center justify-content-center w-100">
          <select className="w-100" {...register(fieldName, registerProp)}>
            <option value="" disabled>
              Please Select
            </option>
            {[...currencyMap.values()].map((obj) => (
              <option key={obj._id} value={obj.currencyUnit}>
                {obj.currencyUnit}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-error mb-1">{error?.message}</p>}
    </>
  );
};

const FirstTimePartConfiguration = ({
  errors,
  register,
  setValue,
  control,
}) => {
  const [{ data }] = useSafeGetRequest({
    url: "/v1/spare/customization/dynamicCurrencyConversion",
    initialState: {
      isLoading: true,
      isError: false,
      data: { spareCurrenciesWithUnit: [] },
    },
  });

  const currencyMap = useMemo(
    () =>
      new Map(
        data?.spareCurrenciesWithUnit?.map((obj) => [obj.currencyUnit, obj]) ??
          [],
      ),
    [data?.spareCurrenciesWithUnit],
  );

  const cost = useWatch({ name: "costDetails.cost", control });
  const currencyUnit = useWatch({ name: "costDetails.currencyUnit", control });

  useEffect(() => {
    if (!cost || !currencyUnit) return;

    const selectedCurrency = currencyMap.get(currencyUnit);
    if (!selectedCurrency) return;

    setValue(
      `costDetails.costInINR`,
      parseFloat((parseFloat(cost) * selectedCurrency.currencyRate).toFixed(2)),
      { shouldDirty: true },
    );
  }, [cost, currencyUnit, currencyMap, setValue]);

  return columns.map((item) =>
    item?.isDropdown ? (
      <CurrencyDropdown
        {...item}
        currencyMap={currencyMap}
        register={register}
        errors={errors}
        key={item?.fieldName}
      />
    ) : (
      <CustomTextField
        {...item}
        register={register}
        errors={errors}
        key={item?.fieldName}
      />
    ),
  );
};

const PartReceipt = ({
  disableFieldAfterOneTimeConfiguration = true,
  ...rest
}) => {
  if (disableFieldAfterOneTimeConfiguration)
    return columns.map((item) => (
      <CustomTextField
        {...item}
        inputProps={{
          ...item?.inputProps,
          disabled: item?.fieldName !== "costDetails.quantity",
        }}
        register={rest.register}
        errors={rest.errors}
        key={item?.fieldName}
      />
    ));

  return <FirstTimePartConfiguration {...rest} />;
};

const OtherTaskStatusConfiguration = memo((props) => {
  if (props?.popupRef?.key === "rsPartReceive")
    return (
      <CommonTimeStampWithRemarksComponent
        {...props}
        OtherComponent={PartReceipt}
      />
    );
  return <CommonTimeStampWithRemarksComponent {...props} />;
});

export default OtherTaskStatusConfiguration;
