import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(location.state?.user || location.state || null);
  const [userAllergies, setUserAllergies] = useState([]);
  const currentUserEmail = "sara.rossi@gmail.com";
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetch(`/api/user/${currentUserEmail}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setUser(data);
      });
    fetch(
      `/api/user/${currentUserEmail}/allergies/names`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setUserAllergies(data);
      })
      .catch((err) => console.error("Error loading allergies:", err));
  }, []);

    useEffect(() => {
      const toast = location.state?.toast;
      if (!toast) return;
      setToastMessage(toast.message || "Done!");
      setShowToast(true);

      const t = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(t);
    }, [location.state?.toast]);

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    if (userAllergies.length > 5) {
      root.classList.remove("no-scroll");
    } else {
      root.classList.add("no-scroll");
    }

    return () => root.classList.remove("no-scroll");
  }, [userAllergies.length]);

  if (!user) return <div className="loading">Loading...</div>;

  const age = user.birth 
    ? new Date().getFullYear() - new Date(user.birth).getFullYear() 
    : "N/A";
    
  return (
    <div className="profile-page-container">
      <div className="profile-header-fixed">
        <h1 className="page-title">Welcome {user.name}</h1>
      </div>
      <div className="profile-scrollable-content">
        <div className="profile-card liquid-glass">
          <div className="avatar-box">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                className="profile-img-view"
                alt="Avatar"
              />
            ) : (
              <i className="bi bi-person-circle big-icon"></i>
            )}
          </div>

          <div className="profile-main-info">
            <h3>
              {user.name} {user.surname}
            </h3>
            <p className="subtitle">
              {user.gender} • {age} yrs old
            </p>
          </div>

          <div className="info-list">
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phone} />
            <InfoRow label="Address" value={user.address} />
            <InfoRow label="Birth" value={user.birth} />
            <div className="info-row-stack">
              <span>Allergies & Preferences</span>
              <div className="tag-container">
                {userAllergies.length > 0 ? (
                  userAllergies.map((name, index) => (
                    <span key={index} className="tag">
                      {name}
                    </span>
                  ))
                ) : (
                  <strong className="no-tags">None selected</strong>
                )}
              </div>
            </div>
          </div>

          <button
            className="edit-btn"
            onClick={() => navigate("/editprofile", { state: user })}
          >
            Edit profile
          </button>
        </div>
        <div className={`toast-message ${showToast ? "show" : ""}`}>
          <i
            className={`bi ${
              location.state?.toast?.type === "discard"
                ? "bi-x-circle-fill"
                : "bi-check-circle-fill"
            }`}
            style={{
              color:
                location.state?.toast?.type === "discard"
                  ? "#ff3b30"
                  : "#34c759",
            }}
          ></i>
          <span>{toastMessage}</span>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value || "Not set"}</strong>
    </div>
  );
}

export default Profile;