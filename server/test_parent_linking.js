import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function runParentLinkingTests() {
  console.log('=== STARTING PARENT-STUDENT LINKING VERIFICATION ===');

  const randSuffix = Math.floor(Math.random() * 100000);
  const studentEmail = `student_link_${randSuffix}@cet.com`;
  const parentEmail = `parent_link_${randSuffix}@cet.com`;
  const parentEmailInvalid = `parent_invalid_${randSuffix}@cet.com`;
  const parentEmailNoPrn = `parent_noprn_${randSuffix}@cet.com`;

  let studentPrn = null;
  let studentId = null;

  try {
    // 1. Register a student
    console.log(`\n[TEST 1] Registering student: ${studentEmail}...`);
    const regStudentRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Link Student',
        email: studentEmail,
        password: 'password123',
        role: 'student',
        targetCourse: 'PCM',
        targetExam: 'MHT-CET',
        plan: 'Free'
      })
    });
    const regStudentData = await regStudentRes.json();
    if (regStudentRes.status === 201 && regStudentData.user.prn) {
      studentPrn = regStudentData.user.prn;
      studentId = regStudentData.user.id;
      console.log(`✅ Student registered. Generated PRN: ${studentPrn}, ID: ${studentId}`);
    } else {
      throw new Error(`Failed to register student: ${JSON.stringify(regStudentData)}`);
    }

    // 2. Attempt parent registration without a PRN
    console.log(`\n[TEST 2] Registering parent without PRN...`);
    const regParentNoPrnRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Parent No PRN',
        email: parentEmailNoPrn,
        password: 'password123',
        role: 'parent'
      })
    });
    const regParentNoPrnData = await regParentNoPrnRes.json();
    if (regParentNoPrnRes.status === 400 && regParentNoPrnData.error.includes("PRN number is required")) {
      console.log(`✅ Registration blocked as expected (No PRN provided).`);
    } else {
      throw new Error(`Failed: Expected 400 bad request, got ${regParentNoPrnRes.status} - ${JSON.stringify(regParentNoPrnData)}`);
    }

    // 3. Attempt parent registration with an invalid/non-existent student PRN
    console.log(`\n[TEST 3] Registering parent with non-existent PRN 'MHT202600000'...`);
    const regParentInvalidRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Parent Invalid PRN',
        email: parentEmailInvalid,
        password: 'password123',
        role: 'parent',
        prn: 'MHT202600000'
      })
    });
    const regParentInvalidData = await regParentInvalidRes.json();
    if (regParentInvalidRes.status === 400 && regParentInvalidData.error.includes("No student found")) {
      console.log(`✅ Registration blocked as expected (Invalid PRN provided).`);
    } else {
      throw new Error(`Failed: Expected 400 bad request, got ${regParentInvalidRes.status} - ${JSON.stringify(regParentInvalidData)}`);
    }

    // 4. Register parent with the student's valid PRN
    console.log(`\n[TEST 4] Registering parent with valid PRN '${studentPrn}'...`);
    const regParentRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Valid Parent',
        email: parentEmail,
        password: 'password123',
        role: 'parent',
        prn: studentPrn
      })
    });
    const regParentData = await regParentRes.json();
    if (regParentRes.status === 201) {
      console.log(`✅ Parent registered successfully with valid student PRN.`);
    } else {
      throw new Error(`Failed: Expected 201 created, got ${regParentRes.status} - ${JSON.stringify(regParentData)}`);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL PARENT-STUDENT LINKING VERIFICATION TESTS PASSED 🎉');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runParentLinkingTests();
