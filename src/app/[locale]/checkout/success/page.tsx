import { Suspense } from "react";
import { getCurrentUser } from "@/lib/user-auth";
import { SuccessContent } from "@/components/checkout/SuccessContent";

export default async function CheckoutSuccessPage() {
  const user = await getCurrentUser();

  return (
    <Suspense>
      <SuccessContent isLoggedIn={Boolean(user)} />
    </Suspense>
  );
}
