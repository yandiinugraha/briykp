-- =========================================================================
-- SISTEM PENGELOLAAN KEPESERTAAN PROSPENS (YKP BRI)
-- DATABASE SCHEMA (MySQL/PostgreSQL Compatible)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABEL MASTER (Reference Data)
-- -------------------------------------------------------------------------

CREATE TABLE m_kelompok_prospens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode VARCHAR(10) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE m_status_bpjs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE m_status_brilife (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE m_alasan_nonaktif_bpjs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alasan VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE m_alasan_nonaktif_brilife (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alasan VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE m_kelas_prospens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode VARCHAR(10) UNIQUE NOT NULL,
    nama VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- -------------------------------------------------------------------------
-- 2. TABEL CORE KEPESERTAAN
-- -------------------------------------------------------------------------

CREATE TABLE t_peserta (
    id_peserta VARCHAR(50) PRIMARY KEY, -- Unique ID Peserta
    nama_peserta VARCHAR(150) NOT NULL,
    nik_bri VARCHAR(50) UNIQUE NOT NULL,
    tgl_phk DATE,
    jenis_mutasi VARCHAR(50), -- Normal, Alkes, MD
    id_kelompok INT,
    id_kelas INT,
    tmt_pertanggungan DATE,
    no_kartu_brilife VARCHAR(50),
    status_bpjs_id INT,
    status_brilife_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_kelompok) REFERENCES m_kelompok_prospens(id) ON DELETE SET NULL,
    FOREIGN KEY (id_kelas) REFERENCES m_kelas_prospens(id) ON DELETE SET NULL,
    FOREIGN KEY (status_bpjs_id) REFERENCES m_status_bpjs(id) ON DELETE SET NULL,
    FOREIGN KEY (status_brilife_id) REFERENCES m_status_brilife(id) ON DELETE SET NULL
);


-- -------------------------------------------------------------------------
-- 3. TABEL TRANSAKSI & WORKFLOW
-- -------------------------------------------------------------------------

CREATE TABLE t_pendaftaran_manfaat (
    id_pengajuan VARCHAR(50) PRIMARY KEY,
    id_peserta VARCHAR(50) NOT NULL,
    tgl_pengajuan DATE NOT NULL,
    jenis_manfaat VARCHAR(50) NOT NULL, -- BPJS / BRI Life
    file_sp VARCHAR(255), -- Path ke file Surat Persetujuan (SP)
    status_approval VARCHAR(30) DEFAULT 'DRAFT', -- DRAFT, PENDING_CHECKER, PENDING_SIGNER, APPROVE, REJECT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_peserta) REFERENCES t_peserta(id_peserta) ON DELETE CASCADE
);

CREATE TABLE t_approval_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_transaksi VARCHAR(50) NOT NULL, -- referensi ke id_pengajuan / nota dinas
    role VARCHAR(30) NOT NULL, -- Maker / Checker / Signer
    status VARCHAR(30) NOT NULL, -- Submit / Setuju / Tolak
    catatan TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE t_pembayaran_premi (
    no_nota_dinas VARCHAR(100) PRIMARY KEY,
    tanggal DATE NOT NULL,
    total_premi DECIMAL(15,2) NOT NULL,
    id_status_pembayaran VARCHAR(50), -- PENDING, PAID, FAILED
    file_bukti_bayar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE t_refund_premi (
    id_refund VARCHAR(50) PRIMARY KEY,
    tanggal DATE NOT NULL,
    nominal_refund DECIMAL(15,2) NOT NULL,
    file_invoice_refund VARCHAR(255),
    status_jurnal VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- -------------------------------------------------------------------------
-- 4. TABEL KEAMANAN (AUDIT TRAIL)
-- -------------------------------------------------------------------------
CREATE TABLE t_audit_trail (
    id_audit INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    modul VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- INITIAL DATA SEED (Data Master Awal)
-- =========================================================================

-- Insert Master Kelompok
INSERT INTO m_kelompok_prospens (kode, nama) VALUES 
('PNS', 'Pensiunan Normal'), 
('ALKES', 'Alasan Kesehatan'), 
('MD', 'Meninggal Dunia');

-- Insert Master Kelas
INSERT INTO m_kelas_prospens (kode, nama) VALUES 
('A', 'Kelas A'), 
('B', 'Kelas B'), 
('C', 'Kelas C');

-- Insert Status BPJS
INSERT INTO m_status_bpjs (kode, nama) VALUES 
('AKT', 'Aktif'), 
('NAKT', 'Non-Aktif'), 
('PND', 'Pending'), 
('NT', 'Tidak Terdaftar');

-- Insert Status BRI Life
INSERT INTO m_status_brilife (kode, nama) VALUES 
('BEZ', 'Berjalan'), 
('PK', 'Pindah Kelas'), 
('SPLE', 'Selesai Polis');
