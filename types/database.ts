export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          category_id: string;
          description: string;
          image_url: string | null;
          pack_size: string;
          unit_count: number;
          is_active: boolean;
        };
        Insert: Database["public"]["Tables"]["products"]["Row"];
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      categories: {
        Row: { id: string; name: string; slug: string; description: string };
        Insert: Database["public"]["Tables"]["categories"]["Row"];
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          business_account_id: string | null;
          status: "pending" | "paid" | "fulfilled" | "cancelled" | "payment_failed";
          subtotal_cents: number;
          shipping_cents: number;
          tax_cents: number;
          total_cents: number;
          stripe_payment_intent_id: string | null;
          delivery_method: string;
          shipping_address_id: string | null;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["orders"]["Row"];
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_tier: "business" | "individual";
      user_role: "admin" | "buyer" | "staff";
      order_status: "pending" | "paid" | "fulfilled" | "cancelled" | "payment_failed";
    };
  };
};
