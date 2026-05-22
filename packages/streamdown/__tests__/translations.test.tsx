import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "./helpers/testing-library-vue";
import { defaultTranslations, Streamdown } from "../index";
import { ImageComponent } from "../lib/image";
import { LinkSafetyModal } from "../lib/link-modal";
import {
  TranslationsKey,
  useTranslations,
} from "../lib/translations-context";

const markdownWithCode = `
\`\`\`javascript
console.log("hello");
\`\`\`
`;

const markdownWithTable = `
| Name | Value |
|------|-------|
| Foo  | Bar   |
`;

const customTranslations = {
  ...defaultTranslations,
  openExternalLink: "Externen Link öffnen?",
  externalLinkWarning: "Sie besuchen eine externe Website.",
  copyLink: "Link kopieren",
  openLink: "Link öffnen",
  close: "Schließen",
};

describe("defaultTranslations", () => {
  it("should export defaultTranslations with all required keys", () => {
    expect(defaultTranslations.copyCode).toBe("Copy Code");
    expect(defaultTranslations.downloadFile).toBe("Download file");
    expect(defaultTranslations.downloadDiagram).toBe("Download diagram");
    expect(defaultTranslations.downloadDiagramAsSvg).toBe(
      "Download diagram as SVG"
    );
    expect(defaultTranslations.downloadDiagramAsPng).toBe(
      "Download diagram as PNG"
    );
    expect(defaultTranslations.downloadDiagramAsMmd).toBe(
      "Download diagram as MMD"
    );
    expect(defaultTranslations.viewFullscreen).toBe("View fullscreen");
    expect(defaultTranslations.exitFullscreen).toBe("Exit fullscreen");
    expect(defaultTranslations.mermaidFormatSvg).toBe("SVG");
    expect(defaultTranslations.mermaidFormatPng).toBe("PNG");
    expect(defaultTranslations.mermaidFormatMmd).toBe("MMD");
    expect(defaultTranslations.copyTable).toBe("Copy table");
    expect(defaultTranslations.copyTableAsMarkdown).toBe(
      "Copy table as Markdown"
    );
    expect(defaultTranslations.copyTableAsCsv).toBe("Copy table as CSV");
    expect(defaultTranslations.copyTableAsTsv).toBe("Copy table as TSV");
    expect(defaultTranslations.downloadTable).toBe("Download table");
    expect(defaultTranslations.downloadTableAsCsv).toBe(
      "Download table as CSV"
    );
    expect(defaultTranslations.downloadTableAsMarkdown).toBe(
      "Download table as Markdown"
    );
    expect(defaultTranslations.tableFormatMarkdown).toBe("Markdown");
    expect(defaultTranslations.tableFormatCsv).toBe("CSV");
    expect(defaultTranslations.tableFormatTsv).toBe("TSV");
    expect(defaultTranslations.imageNotAvailable).toBe("Image not available");
    expect(defaultTranslations.downloadImage).toBe("Download image");
    expect(defaultTranslations.openExternalLink).toBe("Open external link?");
    expect(defaultTranslations.externalLinkWarning).toBe(
      "You're about to visit an external website."
    );
    expect(defaultTranslations.close).toBe("Close");
    expect(defaultTranslations.copyLink).toBe("Copy link");
    expect(defaultTranslations.copied).toBe("Copied");
    expect(defaultTranslations.openLink).toBe("Open link");
  });
});

describe("Streamdown translations prop", () => {
  it("should use default translations when no translations prop is provided", async () => {
    const { container } = render(<Streamdown>{markdownWithCode}</Streamdown>);

    await waitFor(() => {
      const copyButton = container.querySelector(
        '[data-streamdown="code-block-copy-button"]'
      );
      expect(copyButton).toBeTruthy();
      expect(copyButton?.getAttribute("title")).toBe("Copy Code");
    });
  });

  it("should use custom translations for code block copy button", async () => {
    const { container } = render(
      <Streamdown translations={{ copyCode: "Kopieren" }}>
        {markdownWithCode}
      </Streamdown>
    );

    await waitFor(() => {
      const copyButton = container.querySelector(
        '[data-streamdown="code-block-copy-button"]'
      );
      expect(copyButton).toBeTruthy();
      expect(copyButton?.getAttribute("title")).toBe("Kopieren");
    });
  });

  it("should use custom translations for code block download button", async () => {
    const { container } = render(
      <Streamdown translations={{ downloadFile: "Datei herunterladen" }}>
        {markdownWithCode}
      </Streamdown>
    );

    await waitFor(() => {
      const downloadButton = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(downloadButton).toBeTruthy();
      expect(downloadButton?.getAttribute("title")).toBe("Datei herunterladen");
    });
  });

  it("should use custom translations for table copy button", () => {
    const { container } = render(
      <Streamdown translations={{ copyTable: "Tabelle kopieren" }}>
        {markdownWithTable}
      </Streamdown>
    );

    const tableWrapper = container.querySelector(
      '[data-streamdown="table-wrapper"]'
    );
    expect(tableWrapper).toBeTruthy();

    const buttons = tableWrapper?.querySelectorAll("button");
    const copyButton = Array.from(buttons ?? []).find(
      (btn) => btn.getAttribute("title") === "Tabelle kopieren"
    );
    expect(copyButton).toBeTruthy();
  });

  it("should support partial translations", async () => {
    const { container } = render(
      <Streamdown translations={{ copyCode: "コピー" }}>
        {markdownWithCode}
      </Streamdown>
    );

    await waitFor(() => {
      const copyButton = container.querySelector(
        '[data-streamdown="code-block-copy-button"]'
      );
      expect(copyButton?.getAttribute("title")).toBe("コピー");

      const downloadButton = container.querySelector(
        '[data-streamdown="code-block-download-button"]'
      );
      expect(downloadButton?.getAttribute("title")).toBe("Download file");
    });
  });
});

describe("ImageComponent translations", () => {
  it("should show default 'Image not available' text when image fails to load", async () => {
    const { container } = render(
      <ImageComponent alt="test" src="https://example.invalid/image.png" />
    );

    const img = container.querySelector("img");
    expect(img).toBeTruthy();

    if (img) {
      await fireEvent.error(img);
    }

    await waitFor(() => {
      const fallback = container.querySelector(
        '[data-streamdown="image-fallback"]'
      );
      expect(fallback).toBeTruthy();
      expect(fallback?.textContent).toBe("Image not available");
    });
  });

  it("should use custom translation for image not available text", async () => {
    const wrapper = mount(ImageComponent, {
      props: { alt: "test", src: "https://example.invalid/image.png" },
      global: {
        provide: {
          [TranslationsKey as symbol]: {
            ...defaultTranslations,
            imageNotAvailable: "Bild nicht verfügbar",
          },
        },
      },
    });

    const img = wrapper.element.querySelector("img");
    expect(img).toBeTruthy();
    if (img) {
      await fireEvent.error(img);
    }

    await waitFor(() => {
      const fallback = wrapper.element.querySelector(
        '[data-streamdown="image-fallback"]'
      );
      expect(fallback?.textContent).toBe("Bild nicht verfügbar");
    });
  });
});

describe("LinkSafetyModal translations", () => {
  it("should show default translations in link safety modal", () => {
    const { container } = render(
      <LinkSafetyModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        url="https://example.com"
      />
    );

    expect(container.textContent).toContain("Open external link?");
    expect(container.textContent).toContain(
      "You're about to visit an external website."
    );
    expect(container.textContent).toContain("Copy link");
    expect(container.textContent).toContain("Open link");
  });

  it("should use custom translations in link safety modal", () => {
    const wrapper = mount(LinkSafetyModal, {
      props: {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        url: "https://example.com",
      },
      global: {
        provide: {
          [TranslationsKey as symbol]: customTranslations,
        },
      },
    });

    expect(wrapper.text()).toContain("Externen Link öffnen?");
    expect(wrapper.text()).toContain("Sie besuchen eine externe Website.");
    expect(wrapper.text()).toContain("Link kopieren");
    expect(wrapper.text()).toContain("Link öffnen");
  });
});

describe("useTranslations", () => {
  it("returns default translations without a provider", () => {
    let capturedTranslations: string | undefined;

    const TestConsumer = defineComponent({
      setup() {
        const value = useTranslations();
        capturedTranslations = value.copyCode;
        return () => null;
      },
    });

    mount(TestConsumer);
    expect(capturedTranslations).toBe("Copy Code");
  });

  it("uses custom values from TranslationsKey", () => {
    let capturedValue: string | undefined;

    const TestConsumer = defineComponent({
      setup() {
        const value = useTranslations();
        capturedValue = value.copyCode;
        return () => h("span", value.copyCode);
      },
    });

    mount(TestConsumer, {
      global: {
        provide: {
          [TranslationsKey as symbol]: {
            ...defaultTranslations,
            copyCode: "Custom Copy",
          },
        },
      },
    });

    expect(capturedValue).toBe("Custom Copy");
  });
});
