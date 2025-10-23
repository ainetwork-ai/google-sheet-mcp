# Google Sheets MCP Server - Tutorials

## Tutorial 1: Getting Started

This tutorial will walk you through setting up and using the Google Sheets MCP Server for the first time.

### Prerequisites

- Node.js 18+ installed
- Google Cloud Project with Sheets API enabled
- OAuth 2.0 credentials from Google Cloud Console

### Step 1: Setup Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" in the API & Services section
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Desktop application" as the application type
   - Download the credentials JSON file

### Step 2: Install and Configure

```bash
# Clone or download the project
cd google-sheets-mcp

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

### Step 3: First Authentication

```bash
# Start the server
npm run dev
```

The server will start and you'll need to authenticate:

1. The server will display an authentication URL
2. Open the URL in your browser
3. Sign in with your Google account
4. Grant permissions to the application
5. Copy the authorization code from the callback URL
6. Enter the code in the server console

### Step 4: Test Basic Operations

```typescript
// List your spreadsheets
const files = await use_mcp_tool("sheets_list_files", {});

// Read data from the first spreadsheet
const data = await use_mcp_tool("sheets_read_data", {
  spreadsheetId: files.files[0].id
});

console.log("Your spreadsheets:", files.files);
console.log("First sheet data:", data.data);
```

## Tutorial 2: Data Analysis Workflow

This tutorial demonstrates how to analyze sales data and generate insights.

### Scenario

You have a sales spreadsheet with the following columns:
- A: Product Name
- B: Sales Date
- C: Quantity Sold
- D: Unit Price
- E: Total Revenue

### Step 1: Read and Analyze Data

```typescript
// Read the sales data
const salesData = await use_mcp_tool("sheets_read_data", {
  spreadsheetId: "your_spreadsheet_id",
  sheetName: "Sales"
});

// Analyze the data
const totalRevenue = salesData.data
  .slice(1) // Skip header row
  .reduce((sum, row) => sum + parseFloat(row[4] || 0), 0);

const totalQuantity = salesData.data
  .slice(1)
  .reduce((sum, row) => sum + parseInt(row[2] || 0), 0);

console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
console.log(`Total Quantity Sold: ${totalQuantity}`);
```

### Step 2: Find Top Products

```typescript
// Search for high-revenue products
const highRevenueProducts = salesData.data
  .slice(1)
  .filter(row => parseFloat(row[4] || 0) > 1000)
  .map(row => ({
    product: row[0],
    revenue: parseFloat(row[4])
  }))
  .sort((a, b) => b.revenue - a.revenue);

console.log("Top Products by Revenue:", highRevenueProducts);
```

### Step 3: Update Summary Sheet

```typescript
// Create or update summary sheet
await use_mcp_tool("sheets_update_range", {
  spreadsheetId: "your_spreadsheet_id",
  sheetName: "Summary",
  range: "A1:B4",
  values: [
    ["Metric", "Value"],
    ["Total Revenue", `$${totalRevenue.toFixed(2)}`],
    ["Total Quantity", totalQuantity.toString()],
    ["Average Price", `$${(totalRevenue / totalQuantity).toFixed(2)}`]
  ]
});
```

## Tutorial 3: Bulk Data Processing

This tutorial shows how to process large amounts of data efficiently.

### Scenario

You need to update customer addresses, changing "Seoul" to "Seoul City" across multiple sheets.

### Step 1: Smart Replace for Bulk Updates

```typescript
// Update addresses in customer sheet
const result = await use_mcp_tool("sheets_smart_replace", {
  spreadsheetId: "your_spreadsheet_id",
  sheetName: "Customers",
  findText: "Seoul",
  replaceText: "Seoul City",
  matchCase: false
});

console.log(`Updated ${result.modifiedCells} cells`);
console.log("Replacements:", result.replacements);
```

### Step 2: Conditional Updates

```typescript
// Read inventory data
const inventoryData = await use_mcp_tool("sheets_read_data", {
  spreadsheetId: "your_spreadsheet_id",
  sheetName: "Inventory"
});

// Find low stock items
const lowStockItems = inventoryData.data
  .slice(1)
  .map((row, index) => ({ row: index + 2, data: row }))
  .filter(item => parseInt(item.data[2] || 0) < 10);

// Update status for low stock items
for (const item of lowStockItems) {
  await use_mcp_tool("sheets_update_cell", {
    spreadsheetId: "your_spreadsheet_id",
    sheetName: "Inventory",
    cell: `D${item.row}`, // Status column
    value: "Reorder Required"
  });
}

console.log(`Updated ${lowStockItems.length} low stock items`);
```

### Step 3: Batch Append New Data

```typescript
// Add new products to inventory
const newProducts = [
  ["Product D", "Electronics", 50, "In Stock"],
  ["Product E", "Books", 25, "In Stock"],
  ["Product F", "Clothing", 30, "In Stock"]
];

await use_mcp_tool("sheets_append_rows", {
  spreadsheetId: "your_spreadsheet_id",
  sheetName: "Inventory",
  values: newProducts
});

console.log(`Added ${newProducts.length} new products`);
```

## Tutorial 4: Advanced Search and Filtering

This tutorial demonstrates advanced search capabilities and data filtering.

### Scenario

You have an order management spreadsheet and need to find specific orders based on various criteria.

### Step 1: Search by Status

```typescript
// Find all pending orders
const pendingOrders = await use_mcp_tool("sheets_search", {
  spreadsheetId: "your_spreadsheet_id",
  sheetName: "Orders",
  searchText: "Pending",
  searchColumns: ["E"] // Status column
});

console.log(`Found ${pendingOrders.totalMatches} pending orders`);
```

### Step 2: Search by Date Range

```typescript
// Read orders data
const ordersData = await use_mcp_tool("sheets_read_data", {
  spreadsheetId: "your_spreadsheet_id",
  sheetName: "Orders"
});

// Filter by date range
const startDate = new Date("2024-01-01");
const endDate = new Date("2024-01-31");

const januaryOrders = ordersData.data
  .slice(1)
  .filter(row => {
    const orderDate = new Date(row[1]); // Assuming date is in column B
    return orderDate >= startDate && orderDate <= endDate;
  });

console.log(`Found ${januaryOrders.length} orders in January 2024`);
```

### Step 3: Complex Filtering

```typescript
// Find high-value orders from specific customers
const highValueOrders = ordersData.data
  .slice(1)
  .filter(row => {
    const customer = row[0]; // Customer name
    const value = parseFloat(row[3] || 0); // Order value
    return customer.includes("Premium") && value > 500;
  });

console.log(`Found ${highValueOrders.length} high-value premium orders`);
```

## Tutorial 5: Sheet Management

This tutorial covers creating, managing, and organizing sheets.

### Step 1: Create Monthly Reports

```typescript
// Create sheets for each month
const months = ["January", "February", "March", "April", "May", "June"];

for (const month of months) {
  await use_mcp_tool("sheets_create_sheet", {
    spreadsheetId: "your_spreadsheet_id",
    sheetName: `${month} 2024`
  });
  
  console.log(`Created ${month} 2024 sheet`);
}
```

### Step 2: Organize Data by Month

```typescript
// Move orders to appropriate monthly sheets
const ordersData = await use_mcp_tool("sheets_read_data", {
  spreadsheetId: "your_spreadsheet_id",
  sheetName: "All Orders"
});

// Group orders by month
const ordersByMonth = {};
ordersData.data.slice(1).forEach(row => {
  const orderDate = new Date(row[1]);
  const month = orderDate.toLocaleString('default', { month: 'long' });
  
  if (!ordersByMonth[month]) {
    ordersByMonth[month] = [];
  }
  ordersByMonth[month].push(row);
});

// Add orders to monthly sheets
for (const [month, orders] of Object.entries(ordersByMonth)) {
  if (orders.length > 0) {
    await use_mcp_tool("sheets_update_range", {
      spreadsheetId: "your_spreadsheet_id",
      sheetName: `${month} 2024`,
      range: "A1:E" + (orders.length + 1),
      values: [ordersData.data[0], ...orders] // Include header
    });
  }
}
```

### Step 3: Clean Up Old Sheets

```typescript
// Delete old summary sheets
const oldSheets = ["Old Summary", "Temp Data", "Backup"];

for (const sheetName of oldSheets) {
  try {
    await use_mcp_tool("sheets_delete_sheet", {
      spreadsheetId: "your_spreadsheet_id",
      sheetName: sheetName
    });
    console.log(`Deleted ${sheetName} sheet`);
  } catch (error) {
    console.log(`Sheet ${sheetName} not found or already deleted`);
  }
}
```

## Best Practices

### 1. Error Handling

Always wrap your MCP tool calls in try-catch blocks:

```typescript
try {
  const result = await use_mcp_tool("sheets_read_data", {
    spreadsheetId: "your_spreadsheet_id"
  });
  console.log("Success:", result);
} catch (error) {
  console.error("Error:", error.message);
  // Handle error appropriately
}
```

### 2. Rate Limiting

Implement delays between requests to avoid hitting rate limits:

```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

for (const item of items) {
  await use_mcp_tool("sheets_update_cell", {
    spreadsheetId: "your_spreadsheet_id",
    sheetName: "Sheet1",
    cell: item.cell,
    value: item.value
  });
  
  // Add delay between requests
  await delay(100);
}
```

### 3. Batch Operations

Use range updates instead of individual cell updates when possible:

```typescript
// Instead of multiple individual updates
const updates = [];
for (let i = 0; i < 100; i++) {
  updates.push([`Value ${i}`]);
}

// Use single range update
await use_mcp_tool("sheets_update_range", {
  spreadsheetId: "your_spreadsheet_id",
  sheetName: "Sheet1",
  range: "A1:A100",
  values: updates
});
```

### 4. Data Validation

Always validate data before processing:

```typescript
const data = await use_mcp_tool("sheets_read_data", {
  spreadsheetId: "your_spreadsheet_id"
});

// Validate data structure
if (!data.data || data.data.length === 0) {
  throw new Error("No data found in spreadsheet");
}

// Validate each row
const validRows = data.data.filter(row => 
  row.length >= 3 && // Minimum columns
  row[0] && // First column not empty
  !isNaN(parseFloat(row[2])) // Third column is numeric
);
```

These tutorials provide a comprehensive guide to using the Google Sheets MCP Server effectively. Start with Tutorial 1 for basic setup, then progress through the others based on your specific needs.

