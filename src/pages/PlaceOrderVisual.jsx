import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/Auth/AuthProvider';
import supabase from '../utils/supabaseClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Typography, MenuItem, Select, InputLabel, FormControl, Button, Card, CardContent, CardMedia, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Divider, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2'

const fetchStores = async (businessUid) => {
  const { data, error } = await supabase
    .from('business_relations')
    .select(
      'relation_id, business_uid_1, business_uid_2, business_2: businesses!business_uid_2(business_name, owner_name, contact, business_uid)'
    )
    .eq('business_uid_1', businessUid);

  if (error) throw new Error(error.message);
  return data.map((relation) => ({
    value: relation.business_2.business_uid,
    label: relation.business_2.business_name,
  }));
};

const fetchProducts = async (storeUid) => {
  if (!storeUid) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, product_name, rate, mrp, qty_in_ctn, image_url')
    .eq('seller_uid', storeUid);

  if (error) throw new Error(error.message);
  return data;
};

const PlaceOrderVisual = () => {
  const { user, userBusinessData } = useAuth();
  const [selectedStore, setSelectedStore] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [toast, setToast] = useState({ type: '', message: '', show: false });
  const navigate = useNavigate();

  const handleToastClose = () => {
    setToast({ ...toast, show: false });
  };

  const { data: stores = [], isLoading: isStoresLoading, error: storesError } = useQuery({
    queryKey: ['stores', userBusinessData.business_uid],
    queryFn: () => fetchStores(userBusinessData.business_uid),
    enabled: !!userBusinessData.business_uid,
    refetchOnWindowFocus: false,
  });

  const { data: products = [], isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ['products', selectedStore?.value],
    queryFn: () => fetchProducts(selectedStore?.value),
    enabled: !!selectedStore,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (products.length && orderItems.length === 0) {
      setOrderItems(
        products.map((product) => ({
          product: { value: product.id, label: product.product_name },
          quantityInPcs: 0,
          quantityInCrtn: 0,
          total: 0,
          quantityInvalid: false,
        }))
      );
    }
  }, [products]);

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    setGrandTotal(total);
  };

  const handleQuantityChange = (value, index, type) => {
    const updatedOrderItems = [...orderItems];
    const selectedProduct = products.find(
      (product) => product.id === updatedOrderItems[index].product?.value
    );

    if (!selectedProduct) return;

    const qtyInCtn = selectedProduct.qty_in_ctn || 1;
    let pcsValue = parseInt(updatedOrderItems[index].quantityInPcs, 10) || 0;
    let crtnValue = parseInt(updatedOrderItems[index].quantityInCrtn, 10) || 0;

    let quantityInvalid = false;

    const adjustQuantities = (pcs, ctn, productQtyInCtn) => {
      const totalPcs = pcs + ctn * productQtyInCtn;
      return {
        adjustedCartons: Math.floor(totalPcs / productQtyInCtn),
        adjustedPieces: totalPcs % productQtyInCtn,
      };
    };

    // Ensure the value passed is a number
    const newValue = parseInt(value, 10) || 0;

    if (type === 'pcs') {
      pcsValue = newValue;
      if (pcsValue < 0 || isNaN(pcsValue)) {
        quantityInvalid = true;
      } else if (selectedProduct.qty_in_ctn !== null) {
        const { adjustedCartons, adjustedPieces } = adjustQuantities(
          pcsValue,
          crtnValue,
          qtyInCtn
        );
        crtnValue = adjustedCartons;
        pcsValue = adjustedPieces;
      }
    } else if (type === 'crtn' && selectedProduct.qty_in_ctn !== null) {
      crtnValue = newValue;
      if (crtnValue < 0 || isNaN(crtnValue)) {
        quantityInvalid = true;
      } else {
        const { adjustedCartons, adjustedPieces } = adjustQuantities(
          pcsValue % qtyInCtn,
          crtnValue,
          qtyInCtn
        );
        crtnValue = adjustedCartons;
        pcsValue = adjustedPieces;
      }
    }

    updatedOrderItems[index] = {
      ...updatedOrderItems[index],
      quantityInPcs: pcsValue,
      quantityInCrtn: crtnValue,
      quantityInvalid,
      total: (pcsValue + qtyInCtn * crtnValue) * selectedProduct.rate,
    };

    setOrderItems(updatedOrderItems);
    calculateTotal(updatedOrderItems);
  };

  const mutation = useMutation({
    mutationFn: async (orderData) => {
      console.log('trying2');

      const { data: orderDataResponse, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select('order_id')
        .single();

      if (error) throw new Error(error.message);
      const orderId = orderDataResponse?.order_id;

      const orderItemsData = orderData.orderItems.map((item) => ({
        ...item,
        order_id: orderId,
      }));

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (orderItemsError) throw new Error(orderItemsError.message);
    }
  });

  const handleIncrement = (index, type) => {
    const updatedOrderItems = [...orderItems];
    if (type === 'pcs') {
      updatedOrderItems[index].quantityInPcs += 1;
    } else if (type === 'crtn') {
      updatedOrderItems[index].quantityInCrtn += 1;
    }
    handleQuantityChange(
      type === 'pcs' ? updatedOrderItems[index].quantityInPcs : updatedOrderItems[index].quantityInCrtn,
      index,
      type
    );
  };

  const handleDecrement = (index, type) => {
    const updatedOrderItems = [...orderItems];
    if (type === 'pcs' && updatedOrderItems[index].quantityInPcs > 0) {
      updatedOrderItems[index].quantityInPcs -= 1;
    } else if (type === 'crtn' && updatedOrderItems[index].quantityInCrtn > 0) {
      updatedOrderItems[index].quantityInCrtn -= 1;
    }
    handleQuantityChange(
      type === 'pcs' ? updatedOrderItems[index].quantityInPcs : updatedOrderItems[index].quantityInCrtn,
      index,
      type
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validOrderItems = orderItems.filter(
      (item) => item.quantityInPcs > 0 || item.quantityInCrtn > 0
    );

    if (validOrderItems.length === 0) {
      setToast({ show: true, type: 'warning', message: 'Please select at least one item with quantity greater than zero.' });
      return;
    }

    const orderItemsData = validOrderItems.map((item) => ({
      product_id: item.product.value,
      qty_in_pcs: item.quantityInPcs || 0,
      qty_in_ctn: item.quantityInCrtn || 0,
    }));

    const orderData = {
      from_store: userBusinessData.business_uid,
      to_store: selectedStore.value,
      amount: grandTotal,
      placed_by: user.id,
      orderItems: orderItemsData,
    };

    try {
      const { data, error } = await supabase.rpc('place_order', {
        order_data: orderData,
        order_items: orderItemsData  // Convert order items to JSON
      });
      if (error) throw new Error(error.message);
      setToast({
        show: true,
        type: 'success',
        message: 'Request submitted successfully',
      });
    } catch (error) {
      setToast({
        show: true,
        type: 'danger',
        message: `${error.message}`,
      });
    }
  };

  return (
    <div style={{ marginTop: '40px', padding: '0 16px' }}>
      <Typography variant="h4" gutterBottom>Place Order</Typography>

      <Grid container spacing={3}>
        <Grid item size={{ xs: 12, md: 8 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Business</InputLabel>
            <Select
              value={selectedStore?.value || ''}
              onChange={(e) => {
                const selected = stores.find(store => store.value === e.target.value);
                setSelectedStore(selected);
              }}
              label="Select Business"
            >
              <MenuItem value="">-- Select a Business --</MenuItem>
              {stores.map((store) => (
                <MenuItem key={store.value} value={store.value}>
                  {store.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Grid container spacing={3}>
            {loadingProducts ? (
              <Typography>Loading products...</Typography>
            ) : (
              products.map((product, index) => (
                <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      boxShadow: 3, // adds shadow effect
                      borderRadius: 2, // rounded corners
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05) translateY(-10px) translateZ(20px)', // Scale the card, lift it up and push it out
                        boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)', // Stronger shadow to make it look like it's floating
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={`https://qjxkpwpdalwkedmixrac.supabase.co/storage/v1/object/public/product-images/${product.image_url}`}
                      alt={product.product_name}
                      sx={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'contain',
                        margin: '8px',
                        borderRadius: 1, // rounded corners for the image
                      }}
                    />
                    <CardContent>
                      <Box mb={2}>
                        {/* Product Name */}
                        <Typography variant="h5" fontWeight="bold">
                          {product.product_name}
                        </Typography>
                        <Divider sx={{ borderColor: '#060606', my: 1 }} />
                        <Typography variant="body2" fontWeight="bold">
                          {product.qty_in_ctn ? `PCS/Carton: ${product.qty_in_ctn}` : "Sold in pieces only"}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          MRP: ₹{product.mrp.toFixed(2)}
                        </Typography>
                        <Divider sx={{ borderColor: '#060606', my: 1 }} />
                        <Typography variant="body1" fontWeight="bold">
                          <strong>Rate:</strong> ₹{product.rate.toFixed(2)}
                        </Typography>
                      </Box>

                      <div>
                        {/* Increment/Decrement Buttons */}
                        <Box display="flex" justifyContent="space-around">
                          <IconButton
                            onClick={() => handleDecrement(index, 'pcs')}
                            disabled={orderItems[index]?.quantityInPcs <= 0}
                            size="small"
                            sx={{
                              borderRadius: '50%',
                              backgroundColor: '#000000',
                              color: '#FFFFFF',
                              border: '1px solid #666',
                              border: '1px solid black',
                              '&:hover': {
                                backgroundColor: '#333333',
                              },
                              '&:disabled': {
                                backgroundColor: '#E0E0E0',
                                border: 'none',
                              },
                            }}
                          >
                            <RemoveIcon />
                          </IconButton>

                          <input
                            type="number"
                            value={orderItems[index]?.quantityInPcs}
                            onChange={(e) => handleQuantityChange(e.target.value, index, 'pcs')}
                            style={{
                              width: '60px',
                              textAlign: 'center',
                            }}
                          />

                          <IconButton
                            onClick={() => handleIncrement(index, 'pcs')}
                            size="small"
                            sx={{
                              borderRadius: '50%',
                              backgroundColor: '#000000',
                              color: '#FFFFFF',
                              border: '1px solid #666',
                              '&:hover': {
                                backgroundColor: '#333333',
                              },
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>

                        {product.qty_in_ctn && (
                          <Box display="flex" justifyContent="space-around" marginTop="8px">
                            <IconButton
                              onClick={() => handleDecrement(index, 'crtn')}
                              disabled={orderItems[index]?.quantityInCrtn <= 0}
                              size="small"
                              sx={{
                                borderRadius: '50%',
                                backgroundColor: '#000000',
                                color: '#FFFFFF',
                                border: '1px solid #666',
                                '&:hover': {
                                  backgroundColor: '#333333',
                                },
                                '&:disabled': {
                                  backgroundColor: '#E0E0E0',
                                  border: 'none',
                                },
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>

                            <input
                              type="number"
                              value={orderItems[index]?.quantityInCrtn}
                              onChange={(e) => handleQuantityChange(e.target.value, index, 'crtn')}
                              style={{
                                width: '60px',
                                textAlign: 'center',
                                border: '1px solid black',
                              }}
                            />

                            <IconButton
                              onClick={() => handleIncrement(index, 'crtn')}
                              size="small"
                              sx={{
                                borderRadius: '50%',
                                backgroundColor: '#000000',
                                color: '#FFFFFF',
                                border: '1px solid #666',
                                '&:hover': {
                                  backgroundColor: '#333333',
                                },
                              }}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card
            variant="outlined"
            sx={(theme) => ({
              boxShadow: theme.palette.mode === 'dark'
                ? '0px 2px 5px rgba(255, 255, 255, 0.2)'  // Lighter shadow for dark mode
                : '0px 2px 5px rgba(0, 0, 0, 0.1)',  // Standard shadow for light mode
              borderRadius: '5px',
              border: '1px dashed #ccc',
            })}
          >
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  borderBottom: '1px dashed #ccc',
                  paddingBottom: '10px',
                }}
              >
                Order Summary
              </Typography>

              {/* Billing Information */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Billing Name:</strong> {userBusinessData.business_name} {/* Example of user name */}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </Typography>
              </Box>

              {/* Order Items Table */}
              <TableContainer component={Paper}>
                <Table size="small" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', padding: '8px 10px', borderBottom: '2px solid #333' }}>
                        Item
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', padding: '8px 10px', borderBottom: '2px solid #333' }}>
                        Qty
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', padding: '8px 10px', borderBottom: '2px solid #333' }}>
                        Total (₹)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderItems
                      .filter((item) => item.quantityInPcs > 0 || item.quantityInCrtn > 0)
                      .map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ padding: '8px 10px', borderBottom: '1px dashed #ccc' }}>
                            {item.product.label}
                          </TableCell>
                          <TableCell align="right" sx={{ padding: '8px 10px', borderBottom: '1px dashed #ccc' }}>
                            {`${item.quantityInPcs} pcs`} <br />
                            {`${item.quantityInCrtn} ctn`}
                          </TableCell>
                          <TableCell align="right" sx={{ padding: '8px 10px', borderBottom: '1px dashed #ccc' }}>
                            ₹{item.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                  <tfoot>
                    <TableRow>
                      <TableCell colSpan={2} align="right" sx={{ padding: '8px 10px', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                        <strong>Grand Total</strong>
                      </TableCell>
                      <TableCell align="right" sx={{ padding: '8px 10px', fontWeight: 'bold', borderTop: '2px solid #333' }}>
                        <strong>₹{grandTotal.toFixed(2)}</strong>
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              marginTop: '16px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              backgroundColor: '#8E44AD',
              '&:hover': {
                backgroundColor: '#7D3C9B',
              },
              border: '2px dashed #8E44AD',
            }}
            onClick={handleSubmit}
          >
            Place Order
          </Button>
        </Grid>
      </Grid>

      <Toast
        type={toast.type}
        message={toast.message}
        show={toast.show}
        onClose={handleToastClose}
      />
    </div>
  );
};

export default PlaceOrderVisual;
