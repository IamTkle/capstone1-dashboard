import React, { Component } from "react";
import { Bar } from "react-chartjs-2";
import placeStats from "../GeoFeatureFinal.json";
import "./statistics.css";

class Statistics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      LineChartData: {
        labels: ["2016", "2017", "2018", "2019", "2020", "2021"],
        datasets: [
          {
            label: "Meat Supply",
            data: [6083, 13291, 10904, 9782, 10213, 15065],
            backgroundColor: "rgba(255,0,0,0.6)",
            aspectRatio: 0.5,
            stack: "Stack 0",
          },
          {
            label: "Veggies Supply",
            data: [832, 1819, 1560, 668, 698, 1321],
            backgroundColor: "rgba(60,179,0,0.6)",
            stack: "Stack 0",
          },
          {
            label: "Carbs Supply",
            data: [705, 1536, 189, 3104, 3240, 560],
            backgroundColor: "rgba(255, 165, 0,0.6)",
            stack: "Stack 0",
          },
          {
            label: "Fruit Supply",
            data: [157, 344, 572, 1134, 1134, 656],
            backgroundColor: "rgba(238, 130, 238,0.6)",
            stack: "Stack 0",
          },
          {
            label: "Meat Demand",
            data: [2065, 4513, 14509, 14156, 14780, 19700],
            backgroundColor: "rgba(255,0,0,0.6)",
            stack: "Stack 1",
          },
          {
            label: "Veggies Demand",
            data: [1739, 3800, 704, 3111, 3248, 500],
            backgroundColor: "rgba(60,179,0,0.6)",
            stack: "Stack 1",
          },
          {
            label: "Carbs Demand",
            data: [311, 678, 430, 1709, 1784, 892],
            backgroundColor: "rgba(255, 165, 0,0.6)",
            stack: "Stack 1",
          },
          {
            label: "Fruit Supply",
            data: [1089, 2375, 1047, 469, 490, 880],
            backgroundColor: "rgba(238, 130, 238,0.6)",
            stack: "Stack 1",
          },
          //   {
          //     label: "Population",
          //     data: [200000, 300000, 350000, 400000, 500000, 650000],
          //     type: "line",
          //     fill: false,
          //     tension: 0.1,
          //     pointRadius: 5,
          //     pointStyle: "rectRot",
          //     borderWidth: 1,
          //     borderColor: "rgb(75, 192, 192)",
          //   },
        ],
      },
    };
  }
  render() {
    var delayed;

    return (
      <div
        className="LineChart"
        style={{ position: "absolute", width: "90vw", right: 0 }}
      >
        <Bar
          data={this.state.LineChartData}
          options={{
            plugins: {
              title: {
                display: true,
                text: "Perth Statistics",
                fontSize: 30,
              },
              legend: {
                display: true,
                position: "right",
              },
            },
            responsive: true,
            // maintainAspectRatio: false,
            // aspectRatio: 1,
            interaction: {
              intersect: false,
            },
            scales: {
              yAxes: [
                {
                  scaleLabel: {
                    display: true,
                    labelString: "Time",
                    padding: 30,
                  },
                },
              ],
              x: {
                disply: true,
                stacked: true,
                title: {
                  display: true,
                  text: "Year (X)",
                  font: {
                    family: "Times",
                    size: 20,
                    style: "normal",
                    lineHeight: 1.2,
                  },
                },
              },
              y: {
                display: true,
                stacked: true,
                title: {
                  display: true,
                  text: "Value (Y)",
                  font: {
                    family: "Times",
                    size: 20,
                    style: "normal",
                    lineHeight: 1.2,
                  },
                },
              },
            },
            animation: {
              onComplete: () => {
                delayed = true;
              },
              delay: (context) => {
                let delay = 0;
                if (
                  context.type === "data" &&
                  context.mode === "default" &&
                  !delayed
                ) {
                  delay = context.dataIndex * 300 + context.datasetIndex * 100;
                }
                return delay;
              },
            },
          }}
        />
      </div>
    );
  }
}
export default Statistics;
