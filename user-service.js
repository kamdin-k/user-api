const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let User;

function initUserModel() {
  if (User) return;
  const userSchema = new mongoose.Schema({
    userName: { type: String, unique: true },
    password: String,
    email: String,
    favourites: [String],
    history: [
      {
        title: String,
        workId: String,
        date: Date
      }
    ]
  });
  User = mongoose.model("users", userSchema);
}

module.exports.connect = function () {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(process.env.MONGO_URL)
      .then(() => {
        initUserModel();
        resolve();
      })
      .catch(err => {
        reject("Unable to connect to MongoDB: " + err);
      });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (!userData.userName || !userData.password || !userData.password2) {
      return reject("All fields are required");
    }
    if (userData.password !== userData.password2) {
      return reject("Passwords do not match");
    }
    bcrypt
      .hash(userData.password, 10)
      .then(hash => {
        initUserModel();
        const newUser = new User({
          userName: userData.userName,
          password: hash,
          email: userData.email || "",
          favourites: [],
          history: []
        });
        newUser
          .save()
          .then(() => {
            resolve("User created");
          })
          .catch(err => {
            if (err.code === 11000) {
              reject("User name already taken");
            } else {
              reject("There was an error creating the user: " + err);
            }
          });
      })
      .catch(() => {
        reject("There was an error encrypting the password");
      });
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (!userData.userName || !userData.password) {
      return reject("User name and password are required");
    }
    initUserModel();
    User.findOne({ userName: userData.userName })
      .then(user => {
        if (!user) {
          return reject("Unable to find user: " + userData.userName);
        }
        bcrypt.compare(userData.password, user.password).then(isMatch => {
          if (!isMatch) {
            reject("Incorrect password for user: " + userData.userName);
          } else {
            resolve({
              _id: user._id.toString(),
              userName: user.userName,
              email: user.email || ""
            });
          }
        });
      })
      .catch(err => {
        reject("There was an error verifying the user: " + err);
      });
  });
};

module.exports.getFavourites = function (userId) {
  return new Promise((resolve, reject) => {
    initUserModel();
    User.findById(userId)
      .then(user => {
        if (!user) {
          return reject("User not found");
        }
        resolve(user.favourites || []);
      })
      .catch(err => {
        reject("There was an error getting favourites: " + err);
      });
  });
};

module.exports.addFavourite = function (userId, workId) {
  return new Promise((resolve, reject) => {
    initUserModel();
    User.findById(userId)
      .then(user => {
        if (!user) {
          return reject("User not found");
        }
        if (!user.favourites.includes(workId)) {
          user.favourites.push(workId);
        }
        user
          .save()
          .then(() => resolve(user.favourites || []))
          .catch(err =>
            reject("There was an error adding favourite: " + err)
          );
      })
      .catch(err =>
        reject("There was an error adding favourite: " + err)
      );
  });
};

module.exports.removeFavourite = function (userId, workId) {
  return new Promise((resolve, reject) => {
    initUserModel();
    User.findById(userId)
      .then(user => {
        if (!user) {
          return reject("User not found");
        }
        user.favourites = (user.favourites || []).filter(id => id !== workId);
        user
          .save()
          .then(() => resolve(user.favourites || []))
          .catch(err =>
            reject("There was an error removing favourite: " + err)
          );
      })
      .catch(err =>
        reject("There was an error removing favourite: " + err)
      );
  });
};

module.exports.getHistory = function (userId) {
  return new Promise((resolve, reject) => {
    initUserModel();
    User.findById(userId)
      .then(user => {
        if (!user) {
          return reject("User not found");
        }
        resolve(user.history || []);
      })
      .catch(err => {
        reject("There was an error getting history: " + err);
      });
  });
};

module.exports.addHistory = function (userId, historyEntry) {
  return new Promise((resolve, reject) => {
    initUserModel();
    User.findById(userId)
      .then(user => {
        if (!user) {
          return reject("User not found");
        }
        user.history.push({
          title: historyEntry.title,
          workId: historyEntry.workId,
          date: new Date()
        });
        user
          .save()
          .then(() => resolve(user.history || []))
          .catch(err =>
            reject("There was an error adding history: " + err)
          );
      })
      .catch(err =>
        reject("There was an error adding history: " + err)
      );
  });
};

module.exports.removeHistory = function (userId, id) {
  return new Promise((resolve, reject) => {
    initUserModel();
    User.findById(userId)
      .then(user => {
        if (!user) {
          return reject("User not found");
        }
        const entry = user.history.id(id);
        if (entry) {
          entry.remove();
        }
        user
          .save()
          .then(() => resolve(user.history || []))
          .catch(err =>
            reject("There was an error removing history: " + err)
          );
      })
      .catch(err =>
        reject("There was an error removing history: " + err)
      );
  });
};
