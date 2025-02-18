import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion'; // Importing motion from framer-motion
import logo from '../../assets/logo.png';

export default function RolePage() {
    const navigate = useNavigate();

    const handleEmployeeClick = () => {
        navigate('/employeeAuth');
    };

    const handleBusinessClick = () => {
        navigate('/businessAuth');
    };

    return (
        <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}
        >
            {/* Adding animation to Paper component */}
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <Paper elevation={4} sx={{ width: '100%', maxWidth: 400, padding: 4, textAlign: 'center' }}>
                    <Box sx={{ mb: 3 }}>
                        <img src={logo} alt="Logo" height="75px" />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4, color: '#333' }}>
                        Choose Your Role
                    </Typography>

                    {/* Button 1 (Employee) with animation on hover */}
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{
                                mb: 2,
                                padding: '12px 0',
                                backgroundColor: '#ffffff',
                                color: '#ec4fe3', // Primary color
                                borderColor: '#ec4fe3', // Primary color
                                '&:hover': {
                                    backgroundColor: '#ec4fe3',
                                    color: '#ffffff',
                                    boxShadow: '0px 4px 10px rgba(236, 79, 227, 0.5)', // Add box shadow
                                    backdropFilter: 'blur(8px)', // Apply blurry background
                                    transition: 'all 0.3s ease', // Smooth transition
                                },
                                transition: 'all 0.3s ease', // Smooth transition
                            }}
                            onClick={handleEmployeeClick}
                        >
                            I am an Employee
                        </Button>
                    </motion.div>

                    {/* Button 2 (Owner) with animation on hover */}
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{
                                padding: '12px 0',
                                backgroundColor: '#ffffff',
                                color: '#794cfb', // Secondary color
                                borderColor: '#794cfb', // Secondary color
                                '&:hover': {
                                    backgroundColor: '#794cfb',
                                    color: '#ffffff',
                                    boxShadow: '0px 4px 10px rgba(121, 76, 251, 0.5)', // Add box shadow
                                    backdropFilter: 'blur(8px)', // Apply blurry background
                                    transition: 'all 0.3s ease', // Smooth transition
                                },
                                transition: 'all 0.3s ease', // Smooth transition
                            }}
                            onClick={handleBusinessClick}
                        >
                            I am an Owner
                        </Button>
                    </motion.div>
                </Paper>
            </motion.div>
        </Box>
    );
}
