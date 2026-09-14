import { Popover, PopoverDropdown, PopoverTarget } from "@mantine/core";
import React, { ReactNode } from "react";
import classes from "@/src/styles/header-popover.module.css";
import { useDisclosure } from "@mantine/hooks";

export const PopoverWrapper = ({
  children,
  target,
}: {
  children: ReactNode;
  target: ({ toggle }: { toggle: () => void }) => ReactNode;
}) => {
  const [opened, { close, toggle }] = useDisclosure(false);
  const Target = target;

  return (
    <Popover onChange={close} opened={opened} classNames={classes}>
      <PopoverTarget>
        <div>
          <Target toggle={toggle} />
        </div>
      </PopoverTarget>
      <PopoverDropdown onClick={close}>{children}</PopoverDropdown>
    </Popover>
  );
};
