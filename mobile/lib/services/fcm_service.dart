import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // ignore: avoid_print
  print(
      '[FCM Background] Notificación en segundo plano: ${message.notification?.title}');
}

class FcmService {
  static const String topicSupport = 'tickets_soporte';
  static const String highImportanceChannelId = 'ticketero_high_importance';

  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static final StreamController<RemoteMessage> _messageStreamController =
      StreamController<RemoteMessage>.broadcast();

  /// Stream reactivo global para que la app refresque la lista de tickets automáticamente
  static Stream<RemoteMessage> get messageStream =>
      _messageStreamController.stream;

  static String sanitizeTopic(String raw) {
    return raw.replaceAll(RegExp(r'[^a-zA-Z0-9-_.~%]'), '_');
  }

  static Future<void> initialize() async {
    await Firebase.initializeApp();

    final messaging = FirebaseMessaging.instance;

    // Solicitar permisos de notificación (Android 13+ y iOS)
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    // ignore: avoid_print
    print('[FCM] Permisos concedidos: ${settings.authorizationStatus}');

    // Configurar canal de alta importancia en Android para notificaciones emergentes (Heads-up)
    const androidChannel = AndroidNotificationChannel(
      highImportanceChannelId,
      'Notificaciones de Tickets',
      description: 'Canal de alta prioridad para actualizaciones de tickets',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
    );

    const initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        _messageStreamController.add(const RemoteMessage());
      },
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    // Foreground listener: mostrar notificación del sistema y disparar reactividad
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      // ignore: avoid_print
      print('[FCM Foreground] Recibido: ${message.notification?.title}');

      final notification = message.notification;
      if (notification != null) {
        _localNotifications.show(
          id: notification.hashCode,
          title: notification.title ?? 'Actualización de Ticket',
          body:
              notification.body ?? 'Se ha registrado una nueva actualización.',
          notificationDetails: const NotificationDetails(
            android: AndroidNotificationDetails(
              highImportanceChannelId,
              'Notificaciones de Tickets',
              importance: Importance.max,
              priority: Priority.high,
              icon: '@mipmap/ic_launcher',
              playSound: true,
              enableVibration: true,
            ),
          ),
        );
      }

      // Notificar a los suscriptores (como TicketsView) para auto-refresh silencioso
      _messageStreamController.add(message);
    });

    // Al abrir la app desde la notificación
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      // ignore: avoid_print
      print(
          '[FCM OpenedApp] Abierto desde notificación: ${message.notification?.title}');
      _messageStreamController.add(message);
    });

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  }

  static Future<void> syncUserTopics(String role, String email) async {
    final messaging = FirebaseMessaging.instance;
    final cleanEmail = sanitizeTopic(email);
    final clientTopic = 'cliente_$cleanEmail';

    if (role == 'SOPORTE') {
      await messaging.subscribeToTopic(topicSupport);
      try {
        await messaging.unsubscribeFromTopic(clientTopic);
      } catch (_) {}
      // ignore: avoid_print
      print('[FCM] Suscrito a topic soporte: $topicSupport');
    } else {
      await messaging.subscribeToTopic(clientTopic);
      try {
        await messaging.unsubscribeFromTopic(topicSupport);
      } catch (_) {}
      // ignore: avoid_print
      print('[FCM] Suscrito a topic cliente: $clientTopic');
    }
  }

  static Future<void> clearSubscriptions(String role, String email) async {
    final messaging = FirebaseMessaging.instance;
    final cleanEmail = sanitizeTopic(email);
    try {
      await messaging.unsubscribeFromTopic(topicSupport);
      await messaging.unsubscribeFromTopic('cliente_$cleanEmail');
    } catch (_) {}
  }
}
