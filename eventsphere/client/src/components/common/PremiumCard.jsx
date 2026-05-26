import React from 'react';

export function PremiumCard({
  glow = "default",
  type,
  as: Tag = "div",
  className = "",
  onClick,
  tabIndex = 0,
  children,
  ...rest
}) {
  const glowMap = {
    organizer: "glow-organizer",
    participant: "glow-participant",
    volunteer: "glow-volunteer",
    sponsor: "glow-sponsor",
    ai: "glow-ai",
    danger: "glow-danger",
    default: "",
  };

  const classes = [
    "premium-focus",
    glowMap[glow] ?? "",
    type ? `${type}-card` : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <Tag className={classes} onClick={onClick} tabIndex={tabIndex} {...rest}>
      {children}
    </Tag>
  );
}
