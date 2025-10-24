"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Play,
    Pause,
    RotateCcw,
    Flag,
    Loader2,
    ListChecks,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Activity = {
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
};

const ActionIcon = ({ action }: { action: string }) => {
    switch (action) {
        case "START":
            return <Play className="h-4 w-4 text-green-500" />;
        case "PAUSE":
            return <Pause className="h-4 w-4 text-yellow-500" />;
        case "LAP":
            return <Flag className="h-4 w-4 text-blue-500" />;
        case "RESET":
            return <RotateCcw className="h-4 w-4 text-red-500" />;
        default:
            return null;
    }
};

export default function DashboardPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await fetch("/api/stopwatch/activity");
                const data = await response.json();
                setActivities(data);
            } catch (error) {
                console.error("Failed to fetch activities:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();
    }, []);

    return (
        <div className="container mx-auto py-10">
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                        <ListChecks size={24} />
                        Stopwatch Activity Log
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : activities.length > 0 ? (
                        <ul className="space-y-3">
                            {activities.map((activity) => (
                                <li
                                    key={activity.id}
                                    className="flex items-center justify-between gap-3 rounded-md p-3 bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <ActionIcon action={activity.action} />
                                        <div>
                                            <p className="font-semibold">{activity.action}</p>
                                            {activity.details && (
                                                <p className="text-xs text-muted-foreground">{activity.details}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(activity.createdAt).toLocaleTimeString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            No activity has been recorded yet.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
