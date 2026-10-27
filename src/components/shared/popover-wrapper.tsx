import { Popover, PopoverDropdown, PopoverTarget } from "@mantine/core";
import React, { ReactNode } from "react";
import classes from "@/src/styles/header-popover.module.css";
import { useDisclosure } from "@mantine/hooks";

export const PopoverWrapper = ({
  children,
  target,
  openOnHover = false,
}: {
  children: ReactNode;
  target: ({ toggle, open }: { toggle: () => void; open: () => void }) => ReactNode;
  openOnHover?: boolean;
}) => {
  const [opened, { close, toggle, open }] = useDisclosure(false);
  const Target = target;

  return (
    <Popover
      onChange={close}
      opened={opened}
      classNames={classes}
      withArrow={false}
      shadow="md"
      position="bottom-start"
      middlewares={{ flip: true, shift: true }}
    >
      <PopoverTarget>
        <div
          onMouseEnter={openOnHover ? open : undefined}
          onMouseLeave={openOnHover ? close : undefined}
        >
          <Target toggle={toggle} open={open} />
        </div>
      </PopoverTarget>
      <PopoverDropdown onClick={close} onMouseEnter={openOnHover ? open : undefined} onMouseLeave={openOnHover ? close : undefined}>
        {children}
      </PopoverDropdown>
    </Popover>
  );
};
