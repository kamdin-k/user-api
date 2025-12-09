const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let User;

module.exports.initialize = function (connectionString) {
  return new Promise((resolve, reject) => {
    const db = mongoose.createConnection(connectionString);

    db.on("error", err => {
      reject(err);
    });

    db.once("open", () => {
      User = db.model(
        "users",
        new mongoose.Schema({
          userName: {
            type: String,
            unique: true
          },
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
        })
      );
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    bcrypt
      .hash(userData.password, 10)
      .then(hash => {
        const newUser = new User({
          userName: userData.userName,
          password: hash,
          email: userData.email,
          favourites: [],
          history: []
        });
        return newUser.save();
      })
      .then(() => resolve())
      .catch(err => {
        if (err.code === 11000) {
          reject("User Name already taken");
        } else {
          reject("There was an error creating the user: " + err);
        }
      });
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then(user => {
        if (!user) {
          reject("Unable to find user: " + userData.userName);
          return;
        }

        bcrypt.compare(userData.password, user.password).then(result => {
          if (result) {
            resolve(user);
          } else {
            reject("Incorrect Password for user: " + userData.userName);
          }
        });
      })
      .catch(err => {
        reject("There was an error verifying the user: " + err);
      });
  });
};

module.exports.getFavourites = function (userName) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName })
      .then(user => {
        if (!user) {
          reject("User not found");
          return;
        }
        resolve(user.favourites || []);
      })
      .catch(err => reject("Unable to get favourites: " + err));
  });
};

module.exports.addFavourite = function (userName, workId) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName })
      .then(user => {
        if (!user) {
          reject("User not found");
          return;
        }
        if (!user.favourites.includes(workId)) {
          user.favourites.push(workId);
        }
        return user.save();
      })
      .then(user => {
        if (user) {
          resolve(user.favourites || []);
        }
      })
      .catch(err => reject("Unable to add favourite: " + err));
  });
};

module.exports.removeFavourite = function (userName, workId) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName })
      .then(user => {
        if (!user) {
          reject("User not found");
          return;
        }
        user.favourites = (user.favourites || []).filter(id => id !== workId);
        return user.save();
      })
      .then(user => {
        if (user) {
          resolve(user.favourites || []);
        }
      })
      .catch(err => reject("Unable to remove favourite: " + err));
  });
};

module.exports.getHistory = function (userName) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName })
      .then(user => {
        if (!user) {
          reject("User not found");
          return;
        }
        resolve(user.history || []);
      })
      .catch(err => reject("Unable to get history: " + err));
  });
};

module.exports.addHistory = function (userName, historyEntry) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName })
      .then(user => {
        if (!user) {
          reject("User not found");
          return;
        }
        user.history.push({
          title: historyEntry.title,
          workId: historyEntry.workId,
          date: new Date()
        });
        return user.save();
      })
      .then(user => {
        if (user) {
          resolve(user.history || []);
        }
      })
      .catch(err => reject("Unable to add history: " + err));
  });
};

module.exports.removeHistory = function (userName, id) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName })
      .then(user => {
        if (!user) {
          reject("User not found");
          return;
        }
        user.history.id(id).remove();
        return user.save();
      })
      .then(user => {
        if (user) {
          resolve(user.history || []);
        }
      })
      .catch(err => reject("Unable to remove history: " + err));
  });
};
