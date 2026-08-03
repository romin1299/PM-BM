import React, { useState, useCallback, useRef, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";

import Loading from "../../../components/Loading/Loading";
import { axiosGetOrDelete, axiosPostOrPatch } from "../../Utils/axiosUtils";
import SparePartSearchBar from "../../Component/SparePartSearchBar";

const url = `/v1/spare/customization/customizeField`;

const filterOptions = [
  { title: "Maker", schemaKey: "maker" },
  { title: "Supplier name", schemaKey: "supplierName" },
  { title: "Unit", schemaKey: "unit" },
  { title: "Part group", schemaKey: "partGroup" },
];

const AddEditComponent = ({
  action = "Add",
  requestedFor = filterOptions[0],
  defaultValues = {},
  handleCancel = () => {},
  handleRow = () => {},
}) => {
  const { register, handleSubmit } = useForm({
    defaultValues: defaultValues,
  });

  const handleSubmitForm = async (formValue) => {
    let APIOtherValues = {
      apiType: "post",
      axiosProps: {
        params: {
          requestedFor: requestedFor?.schemaKey,
        },
      },
    };

    if (action === "Edit") {
      APIOtherValues.apiType = "patch";
      APIOtherValues.axiosProps.params._id = defaultValues?._id;
    }

    const { isError, row } = await axiosPostOrPatch({
      url,
      axiosBody: formValue,
      ...APIOtherValues,
    });

    if (!isError) {
      handleRow(row);
    }
  };

  return (
    <tr className="ar-table-thead-header4 tableRowColor">
      <td className="td-padding">
        <input
          type="text"
          style={{ width: "100%" }}
          {...register(requestedFor?.schemaKey)}
        />
      </td>
      <td className="td-padding">
        <div className="d-flex gap-2">
          <button
            className="bg-success text-white border-0"
            type="button"
            onClick={handleSubmit(handleSubmitForm)}
          >
            Submit
          </button>
          <button
            className="bg-danger text-white border-0"
            onClick={handleCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
};

const TableComponent = ({ requestedFor = filterOptions[0] }) => {
  const cursorRef = useRef(null);

  const [isAdding, setIsAdding] = useState(false);
  const [selectedValuesToEdit, setSelectedValuesToEdit] = useState(new Set());

  const [search, setSearch] = useState("");
  const handleSelectOtherFilters = (propFilter) =>
    setSearch(propFilter?.search);

  const [data, setData] = useState({
    isLoading: false,
    hasMore: true,
    tableData: [],
  });

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (data.isLoading || !data.hasMore) return;

    setData((prev) => ({ ...prev, isLoading: true }));

    const { isError, tableData, hasMore, nextCursor } = await axiosGetOrDelete({
      url,
      axiosProps: {
        params: {
          search,
          cursor: cursorRef.current,
          requestedFor: requestedFor?.schemaKey,
        },
      },
    });

    if (!isError) {
      setData((prev) => ({
        tableData: cursorRef.current
          ? [...prev.tableData, ...tableData].slice(-200)
          : tableData,
        hasMore,
        isLoading: false,
      }));

      if (hasMore) cursorRef.current = nextCursor;
    } else {
      setData((prev) => ({ ...prev, isLoading: false, hasMore: false }));
    }
  }, [data.hasMore, data.isLoading, requestedFor, search]);

  useEffect(() => {
    cursorRef.current = null;
    setData({
      isLoading: false,
      hasMore: true,
      tableData: [],
    });
    fetchData();
  }, [search]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && data?.hasMore) {
          fetchData();
        }
      },
      {
        root: containerRef.current,
      },
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [data?.hasMore, fetchData]);

  const handleCancelAdd = () => setIsAdding(false);
  const handleAddNewRow = (row) => {
    setData((prev) => ({
      ...prev,
      tableData: [...prev.tableData, row],
    }));
    handleCancelAdd();
  };

  const handleSelectToEdit = (_id, action = "add") =>
    setSelectedValuesToEdit((prev) => {
      const next = new Set(prev);
      next[action](_id);
      return next;
    });

  const handleEditExistingRow = (row) => {
    setData((prev) => ({
      ...prev,
      tableData: prev.tableData?.map((item) =>
        item?._id === row?._id ? row : item,
      ),
    }));
    handleSelectToEdit(row?._id, "delete");
  };

  return (
    <div
      style={{ maxHeight: "70vh", overflowY: "auto" }}
      className="cell"
      ref={containerRef}
    >
      <div className="d-flex align-content-center justify-content-between p-1 td-padding">
        <h5>{requestedFor?.title}</h5>
        <div className="d-flex align-content-center justify-content-center">
          <div className="d-block align-content-center justify-content-center">
            <button
              className="bg-warning text-white border-0"
              onClick={() => setIsAdding(true)}
            >
              New
            </button>
          </div>
          &nbsp;
          <SparePartSearchBar
            handleSelectOtherFilters={handleSelectOtherFilters}
          />
        </div>
      </div>
      <table className="pmSheetApprovalTableCol">
        <thead>
          <tr className="bg-button">
            <th className={"ar-table-thead-header5 td-padding text-white"}>
              {requestedFor?.title}
            </th>
            <th className={"ar-table-thead-header5 td-padding text-white"}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {data?.tableData?.map((item) =>
            selectedValuesToEdit.has(item?._id) ? (
              <AddEditComponent
                action="Edit"
                key={item?._id}
                defaultValues={item}
                handleRow={handleEditExistingRow}
                handleCancel={() => handleSelectToEdit(item?._id, "delete")}
                requestedFor={requestedFor}
              />
            ) : (
              <tr
                className="ar-table-thead-header4 tableRowColor"
                key={item?._id}
              >
                <td className="td-padding">
                  {item?.[requestedFor?.schemaKey]}
                </td>
                <td className="td-padding">
                  <button
                    className="bg-warning text-white border-0"
                    onClick={() => handleSelectToEdit(item?._id)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ),
          )}

          {isAdding && (
            <AddEditComponent
              handleRow={handleAddNewRow}
              handleCancel={handleCancelAdd}
              requestedFor={requestedFor}
            />
          )}

          <tr className="ar-table-thead-header4 tableRowColor">
            <div ref={sentinelRef} style={{ height: "10px" }} />
          </tr>
        </tbody>
      </table>
      {data?.isLoading && <Loading />}
    </div>
  );
};

const DynamicFieldsConfiguration = () => {
  return (
    <Container fluid className="p-1">
      <Row>
        <Col>
          <TableComponent />
        </Col>
        <Col>
          <TableComponent requestedFor={filterOptions[1]} />
        </Col>
      </Row>
      <Row>
        <Col>
          <TableComponent requestedFor={filterOptions[2]} />
        </Col>
        <Col>
          <TableComponent requestedFor={filterOptions[3]} />
        </Col>
      </Row>
    </Container>
  );
};

export default DynamicFieldsConfiguration;
