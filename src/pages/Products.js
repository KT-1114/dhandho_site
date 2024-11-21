import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";
import { useAuth } from "../components/AuthProvider";
import { MdDelete, MdRemoveRedEye } from "react-icons/md";

export default function Products() {
  const { userBusinessData } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null); // State for tracking deletion process
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, product_name, rate, mrp, cost_price, qty_in_ctn, image_url"
        )
        .eq("seller_uid", userBusinessData.business_uid);

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data);
      }
      setIsLoading(false);
    };

    if (userBusinessData.business_uid) {
      fetchProducts();
    } else {
      console.error("User ID (business_id) is not available.");
      setIsLoading(false);
    }
  }, [userBusinessData.business_uid]);

  const handleDelete = async (productId) => {
    setShowDeleteModal(productId); // Show the modal for the specific product
  };

  const confirmDelete = async (productId) => {
    setDeleteLoading(productId); // Start the delete loader
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) {
        console.error("Error deleting product:", error);
      } else {
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product.id !== productId)
        );
      }
    } catch (err) {
      console.error("Error in confirmDelete:", err);
    }
    setDeleteLoading(null); // Stop the delete loader
    setShowDeleteModal(null); // Close the modal
  };

  const cancelDelete = () => {
    setShowDeleteModal(null); // Close the modal without deleting
  };

  return (
    <>
      <style>
        {`
    body {
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fc;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 1200px;
      margin: 20px auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    h2.total-products {
      text-align: center;
      color: #1abc9c;
      margin: 10px 0;
      font-size: 1.5em;
      font-weight: 600;
    }

    p.page-info {
      text-align: center;
      color: #7f8c8d;
      margin-bottom: 30px;
      font-size: 1.1em;
    }

    .product-box {
      background: linear-gradient(145deg, #ffffff, #f0f1f6);
      border: 1px solid #ecf0f1;
      border-radius: 10px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      padding: 15px;
      text-align: center;
      box-shadow: 4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff;
    }

    .product-box:hover {
      transform: translateY(-8px);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
    }

    .product-box img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
    }

    .product-box h3 {
      margin: 15px 0 10px;
      font-size: 1.3em;
      color: #34495e;
      font-weight: bold;
    }

    .product-box p {
      color: #2c3e50;
      margin: 5px 0;
      font-size: 1em;
    }

    .product-box .price {
      font-weight: bold;
      color: #e74c3c;
      font-size: 1.1em;
    }

    .product-buttons {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 20px;
    }

    .product-buttons .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2em;
      padding: 10px 15px;
      border-radius: 50px;
      color: #ffffff;
      transition: background-color 0.3s ease, transform 0.3s ease;
    }

    .btn-delete {
      background-color: #e74c3c;
      position: relative;
    }

    .btn-delete.loading {
      background-color: #e67e22;
      cursor: not-allowed;
    }

    .btn-delete .loader-icon {
      position: absolute;
      width: 1em;
      height: 1em;
      border: 2px solid #fff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .loader {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #f8f9fc;
    }

    .spinner-border {
      width: 3.5rem;
      height: 3.5rem;
      color: #1abc9c;
    }
    
    .delete-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #ffffff;
      padding: 20px 30px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
    }

    .modal-content h4 {
      font-size: 1.5rem;
      color: #e74c3c;
      margin-bottom: 10px;
    }

    .modal-content p {
      font-size: 1rem;
      color: #2c3e50;
      margin-bottom: 20px;
    }

    .modal-buttons {
      display: flex;
      justify-content: center;
      gap: 15px;
    }

    .modal-buttons .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 50px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.3s ease;
    }

    .confirm-btn {
      background-color: #e74c3c;
      color: #ffffff;
    }

    .confirm-btn:hover {
      background-color: #c0392b;
      color: #ffffff;
    }

    .cancel-btn {
      background-color: #bdc3c7;
      color: #2c3e50;
    }

    .cancel-btn:hover {
      background-color: #95a5a6;
    }

  `}
      </style>

      <div>
        <h2 className="total-products">
          Total Products Available: {products.length}
        </h2>

        {isLoading ? (
          <div className="loader">
            <div className="spinner-border" role="status">
              <span className="sr-only"></span>
            </div>
          </div>
        ) : (
          <div className="container">
            <div className="category">
              <div className="row">
              {products.map((product) => {
  const baseProductName = product.product_name.split(' (')[0]; // Extract base name before the parenthesis
  const productName = baseProductName.replace(/\s+/g, '_'); // Construct product name
  const imageUrl = product.image_url 
    ? `https://your-bucket-url/product-images/${product.image_url}` // Use the actual image if it exists
    : 'https://via.placeholder.com/300x200?text=No+Image'; // Default fallback image if no image is provided

  return (
    <div key={product.id} className="col-lg-4 col-md-6 mb-4">
      <div className="product-box">
        <img
          src={imageUrl} // Use the image URL or fallback to the placeholder
          alt={product.product_name}
        />
        <h3>{product.product_name}</h3>
        <p>Rate: ₹{product.rate}</p>
        <p>MRP: ₹{product.mrp}</p>
        <p className="price">Cost Price: ₹{product.cost_price}</p>
        <p>Quantity in Carton: {product.qty_in_ctn || "N/A"}</p>
        <div className="product-buttons">
          <button
            className={`btn btn-delete ${deleteLoading === product.id ? "loading" : ""}`}
            onClick={() => handleDelete(product.id)}
            disabled={deleteLoading === product.id}
          >
            {deleteLoading === product.id ? (
              <div className="loader-icon"></div>
            ) : (
              <MdDelete />
            )}
          </button>
        </div>
      </div>
    </div>
  );
})}
              </div>
            </div>
          </div>
        )}
        {selectedProduct && (
          <div className="product-modal">
            <div className="modal-content">
              <h3>{selectedProduct.product_name}</h3>
              <img
                src={
                  selectedProduct.image_url ||
                  "https://via.placeholder.com/300x200"
                }
                alt={selectedProduct.product_name}
              />
              <p>Rate: ₹{selectedProduct.rate}</p>
              <p>MRP: ₹{selectedProduct.mrp}</p>
              <p>Cost Price: ₹{selectedProduct.cost_price}</p>
              <p>Quantity in Carton: {selectedProduct.qty_in_ctn || "N/A"}</p>
              <button onClick={() => setSelectedProduct(null)}>Close</button>
            </div>
          </div>
        )}
        {showDeleteModal && (
          <div className="delete-modal">
            <div className="modal-content">
              <h4>Confirm Delete</h4>
              <p>
                Are you sure you want to delete this product? This action cannot
                be undone.
              </p>
              <div className="modal-buttons">
                <button
                  className="btn confirm-btn"
                  onClick={() => confirmDelete(showDeleteModal)}
                >
                  Delete
                </button>
                <button className="btn cancel-btn" onClick={cancelDelete}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
