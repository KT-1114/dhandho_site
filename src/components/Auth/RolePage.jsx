import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useAuth } from './AuthProvider';
import Toast from '../Toast';

export default function RolePage() {
    const navigate = useNavigate();
    const {loading} = useAuth

    // Toast state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const closeToast = () => setToast({ ...toast, show: false });

    const handleEmployeeClick = () => {
        navigate('/employeeAuth');
    };

    const handleBusinessClick = () => {
        navigate('/businessAuth');
    };

    return (
        <div>
            <div className="auth-page">
                {/* Toast Component */}
                <Toast{...toast} onClose={closeToast} />

                <div className="container vh-100 d-flex align-items-center justify-content-center">
                    <div className="row w-100">
                        <div className="col-lg-3"></div>
                        <div className="col-lg-6 d-flex align-items-center justify-content-center">
                            <div className="col-lg-8 p-5 form-2-wrapper border shadow-lg">
                                <div className="logo text-center pt-5 mb-4">
                                    <img src={logo} height={'75px'} alt="Logo" />
                                </div>
                                <div className="row">
                                    <div className='btn cst-btn-link mb-3' onClick={handleEmployeeClick}>
                                        I am an Employee
                                    </div>
                                    <div className='btn cst-btn-link' onClick={handleBusinessClick}>
                                        I am an Owner
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
