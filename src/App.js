import "./App.css";
import React from "react";
import { options as SidebarOptions } from "./SidebarOptions";
import { Route, NavLink, BrowserRouter } from "react-router-dom";
import StatisticsPage from "./statistics/Statistics";
import Home from "./Home";
import ComparePage from "./compare/ComparePage";

const SettingsContext = React.createContext({
  year: 2015,
  elevationScale: 0.5,
  radius: 200,
  displayMode: "both",
  discrepancyMode: "all",
});

function App() {
  const [navbarOptions, setNavbarOptions] = React.useState([]);

  React.useEffect(() => {
    setNavbarOptions(SidebarOptions);
  }, []);

  return (
    <>
      {/* Browser Routers gonna be our main method for nagivation betweeen 
    components of our spa */}
      <SettingsContext.Provider value={SettingsContext.Provider}>
        <BrowserRouter>
          <div className="nav-sidebar">
            <ul className="nav-sidebar-list">
              {navbarOptions.map((option) => {
                return (
                  <li
                    className="menu-toggle menu-option-container"
                    key={option.id}
                  >
                    {/* our nav links consists of an icon and some text describing the 
                  action which can be hidden if the nav bar is not hovered through
                  some css transition and on hover pseudo element */}
                    <NavLink to={option.path} className="menu-option">
                      {option.icon}
                      <span className="menu-option-label">
                        {option.label.toUpperCase()}
                      </span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
          <Route exact path="/" component={Home} />
          <Route path="/statistics" component={StatisticsPage} />
          <Route path="/compare" component={ComparePage} />
        </BrowserRouter>
      </SettingsContext.Provider>
    </>
  );
}

export default App;

export const ICON_SIZE = 40;
