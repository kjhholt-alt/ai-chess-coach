import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      expect(cn("base", false && "hidden", "visible")).toBe("base visible");
    });

    it("resolves Tailwind conflicts (last wins)", () => {
      const result = cn("px-2", "px-4");
      expect(result).toBe("px-4");
    });

    it("handles undefined and null values", () => {
      expect(cn("base", undefined, null, "end")).toBe("base end");
    });

    it("handles empty inputs", () => {
      expect(cn()).toBe("");
    });

    it("merges responsive Tailwind classes", () => {
      const result = cn("text-sm", "md:text-lg", "text-base");
      expect(result).toBe("md:text-lg text-base");
    });

    it("handles array inputs via clsx", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });
  });
});
