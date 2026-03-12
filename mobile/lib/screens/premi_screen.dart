import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';

class PremiScreen extends StatefulWidget {
  const PremiScreen({super.key});

  @override
  State<PremiScreen> createState() => _PremiScreenState();
}

class _PremiScreenState extends State<PremiScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  // Dummy data — akan diganti dengan API call setelah flowchart difinalisasi
  final List<Map<String, dynamic>> _premiHistory = [
    {'bulan': 'Maret 2026', 'nominal': 1500000, 'status': 'Lunas', 'tgl_bayar': '2026-03-05'},
    {'bulan': 'Februari 2026', 'nominal': 1500000, 'status': 'Lunas', 'tgl_bayar': '2026-02-04'},
    {'bulan': 'Januari 2026', 'nominal': 1500000, 'status': 'Lunas', 'tgl_bayar': '2026-01-06'},
    {'bulan': 'Desember 2025', 'nominal': 1500000, 'status': 'Lunas', 'tgl_bayar': '2025-12-05'},
    {'bulan': 'November 2025', 'nominal': 1500000, 'status': 'Lunas', 'tgl_bayar': '2025-11-05'},
    {'bulan': 'Oktober 2025', 'nominal': 1350000, 'status': 'Lunas', 'tgl_bayar': '2025-10-06'},
  ];

  @override
  Widget build(BuildContext context) {
    final totalPremi = _premiHistory.fold<int>(0, (sum, item) => sum + (item['nominal'] as int));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cek Premi', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: AppTheme.briDark,
      ),
      body: CustomScrollView(
        slivers: [
          // Summary Card
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppTheme.briBlue, Color(0xFF0A4D82)],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.briBlue.withOpacity(0.3),
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
                        'Total Iuran Premi',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.white.withOpacity(0.8),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.check_circle, color: Colors.greenAccent, size: 14),
                            SizedBox(width: 4),
                            Text('Aktif', style: TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    currencyFormat.format(totalPremi),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Dari ${_premiHistory.length} bulan terakhir',
                    style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.6)),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      _buildMiniStat('Iuran/Bulan', currencyFormat.format(1500000)),
                      const SizedBox(width: 20),
                      _buildMiniStat('Kelas', 'A'),
                      const SizedBox(width: 20),
                      _buildMiniStat('Kelompok', 'Normal'),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // History Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Text(
                'RIWAYAT PEMBAYARAN',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Colors.grey.shade500,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ),

          // History List
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final item = _premiHistory[index];
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade100),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.check_circle_outline, color: Colors.green, size: 22),
                    ),
                    title: Text(
                      item['bulan'],
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    subtitle: Text(
                      'Bayar: ${item['tgl_bayar']}',
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                    ),
                    trailing: Text(
                      currencyFormat.format(item['nominal']),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: AppTheme.briDark,
                      ),
                    ),
                  ),
                );
              },
              childCount: _premiHistory.length,
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.6))),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
      ],
    );
  }
}
