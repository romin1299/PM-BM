const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//Create user schema for storing the data of Users
const userSchema = new mongoose.Schema({
  tm_no: {
    type: Number,
    unique: true,
  },
  user_type: {
    type: String,
  },
  tm_grade: {
    type: String,
  },
  tm_department: {
    type: String,
  },
  tm_name: {
    type: String,
    min: 3,
    max: 20,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  // operator_password: {
  //     type: String
  // },
  joining_date: {
    type: String,
  },
  contact_no: {
    type: String,
  },
  address: {
    type: String,
  },
  photo: {
    type: String,
  },
  //this token for Email validation and expire token
  token: {
    type: String,
  },
  expireToken: {
    type: Date,
  },
  //this is for generating jwt token
  jwtTokens: [
    {
      jwtToken: {
        type: String,
        // required: true
      },
    },
  ],
  plant_data: {
    type: String,
  },
  section_data: {
    type: String,
  },
  subSection_data: {
    type: [String],
  },
  cell_data: {
    type: [String],
  },

  isAuthorizedUserForUpdatingRequestSheetInAnyStatus: {
    type: String,
    default: "No",
  },

  /**
   * Dedicated tool-room staff: the Spare module and nothing else. Declared
   * once - it used to appear twice in this schema, and mongoose silently kept
   * the second copy.
   */
  toolRoomPerson: {
    type: String,
    default: "No",
  },

  /**
   * A PM user who ALSO works in the tool room - the section's HOD who is also
   * the tool room's HOD, for instance. They keep every PM tab and their own
   * section, and gain the tool-room rights inside Spare.
   *
   * Kept separate from toolRoomPerson rather than folded into it as a third
   * value, because that flag is read in about twenty places to mean "Spare
   * only"; a new value would have changed all of them at once.
   * See utils/userScope.js.
   */
  alsoToolRoomPerson: {
    type: String,
    default: "No",
  },

  plant: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plants",
    },
    plant_name: {
      type: String,
    },
  },
  section: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sections",
    },
    section_name: {
      type: String,
    },
    dashboardLevel: {
      type: String,
    },
  },
  subSection: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubSections",
      },
      subSection_name: {
        type: String,
      },
    },
  ],
  cell: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cells",
      },
      cell_name: {
        type: String,
      },
    },
  ],
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

//Generating authenticate token
/**
 * Throws rather than returning nothing when signing fails.
 *
 * It used to log and fall off the end, handing back `undefined`. The caller
 * put that straight into `res.cookie`, which stringifies it, so the browser
 * was given the literal text `Token=undefined` while being told the login had
 * succeeded. Every later request then failed `jwt.verify` with "jwt malformed"
 * for the 12 hours the cookie lived. A login that cannot mint a token has to
 * fail as a login.
 */
userSchema.methods.generateAuthToken = async function () {
  let jwtToken = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
  this.jwtTokens = this.jwtTokens.concat({ jwtToken: jwtToken });
  await this.save();
  return jwtToken;
};

//Here crete User collection for storing documents.
const User = new mongoose.model("Users", userSchema);

// Create or Add documents in user collection
// const createDocuments = async () => {
//     try {
//         const docs = new User({ tm_no: 12345, user_type: "Admin", tm_name: "Denso Admin1", email: "densoadmin1@gmail.com", password: "Test@111" });

//         const result = await docs.save();
//         //console.log(result);
//     } catch (error) {
//         console.log(error);
//     }

// }
// createDocuments();

module.exports = User;
