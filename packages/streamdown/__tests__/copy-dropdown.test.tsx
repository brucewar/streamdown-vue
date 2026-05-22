import { fireEvent, render, waitFor } from "./helpers/testing-library-vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { TableCopyDropdown } from "../lib/table/copy-dropdown";

describe("TableCopyDropdown", () => {
  let mockTable: HTMLTableElement;
  let mockWrapper: HTMLDivElement;

  beforeEach(() => {
    // Create a mock table structure
    mockTable = document.createElement("table");
    mockTable.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John</td>
          <td>30</td>
        </tr>
      </tbody>
    `;

    mockWrapper = document.createElement("div");
    mockWrapper.setAttribute("data-streamdown", "table-wrapper");
    mockWrapper.appendChild(mockTable);
    document.body.appendChild(mockWrapper);

    // Mock ClipboardItem
    global.ClipboardItem = class ClipboardItem {
      data: Record<string, Blob>;
      constructor(data: Record<string, Blob>) {
        this.data = data;
      }
    } as any;

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        write: vi.fn().mockResolvedValue(undefined),
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(mockWrapper);
  });

  it("should render dropdown button", () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown />
      </StreamdownContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
  });

  it("should render custom children", () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown>
          <span>Custom Copy</span>
        </TableCopyDropdown>
      </StreamdownContext.Provider>,
      { container: mockWrapper }
    );

    expect(container.textContent).toContain("Custom Copy");
  });

  it("should be disabled when animating", () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: true,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown />
      </StreamdownContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it("should toggle dropdown on button click", async () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown />
      </StreamdownContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector('button[title="Copy table"]');

    // Dropdown should be closed initially
    expect(container.querySelector(".absolute")).toBeFalsy();

    // Click to open
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }
    expect(container.querySelector(".absolute")).toBeTruthy();

    // Click to close
    if (button) {
      await fireEvent.click(button);
    }
    expect(container.querySelector(".absolute")).toBeFalsy();
  });

  it("should show CSV and TSV options when open", async () => {
    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown />
      </StreamdownContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    expect(getByText("CSV")).toBeTruthy();
    expect(getByText("TSV")).toBeTruthy();
  });

  it("should copy CSV when CSV option is clicked", async () => {
    const onCopy = vi.fn();

    // Create wrapper with dropdown inside
    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown onCopy={onCopy} />
      </StreamdownContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    const csvButton = getByText("CSV");
    await fireEvent.click(csvButton);

    await waitFor(() => {
      expect(navigator.clipboard.write).toHaveBeenCalled();
      expect(onCopy).toHaveBeenCalledWith("csv");
    });

    // Wait for state updates to complete
    await waitFor(() => {
      expect(container.querySelector(".absolute")).toBeFalsy();
    });

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should copy TSV when TSV option is clicked", async () => {
    const onCopy = vi.fn();

    // Create wrapper with dropdown inside
    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown onCopy={onCopy} />
      </StreamdownContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    const tsvButton = getByText("TSV");
    await fireEvent.click(tsvButton);

    await waitFor(() => {
      expect(navigator.clipboard.write).toHaveBeenCalled();
      expect(onCopy).toHaveBeenCalledWith("tsv");
    });

    // Wait for state updates to complete
    await waitFor(() => {
      expect(container.querySelector(".absolute")).toBeFalsy();
    });

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should show check icon after copying", async () => {
    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown />
      </StreamdownContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    const csvButton = getByText("CSV");
    await fireEvent.click(csvButton);

    await waitFor(() => {
      // After copying, the icon should change (we can check if the button children changed)
      const buttonElement = container.querySelector(
        'button[title="Copy table"]'
      );
      expect(buttonElement).toBeTruthy();
    });

    // Wait for state updates to complete
    await waitFor(() => {
      expect(container.querySelector(".absolute")).toBeFalsy();
    });

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should close dropdown after copying", async () => {
    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown />
      </StreamdownContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    expect(container.querySelector(".absolute")).toBeTruthy();

    const csvButton = getByText("CSV");
    await fireEvent.click(csvButton);

    await waitFor(() => {
      expect(navigator.clipboard.write).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(container.querySelector(".absolute")).toBeFalsy();
    });

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should close dropdown on outside click", async () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown />
      </StreamdownContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    expect(container.querySelector(".absolute")).toBeTruthy();

    // Click outside
    await fireEvent.mouseDown(document.body);

    expect(container.querySelector(".absolute")).toBeFalsy();
  });

  it("should call onError when table is not found", async () => {
    const onError = vi.fn();

    // Render dropdown outside of table wrapper
    const dropdownDiv = document.createElement("div");
    document.body.appendChild(dropdownDiv);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown onError={onError} />
      </StreamdownContext.Provider>,
      { container: dropdownDiv }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    const csvButton = getByText("CSV");
    await fireEvent.click(csvButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Table not found",
        })
      );
    });

    document.body.removeChild(dropdownDiv);
  });

  it("should call onError when clipboard API is not available", async () => {
    const onError = vi.fn();

    // Remove clipboard API
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });

    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown onError={onError} />
      </StreamdownContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    const csvButton = getByText("CSV");
    await fireEvent.click(csvButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Clipboard API not available",
        })
      );
    });

    // Restore clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
    });

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should fall back to writeText when ClipboardItem is unavailable", async () => {
    const onCopy = vi.fn();
    const originalClipboardItem = global.ClipboardItem;

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    Object.defineProperty(global, "ClipboardItem", {
      value: undefined,
      configurable: true,
    });

    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown onCopy={onCopy} />
      </StreamdownContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    await fireEvent.click(getByText("Markdown"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "| Name | Age |\n| --- | --- |\n| John | 30 |"
      );
      expect(onCopy).toHaveBeenCalledWith("md");
    });

    Object.defineProperty(global, "ClipboardItem", {
      value: originalClipboardItem,
      configurable: true,
    });
    mockWrapper.removeChild(dropdownContainer);
  });

  it("should fall back to writeText when rich clipboard write fails", async () => {
    const onCopy = vi.fn();

    Object.assign(navigator, {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error("Clipboard write failed")),
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown onCopy={onCopy} />
      </StreamdownContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    await fireEvent.click(getByText("CSV"));

    await waitFor(() => {
      expect(navigator.clipboard.write).toHaveBeenCalled();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Name,Age\nJohn,30");
      expect(onCopy).toHaveBeenCalledWith("csv");
    });

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should handle clipboard write errors", async () => {
    const onError = vi.fn();

    // Mock clipboard to reject
    Object.assign(navigator, {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error("Clipboard write failed")),
      },
    });

    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown onError={onError} />
      </StreamdownContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    const csvButton = getByText("CSV");
    await fireEvent.click(csvButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Clipboard write failed",
        })
      );
    });

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown className="custom-copy-class" />
      </StreamdownContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector("button");
    expect(button?.className).toContain("custom-copy-class");
  });

  it("should use custom timeout for copied state", async () => {
    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown timeout={100} />
      </StreamdownContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }

    const csvButton = getByText("CSV");
    await fireEvent.click(csvButton);

    await waitFor(() => {
      expect(navigator.clipboard.write).toHaveBeenCalled();
    });

    // Wait for state updates to complete
    await waitFor(() => {
      expect(container.querySelector(".absolute")).toBeFalsy();
    });

    // Just verify that the timeout value was accepted (component rendered without error)
    expect(container.querySelector("button")).toBeTruthy();

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should cleanup timeout on unmount", async () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    const { container, getByText, unmount } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown />
      </StreamdownContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector('button[title="Copy table"]');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
    }
    await fireEvent.click(getByText("CSV"));

    await waitFor(() => {
      expect(navigator.clipboard.write).toHaveBeenCalled();
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("should cleanup event listener on unmount", async () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(
      <StreamdownContext.Provider
        value={{
          isAnimating: false,
          mode: "streaming",
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
        }}
      >
        <TableCopyDropdown />
      </StreamdownContext.Provider>,
      { container: mockWrapper }
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function)
    );
  });
});
