import { Feather } from '@expo/vector-icons';
import { Button, cn, useTheme } from 'heroui-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/app-text';
import { getStopwatchState } from '../../lib/api';
import io, { Socket } from 'socket.io-client';

type Lap = {
    id: string;
    time: string;
};

type StopwatchState = {
    isRunning: boolean;
    startTime: string;
    elapsedTime: string;
    laps: Lap[];
};

const formatTime = (time: number) => {
    const milliseconds = Math.floor((time % 1000) / 10);
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor(time / (1000 * 60 * 60));

    const minutesString = minutes.toString().padStart(2, '0');
    const secondsString = seconds.toString().padStart(2, '0');
    const millisecondsString = milliseconds.toString().padStart(2, '0');

    if (hours > 0) {
        const hoursString = hours.toString().padStart(2, '0');
        return `${hoursString}:${minutesString}:${secondsString}`;
    }

    return `${minutesString}:${secondsString}.${millisecondsString}`;
};

// IMPORTANT: Replace with your local IP address
const SOCKET_URL = 'http://YOUR_LOCAL_IP:3000';
let socket: Socket;

export default function StopwatchScreen() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const updateStateFromServer = (data: StopwatchState) => {
        if (timerRef.current) clearInterval(timerRef.current);

        const elapsedTime = Number(data.elapsedTime);
        setIsRunning(data.isRunning);
        setLaps(data.laps.map(lap => Number(lap.time)));

        if (data.isRunning) {
            const startTime = new Date(data.startTime).getTime();
            const initialTime = Date.now() - startTime;
            setTime(initialTime);

            timerRef.current = setInterval(() => {
                setTime(Date.now() - startTime);
            }, 10);
        } else {
            setTime(elapsedTime);
        }
    };

    useEffect(() => {
        socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to WebSocket server from React Native');
        });

        socket.on('state_update', (data: StopwatchState) => {
            updateStateFromServer(data);
        });

        const fetchInitialState = async () => {
            try {
                const data: StopwatchState = await getStopwatchState();
                updateStateFromServer(data);
            } catch (error) {
                console.error("Failed to fetch initial state:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialState();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (socket) socket.disconnect();
        };
    }, []);

    const handleStartPause = useCallback(() => {
        setIsRunning(prev => {
            const newIsRunning = !prev;
            if (newIsRunning) {
                const startTime = Date.now() - time;
                timerRef.current = setInterval(() => {
                    setTime(Date.now() - startTime);
                }, 10);
                socket.emit("action", { action: "start" });
            } else {
                if (timerRef.current) clearInterval(timerRef.current);
                socket.emit("action", { action: "pause" });
            }
            return newIsRunning;
        });
    }, [time]);

    const handleLap = useCallback(() => {
        if (isRunning) {
            setLaps((prevLaps) => [time, ...prevLaps]);
            socket.emit("action", { action: "lap", currentTime: time });
        }
    }, [isRunning, time]);

    const handleReset = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTime(0);
        setLaps([]);
        setIsRunning(false);
        socket.emit("action", { action: "reset" });
    }, []);

    const renderLap = useCallback(
        ({ item, index }: { item: number; index: number }) => {
            const previousLap = laps[index + 1] || 0;
            const lapTime = item - previousLap;

            return (
                <View className="flex-row justify-between items-center py-3 px-4 border-b border-divider">
                    <AppText className="text-lg text-muted-foreground">
                        Lap {laps.length - index}
                    </AppText>
                    <AppText className="text-lg text-foreground tabular-nums">
                        {formatTime(lapTime)}
                    </AppText>
                </View>
            );
        },
        [laps]
    );

    const ListHeaderComponent = useMemo(() => {
        const isHourReached = time >= 3600000;
        if (isLoading) {
            return (
                <View className="items-center justify-center pt-16 pb-8 h-[300px]">
                    <Feather name="loader" size={48} color={colors.foreground} className="animate-spin" />
                </View>
            )
        }
        return (
            <>
                <View className="items-center justify-center pt-16 pb-8">
                    <AppText
                        className={cn(
                            'font-bold text-foreground tabular-nums',
                            isHourReached ? 'text-7xl' : 'text-8xl'
                        )}
                    >
                        {formatTime(time)}
                    </AppText>
                </View>
                <View className="w-full flex-row justify-around items-center my-8 px-4">
                    <Button
                        variant="tertiary"
                        className="w-20 h-20 rounded-full"
                        onPress={handleReset}
                        disabled={time === 0 && !isRunning}
                    >
                        <Feather
                            name="rotate-ccw"
                            size={24}
                            color={
                                time === 0 && !isRunning
                                    ? colors.mutedForeground
                                    : colors.foreground
                            }
                        />
                    </Button>
                    <Button
                        variant="warning"
                        className="w-28 h-28 rounded-full"
                        onPress={handleStartPause}
                    >
                        <Feather name={isRunning ? 'pause' : 'play'} size={32} color="white" />
                    </Button>
                    <Button
                        variant="tertiary"
                        className="w-20 h-20 rounded-full"
                        onPress={handleLap}
                        disabled={!isRunning || time === 0}
                    >
                        <Feather
                            name="flag"
                            size={24}
                            color={
                                !isRunning || time === 0
                                    ? colors.mutedForeground
                                    : colors.foreground
                            }
                        />
                    </Button>
                </View>
            </>
        );
    }, [time, isRunning, isLoading, handleStartPause, handleLap, handleReset, colors]);

    return (
        <View
            className="flex-1 bg-background"
            style={{
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
            }}
        >
            <FlatList
                data={laps}
                keyExtractor={(_item, index) => index.toString()}
                renderItem={renderLap}
                ListHeaderComponent={ListHeaderComponent}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}
