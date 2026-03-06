import { io } from "socket.io-client";
import { useState, useEffect } from "react";

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
    withCredentials: true
});

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleNotification = (newNotif) => {
            console.log("FROM USE NOTIFICATION", newNotif);
            const notificationObj = {
                id: newNotif.data?.documentId || Date.now(),
                ...newNotif
            };
            setNotifications((prev) => [notificationObj, ...prev]);
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, []);

    const clearNotifications = () => setNotifications([]);

    return { notifications, clearNotifications };
};

export default socket;