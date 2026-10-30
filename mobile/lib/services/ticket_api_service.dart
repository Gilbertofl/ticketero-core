import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/ticket.dart';

class TicketApiService {
  final String _baseUrl;

  TicketApiService({String? baseUrl})
      : _baseUrl = baseUrl ?? AppConfig.apiBaseUrl;

  String get baseUrl => _baseUrl;
  String get fullHost => AppConfig.serverHost;

  Future<UserSession?> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode != 200) {
      return null;
    }

    final dynamic data = jsonDecode(response.body);
    if (data['success'] == true && data['user'] != null) {
      return UserSession.fromJson(data['user'] as Map<String, dynamic>);
    }
    return null;
  }

  Future<String> uploadImageBytes(Uint8List bytes) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/upload'),
      headers: {'Content-Type': 'image/jpeg'},
      body: bytes,
    );

    if (response.statusCode != 201) {
      throw Exception(
          'Error al subir imagen al servidor (${response.statusCode})');
    }

    final dynamic data = jsonDecode(response.body);
    return data['imageUrl'] as String;
  }

  Future<({List<Ticket> tickets, PaginationMeta pagination})> fetchTickets({
    int page = 1,
    int limit = 10,
    String? date,
    String? owner,
    String? status,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (date != null && date.isNotEmpty) queryParams['date'] = date;
    if (owner != null && owner.isNotEmpty) queryParams['owner'] = owner;
    if (status != null && status.isNotEmpty) queryParams['status'] = status;

    final uri =
        Uri.parse('$_baseUrl/tickets').replace(queryParameters: queryParams);
    final response = await http.get(uri);

    if (response.statusCode != 200) {
      throw Exception('Error al consultar tickets (${response.statusCode})');
    }

    final dynamic decoded = jsonDecode(response.body);
    final List<dynamic> list = decoded['data'] as List<dynamic>;
    final tickets = list
        .map((item) => Ticket.fromJson(item as Map<String, dynamic>))
        .toList();
    final pagination =
        PaginationMeta.fromJson(decoded['pagination'] as Map<String, dynamic>);

    return (tickets: tickets, pagination: pagination);
  }

  Future<Ticket> createTicket({
    required String title,
    required String description,
    required String priority,
    required String owner,
    String? imageUrl,
  }) async {
    final payload = <String, dynamic>{
      'title': title,
      'description': description,
      'priority': priority,
      'owner': owner,
      if (imageUrl != null) 'imageUrl': imageUrl,
    };

    final response = await http.post(
      Uri.parse('$_baseUrl/tickets'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (response.statusCode != 201) {
      throw Exception('Error al crear ticket (${response.statusCode})');
    }

    final dynamic decoded = jsonDecode(response.body);
    return Ticket.fromJson(decoded as Map<String, dynamic>);
  }

  Future<Ticket> updateTicketStatus(String id, String newStatus) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/tickets/$id'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'status': newStatus}),
    );

    if (response.statusCode != 200) {
      throw Exception('Error al actualizar ticket (${response.statusCode})');
    }

    final dynamic decoded = jsonDecode(response.body);
    return Ticket.fromJson(decoded as Map<String, dynamic>);
  }
}
