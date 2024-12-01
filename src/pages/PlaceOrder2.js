import React, { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import supabase from "../supabaseClient";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const PlaceOrder2 = () => {
  const { user, userBusinessData } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [orderItems, setOrderItems] = useState([
    {
      product: null,
      quantityInPcs: 0,
      quantityInCrtn: 0,
      rate: 0,
      mrp: 0,
      total: 0,
    },
  ]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '', show: false });

  useEffect(() => {
    fetchStores();
  }, []); // Initial load of stores on component mount

  // Fetch stores where the user is the customer (business_uid_1)
  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("business_relations")
        .select(
          "relation_id, relation_type, business_uid_1, business_uid_2, business_2: businesses!business_uid_2(business_name, owner_name, contact, business_uid)"
        )
        .eq("business_uid_1", userBusinessData.business_uid);

      if (error) {
        console.error("Error fetching stores:", error);
        return;
      }

      const storeOptions = data.map((relation) => ({
        value: relation.business_2.business_uid, // Use business_uid for the store (seller)
        label: relation.business_2.business_name,
      }));

      setStores(storeOptions); // Update the state with the store options
    } catch (error) {
      console.error("Error fetching stores:", error.message);
    }
  };


  const fetchProductsAndInventory = async (store) => {
    if (!store) return;

    setLoadingProducts(true); // Start loading
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, rate, mrp, qty_in_ctn")
        .eq("seller_uid", store.value);

      if (error) {
        console.error("Error fetching products:", error.message);
        return;
      }

      setProducts(data); // Update the products state
    } catch (error) {
      console.error("Error fetching products:", error.message);
    } finally {
      setLoadingProducts(false); // End loading
    }
  };

  const handleStoreChange = (selectedOption) => {
    setSelectedStore(selectedOption); // Update the selected store
    setProducts([])
    fetchProductsAndInventory(selectedOption); // Pass selected store directly
  };

  const handleProductChange = (selectedOption, index) => {
    const updatedOrderItems = [...orderItems];
    const selectedProduct = products.find(
      (product) => product.id === selectedOption.value
    );

    // Check for duplicate product in order
    const alreadySelected = updatedOrderItems.some(
      (item, i) =>
        i !== index &&
        item.product &&
        item.product.value === selectedOption.value
    );

    updatedOrderItems[index].duplicateProductWarning = alreadySelected;

    if (alreadySelected) {
      setOrderItems(updatedOrderItems);
      return;
    }

    updatedOrderItems[index].product = selectedOption;
    updatedOrderItems[index].rate = selectedProduct.rate;
    updatedOrderItems[index].mrp = selectedProduct.mrp;

    setOrderItems(updatedOrderItems);
    calculateTotal(updatedOrderItems);
  };

  const handleQuantityChange = (value, index, type) => {
    const updatedOrderItems = [...orderItems];
    const selectedProduct = products.find(
      (product) => product.id === updatedOrderItems[index].product?.value
    );

    if (!selectedProduct) return; // If no product is selected, return early

    const qtyInCtn = selectedProduct.qty_in_ctn || 1; // Default to 1 if qty_in_ctn is null or undefined

    // Ensure valid numeric input (parse to integer, or default to 0)
    let pcsValue = parseInt(updatedOrderItems[index].quantityInPcs, 10) || 0;
    let crtnValue = parseInt(updatedOrderItems[index].quantityInCrtn, 10) || 0;

    // Input validation
    let quantityInvalid = false;

    // Handle changes based on type (Pcs or Ctn)
    if (type === "pcs") {
      pcsValue = value ? parseInt(value, 10) : 0; // Convert pcs value to integer or default to 0
      if (pcsValue < 0 || isNaN(pcsValue)) {
        quantityInvalid = true;
      } else {
        // If qty_in_ctn is not null, adjust cartons based on pcs value
        if (selectedProduct.qty_in_ctn !== null) {
          const totalPcs = pcsValue + crtnValue * qtyInCtn;
          crtnValue = Math.floor(totalPcs / qtyInCtn);
          pcsValue = totalPcs % qtyInCtn;
        }
      }
    } else if (type === "crtn" && selectedProduct.qty_in_ctn !== null) {
      crtnValue = value ? parseInt(value, 10) : 0; // Convert cartons value to integer or default to 0
      if (crtnValue < 0 || isNaN(crtnValue)) {
        quantityInvalid = true;
      } else {
        // Adjust pcs based on cartons value
        const totalPcs = (pcsValue % qtyInCtn) + crtnValue * qtyInCtn;
        crtnValue = Math.floor(totalPcs / qtyInCtn);
        pcsValue = totalPcs % qtyInCtn;
      }
    }

    // Update the order item with new values
    updatedOrderItems[index].quantityInPcs = pcsValue;
    updatedOrderItems[index].quantityInCrtn = crtnValue;
    updatedOrderItems[index].quantityInvalid = quantityInvalid; // Flag invalid quantities
    updatedOrderItems[index].total =
      (pcsValue + qtyInCtn * crtnValue) * selectedProduct.rate;

    setOrderItems(updatedOrderItems);
    calculateTotal(updatedOrderItems); // Recalculate grand total after change
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + (item.total || 0), 0);
    setGrandTotal(total);
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      {
        product: null,
        quantityInPcs: 0,
        quantityInCrtn: 0,
        rate: 0,
        mrp: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length > 1) {
      const updatedOrderItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(updatedOrderItems);
      calculateTotal(updatedOrderItems);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate that we have at least one item with quantities
    const invalidItems = orderItems.some(
      (item) => item.quantityInPcs === 0 && item.quantityInCrtn === 0
    );

    if (invalidItems) {
      setToast({ show: true, type: 'warning', message: 'Both "Pcs" and "Ctn" cannot be zero for the same item.' });
      return;
    }

    // Construct the order items array
    const orderItemsData = orderItems.map((item) => ({
      product_id: item.product.value, // Assuming the product value is the product's ID
      qty_in_pcs: item.quantityInPcs || 0,
      qty_in_ctn: item.quantityInCrtn || 0,
    }));

    // Prepare the order data
    const orderData = {
      from_store: userBusinessData.business_uid,
      to_store: selectedStore.value,
      amount: grandTotal,
      placed_by: user.id,
    };

    try {
      // Step 1: Insert the order into the orders table
      const { data: orderDataResponse, error } = await supabase
        .from("orders")
        .insert([orderData])
        .select("order_id") // Request the order_id after insert
        .single(); // Only expect one result

      if (error) {
        setToast({ show: true, type: 'danger', message: `${error.message}` });
        return;
      }

      const orderId = orderDataResponse?.order_id;

      // Step 2: Insert the order items into the order_items table
      const orderItemsWithOrderId = orderItemsData.map((item) => ({
        ...item,
        order_id: orderId, // Add the order_id to each order item
      }));

      const { data: orderItemsResponse, error: orderItemsError } =
        await supabase.from("order_items").insert(orderItemsWithOrderId);

      if (orderItemsError) {
        setToast({ show: true, type: 'danger', message: `${error.message}` });
        return;
      }

      setToast({
        show: true,
        type: "success",
        message: "Request submitted successfully",
      });
    } catch (error) {
      setToast({ show: true, type: 'danger', message: `${error.message}` });
    }
  };

  const loadOptions = (inputValue, callback, options) => {
    setTimeout(() => {
      callback(
        options
          .filter((option) =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
          )
          .slice(0, 10)
      );
    }, 1000);
  };

  const storeOptions = stores.map((store) => ({
    value: store.value,
    label: store.label,
  }));
  const productOptions = products.map((product) => ({
    value: product.id,
    label: product.qty_in_ctn
      ? `${product.product_name} - ${product.qty_in_ctn} in carton`
      : `${product.product_name} - pcs only`,
  }));

  const handleToastClose = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <div className="container mt-5" style={{ backgroundColor: "white", padding: "30px", borderRadius: "10px" }}>
      <button
        className="back-anchor-container"
        style={{
          position: "absolute",
          top: 65,
          left: 10,
          backgroundColor: "black", // Black button background
          borderRadius: 15,
          height: 30,
          width: 80,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: 500,
          border: "none",
          outline: "none",
          color: "white" // White text on black background
        }}
        onClick={() => {
          navigate("/orders");
        }}
      >
        <i className="bx bx-arrow-back"></i>
        Back
      </button>
      <div className="pt-5">
        <form onSubmit={handleSubmit}>
          <div className="row p-2 justify-content-md-start justify-content-center">
            <div className="col-12 col-sm-4">
              <label htmlFor="storeName" className="form-label" style={{ color: "black" }}>
                Store
              </label>
              <AsyncSelect
                cacheOptions
                loadOptions={(inputValue, callback) =>
                  loadOptions(inputValue, callback, storeOptions)
                }
                defaultOptions={storeOptions}
                onChange={handleStoreChange}
                value={selectedStore}
                classNamePrefix="react-select"
                className="react-select-container"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "white", // White background for select box
                    borderColor: "black", // Black border for select box
                    color: "black" // Black text for select options
                  })
                }}
              />
            </div>
          </div>

          {/* Order Items Section */}
          {orderItems.map((item, index) => (
            <div key={index} className="mb-3 pt-3">
              <div className="row">
                <div className="col-12 col-sm-9">
                  <div className="row p-2 g-2">
                    <div className="col-sm-4 col-8">
                      <label className="form-label" style={{ color: "black" }}>Product {index + 1}</label>
                      {loadingProducts ? (
                        <div style={{ color: "black" }}>Loading products...</div>
                      ) : (
                        <AsyncSelect
                          cacheOptions
                          loadOptions={(inputValue, callback) =>
                            loadOptions(inputValue, callback, productOptions)
                          }
                          defaultOptions={productOptions}
                          onChange={(selectedOption) =>
                            handleProductChange(selectedOption, index)
                          }
                          value={item.product}
                          classNamePrefix="react-select"
                          className="react-select-container"
                          styles={{
                            control: (base) => ({
                              ...base,
                              backgroundColor: "white",
                              borderColor: "black",
                              color: "black"
                            })
                          }}
                        />
                      )}
                      {item.duplicateProductWarning && (
                        <small className="text-danger">
                          This product is already selected.
                        </small>
                      )}
                    </div>

                    {/* Other fields like rate, quantity */}
                    <div className="col-sm-2 col-4">
                      <label className="form-label" style={{ color: "black" }}>Rate</label>
                      <input
                        type="text"
                        className="form-control text-center"
                        value={item.rate}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa", color: "black" }} // Light background with black text
                      />
                    </div>
                    <div className="col-sm-2 col-4">
                      <label className="form-label" style={{ color: "black" }}>MRP</label>
                      <input
                        type="text"
                        className="form-control text-center"
                        value={item.mrp}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa", color: "black" }} // Light background with black text
                      />
                    </div>
                    <div className="col-sm-2 col-4">
                      <label className="form-label" style={{ color: "black" }}>Pcs</label>
                      <input
                        type="number"
                        className={`form-control text-center ${item.quantityInvalid ? "is-invalid" : ""}`}
                        value={item.quantityInPcs}
                        onChange={(e) =>
                          handleQuantityChange(e.target.value, index, "pcs")
                        }
                        min="0" // Minimum value set to 0
                        style={{ backgroundColor: "white", color: "black" }} // White background with black text
                      />
                      {item.quantityInvalid && (
                        <div className="invalid-feedback">
                          Please enter a valid quantity (positive integer).
                        </div>
                      )}
                    </div>
                    {item.product?.qty_in_ctn !== null && (
                      <div className="col-sm-2 col-4">
                        <label className="form-label" style={{ color: "black" }}>Ctn</label>
                        <input
                          type="number"
                          className={`form-control text-center ${item.quantityInvalid ? "is-invalid" : ""}`}
                          value={item.quantityInCrtn}
                          onChange={(e) =>
                            handleQuantityChange(e.target.value, index, "crtn")
                          }
                          min="0" // Minimum value set to 0
                          style={{ backgroundColor: "white", color: "black" }} // White background with black text
                        />
                        {item.quantityInvalid && (
                          <div className="invalid-feedback">
                            Please enter a valid quantity (positive integer).
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Total and remove button */}
                <div className="border col-auto d-md-flex align-items-center">
                  <div className="row  col align-items-end">
                    <div className="col-sm-2 m-2 col-4">
                      <label className="form-label fw-bold">Total</label>
                      {/* Show total */}
                      <div className="col-auto text-md-end text-start">
                        {item && item.total !== undefined ? item.total.toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div className="border col-auto">
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add item and grand total */}
          <div className="row p-2 justify-content-between">
            <div className="col-sm-9 col-6">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddItem}
                style={{
                  backgroundColor: "black", // Black button background
                  color: "white" // White text on button
                }}
              >
                Add Item
              </button>
            </div>
            <div className="col-sm-3 col-6">
              <strong style={{ color: "black" }}>Grand Total: {grandTotal.toFixed(2)}</strong>
            </div>
          </div>

          <div className="row mt-5 justify-content-center">
            <div className="col-auto text-center">
              <button
                type="submit"
                className="btn btn-success"
                style={{
                  backgroundColor: "black", // Black button background
                  color: "white" // White text on button
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
      <Toast
        type={toast.type}
        message={toast.message}
        show={toast.show}
        onClose={handleToastClose}
      />
    </div>
  );

};

export default PlaceOrder2;
