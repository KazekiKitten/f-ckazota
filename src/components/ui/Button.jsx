const SIZES = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  dangerOutline: "btn-danger-outline",
};

const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  icon = null,
  title,
  type = "button",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
  >
    {icon}
    {children}
  </button>
);

export default Button;
