import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";  // Import Link component for routing
import supabase from "../supabaseClient";
import { useAuth } from "../components/AuthProvider";
import Toast from "../components/Toast";

const Orders = () => {
  const navigate = useNavigate();
  const { userBusinessData } = useAuth();
  const [fromOrders, setFromOrders] = useState([]);
  const [toOrders, setToOrders] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [toast, setToast] = useState({ type: "", message: "", show: false });

  // Fetch Orders where the user’s business is `from_store` or `to_store`
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Fetch orders where the business is `from_store`
        const { data: fromData, error: fromError } = await supabase
          .from("orders")
          .select("*, from_store (business_name), to_store (business_name), placed_by")
          .eq("from_store", userBusinessData.business_uid);

        if (fromError) throw fromError;
        setFromOrders(fromData);

        // Fetch orders where the business is `to_store`
        const { data: toData, error: toError } = await supabase
          .from("orders")
          .select("*, from_store (business_name), to_store (business_name), placed_by")
          .eq("to_store", userBusinessData.business_uid);

        if (toError) throw toError;
        setToOrders(toData);

        // Get all unique placed_by UUIDs from both order arrays
        const placedByUUIDs = [
          ...new Set([
            ...fromData.map((order) => order.placed_by),
            ...toData.map((order) => order.placed_by),
          ]),
        ];

        // Fetch user names from the 'profiles' table using the placed_by UUIDs
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", placedByUUIDs);

        if (profilesError) throw profilesError;

        // Map the user names by UUID
        const userNameMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile.name;  // Map UUID to name
          return acc;
        }, {});

        setUserNames(userNameMap);  // Store the names in state
      } catch (error) {
        console.error("Error fetching orders:", error.message);
        setToast({
          type: "danger",
          message: `Failed to fetch orders: ${error.message}`,
          show: true,
        });
        setTimeout(() => setToast({ ...toast, show: false }), 5000);
      }
    };

    if (userBusinessData?.business_uid) {
      fetchOrders();
    }
  }, [userBusinessData?.business_uid]);

  // Handle + button click for navigation
  const handleAddOrderClick = () => {
    navigate("/place-order");
  };

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

      <h2>Orders</h2>

      {/* Floating Action Button */}
      <div
        className="position-fixed bottom-0 end-0 m-4 d-flex flex-column align-items-center"
        style={{ zIndex: 1050 }}
      >
        <button
          className="btn btn-dark rounded-circle p-3 mb-3 shadow-lg"
          style={{ transition: "transform 0.3s ease-in-out" }}
          onClick={handleAddOrderClick}  // On click, redirect to the Place Order page
        >
          <i className="bx bx-plus" style={{ fontSize: "30px" }}></i>
        </button>
      </div>

      {/* From Store Orders Table */}
      <div className="mb-4">
        <h4>Orders from Your Store</h4>
        <table className="table table-bordered table-hover table-striped">
          <thead className="bg-primary text-white">
            <tr>
              <th>Order ID</th>
              <th>Created At</th>
              <th>From Store</th>
              <th>To Store</th>
              <th>Amount</th>
              <th>Placed By</th>
            </tr>
          </thead>
          <tbody>
            {fromOrders.length > 0 ? (
              fromOrders.map((order) => (
                <tr key={order.order_id}>
                  <td>
                    {/* Link to OrderDetails page */}
                    <Link to={`/order/${order.order_id}`}>
                      {order.order_id}
                    </Link>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>{order.from_store.business_name}</td>
                  <td>{order.to_store.business_name}</td>
                  <td>{order.amount.toFixed(2)}</td>
                  <td>{userNames[order.placed_by]}</td> {/* Display user name */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* To Store Orders Table */}
      <div className="mb-4">
        <h4>Orders to Your Store</h4>
        <table className="table table-bordered table-hover table-striped">
          <thead className="bg-success text-white">
            <tr>
              <th>Order ID</th>
              <th>Created At</th>
              <th>From Store</th>
              <th>To Store</th>
              <th>Amount</th>
              <th>Placed By</th>
            </tr>
          </thead>
          <tbody>
            {toOrders.length > 0 ? (
              toOrders.map((order) => (
                <tr key={order.order_id}>
                  <td>
                    {/* Link to OrderDetails page */}
                    <Link to={`/order/${order.order_id}`}>
                      {order.order_id}
                    </Link>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>{order.from_store.business_name}</td>
                  <td>{order.to_store.business_name}</td>
                  <td>{order.amount.toFixed(2)}</td>
                  <td>{userNames[order.placed_by]}</td> {/* Display user name */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
