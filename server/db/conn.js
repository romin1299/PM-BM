const mongoose = require('mongoose')
const DB = process.env.DATABASE;

//connection with database
mongoose.connect(DB).then(() => {
    console.log("connection successful Mongodb")
}).catch((error) => {
    console.log("No connection")
})
