"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@mantine/core";
import classes from "@/src/styles/table-pagination.module.css";

interface PaginationProps {
  totalCount: number;
  page: any;
  setPage: any;
  limit?: number;
}

export const TablePagination = (props: PaginationProps) => {
  return (
    <Suspense>
      <SuspensedPagination {...props} />
    </Suspense>
  );
};

const SuspensedPagination = ({
  totalCount,
  page,
  setPage,
  limit = 10,
}: PaginationProps) => {
  const totalPage = Math.ceil(totalCount / limit);

  // const currentTotalCountBasedOnPage = limit * page;
  const searchParams = useSearchParams();
  const urlPage = searchParams.get("page");

  useEffect(() => {
    if (urlPage) {
      setPage(+urlPage);
    }
  }, []);

  function pushParam(param: { key: string; value: string | number }) {
    const params = new URLSearchParams(searchParams.toString());
    param.value = String(param.value);
    params.set(param.key, param.value);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }

  return totalCount ? (
    <div className="w-full py-[14px] flex px-1 bg-gray-22 justify-center">
      <Pagination
        className="pagination"
        styles={{
          control: {
            height: "32px",
            width: "32px",
            borderRadius: "8px",
            fontSize: "12px",
            lineHeight: "19.2px",
            color: "#4D77F0",
            border: 0,
            background: "#343434",
          },
        }}
        classNames={classes}
        value={page}
        onChange={(val) => {
          setPage(+val);
          pushParam({ key: "page", value: val });
        }}
        total={totalPage}
      />
    </div>
  ) : null;
};
