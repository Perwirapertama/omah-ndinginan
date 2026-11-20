/* Omah N'dinginan — animasi dan interaksi website (di atas template Hotelier, HTML Codex) */
(function () {
    "use strict";

    var gerakDikurangi = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var K = window.KONTAK || {};
    var nomorWa = String(K.whatsapp || "").replace(/[^0-9]/g, "");

    /* ---------- pindah halaman bergeser seperti slide (tanpa layar loading) ---------- */
    // Urutan menu menentukan arah: menu di kanan -> isi bergeser ke kiri, dan sebaliknya.
    var urutan = ["index.html", "villa.html", "tentang.html", "galeri.html", "kontak.html"];
    function namaHalaman(u) {
        var n = (u.pathname || "").split("/").pop();
        return n === "" ? "index.html" : decodeURIComponent(n);
    }
    var sekarang = namaHalaman(window.location);
    document.addEventListener("click", function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
        var a = e.target.closest && e.target.closest("a[href]");
        if (!a || a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-lightbox")) { return; }
        var u;
        try { u = new URL(a.getAttribute("href"), window.location.href); } catch (err) { return; }
        var tujuan = namaHalaman(u);
        if (u.protocol !== window.location.protocol || urutan.indexOf(tujuan) < 0) { return; }
        if (tujuan === sekarang) { return; } // tautan di halaman yang sama: biarkan menggulir biasa
        e.preventDefault();
        var arah = urutan.indexOf(tujuan) >= urutan.indexOf(sekarang) ? "maju" : "mundur";
        try { sessionStorage.setItem("omah-arah", arah); } catch (err) { /* abaikan */ }
        if (gerakDikurangi) { window.location.href = u.href; return; }
        document.documentElement.classList.add("keluar-" + arah);
        setTimeout(function () { window.location.href = u.href; }, 230);
    });
    // Kembali lewat tombol Back: halaman dipulihkan dari cache, hapus status keluar.
    window.addEventListener("pageshow", function (e) {
        if (e.persisted) { document.documentElement.classList.remove("keluar-maju", "keluar-mundur"); }
    });

    /* ---------- animasi muncul saat digulir (WOW.js dari template) ---------- */
    if (!gerakDikurangi && typeof window.WOW === "function") {
        new window.WOW({ offset: 60, mobile: true }).init();
    }

    /* ---------- kepala ringkas saat digulir ---------- */
    var kepala = document.getElementById("kepala");
    function saatGulir() {
        var y = window.scrollY || window.pageYOffset;
        if (kepala) { kepala.classList.toggle("ringkas", y > 60); }
    }
    window.addEventListener("scroll", saatGulir, { passive: true });
    saatGulir();

    /* ---------- logo = kembali ke atas (pengganti tombol ke atas) ---------- */
    // Halaman sudah digulir: logo menggulir ke atas. Sudah di atas: logo membuka Beranda.
    var logo = document.getElementById("logo-atas");
    if (logo) {
        logo.addEventListener("click", function (e) {
            var y = window.scrollY || window.pageYOffset;
            if (y > 10 || sekarang === "index.html") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: gerakDikurangi ? "auto" : "smooth" });
            }
        });
    }

    /* ---------- tampil saat terlihat: linimasa & bagan ---------- */
    var amati = "IntersectionObserver" in window && !gerakDikurangi;
    document.querySelectorAll(".linimasa li, .bagan").forEach(function (el) {
        if (!amati) { el.classList.add("tampil"); return; }
        var io = new IntersectionObserver(function (isi) {
            isi.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("tampil"); io.unobserve(x.target); } });
        }, { threshold: 0.4 });
        io.observe(el);
    });
    var linimasa = document.querySelector(".linimasa");
    if (linimasa) {
        var isiGaris = function () {
            var r = linimasa.getBoundingClientRect();
            var p = (window.innerHeight * 0.6 - r.top) / r.height;
            linimasa.style.setProperty("--isi", Math.max(0, Math.min(1, p)) * 100 + "%");
        };
        if (gerakDikurangi) { linimasa.style.setProperty("--isi", "100%"); }
        else { window.addEventListener("scroll", isiGaris, { passive: true }); isiGaris(); }
    }

    /* ---------- penyaring (daftar unit & galeri) ---------- */
    document.querySelectorAll("[data-saring-untuk]").forEach(function (grup) {
        var wadah = document.getElementById(grup.getAttribute("data-saring-untuk"));
        if (!wadah) { return; }
        var tombol = grup.querySelectorAll("button[data-saring]");
        var status = document.querySelector("[data-status-untuk='" + wadah.id + "']");
        tombol.forEach(function (t) {
            t.addEventListener("click", function () {
                var pilih = t.getAttribute("data-saring");
                var jumlah = 0;
                wadah.querySelectorAll(".butir-saring").forEach(function (b) {
                    var cocok = pilih === "semua" || (" " + b.getAttribute("data-kategori") + " ").indexOf(" " + pilih + " ") >= 0;
                    if (cocok) {
                        jumlah++;
                        b.hidden = false;
                        if (gerakDikurangi) { b.classList.remove("keluar"); }
                        else { requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.remove("keluar"); }); }); }
                    } else if (!b.hidden) {
                        b.classList.add("keluar");
                        setTimeout(function () { if (b.classList.contains("keluar")) { b.hidden = true; } }, gerakDikurangi ? 0 : 340);
                    }
                });
                // WOW hanya memeriksa elemen saat halaman digulir; butir yang bergeser masuk layar
                // karena saringan langsung ditampilkan agar tidak tertinggal tersembunyi.
                wadah.querySelectorAll(".butir-saring.wow").forEach(function (b) {
                    if (!b.hidden && b.style.visibility !== "visible") {
                        b.style.visibility = "visible";
                        b.style.animationName = "none";
                    }
                });
                tombol.forEach(function (x) { x.setAttribute("aria-pressed", String(x === t)); });
                if (status) {
                    status.textContent = (status.getAttribute("data-format") || "Menampilkan {n}.")
                        .replace("{n}", jumlah).replace("{label}", t.getAttribute("data-label") || "");
                }
            });
        });
    });

    /* ---------- lightbox galeri ---------- */
    var butirGaleri = Array.prototype.slice.call(document.querySelectorAll("a[data-lightbox]"));
    if (butirGaleri.length) {
        var lb = document.createElement("div");
        lb.className = "lightbox";
        lb.hidden = true;
        lb.setAttribute("role", "dialog");
        lb.setAttribute("aria-modal", "true");
        lb.setAttribute("aria-label", "Galeri gambar");
        // markup tetap (tanpa masukan pengguna); judul gambar diisi lewat textContent di bawah
        lb.innerHTML = '<img alt=""><div class="teks"><span class="judul"></span><small class="urutan"></small></div>' +
            '<button type="button" class="tutup" aria-label="Tutup galeri"><i class="bi bi-x-lg"></i></button>' +
            '<button type="button" class="sebelum" aria-label="Gambar sebelumnya"><i class="bi bi-chevron-left"></i></button>' +
            '<button type="button" class="sesudah" aria-label="Gambar berikutnya"><i class="bi bi-chevron-right"></i></button>';
        document.body.appendChild(lb);
        var lbImg = lb.querySelector("img"), lbJudul = lb.querySelector(".judul"), lbUrut = lb.querySelector(".urutan");
        var daftar = [], posisi = 0, pemicu = null;
        var tampilkan = function (i) {
            posisi = (i + daftar.length) % daftar.length;
            var a = daftar[posisi];
            lbImg.classList.add("ganti");
            setTimeout(function () {
                lbImg.src = a.getAttribute("href");
                lbImg.alt = a.getAttribute("data-judul") || "";
                lbJudul.textContent = a.getAttribute("data-judul") || "";
                lbUrut.textContent = (posisi + 1) + " dari " + daftar.length + (a.getAttribute("data-catatan") ? " · " + a.getAttribute("data-catatan") : "");
                lbImg.onload = function () { lbImg.classList.remove("ganti"); };
                if (lbImg.complete) { lbImg.classList.remove("ganti"); }
            }, gerakDikurangi ? 0 : 160);
        };
        var buka = function (a) {
            var grup = a.getAttribute("data-lightbox");
            daftar = butirGaleri.filter(function (x) {
                var b = x.closest(".butir-saring");
                return x.getAttribute("data-lightbox") === grup && !(b && b.hidden);
            });
            pemicu = a;
            lb.hidden = false;
            document.body.style.overflow = "hidden";
            requestAnimationFrame(function () { lb.classList.add("buka"); });
            tampilkan(daftar.indexOf(a));
            lb.querySelector(".tutup").focus();
        };
        var tutup = function () {
            lb.classList.remove("buka");
            document.body.style.overflow = "";
            setTimeout(function () { lb.hidden = true; }, gerakDikurangi ? 0 : 300);
            if (pemicu) { pemicu.focus(); }
        };
        butirGaleri.forEach(function (a) {
            a.addEventListener("click", function (e) { e.preventDefault(); buka(a); });
        });
        lb.querySelector(".tutup").addEventListener("click", tutup);
        lb.querySelector(".sebelum").addEventListener("click", function () { tampilkan(posisi - 1); });
        lb.querySelector(".sesudah").addEventListener("click", function () { tampilkan(posisi + 1); });
        lb.addEventListener("click", function (e) { if (e.target === lb) { tutup(); } });
        document.addEventListener("keydown", function (e) {
            if (lb.hidden) { return; }
            if (e.key === "Escape") { tutup(); }
            else if (e.key === "ArrowLeft") { tampilkan(posisi - 1); }
            else if (e.key === "ArrowRight") { tampilkan(posisi + 1); }
            else if (e.key === "Tab") { // jaga fokus tetap di dalam galeri
                var f = lb.querySelectorAll("button"), awal = f[0], akhir = f[f.length - 1];
                if (e.shiftKey && document.activeElement === awal) { e.preventDefault(); akhir.focus(); }
                else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); awal.focus(); }
            }
        });
    }

    /* ---------- salin alamat ---------- */
    function salinTeks(teks, berhasil, gagal) {
        function cadangan() {
            var t = document.createElement("textarea");
            t.value = teks; t.setAttribute("readonly", ""); t.style.position = "absolute"; t.style.left = "-9999px";
            document.body.appendChild(t); t.select();
            var ok = false;
            try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
            document.body.removeChild(t);
            if (ok) { berhasil(); } else { gagal(); }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(teks).then(berhasil, cadangan);
        } else { cadangan(); }
    }
    document.querySelectorAll("[data-salin]").forEach(function (b) {
        b.addEventListener("click", function () {
            var sumber = document.querySelector(b.getAttribute("data-salin"));
            var info = document.querySelector(b.getAttribute("data-info"));
            salinTeks(sumber.textContent.replace(/\s+/g, " ").trim(),
                function () { if (info) { info.textContent = b.getAttribute("data-berhasil") || "Teks disalin."; } },
                function () { if (info) { info.textContent = "Teks tidak dapat disalin. Pilih teksnya lalu salin secara manual."; } });
        });
    });

    /* ---------- cek ketersediaan: susun pesan lalu buka WhatsApp ---------- */
    function hariIni() {
        var d = new Date();
        return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    function keTanggal(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
    function tulisTanggal(d) { return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }

    document.querySelectorAll("form.form-cek").forEach(function (form) {
        var masuk = form.elements.checkin, keluar = form.elements.checkout, tamu = form.elements.tamu, jenis = form.elements.jenis;
        var salah = form.querySelector(".pesan-salah");
        masuk.min = hariIni(); keluar.min = hariIni();
        masuk.addEventListener("change", function () {
            if (masuk.value) {
                keluar.min = masuk.value;
                if (keluar.value && keluar.value <= masuk.value) { keluar.value = ""; }
            }
        });
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            salah.textContent = "";
            if (!masuk.value || !keluar.value) { salah.textContent = "Pilih tanggal check-in dan check-out."; return; }
            if (masuk.value < hariIni()) { salah.textContent = "Tanggal check-in tidak boleh sebelum hari ini."; return; }
            if (keluar.value <= masuk.value) { salah.textContent = "Tanggal check-out harus setelah check-in."; return; }
            var n = parseInt(tamu.value, 10);
            if (!(n >= 1)) { salah.textContent = "Jumlah tamu minimal 1 orang."; return; }
            var malam = Math.round((keTanggal(keluar.value) - keTanggal(masuk.value)) / 86400000);
            var unit = jenis ? jenis.value : "villa";
            var teks = "Halo Omah N'dinginan, saya ingin menanyakan ketersediaan " + unit + ".\n" +
                "Check-in: " + tulisTanggal(keTanggal(masuk.value)) + "\n" +
                "Check-out: " + tulisTanggal(keTanggal(keluar.value)) + " (" + malam + " malam)\n" +
                "Jumlah tamu: " + n + " orang\nTerima kasih.";
            var url = "https://wa.me/" + nomorWa + "?text=" + encodeURIComponent(teks);
            form.setAttribute("data-terakhir", url);
            window.open(url, "_blank", "noopener");
        });
    });
})();
