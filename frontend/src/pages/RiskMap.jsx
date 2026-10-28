import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Radio,
  Home,
  AlertTriangle,
  ShieldCheck,
  Navigation,
} from "lucide-react";

import { useEffect } from "react";

/* =========================================
   LOCATION COORDINATES
   ========================================= */

const locationCoordinates = {
  batticaloa: [7.717, 81.700],
  colombo: [6.9271, 79.8612],
  kandy: [7.2906, 80.6337],
  ratnapura: [6.6828, 80.3992],
  galle: [6.0329, 80.2168],
  jaffna: [9.6615, 80.0255],
  trincomalee: [8.5874, 81.2152],
  kurunegala: [7.4863, 80.3623],
  anuradhapura: [8.3114, 80.4037],
  negombo: [7.2083, 79.8358],
};

/* =========================================
   CUSTOM MAP ICONS
   ========================================= */

const createIcon = (type) => {
  const icons = {
    risk: "⚠",
    sensor: "📡",
    shelter: "🏠",
  };

  return L.divIcon({
    className: "custom-map-icon",
    html: `
      <div class="map-pin ${type}">
        <span>${icons[type]}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
};

const riskIcon = createIcon("risk");
const sensorIcon = createIcon("sensor");
const shelterIcon = createIcon("shelter");

/* =========================================
   MOVE MAP WHEN LOCATION CHANGES
   ========================================= */

function MapLocationController({ location }) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;

    const coordinates =
      locationCoordinates[location.id] ||
      locationCoordinates.batticaloa;

    map.flyTo(coordinates, 11, {
      duration: 1.2,
    });
  }, [location, map]);

  return null;
}

/* =========================================
   RISK MAP
   ========================================= */

function RiskMap({ location }) {
  const selectedLocation = location || {
    id: "batticaloa",
    name: "Batticaloa",
  };

  const coordinates =
    locationCoordinates[selectedLocation.id] ||
    locationCoordinates.batticaloa;

  return (
    <div className="content">

      {/* PAGE INTRO */}
      <section className="page-intro">

        <span className="section-label">
          GEOSPATIAL INTELLIGENCE
        </span>

        <h3>Risk Map</h3>

        <p>
          Visualize environmental risk zones, sensor stations
          and emergency support locations across Sri Lanka.
        </p>

      </section>

      {/* MAP PANEL */}
      <section className="panel risk-map-panel">

        <div className="map-header">

          <div>
            <span className="section-label">
              LIVE RISK MONITORING
            </span>

            <h4>
              {selectedLocation.name}, Sri Lanka
            </h4>
          </div>

          <div className="map-status">
            <span></span>
            Live Map
          </div>

        </div>

        {/* REAL MAP */}
        <div className="real-map-container">

          <MapContainer
            center={coordinates}
            zoom={11}
            scrollWheelZoom={true}
            className="real-map"
          >

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapLocationController
              location={selectedLocation}
            />

            {/* SELECTED LOCATION */}
            <Marker
              position={coordinates}
              icon={riskIcon}
            >
              <Popup>
                <strong>
                  {selectedLocation.name}
                </strong>
                <br />
                Monitored Area
                <br />
                <small>
                  RESQ-X Environmental Monitoring
                </small>
              </Popup>
            </Marker>

            {/* HIGH-RISK ZONE */}
            <Circle
              center={[
                coordinates[0] + 0.025,
                coordinates[1] + 0.02,
              ]}
              radius={4500}
              pathOptions={{
                color: "#ef706b",
                fillColor: "#ef706b",
                fillOpacity: 0.16,
              }}
            />

            {/* MODERATE-RISK ZONE */}
            <Circle
              center={[
                coordinates[0] - 0.025,
                coordinates[1] - 0.025,
              ]}
              radius={3200}
              pathOptions={{
                color: "#e4b75c",
                fillColor: "#e4b75c",
                fillOpacity: 0.13,
              }}
            />

            {/* SENSOR 1 */}
            <Marker
              position={[
                coordinates[0] + 0.035,
                coordinates[1] - 0.025,
              ]}
              icon={sensorIcon}
            >
              <Popup>
                <strong>Rainfall Sensor</strong>
                <br />
                Status: Online
              </Popup>
            </Marker>

            {/* SENSOR 2 */}
            <Marker
              position={[
                coordinates[0] - 0.035,
                coordinates[1] + 0.035,
              ]}
              icon={sensorIcon}
            >
              <Popup>
                <strong>Water Level Sensor</strong>
                <br />
                Status: Online
              </Popup>
            </Marker>

            {/* SENSOR 3 */}
            <Marker
              position={[
                coordinates[0] + 0.01,
                coordinates[1] + 0.05,
              ]}
              icon={sensorIcon}
            >
              <Popup>
                <strong>Soil Moisture Sensor</strong>
                <br />
                Status: Online
              </Popup>
            </Marker>

            {/* SHELTER */}
            <Marker
              position={[
                coordinates[0] - 0.01,
                coordinates[1] - 0.055,
              ]}
              icon={shelterIcon}
            >
              <Popup>
                <strong>Emergency Shelter</strong>
                <br />
                Available
              </Popup>
            </Marker>

          </MapContainer>

          {/* MAP LEGEND */}
          <div className="real-map-legend">

            <div>
              <span className="legend-dot high"></span>
              High Risk
            </div>

            <div>
              <span className="legend-dot moderate"></span>
              Moderate
            </div>

            <div>
              <span className="map-legend-icon">
                📡
              </span>
              Sensor
            </div>

            <div>
              <span className="map-legend-icon">
                🏠
              </span>
              Shelter
            </div>

          </div>

        </div>

      </section>

      {/* INFORMATION CARDS */}
      <section className="risk-map-summary">

        {/* RISK */}
        <div className="panel map-info-card">

          <span className="section-label">
            CURRENT RISK
          </span>

          <h4>
            <AlertTriangle size={15} />
            Environmental Risk
          </h4>

          <p>
            Risk zones are visualized from environmental
            monitoring information for the selected region.
          </p>

          <div className="risk-progress">
            <div style={{ width: "68%" }}></div>
          </div>

          <div className="risk-score-row">
            <strong>68</strong>
            <span>/ 100 Risk Score</span>
          </div>

        </div>

        {/* SENSOR NETWORK */}
        <div className="panel map-info-card">

          <span className="section-label">
            SENSOR NETWORK
          </span>

          <h4>
            <Radio size={15} />
            Active Stations
          </h4>

          <div className="station-row">
            <span className="network-dot"></span>
            Rainfall Station
            <strong>ONLINE</strong>
          </div>

          <div className="station-row">
            <span className="network-dot"></span>
            Water Level Station
            <strong>ONLINE</strong>
          </div>

          <div className="station-row">
            <span className="network-dot"></span>
            Soil Moisture Station
            <strong>ONLINE</strong>
          </div>

        </div>

        {/* SHELTER */}
        <div className="panel map-info-card">

          <span className="section-label">
            EMERGENCY SUPPORT
          </span>

          <h4>
            <ShieldCheck size={15} />
            Emergency Shelter
          </h4>

          <div className="shelter-mini">

            <div className="shelter-mini-icon">
              <Home size={17} />
            </div>

            <div>
              <strong>
                Nearest Safe Location
              </strong>

              <span>
                Available for evacuation
              </span>
            </div>

          </div>

          <button className="map-action">
            <Navigation size={12} />
            View Shelter Details
          </button>

        </div>

      </section>

    </div>
  );
}

export default RiskMap;