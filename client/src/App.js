import React from 'react';
import './App.css';

// Import js files
import Login from "./Components/Login";
import API from './Api/API'
import Configurator from './Components/Configurator'
import Filters from './Components/Filters';
import NavBar from './Components/NavBar';
import ReservationFilters from './Components/ReservationFilters';
import VehiclesList from './Components/VehiclesList';

// Import bootstrap-react
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import Row from 'react-bootstrap/Row';

// Import react-router-dom
import { BrowserRouter as Router, Route, Switch, Redirect, } from 'react-router-dom';


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      vehicles: [],
      brands: [],
      filter: {
        brands: [],
        categories: []
      },
      rentals: [],
      openSidebar: false,  
      modalOpen: false,
      formView: false,   // LoginForm
      isLoggedIn: false, // User is authenticated
      errorMsg: '',      // Error message received by an API call
      loginError: false, // Need to display that login action failed
      user: '',          // Name of user to display when authenticated
    };
  }


  componentDidMount() {
    if (!this.state.isLoggedIn) {
      API.getUserInfo()
        .then((userInfo) => {
          this.setState({ isLoggedIn: true, user: userInfo.name }, () => this.loadInitialData());
        })
        .catch((errorObj) => {
          if (errorObj.status && errorObj.status === 401) {
            // isLoggedIn false redirects to /login
            this.setState({ isLoggedIn: false, loginError: false, errorMsg: '' }, () => this.loadInitialData());
          }
        })
    }
  }


  loadInitialData() {
    API.getVehicles()
      .then((vehicles) => this.setState({ 
                                          vehicles: vehicles.sort((a,b) => a.category.localeCompare(b.category)), 
                                          brands: [...new Set(vehicles.map((v) => v.brand).sort((a, b) => a.localeCompare(b)))] //remove duplicates for brands and sort
                                        })) 
      .catch((errorObj) => this.handleErrors(errorObj));

    if (this.state.user !== '') {
      API.getRentals()
      .then((rentals) => {
        this.setState({ rentals: rentals });
      })
      .catch((errorObj) => this.handleErrors(errorObj));
    }
  }


  handleErrors = (errorObj) => {
    if (errorObj) {
      if (errorObj.status && errorObj.status === 401) {
        // isLoggedIn false redirects to /login
        setTimeout(() => { this.setState({ isLoggedIn: false, loginError: false, errorMsg: '' }) }, 2000);
      }
      const err0 = errorObj.errors[0];
      const errorString = err0.param + ': ' + err0.msg;
      this.setState({ errorMsg: errorString });
    }
  }


  cancelErrorMsg = () => {
    this.setState({ errorMsg: '' });
  }


  setLoggedInUser = (name) => {
    this.setState({ isLoggedIn: true, user: name });
    this.loadInitialData();
  }


  userLogout = () => {
    API.userLogout()
      .then(() => { this.setState({ isLoggedIn: false, user: '' }) });
  }


  showSidebar = () => {
    this.setState((state) => ({ openSidebar: !state.openSidebar }));
  }


  /** This method creates a copy of the filter state, in order to add an object if it isn't already present or remove it if it is already present */
  updateFilter = (filter, type) => {
    let filterCopy = this.state.filter;
    if (filterCopy[type].includes(filter)) {
      filterCopy[type].splice(filterCopy[type].indexOf(filter), 1);
    } 
    else {
      filterCopy[type].push(filter);
    }
    this.filterVehicles(filterCopy);
  }


  filterVehicles = (filter) => {
    API.getVehicles(filter)
      .then((vehicles) => {
        this.setState({ vehicles: vehicles, 
          filter: filter });
      })
      .catch((errorObj) => {
        this.handleErrors(errorObj);
      });
  }


  checkPaymentAddRental = (payment, rental) => {
    API.checkPayment(payment)
    .then(() => {
      API.addRental(rental)
      .then(() => {
        //get the updated list of rentals from the server
        API.getRentals().then((rentals) => this.setState({ rentals: rentals }));
      })
      .catch((errorObj) => this.handleErrors(errorObj));  
    })
    .catch((errorObj) => this.handleErrors(errorObj)); 
  }


  deleteRental = (rental) => {
    API.deleteRental(rental.id)
        .then(() => { API.getRentals().then((rentals) => this.setState({ rentals: rentals }))})
        .catch((errorObj) => this.handleErrors(errorObj));
  }
  

  render() {
    return (
      <>
        <Router>
          <Container style={{backgroundImage: 'url(/svg/background.svg)'}} fluid>

            <Switch>

              <Route path="/login" render={(props) => {
                return (
                  <Row className="vheight-100">
                    <Col sm={4}></Col>
                    <Col sm={4} className="below-nav">
                      <Login setLoggedInUser={this.setLoggedInUser} />
                    </Col>
                  </Row>
                );
              }} />

              <Route path='/user' render={(props) => {
                // Logged in if it is already so in this.state, or it just became so from the origin link
                let isLoggedIn = this.state.isLoggedIn;
                if (props.location.state && props.location.state.isLoggedIn)
                  isLoggedIn = props.location.state.isLoggedIn;

                if (isLoggedIn) {
                  return (<>
                    <NavBar showSidebar={this.showSidebar}
                      user={this.state.user}
                      isLoggedIn={this.state.isLoggedIn}
                      userLogout={this.userLogout} />

                      <Row className="vheight-100">

                        <Switch>
                          <Route path="/user/profile" render={(props) => {
                            return ( 
                              <ReservationFilters rentals={this.state.rentals} deleteRental={this.deleteRental} 
                                errorMsg={this.state.errorMsg} cancelErrorMsg={this.cancelErrorMsg}/> 
                            );
                          }} />

                          <Route path="/user/rental" render={(props) => {
                            return (
                              <Configurator inCollapse={this.state.openSidebar} rentals={this.state.rentals} errorMsg={this.state.errorMsg}
                                handleErrors={this.handleErrors}  cancelErrorMsg={this.cancelErrorMsg} checkPaymentAddRental={this.checkPaymentAddRental}/>
                            );
                          }} />

                        </Switch>
                      </Row>
                    </>
                  );
                }
                else
                    return <Redirect to='/login'/> ;
                }} >
              </Route>


              <Route path="/public/vehicles">
                <NavBar showSidebar={this.showSidebar}
                  user={this.state.user}
                  isLoggedIn={this.state.isLoggedIn}
                  userLogout={this.userLogout} />
                <Row className="vheight-100">
                {this.state.openSidebar && 
                  <Collapse in={this.state.openSidebar}>
                    <Col sm={4} bg="light" id="left-sidebar" className="collapse d-sm-block bg-dark below-nav">
                      <Filters brands={this.state.brands} onFilter={this.updateFilter} activeFilter={this.state.filter} />
                    </Col>
                  </Collapse>}
                  <Col sm={this.state.openSidebar ? 8 : 10} className="below-nav mx-auto">
                    {this.state.vehicles.length === 0 
                    ? <Alert variant='danger' className="ml-1 mt-4 font-weight-bold"><h2>Ops...</h2><h3>No vehicles matching these filters!</h3></Alert>
                    : <h2 className="text-info ml-1 mt-4"> Give a look at CAR RENTAL offers: </h2>}
                    <VehiclesList vehicles={this.state.vehicles.filter((li, idx, self) => self.map(itm => itm.brand+itm.model).indexOf(li.brand+li.model) === idx)} />
                  </Col>
                </Row>
              </Route>

              <Route>
                <Redirect to='/public/vehicles' />
              </Route>

            </Switch>

          </Container>
        </Router>
      </>
    );
  }
}


export default App;
