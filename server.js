const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const jwt = require("jsonwebtoken");

dotenv.config();

const userService = require("./user-service.js");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const JwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("JWT"),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, (jwt_payload, done) => {
    return done(null, jwt_payload);
  })
);

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.json({ message: "User API running" });
});

app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      const text =
        typeof msg === "string"
          ? msg
          : msg && msg.message
          ? msg.message
          : "Registration successful";
      res.json({ message: text });
    })
    .catch((err) => {
      const text =
        typeof err === "string"
          ? err
          : err && err.message
          ? err.message
          : "Registration failed";
      res.status(422).json({ message: text });
    });
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      const payload = {
        _id: user._id,
        userName: user.userName,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ message: "login successful", token });
    })
    .catch((err) => {
      const text =
        typeof err === "string"
          ? err
          : err && err.message
          ? err.message
          : "Login failed";
      res.status(422).json({ message: text });
    });
});

app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        const text =
          typeof err === "string"
            ? err
            : err && err.message
            ? err.message
            : "Unable to get favourites";
        res.status(422).json({ message: text });
      });
  }
);

app.put(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .addFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        const text =
          typeof err === "string"
            ? err
            : err && err.message
            ? err.message
            : "Unable to add favourite";
        res.status(422).json({ message: text });
      });
  }
);

app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .removeFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        const text =
          typeof err === "string"
            ? err
            : err && err.message
            ? err.message
            : "Unable to remove favourite";
        res.status(422).json({ message: text });
      });
  }
);

if (!process.env.VERCEL) {
  userService
    .connect()
    .then(() => {
      app.listen(HTTP_PORT, () => {
        console.log("API listening on: " + HTTP_PORT);
      });
    })
    .catch((err) => {
      console.log("unable to start the server: " + err);
      process.exit();
    });
} else {
  userService
    .connect()
    .then(() => {
      console.log("Connected to MongoDB (Vercel)");
    })
    .catch((err) => {
      console.log("Mongo connect error on Vercel:", err);
    });
}

module.exports = app;
