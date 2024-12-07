import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import WebSocketClient from '../utils/WebSocketClient';
import { addNotification } from '../stores/NotificationStore';

const useWebSocket = () => {
  const dispatch = useDispatch();
  const [taxAlerts, setTaxAlerts] = useState<Array<{ nickname: string; taxAmount: number }>>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      WebSocketClient.connect(
        token,
        (data) => {
          console.log('Received WebSocket data:', data); // Detailed logging

          // Validate the data structure before adding
          if (data && data.type === 'tax-alert' && data.nickname && data.taxAmount) {
            const newAlert = {
              nickname: data.nickname,
              taxAmount: Number(data.taxAmount)
            };
            
            setTaxAlerts((prev) => {
              console.log('Updated tax alerts:', [...prev, newAlert]);
              return [...prev, newAlert];
            });
          } else {
            console.warn('Invalid tax alert format:', data);
          }
        },
        (error) => {
          console.error('WebSocket error:', error);
        }
      );
    } else {
      console.warn('No access token found');
    }

    
    return () => {
      WebSocketClient.disconnect();
    };
  }, [dispatch]);

  return { taxAlerts };
};

export default useWebSocket;