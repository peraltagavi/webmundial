import type { HTMLAttributes } from "react";
import styles from "./Badge.module.css";

type Variant = "default" | "primary" | "accent" | "outline" | "outlineLight" | "live";
type Size = "sm" | "md" | "lg";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
}

export default function Badge({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...rest
}: BadgeProps) {
  const cls = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
