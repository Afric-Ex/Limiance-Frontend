import { Loader } from "@mantine/core";
import React from "react";

export const InlineLoading = () => {
  return (
    <span className="flex items-center gap-2">
      <Loader size="xs" color="white" />
      <span className="text-sm text-white">Loading...</span>
    </span>
  );
};
