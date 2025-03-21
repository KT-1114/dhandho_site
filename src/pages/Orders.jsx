import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Badge, CircularProgress, Box, Fab } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import AddIcon from "@mui/icons-material/Add";
import supabase from "../utils/supabaseClient";
import { useAuth } from "../components/Auth/AuthProvider";
import { useTheme } from '@mui/material/styles';

// Fetch orders function
const fetchOrders = async (businessUid) => {
  console.log("fetching");
  try {
    // Fetch "from" orders
    const { data: fromOrders, error: fromError } = await supabase
      .from("orders")
      .select(`
        *,
        from_store (business_name),
        to_store (business_name),
        placed_by (name)
      `)
      .eq("from_store", businessUid);

    if (fromError) throw fromError;

    // Fetch "to" orders
    const { data: toOrders, error: toError } = await supabase
      .from("orders")
      .select(`
        *,
        from_store (business_name),
        to_store (business_name),
        placed_by (name)
      `)
      .eq("to_store", businessUid);

    if (toError) throw toError;

    return { fromOrders, toOrders };
  } catch (error) {
    throw new Error(error.message);
  }
};


const OrdersTable = ({ orders, onRowClick, title, isToStore = false }) => {
  const theme = useTheme();  // Access the theme

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    const formattedDate = date.toLocaleDateString("en-IN", options);

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? "0" + minutes : minutes} ${ampm}`;

    return `${formattedDate} ${formattedTime}`;
  };

  const tableCellStyle = {
    fontWeight: "bold",
    color: theme.palette.mode === 'dark' ? "white" : "text.primary",
    padding: "14px",
    position: "relative",
    fontSize: "14px",
    "&::after": {
      content: '""',
      position: "absolute",
      right: 0,
      top: "25%",
      height: "50%",
      width: "1px",
      backgroundColor: theme.palette.mode === 'dark' ? "#666" : "#ddd",
    },
  };


  return (
    <Box mb={4}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ bgcolor: theme.palette.mode === 'dark' ? "#333" : "white", borderRadius: 2, boxShadow: "none", border: `1px solid ${theme.palette.mode === 'dark' ? "#444" : "#eee"}`, width: "100%" }}>
          <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? "#555" : "#e0e0e0" }}>
            <TableRow>
              <TableCell sx={tableCellStyle}>Order ID</TableCell>
              <TableCell sx={tableCellStyle}>Created At</TableCell>
              <TableCell sx={tableCellStyle}>
                {isToStore ? "From Store" : "To Store"}
              </TableCell>
              <TableCell sx={tableCellStyle}>Amount</TableCell>
              <TableCell sx={tableCellStyle}>Placed By</TableCell>
              <TableCell sx={tableCellStyle}>Order Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow
                  key={order.order_id}
                  hover
                  sx={{
                    cursor: "pointer",
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover, // Default hover effect
                    },
                  }}
                  onClick={() => {
                    const orderDetails = {
                      orderId: order.order_id,
                      fromStore: order.from_store.business_name,
                      toStore: order.to_store.business_name,
                      createdAt: new Date(order.created_at).toLocaleString(),
                      placedBy: order.placed_by.name,
                      amount: order.amount.toFixed(2),
                      status: order.status,
                    };
                    onRowClick(order.order_id, orderDetails);
                  }}
                >
                  <TableCell sx={tableCellStyle}>{order.order_id}</TableCell>
                  <TableCell sx={tableCellStyle}>{new Date(order.created_at).toLocaleString()}</TableCell>
                  <TableCell sx={tableCellStyle}>{isToStore ? order.from_store.business_name : order.to_store.business_name}</TableCell>
                  <TableCell sx={tableCellStyle}>{order.amount.toFixed(2)}</TableCell>
                  <TableCell sx={tableCellStyle}>{order.placed_by.name}</TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: "center" }}>
                    <Badge
                      color={order.status === "PLACED" ? "warning" : order.status === "ACCEPTED" ? "success" : "secondary"}
                      badgeContent={order.status}
                    />
                  </TableCell>

                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const Orders = () => {
  const navigate = useNavigate();
  const { userBusinessData } = useAuth();
  const [toast, setToast] = useState({ type: "", message: "", show: false });

  // Fetch orders using react-query
  const { data, error, isLoading } = useQuery({
    queryKey: ["orders", userBusinessData.business_uid],
    queryFn: () => fetchOrders(userBusinessData.business_uid),
    enabled: !!userBusinessData?.business_uid,
    staleTime: 1000 * 60, // 1 minute
    onError: (err) => {
      setToast({
        type: "danger",
        message: `Failed to fetch orders: ${err.message}`,
        show: true,
      });
    },
  });

  const handleAddOrderClick = () => {
    navigate("/place-order");
  };

  const handleRowClick = (orderId, orderDetails) => {
    console.log('orderDetails', orderDetails);
    navigate(`/order/${orderId}`, {
      state: { orderDetails }, // Pass the full order object
    });
  };

  const handleToastClose = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Toast Notifications */}
      <Toast
        type={toast.type}
        message={toast.message}
        show={toast.show}
        onClose={handleToastClose}
      />

      <Typography variant="h4" gutterBottom>Orders</Typography>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1050,
        }}
        onClick={handleAddOrderClick}
      >
        <AddIcon />
      </Fab>

      {/* Orders Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box mt={4}>
          <Typography color="error">Error loading orders.</Typography>
        </Box>
      ) : (
        <>
          {/* Orders To Your Store */}
          <OrdersTable
            orders={data?.toOrders || []}
            onRowClick={handleRowClick}
            title="Orders To Your Store"
            isToStore={true}
          />

          {/* Orders From Your Store */}
          <OrdersTable
            orders={data?.fromOrders || []}
            onRowClick={handleRowClick}
            title="Orders From Your Store"
            isToStore={false}
          />
        </>
      )}
    </Box>
  );
};

export default Orders;
