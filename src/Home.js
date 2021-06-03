import "./App.css";
import Map from "./map/Map";
import React from "react";
import * as Locations from "./map/locations";
import { FaWindowClose } from "react-icons/fa";
import ReactMap, { FlyToInterpolator, WebMercatorViewport } from "react-map-gl";
import { NavLink } from "react-router-dom";
import { ImStatsDots } from "react-icons/im";
import DeckGL from "@deck.gl/react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import WAPopulationAtLocation from "./GeoFeature.json";
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

  const [timeStep, setTimeStep] = React.useState(0);

  const [colScale, setColScale] = React.useState(0.5);

  const [radius, setRadius] = React.useState(200);

  const hexagonLayerData = WAPopulationAtLocation;

  // const totalPopulation = WAPopulationAtLocation.reduce(
  //   (total, current) => (total += current)
  // );

  // const averagePopulation = totalPopulation / WAPopulationAtLocation.length;

  const interp = new FlyToInterpolator({ speed: 0.85 });

  const latestYear = new Date().getFullYear();

  const earliestYear = latestYear - (hexagonLayerData[0].simulation.length - 1);

  const yearValueRef = React.useRef();

  const sliderRef = React.useRef();

  const scaleValueRef = React.useRef();

  const scaleSliderRef = React.useRef();

  const radiusValueRef = React.useRef();

  const radiusSliderRef = React.useRef();

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
    setViewState((prevViewState) => ({
      longitude: parseFloat(area.longitude),
      latitude: parseFloat(area.latitude),
      zoom: 13,
      pitch: 40,
      bearing: prevViewState.bearing,
      // we want the transition duration to be inversely proportional to the
      // zoom i.e if the user's really zoomed in, we want that time to be smaller
      transitionDuration: 7500 / prevViewState.zoom,
      transitionInterpolator: interp,
    }));
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
  };

  const handleYearChange = (e) => {
    const currentTimestep = parseInt(e.target.value) - earliestYear;
    yearValueRef.current.innerHTML = e.target.value;
    setTimeStep(currentTimestep);
  };

  const handleScaleChange = (e) => {
    scaleValueRef.current.innerHTML = e.target.value;
    setColScale(parseFloat(e.target.value));
  };

  const handleRadiusChange = (e) => {
    radiusValueRef.current.innerHTML = e.target.value;
    setRadius(parseInt(e.target.value));
  };

  const scatterplotForm = new ScatterplotLayer({
    id: "scatterplot-layer-" + timeStep,
    data: hexagonLayerData,
    pickable: true,
    opacity: 0.2,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 3,
    radiusMaxPixels: 5,
    lineWidthMinPixels: 1,
    getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
    getFillColor: (d) => {
      if (timeStep < 0) {
        return Object.keys(d.demand).reduce(
          (total, current) => (total += d.demand[current]),
          0
        ) -
          Object.keys(d.supply).reduce(
            (total, current) => (total += d.supply[current]),
            0
          ) >
          0
          ? [255, 0, 71]
          : [0, 255, 0];
      }
      return Object.keys(d.simulation[timeStep].demand).reduce(
        (total, current) => (total += d.simulation[timeStep].demand[current]),
        0
      ) -
        Object.keys(d.simulation[timeStep].supply).reduce(
          (total, current) => (total += d.simulation[timeStep].supply[current]),
          0
        ) >
        0
        ? [255, 0, 71]
        : [0, 255, 0];
    },
    onClick: (d) => {
      handleAreaClick(d.object);
    },
    // d.object.points ? setChosenArea(d.object.points[0].source) : null,
  });

  const populationHeatmap = new HeatmapLayer({
    id: "population-heatmap-",
    data: hexagonLayerData,
    pickable: false,
    opacity: 0.8,
    radiusPixels: 40,
    getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
    getWeight: (d) =>
      timeStep < 0 ? d.population : d.simulation[timeStep].population,
    aggregation: "SUM",
    colorRange: [
      // [240, 249, 232],
      // [186, 228, 188],
      // [123, 204, 196],
      // [67, 162, 202],
      // [8, 104, 172],
      [242, 240, 247, 100],
      [218, 218, 235, 125],
      [188, 189, 220, 150],
      [158, 154, 200, 175],
      [117, 107, 177, 200],
      [84, 39, 143],
    ],
  });

  const layers = [populationHeatmap, scatterplotForm];

  return (
    <>
      {/* we do this instead of the && syntax to enable transitions  */}
      {showAreaStats && (
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
            // if (stat === "simulation") {
            //   return <li key="sim"></li>;
            // }

            if (
              stat !== "supply" &&
              stat !== "demand" &&
              stat !== "simulation"
            ) {
              return (
                // logic to display all the key value pairs in the object
                <li key={stat}>{`${stat.charAt(0).toUpperCase()}${stat.slice(
                  1
                )} : ${chosenArea[stat]}`}</li>
              );
            }
            return;
            // <li key={stat}>{`${stat.charAt(0).toUpperCase()}${stat.slice(
            //   1
            // )} : [Meat: ${chosenArea[stat].meat}\nCarbs: ${
            //   chosenArea[stat].carbs
            // }\nVeg: ${chosenArea[stat].vegetables}\nFruits: ${
            //   chosenArea[stat].fruits
            // } ]`}</li>
          })}
          <li key="toStatsBtn" className="stats-tab-nav">
            <NavLink to="/statistics">
              <ImStatsDots />
              <span className="nav-label">Show area statistics</span>
            </NavLink>
          </li>
        </ul>
      )}

      <div className="settings-tab">
        <div>
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
              <option value="farm">Farmland</option>
            </select>
          </li>
          {discrepancyShown ? (
            <li className="settings-option sub-option">
              <label>in</label>
              <select onChange={handleDiscrepancySelect}>
                <option value="all">Supply + Demand</option>
                <option value="meat">Meat</option>
                <option value="carbs">Grains</option>
                <option value="produce">Produce</option>
                <option value="dairyNEggs">Diary & Eggs</option>
                <option value="sugarNFat">Sugar & Fat</option>
                <option value="other">Other</option>
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
          <li>
            <label>
              Year : <span ref={yearValueRef}>2021</span>{" "}
            </label>
            <input
              type="range"
              ref={sliderRef}
              className="slider"
              onChange={handleYearChange}
              min="2015" //one year below earliest year to different if it's a time step or initial numbers
              max="2021"
              defaultValue="2021"
            />
          </li>

          <li>
            <label>
              ElevationScale : <span ref={scaleValueRef}>0.1</span>{" "}
            </label>
            <input
              type="range"
              ref={scaleSliderRef}
              className="slider"
              onChange={handleScaleChange}
              min="0.1"
              max="5"
              step="0.1"
              defaultValue="0.5"
            />
          </li>

          <li>
            <label>
              Radius : <span ref={radiusValueRef}>200</span>{" "}
            </label>
            <input
              type="range"
              ref={radiusSliderRef}
              className="slider"
              onChange={handleRadiusChange}
              min="100"
              max="500"
              step="50"
              defaultValue="200"
            />
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
          timeStep={timeStep}
          columnElevScale={colScale}
          ColumnRadius={radius}
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
