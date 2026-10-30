class Ticket {
  final String id;
  final String title;
  final String description;
  final String priority; // 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  final String status; // 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO'
  final String owner;
  final String createdAt;
  final String? imageUrl;

  const Ticket({
    required this.id,
    required this.title,
    required this.description,
    required this.priority,
    required this.status,
    required this.owner,
    required this.createdAt,
    this.imageUrl,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      priority: json['priority'] as String,
      status: json['status'] as String,
      owner: json['owner'] as String,
      createdAt: json['createdAt'] as String,
      imageUrl: json['imageUrl'] as String?,
    );
  }
}

class PaginationMeta {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final String? currentDate;
  final bool hasPrev;
  final bool hasNext;

  const PaginationMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    this.currentDate,
    required this.hasPrev,
    required this.hasNext,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 10,
      total: json['total'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 1,
      currentDate: json['currentDate'] as String?,
      hasPrev: json['hasPrev'] as bool? ?? false,
      hasNext: json['hasNext'] as bool? ?? false,
    );
  }
}

class UserSession {
  final String id;
  final String email;
  final String role; // 'CLIENTE' | 'SOPORTE'
  final String name;

  const UserSession({
    required this.id,
    required this.email,
    required this.role,
    required this.name,
  });

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      id: json['id'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role,
        'name': name,
      };
}
