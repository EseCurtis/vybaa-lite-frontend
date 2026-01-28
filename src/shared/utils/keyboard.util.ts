import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'

export interface KeyboardInfo {
  keyboardHeight: number
  isKeyboardVisible: boolean
}

/**
 * Keyboard utility functions for handling keyboard events and state
 */
export class KeyboardUtil {
  private static keyboardHeight = 0
  private static isKeyboardVisible = false
  private static listeners: Array<(info: KeyboardInfo) => void> = []

  /**
   * Initialize keyboard listeners
   */
  static async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    // Listen for keyboard show events
    Keyboard.addListener('keyboardWillShow', (info) => {
      this.keyboardHeight = info.keyboardHeight
      this.isKeyboardVisible = true
      this.notifyListeners()
    })

    // Listen for keyboard hide events
    Keyboard.addListener('keyboardWillHide', () => {
      this.keyboardHeight = 0
      this.isKeyboardVisible = false
      this.notifyListeners()
    })
  }

  /**
   * Add a listener for keyboard state changes
   */
  static addListener(callback: (info: KeyboardInfo) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Get current keyboard state
   */
  static getKeyboardInfo(): KeyboardInfo {
    return {
      keyboardHeight: this.keyboardHeight,
      isKeyboardVisible: this.isKeyboardVisible
    }
  }

  /**
   * Hide the keyboard programmatically
   */
  static async hideKeyboard(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.hide()
    }
  }

  /**
   * Show the keyboard programmatically
   */
  static async showKeyboard(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.show()
    }
  }

  /**
   * Set keyboard resize mode
   */
  static async setResizeMode(mode: 'body' | 'ionic' | 'native'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      //@ts-ignore
      await Keyboard.setResizeMode({ mode })
    }
  }

  /**
   * Set keyboard scroll mode
   */
  static async setScrollMode(mode: 'auto' | 'manual'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.setScroll({ isDisabled: mode === 'manual' })
    }
  }

  /**
   * Notify all listeners of keyboard state changes
   */
  private static notifyListeners(): void {
    const info = this.getKeyboardInfo()
    this.listeners.forEach(listener => listener(info))
  }

  /**
   * Clean up listeners
   */
  static cleanup(): void {
    this.listeners = []
  }
}

