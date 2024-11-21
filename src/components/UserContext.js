import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabaseClient';
import Toast from './Toast';
import { useAuth } from './AuthProvider';

const UserContext = createContext();

export const useUserContext = () => useContext(UserContext);

export const ContextProvider = ({ children }) => {
  const { user } = useAuth(); // Access user state from AuthContext
  const [role, setRole] = useState(null); // Track the role of the user
  const [userBusinessData, setUserBusinessData] = useState(null); // Store the business data
  const [userLoading, setUserLoading] = useState(true); // Track loading state for business data
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  // Fetch the user role and business data when the user changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;

      const userRole = user.user_metadata?.user_role; // Access role from user metadata
      setRole(userRole);
    };

    fetchUserRole();
  }, [user]); // Run when `user` changes

  // Fetch the business data based on user role
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!user || !role) {
        setUserLoading(true);
        return;
      }

      if (role === 'Employee') {
        // Fetch business the employee works at
        const { data: employeeData, error } = await supabase
          .from('employees')
          .select('works_at, businesses(*)')
          .eq('user_id', user.id);

        if (error) {
          setToast({ show: true, type: 'danger', message: error.message });
        } else {
          setUserBusinessData(employeeData); // Store employee's business data
        }
      } else if (role === 'Business Owner') {
        // Fetch business owned by the user
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (error) {
          setToast({ show: true, type: 'danger', message: error.message });
        } else {
          setUserBusinessData(data); // Store business data
        }
      }

      setUserLoading(false); // Set loading to false once data is fetched
    };

    fetchBusinessData();
  }, [user, role]); // Fetch business data when user or role changes

  const handleToastClose = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <UserContext.Provider value={{ userBusinessData, userLoading }}>
      {children}
      <Toast
        type={toast.type}
        message={toast.message}
        show={toast.show}
        onClose={handleToastClose}
      />
    </UserContext.Provider>
  );
};
