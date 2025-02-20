import React from "react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../components/Auth/AuthProvider";
import supabase from "../utils/supabaseClient";
import { useTheme } from "@mui/material/styles";
import Grid from '@mui/material/Grid2'; // Import Grid2

// Helper function to fetch data
const fetchBusinessRelations = async (userBusinessUid) => {
  const { data, error } = await supabase
    .from("business_relations")
    .select(
      `relation_id, 
        business_uid_1, 
        business_uid_2, 
        business_1:businesses!business_uid_1(business_name, owner_name, contact, business_id), 
        business_2:businesses!business_uid_2(business_name, owner_name, contact, business_id)`
    )
    .or(`business_uid_1.eq.${userBusinessUid},business_uid_2.eq.${userBusinessUid}`);

  if (error) throw new Error(error.message);
  return data;
};

const fetchEmployeeCount = async (userBusinessUid) => {
  const { data, error } = await supabase
    .from("employees")
    .select("employee_id")
    .eq("works_at", userBusinessUid);

  if (error) throw new Error(error.message);
  return data.length;
};

const fetchOrders = async (userBusinessUid) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `*, 
        from_store (business_name), 
        to_store (business_name), 
        placed_by (name)`
    )
    .or(`from_store.eq.${userBusinessUid},to_store.eq.${userBusinessUid}`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export default function Home() {
  const { user, userBusinessData } = useAuth();
  const theme = useTheme();

  // Fetch business relations
  const { data: businessRelations, error: businessRelationsError } = useQuery({
    queryKey: ["businessRelations", user?.business_uid],
    queryFn: () => fetchBusinessRelations(userBusinessData?.business_uid),
    enabled: !!userBusinessData, // Only fetch if userBusinessData exists
  });

  // Fetch employee count
  const { data: employeeCount, error: employeeCountError } = useQuery({
    queryKey: ["employeeCount", user?.business_uid],
    queryFn: () => fetchEmployeeCount(userBusinessData?.business_uid),
    enabled: !!userBusinessData, // Only fetch if userBusinessData exists
  });

  // Fetch orders
  const { data: orders, error: ordersError } = useQuery({
    queryKey: ["orders", user?.business_uid],
    queryFn: () => fetchOrders(userBusinessData?.business_uid),
    enabled: !!userBusinessData, // Only fetch if userBusinessData exists
  });

  if (!userBusinessData || !orders) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <div className="spinner-border text-" role="status">
          <span className="visually-hidden"></span>
        </div>
      </Box>
    );
  }

  // Count customers and sellers
  const customersSet = new Set();
  const sellersSet = new Set();
  businessRelations?.forEach((relation) => {
    if (relation.business_uid_1 === userBusinessData.business_uid) {
      sellersSet.add(relation.business_uid_2);
    } else {
      customersSet.add(relation.business_uid_1);
    }
  });

  const customersCount = customersSet.size;
  const sellersCount = sellersSet.size;

  const features = [
    {
      title: "Orders",
      description: "Easily manage and place your orders with a few clicks.",
      icon: "🛒",
      route: "/place-order",
    },
    {
      title: "Products",
      description: "Keep track of your stock levels and update items efficiently.",
      icon: "📦",
      route: "/products",
    },
    {
      title: "Connections",
      description: "View and manage your connections with other businesses.",
      icon: "🤝",
      route: "/connections",
    },
  ];

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

  const tableCellStyleWithoutDivider = {
    fontWeight: "bold",
    color: theme.palette.mode === 'dark' ? "white" : "text.primary",
    padding: "14px",
    position: "relative",
    fontSize: "14px",
  };
  
  return (
    <Box>
      {/* Business Info and Stats */}
      <Card variant="outlined" sx={{ mb: 4, boxShadow: 6, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2} direction={{ xs: "column", sm: "row" }} alignItems="center">
            <Grid item="true" size={{ xs: 12, sm: 4 }}>
              {/* Business Name */}
              <Box display="flex" alignItems="center">
                <Typography variant="h6" sx={{ mr: 1 }}>
                  Business Name:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {userBusinessData.business_name}
                </Typography>
              </Box>

              {/* Public Id */}
              <Box display="flex" alignItems="center" mt={2}>
                <Typography variant="h6" sx={{ mr: 1 }}>
                  Public ID:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {userBusinessData.business_id}
                </Typography>
              </Box>
            </Grid>
            <Grid item="true" size={{ xs: 12, sm: 8 }}>
              <Grid container justifyContent="space-between" textAlign="center">
                <Grid item="true" size={{ xs: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {customersCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customers
                  </Typography>
                </Grid>

                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                <Grid item="true" size={{ xs: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {sellersCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sellers
                  </Typography>
                </Grid>

                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                <Grid item="true" size={{ xs: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {employeeCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Employees
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} justifyContent="space-between" mb={5}>
        {features.map((feature, index) => {
          // Set background color and border color based on the feature's index
          const colors = [
            // '#7ebdc2ff', //verdigris
            // '#f3dfa2ff', //vanilla
            // '#efe6ddff', //linen
            // '#231f20ff', //raisin-black
            // '#bb4430ff', //persian-red
            '#ED1D58', // red
            '#73D15E', // green
            '#1a8fe3ff', // blue
            '#ECD15B',  // goldenrod
            '#2e282a',// black
          ];

          // Cycle through colors using modulo
          const cardColor = colors[index % colors.length];

          return (
            <Grid key={index} item size={{ xs: 12, sm: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  boxShadow: 6,
                  borderRadius: 3,
                  backgroundColor: `${cardColor}`, // Semi-transparent background
                }}
              >
                <CardContent sx={{ textAlign: "center", }}>
                  <Typography variant="h5" gutterBottom>
                    {feature.icon} {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {feature.description}
                  </Typography>
                  <Link to={feature.route}>
                    <Button variant="contained" sx={{color:'white', backgroundColor: 'black', borderRadius: 2 }}>
                      Go to {feature.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Recent Orders Table */}
      <Typography variant="h4" align="center" sx={{ mb: 4 }}>
        Recent Orders
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ bgcolor: theme.palette.mode === 'dark' ? "#333" : "white", borderRadius: 2, boxShadow: "none", width: "100%" }}>
          <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? "#555" : "#e0e0e0" }}>
            <TableRow>
              <TableCell sx={tableCellStyle}>Date & Time</TableCell>
              <TableCell sx={tableCellStyle}>From Store</TableCell>
              <TableCell sx={tableCellStyle}>To Store</TableCell>
              <TableCell sx={tableCellStyle}>Amount</TableCell>
              <TableCell sx={tableCellStyle}>Placed By</TableCell>
              <TableCell sx={tableCellStyleWithoutDivider}>Order Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders?.map((order, index) => (
              <TableRow
                key={index}
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: theme.palette.mode === 'dark' ? "#444" : "#f5f5f5",
                    transition: "background-color 0.3s ease",
                  },
                }}
              >
                <TableCell sx={tableCellStyle}>{formatDateTime(order.created_at)}</TableCell>
                <TableCell sx={tableCellStyle}>{order.from_store.business_name}</TableCell>
                <TableCell sx={tableCellStyle}>{order.to_store.business_name}</TableCell>
                <TableCell sx={tableCellStyle}>{order.amount}</TableCell>
                <TableCell sx={tableCellStyle}>{order.placed_by.name}</TableCell>
                <TableCell sx={tableCellStyleWithoutDivider}>{order.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
