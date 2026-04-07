const jwt = require("jsonwebtoken");
const User = require("../../server/model/userSchema");
const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

// authentication functionality to verify the tokens
// also fetch the data from the database
const authenticate = async (req, res, next) => {
  try {
    // console.log('this is authentication Page');

    // await User.updateMany(
    //   {},
    //   {
    //     $set: {
    //       password: `$2a$12$AzIjYPBD6mAgxnUPXkOYi.goO7bX/oj9CRXYOWAf28iL7BmW2hide`,
    //     },
    //   },
    // );

    // console.log("completed");

    const jwtToken = req?.cookies?.Token;
    if (!jwtToken)
      return res.status(400).send("Unauthorized : You are not logged-in");

    const verifyToken = jwt.verify(jwtToken, process.env.SECRET_KEY);
    const rootUser = await User.findOne({
      _id: verifyToken._id,
      "tokens.token": jwtToken,
    }); // fetching data from DB
    if (!rootUser) {
      throw new Error("user not found");
    }
    req.jwtToken = jwtToken;
    req.rootUser = rootUser;

    /* if(rootUser.user_type == 0){
            console.log(rootUser.user_type);
            next();
        }else{
            console.log(rootUser.user_type);
            res.status(205).send('user is not admin')
        } */
    next();
  } catch (error) {
    console.log(error);
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(401).send("Unauthorized : NO token provided");
    console.log("Tokes is not provided !!!");
  }
};

module.exports = authenticate;
