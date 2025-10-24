"use client";

import { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, Smartphone, Monitor } from "lucide-react";

type Client = {
    id: string;
    connectedAt: string; // ISO string
};

let socket: Socket;

export default function DashboardPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketInitializer = async () => {
            // Ensure the server is ready before connecting
            await fetch('/api/socket');
            socket = io();

            socket.on('connect', () => {
                console.log('Dashboard connected to WebSocket');
                setIsConnected(true);
            });

            socket.on('disconnect', () => {
                console.log('Dashboard disconnected from WebSocket');
                setIsConnected(false);
            });

            socket.on('client_list_update', (clientList: Client[]) => {
                setClients(clientList);
            });
        };

        socketInitializer();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    const getDeviceIcon = (id: string, currentId: string) => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (id === currentId) {
            return isMobile ? <Smartphone className="h-4 w-4 text-blue-400" /> : <Monitor className="h-4 w-4 text-blue-400" />;
        }

        // A simple heuristic for other clients, can be improved
        return <Monitor className="h-4 w-4 text-muted-foreground" />;
    }

    return (
        <div className="container mx-auto py-10">
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                        <Wifi size={24} />
                        Real-Time Dashboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-6 p-3 bg-muted/50 rounded-md">
                        <span className="font-semibold">Connection Status</span>
                        <span className={`text-sm font-medium flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {isConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-3">Connected Devices ({clients.length})</h3>
                    {clients.length > 0 ? (
                        <ul className="space-y-2">
                            {clients.map((client) => (
                                <li key={client.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm">
                                    <div className="flex items-center gap-3">
                                        {getDeviceIcon(client.id, socket?.id)}
                                        <span className="font-mono text-xs text-muted-foreground truncate pr-4">{client.id}</span>
                                        {client.id === socket?.id && <span className="text-xs text-blue-400">(You)</span>}
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(client.connectedAt).toLocaleTimeString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            No other devices connected.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}