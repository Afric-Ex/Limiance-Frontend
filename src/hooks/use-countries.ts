"use client";

import { useQuery } from "@tanstack/react-query";
import { referenceKeys, referenceService, type Country } from "@/src/services/reference";

export function useCountries() {
  return useQuery({
    queryKey: referenceKeys.countries,
    queryFn: () => referenceService.getCountries(),
    select: (res: any) => (Array.isArray(res?.data) ? res.data : []),
    staleTime: Infinity,
    retry: false,
  });
}

export function useCountryOptions() {
  const { data: countries = [], isLoading, isError } = useCountries();

  const options = countries.map((c: Country) => ({
    value: c.code,
    label: c.name,
    flagUrl: c.flagUrl,
  }));

  return { options, isLoading, isError };
}