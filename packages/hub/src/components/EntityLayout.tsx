import { FC, ReactNode } from "react";
import { EntityInfo } from "./EntityInfo";
import { clsx } from "clsx";

type Props = {
  slug: string;
  username: string;
  homepageUrl: string;
  headerChildren: ReactNode;
  children: ReactNode;
  isFluid?: boolean;
};

export const EntityLayout: FC<Props> = ({
  slug,
  username,
  homepageUrl,
  headerChildren,
  children,
  isFluid = false,
}) => {
  return (
    <div>
      <div
        className="border-gray-300 border-b"
        style={{ backgroundColor: "#eceef0" }}
      >
        <div
          className={clsx(
            "flex items-center gap-4 pt-2 pb-1",
            !isFluid ? "max-w-4xl mx-auto" : "px-8"
          )}
        >
          <EntityInfo slug={slug} username={username} href={homepageUrl} />
          {headerChildren}
        </div>
      </div>
      <div className={clsx(!isFluid && "max-w-4xl mx-auto my-4")}>
        {children}
      </div>
    </div>
  );
};