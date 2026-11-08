import 'package:jaspr/dom.dart';
import 'package:jaspr/jaspr.dart';

Component deferredGreeting(String name) =>
    p([.text('Loaded on demand for $name')]);
