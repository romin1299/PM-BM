import React, { useReducer, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Table } from "react-bootstrap";
import { Row, Col, Form, Container } from "react-bootstrap";
import { denso_logo } from "../../../modules/LoginModules";
import {
  reducer,
  initialState,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import PartList from "../../Component/PartList";
import {
  partFor,
  newPartRequestForRadioOptions,
  partQtyOptions,
} from "../../Utils/dropdownUtils";
import { axiosPostOrPatch } from "../../Utils/axiosUtils";
import NGBudgetComponent from "./NGBudgetComponent";

const sectionBudget = 2000;

const SpareNewPartRequest = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  const {
    register,
    watch,
    setValue,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {},
  });

  const changeParts = useWatch({
    control,
    name: "changeParts",
  });

  const budget = useMemo(() => {
    if (!changeParts?.length) return 0;

    const requiredBudget = changeParts.reduce((acc, curr) => {
      const qty = Number(curr?.quantityRequired || 0);
      const price = Number(curr?.approxUnitPrice || 0);
      return acc + qty * price;
    }, 0);

    return {
      budgetStatus: sectionBudget - requiredBudget >= 0 ? "OK" : "NG",
      requiredBudget,
    };
  }, [changeParts]);

  const handleNewPartRequest = async (formValue) => {
    formValue["budget"] = budget;
    formValue["selectedCell"] = reduceState?.selectedCell;
    formValue["selectedLine"] = reduceState?.selectedLine;
    formValue["selectedMachine"] = reduceState?.selectedMachine;

    const formData = new FormData();

    formData.append("data", JSON.stringify(formValue));

    let uploadFileIndexes = [];

    formValue.changeParts.forEach((row, index) => {
      if (row.drawingAttach) {
        formData.append(`drawingAttach`, row.drawingAttach?.[0]);
        uploadFileIndexes.push(index);
      }
    });

    formData.append("uploadFileIndexes", JSON.stringify(uploadFileIndexes));

    const { isError } = await axiosPostOrPatch({
      url: `/v1/spare/spareRequestSheet/register`,
      axiosBody: formData,
      axiosProps: {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    });

    if (!isError) reset();
  };

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
              <Col className="d-flex flex-column col-auto">
                <div className="d-flex">
                  {partFor?.map((item) => (
                    <>
                      &nbsp;
                      <Form.Check
                        style={{ fontSize: "14px" }}
                        type="checkbox"
                        {...item}
                        {...register("whichParts", {
                          required: "Please select part use for",
                        })}
                      />
                    </>
                  ))}
                </div>
                {errors?.["whichParts"] && (
                  <p className="text-error mb-1">
                    {errors?.["whichParts"]?.message}
                  </p>
                )}
              </Col>
              <Col className="d-flex align-items-center justify-content-center text-center col-7">
                <h4 className="m-0">Spare Part Request(Order / Stock-in)</h4>
              </Col>
              <Col className="d-flex align-items-center justify-content-end text-center col-2">
                <img
                  src={denso_logo}
                  alt=""
                  className="bg-white"
                  height={50}
                  width={150}
                />
              </Col>
            </Row>
            <Row className="border">
              <Col>
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
              </Col>
            </Row>
            <Row className="border">
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
                        required: "Please select",
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
                        required: "Please select",
                      })}
                      onClick={(e) =>
                        e.target.value === partQtyOptions?.[0]?.value &&
                        watch("changeParts")?.length > 1 &&
                        setValue("changeParts", [watch("changeParts")?.[0]])
                      }
                    />
                  ))}
                </div>
                {errors?.["partQty"] && (
                  <p className="text-error">{errors?.["partQty"]?.message}</p>
                )}
              </Col>
            </Row>
            {watch("partQty") && (
              <Row className="border">
                <PartList
                  register={register}
                  control={control}
                  watch={watch}
                  sectionBudget={sectionBudget}
                  {...budget}
                />
              </Row>
            )}

            {budget?.budgetStatus &&
              (budget?.budgetStatus === "NG" ? (
                <NGBudgetComponent register={register} errors={errors} />
              ) : (
                <Row className="border">
                  <Col className="d-flex align-items-center justify-content-between">
                    <button type="submit" className="btn bg-success">
                      Submit
                    </button>
                  </Col>
                </Row>
              ))}
          </Container>
        </Table>
      </Form>
    </div>
  );
};

export default SpareNewPartRequest;
