import React, { useState } from 'react';
import { Button, Tab, Tabs } from '@mui/material';
import PlaceOrderTabular from './PlaceOrderTabular';
import PlaceOrderVisual from './PlaceOrderVisual';

function PlaceOrder() {
  const [viewMode, setViewMode] = useState('tabular'); // 'tabular' or 'visual'

  const handleViewToggle = (event, newValue) => {
    setViewMode(newValue);
  };

  return (
    <div>
      {/* Layout Switch */}
      <Tabs
        value={viewMode}
        onChange={handleViewToggle}
        indicatorColor="primary"
        textColor="primary"
        centered
      >
        <Tab label="Tabular View" value="tabular" />
        <Tab label="Visual View" value="visual" />
      </Tabs>

      {/* Conditionally Render Views */}
      {viewMode === 'tabular' ? (
        <PlaceOrderTabular />
      ) : (
        <PlaceOrderVisual />
      )}
    </div>
  );
}

export default PlaceOrder;