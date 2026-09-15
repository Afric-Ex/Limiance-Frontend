import { convertFileToBase64 } from "./convert-file-to-base64";

describe("convertFileToBase64", () => {
  it("resolves a data URL for a text file", async () => {
    const file = new File(["hello world"], "hello.txt", { type: "text/plain" });
    await expect(convertFileToBase64(file)).resolves.toBe(
      "data:text/plain;base64,aGVsbG8gd29ybGQ="
    );
  });

  it("resolves a data URL for an empty file", async () => {
    const file = new File([], "empty.txt", { type: "application/octet-stream" });
    const result = await convertFileToBase64(file);
    expect(result).toMatch(/^data:application\/octet-stream;base64,/);
  });

  it("resolves with the correct mime type and base64 payload", async () => {
    const file = new File(["<html>hi</html>"], "page.html", { type: "text/html" });
    await expect(convertFileToBase64(file)).resolves.toBe(
      "data:text/html;base64,PGh0bWw+aGk8L2h0bWw+"
    );
  });

  it("rejects when the FileReader emits an error", async () => {
    const FailingReader = class {
      result: string | null = null;
      onloadend: (() => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      readAsDataURL(this: { onerror: ((event: unknown) => void) | null }) {
        setTimeout(() => {
          this.onerror?.(new Error("read failed"));
        }, 0);
      }
    };
    vi.stubGlobal("FileReader", FailingReader as unknown as typeof FileReader);
    const file = new File(["x"], "x.txt", { type: "text/plain" });
    await expect(convertFileToBase64(file)).rejects.toThrow("read failed");
    vi.unstubAllGlobals();
  });

  it("never resolves after an error on the same reader", async () => {
    const BothHandlersReader = class {
      result: string | null = null;
      onloadend: (() => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      readAsDataURL(this: {
        onerror: ((event: unknown) => void) | null;
        onloadend: (() => void) | null;
      }) {
        setTimeout(() => {
          this.onerror?.(new Error("boom"));
        }, 0);
      }
    };
    vi.stubGlobal("FileReader", BothHandlersReader as unknown as typeof FileReader);
    const file = new File(["x"], "x.txt", { type: "text/plain" });
    const promise = convertFileToBase64(file);
    await expect(promise).rejects.toThrow("boom");
    vi.unstubAllGlobals();
  });
});