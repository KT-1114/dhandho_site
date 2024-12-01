import React from "react";

export default function Inventory() {
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4 animate__animated animate__fadeIn">Inventory Page</h1>

      <div className="row row-cols-1 row-cols-md-3 g-4">
        {/* Product Card 1 */}
        <div className="col">
          <div
            className="hover-effect card h-100 shadow-lg custom-card animate__animated animate__fadeIn animate__delay-1s"
            style={{
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            <img
              src="https://via.placeholder.com/300x200.png?text=Product+Image"
              className="card-img-top"
              alt="Product"
            />
            <div className="card-body d-flex flex-column">
              <h5 className="card-title hover-text-primary">Product Name</h5>
              <p className="card-text text-muted">
                This is a short description of the product. It's a placeholder text for now.
              </p>
              <div className="mt-auto">
                <p className="card-text fw-bold text-primary">$29.99</p>
                <a href="#" className="btn btn-primary w-100 hover-scale-105">
                  Add to Cart
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Product Card 2 */}
        <div className="col">
          <div
            className="hover-effect card h-100 shadow-lg custom-card animate__animated animate__fadeIn animate__delay-2s"
            style={{
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            <img
              src="https://via.placeholder.com/300x200.png?text=Product+Image+2"
              className="card-img-top"
              alt="Product"
            />
            <div className="card-body d-flex flex-column">
              <h5 className="card-title hover-text-primary">Another Product</h5>
              <p className="card-text text-muted">
                A description of this product. It's a placeholder text for now.
              </p>
              <div className="mt-auto">
                <p className="card-text fw-bold text-primary">$39.99</p>
                <a href="#" className="btn btn-primary w-100 hover-scale-105">
                  Add to Cart
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Product Card 3 */}
        <div className="col">
          <div
            className="hover-effect card h-100 shadow-lg custom-card animate__animated animate__fadeIn animate__delay-3s"
            style={{
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            <img
              src="https://via.placeholder.com/300x200.png?text=Product+Image+3"
              className="card-img-top"
              alt="Product"
            />
            <div className="card-body d-flex flex-column">
              <h5 className="card-title hover-text-primary">Product Three</h5>
              <p className="card-text text-muted">
                This is the description for a third product. It's a placeholder text for now.
              </p>
              <div className="mt-auto">
                <p className="card-text fw-bold text-primary">$49.99</p>
                <a href="#" className="btn btn-primary w-100 hover-scale-105">
                  Add to Cart
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Hover effect for the card */
.custom-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* When the card is hovered */
.custom-card:hover {
  transform: translateY(-15px) scale(1.05); /* Move up and scale slightly */
  
  /* Enhanced shadow effect */
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),    /* Subtle small shadow */
    0 10px 20px rgba(0, 0, 0, 0.15),   /* Medium shadow */
    0 15px 40px rgba(0, 0, 0, 0.2);    /* Larger shadow for depth */
}

      `}</style>
    </div>
  );
}
