/* ============================================================
   DASHBOARD HIDUPKU — script.js
   Satu file JS (sesuai Aturan Folder)

   Fitur:
   MVP  : Sapaan (jam/tanggal/waktu), Timer Fokus, Daftar Tugas, Tautan Cepat
   +CH1 : Mode Gelap / Terang
   +CH2 : Nama kustom di sapaan
   +CH3 : Cegah tugas duplikat
   +CH4 : Ubah durasi Pomodoro
   +CH5 : Urutkan tugas
   ============================================================ */

/* ========== UTILITAS ========== */
const $ = (id) => document.getElementById(id);

/* ========== 1. JAM & SAPAAN ========== */
function updateClock() {
  const now = new Date();

  // Jam
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  $('clock').textContent = `${hh}:${mm}:${ss}`;

  // Tanggal (Bahasa Indonesia)
  const hariArr  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const bulanArr = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];
  const namaHari  = hariArr[now.getDay()];
  const namaBulan = bulanArr[now.getMonth()];
  $('date').textContent = `${namaHari}, ${now.getDate()} ${namaBulan} ${now.getFullYear()}`;

  // Sapaan berdasarkan waktu
  const jam = now.getHours();
  let sapaan = 'Halo';
  if (jam >= 5  && jam < 12) sapaan = 'Selamat Pagi';
  else if (jam >= 12 && jam < 15) sapaan = 'Selamat Siang';
  else if (jam >= 15 && jam < 18) sapaan = 'Selamat Sore';
  else if (jam >= 18 && jam < 21) sapaan = 'Selamat Malam';
  else sapaan = 'Selamat Istirahat';

  $('greeting').textContent = sapaan;
}

setInterval(updateClock, 1000);
updateClock();


/* ========== 2. NAMA KUSTOM (Challenge) ========== */
let namaUser = localStorage.getItem('userName') || '';

function tampilkanNama() {
  const nameSpan = $('greetingName');
  if (namaUser) {
    nameSpan.textContent = `, ${namaUser}!`;
  } else {
    nameSpan.textContent = '';
  }
}

$('editNameBtn').addEventListener('click', () => {
  $('nameInputArea').classList.remove('hidden');
  $('nameInput').value = namaUser;
  $('nameInput').focus();
});

$('saveNameBtn').addEventListener('click', simpanNama);
$('nameInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') simpanNama();
  if (e.key === 'Escape') $('nameInputArea').classList.add('hidden');
});

function simpanNama() {
  const val = $('nameInput').value.trim();
  namaUser = val;
  localStorage.setItem('userName', namaUser);
  tampilkanNama();
  $('nameInputArea').classList.add('hidden');
}

tampilkanNama();


/* ========== 3. TIMER FOKUS ========== */
let durasiTimer = parseInt(localStorage.getItem('timerDuration') || '25', 10); // menit
let detikTimer  = durasiTimer * 60;
let intervalTimer = null;
let timerBerjalan = false;

$('timerMinutes').value = durasiTimer;

function formatWaktu(totalDetik) {
  const m = String(Math.floor(totalDetik / 60)).padStart(2, '0');
  const s = String(totalDetik % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateTampilTimer() {
  $('timerDisplay').textContent = formatWaktu(detikTimer);
}

updateTampilTimer();

$('startBtn').addEventListener('click', () => {
  if (timerBerjalan) return;
  timerBerjalan = true;
  intervalTimer = setInterval(() => {
    if (detikTimer <= 0) {
      clearInterval(intervalTimer);
      timerBerjalan = false;
      $('timerDisplay').textContent = '00:00';
      // Notifikasi selesai
      if (Notification.permission === 'granted') {
        new Notification('Sesi fokus selesai! 🎉 Kerja bagus!');
      } else {
        alert('Sesi fokus selesai! 🎉 Kerja bagus!');
      }
      return;
    }
    detikTimer--;
    updateTampilTimer();
  }, 1000);
});

$('stopBtn').addEventListener('click', () => {
  clearInterval(intervalTimer);
  timerBerjalan = false;
});

$('resetBtn').addEventListener('click', () => {
  clearInterval(intervalTimer);
  timerBerjalan = false;
  detikTimer = durasiTimer * 60;
  updateTampilTimer();
});

// Challenge: Ubah durasi Pomodoro
$('applyTimerBtn').addEventListener('click', () => {
  const val = parseInt($('timerMinutes').value, 10);
  if (isNaN(val) || val < 1 || val > 120) {
    alert('Masukkan durasi yang valid antara 1 sampai 120 menit.');
    return;
  }
  clearInterval(intervalTimer);
  timerBerjalan = false;
  durasiTimer = val;
  detikTimer  = durasiTimer * 60;
  localStorage.setItem('timerDuration', durasiTimer);
  updateTampilTimer();
});

// Minta izin notifikasi saat halaman dibuka (opsional)
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}


/* ========== 4. DAFTAR TUGAS ========== */
let tugas = JSON.parse(localStorage.getItem('tasks') || '[]');
// tugas = [ { id, text, done } ]

function simpanTugas() {
  localStorage.setItem('tasks', JSON.stringify(tugas));
}

function getTugasTerurut() {
  const mode = $('sortSelect').value;
  const salinan = [...tugas];
  if (mode === 'az') {
    salinan.sort((a, b) => a.text.localeCompare(b.text, 'id'));
  } else if (mode === 'za') {
    salinan.sort((a, b) => b.text.localeCompare(a.text, 'id'));
  } else if (mode === 'done') {
    salinan.sort((a, b) => Number(a.done) - Number(b.done));
  }
  // 'default' = urutan masuk
  return salinan;
}

function renderTugas() {
  const list = $('taskList');
  list.innerHTML = '';

  const terurut = getTugasTerurut();

  if (terurut.length === 0) {
    list.innerHTML = '<li class="empty-state">Belum ada tugas. Tambahkan di atas!</li>';
    return;
  }

  terurut.forEach((t) => {
    const li = document.createElement('li');
    li.classList.add('task-item');
    if (t.done) li.classList.add('done');
    li.dataset.id = t.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = t.done;
    cb.setAttribute('aria-label', `Tandai "${t.text}" sebagai selesai`);
    cb.addEventListener('change', () => toggleTugas(t.id));

    // Teks tugas
    const span = document.createElement('span');
    span.classList.add('task-text');
    span.textContent = t.text;

    // Tombol aksi
    const aksi = document.createElement('div');
    aksi.classList.add('task-actions');

    const tombolEdit = document.createElement('button');
    tombolEdit.textContent = '✏️';
    tombolEdit.classList.add('btn-icon');
    tombolEdit.setAttribute('aria-label', `Edit tugas "${t.text}"`);
    tombolEdit.title = 'Edit';
    tombolEdit.addEventListener('click', () => mulaiEditTugas(t.id, li, span, tombolEdit));

    const tombolHapus = document.createElement('button');
    tombolHapus.textContent = 'Hapus';
    tombolHapus.classList.add('btn', 'btn-danger', 'btn-sm');
    tombolHapus.setAttribute('aria-label', `Hapus tugas "${t.text}"`);
    tombolHapus.addEventListener('click', () => hapusTugas(t.id));

    aksi.appendChild(tombolEdit);
    aksi.appendChild(tombolHapus);

    li.appendChild(cb);
    li.appendChild(span);
    li.appendChild(aksi);
    list.appendChild(li);
  });
}

function tambahTugas() {
  const input = $('taskInput');
  const teks  = input.value.trim();
  if (!teks) {
    input.focus();
    return;
  }

  // Challenge: Cegah tugas duplikat (tidak peka huruf besar/kecil)
  const duplikat = tugas.some(
    (t) => t.text.toLowerCase() === teks.toLowerCase()
  );
  if (duplikat) {
    alert(`Tugas "${teks}" sudah ada!`);
    input.select();
    return;
  }

  tugas.push({ id: Date.now(), text: teks, done: false });
  simpanTugas();
  renderTugas();
  input.value = '';
  input.focus();
}

function toggleTugas(id) {
  tugas = tugas.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  simpanTugas();
  renderTugas();
}

function hapusTugas(id) {
  tugas = tugas.filter((t) => t.id !== id);
  simpanTugas();
  renderTugas();
}

function mulaiEditTugas(id, li, span, tombolEdit) {
  const t = tugas.find((x) => x.id === id);
  if (!t) return;

  // Ganti span dengan input
  const input = document.createElement('input');
  input.type  = 'text';
  input.value = t.text;
  input.classList.add('task-edit-input');
  input.maxLength = 100;
  input.setAttribute('aria-label', 'Edit teks tugas');

  li.replaceChild(input, span);
  input.focus();
  input.select();

  // Ganti ikon edit jadi simpan
  tombolEdit.textContent = '💾';
  tombolEdit.title = 'Simpan';

  const simpanEdit = () => {
    const teksBaru = input.value.trim();
    if (!teksBaru) {
      input.focus();
      return;
    }
    // Cek duplikat (kecuali tugas saat ini)
    const dup = tugas.some(
      (x) => x.id !== id && x.text.toLowerCase() === teksBaru.toLowerCase()
    );
    if (dup) {
      alert(`Tugas "${teksBaru}" sudah ada!`);
      input.select();
      return;
    }
    tugas = tugas.map((x) =>
      x.id === id ? { ...x, text: teksBaru } : x
    );
    simpanTugas();
    renderTugas();
  };

  tombolEdit.onclick = simpanEdit;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') simpanEdit();
    if (e.key === 'Escape') renderTugas(); // batal
  });
}

// Event listener tugas
$('addTaskBtn').addEventListener('click', tambahTugas);
$('taskInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tambahTugas();
});
$('sortSelect').addEventListener('change', renderTugas);

renderTugas();


/* ========== 5. TAUTAN CEPAT ========== */
let tautan = JSON.parse(localStorage.getItem('quickLinks') || '[]');
// tautan = [ { id, name, url } ]

function simpanTautan() {
  localStorage.setItem('quickLinks', JSON.stringify(tautan));
}

function renderTautan() {
  const container = $('linksList');
  container.innerHTML = '';

  if (tautan.length === 0) {
    container.innerHTML = '<span class="empty-state">Belum ada tautan. Tambahkan favoritmu!</span>';
    return;
  }

  tautan.forEach((link) => {
    const div = document.createElement('div');
    div.classList.add('link-item');

    const a = document.createElement('a');
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.textContent = link.name;

    const tombolHapus = document.createElement('button');
    tombolHapus.textContent = '✕';
    tombolHapus.classList.add('btn-icon');
    tombolHapus.setAttribute('aria-label', `Hapus tautan "${link.name}"`);
    tombolHapus.title = 'Hapus';
    tombolHapus.addEventListener('click', () => hapusTautan(link.id));

    div.appendChild(a);
    div.appendChild(tombolHapus);
    container.appendChild(div);
  });
}

function tambahTautan() {
  const namaVal = $('linkName').value.trim();
  const urlVal  = $('linkUrl').value.trim();

  if (!namaVal || !urlVal) {
    alert('Mohon isi nama tautan dan URL terlebih dahulu.');
    return;
  }

  // Validasi URL dasar
  let urlFinal = urlVal;
  if (!urlFinal.startsWith('http://') && !urlFinal.startsWith('https://')) {
    urlFinal = 'https://' + urlFinal;
  }

  tautan.push({ id: Date.now(), name: namaVal, url: urlFinal });
  simpanTautan();
  renderTautan();
  $('linkName').value = '';
  $('linkUrl').value  = '';
  $('linkName').focus();
}

function hapusTautan(id) {
  tautan = tautan.filter((l) => l.id !== id);
  simpanTautan();
  renderTautan();
}

$('addLinkBtn').addEventListener('click', tambahTautan);
$('linkUrl').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tambahTautan();
});

renderTautan();


/* ========== 6. MODE GELAP / TERANG (Challenge) ========== */
const tombolTema = $('themeToggle');
let modeGelap = localStorage.getItem('theme') === 'dark';

function terapkanTema() {
  if (modeGelap) {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
    tombolTema.textContent = '☀️';
    tombolTema.setAttribute('aria-label', 'Ganti ke mode terang');
  } else {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
    tombolTema.textContent = '🌙';
    tombolTema.setAttribute('aria-label', 'Ganti ke mode gelap');
  }
}

tombolTema.addEventListener('click', () => {
  modeGelap = !modeGelap;
  localStorage.setItem('theme', modeGelap ? 'dark' : 'light');
  terapkanTema();
});

terapkanTema();
