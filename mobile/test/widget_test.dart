import 'package:flutter_test/flutter_test.dart';
import 'package:ticketero_mobile/main.dart';

void main() {
  testWidgets('Ticketero mobile smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const TicketeroMobileApp());
    expect(find.text('Ticketero Soporte Móvil'), findsOneWidget);
  });
}
