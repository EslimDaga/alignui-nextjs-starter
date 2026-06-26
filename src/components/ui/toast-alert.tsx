import * as React from "react";
import {
  WarningIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  InfoIcon,
  MagicWandIcon,
} from "@phosphor-icons/react";

import * as Alert from "@/components/ui/alert";
import { toast } from "@/components/ui/toast";

type AlertToastProps = {
  t: string | number;
  status?: React.ComponentPropsWithoutRef<typeof Alert.Root>["status"];
  variant?: React.ComponentPropsWithoutRef<typeof Alert.Root>["variant"];
  message: string;
  dismissable?: boolean;
  icon?: React.ElementType;
};

const AlertToast = React.forwardRef<
  React.ComponentRef<typeof Alert.Root>,
  AlertToastProps
>(
  (
    {
      t,
      status = "feature",
      variant = "stroke",
      message,
      dismissable = true,
      icon,
    },
    forwardedRef,
  ) => {
    let Icon: React.ElementType;

    if (icon) {
      Icon = icon;
    } else {
      switch (status) {
        case "success":
          Icon = CheckCircleIcon;
          break;
        case "warning":
          Icon = WarningIcon;
          break;
        case "error":
          Icon = WarningCircleIcon;
          break;
        case "information":
          Icon = InfoIcon;
          break;
        case "feature":
          Icon = MagicWandIcon;
          break;
        default:
          Icon = WarningCircleIcon;
          break;
      }
    }

    return (
      <Alert.Root
        ref={forwardedRef}
        status={status}
        variant={variant}
        size="small"
        className="w-90"
      >
        <Alert.Icon as={Icon} />
        {message}
        {dismissable && (
          <button type="button" onClick={() => toast.dismiss(t)}>
            <Alert.CloseIcon />
          </button>
        )}
      </Alert.Root>
    );
  },
);
AlertToast.displayName = "AlertToast";

export { AlertToast as Root };
