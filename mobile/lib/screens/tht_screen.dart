import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';

class ThtScreen extends StatefulWidget {
  const ThtScreen({super.key});

  @override
  State<ThtScreen> createState() => _ThtScreenState();
}

class _ThtScreenState extends State<ThtScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  // Dummy data — akan diganti dengan API call
  final Map<String, dynamic> _thtData = {
    'saldo_tht': 285000000,
    'iuran_pekerja': 120000000,
    'iuran_pemberi_kerja': 140000000,
    'pengembangan': 25000000,
    'status': 'Aktif',
    'tgl_phk': null,
    'kelompok': 'Normal',
    'masa_kerja': '18 Tahun 6 Bulan',
  };

  final List<Map<String, dynamic>> _rincian = [
    {'tahun': '2026', 'iuran_pekerja': 18000000, 'iuran_pk': 21000000, 'pengembangan': 4500000},
    {'tahun': '2025', 'iuran_pekerja': 18000000, 'iuran_pk': 21000000, 'pengembangan': 4200000},
    {'tahun': '2024', 'iuran_pekerja': 16000000, 'iuran_pk': 19000000, 'pengembangan': 3800000},
    {'tahun': '2023', 'iuran_pekerja': 16000000, 'iuran_pk': 19000000, 'pengembangan': 3500000},
    {'tahun': '2022', 'iuran_pekerja': 14000000, 'iuran_pk': 17000000, 'pengembangan': 3200000},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tunjangan Hari Tua', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: AppTheme.briDark,
      ),
      body: CustomScrollView(
        slivers: [
          // ─── Summary Card ──────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2E7D32).withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Saldo THT',
                        style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.8), fontWeight: FontWeight.w500),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _thtData['status'],
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    currencyFormat.format(_thtData['saldo_tht']),
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Colors.white24),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatColumn('Iuran Pekerja', currencyFormat.format(_thtData['iuran_pekerja'])),
                      ),
                      Container(width: 1, height: 36, color: Colors.white24),
                      Expanded(
                        child: _buildStatColumn('Iuran P. Kerja', currencyFormat.format(_thtData['iuran_pemberi_kerja'])),
                      ),
                      Container(width: 1, height: 36, color: Colors.white24),
                      Expanded(
                        child: _buildStatColumn('Pengembangan', currencyFormat.format(_thtData['pengembangan'])),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ─── Info Cards ────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: _buildInfoChip(Icons.people_outline, 'Kelompok', _thtData['kelompok']),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildInfoChip(Icons.work_history_outlined, 'Masa Kerja', _thtData['masa_kerja']),
                  ),
                ],
              ),
            ),
          ),

          // ─── Rincian Header ────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
              child: Text(
                'RINCIAN PER TAHUN',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Colors.grey.shade500,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ),

          // ─── Rincian List ──────────────────────────────────────
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final item = _rincian[index];
                final total = (item['iuran_pekerja'] as int) + (item['iuran_pk'] as int) + (item['pengembangan'] as int);
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade100),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Tahun ${item['tahun']}',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                          ),
                          Text(
                            currencyFormat.format(total),
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Color(0xFF2E7D32)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _buildRincianMini('Pekerja', currencyFormat.format(item['iuran_pekerja'])),
                          const SizedBox(width: 16),
                          _buildRincianMini('P. Kerja', currencyFormat.format(item['iuran_pk'])),
                          const SizedBox(width: 16),
                          _buildRincianMini('Pengemb.', currencyFormat.format(item['pengembangan'])),
                        ],
                      ),
                    ],
                  ),
                );
              },
              childCount: _rincian.length,
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }

  Widget _buildStatColumn(String label, String value) {
    return Column(
      children: [
        Text(label, style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.6))),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white), textAlign: TextAlign.center),
      ],
    );
  }

  Widget _buildInfoChip(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.briBlue, size: 20),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
              Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRincianMini(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
        Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
