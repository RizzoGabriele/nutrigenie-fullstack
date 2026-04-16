import "./RestaurantInfo.css";

export default function RestaurantInfo({ address, price, onChange }) {
  return (
    <div className="restaurant-block">
      <div className="restaurant-header d-flex justify-content-between align-items-center">
        <span className="restaurant-label">Restaurant</span>

        <button className="btn btn-link p-0 restaurant-change" onClick={onChange}>
          Change
        </button>
      </div>
      <div className="restaurant-address">
        {address}
      </div>
      <div className="restaurant-price">
        {price}
      </div>

    </div>
  );
}
