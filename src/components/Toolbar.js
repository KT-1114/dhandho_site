import React from 'react';

const Toolbar = ({ onAddProductClick }) => {
  return (
    <div
      className="position-fixed bottom-0 end-0 m-4 d-flex flex-column align-items-center"
      style={{ zIndex: 1050 }}
    >
      {/* Add Product Button */}
      <button
        className="btn btn-dark rounded-circle p-3 mb-3 shadow-lg"
        style={{
          transition: 'transform 0.3s ease-in-out',
        }}
        onClick={onAddProductClick}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <i className="bx bx-plus" style={{ fontSize: '30px' }}></i>
      </button>
    </div>
  );
};

export default Toolbar;
