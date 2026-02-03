import React, { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { SelectInput } from "../../../components/ui/SelectInput";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import dayjs from "../../../lib/dayjs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";

// Schema
const itemSchema = z.object({
  name: z.string().min(1, "Item name required"),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
});

const addServiceSchema = z.object({
  customerName: z.string().min(3, "Name required"),
  phone: z.string().min(10, "Phone required"),
  brand: z.string().min(1, "Brand required"),
  model: z.string().min(1, "Model required"),
  plate: z.string().min(3, "Plate required"),
  complaint: z.string().optional(),
  items: z.array(itemSchema).optional(),
});

type AddServiceSchema = z.infer<typeof addServiceSchema>;

const brandOptions = [
  "Toyota", "Honda", "Mitsubishi", "Suzuki", "Daihatsu",
  "Nissan", "BMW", "Mercedes", "Hyundai", "Kia", "Other"
].map(b => ({ label: b, value: b }));

export default function AddServiceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<AddServiceSchema>({
    resolver: zodResolver(addServiceSchema),
    defaultValues: {
      items: [],
      customerName: "",
      phone: "",
      brand: "",
      model: "",
      plate: "",
      complaint: "",
    } as any, // Bypass strict type check for defaultValues inference
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = async (values: AddServiceSchema) => {
    setLoading(true);
    try {
      const workshopId = await getWorkshopId();
      if (!workshopId) throw new Error("Workshop ID not found");

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
        .insert([
          {
            workshop_id: workshopId,
            status: "accepted", // Auto-accept offline services
            booking_date: dayjs().format("YYYY-MM-DD"),
            booking_time: dayjs().format("HH:mm:ss"),
            notes: values.complaint,
            service_details: serviceDetails,
            // is_offline: true // Removing this as I'm not sure if the column exists in legacy schema, relying on json structure
          }
        ]);

      if (error) throw error;

      Alert.alert("Success", "Service added successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
      
    } catch (error: any) {
      console.error("Add Service Error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-2 border-b border-border/50 flex-row items-center bg-background z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-2 text-foreground">Add New Service</Text>
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
            label="Save Service"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
