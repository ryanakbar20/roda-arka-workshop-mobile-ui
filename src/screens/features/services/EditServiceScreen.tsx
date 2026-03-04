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
import { Card, CardContent } from "../../../components/ui/Card";
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
  items: z.array(itemSchema),
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
    resolver: zodResolver(editServiceSchema) as any,
    defaultValues: {
      items: [],
      customerName: "",
      phone: "",
      brand: "",
      model: "",
      plate: "",
      complaint: "",
    },
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

        const serviceDetails = data.service_details as any;

        if (!data.profiles && serviceDetails?.offline_data) {
            const od = serviceDetails.offline_data;
            customerName = od.customer_name || "";
            phone = od.phone || "";
            plate = od.plate || "";
            brand = od.brand || "";
            model = od.model || "";
        }

        if (serviceDetails?.items && Array.isArray(serviceDetails.items)) {
            items = serviceDetails.items;
        } else if (Array.isArray(serviceDetails)) {
            items = serviceDetails;
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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-6 py-4 flex-row items-center bg-background">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-muted/10">
            <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-2 text-foreground">Edit Booking Details</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          contentContainerClassName="p-6 pb-24"
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Info */}
          <View className="mb-8">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">Customer Information</Text>
            <Card className="rounded-[24px] border-border/40 shadow-sm shadow-black/5 overflow-hidden">
                <CardContent className="p-5">
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
                            containerClassName="mb-6"
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
                            containerClassName="mb-0"
                        />
                    )}
                    />
                </CardContent>
            </Card>
          </View>

          {/* Vehicle Info */}
          <View className="mb-8">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">Vehicle Information</Text>
            <Card className="rounded-[24px] border-border/40 shadow-sm shadow-black/5 overflow-hidden">
                <CardContent className="p-5">
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
                            containerClassName="mb-6"
                        />
                        )}
                    />
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
                            containerClassName="mb-6"
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
                            containerClassName="mb-0"
                        />
                    )}
                    />
                </CardContent>
            </Card>
          </View>

           {/* Complaint */}
           <View className="mb-8">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">Booking Notes / Complaint</Text>
            <Card className="rounded-[24px] border-border/40 shadow-sm shadow-black/5 overflow-hidden">
                <CardContent className="p-5">
                    <Controller
                    control={control}
                    name="complaint"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                            placeholder="Describe the issue or any special requests..."
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            multiline
                            numberOfLines={4}
                            className="h-28 py-3"
                            textAlignVertical="top"
                            containerClassName="mb-0"
                        />
                    )}
                    />
                </CardContent>
            </Card>
          </View>

          {/* Service Items */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-3 px-1">
                <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Service Items & Pricing</Text>
                <TouchableOpacity 
                    onPress={() => append({ name: "", price: 0 })}
                    className="bg-primary/10 px-4 py-2 rounded-xl active:bg-primary/20"
                >
                    <Text className="text-primary font-bold text-xs">+ Add Item</Text>
                </TouchableOpacity>
            </View>

            {fields.map((field, index) => (
                <Card key={field.id} className="mb-4 rounded-[24px] border-border/40 shadow-sm shadow-black/5 overflow-hidden">
                    <CardContent className="p-5">
                        <View className="flex-row items-start gap-4">
                            <View className="flex-1">
                                <Controller
                                    control={control}
                                    name={`items.${index}.name`}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            label="Item Name"
                                            placeholder="Service or part name"
                                            onChangeText={onChange}
                                            value={value}
                                            containerClassName="mb-6"
                                        />
                                    )}
                                />
                                <Controller
                                    control={control}
                                    name={`items.${index}.price`}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            label="Item Price (Rp)"
                                            placeholder="0"
                                            keyboardType="numeric"
                                            onChangeText={onChange}
                                            value={value?.toString()}
                                            containerClassName="mb-0"
                                            className="font-bold text-primary"
                                        />
                                    )}
                                />
                            </View>
                            <TouchableOpacity 
                                onPress={() => remove(index)} 
                                className="bg-destructive/10 p-3 rounded-2xl mt-8 active:bg-destructive/20"
                            >
                                <Trash2 size={20} className="text-destructive" />
                            </TouchableOpacity>
                        </View>
                    </CardContent>
                </Card>
            ))}
            {fields.length === 0 && (
                <Card className="rounded-[24px] border-dashed border-2 border-border/60 bg-transparent">
                    <CardContent className="p-10 items-center">
                        <Text className="text-muted-foreground italic text-sm text-center">
                            No service items added yet.{"\n"}Click "+ Add Item" to specify pricing.
                        </Text>
                    </CardContent>
                </Card>
            )}
          </View>

          <Button 
            className="rounded-2xl shadow-sm shadow-primary/20"
            size="lg"
            label="Save Booking Details"
            onPress={handleSubmit(onSubmit as any)}
            loading={submitting}
          />

          <View className="mt-6 bg-muted/30 p-4 rounded-2xl flex-row items-start">
            <Text className="text-[11px] text-muted-foreground leading-4 italic">
                * Note: These details are shared with the customer. Ensure pricing and item names are accurate before saving.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
