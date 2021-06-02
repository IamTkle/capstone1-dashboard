import "./mapstyles.css";
import React from "react";
import ReactMap from "react-map-gl";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer, ColumnLayer } from "@deck.gl/layers";
import WAPopulationAtLocation from "../GeoFeatureFinal.json";
import FarmlandInfo from "../FarmlandInfo.json";
import SA2Info from "../SA2_2011.json";

const Map = ({
  height,
  width,
  viewState,
  onViewStateChange,
  onClick,
  areaOnClick,
  style,
  displayMode = "both",
  discrepancyMode = "all",
  timeStep = 0,
}) => {
  const tooltip = React.useRef();

  const hexagonLayerData = WAPopulationAtLocation;

  const geoJSONLayerData = FarmlandInfo;

  const SA2GeoJSONLayerData = SA2Info;

  const ColumnRadius = 200;

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

  const closeTooltip = () => {
    tooltip.current.style.opacity = 0.0;
    tooltip.current.style.left = `-200px`;
    tooltip.current.style.top = `-200px`;
  };

  const showTooltip = (hoverEvent) => {
    tooltip.current.style.opacity = 0.9;
    tooltip.current.innerHTML = `<h2>${hoverEvent.object.suburb.toUpperCase()}</h2>
          <p>Population: ${hoverEvent.object.population}<br></p>
          `;
    tooltip.current.style.left = `${hoverEvent.x}px`;
    tooltip.current.style.top = `${hoverEvent.y}px`;
  };

  const determineDiscrepancy = (d, mode) => {
    switch (mode) {
      case "all":
        return timeStep < 0
          ? d.demand.meat +
              d.demand.carbs +
              d.demand.vegetables +
              d.demand.fruits -
              (d.supply.meat +
                d.supply.carbs +
                d.supply.vegetables +
                d.supply.fruits)
          : d.simulation[timeStep].demand.meat +
              d.simulation[timeStep].demand.carbs +
              d.simulation[timeStep].demand.vegetables +
              d.simulation[timeStep].demand.fruits -
              (d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.vegetables +
                d.simulation[timeStep].supply.fruits);

      case "meat":
        return timeStep < 0
          ? d.demand.meat - d.supply.meat
          : d.simulation[timeStep].demand.meat -
              d.simulation[timeStep].supply.meat;

      case "carbs":
        return timeStep < 0
          ? d.demand.carbs - d.supply.carbs
          : d.simulation[timeStep].demand.carbs -
              d.simulation[timeStep].supply.carbs;

      case "vegetables":
        return timeStep < 0
          ? d.demand.vegetables - d.supply.vegetables
          : d.simulation[timeStep].demand.vegetables -
              d.simulation[timeStep].supply.vegetables;

      case "fruits":
        return timeStep < 0
          ? d.demand.fruits - d.supply.fruits
          : d.simulation[timeStep].demand.fruits -
              d.simulation[timeStep].supply.fruits;

      default:
        return (
          d.demand.meat +
          d.demand.carbs +
          d.demand.vegetables +
          d.demand.fruits -
          (d.supply.meat +
            d.supply.carbs +
            d.supply.vegetables +
            d.supply.fruits)
        );
    }
  };

  const meatDemandCol = React.useRef();

  const carbsDemandCol = React.useRef();

  const vegDemandCol = React.useRef();

  const fruitsDemandCol = React.useRef();

  const meatSupplyCol = React.useRef();

  const carbsSupplyCol = React.useRef();

  const vegSupplyCol = React.useRef();

  const fruitsSupplyCol = React.useRef();

  const totalSupplyCol = React.useRef();

  const totalDemandCol = React.useRef();

  const discrepancyColLayer = React.useRef();

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
    getRadius: ColumnRadius,
    getLineWidth: 100,
    getElevation: (object) => object.properties.Area_ha,
    onClick: ({ object }) => console.log(object.properties),
    autoHighlight: true,
  });

  const SA2GeoJSONLayer = new GeoJsonLayer({
    id: "sa2-geojson-layer",
    data: SA2GeoJSONLayerData,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: false,
    getFillColor: [0, 0, 0, 0],
    lineWidthMinPixels: 0,
    getLineWidth: 100,
    getLineColor: [120, 70, 50, 60],
    autoHighlight: true,
    highlightColor: [255, 215, 0, 100],
    onClick: (d) => console.log(d),
  });

  const [mapLayers, setMapLayers] = React.useState([]);

  React.useEffect(() => {
    switch (displayMode) {
      case "both":
        totalDemandCol.current = new ColumnLayer({
          id: "total-dem-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.85,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [255, 0, 71, 100],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat +
                d.demand.carbs +
                d.demand.vegetables +
                d.demand.fruits
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs +
                d.simulation[timeStep].demand.vegetables +
                d.simulation[timeStep].demand.fruits,
          onClick: (d) => {
            if (areaOnClick) {
              if (d.object) {
                areaOnClick(d.object);
                closeTooltip();
              }
            }
          },
          onHover: (d) => {
            if (d.object) {
              showTooltip(d);
            } else {
              closeTooltip();
            }
          },
        });

        totalSupplyCol.current = new ColumnLayer({
          id: "total-supply-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.85,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [0, 255, 0, 100],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat +
                d.supply.carbs +
                d.supply.vegetables +
                d.supply.fruits
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.vegetables +
                d.simulation[timeStep].supply.fruits,
          onClick: (d) => {
            if (areaOnClick) {
              if (d.object) {
                areaOnClick(d.object);
                closeTooltip();
              }
            }
          },
          onHover: (d) => {
            if (d.object) {
              showTooltip(d);
            } else {
              closeTooltip();
            }
          },
        });

        setMapLayers([totalSupplyCol.current, totalDemandCol.current]);
        break;
      case "diff":
        discrepancyColLayer.current = new ColumnLayer({
          id:
            "discrepancy-column-" + timeStep + "-" + discrepancyMode + "-layer",
          data: hexagonLayerData,
          coverage: 0.85,
          elevationScale: 0.5,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: (d) =>
            determineDiscrepancy(d, discrepancyMode) <= 0
              ? [0, 255, 0, 100]
              : [255, 0, 71, 100],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            Math.abs(determineDiscrepancy(d, discrepancyMode)),
          onClick: (d) => {
            if (areaOnClick) {
              if (d.object) {
                areaOnClick(d.object);
                closeTooltip();
              }
            }
          },
          onHover: (d) => {
            if (d.object) {
              showTooltip(d);
            } else {
              closeTooltip();
            }
          },
        });

        setMapLayers([discrepancyColLayer.current]);
        break;
      case "supply":
        setMapLayers([]);

        meatSupplyCol.current = new ColumnLayer({
          id: "meat-supply-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [175, 125, 125],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0 ? d.supply.meat : d.simulation[timeStep].supply.meat,
          material: mats,
        });

        carbsSupplyCol.current = new ColumnLayer({
          id: "carbs-supply-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.95,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [198, 137, 88],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat + d.supply.carbs
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs,
          material: mats,
        });

        vegSupplyCol.current = new ColumnLayer({
          id: "veg-supply-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.9,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [150, 177, 37],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat + d.supply.carbs + d.supply.vegetables
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.vegetables,
          material: mats,
        });

        fruitsSupplyCol.current = new ColumnLayer({
          id: "fruits-supply-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.85,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [255, 127, 80],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat +
                d.supply.carbs +
                d.supply.vegetables +
                d.supply.fruits
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.vegetables +
                d.simulation[timeStep].supply.fruits,
          onClick: (d) => {
            if (areaOnClick) {
              if (d.object) {
                areaOnClick(d.object);
                closeTooltip();
              }
            }
          },
          onHover: (d) => {
            if (d.object) {
              showTooltip(d);
            } else {
              closeTooltip();
            }
          },
          material: mats,
        });

        setMapLayers([
          fruitsSupplyCol.current,
          vegSupplyCol.current,
          carbsSupplyCol.current,
          meatSupplyCol.current,
        ]);
        // setMapLayers([
        //   fruitsSupplyHexagonLayer,
        //   vegSupplyHexagonLayer,
        //   carbsSupplyHexagonLayer,
        //   meatSupplyHexagonLayer,
        // ]);
        break;
      case "demand":
        setMapLayers([]);
        meatDemandCol.current = new ColumnLayer({
          id: "meat-demand-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [175, 125, 125],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0 ? d.demand.meat : d.simulation[timeStep].demand.meat,
        });

        carbsDemandCol.current = new ColumnLayer({
          id: "carbs-dem-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.95,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [198, 137, 88],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat + d.demand.carbs
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs,
        });

        vegDemandCol.current = new ColumnLayer({
          id: "veg-dem-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.9,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [150, 177, 37],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat + d.demand.carbs + d.demand.vegetables
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs +
                d.simulation[timeStep].demand.vegetables,
        });

        fruitsDemandCol.current = new ColumnLayer({
          id: "fruits-dem-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.85,
          elevationScale: 0.1,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.long), parseFloat(d.lat)],
          getFillColor: [255, 127, 80],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat +
                d.demand.carbs +
                d.demand.vegetables +
                d.demand.fruits
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs +
                d.simulation[timeStep].demand.vegetables +
                d.simulation[timeStep].demand.fruits,
          onClick: (d) => {
            if (areaOnClick) {
              if (d.object) {
                areaOnClick(d.object);
                closeTooltip();
              }
            }
          },
          onHover: (d) => {
            if (d.object) {
              showTooltip(d);
            } else {
              closeTooltip();
            }
          },
        });

        setMapLayers([
          fruitsDemandCol.current,
          vegDemandCol.current,
          carbsDemandCol.current,
          meatDemandCol.current,
        ]);
        break;
      case "farm":
        setMapLayers([farmlandGeoJSONLayer]);
        break;
      default:
        setMapLayers([]);
        break;
    }
    setMapLayers((prevMapLayers) => [...prevMapLayers, SA2GeoJSONLayer]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode, discrepancyMode, timeStep]);

  return (
    <div className="map-container" onClick={onClick} style={style}>
      <ReactMap
        mapboxApiAccessToken={process.env.REACT_APP_MAP_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v10"
        width={width}
        height={height}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        asyncRender={true}
      >
        <DeckGL viewState={viewState} layers={mapLayers} />
      </ReactMap>
      {/* this is our tooltip box for when the user hovers over the hexagons */}
      <div ref={tooltip} className="map-tooltip"></div>
    </div>
  );
};

export default Map;
