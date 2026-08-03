import { memo } from "react";
import { Col, Row, Form } from "react-bootstrap";
import { useFieldArray, useWatch } from "react-hook-form";
import {
  newPartRequestForRadioOptions,
  partQtyOptions,
  partTypes,
  partRequirementTypes,
} from "../Utils/dropdownUtils";

const initialState = {};

const PartRow = memo(
  ({ index, register, remove, partData, newPartFor, isViewMode }) => {
    const partType = partData?.standerOrManufacturingPart;
    const drawingName = partData?.drawingAttachOriginalName;

    return (
      <div className="m-0 p-0 w-50">
        <Row className="m-0 p-1 d-flex flex-column">
          <Col className="d-flex border col-auto gap-1 m-2 mt-0 mb-0 p-2 flex-wrap align-items-center justify-content-between">
            <small>
              <b>Part Details {index + 1}</b>
            </small>
            {!isViewMode && (
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
              <small>Quantity required</small>
              <input
                type="number"
                className="w-75"
                {...register(`changeParts.${index}.quantityRequired`)}
              />
            </Col>

            {newPartFor === newPartRequestForRadioOptions?.[1]?.value && (
              <>
                <Col className="w-100 d-flex justify-content-between">
                  <small>Min quantity</small>
                  <input
                    type="number"
                    className="w-75"
                    {...register(`changeParts.${index}.minQuantity`)}
                  />
                </Col>
                <Col className="w-100 d-flex justify-content-between">
                  <small>Max quantity</small>
                  <input
                    type="number"
                    className="w-75"
                    {...register(`changeParts.${index}.maxQuantity`)}
                  />
                </Col>
              </>
            )}

            <Col className="w-100 d-flex justify-content-between">
              <small>Maker</small>
              <input
                type="text"
                className="w-75"
                {...register(`changeParts.${index}.maker`)}
              />
            </Col>

            <Col className="w-100 d-flex justify-content-between">
              <small>Supplier name</small>
              <input
                type="text"
                className="w-75"
                {...register(`changeParts.${index}.supplierName`)}
              />
            </Col>

            <Col className="w-100 d-flex justify-content-between">
              <small>Supplier category</small>
              <input
                type="text"
                className="w-75"
                {...register(`changeParts.${index}.supplierCategory`)}
              />
            </Col>

            <Col className="w-100 d-flex justify-content-between">
              <small>Approx unit price(Inr)</small>
              <input
                type="number"
                className="w-75"
                {...register(`changeParts.${index}.approxUnitPrice`)}
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

            <Col className="w-100 d-flex justify-content-between">
              <small>
                Stander/
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
              <>
                <Col className="w-100 d-flex justify-content-between pb-1">
                  <small>Drawing attach</small>
                  <input
                    type="file"
                    className="w-75"
                    {...register(`changeParts.${index}.drawingAttach`)}
                  />
                </Col>

                {drawingName && (
                  <Col className="w-100 d-flex justify-content-between pb-1">
                    <small>Previously uploaded</small>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`${process.env.REACT_APP_BASE_URL}/v1/spare/${partData?.drawingAttach}`}
                    >
                      {drawingName}
                    </a>
                  </Col>
                )}
              </>
            )}
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
  isViewMode,
  changeParts,
  sectionBudget,
  budgetStatus,
  requiredBudget,
}) => {
  const { fields, append, remove } = useFieldArray({
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

  return (
    <div className="mtd-parts-section">
      <div className="d-flex flex-wrap">
        {fields.map((item, index) => (
          <PartRow
            key={item._id}
            index={index}
            register={register}
            remove={remove}
            partData={changeParts?.[index]}
            newPartFor={newPartFor}
            isViewMode={isViewMode}
          />
        ))}
      </div>

      <Row className="m-2 p-1 border">
        {!isViewMode &&
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
