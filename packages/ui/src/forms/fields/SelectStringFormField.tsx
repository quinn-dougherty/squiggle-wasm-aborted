import { FieldPathByValue, FieldValues } from "react-hook-form";
import { FormFieldLayoutProps } from "../common/FormFieldLayout.js";
import { SelectFormField } from "./SelectFormField.js";

export function SelectStringFormField<
  TValues extends FieldValues,
  TValueType extends string | null = string | null, // can be configured with const string union for stricter types
  TName extends FieldPathByValue<TValues, TValueType> = FieldPathByValue<
    TValues,
    TValueType
  >,
>({
  options,
  ...props
}: Pick<FormFieldLayoutProps, "label" | "description"> & {
  name: TName;
  options: NonNullable<TValueType>[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <SelectFormField<
      TValues,
      TValueType,
      { value: NonNullable<TValueType>; label: string }
    >
      {...props}
      options={options.map((value) => ({ value, label: value }))}
      optionToFieldValue={(option) => option.value}
      fieldValueToOption={(value) => ({ value, label: value })}
    />
  );
}