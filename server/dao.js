'use strict'

const bcrypt = require('bcrypt');
const db = require('./db');
const Vehicle = require('./vehicle');


/**
 * Function to create a Vehicle object from a row of the vehicles table
 * @param {*} row a row of the vehicles table
 */
const createVehicle = function (row) {
  return new Vehicle(row.id, row.category, row.brand, row.model, row.price);
}


/** Get vehicles and optionally filter them */
exports.getVehicles = function(filterCategory, filterBrand) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM vehicle";
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        let vehicles = rows.map((row) => createVehicle(row));
        if (filterCategory && filterBrand) {
          const filC = filterCategory.split('');
          const filB = filterBrand.split(',');
          vehicles = vehicles.filter((v) => filC.includes(v.category) && filB.includes(v.brand));
        }
        else if (filterCategory) {
          const fil = filterCategory.split('');
          vehicles = vehicles.filter((v) => fil.includes(v.category));
        }
        else if (filterBrand) {
          const fil = filterBrand.split(',');
          vehicles = vehicles.filter((v) => fil.includes(v.brand));
        }
        resolve(vehicles
          .sort((a, b) => {          
            if (a.category === b.category) {
              if (a.brand === b.brand) {
                return a.model.localeCompare(b.model);
             }
             return a.brand.localeCompare(b.brand);
            }
            return a.category.localeCompare(b.category);
          })
        );
      }
    });
  });
}


/** Check username and password of the user who wants to log in */
exports.checkUsernameAndPassword = function (username, password) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT username, password, name FROM user WHERE username = ?';
    db.all(sql, [username], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      if (rows.length === 0) {
        reject(null);
        return;
      }
      const passwordHashDb = rows[0].password;
  
      bcrypt.compare(password, passwordHashDb, function (err, res) {
        if (err)
          reject(err);
        else {
          if (res) {
            resolve({
              userID: rows[0].username,
              name: rows[0].name,
            });
            return;
          } else {
            reject(null);
            return;
          }
        }
      });
    });
  });
}
  

/** Get user information */
exports.getUser = function (userID) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT username, name FROM user WHERE username = ?';
    db.all(sql, [userID], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      if (rows.length === 0) {
        reject(null);
        return;
      }
      resolve({
        userID: rows[0].username,
        name: rows[0].name,
      });
      return;
    });
  });
}