import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../lib/supabase";
import { getWorkshopId } from "../../lib/utils";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Car, Rocket, ChevronLeft } from "lucide-react-native";

const formSchema = z.object({
  capacity_mobil: z.coerce.number().min(0, "Capacity must be 0 or more"),
  capacity_motor: z.coerce.number().min(0, "Capacity must be 0 or more"),
});

type FormValues = z.infer<typeof formSchema>;

export default function InputCapacityScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      capacity_mobil: 0,
      capacity_motor: 0,
    },
  });

  useEffect(() => {
    loadCapacity();
  }, []);

  const loadCapacity = async () => {
    try {
      const workshopId = await getWorkshopId();
      if (!workshopId) return;

      const { data, error } = await supabase
        .from("workshops")
        .select("capacity_mobil, capacity_motor")
        .eq("id", workshopId)
        .single();

      if (error) throw error;

      setValue("capacity_mobil", data.capacity_mobil ?? 0);
      setValue("capacity_motor", data.capacity_motor ?? 0);
    } catch (error) {
      console.error("Error loading capacity:", error);
      Alert.alert("Error", "Failed to load current capacities");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setSaving(true);
      const workshopId = await getWorkshopId();
      if (!workshopId) {
        Alert.alert("Error", "Workshop identification failed");
        return;
      }
      
      const { error } = await supabase
        .from("workshops")
        .update({
          capacity_mobil: values.capacity_mobil,
          capacity_motor: values.capacity_motor,
        })
        .eq("id", workshopId);

      if (error) throw error;

      Alert.alert("Success", "Capacities updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error updating capacity:", error);
      Alert.alert("Error", "Failed to update capacities");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-muted/10">
          <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-2">Capacity Planning</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView contentContainerClassName="p-6 pb-12">
        <Text className="text-sm text-muted-foreground mb-8">
            Define how many vehicles your workshop can handle daily to prevent overbooking.
        </Text>

        <View className="space-y-6">
            {/* Car Capacity Card */}
          <Card className="bg-blue-50/40 dark:bg-blue-900/5 border-blue-100 rounded-[24px] overflow-hidden">
            <CardContent className="p-6">
              <View className="flex-row items-center gap-4 mb-6">
                <View className="h-12 w-12 bg-blue-100 rounded-2xl items-center justify-center shadow-sm shadow-blue-200/50">
                  <Car size={24} className="text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground">Cars</Text>
                  <Text className="text-xs text-muted-foreground">Maximum daily bookings</Text>
                </View>
              </View>

              <Controller
                control={control}
                name="capacity_mobil"
                render={({ field: { onChange, value } }) => (
                  <Input
                    keyboardType="numeric"
                    placeholder="e.g. 10"
                    value={value?.toString()}
                    onChangeText={onChange}
                    error={errors.capacity_mobil?.message}
                    className="bg-card h-12 rounded-xl text-lg font-bold"
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Motorcycle Capacity Card */}
          <Card className="bg-orange-50/40 dark:bg-orange-900/5 border-orange-100 rounded-[24px] overflow-hidden">
            <CardContent className="p-6">
              <View className="flex-row items-center gap-4 mb-6">
                <View className="h-12 w-12 bg-orange-100 rounded-2xl items-center justify-center shadow-sm shadow-orange-200/50">
                  <Rocket size={24} className="text-orange-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground">Motorcycles</Text>
                  <Text className="text-xs text-muted-foreground">Maximum daily bookings</Text>
                </View>
              </View>

               <Controller
                control={control}
                name="capacity_motor"
                render={({ field: { onChange, value } }) => (
                  <Input
                    keyboardType="numeric"
                    placeholder="e.g. 20"
                    value={value?.toString()}
                    onChangeText={onChange}
                    error={errors.capacity_motor?.message}
                    className="bg-card h-12 rounded-xl text-lg font-bold"
                  />
                )}
              />
            </CardContent>
          </Card>

          <Button 
            className="mt-4 rounded-2xl shadow-sm shadow-primary/20" 
            size="lg" 
            onPress={handleSubmit(onSubmit)}
            loading={saving}
            label="Save Capacity Limits"
          />

          <View className="bg-muted/30 p-4 rounded-2xl flex-row items-start mt-4">
              <Text className="text-[11px] text-muted-foreground leading-4">
                  <Text className="font-bold">Pro Tip: </Text>
                  Keep your capacity updated based on available mechanics to ensure high-quality service and customer satisfaction.
              </Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
