const fetchFinancialYears = async () => {
    try {
        const res = await fetch("/getFinancialYears", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        const data = await res.json();
        // console.log(data);

        return data?.getFinancialYearsArray
    } catch (error) {
        console.log(error);
    }
};

export default fetchFinancialYears
