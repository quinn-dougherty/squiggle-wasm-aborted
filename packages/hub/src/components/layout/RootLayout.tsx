import { FC, PropsWithChildren } from "react";

import { useSession } from "next-auth/react";
import Link from "next/link";

import { newModelRoute } from "@/routes";
import { UserControls } from "./UserControls";

const TopMenu: FC = () => {
  const { data: session } = useSession();

  return (
    <div className="border-slate-200 border-b h-16 flex items-center justify-between px-4">
      <div className="flex gap-6 items-baseline">
        <Link className="text-lg font-bold py-2 text-slate-500" href="/">
          Squiggle Hub
        </Link>
        <Link className="font-medium text-slate-500" href={newModelRoute()}>
          New model
        </Link>
      </div>
      <UserControls session={session} />
    </div>
  );
};

export const RootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div>
      <TopMenu />
      <div>{children}</div>
    </div>
  );
};