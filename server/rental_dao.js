'use strict'

const db = require('./db');
const Rental = require('./rental');
const moment = require('moment');


/**
 * Function to create a Rental object from a row of the rentals table
 * @param {*} row a row of the rentals table
 */
const createRental = function (row) {
    return new Rental(row.id, row.vehicleId, row.category, row.brand, 
      row.model, row.startDate, row.endDate, row.price);
}


/** Get user's rentals by joining the rental and vehicle tables  */
exports.getRentals = function(username) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT rental.id, rental.vehicleId, vehicle.category, vehicle.brand, 
                          vehicle.model, rental.startDate, rental.endDate, rental.price
                  FROM vehicle INNER JOIN rental ON vehicle.id = rental.vehicleId
                  WHERE username = ?`
      db.all(sql, [username], (err, rows) => {
        if (err) {
            console.log(err);
            reject(err);
            return;
        }
        let rentals = rows.map((row) => createRental(row));
        resolve(rentals);
        return;
        });
    });
}


/** Get rented vehicles by given category and/or start&end date */
exports.getRentedVehicles = function(category, startD, endD) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT rental.id, rental.vehicleId, vehicle.category, vehicle.brand, 
                        vehicle.model, rental.startDate, rental.endDate
                FROM vehicle INNER JOIN rental ON vehicle.id = rental.vehicleId`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        if (category && startD && endD) {
          startD = startD.split("-").join("");
          endD = endD.split("-").join("");
          rows = rows.filter((v) => v.category === category && 
                                ((startD <= v.startDate && endD >= v.startDate)
                                || (startD <= v.endDate && endD >= v.endDate)
                                || (startD >= v.startDate && endD <= v.endDate)
                                || (startD <= v.startDate && endD >= v.endDate)));
        }
        else if (category) {
          rows = rows.filter((v) => v.category === category && v.endDate >= moment().format("YYYYMMDD"));
        }
        else if (startD && endD) {
          startD = startD.split("-").join("");
          endD = endD.split("-").join("");
          rows = rows.filter((v) => ((startD <= v.startDate && endD >= v.startDate)
                                || (startD <= v.endDate && endD >= v.endDate)
                                || (startD >= v.startDate && endD <= v.endDate)
                                || (startD <= v.startDate && endD >= v.endDate)));
        }
        else {
          rows = rows.filter((v) => v.endDate >= moment().format("YYYYMMDD"));
        }
        resolve(rows);
      }
    });
  });
}


/** Delete a rental with a given id */
exports.deleteRental = function(id) {
  return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM rental WHERE id = ?';
      db.run(sql, [id], (err) => {
          if (err) {
            console.log(err);
            reject(err);
          }   
          else 
              resolve(null);
      })
  });
}


/**
 * Insert a rental in the db and returns the id of the inserted rental. 
 * To get the id, this.lastID is used. To use the "this", db.run uses "function (err)" instead of an arrow function.
 */
exports.createRental = function(rental) {
  return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO rental(vehicleId, username, startDate, endDate, price) VALUES(?,?,?,?,?)';
      db.run(sql, [rental.vehicleId, rental.username, rental.startDate, rental.endDate, rental.price], function (err) {
          if (err) {
              console.log(err);
              reject(err);
          }
          else 
              resolve(this.lastID);
      });
  });
}