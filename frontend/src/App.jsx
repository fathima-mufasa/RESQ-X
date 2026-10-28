import React, { useState, useEffect } from "react";
import locations from "./data/locations";

import {
  AlertTriangle,
  Eye,
  EyeOff,
  Bell,
  ChevronRight,
  Droplets,
  Home,
  MapPin,
  Menu,
  Mountain,
  Navigation,
  Shield,
  Users,
  Waves,
  Wind,
  X,
} from "lucide-react";

import "./styles/resq.css";
import "./App.css";

import RiskMap from "./pages/RiskMap";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const alerts = [
  {
    id: 1,
    title: "High Flood Risk Detected",
    location: "Batticaloa",
    time: "2 minutes ago",
    level: "HIGH",
  },
  {
    id: 2,
    title: "Water Level Rising",
    location: "Kallady Zone",
    time: "8 minutes ago",
    level: "MEDIUM",
  },
];

/* =========================================================
   DEMO SHELTERS
   ========================================================= */

const shelters = [
  {
    name: "KDU Emergency Shelter",
    location: "Ratmalana",
    available: 124,
    capacity: 200,
    distance: "1.8 km",
  },
  {
    name: "Community Safe Centre",
    location: "Dehiwala",
    available: 86,
    capacity: 150,
    distance: "3.2 km",
  },
];


/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  // SPLASH SCREEN
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // LOGIN / REGISTRATION
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
const [registerNic, setRegisterNic] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("user");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Restore the logged-in user after a page refresh.
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("resqx_user");

      if (!savedUser) return;

      const user = JSON.parse(savedUser);

      if (user?.user_id && user?.email && user?.role) {
        setUserRole(user.role);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem("resqx_user");
      }
    } catch (error) {
      console.error("Session restore error:", error);
      localStorage.removeItem("resqx_user");
    }
  }, []);

  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(
    locations[0]?.id || "batticaloa"
  );

  const [sensorData, setSensorData] = useState({
    rainfall: 0,
    waterLevel: 0,
    soilMoisture: 0,
    humidity: 0,
  });


  /* =======================================================
     NAVIGATION
     ======================================================= */

  const navigation =
    userRole === "shelter"
      ? [
          { name: "Dashboard", icon: Home },
          { name: "Live Monitoring", icon: Waves },
          { name: "Risk Map", icon: MapPin },
          { name: "Alerts", icon: Bell },
          { name: "Shelter Management", icon: Shield },
          { name: "Analytics", icon: Mountain },
        ]
      : [
          { name: "Dashboard", icon: Home },
          { name: "Live Monitoring", icon: Waves },
          { name: "Risk Map", icon: MapPin },
          { name: "Alerts", icon: Bell },
          { name: "Shelters", icon: Shield },
          { name: "Community Reports", icon: Users },
          { name: "Analytics", icon: Mountain },
        ];

  /* =======================================================
     SELECTED LOCATION OBJECT
     ======================================================= */

  const currentLocation =
    locations.find(
      (item) => item.id === selectedLocation
    ) || locations[0];


  const [weather, setWeather] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);

  // Load sensor readings for the selected location.
  useEffect(() => {
    if (!currentLocation?.name) return;

    fetch(
      `http://127.0.0.1:8001/api/sensors/latest?location=${encodeURIComponent(
        currentLocation.name
      )}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Sensor API returned ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const readings = Array.isArray(data)
          ? data
          : data.latest_sensor_readings || data.latest_readings || [];

        const getValue = (type) => {
          const reading = readings.find(
            (item) =>
              item.sensor_type?.toLowerCase() === type.toLowerCase()
          );
          return reading ? Number(reading.value) : 0;
        };

        setSensorData({
          rainfall: getValue("rainfall"),
          waterLevel: getValue("water_level"),
          soilMoisture: getValue("soil_moisture"),
          humidity: getValue("humidity"),
        });
      })
      .catch((error) => {
        console.error("Sensor API error:", error);
        setSensorData({
          rainfall: 0,
          waterLevel: 0,
          soilMoisture: 0,
          humidity: 0,
        });
      });
  }, [currentLocation?.name]);

  // Load weather using the selected location coordinates.
  useEffect(() => {
    if (!currentLocation) return;

    fetch(
      `http://127.0.0.1:8001/api/weather/${currentLocation.latitude}/${currentLocation.longitude}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Weather API returned ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setWeather(data);
        console.log(`Weather data for ${currentLocation.name}:`, data);
      })
      .catch((error) => {
        console.error("Weather API error:", error);
        setWeather(null);
      });
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  // Load alerts from the backend.
  useEffect(() => {
    fetch("http://127.0.0.1:8001/api/alerts")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Alerts API returned ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setLiveAlerts(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Dashboard alerts API error:", error);
        setLiveAlerts([]);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please enter your email and password.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8001/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: loginEmail.trim(),
            password: loginPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.detail || "Invalid email or password.");
        return;
      }

      localStorage.setItem(
        "resqx_user",
        JSON.stringify({
          user_id: data.user_id,
          name: data.name,
          nic: data.nic,
          email: data.email,
          role: data.role,
        })
      );

      setUserRole(data.role);
      setIsLoggedIn(true);
      setActivePage("Dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(
        "Cannot connect to RESQ-X server. Please make sure the backend is running."
      );
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    const name = registerName.trim();
    const nic = registerNic.trim();
    const email = registerEmail.trim();

    if (!name || !nic || !email || !registerPassword || !registerConfirmPassword) {
      setRegisterError("Please fill in all required fields.");
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError("Password must be at least 6 characters.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8001/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            nic,
            email,
            password: registerPassword,
            confirm_password: registerConfirmPassword,
            role: registerRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.detail || "Registration failed.");
        return;
      }

      setRegisterSuccess(
        "Registration successful! You can now sign in with your email and password."
      );

      setLoginEmail(email);
      setLoginPassword("");
      setRegisterName("");
      setRegisterNic("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");

      setTimeout(() => {
        setShowRegister(false);
        setRegisterSuccess("");
        setLoginError("");
      }, 1200);
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError(
        "Cannot connect to RESQ-X server. Please make sure the backend is running."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("resqx_user");
    setShowPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);

    setIsLoggedIn(false);
    setUserRole(null);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
  };

  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="splash-logo">
            <Shield size={58} />
          </div>

          <h1>RESQ-X</h1>

          <p>Disaster Intelligence</p>

          <span>Protect • Predict • Respond</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <div className="login-screen">
          <div className="login-card">
            <div className="login-brand">
              <div className="login-logo"><Shield size={30} /></div>
              <div><h1>RESQ-X</h1><span>Disaster Intelligence</span></div>
            </div>

            <div className="login-heading">
              <span className="section-label">CREATE ACCOUNT</span>
              <h2>Register for RESQ-X</h2>
              <p>Create your account to access environmental monitoring, emergency alerts and safety information.</p>
            </div>

            <form className="login-form" onSubmit={handleRegister}>
              <label>
                <span>Full name</span>
                <input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="Enter your full name" autoComplete="name" />
              </label>

              <label>
                <span>NIC</span>
                <input type="text" value={registerNic} onChange={(e) => setRegisterNic(e.target.value)} placeholder="Enter your NIC number" autoComplete="off" />
              </label>

              <label>
                <span>Email address</span>
                <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </label>

              <label>
                <span>Password</span>
                <div className="password-input-wrapper" style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    style={{ width: "100%", paddingRight: "48px", boxSizing: "border-box" }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                    aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                    title={showRegisterPassword ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", padding: "5px", margin: 0, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}
                  >
                    {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label>
                <span>Confirm password</span>
                <div className="password-input-wrapper" style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    style={{ width: "100%", paddingRight: "48px", boxSizing: "border-box" }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", padding: "5px", margin: 0, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <div className="role-selector">
                <button type="button" className={registerRole === "user" ? "role-option active" : "role-option"} onClick={() => setRegisterRole("user")}>
                  <Users size={22} />
                  <div><strong>Normal User</strong><span>For community members</span></div>
                </button>
                <button type="button" className={registerRole === "shelter" ? "role-option active" : "role-option"} onClick={() => setRegisterRole("shelter")}>
                  <Shield size={22} />
                  <div><strong>Shelter Staff</strong><span>For shelter management</span></div>
                </button>
              </div>

              {registerError && (
                <div className="login-error">
                  <AlertTriangle size={16} /><span>{registerError}</span>
                </div>
              )}

              {registerSuccess && (
                <div className="login-success">
                  <Shield size={16} /><span>{registerSuccess}</span>
                </div>
              )}

              <button type="submit" className="login-button">
                Create Account <ChevronRight size={17} />
              </button>
            </form>

            <div className="login-demo-note">
              <Shield size={15} />
              <span>
                Already have an account?{" "}
                <button type="button" onClick={() => { setShowRegister(false); setRegisterError(""); setRegisterSuccess(""); }} style={{ border: "none", background: "transparent", padding: 0, margin: 0, color: "inherit", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                  Sign in
                </button>
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo"><Shield size={30} /></div>
            <div><h1>RESQ-X</h1><span>Disaster Intelligence</span></div>
          </div>

          <div className="login-heading">
            <span className="section-label">SECURE ACCESS</span>
            <h2>Welcome to RESQ-X</h2>
            <p>Sign in to access environmental monitoring, emergency alerts and safety information.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              <span>Email address</span>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>

            <label>
              <span>Password</span>
              <div className="password-input-wrapper" style={{ position: "relative", width: "100%" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ width: "100%", paddingRight: "48px", boxSizing: "border-box" }}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", padding: "5px", margin: 0, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {loginError && (
              <div className="login-error">
                <AlertTriangle size={16} /><span>{loginError}</span>
              </div>
            )}

            <button type="submit" className="login-button">
              Sign In <ChevronRight size={17} />
            </button>
          </form>

          <div className="login-demo-note">
            <Shield size={15} />
            <span>
              Don't have an account?{" "}
              <button type="button" onClick={() => { setShowRegister(true); setLoginError(""); }} style={{ border: "none", background: "transparent", padding: 0, margin: 0, color: "inherit", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                Register now
              </button>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside
        className={`sidebar ${
          mobileMenu ? "open" : ""
        }`}
      >

        {/* BRAND */}

        <div className="brand">

          <div className="brand-icon">
            <Shield size={25} />
          </div>

          <div>
            <h1>RESQ-X</h1>
            <span>Disaster Intelligence</span>
          </div>

          <button
            className="close-menu"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>

        </div>


        {/* NAVIGATION */}

        <nav>

          {navigation.map((item) => {

            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setMobileMenu(false);
                }}
              >

                <Icon size={19} />

                <span>
                  {item.name}
                </span>

              </button>
            );

          })}

        </nav>


        {/* SYSTEM STATUS */}

        <div className="sidebar-bottom">

          <div className="system-status">

            <span className="status-dot"></span>

            <div>
              <strong>System Online</strong>
              <small>All services operational</small>
            </div>

          </div>

        </div>

      </aside>


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main className="main">

        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="topbar">

          <button
            className="menu-button"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Menu size={23} />
          </button>


          <div>

            <p className="eyebrow">
              RESQ-X / {activePage}
            </p>

            <h2>
              {activePage}
            </h2>

          </div>


          {/* TOPBAR RIGHT */}

          <div className="topbar-right">

            {/* LOCATION SELECTOR */}

            <div className="location">

              <MapPin size={17} />

              <select
                value={selectedLocation}
                onChange={(e) =>
                  setSelectedLocation(e.target.value)
                }
                aria-label="Select monitored location"
              >

                {locations.map((item) => (

                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}, Sri Lanka
                  </option>

                ))}

              </select>

            </div>


            {/* NOTIFICATIONS */}

            {/* NOTIFICATIONS */}

<div className="user-role-badge">
  {userRole === "shelter" ? <Shield size={15} /> : <Users size={15} />}
  <span>
    {userRole === "shelter" ? "Shelter Staff" : "Normal User"}
  </span>
</div>

<div className="notification-wrapper">

  <button
    className="notification"
    type="button"
    aria-label="Notifications"
    onClick={() => setShowNotifications(!showNotifications)}
  >
    <Bell size={19} />
    <span className="notification-dot"></span>
  </button>

  {showNotifications && (
    <div className="notification-panel">

      <div className="notification-header">
        <strong>Notifications</strong>
        <span>LIVE</span>
      </div>

      {liveAlerts
        .filter(
          (alert) =>
            !currentLocation?.name ||
            alert.location?.toLowerCase() === currentLocation.name.toLowerCase()
        )
        .slice(0, 3)
        .map((alert) => {
          const level = alert.risk_level?.toLowerCase() || "medium";

          return (
            <div className={`notification-item ${level}`} key={alert.id}>
              <div className="notification-icon">
                {level === "high" || level === "critical" ? (
                  <AlertTriangle size={16} />
                ) : (
                  <Waves size={16} />
                )}
              </div>

              <div>
                <strong>
                  {alert.disaster_type || "Environmental"} Risk Detected
                </strong>
                <span>
                  {alert.message ||
                    alert.recommended_action ||
                    "Risk condition detected."}
                </span>
                <small>
                  {alert.created_at
                    ? new Date(alert.created_at).toLocaleString()
                    : "Just now"}
                </small>
              </div>
            </div>
          );
        })}

      {liveAlerts.filter(
        (alert) =>
          !currentLocation?.name ||
          alert.location?.toLowerCase() === currentLocation.name.toLowerCase()
      ).length === 0 && (
        <div className="notification-item">
          <div className="notification-icon">
            <Shield size={16} />
          </div>
          <div>
            <strong>No active alerts</strong>
            <span>No alerts are currently available for this location.</span>
          </div>
        </div>
      )}

      <button
        className="notification-view-all"
        type="button"
        onClick={() => {
          setShowNotifications(false);
          setActivePage("Alerts");
        }}
      >
        View all alerts
        <ChevronRight size={14} />
      </button>

    </div>
  )}

</div>

            <button
              className="logout-button"
              type="button"
              onClick={handleLogout}
              title="Log out"
            >
              Log out
            </button>

          </div>

        </header>


        {/* =================================================
            DASHBOARD
            ================================================= */}

        {activePage === "Dashboard" && (
  <Dashboard
  location={currentLocation}
  setActivePage={setActivePage}
  sensorData={sensorData}
  alerts={liveAlerts}
/>
)}


        {/* =================================================
            LIVE MONITORING
            ================================================= */}

        {activePage === "Live Monitoring" && (
          <Monitoring
            location={currentLocation}
            sensorData={sensorData}
          />
        )}


        {/* =================================================
            REAL RISK MAP
            ================================================= */}

        {activePage === "Risk Map" && (
          <RiskMap
            location={currentLocation}
          />
        )}


        {/* =================================================
            ALERTS
            ================================================= */}

        {activePage === "Alerts" && (
  <Alerts
    location={currentLocation}
    setActivePage={setActivePage}
  />
)}


        {/* =================================================
            SHELTERS
            ================================================= */}

        {activePage === "Shelters" && (
          <SheltersPage
            location={currentLocation}
          />
        )}


        {/* =================================================
            COMMUNITY REPORTS
            ================================================= */}

        {activePage === "Community Reports" && (
          <ReportsPage
            location={currentLocation}
          />
        )}


        {/* =================================================
            ANALYTICS
            ================================================= */}

        {activePage === "Analytics" && (
          <AnalyticsPage
            location={currentLocation}
            sensorData={sensorData}
          />
        )}

        {activePage === "Shelter Management" && userRole === "shelter" && (
          <ShelterManagement />
        )}

      </main>

    </div>
  );
}


/* =========================================================
   SHELTER MANAGEMENT
   ========================================================= */

function ShelterManagement() {
  const [shelterName, setShelterName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [available, setAvailable] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const occupied = Math.max(
    Number(capacity || 0) - Number(available || 0),
    0
  );

  const isFull =
    capacity !== "" &&
    available !== "" &&
    Number(available) <= 0;

  const handleSave = (e) => {
    e.preventDefault();
    setMessage("Shelter information saved locally. Database update will be connected next.");
  };

  return (
    <div className="content">
      <section className="page-intro">
        <span className="section-label">SHELTER OPERATIONS</span>
        <h3>Shelter Management</h3>
        <p>Manage shelter information and current emergency accommodation availability.</p>
      </section>

      <section className="panel" style={{ maxWidth: "900px" }}>
        <div className="panel-title">
          <div>
            <span className="section-label">SHELTER INFORMATION</span>
            <h4>Update Shelter Details</h4>
          </div>
          <Shield size={22} />
        </div>

        <form className="login-form" onSubmit={handleSave}>
          <label>
            <span>Shelter name</span>
            <input
              type="text"
              value={shelterName}
              onChange={(e) => setShelterName(e.target.value)}
              placeholder="Enter shelter name"
              required
            />
          </label>

          <label>
            <span>Location</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter shelter location"
              required
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
            <label>
              <span>Capacity</span>
              <input
                type="number"
                min="0"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Total capacity"
                required
              />
            </label>

            <label>
              <span>Available spaces</span>
              <input
                type="number"
                min="0"
                max={capacity || undefined}
                value={available}
                onChange={(e) => setAvailable(e.target.value)}
                placeholder="Available spaces"
                required
              />
            </label>
          </div>

          <label>
            <span>Contact</span>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Shelter contact number"
            />
          </label>

          <div className="panel" style={{ marginTop: "8px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
              <div>
                <span className="section-label">OCCUPIED SPACES</span>
                <h4 style={{ margin: "6px 0 0" }}>{occupied}</h4>
              </div>
              <div>
                <span className="section-label">CURRENT STATUS</span>
                <h4 style={{ margin: "6px 0 0" }}>
                  {isFull ? "FULL" : "OPEN"}
                </h4>
              </div>
            </div>
          </div>

          {message && (
            <div className="login-success">
              <Shield size={16} />
              <span>{message}</span>
            </div>
          )}

          <button type="submit" className="login-button">
            Save Shelter Details <ChevronRight size={17} />
          </button>
        </form>
      </section>
    </div>
  );
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({ location, setActivePage, sensorData, alerts = [] }) {
  const rainfall = Number(sensorData?.rainfall) || 0;
  const waterLevel = Number(sensorData?.waterLevel) || 0;
  const soilMoisture = Number(sensorData?.soilMoisture) || 0;

  const rainfallScore = Math.min((rainfall / 150) * 100, 100);
  const waterScore = Math.min((waterLevel / 150) * 100, 100);
  const riskScore = Math.round(
    rainfallScore * 0.4 + waterScore * 0.4 + soilMoisture * 0.2
  );

  const riskLevel =
    riskScore >= 75
      ? "CRITICAL"
      : riskScore >= 50
      ? "HIGH"
      : riskScore >= 25
      ? "MEDIUM"
      : "LOW";

  const riskMessage =
    riskLevel === "CRITICAL"
      ? "Immediate evacuation recommended"
      : riskLevel === "HIGH"
      ? "Prepare for evacuation"
      : riskLevel === "MEDIUM"
      ? "Stay alert and monitor conditions"
      : "Environmental conditions are relatively safe";

  const locationAlerts = alerts.filter(
    (alert) =>
      !location?.name ||
      alert.location?.toLowerCase() === location.name.toLowerCase()
  );



  return (
    <div className="content">

      {/* HERO */}

      <section className="hero">

        <div>

          <div className="live-badge">
            <span></span>
            LIVE MONITORING
          </div>

          <h3>
            Disaster risk intelligence
            <br />
            for safer communities.
          </h3>

          <p>
            RESQ-X combines environmental monitoring and
            AI-assisted risk assessment to turn changing
            conditions into actionable emergency information.
          </p>

        </div>



        {/* HERO LOCATION */}

        <div className="hero-location">

          <MapPin size={18} />

          <div>

            <span>
              MONITORED LOCATION
            </span>

            <strong>
              {location?.name || "Batticaloa"}
            </strong>

          </div>

        </div>

      </section>


      {/* SENSOR CARDS */}

      <section className="sensor-grid">

        <SensorCard
          icon={<Droplets />}
          label="Rainfall"
          value={sensorData.rainfall}
          unit="mm"
          note="Last 1 hour"
        />

        <SensorCard
          icon={<Waves />}
          label="Water Level"
          value={sensorData.waterLevel}
          unit="cm"
          note="Rising"
          danger
        />

        <SensorCard
          icon={<Mountain />}
          label="Soil Moisture"
          value={sensorData.soilMoisture}
          unit="%"
          note="High saturation"
          warning
        />

        <div className="risk-card">

          <div className="card-top">

            <span>
              AI RISK ASSESSMENT
            </span>

            <AlertTriangle size={20} />

          </div>


          <div className="risk-main">

            <div className="risk-score">
              {riskScore}
            </div>

            <div>
              <strong>
                {riskLevel} RISK
              </strong>

              <span>
                {riskMessage}
              </span>
            </div>

          </div>


          <div className="risk-bar">

            <div
              style={{
                width: `${riskScore}%`,
              }}
            ></div>

          </div>

        </div>

      </section>


      {/* DASHBOARD GRID */}

      <section className="dashboard-grid">

        {/* MAP PREVIEW */}

        <div className="panel map-panel">

          <PanelHeader
  title="Risk Map"
  action="View full map"
  onClick={() => setActivePage("Risk Map")}
/>
         <div className="dashboard-real-map">

  <MapContainer
    center={[
      location?.latitude || 7.2906,
      location?.longitude || 80.6337
    ]}
    zoom={12}
    scrollWheelZoom={false}
    style={{ height: "100%", width: "100%" }}
  >

    <TileLayer
      attribution='&copy; OpenStreetMap contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    <Marker
      position={[
        location?.latitude || 7.2906,
        location?.longitude || 80.6337
      ]}
    >
      <Popup>
        <strong>
          {location?.name || "Kandy"}
        </strong>
        <br />
        Monitored location
      </Popup>
    </Marker>

    <Circle
      center={[
        location?.latitude || 7.2906,
        location?.longitude || 80.6337
      ]}
      radius={1500}
      pathOptions={{
        color: "#ef6b6b",
        fillColor: "#ef6b6b",
        fillOpacity: 0.18
      }}
    />

  </MapContainer>

  <div className="map-status-badge">
    <span></span>
    LIVE MAP
  </div>

</div>

        </div>


        {/* ACTIVE ALERTS */}

        <div className="panel">

          <PanelHeader
  title="Active Alerts"
  action="View all"
  onClick={() => setActivePage("Alerts")}
/>

          <div className="alert-list">
            {locationAlerts.length > 0 ? (
              locationAlerts.slice(0, 3).map((alert) => {
                const level = alert.risk_level?.toLowerCase() || "low";

                return (
                  <div
                    className="alert-item"
                    key={alert.id || `${alert.location}-${alert.created_at}`}
                  >
                    <div className={`alert-icon ${level}`}>
                      <AlertTriangle size={18} />
                    </div>

                    <div className="alert-info">
                      <strong>
                        {alert.disaster_type || "Environmental"} Risk Detected
                      </strong>

                      <span>
                        <MapPin size={13} />
                        {alert.location || location?.name}
                      </span>

                      <small>
                        {alert.created_at
                          ? new Date(alert.created_at).toLocaleString()
                          : "Just now"}
                      </small>
                    </div>

                    <span className={`level ${level}`}>
                      {alert.risk_level || "LOW"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="alert-item">
                <div className="alert-icon low">
                  <Shield size={18} />
                </div>

                <div className="alert-info">
                  <strong>No active alerts</strong>
                  <span>
                    <MapPin size={13} />
                    {location?.name || "Selected location"}
                  </span>
                  <small>Monitoring active</small>
                </div>

                <span className="level low">LOW</span>
              </div>
            )}
          </div>

        </div>

      </section>


      {/* BOTTOM GRID */}

      <section className="dashboard-grid bottom-grid">

        {/* SHELTERS */}

        <div className="panel">

          <PanelHeader
  title="Emergency Shelters"
  action="View all"
  onClick={() => setActivePage("Shelters")}
/>

          {shelters.map((shelter) => (

            <div
              className="shelter-item"
              key={shelter.name}
            >

              <div className="shelter-icon">

                <Shield size={18} />

              </div>


              <div className="shelter-info">

                <strong>
                  {shelter.name}
                </strong>

                <span>

                  <MapPin size={13} />

                  {shelter.location}

                </span>

              </div>


              <div className="shelter-capacity">

                <strong>
                  {shelter.available}
                </strong>

                <span>
                  / {shelter.capacity} spaces
                </span>

              </div>

            </div>

          ))}

        </div>


        {/* EMERGENCY GUIDANCE */}

        <div className="panel action-panel">

          <div className="panel-title">

            <div>

              <span className="section-label">
                EMERGENCY GUIDANCE
              </span>

              <h4>
                What should you do?
              </h4>

            </div>

            <Navigation size={20} />

          </div>


          <div className="guidance">

            <div className="guidance-number">
              01
            </div>

            <div>

              <strong>
                Stay alert
              </strong>

              <p>
                Monitor official warnings and
                RESQ-X updates.
              </p>

            </div>

          </div>


          <div className="guidance">

            <div className="guidance-number">
              02
            </div>

            <div>

              <strong>
                Prepare to evacuate
              </strong>

              <p>
                Keep essential items ready and
                follow local guidance.
              </p>

            </div>

          </div>


          <div className="guidance">

            <div className="guidance-number">
              03
            </div>

            <div>

              <strong>
                Move to safety
              </strong>

              <p>
                Use the nearest designated
                emergency shelter.
              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
  );

  function FixMapSize() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}
}

/* =========================================================
   SOR CARD
   ========================================================= */

function SensorCard({
  icon,
  label,
  value,
  unit,
  note,
  danger,
  warning,
}) {

  return (
    <div className="sensor-card">

      <div className="card-top">

        <div className="sensor-icon">
          {icon}
        </div>

        <span
          className={
            danger
              ? "danger-text"
              : warning
              ? "warning-text"
              : ""
          }
        >
          {note}
        </span>

      </div>


      <div className="sensor-value">

        {value}

        <small>
          {unit}
        </small>

      </div>


      <div className="sensor-label">
        {label}
      </div>

    </div>
  );
}


/* =========================================================
   PANEL HEADER
   ========================================================= */

function PanelHeader({
  title,
  action,
  onClick,
}) {

  return (
    <div className="panel-header">

      <h4>
        {title}
      </h4>

      <button onClick={onClick}>
  {action}
  <ChevronRight size={15} />
</button>

    </div>
  );
}


/* =========================================================
   LIVE MONITORING
   ========================================================= */

function Monitoring({ location, sensorData }) {
  const rainfall = Number(sensorData?.rainfall) || 0;
  const waterLevel = Number(sensorData?.waterLevel) || 0;
  const soilMoisture = Number(sensorData?.soilMoisture) || 0;
  const humidity = Number(sensorData?.humidity) || 0;

  return (
    <div className="content">

      {/* PAGE INTRO */}

      <section className="page-intro">

        <span className="section-label">
          REAL-TIME DATA
        </span>

        <h3>
          Live Environmental Monitoring
        </h3>

        <p>
          Monitor environmental conditions and
          sensor activity in real time.
        </p>

        <div className="live-badge">

          <span></span>

          ALL SYSTEMS ONLINE

        </div>

      </section>


      {/* SENSOR CARDS */}

      <section className="sensor-grid large">

        <SensorCard
          icon={<Droplets />}
          label="Rainfall"
          value={rainfall}
          unit="mm"
          note="LIVE"
        />

        <SensorCard
          icon={<Waves />}
          label="Water Level"
          value={waterLevel}
          unit="cm"
          note="RISING"
          danger
        />

        <SensorCard
          icon={<Mountain />}
          label="Soil Moisture"
          value={soilMoisture}
          unit="%"
          note="HIGH"
          warning
        />

        <SensorCard
          icon={<Wind />}
          label="Humidity"
          value={humidity}
          unit="%"
          note="NORMAL"
        />

      </section>


      {/* ENVIRONMENTAL TRENDS */}

      <div className="panel chart-panel">

        <PanelHeader
          title="Environmental Trends"
          action="Last 24 hours"
        />


        {/* TREND SUMMARY */}

        <div className="trend-summary">

          <div className="trend-item">

            <span className="trend-indicator rainfall"></span>

            <div>

              <strong>
                Rainfall
              </strong>

              <span>
                {rainfall} mm
              </span>

            </div>

          </div>


          <div className="trend-item">

            <span className="trend-indicator water"></span>

            <div>

              <strong>
                Water Level
              </strong>

              <span>
                {waterLevel} cm
              </span>

            </div>

          </div>


          <div className="trend-item">

            <span className="trend-indicator soil"></span>

            <div>

              <strong>
                Soil Moisture
              </strong>

              <span>
                {soilMoisture}%
              </span>

            </div>

          </div>


          <div className="trend-item">

            <span className="trend-indicator humidity"></span>

            <div>

              <strong>
                Humidity
              </strong>

              <span>
                {humidity}%
              </span>

            </div>

          </div>

        </div>


        {/* CHART */}

        <div className="environment-chart">

          <div className="chart-y-axis">

            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>

          </div>


          <div className="chart-area">

            <div className="chart-grid-line"></div>
            <div className="chart-grid-line"></div>
            <div className="chart-grid-line"></div>
            <div className="chart-grid-line"></div>
            <div className="chart-grid-line"></div>


            <svg
              className="trend-svg"
              viewBox="0 0 900 260"
              preserveAspectRatio="none"
            >

              {/* RAINFALL */}

              <polyline
                points="0,190 90,175 180,205 270,150 360,165 450,120 540,135 630,90 720,105 810,65 900,80"
                fill="none"
                stroke="#55c8ed"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />


              {/* WATER LEVEL */}

              <polyline
                points="0,210 90,200 180,185 270,190 360,160 450,170 540,145 630,155 720,125 810,140 900,110"
                fill="none"
                stroke="#e4b75c"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />


              {/* SOIL MOISTURE */}

              <polyline
                points="0,145 90,135 180,150 270,125 360,130 450,110 540,115 630,95 720,100 810,85 900,90"
                fill="none"
                stroke="#58cf9a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />


              {/* HUMIDITY */}

              <polyline
                points="0,120 90,105 180,125 270,95 360,110 450,85 540,100 630,70 720,85 810,60 900,75"
                fill="none"
                stroke="#b58be8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

            </svg>


            {/* TIME LABELS */}

            <div className="chart-labels">

              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>Now</span>

            </div>

          </div>

        </div>


        {/* CHART STATUS */}

        <div className="chart-status">

          <span className="status-live-dot"></span>

          <span>
            Live environmental data
          </span>

          <span className="chart-update">
            Updated just now
          </span>

        </div>

      </div>


      {/* SENSOR NETWORK */}

      <div className="panel sensor-status-panel">

        <PanelHeader
          title="Sensor Network"
          action="4 sensors online"
        />


        <div className="sensor-network">

          {/* RAINFALL */}

          <div className="network-item">

            <span className="network-dot"></span>

            <div>

              <strong>
                Rainfall
              </strong>

              <span>
                Connected
              </span>

            </div>

            <span className="network-time">
              Updated now
            </span>

          </div>


          {/* WATER LEVEL */}

          <div className="network-item">

            <span className="network-dot"></span>

            <div>

              <strong>
                Water Level
              </strong>

              <span>
                Connected
              </span>

            </div>

            <span className="network-time">
              Updated now
            </span>

          </div>


          {/* SOIL MOISTURE */}

          <div className="network-item">

            <span className="network-dot"></span>

            <div>

              <strong>
                Soil Moisture
              </strong>

              <span>
                Connected
              </span>

            </div>

            <span className="network-time">
              Updated now
            </span>

          </div>


          {/* HUMIDITY */}

          <div className="network-item">

            <span className="network-dot"></span>

            <div>

              <strong>
                Humidity
              </strong>

              <span>
                Connected
              </span>

            </div>

            <span className="network-time">
              Updated now
            </span>

          </div>

        </div>

      </div>


      {/* LAST UPDATED */}

      <div className="last-updated">

        <span></span>

        All sensor data updated just now

      </div>

    </div>
  );
}


/* =========================================================
   ALERTS PAGE
   ========================================================= */
function Alerts({ location, setActivePage }) {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("All");

  // LOAD ALERTS FROM BACKEND
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/alerts")
      .then((response) => response.json())
      .then((data) => {
        setAlerts(data);
        console.log("Alerts data:", data);
      })
      .catch((error) => {
        console.error("Failed to load alerts:", error);
      });
  }, [location?.name]);

  const locationAlerts = alerts.filter(
    (alert) =>
      !location?.name ||
      alert.location?.toLowerCase() === location.name.toLowerCase()
  );

  const filteredAlerts =
    filter === "All"
      ? locationAlerts
      : locationAlerts.filter(
          (alert) =>
            alert.risk_level?.toUpperCase() === filter
        );

  const highCount = locationAlerts.filter(
    (alert) =>
      alert.risk_level?.toUpperCase() === "HIGH"
  ).length;

  const mediumCount = locationAlerts.filter(
    (alert) =>
      alert.risk_level?.toUpperCase() === "MEDIUM"
  ).length;

  const lowCount = locationAlerts.filter(
    (alert) =>
      alert.risk_level?.toUpperCase() === "LOW"
  ).length;

  return (
    <div className="content">

      {/* PAGE INTRO */}
      <section className="page-intro">

        <span className="section-label">
          EMERGENCY MANAGEMENT
        </span>

        <h3>
          Alerts & Warnings
        </h3>

        <p>
          Monitor environmental warnings and risk
          conditions detected by the RESQ-X system.
        </p>

      </section>


      {/* ALERT SUMMARY */}
      <section className="alert-summary-grid">

        {/* HIGH */}
        <div className="alert-summary-card high">

          <div className="alert-summary-icon">
            <AlertTriangle size={19} />
          </div>

          <div>
            <span>HIGH PRIORITY</span>

            <strong>
              {highCount}
            </strong>

            <small>
              Requires attention
            </small>
          </div>

        </div>


        {/* MEDIUM */}
        <div className="alert-summary-card medium">

          <div className="alert-summary-icon">
            <AlertTriangle size={19} />
          </div>

          <div>
            <span>MEDIUM PRIORITY</span>

            <strong>
              {mediumCount}
            </strong>

            <small>
              Continue monitoring
            </small>
          </div>

        </div>


        {/* LOW */}
        <div className="alert-summary-card low">

          <div className="alert-summary-icon">
            <Bell size={19} />
          </div>

          <div>
            <span>LOW PRIORITY</span>

            <strong>
              {lowCount}
            </strong>

            <small>
              Informational
            </small>
          </div>

        </div>


        {/* SYSTEM */}
        <div className="alert-summary-card system">

          <div className="alert-summary-icon">
            <Shield size={19} />
          </div>

          <div>
            <span>SYSTEM STATUS</span>

            <strong>
              ONLINE
            </strong>

            <small>
              Monitoring active
            </small>
          </div>

        </div>

      </section>


      {/* ALERT LIST */}
      <section className="panel alerts-main-panel">

        <div className="alerts-toolbar">

          <div>

            <span className="section-label">
              LIVE ALERT FEED
            </span>

            <h4>
              Active Warnings
            </h4>

          </div>


          {/* FILTERS */}
          <div className="alert-filters">

            {["All", "HIGH", "MEDIUM", "LOW"].map(
              (item) => (

                <button
                  key={item}
                  className={
                    filter === item
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(item)
                  }
                >
                  {item}
                </button>

              )
            )}

          </div>

        </div>


        {/* ALERTS */}
        <div className="professional-alert-list">

          {filteredAlerts.length === 0 ? (

            <div className="professional-alert">

              <div className="professional-alert-icon">
                <Shield size={20} />
              </div>

              <div className="professional-alert-content">

                <h4>
                  No active alerts
                </h4>

                <span>
                  There are currently no alerts
                  for this filter.
                </span>

              </div>

            </div>

          ) : (

            filteredAlerts.map((alert) => (

              <div
                className={`professional-alert ${
                  alert.risk_level?.toLowerCase() || "low"
                }`}
                key={alert.id}
              >

                {/* ICON */}
                <div className="professional-alert-icon">

                  <AlertTriangle size={20} />

                </div>


                {/* CONTENT */}
                <div className="professional-alert-content">

                  <div className="professional-alert-title">

                    <div>

                      <h4>
                        {alert.disaster_type} Risk Detected
                      </h4>

                      <span className="alert-location">

                        <MapPin size={13} />

                        {alert.location}

                      </span>

                    </div>


                    <span
                      className={`alert-level-badge ${
                        alert.risk_level?.toLowerCase() || "low"
                      }`}
                    >
                      {alert.risk_level}
                    </span>

                  </div>


                  {/* DETAILS */}
                  <div className="alert-details">

                    <div>

                      <span>
                        DETECTED BY
                      </span>

                      <strong>
                        Risk Assessment
                      </strong>

                    </div>


                    <div>

                      <span>
                        READING
                      </span>

                      <strong>
                        {alert.risk_score}/100
                      </strong>

                    </div>


                    <div>

                      <span>
                        TIME
                      </span>

                      <strong>
                        {alert.timestamp
                          ? new Date(
                              alert.timestamp
                            ).toLocaleString()
                          : "Just now"}
                      </strong>

                    </div>

                  </div>


                  {/* ACTION */}
                  <div className="alert-action">

                    <Shield size={14} />

                    <span>
                      Recommended action:
                    </span>

                    <strong>
                      {alert.message}
                    </strong>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </section>


      {/* EMERGENCY NOTICE */}
      <section className="emergency-notice">

        <div className="emergency-notice-icon">

          <AlertTriangle size={22} />

        </div>

        <div>

          <span className="section-label">
            EMERGENCY GUIDANCE
          </span>

          <h4>
            Follow official emergency instructions
          </h4>

          <p>
            RESQ-X alerts provide environmental
            monitoring information. In an emergency,
            follow instructions from local authorities
            and emergency services.
          </p>

        </div>

      </section>

    </div>
  );
}
/* =========================================================
   SHELTERS PAGE
   ========================================================= */

function SheltersPage({ location }) {
  const [shelterData, setShelterData] = useState([]);

  useEffect(() => {
    if (!location?.name) return;

    fetch(
      `http://127.0.0.1:8001/api/shelters?location=${encodeURIComponent(
        location.name
      )}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Shelter API returned ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : [];

        setShelterData(
          items.map((shelter) => ({
            name: shelter.name,
            area: shelter.location,
            distance: shelter.distance
              ? `${shelter.distance} km`
              : "Nearby",
            capacity: Number(shelter.capacity) || 0,
            available: Number(shelter.available) || 0,
            status:
              Number(shelter.available) > 0 ? "AVAILABLE" : "FULL",
            type: shelter.type || "Emergency Shelter",
            latitude: shelter.latitude,
            longitude: shelter.longitude,
          }))
        );
      })
      .catch((error) => {
        console.error("Shelter API error:", error);
        setShelterData([]);
      });
  }, [location?.name]);

  const availableShelters = shelterData.filter(
    (shelter) => shelter.available > 0
  ).length;

  const availableSpaces = shelterData.reduce(
    (total, shelter) => total + shelter.available,
    0
  );

  const nearestShelter = shelterData[0];

  return (
    <div className="content">

      {/* PAGE INTRO */}

      <section className="page-intro">

        <span className="section-label">
          EVACUATION SUPPORT
        </span>

        <h3>
          Emergency Shelters
        </h3>

        <p>
          Find nearby emergency shelters and monitor
          their current availability.
        </p>

      </section>


      {/* LOCATION NOTICE */}

      <div className="shelter-location-bar">

        <div>
          <MapPin size={17} />

          <div>
            <span>SEARCHING NEAR</span>

            <strong>
              {location?.name || "Batticaloa"}, Sri Lanka
            </strong>
          </div>
        </div>

        <span className="live-badge">
          <span></span>
          LIVE AVAILABILITY
        </span>

      </div>


      {/* SUMMARY */}

      <section className="shelter-summary-grid">

        <div className="panel shelter-summary-card">

          <div className="shelter-summary-icon">
            <Shield size={19} />
          </div>

          <div>
            <span>AVAILABLE SHELTERS</span>
            <strong>{availableShelters}</strong>
            <small>Ready for evacuation</small>
          </div>

        </div>


        <div className="panel shelter-summary-card">

          <div className="shelter-summary-icon">
            <Users size={19} />
          </div>

          <div>
            <span>AVAILABLE SPACES</span>
            <strong>{availableSpaces}</strong>
            <small>Total remaining capacity</small>
          </div>

        </div>


        <div className="panel shelter-summary-card">

          <div className="shelter-summary-icon">
            <Navigation size={19} />
          </div>

          <div>
            <span>NEAREST SHELTER</span>
            <strong>{nearestShelter?.distance || "—"}</strong>
            <small>Estimated distance</small>
          </div>

        </div>

      </section>


      {/* SHELTER LIST */}

      <section className="panel shelters-main-panel">

        <div className="panel-header">

          <div>

            <span className="section-label">
              SHELTER NETWORK
            </span>

            <h4>
              Safe Locations
            </h4>

          </div>

          <span className="shelter-count">
            {shelterData.length} locations
          </span>

        </div>


        <div className="professional-shelter-list">

          {shelterData.map((shelter) => {

            const occupied =
              shelter.capacity -
              shelter.available;

            const occupancy =
              Math.round(
                (occupied / shelter.capacity) * 100
              );

            return (
              <div
                className="professional-shelter"
                key={shelter.name}
              >

                {/* ICON */}

                <div className="professional-shelter-icon">

                  <Shield size={21} />

                </div>


                {/* INFORMATION */}

                <div className="professional-shelter-content">

                  <div className="professional-shelter-title">

                    <div>

                      <span className="section-label">
                        {shelter.type}
                      </span>

                      <h4>
                        {shelter.name}
                      </h4>

                      <span className="shelter-location">

                        <MapPin size={13} />

                        {shelter.area}

                      </span>

                    </div>


                    <span
                      className={`shelter-status ${
                        shelter.status.toLowerCase()
                      }`}
                    >
                      {shelter.status}
                    </span>

                  </div>


                  {/* CAPACITY */}

                  <div className="shelter-capacity-section">

                    <div className="capacity-heading">

                      <span>
                        Occupancy
                      </span>

                      <strong>
                        {occupancy}%
                      </strong>

                    </div>


                    <div className="shelter-capacity-bar">

                      <div
                        style={{
                          width: `${occupancy}%`,
                        }}
                      ></div>

                    </div>


                    <div className="capacity-numbers">

                      <span>
                        {occupied} occupied
                      </span>

                      <strong>
                        {shelter.available} spaces available
                      </strong>

                    </div>

                  </div>


                  {/* FOOTER */}

                  <div className="shelter-footer">

                    <span>

                      <Navigation size={13} />

                      {shelter.distance}

                    </span>


                    <button className="shelter-action">

                      View Location

                      <ChevronRight size={14} />

                    </button>

                  </div>

                </div>

              </div>
            );
          })}

        </div>

      </section>


      {/* EMERGENCY INFORMATION */}

      <section className="emergency-notice">

        <div className="emergency-notice-icon">

          <Shield size={21} />

        </div>

        <div>

          <span className="section-label">
            EVACUATION GUIDANCE
          </span>

          <h4>
            Move to the nearest designated safe location
          </h4>

          <p>
            During an emergency, follow instructions from
            local authorities. Keep essential documents,
            medication and emergency supplies with you.
          </p>

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   COMMUNITY REPORTS
   ========================================================= */

function ReportsPage({ location }) {
  const [submitted, setSubmitted] = useState(false);
  const [hazardType, setHazardType] = useState("Flooding");
  const [reportLocation, setReportLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    setSubmitted(true);

    setReportLocation("");
    setDescription("");
  };

  return (
    <div className="content">

      {/* PAGE INTRO */}

      <section className="page-intro">

        <span className="section-label">
          COMMUNITY INTELLIGENCE
        </span>

        <h3>
          Community Reports
        </h3>

        <p>
          Report flooding, landslides, blocked roads and
          other environmental hazards in your community.
        </p>

      </section>


      {/* LOCATION */}

      <div className="report-location-bar">

        <MapPin size={17} />

        <div>

          <span>
            MONITORED REGION
          </span>

          <strong>
            {location?.name || "Batticaloa"}, Sri Lanka
          </strong>

        </div>

      </div>


      {/* REPORT AREA */}

      {!submitted ? (

        <section className="report-layout">

          {/* FORM */}

          <div className="panel report-form-panel">

            <div className="panel-header">

              <div>

                <span className="section-label">
                  SUBMIT OBSERVATION
                </span>

                <h4>
                  Report an Environmental Hazard
                </h4>

              </div>

              <AlertTriangle size={20} />

            </div>


            <form
              className="community-report-form"
              onSubmit={handleSubmit}
            >

              {/* HAZARD TYPE */}

              <label>

                <span>
                  Hazard Type
                </span>

                <select
                  value={hazardType}
                  onChange={(e) =>
                    setHazardType(e.target.value)
                  }
                >

                  <option>Flooding</option>
                  <option>Landslide</option>
                  <option>Blocked Road</option>
                  <option>Heavy Rainfall</option>
                  <option>Water Level Rise</option>
                  <option>Other</option>

                </select>

              </label>


              {/* LOCATION */}

              <label>

                <span>
                  Incident Location
                </span>

                <input
                  type="text"
                  value={reportLocation}
                  onChange={(e) =>
                    setReportLocation(e.target.value)
                  }
                  placeholder="Enter the affected location"
                  required
                />

              </label>


              {/* DESCRIPTION */}

              <label>

                <span>
                  Description
                </span>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe what you observed..."
                  rows="5"
                  required
                ></textarea>

              </label>


              {/* PHOTO PLACEHOLDER */}

              <div className="report-upload">

                <div className="report-upload-icon">
                  <Navigation size={18} />
                </div>

                <div>

                  <strong>
                    Location information
                  </strong>

                  <span>
                    Your selected monitoring region will
                    be included with this report.
                  </span>

                </div>

              </div>


              {/* SUBMIT */}

              <button
                type="submit"
                className="primary-button report-submit"
              >

                Submit Community Report

                <ChevronRight size={15} />

              </button>

            </form>

          </div>


          {/* INFORMATION */}

          <div className="panel report-info-panel">

            <span className="section-label">
              WHY REPORT?
            </span>

            <h4>
              Your observation can help
            </h4>

            <p>
              Community observations can provide
              additional information about conditions
              that may not be immediately captured by
              automated sensors.
            </p>


            <div className="report-benefit">

              <div>
                01
              </div>

              <span>
                Report hazards as soon as you notice them.
              </span>

            </div>


            <div className="report-benefit">

              <div>
                02
              </div>

              <span>
                Provide an accurate location and description.
              </span>

            </div>


            <div className="report-benefit">

              <div>
                03
              </div>

              <span>
                Help emergency teams understand local conditions.
              </span>

            </div>


            <div className="report-safety">

              <Shield size={17} />

              <div>

                <strong>
                  Safety first
                </strong>

                <span>
                  Never put yourself in danger to collect
                  information or submit a report.
                </span>

              </div>

            </div>

          </div>

        </section>

      ) : (

        /* SUCCESS */

        <section className="panel report-success-card">

          <div className="report-success-icon">

            <Shield size={28} />

          </div>


          <span className="section-label">
            REPORT RECEIVED
          </span>


          <h4>
            Thank you for helping your community.
          </h4>


          <p>
            Your {hazardType.toLowerCase()} report has
            been recorded successfully.
          </p>


          <div className="report-reference">

            <span>
              REPORT STATUS
            </span>

            <strong>
              RECEIVED
            </strong>

          </div>


          <button
            className="primary-button"
            onClick={() => setSubmitted(false)}
          >
            Submit Another Report
          </button>

        </section>

      )}


      {/* GUIDANCE */}

      <section className="emergency-notice">

        <div className="emergency-notice-icon">

          <AlertTriangle size={21} />

        </div>

        <div>

          <span className="section-label">
            IMPORTANT
          </span>

          <h4>
            In an emergency, contact local emergency services.
          </h4>

          <p>
            RESQ-X community reports are intended to provide
            additional environmental information. Do not wait
            for a community report system before seeking help
            during an immediate emergency.
          </p>

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   ANALYTICS PAGE
   ========================================================= */

function AnalyticsPage({ location, sensorData }) {
  const rainfall = Number(sensorData?.rainfall) || 0;
  const waterLevel = Number(sensorData?.waterLevel) || 0;
  const soilMoisture = Number(sensorData?.soilMoisture) || 0;

  const rainfallScore = Math.min((rainfall / 150) * 100, 100);
  const waterScore = Math.min((waterLevel / 150) * 100, 100);
  const riskScore = Math.round(
    rainfallScore * 0.4 + waterScore * 0.4 + soilMoisture * 0.2
  );

  const riskLevel =
    riskScore >= 75
      ? "CRITICAL"
      : riskScore >= 50
      ? "HIGH"
      : riskScore >= 25
      ? "MEDIUM"
      : "LOW";


  return (
    <div className="content">

      {/* PAGE INTRO */}

      <section className="page-intro">

        <span className="section-label">
          DATA INTELLIGENCE
        </span>

        <h3>
          Environmental Analytics
        </h3>

        <p>
          Analyze environmental conditions and identify
          changing disaster-risk patterns for the selected region.
        </p>

      </section>


      {/* LOCATION */}

      <div className="report-location-bar">

        <MapPin size={17} />

        <div>

          <span>
            ANALYSIS REGION
          </span>

          <strong>
            {location?.name || "Batticaloa"}, Sri Lanka
          </strong>

        </div>

      </div>


      {/* KEY METRICS */}

      <section className="analytics-metrics">

        <div className="panel analytics-metric-card">

          <div className="analytics-metric-icon rainfall">
            <Droplets size={19} />
          </div>

          <div>
            <span>24H RAINFALL</span>

            <strong>
              {rainfall} <small>mm</small>
            </strong>

            <em>
              +12.4% from previous period
            </em>
          </div>

        </div>


        <div className="panel analytics-metric-card">

          <div className="analytics-metric-icon water">
            <Waves size={19} />
          </div>

          <div>
            <span>PEAK WATER LEVEL</span>

            <strong>
              {waterLevel} <small>cm</small>
            </strong>

            <em>
              Rising trend detected
            </em>
          </div>

        </div>


        <div className="panel analytics-metric-card">

          <div className="analytics-metric-icon soil">
            <Mountain size={19} />
          </div>

          <div>
            <span>SOIL MOISTURE</span>

            <strong>
              {soilMoisture} <small>%</small>
            </strong>

            <em>
              Above normal range
            </em>
          </div>

        </div>


        <div className="panel analytics-metric-card">

          <div className="analytics-metric-icon risk">
            <AlertTriangle size={19} />
          </div>

          <div>
            <span>RISK SCORE</span>

            <strong>
              {riskScore} <small>/ 100</small>
            </strong>

            <em>
              High-risk condition
            </em>
          </div>

        </div>

      </section>


      {/* TREND CHART */}

      <section className="panel analytics-chart-panel">

        <div className="panel-header">

          <div>

            <span className="section-label">
              ENVIRONMENTAL TRENDS
            </span>

            <h4>
              24-Hour Sensor Analysis
            </h4>

          </div>

          <span className="analytics-live">
            <span></span>
            LIVE
          </span>

        </div>


        <div className="analytics-chart">

          <div className="analytics-y-axis">

            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>

          </div>


          <div className="analytics-chart-area">

            <div className="analytics-grid-line"></div>
            <div className="analytics-grid-line"></div>
            <div className="analytics-grid-line"></div>
            <div className="analytics-grid-line"></div>
            <div className="analytics-grid-line"></div>


            <svg
              viewBox="0 0 900 260"
              preserveAspectRatio="none"
              className="analytics-svg"
            >

              {/* RAINFALL */}

              <polyline
                points="0,190 90,175 180,205 270,150 360,165 450,120 540,135 630,90 720,105 810,65 900,80"
                fill="none"
                stroke="#55c8ed"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />


              {/* WATER LEVEL */}

              <polyline
                points="0,210 90,200 180,185 270,190 360,160 450,170 540,145 630,155 720,125 810,140 900,110"
                fill="none"
                stroke="#e4b75c"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />


              {/* SOIL */}

              <polyline
                points="0,145 90,135 180,150 270,125 360,130 450,110 540,115 630,95 720,100 810,85 900,90"
                fill="none"
                stroke="#58cf9a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

            </svg>


            <div className="analytics-x-axis">

              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>NOW</span>

            </div>

          </div>

        </div>


        {/* LEGEND */}

        <div className="analytics-legend">

          <span>
            <i className="rainfall"></i>
            Rainfall
          </span>

          <span>
            <i className="water"></i>
            Water Level
          </span>

          <span>
            <i className="soil"></i>
            Soil Moisture
          </span>

        </div>

      </section>


      {/* ANALYSIS GRID */}

      <section className="analytics-analysis-grid">

        {/* RISK ANALYSIS */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <span className="section-label">
                AI RISK ASSESSMENT
              </span>

              <h4>
                Current Risk Analysis
              </h4>

            </div>

            <AlertTriangle size={19} />

          </div>


          <div className="analytics-risk-score">

            <div className="analytics-score-circle">

              <strong>
                {riskScore}
              </strong>

              <span>
                /100
              </span>

            </div>


            <div>

              <strong>
                {riskLevel} RISK
              </strong>

              <p>
                Environmental conditions indicate an
                elevated risk level requiring continued monitoring.
              </p>

            </div>

          </div>


          <div className="analytics-risk-bar">

            <div
              style={{
                width: `${riskScore}%`,
              }}
            ></div>

          </div>


          <div className="analytics-risk-scale">

            <span>LOW</span>
            <span>MODERATE</span>
            <span>HIGH</span>

          </div>

        </div>


        {/* FACTORS */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <span className="section-label">
                CONTRIBUTING FACTORS
              </span>

              <h4>
                Risk Indicators
              </h4>

            </div>

          </div>


          <div className="risk-factor">

            <div className="risk-factor-icon">
              <Waves size={15} />
            </div>

            <div>

              <strong>
                Water Level
              </strong>

              <span>
                {waterLevel} cm · Rising
              </span>

            </div>

            <b>
              HIGH
            </b>

          </div>


          <div className="risk-factor">

            <div className="risk-factor-icon">
              <Mountain size={15} />
            </div>

            <div>

              <strong>
                Soil Moisture
              </strong>

              <span>
                {soilMoisture}% · Saturated
              </span>

            </div>

            <b>
              HIGH
            </b>

          </div>


          <div className="risk-factor">

            <div className="risk-factor-icon">
              <Droplets size={15} />
            </div>

            <div>

              <strong>
                Rainfall
              </strong>

              <span>
                {rainfall} mm · Elevated
              </span>

            </div>

            <b>
              MEDIUM
            </b>

          </div>

        </div>

      </section>


      {/* RECOMMENDATION */}

      <section className="analytics-recommendation">

        <div className="analytics-recommendation-icon">

          <Shield size={21} />

        </div>


        <div>

          <span className="section-label">
            SYSTEM RECOMMENDATION
          </span>

          <h4>
            Continue active monitoring
          </h4>

          <p>
            Current environmental indicators suggest
            continued monitoring of rainfall, water level
            and soil moisture conditions.
          </p>

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   EXPORT APP
   ========================================================= */

export default App;