import 'package:flutter/material.dart';

import 'services/fcm_service.dart';
import 'views/login_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await FcmService.initialize();

  runApp(const TicketeroMobileApp());
}

class TicketeroMobileApp extends StatelessWidget {
  const TicketeroMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ticketero Móvil',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0077B6)),
        useMaterial3: true,
      ),
      home: const LoginView(),
    );
  }
}
