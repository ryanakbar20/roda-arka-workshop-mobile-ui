import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Platform, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../../navigation/types';
import { supabase } from '../../../lib/supabase';
import { getWorkshopId } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import { ChevronLeft, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useColorScheme } from 'nativewind';
import { Card, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';

type DaySchedule = {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
};

type WeekSchedule = {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
};

// Database format uses capitalized day names
type DBDaySchedule = {
    open: string;
    close: string;
};

type DBWeekSchedule = {
    Monday?: DBDaySchedule;
    Tuesday?: DBDaySchedule;
    Wednesday?: DBDaySchedule;
    Thursday?: DBDaySchedule;
    Friday?: DBDaySchedule;
    Saturday?: DBDaySchedule;
    Sunday?: DBDaySchedule;
};

const DAYS = [
    { key: 'monday', label: 'Monday', dbKey: 'Monday' },
    { key: 'tuesday', label: 'Tuesday', dbKey: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday', dbKey: 'Wednesday' },
    { key: 'thursday', label: 'Thursday', dbKey: 'Thursday' },
    { key: 'friday', label: 'Friday', dbKey: 'Friday' },
    { key: 'saturday', label: 'Saturday', dbKey: 'Saturday' },
    { key: 'sunday', label: 'Sunday', dbKey: 'Sunday' },
] as const;

const DEFAULT_SCHEDULE: WeekSchedule = {
    monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    saturday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    sunday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
};

export default function ManageOperatingHoursScreen() {
    const { colorScheme } = useColorScheme();
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
    const [showPicker, setShowPicker] = useState<{ day: string; type: 'open' | 'close' } | null>(null);
    const [tempTime, setTempTime] = useState(new Date());

    useEffect(() => {
        fetchOperatingHours();
    }, []);

    const fetchOperatingHours = async () => {
        try {
            const workshopId = await getWorkshopId();
            if (!workshopId) return;

            const { data, error } = await supabase
                .from('workshops')
                .select('opening_hours')
                .eq('id', workshopId)
                .single();

            if (error) {
                console.error("Error fetching hours:", error);
                setSchedule(DEFAULT_SCHEDULE);
                return;
            }

            if (data && data.opening_hours) {
                // Convert DB format to app format
                const dbSchedule = data.opening_hours as DBWeekSchedule;
                const appSchedule: WeekSchedule = {
                    monday: dbSchedule.Monday 
                        ? { isOpen: true, openTime: dbSchedule.Monday.open, closeTime: dbSchedule.Monday.close }
                        : { isOpen: false, openTime: '08:00', closeTime: '17:00' },
                    tuesday: dbSchedule.Tuesday 
                        ? { isOpen: true, openTime: dbSchedule.Tuesday.open, closeTime: dbSchedule.Tuesday.close }
                        : { isOpen: false, openTime: '08:00', closeTime: '17:00' },
                    wednesday: dbSchedule.Wednesday 
                        ? { isOpen: true, openTime: dbSchedule.Wednesday.open, closeTime: dbSchedule.Wednesday.close }
                        : { isOpen: false, openTime: '08:00', closeTime: '17:00' },
                    thursday: dbSchedule.Thursday 
                        ? { isOpen: true, openTime: dbSchedule.Thursday.open, closeTime: dbSchedule.Thursday.close }
                        : { isOpen: false, openTime: '08:00', closeTime: '17:00' },
                    friday: dbSchedule.Friday 
                        ? { isOpen: true, openTime: dbSchedule.Friday.open, closeTime: dbSchedule.Friday.close }
                        : { isOpen: false, openTime: '08:00', closeTime: '17:00' },
                    saturday: dbSchedule.Saturday 
                        ? { isOpen: true, openTime: dbSchedule.Saturday.open, closeTime: dbSchedule.Saturday.close }
                        : { isOpen: false, openTime: '08:00', closeTime: '17:00' },
                    sunday: dbSchedule.Sunday 
                        ? { isOpen: true, openTime: dbSchedule.Sunday.open, closeTime: dbSchedule.Sunday.close }
                        : { isOpen: false, openTime: '08:00', closeTime: '17:00' },
                };
                setSchedule(appSchedule);
            } else {
                setSchedule(DEFAULT_SCHEDULE);
            }
        } catch (error) {
            console.error("Fetch Operating Hours Error:", error);
            setSchedule(DEFAULT_SCHEDULE);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Validate: opening time must be before closing time for open days
            for (const day of DAYS) {
                const daySchedule = schedule[day.key];
                if (daySchedule.isOpen) {
                    const openMinutes = parseInt(daySchedule.openTime.split(':')[0]) * 60 + parseInt(daySchedule.openTime.split(':')[1]);
                    const closeMinutes = parseInt(daySchedule.closeTime.split(':')[0]) * 60 + parseInt(daySchedule.closeTime.split(':')[1]);
                    
                    if (openMinutes >= closeMinutes) {
                        Alert.alert("Invalid Hours", `${day.label}: Opening time must be before closing time.`);
                        return;
                    }
                }
            }

            setSaving(true);
            const workshopId = await getWorkshopId();
            if (!workshopId) return;

            // Convert app format to DB format
            const dbSchedule: DBWeekSchedule = {};
            DAYS.forEach(day => {
                const daySchedule = schedule[day.key];
                if (daySchedule.isOpen) {
                    dbSchedule[day.dbKey] = {
                        open: daySchedule.openTime,
                        close: daySchedule.closeTime,
                    };
                }
                // If closed, don't include in the object (or you could set it to null)
            });

            const { error } = await supabase
                .from('workshops')
                .update({ 
                    opening_hours: dbSchedule,
                })
                .eq('id', workshopId);

            if (error) throw error;

            Alert.alert("Success", "Operating hours updated successfully");
            navigation.goBack();

        } catch (error: any) {
            console.error("Save Error:", error);
            Alert.alert("Error", "Failed to update operating hours: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleDayOpen = (day: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day as keyof WeekSchedule],
                isOpen: !prev[day as keyof WeekSchedule].isOpen,
            }
        }));
    };

    const openTimePicker = (day: string, type: 'open' | 'close') => {
        const daySchedule = schedule[day as keyof WeekSchedule];
        const timeString = type === 'open' ? daySchedule.openTime : daySchedule.closeTime;
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = dayjs().set('hour', hours).set('minute', minutes).toDate();
        setTempTime(date);
        setShowPicker({ day, type });
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(null);
        }
        
        if (selectedDate && showPicker) {
            const timeString = dayjs(selectedDate).format('HH:mm');
            const { day, type } = showPicker;
            
            setSchedule(prev => ({
                ...prev,
                [day]: {
                    ...prev[day as keyof WeekSchedule],
                    [type === 'open' ? 'openTime' : 'closeTime']: timeString,
                }
            }));

            if (Platform.OS === 'ios') {
                setTempTime(selectedDate);
            }
        }
    };

    const confirmIOSTime = () => {
        setShowPicker(null);
    };

    const renderDayCard = (day: typeof DAYS[number]) => {
        const daySchedule = schedule[day.key];
        const isOpen = daySchedule.isOpen;

        return (
            <Card key={day.key} className="mb-4 overflow-hidden rounded-[24px] border-border/40 shadow-sm shadow-black/5">
                <CardContent className="p-5">
                    {/* Day Header with Toggle */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <View className={cn("h-2 w-2 rounded-full mr-3", isOpen ? "bg-green-500" : "bg-muted-foreground/30")} />
                            <Text className="text-base font-bold text-foreground">{day.label}</Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                            <Text className={cn("text-xs font-bold uppercase tracking-wider", isOpen ? "text-green-600" : "text-muted-foreground/60")}>
                                {isOpen ? 'Open' : 'Closed'}
                            </Text>
                            <Switch
                                value={isOpen}
                                onValueChange={() => toggleDayOpen(day.key)}
                                trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
                                thumbColor={isOpen ? '#22c55e' : '#94a3b8'}
                                ios_backgroundColor="#e2e8f0"
                            />
                        </View>
                    </View>

                    {/* Time Pickers - Only show if day is open */}
                    {isOpen && (
                        <View className="flex-row gap-4">
                            {/* Opening Time */}
                            <View className="flex-1">
                                <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Opens at</Text>
                                <TouchableOpacity 
                                    onPress={() => openTimePicker(day.key, 'open')}
                                    className="flex-row items-center justify-between px-4 py-3 bg-muted/20 rounded-xl border border-border/20"
                                >
                                    <Text className="text-base font-bold text-foreground">{daySchedule.openTime}</Text>
                                    <Clock size={16} className="text-muted-foreground" />
                                </TouchableOpacity>
                            </View>

                            {/* Closing Time */}
                            <View className="flex-1">
                                <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Closes at</Text>
                                <TouchableOpacity 
                                    onPress={() => openTimePicker(day.key, 'close')}
                                    className="flex-row items-center justify-between px-4 py-3 bg-muted/20 rounded-xl border border-border/20"
                                >
                                    <Text className="text-base font-bold text-foreground">{daySchedule.closeTime}</Text>
                                    <Clock size={16} className="text-muted-foreground" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            <View className="px-6 py-4 flex-row items-center">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-muted/10">
                    <ChevronLeft size={24} className="text-foreground" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-foreground ml-2">Operating Hours</Text>
            </View>

            <ScrollView contentContainerClassName="p-6 pb-24">
                <Text className="text-sm text-muted-foreground mb-8">
                    Specify when your workshop is open for bookings. Customers will only be able to schedule services during these hours.
                </Text>

                {/* Day Cards */}
                {DAYS.map(day => renderDayCard(day))}

                <Button 
                    label={saving ? "Saving Changes..." : "Save Operating Hours"}
                    onPress={handleSave}
                    disabled={saving || loading}
                    size="lg"
                    className="mt-4 rounded-2xl shadow-sm shadow-primary/20"
                />
                
                <View className="bg-muted/30 p-4 rounded-2xl flex-row items-start mt-6">
                    <Text className="text-[11px] text-muted-foreground leading-4 italic">
                        * Note: Changes to operating hours will apply to all future booking slots. Ongoing bookings are not affected.
                    </Text>
                </View>
            </ScrollView>

            {/* Time Picker Modal */}
            {showPicker && (
                Platform.OS === 'ios' ? (
                    <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-6 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-foreground">
                                Select {showPicker.type === 'open' ? 'Opening' : 'Closing'} Time
                            </Text>
                            <TouchableOpacity onPress={confirmIOSTime} className="bg-primary/10 px-4 py-2 rounded-xl">
                                <Text className="text-primary font-bold">Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={tempTime}
                            mode="time"
                            is24Hour={true}
                            display="spinner"
                            onChange={handleTimeChange}
                            textColor={colorScheme === 'dark' ? '#ffffff' : '#0f172a'}
                        />
                    </View>
                ) : (
                    <DateTimePicker
                        value={tempTime}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={handleTimeChange}
                    />
                )
            )}
        </SafeAreaView>
    );
}
