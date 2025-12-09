const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const userService = require("./user-service");

const app = express();
app.use(cors());
app.use(express.json());

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, (jwt_payload, done) => {
    if (jwt_payload.userName) {
      return done(null, jwt_payload);
    } else {
      return done(null, false);
    }
  })
);

app.use(passport.initialize());

function ensureAuth(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  })(req, res, next);
}

app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then(() => res.status(201).json({ message: "User created" }))
    .catch(err => res.status(422).json(err));
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then(user => {
      const payload = {
        userName: user.userName,
        email: user.email
      };
      const token = jwt.sign(payload, jwtOptions.secretOrKey, {
        expiresIn: "2h"
      });
      res.json({ message: "login successful", token: token });
    })
    .catch(err => res.status(422).json(err));
});

app.get("/api/user/favourites", ensureAuth, (req, res) => {
  userService
    .getFavourites(req.user.userName)
    .then(favs => res.json(favs))
    .catch(err => res.status(422).json(err));
});

app.put("/api/user/favourites/:id", ensureAuth, (req, res) => {
  userService
    .addFavourite(req.user.userName, req.params.id)
    .then(favs => res.json(favs))
    .catch(err => res.status(422).json(err));
});

app.delete("/api/user/favourites/:id", ensureAuth, (req, res) => {
  userService
    .removeFavourite(req.user.userName, req.params.id)
    .then(favs => res.json(favs))
    .catch(err => res.status(422).json(err));
});

app.get("/api/user/history", ensureAuth, (req, res) => {
  userService
    .getHistory(req.user.userName)
    .then(history => res.json(history))
    .catch(err => res.status(422).json(err));
});

app.post("/api/user/history", ensureAuth, (req, res) => {
  userService
    .addHistory(req.user.userName, req.body)
    .then(history => res.json(history))
    .catch(err => res.status(422).json(err));
});

app.delete("/api/user/history/:id", ensureAuth, (req, res) => {
  userService
    .removeHistory(req.user.userName, req.params.id)
    .then(history => res.json(history))
    .catch(err => res.status(422).json(err));
});

const HTTP_PORT = process.env.PORT || 8080;

userService
  .initialize(process.env.MONGODB_CONN_STRING)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch(err => {
    console.log("Unable to start server: " + err);
  });
