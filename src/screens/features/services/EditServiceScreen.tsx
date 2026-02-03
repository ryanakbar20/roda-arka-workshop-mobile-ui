import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../../lib/supabase";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { SelectInput } from "../../../components/ui/SelectInput";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";

const itemSchema = z.object({
  name: z.string().min(1, "Item name required"),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
});

const editServiceSchema = z.object({
  customerName: z.string().min(3, "Name required"),
  phone: z.string().min(10, "Phone required"),
  brand: z.string().min(1, "Brand required"),
  model: z.string().min(1, "Model required"),
  plate: z.string().min(3, "Plate required"),
  complaint: z.string().optional(),
  items: z.array(itemSchema).optional(),
});

type EditServiceSchema = z.infer<typeof editServiceSchema>;

const brandOptions = [
  "Toyota", "Honda", "Mitsubishi", "Suzuki", "Daihatsu",
  "Nissan", "BMW", "Mercedes", "Hyundai", "Kia", "Other"
].map(b => ({ label: b, value: b }));

type EditServiceRouteProp = RouteProp<HomeStackParamList, "ServiceDetail">; // Using ServiceDetail params structure which has serviceId

export default function EditServiceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<EditServiceRouteProp>();
  // We need serviceId passed to this screen. 
  // Assuming we might pass it or reuse ServiceDetail params.
  // Actually HomeStackParamList needs EditService route. I'll add it later or cast it.
  const serviceId = (route.params as any)?.serviceId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EditServiceSchema>({
    resolver: zodResolver(editServiceSchema),
    defaultValues: {
      items: [],
      customerName: "",
      phone: "",
      brand: "",
      model: "",
      plate: "",
      complaint: "",
    } as any,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    fetchServiceData();
  }, [serviceId]);

  const fetchServiceData = async () => {
    try {
        if (!serviceId) throw new Error("No Service ID");
        
        const { data, error } = await supabase
            .from("bookings")
            .select(`
                id, notes, service_details,
                profiles (full_name, phone),
                vehicles (plate_number, brands (name), models (name))
            `)
            .eq("id", serviceId)
            .single();
        
        if (error) throw error;

        // Parse Data safely checking for array or object
        const profileData = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        const vehicleData = Array.isArray(data.vehicles) ? data.vehicles[0] : data.vehicles;

        let customerName = profileData?.full_name ?? "";
        let phone = profileData?.phone ?? "";
        let plate = vehicleData?.plate_number ?? "";
        
        // Handle nested vehicle relations
        const brandData: any = vehicleData?.brands; 
        const modelData: any = vehicleData?.models; 
        
        let brand = (Array.isArray(brandData) ? brandData[0]?.name : brandData?.name) ?? "";
        let model = (Array.isArray(modelData) ? modelData[0]?.name : modelData?.name) ?? "";

        let items: any[] = [];

        if (!data.profiles && data.service_details?.offline_data) {
            const od = data.service_details.offline_data;
            customerName = od.customer_name || "";
            phone = od.phone || "";
            plate = od.plate || "";
            brand = od.brand || "";
            model = od.model || "";
        }

        if (data.service_details?.items && Array.isArray(data.service_details.items)) {
            items = data.service_details.items;
        } else if (Array.isArray(data.service_details)) {
            items = data.service_details;
        }

        reset({
            customerName,
            phone,
            plate,
            brand,
            model,
            complaint: data.notes || "",
            items,
        });

    } catch (err: any) {
        Alert.alert("Error", "Failed to load service data");
        navigation.goBack();
    } finally {
        setLoading(false);
    }
  };

  const onSubmit = async (values: EditServiceSchema) => {
    setSubmitting(true);
    try {
      const serviceDetails = {
        items: values.items || [],
        offline_data: {
          customer_name: values.customerName,
          phone: values.phone,
          brand: values.brand,
          model: values.model,
          plate: values.plate,
          estimated_price: values.items?.reduce((acc, curr) => acc + curr.price, 0) || 0
        }
      };

      const { error } = await supabase
        .from("bookings")
        .update({
            notes: values.complaint,
            service_details: serviceDetails,
        })
        .eq("id", serviceId);

      if (error) throw error;

      Alert.alert("Success", "Service updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
      
    } catch (error: any) {
      console.error("Update Error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
      return (
          <View className="flex-1 justify-center items-center bg-background">
              <ActivityIndicator size="large" color="#2563eb" />
          </View>
      )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-2 border-b border-border/50 flex-row items-center bg-background z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-2 text-foreground">Edit Service</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="p-6 pb-20">
          
          {/* Customer Info */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-4 text-primary">Customer Information</Text>
            <Controller
              control={control}
              name="customerName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                    label="Customer Name"
                    placeholder="John Doe"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.customerName?.message}
                    containerClassName="mb-3"
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                    label="Phone Number"
                    placeholder="0812..."
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.phone?.message}
                    containerClassName="mb-3"
                />
              )}
            />
          </View>

          {/* Vehicle Info */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-4 text-primary">Vehicle Information</Text>
            <Controller
                control={control}
                name="brand"
                render={({ field: { onChange, value } }) => (
                <SelectInput
                    label="Brand"
                    placeholder="Select Brand"
                    options={brandOptions}
                    value={value}
                    onChange={onChange}
                    error={errors.brand?.message}
                />
                )}
            />
            <View className="h-3" />
            <Controller
              control={control}
              name="model"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                    label="Model"
                    placeholder="Avanza, Civic, etc."
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.model?.message}
                    containerClassName="mb-3"
                />
              )}
            />
            <Controller
              control={control}
              name="plate"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                    label="License Plate"
                    placeholder="B 1234 ABC"
                    autoCapitalize="characters"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.plate?.message}
                    containerClassName="mb-3"
                />
              )}
            />
          </View>

           {/* Complaint */}
           <View className="mb-6">
            <Text className="text-base font-semibold mb-4 text-primary">Complaint / Notes</Text>
            <Controller
              control={control}
              name="complaint"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                    placeholder="Describe the issue..."
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={3}
                    className="h-24 py-2"
                    textAlignVertical="top"
                />
              )}
            />
          </View>

          {/* Service Items */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-base font-semibold text-primary">Service Items</Text>
                <TouchableOpacity onPress={() => append({ name: "", price: 0 })}>
                    <Text className="text-primary font-bold">+ Add Item</Text>
                </TouchableOpacity>
            </View>

            {fields.map((field, index) => (
                <View key={field.id} className="flex-row items-start mb-3 space-x-2">
                    <View className="flex-1">
                        <Controller
                            control={control}
                            name={`items.${index}.name`}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    placeholder="Item Name"
                                    onChangeText={onChange}
                                    value={value}
                                />
                            )}
                        />
                    </View>
                    <View className="w-24">
                         <Controller
                            control={control}
                            name={`items.${index}.price`}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    placeholder="Price"
                                    keyboardType="numeric"
                                    onChangeText={onChange}
                                    value={value?.toString()}
                                />
                            )}
                        />
                    </View>
                    <TouchableOpacity onPress={() => remove(index)} className="mt-3">
                        <Trash2 size={20} className="text-destructive" />
                    </TouchableOpacity>
                </View>
            ))}
            {fields.length === 0 && (
                <Text className="text-muted-foreground italic text-sm">No items added yet.</Text>
            )}
          </View>

          <Button 
            className="mt-4"
            label="Update Service"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
