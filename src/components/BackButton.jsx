import "./BackButton.css";
import { useNavigate } from "react-router-dom";

export default function BackButton({ onClick }) {
  const navigate = useNavigate();

  return (
    <i
      className="bi bi-chevron-left back-icon"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) return onClick(); 
        navigate(-1); 
      }}
      role="button"
      tabIndex={0}
    ></i>
  );
}
