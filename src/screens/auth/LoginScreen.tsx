import { useState } from "react";
import { View, Text, Alert, Image, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";

// Schema Validation
const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or Phone is required"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginScreen({ navigation }: { navigation: NativeStackNavigationProp<AuthStackParamList> }) {
  // const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (values: LoginSchema) => {
    setLoading(true);
    const { emailOrPhone, password } = values;

    try {
      let email = emailOrPhone;
      
      // 1. Check if input is phone number
      if (/^\d+$/.test(emailOrPhone)) {
        const { data: workshop, error: findError } = await supabase
          .from("workshops")
          .select("email")
          .eq("phone", emailOrPhone)
          .single();

        if (findError || !workshop) {
          throw new Error("Workshop with this phone number not found.");
        }
        email = workshop.email || "";
      }

      // 2. Login to Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.user) {
        throw signInError || new Error("Login failed");
      }

      const userId = data.user.id;

      // 3. Check Workshop Account
      const { data: account, error: accountError } = await supabase
        .from("workshop_accounts")
        .select("*, workshops!workshop_accounts_workshop_id_fkey(*)")
        .eq("user_id", userId)
        .maybeSingle();

      if (account) {
        // Success - Auth State Listener in RootNavigator will handle redirect
        return; 
      }

      // 4. Check Mechanic Account
      const { data: mechanic, error: mechanicError } = await supabase
        .from("mechanics")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (mechanic) {
        if (!mechanic.is_active) {
            await supabase.auth.signOut(); // Force logout if inactive
            throw new Error("Your mechanic account is inactive. Contact the workshop owner.");
        }
        // Success
        return;
      }

      if (!account && !mechanic) {
          await supabase.auth.signOut();
          throw new Error("Account not found or not registered as workshop/mechanic.");
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      if (Platform.OS === 'web') {
        window.alert(error.message || "Please check your credentials.");
      } else {
        Alert.alert("Login Failed", error.message || "Please check your credentials.");
      }
      // If auth succeeded but role check failed, ensure we sign out so we don't get stuck
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
           await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          contentContainerClassName="flex-grow justify-center p-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6 items-center">
            {/* Logo Placeholder */}
            <Image 
              source={require('../../../assets/icon.png')} 
              style={{ width: 100, height: 100, borderRadius: 100, marginBottom: 16 }} // Added mb-4 equivalent
              resizeMode="contain"
            />
            <Text className="text-muted-foreground mt-1 text-center">
              Sign in to manage your workshop
            </Text>
          </View>

          <Card className="w-full max-w-sm mx-auto border-border/50 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <Controller
                control={control}
                name="emailOrPhone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email or Phone Number"
                    placeholder="name@example.com"
                    onBlur={onBlur}
                    onChangeText={(val) => {
                        clearErrors("emailOrPhone");
                        onChange(val);
                    }}
                    value={value}
                    error={errors.emailOrPhone?.message}
                    autoCapitalize="none"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={(val) => {
                        clearErrors("password");
                        onChange(val);
                    }}
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />

              <Button
                className="mt-2"
                onPress={handleSubmit(onLogin)}
                loading={loading}
                label="Sign In"
              />
            </CardContent>
          </Card>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-muted-foreground">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text className="text-primary font-bold">Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
