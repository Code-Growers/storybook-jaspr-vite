import 'package:jaspr/dom.dart';
import 'package:jaspr/jaspr.dart';
import 'package:jaspr_storybook/jaspr_storybook.dart';

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
