import { FC } from "react";
import { Icon, IconProps } from "./Icon";

export const ScaleIcon: FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M3.75 3C3.33579 3 3 3.33579 3 3.75C3 4.16421 3.33579 4.5 3.75 4.5H4.792L2.05543 11.217C2.01882 11.3069 2 11.403 2 11.5C2 13.433 3.567 15 5.5 15C7.433 15 9 13.433 9 11.5C9 11.403 8.98118 11.3069 8.94457 11.217L6.208 4.5H11.25L11.25 16.5H7.25293C6.01029 16.5 5.00293 17.5074 5.00293 18.75C5.00293 19.9926 6.01029 21 7.25293 21H16.75C17.9926 21 19 19.9926 19 18.75C19 17.5074 17.9926 16.5 16.75 16.5H12.75L12.75 4.5H17.792L15.0554 11.217C15.0188 11.3069 15 11.403 15 11.5C15 13.433 16.567 15 18.5 15C20.433 15 22 13.433 22 11.5C22 11.403 21.9812 11.3069 21.9446 11.217L19.208 4.5H20.25C20.6642 4.5 21 4.16421 21 3.75C21 3.33579 20.6642 3 20.25 3H3.75ZM5.5 6.73782L7.13459 10.75H3.86541L5.5 6.73782ZM16.8654 10.75L18.5 6.73782L20.1346 10.75H16.8654Z" />
  </Icon>
);