import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { useAuth } from "../components/AuthProvider";
import Toast from "../components/Toast";

const OrderDetails = () => {
  const navigate = useNavigate();
    const { orderId } = useParams();  // Get the orderId from URL params
    const { userBusinessData } = useAuth();
    const [orderDetails, setOrderDetails] = useState(null);
    const [orderItems, setOrderItems] = useState([]);  // Store order items
    const [userNames, setUserNames] = useState({});
    const [toast, setToast] = useState({ type: "", message: "", show: false });

    // Fetch order details by orderId
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                // Fetch the order data based on orderId
                const { data, error } = await supabase
                    .from("orders")
                    .select("*, from_store (business_name), to_store (business_name), placed_by")
                    .eq("order_id", orderId)
                    .single();  // Fetch a single order

                if (error) throw error;

                setOrderDetails(data);

                // Fetch user names for the placed_by UUID
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .in('id', [data.placed_by]);  // Use the 'placed_by' UUID from the order

                if (profilesError) throw profilesError;

                const userNameMap = profiles.reduce((acc, profile) => {
                    acc[profile.id] = profile.name; // Map UUID to name
                    return acc;
                }, {});

                setUserNames(userNameMap);

                // Fetch order items based on order_id and include product details
                const { data: itemsData, error: itemsError } = await supabase
                    .from('order_items')
                    .select(`
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
          `)
                    .eq('order_id', orderId); // Fetch order items by order_id

                if (itemsError) throw itemsError;

                setOrderItems(itemsData); // Set order items in state

            } catch (error) {
                console.error("Error fetching order details:", error.message);
                setToast({
                    type: "danger",
                    message: `Failed to fetch order details: ${error.message}`,
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
            <button
                className="mt-5 back-anchor-container"
                onClick={() => {
                    navigate("/orders");
                }}
            >
                <i className="bx bx-arrow-back"></i>
                Back
            </button>

            <div className="card">
                <div className="card-header">
                    <h4>Order ID: {orderDetails.order_id}</h4>
                </div>
                <div className="card-body">
                    <p><strong>From Store:</strong> {orderDetails.from_store.business_name}</p>
                    <p><strong>To Store:</strong> {orderDetails.to_store.business_name}</p>
                    <p><strong>Amount:</strong> ${orderDetails.amount.toFixed(2)}</p>
                    <p><strong>Placed By:</strong> {userNames[orderDetails.placed_by]}</p>
                    <p><strong>Created At:</strong> {new Date(orderDetails.created_at).toLocaleString()}</p>
                    <p><strong>Status:</strong> {orderDetails.status}</p>
                    <p><strong>Notes:</strong> {orderDetails.notes || 'No notes available.'}</p>
                </div>
            </div>

            {/* Order Items Table */}
            <div className="mt-4">
                <h4>Order Items</h4>
                <table className="table table-bordered table-hover table-striped">
                    <thead className="bg-info text-white">
                        <tr>
                            <th>Product Name</th>
                            <th>Quantity (pcs)</th>
                            <th>Quantity (ctn)</th>
                            <th>Profit</th>
                            <th>Price</th>
                            <th>Cost Price</th>
                            <th>MRP</th>
                            <th>Image</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderItems.length > 0 ? (
                            orderItems.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.products.product_name}</td>
                                    <td>{item.qty_in_pcs}</td>
                                    <td>{item.qty_in_ctn}</td>
                                    <td>{item.profit}</td>
                                    <td>${(item.products.rate * item.qty_in_pcs).toFixed(2)}</td>
                                    <td>${(item.products.cost_price * item.qty_in_pcs).toFixed(2)}</td>
                                    <td>${(item.products.mrp * item.qty_in_pcs).toFixed(2)}</td>
                                    <td>
                                        <img
                                            src={item.products.image_url}
                                            alt={item.products.product_name}
                                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center">No items found for this order.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderDetails;
