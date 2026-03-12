import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Untuk iOS Simulator gunakan: http://localhost:3000
  // Untuk Android emulator gunakan: http://10.0.2.2:3000
  // Untuk device fisik gunakan: http://<IP_LOCAL_ANDA>:3000
  static const String baseUrl = 'http://localhost:3000/api';

  // ─── Storage Helpers ──────────────────────────────────────────
  static Future<void> _write(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }

  static Future<String?> _read(String key) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(key);
  }

  static Future<void> _delete(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
  }

  // ─── AUTH ──────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _write('token', data['token']);
      await _write('user', jsonEncode(data['user']));
      return data;
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Login gagal');
    }
  }

  static Future<void> logout() async {
    await _delete('token');
    await _delete('user');
  }

  static Future<String?> getToken() async {
    return await _read('token');
  }

  static Future<Map<String, dynamic>?> getStoredUser() async {
    final userStr = await _read('user');
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }

  static Future<Map<String, String>> _authHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ─── GET ME ────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getMe() async {
    final headers = await _authHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/me'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Gagal mengambil data pengguna');
    }
  }

  // ─── PESERTA ───────────────────────────────────────────────────
  static Future<List<dynamic>> getAllPeserta({int page = 1, int limit = 20}) async {
    final headers = await _authHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/peserta?page=$page&limit=$limit'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is List) return data;
      if (data is Map && data.containsKey('data')) return data['data'] ?? [];
      return [];
    } else {
      throw Exception('Gagal mengambil data peserta');
    }
  }

  static Future<Map<String, dynamic>> getPesertaById(String id) async {
    final headers = await _authHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/peserta/$id'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Gagal mengambil detail peserta');
    }
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────
  static Future<List<dynamic>> getNotifications() async {
    final headers = await _authHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/notifications'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) ?? [];
    } else {
      return [];
    }
  }
}
