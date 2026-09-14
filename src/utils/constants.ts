export const DEFAULT_MODAL_SETTINGS = {
  centered: true,
  withCloseButton: false,
  size: "auto",
  styles: {
    content: {
      display: "flex",
      flexDirection: "column" as const,
      background: "none",
    },
    header: {
      margin: 0,
      padding: 0,
    },
    body: {
      margin: 0,
      padding: 0,
      overflow: "auto",
      flex: 1,
      display: "flex",
      flexDirection: "column" as const,
    },
  },
};
