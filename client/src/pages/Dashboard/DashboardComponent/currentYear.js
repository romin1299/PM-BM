let currentYear =
    new Date().getMonth() < 3
        ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
        : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;


export default currentYear 
