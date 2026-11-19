const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJzaWQxMjNAZ21haWwuY29tIiwiaWF0IjoxNzk0ODY2NzM0LCJleHAiOjE3OTQ5NTMxMzR9.QQ6KPRC1y0KLTg1LPJQRzH-G0MbUL3iGeWLSAHKNXBc";


const BASE_URL = "http://localhost:5000/api/readings";

// REUSABLE API TEST FUNCTION
async function testAPI(name, method, body = null, id = "") {
  try {
    const response = await fetch(
      `${BASE_URL}${id ? `/${id}` : ""}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(body && { body: JSON.stringify(body) }),
      }
    );

    const data = await response.json();

    console.log(`\n${name}`);
    console.log("Status:", response.status);
    console.log("Response:", data);

    return data;

  } catch (error) {
    console.error(`${name} failed:`, error.message);
  }
}

// GET ALL READINGS
async function getReadings() {
  return testAPI("GET READINGS", "GET");
}

// GET GLUCOSE TREND
async function getGlucoseTrend() {
  const response = await fetch(
    "http://localhost:5000/api/reports/trend",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log("\nGLUCOSE TREND");
  console.log("Status:", response.status);
  console.log("Response:", await response.json());
}

// ADD READING
async function addReading(reading_date, slot, value) {
  return testAPI("ADD READING", "POST", {
    reading_date,
    slot,
    value,
  });
}

// EDIT READING
async function editReading(id, reading_date, slot, value) {
  return testAPI("EDIT READING", "PUT", {
    reading_date,
    slot,
    value,
  }, id);
}

// TESTS
  
async function runTests() {
  const today = "2026-11-17";

  console.log("\n========== DAILY LIMIT TEST ==========");

  // Add third reading
  const lunch = await addReading(today, "After lunch", 120);

  // Add fourth reading
  const dinner = await addReading(today, "After dinner", 125);

  // Attempt fifth reading
  await addReading(today, "Morning (fasting)", 130);

  console.log("\n========== EDIT READING TEST ==========");

  // Edit existing reading ID 5 without changing its value
  await editReading(5, today, "Morning (fasting)", 108);

  console.log("\n========== CLEANUP TEST READINGS ==========");

  // Delete only the two temporary test readings
  if (lunch?.reading?.id) {
    await testAPI("DELETE TEST LUNCH", "DELETE", null, lunch.reading.id);
  }

  if (dinner?.reading?.id) {
    await testAPI("DELETE TEST DINNER", "DELETE", null, dinner.reading.id);
  }

  console.log("\n========== FINAL READINGS ==========");

  await getReadings();
}

runTests();
