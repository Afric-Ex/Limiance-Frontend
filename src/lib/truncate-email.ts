export const truncateEmail = (email: string | null | undefined) => {
  if (!email) return "";
  const domainSplittedEmail = email.split("@");
  return (
    domainSplittedEmail[0]?.slice(
      0,
      domainSplittedEmail[0].length <= 4 ? 2 : 4
    ) +
    "***@" +
    domainSplittedEmail[1]
  );
};
