import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator } from "react-native";
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
import { Switch } from "react-native";

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
        
        setValue("price", data.price);
        setValue("duration_minutes", data.duration_minutes);
        setValue("is_available", data.is_available);
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
          .insert([{
             workshop_id: workshopId,
             service_id: masterServiceId,
             price: values.price,
             duration_minutes: values.duration_minutes,
             is_available: values.is_available
          }]);

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
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 border-b border-border/50 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-foreground">{isEditing ? "Edit Service" : "Add Service"}</Text>
        <Button variant="ghost" onPress={() => navigation.goBack()} disabled={saving}>
          <Text className="text-primary">Cancel</Text>
        </Button>
      </View>

      <ScrollView contentContainerClassName="p-6">
        <Card className="mb-6">
            <CardContent className="p-6">
                <Text className="text-base text-muted-foreground mb-1">Service Name</Text>
                <Text className="text-xl font-bold text-foreground mb-6">{serviceName}</Text>

                 <Controller
                    control={control}
                    name="price"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Your Price (Rp)"
                        keyboardType="numeric"
                        placeholder="e.g. 50000"
                        value={value?.toString()}
                        onChangeText={onChange}
                        error={errors.price?.message}
                        className="mb-4"
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
                        className="mb-4"
                      />
                    )}
                  />

                  <View className="flex-row items-center justify-between mt-2 mb-2 p-2 bg-muted/20 rounded-lg">
                      <Text className="font-medium text-foreground">Available for Booking</Text>
                      <Controller
                        control={control}
                        name="is_available"
                        render={({ field: { onChange, value } }) => (
                           <Switch
                                value={value}
                                onValueChange={onChange}
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
        >
            <Text className="text-primary-foreground font-semibold">
                {isEditing ? "Save Changes" : "Add to Workshop"}
            </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
