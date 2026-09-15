import { DEFAULT_MODAL_SETTINGS } from "./constants";

describe("DEFAULT_MODAL_SETTINGS", () => {
  it("centers the modal without a close button and sizes it automatically", () => {
    expect(DEFAULT_MODAL_SETTINGS.centered).toBe(true);
    expect(DEFAULT_MODAL_SETTINGS.withCloseButton).toBe(false);
    expect(DEFAULT_MODAL_SETTINGS.size).toBe("auto");
  });

  it("styles the content as a transparent flex column", () => {
    expect(DEFAULT_MODAL_SETTINGS.styles.content).toEqual({
      display: "flex",
      flexDirection: "column",
      background: "none",
    });
  });

  it("removes header spacing", () => {
    expect(DEFAULT_MODAL_SETTINGS.styles.header).toEqual({
      margin: 0,
      padding: 0,
    });
  });

  it("styles the body as a scrollable flex column that fills available space", () => {
    expect(DEFAULT_MODAL_SETTINGS.styles.body).toEqual({
      margin: 0,
      padding: 0,
      overflow: "auto",
      flex: 1,
      display: "flex",
      flexDirection: "column",
    });
  });
});