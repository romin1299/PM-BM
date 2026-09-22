import { memo, useEffect } from "react";
import { Col, Row, Form } from "react-bootstrap";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";
import {
  newPartRequestForRadioOptions,
  partQtyOptions,
  partTypes,
  partRequirementTypes,
  supplierCategoryTypes,
} from "../Utils/dropdownUtils";
import { DropdownComponent } from "../Pages/SpareMasterRegistration/SpareMasterRegistration";
import AttachmentField from "./AttachmentField";

const initialState = {};

const isBlank = (value) => value === "" || value == null;

/**
 * Min/Max are stock levels and only mean anything for a stock-in part, so
 * they are only enforced while that is the request type — a stale pair left
 * behind after switching to "For use" must not block the sheet. A blank on
 * either side is "no bound", which the server treats the same way.
 */
const minNotAboveMax = (index) => (max, values) => {
  const min = values?.changeParts?.[index]?.minQuantity;
  if (values?.newPartFor !== newPartRequestForRadioOptions?.[1]?.value)
    return true;
  if (isBlank(min) || isBlank(max)) return true;
  return (
    Number(min) <= Number(max) ||
    "Min quantity cannot be greater than max quantity"
  );
};

const PartRow = memo(
  ({
    index,
    register,
    control,
    setValue,
    remove,
    partData,
    newPartFor,
    isReadOnly,
    canRemove,
    onRemoveUploaded,
  }) => {
    const partType = partData?.standerOrManufacturingPart;

    const { errors } = useFormState({
      control,
      name: `changeParts.${index}.maxQuantity`,
    });
    const minMaxError = errors?.changeParts?.[index]?.maxQuantity?.message;

    return (
      <div className="m-0 p-0 w-50">
        <Row className="m-0 p-1 d-flex flex-column">
          <Col className="d-flex border col-auto gap-1 m-2 mt-0 mb-0 p-2 flex-wrap align-items-center justify-content-between">
            <small>
              <b>Part Details {index + 1}</b>
            </small>
            {canRemove && (
              <button
                type="button"
                className="bg-danger text-white border-0"
                onClick={() => remove(index)}
              >
                Delete
              </button>
            )}
          </Col>

          <Col className="d-flex flex-column border col-auto m-2 mt-0 mb-1 p-2 pt-0 pb-0 flex-wrap align-items-center justify-content-between">
            <Col className="w-100 d-flex justify-content-between pt-1">
              <small>Part name</small>
              <input
                type="text"
                className="w-75"
                {...register(`changeParts.${index}.partName`)}
              />
            </Col>

            <Col className="w-100 d-flex justify-content-between">
              <small>Part model</small>
              <input
                type="text"
                className="w-75"
                {...register(`changeParts.${index}.partModel`)}
              />
            </Col>

            <Col className="w-100 d-flex justify-content-between">
              <small>Maker</small>
              <DropdownComponent
                control={control}
                label="Maker"
                fieldName={`changeParts.${index}.maker`}
                requestedFor="maker"
              />
            </Col>

            <Col className="w-100 d-flex justify-content-between">
              <small>Supplier name</small>
              <DropdownComponent
                control={control}
                label="Supplier name"
                fieldName={`changeParts.${index}.supplierName`}
                requestedFor="supplierName"
              />
            </Col>

            <Col className="w-100 d-flex justify-content-between">
              <small>Supplier category</small>

              <div className="border d-flex w-75">
                {supplierCategoryTypes?.map((type) => (
                  <Form.Check
                    key={type?.value}
                    type="radio"
                    className="m-1"
                    {...type}
                    {...register(`changeParts.${index}.supplierCategory`)}
                  />
                ))}
              </div>
            </Col>

            {newPartFor === newPartRequestForRadioOptions?.[1]?.value && (
              <>
                <Col className="w-100 d-flex justify-content-between">
                  <small>Min quantity</small>
                  <input
                    type="number"
                    className="w-75"
                    {...register(`changeParts.${index}.minQuantity`, {
                      // Editing Min re-checks the pair, which is validated on Max.
                      deps: [`changeParts.${index}.maxQuantity`],
                    })}
                  />
                </Col>
                <Col className="w-100 d-flex justify-content-between">
                  <small>Max quantity</small>
                  <input
                    type="number"
                    className={`w-75${minMaxError ? " border-danger" : ""}`}
                    {...register(`changeParts.${index}.maxQuantity`, {
                      validate: minNotAboveMax(index),
                    })}
                  />
                </Col>
                {minMaxError && (
                  <Col className="w-100 text-end">
                    <p className="text-error m-0">{minMaxError}</p>
                  </Col>
                )}
              </>
            )}

            <Col className="w-100 d-flex justify-content-between">
              <small>Quantity required</small>
              <input
                type="number"
                className="w-75"
                {...register(`changeParts.${index}.quantityRequired`, {
                  valueAsNumber: true,
                })}
              />
            </Col>

            <Col className="w-100 d-flex justify-content-between">
              <small>Approx unit price(Inr)</small>
              <input
                type="number"
                className="w-75"
                {...register(`changeParts.${index}.approxUnitPrice`, {
                  valueAsNumber: true,
                })}
              />
            </Col>

            <Col className="w-100 d-flex justify-content-between">
              <small>Normal/ Urgent part</small>
              <div className="border d-flex w-75">
                {partRequirementTypes?.map((type) => (
                  <Form.Check
                    key={type?.value}
                    type="radio"
                    className="m-1"
                    {...type}
                    {...register(`changeParts.${index}.normalOrUrgentPart`)}
                  />
                ))}
              </div>
            </Col>

            <Col className="w-100 d-flex justify-content-between pb-1">
              <small>
                Standard/
                <br />
                Manufacturing part
              </small>
              <div className="border d-flex w-75">
                {partTypes?.map((type) => (
                  <Form.Check
                    key={type?.value}
                    type="radio"
                    className="m-1"
                    {...type}
                    {...register(
                      `changeParts.${index}.standerOrManufacturingPart`,
                    )}
                  />
                ))}
              </div>
            </Col>

            {partType === partTypes?.[1]?.value && (
              <AttachmentField
                label="Drawing attach"
                index={index}
                fieldName="drawingAttach"
                control={control}
                setValue={setValue}
                isReadOnly={isReadOnly}
                onRemoveUploaded={onRemoveUploaded}
              />
            )}

            <AttachmentField
              label="Additional attachments"
              index={index}
              fieldName="additionalAttachments"
              control={control}
              setValue={setValue}
              isReadOnly={isReadOnly}
              onRemoveUploaded={onRemoveUploaded}
            />
          </Col>
        </Row>
      </div>
    );
  },
);

const PartList = ({
  register,
  control,
  watch,
  setValue,
  isReadOnly,
  /**
   * Parts can be taken off a sheet only while it is being generated. Once it is
   * saved its parts are tracked individually (approval, ordering, receipt), so
   * removing one later would orphan that history; the caller decides.
   */
  canRemoveParts = false,
  onRemoveUploaded,
  changeParts,
  sectionBudget,
  budgetStatus,
  requiredBudget,
}) => {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "changeParts",
  });

  const partQty = useWatch({
    control,
    name: "partQty",
  });

  const newPartFor = useWatch({
    control,
    name: "newPartFor",
  });

  useEffect(() => {
    if (partQty === partQtyOptions?.[0]?.value && changeParts?.length > 1) {
      replace([fields[0]]);
    }
  }, [partQty, replace, fields, changeParts]);

  return (
    <div className="mtd-parts-section">
      <div className="d-flex flex-wrap">
        {fields.map((item, index) => (
          <PartRow
            key={item._id || item.id}
            index={index}
            register={register}
            control={control}
            setValue={setValue}
            remove={remove}
            partData={changeParts?.[index]}
            newPartFor={newPartFor}
            isReadOnly={isReadOnly}
            // Any row can go, the last one included: "Add Part" comes back for
            // an empty list, and the server refuses a sheet with no parts.
            canRemove={canRemoveParts && !isReadOnly}
            onRemoveUploaded={onRemoveUploaded}
          />
        ))}
      </div>

      <Row className="m-2 p-1 border">
        {!isReadOnly &&
          ((partQty === partQtyOptions?.[0]?.value &&
            (!changeParts?.length || changeParts?.length <= 0)) ||
            partQty === partQtyOptions?.[1]?.value) && (
            <Col className="col-auto">
              <button
                type="button"
                className="bg-warning text-white border-0"
                onClick={() => append(initialState)}
              >
                Add Part
              </button>
            </Col>
          )}

        <Col className="col-auto">
          <small>Section-wise budget:</small> {sectionBudget}
        </Col>

        <Col className="col-auto">
          <small>Required budget:</small> {requiredBudget}
        </Col>

        <Col className="col-auto">
          <small>Budget:</small> {budgetStatus}
        </Col>
      </Row>
    </div>
  );
};

export default PartList;
