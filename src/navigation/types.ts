export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Orders: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
    Dashboard: undefined;
    InputCapacity: undefined;
    ManageServiceList: undefined;
    AddService: undefined;
    EditService: { serviceId: string };
    ServiceDetail: { serviceId: string };
    ManageBookingList: undefined;
    BookingDetail: { bookingId: string };
    ManageOperatingHours: undefined;
    // Feature Stacks
    ManageWorkshopServices: undefined;
    EditWorkshopService: { serviceId?: string; masterServiceId?: string; masterService?: any };
    ChatList: undefined;
    ChatDetail: { chatId: string; customerName: string; avatarUrl?: string | null };
    ManageMechanicsList: undefined;
    AddMechanic: undefined;
    InvoiceList: undefined;
    // Remove EditProfile from HomeStack if moving to ProfileStack
};

export type OrdersStackParamList = {
    OrdersList: undefined;
    BookingDetail: { bookingId: string };
    ServiceDetail: { serviceId: string };
};

export type ProfileStackParamList = {
    ProfileDashboard: undefined;
    EditProfile: { workshop: any };
    ManageOperatingHours: undefined;
    ManageWorkshopServices: undefined;
    EditWorkshopService: { serviceId?: string; masterServiceId?: string; masterService?: any };
    InputCapacity: undefined;
};
