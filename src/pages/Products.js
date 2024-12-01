import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";
import { useAuth } from "../components/AuthProvider";
import { MdDelete, MdAdd } from "react-icons/md";
import ProductModal from "../components/ProductModal";

export default function Products() {
  const { userBusinessData } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false); 

  // Fetch products from Supabase
  useEffect(() => {

    if (userBusinessData.business_uid) {
      fetchProducts();
    } else {
      console.error("User ID (business_id) is not available.");
      setIsLoading(false);
    }
  }, [userBusinessData.business_uid]);

  const handleDelete = async (productId) => {
    setShowDeleteModal(productId);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, product_name, rate, mrp, cost_price, qty_in_ctn, image_url")
      .eq("seller_uid", userBusinessData.business_uid);

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data);
    }
    setIsLoading(false);
  };

  const confirmDelete = async (productId) => {
    setDeleteLoading(productId);
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
    setDeleteLoading(null);
    setShowDeleteModal(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(null);
  };

  const handleAddProduct = () => {
    setShowAddProductModal(true); 
  };

  const cancelAddProduct = () => {
    setShowAddProductModal(false); 
  };

  return (
    <>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <div>
        <h2 className="total-products">
          Total Products Available: {products.length}
        </h2>

        {isLoading ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="sr-only"></span>
            </div>
          </div>
        ) : (
          <div className="container">
            <div className="category">
              <div className="row">
                {products.map((product) => {
                  const imageUrl = product.image_url
                    ? `https://qjxkpwpdalwkedmixrac.supabase.co/storage/v1/object/public/product-images/${product.image_url}`
                    : "https://via.placeholder.com/300x200?text=No+Image";

                  return (
                    <div key={product.id} className="col-lg-3 col-md-6 mb-4">
                      <div className="product-box m-2 p-3 border rounded shadow-sm">
                        <img
                          src={imageUrl}
                          alt={product.product_name}
                          className="img-fluid"
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "contain",
                            borderRadius: "8px",
                          }}
                        />
                        <h3>{product.product_name}</h3>
                        <p>Rate: ₹{product.rate}</p>
                        <p>MRP: ₹{product.mrp}</p>
                        <p className="price">Cost Price: ₹{product.cost_price}</p>
                        <p>Quantity in Carton: {product.qty_in_ctn || "N/A"}</p>
                        <div className="product-buttons d-flex justify-content-center gap-2">
                          <button
                            className={`btn btn-danger ${deleteLoading === product.id ? "loading" : ""}`}
                            onClick={() => handleDelete(product.id)}
                            disabled={deleteLoading === product.id}
                          >
                            {deleteLoading === product.id ? (
                              <div className="spinner-border spinner-border-sm text-light"></div>
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

        {/* Add Product Button */}
        <div className="position-fixed bottom-0 end-0 m-4" style={{ zIndex: 1050 }}>
          <button
            className="btn btn-dark rounded-circle p-3 shadow-lg"
            onClick={handleAddProduct}
            style={{ transition: "transform 0.3s ease-in-out" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <MdAdd style={{ fontSize: '30px', color: 'white' }} />
          </button>
        </div>

        {/* Add Product Modal */}
        {showAddProductModal && (
          <ProductModal
            showModal={showAddProductModal} 
            onClose={cancelAddProduct}
            fetchProducts={fetchProducts} // Passing the fetch function to refresh product list
          />
        )}

        {/* Delete Confirmation Modal */}
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
                  className="btn btn-danger"
                  onClick={() => confirmDelete(showDeleteModal)}
                >
                  Delete
                </button>
                <button className="btn btn-secondary" onClick={cancelDelete}>
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
