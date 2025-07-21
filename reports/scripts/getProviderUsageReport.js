const axios = require("axios");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

// Read date parameters from command-line arguments
const [from, to] = process.argv.slice(2);

if (!from || !to) {
  console.error("❗ Please provide both start and end dates in format: YYYY-MM-DD YYYY-MM-DD");
  console.error("Usage: node generateUsageReport.js 2025-07-01 2025-07-21");
  process.exit(1);
}

/**
 * Generate a usage report in Excel format for the given date range.
 */
async function generateUsageReport(from, to) {
  const url = `https://endpointhealth-logging-github-io.onrender.com/report/by-provider?from=${from}&to=${to}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "x-api-key": "5657175624",
        "User-Agent": "PostmanRuntime/7.32.2",
        "Accept": "application/json"
      }
    });

    console.log(`✅ Retrieved ${data.length} records`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Usage Report");

    worksheet.columns = [
      { header: "Provider", key: "provider", width: 40 },
      { header: "Source", key: "source", width: 50 },
      { header: "Message Count", key: "message_count", width: 20 }
    ];

    let totalCount = 0;
    const uniqueProviders = new Set();

    data.forEach(row => {
      const count = parseInt(row.message_count);
      totalCount += count;
      uniqueProviders.add(row.provider);

      worksheet.addRow({
        provider: row.provider,
        source: row.source,
        message_count: count
      });
    });

    worksheet.addRow({});
    worksheet.addRow({
      provider: "Total Messages",
      source: "",
      message_count: totalCount
    });
    worksheet.addRow({
      provider: "Unique Providers",
      source: "",
      message_count: uniqueProviders.size
    });

    // Define the output directory one level up: ../results
    const outputDir = path.resolve(__dirname, "../results");
    fs.mkdirSync(outputDir, { recursive: true });

    const filename = `iris-usage-report-${from}-to-${to}.xlsx`;
    const filepath = path.join(outputDir, filename);

    await workbook.xlsx.writeFile(filepath);
    console.log(`📁 Report saved to ${filepath}`);
  } catch (error) {
    console.error("❌ Failed to generate report:", error.message);
  }
}

generateUsageReport(from, to);