import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Home from "./screens/Home";
import Stream from "./screens/Stream";
import "./styles/bootstrap-custom.scss";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/stream" exact element={<Stream />} />
      </Routes>
    </Router>
  );
};

export default App;
