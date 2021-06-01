import "./mapstyles.css";
import React from "react";
import ReactMap from "react-map-gl";
import DeckGL from "@deck.gl/react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";

// import AUPopulationAtLocation from "../au-cities-population-location.json";
import AUPopulationAtLocation from "../GeoFeature.json";
import FarmlandInfo from "../Farmland.json";
// import reactDom from "react-dom";

const Map = ({
  height,
  width,
  viewState,
  onViewStateChange,
  onClick,
  areaOnClick,
  style,
  displayMode,
  discrepancyMode,
}) => {
  const tooltip = React.useRef();

  const hexagonLayerData = AUPopulationAtLocation;

  const geoJSONLayerData = FarmlandInfo;

  // console.log(geoJSONLayerData);

  // hexagon materials
  const mats = React.memo(() => {
    return {
      ambient: 0.3,
      diffuse: 0.7,
      shininess: 100,
      // specularColor: [100, 30, 30],
      specularColor: [0, 0, 0],
    };
  });

  const demandColorRange = [
    // [25, 176, 6, 100],
    // [255, 203, 1, 100],
    // [205, 51, 1, 100],
    [255, 0, 71, 100],
    // [255, 0, 0, 100],
  ];

  const determineDiscrepancy = (d, mode) => {
    switch (mode) {
      case "all":
        return (
          d[0].demand.food.meat +
          d[0].demand.food.carbs +
          d[0].demand.food.vegetables +
          d[0].demand.food.fruits -
          (d[0].supply.food.meat +
            d[0].supply.food.carbs +
            d[0].supply.food.vegetables +
            d[0].supply.food.fruits)
        );

      case "meat":
        return d[0].demand.food.meat - d[0].supply.food.meat;

      case "carbs":
        return d[0].demand.food.carbs - d[0].supply.food.carbs;

      case "vegetables":
        return d[0].demand.food.vegetables - d[0].supply.food.vegetables;

      case "fruits":
        return d[0].demand.food.fruits - d[0].supply.food.fruits;

      default:
        return (
          d[0].demand.food.meat +
          d[0].demand.food.carbs +
          d[0].demand.food.vegetables +
          d[0].demand.food.fruits -
          (d[0].supply.food.meat +
            d[0].supply.food.carbs +
            d[0].supply.food.vegetables +
            d[0].supply.food.fruits)
        );
    }
  };

  const meatDemandHexagonLayer = new HexagonLayer({
    id: "meat-demand-hexagon-layer",
    data: hexagonLayerData,
    elevationScale: 8,
    pickable: false,
    radius: 100,
    extruded: true,
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getElevationValue: (d) => d[0].demand.food.meat,
    // colorRange: [[200, 150, 150]],
    colorRange: [[195, 138, 138]],
    material: mats,
  });

  const carbsDemandHexagonLayer = new HexagonLayer({
    id: "carbs-demand-hexagon-layer",
    data: hexagonLayerData,
    elevationScale: 8,
    pickable: false,
    radius: 100,
    extruded: true,
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getElevationValue: (d) => d[0].demand.food.meat + d[0].demand.food.carbs,
    // colorRange: [[150, 115, 92]],
    colorRange: [[198, 137, 88]],
    material: mats,
  });

  const vegDemandHexagonLayer = new HexagonLayer({
    id: "veg-demand-hexagon-layer",
    data: hexagonLayerData,
    elevationScale: 8,
    pickable: false,
    radius: 100,
    extruded: true,
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getElevationValue: (d) =>
      d[0].demand.food.meat +
      d[0].demand.food.carbs +
      d[0].demand.food.vegetables,
    // colorRange: [[133, 203, 51]],
    colorRange: [[150, 177, 37]],
    material: mats,
  });

  const fruitsDemandHexagonLayer = new HexagonLayer({
    id: "fruits-demand-hexagon-layer",
    data: hexagonLayerData,
    elevationScale: 8,
    pickable: true,
    radius: 100,
    extruded: true,
    // d is just the data in this case
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getElevationValue: (d) =>
      d[0].demand.food.meat +
      d[0].demand.food.carbs +
      d[0].demand.food.vegetables +
      d[0].demand.food.fruits,
    colorRange: [[255, 127, 80]],
    // d also stands for Da-click-event here
    onClick: (d) => {
      if (areaOnClick) {
        if (d.object.points[0].source) {
          areaOnClick(d.object.points[0].source);
          tooltip.current.style.opacity = 0.0;
          tooltip.current.style.left = `-200px`;
          tooltip.current.style.top = `-200px`;
        }
      }
    },
    // as you can already extrapolate: Da-hover-event
    onHover: (d) => {
      // whenever the user hovers over a hexagon, tool tip shows up with
      // if and only if the object exists
      if (d.object) {
        tooltip.current.style.opacity = 0.9;
        tooltip.current.innerHTML = `<h2>${d.object.points[0].source.suburb.toUpperCase()}</h2>
          <p>Population: ${d.object.points[0].source.population}<br></p>
          `;
        tooltip.current.style.left = `${d.x}px`;
        tooltip.current.style.top = `${d.y}px`;
      } else {
        tooltip.current.style.opacity = 0.0;
        tooltip.current.style.left = `-200px`;
        tooltip.current.style.top = `-200px`;
      }
    },
    onDrag: () => {
      // There was a "feature" where when you hover a town and
      // then starts to drag the map, the tooltip would still be
      // showing but its location on the screen doesn't match the
      // chosen location anymore, so i just choose to disable it
      // if the user starts dragging
      if (tooltip.current.style.opacity === 0.0) {
        return;
      }
      tooltip.current.style.opacity = 0.0;
      tooltip.current.style.left = `-200px`;
      tooltip.current.style.top = `-200px`;
    },
  });

  const meatSupplyHexagonLayer = new HexagonLayer({
    id: "meat-supply-hexagon-layer",
    data: hexagonLayerData,
    elevationScale: 8,
    pickable: false,
    radius: 100,
    extruded: true,
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getElevationValue: (d) => d[0].supply.food.meat,
    // colorRange: [[200, 150, 150]],
    colorRange: [[195, 138, 138]],
    material: mats,
  });

  const carbsSupplyHexagonLayer = new HexagonLayer({
    id: "carbs-supply-hexagon-layer",
    data: hexagonLayerData,
    elevationScale: 8,
    pickable: false,
    radius: 100,
    extruded: true,
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getElevationValue: (d) => d[0].supply.food.meat + d[0].supply.food.carbs,
    // colorRange: [[150, 115, 92]],
    colorRange: [[198, 137, 88]],
    material: mats,
  });

  const vegSupplyHexagonLayer = new HexagonLayer({
    id: "veg-supply-hexagon-layer",
    data: hexagonLayerData,
    elevationScale: 8,
    pickable: false,
    radius: 100,
    extruded: true,
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getElevationValue: (d) =>
      d[0].supply.food.meat +
      d[0].supply.food.carbs +
      d[0].supply.food.vegetables,
    // colorRange: [[133, 203, 51]],
    colorRange: [[150, 177, 37]],
    material: mats,
  });

  const fruitsSupplyHexagonLayer = new HexagonLayer({
    id: "fruits-supply-hexagon-layer",
    data: hexagonLayerData,
    elevationScale: 8,
    pickable: true,
    radius: 100,
    extruded: true,
    // d is just the data in this case
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getElevationValue: (d) =>
      d[0].supply.food.meat +
      d[0].supply.food.carbs +
      d[0].supply.food.vegetables +
      d[0].supply.food.fruits,
    colorRange: [[255, 127, 80]],
    // d also stands for Da-click-event here
    onClick: (d) => {
      if (areaOnClick) {
        if (d.object.points[0].source) {
          areaOnClick(d.object.points[0].source);
          tooltip.current.style.opacity = 0.0;
          tooltip.current.style.left = `-200px`;
          tooltip.current.style.top = `-200px`;
        }
      }
    },
    // as you can already extrapolate: Da-hover-event
    onHover: (d) => {
      // whenever the user hovers over a hexagon, tool tip shows up with
      // if and only if the object exists
      if (d.object) {
        tooltip.current.style.opacity = 0.9;
        tooltip.current.innerHTML = `<h2>${d.object.points[0].source.suburb.toUpperCase()}</h2>
          <p>Population: ${d.object.points[0].source.population}<br></p>
          `;
        tooltip.current.style.left = `${d.x}px`;
        tooltip.current.style.top = `${d.y}px`;
      } else {
        tooltip.current.style.opacity = 0.0;
        tooltip.current.style.left = `-200px`;
        tooltip.current.style.top = `-200px`;
      }
    },
    onDrag: () => {
      // There was a "feature" where when you hover a town and
      // then starts to drag the map, the tooltip would still be
      // showing but its location on the screen doesn't match the
      // chosen location anymore, so i just choose to disable it
      // if the user starts dragging
      if (tooltip.current.style.opacity === 0.0) {
        return;
      }
      tooltip.current.style.opacity = 0.0;
      tooltip.current.style.left = `-200px`;
      tooltip.current.style.top = `-200px`;
    },
  });

  const supplyHexagonLayer = new HexagonLayer({
    id: "supply-hexagon-layer",
    data: hexagonLayerData,
    pickable: true,
    extruded: true,
    radius: 101,
    // getRadius: 10,
    elevationScale: 8,
    // d is just the data in this case
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    // getElevationWeight:
    getColorWeight: (d) => {
      return Object.keys(d.supply.food).reduce(
        (total, current) => total + d.supply.food[current],
        0
      );
    },
    // d also stands for Da-click-event here
    onClick: (d) => {
      if (areaOnClick) {
        if (d.object.points[0].source) {
          areaOnClick(d.object.points[0].source);
          tooltip.current.style.opacity = 0.0;
          tooltip.current.style.left = `-200px`;
          tooltip.current.style.top = `-200px`;
        }
      }
    },
    // as you can already extrapolate: Da-hover-event
    onHover: (d) => {
      // whenever the user hovers over a hexagon, tool tip shows up with
      // if and only if the object exists
      if (d.object) {
        tooltip.current.style.opacity = 0.9;
        tooltip.current.innerHTML = `<h2>${d.object.points[0].source.suburb.toUpperCase()}</h2>
          <p>Population: ${d.object.points[0].source.population}<br></p>
          `;
        tooltip.current.style.left = `${d.x}px`;
        tooltip.current.style.top = `${d.y}px`;
      } else {
        tooltip.current.style.opacity = 0.0;
        tooltip.current.style.left = `-200px`;
        tooltip.current.style.top = `-200px`;
      }
    },
    onDrag: () => {
      // There was a "feature" where when you hover a town and
      // then starts to drag the map, the tooltip would still be
      // showing but its location on the screen doesn't match the
      // chosen location anymore, so i just choose to disable it
      // if the user starts dragging
      if (tooltip.current.style.opacity === 0.0) {
        return;
      }
      tooltip.current.style.opacity = 0.0;
      tooltip.current.style.left = `-200px`;
      tooltip.current.style.top = `-200px`;
    },
    getElevationValue: (d) =>
      d[0].supply.food.meat +
      d[0].supply.food.carbs +
      d[0].supply.food.vegetables +
      d[0].supply.food.fruits,
    material: mats,
    colorRange: [[0, 255, 0, 100]],
  });

  const demandHexagonLayer = new HexagonLayer({
    id: "demand-hexagon-layer",
    data: hexagonLayerData,
    pickable: true,
    extruded: true,
    radius: 101,
    // getRadius: 10,
    elevationScale: 8,
    // d is just the data in this case
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    // getElevationWeight:
    getColorWeight: (d) =>
      (d.demand.food.meat +
        d.demand.food.carbs +
        d.demand.food.vegetables +
        d.demand.food.fruits) /
      (d.supply.food.meat +
        d.supply.food.carbs +
        d.supply.food.vegetables +
        d.supply.food.fruits),
    // d also stands for Da-click-event here
    onClick: (d) => {
      if (areaOnClick) {
        if (d.object.points[0].source) {
          areaOnClick(d.object.points[0].source);
          tooltip.current.style.opacity = 0.0;
          tooltip.current.style.left = `-200px`;
          tooltip.current.style.top = `-200px`;
        }
      }
    },
    // as you can already extrapolate: Da-hover-event
    onHover: (d) => {
      // whenever the user hovers over a hexagon, tool tip shows up with
      // if and only if the object exists
      if (d.object) {
        tooltip.current.style.opacity = 0.9;
        tooltip.current.innerHTML = `<h2>${d.object.points[0].source.suburb.toUpperCase()}</h2>
          <p>Population: ${d.object.points[0].source.population}<br></p>
          `;
        tooltip.current.style.left = `${d.x}px`;
        tooltip.current.style.top = `${d.y}px`;
      } else {
        tooltip.current.style.opacity = 0.0;
        tooltip.current.style.left = `-200px`;
        tooltip.current.style.top = `-200px`;
      }
    },
    onDrag: () => {
      // There was a "feature" where when you hover a town and
      // then starts to drag the map, the tooltip would still be
      // showing but its location on the screen doesn't match the
      // chosen location anymore, so i just choose to disable it
      // if the user starts dragging
      if (tooltip.current.style.opacity === 0.0) {
        return;
      }
      tooltip.current.style.opacity = 0.0;
      tooltip.current.style.left = `-200px`;
      tooltip.current.style.top = `-200px`;
    },
    getElevationValue: (d) =>
      d[0].demand.food.meat +
      d[0].demand.food.carbs +
      d[0].demand.food.vegetables +
      d[0].demand.food.fruits,
    material: mats,
    colorRange: demandColorRange,
  });

  const discrepancyLayer = new HexagonLayer({
    id: "all-discrepancy-hexagon-layer",
    data: hexagonLayerData,
    pickable: true,
    extruded: true,
    radius: 101,
    // getRadius: 10,
    elevationScale: 8,
    // d is just the data in this case
    getPosition: (d) => [parseFloat(d._long), parseFloat(d.lat)],
    getColorValue: (d) => determineDiscrepancy(d, discrepancyMode),
    // d also stands for Da-click-event here
    onClick: (d) => {
      if (areaOnClick) {
        if (d.object.points[0].source) {
          areaOnClick(d.object.points[0].source);
          tooltip.current.style.opacity = 0.0;
          tooltip.current.style.left = `-200px`;
          tooltip.current.style.top = `-200px`;
        }
      }
    },
    // as you can already extrapolate: Da-hover-event
    onHover: (d) => {
      // whenever the user hovers over a hexagon, tool tip shows up with
      // if and only if the object exists
      if (d.object) {
        tooltip.current.style.opacity = 0.9;
        tooltip.current.innerHTML = `<h2>${d.object.points[0].source.suburb.toUpperCase()}</h2>
          <p>Population: ${d.object.points[0].source.population}<br></p>
          `;
        tooltip.current.style.left = `${d.x}px`;
        tooltip.current.style.top = `${d.y}px`;
      } else {
        tooltip.current.style.opacity = 0.0;
        tooltip.current.style.left = `-200px`;
        tooltip.current.style.top = `-200px`;
      }
    },
    onDrag: () => {
      // There was a "feature" where when you hover a town and
      // then starts to drag the map, the tooltip would still be
      // showing but its location on the screen doesn't match the
      // chosen location anymore, so i just choose to disable it
      // if the user starts dragging
      if (tooltip.current.style.opacity === 0.0) {
        return;
      }
      tooltip.current.style.opacity = 0.0;
      tooltip.current.style.left = `-200px`;
      tooltip.current.style.top = `-200px`;
    },
    getElevationValue: (d) =>
      Math.abs(determineDiscrepancy(d, discrepancyMode)),
    colorRange: [
      [0, 255, 0, 100],
      [255, 0, 71, 100],
    ],
    material: mats,
  });

  const farmlandGeoJSONLayer = new GeoJsonLayer({
    id: "geojson-layer",
    data: geoJSONLayerData,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: true,
    lineWidthScale: 20,
    lineWidthMinPixels: 2,
    getFillColor: (object) => {
      switch (object.properties.Broad_type) {
        case "Vegetables and herbs":
          return [170, 100, 170, 200];
        case "Animals":
          return [255, 100, 100, 200];
        case "Fruits":
          return [255, 140, 0, 200];
        case "Forest":
          return [50, 180, 100, 200];
        default:
          return [255, 255, 255, 200];
      }
      // return object
      //   ? [object.properties.Area_ha % 256, 100, 100, 200]
      //   : [100, 100, 100, 200];
    },
    getLineColor: [177, 100, 50],
    getRadius: 100,
    getLineWidth: 100,
    getElevation: (object) => object.properties.Area_ha,
    onClick: ({ object }) => console.log(object.properties),
  });

  // let mapLayers = React.useRef([]);

  const [mapLayers, setMapLayers] = React.useState([]);

  React.useEffect(() => {
    switch (displayMode) {
      case "both":
        setMapLayers([supplyHexagonLayer, demandHexagonLayer]);
        break;
      case "diff":
        switch (discrepancyMode) {
          case "all":
            discrepancyLayer.id = "all-discrepancy-hexagon-layer";
            break;
          case "meat":
            discrepancyLayer.id = "meat-discrepancy-hexagon-layer";
            break;
          case "carbs":
            discrepancyLayer.id = "carbs-discrepancy-hexagon-layer";
            break;
          case "vegetables":
            discrepancyLayer.id = "vegetables-discrepancy-hexagon-layer";
            break;
          case "fruits":
            discrepancyLayer.id = "fruits-discrepancy-hexagon-layer";
            break;
          default:
            discrepancyLayer.id = "all-discrepancy-hexagon-layer";
            break;
        }
        setMapLayers([discrepancyLayer]);
        break;
      case "supply":
        setMapLayers([
          fruitsSupplyHexagonLayer,
          vegSupplyHexagonLayer,
          carbsSupplyHexagonLayer,
          meatSupplyHexagonLayer,
        ]);
        break;
      case "demand":
        setMapLayers([
          fruitsDemandHexagonLayer,
          vegDemandHexagonLayer,
          carbsDemandHexagonLayer,
          meatDemandHexagonLayer,
        ]);
        break;
      case "farm":
        setMapLayers([farmlandGeoJSONLayer]);
        break;
      default:
        setMapLayers([supplyHexagonLayer, demandHexagonLayer]);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode, discrepancyMode]);

  return (
    <div className="map-container" onClick={onClick} style={style}>
      <ReactMap
        mapboxApiAccessToken={process.env.REACT_APP_MAP_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v10"
        width={width}
        height={height}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        asyncRender={false}
      >
        <DeckGL viewState={viewState} layers={mapLayers} />
      </ReactMap>
      {/* this is our tooltip box for when the user hovers over the hexagons */}
      <div ref={tooltip} className="map-tooltip"></div>
    </div>
  );
};

export default Map;
