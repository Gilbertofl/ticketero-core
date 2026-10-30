class AppConfig {
  AppConfig._();

  /// URL base para las peticiones API del backend
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );

  /// Host raíz del servidor (utilizado para resolver imágenes y recursos estáticos)
  static const String serverHost = String.fromEnvironment(
    'SERVER_HOST',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Resuelve una ruta relativa de imagen o archivo en una URL completa absoluta
  static String resolveAssetUrl(String relativePath) {
    if (relativePath.startsWith('http://') ||
        relativePath.startsWith('https://')) {
      return relativePath;
    }
    final cleanPath =
        relativePath.startsWith('/') ? relativePath : '/$relativePath';
    return '$serverHost$cleanPath';
  }
}
