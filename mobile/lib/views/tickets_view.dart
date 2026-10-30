import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../config/app_config.dart';
import '../models/ticket.dart';
import '../services/fcm_service.dart';
import '../services/ticket_api_service.dart';
import 'login_view.dart';

class TicketsView extends StatefulWidget {
  final UserSession session;

  const TicketsView({super.key, required this.session});

  @override
  State<TicketsView> createState() => TicketsViewState();
}

class TicketsViewState extends State<TicketsView> {
  final TicketApiService _apiService = TicketApiService();
  final ImagePicker _picker = ImagePicker();

  StreamSubscription? _fcmSubscription;

  List<Ticket> _tickets = [];
  PaginationMeta _pagination = const PaginationMeta(
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  );

  bool _isLoading = true;
  bool _isAutoRefreshing = false;
  String? _errorMessage;
  String? _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().toIso8601String().substring(0, 10);
    loadTickets();

    // Reactividad en tiempo real: escuchar eventos de FCM para refresco automático
    _fcmSubscription = FcmService.messageStream.listen((_) {
      if (mounted) {
        // Refresco silencioso y automático en segundo plano sin interrumpir al usuario
        loadTickets(page: _pagination.page, silent: true);
      }
    });
  }

  @override
  void dispose() {
    _fcmSubscription?.cancel();
    super.dispose();
  }

  Future<void> loadTickets({int page = 1, bool silent = false}) async {
    if (!mounted) return;

    if (silent) {
      setState(() => _isAutoRefreshing = true);
    } else {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final isClient = widget.session.role == 'CLIENTE';
      final result = await _apiService.fetchTickets(
        page: page,
        limit: 10,
        date: _selectedDate,
        owner: isClient ? widget.session.email : null,
      );

      if (!mounted) return;
      setState(() {
        _tickets = result.tickets;
        _pagination = result.pagination;
        _isLoading = false;
        _isAutoRefreshing = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (!silent) {
          _errorMessage = 'No se pudo conectar con el servidor ($e)';
        }
        _isLoading = false;
        _isAutoRefreshing = false;
      });
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'CRITICA':
        return const Color(0xFF8B5CF6);
      case 'ALTA':
        return const Color(0xFFEF4444);
      case 'MEDIA':
        return const Color(0xFFF59E0B);
      case 'BAJA':
      default:
        return const Color(0xFF10B981);
    }
  }

  ({Color bg, Color text, Color border}) _getStatusStyle(String status) {
    switch (status) {
      case 'EN_PROCESO':
        return (
          bg: const Color(0xFFF5F3FF),
          text: const Color(0xFF7C3AED),
          border: const Color(0xFFDDD6FE)
        );
      case 'RESUELTO':
        return (
          bg: const Color(0xFFECFDF5),
          text: const Color(0xFF059669),
          border: const Color(0xFFA7F3D0)
        );
      case 'ABIERTO':
      default:
        return (
          bg: const Color(0xFFEFF6FF),
          text: const Color(0xFF2563EB),
          border: const Color(0xFFBFDBFE)
        );
    }
  }

  void _showImageLightbox(String relativeUrl) {
    final fullUrl = AppConfig.resolveAssetUrl(relativeUrl);
    showDialog(
      context: context,
      barrierColor: Colors.black87,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            Center(
              child: InteractiveViewer(
                minScale: 0.8,
                maxScale: 3.5,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Image.network(
                    fullUrl,
                    fit: BoxFit.contain,
                    loadingBuilder: (ctx, child, progress) {
                      if (progress == null) return child;
                      return const Center(
                        child: CircularProgressIndicator(color: Colors.white),
                      );
                    },
                    errorBuilder: (_, __, ___) => Container(
                      padding: const EdgeInsets.all(24),
                      color: Colors.black54,
                      child: const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.broken_image,
                              color: Colors.white54, size: 48),
                          SizedBox(height: 8),
                          Text('No se pudo cargar la imagen',
                              style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 10,
              right: 10,
              child: Material(
                color: Colors.black54,
                shape: const CircleBorder(),
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 26),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openCreateTicketSheet() async {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String priority = 'BAJA';
    XFile? pickedFile;
    bool isSubmitting = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            final mediaQuery = MediaQuery.of(modalCtx);
            final bottomInset = mediaQuery.viewInsets.bottom;
            final bottomPadding = mediaQuery.padding.bottom;

            return SafeArea(
              top: false,
              bottom: true,
              child: Padding(
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  top: 16,
                  bottom:
                      bottomInset > 0 ? bottomInset + 16 : bottomPadding + 20,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFCBD5E1),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const Text(
                        'Nueva Incidencia / Ticket',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Describe el problema o requerimiento',
                        style:
                            TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      TextField(
                        controller: titleCtrl,
                        decoration: InputDecoration(
                          labelText: 'Razón / Título breve',
                          labelStyle: const TextStyle(color: Color(0xFF64748B)),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                                color: Color(0xFF0077B6), width: 1.8),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: descCtrl,
                        maxLines: 3,
                        decoration: InputDecoration(
                          labelText: 'Descripción detallada',
                          labelStyle: const TextStyle(color: Color(0xFF64748B)),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                                color: Color(0xFF0077B6), width: 1.8),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        initialValue: priority,
                        decoration: InputDecoration(
                          labelText: 'Nivel de Prioridad',
                          labelStyle: const TextStyle(color: Color(0xFF64748B)),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(
                              value: 'BAJA',
                              child: Text('BAJA - Preventivo / Rutina')),
                          DropdownMenuItem(
                              value: 'MEDIA',
                              child: Text('MEDIA - Afectación menor')),
                          DropdownMenuItem(
                              value: 'ALTA',
                              child: Text('ALTA - Interrupción crítica')),
                          DropdownMenuItem(
                              value: 'CRITICA',
                              child: Text('CRÍTICA - Bloqueo general')),
                        ],
                        onChanged: (val) {
                          if (val != null) setModalState(() => priority = val);
                        },
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            OutlinedButton.icon(
                              icon: const Icon(Icons.camera_alt_outlined,
                                  size: 20),
                              label: const Text('Tomar Foto'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF0077B6),
                                side:
                                    const BorderSide(color: Color(0xFF0077B6)),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              onPressed: () async {
                                final photo = await _picker.pickImage(
                                  source: ImageSource.camera,
                                  maxWidth: 1280,
                                  imageQuality: 80,
                                );
                                if (photo != null) {
                                  setModalState(() => pickedFile = photo);
                                }
                              },
                            ),
                            const SizedBox(width: 12),
                            if (pickedFile != null)
                              Expanded(
                                child: Row(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.file(
                                        File(pickedFile!.path),
                                        width: 44,
                                        height: 44,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Expanded(
                                      child: Text(
                                        'Foto adjunta lista',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF059669),
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.close,
                                          size: 18, color: Colors.grey),
                                      onPressed: () => setModalState(
                                          () => pickedFile = null),
                                    ),
                                  ],
                                ),
                              )
                            else
                              const Expanded(
                                child: Text(
                                  'Opcional para evidencia técnica',
                                  style: TextStyle(
                                      fontSize: 12, color: Color(0xFF94A3B8)),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        height: 48,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0077B6),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: isSubmitting
                              ? null
                              : () async {
                                  final title = titleCtrl.text.trim();
                                  final desc = descCtrl.text.trim();
                                  if (title.isEmpty || desc.isEmpty) {
                                    ScaffoldMessenger.of(modalCtx).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                            'Por favor completa título y descripción'),
                                      ),
                                    );
                                    return;
                                  }

                                  setModalState(() => isSubmitting = true);
                                  try {
                                    String? uploadedImageUrl;
                                    if (pickedFile != null) {
                                      final bytes =
                                          await pickedFile!.readAsBytes();
                                      uploadedImageUrl = await _apiService
                                          .uploadImageBytes(bytes);
                                    }

                                    await _apiService.createTicket(
                                      title: title,
                                      description: desc,
                                      priority: priority,
                                      owner: widget.session.email,
                                      imageUrl: uploadedImageUrl,
                                    );

                                    if (!modalCtx.mounted) return;
                                    Navigator.of(modalCtx).pop();
                                    await loadTickets(page: 1);
                                  } catch (e) {
                                    setModalState(() => isSubmitting = false);
                                    if (!modalCtx.mounted) return;
                                    ScaffoldMessenger.of(modalCtx).showSnackBar(
                                      SnackBar(
                                          content: Text(
                                              'Error al crear ticket: $e')),
                                    );
                                  }
                                },
                          child: isSubmitting
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.5,
                                  ),
                                )
                              : const Text(
                                  'Publicar Ticket',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _showStatusDialog(Ticket ticket) async {
    final isSupport = widget.session.role == 'SOPORTE';
    if (!isSupport) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Solo Soporte puede cambiar estados.')),
      );
      return;
    }

    final nextStatus = ticket.status == 'ABIERTO'
        ? 'EN_PROCESO'
        : ticket.status == 'EN_PROCESO'
            ? 'RESUELTO'
            : null;

    if (nextStatus == null) return;

    final actionLabel = nextStatus == 'EN_PROCESO'
        ? 'Tomar Incidencia'
        : 'Marcar como Resuelto';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          ticket.title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        content: Text('¿Deseas cambiar el estado a "$nextStatus"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancelar',
                style: TextStyle(color: Color(0xFF64748B))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0077B6),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(actionLabel),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _apiService.updateTicketStatus(ticket.id, nextStatus);
        await loadTickets(page: _pagination.page, silent: true);
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al actualizar: $e')),
        );
      }
    }
  }

  Future<void> _selectDateFilter() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2023),
      lastDate: DateTime(2030),
    );

    if (picked != null) {
      setState(() {
        _selectedDate = picked.toIso8601String().substring(0, 10);
      });
      await loadTickets(page: 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isClient = widget.session.role == 'CLIENTE';
    final bottomSystemPadding = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFE2E8F0), height: 1),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF0077B6).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.confirmation_number_outlined,
                color: Color(0xFF0077B6),
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isClient ? 'Mis Tickets' : 'Panel de Soporte',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    '${widget.session.name} • ${widget.session.role}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (_isAutoRefreshing)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8),
              child: Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Color(0xFF0077B6)),
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.calendar_month_outlined,
                color: Color(0xFF475569)),
            tooltip: 'Filtrar por fecha',
            onPressed: _selectDateFilter,
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFFDC2626)),
            tooltip: 'Cerrar sesión',
            onPressed: () async {
              await FcmService.clearSubscriptions(
                  widget.session.role, widget.session.email);
              if (!context.mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginView()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Barra de filtro moderna y estado
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.filter_list,
                          size: 14, color: Color(0xFF64748B)),
                      const SizedBox(width: 4),
                      Text(
                        _selectedDate ?? 'Hoy',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF334155),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                if (_selectedDate != null)
                  InkWell(
                    onTap: () {
                      setState(() {
                        _selectedDate =
                            DateTime.now().toIso8601String().substring(0, 10);
                      });
                      loadTickets(page: 1);
                    },
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      child: Text(
                        'Restablecer hoy',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF0077B6),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                const Spacer(),
                Text(
                  '${_pagination.total} ticket${_pagination.total == 1 ? '' : 's'}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Listado de Tickets
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF0077B6)),
                  )
                : _errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.cloud_off_outlined,
                                  size: 48, color: Color(0xFFDC2626)),
                              const SizedBox(height: 12),
                              Text(
                                _errorMessage!,
                                textAlign: TextAlign.center,
                                style:
                                    const TextStyle(color: Color(0xFF64748B)),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                icon: const Icon(Icons.refresh),
                                label: const Text('Reintentar'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0077B6),
                                  foregroundColor: Colors.white,
                                ),
                                onPressed: () => loadTickets(page: 1),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _tickets.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.inbox_outlined,
                                    size: 56,
                                    color: Colors.grey.shade300,
                                  ),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'No hay incidencias para esta fecha',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF475569),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Los nuevos tickets registrados aparecerán aquí automáticamente.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                        fontSize: 13, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            color: const Color(0xFF0077B6),
                            onRefresh: () =>
                                loadTickets(page: _pagination.page),
                            child: ListView.builder(
                              physics: const AlwaysScrollableScrollPhysics(),
                              // Padding inferior que respeta la barra de 3 botones y el FAB
                              padding: EdgeInsets.only(
                                left: 16,
                                right: 16,
                                top: 12,
                                bottom: bottomSystemPadding + 90,
                              ),
                              itemCount: _tickets.length,
                              itemBuilder: (ctx, i) {
                                final ticket = _tickets[i];
                                final priorityColor =
                                    _getPriorityColor(ticket.priority);
                                final statusStyle =
                                    _getStatusStyle(ticket.status);

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                        color: const Color(0xFFE2E8F0)),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black
                                            .withValues(alpha: 0.02),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: IntrinsicHeight(
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: [
                                        // Barra vertical elegante para el indicador de prioridad (como la Web)
                                        Container(
                                          width: 5,
                                          decoration: BoxDecoration(
                                            color: priorityColor,
                                            borderRadius:
                                                const BorderRadius.horizontal(
                                              left: Radius.circular(16),
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          child: Padding(
                                            padding: const EdgeInsets.all(14),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                    Expanded(
                                                      child: Text(
                                                        ticket.title,
                                                        style: const TextStyle(
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          color:
                                                              Color(0xFF0F172A),
                                                        ),
                                                      ),
                                                    ),
                                                    if (!isClient)
                                                      IconButton(
                                                        padding:
                                                            EdgeInsets.zero,
                                                        constraints:
                                                            const BoxConstraints(),
                                                        icon: const Icon(
                                                          Icons.edit_note,
                                                          color:
                                                              Color(0xFF0077B6),
                                                          size: 24,
                                                        ),
                                                        tooltip:
                                                            'Gestionar Estado',
                                                        onPressed: () =>
                                                            _showStatusDialog(
                                                                ticket),
                                                      ),
                                                  ],
                                                ),
                                                const SizedBox(height: 6),
                                                Text(
                                                  ticket.description,
                                                  style: const TextStyle(
                                                    fontSize: 13,
                                                    color: Color(0xFF475569),
                                                    height: 1.35,
                                                  ),
                                                ),
                                                const SizedBox(height: 10),

                                                // Chips de estado y prioridad modernos
                                                Wrap(
                                                  spacing: 8,
                                                  runSpacing: 6,
                                                  crossAxisAlignment:
                                                      WrapCrossAlignment.center,
                                                  children: [
                                                    // Chip de Prioridad
                                                    Container(
                                                      padding: const EdgeInsets
                                                          .symmetric(
                                                        horizontal: 8,
                                                        vertical: 3,
                                                      ),
                                                      decoration: BoxDecoration(
                                                        color: priorityColor
                                                            .withValues(
                                                                alpha: 0.1),
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(6),
                                                      ),
                                                      child: Text(
                                                        ticket.priority,
                                                        style: TextStyle(
                                                          color: priorityColor,
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          fontSize: 11,
                                                        ),
                                                      ),
                                                    ),

                                                    // Chip de Estado
                                                    Container(
                                                      padding: const EdgeInsets
                                                          .symmetric(
                                                        horizontal: 8,
                                                        vertical: 3,
                                                      ),
                                                      decoration: BoxDecoration(
                                                        color: statusStyle.bg,
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(6),
                                                        border: Border.all(
                                                            color: statusStyle
                                                                .border),
                                                      ),
                                                      child: Text(
                                                        ticket.status
                                                            .replaceAll(
                                                                '_', ' '),
                                                        style: TextStyle(
                                                          color:
                                                              statusStyle.text,
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          fontSize: 11,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),

                                                // Miniatura de imagen si existe
                                                if (ticket.imageUrl !=
                                                    null) ...[
                                                  const SizedBox(height: 10),
                                                  InkWell(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            8),
                                                    onTap: () =>
                                                        _showImageLightbox(
                                                            ticket.imageUrl!),
                                                    child: Container(
                                                      padding:
                                                          const EdgeInsets.all(
                                                              4),
                                                      decoration: BoxDecoration(
                                                        color: const Color(
                                                            0xFFF1F5F9),
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(8),
                                                        border: Border.all(
                                                            color: const Color(
                                                                0xFFE2E8F0)),
                                                      ),
                                                      child: Row(
                                                        mainAxisSize:
                                                            MainAxisSize.min,
                                                        children: [
                                                          ClipRRect(
                                                            borderRadius:
                                                                BorderRadius
                                                                    .circular(
                                                                        6),
                                                            child:
                                                                Image.network(
                                                              AppConfig
                                                                  .resolveAssetUrl(
                                                                      ticket
                                                                          .imageUrl!),
                                                              width: 36,
                                                              height: 36,
                                                              fit: BoxFit.cover,
                                                              errorBuilder: (_,
                                                                      __,
                                                                      ___) =>
                                                                  const Icon(
                                                                Icons
                                                                    .broken_image,
                                                                size: 26,
                                                                color:
                                                                    Colors.grey,
                                                              ),
                                                            ),
                                                          ),
                                                          const SizedBox(
                                                              width: 8),
                                                          const Text(
                                                            'Ver imagen adjunta',
                                                            style: TextStyle(
                                                              fontSize: 12,
                                                              color: Color(
                                                                  0xFF0077B6),
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w600,
                                                            ),
                                                          ),
                                                          const SizedBox(
                                                              width: 4),
                                                          const Icon(
                                                            Icons.fullscreen,
                                                            size: 16,
                                                            color: Color(
                                                                0xFF0077B6),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  ),
                                                ],

                                                const SizedBox(height: 8),
                                                Row(
                                                  children: [
                                                    const Icon(
                                                      Icons.person_outline,
                                                      size: 13,
                                                      color: Color(0xFF94A3B8),
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Expanded(
                                                      child: Text(
                                                        ticket.owner,
                                                        style: const TextStyle(
                                                          fontSize: 11,
                                                          color:
                                                              Color(0xFF64748B),
                                                        ),
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),

          // Paginación limpia
          if (_pagination.totalPages > 1)
            Container(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 8,
                bottom: bottomSystemPadding > 0 ? bottomSystemPadding : 8,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  OutlinedButton(
                    onPressed: _pagination.hasPrev
                        ? () => loadTickets(page: _pagination.page - 1)
                        : null,
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Anterior'),
                  ),
                  Text(
                    'Página ${_pagination.page} de ${_pagination.totalPages}',
                    style:
                        const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                  ),
                  OutlinedButton(
                    onPressed: _pagination.hasNext
                        ? () => loadTickets(page: _pagination.page + 1)
                        : null,
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Siguiente'),
                  ),
                ],
              ),
            ),
        ],
      ),
      floatingActionButton: isClient
          ? Container(
              margin: EdgeInsets.only(bottom: bottomSystemPadding > 0 ? 8 : 0),
              child: FloatingActionButton.extended(
                onPressed: _openCreateTicketSheet,
                backgroundColor: const Color(0xFF0077B6),
                foregroundColor: Colors.white,
                elevation: 3,
                icon: const Icon(Icons.add),
                label: const Text(
                  'Nueva incidencia',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            )
          : null,
    );
  }
}
