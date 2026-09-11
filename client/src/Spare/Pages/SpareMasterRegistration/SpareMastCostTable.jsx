import React from "react";

const columns = [
  { label: "Stock Qty", field: "quantity" },
  {
    label: "Currency unit",
    field: "currencyUnit",
  },
  { label: "Unit Cost", field: "cost" },
  { label: "Cost in INR", field: "costInINR" },
  { label: "Issued qty", field: "issuedQty" },
  {
    label: "Available Qty",
    field: "availableQty",
  },
  {
    label: "Over all cost in INR",
    field: "overAllCost",
  },
];

const SpareMastCostTable = ({ costDetails = [] }) => {
  return (
    <div className="spare-scroll-table">
      <table
        style={{
          width: "100%",
          // tableLayout: "fixed",
          borderCollapse: "collapse",
        }}
        className="mtd-parts-section"
      >
        <thead>
          <tr>
            {columns.map(({ label }) => (
              <td
                key={label}
                className="border p-1"
                style={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                {label}
              </td>
            ))}
          </tr>
        </thead>

        <tbody>
          {costDetails.map((item, index) => (
            <tr key={item._id ?? index}>
              {columns.map(({ field }) => (
                <td
                  key={field}
                  className="border p-1"
                  style={{ fontSize: "12px", textAlign: "center" }}
                >
                  {item[field] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SpareMastCostTable;

// import React, { useMemo, useEffect } from "react";
// import { useFieldArray } from "react-hook-form";
// import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";
// const emptySpareItem = {
//   quantity: 0,
//   currencyUnit: "",
//   cost: 0,
//   costInINR: 0,
//   issuedQty: 0,
//   availableQty: 0,
// };

// const columns = [
//   { label: "Stock Qty", field: "quantity", type: "number" },
//   {
//     label: "Currency unit",
//     field: "currencyUnit",
//     type: "text",
//     isDropdown: true,
//   },
//   { label: "Unit Cost", field: "cost", type: "number" },
//   { label: "Cost in INR", field: "costInINR", type: "number", disabled: true },
//   { label: "Issued qty", field: "issuedQty", type: "number", disabled: true },
//   {
//     label: "Available Qty",
//     field: "availableQty",
//     type: "number",
//     disabled: true,
//   },
//   {
//     label: "Over all cost in INR",
//     field: "overAllCost",
//     type: "number",
//     disabled: true,
//   },
// ];

// const CurrencyDropdown = ({
//   register,
//   field,
//   required,
//   currencyMap,
//   watch,
// }) => {
//   return (
//     <select className="w-75" {...register(field)}>
//       <option value="" disabled>
//         Please Select
//       </option>
//       {[...currencyMap.values()].map((obj) => (
//         <option key={obj._id} value={obj.currencyUnit}>
//           {obj.currencyUnit}
//         </option>
//       ))}
//     </select>
//   );
// };

// const TableRow = ({
//   register,
//   setValue,
//   watch,
//   currencyMap,
//   index,
//   isDropdown,
//   field,
//   type,
//   disabled,
// }) => {
//   const cost = watch(`costDetails.${index}.cost`);
//   const currencyUnit = watch(`costDetails.${index}.currencyUnit`);

//   useEffect(() => {
//     if (!cost || !currencyUnit) return;

//     const selectedCurrency = currencyMap.get(currencyUnit);
//     if (!selectedCurrency) return;

//     setValue(
//       `costDetails.${index}.costInINR`,
//       parseFloat((parseFloat(cost) * selectedCurrency.currencyRate).toFixed(2)),
//       { shouldDirty: true },
//     );
//   }, [cost, index, currencyUnit, currencyMap, setValue]);

//   if (isDropdown && currencyMap.size)
//     return (
//       <CurrencyDropdown
//         register={register}
//         field={`costDetails.${index}.${field}`}
//         currencyMap={currencyMap}
//         watch={watch}
//       />
//     );

//   return (
//     <td key={field} className="border p-1">
//       <input
//         type={type}
//         disabled={disabled}
//         style={{ width: "100%", fontSize: "12px" }}
//         {...register(`costDetails.${index}.${field}`)}
//       />
//     </td>
//   );
// };

// const SpareMastCostTable = ({ register, control, setValue, watch }) => {
//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: "costDetails",
//   });

//   const [{ data: currencyData }] = useSafeGetRequest({
//     url: "/v1/spare/customization/dynamicCurrencyConversion",
//     initialState: {
//       isLoading: true,
//       isError: false,
//       data: { spareCurrenciesWithUnit: [] },
//     },
//   });

//   const currencyMap = useMemo(
//     () =>
//       new Map(
//         currencyData?.spareCurrenciesWithUnit?.map((obj) => [
//           obj.currencyUnit,
//           obj,
//         ]) ?? [],
//       ),
//     [currencyData?.spareCurrenciesWithUnit],
//   );

//   return (
//     <table
//       style={{
//         width: "100%",
//         // tableLayout: "fixed",
//         borderCollapse: "collapse",
//       }}
//       className="mtd-parts-section"
//     >
//       <tr>
//         {columns.map(({ label }) => (
//           <td
//             key={label}
//             className="border p-1"
//             style={{
//               fontWeight: "bold",
//               fontSize: "12px",
//               textAlign: "center",
//             }}
//           >
//             {label}
//           </td>
//         ))}

//         <td
//           className="border p-1"
//           style={{
//             fontWeight: "bold",
//             fontSize: "12px",
//             textAlign: "center",
//             width: "70px",
//           }}
//         >
//           Action
//         </td>
//       </tr>

//       {fields?.map((item, index) => (
//         <tr key={item.id}>
//           {columns.map((eachField) => (
//             <TableRow
//               {...eachField}
//               currencyMap={currencyMap}
//               index={index}
//               register={register}
//               setValue={setValue}
//               watch={watch}
//             />
//           ))}

//           <td className="border p-1" style={{ textAlign: "center" }}>
//             <button
//               type="button"
//               className="bg-danger text-white border-0"
//               onClick={() => remove(index)}
//             >
//               Cancel
//             </button>
//           </td>
//         </tr>
//       ))}

//       <tr>
//         <td colSpan={columns.length + 1} className="border p-1">
//           <button
//             type="button"
//             className="bg-warning text-white border-0"
//             onClick={() => append(emptySpareItem)}
//           >
//             Add
//           </button>
//         </td>
//       </tr>
//     </table>
//   );
// };

// export default SpareMastCostTable;
