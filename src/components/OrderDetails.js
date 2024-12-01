import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { useAuth } from "../components/AuthProvider";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

const OrderDetails = () => {
  const { orderId } = useParams(); // Get the orderId from URL params
  const { userBusinessData } = useAuth();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderItems, setOrderItems] = useState([]); // Store order items
  const [userNames, setUserNames] = useState({});
  const [toast, setToast] = useState({ type: "", message: "", show: false });

  // Fetch order details by orderId
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Fetch the order data based on orderId
        const { data, error } = await supabase
          .from("orders")
          .select(
            "*, from_store (business_name), to_store (business_name), placed_by"
          )
          .eq("order_id", orderId)
          .single(); // Fetch a single order

        if (error) throw error;

        setOrderDetails(data);

        // Fetch user names for the placed_by UUID
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", [data.placed_by]); // Use the 'placed_by' UUID from the order

        if (profilesError) throw profilesError;

        const userNameMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile.name; // Map UUID to name
          return acc;
        }, {});

        setUserNames(userNameMap);

        // Fetch order items based on order_id and include product details
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(
            `
            id, 
            product_id, 
            qty_in_pcs, 
            qty_in_ctn, 
            profit, 
            products (
              product_name, 
              rate, 
              mrp, 
              cost_price, 
              image_url
            )
          `
          )
          .eq("order_id", orderId); // Fetch order items by order_id

        if (itemsError) throw itemsError;

        setOrderItems(itemsData); // Set order items in state
      } catch (error) {
        console.error("Error fetching order details:", error.message);
        setToast({
          type: "danger",
          message: `Failed to fetch order details: ₹{error.message}`,
          show: true,
        });
        setTimeout(() => setToast({ ...toast, show: false }), 5000);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (!orderDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <button
        className="back-anchor-container"
        style={{
          position: "absolute",
          top: 65,
          left: 10,
          backgroundColor: "black",
          borderRadius: 15,
          height: 30,
          width: 80,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: 500,
          border: "none",
          outline: "none",
          color: "white",
        }}
        onClick={() => {
          navigate("/orders");
        }}
      >
        <i className="bx bx-arrow-back"></i>
        Back
      </button>
      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <h2>Order Details</h2>
      <div className="card">
        <div className="card-header"  style={{ color: "white",backgroundColor: "black" }}>
          <h4>Order ID: {orderDetails.order_id}</h4>
        </div>
        <div className="card-body">
          <p>
            <strong>From Store:</strong> {orderDetails.from_store.business_name}
          </p>
          <p>
            <strong>To Store:</strong> {orderDetails.to_store.business_name}
          </p>
          <p>
            <strong>Amount:</strong> ₹{orderDetails.amount.toFixed(2)}
          </p>
          <p>
            <strong>Placed By:</strong> {userNames[orderDetails.placed_by]}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {new Date(orderDetails.created_at).toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong> {orderDetails.status}
          </p>
          <p>
            <strong>Notes:</strong>{" "}
            {orderDetails.notes || "No notes available."}
          </p>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="mt-4">
        <h4>Order Items</h4>
        <Table className="bg-light rounded shadow-lg">
          <TableHead className="bg-black">
            <TableRow>
              <TableCell style={{ color: "white" }}>Product Name</TableCell>
              <TableCell style={{ color: "white" }}>Quantity (pcs)</TableCell>
              <TableCell style={{ color: "white" }}>Quantity (ctn)</TableCell>
              <TableCell style={{ color: "white" }}>Price</TableCell>
              <TableCell style={{ color: "white" }}>Cost Price</TableCell>
              <TableCell style={{ color: "white" }}>MRP</TableCell>
            </TableRow>
          </TableHead>
          <tbody>
            {orderItems.length > 0 ? (
              orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.products.product_name}</TableCell>
                  <TableCell>{item.qty_in_pcs}</TableCell>
                  <TableCell>{item.qty_in_ctn}</TableCell>
                  <TableCell>
                    ₹{(item.products.rate * item.qty_in_pcs).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ₹{(item.products.cost_price * item.qty_in_pcs).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ₹{(item.products.mrp * item.qty_in_pcs).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="8" className="text-center">
                  No items found for this order.
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default OrderDetails;
