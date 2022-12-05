const jwt = require('jsonwebtoken');
const User = require('../../server/model/userSchema')

// authentication functionality to verify the tokens
// also fetch the data from the database 
const authenticate = async (req, res, next) => {
    try {
        // console.log('this is authentication Page');
        const jwtToken = req.cookies.Token;
        const verifyToken = jwt.verify(jwtToken, process.env.SECRET_KEY);
        const rootUser = await User.findOne({ _id: verifyToken._id, "tokens.token": jwtToken })// fetching data from DB
        if (!rootUser) {
            throw new Error('user not found');
        }
        req.jwtToken = jwtToken;
        req.rootUser = rootUser;

        //console.log(rootUser.user_type);
        /* if(rootUser.user_type == 0){
            console.log(rootUser.user_type);
            next();
        }else{
            console.log(rootUser.user_type);
            res.status(205).send('user is not admin')
        } */
        next();
    } catch (error) {
        res.status(401).send('Unauthorized : NO token provided');
        console.log("Tokes is not provided !!!");
    }
}

module.exports = authenticate