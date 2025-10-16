// =================================================================
// SCRIPT CONFIGURATION
// =================================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_bx_QrHVGDYogM7ed3XCh_3MrpIKY4ReY39jBeVXaWK4RVECSDmdsPhhWIYyltQTP/exec';
let currentUserRole = '';
let vaccineDatesArray = [];
let appointmentDatesArray = [];
let selectedDates = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// =================================================================
// INITIALIZATION
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    const loggedInUserRole = sessionStorage.getItem('userRole');
    const loggedInUserName = sessionStorage.getItem('userName');

    setupPasswordToggle();

    if (loggedInUserRole) {
        showMainSystem(loggedInUserRole, loggedInUserName); 
    } else {
        document.body.className = 'login-body';
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('background-animation').classList.remove('hidden');
    }
    initializeTabContent();
});

function showMainSystem(role, name) {
    document.body.className = 'bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen';
    
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('background-animation').classList.add('hidden');
    
    document.getElementById('mainSystem').classList.remove('hidden');
    
    currentUserRole = role;
    
    let userDisplay = role;
    if (name) {
        userDisplay = `${role}: ${name}`;
    }
    document.getElementById('userRole').textContent = userDisplay;

    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('show'));
    if (role === 'แอดมิน') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('show'));
    }
    updateCurrentDate();
    generateCalendar(); // ฟังก์ชันนี้จะหาที่วางปฏิทินเจอแล้ว
    showTab('search');
}

function initializeTabContent() {
    document.getElementById('searchContent').innerHTML = `
        <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">🔍 ค้นหาข้อมูลผู้ป่วย</h2>
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">เลขบัตรประชาชน</label>
                <div class="flex space-x-4">
                    <input type="text" id="searchId" class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="กรอกเลขบัตรประชาชน 13 หลัก" maxlength="13">
                    <button onclick="searchPatient()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200">ค้นหา</button>
                </div>
            </div>
            <div id="patientInfo" class="hidden">
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-green-800 mb-4">ข้อมูลผู้ป่วย</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">ชื่อ-นามสกุล</p>
                            <p class="font-medium" id="patientName"></p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                            <p class="font-medium" id="patientPhone"></p>
                        </div>
                        <div class="col-span-1 md:col-span-2">
                            <h4 class="font-semibold text-gray-800 mb-2">ตารางนัดหมาย</h4>
                            <div id="appointmentTableContainer"></div>
                        </div>
                        <div class="col-span-1 md:col-span-2">
                            <h4 class="font-semibold text-gray-800 mb-3">ประวัติการฉีดยา</h4>
                            <div class="space-y-2" id="vaccineHistory"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('appointmentContent').innerHTML = `
        <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">📅 ลงทะเบียนนัดหมาย (สำหรับแอดมิน)</h2>
            <form id="appointmentForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">เลขบัตรประชาชน</label>
                        <div class="flex space-x-2">
                            <input type="text" id="appointmentNationalId" class="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="1234567890123" maxlength="13">
                            <button type="button" onclick="lookupPatientForAppointment()" class="bg-indigo-500 text-white px-4 rounded-lg hover:bg-indigo-600 transition-colors">ค้นหาข้อมูล</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                        <input type="tel" id="appointmentPhone" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="081-234-5678">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
                        <input type="text" id="appointmentFirstName" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="กรอกชื่อ">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">นามสกุล</label>
                        <input type="text" id="appointmentLastName" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="กรอกนามสกุล">
                    </div>
                </div>
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">เลือกวันที่นัด (สามารถเลือกได้หลายวัน)</label>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div id="multiDateCalendar" class="max-w-md mx-auto bg-white rounded-lg shadow-sm border"></div>
                        <div class="mt-4 text-center">
                            <p class="text-sm text-gray-600">คลิกวันที่เพื่อเลือก/ยกเลิก (เลือกแล้ว: <span id="selectedDatesCount">0</span> วัน)</p>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อยา</label>
                        <select id="appointmentVaccine" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">เลือกยา</option>
                            <option value="Fluphenazine">Fluphenazine</option>
                            <option value="Haloperidol">Haloperidol</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ขนาดยา</label>
                        <select id="appointmentDosage" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">เลือกขนาด</option>
                            <option value="25 mg">25 mg</option>
                            <option value="50 mg">50 mg</option>
                            <option value="75 mg">75 mg</option>
                            <option value="100 mg">100 mg</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ตำแหน่งฉีด</label>
                        <input type="text" id="appointmentInjectionSite" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" >
                    </div>
                </div>
                <div class="flex justify-center">
                    <button type="button" onclick="addSelectedDates()" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200">เพิ่มวันที่ที่เลือก</button>
                </div>
                <div id="appointmentDates" class="space-y-3"></div>
                <div id="deleteAllBtnContainer" class="flex justify-end hidden">
                    <button type="button" onclick="deleteAllAppointments()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 text-sm">
                        ลบนัดหมายทั้งหมด
                    </button>
                </div>
                
                <div class="flex space-x-4">
                    <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200">บันทึกนัดหมาย</button>
                    <button type="button" onclick="printCurrentAppointmentCard()" class="w-full bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition duration-200">พิมพ์ใบนัด</button>
                </div>
            </form>
        </div>
    `;


    

    document.getElementById('registerContent').innerHTML = `
        <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">📝 ลงทะเบียนข้อมูลผู้ป่วย</h2>
            <form id="registerForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
                        <input type="text" id="firstName" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="กรอกชื่อ">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">นามสกุล</label>
                        <input type="text" id="lastName" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="กรอกนามสกุล">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">เลขบัตรประชาชน</label>
                        <input type="text" id="nationalId" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="1234567890123" maxlength="13">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">สถานที่ฉีด</label>
                    <select id="hospital" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">เลือกสถานที่ฉีด</option>
                        <option value="รพ.สต.เขาขาว">รพ.สต.เขาขาว</option>
                        <option value="รพ.สต.เขาปูน">รพ.สต.เขาปูน</option>
                        <option value="รพ.สต.ท่างิ้ว">รพ.สต.ท่างิ้ว</option>
                        <option value="รพ.สต.ทุ่งต่อ">รพ.สต.ทุ่งต่อ</option>
                        <option value="รพ.สต.ในเตา">รพ.สต.ในเตา</option>
                        <option value="รพ.สต.บางดี">รพ.สต.บางดี</option>
                        <option value="รพ.สต.บ้านนาวง">รพ.สต.บ้านนาวง</option>
                        <option value="รพ.สต.บ้านพรุจูด">รพ.สต.บ้านพรุจูด</option>
                        <option value="รพ.สต.บ้านโพธิ์โทน">รพ.สต.บ้านโพธิ์โทน</option>
                        <option value="รพ.สต.บ้านหนองปรือ">รพ.สต.บ้านหนองปรือ</option>
                        <option value="รพ.สต.บ้านหนองหมอ">รพ.สต.บ้านหนองหมอ</option>
                        <option value="รพ.สต.บ้านห้วยน้ำเย็น">รพ.สต.บ้านห้วยน้ำเย็น</option>
                        <option value="รพ.สต.บ้านเหนือคลอง">รพ.สต.บ้านเหนือคลอง</option>
                        <option value="รพ.สต.ปากคม">รพ.สต.ปากคม</option>
                        <option value="รพ.สต.ปากแจ่ม">รพ.สต.ปากแจ่ม</option>
                        <option value="รพ.สต.ลำภูรา">รพ.สต.ลำภูรา</option>
                        <option value="รพ.สต.วังคีรี">รพ.สต.วังคีรี</option>
                        <option value="รพ.สต.หนองช้างแล่น">รพ.สต.หนองช้างแล่น</option>
                        <option value="รพ.สต.ห้วยนาง">รพ.สต.ห้วยนาง</option>
                        <option value="รพ.สต.ห้วยนาง">PCU ห้วยยอด</option>
                        <option value="รพ.สต.ห้วยนาง">เทศบาลตำบลห้วยยอด</option>
                        <option value="รพ.สต.ห้วยนาง">เทศบาลตำบลนาวง</option>
                    </select>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">วันที่ฉีด</label>
                        <input type="date" id="vaccineDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อยา</label>
                        <select id="vaccineName" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">เลือกยา</option>
                            <option value="Fluphenazine">Fluphenazine</option>
                            <option value="Haloperidol">Haloperidol</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ขนาดยา</label>
                        <select id="vaccineDosage" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">เลือกขนาด</option>
                            <option value="25 mg">25 mg</option>
                            <option value="50 mg">50 mg</option>
                            <option value="75 mg">75 mg</option>
                            <option value="100 mg">100 mg</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ตำแหน่งฉีด</label>
                        <input type="text" id="injectionSite" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ฉีดยา</label>
                        <input type="text" id="vaccineRecorder" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="ชื่อผู้ฉีดยา">
                    </div>
                </div>
                <div class="flex justify-center">
                    <button type="button" onclick="addVaccineDate()" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200">เพิ่มข้อมูลการฉีด</button>
                </div>
                <div id="vaccineDates" class="space-y-3"></div>
                <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200">บันทึกข้อมูล</button>
            </form>
        </div>
    `;

    document.getElementById('dashboardContent').innerHTML = `
        <div class="max-w-3xl mx-auto">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">📊 นัดหมายวันนี้</h2>
                <div class="space-y-4" id="todayAppointments"></div>
            </div>
        </div>
    `;
    
    addEventListeners();
}

async function deleteAllAppointments() {
    const nationalId = document.getElementById('appointmentNationalId').value;
    if (!nationalId) {
        return alert('กรุณากรอกเลขบัตรประชาชนก่อน');
    }

    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบนัดหมายทั้งหมดของเลขบัตร ${nationalId}? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
        return;
    }

    // แสดงสถานะกำลังลบ
    const deleteAllBtn = document.querySelector('#deleteAllBtnContainer button');
    deleteAllBtn.textContent = 'กำลังลบ...';
    deleteAllBtn.disabled = true;

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'deleteAllAppointmentsForPatient',
                nationalId: nationalId
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('ลบนัดหมายทั้งหมดเรียบร้อยแล้ว');
            appointmentDatesArray = [];
            updateAppointmentDatesDisplay(); // อัปเดตหน้าจอให้แสดงผลว่าไม่มีนัดหมาย
        } else {
            throw new Error(result.error || 'ไม่สามารถลบข้อมูลได้');
        }
    } catch (error) {
        console.error('Delete All Error:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message);
    } finally {
        // คืนค่าปุ่มให้เป็นปกติ
        deleteAllBtn.textContent = 'ลบนัดหมายทั้งหมด';
        deleteAllBtn.disabled = false;
    }
}

function setupPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (!togglePassword || !passwordInput) return;

    const eyeIcon = `
        <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>`;
    
    const eyeSlashIcon = `
        <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.111 2.458.311M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18"></path>
        </svg>`;

    // ใส่ไอคอนดวงตาเริ่มต้น
    togglePassword.innerHTML = eyeIcon;

    togglePassword.addEventListener('click', function() {
        // เปลี่ยน type ของ input ระหว่าง 'password' กับ 'text'
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // เปลี่ยนไอคอนตาม type ของ input
        if (type === 'password') {
            this.innerHTML = eyeIcon;
        } else {
            this.innerHTML = eyeSlashIcon;
        }
    });
}

function updateCurrentDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('th-TH', options);
}

// =================================================================
// AUTHENTICATION & UI MANAGEMENT
// =================================================================
function addEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegisterSubmit);
    document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentSubmit);
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginButton = this.querySelector('button[type="submit"]');
    const originalButtonText = loginButton.textContent;

    loginButton.disabled = true;
    loginButton.textContent = 'กำลังตรวจสอบ...';

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'login', username, password })
        });
        const result = await response.json();
        if (result.success) {
            sessionStorage.setItem('userRole', result.role);
            sessionStorage.setItem('userName', result.name);
            showMainSystem(result.role, result.name); 
        } else {
            alert('❌ ' + (result.message || result.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'));
        }
    } catch (error) {
        console.error('Login Error:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = originalButtonText;
    }
}

function showMainSystem(role, name) {
    document.body.className = 'bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen';
    
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('background-animation').classList.add('hidden');
    
    document.getElementById('mainSystem').classList.remove('hidden');
    
    currentUserRole = role;
    
    let userDisplay = role;
    if (name) {
        userDisplay = `${role}: ${name}`;
    }
    document.getElementById('userRole').textContent = userDisplay;

    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('show'));
    if (role === 'แอดมิน') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('show'));
    }
    updateCurrentDate();
    generateCalendar();
    showTab('search');
}

function logout() {
    sessionStorage.clear();
    location.reload();
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('bg-white', 'text-blue-600', 'shadow-sm');
        tab.classList.add('text-gray-600');
    });
    document.getElementById(tabName + 'Content').classList.remove('hidden');
    const activeTab = document.getElementById(tabName + 'Tab');
    activeTab.classList.remove('text-gray-600');
    activeTab.classList.add('bg-white', 'text-blue-600', 'shadow-sm');
    if (tabName === 'dashboard') {
        loadDashboardData();
    }
}

// =================================================================
// DASHBOARD FUNCTIONS
// =================================================================
async function loadDashboardData() {
    const container = document.getElementById('todayAppointments');
    container.innerHTML = '<p class="text-center text-gray-500">กำลังโหลดข้อมูลนัดหมาย...</p>';
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            redirect: 'follow',
            body: JSON.stringify({ action: 'getTodaysAppointments' })
        });
        const result = await response.json();
        if (result.success && result.data) {
            container.innerHTML = '';
            if (result.data.length > 0) {
                result.data.forEach(app => {
                    const statusColor = app.status === 'ฉีดแล้ว' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
                    const appointmentCard = document.createElement('div');
                    appointmentCard.className = 'flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200';
                    appointmentCard.innerHTML = `
                        <div>
                            <p class="font-medium text-blue-800">${app.name}</p>
                            <p class="text-sm text-blue-600">${app.phone || 'ไม่มีเบอร์โทร'}</p>
                            <p class="text-sm text-gray-600">${app.vaccine}</p>
                        </div>
                        <div class="text-right">
                            <span class="inline-block px-2 py-1 text-xs rounded-full ${statusColor}">${app.status}</span>
                        </div>`;
                    container.appendChild(appointmentCard);
                });
            } else {
                container.innerHTML = '<p class="text-center text-gray-500">วันนี้ไม่มีนัดหมาย</p>';
            }
        } else {
            throw new Error(result.error || 'ไม่สามารถโหลดข้อมูลได้');
        }
    } catch (error) {
        console.error('Dashboard Load Error:', error);
        container.innerHTML = `<p class="text-center text-red-500">เกิดข้อผิดพลาด: ${error.message}</p>`;
    }
}

// =================================================================
// PATIENT SEARCH FUNCTIONS
// =================================================================
async function searchPatient() {
    const searchId = document.getElementById('searchId').value.trim();
    if (!searchId) {
        alert('กรุณากรอกเลขบัตรประชาชน');
        return;
    }
    const searchButton = document.querySelector('#searchContent button');
    const originalText = searchButton.textContent;
    searchButton.textContent = 'กำลังค้นหา...';
    searchButton.disabled = true;
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'searchPatient', nationalId: searchId })
        });
        const result = await response.json();
        if (result.success) {
            displayPatientInfo(result.data);
        } else {
            alert('❌ ' + (result.error || 'ไม่พบข้อมูลผู้ป่วย'));
            document.getElementById('patientInfo').classList.add('hidden');
        }
    } catch (error) {
        console.error('Search Error:', error);
        alert('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
        searchButton.textContent = originalText;
        searchButton.disabled = false;
    }
}

function displayPatientInfo(patientData) {
    document.getElementById('patientName').textContent = patientData.name;
    document.getElementById('patientPhone').textContent = patientData.phone || 'ไม่มีข้อมูล';
    
    const appointmentContainer = document.getElementById('appointmentTableContainer');
    appointmentContainer.innerHTML = '';
    const vaccinationDates = new Set((patientData.history || []).map(record => record.date));

    if (patientData.appointments && patientData.appointments.length > 0) {
        let tableHtml = `
            <div class="overflow-x-auto rounded-lg border">
                <table class="min-w-full bg-white">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่นัด (พ.ศ.)</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อยา</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ขนาดยา</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ตำแหน่งฉีด</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ลงทะเบียน</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ฉีด</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">`;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        patientData.appointments.forEach(app => {
            const appDate = new Date(app.date);
            let statusText = '';
            let statusColorClass = '';
            let recorderName = ''; 

            if (vaccinationDates.has(app.date)) {
                statusText = 'ฉีดแล้ว';
                statusColorClass = 'bg-green-100 text-green-800';
                const historyRecord = patientData.history.find(h => h.date === app.date);
                if (historyRecord && historyRecord.createdBy) {
                    recorderName = historyRecord.createdBy;
                } else {
                    recorderName = app.createdBy || '-';
                }
            } else if (appDate < today) {
                statusText = 'ไม่มาตามนัด';
                statusColorClass = 'bg-red-100 text-red-800';
            } else {
                statusText = 'รอฉีด';
                statusColorClass = 'bg-gray-100 text-gray-800';
            }
            
            tableHtml += `
                <tr>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${formatThaiDate(app.date)}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${app.vaccine}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${app.dosage || '-'}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${app.injectionSite || '-'}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${app.createdBy || '-'}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${recorderName}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorClass}">${statusText}</span>
                    </td>
                </tr>`;
        });
        tableHtml += `</tbody></table></div>`;
        appointmentContainer.innerHTML = tableHtml;
    } else {
        appointmentContainer.innerHTML = '<p class="text-gray-500 text-center py-4">ไม่มีข้อมูลนัดหมาย</p>';
    }

    const historyContainer = document.getElementById('vaccineHistory');
    historyContainer.innerHTML = '';
    if (patientData.history && patientData.history.length > 0) {
        patientData.history.forEach(record => {
            const historyItem = document.createElement('div');
            historyItem.className = 'flex justify-between items-center p-3 bg-white rounded-lg border';
            historyItem.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-800">${record.vaccineName || 'N/A'}</p>
                    <p class="text-sm text-gray-600">${record.hospital || 'N/A'}</p>
                </div>
                <span class="text-sm text-gray-500">${formatThaiDate(record.date)}</span>`;
            historyContainer.appendChild(historyItem);
        });
    } else {
        historyContainer.innerHTML = `<p class="text-gray-500 text-center py-4">ยังไม่มีประวัติการฉีดยา</p>`;
    }
    document.getElementById('patientInfo').classList.remove('hidden');
}

// =================================================================
// DATA REGISTRATION & APPOINTMENT FUNCTIONS
// =================================================================
async function lookupPatientForAppointment() {
    const nationalId = document.getElementById('appointmentNationalId').value.trim();
    if (!nationalId) {
        return alert('กรุณากรอกเลขบัตรประชาชนเพื่อค้นหา');
    }

    const lookupButton = document.querySelector('#appointmentContent button[onclick="lookupPatientForAppointment()"]');
    const originalButtonText = lookupButton.textContent;
    lookupButton.textContent = '...';
    lookupButton.disabled = true;

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'searchPatient', nationalId: nationalId })
        });
        const result = await response.json();

        if (result.success && result.data) {
            const patient = result.data;
            const nameParts = patient.name.split(' ');
            document.getElementById('appointmentFirstName').value = nameParts[0] || '';
            document.getElementById('appointmentLastName').value = nameParts.slice(1).join(' ') || '';
            document.getElementById('appointmentPhone').value = patient.phone || '';

            appointmentDatesArray = patient.appointments || [];
            updateAppointmentDatesDisplay();
            alert('พบข้อมูลผู้ป่วยและโหลดข้อมูลนัดหมายเดิมเรียบร้อยแล้ว');
        } else {
            document.getElementById('appointmentFirstName').value = '';
            document.getElementById('appointmentLastName').value = '';
            document.getElementById('appointmentPhone').value = '';
            appointmentDatesArray = [];
            updateAppointmentDatesDisplay();
            alert('ไม่พบข้อมูลผู้ป่วย ท่านสามารถลงทะเบียนนัดหมายใหม่ได้เลย');
        }
    } catch (error) {
        console.error('Lookup Error:', error);
        alert('เกิดข้อผิดพลาดในการค้นหาข้อมูล');
    } finally {
        lookupButton.textContent = originalButtonText;
        lookupButton.disabled = false;
    }
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        nationalId: document.getElementById('nationalId').value.trim(),
        hospital: document.getElementById('hospital').value,
        vaccineDates: vaccineDatesArray
    };
    if (!formData.firstName || !formData.lastName || !formData.nationalId || !formData.hospital) {
        return alert('⚠️ กรุณากรอกข้อมูลผู้ป่วยให้ครบถ้วน');
    }
    if (vaccineDatesArray.length === 0) {
        return alert('⚠️ กรุณาเพิ่มข้อมูลการฉีดยาอย่างน้อย 1 ครั้ง');
    }
    savePatientToGoogleSheets(formData);
}

async function savePatientToGoogleSheets(formData) {
    const submitButton = document.querySelector('#registerForm button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'กำลังบันทึก...';
    submitButton.disabled = true;
    try {
        const vaccineRecords = formData.vaccineDates.map(vaccine => ({
            timestamp: new Date().toLocaleString('th-TH'),
            nationalId: formData.nationalId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: '',
            hospital: formData.hospital,
            vaccineDate: formatThaiDate(vaccine.date),
            vaccineName: vaccine.vaccine,
            dosage: vaccine.dosage, 
            injectionSite: vaccine.site,
            status: 'ฉีดแล้ว',
            createdBy: vaccine.recorder 
        }));
        for (const record of vaccineRecords) {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'savePatient', data: record })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        }
        alert(`✅ บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว!`);
        document.getElementById('registerForm').reset();
        vaccineDatesArray = [];
        updateVaccineDatesDisplay();
    } catch (error) {
        console.error('Error saving patient:', error);
        alert('⚠️ เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}
        
function handleAppointmentSubmit(e) {
    e.preventDefault();
    const formData = {
        nationalId: document.getElementById('appointmentNationalId').value,
        phone: document.getElementById('appointmentPhone').value,
        firstName: document.getElementById('appointmentFirstName').value,
        lastName: document.getElementById('appointmentLastName').value,
        appointments: appointmentDatesArray
    };
     if (!formData.firstName || !formData.lastName || !formData.phone || !formData.nationalId) {
        return alert('⚠️ กรุณากรอกข้อมูลผู้ป่วยให้ครบถ้วน');
    }
    if (appointmentDatesArray.length === 0) {
        return alert('⚠️ กรุณาเพิ่มข้อมูลนัดหมายอย่างน้อย 1 ครั้ง');
    }
    saveAppointmentToGoogleSheets(formData);
}

async function saveAppointmentToGoogleSheets(formData) {
    const submitButton = document.querySelector('#appointmentForm button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'กำลังบันทึก...';
    submitButton.disabled = true;

    try {
        const loggedInUserName = sessionStorage.getItem('userName') || sessionStorage.getItem('userRole');

        const appointments = formData.appointments.map(appointment => ({
            timestamp: new Date().toLocaleString('th-TH'),
            nationalId: formData.nationalId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            appointmentDate: formatThaiDate(appointment.date),
            vaccine: appointment.vaccine,
            dosage: appointment.dosage, 
            injectionSite: appointment.injectionSite, 
            status: 'รอฉีด',
            createdBy: loggedInUserName
        }));

        for (const appointment of appointments) {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'saveAppointment', data: appointment })
            });
        }
        
        alert(`✅ บันทึกนัดหมายเรียบร้อยแล้ว!`);
        printCurrentAppointmentCard(); 

        document.getElementById('appointmentForm').reset();
        appointmentDatesArray = [];
        selectedDates = [];
        updateAppointmentDatesDisplay();
        generateCalendar();

    } catch (error) {
        console.error('Error saving appointment:', error);
        alert('⚠️ เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// =================================================================
// HELPER & UTILITY FUNCTIONS
// =================================================================
function printCurrentAppointmentCard() {
    const formData = {
        nationalId: document.getElementById('appointmentNationalId').value,
        phone: document.getElementById('appointmentPhone').value,
        firstName: document.getElementById('appointmentFirstName').value,
        lastName: document.getElementById('appointmentLastName').value,
        appointments: appointmentDatesArray
    };

    if (!formData.firstName || !formData.lastName || !formData.nationalId || formData.appointments.length === 0) {
        return alert('กรุณากรอกข้อมูลผู้ป่วยและเพิ่มรายการนัดหมายก่อนพิมพ์');
    }
    printAppointmentCard(formData);
}

function printAppointmentCard(formData) {
    const printContainer = document.getElementById('print-container');
    
    let appointmentRows = '';
    formData.appointments.forEach(app => {
        appointmentRows += `
            <tr class="border-b">
                <td class="py-2 px-4 text-left">${formatThaiDate(app.date)}</td>
                <td class="py-2 px-4 text-left">${app.vaccine}</td>
                <td class="py-2 px-4 text-left">${app.dosage || '-'}</td>
                <td class="py-2 px-4 text-left">${app.injectionSite || '-'}</td>
                <td class="py-2 px-4 text-left" style="border-bottom: 1px dotted #999;"></td>
            </tr>
        `;
    });

   const cardHTML = `
    <div id="print-card" class="p-0 bg-white flex flex-col h-full text-gray-800 text-base">
        <div class="flex justify-between items-center mb-4">
            <div>
                <img src="https://i.postimg.cc/50Y8RqkF/logo.png" alt="โลโก้โรงพยาบาล" style="height: 80px;">
            </div>
            <div class="text-center">
                <h1 class="text-2xl font-bold">ใบนัดรับบริการฉีดยา</h1>
                <p class="text-lg">คลินิกจิตเวชและยาเสพติด โรงพยาบาลห้วยยอด</p>
            </div>
            <div></div> </div>
        <div class="mb-8">
            <h2 class="text-lg font-semibold border-b pb-2 mb-4">ข้อมูลผู้ป่วย</h2>
            <div class="space-y-2 text-sm">
                <div class="flex">
                    <span class="font-medium text-gray-600 w-1/3">ชื่อ-นามสกุล:</span>
                    <span class="font-bold">${formData.firstName} ${formData.lastName}</span>
                </div>
                <div class="flex">
                    <span class="font-medium text-gray-600 w-1/3">เลขบัตรประชาชน:</span>
                    <span class="font-bold">${formData.nationalId}</span>
                </div>
                <div class="flex">
                    <span class="font-medium text-gray-600 w-1/3">เบอร์โทรศัพท์:</span>
                    <span class="font-bold">${formData.phone || 'ไม่มีข้อมูล'}</span>
                </div>
            </div>
        </div>
        <div>
            <h2 class="text-lg font-semibold border-b pb-2 mb-4">รายการนัดหมาย</h2>
            <table class="w-full text-left border-collapse text-sm">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="py-2 px-3 font-semibold text-left">วันที่นัด</th>
                        <th class="py-2 px-3 font-semibold text-left">ชื่อยา</th>
                        <th class="py-2 px-3 font-semibold text-left">ขนาดยา</th>
                        <th class="py-2 px-3 font-semibold text-left">ตำแหน่งฉีด</th>
                        <th class="py-2 px-3 font-semibold text-left">วันที่ฉีด</th>
                        <th class="py-2 px-3 font-semibold text-left">ลายมือชื่อ</th>
                    </tr>
                </thead>
                <tbody>
                    ${appointmentRows}
                </tbody>
            </table>
        </div>

        <div class="mt-auto pt-16 flex justify-end text-sm">
            <div class="text-center">
                <p class="mb-4">....................................................</p>
                <p>(....................................................)</p>
                <p>ผู้บันทึก/เจ้าหน้าที่</p>
            </div>
        </div>

        <div class="pt-4 text-center text-xs text-gray-500">
            <p>กรุณามาตามวันและเวลาที่นัดหมาย และนำใบนัดนี้พร้อมบัตรประชาชนมาด้วยทุกครั้ง</p>
            <p>หากมีข้อสงสัย สามารถโทรสอบถามได้ที่ 075-272396 หรือ 075-271049 ต่อ 102</p>
            <p>พิมพ์ ณ วันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
    </div>
`;

    printContainer.innerHTML = cardHTML;
    
    setTimeout(() => {
        window.print();
    }, 100);
}

function addVaccineDate() {
    const date = document.getElementById('vaccineDate').value;
    const vaccine = document.getElementById('vaccineName').value;
    const dosage = document.getElementById('vaccineDosage').value;
    const site = document.getElementById('injectionSite').value;
    const recorder = document.getElementById('vaccineRecorder').value;

    if (date && vaccine && dosage && site && recorder) {
        vaccineDatesArray.push({ date, vaccine, dosage, site, recorder });
        updateVaccineDatesDisplay();
        document.getElementById('vaccineDate').value = '';
        document.getElementById('vaccineName').value = '';
        document.getElementById('vaccineDosage').value = '';
        document.getElementById('injectionSite').value = '';
        document.getElementById('vaccineRecorder').value = '';
    } else {
        alert('กรุณากรอกข้อมูลการฉีดและชื่อผู้ฉีดยาให้ครบถ้วน');
    }
}

function updateVaccineDatesDisplay() {
    const container = document.getElementById('vaccineDates');
    container.innerHTML = '';
    vaccineDatesArray.forEach((data, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200';
        div.innerHTML = `
            <div class="flex-1">
                <p class="font-medium text-blue-800">วันที่ฉีด: ${formatThaiDate(data.date)}</p>
                <p class="text-sm text-blue-600">ยา: ${data.vaccine} (${data.dosage}, ${data.site}) | ผู้บันทึก: ${data.recorder}</p>
            </div>
            <button onclick="removeVaccineDate(${index})" class="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600">ลบ</button>`;
        container.appendChild(div);
    });
}

function removeVaccineDate(index) {
    vaccineDatesArray.splice(index, 1);
    updateVaccineDatesDisplay();
}

function addSelectedDates() {
    const vaccine = document.getElementById('appointmentVaccine').value;
    const dosage = document.getElementById('appointmentDosage').value;
    const injectionSite = document.getElementById('appointmentInjectionSite').value;

    if (selectedDates.length === 0) return alert('กรุณาเลือกวันที่นัดหมาย');
    if (!vaccine || !dosage || !injectionSite) return alert('กรุณาเลือกข้อมูลการฉีดให้ครบถ้วน (ยา, ขนาดยา, ตำแหน่ง)');
    
    selectedDates.forEach(date => appointmentDatesArray.push({ date, vaccine, dosage, injectionSite }));
    updateAppointmentDatesDisplay();
    selectedDates = [];
    document.getElementById('appointmentVaccine').value = '';
    document.getElementById('appointmentDosage').value = '';
    document.getElementById('appointmentInjectionSite').value = '';
    generateCalendar();
}

function updateAppointmentDatesDisplay() {
    const container = document.getElementById('appointmentDates');
    const deleteAllBtnContainer = document.getElementById('deleteAllBtnContainer');
    container.innerHTML = '';
    
    // 🟢 ตรวจสอบว่ามีนัดหมายหรือไม่
    if (appointmentDatesArray.length > 0) {
        deleteAllBtnContainer.classList.remove('hidden'); // แสดงปุ่ม
    } else {
        deleteAllBtnContainer.classList.add('hidden'); // ซ่อนปุ่ม
    }

    appointmentDatesArray.forEach((data, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200';
        div.innerHTML = `
            <div class="flex-1">
                <p class="font-medium text-green-800">วันที่นัด: ${formatThaiDate(data.date)}</p>
                <p class="text-sm text-green-600">ยา: ${data.vaccine} (${data.dosage}, ${data.injectionSite})</p>
            </div>
            <button onclick="deleteAppointmentFromSheet(${index})" class="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600">ลบ</button>`;
        container.appendChild(div);
    });
}

async function deleteAppointmentFromSheet(index) {
    const appointmentToDelete = appointmentDatesArray[index];
    const nationalId = document.getElementById('appointmentNationalId').value;

    if (!confirm(`คุณต้องการลบนัดหมายวันที่ ${formatThaiDate(appointmentToDelete.date)} ใช่หรือไม่?`)) {
        return;
    }

    const deleteButton = event.target;
    deleteButton.textContent = '...';
    deleteButton.disabled = true;

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'deleteAppointment',
                nationalId: nationalId,
                appointmentDate: appointmentToDelete.date 
            })
        });
        const result = await response.json();
        if (result.success) {
            alert('ลบนัดหมายเรียบร้อยแล้ว');
            appointmentDatesArray.splice(index, 1);
            updateAppointmentDatesDisplay();
        } else {
            throw new Error(result.error || 'ไม่สามารถลบข้อมูลได้');
        }
    } catch (error) {
        console.error('Delete Error:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message);
        deleteButton.textContent = 'ลบ';
        deleteButton.disabled = false;
    }
}

function generateCalendar() {
    const calendar = document.getElementById('multiDateCalendar');
    if (!calendar) return;
    const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    let calendarHTML = `
        <div class="p-4">
            <div class="flex justify-between items-center mb-4">
                <button type="button" onclick="previousMonth()" class="p-2 hover:bg-gray-100 rounded-lg">&lt;</button>
                <h3 class="text-lg font-semibold">${monthNames[currentMonth]} ${currentYear + 543}</h3>
                <button type="button" onclick="nextMonth()" class="p-2 hover:bg-gray-100 rounded-lg">&gt;</button>
            </div>
            <div class="grid grid-cols-7 gap-1 mb-2">
                ${dayNames.map(day => `<div class="text-center text-sm font-medium text-gray-600 p-2">${day}</div>`).join('')}
            </div>
            <div class="grid grid-cols-7 gap-1">`;
    for (let i = 0; i < firstDay.getDay(); i++) { calendarHTML += `<div class="p-2"></div>`; }
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
        const isSelected = selectedDates.includes(dateStr);
        const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        let classes = 'p-2 text-center cursor-pointer rounded-lg transition-colors duration-200 ';
        if (isPast) classes += 'text-gray-400 cursor-not-allowed ';
        else if (isSelected) classes += 'bg-blue-600 text-white hover:bg-blue-700 ';
        else if (isToday) classes += 'bg-blue-100 text-blue-600 hover:bg-blue-200 ';
        else classes += 'hover:bg-gray-100 ';
        const onclick = isPast ? '' : `onclick="toggleDate('${dateStr}')"`;
        calendarHTML += `<div class="${classes}" ${onclick}>${day}</div>`;
    }
    calendarHTML += `</div></div>`;
    calendar.innerHTML = calendarHTML;
    updateSelectedDatesCount();
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    generateCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    generateCalendar();
}

function toggleDate(dateStr) {
    const index = selectedDates.indexOf(dateStr);
    if (index > -1) selectedDates.splice(index, 1);
    else selectedDates.push(dateStr);
    generateCalendar();
}

function updateSelectedDatesCount() {
    const countEl = document.getElementById('selectedDatesCount');
    if (countEl) {
        countEl.textContent = selectedDates.length;
    }
}

function formatThaiDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
        
['appointmentPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.substring(0, 10);
            if (value.length >= 3 && value.length <= 6) value = value.replace(/(\d{3})(\d+)/, '$1-$2');
            else if (value.length > 6) value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
            e.target.value = value;
        });
    }
});
['nationalId', 'appointmentNationalId', 'searchId'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
});




