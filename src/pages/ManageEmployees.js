import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import supabase from '../supabaseClient';

const ManageEmployees = () => {
  const { user } = useAuth(); // Get the current logged-in user
  const [business, setBusiness] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the business for the logged-in user
    const fetchBusinessData = async () => {
      console.log('fbd')
      setLoading(true);
      try {
        const { data: businesses, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id); // Get business owned by the logged-in user

        if (error) {
          throw error;
        }

        if (businesses.length > 0) {
          setBusiness(businesses[0]);

          // Fetch employees working at this business
          const { data: employees, error: employeeError } = await supabase
            .from('employees')
            .select('*')
            .eq('works_at', businesses[0].business_uid);

          if (employeeError) {
            throw employeeError;
          }
          setEmployees(employees);
        }
      } catch (error) {
        console.error('Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [user]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container my-5">
      {business ? (
        <>
          <h1 className="text-center mb-4">{business.business_name}</h1>
          <p>{business.slogan}</p>
          <p>Contact: {business.contact}</p>
          <p>Email: {business.business_email}</p>
          <p>Address: {business.address}</p>

          <h2 className="mt-5">Employees</h2>
          {employees.length > 0 ? (
            <ul className="list-group">
              {employees.map((employee) => (
                <li key={employee.employee_id} className="list-group-item">
                  {employee.employee_name} - {employee.phone}
                </li>
              ))}
            </ul>
          ) : (
            <p>No employees found for this business.</p>
          )}
        </>
      ) : (
        <p>No business found for the current user.</p>
      )}
    </div>
  );
};

export default ManageEmployees;
