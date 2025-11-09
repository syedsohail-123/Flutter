import { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { format } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import CostReportPDF from "./CostReportPDF";
import * as XLSX from "xlsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function App() {
  const [selectedDate, setSelectedDate] = useState(null); // No default date selection
  const [data, setData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [costHistory, setCostHistory] = useState([]); // For sidebar history
  const [loading, setLoading] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [darkMode, setDarkMode] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(false); // For toggling sidebar
  const [error, setError] = useState(null); // For displaying error messages

  // Load dark mode preference from localStorage
  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
  }, []);

  // Toggle dark mode and save preference
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const fetchCostForDate = async (date) => {
    if (!date) return;
    const yyyyMm = format(date, "yyyy-MM");
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      console.log(`Fetching cost data for ${yyyyMm}`);
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const res = await axios.get(`${apiUrl}/api/costs?month=${yyyyMm}`);
      console.log("Received data:", res.data);
      setData(res.data);
      
      // Add to cost history
      const newEntry = {
        id: Date.now(),
        month: res.data.month,
        formattedMonth: new Date(`${res.data.month}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        totalCost: res.data.totalCost,
        servicesCount: res.data.services.length
      };
      
      // Update history, keeping only the latest 10 entries
      setCostHistory(prev => {
        const updated = [newEntry, ...prev.filter(item => item.month !== newEntry.month)];
        return updated.slice(0, 10);
      });
      
      console.log("Data set successfully:", res.data);
    } catch (err) {
      console.error("Failed to fetch AWS costs:", err);
      console.error("Error details:", err.response?.data || err.message);
      
      // Set error message to display to user
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to fetch cost data. Please check your AWS credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch trend data
  const fetchTrendData = async () => {
    setLoading(true);
    try {
      console.log("Fetching trend data");
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const res = await axios.get(`${apiUrl}/api/costs/trend?months=6`);
      console.log("Received trend data:", res.data);
      setTrendData(res.data);
    } catch (err) {
      console.error("Failed to fetch trend data:", err);
      console.error("Error details:", err.response?.data || err.message);
      
      // Set error message to display to user
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to fetch trend data. Please check your AWS credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load trend data on component mount
  /* useEffect(() => {
    fetchTrendData();
  }, []); */

  // Log when selectedDate changes
  useEffect(() => {
    console.log("Selected date changed:", selectedDate);
  }, [selectedDate]);

  // Filter services based on search term
  const filteredServices = data?.services.filter(service => 
    service.name.toLowerCase().includes(serviceSearch.toLowerCase())
  ) || [];
  
  console.log("Current data state:", data);
  console.log("Filtered services:", filteredServices);

  const chartData = {
    labels: filteredServices.map((s) => s.name) || [],
    datasets: [
      {
        label: "Cost (USD)",
        data: filteredServices.map((s) => s.cost) || [],
        backgroundColor: darkMode ? "rgba(96, 165, 250, 0.8)" : "rgba(59, 130, 246, 0.8)",
        borderColor: darkMode ? "rgba(96, 165, 250, 1)" : "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
  
  console.log("Chart data prepared:", chartData);

  // Trend chart data
  const trendChartData = {
    labels: trendData?.map(item => item.formattedMonth) || [],
    datasets: [
      {
        label: "Monthly Cost (USD)",
        data: trendData?.map(item => item.totalCost) || [],
        borderColor: darkMode ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
        backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: darkMode ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
        pointBorderColor: darkMode ? '#1f2937' : '#fff',
        pointHoverRadius: 7,
        fill: true,
        tension: 0.3
      }
    ]
  };
  
  console.log("Trend chart data prepared:", trendChartData);

  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    setSelectedDate(newDate);
    setShowMonthPicker(false);
    // Don't fetch data automatically when a month is selected
    // Data will be fetched only when user clicks "Get Cost Data" button
  };

  const handleYearChange = (increment) => {
    const newYear = currentYear + increment;
    setCurrentYear(newYear);
  };

  // Export data to Excel
  const exportToExcel = () => {
    if (!data?.services) return;
    
    // Simple USD to INR conversion function (using approximate exchange rate)
    const convertToINR = (usdAmount) => {
      // Handle both number and string inputs
      let numericValue;
      if (typeof usdAmount === 'number') {
        numericValue = usdAmount;
      } else if (typeof usdAmount === 'string') {
        numericValue = parseFloat(usdAmount);
        if (isNaN(numericValue)) {
          return null; // Invalid number
        }
      } else {
        return null; // Unsupported type
      }
      
      const exchangeRate = 83; // Approximate exchange rate
      return numericValue * exchangeRate;
    };
    
    // Prepare data for export
    const excelData = data.services.map(service => ({
      "Service Name": service.name,
      "Cost (USD)": typeof service.cost === 'number' ? service.cost.toFixed(2) : service.cost,
      "Cost (INR)": convertToINR(service.cost) !== null ? convertToINR(service.cost).toFixed(2) : "N/A"
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AWS Costs");
    
    // Export to file
    XLSX.writeFile(wb, `aws-cost-data-${data?.month}.xlsx`);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'} flex`}>
      {/* Sidebar */}
      <div className={`fixed md:relative z-30 h-full transition-all duration-300 ease-in-out ${
        showSidebar ? 'left-0 w-64' : '-left-64 w-0 md:left-0 md:w-64'
      } ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Cost History</h2>
            <button 
              onClick={toggleSidebar}
              className="md:hidden p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {costHistory.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Services</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                {costHistory.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} cursor-pointer ${
                      data?.month === entry.month ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''
                    }`}
                    onClick={() => {
                      const [year, month] = entry.month.split('-');
                      setSelectedDate(new Date(year, parseInt(month) - 1, 1));
                      setShowSidebar(false);
                    }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.formattedMonth}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">${typeof entry.totalCost === 'number' ? entry.totalCost.toFixed(2) : entry.totalCost}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.servicesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No cost history yet.</p>
              <p className="text-sm mt-2">Select a month to start tracking costs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile sidebar toggle */}
        <div className="md:hidden p-4">
          <button 
            onClick={toggleSidebar}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            ☰
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center p-4 md:p-8">
          <div className="w-full max-w-6xl flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 my-6">💰 AWS Cost Dashboard</h1>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'} hover:opacity-80 transition-all`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Dashboard Widgets */}
          {data && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mb-8">
              <div className={`p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-semibold mb-2 text-gray-500">Total Cost</h3>
                <p className="text-3xl font-bold text-green-500">${typeof data.totalCost === 'number' ? data.totalCost.toFixed(2) : data.totalCost}</p>
                <p className="text-sm text-gray-400 mt-1">Month: {data.month}</p>
              </div>
              
              <div className={`p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-semibold mb-2 text-gray-500">Services</h3>
                <p className="text-3xl font-bold text-blue-500">{data.services?.length || 0}</p>
                <p className="text-sm text-gray-400 mt-1">Service items</p>
              </div>
              
              <div className={`p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-semibold mb-2 text-gray-500">Data Status</h3>
                <p className="text-xl font-bold text-purple-500">Loaded</p>
                <p className="text-sm text-gray-400 mt-1">From API</p>
              </div>
            </div>
          )}
          
          {(!data || loading) && (
            <div className="w-full max-w-6xl mb-8 p-6 text-center">
              <p>Loading data...</p>
            </div>
          )}

          {/* Cost Trend Analysis Chart */}
          {trendData && (
            <div className={`p-6 rounded-xl shadow-lg w-full max-w-6xl mb-8 transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-2xl font-semibold mb-4">Cost Trend Analysis</h2>
              <div className="h-80">
                <Line
                  data={trendChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: {
                          color: darkMode ? '#e5e7eb' : '#374151',
                          font: {
                            size: 14
                          }
                        }
                      },
                      title: {
                        display: true,
                        text: 'Monthly Cost Trend (Last 6 Months)',
                        color: darkMode ? '#f9fafb' : '#111827',
                        font: {
                          size: 16
                        }
                      },
                      tooltip: {
                        backgroundColor: darkMode ? '#1f2937' : '#fff',
                        titleColor: darkMode ? '#f9fafb' : '#111827',
                        bodyColor: darkMode ? '#e5e7eb' : '#374151',
                        borderColor: darkMode ? '#4b5563' : '#e5e7eb',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        ticks: {
                          color: darkMode ? '#d1d5db' : '#6b7280',
                          callback: function(value) {
                            return '$' + value;
                          }
                        },
                        grid: {
                          color: darkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'
                        }
                      },
                      x: {
                        ticks: {
                          color: darkMode ? '#d1d5db' : '#6b7280'
                        },
                        grid: {
                          color: darkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Month Picker with vertical month list */}
          <div className={`p-6 rounded-xl shadow-lg w-full max-w-md text-center mb-8 transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4">Select Month</h2>
            <div className="relative mx-auto w-48 mb-4">
              <div 
                className={`border-2 p-3 rounded-lg w-full text-center pl-10 focus:ring-2 outline-none transition-all cursor-pointer ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700 focus:border-blue-500 focus:ring-blue-900' 
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200'
                }`}
                onClick={() => setShowMonthPicker(!showMonthPicker)}
              >
                {selectedDate ? format(selectedDate, "MMMM yyyy") : "Select month"}
              </div>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                📅
              </div>
              
              {/* Custom Month Picker Popup */}
              {showMonthPicker && (
                <div className={`absolute z-10 mt-2 left-0 w-full rounded-lg shadow-xl p-4 ${
                  darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
                }`}>
                  <div className="flex gap-4 justify-center items-start">
                    <div className={`flex flex-col p-2 rounded-lg shadow-inner max-h-60 overflow-y-auto ${
                      darkMode ? 'bg-gray-600' : 'bg-gray-50'
                    }`}>
                      {monthNames.map((monthName, index) => (
                        <button
                          key={monthName}
                          onClick={() => handleMonthSelect(index)}
                          className={`py-2 px-3 text-left rounded-md transition-all duration-200 mb-1 ${
                            selectedDate && selectedDate.getMonth() === index && selectedDate.getFullYear() === currentYear
                              ? `${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'} shadow-md` 
                              : `${darkMode ? 'hover:bg-gray-500 text-gray-200' : 'hover:bg-blue-50 text-gray-700'}`
                          }`}
                        >
                          {monthName.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                      <button 
                        onClick={() => handleYearChange(-1)} 
                        className={`px-3 py-1 border rounded-lg transition-all ${
                          darkMode 
                            ? 'border-gray-500 hover:bg-gray-600 text-gray-200' 
                            : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        ‹
                      </button>
                      <span className={`text-center font-semibold ${
                        darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>{currentYear}</span>
                      <button 
                        onClick={() => handleYearChange(1)} 
                        className={`px-3 py-1 border rounded-lg transition-all ${
                          darkMode 
                            ? 'border-gray-500 hover:bg-gray-600 text-gray-200' 
                            : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => fetchCostForDate(selectedDate)}
              disabled={!selectedDate || loading}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center mx-auto mt-4 ${
                selectedDate
                  ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl active:scale-95"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                "Get Cost Data"
              )}
            </button>
          </div>

          {data && !loading && (
            <>
              <div className={`p-6 rounded-xl shadow-lg w-full max-w-4xl text-center mb-8 transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-2xl font-semibold mb-2">{data.month}</h2>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 text-transparent bg-clip-text">
                  Total: ${typeof data.totalCost === 'number' ? data.totalCost.toFixed(2) : data.totalCost}
                </p>
                <p className="text-xl font-semibold mt-2">
                  (₹{typeof data.totalCost === 'number' ? (data.totalCost * 83).toFixed(2) : 
                    (typeof data.totalCost === 'string' && !isNaN(parseFloat(data.totalCost))) ? 
                    (parseFloat(data.totalCost) * 83).toFixed(2) : 'N/A'})
                </p>
                
                {/* Debug information */}
                <div className={`mt-4 p-3 rounded text-left text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className="font-semibold mb-1">Debug Info:</p>
                  <p>Services count: {data.services?.length || 0}</p>
                  <p>First service: {data.services?.[0]?.name || 'None'}</p>
                  <p>First service cost: ${data.services?.[0]?.cost || '0.00'}</p>
                </div>
                
                {/* Export buttons */}
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  <PDFDownloadLink 
                    document={<CostReportPDF data={data} />} 
                    fileName={`aws-cost-report-${data?.month}.pdf`}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    {({ loading }) =>
                      loading ? (
                        "Generating PDF..."
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          Export PDF
                        </>
                      )
                    }
                  </PDFDownloadLink>
                  
                  <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Export Excel
                  </button>
                </div>
              </div>

              {/* Service Search Filter */}
              <div className={`p-6 rounded-xl shadow-lg w-full max-w-4xl mb-8 transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold">
                    Service Breakdown for {data.month}
                  </h2>
                  <div className="relative w-1/3">
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className={`w-full p-2 pl-10 rounded-lg border focus:ring-2 focus:outline-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-900 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-200 focus:border-blue-500'
                      }`}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      🔍
                    </div>
                  </div>
                </div>
                
                {serviceSearch && (
                  <p className="mb-4 text-sm">
                    Showing {filteredServices.length} of {data.services?.length || 0} services
                  </p>
                )}
                
                <div className="pt-4">
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { 
                          position: "top",
                          labels: {
                            font: {
                              size: 14
                            },
                            color: darkMode ? '#e5e7eb' : '#374151'
                          }
                        },
                        title: { 
                          display: true, 
                          text: "Service-wise Cost Breakdown",
                          font: {
                            size: 16
                          },
                          color: darkMode ? '#f9fafb' : '#111827'
                        },
                      },
                      scales: {
                        y: {
                          ticks: {
                            color: darkMode ? '#d1d5db' : '#6b7280',
                            callback: function(value) {
                              return '$' + value;
                            }
                          },
                          grid: {
                            color: darkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'
                          }
                        },
                        x: {
                          ticks: {
                            color: darkMode ? '#d1d5db' : '#6b7280'
                          },
                          grid: {
                            color: darkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                {/* Service list for debugging */}
                <div className={`mt-6 p-3 rounded text-left ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-semibold mb-2">Services List:</h3>
                  <ul className="text-sm max-h-40 overflow-y-auto">
                    {data.services?.map((service, index) => (
                      <li key={index} className="flex justify-between py-1 border-b border-gray-300 dark:border-gray-600">
                        <span>{service.name}</span>
                        <span>${service.cost}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
          
          {(!data || loading) && (
            <div className={`p-6 rounded-xl shadow-lg w-full max-w-4xl text-center mb-8 transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <p>Loading service data...</p>
            </div>
          )}

        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}

export default App;