import { AppProvider } from "@toolpad/core";
import React from "react";
import { Outlet } from "react-router-dom";
import { ConnectWithoutContact, ViewList } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LayersIcon from '@mui/icons-material/Layers';
import SettingsIcon from '@mui/icons-material/Settings';
import logo from './assets/logo.png';
import { extendTheme } from "@mui/material";
import { useAuth } from "./components/Auth/AuthProvider";

const NAVIGATION = [
  { kind: 'header', title: 'Main items' },
  {
    segment: './',
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'orders',
    title: 'Orders',
    icon: <ViewList />,
  },
  {
    segment: 'products',
    title: 'Products',
    icon: <LayersIcon />,
  },
  {
    segment: 'connections',
    title: 'Connections',
    icon: <ConnectWithoutContact />,
  },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <SettingsIcon />,
  },
];

const colors = {
  primary: ' #20A4F3',
  success: ' #2EEE80',
  error: ' #FF3366',
  white: ' #F6F7F8',
  warn: ' #F5F064',
  purple: ' #AD5FFF',
  color3: ' #2EC4B6',
  color4: ' #C0F2FC',
  color5: ' #F2D1B3',
  color6: ' #447EF2',
};

// Define the theme, adding custom colors to the palette
const dhandhoTheme = extendTheme({
  colorSchemes: { light: true, dark: true },
  colorSchemeSelector: 'class',
  customColors: colors,
  palette: {
    primary: {
      main: '#20A4F3', // #20A4F3
    },
    success: {
      main: '#2EEE80', // #2EEE80
    },
    error: {
      main: '#FF3366', // #FF3366
    },
    warning: {
      main: '#F5F064', // #F5F064
    },
    purple: {
      main: '#AD5FFF', // #AD5FFF
    },
    color3: {
      main: '#2EC4B6', // #2EC4B6
    },
    color4: {
      main: '#C0F2FC', // #C0F2FC
    },
    color5: {
      main: '#F2D1B3', // #F2D1B3
    },
    color6: {
      main: '#447EF2', // #447EF2
    },
  },
});

// Define the branding object
const branding = {
  logo: <img src={logo} alt="Logo" />,
  title: '', // Update title if needed
  homeUrl: '/', // Ensure home URL is set correctly
};


export default function App() {
  const {session, authentication} = useAuth();
  return (
    <AppProvider
      navigation={NAVIGATION}
      branding={branding}
      theme={dhandhoTheme}
      session={session}
      authentication={authentication}
    >
      <Outlet />
    </AppProvider>
  );
}