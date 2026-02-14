import React, { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ChevronLeft } from "lucide-react-native";
import { ProfileStackParamList } from "../../navigation/types";
import { Card, CardContent } from "../../components/ui/Card";

// Schema
const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email"),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
});

type EditProfileSchema = z.infer<typeof editProfileSchema>;

type EditProfileRouteProp = RouteProp<ProfileStackParamList, "EditProfile">;

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const route = useRoute<EditProfileRouteProp>();
    // Initial values passed from ProfileScreen
    const { workshop } = route.params; 

    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<EditProfileSchema>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            name: workshop.name,
            description: workshop.description || "",
            phone: workshop.phone || "",
            email: workshop.email,
            address: workshop.address || "",
            city: workshop.city || "",
            province: workshop.province || "",
            postal_code: workshop.postal_code || "",
        },
    });

    const onSubmit = async (values: EditProfileSchema) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from("workshops")
                .update({
                    name: values.name,
                    description: values.description,
                    phone: values.phone,
                    email: values.email,
                    address: values.address,
                    city: values.city,
                    province: values.province,
                    postal_code: values.postal_code,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", workshop.id);

            if (error) throw error;
            Alert.alert("Success", "Profile updated successfully!");
            navigation.goBack();
        } catch (error: any) {
            console.error("Update profile error:", error);
            Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
             <View className="px-6 py-4 flex-row items-center bg-background border-b border-border/40">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-muted/10">
                    <ChevronLeft size={24} className="text-foreground" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-foreground ml-2">Edit Workshop Profile</Text>
            </View>
 
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "padding"} 
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <ScrollView contentContainerClassName="p-6 pb-20">
                    <Text className="text-sm text-muted-foreground mb-6">
                        Complete your workshop details to help customers find you more easily.
                    </Text>

                    <Card className="mb-8 overflow-hidden rounded-[24px]">
                        <CardContent className="p-6 space-y-5">
                            <Controller
                                control={control}
                                name="name"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Workshop Name"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.name?.message}
                                        placeholder="e.g. Master Auto Care"
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="description"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="About Workshop"
                                        value={value}
                                        onChangeText={onChange}
                                        multiline
                                        numberOfLines={3}
                                        className="h-24 text-top"
                                        placeholder="Tell customers about your specialties..."
                                    />
                                )}
                            />
                            
                            <View className="h-[1px] bg-border/40 my-2" />

                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Business Email"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.email?.message}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        placeholder="workshop@example.com"
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="phone"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Contact Number"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.phone?.message}
                                        keyboardType="phone-pad"
                                        placeholder="+62..."
                                    />
                                )}
                            />

                            <View className="h-[1px] bg-border/40 my-2" />

                            <Controller
                                control={control}
                                name="address"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Full Address"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.address?.message}
                                        multiline
                                        placeholder="Street name, number..."
                                    />
                                )}
                            />

                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                     <Controller
                                        control={control}
                                        name="city"
                                        render={({ field: { onChange, value } }) => (
                                            <Input
                                                label="City"
                                                value={value}
                                                onChangeText={onChange}
                                                placeholder="Jakarta"
                                            />
                                        )}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Controller
                                        control={control}
                                        name="province"
                                        render={({ field: { onChange, value } }) => (
                                            <Input
                                                label="Province"
                                                value={value}
                                                onChangeText={onChange}
                                                placeholder="DKI Jakarta"
                                            />
                                        )}
                                    />
                                </View>
                            </View>
                        </CardContent>
                    </Card>

                    <Button 
                        label="Save Workshop Profile" 
                        onPress={handleSubmit(onSubmit)} 
                        loading={loading}
                        size="lg"
                        className="rounded-2xl shadow-sm shadow-primary/20"
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
