import 'package:jaspr/dom.dart';
import 'package:jaspr/jaspr.dart';
import 'package:jaspr_storybook/jaspr_storybook.dart';

import 'deferred_greeting.dart' deferred as greeting;

void main() {
  registerStorybook({
    // #docregion button
    'button': (story) => button(
      disabled: story.arg<bool>('disabled'),
      onClick: () => story.action('onClick', story.arg<String>('label')),
      [.text(story.arg<String>('label'))],
    ),
    // #enddocregion button
    // #docregion switch
    'switch': (story) => button(
      attributes: {
        'role': 'switch',
        'aria-checked': '${story.arg<bool>('checked')}',
      },
      onClick: () {
        final checked = !story.arg<bool>('checked');
        story.action('onChanged', checked);
        story.updateArgs({'checked': checked});
      },
      [.text(story.arg<bool>('checked') ? 'Enabled' : 'Disabled')],
    ),
    // #enddocregion switch
    // #docregion counter
    'counter': (story) => _Counter(label: story.arg<String>('label')),
    // #enddocregion counter
    // #docregion deferred
    'deferred': (story) => _Deferred(name: story.arg<String>('name')),
    // #enddocregion deferred
    'error': (story) => throw StateError('Example build failure'),
  });
}

class _Counter extends StatefulComponent {
  const _Counter({required this.label});
  final String label;

  @override
  State<_Counter> createState() => _CounterState();
}

class _CounterState extends State<_Counter> {
  int count = 0;

  @override
  Component build(BuildContext context) => button(
    onClick: () => setState(() => count++),
    [.text('${component.label}: $count')],
  );
}

class _Deferred extends StatefulComponent {
  const _Deferred({required this.name});
  final String name;

  @override
  State<_Deferred> createState() => _DeferredState();
}

class _DeferredState extends State<_Deferred> {
  Object? failure;
  bool loaded = false;

  @override
  void initState() {
    super.initState();
    greeting.loadLibrary().then(
      (_) {
        if (mounted) setState(() => loaded = true);
      },
      onError: (Object error) {
        if (mounted) setState(() => failure = error);
      },
    );
  }

  @override
  Component build(BuildContext context) => switch ((loaded, failure)) {
    (true, _) => greeting.deferredGreeting(component.name),
    (_, final Object error) => p([.text('Could not load: $error')]),
    _ => p([.text('Loading')]),
  };
}
