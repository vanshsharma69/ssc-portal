import React from "react";
import ReactDOM from "react-dom/client"; 
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { MembersProvider } from "./context/MembersContext";
import { EventsProvider } from "./context/EventsContext";
import { AttendanceProvider } from "./context/AttendanceContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <MembersProvider>
        <EventsProvider>
          <AttendanceProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AttendanceProvider>
        </EventsProvider>
      </MembersProvider>
    </AuthProvider>
  </React.StrictMode>
);
