import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const PhoneInputField = ({ value, onChange, placeholder }: PhoneInputFieldProps) => (
  <PhoneInput
    country="in"
    value={value}
    onChange={(phone) => onChange("+" + phone)}
    placeholder={placeholder ?? "Enter phone number"}
    enableSearch
    containerClass="!w-full"
    inputClass="!w-full !h-9 !rounded-md !border-input !bg-background !text-foreground !text-sm !pl-12"
    buttonClass="!bg-background !border-input !rounded-l-md"
    dropdownClass="!bg-popover !text-popover-foreground !border-border"
    searchClass="!bg-background !text-foreground !border-input"
  />
);

export default PhoneInputField;
