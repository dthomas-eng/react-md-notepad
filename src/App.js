import React, { Fragment } from "react";
import "./App.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Helmet } from "react-helmet";
import TextEditor from "./components/editor/editor";

const App = () => {
  return (
      <Fragment>
        <div className='container'>
          <Router>
            <Switch>
              <Route exact path='/'>
                <div className='editor__container'>
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
