require("dotenv").config();
const express = require("express");
const { default: mongoose } = require("mongoose");
var cors = require("cors");
const multer = require("multer");
var fs = require("fs");
var path = require("path");
require("dotenv/config");
const bodyParser = require("body-parser");
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
  mode: "no-cores",
};
const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("server is running");
});

// Set EJS as templating engine
app.set("view engine", "ejs");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage });

mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connected");
  });

let system32Router = express.Router();
app.use("/", system32Router);

system32Router
  .route("/")
  .get(getAllUsersFilesData)
  .post(upload.single("image"), saveImgToBkd, saveAllUsersFilesData)
  .delete(deleteUserData);

// system32Router
//   .route('/image')
//   .post(upload.single('image'),saveImgToBkd);

let userFileDataSchema = mongoose.Schema({
  parentName: {
    type: String,
    reuired: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileContent: {
    type: Buffer,
    contentType: String,
  },
});

let userFileData = mongoose.model("userFileData", userFileDataSchema);
async function deleteUserData(req, res) {
  await userFileData.findByIdAndDelete({
    _id: req.query._id,
  });

  let allData = await userFileData.find({
    parentName: req.query.parentName,
  });
  res.json(allData);
}

async function saveImgToBkd(req, res, next) {
  if (req.body.reqBody == undefined) {
    next();
    return;
  }
  let myOgData = JSON.parse(req.body.reqBody);

  let currFileName = myOgData.save.fileName;
  let preData = myOgData.preData;
  if (req.file !== undefined) {
    myOgData.save.fileContent = fs.readFileSync(req.file.path);
    if (req.file.size > 50000) {
      res.status(400).send({ err: true });

      return;
    }
  }

  let checkIfExist = await userFileData.find({ fileName: currFileName });
  if (checkIfExist.length == 1) {
    res.status(400).send({ err: true });
    return;
  }

  if (
    preData === Object(preData) &&
    preData.fileName != currFileName &&
    preData._id != undefined
  ) {
    await userFileData.findByIdAndUpdate(
      { _id: preData._id },
      { fileName: currFileName }
    );
  } else {
    await userFileData.create(myOgData.save);
  }

  let allData = await userFileData.find({
    parentName: myOgData.save.parentName,
  });
  res.json(allData);
}
async function saveAllUsersFilesData(req, res) {
  let currFileName = req.body.save.fileName;
  let preData = req.body.preData;
  let checkIfExist = await userFileData.find({ fileName: currFileName });
  if (checkIfExist.length == 1) {
    res.status(400).send({ err: true });
    return;
  }

  if (
    preData === Object(preData) &&
    preData.fileName != currFileName &&
    preData._id != undefined
  ) {
    await userFileData.findByIdAndUpdate(
      { _id: preData._id },
      { fileName: currFileName }
    );
  } else {
    await userFileData.create(req.body.save);
  }

  let allData = await userFileData.find({
    parentName: req.body.save.parentName,
  });

  res.json(allData);
}

function getAllUsersFilesData(req, res) {
  userFileData.find({ parentName: req.query.myCurrFolder }).then((allData) => {
    res.json(allData);
  });
}
