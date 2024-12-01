// src/pages/BusinessDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../supabaseClient';
import { useAuth } from '../components/AuthProvider';
import Toast from '../components/Toast';

const BusinessDetails = () => {
  const { businessUid } = useParams(); // Get business UID from URL
  const [businessDetails, setBusinessDetails] = useState(null);
  const [toast, setToast] = useState({ type: '', message: '', show: false });
  const { userBusinessData } = useAuth();

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('business_uid', businessUid)
        .single(); // Fetch only the business with matching business_uid

      if (error) {
        setToast({
          type: 'danger',
          message: `Error fetching business details: ${error.message}`,
          show: true,
        });
        setTimeout(() => setToast({ ...toast, show: false }), 5000);
      }

      if (data) {
        setBusinessDetails(data);
      }
    };

    if (businessUid) {
      fetchBusinessDetails();
    }
  }, [businessUid, toast]);

  return (
    <div className="container mt-5">
      {toast.show && (
        <Toast type={toast.type} message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      )}

      <h2>Business Details</h2>

      {businessDetails ? (
        <div>
          <h3>{businessDetails.business_name}</h3>
          <p><strong>Owner Name:</strong> {businessDetails.owner_name}</p>
          <p><strong>Contact:</strong> {businessDetails.contact}</p>
          <p><strong>Business ID:</strong> {businessDetails.business_id}</p>
          {/* Add more fields as needed */}
        </div>
      ) : (
        <div className="alert alert-info">Loading business details...</div>
      )}
    </div>
  );
};

export default BusinessDetails;
