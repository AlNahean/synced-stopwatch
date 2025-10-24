import { Feather } from '@expo/vector-icons';
import { Button, cn, useTheme } from 'heroui-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/app-text';
import { getStopwatchState, syncStopwatchAction } from '../../lib/api';

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

export default function StopwatchScreen() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [demoTimeIndex, setDemoTimeIndex] = useState(0);

    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchInitialState = async () => {
            try {
                const data: StopwatchState = await getStopwatchState();

                const elapsedTime = Number(data.elapsedTime);
                setIsRunning(data.isRunning);
                setLaps(data.laps.map(lap => Number(lap.time)));

                if (data.isRunning) {
                    const startTime = new Date(data.startTime).getTime();
                    const initialTime = (Date.now() - startTime);
                    setTime(initialTime);

                    timerRef.current = setInterval(() => {
                        setTime(Date.now() - startTime);
                    }, 10);
                } else {
                    setTime(elapsedTime);
                }
            } catch (error) {
                console.error("Failed to fetch initial state:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialState();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handleStartPause = useCallback(() => {
        setIsRunning((prevIsRunning) => {
            const newIsRunning = !prevIsRunning;
            if (newIsRunning) {
                const startTime = Date.now() - time;
                timerRef.current = setInterval(() => {
                    setTime(Date.now() - startTime);
                }, 10);
                syncStopwatchAction("start");
            } else {
                if (timerRef.current) clearInterval(timerRef.current);
                syncStopwatchAction("pause");
            }
            return newIsRunning;
        });
    }, [time]);

    const handleLap = useCallback(() => {
        if (isRunning) {
            setLaps((prevLaps) => [time, ...prevLaps]);
            syncStopwatchAction("lap", { currentTime: time });
        }
    }, [isRunning, time]);

    const handleReset = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTime(0);
        setLaps([]);
        setIsRunning(false);
        syncStopwatchAction("reset");
    }, []);

    const handleDemoButton = () => {
        const demoTimes = [
            3600000, // 1 hour
            36000000, // 10 hours
            360000000, // 100 hours
            0, // reset
        ];
        setTime(demoTimes[demoTimeIndex]!);
        setDemoTimeIndex((prevIndex) => (prevIndex + 1) % demoTimes.length);
        if (isRunning) {
            handleStartPause(); // Pause the timer
        }
        setLaps([]);
    };

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
                    <ActivityIndicator size="large" color={colors.foreground} />
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
                        variant={isRunning ? 'warning' : 'success'}
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
                {__DEV__ && (
                    <View className="items-center mb-8">
                        <Button variant="ghost" size="sm" onPress={handleDemoButton}>
                            <Button.Label>Demo Hour+</Button.Label>
                        </Button>
                    </View>
                )}
            </>
        );
    }, [time, isRunning, isLoading, handleStartPause, handleLap, handleReset, colors, demoTimeIndex]);

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
