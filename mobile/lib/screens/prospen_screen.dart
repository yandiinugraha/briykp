import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ProspenScreen extends StatefulWidget {
  const ProspenScreen({super.key});

  @override
  State<ProspenScreen> createState() => _ProspenScreenState();
}

class _ProspenScreenState extends State<ProspenScreen> {
  // Dummy data — akan diganti dengan API call  
  final Map<String, dynamic> _pesertaInfo = {
    'id_peserta': 'P-00042',
    'nama': 'Budi Santoso',
    'nik_bri': 'NIK000042',
    'kelompok': 'Normal',
    'kelas': 'Kelas A',
    'status_bpjs': 'Aktif',
    'status_brilife': 'Aktif',
    'no_kartu_brilife': 'BL00000042',
    'tmt_pertanggungan': '2026-01-01',
    'jenis_mutasi': 'PHK Normal',
    'tgl_phk': null,
  };

  final List<Map<String, dynamic>> _timeline = [
    {'tanggal': '2026-03-01', 'event': 'Iuran Maret dibayarkan', 'type': 'payment'},
    {'tanggal': '2026-02-15', 'event': 'Validasi data BPJS berhasil', 'type': 'validation'},
    {'tanggal': '2026-02-01', 'event': 'Iuran Februari dibayarkan', 'type': 'payment'},
    {'tanggal': '2026-01-20', 'event': 'Pendaftaran BRI Life disetujui', 'type': 'approval'},
    {'tanggal': '2026-01-01', 'event': 'TMT Pertanggungan dimulai', 'type': 'start'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Info Prospen', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: AppTheme.briDark,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Profile Header ──────────────────────────────────
            Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [AppTheme.briDark, AppTheme.briBlue],
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(28),
                  bottomRight: Radius.circular(28),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
                child: Column(
                  children: [
                    // Avatar
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppTheme.briOrange,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          _pesertaInfo['nama'].toString().substring(0, 1).toUpperCase(),
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      _pesertaInfo['nama'],
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'ID: ${_pesertaInfo['id_peserta']}  •  NIK: ${_pesertaInfo['nik_bri']}',
                      style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.7)),
                    ),
                    const SizedBox(height: 16),
                    // Status chips
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildStatusChip('BPJS', _pesertaInfo['status_bpjs']),
                        const SizedBox(width: 10),
                        _buildStatusChip('BRI Life', _pesertaInfo['status_brilife']),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ─── Detail Info ──────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
              child: Text(
                'INFORMASI KEPESERTAAN',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Colors.grey.shade500,
                  letterSpacing: 1.5,
                ),
              ),
            ),

            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Column(
                children: [
                  _buildInfoRow('Kelompok', _pesertaInfo['kelompok'], Icons.group_outlined),
                  _divider(),
                  _buildInfoRow('Kelas', _pesertaInfo['kelas'], Icons.card_membership),
                  _divider(),
                  _buildInfoRow('Jenis Mutasi', _pesertaInfo['jenis_mutasi'], Icons.swap_horiz),
                  _divider(),
                  _buildInfoRow('TMT Pertanggungan', _pesertaInfo['tmt_pertanggungan'], Icons.calendar_today_outlined),
                  _divider(),
                  _buildInfoRow('No. Kartu BRI Life', _pesertaInfo['no_kartu_brilife'], Icons.credit_card),
                  _divider(),
                  _buildInfoRow('Tgl PHK', _pesertaInfo['tgl_phk'] ?? 'Belum ada', Icons.event_busy_outlined),
                ],
              ),
            ),

            // ─── Timeline ────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
              child: Text(
                'RIWAYAT AKTIVITAS',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Colors.grey.shade500,
                  letterSpacing: 1.5,
                ),
              ),
            ),

            ...List.generate(_timeline.length, (index) {
              final item = _timeline[index];
              final isLast = index == _timeline.length - 1;
              return _buildTimelineItem(item, isLast);
            }),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String label, String status) {
    final isActive = status == 'Aktif';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: isActive ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isActive ? Colors.greenAccent.withOpacity(0.3) : Colors.redAccent.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isActive ? Icons.check_circle : Icons.cancel,
            size: 14,
            color: isActive ? Colors.greenAccent : Colors.redAccent,
          ),
          const SizedBox(width: 6),
          Text(
            '$label: $status',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isActive ? Colors.greenAccent : Colors.redAccent,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.briBlue),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          ),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _divider() => Divider(height: 1, indent: 50, endIndent: 18, color: Colors.grey.shade100);

  Widget _buildTimelineItem(Map<String, dynamic> item, bool isLast) {
    Color dotColor;
    IconData dotIcon;
    switch (item['type']) {
      case 'payment':
        dotColor = AppTheme.briBlue;
        dotIcon = Icons.payment;
        break;
      case 'validation':
        dotColor = Colors.teal;
        dotIcon = Icons.verified;
        break;
      case 'approval':
        dotColor = Colors.green;
        dotIcon = Icons.thumb_up_alt;
        break;
      case 'start':
        dotColor = AppTheme.briOrange;
        dotIcon = Icons.flag;
        break;
      default:
        dotColor = Colors.grey;
        dotIcon = Icons.circle;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 40,
              child: Column(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: dotColor.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(dotIcon, color: dotColor, size: 16),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        width: 2,
                        color: Colors.grey.shade200,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['event'],
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item['tanggal'],
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
