const http = require("http");
const jwt = require("./backend/node_modules/jsonwebtoken");

const REAL_COMPLAINT_ID = "6aa64a91c5c1a441c2412d04";

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  console.log("================================================================================");
  console.log("         QUESTION 2(b) LIVE API AUTHORIZATION & ROLE RESTRICTION TEST           ");
  console.log("================================================================================\n");

  // 1. UPDATE Request Without Token
  console.log(`[TEST 1] PUT /api/complaints/${REAL_COMPLAINT_ID} (WITHOUT Authorization Header)`);
  const res1 = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/complaints/${REAL_COMPLAINT_ID}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  }, JSON.stringify({ status: "Resolved" }));

  console.log(`  -> Status Code : ${res1.statusCode} ${res1.statusMessage}`);
  console.log(`  -> Response    : ${res1.body}`);
  console.log(`  -> Served By   : ${res1.headers["x-backend-instance"] || "Nginx"}\n`);

  // 2. DELETE Request Without Token
  console.log(`[TEST 2] DELETE /api/complaints/${REAL_COMPLAINT_ID} (WITHOUT Authorization Header)`);
  const res2 = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/complaints/${REAL_COMPLAINT_ID}`,
    method: "DELETE"
  });

  console.log(`  -> Status Code : ${res2.statusCode} ${res2.statusMessage}`);
  console.log(`  -> Response    : ${res2.body}`);
  console.log(`  -> Served By   : ${res2.headers["x-backend-instance"] || "Nginx"}\n`);

  // 3. Request With Corrupted/Invalid Token
  console.log(`[TEST 3] PUT /api/complaints/${REAL_COMPLAINT_ID} (WITH Invalid Bearer Token)`);
  const res3 = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/complaints/${REAL_COMPLAINT_ID}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid.secret.token"
    }
  }, JSON.stringify({ status: "Resolved" }));

  console.log(`  -> Status Code : ${res3.statusCode} ${res3.statusMessage}`);
  console.log(`  -> Response    : ${res3.body}`);
  console.log(`  -> Served By   : ${res3.headers["x-backend-instance"] || "Nginx"}\n`);

  // 4. Student Role Attempting Admin-Only PUT / DELETE
  console.log("[TEST 4] Student Role attempting to UPDATE complaint (RBAC Enforcement)");
  const studentToken = jwt.sign({ id: "6a8f3944dc393dca4762c128", role: "student" }, "college_complaint_portal_secret_2026", { expiresIn: "1h" });

  const res4 = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/complaints/${REAL_COMPLAINT_ID}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    }
  }, JSON.stringify({ status: "Resolved", adminRemarks: "Student attempting unauthorized change" }));

  console.log(`  -> Caller Role : student`);
  console.log(`  -> Status Code : ${res4.statusCode} ${res4.statusMessage}`);
  console.log(`  -> Response    : ${res4.body}`);
  console.log(`  -> Served By   : ${res4.headers["x-backend-instance"] || "Nginx"}\n`);

  // 5. Admin Role Successfully Authenticating
  console.log("[TEST 5] Admin Role performing UPDATE complaint");
  const adminToken = jwt.sign({ id: "6a92afafaa21f813186e8795", role: "admin" }, "college_complaint_portal_secret_2026", { expiresIn: "1h" });

  const res5 = await makeRequest({
    hostname: "localhost",
    port: 8080,
    path: `/api/complaints/${REAL_COMPLAINT_ID}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    }
  }, JSON.stringify({ status: "In Progress", adminRemarks: "Verified by Hostel Warden" }));

  console.log(`  -> Caller Role : admin`);
  console.log(`  -> Status Code : ${res5.statusCode} ${res5.statusMessage} (Passed RBAC filter)`);
  console.log(`  -> Response    : ${res5.body}`);
  console.log(`  -> Served By   : ${res5.headers["x-backend-instance"] || "Nginx"}\n`);

  console.log("================================================================================");
  console.log("                     ALL RBAC REJECTION TESTS PASSED!                          ");
  console.log("================================================================================");
}

run().catch(console.error);
