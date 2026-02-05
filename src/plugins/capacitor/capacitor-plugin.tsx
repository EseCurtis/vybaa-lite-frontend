import { App } from '@capacitor/app';
import { useEffect } from 'react';
import ConfigCapacitorApp from './config';

export const CapacitorPlugin = () => {
  useEffect(() => {
    App.addListener('appUrlOpen', (event) => {
      console.log(event.url)
    })

    

    ConfigCapacitorApp()
  }, [])

  return null
}
