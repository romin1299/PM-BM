/**
 * Financial years for the year dropdowns.
 *
 * Always resolves to an object with a financialYears array, never undefined.
 * Every caller destructures the result directly — `const { financialYears } =
 * await fetchFinancialYears()` — so returning undefined on a failed request threw
 * a TypeError and took the calling component down with it. A failed lookup should
 * leave the dropdown empty, not break the page.
 */
const emptyFinancialYears = () => ({ financialYears: [] });

const fetchFinancialYears = async () => {
  try {
    const res = await fetch("/getFinancialYearsDropdownValue", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    // The endpoint answers 201 on success and 4xx/5xx with a message object, so
    // a non-OK response carries no years to read.
    if (!res.ok) return emptyFinancialYears();

    const data = await res.json();

    return data?.getFinancialYearsArray ?? emptyFinancialYears();
  } catch (error) {
    console.log(error);
    return emptyFinancialYears();
  }
};

export default fetchFinancialYears;
