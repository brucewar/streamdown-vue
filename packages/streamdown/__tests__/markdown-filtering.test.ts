import { describe, expect, it, vi } from "vitest";
import { defaultUrlTransform, Markdown } from "../lib/markdown";
import { mountVNode } from "./helpers/vue";

describe("Markdown post-processing", () => {
  describe("defaultUrlTransform", () => {
    it("should pass through URLs unchanged", () => {
      expect(
        defaultUrlTransform("https://example.com", "href", {} as any)
      ).toBe("https://example.com");
    });
  });

  describe("urlTransform", () => {
    it("should transform URLs when urlTransform is provided", () => {
      const transform = vi
        .fn()
        .mockReturnValue("https://proxied.com/image.png");
      const wrapper = mountVNode(
        Markdown({
          children: "![alt](https://example.com/image.png)",
          urlTransform: transform,
        })
      );

      expect(transform).toHaveBeenCalled();
      expect(wrapper.element.querySelector("img")?.getAttribute("src")).toBe(
        "https://proxied.com/image.png"
      );
    });

    it("should remove URL when transform returns null", () => {
      const transform = vi.fn().mockReturnValue(null);
      const wrapper = mountVNode(
        Markdown({
          children: "[link](https://evil.com)",
          urlTransform: transform,
        })
      );

      expect(transform).toHaveBeenCalled();
      expect(wrapper.element.querySelector("a")?.getAttribute("href")).toBeNull();
    });
  });

  describe("allowedElements", () => {
    it("should only render allowed elements", () => {
      const wrapper = mountVNode(
        Markdown({
          children: "**bold** and *italic*",
          allowedElements: ["p", "strong"],
        })
      );

      expect(wrapper.element.querySelector("strong")).toBeTruthy();
      expect(wrapper.element.querySelector("em")).toBeFalsy();
    });
  });

  describe("disallowedElements", () => {
    it("should remove disallowed elements", () => {
      const wrapper = mountVNode(
        Markdown({
          children: "**bold** and *italic*",
          disallowedElements: ["em"],
        })
      );

      expect(wrapper.element.querySelector("strong")).toBeTruthy();
      expect(wrapper.element.querySelector("em")).toBeFalsy();
    });
  });

  describe("allowElement", () => {
    it("should filter elements with custom function", () => {
      const allowElement = vi.fn().mockImplementation((element) => {
        return element.tagName !== "strong";
      });
      const wrapper = mountVNode(
        Markdown({
          children: "**bold** and *italic*",
          allowElement,
        })
      );

      expect(wrapper.element.querySelector("strong")).toBeFalsy();
      expect(wrapper.element.querySelector("em")).toBeTruthy();
    });
  });

  describe("unwrapDisallowed", () => {
    it("should unwrap disallowed elements, keeping children", () => {
      const wrapper = mountVNode(
        Markdown({
          children: "**bold text**",
          disallowedElements: ["strong"],
          unwrapDisallowed: true,
        })
      );

      expect(wrapper.element.querySelector("strong")).toBeFalsy();
      expect(wrapper.text()).toContain("bold text");
    });
  });

  describe("skipHtml", () => {
    it("should skip raw HTML nodes when skipHtml is true", () => {
      const wrapper = mountVNode(
        Markdown({
          children: "Text <b>bold</b> more",
          skipHtml: true,
        })
      );

      expect(wrapper.html()).not.toContain("<b>");
    });
  });
});
