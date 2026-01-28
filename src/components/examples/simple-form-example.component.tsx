import { KeyboardAvoidingView } from '@/components/layout/keyboard-avoiding-view.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import React from 'react'

/**
 * Simple example showing how to use KeyboardAvoidingView in a form
 */
export const SimpleFormExample: React.FC = () => {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={20}
      enableOnWeb={true}
      className="min-h-screen bg-gray-50 p-4"
    >
      <View className="max-w-md mx-auto space-y-4">
        <Text className="text-xl font-bold text-center mb-6">
          Contact Form
        </Text>
        
        <input
          type="text"
          placeholder="Your Name"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="email"
          placeholder="Your Email"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <textarea
          placeholder="Your Message"
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        
        <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium">
          Send Message
        </button>
      </View>
    </KeyboardAvoidingView>
  )
}

export default SimpleFormExample

