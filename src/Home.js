import "./App.css";
import Map from "./map/Map";
import React from "react";
import * as Locations from "./map/locations";
import { FaWindowClose } from "react-icons/fa";
import ReactMap, { FlyToInterpolator, WebMercatorViewport } from "react-map-gl";
import { NavLink } from "react-router-dom";
import { ImStatsDots } from "react-icons/im";
// import { OrthographicView } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import AUPopulationAtLocation from "./GeoFeature.json";
import { RiSettings5Fill as SettingsIcon } from "react-icons/ri";

function Home() {
  // State management for view state of the map
  const [viewState, setViewState] = React.useState({
    ...Locations.Perth,
    zoom: 9,
    pitch: 40,
    bearing: 0,
  });

  const [topdownView, setTopdownView] = React.useState(
    new WebMercatorViewport({
      ...viewState,
      pitch: 0,
      bearing: 0,
    })
  );

  const [discrepancyMode, setDiscrepancyMode] = React.useState("all");

  const [discrepancyShown, setDiscrepancyShown] = React.useState(false);

  const [showMinimap, setShowMinimap] = React.useState(true);

  const [dataDisplayMode, setDataDisplayMode] = React.useState("both");

  const hexagonLayerData = AUPopulationAtLocation;

  const totalPopulation = AUPopulationAtLocation.reduce(
    (total, current) => (total += current)
  );

  const averagePopulation = totalPopulation / AUPopulationAtLocation.length;

  const interp = new FlyToInterpolator({ speed: 0.85 });

  // area/hexagon the user clicks on the map
  const [chosenArea, setChosenArea] = React.useState({});

  // this state determines if we're showing the general stats for an area or not
  const [showAreaStats, setShowAreaStats] = React.useState(false);

  // when the user wants to move, this function will be called to update the
  // viewstate based on their input
  const handleViewStateChange = ({ viewState }) => {
    setViewState({
      ...viewState,
    });
    setTopdownView(
      new WebMercatorViewport({
        latitude: viewState.latitude,
        longitude: viewState.longitude,
        zoom: viewState.zoom - 2,
        pitch: 0,
        bearing: 0,
      })
    );
  };

  // var topdownView = new OrthographicView({
  //   id: "orthographic-view",
  //   controller: true,
  // });

  // fancy fly-to logic to enable our map to fly to a town the user's clicked
  const handleAreaClick = (area) => {
    setShowAreaStats(true);
    setChosenArea(area);
    setViewState({
      longitude: parseFloat(area._long),
      latitude: parseFloat(area.lat),
      zoom: 13,
      pitch: 40,
      bearing: viewState.bearing,
      // we want the transition duration to be inversely proportional to the
      // zoom i.e if the user's really zoomed in, we want that time to be smaller
      transitionDuration: 7500 / viewState.zoom,
      transitionInterpolator: interp,
    });
  };

  const handleMinimapSelect = (d) => {
    setShowMinimap(!showMinimap);
  };

  const handleDisplaySelect = (e) => {
    setDataDisplayMode(e.target.value);
    if (e.target.value === "diff") {
      if (!discrepancyShown) {
        setDiscrepancyShown(true);
        setDiscrepancyMode("all");
      }
    } else {
      if (discrepancyShown) {
        setDiscrepancyShown(false);
      }
    }
  };

  const handleDiscrepancySelect = (e) => {
    setDiscrepancyMode(e.target.value);
    console.log(e.target.value);
  };

  const scatterplotForm = new ScatterplotLayer({
    id: "scatterplot-layer",
    data: hexagonLayerData,
    pickable: true,
    opacity: 0.1,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 3,
    radiusMaxPixels: 5,
    lineWidthMinPixels: 1,
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    // getRadius: (d) => d.population,
    getFillColor: (d) =>
      d.demand.food.meat +
        d.demand.food.carbs +
        d.demand.food.vegetables +
        d.demand.food.fruits >=
      d.supply.food.meat +
        d.supply.food.carbs +
        d.supply.food.vegetables +
        d.supply.food.fruits
        ? [255, 0, 0]
        : [0, 255, 0],
    getLineColor: [0, 0, 0, 0],
    onClick: (d) => {
      console.log(d);
      handleAreaClick(d.object);
    },
    // d.object.points ? setChosenArea(d.object.points[0].source) : null,
  });

  const populationHeatmap = new HeatmapLayer({
    id: "population-heatmap",
    data: hexagonLayerData,
    radiusPixels: 30,
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getWeight: (d) => d.population,
    aggregation: "SUM",
    colorRange: [
      [240, 249, 232],
      [186, 228, 188],
      [123, 204, 196],
      [67, 162, 202],
      [8, 104, 172],
    ],
    // colorRange: [
    //   [247, 247, 247],
    //   [204, 204, 204],
    //   [150, 150, 150],
    //   [99, 99, 99],
    //   [37, 37, 37],
    // ],
  });

  const layers = [populationHeatmap, scatterplotForm];

  return (
    <>
      {/* we do this instead of the && syntax to enable transitions  */}
      <ul
        className={
          showAreaStats ? "general-stats-tab" : "general-stats-tab closed"
        }
      >
        <FaWindowClose
          className="close-stats-btn"
          size={40}
          onClick={() => setShowAreaStats(false)}
        />

        {Object.keys(chosenArea).map((stat) => {
          if (stat !== "supply" && stat !== "demand") {
            return (
              // logic to display all the key value pairs in the object
              <li key={stat}>{`${stat.charAt(0).toUpperCase()}${stat.slice(
                1
              )} : ${chosenArea[stat]}`}</li>
            );
          }
          return (
            <li key={stat}>{`${stat.charAt(0).toUpperCase()}${stat.slice(
              1
            )} : [Meat: ${chosenArea[stat].food.meat}\nCarbs: ${
              chosenArea[stat].food.carbs
            }\nVeg: ${chosenArea[stat].food.vegetables}\nFruits: ${
              chosenArea[stat].food.fruits
            } ]`}</li>
          );
        })}
        <li key="toStatsBtn" className="stats-tab-nav">
          <NavLink to="/statistics">
            <ImStatsDots />
            <span className="nav-label">Show area statistics</span>
          </NavLink>
        </li>
      </ul>

      <div className="settings-tab">
        <div>
          {/* <span className="settings-option-label">SETTINGS</span> */}
          <SettingsIcon className="settings-wheel" size={40} />
        </div>
        <ul>
          <li className="settings-option">
            <label>Display </label>
            <select onChange={handleDisplaySelect}>
              <option value="both">Supply + Demand</option>
              <option value="diff">Discrepancy</option>
              <option value="supply">Supply</option>
              <option value="demand">Demand</option>
            </select>
          </li>
          {discrepancyShown ? (
            <li className="settings-option sub-option">
              <label>in</label>
              <select onChange={handleDiscrepancySelect}>
                <option value="all">Supply + Demand</option>
                <option value="meat">Meat</option>
                <option value="carbs">Carbs</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
              </select>
            </li>
          ) : (
            <></>
          )}
          <li className="settings-option">
            <label>Minimap </label>
            <select onChange={handleMinimapSelect}>
              <option>Show</option>
              <option>Hide</option>
            </select>
          </li>
        </ul>
      </div>

      <div className="map-container-app">
        <Map
          width="100vw"
          height="100vh"
          //areaOnClick is the handler we pass in for when the user
          // clicks on a town/hexagon. Since we want to be able to
          // extract information from the clicked object and display it
          // on the page on top of the map, we implement the logic here
          // instead of inside the map component itself. We also don't
          // want this to be a generic function of the map but rather
          // a feature of this "Home" component
          areaOnClick={handleAreaClick}
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          displayMode={dataDisplayMode}
          discrepancyMode={discrepancyMode}
        />
        <div className={showMinimap ? "minimap" : "minimap closed"}>
          <ReactMap
            {...topdownView}
            mapboxApiAccessToken={process.env.REACT_APP_MAP_TOKEN}
            width="20vh"
            height="20vh"
            showCompass={false}
            showZoom={false}
            captureDrag={false}
          >
            <DeckGL
              viewState={topdownView}
              layers={layers}
              getTooltip={(d) =>
                d.object && {
                  html: `<h2>${d.object.suburb}</h2>`,
                  style: {
                    fontSize: "0.5rem",
                    backgroundColor: "#343332",
                    color: "#7f7f7f",
                    position: "relative",
                    zIndex: 100,
                    opacity: 0.9,
                    textAlign: "center",
                    padding: "0.2em 0.4em",
                    maxWidth: "10em",
                    minWidth: "auto",
                    borderRadius: "1em",
                  },
                }
              }
            />
          </ReactMap>
        </div>
      </div>
    </>
  );
}

export default Home;
