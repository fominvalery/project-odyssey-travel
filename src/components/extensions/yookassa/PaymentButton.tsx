/**
 * YooKassa Extension - Payment Button
 *
 * Ready-to-use payment button component.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { useYookassa, openPaymentPage, CartItem } from "./useYookassa";

// =============================================================================
// TYPES
// =============================================================================

interface PaymentButtonProps {
  /** API URL for payment creation */
  apiUrl: string;
  /** Payment amount */
  amount: number;
  /** Customer email (required) */
  userEmail: string;
  /** Customer name */
  userName?: string;
  /** Customer phone */
  userPhone?: string;
  /** Payment description */
  description?: string;
  /** Return URL after payment */
  returnUrl: string;
  /** Cart items */
  cartItems?: CartItem[];
  /** User ID for listings credit */
  userId?: string;
  /** Order type */
  orderType?: string;
  /** Success callback */
  onSuccess?: (orderNumber: string) => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Button text */
  buttonText?: string;
  /** CSS class */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PaymentButton({
  apiUrl,
  amount,
  userEmail,
  userName,
  userPhone,
  description,
  returnUrl,
  cartItems = [],
  userId,
  orderType = "listings",
  onSuccess,
  onError,
  buttonText = "Оплатить",
  className = "",
  disabled = false,
}: PaymentButtonProps): React.ReactElement {
  const { createPayment, isLoading } = useYookassa({
    apiUrl,
    onSuccess: (response) => {
      onSuccess?.(response.order_number);
    },
    onError,
  });

  const handleClick = async () => {
    // Open tab immediately (before async) to avoid popup blocking
    // NOTE: без noopener чтобы можно было менять location после получения URL
    const tab = window.open("about:blank", "_blank");

    const response = await createPayment({
      amount,
      userEmail,
      userName,
      userPhone,
      description,
      returnUrl,
      cartItems,
      userId,
      orderType,
    });

    if (response?.payment_url) {
      if (tab && !tab.closed) {
        tab.location.href = response.payment_url;
      } else {
        window.location.href = response.payment_url;
      }
    } else {
      tab?.close();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? "Загрузка..." : buttonText}
    </Button>
  );
}

export default PaymentButton;