import React from "react";
import ReactDOM, { hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const root = document.getElementById("root") as HTMLElement;
hydrateRoot(root, <App />);
