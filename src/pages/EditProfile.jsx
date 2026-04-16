import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./EditProfile.css";
import Popup from "../components/Popup";

function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const fileInputRef = useRef(null);

  const genderDropdownRef = useRef(null);
  const prefixDropdownRef = useRef(null);
  const allergiesDropdownRef = useRef(null);
  const [showBackPopup, setShowBackPopup] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const currentUserEmail = "sara.rossi@gmail.com";

  const prefixes = [
    { code: "+39", country: "IT", flag: "🇮🇹", name: "Italy" },
    { code: "+1", country: "US", flag: "🇺🇸", name: "USA" },
    { code: "+44", country: "GB", flag: "🇬🇧", name: "UK" },
    { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
    { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
    { code: "+34", country: "ES", flag: "🇪🇸", name: "Spain" },
  ];

  const genderOptions = ["Male", "Female", "I prefer not to say"];

  const [allOptions, setAllOptions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [errors, setErrors] = useState({});

  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);
  const [isAllergiesOpen, setIsAllergiesOpen] = useState(false);

  const [addressQuery, setAddressQuery] = useState(
    location.state?.address || "",
  );
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const addressDebounceRef = useRef(null);
  const addressBoxRef = useRef(null);

  const [form, setForm] = useState({
    name: location.state?.name || "",
    surname: location.state?.surname || "",
    email: currentUserEmail,
    phone: "",
    prefix: "+39",
    birth: location.state?.birth || "",
    gender: location.state?.gender || "",
    profilePic: location.state?.profilePic || null,
    address: location.state?.address || "",
  });

  const formatAddress = (sugg) => {
    if (!sugg?.address) return sugg.display_name;
    const { road, house_number, city, town, village } = sugg.address;
    const cityName = city || town || village || "";
    return [road, house_number, cityName].filter(Boolean).join(", ");
  };

  useEffect(() => {
    const handleOutside = (event) => {
      const inGender = genderDropdownRef.current?.contains(event.target);
      const inPrefix = prefixDropdownRef.current?.contains(event.target);
      const inAllergies = allergiesDropdownRef.current?.contains(event.target);
      const inAddress = addressDropdownRef.current?.contains(event.target);

      if (!inGender) setIsGenderOpen(false);
      if (!inPrefix) setIsPrefixOpen(false);
      if (!inAllergies) setIsAllergiesOpen(false);
      if (!inAddress) setIsAddressOpen(false);
    };

    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  useEffect(() => {
    fetch("/api/preferences")
      .then((res) => res.json())
      .then((data) => setAllOptions(data))
      .catch((err) => console.error("Fetch preferences error:", err));

    fetch(`/api/user/${currentUserEmail}/allergies`)
      .then((res) => res.json())
      .then((data) => setSelectedIds(data))
      .catch((err) => console.error("Fetch user allergies error:", err));

    if (location.state?.phone) {
      const phoneStr = location.state.phone.toString();
      const found = prefixes.find((p) => phoneStr.startsWith(p.code));
      if (found) {
        setForm((prev) => ({
          ...prev,
          prefix: found.code,
          phone: phoneStr.replace(found.code, "").trim(),
        }));
      } else {
        setForm((prev) => ({ ...prev, phone: phoneStr }));
      }
    }
  }, []);
  const fetchAddressSuggestions = async (query) => {
    try {
      setAddressSearching(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&addressdetails=1&limit=5`,
      );

      if (!res.ok) {
        if (res.status === 429 || res.status === 503) {
          setAddressSuggestions([]);
          return;
        }
        throw new Error("Error searching address");
      }

      const data = await res.json();
      setAddressSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Autocomplete error:", err);
      setAddressSuggestions([]);
    } finally {
      setAddressSearching(false);
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;

    setAddressQuery(value);

    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);

    if (!value.trim() || value.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    addressDebounceRef.current = setTimeout(() => {
      fetchAddressSuggestions(value.trim());
    }, 500);
  };


  const handleAddressSuggestionClick = (sugg) => {
    const chosen = formatAddress(sugg);

    setForm((prev) => ({ ...prev, address: chosen }));
    setAddressQuery("");
    setAddressSuggestions([]);
  };


  useEffect(() => {
    const onPointerDown = (e) => {
      if (!addressBoxRef.current) return;
      if (!addressBoxRef.current.contains(e.target)) {
        setAddressSuggestions([]);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    };
  }, []);


  const validateForm = () => {
    let newErrors = {};
    const phoneRegex = /^[0-9]+$/;

    if (!form.name.trim()) newErrors.name = "First name is required";
    if (!form.surname.trim()) newErrors.surname = "Last name is required";
    if (!form.gender) newErrors.gender = "Please select your gender";

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(form.phone)) {
      newErrors.phone = "Only numbers allowed";
    } else if (form.phone.length < 8) {
      newErrors.phone = "Number too short";
    }

    if (!form.birth) {
      newErrors.birth = "Birth date is required";
    } else {
      const birthDate = new Date(form.birth);
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
    
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 16) {
        newErrors.birth = "You must be at least 16 years old";
      } else if (age > 100) {
        newErrors.birth = "Age cannot exceed 100 years";
      } else if (birthDate > today) {
        newErrors.birth = "Date cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmBack = () => {
    setShowBackPopup(false);
    navigate("/profile", {
      state: {
        toast: {
          type: "discard",
          message: "Discarded changes",
        },
      },
    });
  };

  const handleCloseBackPopup = () => {
    setShowBackPopup(false);
  };

  const handleCancel = () => {
    setShowBackPopup(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const dataToSend = {
      ...form,
      address: addressQuery.trim() || form.address, // fallback intelligente
      phone: `${form.prefix} ${form.phone}`.trim(),
      selectedAllergyIds: selectedIds,
    };

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setShowSaved(true);
        navigate("/profile", {
          state: {
            user: updatedUser,
            toast: {
              type: "success",
              message: "Profile updated!",
            },
          },
        });
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  return (
    <div className="editprofile-page">
      <div className="editprofile-header-fixed">
        <h1 className="page-title">Edit Profile</h1>
      </div>

      <div className="editprofile-scroll-container">
        <div className="editprofile-card">
          <div className="card-scroll-content">
            <div className="avatar-section">
              <div
                className="avatar-wrapper"
                onClick={() => fileInputRef.current.click()}
              >
                {form.profilePic ? (
                  <img
                    src={form.profilePic}
                    className="profile-img-preview"
                    alt="Avatar"
                  />
                ) : (
                  <div className="profile-placeholder">
                    <span>Add Photo</span>
                  </div>
                )}
                <div className="edit-overlay">
                  <i className="bi bi-camera-fill"></i>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () =>
                    setForm({ ...form, profilePic: reader.result });
                  reader.readAsDataURL(file);
                }}
              />
            </div>
            <div className="name-row-container">
              <div className="field half">
                <label>Name</label>
                <input
                  className={errors.name ? "input-error" : ""}
                  value={form.name}
                  placeholder="Name"
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                />
                {errors.name && (
                  <span className="error-text">{errors.name}</span>
                )}
              </div>

              <div className="field half">
                <label>Surname</label>
                <input
                  className={errors.surname ? "input-error" : ""}
                  value={form.surname}
                  placeholder="Surname"
                  onChange={(e) => {
                    setForm({ ...form, surname: e.target.value });
                    if (errors.surname) setErrors({ ...errors, surname: null });
                  }}
                />
                {errors.surname && (
                  <span className="error-text">{errors.surname}</span>
                )}
              </div>
            </div>
            <div className="field">
              <label>Gender</label>
              <div className="custom-select-wrapper" ref={genderDropdownRef}>
                <div
                  className={`custom-select-header ${
                    errors.gender ? "input-error" : ""
                  } ${isGenderOpen ? "open" : ""}`}
                  onClick={() => setIsGenderOpen((v) => !v)}
                >
                  <span>{form.gender ? form.gender : "Select options..."}</span>
                  <i
                    className={`bi bi-chevron-${isGenderOpen ? "up" : "down"}`}
                  ></i>
                </div>

                {isGenderOpen && (
                  <div
                    className="custom-select-options"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {genderOptions.map((option) => {
                      const selected = form.gender === option;
                      return (
                        <div
                          key={option}
                          className={`custom-option ${selected ? "selected" : ""}`}
                          onClick={() => {
                            setForm({ ...form, gender: option });
                            setIsGenderOpen(false);
                            if (errors.gender)
                              setErrors({ ...errors, gender: null });
                          }}
                        >
                          <span className="check-col">
                            {selected ? "✔" : ""}
                          </span>
                          {option}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {errors.gender && (
                <span className="error-text">{errors.gender}</span>
              )}
            </div>
            <div className="field">
              <label>Phone</label>
              <div className="phone-input-container">
                <div
                  className="custom-select-wrapper"
                  style={{ width: "110px" }}
                  ref={prefixDropdownRef}
                >
                  <div
                    className={`custom-select-header ${isPrefixOpen ? "open" : ""}`}
                    onClick={() => setIsPrefixOpen((v) => !v)}
                  >
                    <span>
                      {prefixes.find((p) => p.code === form.prefix)?.flag}{" "}
                      {form.prefix}
                    </span>
                    <i
                      className={`bi bi-chevron-${isPrefixOpen ? "up" : "down"}`}
                    ></i>
                  </div>

                  {isPrefixOpen && (
                    <div
                      className="custom-select-options"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {prefixes.map((p) => {
                        const selected = p.code === form.prefix;
                        return (
                          <div
                            key={p.country}
                            className={`custom-option ${selected ? "selected" : ""}`}
                            onClick={() => {
                              setForm({ ...form, prefix: p.code });
                              setIsPrefixOpen(false);
                            }}
                          >
                            <span className="check-col">
                              {selected ? "✔" : ""}
                            </span>
                            {p.flag} {p.code}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <input
                  className={errors.phone ? "input-error" : ""}
                  value={form.phone}
                  placeholder="Phone number"
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: null });
                  }}
                />
              </div>
              {errors.phone && (
                <span className="error-text">{errors.phone}</span>
              )}
            </div>
            <div className="field" ref={addressBoxRef}>
              <label>Address</label>

              <input
                value={addressQuery}
                placeholder={form.address || "Type your address"}
                onChange={handleAddressChange}
                onFocus={() => {
                  if (
                    addressQuery.trim().length >= 3 &&
                    addressSuggestions.length === 0
                  ) {
                    fetchAddressSuggestions(addressQuery.trim());
                  }
                }}
              />

              {addressQuery.trim().length >= 3 &&
                addressSuggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {addressSuggestions.map((s, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() => handleAddressSuggestionClick(s)}
                      >
                        {formatAddress(s)}
                      </li>
                    ))}
                  </ul>
                )}

              {addressQuery &&
                addressSearching &&
                addressSuggestions.length === 0 && (
                  <p className="searching-hint">Searching…</p>
                )}
            </div>
            <div className="field">
              <label>Birth Date</label>
              <input
                type="date"
                className={`date-input ${errors.birth ? "input-error" : ""}`}
                value={form.birth}
                onChange={(e) => {
                  setForm({ ...form, birth: e.target.value });
                  if (errors.birth) setErrors({ ...errors, birth: null });
                }}
              />
              {errors.birth && (
                <span className="error-text">{errors.birth}</span>
              )}
            </div>
            <div className="field">
              <label>Allergies & Preferences</label>
              <div className="custom-select-wrapper" ref={allergiesDropdownRef}>
                <div
                  className={`custom-select-header ${isAllergiesOpen ? "open" : ""}`}
                  onClick={() => setIsAllergiesOpen((v) => !v)}
                >
                  <span>
                    {selectedIds.length > 0
                      ? `${selectedIds.length} selected`
                      : "Select options..."}
                  </span>
                  <i
                    className={`bi bi-chevron-${isAllergiesOpen ? "up" : "down"}`}
                  ></i>
                </div>

                {isAllergiesOpen && (
                  <div
                    className="custom-select-options"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {allOptions.length > 0 ? (
                      allOptions.map((opt) => {
                        const selected = selectedIds.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            className={`custom-option ${selected ? "selected" : ""}`}
                            onClick={() => handleCheckboxChange(opt.id)}
                          >
                            <span className="check-col">
                              {selected ? "✔" : ""}
                            </span>
                            {opt.name}
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-data">Loading options...</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="buttons-fixed">
            <button className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
      {showBackPopup && (
        <Popup
          title="Warning"
          message="You have unsaved changes. Are you sure you want to leave?"
          onClose={handleCloseBackPopup}
          onConfirm={handleConfirmBack}
          confirmText="Leave"
          cancelText="No"
        />
      )}
    </div>
  );
}

export default EditProfile;