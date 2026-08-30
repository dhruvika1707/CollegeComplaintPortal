import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://collegecomplaintportal-production.up.railway.app/api/complaints";

function App() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Electrical",
    location: ""
  });

  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showLogin, setShowLogin] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const [user, setUser] = useState(null);
const [adminComplaints, setAdminComplaints] = useState([]);
const [adminLoading, setAdminLoading] = useState(false);
const [adminFilter, setAdminFilter] = useState("All");
const [myComplaints, setMyComplaints] = useState([]);
const [myComplaintsLoading, setMyComplaintsLoading] = useState(false);
const fetchAdminComplaints = async () => {
  try {
    setAdminLoading(true);

    const token = localStorage.getItem("token");

    const response = await axios.get(
      "https://collegecomplaintportal-production.up.railway.app/api/complaints",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setAdminComplaints(response.data);

  } catch (error) {
    console.error("Could not fetch admin complaints:", error);
  } finally {
    setAdminLoading(false);
  }
};
const fetchMyComplaints = async () => {
  try {
    setMyComplaintsLoading(true);

    const token = localStorage.getItem("token");

    const response = await axios.get(
      "https://collegecomplaintportal-production.up.railway.app/api/complaints/my",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setMyComplaints(response.data);

  } catch (error) {
    console.error("Could not fetch my complaints:", error);
  } finally {
    setMyComplaintsLoading(false);
  }
};
  // FETCH COMPLAINTS
  const fetchComplaints = async () => {
    try {
      const response = await axios.get(API_URL);
      setComplaints(response.data);
    } catch (error) {
      console.error("Could not fetch complaints:", error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // FORM INPUT CHANGE
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // CREATE COMPLAINT
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        API_URL,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(response.data);

      setMessage("Complaint submitted successfully!");

      setFormData({
        title: "",
        description: "",
        category: "Electrical",
        location: ""
      });

      fetchComplaints();

    } catch (error) {
      console.error("Could not submit complaint:", error);

      setMessage(
        error.response?.data?.message ||
        "Could not submit complaint."
      );
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "https://collegecomplaintportal-production.up.railway.app/api/auth/login",
        loginData
      );

      localStorage.setItem("token", response.data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      setUser(response.data.user);
if (response.data.user.role === "admin") {
  fetchAdminComplaints();
} else {
  fetchMyComplaints();
}

      setShowLogin(false);

      alert(`Welcome, ${response.data.user.name}!`);

    } catch (error) {
      console.error("Login error:", error);

      alert(
        error.response?.data?.message ||
        "Login failed. Please try again."
      );
    }
  };

  // STATUS CLASS
  const getStatusClass = (status) => {
    if (status === "Resolved") return "resolved";
    if (status === "In Progress") return "progress";
    return "pending";
  };
const updateComplaint = async (id, status, adminRemarks) => {
  try {
    const token = localStorage.getItem("token");

    await axios.put(
      `https://collegecomplaintportal-production.up.railway.app/api/complaints/${id}`,
      {
        status: status,
        adminRemarks: adminRemarks
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    fetchAdminComplaints();
    fetchComplaints();

  } catch (error) {
    console.error("Could not update complaint:", error);

    alert(
      error.response?.data?.message ||
      "Could not update complaint."
    );
  }
};
  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">

        <div className="brand">

<div className="logo-mark">
  <img
    src="/campusdesk-logo.png"
    alt="CampusDesk logo"
  />
</div>

          <div>
            <h2>CampusDesk</h2>
            <span>College Complaint Portal</span>
          </div>

        </div>

        <div className="nav-links">

          <a href="#submit">
            Submit Complaint
          </a>

          <a href="#complaints">
            Complaints
          </a>

          {user ? (
            <button
              className="login-btn"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
              }}
            >
              Logout
            </button>
          ) : (
            <button
              className="login-btn"
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
          )}

        </div>

      </nav>


      {/* HERO */}
      <section className="hero">

  <div className="hero-content">

    <div className="hero-tag">
      REPORT • TRACK • RESOLVE
    </div>

    <h1>
      Your campus.
      <span>Your voice.</span>
    </h1>

    <p>
      Report campus issues easily and help make your college
      a better place for everyone.
    </p>

    <button
      className="hero-button"
      onClick={() =>
        document
          .getElementById("report")
          ?.scrollIntoView({ behavior: "smooth" })
      }
    >
      Report an issue
      <span>→</span>
    </button>



  </div>


  <div className="hero-card">

    <div className="hero-card-top">
      <div className="floating-icon">
        ✓
      </div>

      <span className="live-label">
        <i></i> LIVE / 24
      </span>
    </div>

    <h3>
      We’re
      <br />
      listening.
    </h3>

    <p>
      Every complaint is tracked from submission to
      resolution.
    </p>

    <div className="mini-status">
      <span className="status-dot"></span>
      Complaints are actively monitored
    </div>

  </div>

</section>



      {/* MAIN CONTENT */}
      <main>
    {/* MY COMPLAINTS — STUDENT ONLY */}
{user?.role !== "admin" && user && (
  <section className="my-complaints-section">

    <div className="section-heading">
      <span>02</span>

      <div>
        <h2>My complaints</h2>
        <p>Track the issues you have reported.</p>
      </div>
    </div>

    {myComplaintsLoading ? (

      <p>Loading your complaints...</p>

    ) : myComplaints.length === 0 ? (

      <div className="empty-state">
        <div>✓</div>
        <h3>No complaints yet</h3>
        <p>You haven't submitted any complaints.</p>
      </div>

    ) : (

      <div className="complaints-list">

        {myComplaints.map((complaint) => (

          <div
            className="complaint-card"
            key={complaint._id}
          >

            <div className="complaint-info">

              <span className="complaint-category">
                {complaint.category}
              </span>

              <h3>
                {complaint.title}
              </h3>

              <p>
                {complaint.location} ·{" "}
                {new Date(
                  complaint.createdAt
                ).toLocaleDateString()}
              </p>

              <p>
                {complaint.description}
              </p>
{complaint.adminRemarks && (
  <div className="admin-remark">
    <strong>Admin Remark:</strong>
    <p>{complaint.adminRemarks}</p>
  </div>
)}
            </div>

            <span
              className={`status ${getStatusClass(
                complaint.status
              )}`}
            >
              {complaint.status}
            </span>

          </div>

        ))}

      </div>

    )}

  </section>
)}    
{user?.role === "admin" && (
  <section className="admin-dashboard">

    <div className="admin-header">
      <div>
        <span className="hero-tag">ADMIN PANEL</span>
        <h2>Complaint Dashboard</h2>
        <p>Manage and resolve campus complaints.</p>
      </div>

      <div className="admin-welcome">
        👋 {user.name}
      </div>
    </div>

    <div className="admin-stats">

      <div className="stat-card">
        <span>Total</span>
        <strong>{adminComplaints.length}</strong>
      </div>

      <div className="stat-card">
        <span>Pending</span>
        <strong>
          {
            adminComplaints.filter(
              (c) => c.status === "Pending"
            ).length
          }
        </strong>
      </div>

      <div className="stat-card">
        <span>In Progress</span>
        <strong>
          {
            adminComplaints.filter(
              (c) => c.status === "In Progress"
            ).length
          }
        </strong>
      </div>

      <div className="stat-card">
        <span>Resolved</span>
        <strong>
          {
            adminComplaints.filter(
              (c) => c.status === "Resolved"
            ).length
          }
        </strong>
      </div>

    </div>


    <div className="admin-complaints">

      <h3>All Complaints</h3>
<div className="admin-filters">

  <button
    className={adminFilter === "All" ? "active" : ""}
    onClick={() => setAdminFilter("All")}
  >
    All
  </button>

  <button
    className={adminFilter === "Pending" ? "active" : ""}
    onClick={() => setAdminFilter("Pending")}
  >
    Pending
  </button>

  <button
    className={adminFilter === "In Progress" ? "active" : ""}
    onClick={() => setAdminFilter("In Progress")}
  >
    In Progress
  </button>

  <button
    className={adminFilter === "Resolved" ? "active" : ""}
    onClick={() => setAdminFilter("Resolved")}
  >
    Resolved
  </button>

</div>
      {adminLoading ? (

        <p>Loading complaints...</p>

      ) : adminComplaints.length === 0 ? (

        <div className="empty-state">
          <div>✓</div>
          <h3>No complaints found</h3>
          <p>There are currently no complaints to manage.</p>
        </div>

      ) : (

        adminComplaints
  .filter(
    (complaint) =>
      adminFilter === "All" ||
      complaint.status === adminFilter
  )
  .map((complaint) => (

          <div
            className="admin-complaint-card"
            key={complaint._id}
          >

            <div className="admin-complaint-info">

              <span className="complaint-category">
                {complaint.category}
              </span>

              <h3>{complaint.title}</h3>

              <p>
                <strong>Location:</strong>{" "}
                {complaint.location}
              </p>

              <p>
                {complaint.description}
              </p>

              <small>
                Submitted:{" "}
                {new Date(
                  complaint.createdAt
                ).toLocaleString()}
              </small>

            </div>


            <div className="admin-actions">

              <span
                className={`status ${getStatusClass(
                  complaint.status
                )}`}
              >
                {complaint.status}
              </span>

              <label>Update Status</label>

              <select
  value={complaint.status}
  onChange={(e) =>
    updateComplaint(
      complaint._id,
      e.target.value,
      complaint.adminRemarks || ""
    )
  }
>
                <option value="Pending">
                  Pending
                </option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Resolved">
                  Resolved
                </option>
              </select>
<label>Admin Remark</label>

<textarea
  defaultValue={complaint.adminRemarks || ""}
  placeholder="Add a remark..."
  id={`remark-${complaint._id}`}
/>

<button
  className="remark-button"
  onClick={() => {
    const remark = document.getElementById(
      `remark-${complaint._id}`
    ).value;

    updateComplaint(
      complaint._id,
      complaint.status,
      remark
    );
  }}
>
  Save Remark
</button>
<button
  className="delete-button"
  onClick={async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this complaint?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
  `https://collegecomplaintportal-production.up.railway.app/api/complaints/${complaint._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchAdminComplaints();

    } catch (error) {
      console.error("Could not delete complaint:", error);

      alert("Could not delete complaint.");
    }
  }}
>
  Delete Complaint
</button>
            </div>

          </div>

        ))

      )}

    </div>

  </section>

  
)}

        {/* SUBMIT SECTION */}
        <section
          className="submit-section"
          id="report"
        >

          <div className="section-heading">

            <span>
              01
            </span>

            <div>

              <h2>
                Report an issue
              </h2>

              <p>
                Tell us what's happening on campus.
              </p>

            </div>

          </div>


          <div className="form-card">

            <form onSubmit={handleSubmit}>

              <div className="form-group full">

                <label>
                  What's the issue?
                </label>

                <input
                  type="text"
                  name="title"
                  placeholder="e.g. AC not working in Lab 3"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >

                    <option>
                      Electrical
                    </option>

                    <option>
                      Cleanliness
                    </option>

                    <option>
                      Internet
                    </option>

                    <option>
                      Infrastructure
                    </option>

                    <option>
                      Academic
                    </option>

                    <option>
                      Hostel
                    </option>

                    <option>
                      Other
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Block A, Lab 3"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Describe the problem
                </label>

                <textarea
                  name="description"
                  placeholder="Give us a few details about the issue..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="form-footer">

                <p>
                  Your complaint will be forwarded to the
                  appropriate department.
                </p>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading
                    ? "Submitting..."
                    : "Submit Complaint →"}
                </button>

              </div>

            </form>


            {message && (
              <div className="success-message">
                ✓ {message}
              </div>
            )}

          </div>

        </section>


        {/* COMPLAINTS SECTION */}
  {user?.role === "admin" && (
  <section
    className="complaints-section"
    id="complaints"
  >

          <div className="section-heading">

            <span>
              02
            </span>

            <div>

              <h2>
                Recent complaints
              </h2>

              <p>
                See the latest issues reported on campus.
              </p>

            </div>

          </div>


          <div className="complaints-list">

            {complaints.length === 0 ? (

              <div className="empty-state">

                <div>
                  ✓
                </div>

                <h3>
                  No complaints yet
                </h3>

                <p>
                  Be the first to report an issue.
                </p>

              </div>

            ) : (

              complaints
                .slice(0, 5)
                .map((complaint) => (

                  <div
                    className="complaint-card"
                    key={complaint._id}
                  >

                    <div className="complaint-info">

                      <span className="complaint-category">
                        {complaint.category}
                      </span>

                      <h3>
                        {complaint.title}
                      </h3>

                      <p>
                        {complaint.location} ·{" "}
                        {new Date(
                          complaint.createdAt
                        ).toLocaleDateString()}
                      </p>

                    </div>


                    <span
                      className={`status ${getStatusClass(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>

                  </div>

                ))

            )}

          </div>

        </section>
  )}
      </main>


      {/* LOGIN MODAL */}
      {showLogin && (

        <div className="login-overlay">

          <div className="login-modal">

            <button
              className="close-login"
              onClick={() => setShowLogin(false)}
            >
              ×
            </button>


            <span className="login-label">
              CAMPUSDESK
            </span>

            <h2>
              Welcome back.
            </h2>

            <p>
              Login to manage your campus complaints.
            </p>


            <form onSubmit={handleLogin}>

              <label>
                Email
              </label>

              <input
                type="email"
                placeholder="student@college.com"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    email: e.target.value
                  })
                }
                required
              />


              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    password: e.target.value
                  })
                }
                required
              />


              <button
                type="submit"
                className="login-submit"
              >
                Login →
              </button>

            </form>

          </div>

        </div>

      )}


      {/* FOOTER */}
      <footer>

        <div>

          <strong>
            CampusDesk
          </strong>

          <span>
            {" "}· Making campus better, one report at a time.
          </span>

        </div>

        <span>
          CampusDesk
        </span>

      </footer>

    </div>
  );
}

export default App;