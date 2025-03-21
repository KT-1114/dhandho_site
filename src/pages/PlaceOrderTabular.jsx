import React, { useState } from "react";
import { Autocomplete, TextField, CircularProgress, Box, Button, Typography, IconButton, InputAdornment, Divider } from "@mui/material";
import { ArrowDropDown, Clear, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { useAuth } from "../components/Auth/AuthProvider";
import supabase from "../utils/supabaseClient";
import { useQuery, useMutation } from '@tanstack/react-query';

// Function to fetch stores
const fetchStores = async (businessUid) => {
  const { data, error } = await supabase
    .from("business_relations")
    .select(
      "relation_id, business_uid_1, business_uid_2, business_2: businesses!business_uid_2(business_name, owner_name, contact, business_uid)"
    )
    .eq("business_uid_1", businessUid);

  if (error) throw new Error(error.message);
  return data;
};

// Function to fetch products for a store
const fetchProducts = async (storeUid) => {
  const { data, error } = await supabase
    .from("products")
    .select("id, product_name, rate, mrp, qty_in_ctn")
    .eq("seller_uid", storeUid);

  if (error) throw new Error(error.message);
  return data;
};

const PlaceOrderTabular = () => {
  const { user, userBusinessData } = useAuth();
  const navigate = useNavigate();
  const [selectedStore, setSelectedStore] = useState(null);
  const [orderItems, setOrderItems] = useState([{
    product: null,
    quantityInPcs: 0,
    quantityInCrtn: 0,
    rate: 0,
    mrp: 0,
    total: 0,
  }]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [toast, setToast] = useState({ type: "", message: "", show: false });

  const { data: stores = [], isLoading: loadingStores, error: storesError } = useQuery({
    queryKey: ["stores", userBusinessData.business_uid],
    queryFn: () => fetchStores(userBusinessData.business_uid),
    enabled: !!userBusinessData.business_uid,
  });

  const storeOptions = stores?.map((store) => ({
    value: store.business_2?.business_uid,
    label: store.business_2?.business_name,
  }));

  const { data: products = [], isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ["products", selectedStore?.value],
    queryFn: () => fetchProducts(selectedStore?.value),
    enabled: !!selectedStore,
  });

  const productOptions = products?.map((product) => ({
    value: product.id,
    label: product.qty_in_ctn
      ? `${product.product_name} - ${product.qty_in_ctn} in carton`
      : `${product.product_name} - pcs only`,
  }));

  const handleStoreChange = (event, newValue) => {
    setSelectedStore(newValue);
  };

  const handleProductChange = (event, newValue, index) => {
    const updatedOrderItems = [...orderItems];
    if (!newValue) {
      updatedOrderItems[index].product = null;
      updatedOrderItems[index].rate = 0;
      updatedOrderItems[index].mrp = 0;
      updatedOrderItems[index].quantityInPcs = 0;
      updatedOrderItems[index].quantityInCrtn = 0;
      updatedOrderItems[index].total = 0;
    } else {
      const selectedProduct = products.find(product => product.id === newValue.value);
      updatedOrderItems[index].product = newValue;
      updatedOrderItems[index].rate = selectedProduct.rate;
      updatedOrderItems[index].mrp = selectedProduct.mrp;
    }
    setOrderItems(updatedOrderItems);
    calculateTotal(updatedOrderItems);
  };

  const handleQuantityChange = (value, index, type) => {
    const updatedOrderItems = [...orderItems];
    const selectedProduct = products.find(
      product => product.id === updatedOrderItems[index].product?.value
    );
    if (!selectedProduct) return;
    const qtyInCtn = selectedProduct.qty_in_ctn || 1;
    let pcsValue = parseInt(updatedOrderItems[index].quantityInPcs, 10) || 0;
    let crtnValue = parseInt(updatedOrderItems[index].quantityInCrtn, 10) || 0;

    let quantityInvalid = false;
    if (type === "pcs") {
      pcsValue = value ? parseInt(value, 10) : 0;
      if (pcsValue < 0 || isNaN(pcsValue)) {
        quantityInvalid = true;
      } else {
        if (selectedProduct.qty_in_ctn !== null) {
          const totalPcs = pcsValue + crtnValue * qtyInCtn;
          crtnValue = Math.floor(totalPcs / qtyInCtn);
          pcsValue = totalPcs % qtyInCtn;
        }
      }
    } else if (type === "crtn" && selectedProduct.qty_in_ctn !== null) {
      crtnValue = value ? parseInt(value, 10) : 0;
      if (crtnValue < 0 || isNaN(crtnValue)) {
        quantityInvalid = true;
      } else {
        const totalPcs = (pcsValue % qtyInCtn) + crtnValue * qtyInCtn;
        crtnValue = Math.floor(totalPcs / qtyInCtn);
        pcsValue = totalPcs % qtyInCtn;
      }
    }

    updatedOrderItems[index].quantityInPcs = pcsValue;
    updatedOrderItems[index].quantityInCrtn = crtnValue;
    updatedOrderItems[index].quantityInvalid = quantityInvalid;
    updatedOrderItems[index].total = (pcsValue + qtyInCtn * crtnValue) * selectedProduct.rate;
    setOrderItems(updatedOrderItems);
    calculateTotal(updatedOrderItems);
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
    const invalidItems = orderItems.some(item => item.quantityInPcs === 0 && item.quantityInCrtn === 0);
    if (invalidItems) {
      setToast({ show: true, type: 'warning', message: 'Both "Pcs" and "Ctn" cannot be zero for the same item.' });
      return;
    }
    const orderItemsData = orderItems.map(item => ({
      product_id: item.product.value,
      qty_in_pcs: item.quantityInPcs || 0,
      qty_in_ctn: item.quantityInCrtn || 0,
    }));

    const orderData = {
      from_store: userBusinessData.business_uid,
      to_store: selectedStore.value,
      amount: grandTotal,
      placed_by: user.id,
    };

    try {
      const { data: orderDataResponse, error } = await supabase
        .from("orders")
        .insert([orderData])
        .select("order_id")
        .single();

      if (error) {
        setToast({ show: true, type: 'danger', message: `${error.message}` });
        return;
      }

      const orderId = orderDataResponse?.order_id;

      const orderItemsWithOrderId = orderItemsData.map((item) => ({
        ...item,
        order_id: orderId,
      }));

      const { data: orderItemsResponse, error: orderItemsError } =
        await supabase.from("order_items").insert(orderItemsWithOrderId);

      if (orderItemsError) {
        setToast({ show: true, type: 'danger', message: `${orderItemsError.message}` });
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

  const handleToastClose = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <Box sx={{ p: 3, borderRadius: "10px", boxShadow: 2, backgroundColor: "#f9f9f9" }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
        Place Order
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Store Selection Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Store
          </Typography>
          <Autocomplete
            options={storeOptions}
            getOptionLabel={(option) => option.label}
            value={selectedStore}
            onChange={handleStoreChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Store"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: loadingStores ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Order Items */}
        {orderItems.map((item, index) => (
          <Box key={index} sx={{ mb: 3, pt: 2, backgroundColor: "#fff", borderRadius: 2, padding: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Item {index + 1}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {/* Product Field */}
              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={productOptions}
                  getOptionLabel={(option) => option.label}
                  value={item.product || null}
                  onChange={(e, value) => handleProductChange(e, value, index)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Product"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                />
              </Box>

              {/* Quantity Fields */}
              <Box sx={{ flex: 1 }}>
                <TextField
                  type="number"
                  value={item.quantityInPcs}
                  onChange={(e) => handleQuantityChange(e.target.value, index, "pcs")}
                  label="Quantity in Pcs"
                  variant="outlined"
                  fullWidth
                  error={item.quantityInvalid}
                  helperText={item.quantityInvalid ? "Invalid quantity" : ""}
                  inputProps={{ min: 0 }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                  type="number"
                  value={item.quantityInCrtn}
                  onChange={(e) => handleQuantityChange(e.target.value, index, "crtn")}
                  label="Quantity in Crtn"
                  variant="outlined"
                  fullWidth
                  error={item.quantityInvalid}
                  helperText={item.quantityInvalid ? "Invalid quantity" : ""}
                  inputProps={{ min: 0 }}
                />
              </Box>

              {/* Remove Button */}
              <Box sx={{ alignSelf: "center" }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleRemoveItem(index)}
                >
                  Remove Item
                </Button>
              </Box>
            </Box>
          </Box>
        ))}

        {/* Add Item Button */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
          <Box>
            <IconButton
              onClick={handleAddItem}
              sx={{
                fontSize: 30,  // Adjust icon size
                padding: 1,    // Adjust padding to make it more compact
                color: "success.main",
                border: "1px solid"
              }}
            >
              <Add />
            </IconButton>
          </Box>
        </Box>

        {/* Grand Total */}
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Grand Total: {grandTotal.toFixed(2)}
        </Typography>

        {/* Submit Button */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            sx={{ width: "auto" }}
          >
            Place Order
          </Button>
        </Box>
      </form>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          handleClose={handleToastClose}
        />
      )}
    </Box>
  );
};

export default PlaceOrderTabular;
