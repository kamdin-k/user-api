const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const userService = require("./user-service");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

userService
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.json({ message: "User API running" });
});

app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then(msg => {
      res.json({ message: msg });
    })
    .catch(err => {
      res.status(422).json({ message: err });
    });
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then(user => {
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "2h"
      });
      res.json({ message: "login successful", token });
    })
    .catch(err => {
      res.status(422).json({ message: err });
    });
});

function ensureToken(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const parts = authHeader.split(" ");
  const token = parts.length === 2 ? parts[1] : null;
  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
}

app.get("/api/user/favourites", ensureToken, (req, res) => {
  userService
    .getFavourites(req.user._id)
    .then(favs => {
      res.json(favs);
    })
    .catch(err => {
      res.status(422).json({ message: err });
    });
});

app.put("/api/user/favourites/:id", ensureToken, (req, res) => {
  userService
    .addFavourite(req.user._id, req.params.id)
    .then(favs => {
      res.json(favs);
    })
    .catch(err => {
      res.status(422).json({ message: err });
    });
});

app.delete("/api/user/favourites/:id", ensureToken, (req, res) => {
  userService
    .removeFavourite(req.user._id, req.params.id)
    .then(favs => {
      res.json(favs);
    })
    .catch(err => {
      res.status(422).json({ message: err });
    });
});

app.get("/api/user/history", ensureToken, (req, res) => {
  userService
    .getHistory(req.user._id)
    .then(history => {
      res.json(history);
    })
    .catch(err => {
      res.status(422).json({ message: err });
    });
});

app.post("/api/user/history", ensureToken, (req, res) => {
  userService
    .addHistory(req.user._id, req.body)
    .then(history => {
      res.json(history);
    })
    .catch(err => {
      res.status(422).json({ message: err });
    });
});

app.delete("/api/user/history/:id", ensureToken, (req, res) => {
  userService
    .removeHistory(req.user._id, req.params.id)
    .then(history => {
      res.json(history);
    })
    .catch(err => {
      res.status(422).json({ message: err });
    });
});

module.exports = app;
