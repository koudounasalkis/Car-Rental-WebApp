# Car-Rental-WebApp
WebApp Project - Structure

## ***SERVER***

### ***DB Tables***

#### ***Vehicles***
    (id, maybe it could be plate)
    Category (5, (i.e, A ... E) according to size)
    Brand
    Model

#### ***Users***
    (id)
    Username (email)
    Password
    Name

#### ***Rentals***
    (id)
    userId
    vehicleId
    startDate
    endDate

### ***Files***

#### ***Db.js***
    sqlite3 + DBSource

#### ***Dao.js***
    createReservation()
    getReservations()
    getReservationById() (?)
    deleteReservation()
    getVehicles() [accepts filter as a parameter so as it returns eventually filtered vehicles]
    getVehicleById() (?)
    getUser()
    checkUsernameAndPassword()

#### ***Server.js***
    POST /api/login
    POST /api/logout
    GET /api/user
    GET /api/vehicles
    GET /api/vehicles/:vechicleID
    GET /api/reservations
    GET /api/reservations/:reservationsID 
    POST /api/reservations
    DELETE /api/reservations/:reservationsID


## ***CLIENT***

### ***Login page*** (***Instagram-like***)
***/login***

    App Logo
        - User_Photo
        - Continue as User_Name (Link to *Interactive Page*)
        - Change account (If clicked, replace this with the Login form with username and password)
    Copyrights ecc

### ***Home Page (Non-authenticated user)*** 
***/home***

***Components***

    Navbar:
        - Toggle collapse (sx)
        - App name and Logo (sx)
        - Search button (center)
        - Icon and DropDown menu "Logged Out" (dx):
            - Login link to the /login page
    
    Sidebar with filters (checkbox feasible? How to select more than one filter per time?):
        - Car brand (dynamically obtained by the list of vehicles)
        - Car model (dynamically obtained by the list of vehicles) 

    Main view 
        - List of vehicles (eventually filtered)


### ***Home Page (Interactive configuration page for authenticated users)*** 
***/user/home***

    Navbar:
        - Toggle collapse (sx)
        - App name and Logo (sx)
        - Search button (center)
        - Icon and DropDown menu "Logged In" (dx): 
            - Profile link to the /reservation page
            - Logout link that redirects to the /login page

    Sidebar with (for each row):
        - Name of the filter
        - Dropdown menu with default values, Input Text or Checkbox for each filter
        - Button to submit the choice and render the main view
        Params:
            * Start Date [ input to type, maybe DateFormat in order to let the user select the date ]
            * End Date [ same as above]
            * Vehicle category [ Dropdown menu: A ... E ]
            * Driver age [ Dropdown menu: < 25, >= 25 && <= 65, >65 ]
            * Number of additional drivers [ input to type ]
            * Estimation of km of the trip [ Dropdown menu: < 50km/day, >= 50km/giorno && < 150km/day, illimited ]
            * Extra insurance request [ Y/N, maybe checkbox ]
        - At the end, a button to accept the offer (opens a form with 2 fields, the credit card to insert and the money to pay; after the submit of the (fake) payment, a popup (alert-success) appears to say everything's gone smoothly)
    
    Main view 
        - Number of available vehicles satisfying all criteria
        - List of vehicles (eventually filtered)
        - Rental price (calculted "locally", not stored in a table and taken from the server)


### ***Reservation Page (Interactive configuration page for authenticated users)*** 
***/user/reservation***

    Navbar:
        - Toggle collapse (sx)
        - App name and Logo (sx)
        - Search button (center)
        - Icon and DropDown menu "Your Profile" (dx):
            - Home link to the /user/home page 
            - Logout link that redirects to the /login page
            
    Sidebar with:
        - Future Rentals 
        - Past Rentals

    Main view 
        - List of Rentals (if future rentals, also delete icon for possibly deleting them; clicking this delete icon will open a popup (alert-danger) asking if the user is sure to cancel the reservation, with two buttons, yes and no: no will close the popup/form, yes will open an alert (alert-success) and tell that the user will be refunded as soon as possible)
