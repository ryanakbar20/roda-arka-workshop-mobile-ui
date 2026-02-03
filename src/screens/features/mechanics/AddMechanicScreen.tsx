import React, { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ChevronLeft } from "lucide-react-native";

// Schema
const addMechanicSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  experience_years: z.string().optional(), // Input as string, convert to number
  specializations: z.string().optional(), // Comma separated string
});

type AddMechanicSchema = z.infer<typeof addMechanicSchema>;

export default function AddMechanicScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<AddMechanicSchema>({
        resolver: zodResolver(addMechanicSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            phone: "",
            experience_years: "",
            specializations: "",
        },
    });

    const onSubmit = async (values: AddMechanicSchema) => {
        setLoading(true);
        try {
            const workshopId = await getWorkshopId();
            if (!workshopId) throw new Error("Workshop ID not found");

            // Secondary client for Auth
            const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
            const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error("Supabase config missing");
            }

            const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                },
            });

            // 1. Sign Up
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.name,
                        role: 'mechanic',
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Failed to create user");

            // 2. Insert Profile
            const { error: insertError } = await supabase.from("mechanics").insert({
                id: authData.user.id,
                workshop_id: workshopId,
                name: values.name,
                email: values.email,
                phone: values.phone,
                experience_years: values.experience_years ? parseInt(values.experience_years) : 0,
                specializations: values.specializations ? values.specializations.split(",").map(s => s.trim()) : [],
                is_active: true,
            });

            if (insertError) throw insertError;

            Alert.alert("Success", "Mechanic added successfully!");
            navigation.goBack();
        } catch (error: any) {
            console.error("Add mechanic error:", error);
            Alert.alert("Error", error.message || "Failed to add mechanic");
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
                <Text className="text-lg font-bold ml-2 text-foreground">Add Mechanic</Text>
            </View>
            
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                <ScrollView contentContainerClassName="p-6">
                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Full Name"
                                placeholder="John Doe"
                                value={value}
                                onChangeText={onChange}
                                error={errors.name?.message}
                            />
                        )}
                    />
                    
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Email"
                                placeholder="mechanic@example.com"
                                value={value}
                                onChangeText={onChange}
                                error={errors.email?.message}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Password"
                                placeholder="******"
                                secureTextEntry
                                value={value}
                                onChangeText={onChange}
                                error={errors.password?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="phone"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Phone Number"
                                placeholder="0812..."
                                value={value}
                                onChangeText={onChange}
                                keyboardType="phone-pad"
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="experience_years"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Experience (Years)"
                                placeholder="5"
                                value={value}
                                onChangeText={onChange}
                                keyboardType="numeric"
                            />
                        )}
                    />

                     <Controller
                        control={control}
                        name="specializations"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Specializations (comma separated)"
                                placeholder="Engine, Tire, Oil Change"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />

                    <Button 
                        label="Add Mechanic" 
                        onPress={handleSubmit(onSubmit)} 
                        loading={loading}
                        className="mt-6"
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

import { TouchableOpacity } from "react-native";
