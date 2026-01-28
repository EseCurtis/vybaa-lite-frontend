import { Button } from '@/components/layout/button.component'
import { KeyboardAvoidingView, useKeyboard } from '@/components/layout/keyboard-avoiding-view.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import React, { useState } from 'react'

/**
 * Demo component showcasing KeyboardAvoidingView functionality
 */
export const KeyboardAvoidingDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const keyboard = useKeyboard()

  const handleHideKeyboard = async () => {
    await keyboard.hideKeyboard()
  }

  const handleShowKeyboard = async () => {
    await keyboard.showKeyboard()
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={20}
      enableOnWeb={true}
      autoScrollToFocusedInput={true}
      className="min-h-screen bg-gray-50 p-4"
    >
      <View className="space-y-6">
        {/* Header */}
        <View className="text-center">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Keyboard Avoiding Demo
          </Text>
          <Text className="text-gray-600">
            Try focusing on the inputs below to see the keyboard avoidance in action
          </Text>
        </View>

        {/* Keyboard Status */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-semibold mb-2">Keyboard Status</Text>
          <Text className="text-sm text-gray-600">
            Visible: {keyboard.isKeyboardVisible ? 'Yes' : 'No'}
          </Text>
          <Text className="text-sm text-gray-600">
            Height: {keyboard.keyboardHeight}px
          </Text>
        </View>

        {/* Control Buttons */}
        <View className="flex-row space-x-4">
          <Button

            onClick={handleShowKeyboard}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg"
          >
            Show Keyboard
          </Button>
          <Button
            onClick={handleHideKeyboard}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg"
          >
            Hide Keyboard
          </Button>
        </View>

        {/* Form Inputs */}
        <View className="space-y-4">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Text Input
            </Text>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type something here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Textarea
            </Text>
            <textarea
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              placeholder="Type a longer message here..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email Input
            </Text>
            <input
              type="email"
              placeholder="Enter your email..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password Input
            </Text>
            <input
              type="password"
              placeholder="Enter your password..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </View>
        </View>

        {/* Bottom Content */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-sm text-gray-600">
            This content should remain visible above the keyboard when inputs are focused.
            The KeyboardAvoidingView automatically adjusts the layout to ensure important
            content stays accessible.
          </Text>
        </View>

        {/* Spacer to test scrolling */}
        <View className="h-32 bg-gray-200 rounded-lg flex items-center justify-center">
          <Text className="text-gray-500">Bottom spacer content</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

export default KeyboardAvoidingDemo

