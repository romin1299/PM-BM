const cron = require('cron')
const tryCatchHandler = require('../errorHandler/tryCatchHandler')

cron.schedule('', ()=> {
    try {
        
    } catch (error) {
        console.log(error)
    }
})