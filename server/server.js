const express = require('express');
const moment = require('moment');

/** Validation library */ 
const { check, validationResult } = require('express-validator'); 
/** Logging middleware */
const morgan = require('morgan'); 

const dao = require('./dao');
const rentalDao = require('./rental_dao');

/** Create application */ 
const PORT = 3001;
app = new express();

/** Set-up logging */ 
app.use(morgan('tiny'));

/** Process body content */ 
app.use(express.json());

/** Import for authentication */ 
const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const jwtSecretContent = require('./secret.js');
const jwtSecret = jwtSecretContent.jwtSecret;


/** Errors:
 * DB error
 * and Authorization error
 */ 
const dbErrorObj = { errors: [{ 'param': 'Server', 'msg': 'Database error' }] };
const authErrorObj = { errors: [{ 'param': 'Server', 'msg': 'Authorization error' }] };

const expireTime = 300; //seconds

/** Authentication endpoint */ 
app.post('/api/login', [
  check('username').isEmail(),
  check('password').isLength({min: 6})
], (req, res) => {    
    const username = req.body.username;
    const password = req.body.password;
    dao.checkUsernameAndPassword(username, password)
      .then((userObj) => {
        const token = jsonwebtoken.sign({userID: userObj.userID, userName: userObj.name}, jwtSecret, {expiresIn: expireTime});
        res.cookie('token', token, { httpOnly: true, sameSite: true, maxAge: 1000*expireTime });
        res.json(userObj);
      })
      .catch(
        // Delay response when wrong user/pass is sent to avoid fast guessing attempts
        (test) => new Promise((resolve) => {
          setTimeout(resolve, 1000)
        }).then(
             () => res.status(401).end()
        )
      );
  });
 
app.use(cookieParser());

  
app.post('/api/logout', (req, res) => {
    res.clearCookie('token').end();
});
  

/** GET /public/vehicles */
app.get('/api/public/vehicles', (req, res) => {
    dao.getVehicles(req.query.category, req.query.brand)
        .then((vehicles) => {
            res.json(vehicles);
        })
        .catch((err) => {
            res.status(500).json({
                errors: [{'msg': err}],
             });
       });
});


/** For the rest of the code, all APIs require authentication */ 
app.use(
  jwt({
    secret: jwtSecret,
    getToken: req => req.cookies.token
  })
);


/** To return a better object in case of errors */ 
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    console.log(authErrorObj);
    res.status(401).json(authErrorObj);
  }
});

/** 
 * REST API endpoints:
 * GET /user : needed to know which is the user name when the user is already authenticated 
 * and somebody reloaded the page with the browser
 */
app.get('/api/user', (req, res) => {

  /** Extract userID from JWT payload */ 
  const userID = req.user && req.user.userID;

  dao.getUser(userID)   // Only retrieve user info: jwt would stop if not authorized
  .then((userObj) => res.json(userObj))
  .catch((err) => res.status(503).json(dbErrorObj));
});


/** GET /rentals */
app.get('/api/rentals', (req, res) => {

  /** Extract userID from JWT payload */ 
  const userID = req.user && req.user.userID;

  rentalDao.getRentals(userID)
    .then((rentals) => {
      res.json(rentals);
    })
    .catch((err) => {
      res.status(500).json({
        errors: [{'msg': err}],
     });
  });
});


/** GET /vehicles/rented */
app.get('/api/vehicles/rented', (req, res) => {

  /** Extract userID from JWT payload */ 
  //const userID = req.user && req.user.userID;

  rentalDao.getRentedVehicles(req.query.category, req.query.start, req.query.end)
    .then((vehiclesRented) => {
      res.json(vehiclesRented);
    })
    .catch((err) => {
      res.status(500).json({
        errors: [{'msg': err}],
      });
    });
});


/* DELETE /rentals/<rentalId> */
app.delete('/api/rentals/:rentalId', (req,res) => {
  rentalDao.deleteRental(req.params.rentalId)
    .then((result) => res.status(204).end())
    .catch((err) => res.status(500).json({
        errors: [{'param': 'Server', 'msg': err}],
    }));
});


/** POST /rentals/payment */
app.post('/api/rentals/payment', [
  check('owner').isString(),
  check('cvv').isNumeric().isLength({min: 3, max: 3}),
  check('cardNumber').blacklist(' ').isNumeric().isLength({min: 16, max: 16}),
  check('expirationDate').isAfter(moment().format('YYYY-MM'))
  ], (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({errors: errors.array()});
    }
    res.status(200).end();
});


/** POST /rentals */
app.post('/api/rentals', [
  check('vehicleId').custom((value) => value >=1 && value <= 28),
  check('vehicleId').custom(async (value, { req }) => {
    let vehicles = await dao.getVehicles();
    let rentedVehicles = await rentalDao.getRentedVehicles(vehicles.filter(el => el.id === value).map((v) => v.category).toString(), req.body.startDate, req.body.endDate);
    let boolean = rentedVehicles.filter(el => el.vehicleId === value).length === 0 ? true : false;
    if (boolean) 
      return Promise.resolve(boolean);
    else 
      return Promise.reject();
  }),
  check('startDate').custom((value) => value >= moment().subtract(1, 'days').format('YYYYMMDD')),
  check('endDate').custom((value, { req }) => value >= req.body.startDate),
  check('price').isNumeric(),
  ], (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({errors: errors.array()});
    }
    const user = req.user && req.user.userID;
    const rental = req.body;
    rental.username = user;
    rentalDao.createRental(rental)
      .then((id) => res.status(201).json({"id" : id}))
      .catch((err) => res.status(500).json({ errors: [{ 'param': 'Server', 'msg': err }] }));
});


app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}/`));