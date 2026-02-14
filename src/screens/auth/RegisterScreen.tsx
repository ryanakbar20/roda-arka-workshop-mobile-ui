import { useState, useMemo, useEffect } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { SelectInput } from "../../components/ui/SelectInput";
import { Card, CardContent } from "../../components/ui/Card";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { ChevronLeft, CheckCircle2, Check } from "lucide-react-native";
import { cn } from "../../lib/utils";
import regionsData from "../../constants/indonesia-regions.json";

// Enhanced validation schema
const registerSchema = z.object({
  // STEP 1: Account Info
  workshopName: z.string()
    .min(3, "Workshop name must be at least 3 characters")
    .max(100, "Workshop name is too long"),
  phone: z.string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, "Invalid phone number (e.g., 081234567890)"),
  email: z.string()
    .email("Invalid email address")
    .toLowerCase(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
  
  // STEP 2: Workshop Details
  specialistType: z.string().min(1, "Please select a specialist type"),
  supportedBrands: z.array(z.string()).min(1, "Select at least one brand"),
  address: z.string().min(20, "Please provide a complete address"),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "Province is required"),
  termsAccepted: z.boolean().refine(v => v === true, "You must accept terms & conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterSchema = z.infer<typeof registerSchema>;

const brandOptions = [
  "Toyota", "Honda", "Mitsubishi", "Suzuki", "Daihatsu",
  "Nissan", "BMW", "Mercedes", "Hyundai", "Kia",
].map(b => ({ label: b, value: b }));

const specialistOptions = [
  { label: "General Workshop", value: "general" },
  { label: "Body Repair", value: "body_repair" },
  { label: "AC Specialist", value: "ac_specialist" },
  { label: "Electrical Specialist", value: "electrical_specialist" },
];

const provinceOptions = regionsData.map(p => ({ label: p.name, value: p.name }));

export default function RegisterScreen({ navigation }: { navigation: NativeStackNavigationProp<AuthStackParamList> }) {
  // const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      workshopName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      specialistType: "",
      supportedBrands: [],
      address: "",
      city: "",
      province: "DKI Jakarta",
      termsAccepted: false,
    },
    shouldUnregister: false,
  });

  const watchedProvince = watch("province");

  const cityOptions = useMemo(() => {
    const province = regionsData.find(p => p.name === watchedProvince);
    if (!province) return [];
    return province.cities.map(c => ({ label: c.name, value: c.name }));
  }, [watchedProvince]);

  // Reset city when province changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "province") {
        setValue("city", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const nextStep = async () => {
    const isStep1Valid = await trigger(["workshopName", "phone", "email", "password", "confirmPassword"]);
    if (isStep1Valid) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const onRegister = async (values: RegisterSchema) => {
    setLoading(true);
    setRegistrationStep("Checking availability...");
    
    const { email, password, workshopName, phone, address, city, province, specialistType, supportedBrands } = values;

    try {
      // 1. Check email uniqueness first using database function
      const { data: emailExists, error: rpcError } = await supabase
        .rpc("check_email_exists", { email_check: email });
      
      if (rpcError) {
        // Fallback to manual check if RPC fails
        const { data: existingWorkshops } = await supabase
          .from("workshops")
          .select("email")
          .eq("email", email);
        
        if (existingWorkshops && existingWorkshops.length > 0) {
          setError("email", { message: "Email already registered" });
          setCurrentStep(1);
          throw new Error("Email already registered");
        }
      } else if (emailExists) {
        setError("email", { message: "Email already registered" });
        setCurrentStep(1);
        throw new Error("Email already registered");
      }

      // 2. Sign up user
      setRegistrationStep("Creating your account...");
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            workshop_name: workshopName,
            phone: phone,
            user_type: "workshop",
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("User creation failed");

      // 3. Insert Workshop (owner_id is null initially to break circular dependency)
      setRegistrationStep("Setting up your workshop...");
      const { data: workshop, error: workshopError } = await supabase
        .from("workshops")
        .insert([
          {
            name: workshopName,
            email,
            phone,
            address,
            city,
            province,
            supported_brands: supportedBrands,
            specialist_type: specialistType,
            is_active: false,
            status: "pending",
            status_approval: "PENDING",
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (workshopError) {
        console.error("Workshop creation failed:", workshopError);
        throw new Error("Failed to create workshop record. Please try again.");
      }
      
      if (!workshop) throw new Error("Failed to create workshop");

      // 4. Create Workshop Account
      setRegistrationStep("Finalizing...");
      const { data: account, error: accountError } = await supabase
        .from("workshop_accounts")
        .insert([
          {
            user_id: user.id,
            workshop_id: workshop.id,
            role: "workshop_owner",
            is_active: true,
          },
        ])
        .select()
        .single();

      if (accountError) {
        // Rollback attempt
        await supabase.from("workshops").delete().eq("id", workshop.id);
        throw new Error("Failed to link workshop account.");
      }

      // 5. Update Workshop with owner_id now that the account record exists
      if (account) {
        await supabase
          .from("workshops")
          .update({ owner_id: account.id })
          .eq("id", workshop.id);
      }

      // Success!
      setShowSuccess(true);
      setRegistrationStep("");
      
      // Removed auto-redirect to let user see success state and have option to Resend Email
      // setTimeout(() => {
      //   navigation.navigate("Login");
      // }, 3000);

    } catch (error: any) {
      console.error("Register Error:", error);
      Alert.alert("Registration Failed", error.message);
      setRegistrationStep("");
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    const email = watch("email");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      Alert.alert("Sent", "New verification link has been sent to your email.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row items-center justify-center mb-6 space-x-2">
      <View className={cn(
        "h-2 w-12 rounded-full",
        currentStep === 1 ? "bg-primary" : "bg-primary/20"
      )} />
      <View className={cn(
        "h-2 w-12 rounded-full",
        currentStep === 2 ? "bg-primary" : "bg-primary/20"
      )} />
    </View>
  );

  if (showSuccess) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <CheckCircle2 size={80} className="text-green-600 mb-6" />
        <Text className="text-2xl font-bold text-foreground mb-2">Check Your Email!</Text>
        <Text className="text-center text-muted-foreground mb-8 px-4">
          We've sent a verification link to <Text className="font-bold text-foreground">{watch("email")}</Text>. Please verify your account before logging in.
        </Text>
        
        <View className="w-full space-y-3 px-4">
          <Button 
            label="Go to Login" 
            onPress={() => navigation.navigate("Login")} 
            className="w-full"
          />
          <Button 
            label={loading ? "Resending..." : "Resend Verification Email"} 
            onPress={resendEmail} 
            variant="outline" 
            className="w-full"
            disabled={loading}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View className="px-4 py-2 border-b border-border/50 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => currentStep === 2 ? prevStep() : navigation.goBack()} className="p-2 -ml-2" disabled={loading}>
              <ChevronLeft size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-bold ml-2 text-foreground">
            {currentStep === 1 ? "Account Setup" : "Workshop Details"}
          </Text>
        </View>
        <Text className="text-sm font-medium text-muted-foreground">Step {currentStep} of 2</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView contentContainerClassName="p-6 pb-20">
          {renderStepIndicator()}

          {loading && registrationStep && (
            <View className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <Text className="text-center text-sm text-primary font-medium animate-pulse">{registrationStep}</Text>
            </View>
          )}

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              {/* STEP 1 */}
              <View className={cn("space-y-4", currentStep !== 1 && "hidden")}>
                <Controller
                  control={control}
                  name="workshopName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                        label="Workshop Name"
                        placeholder="Bengkel Jaya Motor"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.workshopName?.message}
                        editable={!loading}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                        label="Phone Number"
                        placeholder="081234567890"
                        keyboardType="phone-pad"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.phone?.message}
                        editable={!loading}
                    />
                  )}
                />

                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                        label="Email"
                        placeholder="workshop@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.email?.message}
                        editable={!loading}
                    />
                    )}
                />

                <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                        label="Password"
                        placeholder="Min 8 characters, 1 uppercase, 1 number"
                        secureTextEntry
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.password?.message}
                        editable={!loading}
                    />
                    )}
                />

                <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                        label="Confirm Password"
                        placeholder="Re-enter password"
                        secureTextEntry
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.confirmPassword?.message}
                        editable={!loading}
                    />
                    )}
                />

                <Button
                    className="mt-6"
                    label="Next: Workshop Details"
                    onPress={nextStep}
                    disabled={loading}
                />
              </View>

              {/* STEP 2 */}
              <View className={cn("space-y-4", currentStep !== 2 && "hidden")}>
                <Controller
                  control={control}
                  name="specialistType"
                  render={({ field: { onChange, value } }) => (
                    <SelectInput
                      label="Specialist Type"
                      placeholder="Select Type"
                      options={specialistOptions}
                      value={value}
                      onChange={onChange}
                      error={errors.specialistType?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name="supportedBrands"
                  render={({ field: { onChange, value } }) => (
                    <SelectInput
                      label="Supported Brands"
                      placeholder="Select Brands"
                      options={brandOptions}
                      value={value}
                      onChange={onChange}
                      multiple
                      error={errors.supportedBrands?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Address"
                      placeholder="Full workshop address..."
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.address?.message}
                      multiline
                      numberOfLines={3}
                      className="h-24 py-2"
                      textAlignVertical="top"
                      editable={!loading}
                    />
                  )}
                />

                <View className="flex-col space-y-3">
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="province"
                      render={({ field: { onChange, value } }) => (
                        <SelectInput
                          label="Province"
                          placeholder="Select Province"
                          options={provinceOptions}
                          value={value}
                          onChange={onChange}
                          error={errors.province?.message}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="city"
                      render={({ field: { onChange, value } }) => (
                        <SelectInput
                          label="City"
                          placeholder={watchedProvince ? "Select City" : "Select Province First"}
                          options={cityOptions}
                          value={value}
                          onChange={onChange}
                          error={errors.city?.message}
                          disabled={!watchedProvince || cityOptions.length === 0}
                        />
                      )}
                    />
                  </View>
                </View>

                <Controller
                  control={control}
                  name="termsAccepted"
                  render={({ field: { onChange, value } }) => (
                    <View className="space-y-1 mt-4">
                      <TouchableOpacity 
                        onPress={() => onChange(!value)}
                        className="flex-row items-center space-x-3"
                        activeOpacity={0.7}
                      >
                        <View className={cn(
                          "h-5 w-5 rounded border items-center justify-center",
                          value ? "bg-primary border-primary" : "border-muted-foreground/30"
                        )}>
                          {value && <Check size={14} className="text-primary-foreground font-bold" />}
                        </View>
                        <Text className="text-sm text-foreground flex-1">
                          I agree to the <Text className="text-primary font-medium">Terms & Conditions</Text> and <Text className="text-primary font-medium">Privacy Policy</Text>
                        </Text>
                      </TouchableOpacity>
                      {errors.termsAccepted && (
                        <Text className="text-xs text-destructive ml-8">{errors.termsAccepted.message}</Text>
                      )}
                    </View>
                  )}
                />

                <View className="flex-row space-x-3 mt-6">
                  <Button
                    className="flex-1"
                    variant="outline"
                    label="Previous"
                    onPress={prevStep}
                    disabled={loading}
                  />
                  <Button
                    className="flex-1"
                    label={loading ? "Registering..." : "Create Account"}
                    onPress={handleSubmit(onRegister)}
                    loading={loading}
                    disabled={loading}
                  />
                </View>
              </View>
            </CardContent>
          </Card>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate("Login")}
            className="mt-6 py-2"
            disabled={loading}
          >
            <Text className="text-center text-sm text-muted-foreground">
              Already have an account? <Text className="text-primary font-bold">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
