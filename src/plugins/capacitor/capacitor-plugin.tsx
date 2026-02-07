import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ConfigCapacitorApp from './config';
import { setQueryClientForNotifications } from './plugins/push-notification.plugin';

export const CapacitorPlugin = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    App.addListener('appUrlOpen', (event) => {
      console.log(event.url)
    })

    // Pass queryClient to push notification plugin for invalidation
    setQueryClientForNotifications(queryClient);

    ConfigCapacitorApp()
  }, [queryClient])

  return null
}
