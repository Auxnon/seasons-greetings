const compression = require("compression");
const express = require("express");
const path = require("path");
const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = new Sequelize("sqlite::memory:");
const { v1: uuidv1, v4: uuidv4 } = require("uuid");

class User extends Model {}
User.init(
  {
    url: DataTypes.STRING,
    data: DataTypes.STRING,
  },
  { sequelize, modelName: "user" }
);

(async () => {
  await sequelize.sync();
})();

async function makePage(data, callback) {
  await sequelize.sync();
  const user = await User.create({
    url: uuidv4(),
    data,
  });
  console.log("made ", user.url);
  await user.save();
  callback(user.toJSON());
}

async function loadPage(url, callback, error) {
  User.findOne({ where: { url } }).then((user) => {
    if (user) {
      callback(user);
    } else {
      error();
    }
  });
}

const app = express();

var router = express.Router();

app.use(compression({ filter: shouldCompress }));
const port = 3000;

function shouldCompress(req, res) {
  if (req.headers["x-no-compression"]) {
    // don't compress responses with this request header
    return false;
  }

  // fallback to standard filter function
  return compression.filter(req, res);
}

router.use("/", function (req, res, next) {
  res.send("hello");
  //res.sendFile(path.join(__dirname, "/index.html"));
});

app.use(express.json());

app.post("/save", function (req, res, next) {
  console.log("save");
  console.log(req.body);

  makePage(JSON.stringify(req.body), (user) => {
    res.json({ user: user });
  });
});

app.post("/load", function (req, res, next) {
  loadPage(
    req.body.url,
    (user) => {
      res.send(user);
    },
    () => {
      res.send({ error: "doesn't exist" });
    }
  );
});

app.use("/", express.static(path.join(__dirname, "public")));
// app.get("/", function (req, res) {
//   res.sendFile(path.join(__dirname, "/index.html"));
// });

//app.use("/index.html", router);
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
