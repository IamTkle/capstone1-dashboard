import "./mapstyles.css";
import React from "react";
import ReactMap from "react-map-gl";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer, ColumnLayer } from "@deck.gl/layers";
import WAPopulationAtLocation from "../GeoFeature.json";
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
  columnElevScale = 0.3,
  ColumnRadius = 200,
}) => {
  const tooltip = React.useRef();

  const hexagonLayerData = WAPopulationAtLocation;

  const geoJSONLayerData = FarmlandInfo;

  const SA2GeoJSONLayerData = SA2Info;

  // hexagon materials
  const mats = React.memo(() => {
    return {
      ambient: 1,
      diffuse: 0.5,
      shininess: 0,
      specularColor: [50, 50, 50],
    };
  });

  const colorMultiplier = 1;

  const columnOpacity = 180;

  const columnColors = {
    sugarNFat: [158, 81, 236, columnOpacity].map((x) => x * colorMultiplier),
    produce: [125, 201, 3, columnOpacity].map((x) => x * colorMultiplier),
    carbs: [189, 140, 132, columnOpacity].map((x) => x * colorMultiplier),
    meat: [255, 71, 51, columnOpacity].map((x) => x * colorMultiplier),
    dairyNEggs: [255, 187, 0, columnOpacity].map((x) => x * colorMultiplier),
    // other: [51, 145, 240].map((x) => x * colorMultiplier),
    other: [200, 200, 200, columnOpacity].map((x) => x * colorMultiplier),
  };

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
              d.demand.produce +
              d.demand.sugarNFat +
              d.demand.dairyNEggs +
              d.demand.other -
              (d.supply.meat +
                d.supply.carbs +
                d.supply.produce +
                d.supply.sugarNFat +
                d.supply.dairyNEggs +
                d.supply.other)
          : d.simulation[timeStep].demand.meat +
              d.simulation[timeStep].demand.carbs +
              d.simulation[timeStep].demand.produce +
              d.simulation[timeStep].demand.sugarNFat +
              d.simulation[timeStep].demand.dairyNEggs +
              d.simulation[timeStep].demand.other -
              (d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.produce +
                d.simulation[timeStep].supply.sugarNFat +
                d.simulation[timeStep].demand.dairyNEggs +
                d.simulation[timeStep].demand.other);

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

      case "produce":
        return timeStep < 0
          ? d.demand.produce - d.supply.produce
          : d.simulation[timeStep].demand.produce -
              d.simulation[timeStep].supply.produce;

      case "sugarNFat":
        return timeStep < 0
          ? d.demand.sugarNFat - d.supply.sugarNFat
          : d.simulation[timeStep].demand.sugarNFat -
              d.simulation[timeStep].supply.sugarNFat;

      case "dairyNEggs":
        return timeStep < 0
          ? d.demand.dairyNEggs - d.supply.sugarNFat
          : d.simulation[timeStep].demand.dairyNEggs -
              d.simulation[timeStep].supply.dairyNEggs;

      case "other":
        return timeStep < 0
          ? d.demand.other - d.supply.other
          : d.simulation[timeStep].demand.other -
              d.simulation[timeStep].supply.other;

      default:
        return 0;
    }
  };

  const meatDemandCol = React.useRef();

  const carbsDemandCol = React.useRef();

  const produceDemandCol = React.useRef();

  const sugarNFatDemandCol = React.useRef();

  const dairyNEggsDemandCol = React.useRef();

  const otherDemandCol = React.useRef();

  const meatSupplyCol = React.useRef();

  const carbsSupplyCol = React.useRef();

  const produceSupplyCol = React.useRef();

  const sugarNFatSupplyCol = React.useRef();

  const dairyNEggsSupplyCol = React.useRef();

  const otherSupplyCol = React.useRef();

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
  });

  const [mapLayers, setMapLayers] = React.useState([]);

  React.useEffect(() => {
    switch (displayMode) {
      case "both":
        totalDemandCol.current = new ColumnLayer({
          id:
            "total-dem-column-" +
            timeStep +
            "-" +
            columnElevScale +
            "-" +
            ColumnRadius +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.9,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: [255, 0, 71, 100],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat +
                d.demand.carbs +
                d.demand.produce +
                d.demand.sugarNFat
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs +
                d.simulation[timeStep].demand.produce +
                d.simulation[timeStep].demand.sugarNFat,
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
          id:
            "total-supply-column-" +
            timeStep +
            "-" +
            columnElevScale +
            "-" +
            ColumnRadius +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.85,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: [0, 255, 0, 100],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat +
                d.supply.carbs +
                d.supply.produce +
                d.supply.sugarNFat
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.produce +
                d.simulation[timeStep].supply.sugarNFat,
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
            "discrepancy-column-" +
            timeStep +
            "-" +
            discrepancyMode +
            "-" +
            columnElevScale +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.85,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
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
          id:
            "meat-supply-column-" + timeStep + "-" + columnElevScale + "-layer",
          data: hexagonLayerData,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.meat,
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0 ? d.supply.meat : d.simulation[timeStep].supply.meat,
          material: mats,
        });

        carbsSupplyCol.current = new ColumnLayer({
          id:
            "carbs-supply-column-" +
            timeStep +
            "-" +
            columnElevScale +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.97,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.carbs,
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat + d.supply.carbs
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs,
          material: mats,
        });

        produceSupplyCol.current = new ColumnLayer({
          id:
            "produce-supply-column-" +
            timeStep +
            "-" +
            columnElevScale +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.94,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.produce,
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat + d.supply.carbs + d.supply.produce
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.produce,
          material: mats,
        });

        sugarNFatSupplyCol.current = new ColumnLayer({
          id:
            "sugarNFat-supply-column-" +
            timeStep +
            "-" +
            columnElevScale +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.91,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.sugarNFat,
          // getFillColor: [160, 80, 155],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat +
                d.supply.carbs +
                d.supply.produce +
                d.supply.sugarNFat
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.produce +
                d.simulation[timeStep].supply.sugarNFat,
          material: mats,
        });

        dairyNEggsSupplyCol.current = new ColumnLayer({
          id:
            "dairyNEggs-supply-column-" +
            timeStep +
            "-" +
            columnElevScale +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.88,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.dairyNEggs,
          // getFillColor: [160, 80, 155],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat +
                d.supply.carbs +
                d.supply.produce +
                d.supply.sugarNFat +
                d.supply.dairyNEggs
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.produce +
                d.simulation[timeStep].supply.sugarNFat +
                d.simulation[timeStep].supply.dairyNEggs,
          material: mats,
        });

        otherSupplyCol.current = new ColumnLayer({
          id:
            "other-supply-column-" +
            timeStep +
            "-" +
            columnElevScale +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.85,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.other,
          // getFillColor: [160, 80, 155],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.supply.meat +
                d.supply.carbs +
                d.supply.produce +
                d.supply.sugarNFat +
                d.supply.dairyNEggs +
                d.supply.other
              : d.simulation[timeStep].supply.meat +
                d.simulation[timeStep].supply.carbs +
                d.simulation[timeStep].supply.produce +
                d.simulation[timeStep].supply.sugarNFat +
                d.simulation[timeStep].supply.dairyNEggs +
                d.simulation[timeStep].supply.other,
          material: mats,
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
          otherSupplyCol.current,
          dairyNEggsSupplyCol.current,
          sugarNFatSupplyCol.current,
          produceSupplyCol.current,
          carbsSupplyCol.current,
          meatSupplyCol.current,
        ]);
        // setMapLayers([
        //   sugarNFatSupplyHexagonLayer,
        //   produceSupplyHexagonLayer,
        //   carbsSupplyHexagonLayer,
        //   meatSupplyHexagonLayer,
        // ]);
        break;
      case "demand":
        setMapLayers([]);
        meatDemandCol.current = new ColumnLayer({
          id: "meat-demand-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.meat,
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0 ? d.demand.meat : d.simulation[timeStep].demand.meat,
        });

        carbsDemandCol.current = new ColumnLayer({
          id: "carbs-dem-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.97,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.carbs,
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat + d.demand.carbs
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs,
        });

        produceDemandCol.current = new ColumnLayer({
          id: "produce-dem-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.94,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.produce,
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat + d.demand.carbs + d.demand.produce
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs +
                d.simulation[timeStep].demand.produce,
        });

        sugarNFatDemandCol.current = new ColumnLayer({
          id: "sugarNFat-dem-column-" + timeStep + "-layer",
          data: hexagonLayerData,
          coverage: 0.91,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          // getFillColor: [255, 127, 80],
          getFillColor: columnColors.sugarNFat,
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat +
                d.demand.carbs +
                d.demand.produce +
                d.demand.sugarNFat
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs +
                d.simulation[timeStep].demand.produce +
                d.simulation[timeStep].demand.sugarNFat,
        });

        dairyNEggsDemandCol.current = new ColumnLayer({
          id:
            "dairyNEggs-demand-column-" +
            timeStep +
            "-" +
            columnElevScale +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.88,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: false,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.dairyNEggs,
          // getFillColor: [160, 80, 155],
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat +
                d.demand.carbs +
                d.demand.produce +
                d.demand.sugarNFat +
                d.demand.dairyNEggs
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs +
                d.simulation[timeStep].demand.produce +
                d.simulation[timeStep].demand.sugarNFat +
                d.simulation[timeStep].demand.dairyNEggs,
          material: mats,
        });

        otherDemandCol.current = new ColumnLayer({
          id:
            "other-demand-column-" +
            timeStep +
            "-" +
            columnElevScale +
            "-layer",
          data: hexagonLayerData,
          coverage: 0.85,
          elevationScale: columnElevScale,
          diskResolution: 6,
          radius: ColumnRadius,
          extruded: true,
          pickable: true,
          getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
          getFillColor: columnColors.other,
          getLineColor: [0, 0, 0],
          getElevation: (d) =>
            timeStep < 0
              ? d.demand.meat +
                d.demand.carbs +
                d.demand.produce +
                d.demand.sugarNFat +
                d.demand.dairyNEggs +
                d.demand.other
              : d.simulation[timeStep].demand.meat +
                d.simulation[timeStep].demand.carbs +
                d.simulation[timeStep].demand.produce +
                d.simulation[timeStep].demand.sugarNFat +
                d.simulation[timeStep].demand.dairyNEggs +
                d.simulation[timeStep].demand.other,
          material: mats,
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
          otherDemandCol.current,
          dairyNEggsDemandCol.current,
          sugarNFatDemandCol.current,
          produceDemandCol.current,
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
  }, [displayMode, discrepancyMode, timeStep, columnElevScale, ColumnRadius]);

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
