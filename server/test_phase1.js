
const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('=== STARTING PHASE 1 BACKEND VERIFICATION ===');
  
  let teacherId = null;
  let studentId = null;
  let studentPrn = null;
  let studentToken = null;
  let parentId = null;
  let adminToken = null;
  let teacherToken = null;

  const randSuffix = Math.floor(Math.random() * 100000);
  const teacherEmail = `teacher_${randSuffix}@cet.com`;
  const studentEmail = `student_${randSuffix}@cet.com`;
  const parentEmail = `parent_${randSuffix}@cet.com`;

  try {
    // 1. Register a teacher (role: 'teacher') -> verify status is 'pending'
    console.log(`\n[TEST 1] Registering teacher: ${teacherEmail}...`);
    const regTeacherRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Teacher',
        email: teacherEmail,
        password: 'password123',
        role: 'teacher'
      })
    });
    const regTeacherData = await regTeacherRes.json();
    if (regTeacherRes.status === 201 && regTeacherData.user.status === 'pending') {
      console.log('✅ Teacher registered successfully with pending status.');
      teacherId = regTeacherData.user.id;
    } else {
      throw new Error(`Failed to register teacher: ${JSON.stringify(regTeacherData)}`);
    }

    // 2. Attempt login as pending teacher -> verify 403 response
    console.log('\n[TEST 2] Attempting login as pending teacher...');
    const loginTeacherRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: teacherEmail,
        password: 'password123'
      })
    });
    const loginTeacherData = await loginTeacherRes.json();
    if (loginTeacherRes.status === 403 && loginTeacherData.error.includes('pending')) {
      console.log('✅ Pending teacher login was successfully blocked (403 Forbidden).');
    } else {
      throw new Error(`Failed block pending test: ${loginTeacherRes.status} - ${JSON.stringify(loginTeacherData)}`);
    }

    // 3. Register a student (role: 'student') -> verify PRN is generated and stored
    console.log(`\n[TEST 3] Registering student: ${studentEmail}...`);
    const regStudentRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: studentEmail,
        password: 'password123',
        role: 'student',
        targetCourse: 'PCM',
        targetExam: 'MHT-CET',
        plan: 'Free'
      })
    });
    const regStudentData = await regStudentRes.json();
    if (regStudentRes.status === 201 && regStudentData.user.prn && regStudentData.user.prn.startsWith('MHT2026')) {
      console.log(`✅ Student registered successfully. Auto-generated PRN: ${regStudentData.user.prn}`);
      studentId = regStudentData.user.id;
      studentPrn = regStudentData.user.prn;
      studentToken = regStudentData.token;
    } else {
      throw new Error(`Failed to register student: ${JSON.stringify(regStudentData)}`);
    }

    // 4. Student registers a parent account -> verify linking works
    console.log(`\n[TEST 4] Student registering parent: ${parentEmail}...`);
    const regParentRes = await fetch(`${BASE_URL}/api/student/register-parent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        name: 'Test Parent',
        email: parentEmail,
        password: 'password123'
      })
    });
    const regParentData = await regParentRes.json();
    if (regParentRes.status === 201 && regParentData.parent.linkedStudentId === studentId) {
      console.log('✅ Parent account registered and linked to student successfully.');
      parentId = regParentData.parent.id;
    } else {
      throw new Error(`Failed parent registration: ${JSON.stringify(regParentData)}`);
    }

    // 5. Login as pre-seeded admin -> obtain admin token
    console.log('\n[TEST 5] Logging in as Admin...');
    const loginAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sharma.sir@cet.com',
        password: 'password123'
      })
    });
    const loginAdminData = await loginAdminRes.json();
    if (loginAdminRes.status === 200 && loginAdminData.token) {
      console.log('✅ Admin logged in successfully.');
      adminToken = loginAdminData.token;
    } else {
      throw new Error(`Failed admin login: ${JSON.stringify(loginAdminData)}`);
    }

    // 6. Admin approves teacher -> verify status becomes active
    console.log(`\n[TEST 6] Admin approving teacher ID ${teacherId}...`);
    const approveRes = await fetch(`${BASE_URL}/api/admin/approve-teacher/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const approveData = await approveRes.json();
    if (approveRes.status === 200 && approveData.teacher.status === 'active') {
      console.log('✅ Teacher approved successfully. Status set to active.');
    } else {
      throw new Error(`Failed to approve teacher: ${JSON.stringify(approveData)}`);
    }

    // 7. Login as approved teacher -> verify login now succeeds
    console.log('\n[TEST 7] Logging in as approved teacher...');
    const loginApprovedRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: teacherEmail,
        password: 'password123'
      })
    });
    const loginApprovedData = await loginApprovedRes.json();
    if (loginApprovedRes.status === 200 && loginApprovedData.token) {
      console.log('✅ Approved teacher logged in successfully.');
      teacherToken = loginApprovedData.token;
    } else {
      throw new Error(`Failed approved teacher login: ${JSON.stringify(loginApprovedData)}`);
    }

    // 8. Teacher searches for student by name -> verify matches student
    console.log(`\n[TEST 8] Teacher searching for student by name query 'Test Student'...`);
    const searchRes = await fetch(`${BASE_URL}/api/teacher/students/search?query=Test+Student`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const searchData = await searchRes.json();
    if (searchRes.status === 200 && Array.isArray(searchData) && searchData.length > 0) {
      const found = searchData.find(s => s.prn === studentPrn);
      if (found) {
        console.log(`✅ Student found by name. PRN confirmed: ${found.prn}`);
      } else {
        throw new Error(`Student not found in search results: ${JSON.stringify(searchData)}`);
      }
    } else {
      throw new Error(`Search request failed: ${JSON.stringify(searchData)}`);
    }

    // 9. Teacher searches for student by PRN -> verify matches student
    console.log(`\n[TEST 9] Teacher searching for student by PRN query '${studentPrn}'...`);
    const searchPrnRes = await fetch(`${BASE_URL}/api/teacher/students/search?query=${studentPrn}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const searchPrnData = await searchPrnRes.json();
    if (searchPrnRes.status === 200 && Array.isArray(searchPrnData) && searchPrnData.length > 0) {
      const found = searchPrnData.find(s => s.id === studentId || s._id === studentId);
      if (found) {
        console.log(`✅ Student found by PRN. Name confirmed: ${found.name}`);
      } else {
        throw new Error(`Student not found in PRN search results: ${JSON.stringify(searchPrnData)}`);
      }
    } else {
      throw new Error(`PRN search request failed: ${JSON.stringify(searchPrnData)}`);
    }

    // 10. Call student AI Tutor endpoint to trigger auto-logging middleware
    console.log('\n[TEST 10] Calling student AI tutor endpoint...');
    const tutorRes = await fetch(`${BASE_URL}/api/student/ai-tutor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ message: 'What is angular velocity?' })
    });
    const tutorData = await tutorRes.json();
    if (tutorRes.status === 200 && tutorData.reply) {
      console.log('✅ Student AI tutor responder succeeded.');
    } else {
      throw new Error(`AI Tutor request failed: ${JSON.stringify(tutorData)}`);
    }

    // 11. Call manual AI usage log endpoint
    console.log('\n[TEST 11] Calling manual AI usage logging endpoint...');
    const manualLogRes = await fetch(`${BASE_URL}/api/ai/log-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ actionType: 'doubt_solve' })
    });
    const manualLogData = await manualLogRes.json();
    if (manualLogRes.status === 201 && manualLogData.success) {
      console.log('✅ Manual AI usage logged successfully.');
    } else {
      throw new Error(`Manual AI log failed: ${JSON.stringify(manualLogData)}`);
    }

    console.log('\n=============================================');
    console.log('🎉 ALL PHASE 1 BACKEND VERIFICATION TESTS PASSED 🎉');
    console.log('=============================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
