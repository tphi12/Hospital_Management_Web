import React from 'react';
import socket from '../hooks/useSocket.js';

const NotificationListener = () => {
    const [notifications, setNotifications] = React.useState([]);
    console.log("Hello from notilistener");
    React.useEffect(() => {
        console.log("Socket", socket);
        console.log("Socket connected initially:", socket.connected);

        socket.on('connect', () => {
            console.log('✅ Socket connected successfully!', socket.id);
        });

        socket.on('connect_error', (error) => {
            console.log('❌ Socket connection error:', error);
        });

        const handleNotification = (notification) => {
            console.log('Notification', notification);
            setNotifications((prev) => [...prev, notification]);
        };

        socket.on('notification', handleNotification);

        // Cleanup listener on unmount
        return () => {
            socket.off('notification', handleNotification);
        };
    }, []);

    return (
        <div>
            {notifications.map((notification) => (
                <li key={notification.data.documentId}>{notification.message}</li>
            ))}
        </div>
    );
};

export default NotificationListener;