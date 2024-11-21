import React, { useState, useEffect } from "react";
import supabase from "../supabaseClient";
import { useAuth } from "../components/AuthProvider";
import Toast from "../components/Toast";

const Connections = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const { userBusinessData } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [businessRelations, setBusinessRelations] = useState([]);
  const [connectedBusinesses, setConnectedBusinesses] = useState(new Set());
  const [toast, setToast] = useState({ type: '', message: '', show: false });
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    const fetchBusinessRelations = async () => {
      const { data, error } = await supabase
        .from("business_relations")
        .select(`relation_id, relation_type, business_uid_1, business_uid_2, business_1:businesses!business_uid_1(business_name, owner_name, contact, business_id), business_2:businesses!business_uid_2(business_name, owner_name, contact, business_id)`)
        .or(`business_uid_1.eq.${userBusinessData.business_uid},business_uid_2.eq.${userBusinessData.business_uid}`);

      if (error) {
        setToast({
          type: 'danger',
          message: `Error fetching business relations: ${error.message}`,
          show: true
        });
        setTimeout(() => setToast({ ...toast, show: false }), 5000);
      }

      if (data) {
        setBusinessRelations(data.map(relation => ({
          ...relation,
          business_info_1: relation.business_1 || {},
          business_info_2: relation.business_2 || {},
        })));

        const connectedSet = new Set();
        data.forEach(relation => {
          if (relation.business_uid_1 === userBusinessData.business_uid) {
            connectedSet.add(relation.business_uid_2);
          } else {
            connectedSet.add(relation.business_uid_1);
          }
        });
        setConnectedBusinesses(connectedSet);
      }
    };

    
    if (userBusinessData?.business_uid) {
      fetchBusinessRelations();
      fetchPendingRequests();
    }
  }, [userBusinessData?.business_uid]);

  const fetchPendingRequests = async () => {
    if (!userBusinessData?.business_uid) return;

    const { data, error } = await supabase
      .from('business_requests')
      .select(`
        request_id,
        from_business_uid,
        to_business_uid,
        request_status,
        created_at,
        relation_type,
        business_from:businesses!from_business_uid(business_name),
        business_to:businesses!to_business_uid(business_name)
      `)
      .or(`from_business_uid.eq.${userBusinessData.business_uid},to_business_uid.eq.${userBusinessData.business_uid}`);
    if (error) {
      setToast({
        type: 'danger',
        message: `Error fetching pending requests: ${error.message}`,
        show: true,
      });
      setTimeout(() => setToast({ ...toast, show: false }), 5000);
    }

    if (data) {
      const sentRequests = data.filter((request) => request.from_business_uid === userBusinessData.business_uid);
      const receivedRequests = data.filter((request) => request.to_business_uid === userBusinessData.business_uid);

      setSentRequests(sentRequests);
      setReceivedRequests(receivedRequests);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    const status = action === 'accept' ? 'approved' : 'rejected'; // 'approved' or 'rejected'

    const { error } = await supabase
      .from('business_requests')
      .update({ request_status: status })
      .eq('request_id', requestId);

    if (error) {
      setToast({
        type: 'danger',
        message: `Error updating request status: ${error.message}`,
        show: true,
      });
      setTimeout(() => setToast({ ...toast, show: false }), 5000);
    } else {
      setToast({
        type: 'success',
        message: `Request ${status} successfully!`,
        show: true,
      });
      setTimeout(() => setToast({ ...toast, show: false }), 5000);
      fetchPendingRequests(); // Refresh pending requests after update
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from('business_requests')
        .delete()
        .eq('request_id', requestId);

      if (error) {
        setToast({
          type: 'danger',
          message: `Error deleting request: ${error.message}`,
          show: true,
        });
        setTimeout(() => setToast({ ...toast, show: false }), 5000);
      } else {
        // Successfully deleted, update the sentRequests state
        setSentRequests((prevRequests) =>
          prevRequests.filter((request) => request.request_id !== requestId)
        );
        setToast({
          type: 'success',
          message: 'Request deleted successfully!',
          show: true,
        });
        setTimeout(() => setToast({ ...toast, show: false }), 5000);
      }
    } catch (error) {
      setToast({
        type: 'danger',
        message: `Error deleting request: ${error.message}`,
        show: true,
      });
      setTimeout(() => setToast({ ...toast, show: false }), 5000);
    }
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length >= 5) { // Start searching after 5 characters
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .ilike("business_id", `%${value}%`);

      if (error) {
        setToast({
          type: 'danger',
          message: `Error searching businesses: ${error.message}`,
          show: true
        });
        setTimeout(() => setToast({ ...toast, show: false }), 5000);
        setFilteredBusinesses([]);
      }

      if (data) {
        // Filter businesses based on connections (only sellers with existing connections)
        const filtered = data.filter((business) => {
          const alreadyConnected = connectedBusinesses.has(business.business_uid);
          const isSeller = business.business_uid !== userBusinessData.business_uid;

          // Check if the business is a seller and already connected
          return isSeller && alreadyConnected;
        });

        // Further check for already sent requests
        const updatedFilteredBusinesses = filtered.map((business) => {
          const requestSent = sentRequests.some(
            (request) =>
              (request.from_business_uid === userBusinessData.business_uid &&
                request.to_business_uid === business.business_uid) ||
              (request.to_business_uid === userBusinessData.business_uid &&
                request.from_business_uid === business.business_uid)
          );

          return {
            ...business,
            requestSent
          };
        });

        setFilteredBusinesses(updatedFilteredBusinesses);
      }
    } else {
      setFilteredBusinesses([]); // Clear results when search term is too short
    }
  };

  const sendConnectionRequest = async (business_uid) => {
    try {
      const { data, error } = await supabase
        .from('business_requests')
        .insert([{
          from_business_uid: userBusinessData.business_uid,
          to_business_uid: business_uid,
          request_status: 'pending',
          relation_type: '1-2'
        }]);

      if (error) throw error;

      setToast({
        type: 'success',
        message: 'Connection request sent successfully!',
        show: true
      });

      setTimeout(() => setToast({ ...toast, show: false }), 5000);
      setShowModal(false);
    } catch (error) {
      console.error('Error sending connection request:', error);
      setToast({
        type: 'danger',
        message: `Error sending connection request: ${error.message}`,
        show: true
      });
      setTimeout(() => setToast({ ...toast, show: false }), 5000);
    }
  };

  return (
    <div className="container mt-5">
      {toast.show && (
        <Toast type={toast.type} message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      )}

      <h2>Connections</h2>

      {/* Vertical Toolbar at the Bottom Right */}
      <div className="position-fixed bottom-0 end-0 m-4 d-flex flex-column align-items-center" style={{ zIndex: 1050 }}>
        {/* Pending Requests Button */}
        <button
          className="btn btn-warning rounded-circle p-3 mb-3 shadow-lg"
          style={{
            transition: "transform 0.3s ease-in-out",
          }}
          onClick={() => setShowPendingModal(true)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bx bx-time" style={{ fontSize: '30px' }}></i>
        </button>

        {/* New Connection Button */}
        <button
          className="btn btn-dark rounded-circle p-3 mb-3 shadow-lg"
          style={{
            transition: "transform 0.3s ease-in-out",
          }}
          onClick={() => setShowModal(true)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bx bx-user-plus" style={{ fontSize: '30px' }}></i>
        </button>

      </div>

      {/* New Connection Modal */}
      {showModal && (
        <div className="modal show" style={{ display: "block" }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Search for Businesses</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Business ID"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {filteredBusinesses.length > 0 && (
                  <ul className="list-group mt-3">
                    {filteredBusinesses.map((business) => (
                      <li key={business.business_id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{business.business_name || "N/A"}</strong>
                          <div>
                            <span>Business ID:</span>
                            <span className="text-muted ms-2">{business.business_id}</span>
                          </div>
                        </div>

                        {business.requestSent ? (
                          <span className="text-muted">Request Already Sent</span> // Message when request is already sent
                        ) : business.business_uid === userBusinessData.business_uid ? (
                          "You"
                        ) : (
                          <span
                            className="text-primary"
                            onClick={() => sendConnectionRequest(business.business_uid)}
                            style={{ cursor: 'pointer' }}
                          >
                            Send Request
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {filteredBusinesses.length === 0 && searchTerm.length >= 5 && (
                  <div className="alert alert-warning mt-3" role="alert">
                    No businesses found with this ID.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests Modal */}
      {showPendingModal && (
        <div className="modal show" style={{ display: "block" }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Pending Connection Requests</h5>
                <button type="button" className="btn-close" onClick={() => setShowPendingModal(false)}></button>
              </div>
              <div className="modal-body">
                {sentRequests.length > 0 && (
                  <div className="mb-4">
                    <h6>Sent Requests</h6>
                    <ul className="list-group">
                      {sentRequests.map((request) => (
                        <li
                          key={request.request_id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <span>To: {request.business_to.business_name || 'Unknown Business'}</span>
                          {/* Apply color based on the request status */}
                          <span
                            className={
                              request.request_status === 'approved'
                                ? 'text-success' // Green for approved
                                : request.request_status === 'rejected'
                                  ? 'text-danger' // Red for rejected
                                  : 'text-warning' // Default for pending or other statuses
                            }
                          >
                            {request.request_status}
                          </span>

                          {/* Delete Icon - Always show for all sent requests */}
                          <i
                            className="bx bx-trash text-danger"
                            style={{ cursor: 'pointer', fontSize: '20px' }}
                            onClick={() => handleDeleteRequest(request.request_id)}
                          ></i>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {receivedRequests.length > 0 && (
                  <div>
                    <h6>Received Requests</h6>
                    <ul className="list-group">
                      {receivedRequests.map((request) => (
                        <li key={request.request_id} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>From: {request.business_from.business_name || 'Unknown Business'}</span>

                          {/* Conditional Rendering based on request status */}
                          {request.request_status === 'approved' ? (
                            <span className="text-success">Accepted</span>
                          ) : request.request_status === 'rejected' ? (
                            <span className="text-danger">Rejected</span>
                          ) : (
                            <span>
                              <i
                                className="bx bx-check text-success bx"
                                style={{ cursor: 'pointer', fontSize: '30px' }}
                                onClick={() => handleRequestAction(request.request_id, 'accept')}
                              ></i>
                              <i
                                className="bx bx-x text-danger bx ml-2"
                                style={{ cursor: 'pointer', fontSize: '30px' }}
                                onClick={() => handleRequestAction(request.request_id, 'reject')}
                              ></i>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {sentRequests.length === 0 && receivedRequests.length === 0 && (
                  <div className="alert alert-info" role="alert">
                    No pending connection requests.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container my-5">
        <h2 className="text-center mb-4">Business Relations</h2>

        {/* Customer Table */}
        <div className="mb-4">
          <h3 className="text-center text-primary mb-3">Customer Business Relations</h3>
          <table className="table align-middle bg-light table-bordered table-hover rounded shadow-lg">
            <thead className="bg-success text-white">
              <tr>
                <th>Customer Business Name</th>
                <th>Owner Name</th>
                <th>Contact</th>
                <th>Business ID</th>
              </tr>
            </thead>
            <tbody className="table-group-divider">
              {businessRelations.length > 0 ? (
                businessRelations.map((relation) => {
                  // If the user is the seller (business_uid_2 is the user), show business_uid_1 as the customer
                  const customerBusiness = relation.business_uid_2 === userBusinessData.business_uid
                    ? relation.business_info_1
                    : null;

                  return customerBusiness ? (
                    <tr key={relation.relation_id}>
                      <td>{customerBusiness.business_name || "N/A"}</td>
                      <td>{customerBusiness.owner_name || "N/A"}</td>
                      <td>{customerBusiness.contact || "N/A"}</td>
                      <td>{customerBusiness.business_id || "N/A"}</td>
                    </tr>
                  ) : null;
                })
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">No customer relations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Seller Table */}
        <div>
          <h3 className="text-center text-primary mb-3">Seller Business Relations</h3>
          <table className="table align-middle bg-light table-bordered table-hover rounded shadow-lg">
            <thead className="bg-danger text-white">
              <tr>
                <th>Seller Business Name</th>
                <th>Owner Name</th>
                <th>Contact</th>
                <th>Business ID</th>
              </tr>
            </thead>
            <tbody className="table-group-divider">
              {businessRelations.length > 0 ? (
                businessRelations.map((relation) => {
                  // If the user is the customer (business_uid_1 is the user), show business_uid_2 as the seller
                  const sellerBusiness = relation.business_uid_1 === userBusinessData.business_uid
                    ? relation.business_info_2
                    : null;

                  return sellerBusiness ? (
                    <tr key={relation.relation_id}>
                      <td>{sellerBusiness.business_name || "N/A"}</td>
                      <td>{sellerBusiness.owner_name || "N/A"}</td>
                      <td>{sellerBusiness.contact || "N/A"}</td>
                      <td>{sellerBusiness.business_id || "N/A"}</td>
                    </tr>
                  ) : null;
                })
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">No seller relations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Connections;
