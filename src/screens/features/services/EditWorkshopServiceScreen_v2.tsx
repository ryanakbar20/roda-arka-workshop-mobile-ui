import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import { HomeStackParamList } from "../../../navigation/types";
import { Card, CardContent } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ChevronLeft } from "lucide-react-native";

const formSchema = z.object({
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  duration_minutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  is_available: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type ScreenRouteProp = RouteProp<HomeStackParamList, 'EditWorkshopService'>;

export default function EditWorkshopServiceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<ScreenRouteProp>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceName, setServiceName] = useState("");

  const { serviceId, masterServiceId, masterService } = route.params || {};
  const isEditing = !!serviceId;

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      price: 0,
      duration_minutes: 60,
      is_available: true,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (isEditing && serviceId) {
        const { data, error } = await supabase
          .from("workshop_services")
          .select(`
            price,
            duration_minutes,
            is_available,
            services (name)
          `)
          .eq("id", serviceId)
          .single();

        if (error) throw error;
        
        setValue("price", (data.price as number) ?? 0);
        setValue("duration_minutes", (data.duration_minutes as number) ?? 60);
        setValue("is_available", (data.is_available as boolean) ?? true);
        const services = data.services as any;
        const serviceName = Array.isArray(services) ? services[0]?.name : services?.name;
        setServiceName(serviceName || "Service");

      } else if (masterService) {
        setServiceName(masterService.name);
        setValue("price", masterService.base_price || 0);
        setValue("duration_minutes", masterService.duration_minutes || 60);
      }
    } catch (error) {
      console.error("Error loading service:", error);
      Alert.alert("Error", "Failed to load service details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setSaving(true);
      const workshopId = await getWorkshopId();
      
      if (isEditing) {
        const { error } = await supabase
          .from("workshop_services")
          .update({
             price: values.price,
             duration_minutes: values.duration_minutes,
             is_available: values.is_available
          })
          .eq("id", serviceId);

        if (error) throw error;
        Alert.alert("Success", "Service updated!", [
             { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        // Adding new service
        const { error } = await supabase
          .from("workshop_services")
          .insert({
             workshop_id: workshopId as string,
             service_id: masterServiceId as string,
             price: values.price,
             duration_minutes: values.duration_minutes,
             is_available: values.is_available
          });

         if (error) throw error;
         Alert.alert("Success", "Service added to workshop!", [
            { text: "OK", onPress: () => navigation.pop(2) } // Go back to List
         ]);
      }

    } catch (error: any) {
      console.error("Error saving service:", error);
      Alert.alert("Error", error.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-muted/10">
                <ChevronLeft size={24} className="text-foreground" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-foreground ml-2">{isEditing ? "Edit Service" : "Add Service"}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving} className="px-3 py-1 rounded-full active:bg-muted/10">
          <Text className="text-muted-foreground font-medium">Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerClassName="p-6 pb-24">
        <Card className="mb-8 overflow-hidden rounded-[24px] border-border/40 shadow-sm shadow-black/5">
            <CardContent className="p-6">
                <View className="mb-8">
                    <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Service Name</Text>
                    <View className="bg-muted/30 p-4 rounded-2xl border border-border/10">
                        <Text className="text-lg font-bold text-foreground">{serviceName}</Text>
                    </View>
                </View>

                 <Controller
                    control={control}
                    name="price"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Your Service Price (Rp)"
                        keyboardType="numeric"
                        placeholder="e.g. 50000"
                        value={value?.toString()}
                        onChangeText={onChange}
                        error={errors.price?.message}
                        containerClassName="mb-6"
                        className="font-bold text-primary"
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="duration_minutes"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Estimated Duration (Minutes)"
                        keyboardType="numeric"
                        placeholder="e.g. 60"
                        value={value?.toString()}
                        onChangeText={onChange}
                        error={errors.duration_minutes?.message}
                        containerClassName="mb-6"
                      />
                    )}
                  />

                  <View className="flex-row items-center justify-between mt-2 p-4 bg-muted/20 rounded-[20px] border border-border/10">
                      <View>
                        <Text className="font-bold text-foreground">Available for Booking</Text>
                        <Text className="text-[11px] text-muted-foreground mt-0.5">Allow customers to book this service</Text>
                      </View>
                      <Controller
                        control={control}
                        name="is_available"
                        render={({ field: { onChange, value } }) => (
                           <Switch
                                value={value}
                                onValueChange={onChange}
                                trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
                                thumbColor={value ? '#22c55e' : '#94a3b8'}
                                ios_backgroundColor="#e2e8f0"
                           />
                        )}
                      />
                  </View>
            </CardContent>
        </Card>

        <Button 
            size="lg" 
            onPress={handleSubmit(onSubmit)}
            loading={saving}
            className="rounded-2xl shadow-sm shadow-primary/20"
        >
            <Text className="text-primary-foreground font-bold text-base">
                {isEditing ? "Save Service Changes" : "Confirm & Add Service"}
            </Text>
        </Button>
        
        {!isEditing && (
            <Text className="text-center text-[11px] text-muted-foreground mt-4 px-8 leading-4">
                By adding this service, it will be visible to potential customers in your workshop profile.
            </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
