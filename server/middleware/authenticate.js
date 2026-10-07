const jwt = require("jsonwebtoken");
const User = require("../../server/model/userSchema");
const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

/**
 * Is this the token's fault, or the server's?
 *
 * Only the token's own failures justify throwing the session away. Every
 * jsonwebtoken failure qualifies — malformed, bad signature, expired, all of
 * which inherit JsonWebTokenError — as does a token that names a user who no
 * longer exists.
 *
 * A database that is unreachable does not. Mongoose queues queries while it is
 * disconnected and gives up with "Operation `users.findOne()` buffering timed
 * out after 10000ms", which arrives here looking like any other error. Treating
 * that as a bad token would sign every user on the shop floor out over a
 * ten-second blip, and they would all be at the login page needlessly.
 */
const isTokenProblem = (error) =>
  error instanceof jwt.JsonWebTokenError || error?.message === "user not found";

/**
 * Drops the Token cookie the browser is holding.
 *
 * A token that cannot be verified is never going to start working, and this
 * cookie lives for 12 hours. Leaving it in place is what turns a short
 * misconfiguration into a long outage: the browser keeps sending the same bad
 * value, the front-end only logs the 401 instead of returning the user to the
 * login page, and that machine stays dead until someone clears its site data
 * by hand. Clearing it makes the next page load a logged-out one, which the
 * user can act on.
 *
 * The attributes must match the ones /signIn set, or the browser keeps its copy.
 */
const dropToken = (res) => res.clearCookie("Token", { httpOnly: true });

// authentication functionality to verify the tokens
// also fetch the data from the database
const authenticate = async (req, res, next) => {
  try {
    // console.log('this is authentication Page');
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

    if (isTokenProblem(error)) {
      dropToken(res);
      return res.status(401).send("Unauthorized : NO token provided");
    }

    // The session is fine; the server could not answer. Say so, and leave the
    // cookie alone so everyone is still logged in once the database is back.
    res
      .status(503)
      .send("Service unavailable : please retry in a moment (server/database)");
    console.log("Tokes is not provided !!!");
  }
};

module.exports = authenticate;
