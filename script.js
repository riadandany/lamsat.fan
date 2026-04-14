const SUPABASE_URL = "https://pntqobqhaggvcjtyspvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudHFvYnFoYWdndmNqdHlzcHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjYwNjQsImV4cCI6MjA5MTUwMjA2NH0.fdl8d8I0UoDyWGDPK0VNUZBaEBQD4cz-ReowhbtxH0k"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentEditId = null;
let deleteType = ''; // 'work' أو 'msg'
let deleteId = null;

// --- نظام التنبيهات الفخم ---
function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle" style="color:var(--primary)"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- التنقل ---
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'gallery') loadPublicGallery();
}

// --- الخروج (تم التعديل للعودة للرئيسية) ---
function logout() {
    showToast("جاري تسجيل الخروج...");
    document.getElementById('admin-pass').value = ''; // تفريغ كلمة المرور
    setTimeout(() => {
        showPage('home'); // نقلك فوراً للرئيسية بدلاً من إعادة التحميل المزعجة
    }, 800);
}

// --- تسجيل الدخول ---
function openLogin() { document.getElementById('login-overlay').style.display = 'flex'; }
function closeLogin() { document.getElementById('login-overlay').style.display = 'none'; }
function loginVerify() {
    if (document.getElementById('admin-pass').value === "2011") {
        closeLogin();
        showPage('admin');
        switchAdminTab('manage-works');
        showToast("مرحباً أيها المطور");
    } else { showToast("كلمة المرور خاطئة!"); }
}

// --- إدارة الرسائل ---
async function submitMessage() {
    const name = document.getElementById('msg-name').value;
    const phone = document.getElementById('msg-phone').value;
    const msg = document.getElementById('msg-content').value;
    if(!name || !phone) return showToast("أكمل البيانات أولاً");
    
    const { error } = await _supabase.from('messages').insert([{ name, phone, message: msg }]);
    if(!error) {
        showToast("تم إرسال رسالتك بنجاح");
        document.querySelectorAll('#contact input, #contact textarea').forEach(i => i.value = "");
    }
}

// --- نافذة الحذف الموحدة (أعمال + رسائل) ---
function openDeleteModal(id, type) {
    deleteId = id;
    deleteType = type;
    document.getElementById('delete-overlay').style.display = 'flex';
}

function closeDelete() {
    document.getElementById('delete-overlay').style.display = 'none';
    deleteId = null;
}

async function confirmDelete() {
    if(!deleteId) return;
    showToast("جاري الحذف...");

    if(deleteType === 'work') {
        const { error } = await _supabase.from('images').delete().eq('id', deleteId);
        if(!error) { showToast("تم حذف العمل بنجاح"); loadAdminList(); }
        else { showToast("حدث خطأ أثناء الحذف"); }
    } else if(deleteType === 'msg') {
        const { error } = await _supabase.from('messages').delete().eq('id', deleteId);
        if(!error) { showToast("تم حذف الرسالة بنجاح"); switchAdminTab('view-msgs'); }
        else { showToast("حدث خطأ أثناء الحذف"); }
    }
    closeDelete();
}

// --- إدارة الأعمال ---
async function switchAdminTab(tab) {
    const area = document.getElementById('admin-content');
    area.innerHTML = "<p>جاري التحميل...</p>";

    if(tab === 'manage-works') {
        area.innerHTML = `
            <div class="glass-box" style="margin-bottom:20px">
                <h4>إضافة عمل جديد</h4>
                <input type="file" id="up-file">
                <input type="text" id="up-title" placeholder="العنوان">
                <textarea id="up-desc" placeholder="الوصف"></textarea>
                <select id="up-category" class="category-select">
    <option value="كرت فيزيت">كرت فيزيت</option>
    <option value="فلكسة">فلكسة</option>
    <option value="دفتر فواتير">دفتر فواتير</option>
    <option value="ختم">ختم</option>
    <option value="بروشور">بروشور</option>
    <option value="دعوة وتس">دعوة وتس</option>
    <option value="آيات قرآنية">آيات قرآنية</option>
    <option value="شهادة وفاة">شهادة وفاة</option>
    <option value="آخر">آخر</option>
</select>
                <button class="submit-btn" onclick="handleUpload()">نشر الآن</button>
            </div>
            <div id="admin-list" class="dynamic-grid"></div>
        `;
        loadAdminList();
    } else {
        const { data } = await _supabase.from('messages').select('*').order('created_at', {ascending: false});
        area.innerHTML = data.map(m => `
            <div class="glass-box" style="margin-bottom:10px">
                <p><b>${m.name}</b> (${m.phone})</p>
                <p>${m.message}</p>
                <button onclick="openDeleteModal(${m.id}, 'msg')" style="color:#ff3333; background:none; border:none; cursor:pointer; font-weight:bold;"><i class="fas fa-trash"></i> حذف الرسالة</button>
            </div>
        `).join('');
    }
}

// --- النشر (تم إصلاح المشكلة بالكامل) ---
async function handleUpload() {
    const fileInput = document.getElementById('up-file');
    const titleInput = document.getElementById('up-title');
    const descInput = document.getElementById('up-desc');
    
    const file = fileInput.files[0];
    const title = titleInput.value;
    const desc = descInput.value;
    
    if(!file || !title) return showToast("اختر صورة وعنواناً أولاً!");

    showToast("جاري الرفع... يرجى الانتظار");
    
    // تنظيف اسم الملف لتجنب أي أخطاء في الرفع
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const name = `${Date.now()}_${cleanFileName}`;
    
    const { data, error } = await _supabase.storage.from('portfolio-images').upload(name, file);

    if(error) {
        showToast("فشل رفع الصورة: " + error.message);
        return;
    }

    if(data) {
        const url = `${SUPABASE_URL}/storage/v1/object/public/portfolio-images/${name}`;
        const { error: dbError } = await _supabase.from('images').insert([{ title, description: desc, image_url: url }]);
        
        if (dbError) {
            showToast("حدث خطأ أثناء الحفظ");
        } else {
            showToast("تم النشر بنجاح!");
            // تفريغ الحقول بعد النشر
            fileInput.value = "";
            titleInput.value = "";
            descInput.value = "";
            switchAdminTab('manage-works');
        }
    }
}

async function loadAdminList() {
    const { data } = await _supabase.from('images').select('*').order('created_at', {ascending: false});
    document.getElementById('admin-list').innerHTML = data.map(i => `
        <div class="product-card">
            <img src="${i.image_url}">
            <div class="admin-card-actions">
                <button class="btn-edit" onclick="openEdit(${i.id},'${i.title}','${i.description||""}','${i.category||""}')">تعديل</button>
                <button class="btn-delete" onclick="openDeleteModal(${i.id}, 'work')">حذف</button>
            </div>
        </div>
    `).join('');
}

// --- التعديل ---
function openEdit(id, title, desc, category) {
    currentEditId = id;

    document.getElementById('edit-title').value = title || "";
    document.getElementById('edit-desc').value = desc || "";
    document.getElementById('edit-category').value = category || "آخر";

    document.getElementById('edit-overlay').style.display = 'flex';
}

function closeEdit() { document.getElementById('edit-overlay').style.display = 'none'; }

async function updateWork() {
    const t = document.getElementById('edit-title').value;
    const d = document.getElementById('edit-desc').value;
    const c = document.getElementById('edit-category').value;

    await _supabase.from('images').update({
        title: t,
        description: d,
        category: c
    }).eq('id', currentEditId);

    showToast("تم التحديث بنجاح");
    closeEdit();
    loadAdminList();
}

// --- العرض للجمهور ---
async function loadPublicGallery() {
    const grid = document.getElementById('gallery-grid');
    const selected = document.getElementById('filter-category')?.value || "الكل";

    grid.innerHTML = "جاري التحميل...";

    let query = _supabase.from('images').select('*').order('created_at', {ascending: false});

    if(selected !== "الكل") {
        query = query.eq('category', selected);
    }

    const { data } = await query;

   // ابحث عن هذا الجزء داخل loadPublicGallery وحدثه ليكون هكذا:
grid.innerHTML = data.map(i => `
    <div class="product-card">
        <div class="category-label">${i.category || "آخر"}</div>
        
        <img src="${i.image_url}" onclick="openLightbox('${i.image_url}')">

        <div style="padding:15px; text-align: right;">
            <h3 style="color:var(--primary); margin:0">${i.title}</h3>
            <p style="color:var(--text-muted); font-size:0.9rem; margin-top:5px;">
                ${i.description || ""}
            </p>
        </div>
    </div>
`).join('');
}

function openLightbox(src) { 
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox').style.display = 'flex';
}
function closeLightbox() { document.getElementById('lightbox').style.display = 'none'; }
// --- قائمة الهاتف ---
function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const icon = menuBtn.querySelector('i');

    navLinks.classList.toggle('active'); // فتح/إغلاق القائمة
    menuBtn.classList.toggle('menu-open'); // تفعيل حركة الدوران

    // تغيير الأيقونة من ثلاث شحطات إلى X
    if (navLinks.classList.contains('active')) {
        icon.classList.replace('fa-bars', 'fa-times');
    } else {
        icon.classList.replace('fa-times', 'fa-bars');
    }
}

// لإغلاق القائمة تلقائياً عند الضغط على أي زر فيها
function closeMenu() {
    if(window.innerWidth <= 768) {
        document.getElementById('nav-links').classList.remove('active');
    }
}
