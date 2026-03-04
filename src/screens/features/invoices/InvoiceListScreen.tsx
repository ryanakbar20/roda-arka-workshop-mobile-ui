import React, { useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import dayjs from "../../../lib/dayjs";
import { FileText, ChevronRight, DollarSign } from "lucide-react-native";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";

export default function InvoiceListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchInvoices = async () => {
        try {
            const workshopId = await getWorkshopId();
            if (!workshopId) return;

            // Fetch completed/active bookings as invoices
            const { data, error } = await supabase
                .from("bookings")
                .select(`
                    id,
                    status,
                    created_at,
                    booking_date,
                    service_details,
                    profiles (full_name)
                `)
                .eq("workshop_id", workshopId)
                .in("status", ["completed", "in_progress", "accepted"])
                .order("booking_date", { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
        } catch (error) {
            console.error("Fetch invoices error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchInvoices();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchInvoices();
    };

    const renderItem = ({ item }: { item: any }) => {
        const customerName = item.profiles?.full_name || "Guest";
        const date = dayjs(item.booking_date || item.created_at).format("D MMM YYYY");
        const invoiceNumber = `INV-${item.id.substring(0, 8).toUpperCase()}`;
        // Mock amount calculation if not in DB
        const amount = item.service_details?.price || item.service_details?.estimated_price || 150000; 
        
        return (
            <TouchableOpacity onPress={() => navigation.navigate("ServiceDetail", { serviceId: item.id })}>
                <Card className="mb-3 border-border/50">
                    <CardContent className="p-4 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View className="bg-primary/10 p-2 rounded-full mr-3">
                                <FileText size={20} className="text-primary" />
                            </View>
                            <View>
                                <Text className="font-bold text-foreground">{invoiceNumber}</Text>
                                <Text className="text-sm text-muted-foreground">{customerName} • {date}</Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="font-bold text-foreground">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)}
                            </Text>
                            <View className="mt-1">
                                <Badge variant={item.status === 'completed' ? 'success' : 'warning'}>
                                    {item.status === 'completed' ? 'Paid' : 'Unpaid'}
                                </Badge>
                            </View>
                        </View>
                    </CardContent>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
             <View className="px-5 py-4 border-b border-border/50 bg-background">
                <Text className="text-2xl font-bold text-foreground">Invoices</Text>
            </View>

            <FlatList
                data={invoices}
                keyExtractor={(item) => item.id}
                contentContainerClassName="p-4 safe-pb-20"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={renderItem}
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center justify-center py-20">
                            <Text className="text-muted-foreground">No invoices found.</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}
