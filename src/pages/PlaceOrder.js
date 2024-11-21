import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import supabase from '../supabaseClient';
import { useAuth } from '../components/AuthProvider';

const PlaceOrder = () => {
  const { user, userBusinessData } = useAuth();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [orderItems, setOrderItems] = useState([
    { product: null, quantityInPcs: 0, quantityInCrtn: 0, rate: 0, mrp: 0, total: 0 },
  ]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [errorAlert, setErrorAlert] = useState(null);
  const [successAlert, setSuccessAlert] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []); // Initial load of stores on component mount

  // Fetch stores where the user is the customer (business_uid_1)
  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("business_relations")
        .select(
          'relation_id, relation_type, business_uid_1, business_uid_2, business_2: businesses!business_uid_2(business_name, owner_name, contact, business_uid)'
        )
        .eq("business_uid_1", userBusinessData.business_uid);

      if (error) {
        console.error('Error fetching stores:', error);
        return;
      }

      const storeOptions = data.map((relation) => ({
        value: relation.business_2.business_uid,  // Use business_uid for the store (seller)
        label: relation.business_2.business_name
      }));

      setStores(storeOptions); // Update the state with the store options
    } catch (error) {
      console.error('Error fetching stores:', error.message);
    }
  };

  // Fetch products for the selected store (seller)
  const fetchProductsAndInventory = async () => {
    console.log('hi')
    if (!selectedStore) return; // Ensure a store is selected first

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, product_name, rate, mrp, qty_in_ctn')
        .eq('seller_uid', selectedStore.value); // Fetch products for the selected store's seller (using business_uid)

      if (error) {
        console.error('Error fetching products:', error.message);
        return;
      }

      setProducts(data); // Update the products state with the fetched data
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  // Handle store selection change
  const handleStoreChange = (selectedOption) => {
    setSelectedStore(selectedOption); // Update the selected store
    fetchProductsAndInventory(); // Fetch products related to the selected store
  };

  const handleProductChange = (selectedOption, index) => {
    const updatedOrderItems = [...orderItems];
    const selectedProduct = products.find(product => product.id === selectedOption.value);

    // Check for duplicate product in order
    const alreadySelected = updatedOrderItems.some((item, i) => i !== index && item.product && item.product.value === selectedOption.value);

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
    const selectedProduct = products.find(product => product.id === updatedOrderItems[index].product?.value);
  
    if (!selectedProduct) return; // If no product is selected, return early
  
    const qtyInCtn = selectedProduct.qty_in_ctn || 1; // Default to 1 if qty_in_ctn is null or undefined
  
    // Ensure valid numeric input (parse to integer, or default to 0)
    let pcsValue = parseInt(updatedOrderItems[index].quantityInPcs, 10) || 0;
    let crtnValue = parseInt(updatedOrderItems[index].quantityInCrtn, 10) || 0;
  
    // Input validation
    let quantityInvalid = false;
  
    // Handle changes based on type (Pcs or Ctn)
    if (type === 'pcs') {
      pcsValue = value ? parseInt(value, 10) : 0; // Convert pcs value to integer or default to 0
      if (pcsValue < 0 || isNaN(pcsValue)) {
        quantityInvalid = true;
      } else {
        // If qty_in_ctn is not null, adjust cartons based on pcs value
        if (selectedProduct.qty_in_ctn !== null) {
          const totalPcs = pcsValue + (crtnValue * qtyInCtn);
          crtnValue = Math.floor(totalPcs / qtyInCtn);
          pcsValue = totalPcs % qtyInCtn;
        }
      }
    } else if (type === 'crtn' && selectedProduct.qty_in_ctn !== null) {
      crtnValue = value ? parseInt(value, 10) : 0; // Convert cartons value to integer or default to 0
      if (crtnValue < 0 || isNaN(crtnValue)) {
        quantityInvalid = true;
      } else {
        // Adjust pcs based on cartons value
        const totalPcs = (pcsValue % qtyInCtn) + (crtnValue * qtyInCtn);
        crtnValue = Math.floor(totalPcs / qtyInCtn);
        pcsValue = totalPcs % qtyInCtn;
      }
    }
  
    // Update the order item with new values
    updatedOrderItems[index].quantityInPcs = pcsValue;
    updatedOrderItems[index].quantityInCrtn = crtnValue;
    updatedOrderItems[index].quantityInvalid = quantityInvalid; // Flag invalid quantities
    updatedOrderItems[index].total = (pcsValue + (qtyInCtn * crtnValue)) * selectedProduct.rate;
  
    setOrderItems(updatedOrderItems);
    calculateTotal(updatedOrderItems); // Recalculate grand total after change
  };
        
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + (item.total || 0), 0);
    setGrandTotal(total);
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product: null, quantityInPcs: 0, quantityInCrtn: 0, rate: 0, mrp: 0, total: 0 }]);
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
    const invalidItems = orderItems.some(item => item.quantityInPcs === 0 && item.quantityInCrtn === 0);
  
    if (invalidItems) {
      setErrorAlert('Both "Pcs" and "Ctn" cannot be zero for the same item.');
      return;
    }
  
    // Construct the order items array
    const orderItemsData = orderItems.map(item => ({
      product_id: item.product.value,  // Assuming the product value is the product's ID
      qty_in_pcs: item.quantityInPcs || 0,
      qty_in_ctn: item.quantityInCrtn || 0
    }));
  
    // Prepare the order data
    const orderData = {
      from_store:userBusinessData.business_uid,
      to_store: selectedStore.value,
      amount: grandTotal,
      placed_by: user.id,
    };
  
    try {
      // Step 1: Insert the order into the orders table
      const { data: orderDataResponse, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select('order_id') // Request the order_id after insert
        .single();  // Only expect one result
  
      if (orderError) {
        console.error('Error inserting order:', orderError);
        setErrorAlert('Error placing the order: ' + orderError.message);
        return;
      }
  
      const orderId = orderDataResponse?.order_id;
  
      // Step 2: Insert the order items into the order_items table
      const orderItemsWithOrderId = orderItemsData.map(item => ({
        ...item,
        order_id: orderId  // Add the order_id to each order item
      }));
  
      const { data: orderItemsResponse, error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId);
  
      if (orderItemsError) {
        console.error('Error inserting order items:', orderItemsError);
        setErrorAlert('Error adding order items: ' + orderItemsError.message);
        return;
      }
  
      // If everything is successful
      setSuccessAlert(true);
      setErrorAlert(null);  // Clear any previous errors
      // Optionally, reset form state or perform other actions
      console.log('Order and items placed successfully!');
      // Optionally, reset form state or perform further actions
  
    } catch (error) {
      console.error('Error submitting order:', error);
      setErrorAlert('Error submitting order.');
    }
  };
    
  const loadOptions = (inputValue, callback, options) => {
    setTimeout(() => {
      callback(
        options
          .filter(option =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
          )
          .slice(0, 10)
      );
    }, 1000);
  };

  const storeOptions = stores.map(store => ({ value: store.value, label: store.label }));
  const productOptions = products.map(product => ({
    value: product.id,
    label: product.qty_in_ctn
      ? `${product.product_name} - ${product.qty_in_ctn} in carton`
      : `${product.product_name} - pcs only`
  }));

  return (
    <div className="container mt-5">
      <div className="pt-5">
        <form onSubmit={handleSubmit}>
          <div className="row p-2 justify-content-md-start justify-content-center">
            <div className="col-12 col-sm-4">
              <label htmlFor="storeName" className="form-label">Store</label>
              <AsyncSelect
                cacheOptions
                loadOptions={(inputValue, callback) => loadOptions(inputValue, callback, storeOptions)}
                defaultOptions={storeOptions}
                onChange={handleStoreChange}
                value={selectedStore}
                classNamePrefix="react-select"
                className="react-select-container"
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
                      <label className="form-label">Product {index + 1}</label>
                      <AsyncSelect
                        cacheOptions
                        loadOptions={(inputValue, callback) => loadOptions(inputValue, callback, productOptions)}
                        defaultOptions={productOptions}
                        onChange={(selectedOption) => handleProductChange(selectedOption, index)}
                        value={item.product}
                        classNamePrefix="react-select"
                        className="react-select-container"
                      />
                      {item.duplicateProductWarning && (
                        <small className="text-danger">This product is already selected.</small>
                      )}
                    </div>

                    {/* Other fields like rate, quantity */}
                    <div className="col-sm-2 col-4">
                      <label className="form-label">Rate</label>
                      <input type="text" className="form-control text-center" value={item.rate} readOnly />
                    </div>
                    <div className="col-sm-2 col-4">
                      <label className="form-label">MRP</label>
                      <input type="text" className="form-control text-center" value={item.mrp} readOnly />
                    </div>
                    <div className="col-sm-2 col-4">
                      <label className="form-label">Pcs</label>
                      <input
                        type="number"
                        className={`form-control text-center ${item.quantityInvalid ? 'is-invalid' : ''}`}
                        value={item.quantityInPcs}
                        onChange={(e) => handleQuantityChange(e.target.value, index, 'pcs')}
                        min="0" // Minimum value set to 0
                      />
                      {item.quantityInvalid && (
                        <div className="invalid-feedback">Please enter a valid quantity (positive integer).</div>
                      )}
                    </div>
                    {item.product?.qty_in_ctn !== null && (
                      <div className="col-sm-2 col-4">
                        <label className="form-label">Ctn</label>
                        <input
                          type="number"
                          className={`form-control text-center ${item.quantityInvalid ? 'is-invalid' : ''}`}
                          value={item.quantityInCrtn}
                          onChange={(e) => handleQuantityChange(e.target.value, index, 'crtn')}
                          min="0" // Minimum value set to 0
                        />
                        {item.quantityInvalid && (
                          <div className="invalid-feedback">Please enter a valid quantity (positive integer).</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Total and remove button */}
                <div className="col-12 col-sm-3 d-md-flex align-items-center">
                  <div className="row p-2 justify-content-between align-items-end" style={{ minWidth: '250px' }}>
                    <div className="col-auto text-md-end text-start">
                      <strong>Total: {item.total.toFixed(2)}</strong>
                    </div>
                    <div className="col-auto text-md-end text-start">
                      {orderItems.length > 1 && (
                        <button type="button" className="btn btn-danger btn-sm ms-2" onClick={() => handleRemoveItem(index)}>
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
              <button type="button" className="btn btn-primary" onClick={handleAddItem}>
                Add Item
              </button>
            </div>
            <div className="col-sm-3 col-6">
              <strong>Grand Total: {grandTotal.toFixed(2)}</strong>
            </div>
          </div>

          <div className="row mt-5 justify-content-center">
            <div className="col-auto text-center">
              <button type="submit" className="btn btn-success">
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceOrder;
