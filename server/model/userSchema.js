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

  toolRoomPerson: {
    type: String,
    default: "No",
  },

  plant_ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plants",
  },
  section_ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sections",
  },
  subSection_ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubSections",
  },
  cell_ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cells",
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

//Generating authenticate token
userSchema.methods.generateAuthToken = async function () {
  try {
    let jwtToken = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
    this.jwtTokens = this.jwtTokens.concat({ jwtToken: jwtToken });
    await this.save();
    return jwtToken;
  } catch (err) {
    console.log(err);
  }
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
