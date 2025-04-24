import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import LogoutIcon from '@mui/icons-material/Logout';
import FilterListIcon from '@mui/icons-material/FilterList';

function FarmerDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const farmerId = localStorage.getItem('farmerId');
  const farmerName = localStorage.getItem('farmerName');

  useEffect(() => {
    if (!farmerId) {
      navigate('/farmer-login');
      return;
    }

    const fetchRecords = async () => {
      try {
        console.log('Fetching records for farmer:', farmerId);
        const response = await axios.get(`http://localhost:5000/api/farmers/${farmerId}/milk-records`);
        console.log('API Response:', response.data);
        if (response.data && Array.isArray(response.data)) {
          setRecords(response.data);
        } else {
          console.error('Invalid response format:', response.data);
          setError('Invalid response from server');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching records:', err);
        console.error('Error details:', err.response?.data);
        setError(err.response?.data?.error || 'Failed to fetch records. Please try again later.');
        setLoading(false);
      }
    };

    fetchRecords();
  }, [farmerId, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('farmerId');
    localStorage.removeItem('farmerName');
    navigate('/farmer-login');
  };

  const filteredRecords = records.filter(record => 
    sessionFilter === 'ALL' || record.session === sessionFilter
  );

  const calculateTotalAmount = () => {
    return filteredRecords.reduce((total, record) => total + record.total_amount, 0);
  };

  const calculateTotalQuantity = () => {
    return filteredRecords.reduce((total, record) => total + record.quantity, 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              <LocalDiningIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Welcome, {farmerName}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Your Milk Records
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Filter Session</InputLabel>
              <Select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                label="Filter Session"
                size="small"
                startAdornment={<FilterListIcon sx={{ mr: 1 }} />}
              >
                <MenuItem value="ALL">All Sessions</MenuItem>
                <MenuItem value="AM">Morning (AM)</MenuItem>
                <MenuItem value="PM">Evening (PM)</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Session</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fat Content (%)</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Quantity (L)</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price (₹/L)</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  <>
                    {filteredRecords.map((record) => (
                      <TableRow
                        key={record.id}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                          '&:hover': { bgcolor: 'action.selected' },
                        }}
                      >
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.session}</TableCell>
                        <TableCell>{record.fat_content.toFixed(1)}</TableCell>
                        <TableCell>{record.quantity.toFixed(1)}</TableCell>
                        <TableCell>₹{record.price.toFixed(2)}</TableCell>
                        <TableCell>₹{record.total_amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{calculateTotalQuantity().toFixed(1)} L</TableCell>
                      <TableCell />
                      <TableCell sx={{ fontWeight: 'bold' }}>₹{calculateTotalAmount().toFixed(2)}</TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
}

export default FarmerDashboard; 