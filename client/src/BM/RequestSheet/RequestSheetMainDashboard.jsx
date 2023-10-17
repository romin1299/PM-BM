import React, { useEffect, useReducer } from "react";

import NewRequestSheetRegistration from "./NewRequestSheetRegistration";

const RequestSheetMainDashboard = () => {
  const initialState = {
    requestSheetData: [],
    counters: {
      open_request_sheet_count: 0,
      closed_request_sheet_count: 0,
    },
    message: "",

    isAddRequestSheet: false,
    isUpdateRequestSheet: false,
    showDeleteConfirmationModal: false,
  };

  const ACTION = {
    GET: "get-request-sheets",
    ADD: "add-row",
    UPDATE: "update-row",
    DELETE: "delete-popup",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          requestSheetData: action?.requestSheetData,
          counters: action?.counters,
          message: action?.message,
        };

      case ACTION?.ADD:
        return {
          ...state,
          isAddRequestSheet: !state?.isAddRequestSheet,
        };

      case ACTION?.DELETE:
        return {
          ...state,
          showDeleteConfirmationModal: !state?.showDeleteConfirmationModal,
        };

      case ACTION?.UPDATE:
        return {
          ...state,
          isUpdateRequestSheet: !state?.isUpdateRequestSheet,
        };

      default:
        return state;
    }
    // if (action?.type === ACTION?.GET) {
    //   return {
    //     ...state,
    //     requestSheetData: action?.requestSheetData,
    //     message: action?.message,
    //   };
    // } else if (action?.type === ACTION?.ADD) {
    //   return {
    //     ...state,
    //     isAddLocation: !state?.isAddLocation,
    //   };
    // } else if (action?.type === ACTION?.DELETE) {
    //   return {
    //     ...state,
    //     showDeleteConfirmationModal: !state?.showDeleteConfirmationModal,
    //   };
    // } else if (action?.type === ACTION?.UPDATE) {
    //   return {
    //     ...state,
    //     isUpdateLocation: !state?.isUpdateLocation,
    //   };
    // } else {
    //   return state;
    // }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getAllRequestSheetData = async () => {
    try {
      const res = await fetch(`/getRequestSheetData`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const { message, requestSheetData, counters } = await res.json();

      reducerDispatch({
        type: ACTION.GET,
        requestSheetData,
        counters,
        message,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getUserDetails = async () => {
    try {
      const res = await fetch(
        `/getUserDetails?tm_department=PRD&&user_type=TL%2FHOSS`, // %2F is for "/"
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, users } = await res.json();

      console.log(message, users);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllRequestSheetData();
    getUserDetails();
  }, []);

  return (
    <div>
      <h1>RequestSheetMainDashboard</h1>
      <NewRequestSheetRegistration />
    </div>
  );
};

export default RequestSheetMainDashboard;
