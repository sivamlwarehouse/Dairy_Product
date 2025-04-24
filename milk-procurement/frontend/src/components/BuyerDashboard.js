import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import LogoutIcon from '@mui/icons-material/Logout';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

function BuyerDashboard() {
  const [farmers, setFarmers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    selectedFarmer: '',
    fatContent: '',
    quantity: '',
    session: 'AM',
    sendSms: true
  });
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFarmer, setSelectedFarmer] = useState('');

  const navigate = useNavigate();
  const buyerId = localStorage.getItem('buyerId');
  const buyerName = localStorage.getItem('buyerName');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  useEffect(() => {
    if (!buyerId) {
      navigate('/buyer-login');
      return;
    }

    const fetchData = async () => {
      try {
        const [farmersResponse, recordsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/farmers'),
          axios.get('http://localhost:5000/api/milk-records')
        ]);
        setFarmers(farmersResponse.data);
        setRecords(recordsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [buyerId, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/milk-records', {
        farmer_id: formData.selectedFarmer,
        buyer_id: buyerId,
        fat_content: parseFloat(formData.fatContent),
        quantity: parseFloat(formData.quantity),
        session: formData.session,
        send_sms: formData.sendSms
      });

      let successMessage = `Record added successfully! Price: ₹${response.data.price}/L, Total Amount: ₹${response.data.totalAmount}`;
      
      // Add SMS status information
      if (response.data.smsStatus === 'sent') {
        successMessage += '\nSMS notification sent successfully to farmer.';
      } else if (response.data.smsStatus === 'failed') {
        successMessage += `\nSMS notification failed: ${response.data.smsError || 'Unknown error'}`;
      } else if (response.data.smsStatus === 'not_requested') {
        successMessage += '\nSMS notification was not requested.';
      }

      setSuccess(successMessage);
      setFormData({
        ...formData,
        fatContent: '',
        quantity: ''
      });
      
      // Refresh records after adding new one
      const recordsResponse = await axios.get('http://localhost:5000/api/milk-records');
      setRecords(recordsResponse.data);
    } catch (err) {
      console.error('Error adding record:', err);
      setError(err.response?.data?.error || 'Failed to add record. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('buyerId');
    localStorage.removeItem('buyerName');
    navigate('/buyer-login');
  };

  const getFilteredRecords = () => {
    if (!selectedFarmer) return [];
    
    return records.filter(record => {
      const date = new Date(record.date);
      return date.getMonth() + 1 === selectedMonth && 
             date.getFullYear() === selectedYear &&
             record.farmer_id === selectedFarmer;
    });
  };

  const generateTextReport = () => {
    const filteredRecords = getFilteredRecords();
    const selectedFarmerName = farmers.find(f => f.id === selectedFarmer)?.name || 'Unknown';
    
    // Calculate totals
    const totalQuantity = filteredRecords.reduce((sum, record) => sum + record.quantity, 0);
    const totalAmount = filteredRecords.reduce((sum, record) => sum + record.total_amount, 0);
    const avgFat = filteredRecords.reduce((sum, record) => sum + record.fat_content, 0) / filteredRecords.length || 0;
    
    // Create report content
    let reportContent = 'MILK PROCUREMENT REPORT\n';
    reportContent += '=======================\n\n';
    reportContent += `Month: ${months[selectedMonth - 1]} ${selectedYear}\n`;
    reportContent += `Farmer: ${selectedFarmerName}\n\n`;
    reportContent += 'SUMMARY\n';
    reportContent += '-------\n';
    reportContent += `Total Quantity: ${totalQuantity.toFixed(2)} liters\n`;
    reportContent += `Average Fat: ${avgFat.toFixed(2)}%\n`;
    reportContent += `Total Amount: Rs. ${totalAmount.toFixed(2)}\n\n`;
    reportContent += 'DETAILED RECORDS\n';
    reportContent += '-----------------\n';
    reportContent += 'Date         | Session | Fat % | Quantity | Price/L | Amount\n';
    reportContent += '-------------|---------|-------|----------|---------|--------\n';
    
    filteredRecords.forEach(record => {
      const date = new Date(record.date).toLocaleDateString();
      const session = record.session.padEnd(7);
      const fat = record.fat_content.toFixed(2).padStart(5);
      const quantity = record.quantity.toFixed(2).padStart(8);
      const price = record.price.toFixed(2).padStart(7);
      const amount = record.total_amount.toFixed(2).padStart(8);
      
      reportContent += `${date} | ${session} | ${fat} | ${quantity} | ${price} | ${amount}\n`;
    });
    
    // Create and download the text file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milk-report-${selectedFarmerName}-${months[selectedMonth - 1]}-${selectedYear}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    setShowReportDialog(false);
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
      <Container maxWidth="sm">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            <LocalDiningIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Add Milk Record
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={() => setShowReportDialog(true)}
            >
              Download Report
            </Button>
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

        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                select
                label="Select Farmer"
                name="selectedFarmer"
                value={formData.selectedFarmer}
                onChange={handleChange}
                required
                fullWidth
              >
                {farmers.map((farmer) => (
                  <MenuItem key={farmer.id} value={farmer.id}>
                    {farmer.name} ({farmer.phone})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Session"
                name="session"
                value={formData.session}
                onChange={handleChange}
                required
                fullWidth
              >
                <MenuItem value="AM">Morning (AM)</MenuItem>
                <MenuItem value="PM">Evening (PM)</MenuItem>
              </TextField>

              <TextField
                label="Fat Content (%)"
                name="fatContent"
                type="number"
                value={formData.fatContent}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ 
                  step: "0.1",
                  min: "5.0",
                  max: "10.0"
                }}
              />

              <TextField
                label="Quantity (Liters)"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ 
                  step: "0.1",
                  min: "0"
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  name="sendSms"
                  checked={formData.sendSms}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendSms: e.target.checked }))}
                />
                <Typography>Send SMS notification to farmer</Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                sx={{
                  mt: 2,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #00b0ff 90%)',
                  }
                }}
              >
                Add Record
              </Button>
            </Box>
          </form>
        </Paper>

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)}>
          <DialogTitle>Generate Monthly Report</DialogTitle>
          <DialogContent>
            <Box sx={{ minWidth: 200, mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Farmer</InputLabel>
                <Select
                  value={selectedFarmer}
                  label="Farmer"
                  onChange={(e) => setSelectedFarmer(e.target.value)}
                >
                  {farmers.map((farmer) => (
                    <MenuItem key={farmer.id} value={farmer.id}>
                      {farmer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <MenuItem key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button onClick={generateTextReport} variant="contained" color="primary">
              Generate Report
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default BuyerDashboard; 