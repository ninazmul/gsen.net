# Reports API Integration Guide

This guide explains how to connect external websites and client applications to the real-time Reports API (`/api/reports`) to query financial performance, income, expense, and category breakdowns.

---

## 1. Overview & Base URL

- **Endpoint**: `https://<YOUR-DOMAIN>/api/reports`
- **Method**: `GET` (CORS enabled for cross-origin browser requests)
- **Data Freshness**: Real-time (server responses include `Cache-Control: no-store, max-age=0`)
- **Format**: JSON (`application/json`)

---

## 2. Authentication

Every request to the API must include your API Owner and Secret Key, configured by a Super Admin in **Settings → Reports API Access**.

### Authentication Headers

| Header | Description | Example |
| :--- | :--- | :--- |
| `x-api-owner` | The API Owner identifier set in Settings | `GESN-Main` |
| `x-api-secret-key` | The API Secret Key generated in Settings | `gsen_live_9a7f8e...` |

> [!TIP]
> Alternatively, you can pass the secret key as a standard bearer token:  
> `Authorization: Bearer <YOUR_API_SECRET_KEY>`

### Strict Owner Isolation & Data Privacy

> [!IMPORTANT]
> **Data Scoping**: Every API request is **strictly filtered** by the authenticated `x-api-owner`. 
> - All totals, transaction items (income and expense), category breakdowns, and monthly performance figures contain **ONLY data matching this owner**.
> - Financial records belonging to other owners or unassigned accounts are completely excluded from exported responses.

---

## 3. Query Parameters

All parameters are optional.

| Parameter | Type | Default | Options / Description |
| :--- | :--- | :--- | :--- |
| `owner` | `string` | Authenticated Owner | Optional. Must match your authenticated owner identifier. Requesting another owner's data returns `403 Forbidden`. |
| `period` | `string` | `all` | `today`, `yesterday`, `last7days`, `last30days`, `thisMonth`, `lastMonth`, `thisYear`, `all` |
| `startDate` | `string` | — | Custom start date in ISO format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`) |
| `endDate` | `string` | — | Custom end date in ISO format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`) |
| `type` | `string` | `all` | Specific report type: `all`, `summary`, `income`, `expense`, `profit`, `category`, `monthly` |
| `category` | `string` | — | MongoDB Category ID to filter transactions |
| `year` | `number` | Current Year | Specific 4-digit year for monthly performance breakdown (e.g. `2026`) |

> [!NOTE]
> If both `startDate` and `endDate` are provided, the API automatically uses them as a custom date range, overriding the `period` parameter.

---

## 4. Response Structure

### Success Response (`200 OK`)

```json
{
  "success": true,
  "timestamp": "2026-09-16T10:45:00.000Z",
  "owner": "GESN-Main",
  "filters": {
    "period": "thisMonth",
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2026-09-30T23:59:59.999Z",
    "category": null,
    "type": "all",
    "year": 2026
  },
  "data": {
    "summary": {
      "totalIncome": 125000,
      "totalExpenses": 45000,
      "netProfit": 80000,
      "profitMarginPercent": 64.0,
      "incomeCount": 42,
      "expenseCount": 18
    },
    "income": {
      "total": 125000,
      "count": 42,
      "items": [
        {
          "_id": "673f...",
          "amount": 2500,
          "date": "2026-09-15T14:30:00.000Z",
          "paymentMethod": "bKash",
          "referenceNumber": "TRX938482",
          "description": "Monthly subscription",
          "category": {
            "_id": "673e...",
            "name": "Broadband Subscription",
            "type": "Income",
            "color": "#10b981"
          }
        }
      ]
    },
    "expenses": {
      "total": 45000,
      "count": 18,
      "items": [
        {
          "_id": "673a...",
          "amount": 12000,
          "date": "2026-09-10T11:00:00.000Z",
          "paymentMethod": "Bank Transfer",
          "description": "Upstream Bandwidth",
          "category": {
            "_id": "673b...",
            "name": "Bandwidth & Transit",
            "type": "Expense",
            "color": "#ef4444"
          }
        }
      ]
    },
    "profit": {
      "totalIncome": 125000,
      "totalExpenses": 45000,
      "netProfit": 80000
    },
    "categories": [
      {
        "category": {
          "_id": "673e...",
          "name": "Broadband Subscription",
          "type": "Income",
          "color": "#10b981",
          "active": true
        },
        "total": 125000,
        "count": 42
      }
    ],
    "monthlyPerformance": {
      "year": 2026,
      "monthlyData": [
        {
          "month": 1,
          "monthName": "January",
          "totalIncome": 110000,
          "totalExpenses": 40000,
          "profit": 70000,
          "profitPercent": 63.63
        }
      ],
      "yearlyTotal": {
        "income": 1100000,
        "expenses": 420000,
        "profit": 680000
      }
    }
  }
}
```

### Error Responses

#### Missing Credentials (`401 Unauthorized`)
```json
{
  "success": false,
  "error": "Missing API credentials. Please provide 'x-api-owner' and 'x-api-secret-key' headers."
}
```

#### Invalid Credentials (`401 Unauthorized`)
```json
{
  "success": false,
  "error": "Invalid API credentials provided."
}
```

#### Unconfigured API Access (`403 Forbidden`)
```json
{
  "success": false,
  "error": "API access is not configured. Please set API Owner and API Secret Key in Settings first."
}
```

#### Forbidden Cross-Owner Query (`403 Forbidden`)
```json
{
  "success": false,
  "error": "Forbidden: Your API credentials only grant access to reports for owner 'Owner 1'."
}
```

---

## 5. Integration Code Samples

### A. JavaScript / TypeScript (`fetch`)

```typescript
const API_URL = "https://your-domain.com/api/reports";
const API_OWNER = "YOUR_API_OWNER";
const API_SECRET_KEY = "YOUR_API_SECRET_KEY";

async function fetchReports(period = "thisMonth") {
  const url = new URL(API_URL);
  url.searchParams.set("period", period);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-owner": API_OWNER,
      "x-api-secret-key": API_SECRET_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// Example usage:
fetchReports("thisMonth")
  .then(data => console.log("Summary:", data.summary))
  .catch(err => console.error("Fetch failed:", err));
```

---

### B. React Hook (Ready to Copy-Paste)

```tsx
import { useState, useEffect } from "react";

interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
}

export function useReportsData(period = "thisMonth") {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`https://your-domain.com/api/reports?period=${period}`, {
      headers: {
        "x-api-owner": process.env.NEXT_PUBLIC_REPORTS_API_OWNER || "YOUR_OWNER",
        "x-api-secret-key": process.env.NEXT_PUBLIC_REPORTS_API_SECRET || "YOUR_SECRET_KEY",
      },
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d.error));
        return res.json();
      })
      .then((res) => {
        if (isMounted) setData(res.data);
      })
      .catch((err) => {
        if (isMounted) setError(err.toString());
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [period]);

  return { data, loading, error };
}
```

---

### C. Node.js (`axios`)

```javascript
const axios = require("axios");

async function getLiveReports() {
  try {
    const response = await axios.get("https://your-domain.com/api/reports", {
      params: {
        period: "thisMonth",
        type: "all",
      },
      headers: {
        "x-api-owner": process.env.REPORTS_API_OWNER,
        "x-api-secret-key": process.env.REPORTS_API_SECRET_KEY,
      },
    });

    console.log("Reports Data:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    } else {
      console.error("Request Error:", error.message);
    }
  }
}
```

---

### D. Python (`requests`)

```python
import os
import requests

API_URL = "https://your-domain.com/api/reports"
HEADERS = {
    "x-api-owner": os.getenv("REPORTS_API_OWNER", "YOUR_OWNER"),
    "x-api-secret-key": os.getenv("REPORTS_API_SECRET_KEY", "YOUR_SECRET_KEY")
}

def get_reports(period="thisMonth", report_type="all"):
    params = {
        "period": period,
        "type": report_type
    }
    response = requests.get(API_URL, headers=HEADERS, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    result = get_reports(period="thisMonth")
    print(f"Net Profit: {result['data']['summary']['netProfit']}")
```

---

### E. PHP (`cURL`)

```php
<?php

$apiUrl = "https://your-domain.com/api/reports?period=thisMonth";
$apiOwner = "YOUR_API_OWNER";
$apiSecretKey = "YOUR_API_SECRET_KEY";

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "x-api-owner: " . $apiOwner,
        "x-api-secret-key: " . $apiSecretKey,
        "Content-Type: application/json",
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo "cURL Error: " . curl_error($ch);
} else {
    $result = json_decode($response, true);
    if ($httpCode === 200 && $result["success"]) {
        print_r($result["data"]["summary"]);
    } else {
        echo "API Error: " . ($result["error"] ?? "Unknown error");
    }
}

curl_close($ch);
?>
```

---

### F. cURL CLI

```bash
# 1. Fetch all reports for current month
curl -X GET "https://your-domain.com/api/reports?period=thisMonth" \
  -H "x-api-owner: YOUR_API_OWNER" \
  -H "x-api-secret-key: YOUR_API_SECRET_KEY"

# 2. Fetch only executive summary for last 30 days
curl -X GET "https://your-domain.com/api/reports?period=last30days&type=summary" \
  -H "x-api-owner: YOUR_API_OWNER" \
  -H "x-api-secret-key: YOUR_API_SECRET_KEY"

# 3. Custom Date Range
curl -X GET "https://your-domain.com/api/reports?startDate=2026-01-01&endDate=2026-03-31" \
  -H "x-api-owner: YOUR_API_OWNER" \
  -H "x-api-secret-key: YOUR_API_SECRET_KEY"
```

---

## 6. Security Best Practices

1. **Keep Keys Confidential**: Never commit API keys to public repositories or expose them in client-side code where end users can view them in the source.
2. **Use Server-Side Proxies if Possible**: For client-facing websites, fetch data through your own backend or serverless functions (e.g. Next.js Server Components, API routes, or backend microservices).
3. **HTTPS Everywhere**: Always connect over HTTPS to protect headers in transit.
4. **Key Rotation**: If a key is compromised, Super Admins can click **Generate Key** and **Save Changes** in the Settings panel to instantly revoke old credentials.
