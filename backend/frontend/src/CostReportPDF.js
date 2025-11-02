import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Create styles using Tailwind-like classes
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#f9fafb",
    padding: 40
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
    color: "#1d4ed8" // blue-700
  },
  month: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
    color: "#374151" // gray-700
  },
  totalCost: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 30,
    color: "#16a34a", // green-600
    fontWeight: "bold"
  },
  table: {
    display: "table",
    width: "100%",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#d1d5db", // gray-300
    borderRadius: 6, // rounded
    overflow: "hidden"
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6" // gray-100
  },
  tableRowEven: {
    flexDirection: "row",
    backgroundColor: "#ffffff" // white
  },
  tableColHeader: {
    width: "33.33%",
    padding: 8,
    backgroundColor: "#3b82f6", // blue-500
    fontWeight: "bold"
  },
  tableCol: {
    width: "33.33%",
    padding: 8
  },
  tableCellHeader: {
    margin: "auto",
    fontSize: 12,
    color: "#ffffff" // white
  },
  tableCell: {
    margin: "auto",
    fontSize: 10,
    color: "#374151" // gray-700
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "#6b7280" // gray-500
  },
  costContainer: {
    flexDirection: "column",
    alignItems: "center"
  },
  costUSD: {
    fontSize: 10,
    color: "#374151"
  },
  costINR: {
    fontSize: 10,
    color: "#16a34a",
    fontWeight: "bold"
  }
});

// Simple USD to INR conversion function (using approximate exchange rate)
// In a real application, you would fetch this from an API
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

const CostReportPDF = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>💰 AWS Cost Report</Text>
          <Text style={styles.month}>Report for: {data?.month}</Text>
          <View style={styles.totalCost}>
            <Text>
              Total Cost: ${typeof data?.totalCost === "number" ? data.totalCost.toFixed(2) : data?.totalCost}
            </Text>
            <Text>
              (₹{convertToINR(data?.totalCost) !== null ? convertToINR(data?.totalCost).toFixed(2) : "N/A"})
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Service Name</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Cost (USD)</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Cost (INR)</Text>
            </View>
          </View>
          {data?.services?.map((service, index) => (
            <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowEven} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{service.name}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  ${typeof service.cost === "number" ? service.cost.toFixed(2) : service.cost}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  ₹{convertToINR(service.cost) !== null ? convertToINR(service.cost).toFixed(2) : "N/A"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Report generated on {new Date().toLocaleDateString()} | Exchange rate: 1 USD = 83 INR
        </Text>
      </Page>
    </Document>
  );
};

export default CostReportPDF;