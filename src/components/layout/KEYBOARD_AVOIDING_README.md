# Keyboard Avoiding View Component

A comprehensive keyboard avoiding view component for React applications using Capacitor, with support for both native mobile platforms and web browsers.

## Features

- **Cross-platform support**: Works on iOS, Android, and web browsers
- **Multiple behaviors**: Padding, height adjustment, or position transformation
- **Smooth animations**: Configurable transition durations
- **Auto-scroll**: Automatically scrolls focused inputs into view
- **Web compatibility**: Enhanced keyboard detection for mobile web browsers
- **TypeScript support**: Fully typed with comprehensive interfaces
- **Capacitor integration**: Uses native Capacitor Keyboard plugin for optimal performance

## Installation

The component requires the Capacitor Keyboard plugin:

```bash
npm install @capacitor/keyboard
```

## Basic Usage

```tsx
import { KeyboardAvoidingView } from '@/components/layout/keyboard-avoiding-view.component'

function MyComponent() {
  return (
    <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={20}>
      <input type="text" placeholder="Type something..." />
      <textarea placeholder="Longer text here..." />
    </KeyboardAvoidingView>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `behavior` | `'padding' \| 'height' \| 'position'` | `'padding'` | How to adjust layout when keyboard appears |
| `keyboardVerticalOffset` | `number` | `0` | Additional offset to add/subtract from keyboard height |
| `enableOnWeb` | `boolean` | `false` | Enable keyboard avoidance on web browsers |
| `animationDuration` | `number` | `250` | Animation duration in milliseconds |
| `autoScrollToFocusedInput` | `boolean` | `true` | Automatically scroll focused inputs into view |
| `children` | `React.ReactNode` | - | Content to render inside the component |

## Behaviors

### Padding
Adjusts the bottom padding of the container to push content above the keyboard.

```tsx
<KeyboardAvoidingView behavior="padding">
  {/* Content */}
</KeyboardAvoidingView>
```

### Height
Adjusts the height of the container to fit above the keyboard.

```tsx
<KeyboardAvoidingView behavior="height">
  {/* Content */}
</KeyboardAvoidingView>
```

### Position
Transforms the container position to move it above the keyboard.

```tsx
<KeyboardAvoidingView behavior="position">
  {/* Content */}
</KeyboardAvoidingView>
```

## useKeyboard Hook

Access keyboard state and utilities with the `useKeyboard` hook:

```tsx
import { useKeyboard } from '@/components/layout/keyboard-avoiding-view.component'

function MyComponent() {
  const keyboard = useKeyboard()

  return (
    <div>
      <p>Keyboard visible: {keyboard.isKeyboardVisible ? 'Yes' : 'No'}</p>
      <p>Keyboard height: {keyboard.keyboardHeight}px</p>
      <button onClick={keyboard.hideKeyboard}>Hide Keyboard</button>
      <button onClick={keyboard.showKeyboard}>Show Keyboard</button>
    </div>
  )
}
```

### Hook Methods

- `hideKeyboard()`: Hide the keyboard programmatically
- `showKeyboard()`: Show the keyboard programmatically
- `setResizeMode(mode)`: Set keyboard resize mode (`'body'`, `'ionic'`, `'native'`)
- `setScrollMode(mode)`: Set keyboard scroll mode (`'auto'`, `'manual'`)

## KeyboardUtil Class

For advanced usage, you can use the `KeyboardUtil` class directly:

```tsx
import { KeyboardUtil } from '@/shared/utils/keyboard.util'

// Initialize keyboard listeners
await KeyboardUtil.initialize()

// Add custom listener
const unsubscribe = KeyboardUtil.addListener((info) => {
  console.log('Keyboard height:', info.keyboardHeight)
  console.log('Keyboard visible:', info.isKeyboardVisible)
})

// Get current keyboard state
const keyboardInfo = KeyboardUtil.getKeyboardInfo()

// Hide keyboard
await KeyboardUtil.hideKeyboard()

// Clean up
unsubscribe()
KeyboardUtil.cleanup()
```

## Platform-Specific Configuration

### Capacitor Configuration

Add keyboard configuration to your `capacitor.config.json`:

```json
{
  "plugins": {
    "Keyboard": {
      "resizeOnFullScreen": true
    }
  }
}
```

### iOS Configuration

For iOS, you may need to configure the keyboard behavior in your `Info.plist`:

```xml
<key>UIKeyboardAppearance</key>
<string>UIKeyboardAppearanceDefault</string>
```

## Web Browser Support

When `enableOnWeb` is true, the component uses the Visual Viewport API for better keyboard detection on mobile web browsers:

```tsx
<KeyboardAvoidingView enableOnWeb={true}>
  {/* Content */}
</KeyboardAvoidingView>
```

## Best Practices

1. **Use appropriate behavior**: Choose `padding` for most cases, `height` for full-screen layouts, and `position` for complex layouts.

2. **Set reasonable offsets**: Use `keyboardVerticalOffset` to account for navigation bars or other UI elements.

3. **Enable web support**: Set `enableOnWeb={true}` if your app will be used in mobile web browsers.

4. **Test on devices**: Always test keyboard behavior on actual devices, especially iOS and Android.

5. **Handle edge cases**: Consider what happens when the keyboard appears/disappears rapidly.

## Example Implementation

See the `KeyboardAvoidingDemo` component for a complete example:

```tsx
import { KeyboardAvoidingDemo } from '@/components/demo/keyboard-avoiding-demo.component'

function App() {
  return <KeyboardAvoidingDemo />
}
```

## Troubleshooting

### Keyboard not detected on web
- Ensure `enableOnWeb={true}` is set
- Check if the browser supports Visual Viewport API
- Test on actual mobile devices, not desktop browsers

### Keyboard height incorrect
- Adjust `keyboardVerticalOffset` to account for navigation bars
- Check Capacitor configuration
- Verify keyboard plugin is properly installed

### Performance issues
- Use `behavior="padding"` for better performance
- Reduce `animationDuration` for faster transitions
- Avoid complex layouts inside the keyboard avoiding view

## License

This component is part of the Streek app and follows the project's licensing terms.

