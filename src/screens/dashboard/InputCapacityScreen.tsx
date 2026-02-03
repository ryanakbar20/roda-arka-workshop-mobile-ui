import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
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
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 border-b border-border/50 flex-row items-center space-x-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 rounded-full active:bg-muted/10">
          <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-foreground">Capacity Planning</Text>
      </View>

      <ScrollView contentContainerClassName="p-6">
        <Text className="text-muted-foreground mb-6">
          Manage your daily service limits for cars and motorcycles.
        </Text>

        <View className="gap-6">
            {/* Car Capacity Card */}
          <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50">
            <CardContent className="p-6">
              <View className="flex-row items-center gap-4 mb-4">
                <View className="p-3 bg-blue-100 rounded-xl">
                  <Car size={24} className="text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg font-semibold text-foreground">Car Capacity</Text>
                  <Text className="text-sm text-muted-foreground">Daily limit for cars</Text>
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
                    className="bg-background"
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Motorcycle Capacity Card */}
          <Card className="bg-orange-50/50 dark:bg-orange-900/10 border-orange-200/50">
            <CardContent className="p-6">
              <View className="flex-row items-center gap-4 mb-4">
                <View className="p-3 bg-orange-100 rounded-xl">
                  <Rocket size={24} className="text-orange-600" />
                </View>
                <View>
                  <Text className="text-lg font-semibold text-foreground">Motorcycle Capacity</Text>
                  <Text className="text-sm text-muted-foreground">Daily limit for motorcycles</Text>
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
                    className="bg-background"
                  />
                )}
              />
            </CardContent>
          </Card>

          <Button 
            className="mt-4" 
            size="lg" 
            onPress={handleSubmit(onSubmit)}
            loading={saving}
          >
            <Text className="text-primary-foreground font-semibold">Save Changes</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
