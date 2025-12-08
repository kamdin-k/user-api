const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const userService = require("./user-service.js");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "User API running" });
});

app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((err) => {
      res.status(422).json({ message: err });
    });
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      const payload = { _id: user._id, userName: user.userName };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ message: "login successful", token });
    })
    .catch((err) => {
      res.status(422).json({ message: err });
    });
});

function ensureToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(403).json({ message: "No token provided" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "JWT") {
    return res.status(403).json({ message: "Malformed token" });
  }

  const token = parts[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
}

app.get("/api/user/favourites", ensureToken, (req, res) => {
  userService
    .getFavourites(req.user._id)
    .then((favs) => {
      res.json(favs);
    })
    .catch((err) => {
      res.status(422).json({ message: err });
    });
});

app.put("/api/user/favourites/:id", ensureToken, (req, res) => {
  userService
    .addFavourite(req.user._id, req.params.id)
    .then((favs) => {
      res.json(favs);
    })
    .catch((err) => {
      res.status(422).json({ message: err });
    });
});

app.delete("/api/user/favourites/:id", ensureToken, (req, res) => {
  userService
    .removeFavourite(req.user._id, req.params.id)
    .then((favs) => {
      res.json(favs);
    })
    .catch((err) => {
      res.status(422).json({ message: err });
    });
});

userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
