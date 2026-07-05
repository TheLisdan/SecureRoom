import { describe, expect, it } from "vitest";

import {
  apiRoutes,
  createFolderRequestSchema,
  dataroomNameSchema,
  fileNameSchema,
  folderNameSchema,
  moveFileRequestSchema,
  passwordSchema,
  registerRequestSchema,
} from "./index.js";

describe("shared validation schemas", () => {
  it("normalizes emails and accepts strong enough registration payloads", () => {
    const parsed = registerRequestSchema.parse({
      email: "JANE@ACME.COM",
      name: "Jane Davis",
      password: "correct horse battery staple",
    });

    expect(parsed.email).toBe("jane@acme.com");
  });

  it("rejects unsafe folder names", () => {
    expect(() => folderNameSchema.parse("../legal")).toThrow();
    expect(() => folderNameSchema.parse("Legal")).not.toThrow();
  });

  it("accepts safe file names for different file types", () => {
    expect(() => fileNameSchema.parse("financials.pdf")).not.toThrow();
    expect(() => fileNameSchema.parse("financials.xlsx")).not.toThrow();
    expect(() => fileNameSchema.parse("notes.txt")).not.toThrow();
    expect(() => fileNameSchema.parse("bad/name.txt")).toThrow();
  });

  it("validates file move destinations", () => {
    expect(
      moveFileRequestSchema.parse({
        folderId: "00000000-0000-0000-0000-000000000001",
      }),
    ).toEqual({ folderId: "00000000-0000-0000-0000-000000000001" });
    expect(moveFileRequestSchema.parse({ folderId: null })).toEqual({
      folderId: null,
    });
    expect(() => moveFileRequestSchema.parse({ folderId: "../bad" })).toThrow();
  });

  it("trims dataroom and folder names while rejecting unsafe payloads", () => {
    expect(dataroomNameSchema.parse("  Acme Acquisition  ")).toBe(
      "Acme Acquisition",
    );
    expect(
      createFolderRequestSchema.parse({
        dataroomId: "00000000-0000-0000-0000-000000000001",
        parentFolderId: null,
        name: "  Legal  ",
      }),
    ).toMatchObject({ name: "Legal" });
    expect(() =>
      createFolderRequestSchema.parse({
        dataroomId: "00000000-0000-0000-0000-000000000001",
        parentFolderId: null,
        name: "bad/name",
      }),
    ).toThrow();
  });

  it("keeps password and route contracts strict", () => {
    expect(() => passwordSchema.parse("short")).toThrow();
    expect(passwordSchema.parse("correct horse battery staple")).toBe(
      "correct horse battery staple",
    );
    expect(apiRoutes.files.move("file-id")).toBe("/files/file-id/move");
    expect(apiRoutes.datarooms.tree("room-id")).toBe("/datarooms/room-id/tree");
  });
});
