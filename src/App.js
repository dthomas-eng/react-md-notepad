import React, { Fragment } from "react";
import "./App.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Helmet } from "react-helmet";
import TextEditor from "./components/editor/editor";

const App = () => {
  return (
      <Fragment>
        <Helmet>
          <style>
            {
              "body { background: #f06; background: linear-gradient(45deg, #fff722, #ff26f9); height: 100vh }"
            }
          </style>
        </Helmet>
        <div className='container'>
          <Router>
            <Switch>
              <Route exact path='/'>
                <div className='center-jumbotron text-center square-border black-background'>
                  <TextEditor />
                </div>
              </Route>
              <Route exact path='/other'>
                <Fragment>This is the other page.</Fragment>
              </Route>
            </Switch>
          </Router>
        </div>
      </Fragment>
  );
};

export default App;
