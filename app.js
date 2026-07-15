// --- KONFIGURASI ---
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwo0dQ88zwPXDK0qe_cPmBDKdNvZ5eeqMNY8qS7Vy1-609qDDRF7oiemzO_Igwe-gEfdg/exec";

// --- STATE DATA ---
let dataMahasiswa = [], dataDosen = [], dataMatkul = [], dataNilai = [];

// --- FUNGSI NAVIGASI & MOBILE ---
window.toggleMobileSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('mobileBackdrop');
    sidebar.classList.toggle('hidden');
    backdrop.classList.toggle('hidden');
};

// --- FUNGSI MODAL ---
window.bukaModalFormMhs = () => { document.getElementById('formTitleMhs').innerText = 'Tambah Mahasiswa'; document.getElementById('btnSubmitMhs').innerText = 'Simpan'; document.getElementById('modalFormMhs').classList.remove('hidden'); };
window.tutupModalFormMhs = () => { document.getElementById('modalFormMhs').classList.add('hidden'); document.getElementById('formMahasiswa').reset(); };

window.bukaModalFormDosen = () => { document.getElementById('formTitleDosen').innerText = 'Tambah Dosen'; document.getElementById('btnSubmitDosen').innerText = 'Simpan'; document.getElementById('modalFormDosen').classList.remove('hidden'); };
window.tutupModalFormDosen = () => { document.getElementById('modalFormDosen').classList.add('hidden'); document.getElementById('formDosen').reset(); };

window.bukaModalFormMatkul = () => { document.getElementById('formTitleMatkul').innerText = 'Tambah Matkul'; document.getElementById('btnSubmitMatkul').innerText = 'Simpan'; document.getElementById('modalFormMatkul').classList.remove('hidden'); };
window.tutupModalFormMatkul = () => { document.getElementById('modalFormMatkul').classList.add('hidden'); document.getElementById('formMatkul').reset(); };
window.closeModalTranskrip = () => document.getElementById('modalTranskrip').classList.add('hidden');

// --- DATABASE FETCH (CRUD) ---
async function sendToGoogleSheets(action, payload) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: action, ...payload })
        });
        const result = await response.json();
        showToast(result.status === "success" ? 'Operasi berhasil!' : 'Gagal: ' + result.message, result.status === "success" ? 'success' : 'error');
    } catch (e) { showToast('Gagal terhubung ke database', 'error'); }
}

async function hapusData(id, sheetName) {
    if (!confirm('Hapus data ini?')) return;
    await sendToGoogleSheets('hapus', { id: id, sheet: sheetName });
    await ambilData();
}

// --- FUNGSI UI & KALKULASI ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-opacity duration-300`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function hitungRataRataIPK() {
    if (dataMahasiswa.length === 0 || dataNilai.length === 0) return "0.00";
    let totalSeluruhIPK = 0, mhsDenganNilai = 0;
    dataMahasiswa.forEach(mhs => {
        const nilaiMhs = dataNilai.filter(i => i.nim == mhs.nim);
        if (nilaiMhs.length > 0) {
            const rataNilai = nilaiMhs.reduce((s, i) => s + parseFloat(i.nilaiAngka), 0) / nilaiMhs.length;
            totalSeluruhIPK += (rataNilai / 100) * 4;
            mhsDenganNilai++;
        }
    });
    return mhsDenganNilai > 0 ? (totalSeluruhIPK / mhsDenganNilai).toFixed(2) : "0.00";
}

// --- TRANSKRIP ---
window.bukaModalTranskrip = function(nim) {
    const mhs = dataMahasiswa.find(m => m.nim == nim);
    const nilai = dataNilai.filter(n => n.nim == nim);
    document.getElementById('modalNamaMhs').innerText = mhs ? mhs.nama : '-';
    document.getElementById('modalNimMhs').innerText = nim;
    
    const total = nilai.reduce((s, n) => s + parseFloat(n.nilaiAngka || 0), 0);
    document.getElementById('modalIpkMhs').innerText = nilai.length > 0 ? ((total / nilai.length) / 100 * 4).toFixed(2) : "0.00";
    
    const tbody = document.getElementById('modalTabelNilaiBody');
    tbody.innerHTML = '';
    nilai.forEach(n => {
        // PERBAIKAN: Tarik kode dan sks dari Master Data Matkul berdasarkan nama matakuliah
        const infoMatkul = dataMatkul.find(m => m.nama === n.matakuliah) || {};
        const kode = infoMatkul.kode || '-';
        const sks = infoMatkul.sks || '-';

        tbody.innerHTML += `
            <tr class="text-slate-600 hover:bg-slate-50 transition-colors">
                <td class="py-2 px-2 border-b pl-3 text-[10px]">${kode}</td>
                <td class="py-2 px-2 border-b text-[10px] truncate max-w-[120px]" title="${n.matakuliah}">${n.matakuliah}</td>
                <td class="py-2 px-2 border-b text-center text-[10px]">${sks}</td>
                <td class="py-2 px-2 border-b text-center text-[10px]">${n.t1 !== undefined && n.t1 !== "" ? n.t1 : '-'}</td>
                <td class="py-2 px-2 border-b text-center text-[10px]">${n.t2 !== undefined && n.t2 !== "" ? n.t2 : '-'}</td>
                <td class="py-2 px-2 border-b text-center text-[10px]">${n.k1 !== undefined && n.k1 !== "" ? n.k1 : '-'}</td>
                <td class="py-2 px-2 border-b text-center text-[10px]">${n.k2 !== undefined && n.k2 !== "" ? n.k2 : '-'}</td>
                <td class="py-2 px-2 border-b text-center text-[10px]">${n.uts !== undefined && n.uts !== "" ? n.uts : '-'}</td>
                <td class="py-2 px-2 border-b text-center text-[10px]">${n.uas !== undefined && n.uas !== "" ? n.uas : '-'}</td>
                <td class="py-2 px-2 border-b text-center text-[10px] font-bold text-slate-800">${n.nilaiAngka !== undefined ? n.nilaiAngka : '-'}</td>
                <td class="py-2 px-2 border-b text-center font-bold text-xs text-blue-600">${n.nilaiHuruf !== undefined ? n.nilaiHuruf : '-'}</td>
                <td class="py-2 px-2 pr-3 border-b text-center">
                    <button onclick="hapusData('${n.id}', 'Input Nilai')" class="text-red-500 text-[10px] font-bold">Hapus</button>
                </td>
            </tr>`;
    });
    document.getElementById('modalTranskrip').classList.remove('hidden');
};

// Fungsi cetak yang diperbarui
window.cetakPDF = () => { 
    document.getElementById('printDate').innerText = new Date().toLocaleDateString(); 
    
    // Injeksi style khusus sementara agar print merender modal sebagai halaman penuh tanpa kolom aksi
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            body > *:not(main) { display: none !important; }
            main > div[id^="section"] { display: none !important; }
            #modalTranskrip { display: block !important; position: static !important; background: transparent !important; padding: 0 !important; }
            #modalTranskrip > div { box-shadow: none !important; max-width: 100% !important; max-height: none !important; border: none !important; }
            #modalTranskrip > div > div:first-child, #modalTranskrip > div > div:last-child { display: none !important; }
            #modalTranskrip .overflow-y-auto, #modalTranskrip .overflow-x-auto { overflow: visible !important; }
            /* Menyembunyikan kolom aksi (sekarang berada di kolom ke-12) */
            #modalTranskrip table th:nth-child(12), #modalTranskrip table td:nth-child(12) { display: none !important; }
        }
    `;
    document.head.appendChild(style);
    
    const modal = document.getElementById('modalTranskrip');
    modal.classList.remove('print:hidden');
    
    window.print();
    
    modal.classList.add('print:hidden');
    document.head.removeChild(style);
};

// --- DATA & DROPDOWN ---
function updateDropdowns() {
    const dsnSelect = document.getElementById('dosenPengampu');
    dsnSelect.innerHTML = '<option value="" disabled selected>-- Pilih Dosen --</option>';
    dataDosen.forEach(d => dsnSelect.innerHTML += `<option value="${d.nama}">${d.nama}</option>`);
    const mhsSelect = document.getElementById('selectMhs');
    mhsSelect.innerHTML = '<option value="" disabled selected>-- Pilih Mahasiswa --</option>';
    dataMahasiswa.forEach(m => mhsSelect.innerHTML += `<option value="${m.nim}">${m.nim} - ${m.nama}</option>`);
    const mkSelect = document.getElementById('selectMatkul');
    mkSelect.innerHTML = '<option value="" disabled selected>-- Pilih Matkul --</option>';
    dataMatkul.forEach(m => mkSelect.innerHTML += `<option value="${m.nama}">${m.nama} (${m.sks} SKS)</option>`);
}

async function ambilData() {
    const response = await fetch(GOOGLE_SHEETS_URL);
    const result = await response.json();
    dataMahasiswa = result.mahasiswa || []; dataDosen = result.dosen || []; dataMatkul = result.matkul || []; dataNilai = result.nilai || [];
    renderTabelMahasiswa(); renderTabelDosen(); renderTabelMatkul(); updateDropdowns();
    document.getElementById('dashTotalMhs').innerText = dataMahasiswa.length;
    document.getElementById('dashTotalDosen').innerText = dataDosen.length;
    document.getElementById('dashTotalMatkul').innerText = dataMatkul.length;
    document.getElementById('dashTotalNilai').innerText = dataNilai.length;
    const elRataIpk = document.getElementById('dashRataIPK');
    if (elRataIpk) elRataIpk.innerText = hitungRataRataIPK();
}

function renderTabelMahasiswa() {
    const tbody = document.getElementById('tabelMahasiswaBody'); tbody.innerHTML = '';
    dataMahasiswa.forEach(mhs => {
        const n = dataNilai.filter(i => i.nim == mhs.nim);
        const ipk = n.length > 0 ? ((n.reduce((s, i) => s + parseFloat(i.nilaiAngka), 0) / n.length) / 100 * 4).toFixed(2) : "0.00";
        tbody.innerHTML += `<tr><td class="py-4 px-6">${mhs.nim}</td><td class="py-4 px-6">${mhs.nama}</td><td class="py-4 px-6">${mhs.jurusan}</td><td class="py-4 px-6 text-center font-bold text-blue-600">${ipk}</td><td class="py-4 px-6 text-center"><button onclick="bukaModalTranskrip('${mhs.nim}')" class="text-blue-600 font-semibold mr-3">Detail</button><button onclick="hapusData('${mhs.id}', 'Data Mahasiswa')" class="text-red-500">Hapus</button></td></tr>`;
    });
}

function renderTabelDosen() {
    const tbody = document.getElementById('tabelDosenBody'); tbody.innerHTML = '';
    dataDosen.forEach(d => tbody.innerHTML += `<tr><td class="py-4 px-6">${d.nidn}</td><td class="py-4 px-6">${d.nama}</td><td class="py-4 px-6">${d.keahlian}</td><td class="py-4 px-6 text-center"><button onclick="hapusData('${d.id}', 'Data Dosen')" class="text-red-500">Hapus</button></td></tr>`);
}

function renderTabelMatkul() {
    const tbody = document.getElementById('tabelMatkulBody'); tbody.innerHTML = '';
    dataMatkul.forEach(m => tbody.innerHTML += `<tr><td class="py-4 px-6">${m.kode}</td><td class="py-4 px-6">${m.nama}</td><td class="py-4 px-6">${m.namaDosen}</td><td class="py-4 px-6 text-center">${m.sks} SKS</td><td class="py-4 px-6 text-center"><button onclick="hapusData('${m.id}', 'Master Matkul')" class="text-red-500">Hapus</button></td></tr>`);
}

// --- EVENT LISTENERS & SWITCH MENU ---
document.getElementById('formMahasiswa').addEventListener('submit', async(e) => { e.preventDefault(); await sendToGoogleSheets('data_mahasiswa', { id: Date.now(), nim: document.getElementById('nim').value, nama: document.getElementById('nama').value, jurusan: document.getElementById('jurusan').value, angkatan: document.getElementById('angkatan').value }); tutupModalFormMhs(); await ambilData(); });
document.getElementById('formDosen').addEventListener('submit', async(e) => { e.preventDefault(); await sendToGoogleSheets('data_dosen', { id: Date.now(), nidn: document.getElementById('nidn').value, nama: document.getElementById('namaDosen').value, keahlian: document.getElementById('keahlian').value }); tutupModalFormDosen(); await ambilData(); });
document.getElementById('formMatkul').addEventListener('submit', async(e) => { e.preventDefault(); await sendToGoogleSheets('master_matkul', { id: Date.now(), kode: document.getElementById('kodeMatkul').value, nama: document.getElementById('namaMatkul').value, sks: document.getElementById('bobotSks').value, namaDosen: document.getElementById('dosenPengampu').value }); tutupModalFormMatkul(); await ambilData(); });

// EVENT LISTENER UNTUK MENAMPILKAN NILAI SAAT INI (Jika sudah pernah diinput)
function cekNilaiSekarang() {
    const nim = document.getElementById('selectMhs').value;
    const matkul = document.getElementById('selectMatkul').value;
    const kategori = document.getElementById('kategoriNilai').value;
    const inputBox = document.getElementById('inputNilaiAngka');
    const infoBox = document.getElementById('infoStatusNilai');
    
    if (nim && matkul && kategori) {
        const existing = dataNilai.find(n => n.nim == nim && n.matakuliah == matkul);
        if (existing && existing[kategori] !== undefined && existing[kategori] !== "") {
            inputBox.value = existing[kategori];
            infoBox.innerHTML = `update nilai <b>${kategori.toUpperCase()}</b>. Nilai saat ini: <b>${existing[kategori]}</b>`;
            infoBox.classList.remove('hidden');
        } else {
            inputBox.value = "";
            infoBox.innerHTML = `Menginput nilai <b>${kategori.toUpperCase()}</b> baru.`;
            infoBox.classList.remove('hidden');
        }
    } else {
        infoBox.classList.add('hidden');
    }
}

// Pasang pendeteksi perubahan pada dropdown
document.getElementById('selectMhs').addEventListener('change', cekNilaiSekarang);
document.getElementById('selectMatkul').addEventListener('change', cekNilaiSekarang);
document.getElementById('kategoriNilai').addEventListener('change', cekNilaiSekarang);

// EVENT LISTENER SIMPAN NILAI BERTAHAP
document.getElementById('formAkademik').addEventListener('submit', async(e) => { 
    e.preventDefault(); 
    
    const nim = document.getElementById('selectMhs').value;
    const matkul = document.getElementById('selectMatkul').value;
    const kategori = document.getElementById('kategoriNilai').value;
    const inputVal = parseFloat(document.getElementById('inputNilaiAngka').value) || 0;
    
    // 1. Cari apakah baris nilai sudah ada sebelumnya
    let existingRecord = dataNilai.find(n => n.nim == nim && n.matakuliah == matkul);
    
    // 2. Ambil nilai lama (jika ada), jika tidak ada anggap 0
    let t1 = existingRecord && existingRecord.t1 ? parseFloat(existingRecord.t1) : 0;
    let t2 = existingRecord && existingRecord.t2 ? parseFloat(existingRecord.t2) : 0;
    let k1 = existingRecord && existingRecord.k1 ? parseFloat(existingRecord.k1) : 0;
    let k2 = existingRecord && existingRecord.k2 ? parseFloat(existingRecord.k2) : 0;
    let uts = existingRecord && existingRecord.uts ? parseFloat(existingRecord.uts) : 0;
    let uas = existingRecord && existingRecord.uas ? parseFloat(existingRecord.uas) : 0;
    
    // 3. Timpa hanya komponen yang dipilih di dropdown dengan nilai baru
    if (kategori === 't1') t1 = inputVal;
    else if (kategori === 't2') t2 = inputVal;
    else if (kategori === 'k1') k1 = inputVal;
    else if (kategori === 'k2') k2 = inputVal;
    else if (kategori === 'uts') uts = inputVal;
    else if (kategori === 'uas') uas = inputVal;
    
    // 4. Kalkulasi ulang nilai akhir (Tugas 20%, Kuis 10%, UTS 30%, UAS 40%)
    const rataTugas = (t1 + t2) / 2;
    const rataKuis = (k1 + k2) / 2;
    const nilaiAkhir = Math.round((rataTugas * 0.20) + (rataKuis * 0.10) + (uts * 0.30) + (uas * 0.40));
    
    let huruf = 'E';
    if(nilaiAkhir >= 85) huruf = 'A';
    else if(nilaiAkhir >= 75) huruf = 'B';
    else if(nilaiAkhir >= 60) huruf = 'C';
    else if(nilaiAkhir >= 50) huruf = 'D';

    // 5. Gunakan ID lama (jika update) atau ID baru (jika pertama kali input)
    const recordId = existingRecord ? existingRecord.id : Date.now();

    await sendToGoogleSheets('input_nilai', { 
        id: recordId, 
        nim: nim, 
        matakuliah: matkul, 
        t1: t1, t2: t2, k1: k1, k2: k2, uts: uts, uas: uas,
        nilaiAngka: nilaiAkhir, 
        nilaiHuruf: huruf,
        isUpdate: !!existingRecord // Penanda ke backend bahwa ini adalah proses UPDATE
    }); 
    
    document.getElementById('formAkademik').reset();
    document.getElementById('infoStatusNilai').classList.add('hidden');
    await ambilData(); 
});

window.onload = () => ambilData();

window.switchMenu = (menu) => {
    ['sectionDashboard', 'sectionMahasiswa', 'sectionDosen', 'sectionMatkul', 'sectionAkademik'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(`section${menu.charAt(0).toUpperCase() + menu.slice(1)}`).classList.remove('hidden');
    
    if (window.innerWidth < 768) toggleMobileSidebar();

    const menus = ['Dashboard', 'Mahasiswa', 'Dosen', 'Matkul', 'Akademik'];
    menus.forEach(m => {
        const btn = document.getElementById(`menu${m}Btn`);
        if (btn) {
            btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-500/20', 'border-blue-400');
            btn.classList.add('text-slate-400', 'border-transparent');
        }
    });
    const activeBtn = document.getElementById(`menu${menu.charAt(0).toUpperCase() + menu.slice(1)}Btn`);
    if (activeBtn) {
        activeBtn.classList.add('bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-500/20', 'border-blue-400');
        activeBtn.classList.remove('text-slate-400', 'border-transparent');
    }
};